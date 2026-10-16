"""Class Tutor's Student Emails panel: connecting the Gmail sender with Google sign-in, delivery
status of each student's welcome email, sending queued email, and retrying after a student
fixes their address."""
import datetime
import re
from email.message import EmailMessage
from typing import Optional
from urllib.parse import quote

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from jose import JWTError, jwt
from pydantic import BaseModel
from sqlalchemy import func, or_, and_
from sqlalchemy.orm import Session, joinedload

from app.auth.jwt import get_current_user
from app.config import ALGORITHM, APP_NAME, GOOGLE_OAUTH_REDIRECT_URI, SECRET_KEY, STUDENT_DEFAULT_PASSWORD
from app.database import get_db
from app.models.models import AuditLog, EmailDelivery, EmailSender, StudentProfile, User
from app.routers.users import _tutor_assigned_classes
from app.services import student_email as mail
from app.services.audit import record_audit

router = APIRouter(prefix="/api/v1/student-emails", tags=["Student Emails"])

ORIGIN_PATTERN = re.compile(r"^https?://[^\s/?#]+$")
CALLBACK_PATH = "/api/v1/student-emails/google/callback"
STATE_PURPOSE = "gmail-connect"


def _require_tutor(user: User) -> None:
    if "Class Tutor" not in {r.name for r in user.roles}:
        raise HTTPException(status_code=403, detail="Only Class Tutors manage student emails.")


def _my_students(db: Session, tutor: User) -> list:
    """Students in the tutor's assigned classes, plus any whose welcome email this tutor sent."""
    classes = _tutor_assigned_classes(db, tutor)
    conds = [and_(StudentProfile.programme_id == c["programme_id"], StudentProfile.batch_name == c["batch_name"],
                  StudentProfile.section_name == c["section_name"]) for c in classes]
    sent_by_me = db.query(EmailDelivery.recipient_user_id).filter(
        EmailDelivery.sender_user_id == tutor.id, EmailDelivery.kind == "CREDENTIALS")
    conds.append(StudentProfile.user_id.in_(sent_by_me))
    return db.query(StudentProfile).options(joinedload(StudentProfile.user)).filter(
        or_(*conds), StudentProfile.user_id.isnot(None)).order_by(StudentProfile.register_number).all()


def _sender_info(sender: Optional[EmailSender]) -> Optional[dict]:
    if not sender:
        return None
    return {
        "gmail_address": sender.gmail_address,
        "verified_at": sender.verified_at.isoformat() if sender.verified_at else None,
        "last_error": sender.last_error,
    }


def _student_rows(db: Session, tutor: User) -> list:
    students = _my_students(db, tutor)
    user_ids = [s.user_id for s in students]
    if not user_ids:
        return []
    latest = {}
    for d in db.query(EmailDelivery).filter(
            EmailDelivery.kind == "CREDENTIALS", EmailDelivery.recipient_user_id.in_(user_ids)).order_by(EmailDelivery.id):
        latest[d.recipient_user_id] = d
    email_updated = dict(db.query(AuditLog.user_id, func.max(AuditLog.timestamp)).filter(
        AuditLog.action == "EMAIL_UPDATED", AuditLog.user_id.in_(user_ids)).group_by(AuditLog.user_id).all())

    rows = []
    for s in students:
        u, d = s.user, latest.get(s.user_id)
        status = d.status if d else "NOT_QUEUED"
        updated_at = email_updated.get(s.user_id)
        # Retry opens only once the student has saved a new address after the failed attempt
        failed_since = d.created_at if d else None
        can_retry = (status in mail.NOT_DELIVERED or status == "NOT_QUEUED") and updated_at is not None \
            and (failed_since is None or updated_at > failed_since) and not mail.is_placeholder_email(u.email, u.username)
        rows.append({
            "user_id": u.id,
            "register_number": s.register_number,
            "full_name": u.full_name,
            "email": u.email,
            "sent_to": d.to_address if d else None,
            "status": status,
            "error": d.error if d else None,
            "sent_at": d.sent_at.isoformat() if d and d.sent_at else None,
            "email_updated_at": updated_at.isoformat() if updated_at else None,
            "can_retry": can_retry,
        })
    return rows


