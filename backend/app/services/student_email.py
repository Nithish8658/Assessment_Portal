"""Student emails sent from each Class Tutor's Gmail account.

Two kinds of email go to a student:
  CREDENTIALS   their login details, queued once when a roster first loads them
  NOTIFICATION  a copy of each in-app notification, queued by notify_student()

The tutor connects their Gmail with Google sign-in (OAuth); the refresh token it yields is
stored encrypted and used to send through the Gmail API. Queuing only adds an EmailDelivery
row (PENDING). send_pending() sends them in small, time-boxed passes, so it can run inside a
request on Vercel; it is called by the tutor's Student Emails page, after a roster upload, and
by a background loop where one runs. Gmail accepts mail for addresses that do not exist and
reports them later with a bounce message in the sender's inbox; check_bounces() reads those
and marks the delivery BOUNCED, so a wrong address shows up as "not received".
"""
import base64
import datetime
import email
import email.utils
import hashlib
import re
import threading
import time
from email.message import EmailMessage
from typing import Iterable, Optional
from urllib.parse import urlencode

import httpx
from cryptography.fernet import Fernet, InvalidToken
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.config import (
    APP_NAME, INSTITUTION_SHORT, PORTAL_URL, SECRET_KEY, EMAIL_ENCRYPTION_KEY, STUDENT_DEFAULT_PASSWORD,
    GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET,
)
from app.models.models import (
    AcademicClass, AuditLog, EmailDelivery, EmailSender, FacultyProfile, Notification,
    RosterApprovalBatch, StudentProfile, User,
)

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_REVOKE_URL = "https://oauth2.googleapis.com/revoke"
GMAIL_API = "https://gmail.googleapis.com/gmail/v1/users/me"
# Send as the tutor, and read their inbox only to find bounce messages
GOOGLE_SCOPES = "https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.readonly"
NETWORK_TIMEOUT = 15

# Roster rows without an email get one of these generated addresses; nobody receives mail there
PLACEHOLDER_DOMAINS = ("openlectern.com", "nasccbe.ac.in")
# A claimed row whose pass crashed is picked up again after this long
CLAIM_EXPIRY = datetime.timedelta(minutes=5)
# Notifications still unsent after this long (e.g. no sender set up yet) are dropped, not sent late
NOTIFICATION_EXPIRY = datetime.timedelta(days=3)
BOUNCE_CHECK_INTERVAL = datetime.timedelta(minutes=3)
BOUNCE_LOOKBACK = datetime.timedelta(days=3)

NOT_DELIVERED = ("BOUNCED", "FAILED", "SKIPPED")


# --- Token encryption ----------------------------------------------------------

def _fernet() -> Fernet:
    secret = (EMAIL_ENCRYPTION_KEY or SECRET_KEY).encode("utf-8")
    return Fernet(base64.urlsafe_b64encode(hashlib.sha256(secret).digest()))


def encrypt_secret(value: str) -> str:
    return _fernet().encrypt(value.encode("utf-8")).decode("ascii")


def decrypt_secret(token: str) -> Optional[str]:
    """None when the key changed since the token was saved; the tutor connects again."""
    try:
        return _fernet().decrypt(token.encode("ascii")).decode("utf-8")
    except (InvalidToken, ValueError):
        return None


# --- Helpers -----------------------------------------------------------------

def is_placeholder_email(address: Optional[str], username: str = "") -> bool:
    if not address or "@" not in address:
        return True
    local, _, domain = address.lower().rpartition("@")
    return domain in PLACEHOLDER_DOMAINS and (not username or local == username.lower())


def password_changed(db: Session, user_id: int) -> bool:
    return db.query(AuditLog.id).filter(AuditLog.user_id == user_id, AuditLog.action == "PASSWORD_CHANGED").first() is not None


