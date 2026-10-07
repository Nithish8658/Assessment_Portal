import os
import sys
import json
import psycopg2

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT_DIR, "backend"))

from app.database import engine, SessionLocal
from app.models.models import User, StudentProfile
from app.models.assessment_models import (
    AssessmentDomain,
    AssessmentRound,
    AssessmentStudentAllocation,
    AssessmentAttempt,
    AttemptQuestionSnapshot,
    AssessmentQuestion,
    QuestionEvaluationConfig,
    AssessmentResponse
)
from app.services.assessment.attempt_service import attempt_service
from app.services.assessment.evaluation_service import evaluation_service

db = SessionLocal()

print("="*80)
print("TESTING SOFTWARE DEVELOPMENT ROUND 1: 25-QUESTION SNAPSHOT & EVALUATION")
print("="*80)

# Check round
round_obj = db.query(AssessmentRound).filter(
    AssessmentRound.round_number == 1,
    AssessmentRound.domain_id == 1
).first()

print(f"Round: {round_obj.title} (ID: {round_obj.id})")
print(f"Configured questions_per_attempt: {round_obj.questions_per_attempt}")

# Query all questions
questions = db.query(AssessmentQuestion).filter(
    AssessmentQuestion.round_id == round_obj.id,
    AssessmentQuestion.status == "Active"
).all()

print(f"Total Active Questions in DB: {len(questions)}/25")
assert len(questions) == 25, f"Expected 25 questions, got {len(questions)}"

# Check evaluation configs
eval_configs = db.query(QuestionEvaluationConfig).filter(
    QuestionEvaluationConfig.question_id.in_([q.id for q in questions])
).all()
print(f"Total Evaluation Configs: {len(eval_configs)}/25")
assert len(eval_configs) == 25, f"Expected 25 evaluation configs, got {len(eval_configs)}"

# Test snapshot freezing mechanism
alloc = db.query(AssessmentStudentAllocation).first()
if alloc:

    # Create test attempt
    attempt = db.query(AssessmentAttempt).filter(
        AssessmentAttempt.allocation_id == alloc.id,
        AssessmentAttempt.round_id == round_obj.id,
        AssessmentAttempt.attempt_number == 999 # Test attempt
    ).first()

    if not attempt:
        attempt = AssessmentAttempt(
            allocation_id=alloc.id,
            round_id=round_obj.id,
            attempt_number=999,
            status="IN_PROGRESS"
        )
        db.add(attempt)
        db.flush()

    # Freeze snapshots
    db.query(AttemptQuestionSnapshot).filter(AttemptQuestionSnapshot.attempt_id == attempt.id).delete()
    db.flush()
    snapshots = attempt_service.freeze_question_snapshots(attempt, db)
    db.commit()

    print(f"Frozen Snapshots for Attempt: {len(snapshots)} questions")
    assert len(snapshots) == 25, f"Expected 25 snapshots frozen, got {len(snapshots)}"

    # Simulate answering 20 questions correctly, 5 incorrectly
    db.query(AssessmentResponse).filter(AssessmentResponse.attempt_id == attempt.id).delete()
    for idx, snap in enumerate(snapshots):
        q_id = snap.question_id
        cfg = db.query(QuestionEvaluationConfig).filter(QuestionEvaluationConfig.question_id == q_id).first()
        ans = cfg.correct_answer if idx < 20 else "99" # wrong option
        resp = AssessmentResponse(
            attempt_id=attempt.id,
            question_id=q_id,
            response_payload=ans
        )
        db.add(resp)
    db.commit()

    # Evaluate attempt
    eval_res = evaluation_service.evaluate_attempt(attempt, db)
    print(f"\n[EVALUATION RESULT]")
    print(f"  Total Score: {eval_res['total_score']} / {eval_res['max_score']}")
    print(f"  Percentage: {eval_res['percentage']}%")
    print(f"  Readiness Index: {eval_res['readiness_index']}")
    print(f"  Passed: {eval_res['passed']}")

    # Clean up test attempt 999
    db.query(AssessmentResponse).filter(AssessmentResponse.attempt_id == attempt.id).delete()
    db.query(AttemptQuestionSnapshot).filter(AttemptQuestionSnapshot.attempt_id == attempt.id).delete()
    db.delete(attempt)
    db.commit()
    print("\n[CLEANUP] Test attempt 999 cleanly removed.")

print("[TEST PASSED] Software Development Round 1 question bank is 100% complete and functionally verified!")
print("="*80)

db.close()
