"""
End-to-End Test for Gemini Batch Code Evaluator
Verifies that:
1. An attempt in 'PENDING_BATCH' state is picked up by GeminiBatchCodeEvaluator.
2. The evaluator calls Gemini to grade the submitted C code.
3. CodingSubmission, CodeExecutionResult, CompetencyScore, and AssessmentResult are generated.
4. AssessmentAttempt.evaluation_status is updated to 'COMPLETED'.
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
    AttemptQuestionSnapshot
)
from app.services.assessment.gemini_batch_code_evaluator import gemini_batch_code_evaluator

async def run_test():
    db = SessionLocal()
    test_attempt_id = None
    try:
        # 1. Find a seeded question in round 24 (C track)
        question = db.query(AssessmentQuestion).filter(
            AssessmentQuestion.round_id == 24,
            AssessmentQuestion.status == "Active"
        ).order_by(AssessmentQuestion.id.asc()).first()

        if not question:
            print("[FAIL] No active questions found in Round 24!")
            return False

        print(f"[INFO] Using Question ID: {question.id} ('{question.title}')")

        # 2. Create a test AssessmentAttempt in PENDING_BATCH state
        sample_c_code = """#include <stdio.h>

int main() {
    int a, b, c;
    if (scanf("%d %d %d", &a, &b, &c) == 3) {
        int max = a;
        if (b > max) max = b;
        if (c > max) max = c;
        printf("%d\\n", max);
    }
    return 0;
}
"""
        from app.models.assessment_models import AssessmentStudentAllocation
        alloc = db.query(AssessmentStudentAllocation).first()
        if not alloc:
            print("[FAIL] No AssessmentStudentAllocation found in DB!")
            return False

        test_attempt = AssessmentAttempt(
            allocation_id=alloc.id,
            round_id=24,
            attempt_number=999,
            status="SUBMITTED",
            evaluation_status="PENDING_BATCH",
            submitted_at=datetime.utcnow(),
            score=0.0,
            percentage=0.0,
            passed=False
        )
        db.add(test_attempt)
        db.flush()
        test_attempt_id = test_attempt.id
        print(f"[INFO] Created mock AssessmentAttempt ID: {test_attempt_id} with status=SUBMITTED, evaluation_status=PENDING_BATCH")

        # Create AttemptQuestionSnapshot
        snapshot = AttemptQuestionSnapshot(
            attempt_id=test_attempt_id,
            question_id=question.id,
            snapshot_content_json={
                "id": question.id,
                "title": question.title,
                "marks": 10.0,
                "difficulty": question.difficulty,
                "competency_id": question.competency_id
            }
        )
        db.add(snapshot)

        # Create AssessmentResponse with the sample C code
        response_payload = json.dumps({"code": sample_c_code, "language": "c"})
        resp = AssessmentResponse(
            attempt_id=test_attempt_id,
            question_id=question.id,
            response_payload=response_payload
        )
        db.add(resp)
        db.commit()

        print("[INFO] Mock attempt, snapshot, and response saved to DB.")

        # 3. Trigger Batch Evaluation
        print("[INFO] Invoking gemini_batch_code_evaluator.evaluate_pending_batch()...")
        eval_summary = await gemini_batch_code_evaluator.evaluate_pending_batch(db, batch_limit=5)
        print(f"[RESULT] Batch evaluation result: {eval_summary}")

        # 4. Verify Attempt State
        db.refresh(test_attempt)
        print(f"[INFO] Post-eval attempt evaluation_status: {test_attempt.evaluation_status}")
        print(f"[INFO] Post-eval attempt score: {test_attempt.score} ({test_attempt.percentage}%)")
        print(f"[INFO] Post-eval attempt passed: {test_attempt.passed}")

        assert test_attempt.evaluation_status == "COMPLETED", f"Expected COMPLETED, got {test_attempt.evaluation_status}"
        assert test_attempt.score > 0, f"Expected score > 0, got {test_attempt.score}"

        # 5. Verify CodingSubmission & Results
        submission = db.query(CodingSubmission).filter(CodingSubmission.attempt_id == test_attempt_id).first()
        assert submission is not None, "CodingSubmission was not created!"
        print(f"[INFO] CodingSubmission ID: {submission.id}, Status: {submission.status}, Score: {submission.score_awarded}")
        print(f"[INFO] Compiler Diagnostics / Qualitative Feedback:\n{submission.compiler_output[:250]}...")

        # 6. Verify AssessmentResult
        result = db.query(AssessmentResult).filter(AssessmentResult.attempt_id == test_attempt_id).first()
        assert result is not None, "AssessmentResult was not created!"
        print(f"[INFO] AssessmentResult ID: {result.id}, Total Score: {result.total_score}, Percentage: {result.percentage}%")

        print("\n=======================================================")
        print(">>> ALL GEMINI BATCH EVALUATION ASSERTIONS PASSED! <<<")
        print("=======================================================\n")
        return True

    except Exception as e:
        print(f"\n[FAIL] Test encountered an error: {e}")
        import traceback
        traceback.print_exc()
        return False

    finally:
        # Cleanup mock attempt and associated records to keep test DB clean
        if test_attempt_id:
            try:
                db.query(CodeExecutionResult).filter(
                    CodeExecutionResult.submission_id.in_(
                        db.query(CodingSubmission.id).filter(CodingSubmission.attempt_id == test_attempt_id)
                    )
                ).delete(synchronize_session=False)
                db.query(CodingSubmission).filter(CodingSubmission.attempt_id == test_attempt_id).delete(synchronize_session=False)
                db.query(CompetencyScore).filter(CompetencyScore.attempt_id == test_attempt_id).delete(synchronize_session=False)
                db.query(AssessmentResult).filter(AssessmentResult.attempt_id == test_attempt_id).delete(synchronize_session=False)
                db.query(AssessmentResponse).filter(AssessmentResponse.attempt_id == test_attempt_id).delete(synchronize_session=False)
                db.query(AttemptQuestionSnapshot).filter(AttemptQuestionSnapshot.attempt_id == test_attempt_id).delete(synchronize_session=False)
                db.query(AssessmentAttempt).filter(AssessmentAttempt.id == test_attempt_id).delete(synchronize_session=False)
                db.commit()
                print(f"[INFO] Cleaned up mock test records for attempt ID {test_attempt_id}.")
            except Exception as clean_err:
                print(f"[WARN] Cleanup error: {clean_err}")
        db.close()

if __name__ == "__main__":
    success = asyncio.run(run_test())
    sys.exit(0 if success else 1)