def tutor_user_id_for(db: Session, sp: Optional[StudentProfile]) -> Optional[int]:
    """The Class Tutor who sends this student's emails: the tutor of their class, else whoever
    last uploaded a roster for it. Memoised per session, since a class has one answer."""
    if not sp:
        return None
    key = (sp.programme_id, sp.batch_name, sp.section_name or "A")
    memo = db.info.setdefault("tutor_for_class", {})
    if key in memo:
        return memo[key]
    programme_id, batch_name, section_name = key
    tutor_id = None
    ac = db.query(AcademicClass).filter(
        AcademicClass.programme_id == programme_id, AcademicClass.batch_name == batch_name,
        AcademicClass.section_name == section_name, AcademicClass.tutor_id.isnot(None),
    ).first()
    if ac and ac.tutor and ac.tutor.user_id:
        tutor_id = ac.tutor.user_id
    if not tutor_id:
        fp = db.query(FacultyProfile).filter(
            FacultyProfile.assigned_programme_id == programme_id, FacultyProfile.assigned_batch == batch_name,
            or_(FacultyProfile.assigned_section == section_name, FacultyProfile.assigned_section.is_(None)),
        ).first()
        tutor_id = fp.user_id if fp else None
    if not tutor_id:
        batch = db.query(RosterApprovalBatch.tutor_id).filter(
            RosterApprovalBatch.programme_id == programme_id, RosterApprovalBatch.batch_name == batch_name,
            RosterApprovalBatch.section_name == section_name, RosterApprovalBatch.status == "Approved",
        ).order_by(RosterApprovalBatch.created_at.desc()).first()
        tutor_id = batch[0] if batch else None
    memo[key] = tutor_id
    return tutor_id


def _new_delivery(user: User, sender_user_id: Optional[int], kind: str, subject: str, body: Optional[str]) -> EmailDelivery:
    d = EmailDelivery(
        recipient_user_id=user.id, sender_user_id=sender_user_id, kind=kind,
        to_address=(user.email or "")[:100], subject=subject[:200], body=body, status="PENDING",
    )
    if is_placeholder_email(user.email, user.username):
        d.status, d.error = "SKIPPED", "No email address on the roster"
    return d


# --- Queuing -----------------------------------------------------------------

CREDENTIALS_SUBJECT = f"Your {APP_NAME} login details"


def queue_credentials(db: Session, users: Iterable[User], sender_user_id: Optional[int]) -> int:
    """Queues login details for students who have not had them yet. A student whose earlier email
    did not arrive is queued again only when the roster now gives a different address.
    Caller flushes/commits."""
    users = [u for u in users if u.id]
    if not users:
        return 0
    latest = {}
    for d in db.query(EmailDelivery).filter(
            EmailDelivery.kind == "CREDENTIALS", EmailDelivery.recipient_user_id.in_([u.id for u in users])).order_by(EmailDelivery.id):
        latest[d.recipient_user_id] = d
    count = 0
    for u in users:
        prev = latest.get(u.id)
        if prev and (prev.status not in NOT_DELIVERED or prev.to_address.lower() == (u.email or "").lower()):
            continue
        db.add(_new_delivery(u, sender_user_id, "CREDENTIALS", CREDENTIALS_SUBJECT, None))
        count += 1
    return count


def requeue_credentials(db: Session, user: User, sender_user_id: Optional[int]) -> EmailDelivery:
    d = _new_delivery(user, sender_user_id, "CREDENTIALS", CREDENTIALS_SUBJECT, None)
    db.add(d)
    return d


def notify_student(db: Session, user_id: int, title: str, message: str, type: str = "info") -> None:
    """Adds the in-app notification and queues the same text as an email. Caller commits."""
    db.add(Notification(user_id=user_id, title=title, message=message, type=type))
    user = db.get(User, user_id)
    if not user or not user.student_profile:
        return
    body = f"Dear {user.full_name},\n\n{message}\n"
    db.add(_new_delivery(user, tutor_user_id_for(db, user.student_profile), "NOTIFICATION", title, body))


# --- Sending -----------------------------------------------------------------

def _portal_url(sender: EmailSender) -> str:
    return sender.portal_url or PORTAL_URL


def _credentials_body(db: Session, user: User, portal_url: str) -> str:
    sp = user.student_profile
    if password_changed(db, user.id):
        password_line = "Password: the password you set in your profile"
    else:
        password_line = f"Password: {(sp.initial_password if sp and sp.initial_password else STUDENT_DEFAULT_PASSWORD)}"
    lines = [
        f"Dear {user.full_name},",
        "",
        f"Your {APP_NAME} account for {INSTITUTION_SHORT} assessments is ready.",
        "",
        f"Username: {user.username}",
        password_line,
    ]
    if portal_url:
        lines += [f"Sign in: {portal_url}"]
    lines += [
        "",
        "After signing in, open My Profile to confirm your email address and set your own password.",
        "Do not share your password with anyone.",
    ]
    return "\n".join(lines) + "\n"


