"""Audit trail helper: one call per administrative action. The caller commits."""

import json
from typing import Any, Optional

from fastapi import Request
from sqlalchemy.orm import Session

from app.models.models import AuditLog


def _to_text(value: Any) -> Optional[str]:
    if value is None:
        return None
    if isinstance(value, str):
        return value[:4000]
    try:
        return json.dumps(value, default=str)[:4000]
    except Exception:
        return str(value)[:4000]


def client_ip(request: Optional[Request]) -> str:
    if request is None:
        return "unknown"
    fwd = request.headers.get("x-forwarded-for")
    if fwd:
        return fwd.split(",")[0].strip()[:50]
    return (request.client.host if request.client else "unknown")[:50]


def record_audit(
    db: Session,
    user,
    action: str,
    module: str,
    record_id: Any = None,
    old: Any = None,
    new: Any = None,
    request: Optional[Request] = None,
) -> None:
    db.add(AuditLog(
        user_id=getattr(user, "id", None),
        action=action[:100],
        module=module[:50],
        record_id=str(record_id)[:50] if record_id is not None else None,
        old_value=_to_text(old),
        new_value=_to_text(new),
        ip_address=client_ip(request),
    ))
