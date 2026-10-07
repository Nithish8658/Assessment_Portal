from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional

from app.database import get_db
from app.models.models import User
from app.models.assessment_models import (
    AssessmentDomain,
    AssessmentRound,
    AssessmentPolicy,
    AssessmentQuestion,
    QuestionEvaluationConfig
)
from app.schemas.assessment_schemas import AdminQuestionResponse, DomainDetailResponse, RoundSummaryResponse
from app.auth.jwt import get_current_user, require_roles

router = APIRouter(prefix="/api/v1/assessment/admin", tags=["Assessment Administration & Track Customizer"])

class UpdateRoundConfigRequest(BaseModel):
    duration_minutes: Optional[int] = Field(default=None, gt=0)
    questions_per_attempt: Optional[int] = None
    passing_score: Optional[float] = None
    weightage_percent: Optional[float] = None
    rules_json: Optional[Dict[str, Any]] = None

@router.put("/rounds/{round_id}", response_model=RoundSummaryResponse)
def update_round_config(
    round_id: int,
    data: UpdateRoundConfigRequest,
    current_user: User = Depends(require_roles(["Administrator", "Assessment Coordinator"])),
    db: Session = Depends(get_db)
):
    round_obj = db.query(AssessmentRound).filter(AssessmentRound.id == round_id).first()
    if not round_obj:
        raise HTTPException(status_code=404, detail="Round not found.")

    if data.duration_minutes is not None:
        round_obj.duration_minutes = data.duration_minutes
    if data.questions_per_attempt is not None:
        round_obj.questions_per_attempt = data.questions_per_attempt
    if data.rules_json is not None:
        round_obj.rules_json = data.rules_json

    policy = round_obj.policy
    if not policy:
        policy = AssessmentPolicy(round_id=round_obj.id)
        db.add(policy)

    if data.passing_score is not None:
        policy.passing_score = data.passing_score
    if data.weightage_percent is not None:
        policy.weightage_percent = data.weightage_percent

    db.commit()
    db.refresh(round_obj)

    return RoundSummaryResponse(
        id=round_obj.id,
        domain_id=round_obj.domain_id,
        round_number=round_obj.round_number,
        slug=round_obj.slug,
        title=round_obj.title,
        description=round_obj.description,
        round_type=round_obj.round_type,
        duration_minutes=round_obj.duration_minutes,
        questions_per_attempt=round_obj.questions_per_attempt,
        passing_score=policy.passing_score,
        weightage_percent=policy.weightage_percent,
        rules=round_obj.rules_json or {}
    )

@router.get("/rounds/{round_id}/questions", response_model=List[AdminQuestionResponse])
def get_admin_round_questions(
    round_id: int,
    current_user: User = Depends(require_roles(["Administrator", "Assessment Coordinator", "Class Tutor", "HoD"])),
    db: Session = Depends(get_db)
):
    questions = db.query(AssessmentQuestion).filter(AssessmentQuestion.round_id == round_id).all()
    res = []
    for q in questions:
        cfg = q.evaluation_config
        res.append(AdminQuestionResponse(
            id=q.id,
            round_id=q.round_id,
            competency_id=q.competency_id,
            question_type=q.question_type,
            title=q.title,
            candidate_content=q.candidate_content,
            candidate_code_template=q.candidate_code_template,
            options_json=q.options_json,
            difficulty=q.difficulty,
            marks=q.marks,
            time_limit_seconds=q.time_limit_seconds,
            version=q.version,
            status=q.status,
            evaluation_type=cfg.evaluation_type if cfg else None,
            correct_answer=cfg.correct_answer if cfg else None,
            reference_solution=cfg.reference_solution if cfg else None,
            public_test_cases=cfg.public_test_cases_json if cfg else [],
            hidden_test_cases=cfg.hidden_test_cases_json if cfg else [],
            scoring_rules=cfg.scoring_rules_json if cfg else {}
        ))
    return res