def _from_header(sender: EmailSender, sender_user: Optional[User]) -> str:
    name = f"{sender_user.full_name} via {APP_NAME}" if sender_user else APP_NAME
    return email.utils.formataddr((name, sender.gmail_address))


# --- Google sign-in and the Gmail API ------------------------------------------

class GmailError(Exception):
    """kind: 'auth' (access removed or expired: reconnect), 'limit' (try again later),
    'address' (this recipient only), 'other'."""
    def __init__(self, kind: str, message: str):
        super().__init__(message)
        self.kind = kind


def google_configured() -> bool:
    return bool(GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET)


def google_auth_url(redirect_uri: str, state: str) -> str:
    return GOOGLE_AUTH_URL + "?" + urlencode({
        "client_id": GOOGLE_OAUTH_CLIENT_ID,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": GOOGLE_SCOPES,
        "access_type": "offline",  # yields a refresh token, so sending works while the tutor is away
        "prompt": "consent",       # Google only returns a refresh token from a consent screen
        "state": state,
    })


def _json(r: httpx.Response) -> dict:
    try:
        data = r.json()
        return data if isinstance(data, dict) else {}
    except ValueError:
        return {}


def exchange_code(code: str, redirect_uri: str) -> dict:
    """Swaps the sign-in code for tokens: {refresh_token, access_token, expires_in, scope}."""
    try:
        r = httpx.post(GOOGLE_TOKEN_URL, timeout=NETWORK_TIMEOUT, data={
            "code": code, "client_id": GOOGLE_OAUTH_CLIENT_ID, "client_secret": GOOGLE_OAUTH_CLIENT_SECRET,
            "redirect_uri": redirect_uri, "grant_type": "authorization_code",
        })
    except httpx.HTTPError as exc:
        raise GmailError("limit", f"Could not reach Google ({exc.__class__.__name__}). Try again.")
    if r.status_code != 200:
        body = _json(r)
        raise GmailError("auth", f"Google sign-in failed: {body.get('error_description') or body.get('error') or r.status_code}")
    return r.json()


def revoke_token(refresh_token: str) -> None:
    try:
        httpx.post(GOOGLE_REVOKE_URL, params={"token": refresh_token}, timeout=NETWORK_TIMEOUT)
    except httpx.HTTPError:
        pass  # removing the sender here is what matters; the tutor can also revoke in their Google account


# Access tokens last an hour; keep one per sender instead of refreshing on every pass
_access_tokens: dict = {}
_access_lock = threading.Lock()


def remember_access_token(sender_user_id: int, token: str, expires_in: int) -> None:
    with _access_lock:
        _access_tokens[sender_user_id] = (token, time.monotonic() + max(int(expires_in) - 120, 0))


def forget_access_token(sender_user_id: int) -> None:
    with _access_lock:
        _access_tokens.pop(sender_user_id, None)


def _access_token(sender: EmailSender) -> str:
    with _access_lock:
        hit = _access_tokens.get(sender.user_id)
    if hit and hit[1] > time.monotonic():
        return hit[0]
    refresh_token = decrypt_secret(sender.refresh_token_encrypted)
    if not refresh_token:
        raise GmailError("auth", "The saved Google sign-in can no longer be read. Connect with Google again.")
    try:
        r = httpx.post(GOOGLE_TOKEN_URL, timeout=NETWORK_TIMEOUT, data={
            "client_id": GOOGLE_OAUTH_CLIENT_ID, "client_secret": GOOGLE_OAUTH_CLIENT_SECRET,
            "refresh_token": refresh_token, "grant_type": "refresh_token",
        })
    except httpx.HTTPError as exc:
        raise GmailError("limit", f"Could not reach Google ({exc.__class__.__name__}). Sending will retry shortly.")
    if r.status_code != 200:
        if _json(r).get("error") in ("invalid_grant", "unauthorized_client", "invalid_client"):
            raise GmailError("auth", "Google access for this account was removed or has expired. Connect with Google again.")
        raise GmailError("limit", f"Google sign-in is unavailable right now ({r.status_code}). Sending will retry shortly.")
    data = r.json()
    remember_access_token(sender.user_id, data["access_token"], data.get("expires_in", 3600))
    return data["access_token"]


