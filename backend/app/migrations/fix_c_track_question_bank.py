"""
Migration: fix candidate-facing content in the C & Systems Programming track.

1. Round 3 (Coding): starter templates were identical to the reference solutions.
   They are replaced with skeletons (signatures + TODO stubs). Prompts and test data
   stored literal "\\n" sequences; these become real newlines.
2. Round 4 (Debugging): the hint was embedded in the prompt text. It is removed from
   the prompt (it stays in options_json and is only sent after the candidate reveals it).
3. Round 1: question titled "Arithmetic Progression Series" is a geometric series.
4. Difficulty labels follow app/services/assessment/c_track_curation.py (MCQ marks and
   pacing follow difficulty; four heavy coding problems become "Expert").
5. Hints are removed entirely: the debug_hint copy is dropped from options_json
   (the defect stays grader-side in the evaluation config).
6. Coding round time 45 -> 60 minutes, including still-active approved activations
   whose frozen duration is the old 45-minute default.

Idempotent. Writes a JSON backup of every changed field before committing.

Usage (from backend/):
    python -m app.migrations.fix_c_track_question_bank --dry-run
    python -m app.migrations.fix_c_track_question_bank
"""

import argparse
import datetime
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from sqlalchemy.orm.attributes import flag_modified

from app.models.assessment_models import AssessmentActivationRequest
from app.services.assessment.c_track_curation import (
    CODING_DIFFICULTY_OVERRIDES,
    DEBUG_DIFFICULTY_OVERRIDES,
    MCQ_DIFFICULTY,
    MCQ_MARKS,
    MCQ_TIME_LIMIT_SECONDS,
    number_from_title,
)

from app.database import SessionLocal
from app.models.assessment_models import (
    AssessmentDomain,
    AssessmentRound,
    AssessmentQuestion,
    QuestionEvaluationConfig,
)
from app.services.assessment.c_question_content import (
    make_c_starter_template,
    strip_debug_hint,
    unescape_text,
)

DOMAIN_SLUG = "c-programming-track"
OLD_CODING_MINUTES = 45
NEW_CODING_MINUTES = 60
BACKUP_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backups")


def _norm(code):
    return re.sub(r"\s+", "", code or "")


