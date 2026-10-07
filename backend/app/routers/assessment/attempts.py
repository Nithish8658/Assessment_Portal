from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional

from app.database import get_db
from app.models.models import User, StudentProfile
from app.models.assessment_models import (
    AssessmentAttempt,
    AssessmentResult,
    CompetencyScore,
    AssessmentRound,
    AssessmentStudentAllocation
)
from app.schemas.assessment_schemas import (
    StartAttemptRequest,
    StartAttemptResponse,
    SaveResponseRequest,
    SaveAnswersBulkRequest,
    SubmitAttemptRequest,
    CandidateResultResponse
)
from app.auth.jwt import get_current_user
from app.services.assessment.orchestrator import orchestrator
from app.services.assessment.attempt_service import attempt_service
from app.services.assessment.authorization import validate_question_belongs_to_attempt
from app.services.assessment.scoring_service import scoring_service
from app.services.assessment.timing import attempt_timing

router = APIRouter(prefix="/api/v1/assessment/attempts", tags=["Assessment Attempts & Lifecycle"])

@router.post("/start", response_model=StartAttemptResponse)
def start_attempt(
    data: StartAttemptRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    student_id = current_user.student_profile.id if current_user.student_profile else None
    if not student_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only authenticated candidates with an active student profile can start assessment attempts."
        )

    attempt_payload = orchestrator.start_round(
        student_id=student_id,
        round_id=data.round_id,
        db=db,
        allocation_id=data.allocation_id
    )
    return StartAttemptResponse(**attempt_payload)

