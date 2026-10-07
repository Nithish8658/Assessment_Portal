import datetime
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_

from app.models.models import User, StudentProfile, FacultyProfile, AcademicClass, Programme, Department
from app.models.assessment_models import (
    AssessmentActivationRequest,
    AssessmentStudentAllocation,
    AssessmentAttempt,
    AssessmentQuestion,
    AssessmentRound
)

def get_tutor_authorized_students_query(current_user: User, db: Session):
    """
    Two-Layer Tutor Scope Resolver:
    Uses exact tuple matching (programme_id, batch_name, section_name) per class
    to prevent cross-matching combinations.
    """
    roles = [r.name for r in current_user.roles]
    query = db.query(StudentProfile)

    if "Administrator" in roles or "Assessment Coordinator" in roles:
        return query

    if "HoD" in roles:
        fp = current_user.faculty_profile
        if not fp or not fp.department_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="HoD profile is not linked to an academic department."
            )
        return query.join(Programme, StudentProfile.programme_id == Programme.id).filter(
            Programme.department_id == fp.department_id
        )

    if "Class Tutor" in roles or "Faculty" in roles:
        fp = current_user.faculty_profile
        if not fp:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Faculty profile missing."
            )
        
        # Match by AcademicClass where tutor_id == fp.id using exact tuples
        classes = db.query(AcademicClass).filter(AcademicClass.tutor_id == fp.id).all()
        if classes:
            class_conditions = [
                and_(
                    StudentProfile.programme_id == c.programme_id,
                    StudentProfile.batch_name == c.batch_name,
                    StudentProfile.section_name == c.section_name
                ) for c in classes
            ]
            return query.filter(or_(*class_conditions))

        # Strict Fallback: Match by FacultyProfile assigned fields
        if fp.assigned_programme_id and fp.assigned_batch and fp.assigned_section:
            return query.filter(
                StudentProfile.programme_id == fp.assigned_programme_id,
                StudentProfile.batch_name == fp.assigned_batch,
                StudentProfile.section_name == fp.assigned_section
            )
        
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tutor is not assigned to any active academic class or section."
        )

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Access denied: User is not authorized to view student cohorts."
    )

def validate_question_belongs_to_attempt(attempt_id: int, question_id: int, db: Session):
    """
    Validates attempt existence, domain consistency, and guarantees that
    the question belongs strictly to attempt.round_id.
    """
    attempt = db.query(AssessmentAttempt).filter(AssessmentAttempt.id == attempt_id).first()
    if not attempt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment attempt not found.")
    
    question = db.query(AssessmentQuestion).filter(AssessmentQuestion.id == question_id).first()
    if not question:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment question not found.")

    # Cross-domain & cross-round invariant checks
    if attempt.round.domain_id != attempt.allocation.request.domain_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database Integrity Error: Attempt round does not match allocated domain."
        )

    if question.round_id != attempt.round_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Security Violation: Question does not belong to the active assessment round."
        )
    return attempt, question

def verify_student_can_start_round(student_id: int, round_id: int, db: Session, allocation_id: Optional[int] = None) -> AssessmentStudentAllocation:
    """
    Verifies allocation validity window, domain matching, and sequential round prerequisites.
    Prioritizes active IN_PROGRESS attempts for deterministic session resumption.
    """
    round_obj = db.query(AssessmentRound).filter(AssessmentRound.id == round_id).first()
    if not round_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment round not found.")

    now = datetime.datetime.utcnow()
    alloc_query = db.query(AssessmentStudentAllocation).join(
        AssessmentActivationRequest, AssessmentStudentAllocation.request_id == AssessmentActivationRequest.id
    ).filter(
        AssessmentStudentAllocation.student_id == student_id,
        AssessmentActivationRequest.domain_id == round_obj.domain_id,
        AssessmentStudentAllocation.status.in_(["APPROVED", "IN_PROGRESS", "MIGRATED"])
    )

    if allocation_id:
        allocation = alloc_query.filter(AssessmentStudentAllocation.id == allocation_id).first()
    else:
        # 1. Prioritize allocation that already has an active IN_PROGRESS attempt for this round
        active_attempt_alloc = alloc_query.join(
            AssessmentAttempt, AssessmentAttempt.allocation_id == AssessmentStudentAllocation.id
        ).filter(
            AssessmentAttempt.round_id == round_id,
            AssessmentAttempt.status == "IN_PROGRESS"
        ).order_by(AssessmentAttempt.id.desc()).first()

        if active_attempt_alloc:
            allocation = active_attempt_alloc
        else:
            # 2. Prioritize active valid allocation
            allocation = alloc_query.filter(
                AssessmentStudentAllocation.valid_from <= now,
                AssessmentStudentAllocation.valid_until >= now
            ).order_by(
                AssessmentStudentAllocation.valid_from.desc(),
                AssessmentStudentAllocation.allocated_at.desc()
            ).first() or alloc_query.order_by(
                AssessmentStudentAllocation.valid_from.desc()
            ).first()

    if not allocation:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: You do not have an approved allocation for this assessment domain."
        )

    if now < allocation.valid_from:
        start_str = allocation.valid_from.strftime('%I:%M %p, %b %d')
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"This assessment session is scheduled to start at {start_str}. Please wait until the start time."
        )

    resumable = db.query(AssessmentAttempt).filter(
        AssessmentAttempt.allocation_id == allocation.id,
        AssessmentAttempt.round_id == round_id,
        AssessmentAttempt.status.in_(["IN_PROGRESS", "SUBMITTED", "EVALUATING"])
    ).first()
    # The allocation window controls starting rounds. An already started round
    # keeps its full approved duration and can still be finalized after expiry.
    if now > allocation.valid_until and not resumable:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This assessment session window has expired. Please request your Class Tutor to re-assign or extend your window."
        )

    # Validate if round is included in the tutor's selected rounds for this session
    if allocation.request and allocation.request.selected_rounds_json:
        if round_obj.id not in allocation.request.selected_rounds_json:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: This round is not included in your assigned assessment session."
            )

    # Prerequisite verification (Round N > 1 requires passing Round N - 1)
    if round_obj.round_number > 1:
        prev_round = db.query(AssessmentRound).filter(
            AssessmentRound.domain_id == round_obj.domain_id,
            AssessmentRound.round_number == round_obj.round_number - 1
        ).first()
        if prev_round:
            prev_attempt = db.query(AssessmentAttempt).filter(
                AssessmentAttempt.allocation_id == allocation.id,
                AssessmentAttempt.round_id == prev_round.id,
                AssessmentAttempt.status == "EVALUATED"
            ).order_by(
                AssessmentAttempt.passed.desc(),
                AssessmentAttempt.score.desc(),
                AssessmentAttempt.attempt_number.desc()
            ).first()
            if not prev_attempt or not prev_attempt.passed:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Prerequisite required: You must complete and pass Round {prev_round.round_number} ({prev_round.title}) before starting this round."
                )

    return allocation