def run(dry_run: bool) -> dict:
    db = SessionLocal()
    backup = []
    counts = {"coding_templates": 0, "coding_prompts": 0, "coding_tests": 0, "debug_prompts": 0, "titles": 0,
              "difficulty_labels": 0, "debug_hint_options": 0, "round_duration": 0, "activation_durations": 0}
    try:
        domain = db.query(AssessmentDomain).filter(AssessmentDomain.slug == DOMAIN_SLUG).first()
        if not domain:
            raise SystemExit(f"Domain {DOMAIN_SLUG} not found")
        rounds = {r.round_number: r for r in db.query(AssessmentRound).filter(AssessmentRound.domain_id == domain.id)}

        def record(q, field, old, new):
            backup.append({"question_id": q.id, "title": q.title, "field": field, "old": old, "new": new})

        # 1. Coding round
        coding = rounds.get(3)
        if coding:
            for q in db.query(AssessmentQuestion).filter(AssessmentQuestion.round_id == coding.id, AssessmentQuestion.status == "Active"):
                cfg = db.query(QuestionEvaluationConfig).filter(QuestionEvaluationConfig.question_id == q.id).first()
                solution = cfg.reference_solution if cfg else None
                if solution and _norm(q.candidate_code_template) == _norm(solution):
                    new_tpl = make_c_starter_template(solution)
                    record(q, "candidate_code_template", q.candidate_code_template, new_tpl)
                    q.candidate_code_template = new_tpl
                    counts["coding_templates"] += 1
                new_content = unescape_text(q.candidate_content)
                if new_content != q.candidate_content:
                    record(q, "candidate_content", q.candidate_content, new_content)
                    q.candidate_content = new_content
                    counts["coding_prompts"] += 1
                if cfg:
                    for field in ("public_test_cases_json", "hidden_test_cases_json"):
                        old = getattr(cfg, field) or []
                        new = unescape_text(old)
                        if new != old:
                            record(q, f"eval_config.{field}", old, new)
                            setattr(cfg, field, new)
                            flag_modified(cfg, field)
                            counts["coding_tests"] += 1

        # 2. Debugging round
        debugging = rounds.get(4)
        if debugging:
            for q in db.query(AssessmentQuestion).filter(AssessmentQuestion.round_id == debugging.id, AssessmentQuestion.status == "Active"):
                new_content = strip_debug_hint(q.candidate_content)
                if new_content != q.candidate_content:
                    record(q, "candidate_content", q.candidate_content, new_content)
                    q.candidate_content = new_content
                    counts["debug_prompts"] += 1

        # 3. Aptitude title
        aptitude = rounds.get(1)
        if aptitude:
            q = db.query(AssessmentQuestion).filter(
                AssessmentQuestion.round_id == aptitude.id,
                AssessmentQuestion.title == "Arithmetic Progression Series",
            ).first()
            if q and "3, 6, 12, 24, 48" in (q.candidate_content or ""):
                record(q, "title", q.title, "Geometric Progression Series")
                q.title = "Geometric Progression Series"
                counts["titles"] += 1

        # 4. Curated difficulty labels
        db.flush()
        for rn, rnd in rounds.items():
            for q in db.query(AssessmentQuestion).filter(AssessmentQuestion.round_id == rnd.id, AssessmentQuestion.status == "Active"):
                target = None
                if rn in MCQ_DIFFICULTY:
                    target = MCQ_DIFFICULTY[rn].get(q.title)
                elif rn == 3:
                    target = CODING_DIFFICULTY_OVERRIDES.get(number_from_title(q.title))
                elif rn == 4:
                    target = DEBUG_DIFFICULTY_OVERRIDES.get(number_from_title(q.title))
                if not target:
                    continue
                if q.difficulty != target:
                    record(q, "difficulty", q.difficulty, target)
                    q.difficulty = target
                    counts["difficulty_labels"] += 1
                if rn in MCQ_DIFFICULTY:
                    if q.marks != MCQ_MARKS[target]:
                        record(q, "marks", q.marks, MCQ_MARKS[target])
                        q.marks = MCQ_MARKS[target]
                    if q.time_limit_seconds != MCQ_TIME_LIMIT_SECONDS[target]:
                        record(q, "time_limit_seconds", q.time_limit_seconds, MCQ_TIME_LIMIT_SECONDS[target])
                        q.time_limit_seconds = MCQ_TIME_LIMIT_SECONDS[target]

        # 5. No hints: drop the hint copy from candidate-facing options
        if debugging:
            for q in db.query(AssessmentQuestion).filter(AssessmentQuestion.round_id == debugging.id):
                opts = q.options_json if isinstance(q.options_json, dict) else None
                if opts and "debug_hint" in opts:
                    new_opts = {k: v for k, v in opts.items() if k != "debug_hint"}
                    record(q, "options_json", opts, new_opts)
                    q.options_json = new_opts
                    flag_modified(q, "options_json")
                    counts["debug_hint_options"] += 1

        # 6. Coding round time
        if coding:
            if coding.duration_minutes == OLD_CODING_MINUTES:
                backup.append({"round_id": coding.id, "field": "duration_minutes", "old": coding.duration_minutes, "new": NEW_CODING_MINUTES})
                coding.duration_minutes = NEW_CODING_MINUTES
                counts["round_duration"] += 1
            now = datetime.datetime.utcnow()
            for req in db.query(AssessmentActivationRequest).filter(
                AssessmentActivationRequest.domain_id == domain.id,
                AssessmentActivationRequest.status == "APPROVED",
                AssessmentActivationRequest.valid_until > now
            ):
                durations = dict(req.approved_round_durations_json or {})
                if durations.get(str(coding.id)) == OLD_CODING_MINUTES:
                    backup.append({"activation_request_id": req.id, "field": "approved_round_durations_json",
                                   "old": dict(req.approved_round_durations_json), "new": {**durations, str(coding.id): NEW_CODING_MINUTES}})
                    durations[str(coding.id)] = NEW_CODING_MINUTES
                    req.approved_round_durations_json = durations
                    flag_modified(req, "approved_round_durations_json")
                    counts["activation_durations"] += 1

        if dry_run:
            db.rollback()
        else:
            if backup:
                os.makedirs(BACKUP_DIR, exist_ok=True)
                stamp = datetime.datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")
                path = os.path.join(BACKUP_DIR, f"c_track_question_bank_{stamp}.json")
                with open(path, "w") as fh:
                    json.dump(backup, fh, indent=2, default=str)
                counts["backup_file"] = path
            db.commit()
        counts["dry_run"] = dry_run
        return counts
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    print(json.dumps(run(args.dry_run), indent=2))
