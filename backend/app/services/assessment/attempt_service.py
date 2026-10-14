import re
import datetime
import random
from typing import Dict, Any, List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.services.assessment.timing import freeze_attempt_deadline, require_open_attempt

from app.models.assessment_models import (

    AssessmentAttempt,
    AssessmentStudentAllocation,
    AttemptQuestionSnapshot,
    AssessmentResponse,
    AssessmentQuestion,
    QuestionVersion,
    QuestionEvaluationConfig
)


# Question-bank reference codes ("Q43: ", "D04: ", "R1-Q01: ", "Q1.3: ") are for staff; students see the plain title
_TITLE_CODE = re.compile(r"^(?:[A-Z]\d+-)?[A-Z]{1,2}\d+(?:\.\d+)?:\s+")


def candidate_title(title):
    return _TITLE_CODE.sub("", title or "", count=1) or title

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
            # Keep the stored analytics profile current ("in progress" status).
            from app.services.assessment.competency_profiles import refresh_for_attempt
            refresh_for_attempt(db, attempt.id)
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

        # Questions this student has already been shown in earlier attempts of this round
        # (any allocation). On a retake these are placed last in every pool, so repeats
        # are used only when a difficulty tier has no unseen questions left.
        student_id = attempt.allocation.student_id if attempt.allocation else None
        seen_ids = set()
        if student_id is not None:
            seen_rows = db.query(AttemptQuestionSnapshot.question_id).join(
                AssessmentAttempt, AttemptQuestionSnapshot.attempt_id == AssessmentAttempt.id
            ).join(
                AssessmentStudentAllocation, AssessmentAttempt.allocation_id == AssessmentStudentAllocation.id
            ).filter(
                AssessmentStudentAllocation.student_id == student_id,
                AssessmentAttempt.round_id == attempt.round_id,
                AssessmentAttempt.id != attempt.id
            ).all()
            seen_ids = {row[0] for row in seen_rows}

        def prefer_unseen(pool):
            unseen = [q for q in pool if q.id not in seen_ids]
            seen = [q for q in pool if q.id in seen_ids]
            random.shuffle(unseen)
            random.shuffle(seen)
            return unseen + seen

        easy_pool = prefer_unseen([q for q in all_questions if q.difficulty == "Easy"])
        # Any unrecognised label is treated as Medium so no question silently drops out.
        medium_pool = prefer_unseen([q for q in all_questions if q.difficulty not in ("Easy", "Hard", "Expert")])
        hard_pool = [q for q in all_questions if q.difficulty == "Hard"]
        # "Expert" problems are too long for a Balanced/Easy/Medium time budget; they are
        # drawn only when the tutor chose Hard, or as a last resort if the bank runs short.
        expert_pool = [q for q in all_questions if q.difficulty == "Expert"]
        if complexity == "Hard":
            hard_pool = prefer_unseen(hard_pool + expert_pool)
            expert_pool = []
        else:
            hard_pool = prefer_unseen(hard_pool)
            expert_pool = prefer_unseen(expert_pool)

        def take(pool, n, chosen):
            picked = [q for q in pool if q not in chosen][:max(0, n)]
            chosen.extend(picked)
            return picked

        selected_questions = []
        if complexity == "Easy":
            order = [easy_pool, medium_pool, hard_pool]
        elif complexity == "Medium":
            order = [medium_pool, easy_pool, hard_pool]
        elif complexity == "Hard":
            order = [hard_pool, medium_pool, easy_pool]
        else:
            order = None

        if order:
            for pool in order:
                take(pool, max_limit - len(selected_questions), selected_questions)
        else:  # Balanced (or default)
            if max_limit == 2:
                target_easy, target_med, target_hard = 1, 1, 0
            elif max_limit == 7:
                target_easy, target_med, target_hard = 2, 3, 2
            else:
                n_each = max_limit // 3
                rem = max_limit % 3
                target_easy, target_med, target_hard = n_each, n_each + rem, n_each
            take(easy_pool, target_easy, selected_questions)
            take(medium_pool, target_med, selected_questions)
            take(hard_pool, target_hard, selected_questions)
            # Backfill any tier shortfall, unseen questions first.
            if len(selected_questions) < max_limit:
                take(prefer_unseen(easy_pool + medium_pool + hard_pool), max_limit - len(selected_questions), selected_questions)

        # Last resort: the bank is too small without Expert problems.
        if len(selected_questions) < max_limit:
            take(expert_pool, max_limit - len(selected_questions), selected_questions)

        # Shuffle so question order varies between candidates.
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
                "title": candidate_title(q.title),
                "candidate_content": q.candidate_content,
                "candidate_code_template": q.candidate_code_template,
                "options_json": q.options_json,
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
