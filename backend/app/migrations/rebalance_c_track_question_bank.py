"""
Migration: rebalance the C & Systems Programming question bank by difficulty.

1. Rounds 1-2 (MCQ): add the new questions so each round holds 10 Easy, 10 Medium and
   10 Hard, and relabel existing questions (marks and pacing follow the label).
2. Round 4 (Debugging): 3 questions per attempt (1 Easy + 1 Medium + 1 Hard on Balanced),
   35 -> 50 minutes, including still-active approved activations.
3. Rounds 3-4: re-run the coding and debugging seeds (prompt fixes, corrected reference
   solutions, extra hidden tests, rewritten debugging questions, new Hard questions).

Labels come from app/services/assessment/c_track_curation.py. This does NOT re-run
seed_c_programming_domain.seed_c_domain(), which would also allocate the track to every student.

Usage (from backend/):
    python -m app.migrations.rebalance_c_track_question_bank --dry-run
    python -m app.migrations.rebalance_c_track_question_bank
--dry-run reports the changes for steps 1-2 and skips step 3.
"""

import argparse
import datetime
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from sqlalchemy.orm.attributes import flag_modified

from app.database import SessionLocal
from app.models.assessment_models import (
    AssessmentActivationRequest,
    AssessmentDomain,
    AssessmentQuestion,
    AssessmentRound,
    Competency,
    QuestionEvaluationConfig,
)
from app.services.assessment.c_track_curation import MCQ_DIFFICULTY, MCQ_MARKS, MCQ_TIME_LIMIT_SECONDS
from app.migrations.seed_c_programming_domain import R1_QUESTIONS, R2_QUESTIONS
from app.migrations.seed_c_coding_60_questions import seed_c_coding_60
from app.migrations.seed_c_debugging_60_questions import run_seeding as seed_c_debugging

DOMAIN_SLUG = "c-programming-track"
OLD_DEBUG_MINUTES = 35
NEW_DEBUG_MINUTES = 50
DEBUG_QUESTIONS_PER_ATTEMPT = 3
BACKUP_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backups")


def run(dry_run: bool) -> dict:
    db = SessionLocal()
    backup = []
    counts = {"mcq_created": 0, "mcq_relabelled": 0, "round_settings": 0, "activation_durations": 0}
    try:
        domain = db.query(AssessmentDomain).filter(AssessmentDomain.slug == DOMAIN_SLUG).first()
        if not domain:
            raise SystemExit(f"[ERROR] Domain '{DOMAIN_SLUG}' not found.")
        rounds = {r.round_number: r for r in db.query(AssessmentRound).filter(AssessmentRound.domain_id == domain.id)}
        comp_ids = {c.code: c.id for c in db.query(Competency).all()}

        # 1. MCQ rounds
        for rn, questions in ((1, R1_QUESTIONS), (2, R2_QUESTIONS)):
            rnd = rounds.get(rn)
            if not rnd:
                continue
            for item in questions:
                difficulty = MCQ_DIFFICULTY[rn].get(item["title"], item["difficulty"])
                marks = MCQ_MARKS[difficulty]
                seconds = MCQ_TIME_LIMIT_SECONDS[difficulty]
                q = db.query(AssessmentQuestion).filter(
                    AssessmentQuestion.round_id == rnd.id,
                    AssessmentQuestion.title == item["title"]
                ).first()
                if q:
                    if (q.difficulty, q.marks, q.time_limit_seconds) != (difficulty, marks, seconds):
                        backup.append({"question_id": q.id, "field": "difficulty/marks/time_limit_seconds",
                                       "old": [q.difficulty, q.marks, q.time_limit_seconds], "new": [difficulty, marks, seconds]})
                        q.difficulty, q.marks, q.time_limit_seconds = difficulty, marks, seconds
                        counts["mcq_relabelled"] += 1
                    continue
                q = AssessmentQuestion(
                    round_id=rnd.id,
                    competency_id=comp_ids.get(item["competency"]),
                    question_type=item["question_type"],
                    title=item["title"],
                    candidate_content=item["content"],
                    options_json=item["options"],
                    difficulty=difficulty,
                    marks=marks,
                    time_limit_seconds=seconds,
                    version=1,
                    status="Active"
                )
                db.add(q)
                db.flush()
                db.add(QuestionEvaluationConfig(
                    question_id=q.id,
                    evaluation_type="ExactMatch",
                    correct_answer=item["correct"],
                    scoring_rules_json={"case_sensitive": False}
                ))
                counts["mcq_created"] += 1

        # 2. Debugging round settings
        debugging = rounds.get(4)
        if debugging:
            if (debugging.questions_per_attempt, debugging.duration_minutes) != (DEBUG_QUESTIONS_PER_ATTEMPT, NEW_DEBUG_MINUTES):
                backup.append({"round_id": debugging.id, "field": "questions_per_attempt/duration_minutes",
                               "old": [debugging.questions_per_attempt, debugging.duration_minutes],
                               "new": [DEBUG_QUESTIONS_PER_ATTEMPT, NEW_DEBUG_MINUTES]})
                debugging.questions_per_attempt = DEBUG_QUESTIONS_PER_ATTEMPT
                debugging.duration_minutes = NEW_DEBUG_MINUTES
                counts["round_settings"] += 1
            now = datetime.datetime.utcnow()
            for req in db.query(AssessmentActivationRequest).filter(
                AssessmentActivationRequest.domain_id == domain.id,
                AssessmentActivationRequest.status == "APPROVED",
                AssessmentActivationRequest.valid_until > now
            ):
                durations = dict(req.approved_round_durations_json or {})
                if durations.get(str(debugging.id)) == OLD_DEBUG_MINUTES:
                    backup.append({"activation_request_id": req.id, "field": "approved_round_durations_json",
                                   "old": dict(req.approved_round_durations_json), "new": {**durations, str(debugging.id): NEW_DEBUG_MINUTES}})
                    durations[str(debugging.id)] = NEW_DEBUG_MINUTES
                    req.approved_round_durations_json = durations
                    flag_modified(req, "approved_round_durations_json")
                    counts["activation_durations"] += 1

        if dry_run:
            db.rollback()
        else:
            if backup:
                os.makedirs(BACKUP_DIR, exist_ok=True)
                stamp = datetime.datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")
                path = os.path.join(BACKUP_DIR, f"c_track_rebalance_{stamp}.json")
                with open(path, "w") as fh:
                    json.dump(backup, fh, indent=2, default=str)
                counts["backup_file"] = path
            db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

    # 3. Coding and debugging banks (each seed commits on its own)
    if not dry_run:
        seed_c_coding_60()
        seed_c_debugging()
    counts["dry_run"] = dry_run
    return counts


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    print(json.dumps(run(args.dry_run), indent=2))
