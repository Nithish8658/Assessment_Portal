import os
import sys

# Ensure path resolution
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.database import SessionLocal
from app.models.models import StudentProfile, User
from app.models.assessment_models import (
    AssessmentDomain,
    AssessmentRound,
    AssessmentPolicy,
    Competency,
    AssessmentQuestion,
    QuestionEvaluationConfig,
    QuestionVersion,
    AssessmentActivationRequest,
    AssessmentStudentAllocation,
    AssessmentAttempt,
    AttemptQuestionSnapshot,
    AssessmentResponse,
    CodingSubmission,
    CompetencyScore,
    AssessmentResult
)

def run_validation():
    print("=" * 80)
    print("MIGRATION INTEGRITY & RELATIONAL VALIDATION SUITE")
    print("=" * 80)

    db = SessionLocal()
    errors = []

    try:
        # Check 1: Domains Count == 3
        dom_count = db.query(AssessmentDomain).count()
        print(f"1. Assessment Domains Count: {dom_count} / 3")
        if dom_count != 3:
            errors.append(f"Domain count mismatch: expected 3, got {dom_count}")
        else:
            print("   [OK] Passed")

        # Check 2: Rounds Count == 13
        round_count = db.query(AssessmentRound).count()
        print(f"2. Assessment Rounds Count: {round_count} / 13")
        if round_count != 13:
            errors.append(f"Round count mismatch: expected 13, got {round_count}")
        else:
            print("   [OK] Passed")

        # Check 3: Active Competencies Count == 53
        comp_count = db.query(Competency).count()
        print(f"3. Active Competencies Count: {comp_count} / 53")
        if comp_count != 53:
            errors.append(f"Competencies count mismatch: expected 53, got {comp_count}")
        else:
            print("   [OK] Passed")

        # Check 4: Seeded Questions Count == 101
        q_count = db.query(AssessmentQuestion).count()
        print(f"4. Seeded Question Bank Count: {q_count} / 101")
        if q_count != 101:
            errors.append(f"Question count mismatch: expected 101, got {q_count}")
        else:
            print("   [OK] Passed")

        # Check 5: Evaluation Configs exist for 100% of questions
        cfg_count = db.query(QuestionEvaluationConfig).count()
        print(f"5. Question Evaluation Configs: {cfg_count} / 101")
        if cfg_count != 101:
            errors.append(f"Evaluation configs mismatch: expected 101, got {cfg_count}")
        else:
            print("   [OK] Passed")

        # Check 6: Question Versions exist for 100% of questions
        q_with_versions = db.query(QuestionVersion.question_id).distinct().count()
        print(f"6. Questions with Immutable Version Snapshots: {q_with_versions} / 101")
        if q_with_versions != 101:
            errors.append(f"Question version coverage mismatch: expected 101, got {q_with_versions}")
        else:
            print("   [OK] Passed")

        # Check 7: Zero Orphaned Allocations
        allocations = db.query(AssessmentStudentAllocation).all()
        orphaned_allocs = 0
        for a in allocations:
            if not a.request or not a.student:
                orphaned_allocs += 1
        print(f"7. Orphaned Student Allocations: {orphaned_allocs}")
        if orphaned_allocs > 0:
            errors.append(f"Found {orphaned_allocs} orphaned student allocations.")
        else:
            print("   [OK] Passed")

        # Check 8: Zero Orphaned Attempts & Domain Alignment
        attempts = db.query(AssessmentAttempt).all()
        orphaned_attempts = 0
        domain_mismatches = 0
        for att in attempts:
            if not att.allocation or not att.round:
                orphaned_attempts += 1
                continue
            if att.round.domain_id != att.allocation.request.domain_id:
                domain_mismatches += 1

        print(f"8. Orphaned Attempts: {orphaned_attempts}, Domain Mismatches: {domain_mismatches}")
        if orphaned_attempts > 0:
            errors.append(f"Found {orphaned_attempts} orphaned attempts.")
        if domain_mismatches > 0:
            errors.append(f"Found {domain_mismatches} attempts with round-domain mismatch.")
        if orphaned_attempts == 0 and domain_mismatches == 0:
            print("   [OK] Passed")

        # Check 9: Results reference exactly 1 attempt
        results = db.query(AssessmentResult).all()
        orphaned_results = sum(1 for r in results if not r.attempt)
        print(f"9. Orphaned Results: {orphaned_results}")
        if orphaned_results > 0:
            errors.append(f"Found {orphaned_results} orphaned results.")
        else:
            print("   [OK] Passed")

    except Exception as e:
        errors.append(f"Exception during validation: {e}")
    finally:
        db.close()

    print("\n" + "-" * 80)
    if errors:
        print("[ERROR] VALIDATION FAILED WITH THE FOLLOWING ERRORS:")
        for err in errors:
            print(f"  - {err}")
        print("-" * 80)
        sys.exit(1)
    else:
        print("[OK] 100% RELATIONAL INTEGRITY AND QUANTITATIVE VALIDATION PASSED!")
        print("-" * 80)

if __name__ == "__main__":
    run_validation()
