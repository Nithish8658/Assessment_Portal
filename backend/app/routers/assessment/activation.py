from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload, selectinload
from typing import List, Optional, Dict, Any
import datetime

from app.database import get_db
from app.models.models import User, FacultyProfile, StudentProfile, AcademicClass, Programme
from app.models.assessment_models import (
    AssessmentActivationRequest,
    AssessmentActivationCandidate,
    AssessmentStudentAllocation,
    AssessmentAttempt,
    AssessmentRound,
    AssessmentReattemptRequest,
    AttemptQuestionSnapshot,
    AssessmentResponse,
    CodingSubmission,
    CodeExecutionResult,
    CompetencyScore,
    AssessmentResult
)
from app.schemas.assessment_schemas import (
    CreateActivationRequest,
    UpdateActivationRequest,
    ReviewActivationRequest,
    ActivationRequestResponse,
    TutorGrantAttemptRequest,
    RoundCandidateSummaryItem,
    DynamicRoundPerformanceResponse,
    ActivationRoundsPerformanceResponse
)
from app.auth.jwt import get_current_user
from app.services.assessment.timing import approval_durations, approval_round_timings, as_utc_naive
from app.services.assessment.allocation_service import (
    create_activation_request,
    review_activation_request_atomic
)

router = APIRouter(prefix="/api/v1/assessment/activation-requests", tags=["Assessment Activation Workflow"])

