"""
Autonomous Live Agent Service for HoD & Administrator Portal.
Powered by Gemini 2.5 Flash Native Audio Live over Bidirectional WebSockets (BidiGenerateContent).
Features:
- In-Page DOM Table & Webpage Context Awareness
- Role-Based Access Control (RBAC) & Department Multi-Tenancy Scoping
- Live PostgreSQL Tool Execution & Real-Time Token Streaming
- Persistent Database Session & Conversation History Storage
"""

import os
import json
import asyncio
import logging
import datetime
import websockets
from typing import Dict, Any, List, Optional, Callable, Awaitable
from sqlalchemy.orm import Session

from app.config import (
    HOD_ASSISTANT_API_KEY,
    GEMINI_API_KEY,
    HOD_ASSISTANT_LIVE_MODEL
)
from app.models.models import User, Department
from app.models.assessment_models import AssistantChatSession
from app.services.assessment.hod_assistant_service import hod_assistant_service, ASSISTANT_TOOLS

logger = logging.getLogger(__name__)

class LiveAgentSession:
    """
    Represents a persistent, department-scoped Live Agent WebSocket session.
    Bridges the React client WebSocket to Google's Gemini BidiGenerateContent endpoint.
    """

    def __init__(
        self,
        user_id: int,
        user_name: str,
        user_role: str,
        department_id: Optional[int],
        department_name: Optional[str],
        session_id: str
    ):
        self.user_id = user_id
        self.user_name = user_name
        self.user_role = user_role
        self.department_id = department_id
        self.department_name = department_name
        self.session_id = session_id

        self.api_key = HOD_ASSISTANT_API_KEY or GEMINI_API_KEY
        self.model = HOD_ASSISTANT_LIVE_MODEL or "gemini-2.5-flash-native-audio-latest"
        self.google_ws_url = (
            f"wss://generativelanguage.googleapis.com/ws/"
            f"google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key={self.api_key}"
        )
        self.ws: Optional[websockets.WebSocketClientProtocol] = None
        self.is_setup = False

    async def connect(self):
        """Establishes persistent connection to Google Gemini Live API."""
        logger.info(
            "Connecting LiveAgentSession to Google WebSocket [%s] for user=%s (Role=%s, Dept=%s)",
            self.model, self.user_name, self.user_role, self.department_id
        )
        # Google's BidiGenerateContent WebSocket does not respond to client RFC 6455 Ping frames;
        # disable client ping_interval to avoid premature keepalive ping timeouts (error 1011).
        self.ws = await websockets.connect(self.google_ws_url, ping_interval=None, ping_timeout=None)
        await self._send_setup_frame()
        self.is_setup = True
        logger.info("LiveAgentSession setup complete for session_id=%s", self.session_id)

    async def _send_setup_frame(self):
        """Transmits setup configuration with tools and department-scoped instructions."""
        dept_str = f"Department of {self.department_name}" if self.department_name else "All Institutional Departments"
        system_prompt = (
            f"You are the NASC Executive AI Copilot for Nehru Arts and Science College. "
            f"You are collaborating with {self.user_name} ({self.user_role}, Scope: {dept_str}). "
            f"Institutional Departments in Database: 'CS' (Computer Science), 'AI' (Artificial Intelligence), 'IOT & AIML' (Department of IOT and AIML).\n\n"
            f"STRICT BEHAVIORAL DIRECTIVES:\n"
            f"1. SILENT TOOL CALLING: When you decide to call a tool, invoke the tool immediately and completely SILENTLY. DO NOT generate text announcing what tool you will call or what parameters you plan to use (e.g. NEVER say 'Analyzing...', 'Pinpointing...', 'I plan to call...', or 'Let me check...').\n"
            f"2. DUAL TEXT & AUDIO OUTPUT: For every response, you MUST output clear, well-structured natural language text with GitHub Markdown tables and bullet points for the chat window, in addition to audio.\n"
            f"3. EXECUTIVE SUMMARY: When presenting tool data, highlight key metrics, enrollment numbers, pass percentages, and actionable insights.\n"
            f"4. SCOPE & MULTI-TENANCY: For HoD, focus strictly on {dept_str}. For Administrator, provide institution-wide insights across all departments.\n"
            f"5. SCREEN AWARENESS: When webpage tables or DOM elements are present in context, directly reference them."
        )

        setup_msg = {
            "setup": {
                "model": f"models/{self.model}",
                "generationConfig": {
                    "responseModalities": ["AUDIO"],
                    "speechConfig": {
                        "voiceConfig": {
                            "prebuiltVoiceConfig": {
                                "voiceName": "Aoede"
                            }
                        }
                    },
                    "temperature": 0.3
                },
                "systemInstruction": {
                    "parts": [{"text": system_prompt}]
                },
                "tools": [
                    {
                        "functionDeclarations": ASSISTANT_TOOLS
                    }
                ]
            }
        }
        await self.ws.send(json.dumps(setup_msg))
        ack = await self.ws.recv()
        logger.debug("Received setup ack from Google: %s", ack[:100] if isinstance(ack, str) else len(ack))

    def _format_tools_markdown(self, tools_executed: List[Dict[str, Any]]) -> str:
        """Synthesizes executive markdown presentation when live model responds in audio."""
        blocks = []
        for t in tools_executed:
            tool_name = t.get("tool")
            res = t.get("result", {})

            if tool_name == "get_department_kpis":
                depts = res.get("departments", [])
                lines = [
                    f"### 📊 Department KPIs & Performance Overview\n",
                    f"| Department | Code | Enrolled Students | Total Attempts | Completed | Pass Rate | Avg Score |",
                    f"| :--- | :---: | :---: | :---: | :---: | :---: | :---: |"
                ]
                for d in depts:
                    lines.append(
                        f"| **{d.get('department_name')}** | `{d.get('department_code')}` | {d.get('total_enrolled_students', 0)} | "
                        f"{d.get('total_attempts', 0)} | {d.get('completed_evaluations', 0)} | "
                        f"**{d.get('pass_rate_percentage', 0.0)}%** | {d.get('average_score_percentage', 0.0)}% |"
                    )
                lines.append(f"\n*Status: {res.get('summary', 'Metrics updated')} (Evaluated at {res.get('evaluated_at', 'UTC')})*")
                blocks.append("\n".join(lines))

            elif tool_name == "get_at_risk_students":
                records = res.get("at_risk_students", [])
                thresh = res.get("score_threshold_checked", 50.0)
                if records:
                    lines = [
                        f"### ⚠️ At-Risk Candidates Identified (Score < {thresh}%)\n",
                        f"| Student Name | Register No. | Class | Round | Score | Percentage | Date |",
                        f"| :--- | :---: | :---: | :--- | :---: | :---: | :---: |"
                    ]
                    for r in records:
                        lines.append(
                            f"| **{r.get('student_name')}** | `{r.get('register_number')}` | {r.get('class')} | "
                            f"{r.get('round_attempted')} | {r.get('score_obtained')} | **{r.get('percentage')}%** | {r.get('attempt_date')} |"
                        )
                    lines.append(f"\n**Recommendation:** {res.get('summary')}")
                    blocks.append("\n".join(lines))
                else:
                    blocks.append(
                        f"### ⚠️ At-Risk Candidates Review (Threshold < {thresh}%)\n\n"
                        f"✅ **No at-risk candidates found.** All {res.get('total_enrolled_candidates_checked', 'enrolled')} students are performing satisfactorily, or have not yet sat for evaluated assessment rounds in this cycle."
                    )

            elif tool_name == "get_live_exam_status":
                domains = res.get("domain_breakdown", [])
                lines = [
                    f"### 📈 Live Assessment Operational Status\n",
                    f"- **Currently in Progress**: `{res.get('currently_in_progress', 0)}` exams",
                    f"- **Completed Submissions**: `{res.get('total_completed', 0)}` attempts",
                    f"- **Overall Pass Rate**: `{res.get('overall_pass_rate_percentage', 0.0)}%`\n"
                ]
                if domains:
                    lines.append("| Assessment Domain | Total Attempts | Currently Active |")
                    lines.append("| :--- | :---: | :---: |")
                    for d in domains:
                        lines.append(f"| **{d.get('domain')}** | {d.get('total_attempts', 0)} | `{d.get('currently_active', 0)} active` |")
                blocks.append("\n".join(lines))

            elif tool_name == "get_pending_approvals":
                reqs = res.get("pending_requests", [])
                if reqs:
                    lines = [
                        f"### ⏳ Pending Assessment Activation Requests\n",
                        f"| Request ID | Domain | Department | Class | Candidates | Requested By | Date |",
                        f"| :---: | :--- | :--- | :---: | :---: | :--- | :---: |"
                    ]
                    for r in reqs:
                        lines.append(
                            f"| `#{r.get('request_id')}` | **{r.get('domain')}** | {r.get('department')} | "
                            f"`{r.get('class_code')}` | {r.get('candidates_count')} students | {r.get('requested_by')} | {r.get('requested_at')} |"
                        )
                    blocks.append("\n".join(lines))
                else:
                    blocks.append("### ⏳ Pending Approvals Status\n\n✅ **All roster activation requests are up-to-date.** There are 0 pending activation requests requiring review.")

            elif tool_name == "get_question_bank_summary":
                domains = res.get("domains", [])
                lines = [
                    f"### 📦 Question Bank Inventory\n",
                    f"- **Total Question Bank Inventory**: `{res.get('total_questions_in_bank', 0)}` questions\n",
                    f"| Domain | Rounds Count | Total Questions |",
                    f"| :--- | :---: | :---: |"
                ]
                for d in domains:
                    lines.append(f"| **{d.get('domain')}** | {d.get('rounds_count', 0)} rounds | `{d.get('total_questions', 0)} questions` |")
                blocks.append("\n".join(lines))

            else:
                blocks.append(f"### Live Update ({tool_name})\n\n```json\n{json.dumps(res, indent=2)}\n```")

        return "\n\n---\n\n".join(blocks)

    async def send_turn(
        self,
        user_message: str,
        page_context: Optional[Dict[str, Any]],
        db: Session,
        on_token: Callable[[str], Awaitable[None]],
        on_tool_call: Callable[[str, Dict[str, Any]], Awaitable[None]],
        on_audio_chunk: Optional[Callable[[str], Awaitable[None]]] = None
    ) -> Dict[str, Any]:
        """
        Executes a live conversational turn.
        Formats webpage DOM context, transmits to Gemini Live, handles tool callbacks,
        and streams text tokens in real time.
        """
        if not self.ws or not self.is_setup or getattr(self.ws, "closed", True):
            await self.connect()

        # Format In-Page Context
        context_parts = []
        if page_context:
            route = page_context.get("current_path", "Portal")
            title = page_context.get("page_title", "")
            tables = page_context.get("visible_tables", [])
            badges = page_context.get("metrics_summary", {})

            context_parts.append(f"=== CURRENT USER SCREEN ===")
            context_parts.append(f"Active Route: {route}")
            if title:
                context_parts.append(f"Page Title: {title}")
            if badges:
                context_parts.append(f"Visible Metrics on Screen: {json.dumps(badges)}")
            if tables:
                context_parts.append(f"Visible Table Data ({len(tables)} tables on screen):")
                for idx, t in enumerate(tables):
                    headers = t.get("headers", [])
                    rows = t.get("rows", [])
                    context_parts.append(f"Table {idx + 1} Columns: {', '.join(headers)}")
                    for r_idx, row in enumerate(rows[:10]):
                        context_parts.append(f"Row {r_idx + 1}: {row}")
            context_parts.append("===========================\n")

        full_prompt = "\n".join(context_parts) + f"User Query: {user_message}"

        # Send turn to Gemini Live WebSocket
        turn_payload = {
            "clientContent": {
                "turns": [
                    {
                        "role": "user",
                        "parts": [{"text": full_prompt}]
                    }
                ],
                "turnComplete": True
            }
        }
        await self.ws.send(json.dumps(turn_payload))

        accumulated_text = []
        tools_executed = []

        # Read streaming events from Gemini Live
        max_turns = 40
        while max_turns > 0:
            max_turns -= 1
            try:
                raw_msg = await asyncio.wait_for(self.ws.recv(), timeout=12.0)
            except asyncio.TimeoutError:
                logger.warning("Timeout waiting for Gemini Live event.")
                break

            data = json.loads(raw_msg)

            # Check 1: Tool Call
            if "toolCall" in data:
                calls = data["toolCall"].get("functionCalls", [])
                responses = []
                for call in calls:
                    fn_name = call.get("name")
                    fn_args = call.get("args", {})
                    call_id = call.get("id")

                    logger.info("Live Agent toolCall: %s with args: %s (Tenant: %s)", fn_name, fn_args, self.department_id)
                    await on_tool_call(fn_name, fn_args)

                    # Execute strictly scoped tool against PostgreSQL
                    tool_result = hod_assistant_service.execute_tool(
                        tool_name=fn_name,
                        arguments=fn_args,
                        user_role=self.user_role,
                        dept_id=self.department_id,
                        db=db
                    )
                    tools_executed.append({"tool": fn_name, "arguments": fn_args, "result": tool_result})

                    responses.append({
                        "response": {"output": tool_result},
                        "id": call_id
                    })

                # Send tool response back to Gemini Live
                tool_reply = {
                    "toolResponse": {
                        "functionResponses": responses
                    }
                }
                await self.ws.send(json.dumps(tool_reply))

            # Check 2: Server Content (Model Turn Tokens / Audio)
            if "serverContent" in data:
                sc = data["serverContent"]
                model_turn = sc.get("modelTurn", {})
                parts = model_turn.get("parts", [])

                for part in parts:
                    # CRITICAL: Suppress internal model thoughts from Gemini 2.5 Live
                    if part.get("thought"):
                        continue

                    # Stream Text Token if provided in part
                    if "text" in part and part["text"]:
                        txt = part["text"]
                        accumulated_text.append(txt)
                        await on_token(txt)

                    # Stream Audio Chunk if provided
                    if "inlineData" in part and on_audio_chunk:
                        audio_b64 = part["inlineData"].get("data", "")
                        if audio_b64:
                            await on_audio_chunk(audio_b64)

                if sc.get("turnComplete"):
                    break

        final_response_text = "".join(accumulated_text).strip()

        # If tools were executed, verify if substantive text was emitted.
        # If the native audio model responded via voice chunks without text, synthesize a structured markdown table:
        if tools_executed:
            if not final_response_text or len(final_response_text) < 40:
                final_response_text = self._format_tools_markdown(tools_executed)
                await on_token(final_response_text)
        elif not final_response_text:
            final_response_text = (
                f"I am actively tracking your active screen at `{page_context.get('current_path', 'Portal') if page_context else 'Dashboard'}`. "
                f"How may I assist you with the visible records or department operations?"
            )
            await on_token(final_response_text)

        return {
            "response": final_response_text,
            "tools_executed": tools_executed,
            "model_used": self.model,
            "timestamp": datetime.datetime.utcnow().strftime("%H:%M:%S")
        }

    async def close(self):
        """Closes the Google WebSocket cleanly."""
        if self.ws:
            try:
                await self.ws.close()
            except Exception:
                pass
            self.ws = None
            self.is_setup = False


