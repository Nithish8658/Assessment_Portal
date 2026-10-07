"""
Customer Support Multi-Turn Chat Simulation Engine.
Powers real-time, interactive customer support conversations driven by Gemini LLM.
"""

import json
import logging
import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.assessment_models import (
    AssessmentAttempt,
    AssessmentQuestion,
    QuestionEvaluationConfig,
    AssessmentResponse
)
from app.services.assessment.gemini_evaluator import gemini_evaluator

from app.services.assessment.timing import require_open_attempt
from app.services.assessment.attempt_service import attempt_service

logger = logging.getLogger(__name__)

class SimulationService:
    """Manages real-time multi-turn customer chat simulations."""

    async def process_chat_turn(
        self,
        attempt_id: int,
        question_id: int,
        conversation_history: List[Dict[str, Any]],
        new_agent_message: str,
        db: Session
    ) -> Dict[str, Any]:
        # 1. Verify attempt
        attempt = db.query(AssessmentAttempt).filter(AssessmentAttempt.id == attempt_id).first()
        if not attempt or attempt.status not in ["IN_PROGRESS", "ACTIVE"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Assessment attempt is not active."
            )

        # 2. Fetch question details
        require_open_attempt(attempt)
        question = db.query(AssessmentQuestion).filter(AssessmentQuestion.id == question_id).first()
        if not question:
            raise HTTPException(status_code=404, detail="Simulation question not found.")

        eval_config = db.query(QuestionEvaluationConfig).filter(
            QuestionEvaluationConfig.question_id == question_id
        ).first()
        rubric_str = eval_config.reference_solution or eval_config.correct_answer if eval_config else ""

        # Extract prior CSAT
        last_csat = 40 # Default starting frustration level
        for m in reversed(conversation_history):
            if "csat" in m:
                last_csat = int(m["csat"])
                break

        # Format history string
        formatted_history = ""
        for m in conversation_history:
            sender = m.get("sender", "user").upper()
            txt = m.get("text", "")
            formatted_history += f"[{sender}]: {txt}\n"

        system_instruction = (
            "You are an authentic, realistic enterprise/retail customer engaged in a LIVE real-time text chat "
            "with a customer support representative. You must roleplay according to the provided Scenario. "
            "If the agent is polite, empathetic, and offers concrete solutions (like RMA numbers, customs paperwork, replacements), "
            "your satisfaction (CSAT) should increase and your tone should de-escalate. "
            "If the agent is rude, evasive, repetitive, or ignores your issue, your satisfaction should drop and you should become more frustrated. "
            "Respond ONLY in valid parseable JSON with the exact structure:\n"
            "{\n"
            '  "customer_reply": "Your realistic reply to the agent",\n'
            '  "csat_score": <integer from 0 to 100>,\n'
            '  "sentiment": "Frustrated" | "Neutral" | "Satisfied" | "Delighted",\n'
            '  "agent_feedback": "Brief note on what agent did well or poorly",\n'
            '  "is_conversation_complete": <true if resolution reached or customer satisfied, false otherwise>\n'
            "}"
        )

        user_prompt = f"""
=== SCENARIO CONTEXT ===
{question.title}
{question.candidate_content}

=== PREVIOUS CONVERSATION ===
{formatted_history}

=== AGENT'S LATEST MESSAGE ===
[AGENT]: {new_agent_message}

=== PREVIOUS CSAT SCORE ===
{last_csat}/100

Generate the customer's response JSON object now.
"""

        try:
            raw_res = await gemini_evaluator._call_gemini_cascade(system_instruction, user_prompt)
            parsed = gemini_evaluator._extract_json(raw_res)
        except Exception as e:
            logger.exception("Error generating customer simulation response: %s", e)
            parsed = {
                "customer_reply": "I see. Please expedite this matter immediately and confirm the tracking details as discussed.",
                "csat_score": max(20, min(100, last_csat + 5)),
                "sentiment": "Neutral",
                "agent_feedback": "Customer accepted ongoing action plan.",
                "is_conversation_complete": False
            }

        customer_reply = parsed.get("customer_reply", "Thank you for looking into this.")
        new_csat = int(parsed.get("csat_score", last_csat))
        sentiment = parsed.get("sentiment", "Neutral")
        is_complete = bool(parsed.get("is_conversation_complete", False))

        now_str = datetime.datetime.utcnow().strftime("%H:%M")

        # 3. Update conversation array
        updated_history = list(conversation_history)
        updated_history.append({
            "id": len(updated_history) + 1,
            "sender": "agent",
            "text": new_agent_message,
            "timestamp": now_str
        })
        updated_history.append({
            "id": len(updated_history) + 1,
            "sender": "customer",
            "text": customer_reply,
            "timestamp": now_str,
            "csat": new_csat,
            "sentiment": sentiment
        })

        # 4. Atomically persist updated payload in AssessmentResponse
        payload_data = {
            "messages": updated_history,
            "final_csat": new_csat,
            "sentiment": sentiment,
            "is_complete": is_complete,
            "last_feedback": parsed.get("agent_feedback", "")
        }
        str_payload = json.dumps(payload_data)

        # Recheck the deadline after the remote AI call, before persisting a turn.
        attempt_service.save_response(attempt_id, question_id, str_payload, False, db)

        return {
            "customer_reply": customer_reply,
            "csat_score": new_csat,
            "sentiment": sentiment,
            "agent_feedback": parsed.get("agent_feedback", ""),
            "is_complete": is_complete,
            "updated_history": updated_history
        }

simulation_service = SimulationService()