@router.post("", response_model=ActivationRequestResponse)
def submit_activation_request(
    data: CreateActivationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    req = create_activation_request(data, current_user, db)
    return ActivationRequestResponse(
        id=req.id,
        domain_id=req.domain_id,
        domain_title=req.domain.title if req.domain else "Domain",
        academic_class_id=req.academic_class_id,
        class_name=req.academic_class.name if req.academic_class else "Class",
        department_id=req.department_id,
        department_name=req.academic_class.programme.department.name if req.academic_class and req.academic_class.programme and req.academic_class.programme.department else None,
        programme_name=req.academic_class.programme.name if req.academic_class and req.academic_class.programme else None,
        batch_name=req.batch_name or "",
        section_name=req.section_name or "",
        requested_by_name=req.requested_by.full_name if req.requested_by else "Tutor",
        reviewed_by_name=req.reviewed_by.full_name if req.reviewed_by else None,
        status=req.status,
        complexity_level=req.complexity_level or "Balanced",
        candidate_count=len(req.candidates),
        selected_round_ids=req.selected_rounds_json,
        round_durations=approval_durations(req),
        round_timings=approval_round_timings(req),
        valid_from=req.valid_from.isoformat() + "Z",
        valid_until=req.valid_until.isoformat() + "Z",
        requested_at=req.requested_at.isoformat() + "Z",
        reviewed_at=(req.reviewed_at.isoformat() + "Z") if req.reviewed_at else None,
        rejection_reason=req.rejection_reason,
        notes=req.notes
    )

@router.get("", response_model=List[ActivationRequestResponse])
def get_activation_requests(
    status_filter: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_roles = [r.name for r in current_user.roles]
    if "Administrator" not in user_roles and "HoD" not in user_roles and "Class Tutor" not in user_roles and "Faculty" not in user_roles:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied: Students cannot access activation requests.")

    query = db.query(AssessmentActivationRequest).options(
        joinedload(AssessmentActivationRequest.domain),
        joinedload(AssessmentActivationRequest.academic_class).joinedload(AcademicClass.programme).joinedload(Programme.department),
        joinedload(AssessmentActivationRequest.requested_by),
        joinedload(AssessmentActivationRequest.reviewed_by),
        selectinload(AssessmentActivationRequest.candidates)
    )

    if "Administrator" not in user_roles:
        if "HoD" in user_roles:
            fp = current_user.faculty_profile
            if fp and fp.department_id:
                query = query.join(AcademicClass).join(AcademicClass.programme).filter(
                    AcademicClass.programme.has(department_id=fp.department_id)
                )
        elif "Class Tutor" in user_roles or "Faculty" in user_roles:
            # Strictly isolate to activations created by this specific tutor
            query = query.filter(AssessmentActivationRequest.requested_by_id == current_user.id)

    if status_filter:
        query = query.filter(AssessmentActivationRequest.status == status_filter)

    requests = query.order_by(AssessmentActivationRequest.id.desc()).all()
    res = []
    for req in requests:
        res.append(ActivationRequestResponse(
            id=req.id,
            domain_id=req.domain_id,
            domain_title=req.domain.title if req.domain else "Domain",
            academic_class_id=req.academic_class_id,
            class_name=req.academic_class.name if req.academic_class else "Class",
            department_id=req.department_id,
            department_name=req.academic_class.programme.department.name if req.academic_class and req.academic_class.programme and req.academic_class.programme.department else None,
            programme_name=req.academic_class.programme.name if req.academic_class and req.academic_class.programme else None,
            batch_name=req.batch_name or "",
            section_name=req.section_name or "",
            requested_by_name=req.requested_by.full_name if req.requested_by else "Tutor",
            reviewed_by_name=req.reviewed_by.full_name if req.reviewed_by else None,
            status=req.status,
            complexity_level=req.complexity_level or "Balanced",
            candidate_count=len(req.candidates),
            selected_round_ids=req.selected_rounds_json,
            round_durations=approval_durations(req),
            round_timings=approval_round_timings(req),
            valid_from=req.valid_from.isoformat() + "Z",
            valid_until=req.valid_until.isoformat() + "Z",
            requested_at=req.requested_at.isoformat() + "Z",
            reviewed_at=(req.reviewed_at.isoformat() + "Z") if req.reviewed_at else None,
            rejection_reason=req.rejection_reason,
            notes=req.notes
        ))
    return res

@router.get("/{id}", response_model=ActivationRequestResponse)
def get_activation_request_by_id(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    req = db.query(AssessmentActivationRequest).filter(AssessmentActivationRequest.id == id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Activation request not found.")

    user_roles = [r.name for r in current_user.roles]
    if "Administrator" not in user_roles:
        if "HoD" in user_roles:
            fp = current_user.faculty_profile
            if fp and fp.department_id and req.department_id != fp.department_id:
                raise HTTPException(status_code=403, detail="Unauthorized access to department activation.")
        elif "Class Tutor" in user_roles:
            if req.requested_by_id != current_user.id:
                raise HTTPException(status_code=403, detail="Unauthorized access to class activation.")

    candidates_list = []
    for c in req.candidates:
        s = c.student
        if s:
            candidates_list.append({
                "student_id": s.id,
                "user_id": s.user_id,
                "register_number": s.register_number,
                "full_name": s.user.full_name if s.user else "Student",
                "email": s.user.email if s.user else ""
            })

    return ActivationRequestResponse(
        id=req.id,
        domain_id=req.domain_id,
        domain_title=req.domain.title if req.domain else "Domain",
        academic_class_id=req.academic_class_id,
        class_name=req.academic_class.name if req.academic_class else "Class",
        department_id=req.department_id,
        department_name=req.academic_class.programme.department.name if req.academic_class and req.academic_class.programme and req.academic_class.programme.department else None,
        programme_name=req.academic_class.programme.name if req.academic_class and req.academic_class.programme else None,
        batch_name=req.batch_name or "",
        section_name=req.section_name or "",
        requested_by_name=req.requested_by.full_name if req.requested_by else "Tutor",
        reviewed_by_name=req.reviewed_by.full_name if req.reviewed_by else None,
        status=req.status,
        complexity_level=req.complexity_level or "Balanced",
        candidate_count=len(req.candidates),
        selected_round_ids=req.selected_rounds_json,
        round_durations=approval_durations(req),
        round_timings=approval_round_timings(req),
        valid_from=req.valid_from.isoformat() + "Z",
        valid_until=req.valid_until.isoformat() + "Z",
        requested_at=req.requested_at.isoformat() + "Z",
        reviewed_at=(req.reviewed_at.isoformat() + "Z") if req.reviewed_at else None,
        rejection_reason=req.rejection_reason,
        notes=req.notes,
        candidate_students=candidates_list
    )

@router.get("/{id}/rounds-roster", response_model=ActivationRoundsPerformanceResponse)
def get_activation_rounds_roster(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    req = db.query(AssessmentActivationRequest).filter(AssessmentActivationRequest.id == id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Activation request not found.")

    user_roles = [r.name for r in current_user.roles]
    if "Administrator" not in user_roles:
        if "HoD" in user_roles:
            fp = current_user.faculty_profile
            if fp and fp.department_id and req.department_id != fp.department_id:
                raise HTTPException(status_code=403, detail="Unauthorized access to department activation roster.")
        elif "Class Tutor" in user_roles or "Faculty" in user_roles:
            if req.requested_by_id != current_user.id:
                raise HTTPException(status_code=403, detail="Unauthorized access: You can only view performance for your own class activations.")
        else:
            raise HTTPException(status_code=403, detail="Access denied: Students cannot access tutor performance console.")

    domain = req.domain
    if not domain:
        raise HTTPException(status_code=404, detail="Domain for activation not found.")

    allocations = req.allocations or []
    candidate_students = []
    alloc_map = {}
    for alloc in allocations:
        s = alloc.student
        if s:
            candidate_students.append(s)
            alloc_map[s.id] = alloc.id

    dynamic_rounds_res = []
    selected_rids = req.selected_rounds_json if req.selected_rounds_json else None
    sorted_rounds = [r for r in sorted(domain.rounds, key=lambda x: x.round_number) if (not selected_rids or r.id in selected_rids)]

    for r in sorted_rounds:
        policy = r.policy
        passing_score = policy.passing_score if policy else 60.0

        passed_list = []
        failed_list = []
        pending_list = []

        for s in candidate_students:
            alloc_id = alloc_map.get(s.id, 0)
            # Find attempts for this allocation & round
            attempt = db.query(AssessmentAttempt).filter(
                AssessmentAttempt.allocation_id == alloc_id,
                AssessmentAttempt.round_id == r.id
            ).order_by(AssessmentAttempt.attempt_number.desc(), AssessmentAttempt.id.desc()).first()

            # Check if active approved grant exists
            active_grant = db.query(AssessmentReattemptRequest).filter(
                AssessmentReattemptRequest.allocation_id == alloc_id,
                AssessmentReattemptRequest.round_id == r.id,
                AssessmentReattemptRequest.status == "APPROVED"
            ).first()
            has_active_grant = bool(active_grant)

            item = RoundCandidateSummaryItem(
                student_id=s.id,
                register_number=s.register_number,
                full_name=s.user.full_name if s.user else "Student",
                email=s.user.email if s.user else "",
                allocation_id=alloc_id,
                score=attempt.score if attempt and attempt.status == "EVALUATED" else None,
                percentage=attempt.percentage if attempt and attempt.status == "EVALUATED" else None,
                status="NOT_STARTED",
                attempt_number=attempt.attempt_number if attempt else 1,
                has_active_grant=has_active_grant,
                evaluated_at=attempt.last_activity_at.isoformat() if attempt and attempt.status == "EVALUATED" else None
            )

            if attempt:
                if attempt.status == "EVALUATED":
                    if attempt.passed:
                        item.status = "PASSED"
                        passed_list.append(item)
                    else:
                        item.status = "FAILED"
                        failed_list.append(item)
                elif attempt.status in ["IN_PROGRESS", "SUBMITTED", "EVALUATING"]:
                    item.status = "IN_PROGRESS"
                    pending_list.append(item)
                else:
                    item.status = "NOT_STARTED"
                    pending_list.append(item)
            else:
                item.status = "NOT_STARTED"
                pending_list.append(item)

        dynamic_rounds_res.append(DynamicRoundPerformanceResponse(
            round_id=r.id,
            round_number=r.round_number,
            slug=r.slug,
            title=r.title,
            passing_score=passing_score,
            passed_count=len(passed_list),
            failed_count=len(failed_list),
            not_started_count=len(pending_list),
            passed_students=passed_list,
            failed_students=failed_list,
            pending_students=pending_list
        ))

    return ActivationRoundsPerformanceResponse(
        activation_id=req.id,
        domain_title=domain.title,
        class_name=req.academic_class.name if req.academic_class else "Class",
        batch_name=req.batch_name or "",
        section_name=req.section_name or "",
        total_candidates=len(candidate_students),
        rounds=dynamic_rounds_res
    )

@router.post("/grant-attempt")
def grant_tutor_attempt(
    data: TutorGrantAttemptRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    now = datetime.datetime.utcnow()
    granted_count = 0

    for sid in data.student_ids:
        # Resolve allocation
        alloc = db.query(AssessmentStudentAllocation).filter(
            AssessmentStudentAllocation.id == data.allocation_id,
            AssessmentStudentAllocation.student_id == sid
        ).first()

        if not alloc:
            # Try to lookup allocation by student_id & round's domain
            round_obj = db.query(AssessmentRound).filter(AssessmentRound.id == data.round_id).first()
            if round_obj:
                alloc = db.query(AssessmentStudentAllocation).join(
                    AssessmentActivationRequest, AssessmentStudentAllocation.request_id == AssessmentActivationRequest.id
                ).filter(
                    AssessmentStudentAllocation.student_id == sid,
                    AssessmentActivationRequest.domain_id == round_obj.domain_id
                ).order_by(AssessmentStudentAllocation.id.desc()).first()

        if not alloc:
            continue

        # Find latest attempt number
        latest_attempt = db.query(AssessmentAttempt).filter(
            AssessmentAttempt.allocation_id == alloc.id,
            AssessmentAttempt.round_id == data.round_id
        ).order_by(AssessmentAttempt.attempt_number.desc()).first()

        next_attempt_num = (latest_attempt.attempt_number + 1) if latest_attempt else 2

        # Check existing reattempt request
        reattempt_req = db.query(AssessmentReattemptRequest).filter(
            AssessmentReattemptRequest.allocation_id == alloc.id,
            AssessmentReattemptRequest.round_id == data.round_id,
            AssessmentReattemptRequest.student_id == sid
        ).first()

        if reattempt_req:
            reattempt_req.status = "APPROVED"
            reattempt_req.attempt_number = next_attempt_num
            reattempt_req.reviewed_by_id = current_user.id
            reattempt_req.reviewed_at = now
            reattempt_req.reason = data.reason or "Granted by Class Tutor"
        else:
            reattempt_req = AssessmentReattemptRequest(
                allocation_id=alloc.id,
                round_id=data.round_id,
                student_id=sid,
                requested_by_id=current_user.id,
                reviewed_by_id=current_user.id,
                status="APPROVED",
                attempt_number=next_attempt_num,
                reason=data.reason or "Granted by Class Tutor",
                created_at=now,
                reviewed_at=now
            )
            db.add(reattempt_req)

        granted_count += 1

    db.commit()
    return {
        "status": "success",
        "granted_count": granted_count,
        "message": f"Successfully granted round attempt to {granted_count} candidate(s)."
    }

@router.put("/{id}", response_model=ActivationRequestResponse)
def update_activation_request(
    id: int,
    data: UpdateActivationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    req = db.query(AssessmentActivationRequest).filter(AssessmentActivationRequest.id == id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Activation request not found.")

    user_roles = [r.name for r in current_user.roles]
    if "Administrator" not in user_roles:
        if "HoD" in user_roles:
            fp = current_user.faculty_profile
            if fp and fp.department_id and req.department_id != fp.department_id:
                raise HTTPException(status_code=403, detail="Unauthorized access to department activation.")
        elif "Class Tutor" in user_roles:
            if req.requested_by_id != current_user.id:
                raise HTTPException(status_code=403, detail="Unauthorized access to class activation.")

    if req.status == "APPROVED" and data.selected_round_ids is not None and set(data.selected_round_ids) != set(req.selected_rounds_json or [r.id for r in req.domain.rounds]):
        raise HTTPException(409, "Approved rounds and timings are frozen. Create a new request to change the rounds.")
    if data.status == "APPROVED" and req.status != "APPROVED":
        raise HTTPException(409, "Use the approval workflow to approve rounds and freeze their timings.")
    if data.valid_from is not None:
        req.valid_from = as_utc_naive(data.valid_from)
    if data.valid_until is not None:
        req.valid_until = as_utc_naive(data.valid_until)
    if data.notes is not None:
        req.notes = data.notes
    if data.selected_round_ids is not None:
        req.selected_rounds_json = data.selected_round_ids
    if data.status is not None:
        req.status = data.status

    # Synchronize child allocations validity
    for alloc in req.allocations:
        if data.valid_from is not None:
            alloc.valid_from = as_utc_naive(data.valid_from)
        if data.valid_until is not None:
            alloc.valid_until = as_utc_naive(data.valid_until)

    # If candidate students modified
    if data.candidate_student_ids is not None:
        db.query(AssessmentActivationCandidate).filter(AssessmentActivationCandidate.request_id == req.id).delete()
        for sid in data.candidate_student_ids:
            cand = AssessmentActivationCandidate(request_id=req.id, student_id=sid)
            db.add(cand)
            if req.status == "APPROVED":
                existing_alloc = db.query(AssessmentStudentAllocation).filter(
                    AssessmentStudentAllocation.request_id == req.id,
                    AssessmentStudentAllocation.student_id == sid
                ).first()
                if not existing_alloc:
                    alloc = AssessmentStudentAllocation(
                        request_id=req.id,
                        student_id=sid,
                        status="APPROVED",
                        valid_from=req.valid_from,
                        valid_until=req.valid_until
                    )
                    db.add(alloc)

    db.commit()
    db.refresh(req)

    return get_activation_request_by_id(req.id, current_user, db)

@router.delete("/{id}")
def delete_activation_request(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    req = db.query(AssessmentActivationRequest).filter(AssessmentActivationRequest.id == id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Activation request not found.")

    user_roles = [r.name for r in current_user.roles]
    if "Administrator" not in user_roles:
        if "HoD" in user_roles:
            fp = current_user.faculty_profile
            if fp and fp.department_id and req.department_id != fp.department_id:
                raise HTTPException(status_code=403, detail="Unauthorized to delete department activation.")
        elif "Class Tutor" in user_roles:
            if req.requested_by_id != current_user.id:
                raise HTTPException(status_code=403, detail="Unauthorized to delete class activation.")

    # Explicit cascade deletion of all child records in reverse dependency order
    alloc_rows = db.query(AssessmentStudentAllocation.id).filter(AssessmentStudentAllocation.request_id == id).all()
    alloc_ids = [a[0] for a in alloc_rows]

    if alloc_ids:
        # 1. Delete reattempt requests tied to these allocations
        db.query(AssessmentReattemptRequest).filter(AssessmentReattemptRequest.allocation_id.in_(alloc_ids)).delete(synchronize_session=False)

        # 2. Collect attempts tied to these allocations
        attempt_rows = db.query(AssessmentAttempt.id).filter(AssessmentAttempt.allocation_id.in_(alloc_ids)).all()
        attempt_ids = [att[0] for att in attempt_rows]

        if attempt_ids:
            # 3. Delete code execution results for coding submissions
            sub_rows = db.query(CodingSubmission.id).filter(CodingSubmission.attempt_id.in_(attempt_ids)).all()
            sub_ids = [s[0] for s in sub_rows]
            if sub_ids:
                db.query(CodeExecutionResult).filter(CodeExecutionResult.submission_id.in_(sub_ids)).delete(synchronize_session=False)

            # 4. Delete attempt child items
            db.query(CodingSubmission).filter(CodingSubmission.attempt_id.in_(attempt_ids)).delete(synchronize_session=False)
            db.query(AttemptQuestionSnapshot).filter(AttemptQuestionSnapshot.attempt_id.in_(attempt_ids)).delete(synchronize_session=False)
            db.query(AssessmentResponse).filter(AssessmentResponse.attempt_id.in_(attempt_ids)).delete(synchronize_session=False)
            db.query(CompetencyScore).filter(CompetencyScore.attempt_id.in_(attempt_ids)).delete(synchronize_session=False)
            db.query(AssessmentResult).filter(AssessmentResult.attempt_id.in_(attempt_ids)).delete(synchronize_session=False)

            # 5. Delete attempts
            db.query(AssessmentAttempt).filter(AssessmentAttempt.id.in_(attempt_ids)).delete(synchronize_session=False)

        # 6. Delete allocations
        db.query(AssessmentStudentAllocation).filter(AssessmentStudentAllocation.id.in_(alloc_ids)).delete(synchronize_session=False)

    # 7. Delete candidates
    db.query(AssessmentActivationCandidate).filter(AssessmentActivationCandidate.request_id == id).delete(synchronize_session=False)

    # 8. Delete activation request
    db.delete(req)
    db.commit()
    return {"status": "success", "message": f"Assessment activation #{id} and its associated allocations deleted successfully."}

@router.post("/{id}/review", response_model=ActivationRequestResponse)
def review_request(
    id: int,
    data: ReviewActivationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    req = review_activation_request_atomic(id, data, current_user, db)
    return get_activation_request_by_id(req.id, current_user, db)
