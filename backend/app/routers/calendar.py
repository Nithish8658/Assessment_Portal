from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import datetime
from app.database import get_db
from app.models.models import Assessment, Assignment, Notification, User
from app.auth.jwt import get_current_user

router = APIRouter(prefix="/api/v1/calendar-notifications", tags=["Calendar & In-App Notifications"])

@router.get("/calendar")
def get_calendar_events(course_id: Optional[int] = None, db: Session = Depends(get_db)):
    assessments = db.query(Assessment).all()
    assignments = db.query(Assignment).all()
    
    events = []
    today = datetime.date.today()
    
    for idx, a in enumerate(assessments):
        events.append({
            "id": f"ass-{a.id}",
            "title": f"Exam: {a.title} ({a.course.code if a.course else 'N/A'})",
            "type": "Exam",
            "date": (today + datetime.timedelta(days=idx*3 + 1)).isoformat(),
            "time": "10:00 AM",
            "course_title": a.course.title if a.course else "N/A"
        })
        
    for idx, asgn in enumerate(assignments):
        events.append({
            "id": f"asgn-{asgn.id}",
            "title": f"Due: {asgn.title} ({asgn.course.code if asgn.course else 'N/A'})",
            "type": "Assignment",
            "date": (today + datetime.timedelta(days=idx*4 + 2)).isoformat(),
            "time": "11:59 PM",
            "course_title": asgn.course.title if asgn.course else "N/A"
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

@router.post("/notifications/read-all")
def mark_all_notifications_read(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(Notification).filter(Notification.user_id == current_user.id).update({"is_read": True})
    db.commit()
    return {"message": "All notifications marked as read"}
