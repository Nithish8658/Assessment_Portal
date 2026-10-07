import datetime
import random
from typing import Dict, Any, List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.services.assessment.timing import freeze_attempt_deadline, require_open_attempt

from app.models.assessment_models import (
    AssessmentAttempt,
    AttemptQuestionSnapshot,
    AssessmentResponse,
    AssessmentQuestion,
    QuestionVersion,
    QuestionEvaluationConfig
)

class AttemptService:
    """Manages question snapshot freezing and candidate response persistence."""

    def create_attempt_with_snapshot(self, allocation_id: int, round_id: int, db: Session, attempt_number: int = 1) -> AssessmentAttempt:
        """
        Creates a new AssessmentAttempt or resumes existing attempt, freezing question snapshots atomically.
        """
        existing = db.query(AssessmentAttempt).filter(
            AssessmentAttempt.allocation_id == allocation_id,
            AssessmentAttempt.round_id == round_id,
            AssessmentAttempt.attempt_number == attempt_number
        ).first()

        if existing:
            return existing

        try:
            attempt = AssessmentAttempt(
                allocation_id=allocation_id,
                round_id=round_id,
                attempt_number=attempt_number,
                status="IN_PROGRESS",
                started_at=datetime.datetime.utcnow()
            )
            db.add(attempt)
            db.flush()

            freeze_attempt_deadline(attempt)
            self.freeze_question_snapshots(attempt, db)
            db.commit()
            db.refresh(attempt)
            return attempt
        except Exception as e:
            db.rollback()
            fallback = db.query(AssessmentAttempt).filter(
                AssessmentAttempt.allocation_id == allocation_id,
                AssessmentAttempt.round_id == round_id,
                AssessmentAttempt.attempt_number == attempt_number
            ).first()
            if fallback:
                return fallback
            raise e

    def freeze_question_snapshots(self, attempt: AssessmentAttempt, db: Session) -> List[AttemptQuestionSnapshot]:
        """
        Creates immutable attempt-specific question snapshots.
        - Strict maximum cap of 7 questions per round.
        - Questions are randomly chosen each time from the question bank.
        - Complexity distribution adheres to tutor's chosen complexity_level (Balanced, Easy, Medium, Hard).
        - Frozen snapshots preserve exact questions, options, and evaluation configs for safe, tamper-proof evaluation.
        """
        round_obj = attempt.round
        # Cap strictly at maximum 7 questions per round
        max_limit = round_obj.questions_per_attempt if round_obj.questions_per_attempt else 2

        # Retrieve tutor's selected complexity level
        complexity = "Balanced"
        if attempt.allocation and attempt.allocation.request and attempt.allocation.request.complexity_level:
            complexity = attempt.allocation.request.complexity_level

        # Query all active questions for this round
        all_questions = db.query(AssessmentQuestion).filter(
            AssessmentQuestion.round_id == attempt.round_id,
            AssessmentQuestion.status == "Active"
        ).all()

        if len(all_questions) <= max_limit:
            selected_questions = list(all_questions)
            random.shuffle(selected_questions)
        else:
            easy_pool = [q for q in all_questions if q.difficulty == "Easy"]
            medium_pool = [q for q in all_questions if q.difficulty == "Medium"]
            hard_pool = [q for q in all_questions if q.difficulty == "Hard"]

            random.shuffle(easy_pool)
            random.shuffle(medium_pool)
            random.shuffle(hard_pool)

            selected_questions = []

            if complexity == "Easy":
                # Prioritize Easy questions first, then backfill from Medium, then Hard
                selected_questions.extend(easy_pool[:max_limit])
                needed = max_limit - len(selected_questions)
                if needed > 0:
                    selected_questions.extend(medium_pool[:needed])
                needed = max_limit - len(selected_questions)
                if needed > 0:
                    selected_questions.extend(hard_pool[:needed])

            elif complexity == "Medium":
                # Prioritize Medium questions first, then backfill from Easy, then Hard
                selected_questions.extend(medium_pool[:max_limit])
                needed = max_limit - len(selected_questions)
                if needed > 0:
                    selected_questions.extend(easy_pool[:needed])
                needed = max_limit - len(selected_questions)
                if needed > 0:
                    selected_questions.extend(hard_pool[:needed])

            elif complexity == "Hard":
                # Prioritize Hard questions first, then backfill from Medium, then Easy
                selected_questions.extend(hard_pool[:max_limit])
                needed = max_limit - len(selected_questions)
                if needed > 0:
                    selected_questions.extend(medium_pool[:needed])
                needed = max_limit - len(selected_questions)
                if needed > 0:
                    selected_questions.extend(easy_pool[:needed])

            else:  # Balanced (or default)
                if max_limit == 2:
                    target_easy, target_med, target_hard = 1, 1, 0
                elif max_limit == 7:
                    target_easy, target_med, target_hard = 2, 3, 2
                else:
                    n_each = max_limit // 3
                    rem = max_limit % 3
                    target_easy = n_each
                    target_med = n_each + rem
                    target_hard = n_each

                chosen_easy = easy_pool[:target_easy]
                chosen_med = medium_pool[:target_med]
                chosen_hard = hard_pool[:target_hard]

                selected_questions = chosen_easy + chosen_med + chosen_hard

                # Backfill if any tier lacked enough questions
                needed = max_limit - len(selected_questions)
                if needed > 0:
                    remaining_candidates = (
                        easy_pool[len(chosen_easy):] +
                        medium_pool[len(chosen_med):] +
                        hard_pool[len(chosen_hard):]
                    )
                    random.shuffle(remaining_candidates)
                    selected_questions.extend(remaining_candidates[:needed])

            # Final safety: shuffle selected questions so question order varies
            random.shuffle(selected_questions)
            selected_questions = selected_questions[:max_limit]

        snapshots = []
        for q in selected_questions:
            latest_v = db.query(QuestionVersion).filter(
                QuestionVersion.question_id == q.id
            ).order_by(QuestionVersion.version_num.desc()).first()

            eval_cfg = db.query(QuestionEvaluationConfig).filter(
                QuestionEvaluationConfig.question_id == q.id
            ).first()

            snapshot_payload = {
                "id": q.id,
                "title": q.title,
                "candidate_content": q.candidate_content,
                "candidate_code_template": q.candidate_code_template,
                "options_json": q.options_json,
                "debug_hint": q.options_json.get("debug_hint") if isinstance(q.options_json, dict) else None,
                "problem": q.options_json.get("problem") if isinstance(q.options_json, dict) else None,
                "marks": q.marks,
                "difficulty": q.difficulty,
                "time_limit_seconds": q.time_limit_seconds,
                "question_type": q.question_type,
                "competency_id": q.competency_id,
                "competency_code": q.competency.code if q.competency else None,
                "competency_name": q.competency.name if q.competency else None,
                "eval_config": {
                    "evaluation_type": eval_cfg.evaluation_type if eval_cfg else "ExactMatch",
                    "correct_answer": eval_cfg.correct_answer if eval_cfg else None,
                    "reference_solution": eval_cfg.reference_solution if eval_cfg else None,
                    "scoring_rules_json": eval_cfg.scoring_rules_json if eval_cfg else {},
                    "public_test_cases_json": eval_cfg.public_test_cases_json if eval_cfg else [],
                    "hidden_test_cases_json": eval_cfg.hidden_test_cases_json if eval_cfg else []
                } if eval_cfg else None
            }

            snap = AttemptQuestionSnapshot(
                attempt_id=attempt.id,
                question_id=q.id,
                question_version_id=latest_v.id if latest_v else None,
                snapshot_content_json=snapshot_payload
            )
            db.add(snap)
            snapshots.append(snap)

        db.flush()
        return snapshots

    def save_response(
        self,
        attempt_id: int,
        question_id: int,
        response_payload: Any,
        is_marked_for_review: bool,
        db: Session
    ) -> AssessmentResponse:
        """
        Idempotently saves candidate answers in real time.
        """
        # Serialize saves against submission, and enforce the deadline on the server.
        attempt = db.query(AssessmentAttempt).filter(
            AssessmentAttempt.id == attempt_id
        ).populate_existing().with_for_update().first()
        if not attempt:
            raise HTTPException(404, "Attempt not found.")
        require_open_attempt(attempt)
        resp = db.query(AssessmentResponse).filter(
            AssessmentResponse.attempt_id == attempt_id,
            AssessmentResponse.question_id == question_id
        ).first()

        str_payload = str(response_payload) if not isinstance(response_payload, str) else response_payload

        if resp:
            resp.response_payload = str_payload
            resp.is_marked_for_review = is_marked_for_review
            resp.auto_saved_at = datetime.datetime.utcnow()
        else:
            resp = AssessmentResponse(
                attempt_id=attempt_id,
                question_id=question_id,
                response_payload=str_payload,
                is_marked_for_review=is_marked_for_review
            )
            db.add(resp)

        db.commit()
        db.refresh(resp)
        return resp

attempt_service = AttemptService()
