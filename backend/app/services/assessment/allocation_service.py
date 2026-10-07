import datetime
import json
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.models import User, StudentProfile, FacultyProfile, AcademicClass, AuditLog, Notification, Role
from app.models.assessment_models import (
    AssessmentActivationRequest,
    AssessmentActivationCandidate,
    AssessmentStudentAllocation,
    AssessmentDomain
)
from app.schemas.assessment_schemas import CreateActivationRequest, ReviewActivationRequest
from app.services.assessment.timing import freeze_approval_durations, as_utc_naive

def create_activation_request(
    data: CreateActivationRequest,
    current_user: User,
    db: Session
) -> AssessmentActivationRequest:
    """
    Class Tutor creates an activation request attached to a specific academic class
    and candidate student roster.
    """
    user_roles = [r.name for r in current_user.roles]
    if "Administrator" not in user_roles and "Class Tutor" not in user_roles and "Faculty" not in user_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only assigned Class Tutors or Administrators can create assessment activation requests."
        )

    # Validate domain
    domain = db.query(AssessmentDomain).filter(AssessmentDomain.id == data.domain_id, AssessmentDomain.is_active == True).first()
    if not domain:
        raise HTTPException(status_code=404, detail="Assessment domain not found or inactive.")

    # Validate academic class
    academic_class = db.query(AcademicClass).filter(AcademicClass.id == data.academic_class_id).first()
    if not academic_class:
        raise HTTPException(status_code=404, detail="Academic class not found.")

    # Validate Tutor scope if not Administrator
    if "Administrator" not in user_roles:
        fp = current_user.faculty_profile
        if not fp:
            raise HTTPException(status_code=403, detail="Faculty profile missing.")
        if academic_class.tutor_id != fp.id:
            # Check fallback assigned match
            if not (fp.assigned_programme_id == academic_class.programme_id and
                    fp.assigned_batch == academic_class.batch_name and
                    fp.assigned_section == academic_class.section_name):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You are not authorized to create activation requests for this academic class."
                )

    # Validate candidate student IDs belong to this class
    if not data.candidate_student_ids:
        raise HTTPException(status_code=400, detail="At least one candidate student must be selected.")

    class_students = db.query(StudentProfile).filter(
        StudentProfile.id.in_(data.candidate_student_ids),
        StudentProfile.programme_id == academic_class.programme_id,
        StudentProfile.batch_name == academic_class.batch_name,
        StudentProfile.section_name == academic_class.section_name
    ).all()

    if len(class_students) != len(data.candidate_student_ids):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="One or more selected students do not belong to the designated academic class."
        )

    # Create Activation Request (Directly activated without requiring HoD approval)
    now_utc = datetime.datetime.utcnow()
    req = AssessmentActivationRequest(
        domain_id=domain.id,
        academic_class_id=academic_class.id,
        requested_by_id=current_user.id,
        reviewed_by_id=current_user.id,
        reviewed_at=now_utc,
        selected_rounds_json=data.selected_round_ids,
        complexity_level=data.complexity_level or "Balanced",
        status="APPROVED",
        valid_from=as_utc_naive(data.valid_from),
        valid_until=as_utc_naive(data.valid_until),
        notes=data.notes
    )
    db.add(req)
    db.flush()

    # Freeze approval timings and durations immediately
    freeze_approval_durations(req)

    # Add candidates roster and allocate directly
    allocated_count = 0
    for s in class_students:
        cand = AssessmentActivationCandidate(
            request_id=req.id,
            student_id=s.id
        )
        db.add(cand)

        # Directly allocate student with APPROVED status
        alloc = AssessmentStudentAllocation(
            request_id=req.id,
            student_id=s.id,
            status="APPROVED",
            source="TUTOR_ACTIVATION",
            valid_from=req.valid_from,
            valid_until=req.valid_until
        )
        db.add(alloc)
        allocated_count += 1

        # Notify candidate student
        if s.user_id:
            db.add(Notification(
                user_id=s.user_id,
                title="New Assessment Track Activated",
                message=f"Assessment track '{domain.title}' has been activated for you. You can now access your assessment.",
                type="info"
            ))

    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action="ASSESSMENT_ACTIVATED_BY_TUTOR",
        module="ASSESSMENT",
        record_id=str(req.id),
        new_value=json.dumps({
            "domain_id": domain.id,
            "academic_class_id": academic_class.id,
            "candidates_count": len(class_students),
            "status": "APPROVED",
            "allocated_count": allocated_count
        })
    )
    db.add(audit)

    # Informational Notification for Department HoDs (no approval action required)
    dept_id = academic_class.programme.department_id if academic_class.programme else None
    if dept_id:
        hod_users = db.query(User).join(FacultyProfile).filter(
            FacultyProfile.department_id == dept_id
        ).all()
        for hod in hod_users:
            if any(r.name in ["HoD", "Administrator"] for r in hod.roles):
                db.add(Notification(
                    user_id=hod.id,
                    title="Assessment Track Activated",
                    message=f"Tutor {current_user.full_name} activated track '{domain.title}' for {academic_class.name} ({len(class_students)} candidates).",
                    type="info"
                ))

    db.commit()
    db.refresh(req)
    return req

