"""
Database Cleanup Script: Clear All Active Assessments
Cleans up all active assessment sessions, activation requests, student allocations,
and attempt records from PostgreSQL, leaving core master data (Domains, Rounds,
Questions, Evaluation Configs, Classes, and Users) completely intact.
"""

from app.database import SessionLocal
from app.models.assessment_models import (
    AssessmentActivationRequest,
    AssessmentActivationCandidate,
    AssessmentStudentAllocation,
    AssessmentAttempt,
    AssessmentResponse,
    AttemptQuestionSnapshot,
    CodingSubmission,
    CodeExecutionResult,
    CompetencyScore,
    AssessmentResult,
    AssessmentReattemptRequest
)

def clear_active_assessments():
    db = SessionLocal()
    try:
        print("[INFO] Initiating deletion of all active assessment records...")

        # 1. Delete code execution results and submissions
        ce_count = db.query(CodeExecutionResult).delete(synchronize_session=False)
        cs_count = db.query(CodingSubmission).delete(synchronize_session=False)

        # 2. Delete competency scores and results
        comp_count = db.query(CompetencyScore).delete(synchronize_session=False)
        ar_count = db.query(AssessmentResult).delete(synchronize_session=False)

        # 3. Delete responses and question snapshots
        resp_count = db.query(AssessmentResponse).delete(synchronize_session=False)
        snap_count = db.query(AttemptQuestionSnapshot).delete(synchronize_session=False)

        # 4. Delete reattempt requests and attempts
        reattempt_count = db.query(AssessmentReattemptRequest).delete(synchronize_session=False)
        attempt_count = db.query(AssessmentAttempt).delete(synchronize_session=False)

        # 5. Delete student allocations
        alloc_count = db.query(AssessmentStudentAllocation).delete(synchronize_session=False)

        # 6. Delete activation candidates and activation requests
        cand_count = db.query(AssessmentActivationCandidate).delete(synchronize_session=False)
        req_count = db.query(AssessmentActivationRequest).delete(synchronize_session=False)

        db.commit()

        print("\n=======================================================")
        print(">>> ACTIVE ASSESSMENT RECORDS CLEARED SUCCESSFULLY <<<")
        print("=======================================================")
        print(f"• Deleted AssessmentActivationRequests: {req_count}")
        print(f"• Deleted AssessmentActivationCandidates: {cand_count}")
        print(f"• Deleted AssessmentStudentAllocations: {alloc_count}")
        print(f"• Deleted AssessmentAttempts: {attempt_count}")
        print(f"• Deleted AssessmentReattemptRequests: {reattempt_count}")
        print(f"• Deleted AttemptQuestionSnapshots: {snap_count}")
        print(f"• Deleted AssessmentResponses: {resp_count}")
        print(f"• Deleted CompetencyScores: {comp_count}")
        print(f"• Deleted AssessmentResults: {ar_count}")
        print(f"• Deleted CodingSubmissions: {cs_count}")
        print(f"• Deleted CodeExecutionResults: {ce_count}")
        print("=======================================================\n")

        # Verification query
        remaining_reqs = db.query(AssessmentActivationRequest).count()
        remaining_attempts = db.query(AssessmentAttempt).count()
        remaining_allocs = db.query(AssessmentStudentAllocation).count()
        print(f"[VERIFY] Remaining Activation Requests in DB: {remaining_reqs}")
        print(f"[VERIFY] Remaining Student Allocations in DB: {remaining_allocs}")
        print(f"[VERIFY] Remaining Attempts in DB: {remaining_attempts}")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Failed to clear active assessments: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    clear_active_assessments()
