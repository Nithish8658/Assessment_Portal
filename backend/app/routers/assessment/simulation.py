from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import User
from app.auth.jwt import get_current_user
from app.services.assessment.simulation_service import simulation_service

router = APIRouter(prefix="/api/v1/assessment/simulation", tags=["Real-time Customer Chat Simulation Engine"])

class ChatTurnRequest(BaseModel):
    attempt_id: int
    question_id: int
    conversation_history: List[Dict[str, Any]] = []
    agent_message: str

class ChatTurnResponse(BaseModel):
    customer_reply: str
    csat_score: int
    sentiment: str
    agent_feedback: Optional[str] = None
    is_complete: bool
    updated_history: List[Dict[str, Any]]

@router.post("/chat-turn", response_model=ChatTurnResponse)
async def process_live_chat_turn(
    data: ChatTurnRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Executes a real-time conversational turn with a Gemini-powered simulated customer.
    Evaluates agent empathy and de-escalation, updates live CSAT, and persists transcript state.
    """
    if not data.agent_message.strip():
        raise HTTPException(status_code=400, detail="Agent message cannot be empty.")

    result = await simulation_service.process_chat_turn(
        attempt_id=data.attempt_id,
        question_id=data.question_id,
        conversation_history=data.conversation_history,
        new_agent_message=data.agent_message.strip(),
        db=db
    )
    return ChatTurnResponse(**result)
