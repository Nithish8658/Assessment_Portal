from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import datetime

from app.database import get_db
from app.models.models import AcademicYear, Semester, Notification, User, StudentProfile, FacultyProfile
from app.models.assessment_models import AssessmentActivationRequest, AssessmentStudentAllocation, AssessmentAttempt
from app.auth.jwt import get_current_user

router = APIRouter(prefix="/api/v1/calendar-notifications", tags=["Calendar & In-App Notifications"])

@router.get("/calendar")
def get_calendar_events(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns role-scoped and department-isolated calendar events for Academic Calendar.
    Department actions are hidden from students and isolated between departments.
    """
    user_roles = [r.name for r in current_user.roles]
    events = []
    today = datetime.date.today()

    # 1. Institutional Term Milestones (Public to all)
    semesters = db.query(Semester).all()
    for s in semesters:
        events.append({
            "id": f"sem-{s.id}",
            "title": f"{s.name} ({s.academic_year}) - Academic Term",
            "category": "Academic Term",
            "date": today.isoformat(),
            "time": "09:00 AM",
            "details": f"Institutional Term Milestone: {s.name}",
            "badge_color": "#C9A227"
        })

    # 2. Assessment Activations & Windows (Scoped by Role & Department)
    from sqlalchemy.orm import joinedload
    from app.models.models import AcademicClass, Programme

    act_base_query = db.query(AssessmentActivationRequest).options(
        joinedload(AssessmentActivationRequest.domain),
        joinedload(AssessmentActivationRequest.academic_class)
    )

    if "Administrator" in user_roles:
        activations = act_base_query.all()
    elif "HoD" in user_roles:
        fp = current_user.faculty_profile
        dept_id = fp.department_id if fp else None
        if not dept_id and fp:
            from app.models.models import Department
            d_match = db.query(Department).filter(Department.hod_id == fp.id).first()
            if d_match:
                dept_id = d_match.id
        if dept_id:
            activations = act_base_query.join(
                AcademicClass, AssessmentActivationRequest.academic_class_id == AcademicClass.id
            ).join(
                Programme, AcademicClass.programme_id == Programme.id
            ).filter(
                Programme.department_id == dept_id
            ).all()
        else:
            activations = []
    elif "Class Tutor" in user_roles or "Faculty" in user_roles:
        activations = act_base_query.filter(
            AssessmentActivationRequest.requested_by_id == current_user.id
        ).all()
    elif "Student" in user_roles:
        sp = current_user.student_profile
        student_id = sp.id if sp else None
        if student_id:
            allocs = db.query(AssessmentStudentAllocation).filter(
                AssessmentStudentAllocation.student_id == student_id,
                AssessmentStudentAllocation.status == "APPROVED"
            ).all()
            req_ids = [a.request_id for a in allocs if a.request_id]
            activations = act_base_query.filter(
                AssessmentActivationRequest.id.in_(req_ids)
            ).all() if req_ids else []
        else:
            activations = []
    else:
        activations = []

    for req in activations:
        domain_name = req.domain.title if req.domain else "Assessment Track"
        class_name = req.academic_class.name if req.academic_class else "Class"
        status_color = "#4ADE80" if req.status == "APPROVED" else ("#F59E0B" if req.status == "PENDING" else "#EF4444")
        start_date_str = req.valid_from.strftime("%Y-%m-%d") if req.valid_from else today.isoformat()
        end_date_str = req.valid_until.strftime("%Y-%m-%d") if req.valid_until else (today + datetime.timedelta(days=7)).isoformat()

        events.append({
            "id": f"act-{req.id}",
            "title": f"[{req.status}] {domain_name} — {class_name}",
            "category": "Assessment Window",
            "date": start_date_str,
            "end_date": end_date_str,
            "time": "10:00 AM",
            "details": f"Track: {domain_name} | Class: {class_name} | Valid: {start_date_str} to {end_date_str}",
            "badge_color": status_color,
            "status": req.status
        })

    # 3. Assessment Evaluation Results (Scoped)
    if "Student" in user_roles and current_user.student_profile:
        attempts = db.query(AssessmentAttempt).join(
            AssessmentStudentAllocation, AssessmentAttempt.allocation_id == AssessmentStudentAllocation.id
        ).filter(
            AssessmentStudentAllocation.student_id == current_user.student_profile.id,
            AssessmentAttempt.status == "EVALUATED"
        ).all()

        for a in attempts:
            r_title = a.round.title if a.round else "Round"
            pct = a.result.percentage if a.result else (a.percentage or 0.0)
            submitted_str = a.submitted_at.strftime("%Y-%m-%d") if a.submitted_at else today.isoformat()

            events.append({
                "id": f"res-{a.id}",
                "title": f"Result Released: {r_title} ({pct}%)",
                "category": "Exam Result",
                "date": submitted_str,
                "time": "04:00 PM",
                "details": f"Evaluated Score: {pct}% | Status: {a.status}",
                "badge_color": "#3B82F6"
            })

    return events

@router.get("/notifications")
def get_user_notifications(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    notes = db.query(Notification).filter(Notification.user_id == current_user.id).order_by(Notification.created_at.desc()).all()
    return [{
        "id": n.id,
        "title": n.title,
        "message": n.message,
        "type": n.type,
        "is_read": n.is_read,
        "created_at": n.created_at.strftime("%Y-%m-%d %H:%M")
    } for n in notes]

@router.post("/notifications/{notification_id}/read")
def mark_single_notification_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    note = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()

    if not note:
        raise HTTPException(status_code=404, detail="Notification not found.")

    note.is_read = True
    db.commit()
    return {"message": "Notification marked as read", "id": notification_id}

@router.post("/notifications/read-all")
def mark_all_notifications_read(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(Notification).filter(Notification.user_id == current_user.id).update({"is_read": True})
    db.commit()
    return {"message": "All notifications marked as read"}