def _gmail(sender: EmailSender, method: str, path: str, **kwargs) -> dict:
    """One Gmail API call as the sender, refreshing the access token once if Google rejects it."""
    for attempt in (0, 1):
        token = _access_token(sender)
        try:
            r = httpx.request(method, GMAIL_API + path, headers={"Authorization": f"Bearer {token}"},
                              timeout=NETWORK_TIMEOUT, **kwargs)
        except httpx.HTTPError as exc:
            raise GmailError("limit", f"Could not reach Gmail ({exc.__class__.__name__}). Sending will retry shortly.")
        if r.status_code == 401 and attempt == 0:
            forget_access_token(sender.user_id)
            continue
        if r.status_code < 300:
            return _json(r)
        err = _json(r).get("error") or {}
        err = err if isinstance(err, dict) else {}
        message = str(err.get("message") or r.text[:200])
        reasons = {e.get("reason") for e in err.get("errors", []) if isinstance(e, dict)}
        if r.status_code == 401 or (r.status_code == 403 and reasons & {"insufficientPermissions", "forbidden"}):
            raise GmailError("auth", "Gmail no longer allows this app to send for this account. Connect with Google again.")
        if r.status_code == 429 or r.status_code >= 500 or reasons & {
                "rateLimitExceeded", "userRateLimitExceeded", "dailyLimitExceeded", "quotaExceeded"}:
            raise GmailError("limit", "Gmail's sending limit was reached; the rest will be sent later.")
        if r.status_code == 400 and ("recipient" in message.lower() or "address" in message.lower()):
            raise GmailError("address", "Gmail refused this address")
        raise GmailError("other", f"Gmail error: {message}"[:300])
    raise GmailError("auth", "Gmail rejected the sign-in. Connect with Google again.")


def gmail_send(sender: EmailSender, msg: EmailMessage) -> None:
    raw = base64.urlsafe_b64encode(msg.as_bytes()).decode("ascii")
    _gmail(sender, "POST", "/messages/send", json={"raw": raw})


def gmail_address_of(sender: EmailSender) -> str:
    return str(_gmail(sender, "GET", "/profile")["emailAddress"]).lower()


def _claim(db: Session, sender_user_id: int, limit: int) -> list:
    now = datetime.datetime.utcnow()
    rows = db.query(EmailDelivery).filter(
        EmailDelivery.sender_user_id == sender_user_id,
        EmailDelivery.status == "PENDING",
        or_(EmailDelivery.claimed_at.is_(None), EmailDelivery.claimed_at < now - CLAIM_EXPIRY),
    ).order_by(EmailDelivery.kind, EmailDelivery.id).limit(limit).with_for_update(skip_locked=True).all()
    for r in rows:
        r.claimed_at = now
    db.commit()
    return rows


def send_pending(db: Session, sender_user_id: int, time_budget: float = 8.0, limit: int = 40) -> dict:
    """Sends this tutor's queued emails until the time budget runs out. Commits as it goes."""
    sender = db.query(EmailSender).filter(EmailSender.user_id == sender_user_id).first()
    result = {"sent": 0, "failed": 0, "error": None}
    if not sender:
        result["error"] = "No sender email is connected."
        return result
    if not google_configured():
        result["error"] = "Google sign-in is not set up on the server yet."
        return result

    started = time.monotonic()
    rows = _claim(db, sender_user_id, limit)
    if not rows:
        return result
    now = datetime.datetime.utcnow()
    sender_user = db.get(User, sender_user_id)
    stopped = None
    try:
        for r in rows:
            if stopped or time.monotonic() - started > time_budget:
                r.claimed_at = None
                continue
            recipient = db.get(User, r.recipient_user_id)
            if not recipient:
                r.status, r.error = "SKIPPED", "Student account was removed"
                continue
            if r.kind == "NOTIFICATION" and r.created_at and now - r.created_at > NOTIFICATION_EXPIRY:
                r.status, r.error = "SKIPPED", "Expired before it could be sent"
                continue
            msg = EmailMessage()
            msg["From"] = _from_header(sender, sender_user)
            msg["To"] = r.to_address
            msg["Subject"] = r.subject
            msg["Message-ID"] = email.utils.make_msgid(idstring=f"mockrun-{r.id}")
            portal_url = _portal_url(sender)
            if r.kind == "CREDENTIALS":
                content = _credentials_body(db, recipient, portal_url)
            else:
                content = (r.body or r.subject) + (f"\nSign in: {portal_url}\n" if portal_url else "")
            msg.set_content(content)
            try:
                gmail_send(sender, msg)
                r.status, r.error, r.sent_at = "SENT", None, datetime.datetime.utcnow()
                result["sent"] += 1
            except GmailError as exc:
                if exc.kind in ("auth", "limit"):
                    # A problem with the account, not this student: the rest stays queued
                    r.claimed_at = None
                    stopped = str(exc)
                    continue
                r.status, r.error = "FAILED", str(exc)
                result["failed"] += 1
            db.commit()
        sender.last_error = stopped
        result["error"] = stopped
    finally:
        for r in rows:
            if r.status == "PENDING":
                r.claimed_at = None
        db.commit()
    return result


