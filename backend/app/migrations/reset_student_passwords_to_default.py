"""
Migration: give every student who has not set their own password the common starting password.

Students loaded before the shared password existed got a unique MockRun@#### password. This
sets them all to STUDENT_DEFAULT_PASSWORD (and records it as their initial password), so every
student signs in the same way until they change it in My Profile. Students who already changed
their password (a PASSWORD_CHANGED audit entry) are left alone.

The old password hashes are written to app/migrations/backups/ first, so the change can be undone.

Usage (from backend/):
    python -m app.migrations.reset_student_passwords_to_default --dry-run
    python -m app.migrations.reset_student_passwords_to_default
"""

import argparse
import datetime
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.auth.jwt import get_password_hash
from app.config import STUDENT_DEFAULT_PASSWORD
from app.database import SessionLocal
from app.models.models import AuditLog, StudentProfile, User

BACKUP_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backups")


def migrate(dry_run: bool) -> dict:
    db = SessionLocal()
    try:
        changed_ids = {r[0] for r in db.query(AuditLog.user_id).filter(AuditLog.action == "PASSWORD_CHANGED").distinct()}
        rows = db.query(StudentProfile, User).join(User, StudentProfile.user_id == User.id).all()
        targets = [(sp, u) for sp, u in rows
                   if u.id not in changed_ids and sp.initial_password != STUDENT_DEFAULT_PASSWORD]
        counts = {
            "students": len(rows),
            "kept_own_password": sum(1 for _, u in rows if u.id in changed_ids),
            "already_default": sum(1 for sp, u in rows if u.id not in changed_ids and sp.initial_password == STUDENT_DEFAULT_PASSWORD),
            "reset_to_default": len(targets),
            "dry_run": dry_run,
        }
        if dry_run or not targets:
            return counts

        os.makedirs(BACKUP_DIR, exist_ok=True)
        path = os.path.join(BACKUP_DIR, f"student_passwords_{datetime.datetime.utcnow():%Y%m%dT%H%M%SZ}.json")
        with open(path, "w") as fh:
            json.dump([{"user_id": u.id, "username": u.username, "hashed_password": u.hashed_password,
                        "initial_password": sp.initial_password} for sp, u in targets], fh, indent=2)
        counts["backup_file"] = path

        default_hash = get_password_hash(STUDENT_DEFAULT_PASSWORD)  # one hash serves everyone, as on roster load
        for sp, u in targets:
            u.hashed_password = default_hash
            sp.initial_password = STUDENT_DEFAULT_PASSWORD
        db.commit()
        return counts
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="report the counts without changing anything")
    print(json.dumps(migrate(parser.parse_args().dry_run), indent=2))