def review_activation_request_atomic(
    request_id: int,
    data: ReviewActivationRequest,
    current_user: User,
    db: Session
) -> AssessmentActivationRequest:
    """
    HoD or Administrator approves or rejects an activation request atomically.
    """
    user_roles = [r.name for r in current_user.roles]
    if "Administrator" not in user_roles and "HoD" not in user_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only an authorized HoD or Administrator can review assessment activation requests."
        )

    request = db.query(AssessmentActivationRequest).filter(
        AssessmentActivationRequest.id == request_id
    ).with_for_update().first()

    if not request:
        raise HTTPException(status_code=404, detail="Activation request not found.")

    if request.status != "PENDING":
        raise HTTPException(status_code=400, detail=f"Request is already {request.status}.")

    # Validate HoD department scope
    if "Administrator" not in user_roles:
        fp = current_user.faculty_profile
        if not fp or fp.department_id != request.department_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Unauthorized: You can only review activation requests for your assigned academic department."
            )

    if data.action == "REJECT":
        request.status = "REJECTED"
        request.rejection_reason = data.rejection_reason or "Rejected by HoD"
        request.reviewed_by_id = current_user.id
        request.reviewed_at = datetime.datetime.utcnow()

        audit = AuditLog(
            user_id=current_user.id,
            action="ASSESSMENT_ACTIVATION_REJECTED",
            module="ASSESSMENT",
            record_id=str(request.id),
            new_value=json.dumps({"reason": request.rejection_reason})
        )
        db.add(audit)

        # Notify Requesting Tutor
        if request.requested_by_id:
            db.add(Notification(
                user_id=request.requested_by_id,
                title="Assessment Request Rejected",
                message=f"Your activation request for {request.academic_class.name if request.academic_class else 'Class'} ({request.domain.title if request.domain else 'Track'}) was rejected. Reason: {request.rejection_reason}.",
                type="warning"
            ))

        db.commit()
        db.refresh(request)
        return request

    # Action is APPROVE -> allocate strictly the selected candidates
    candidates = request.candidates
    if not candidates:
        raise HTTPException(status_code=400, detail="No candidate students attached to this activation request.")

    allocated_count = 0
    freeze_approval_durations(request)
    if data.round_durations is not None and data.round_durations != request.approved_round_durations_json:
        raise HTTPException(409, "Round durations changed. Refresh the request and review the updated timings before approval.")
    for cand in candidates:
        existing = db.query(AssessmentStudentAllocation).filter(
            AssessmentStudentAllocation.request_id == request.id,
            AssessmentStudentAllocation.student_id == cand.student_id
        ).first()

        if not existing:
            alloc = AssessmentStudentAllocation(
                request_id=request.id,
                student_id=cand.student_id,
                status="APPROVED",
                source="TUTOR_ACTIVATION",
                valid_from=request.valid_from,
                valid_until=request.valid_until
            )
            db.add(alloc)
            allocated_count += 1

            # Notify Candidate Student
            if cand.student and cand.student.user_id:
                db.add(Notification(
                    user_id=cand.student.user_id,
                    title="New Assessment Track Allocated",
                    message=f"You have been allocated to Corporate Assessment Track: {request.domain.title if request.domain else 'Track'}. Go to My Assessment Tracks to begin.",
                    type="success"
                ))

    request.status = "APPROVED"
    request.reviewed_by_id = current_user.id
    request.reviewed_at = datetime.datetime.utcnow()

    audit = AuditLog(
        user_id=current_user.id,
        action="ASSESSMENT_ACTIVATION_APPROVED",
        module="ASSESSMENT",
        record_id=str(request.id),
        new_value=json.dumps({
            "status": "APPROVED",
            "allocated_students_count": allocated_count,
            "approved_round_durations": request.approved_round_durations_json
        })
    )
    db.add(audit)

    # Notify Requesting Tutor
    if request.requested_by_id:
        db.add(Notification(
            user_id=request.requested_by_id,
            title="Assessment Request Approved",
            message=f"Your activation request for {request.academic_class.name if request.academic_class else 'Class'} ({request.domain.title if request.domain else 'Track'}) was APPROVED by HoD.",
            type="success"
        ))

    db.commit()
    db.refresh(request)
    return request
