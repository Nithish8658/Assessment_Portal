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

from google import genai
from google.genai import types

from app.config import HOD_ASSISTANT_API_KEY, GEMINI_API_KEY, HOD_ASSISTANT_LIVE_MODEL
from app.services.assistant.tools import UserContext, tool_registry, make_json_safe

logger = logging.getLogger(__name__)

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

    def _get_client(self) -> genai.Client:
        """Returns a genai.Client using the active API key."""
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

        return f"""You are the MockRun Autonomous Executive AI Copilot (powered by OpenLectern) for Nehru Arts and Science College (Autonomous).
You are collaborating directly with {self.ctx.user_name} ({self.ctx.primary_role}, Permitted Scope: {dept_scope}).
You are powered exclusively by Gemini 3.1 Flash Live.

CORE OPERATIONAL DIRECTIVES:
1. CONVERSATIONAL VS ANALYTICAL INTENT:
   - For conversational feedback, compliments, greetings, or acknowledgments (e.g., 'excellent', 'great', 'thanks', 'hello', 'good job', 'ok', 'noted'):
     Reply naturally, politely, and concisely in 1 sentence. DO NOT execute database queries, generate unsolicited tables, or append Executive Takeaways for simple remarks.
   - For actual data requests, performance audits, or analytical questions:
     Autonomously execute read-only queries and provide structured analytical briefings.

2. ZERO INTERMEDIARY PERMISSION QUESTIONS:
   - When asked a data or analytical question, NEVER ask: "Should I run this query?", "Do you want me to proceed?", or "May I have permission?".
   - You are granted FULL AUTONOMOUS READ-ONLY AUTHORITY. Execute tools SILENTLY without preamble or chatty filler text.

3. UNIVERSAL QUERY CAPABILITY:
   - You are NOT restricted to canned or fixed questions. You can answer ANY question about student performance, class averages, question bank distributions, pass rates, at-risk cohorts, round times, and assessment analytics.
   - If you need to understand table column names or foreign keys, call `get_database_schema` first.
   - Then execute tailored read-only SQL queries to retrieve the exact records.
   - Note on Domain 1: Domain 1 is titled 'Software Developer' (slug: 'software-developer').

4. DIRECT ANALYTICAL SYNTHESIS (FOR DATA QUERIES ONLY):
   - When presenting data analysis, format tables cleanly using standard GitHub Markdown (`| Col 1 | Col 2 |`).
   - Use bold font for high-impact numbers, pass percentages, and student names.
   - Conclude data briefings with a concise 1-2 sentence executive takeaway or recommendation.

5. MULTI-TENANCY COMPLIANCE:
   - If user is an HoD ({self.ctx.department_name}): all student, class, and programme queries MUST be scoped to department_id={self.ctx.department_id}.
   - If user is an Administrator: you have full multi-department institution-wide visibility.

6. SCREEN & DOM AWARENESS:
   - If the user refers to "this page", "visible table", "these numbers", or "my screen", call `inspect_screen_context` to read the DOM tables and metric cards directly from their active view.

7. POSTGRESQL ACCURACY GUIDELINES:
   - For rounding floats or percentages, cast to numeric: `ROUND(AVG(res.percentage)::numeric, 2)`.
   - Never invent non-existent tables or columns. Strictly use the exact tables and columns below:

EXACT POSTGRESQL SCHEMA (ZERO TRIAL-AND-ERROR - ALWAYS WRITE 100% ACCURATE SQL):
1. Academic Master:
   - users (id, username, email, full_name, is_active)
   - departments (id, code, name, school_id, hod_id)
   - programmes (id, code, name, degree_type, department_id, duration_years)
   - academic_classes (id, class_code, name, programme_id, batch_name, section_name, tutor_id)
   - students (id, register_number, user_id, programme_id, batch_name, section_name)
   - faculty (id, employee_id, user_id, department_id, designation)

2. Assessment Domains & Question Bank:
   - assessment_domains (id, title, slug, description, is_active) [Domain 1: 'Software Developer', slug: 'software-developer']
   - assessment_rounds (id, domain_id, round_number, slug, title, round_type, duration_minutes, questions_per_attempt)
   - assessment_questions (id, round_id, competency_id, question_type, title, difficulty, marks) [Difficulties: 'Easy', 'Medium', 'Hard']

3. Activations, Attempts & Results:
   - assessment_activation_requests (id, domain_id, academic_class_id, requested_by_id, reviewed_by_id, status, complexity_level, selected_rounds_json, valid_from, valid_until, requested_at, reviewed_at, notes)
     Note: Statuses are 'PENDING', 'APPROVED', 'REJECTED'. There is NO 'updated_at' column; use 'reviewed_at' or 'requested_at'.
   - assessment_student_allocations (id, request_id, student_id, status, valid_from, valid_until, allocated_at)
   - assessment_attempts (id, allocation_id, round_id, attempt_number, status, started_at, submitted_at, time_taken_seconds)
   - assessment_results (id, attempt_id, total_score, max_score, percentage, passed, readiness_index, evaluated_at)

Key Relational Joins:
- Department to Students: programmes p (p.department_id = :dept_id) JOIN students s (s.programme_id = p.id)
- Department to Results: students s JOIN assessment_student_allocations asa (asa.student_id = s.id) JOIN assessment_attempts att (att.allocation_id = asa.id) JOIN assessment_results res (res.attempt_id = att.id)
- Department to Activations: programmes p (p.department_id = :dept_id) JOIN academic_classes ac (ac.programme_id = p.id) JOIN assessment_activation_requests req (req.academic_class_id = ac.id)
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
        recent_history = conversation_history[-6:] if len(conversation_history) > 6 else conversation_history
        if recent_history:
            dialog_context = "PREVIOUS CONVERSATION CONTEXT:\n"
            for m in recent_history:
                sender = m.get("sender", "user")
                txt = m.get("text", "")
                if txt:
                    dialog_context += f"- {sender}: {txt}\n"
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
                if ("429" in err_str or "RESOURCE_EXHAUSTED" in err_str) and attempt < max_attempts - 1:
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
