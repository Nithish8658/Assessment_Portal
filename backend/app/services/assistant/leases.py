"""
Database-backed leases: cross-instance concurrency control for the assistant.

Each acquire/release is one short committed statement, so no database connection
or transaction is held while a Gemini Live turn is running.
"""

import asyncio
import datetime
import logging
import uuid
from typing import Optional

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.assessment_models import AssistantLease

logger = logging.getLogger(__name__)


def new_holder() -> str:
    return uuid.uuid4().hex


def try_acquire(db: Session, key: str, holder: str, ttl_seconds: int) -> bool:
    now = datetime.datetime.utcnow()
    expires = now + datetime.timedelta(seconds=ttl_seconds)
    try:
        taken = db.query(AssistantLease).filter(
            AssistantLease.key == key,
            AssistantLease.expires_at < now,
        ).update({"holder": holder, "expires_at": expires}, synchronize_session=False)
        if taken == 1:
            db.commit()
            return True
        db.add(AssistantLease(key=key, holder=holder, expires_at=expires))
        db.commit()
        return True
    except IntegrityError:
        db.rollback()  # row exists and is still held
        return False
    except Exception:
        db.rollback()
        logger.exception("Lease acquire failed for %s", key)
        return False


def release(db: Session, key: Optional[str], holder: str) -> None:
    if not key:
        return
    try:
        db.query(AssistantLease).filter(
            AssistantLease.key == key, AssistantLease.holder == holder
        ).update({"expires_at": datetime.datetime.utcnow() - datetime.timedelta(seconds=1)}, synchronize_session=False)
        db.commit()
    except Exception:
        db.rollback()
        logger.exception("Lease release failed for %s", key)


async def acquire_slot(db: Session, prefix: str, slots: int, holder: str, ttl_seconds: int, wait_seconds: float) -> Optional[str]:
    """Waits up to `wait_seconds` for any of `slots` numbered leases; returns the key or None."""
    loop = asyncio.get_event_loop()
    deadline = loop.time() + wait_seconds
    while True:
        for i in range(1, max(1, slots) + 1):
            key = f"{prefix}_{i}"
            if try_acquire(db, key, holder, ttl_seconds):
                return key
        if loop.time() >= deadline:
            return None
        await asyncio.sleep(1.0)