def pending_count(db: Session, sender_user_id: int) -> int:
    return db.query(EmailDelivery).filter(
        EmailDelivery.sender_user_id == sender_user_id, EmailDelivery.status == "PENDING").count()


# --- Bounces -----------------------------------------------------------------

ADDRESS_RE = re.compile(r"[\w.+'-]+@[\w-]+(?:\.[\w-]+)+")


def _failed_recipients(msg) -> set:
    found = set()
    for value in msg.get_all("X-Failed-Recipients") or []:
        found.update(a.strip().lower() for a in value.split(","))
    for part in msg.walk():
        ctype = part.get_content_type()
        if ctype == "message/delivery-status":
            payload = part.get_payload()
            blocks = payload if isinstance(payload, list) else []
            for block in blocks:
                for key in ("Final-Recipient", "Original-Recipient"):
                    v = block.get(key)
                    if v:
                        found.add(v.split(";")[-1].strip().lower())
        elif ctype == "text/plain" and not found:
            text = part.get_payload(decode=True) or b""
            found.update(a.lower() for a in ADDRESS_RE.findall(text.decode("utf-8", "ignore")[:4000]))
    return found


def check_bounces(db: Session, sender_user_id: int, force: bool = False) -> int:
    """Marks SENT deliveries BOUNCED when the sender's inbox holds a bounce for that address."""
    sender = db.query(EmailSender).filter(EmailSender.user_id == sender_user_id).first()
    if not sender or not google_configured():
        return 0
    now = datetime.datetime.utcnow()
    if not force and sender.last_bounce_check_at and now - sender.last_bounce_check_at < BOUNCE_CHECK_INTERVAL:
        return 0
    recent = db.query(EmailDelivery).filter(
        EmailDelivery.sender_user_id == sender_user_id, EmailDelivery.status == "SENT",
        EmailDelivery.sent_at >= now - BOUNCE_LOOKBACK,
    ).all()
    sender.last_bounce_check_at = now
    db.commit()
    if not recent:
        return 0
    by_address = {}
    for d in recent:
        by_address.setdefault(d.to_address.lower(), []).append(d)
    marked = 0
    try:
        listing = _gmail(sender, "GET", "/messages", params={
            "q": f"from:(mailer-daemon OR postmaster) newer_than:{BOUNCE_LOOKBACK.days}d", "maxResults": 100})
        for item in listing.get("messages", []):
            raw = _gmail(sender, "GET", f"/messages/{item['id']}", params={"format": "raw"}).get("raw")
            if not raw:
                continue
            msg = email.message_from_bytes(base64.urlsafe_b64decode(raw + "=" * (-len(raw) % 4)))
            bounced_at = email.utils.parsedate_to_datetime(msg["Date"]) if msg["Date"] else None
            for address in _failed_recipients(msg) & set(by_address):
                for d in by_address[address]:
                    if d.status != "SENT":
                        continue
                    if bounced_at and d.sent_at and bounced_at.replace(tzinfo=None) - d.sent_at < -datetime.timedelta(hours=12):
                        continue  # bounce for an older email to the same address
                    d.status, d.error = "BOUNCED", "The address does not exist or rejected the email"
                    marked += 1
    except Exception as exc:  # bounce checks are best effort; sending still works without them
        print(f"[STUDENT EMAIL] Bounce check failed for sender {sender_user_id}: {exc}")
    db.commit()
    return marked


def run_all_senders(db: Session) -> None:
    """One pass over every sender with queued email; used by the background loop."""
    sender_ids = [r[0] for r in db.query(EmailSender.user_id).all()]
    for sid in sender_ids:
        try:
            if pending_count(db, sid):
                send_pending(db, sid, time_budget=30.0, limit=100)
            check_bounces(db, sid)
        except Exception as exc:
            db.rollback()
            print(f"[STUDENT EMAIL] Send pass failed for sender {sid}: {exc}")
