import datetime
from typing import Dict, Any, List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.models import User, StudentProfile, Notification
from app.models.assessment_models import (
    AssessmentAttempt,
    AssessmentRound,
    AssessmentStudentAllocation,
    AssessmentResponse,
    AssessmentReattemptRequest
)
from app.services.assessment.authorization import verify_student_can_start_round
from app.services.assessment.attempt_service import attempt_service
from app.services.assessment.evaluation_service import evaluation_service
from app.services.assessment.timing import attempt_timing, freeze_attempt_deadline, as_utc_naive

class AssessmentOrchestrator:
    """Coordinates attempt start, question snapshot delivery, autosave, and submission."""

    def start_round(self, student_id: int, round_id: int, db: Session, allocation_id: Optional[int] = None) -> Dict[str, Any]:
        # 1. Authorize via Two-Layer engine
        allocation = verify_student_can_start_round(student_id, round_id, db, allocation_id=allocation_id)
        round_obj = db.query(AssessmentRound).filter(AssessmentRound.id == round_id).first()

        # 2. Check for existing attempt (deterministic resume or re-attempt creation)
        existing_attempt = db.query(AssessmentAttempt).filter(
            AssessmentAttempt.allocation_id == allocation.id,
            AssessmentAttempt.round_id == round_obj.id
        ).order_by(AssessmentAttempt.attempt_number.desc()).first()

        if existing_attempt:
            if existing_attempt.status == "IN_PROGRESS":
                # Return the original deadline, including zero remaining time.
                # The runner finalizes expired attempts using their saved answers.
                attempt = existing_attempt
            elif existing_attempt.status == "SUBMITTED":
                # Retry finalization after an execution service outage; never reopen answers.
                attempt = existing_attempt
            elif existing_attempt.status == "EVALUATED":
                # Check for approved tutor grace grant
                approved_req = db.query(AssessmentReattemptRequest).filter(
                    AssessmentReattemptRequest.allocation_id == allocation.id,
                    AssessmentReattemptRequest.round_id == round_obj.id,
                    AssessmentReattemptRequest.status == "APPROVED"
                ).order_by(AssessmentReattemptRequest.id.desc()).first()

                if approved_req:
                    next_attempt_num = approved_req.attempt_number or (existing_attempt.attempt_number + 1)
                    
                    # Check if an attempt for this attempt_number already exists
                    current_granted_attempt = db.query(AssessmentAttempt).filter(
                        AssessmentAttempt.allocation_id == allocation.id,
                        AssessmentAttempt.round_id == round_obj.id,
                        AssessmentAttempt.attempt_number == next_attempt_num
                    ).first()

                    if not current_granted_attempt:
                        attempt = attempt_service.create_attempt_with_snapshot(
                            allocation.id, round_obj.id, db, attempt_number=next_attempt_num
                        )
                        approved_req.status = "CONSUMED"
                        db.commit()
                    elif current_granted_attempt.status in ["SUBMITTED", "EVALUATED"]:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail="This assessment round is already evaluated. Contact your Class Tutor if a grace attempt is required."
                        )
                    else:
                        attempt = current_granted_attempt
                else:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="This assessment round has already been evaluated. Contact your Class Tutor to provide a grace attempt to restart."
                    )
            else:
                attempt = existing_attempt
        else:
            attempt = attempt_service.create_attempt_with_snapshot(allocation.id, round_obj.id, db, attempt_number=1)

        # 3. Format candidate questions (hide correct answers & rubrics)
        candidate_questions = []
        snapshots_list = getattr(attempt, 'snapshots', []) or getattr(attempt, 'question_snapshots', [])
        for snap in snapshots_list:
            q_data = snap.snapshot_content_json or {}
            c_content = q_data.get("candidate_content") or q_data.get("content") or ""
            opts = q_data.get("options_json") or q_data.get("options") or []
            c_code = q_data.get("candidate_code_template") or q_data.get("code_template") or ""
            
            # Extract debug_hint and problem for debugging questions
            debug_hint = None
            problem = None
            if isinstance(opts, dict):
                debug_hint = opts.get("debug_hint")
                problem = opts.get("problem")
            if not debug_hint and isinstance(q_data, dict):
                debug_hint = q_data.get("debug_hint")
                problem = problem or q_data.get("problem")
            
            candidate_questions.append({
                "id": q_data.get("id", snap.question_id),
                "round_id": attempt.round_id,
                "question_id": q_data.get("id", snap.question_id),
                "question_type": q_data.get("question_type", "MCQ"),
                "title": q_data.get("title", "Question"),
                "content": c_content,
                "candidate_content": c_content,
                "code_template": c_code,
                "candidate_code_template": c_code,
                "options": opts,
                "options_json": opts,
                "debug_hint": debug_hint,
                "problem": problem,
                "marks": q_data.get("marks", 1.0),
                "difficulty": q_data.get("difficulty", "Medium"),
                "time_limit_seconds": q_data.get("time_limit_seconds", 60)
            })

        # Calculate time remaining
        timing = attempt_timing(attempt)
        db.commit()

        # Retrieve saved answers
        saved_responses = db.query(AssessmentResponse).filter(
            AssessmentResponse.attempt_id == attempt.id
        ).all()
        saved_answers_map = {
            str(r.question_id): (r.response_payload if r.response_payload is not None else "")
            for r in saved_responses
        }

        policy = round_obj.policy
        passing_score = policy.passing_score if policy else 60.0

        return {
            "attempt_id": attempt.id,
            "allocation_id": allocation.id,
            "domain_slug": round_obj.domain.slug,
            "round_id": round_obj.id,
            "round_number": round_obj.round_number,
            "round_title": round_obj.title,
            "round_type": round_obj.round_type,
            "questions_per_attempt": len(candidate_questions),
            "passing_score": passing_score,
            "rules": round_obj.rules_json or {},
            "questions": candidate_questions,
            "saved_answers": saved_answers_map,
            **timing
        }

    def submit_and_evaluate(self, attempt_id: int, student_id: int, db: Session) -> Dict[str, Any]:
        attempt = db.query(AssessmentAttempt).filter(AssessmentAttempt.id == attempt_id).populate_existing().with_for_update().first()
        if not attempt:
            raise HTTPException(status_code=404, detail="Attempt not found.")

        if attempt.allocation.student_id != student_id:
            raise HTTPException(status_code=403, detail="Unauthorized: You do not own this attempt.")

        if attempt.status == "EVALUATED" and attempt.result:
            return evaluation_service.result_payload(attempt, db)

        if attempt.submitted_at is None:
            now = as_utc_naive(datetime.datetime.utcnow())
            deadline = freeze_attempt_deadline(attempt)
            attempt.submitted_at = min(now, deadline)

        round_obj = attempt.round
        r_type = getattr(round_obj, "round_type", None)
        BATCH_EVALUATED_ROUND_TYPES = {"CODING", "DEBUGGING", "PYTHON_PRACTICAL"}
        if round_obj and r_type in BATCH_EVALUATED_ROUND_TYPES and attempt.status != "EVALUATED":
            attempt.status = "SUBMITTED"
            attempt.evaluation_status = "PENDING_BATCH"
            db.commit()

            snapshots = getattr(attempt, 'snapshots', []) or getattr(attempt, 'question_snapshots', [])
            calc_max = sum(float((s.snapshot_content_json or {}).get("marks", 10.0)) for s in snapshots) if snapshots else 30.0
            domain_slug = getattr(round_obj.domain, "slug", "c-programming-track") if getattr(round_obj, "domain", None) else "c-programming-track"

            return {
                "attempt_id": attempt.id,
                "round_id": getattr(round_obj, "id", None),
                "domain_slug": domain_slug,
                "round_number": getattr(round_obj, "round_number", 1),
                "round_title": getattr(round_obj, "title", "Technical Assessment Round"),
                "round_type": r_type,
                "total_score": 0.0,
                "max_score": calc_max,
                "percentage": 0.0,
                "passed": False,
                "readiness_index": 0.0,
                "status": "SUBMITTED",
                "evaluation_status": "PENDING_BATCH",
                "message": "Your technical assessment has been submitted successfully. Code solutions and defect fixes will be evaluated via AI in the upcoming scheduled batch.",
                "evaluated_at": None,
                "competencies": [],
                "strengths": [],
                "gaps": []
            }

        attempt.status = "EVALUATING"
        db.commit()

        # Trigger automated evaluation
        eval_res = evaluation_service.evaluate_attempt(attempt, db)

        # Notify Student of Evaluation Result
        student_user_id = attempt.allocation.student.user_id if (attempt.allocation and attempt.allocation.student) else None
        round_title = attempt.round.title if attempt.round else "Round"
        domain_title = attempt.round.domain.title if (attempt.round and attempt.round.domain) else "Assessment Track"
        score_pct = eval_res.get("percentage", 0.0)
        passed_str = "PASSED" if eval_res.get("passed", False) else "NEEDS IMPROVEMENT"

        if student_user_id:
            # Avoid duplicate notifications for same attempt evaluation
            existing_note = db.query(Notification).filter(
                Notification.user_id == student_user_id,
                Notification.title == f"Evaluation Result: {round_title}"
            ).first()

            if not existing_note:
                db.add(Notification(
                    user_id=student_user_id,
                    title=f"Evaluation Result: {round_title}",
                    message=f"Your submission for {domain_title} - {round_title} was evaluated: Score {score_pct}% ({passed_str}).",
                    type="success" if eval_res.get("passed", False) else "info"
                ))
                db.commit()

        return eval_res

orchestrator = AssessmentOrchestrator()
