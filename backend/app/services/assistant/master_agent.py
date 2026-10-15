"""
Autonomous Master Agent Engine for HoD & Administrator Portal.
Strictly powered by Google Gemini Live: gemini-3.1-flash-live-preview.
Zero other models or fallback models.

Features:
- Pure Gemini Live API: Real-time bidirectional streaming via client.aio.live.connect
- Model: gemini-3.1-flash-live-preview exclusively
- Autonomous Tool Calling: Silently inspects schemas and executes read-only SQL
- Live Output Audio Transcription: Real-time text token streaming directly into chat UI
- Zero intermediary confirmation requests (auto_execute = True)
- Direct analytical synthesis: Markdown tables, metrics, executive takeaways
"""

import os
import json
import logging
import datetime
import asyncio
from typing import Dict, Any, List, Optional, Callable, Awaitable
from dataclasses import dataclass, field

from app.config import HOD_ASSISTANT_API_KEY, GEMINI_API_KEY, HOD_ASSISTANT_LIVE_MODEL
from app.services.assistant.tools import UserContext, tool_registry, make_json_safe

logger = logging.getLogger(__name__)

MAX_TOOL_CALLS_PER_TURN = 4
HISTORY_MESSAGES = 6
HISTORY_CHARS_PER_MESSAGE = 600

@dataclass
class TaskStep:
    step_id: str
    tool_name: str
    arguments: Dict[str, Any]
    result: Optional[Any] = None
    status: str = "PENDING"  # PENDING, EXECUTING, COMPLETED, FAILED

@dataclass
class AutonomousTaskPlan:
    task_id: str
    objective: str
    steps: List[TaskStep] = field(default_factory=list)
    auto_execute: bool = True