@router.post("/save-response")
def save_response(
    data: SaveResponseRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    student_id = current_user.student_profile.id if current_user.student_profile else None
    if not student_id:
        raise HTTPException(status_code=403, detail="Student profile required.")

    # Invariant: Question must belong to attempt's round
    attempt, question = validate_question_belongs_to_attempt(data.attempt_id, data.question_id, db)
    if attempt.allocation.student_id != student_id:
        raise HTTPException(status_code=403, detail="Unauthorized attempt access.")

    resp = attempt_service.save_response(
        attempt_id=data.attempt_id,
        question_id=data.question_id,
        response_payload=data.response_payload,
        is_marked_for_review=getattr(data, "is_marked_for_review", False),
        db=db
    )
    return {
        "status": "saved",
        "question_id": resp.question_id,
        "auto_saved_at": resp.auto_saved_at.isoformat()
    }

@router.post("/save-answers")
def save_answers_bulk(
    data: SaveAnswersBulkRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    student_id = current_user.student_profile.id if current_user.student_profile else None
    if not student_id:
        raise HTTPException(status_code=403, detail="Student profile required.")

    saved_count = 0
    for ans in data.answers:
        attempt, question = validate_question_belongs_to_attempt(data.attempt_id, ans.question_id, db)
        if attempt.allocation.student_id != student_id:
            continue

        payload = ans.code if (ans.code and str(ans.code).strip().startswith("{")) else (ans.selected_option or ans.code or "")
        attempt_service.save_response(
            attempt_id=data.attempt_id,
            question_id=ans.question_id,
            response_payload=payload,
            is_marked_for_review=ans.is_marked_for_review,
            db=db
        )
        saved_count += 1

    return {
        "status": "saved",
        "saved_count": saved_count
    }

@router.post("/submit", response_model=CandidateResultResponse)
def submit_attempt(
    data: SubmitAttemptRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    student_id = current_user.student_profile.id if current_user.student_profile else None
    if not student_id:
        raise HTTPException(status_code=403, detail="Student profile required.")

    eval_result = orchestrator.submit_and_evaluate(
        attempt_id=data.attempt_id,
        student_id=student_id,
        db=db
    )
    return CandidateResultResponse(**eval_result)

@router.post("/{attempt_id}/submit", response_model=CandidateResultResponse)
def submit_attempt_by_path(
    attempt_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    student_id = current_user.student_profile.id if current_user.student_profile else None
    if not student_id:
        raise HTTPException(status_code=403, detail="Student profile required.")

    eval_result = orchestrator.submit_and_evaluate(
        attempt_id=attempt_id,
        student_id=student_id,
        db=db
    )
    return CandidateResultResponse(**eval_result)

@router.get("/{attempt_id}/timing")
def get_attempt_timing(attempt_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    attempt = db.query(AssessmentAttempt).filter(AssessmentAttempt.id == attempt_id).first()
    student_id = current_user.student_profile.id if current_user.student_profile else None
    if not attempt or attempt.allocation.student_id != student_id:
        raise HTTPException(404, "Attempt not found.")
    payload = attempt_timing(attempt)
    db.commit()
    return {"attempt_id": attempt.id, "status": attempt.status, **payload}


@router.get("/{attempt_id}/result", response_model=CandidateResultResponse)
def get_attempt_result(
    attempt_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    attempt = db.query(AssessmentAttempt).filter(AssessmentAttempt.id == attempt_id).first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found.")

    student_id = current_user.student_profile.id if current_user.student_profile else None
    user_roles = [r.name for r in current_user.roles]

    if attempt.allocation.student_id != student_id and "Administrator" not in user_roles and "Class Tutor" not in user_roles and "HoD" not in user_roles:
        raise HTTPException(status_code=403, detail="Unauthorized access to result.")

    result = attempt.result
    if not result:
        raise HTTPException(status_code=400, detail="Attempt has not been evaluated yet.")

    comp_scores = db.query(CompetencyScore).filter(CompetencyScore.attempt_id == attempt.id).all()
    comp_radar = []
    for cs in comp_scores:
        comp_radar.append({
            "competency_code": cs.competency.code if cs.competency else "COMP",
            "competency_name": cs.competency.name if cs.competency else "Competency",
            "category": cs.competency.category if cs.competency else "General",
            "score": cs.score,
            "max_score": cs.max_score,
            "percentage": cs.percentage,
            "readiness_level": cs.readiness_level
        })

    strengths, gaps = scoring_service.derive_strengths_and_gaps(comp_radar)
    round_obj = attempt.round

    return CandidateResultResponse(
        attempt_id=attempt.id,
        round_id=round_obj.id if round_obj else None,
        domain_slug=attempt.allocation.request.domain.slug if attempt.allocation and attempt.allocation.request and attempt.allocation.request.domain else "assessment",
        round_number=round_obj.round_number if round_obj else 1,
        round_title=round_obj.title if round_obj else "Assessment Round",
        round_type=round_obj.round_type if round_obj else "COGNITIVE_MCQ",
        total_score=result.total_score,
        max_score=result.max_score,
        percentage=result.percentage,
        passed=result.passed,
        readiness_index=result.readiness_index,
        competencies=comp_radar,
        strengths=strengths,
        gaps=gaps,
        evaluated_at=result.evaluated_at.isoformat() if result.evaluated_at else None
    )

@router.get("/round/{round_id}/latest-result", response_model=CandidateResultResponse)
def get_latest_round_result(
    round_id: int,
    allocation_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    student_id = current_user.student_profile.id if current_user.student_profile else None
    if not student_id:
        raise HTTPException(status_code=403, detail="Student profile required.")

    # Find candidate's latest evaluated attempt for this round
    q = db.query(AssessmentAttempt).join(
        AssessmentStudentAllocation, AssessmentAttempt.allocation_id == AssessmentStudentAllocation.id
    ).filter(
        AssessmentStudentAllocation.student_id == student_id,
        AssessmentAttempt.round_id == round_id,
        AssessmentAttempt.status == "EVALUATED"
    )

    if allocation_id:
        q = q.filter(AssessmentAttempt.allocation_id == allocation_id)

    attempt = q.order_by(AssessmentAttempt.id.desc()).first()

    if not attempt:
        raise HTTPException(status_code=404, detail="No evaluated attempt found for this round.")

    result = attempt.result
    if not result:
        raise HTTPException(status_code=400, detail="Attempt has not been evaluated yet.")

    comp_scores = db.query(CompetencyScore).filter(CompetencyScore.attempt_id == attempt.id).all()
    comp_radar = []
    for cs in comp_scores:
        comp_radar.append({
            "competency_code": cs.competency.code if cs.competency else "COMP",
            "competency_name": cs.competency.name if cs.competency else "Competency",
            "category": cs.competency.category if cs.competency else "General",
            "score": cs.score,
            "max_score": cs.max_score,
            "percentage": cs.percentage,
            "readiness_level": cs.readiness_level
        })

    strengths, gaps = scoring_service.derive_strengths_and_gaps(comp_radar)
    round_obj = attempt.round

    return CandidateResultResponse(
        attempt_id=attempt.id,
        round_id=round_obj.id if round_obj else round_id,
        domain_slug=attempt.allocation.request.domain.slug if attempt.allocation and attempt.allocation.request and attempt.allocation.request.domain else "assessment",
        round_number=round_obj.round_number if round_obj else 1,
        round_title=round_obj.title if round_obj else "Assessment Round",
        round_type=round_obj.round_type if round_obj else "COGNITIVE_MCQ",
        total_score=result.total_score,
        max_score=result.max_score,
        percentage=result.percentage,
        passed=result.passed,
        readiness_index=result.readiness_index,
        competencies=comp_radar,
        strengths=strengths,
        gaps=gaps,
        evaluated_at=result.evaluated_at.isoformat() if result.evaluated_at else None
    )
