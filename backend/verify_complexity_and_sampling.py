import random
from app.database import SessionLocal
from app.models.assessment_models import (
    AssessmentDomain,
    AssessmentRound,
    AssessmentQuestion,
    AssessmentActivationRequest,
    AssessmentStudentAllocation,
    AssessmentAttempt,
    AttemptQuestionSnapshot,
    AssessmentResponse,
    QuestionEvaluationConfig
)
from app.services.assessment.attempt_service import AttemptService
from app.services.assessment.evaluation_service import EvaluationService

def run_tests():
    db = SessionLocal()
    attempt_service = AttemptService()
    eval_service = EvaluationService()

    try:
        print("=" * 60)
        print("RUNNING END-TO-END VERIFICATION SUITE")
        print("=" * 60)

        # 1. Verify Domain 1 Renaming
        dom1 = db.query(AssessmentDomain).filter(AssessmentDomain.id == 1).first()
        assert dom1 is not None, "Domain 1 must exist"
        print(f"[TEST 1] Domain 1: title='{dom1.title}', slug='{dom1.slug}'")
        assert dom1.title == "Software Developer", f"Expected 'Software Developer', got '{dom1.title}'"
        assert dom1.slug == "software-developer", f"Expected 'software-developer', got '{dom1.slug}'"
        print("[PASS] Domain 1 is correctly named 'Software Developer'!")

        # 2. Verify Question Bank 3-Tier Distribution
        print("\n[TEST 2] Verifying 3-tier difficulty distribution in Question Bank...")
        rounds = db.query(AssessmentRound).order_by(AssessmentRound.id).all()
        for r in rounds:
            q_count = db.query(AssessmentQuestion).filter(
                AssessmentQuestion.round_id == r.id,
                AssessmentQuestion.status == "Active"
            ).count()
            if q_count >= 3:
                easy_c = db.query(AssessmentQuestion).filter(AssessmentQuestion.round_id == r.id, AssessmentQuestion.difficulty == "Easy").count()
                med_c = db.query(AssessmentQuestion).filter(AssessmentQuestion.round_id == r.id, AssessmentQuestion.difficulty == "Medium").count()
                hard_c = db.query(AssessmentQuestion).filter(AssessmentQuestion.round_id == r.id, AssessmentQuestion.difficulty == "Hard").count()
                assert easy_c > 0 and med_c > 0 and hard_c > 0, f"Round {r.id} missing tier! (E:{easy_c}, M:{med_c}, H:{hard_c})"
                print(f"   Round {r.id} ({r.title[:35]}...): Total={q_count} -> Easy:{easy_c}, Medium:{med_c}, Hard:{hard_c}")
        print("[PASS] All question bank rounds have active questions across all 3 tiers (Easy, Medium, Hard)!")

        # 3. Test Random Sampling & 7-Question Cap across all Complexity Levels
        print("\n[TEST 3] Testing dynamic random sampling (Cap <= 7) across complexity levels...")

        # Find or create a test allocation linked to Domain 1
        alloc = db.query(AssessmentStudentAllocation).first()
        assert alloc is not None, "At least one allocation should exist"
        req = alloc.request
        round1 = db.query(AssessmentRound).filter(AssessmentRound.domain_id == 1, AssessmentRound.round_number == 1).first()
        assert round1 is not None

        for test_complexity in ["Balanced", "Easy", "Medium", "Hard"]:
            req.complexity_level = test_complexity
            db.commit()

            # Create mock attempt to freeze snapshots
            attempt = AssessmentAttempt(
                allocation_id=alloc.id,
                round_id=round1.id,
                attempt_number=random.randint(5000, 99999),
                status="IN_PROGRESS"
            )
            db.add(attempt)
            db.flush()

            snaps = attempt_service.freeze_question_snapshots(attempt, db)
            q_ids = [s.question_id for s in snaps]
            diffs = [s.snapshot_content_json["difficulty"] for s in snaps]

            assert len(snaps) == 7, f"Expected exactly 7 questions, got {len(snaps)}"
            print(f"   [Complexity: {test_complexity:8}] Selected {len(snaps)} Qs -> Difficulties: {diffs}")

            if test_complexity == "Easy":
                assert diffs.count("Easy") >= 5, f"Easy complexity should have primarily Easy questions, got {diffs}"
            elif test_complexity == "Hard":
                assert diffs.count("Hard") >= 5, f"Hard complexity should have primarily Hard questions, got {diffs}"
            elif test_complexity == "Balanced":
                assert diffs.count("Easy") >= 2 and diffs.count("Medium") >= 2 and diffs.count("Hard") >= 2, f"Balanced should have mix, got {diffs}"

            # Clean up test attempt
            db.query(AttemptQuestionSnapshot).filter(AttemptQuestionSnapshot.attempt_id == attempt.id).delete()
            db.delete(attempt)
            db.commit()

        print("[PASS] 7-question cap and complexity-level sampling verified!")

        # 4. Verify Random Variation Across Multiple Attempts
        print("\n[TEST 4] Testing random variation across multiple successive attempts...")
        req.complexity_level = "Balanced"
        db.commit()

        attempt_a = AssessmentAttempt(allocation_id=alloc.id, round_id=round1.id, attempt_number=88881, status="IN_PROGRESS")
        attempt_b = AssessmentAttempt(allocation_id=alloc.id, round_id=round1.id, attempt_number=88882, status="IN_PROGRESS")
        db.add_all([attempt_a, attempt_b])
        db.flush()

        snaps_a = attempt_service.freeze_question_snapshots(attempt_a, db)
        snaps_b = attempt_service.freeze_question_snapshots(attempt_b, db)

        q_ids_a = [s.question_id for s in snaps_a]
        q_ids_b = [s.question_id for s in snaps_b]

        print(f"   Attempt A Question IDs: {q_ids_a}")
        print(f"   Attempt B Question IDs: {q_ids_b}")
        assert q_ids_a != q_ids_b, "Two consecutive attempts must be randomly sampled!"
        print("[PASS] Consecutive attempts produce distinct randomized sets of questions!")

        # 5. Verify Frozen Evaluation Snapshot Integrity & Deterministic Grading
        print("\n[TEST 5] Testing frozen evaluation snapshot integrity and grading...")
        sample_snap = snaps_a[0]
        snap_data = sample_snap.snapshot_content_json
        assert "eval_config" in snap_data, "Snapshot must contain eval_config"
        frozen_correct = snap_data["eval_config"]["correct_answer"]
        print(f"   Sample Question '{snap_data['title'][:30]}...' -> Frozen Correct Answer: '{frozen_correct}'")

        # Submit correct answer response
        resp = AssessmentResponse(
            attempt_id=attempt_a.id,
            question_id=sample_snap.question_id,
            response_payload=frozen_correct
        )
        db.add(resp)
        db.flush()

        eval_res = eval_service.evaluate_attempt(attempt_a, db)
        print(f"   Evaluation Result: Score={eval_res['total_score']}, Max={eval_res['max_score']}, Percentage={eval_res['percentage']}%")
        assert eval_res["total_score"] > 0, "Correct answer must score marks!"
        print("[PASS] Evaluation correctly scored against frozen snapshot evaluation config!")

        # Clean up test attempts
        db.query(AssessmentResponse).filter(AssessmentResponse.attempt_id.in_([attempt_a.id, attempt_b.id])).delete()
        db.query(AttemptQuestionSnapshot).filter(AttemptQuestionSnapshot.attempt_id.in_([attempt_a.id, attempt_b.id])).delete()
        db.delete(attempt_a)
        db.delete(attempt_b)
        db.commit()

        print("\n" + "=" * 60)
        print("ALL 5 VERIFICATION SUITES PASSED FLAWLESSLY!")
        print("=" * 60)

    finally:
        db.close()

if __name__ == "__main__":
    run_tests()