class AutonomousMasterAgent:
    """
    Autonomous Executive Intelligence Agent powered strictly by gemini-3.1-flash-live-preview.
    No other models or fallback models.
    """

    def __init__(self, user_context: UserContext):
        self.ctx = user_context
        # Strictly gemini-3.1-flash-live-preview (no fallback models)
        self.model_name = "gemini-3.1-flash-live-preview"
        self.api_keys = [k for k in [HOD_ASSISTANT_API_KEY, GEMINI_API_KEY] if k]
        self._current_key_idx = 0

    def _get_client(self) -> "genai.Client":
        """Returns a genai.Client using the active API key."""
        # Imported here: google.genai takes about a second to load, and every serverless cold start paid it
        from google import genai
        key = self.api_keys[self._current_key_idx % len(self.api_keys)]
        return genai.Client(api_key=key)

    def _rotate_key(self):
        """Rotates to backup API key if rate limited."""
        if len(self.api_keys) > 1:
            self._current_key_idx = (self._current_key_idx + 1) % len(self.api_keys)
            logger.warning("Switched to backup Gemini API key index: %d", self._current_key_idx)

    def _build_system_instruction(self) -> str:
        dept_scope = (
            f"Department of {self.ctx.department_name} (ID={self.ctx.department_id}, Code='{self.ctx.department_code}')"
            if self.ctx.is_hod
            else "All Institutional Departments (Institution-Wide Executive Scope)"
        )

        return f"""You are the MockRun Executive AI Copilot (by OpenLectern) for Nehru Arts and Science College (Autonomous).
You assist {self.ctx.user_name} ({self.ctx.primary_role}; permitted scope: {dept_scope}).

HOW TO ANSWER
1. Greetings, thanks or acknowledgements: reply in one short sentence. Do not call tools.
2. Data questions: call tools silently. Never ask for permission and never narrate tool use.
3. Pick the dedicated tool first:
   - Current or latest grades, scores, results, readiness, competencies (student or class): get_latest_results.
   - Progress, improvement, decline, attempt history or retakes of a student: get_student_progress.
   - Department pass rates and averages: get_department_kpis. Struggling students: get_at_risk_students.
   - Pending activation requests: get_pending_approvals. Live exam activity: get_live_exam_status.
   - Question bank size or health: get_question_bank_summary.
   - Questions about "this page", "this table" or "my screen": inspect_screen_context.
   - Only if none fits: get_database_schema, then one execute_readonly_sql.
4. Retakes: a round's current grade is its latest published attempt. Never average, sum or pick the best
   across attempts of the same round. Earlier attempts are history, shown only when progress is asked.
5. When the user asks to see students, rows or comparisons, present a Markdown table
   (| Column | Column |), bold the key numbers, and end with a one or two sentence takeaway.
   The chat panel is narrow: use at most 4 columns, keep cell text short, and show each student once.
6. Stay within the permitted scope. If a tool returns needs_clarification, ask the user which student is meant.
7. Use at most 3 tool calls per question, then answer with the data you have.
"""

    async def process_utterance(
        self,
        utterance: str,
        conversation_history: List[Dict[str, Any]],
        page_context: Optional[Dict[str, Any]] = None,
        on_token: Optional[Callable[[str], Awaitable[None]]] = None,
        on_tool_call: Optional[Callable[[str, Dict[str, Any]], Awaitable[None]]] = None
    ) -> Dict[str, Any]:
        """
        Executes an autonomous turn strictly using gemini-3.1-flash-live-preview via client.aio.live.connect:
        1. Formulates plan & dispatches read-only queries when needed.
        2. Receives live transcription stream.
        3. Delivers synthesized analytical report or conversational reply.
        """
        from google.genai import types
        system_instruction = self._build_system_instruction()

        # Build tools declarations
        raw_tools = tool_registry.get_tool_declarations()
        gemini_tools = [
            types.Tool(
                function_declarations=[
                    types.FunctionDeclaration(
                        name=t["name"],
                        description=t["description"],
                        parameters=t.get("parameters")
                    )
                    for t in raw_tools
                ]
            )
        ]

        # Live connection config for gemini-3.1-flash-live-preview
        config = types.LiveConnectConfig(
            response_modalities=["AUDIO"],
            output_audio_transcription=types.AudioTranscriptionConfig(),
            tools=gemini_tools,
            system_instruction=types.Content(parts=[types.Part.from_text(text=system_instruction)])
        )

        # Build input prompt with recent conversation context
        user_prompt = ""
        # Bounded context: last few messages, each trimmed, so cost per turn stays flat.
        recent_history = [m for m in conversation_history if m.get("text")][-HISTORY_MESSAGES:]
        if recent_history:
            dialog_context = "PREVIOUS CONVERSATION CONTEXT:\n"
            for m in recent_history:
                txt = m.get("text", "")
                if len(txt) > HISTORY_CHARS_PER_MESSAGE:
                    txt = txt[:HISTORY_CHARS_PER_MESSAGE] + "…"
                dialog_context += f"- {m.get('sender', 'user')}: {txt}\n"
            user_prompt += dialog_context + "\nCURRENT USER QUERY:\n"

        user_prompt += utterance
        
        # Attach active screen hint only if relevant to the query to avoid unsolicited screen data dumps
        lower_u = utterance.lower()
        screen_triggers = ["this page", "screen", "visible", "table", "these", "current view", "here", "dashboard"]
        if page_context and page_context.get("current_path") and any(w in lower_u for w in screen_triggers):
            path_hint = f"\n[User's Active Screen: {page_context.get('page_title', '')} at path '{page_context.get('current_path', '')}']"
            user_prompt += path_hint

        tools_executed: List[Dict[str, Any]] = []
        final_text = ""

        # Attempt turn with active API key (and rotate key if 429 encountered, strictly on gemini-3.1-flash-live-preview)
        max_attempts = len(self.api_keys)
        for attempt in range(max_attempts):
            client = self._get_client()
            try:
                async with client.aio.live.connect(model=self.model_name, config=config) as session:
                    logger.info("Connected to Gemini Live session using model: %s", self.model_name)
                    
                    # Transmit client turn
                    await session.send_client_content(
                        turns=[types.Content(role="user", parts=[types.Part.from_text(text=user_prompt)])],
                        turn_complete=True
                    )

                    async for response in session.receive():
                        d = response.model_dump(exclude_none=True)

                        # Handle autonomous function calls
                        if "tool_call" in d:
                            for fc in d["tool_call"].get("function_calls", []):
                                tool_name = fc["name"]
                                tool_args = fc.get("args", {})
                                tool_id = fc.get("id", f"call_{len(tools_executed) + 1}")

                                if len(tools_executed) >= MAX_TOOL_CALLS_PER_TURN:
                                    tool_result = {"error": "Tool limit reached for this question. Answer now with the data already retrieved."}
                                else:
                                    logger.info("Autonomous Agent [%s] executing: %s (%s)", self.model_name, tool_name, tool_args)
                                    if on_tool_call:
                                        await on_tool_call(tool_name, tool_args)
                                    # Execute in worker threadpool so database I/O never blocks the async event loop
                                    tool_result = await asyncio.to_thread(
                                        tool_registry.dispatch,
                                        tool_name=tool_name,
                                        arguments=tool_args,
                                        ctx=self.ctx,
                                        page_context=page_context
                                    )
                                tools_executed.append({
                                    "tool": tool_name,
                                    "arguments": tool_args,
                                    "result": tool_result
                                })

                                func_response = types.FunctionResponse(
                                    name=tool_name,
                                    id=tool_id,
                                    response={"result": make_json_safe(tool_result)}
                                )
                                await session.send_tool_response(function_responses=[func_response])

                        # Handle live output transcription streaming
                        if response.server_content:
                            sc = d.get("server_content", {})
                            if "output_transcription" in sc:
                                token_chunk = sc["output_transcription"].get("text", "")
                                if token_chunk:
                                    final_text += token_chunk
                                    if on_token:
                                        await on_token(token_chunk)

                            if response.server_content.turn_complete:
                                break

                # Successfully completed turn
                break

            except Exception as e:
                err_str = str(e)
                logger.warning("Gemini Live attempt %d failed on model %s: %s", attempt + 1, self.model_name, err_str[:120])
                if any(m in err_str for m in ("429", "RESOURCE_EXHAUSTED", "quota", "1011", "1013")) and attempt < max_attempts - 1:
                    self._rotate_key()
                    continue
                else:
                    raise e

        # If tools executed but model produced minimal text, provide fallback summary
        if not final_text and tools_executed:
            final_text = "### 📊 Data Analysis Completed\n\nData retrieved successfully from the institutional database. Please see the detailed breakdown above."

        return {
            "response": final_text,
            "tools_executed": tools_executed,
            "model_used": self.model_name,
            "timestamp": datetime.datetime.utcnow().strftime("%H:%M:%S")
        }
