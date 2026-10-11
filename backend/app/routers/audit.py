from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.auth.jwt import require_roles
from app.database import get_db
from app.models.models import AuditLog, FacultyProfile, Programme, StudentProfile, User

router = APIRouter(prefix="/api/v1/audit", tags=["Audit Log Trail"])

AUDIT_MODULES = ["ASSESSMENT", "QUESTION_BANK", "EXAM_OPS", "USERS", "MASTER_DATA", "ACADEMIC_CALENDAR", "MAINTENANCE"]


@router.get("/modules")
def list_audit_modules(current_user: User = Depends(require_roles(["Administrator", "HoD", "Assessment Coordinator"]))):
    return AUDIT_MODULES


@router.get("")
def get_audit_logs(
    module: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 200,
    current_user: User = Depends(require_roles(["Administrator", "HoD", "Assessment Coordinator"])),
    db: Session = Depends(get_db)
):
    """
    Audit trail, newest first. Administrators and coordinators see everything; an HoD sees
    actions performed by staff and students of their own department.
    """
    query = db.query(AuditLog)
    roles = {r.name for r in current_user.roles}
    if not roles & {"Administrator", "Assessment Coordinator"}:
        dept_id = current_user.faculty_profile.department_id if current_user.faculty_profile else None
        faculty_ids = db.query(FacultyProfile.user_id).filter(FacultyProfile.department_id == dept_id)
        student_ids = db.query(StudentProfile.user_id).join(Programme, StudentProfile.programme_id == Programme.id).filter(
            Programme.department_id == dept_id)
        query = query.filter(or_(AuditLog.user_id.in_(faculty_ids), AuditLog.user_id.in_(student_ids)))
    if module:
        query = query.filter(AuditLog.module == module)
    if search:
        term = f"%{search.strip()}%"
        matching_users = db.query(User.id).filter(or_(User.username.ilike(term), User.full_name.ilike(term)))
        query = query.filter(or_(
            AuditLog.action.ilike(term), AuditLog.module.ilike(term), AuditLog.new_value.ilike(term),
            AuditLog.old_value.ilike(term), AuditLog.record_id.ilike(term), AuditLog.user_id.in_(matching_users),
        ))
    logs = query.order_by(AuditLog.timestamp.desc()).limit(max(1, min(limit, 500))).all()
    users = {u.id: u for u in db.query(User).filter(User.id.in_({l.user_id for l in logs if l.user_id})).all()} if logs else {}
    res = []
    for l in logs:
        user = users.get(l.user_id)
        res.append({
            "id": l.id,
            "username": user.username if user else "System",
            "user_full_name": user.full_name if user else "System Auto",
            "action": l.action,
            "module": l.module,
            "record_id": l.record_id,
            "old_value": l.old_value,
            "new_value": l.new_value,
            "ip_address": l.ip_address,
            "timestamp": (l.timestamp.isoformat() + "Z") if l.timestamp else None,
        })
    return res