# ------------------------------------------------------------------------------
# Persistent Conversation Storage Helper (PostgreSQL Multi-Tenancy)
# ------------------------------------------------------------------------------

def get_or_create_chat_session(
    db: Session,
    user: User,
    session_id: str,
    user_role: str,
    department_id: Optional[int]
) -> AssistantChatSession:
    """Retrieves or initializes a department-scoped AssistantChatSession in PostgreSQL."""
    session_record = db.query(AssistantChatSession).filter(
        AssistantChatSession.session_id == session_id
    ).first()

    if not session_record:
        session_record = AssistantChatSession(
            session_id=session_id,
            user_id=user.id,
            user_role=user_role,
            department_id=department_id,
            title=f"Chat Session with {user.full_name}",
            page_context_json={},
            messages_json=[
                {
                    "id": "welcome_init",
                    "sender": "assistant",
                    "text": f"**Welcome, {user.full_name}!**\n\nI am your **NASC AI Assistant**, live-aware of your active screen and department data. How may I assist you today?",
                    "timestamp": datetime.datetime.utcnow().strftime("%H:%M:%S")
                }
            ]
        )
        db.add(session_record)
        db.commit()
        db.refresh(session_record)

    # Multi-tenancy check: Verify ownership
    if session_record.user_id != user.id:
        raise PermissionError("Access to this chat session is prohibited by multi-tenancy rules.")

    if user_role == "HoD" and department_id and session_record.department_id != department_id:
        raise PermissionError("Department tenancy violation for chat session.")

    return session_record


def append_message_to_session(
    db: Session,
    session_id: str,
    sender: str,
    text: str,
    tools_executed: Optional[List[Dict[str, Any]]] = None,
    page_context: Optional[Dict[str, Any]] = None
):
    """Commits new turn to PostgreSQL AssistantChatSession."""
    record = db.query(AssistantChatSession).filter(AssistantChatSession.session_id == session_id).first()
    if record:
        curr_messages = list(record.messages_json or [])
        msg_obj = {
            "id": f"{sender}_{int(datetime.datetime.utcnow().timestamp() * 1000)}",
            "sender": sender,
            "text": text,
            "timestamp": datetime.datetime.utcnow().strftime("%H:%M:%S"),
            "tools_executed": tools_executed or []
        }
        curr_messages.append(msg_obj)
        record.messages_json = curr_messages
        if page_context:
            record.page_context_json = page_context
        record.updated_at = datetime.datetime.utcnow()
        db.commit()
