"""
Creates the student_competency_profiles and assistant_leases tables (if missing) and
builds a stored analytics profile for every (student, domain) pair that has attempts.

Safe to re-run: every profile is rebuilt from current attempts. Run it once after
deploying, so profiles graded by the previous code version are refreshed too.

Usage (from backend/):
    python -m app.migrations.backfill_competency_profiles --dry-run
    python -m app.migrations.backfill_competency_profiles
"""

import argparse
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from sqlalchemy import inspect

from app.database import SessionLocal, engine
from app.models.assessment_models import (
    AssessmentActivationRequest,
    AssessmentAttempt,
    AssessmentStudentAllocation,
    AssistantLease,
    StudentCompetencyProfile,
)
from app.services.assessment.competency_profiles import refresh_profile


def run(dry_run: bool) -> dict:
    table_exists = inspect(engine).has_table(StudentCompetencyProfile.__tablename__)
    db = SessionLocal()
    try:
        pairs = db.query(
            AssessmentStudentAllocation.student_id, AssessmentActivationRequest.domain_id
        ).join(
            AssessmentAttempt, AssessmentAttempt.allocation_id == AssessmentStudentAllocation.id
        ).join(
            AssessmentActivationRequest, AssessmentStudentAllocation.request_id == AssessmentActivationRequest.id
        ).distinct().all()
        summary = {"table_existed": table_exists, "student_domain_pairs": len(pairs), "dry_run": dry_run}
        if dry_run:
            return summary
        if not table_exists:
            StudentCompetencyProfile.__table__.create(bind=engine)
            summary["table_created"] = True
        if not inspect(engine).has_table(AssistantLease.__tablename__):
            AssistantLease.__table__.create(bind=engine)
            summary["assistant_leases_table_created"] = True
        built = sum(1 for sid, did in pairs if refresh_profile(db, sid, did) is not None)
        summary["profiles_built"] = built
        summary["profiles_total"] = db.query(StudentCompetencyProfile).count()
        return summary
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    print(json.dumps(run(parser.parse_args().dry_run), indent=2))
