from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, List, Optional
import datetime

from app.database import get_db
from app.models.models import AcademicYear, Semester, Notification, User, StudentProfile, FacultyProfile
from app.models.assessment_models import AssessmentActivationRequest, AssessmentStudentAllocation, AssessmentAttempt
from app.auth.jwt import get_current_user

router = APIRouter(prefix="/api/v1/calendar-notifications", tags=["Calendar & In-App Notifications"])

from app.services.ist import IST, to_ist as _ist

STAFF_CALENDAR_ROLES = {"Administrator", "HoD", "Class Tutor"}
NOTIFICATION_LIMIT = 50


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
    today = datetime.datetime.now(IST).date()

    # 1. Institutional term milestones from the Academic Calendar settings (real dates only)
    for y in db.query(AcademicYear).all():
        if y.start_date and y.end_date:
            for kind, d in (("begins", y.start_date), ("ends", y.end_date)):
                events.append({
                    "id": f"ay-{y.id}-{kind}", "title": f"Academic Year {y.year_code} {kind}",
                    "category": "Academic Term", "date": d.isoformat(), "time": "",
                    "details": f"Academic year {y.year_code}: {y.start_date.isoformat()} to {y.end_date.isoformat()}",
                    "badge_color": "#FF5500",
                })
    for s in db.query(Semester).all():
        if s.start_date and s.end_date:
            for kind, d in (("begins", s.start_date), ("ends", s.end_date)):
                events.append({
                    "id": f"sem-{s.id}-{kind}", "title": f"{s.name} {kind} ({s.academic_year})",
                    "category": "Academic Term", "date": d.isoformat(), "time": "",
                    "details": f"{s.name} {s.academic_year}: {s.start_date.isoformat()} to {s.end_date.isoformat()}",
                    "badge_color": "#FF5500",
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
    elif "Class Tutor" in user_roles:
        activations = act_base_query.filter(
            AssessmentActivationRequest.requested_by_id == current_user.id
        ).all()
    elif "Student" in user_roles:
        sp = current_user.student_profile
        student_id = sp.id if sp else None
        if student_id:
            allocs = db.query(AssessmentStudentAllocation).filter(
                AssessmentStudentAllocation.student_id == student_id,
                AssessmentStudentAllocation.status.in_(["APPROVED", "IN_PROGRESS", "MIGRATED"])
            ).all()
            req_ids = [a.request_id for a in allocs if a.request_id]
            activations = act_base_query.filter(
                AssessmentActivationRequest.id.in_(req_ids)
            ).all() if req_ids else []
        else:
            activations = []
    else:
        activations = []

    # Re-activating a track creates a new request; show only the latest window per class and track
    latest_req: Dict[tuple, AssessmentActivationRequest] = {}
    for req in activations:
        if req.status == "CANCELLED":
            continue
        key = (req.academic_class_id, req.domain_id)
        if key not in latest_req or (req.valid_from or datetime.datetime.min) > (latest_req[key].valid_from or datetime.datetime.min):
            latest_req[key] = req
    is_student_view = "Student" in user_roles and not (set(user_roles) & STAFF_CALENDAR_ROLES)

    for req in latest_req.values():
        domain_name = req.domain.title if req.domain else "Assessment Track"
        class_name = req.academic_class.name if req.academic_class else "Class"
        status_color = "#4ADE80" if req.status == "APPROVED" else ("#F59E0B" if req.status == "PENDING" else "#EF4444")
        start = _ist(req.valid_from)
        end = _ist(req.valid_until)
        window = f"{start:%d %b %Y, %I:%M %p}" + (f" to {end:%d %b %Y, %I:%M %p}" if end else "") if start else "Dates not set"
        events.append({
            "id": f"act-{req.id}",
            # Students see the track and class; staff also see the request status
            "title": f"{domain_name} — {class_name}" if is_student_view else f"[{req.status}] {domain_name} — {class_name}",
            "category": "Assessment Window",
            "date": start.date().isoformat() if start else today.isoformat(),
            "end_date": end.date().isoformat() if end else None,
            "time": f"{start:%I:%M %p}" if start else "",
            "details": f"Track: {domain_name} | Class: {class_name} | Open: {window} (IST)",
            "badge_color": status_color,
            "status": req.status,
            "_sort": start.isoformat() if start else today.isoformat(),
        })

    # 3. Assessment results: only each round's latest published attempt counts
    if "Student" in user_roles and current_user.student_profile:
        from app.services.assessment.latest_results import latest_published_by_student_round, attempt_percentage
        attempts = db.query(AssessmentAttempt).join(
            AssessmentStudentAllocation, AssessmentAttempt.allocation_id == AssessmentStudentAllocation.id
        ).filter(
            AssessmentStudentAllocation.student_id == current_user.student_profile.id,
            AssessmentAttempt.status == "EVALUATED"
        ).options(
            joinedload(AssessmentAttempt.allocation), joinedload(AssessmentAttempt.round), joinedload(AssessmentAttempt.result)
        ).all()

        for a in latest_published_by_student_round(attempts).values():
            r_title = a.round.title if a.round else "Round"
            pct = round(attempt_percentage(a), 1)
            submitted = _ist(a.submitted_at or a.started_at)
            events.append({
                "id": f"res-{a.id}",
                "title": f"Result Released: {r_title} ({pct}%)",
                "category": "Exam Result",
                "date": submitted.date().isoformat() if submitted else today.isoformat(),
                "time": f"{submitted:%I:%M %p}" if submitted else "",
                "details": f"Latest score: {pct}% | {'Passed' if a.passed else 'Needs improvement'}",
                "badge_color": "#3B82F6",
                "_sort": submitted.isoformat() if submitted else today.isoformat(),
            })

    # Chronological, so the list reads as a timeline
    events.sort(key=lambda e: (e.pop("_sort", None) or e["date"], e["title"]))
    return events

@router.get("/notifications")
def get_user_notifications(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    notes = db.query(Notification).filter(Notification.user_id == current_user.id).order_by(
        Notification.created_at.desc(), Notification.id.desc()
    ).limit(NOTIFICATION_LIMIT).all()
    return [{
        "id": n.id,
        "title": n.title,
        "message": n.message,
        "type": n.type,
        "is_read": n.is_read,
        "created_at": n.created_at.isoformat() + "Z" if n.created_at else None
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
