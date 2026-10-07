from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload, selectinload
from typing import List, Optional
import datetime

from app.database import get_db
from app.models.models import User, StudentProfile
from app.models.assessment_models import (
    AssessmentDomain,
    AssessmentRound,
    AssessmentStudentAllocation,
    AssessmentActivationRequest,
    AssessmentAttempt,
    AssessmentReattemptRequest
)
from app.schemas.assessment_schemas import DomainDetailResponse, RoundSummaryResponse
from app.auth.jwt import get_current_user
from app.services.assessment.timing import approved_duration

router = APIRouter(prefix="/api/v1/assessment/domains", tags=["Assessment Domains & Tracks"])

@router.get("", response_model=List[DomainDetailResponse])
def get_assessment_domains(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns assessment domains.
    - If student: Returns only domains where an active approved allocation exists.
    - If faculty/admin: Returns all active domains.
    """
    user_roles = [r.name for r in current_user.roles]
    is_student = "Student" in user_roles and "Administrator" not in user_roles and "Class Tutor" not in user_roles and "HoD" not in user_roles

    student_id = current_user.student_profile.id if current_user.student_profile else None
    now = datetime.datetime.utcnow()
    res = []

    if is_student and student_id:
        # Query student allocations in time-wise order (newest / upcoming first)
        # Eagerly load request -> domain -> rounds -> policy to prevent N+1 query cascades
        allocations = db.query(AssessmentStudentAllocation).options(
            joinedload(AssessmentStudentAllocation.request)
                .joinedload(AssessmentActivationRequest.domain)
                .selectinload(AssessmentDomain.rounds)
                .joinedload(AssessmentRound.policy)
        ).join(
            AssessmentActivationRequest, AssessmentStudentAllocation.request_id == AssessmentActivationRequest.id
        ).filter(
            AssessmentStudentAllocation.student_id == student_id,
            AssessmentStudentAllocation.status.in_(["APPROVED", "IN_PROGRESS", "MIGRATED"])
        ).order_by(
            AssessmentStudentAllocation.valid_from.desc(),
            AssessmentStudentAllocation.allocated_at.desc()
        ).all()

        alloc_ids = [alloc.id for alloc in allocations]

        # Batch load attempts and reattempts for all allocations in 2 queries
        attempts_map = {}
        reattempts_map = {}

        if alloc_ids:
            all_attempts = db.query(AssessmentAttempt).options(
                joinedload(AssessmentAttempt.result)
            ).filter(
                AssessmentAttempt.allocation_id.in_(alloc_ids)
            ).order_by(AssessmentAttempt.id.asc()).all()

            for att in all_attempts:
                # Later attempt overwrite earlier ones, leaving latest attempt for (allocation_id, round_id)
                attempts_map[(att.allocation_id, att.round_id)] = att

            all_reattempts = db.query(AssessmentReattemptRequest).filter(
                AssessmentReattemptRequest.allocation_id.in_(alloc_ids)
            ).order_by(AssessmentReattemptRequest.id.asc()).all()

            for req in all_reattempts:
                reattempts_map[(req.allocation_id, req.round_id)] = req

        for alloc in allocations:
            d = alloc.request.domain if alloc.request else None
            if not d or not d.is_active:
                continue

            # Determine schedule status
            if now < alloc.valid_from:
                sched_status = "UPCOMING"
                starts_in_min = max(1, int((alloc.valid_from - now).total_seconds() / 60))
            elif now > alloc.valid_until:
                sched_status = "EXPIRED"
                starts_in_min = None
            else:
                sched_status = "ACTIVE"
                starts_in_min = None

            fmt_assigned = f"Assigned: {alloc.allocated_at.strftime('%b %d, %Y at %I:%M %p')}"

            round_summaries = []
            selected_rids = alloc.request.selected_rounds_json if (alloc.request and alloc.request.selected_rounds_json) else None
            rounds_to_process = [r for r in sorted(d.rounds, key=lambda x: x.round_number) if (not selected_rids or r.id in selected_rids)]

            for r in rounds_to_process:
                status_val = "NOT_STARTED"
                score = None
                passed = None
                reattempt_status = None
                has_reattempt_request = False
                rejection_reason = None
                attempt_number = 1

                attempt = attempts_map.get((alloc.id, r.id))
                percentage = None
                max_score = None
                attempt_id = None

                if attempt:
                    status_val = attempt.status
                    score = attempt.score if attempt.status == "EVALUATED" else None
                    percentage = attempt.percentage if attempt.status == "EVALUATED" else None
                    max_score = attempt.result.max_score if (attempt.status == "EVALUATED" and attempt.result) else None
                    passed = attempt.passed if attempt.status == "EVALUATED" else None
                    attempt_number = attempt.attempt_number
                    attempt_id = attempt.id

                # Check for reattempt request / grace grant
                reattempt_req = reattempts_map.get((alloc.id, r.id))
                if reattempt_req:
                    has_reattempt_request = True
                    if reattempt_req.status == "APPROVED":
                        # If the student hasn't started or finished the new attempt yet, make it actionable (NOT_STARTED)
                        if not attempt or attempt.attempt_number < reattempt_req.attempt_number:
                            status_val = "NOT_STARTED"
                            score = None
                            percentage = None
                            max_score = None
                            passed = None
                            attempt_number = reattempt_req.attempt_number
                            reattempt_status = "APPROVED"
                        elif attempt.attempt_number == reattempt_req.attempt_number and attempt.status in ["SUBMITTED", "EVALUATED"]:
                            reattempt_status = "COMPLETED"
                        else:
                            reattempt_status = reattempt_req.status
                    else:
                        reattempt_status = reattempt_req.status
                    rejection_reason = reattempt_req.rejection_reason

                policy = r.policy
                passing_score = policy.passing_score if policy else 60.0
                weightage_percent = policy.weightage_percent if policy else 25.0

                round_summaries.append(RoundSummaryResponse(
                    id=r.id,
                    domain_id=d.id,
                    round_number=r.round_number,
                    slug=r.slug,
                    title=r.title,
                    description=r.description,
                    round_type=r.round_type,
                    duration_minutes=approved_duration(r, alloc.request),
                    questions_per_attempt=r.questions_per_attempt,
                    passing_score=passing_score,
                    weightage_percent=weightage_percent,
                    rules=r.rules_json or {},
                    status=status_val,
                    score=score,
                    percentage=percentage,
                    max_score=max_score,
                    passed=passed,
                    reattempt_status=reattempt_status,
                    has_reattempt_request=has_reattempt_request,
                    rejection_reason=rejection_reason,
                    attempt_number=attempt_number,
                    attempt_id=attempt_id
                ))

            res.append(DomainDetailResponse(
                id=d.id,
                slug=d.slug,
                title=d.title,
                description=d.description,
                is_active=d.is_active,
                allocation_id=alloc.id,
                allocated_at=(alloc.allocated_at.isoformat() + "Z") if alloc.allocated_at else None,
                valid_from=(alloc.valid_from.isoformat() + "Z") if alloc.valid_from else None,
                valid_until=(alloc.valid_until.isoformat() + "Z") if alloc.valid_until else None,
                schedule_status=sched_status,
                formatted_assigned_time=fmt_assigned,
                starts_in_minutes=starts_in_min,
                rounds=round_summaries
            ))
    else:
        domains = db.query(AssessmentDomain).options(
            selectinload(AssessmentDomain.rounds).joinedload(AssessmentRound.policy)
        ).filter(AssessmentDomain.is_active == True).order_by(AssessmentDomain.id.asc()).all()
        for d in domains:
            round_summaries = []
            for r in sorted(d.rounds, key=lambda x: x.round_number):
                policy = r.policy
                passing_score = policy.passing_score if policy else 60.0
                weightage_percent = policy.weightage_percent if policy else 25.0
                round_summaries.append(RoundSummaryResponse(
                    id=r.id,
                    domain_id=d.id,
                    round_number=r.round_number,
                    slug=r.slug,
                    title=r.title,
                    description=r.description,
                    round_type=r.round_type,
                    duration_minutes=r.duration_minutes,
                    questions_per_attempt=r.questions_per_attempt,
                    passing_score=passing_score,
                    weightage_percent=weightage_percent,
                    rules=r.rules_json or {},
                    status="NOT_STARTED",
                    score=None,
                    passed=None,
                    attempt_number=1
                ))
            res.append(DomainDetailResponse(
                id=d.id,
                slug=d.slug,
                title=d.title,
                description=d.description,
                is_active=d.is_active,
                schedule_status="ACTIVE",
                rounds=round_summaries
            ))

    return res

@router.get("/{slug}", response_model=DomainDetailResponse)
def get_domain_by_slug(
    slug: str,
    allocation_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    domain = db.query(AssessmentDomain).options(
        selectinload(AssessmentDomain.rounds).joinedload(AssessmentRound.policy)
    ).filter(AssessmentDomain.slug == slug).first()
    if not domain:
        raise HTTPException(status_code=404, detail="Domain not found.")

    student_id = current_user.student_profile.id if current_user.student_profile else None
    now = datetime.datetime.utcnow()
    alloc = None
    sched_status = "ACTIVE"
    starts_in_min = None
    fmt_assigned = None

    if student_id:
        alloc_query = db.query(AssessmentStudentAllocation).options(
            joinedload(AssessmentStudentAllocation.request)
        ).join(
            AssessmentActivationRequest, AssessmentStudentAllocation.request_id == AssessmentActivationRequest.id
        ).filter(
            AssessmentStudentAllocation.student_id == student_id,
            AssessmentActivationRequest.domain_id == domain.id,
            AssessmentStudentAllocation.status.in_(["APPROVED", "IN_PROGRESS", "MIGRATED"])
        )

        if allocation_id:
            alloc = alloc_query.filter(AssessmentStudentAllocation.id == allocation_id).first()
        if not alloc:
            alloc = alloc_query.order_by(
                AssessmentStudentAllocation.valid_from.desc(),
                AssessmentStudentAllocation.allocated_at.desc()
            ).first()

        if alloc:
            if now < alloc.valid_from:
                sched_status = "UPCOMING"
                starts_in_min = max(1, int((alloc.valid_from - now).total_seconds() / 60))
            elif now > alloc.valid_until:
                sched_status = "EXPIRED"
            else:
                sched_status = "ACTIVE"
            fmt_assigned = f"Assigned: {alloc.allocated_at.strftime('%b %d, %Y at %I:%M %p')}"

    # Batch load attempts and reattempts for this single allocation
    attempts_map = {}
    reattempts_map = {}

    if student_id and alloc:
        all_attempts = db.query(AssessmentAttempt).options(
            joinedload(AssessmentAttempt.result)
        ).filter(
            AssessmentAttempt.allocation_id == alloc.id
        ).order_by(AssessmentAttempt.id.asc()).all()

        for att in all_attempts:
            attempts_map[att.round_id] = att

        all_reattempts = db.query(AssessmentReattemptRequest).filter(
            AssessmentReattemptRequest.allocation_id == alloc.id
        ).order_by(AssessmentReattemptRequest.id.asc()).all()

        for req in all_reattempts:
            reattempts_map[req.round_id] = req

    round_summaries = []
    selected_rids = alloc.request.selected_rounds_json if (alloc and alloc.request and alloc.request.selected_rounds_json) else None
    rounds_to_process = [r for r in sorted(domain.rounds, key=lambda x: x.round_number) if (not selected_rids or r.id in selected_rids)]

    for r in rounds_to_process:
        status_val = "NOT_STARTED"
        score = None
        passed = None
        reattempt_status = None
        has_reattempt_request = False
        rejection_reason = None
        attempt_number = 1
        percentage = None
        max_score = None
        attempt_id = None

        if student_id and alloc:
            attempt = attempts_map.get(r.id)
            if attempt:
                status_val = attempt.status
                score = attempt.score if attempt.status == "EVALUATED" else None
                percentage = attempt.percentage if attempt.status == "EVALUATED" else None
                max_score = attempt.result.max_score if (attempt.status == "EVALUATED" and attempt.result) else None
                passed = attempt.passed if attempt.status == "EVALUATED" else None
                attempt_number = attempt.attempt_number
                attempt_id = attempt.id

            # Check for reattempt request / grace grant
            reattempt_req = reattempts_map.get(r.id)
            if reattempt_req:
                has_reattempt_request = True
                if reattempt_req.status == "APPROVED":
                    # If the student hasn't started or finished the new attempt yet, make it actionable (NOT_STARTED)
                    if not attempt or attempt.attempt_number < reattempt_req.attempt_number:
                        status_val = "NOT_STARTED"
                        score = None
                        percentage = None
                        max_score = None
                        passed = None
                        attempt_number = reattempt_req.attempt_number
                        reattempt_status = "APPROVED"
                    elif attempt.attempt_number == reattempt_req.attempt_number and attempt.status in ["SUBMITTED", "EVALUATED"]:
                        reattempt_status = "COMPLETED"
                    else:
                        reattempt_status = reattempt_req.status
                else:
                    reattempt_status = reattempt_req.status
                rejection_reason = reattempt_req.rejection_reason

        policy = r.policy
        passing_score = policy.passing_score if policy else 60.0
        weightage_percent = policy.weightage_percent if policy else 25.0

        round_summaries.append(RoundSummaryResponse(
            id=r.id,
            domain_id=domain.id,
            round_number=r.round_number,
            slug=r.slug,
            title=r.title,
            description=r.description,
            round_type=r.round_type,
            duration_minutes=approved_duration(r, alloc.request if alloc else None),
            questions_per_attempt=r.questions_per_attempt,
            passing_score=passing_score,
            weightage_percent=weightage_percent,
            rules=r.rules_json or {},
            status=status_val,
            score=score,
            percentage=percentage,
            max_score=max_score,
            passed=passed,
            reattempt_status=reattempt_status,
            has_reattempt_request=has_reattempt_request,
            rejection_reason=rejection_reason,
            attempt_number=attempt_number,
            attempt_id=attempt_id
        ))

    return DomainDetailResponse(
        id=domain.id,
        slug=domain.slug,
        title=domain.title,
        description=domain.description,
        is_active=domain.is_active,
        allocation_id=alloc.id if alloc else None,
        allocated_at=(alloc.allocated_at.isoformat() + "Z") if alloc and alloc.allocated_at else None,
        valid_from=(alloc.valid_from.isoformat() + "Z") if alloc and alloc.valid_from else None,
        valid_until=(alloc.valid_until.isoformat() + "Z") if alloc and alloc.valid_until else None,
        schedule_status=sched_status,
        formatted_assigned_time=fmt_assigned,
        starts_in_minutes=starts_in_min,
        rounds=round_summaries
    )
