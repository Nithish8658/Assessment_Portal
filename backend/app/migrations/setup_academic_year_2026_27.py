"""
One-time setup of the institution's current academic calendar (2026-2027).

- Deletes schools that have no departments.
- Creates academic year 2026-2027: Odd semester 1 Jun - 30 Nov 2026, Even semester 1 Dec 2026 - 30 Apr 2027.
- Registers the running batches 2024-2027 (Semester V), 2025-2028 (Semester III), 2026-2029 (Semester I).
- With --sync, updates every class's and student's stored semester to match the calendar.

Same validation as the Academic Calendar screen; every change is audited.

Usage (from backend/):
    python -m app.migrations.setup_academic_year_2026_27 --dry-run
    python -m app.migrations.setup_academic_year_2026_27 [--sync]
"""

import argparse
import datetime
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.database import SessionLocal
from app.models.models import AcademicYear, Batch, School
from app.routers.academic_calendar import YearRequest, _refresh_current_flags, _upsert_terms, _validate_year
from app.services.academic_calendar import apply_semester_sync, current_term, parse_batch, semester_sync_plan
from app.services.audit import record_audit

YEAR = YearRequest(
    year_code="2026-2027",
    start_date=datetime.date(2026, 6, 1), end_date=datetime.date(2027, 4, 30),
    odd_start=datetime.date(2026, 6, 1), odd_end=datetime.date(2026, 11, 30),
    even_start=datetime.date(2026, 12, 1), even_end=datetime.date(2027, 4, 30),
)
BATCHES = ["2024-2027", "2025-2028", "2026-2029"]


def run(dry_run: bool, sync: bool) -> dict:
    db = SessionLocal()
    out = {"dry_run": dry_run}
    try:
        empty = [s for s in db.query(School).all() if not s.departments]
        out["empty_schools_deleted"] = [f"{s.code} - {s.name}" for s in empty]
        for s in empty:
            record_audit(db, None, "SCHOOL_DELETED", "MASTER_DATA", s.id, {"code": s.code, "name": s.name}, {"reason": "no departments"})
            db.delete(s)

        if db.query(AcademicYear).filter(AcademicYear.year_code == YEAR.year_code).first():
            out["academic_year"] = f"{YEAR.year_code} already exists (left unchanged)"
        else:
            _validate_year(YEAR, db)
            db.add(AcademicYear(year_code=YEAR.year_code, start_date=YEAR.start_date, end_date=YEAR.end_date, is_current=False))
            _upsert_terms(db, YEAR.year_code, YEAR)
            record_audit(db, None, "ACADEMIC_YEAR_CREATED", "ACADEMIC_CALENDAR", YEAR.year_code, None, YEAR.model_dump(mode="json"))
            out["academic_year"] = f"{YEAR.year_code} created"
        _refresh_current_flags(db)

        added = []
        for name in BATCHES:
            if not db.query(Batch).filter(Batch.name == name).first():
                start, end = parse_batch(name)
                db.add(Batch(name=name, start_year=start, end_year=end))
                record_audit(db, None, "BATCH_CREATED", "ACADEMIC_CALENDAR", name, None, {"name": name})
                added.append(name)
        out["batches_added"] = added
        db.flush()

        out["current"] = {k: current_term(db).get(k) for k in ("academic_year", "term_name", "term_start_date", "term_end_date")}
        plan = semester_sync_plan(db)
        out["semester_changes_needed"] = {"classes": plan["classes"], "students_by_batch": plan["students_by_batch"]}
        if sync:
            res = apply_semester_sync(db)
            record_audit(db, None, "SEMESTERS_SYNCED", "ACADEMIC_CALENDAR", YEAR.year_code,
                         out["semester_changes_needed"], {"classes_updated": res["classes_updated"], "students_updated": res["students_updated"]})
            out["semester_sync"] = {"classes_updated": res["classes_updated"], "students_updated": res["students_updated"]}

        if dry_run:
            db.rollback()
        else:
            db.commit()
        return out
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--sync", action="store_true")
    args = parser.parse_args()
    print(json.dumps(run(args.dry_run, args.sync), indent=2, default=str))
