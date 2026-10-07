from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect, Query
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
import datetime
import json
import logging
from jose import jwt, JWTError

from app.database import get_db, SessionLocal
from app.config import SECRET_KEY, ALGORITHM
from app.models.models import User, Department, FacultyProfile, AcademicClass, Programme
from app.models.assessment_models import AssessmentAttempt, AssessmentActivationRequest, AssistantChatSession
from app.auth.jwt import get_current_user
from app.services.assistant.gateway import websocket_gateway

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/assessment/assistant", tags=["HoD & Admin AI Intelligence Assistant"])

class AssistantQuickSummaryResponse(BaseModel):
    active_in_progress_exams: int
    pending_approvals: int
    evaluated_attempts: int
    user_role: str
    department_name: Optional[str] = None

@router.get("/quick-summary", response_model=AssistantQuickSummaryResponse)
def get_assistant_quick_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns high-level live badge counts for the floating widget header.
    """
    role_names = [r.name for r in current_user.roles]
    is_admin = any(r in ["Administrator", "Super Admin", "Assessment Coordinator"] for r in role_names)
    is_hod = any(r in ["HoD", "Head of Department"] for r in role_names)

    user_role = "Administrator" if is_admin else ("HoD" if is_hod else "User")
    dept_id = current_user.faculty_profile.department_id if (current_user.faculty_profile and is_hod) else None
    dept_name = None

    if dept_id:
        dept = db.query(Department).filter(Department.id == dept_id).first()
        dept_name = dept.name if dept else None

    # Count live active sessions
    in_progress = db.query(AssessmentAttempt).filter(AssessmentAttempt.status == "IN_PROGRESS").count()
    evaluated = db.query(AssessmentAttempt).filter(AssessmentAttempt.status.in_(["EVALUATED", "SUBMITTED"])).count()
    
    # Count pending approvals
    pending_query = db.query(AssessmentActivationRequest).filter(AssessmentActivationRequest.status == "PENDING")
    if is_hod and dept_id:
        pending_query = pending_query.join(AcademicClass, AssessmentActivationRequest.academic_class_id == AcademicClass.id).join(Programme, AcademicClass.programme_id == Programme.id).filter(Programme.department_id == dept_id)
    pending_count = pending_query.count()

    return AssistantQuickSummaryResponse(
        active_in_progress_exams=in_progress,
        pending_approvals=pending_count,
        evaluated_attempts=evaluated,
        user_role=user_role,
        department_name=dept_name
    )


@router.websocket("/ws-live")
async def assistant_live_websocket(
    websocket: WebSocket,
    token: Optional[str] = Query(None),
    session_id: Optional[str] = Query(None)
):
    """
    Autonomous Executive AI Assistant WebSocket Gateway.
    Powered by Gemini 2.5 Flash with safe read-only SQL execution and screen grounding.
    Features:
    - Pure text streaming (ultra-fast, zero audio overhead)
    - Full RBAC: restricted strictly to HoD and Administrator roles (rejects with 4403)
    - Department multi-tenancy isolation for all database queries and session storage
    - In-page live DOM table ingestion and screen awareness
    - PostgreSQL conversation thread rehydration and persistent storage
    - Zero permission requests: direct analytical synthesis
    """
    db: Session = SessionLocal()
    try:
        await websocket_gateway.handle_connection(
            websocket=websocket,
            token=token,
            session_id=session_id,
            db=db
        )
    finally:
        db.close()


@router.get("/sessions")
def list_assistant_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Lists recent conversation sessions for the current authenticated user.
    Enforces user isolation and HoD department multi-tenancy.
    """
    role_names = [r.name for r in current_user.roles]
    is_admin = any(r in ["Administrator", "Super Admin", "Assessment Coordinator"] for r in role_names)
    is_hod = any(r in ["HoD", "Head of Department"] for r in role_names)

    if not is_admin and not is_hod:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Session management is only available to HoD and Administrator accounts."
        )

    sessions = db.query(AssistantChatSession).filter(
        AssistantChatSession.user_id == current_user.id
    ).order_by(AssistantChatSession.updated_at.desc()).limit(15).all()

    return [
        {
            "session_id": s.session_id,
            "title": s.title,
            "message_count": len(s.messages_json or []),
            "updated_at": s.updated_at.isoformat() if s.updated_at else None,
            "created_at": s.created_at.isoformat() if s.created_at else None
        }
        for s in sessions
    ]


@router.get("/sessions/{session_id}")
def get_assistant_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Fetches full message history and page context for a given session.
    """
    session_record = db.query(AssistantChatSession).filter(
        AssistantChatSession.session_id == session_id,
        AssistantChatSession.user_id == current_user.id
    ).first()

    if not session_record:
        raise HTTPException(status_code=404, detail="Session not found.")

    return {
        "session_id": session_record.session_id,
        "title": session_record.title,
        "messages": session_record.messages_json or [],
        "page_context": session_record.page_context_json or {},
        "updated_at": session_record.updated_at.isoformat() if session_record.updated_at else None
    }


@router.delete("/sessions/{session_id}")
def delete_assistant_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Deletes an existing conversation session.
    """
    session_record = db.query(AssistantChatSession).filter(
        AssistantChatSession.session_id == session_id,
        AssistantChatSession.user_id == current_user.id
    ).first()

    if not session_record:
        raise HTTPException(status_code=404, detail="Session not found.")

    db.delete(session_record)
    db.commit()
    return {"status": "success", "message": "Conversation session deleted successfully."}

