"""Class Tutor's Student Emails panel: the Gmail sender, delivery status of each student's login
details, sending queued email, and retrying after a student fixes their address."""
import datetime
import re
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func, or_, and_
from sqlalchemy.orm import Session, joinedload

from app.auth.jwt import get_current_user
from app.config import STUDENT_DEFAULT_PASSWORD
from app.database import get_db
from app.models.models import AuditLog, EmailDelivery, EmailSender, StudentProfile, User
from app.routers.users import _tutor_assigned_classes
from app.services import student_email as mail
from app.services.audit import record_audit

router = APIRouter(prefix="/api/v1/student-emails", tags=["Student Emails"])

EMAIL_PATTERN = re.compile(r"^[^@\s]+@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$")


def _require_tutor(user: User) -> None:
    if "Class Tutor" not in {r.name for r in user.roles}:
        raise HTTPException(status_code=403, detail="Only Class Tutors manage student emails.")


def _my_students(db: Session, tutor: User) -> list:
    """Students in the tutor's assigned classes, plus any whose login details this tutor sent."""
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


class SenderRequest(BaseModel):
    gmail_address: str
    app_password: str
    portal_url: Optional[str] = None  # the page's origin, used as the sign-in link in emails


@router.put("/sender")
def save_sender(req: SenderRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Signs in to Gmail and sends a test email to the address itself before saving it."""
    _require_tutor(current_user)
    address = req.gmail_address.strip().lower()
    app_password = re.sub(r"\s+", "", req.app_password or "")
    if not EMAIL_PATTERN.match(address):
        raise HTTPException(status_code=400, detail="Enter a valid Gmail address.")
    if len(app_password) != 16:
        raise HTTPException(status_code=400, detail="A Gmail App Password has 16 letters (spaces are ignored).")
    try:
        smtp = mail.smtp_connect(address, app_password)
        try:
            from email.message import EmailMessage
            msg = EmailMessage()
            msg["From"], msg["To"] = address, address
            msg["Subject"] = "MockRun sender email connected"
            msg.set_content("This address will now send your students their login details and notifications.\n")
            smtp.send_message(msg)
        finally:
            try:
                smtp.quit()
            except Exception:
                pass
    except Exception as exc:
        raise HTTPException(status_code=400, detail=mail.describe_smtp_error(exc))

    sender = db.query(EmailSender).filter(EmailSender.user_id == current_user.id).first()
    old = sender.gmail_address if sender else None
    if not sender:
        sender = EmailSender(user_id=current_user.id, gmail_address=address, app_password_encrypted="")
        db.add(sender)
    sender.gmail_address = address
    sender.app_password_encrypted = mail.encrypt_secret(app_password)
    sender.verified_at = datetime.datetime.utcnow()
    sender.last_error = None
    if req.portal_url and re.match(r"^https?://[^\s/]+$", req.portal_url.strip()):
        sender.portal_url = req.portal_url.strip()[:200]
    record_audit(db, current_user, "EMAIL_SENDER_SET", "USERS", current_user.id, {"gmail": old}, {"gmail": address})
    db.commit()
    return {"sender": _sender_info(sender), "pending_total": mail.pending_count(db, current_user.id)}


@router.delete("/sender")
def remove_sender(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _require_tutor(current_user)
    sender = db.query(EmailSender).filter(EmailSender.user_id == current_user.id).first()
    if sender:
        record_audit(db, current_user, "EMAIL_SENDER_REMOVED", "USERS", current_user.id, {"gmail": sender.gmail_address}, None)
        db.delete(sender)
        db.commit()
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
