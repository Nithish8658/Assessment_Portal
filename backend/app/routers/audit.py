from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.models import AuditLog, User
from app.auth.jwt import get_current_user, require_roles

router = APIRouter(prefix="/api/v1/audit", tags=["Audit Log Trail"])

@router.get("")
def get_audit_logs(
    module: Optional[str] = None,
    search: Optional[str] = None,
    current_user: User = Depends(require_roles(["Administrator", "HoD"])),
    db: Session = Depends(get_db)
):
    query = db.query(AuditLog)
    if module:
        query = query.filter(AuditLog.module == module)
    if search:
        query = query.filter(AuditLog.action.ilike(f"%{search}%") | AuditLog.new_value.ilike(f"%{search}%"))
        
    logs = query.order_by(AuditLog.timestamp.desc()).limit(100).all()
    res = []
    for l in logs:
        user = db.query(User).filter(User.id == l.user_id).first() if l.user_id else None
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
            "timestamp": l.timestamp.strftime("%Y-%m-%d %H:%M:%S")
        })
    return res