@router.get("/overview")
def get_overview(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _require_tutor(current_user)
    sender = db.query(EmailSender).filter(EmailSender.user_id == current_user.id).first()
    if sender:
        mail.check_bounces(db, current_user.id)  # throttled; turns wrong addresses into "not received"
    rows = _student_rows(db, current_user)
    counts = {"received": 0, "not_received": 0, "pending": 0, "not_queued": 0}
    for r in rows:
        if r["status"] == "SENT":
            counts["received"] += 1
        elif r["status"] == "PENDING":
            counts["pending"] += 1
        elif r["status"] == "NOT_QUEUED":
            counts["not_queued"] += 1
        else:
            counts["not_received"] += 1
    since = datetime.datetime.utcnow() - datetime.timedelta(days=30)
    notif = dict(db.query(EmailDelivery.status, func.count(EmailDelivery.id)).filter(
        EmailDelivery.sender_user_id == current_user.id, EmailDelivery.kind == "NOTIFICATION",
        EmailDelivery.created_at >= since).group_by(EmailDelivery.status).all())
    return {
        "sender": _sender_info(sender),
        "google_configured": mail.google_configured(),
        "default_password": STUDENT_DEFAULT_PASSWORD,
        "counts": counts,
        "notifications_30d": {
            "sent": notif.get("SENT", 0),
            "pending": notif.get("PENDING", 0),
            "not_delivered": sum(notif.get(s, 0) for s in mail.NOT_DELIVERED),
        },
        "pending_total": mail.pending_count(db, current_user.id),
        "students": rows,
    }


def _redirect_uri(request: Request) -> str:
    """The callback Google returns to. It must be listed under the OAuth client's authorised
    redirect URIs; Vercel and tunnels pass the public host in X-Forwarded-* headers."""
    if GOOGLE_OAUTH_REDIRECT_URI:
        return GOOGLE_OAUTH_REDIRECT_URI
    proto = request.headers.get("x-forwarded-proto", request.url.scheme).split(",")[0].strip()
    host = request.headers.get("x-forwarded-host") or request.headers.get("host") or request.url.netloc
    return f"{proto}://{host.split(',')[0].strip()}{CALLBACK_PATH}"


class ConnectRequest(BaseModel):
    portal_url: str  # the page's origin: where Google sign-in returns the tutor, and the link in emails


@router.post("/google/start")
def start_google_connect(req: ConnectRequest, request: Request, db: Session = Depends(get_db),
                         current_user: User = Depends(get_current_user)):
    """Returns the Google sign-in URL that connects the tutor's Gmail as their sender."""
    _require_tutor(current_user)
    if not mail.google_configured():
        raise HTTPException(status_code=503, detail="Google sign-in is not set up on the server yet. Ask the administrator to add the Google OAuth client.")
    portal_url = req.portal_url.strip().rstrip("/")
    if not ORIGIN_PATTERN.match(portal_url):
        raise HTTPException(status_code=400, detail="Invalid portal address.")
    redirect_uri = _redirect_uri(request)
    state = jwt.encode({
        "purpose": STATE_PURPOSE, "tutor_id": current_user.id, "return_to": portal_url, "redirect_uri": redirect_uri,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(minutes=10),
    }, SECRET_KEY, algorithm=ALGORITHM)
    return {"url": mail.google_auth_url(redirect_uri, state)}


def _back(return_to: str, outcome: str, reason: str = "") -> RedirectResponse:
    url = f"{return_to}/?student_emails={outcome}" + (f"&reason={quote(reason[:300])}" if reason else "")
    return RedirectResponse(url, status_code=303)


@router.get("/google/callback")
def google_callback(state: str = "", code: str = "", error: str = "", db: Session = Depends(get_db)):
    """Google sends the tutor here after sign-in. The signed state says who started it, so this
    needs no portal session; it saves the sender, sends a test email and returns to the portal."""
    try:
        claims = jwt.decode(state, SECRET_KEY, algorithms=[ALGORITHM])
        if claims.get("purpose") != STATE_PURPOSE or not ORIGIN_PATTERN.match(claims.get("return_to", "")):
            raise JWTError("wrong purpose")
    except JWTError:
        raise HTTPException(status_code=400, detail="This Google sign-in link has expired. Start again from Student Emails.")
    return_to, redirect_uri = claims["return_to"], claims["redirect_uri"]
    if error:
        return _back(return_to, "error", "Google sign-in was cancelled." if error == "access_denied" else f"Google sign-in failed ({error}).")
    tutor = db.get(User, claims["tutor_id"])
    if not tutor or "Class Tutor" not in {r.name for r in tutor.roles}:
        return _back(return_to, "error", "Only Class Tutors can connect a sender email.")

    try:
        tokens = mail.exchange_code(code, redirect_uri)
        granted = set((tokens.get("scope") or "").split())
        if "https://www.googleapis.com/auth/gmail.send" not in granted:
            return _back(return_to, "error", "Allow MockRun to send email on your behalf. Without it, student emails cannot be sent.")
        if not tokens.get("refresh_token"):
            return _back(return_to, "error", "Google did not return a lasting sign-in. Try connecting again.")
        probe = EmailSender(user_id=tutor.id, gmail_address="", refresh_token_encrypted=mail.encrypt_secret(tokens["refresh_token"]))
        mail.remember_access_token(tutor.id, tokens["access_token"], tokens.get("expires_in", 3600))
        address = mail.gmail_address_of(probe)
        probe.gmail_address = address
        test = EmailMessage()
        test["From"], test["To"] = address, address
        test["Subject"] = f"{APP_NAME} sender email connected"
        test.set_content("This address will now send your students their welcome email and notifications.\n")
        mail.gmail_send(probe, test)
    except mail.GmailError as exc:
        mail.forget_access_token(tutor.id)
        return _back(return_to, "error", str(exc))

    sender = db.query(EmailSender).filter(EmailSender.user_id == tutor.id).first()
    old = sender.gmail_address if sender else None
    if not sender:
        sender = EmailSender(user_id=tutor.id, gmail_address=address, refresh_token_encrypted="")
        db.add(sender)
    sender.gmail_address = address
    sender.refresh_token_encrypted = probe.refresh_token_encrypted
    sender.portal_url = return_to[:200]
    sender.verified_at = datetime.datetime.utcnow()
    sender.last_error = None
    sender.last_bounce_check_at = None
    record_audit(db, tutor, "EMAIL_SENDER_SET", "USERS", tutor.id, {"gmail": old}, {"gmail": address})
    db.commit()
    return _back(return_to, "connected", address)


@router.delete("/sender")
def remove_sender(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _require_tutor(current_user)
    sender = db.query(EmailSender).filter(EmailSender.user_id == current_user.id).first()
    if sender:
        record_audit(db, current_user, "EMAIL_SENDER_REMOVED", "USERS", current_user.id, {"gmail": sender.gmail_address}, None)
        refresh_token = mail.decrypt_secret(sender.refresh_token_encrypted)
        db.delete(sender)
        db.commit()
        mail.forget_access_token(current_user.id)
        if refresh_token:
            mail.revoke_token(refresh_token)  # also removes MockRun from the tutor's Google account
    return {"sender": None}


@router.post("/send-pending")
def send_pending(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """One time-boxed pass over this tutor's queued email; the panel calls it until nothing is left."""
    _require_tutor(current_user)
    result = mail.send_pending(db, current_user.id)
    mail.check_bounces(db, current_user.id)
    result["remaining"] = mail.pending_count(db, current_user.id)
    return result


@router.post("/{user_id}/retry")
def retry_credentials(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _require_tutor(current_user)
    row = next((r for r in _student_rows(db, current_user) if r["user_id"] == user_id), None)
    if not row:
        raise HTTPException(status_code=404, detail="This student is not in your classes.")
    if not row["can_retry"]:
        raise HTTPException(status_code=409, detail="Retry is available once the student saves a new email address in their profile.")
    student = db.get(User, user_id)
    mail.requeue_credentials(db, student, current_user.id)
    record_audit(db, current_user, "CREDENTIALS_EMAIL_RETRIED", "USERS", user_id, None, {"email": student.email})
    db.commit()
    result = mail.send_pending(db, current_user.id)
    result["remaining"] = mail.pending_count(db, current_user.id)
    return result
