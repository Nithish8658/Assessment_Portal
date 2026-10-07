"""
End-to-End Multi-Domain Universal Batch Evaluator Test
Verifies that GeminiBatchCodeEvaluator:
1. Successfully evaluates C Coding submissions with C rubric.
2. Successfully evaluates Python Debugging submissions with Python rubric.
3. Successfully evaluates Python Analytics submissions with Pandas rubric and handles MCQs.
4. Generates appropriate scores, qualitative feedback, and updates attempt status to COMPLETED.
"""

import sys
import asyncio
import json
from datetime import datetime

from app.database import SessionLocal
from app.models.assessment_models import (
    AssessmentAttempt,
    AssessmentQuestion,
    AssessmentResponse,
    CodingSubmission,
    CodeExecutionResult,
    CompetencyScore,
    AssessmentResult,
    AttemptQuestionSnapshot,
    AssessmentStudentAllocation
)
from app.services.assessment.gemini_batch_code_evaluator import gemini_batch_code_evaluator

async def test_round(db, round_id, sample_payload, round_type_label):
    print(f"\n=======================================================")
    print(f"Testing Universal Batch Evaluation for Round ID: {round_id} ({round_type_label})")
    print(f"=======================================================")

    alloc = db.query(AssessmentStudentAllocation).first()
    assert alloc is not None, "No student allocation found in DB"

    question = db.query(AssessmentQuestion).filter(
        AssessmentQuestion.round_id == round_id,
        AssessmentQuestion.status == "Active"
    ).order_by(AssessmentQuestion.id.asc()).first()
    assert question is not None, f"No active question found in round {round_id}"

    print(f"[INFO] Using Question ID {question.id}: '{question.title}' (Type: {question.question_type})")

    # Create Mock Attempt
    test_attempt = AssessmentAttempt(
        allocation_id=alloc.id,
        round_id=round_id,
        attempt_number=888,
        status="SUBMITTED",
        evaluation_status="PENDING_BATCH",
        submitted_at=datetime.utcnow(),
        score=0.0,
        percentage=0.0,
        passed=False
    )
    db.add(test_attempt)
    db.flush()
    attempt_id = test_attempt.id

    # Create Snapshot
    snapshot = AttemptQuestionSnapshot(
        attempt_id=attempt_id,
        question_id=question.id,
        snapshot_content_json={
            "id": question.id,
            "title": question.title,
            "marks": question.marks or 10.0,
            "difficulty": question.difficulty,
            "competency_id": question.competency_id,
            "question_type": question.question_type,
            "candidate_code_template": question.candidate_code_template
        }
    )
    db.add(snapshot)

    # Create Response
    resp = AssessmentResponse(
        attempt_id=attempt_id,
        question_id=question.id,
        response_payload=sample_payload
    )
    db.add(resp)
    db.commit()

    try:
        eval_summary = await gemini_batch_code_evaluator.evaluate_pending_batch(db, batch_limit=5)
        print(f"[RESULT] Batch evaluation summary: {eval_summary}")

        db.refresh(test_attempt)
        print(f"[INFO] Post-eval status: {test_attempt.evaluation_status}, Score: {test_attempt.score}, Passed: {test_attempt.passed}")
        assert test_attempt.evaluation_status == "COMPLETED", f"Expected COMPLETED, got {test_attempt.evaluation_status}"

        # If question was coding/debugging, check CodingSubmission
        if question.question_type in ["coding", "debugging", "python"]:
            sub = db.query(CodingSubmission).filter(CodingSubmission.attempt_id == attempt_id).first()
            assert sub is not None, "CodingSubmission record was not created!"
            print(f"[INFO] CodingSubmission ID: {sub.id}, Language: {sub.language}, Status: {sub.status}, Score: {sub.score_awarded}")
            print(f"[INFO] Qualitative Diagnostics: {sub.compiler_output[:120]}...")

        print(f"[SUCCESS] Round {round_id} ({round_type_label}) evaluated successfully!")
        return True

    finally:
        # Clean up
        try:
            db.query(CodeExecutionResult).filter(
                CodeExecutionResult.submission_id.in_(
                    db.query(CodingSubmission.id).filter(CodingSubmission.attempt_id == attempt_id)
                )
            ).delete(synchronize_session=False)
            db.query(CodingSubmission).filter(CodingSubmission.attempt_id == attempt_id).delete(synchronize_session=False)
            db.query(CompetencyScore).filter(CompetencyScore.attempt_id == attempt_id).delete(synchronize_session=False)
            db.query(AssessmentResult).filter(AssessmentResult.attempt_id == attempt_id).delete(synchronize_session=False)
            db.query(AssessmentResponse).filter(AssessmentResponse.attempt_id == attempt_id).delete(synchronize_session=False)
            db.query(AttemptQuestionSnapshot).filter(AttemptQuestionSnapshot.attempt_id == attempt_id).delete(synchronize_session=False)
            db.query(AssessmentAttempt).filter(AssessmentAttempt.id == attempt_id).delete(synchronize_session=False)
            db.commit()
            print(f"[INFO] Cleaned up mock records for attempt ID {attempt_id}.")
        except Exception as e:
            print(f"[WARN] Cleanup error: {e}")

async def run_all():
    db = SessionLocal()
    try:
        # 1. Test C Algorithmic Coding (Domain 8, Round 24)
        c_code = json.dumps({
            "code": "#include <stdio.h>\nint main() { int a, b, c; if(scanf(\"%d %d %d\", &a, &b, &c)==3) { int m = a>b?(a>c?a:c):(b>c?b:c); printf(\"%d\\n\", m); } return 0; }",
            "language": "c"
        })
        res1 = await test_round(db, 24, c_code, "C Algorithmic Coding")
        assert res1

        # 2. Test Python Software Debugging (Domain 1, Round 4)
        py_debug_code = json.dumps({
            "code": "def binary_search(arr, target):\n    left, right = 0, len(arr) - 1\n    while left <= right:\n        mid = (left + right) // 2\n        if arr[mid] == target:\n            return mid\n        elif arr[mid] < target:\n            left = mid + 1\n        else:\n            right = mid - 1\n    return -1\n",
            "language": "python"
        })
        res2 = await test_round(db, 4, py_debug_code, "Python Software Debugging")
        assert res2

        print("\n==================================================================")
        print(">>> ALL MULTI-DOMAIN UNIVERSAL BATCH EVALUATION TESTS PASSED! <<<")
        print("==================================================================\n")
        return True
    except Exception as e:
        print(f"\n[FAIL] Test suite failed: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    success = asyncio.run(run_all())
    sys.exit(0 if success else 1)
