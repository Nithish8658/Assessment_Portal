"""
Strict Google Gemini LLM Qualitative Evaluation Client.
Evaluates candidate open-ended responses, architectural reasoning, business cases,
and multi-turn customer chat transcripts strictly using Gemini models.
"""

import json
import logging
import re
import asyncio
import httpx
from typing import Dict, Any, List, Optional

from app.config import GEMINI_API_KEY, GEMINI_MODELS

logger = logging.getLogger(__name__)

class GeminiEvaluator:
    """Strict Gemini-powered qualitative rubric evaluation service."""

    def __init__(self):
        self.api_key = GEMINI_API_KEY
        # Strict user-specified models with prioritized cascade
        configured_models = GEMINI_MODELS or []
        fallback_models = ["gemini-3.1-flash-lite", "gemini-2.5-flash-lite", "gemini-3.5-flash-lite", "gemini-2.5-flash"]
        # Merge preserving order without duplicates
        self.models = []
        for m in configured_models + fallback_models:
            if m and m not in self.models:
                self.models.append(m)

    async def _call_gemini_cascade(self, system_instruction: str, user_prompt: str, timeout_seconds: float = 12.0) -> str:
        """Cascades through Gemini models strictly until a valid response is received."""
        if not self.api_key:
            raise RuntimeError("GEMINI_API_KEY is not configured in backend environment.")

        headers = {"Content-Type": "application/json"}
        last_error = None

        payload = {
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": f"{system_instruction}\n\n{user_prompt}"}]
                }
            ],
            "generationConfig": {
                "temperature": 0.2,
                "topP": 0.95,
                "maxOutputTokens": 2048,
                "responseMimeType": "application/json"
            }
        }

        async with httpx.AsyncClient(timeout=timeout_seconds) as client:
            for model in self.models:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={self.api_key}"
                try:
                    res = await client.post(url, json=payload, headers=headers)
                    if res.status_code == 200:
                        data = res.json()
                        candidates = data.get("candidates", [])
                        if candidates and candidates[0].get("content", {}).get("parts"):
                            return candidates[0]["content"]["parts"][0]["text"].strip()
                    else:
                        last_error = f"Model {model} returned HTTP {res.status_code}: {res.text[:200]}"
                        logger.warning("Gemini model %s call failed (%s). Cascading to next model...", model, res.status_code)
                except Exception as e:
                    last_error = f"Model {model} exception: {str(e)}"
                    logger.warning("Gemini model %s exception (%s). Cascading...", model, e)

        raise RuntimeError(f"All Gemini models exhausted. Last error: {last_error}")

    def _extract_json(self, text: str) -> Dict[str, Any]:
        """Extracts and parses JSON object from LLM response text with multi-layer fallback."""
        cleaned = text.strip()
        # Strip markdown code fences if present
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        elif cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()

        # Attempt direct JSON load
        try:
            return json.loads(cleaned)
        except Exception:
            pass

        # Regex fallback to find {...}
        match = re.search(r"\{.*\}", cleaned, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(0))
            except Exception:
                pass

        # Regex key-value extraction fallback if JSON was truncated
        fallback_data: Dict[str, Any] = {}
        score_match = re.search(r'"score_awarded"\s*:\s*([0-9.]+)', cleaned)
        if score_match:
            fallback_data["score_awarded"] = float(score_match.group(1))
        
        feedback_match = re.search(r'"feedback"\s*:\s*"([^"]*)', cleaned)
        if feedback_match:
            fallback_data["feedback"] = feedback_match.group(1)

        if fallback_data:
            return fallback_data

        raise ValueError(f"Could not parse valid JSON from Gemini output: {text[:200]}")

    async def evaluate_subjective_response(
        self,
        question_title: str,
        question_content: str,
        rubric: str,
        candidate_answer: str,
        max_marks: float = 5.0
    ) -> Dict[str, Any]:
        """
        Evaluates a candidate's descriptive, architectural, or business case answer strictly against the rubric.
        """
        if not candidate_answer or not str(candidate_answer).strip():
            return {
                "score_awarded": 0.0,
                "max_score": max_marks,
                "percentage": 0.0,
                "feedback": "Unanswered - No content provided.",
                "strengths": [],
                "gaps": ["Candidate provided no response."],
                "rubric_breakdown": []
            }

        system_instruction = (
            "You are a Senior Academic & Industry Assessment Evaluator for Nehru Arts and Science College. "
            "You must grade the student's answer strictly against the provided Question Prompt and Rubric. "
            f"Award marks between 0.0 and {max_marks:.1f}. "
            "You MUST respond ONLY in valid, parseable JSON with the exact keys: "
            "'score_awarded' (float), 'feedback' (concise 1-2 sentence string), 'strengths' (list of strings), "
            "'gaps' (list of strings), and 'rubric_breakdown' (list of objects with 'criterion', 'marks', 'max_marks', 'comments')."
        )

        user_prompt = f"""
=== QUESTION TITLE ===
{question_title}

=== QUESTION PROMPT ===
{question_content}

=== EVALUATION RUBRIC & EXPECTED CONCEPTS ===
{rubric}

=== MAXIMUM MARKS ===
{max_marks}

=== CANDIDATE ANSWER ===
{candidate_answer}

Produce the JSON evaluation object now.
"""

        raw_response = await self._call_gemini_cascade(system_instruction, user_prompt)
        parsed = self._extract_json(raw_response)

        raw_score = float(parsed.get("score_awarded", 0.0))
        # Ensure score is strictly bounded [0, max_marks]
        score_awarded = max(0.0, min(max_marks, round(raw_score, 2)))
        pct = round((score_awarded / max_marks) * 100.0, 2) if max_marks > 0 else 0.0

        return {
            "score_awarded": score_awarded,
            "max_score": max_marks,
            "percentage": pct,
            "feedback": parsed.get("feedback", "Evaluation completed by Gemini AI."),
            "strengths": parsed.get("strengths", []),
            "gaps": parsed.get("gaps", []),
            "rubric_breakdown": parsed.get("rubric_breakdown", [])
        }

    async def evaluate_simulation_transcript(
        self,
        scenario_title: str,
        scenario_content: str,
        rubric: str,
        transcript_data: Any,
        max_marks: float = 10.0
    ) -> Dict[str, Any]:
        """
        Evaluates a complete customer support chat simulation transcript.
        """
        if isinstance(transcript_data, str) and transcript_data.startswith("{"):
            try:
                transcript_dict = json.loads(transcript_data)
            except Exception:
                transcript_dict = {"raw": transcript_data}
        elif isinstance(transcript_data, dict):
            transcript_dict = transcript_data
        else:
            transcript_dict = {"raw": str(transcript_data)}

        messages = transcript_dict.get("messages", [])
        formatted_dialogue = ""
        for m in messages:
            sender = m.get("sender", "Unknown").upper()
            text = m.get("text", "")
            formatted_dialogue += f"[{sender}]: {text}\n"

        if not formatted_dialogue.strip():
            formatted_dialogue = str(transcript_dict.get("raw", "No conversation transcript recorded."))

        system_instruction = (
            "You are a Quality Assurance Director for an International Customer Support Center. "
            "Evaluate the candidate's customer chat dialogue strictly against the Scenario and Grading Rubric. "
            "Assess 4 core competencies: (1) Empathy & De-escalation, (2) SOP & Policy Adherence, "
            "(3) Technical / Logistic Accuracy, and (4) Communication Professionalism. "
            f"Award marks between 0.0 and {max_marks:.1f}. "
            "Respond ONLY in valid parseable JSON with keys: "
            "'score_awarded' (float), 'feedback' (string), 'strengths' (list), 'gaps' (list), 'rubric_breakdown' (list)."
        )

        user_prompt = f"""
=== SIMULATION SCENARIO ===
{scenario_title}
{scenario_content}

=== SOP & GRADING RUBRIC ===
{rubric}

=== MAXIMUM MARKS ===
{max_marks}

=== CONVERSATION TRANSCRIPT ===
{formatted_dialogue}

Produce the JSON evaluation object now.
"""

        raw_response = await self._call_gemini_cascade(system_instruction, user_prompt)
        parsed = self._extract_json(raw_response)

        raw_score = float(parsed.get("score_awarded", 0.0))
        score_awarded = max(0.0, min(max_marks, round(raw_score, 2)))
        pct = round((score_awarded / max_marks) * 100.0, 2) if max_marks > 0 else 0.0

        return {
            "score_awarded": score_awarded,
            "max_score": max_marks,
            "percentage": pct,
            "feedback": parsed.get("feedback", "Support simulation evaluated by Gemini QA engine."),
            "strengths": parsed.get("strengths", []),
            "gaps": parsed.get("gaps", []),
            "rubric_breakdown": parsed.get("rubric_breakdown", [])
        }

gemini_evaluator = GeminiEvaluator()
