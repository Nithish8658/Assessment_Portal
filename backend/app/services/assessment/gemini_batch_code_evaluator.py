"""
Gemini Batch Code Evaluator Service
Processes pending candidate coding and debugging submissions asynchronously in batch cycles (e.g., every 2 hours or on-demand),
evaluating C, Python, and Data Analytics programs strictly against rubrics, test cases, and domain standards using Google Gemini LLM.
"""

import asyncio
import json
import logging
import datetime
import re
import time
from typing import Dict, Any, List, Optional
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.assessment_models import (
    AssessmentAttempt,
    AssessmentRound,
    AssessmentQuestion,
    QuestionEvaluationConfig,
    AssessmentResponse,
    CodingSubmission,
    CodeExecutionResult,
    CompetencyScore,
    AssessmentResult
)
from app.services.assessment.gemini_evaluator import gemini_evaluator
from app.services.assessment.scoring_service import scoring_service

logger = logging.getLogger(__name__)

SYSTEM_INSTRUCTION_C = """You are the Senior Automated Code Evaluator and Grading Engine for C & Systems Programming.
Evaluate the candidate's C source code strictly against the given problem statement, test cases, and systems programming standards.

Evaluation Rubric:
1. Algorithmic Correctness & Logic (40% weightage): Does the code correctly solve the problem as described?
2. Edge Case Handling (30% weightage): Does it handle boundaries (e.g. 0, negatives, empty/single element, trailing zeros, duplicates)?
3. Pointer & Memory Safety (20% weightage): Does it avoid segmentation faults, memory leaks (free malloced memory), buffer overflows, and dangling pointers?
4. Code Quality & Standards (10% weightage): Proper syntax, standard C conventions, appropriate data types.

Return STRICTLY a JSON object with this exact schema:
{
  "score_awarded": float (between 0.0 and max_marks),
  "status": "Accepted" | "Partially Accepted" | "Wrong Answer" | "Compilation Error",
  "test_cases_simulated": [
    {
      "input": "...",
      "expected": "...",
      "simulated_output": "...",
      "passed": true | false,
      "reason": "..."
    }
  ],
  "compiler_diagnostics": "Short notes on memory safety, pointers, and potential segfaults/warnings",
  "qualitative_feedback": "Constructive 1-2 sentence evaluation of the candidate's solution approach"
}
"""

SYSTEM_INSTRUCTION_PYTHON = """You are the Senior Automated Code Evaluator and Grading Engine for Python & Software Engineering.
Evaluate the candidate's Python source code or bugfix strictly against the problem statement, test cases, and algorithmic standards.

Evaluation Rubric:
1. Algorithmic Correctness & Logic (40% weightage): Does the code correctly solve the problem or fix the bug as described?
2. Edge Case Handling (30% weightage): Does it handle empty inputs, single elements, negative numbers, large inputs, and recursion depth/bounds?
3. Time & Space Complexity & Idiomatic Python (20% weightage): Efficient complexity, proper use of Python data structures (dicts, sets, deques, generators).
4. Code Quality & Exception Handling (10% weightage): Clean code structure, PEP 8 style, avoidance of unnecessary globals.

Return STRICTLY a JSON object with this exact schema:
{
  "score_awarded": float (between 0.0 and max_marks),
  "status": "Accepted" | "Partially Accepted" | "Wrong Answer" | "Runtime Error",
  "test_cases_simulated": [
    {
      "input": "...",
      "expected": "...",
      "simulated_output": "...",
      "passed": true | false,
      "reason": "..."
    }
  ],
  "compiler_diagnostics": "Short notes on algorithmic complexity, runtime efficiency, and syntax/logic validity",
  "qualitative_feedback": "Constructive 1-2 sentence evaluation of the candidate's solution approach"
}
"""

SYSTEM_INSTRUCTION_PANDAS = """You are the Senior Automated Code Evaluator for Python Data Analytics (Pandas, NumPy, and Data Extraction).
Evaluate the candidate's data analysis script or transformation logic strictly against requirements and data processing standards.

Evaluation Rubric:
1. Data Transformation & Aggregation Correctness (40% weightage): Does the query/dataframe operation return the exact requested schema, metrics, or groupings?
2. Vectorization vs Efficiency (30% weightage): Does the candidate use vectorized Pandas/NumPy operations rather than slow iterative loops (`iterrows`, manual indexing)?
3. Handling Missing & Edge Values (20% weightage): Proper handling of nulls, NaNs, duplicate keys, and type conversions.
4. Code Standards (10% weightage): Clean Pandas chaining, sensible column naming, standard idioms.

Return STRICTLY a JSON object with this exact schema:
{
  "score_awarded": float (between 0.0 and max_marks),
  "status": "Accepted" | "Partially Accepted" | "Wrong Answer" | "Runtime Error",
  "test_cases_simulated": [
    {
      "input": "...",
      "expected": "...",
      "simulated_output": "...",
      "passed": true | false,
      "reason": "..."
    }
  ],
  "compiler_diagnostics": "Short notes on Pandas vectorized efficiency, dataframe operations, and data types",
  "qualitative_feedback": "Constructive 1-2 sentence evaluation of the candidate's data transformation approach"
}
"""


SYSTEM_INSTRUCTION_C_DEBUG = """You are the Senior Automated Grading Engine for C debugging tasks.
The candidate was given a buggy C program and asked to find and fix the defect(s).
Compare the ORIGINAL BUGGY CODE with the CANDIDATE'S FIXED CODE.

Evaluation Rubric:
1. Defect Fixed (50% weightage): Is the known defect actually corrected, not just hidden or commented out?
2. Behavioural Correctness (30% weightage): Does the fixed program now solve the stated problem for normal and edge inputs?
3. No New Defects (20% weightage): No new bugs, memory leaks, undefined behaviour, or compilation errors introduced.

Rules:
- If the candidate's code is functionally identical to the original buggy code, award 0.
- If the code would not compile, award at most 20% of max_marks.
- Rewriting the program from scratch is acceptable if it is correct.

Return STRICTLY a JSON object with this exact schema:
{
  "score_awarded": float (between 0.0 and max_marks),
  "status": "Accepted" | "Partially Accepted" | "Wrong Answer" | "Compilation Error",
  "test_cases_simulated": [
    {
      "input": "...",
      "expected": "...",
      "simulated_output": "...",
      "passed": true | false,
      "reason": "..."
    }
  ],
  "compiler_diagnostics": "Short notes on what was fixed, what remains broken, and any new issues",
  "qualitative_feedback": "Constructive 1-2 sentence evaluation of the candidate's fix"
}
"""

# Attempts claimed for evaluation longer than this are treated as abandoned
# (for example a serverless instance that timed out mid-run) and retried.
STALE_CLAIM_MINUTES = 15


class EvaluationUnavailable(RuntimeError):
    """Raised when the AI grader cannot be reached; the attempt stays queued for retry."""


def _normalize_code(code: Optional[str]) -> str:
    """Strip comments and whitespace so cosmetic edits do not count as a change."""
    if not code:
        return ""
    code = re.sub(r"/\*.*?\*/", "", code, flags=re.S)
    code = re.sub(r"//[^\n]*", "", code)
    return re.sub(r"\s+", "", code)


def detect_target_language(
    code_str: str,
    question: Optional[AssessmentQuestion] = None,
    snapshot_content: Optional[Dict[str, Any]] = None,
    round_type: Optional[str] = None
) -> str:
    """Detects whether code is C, Python, or Pandas Data Analytics."""
    q_tmpl = getattr(question, "candidate_code_template", "") or ""
    snap_tmpl = (snapshot_content.get("candidate_code_template") or snapshot_content.get("code_template") or "") if snapshot_content else ""
    combined_context = f"{code_str} {q_tmpl} {snap_tmpl}".lower()

    if "pandas" in combined_context or "pd." in combined_context or "dataframe" in combined_context or round_type == "PYTHON_PRACTICAL":
        return "pandas"
    if "#include" in combined_context or "printf(" in combined_context or "scanf(" in combined_context or "malloc(" in combined_context or "int main" in combined_context:
        return "c"
    if "def " in combined_context or "import " in combined_context or "print(" in combined_context or "sys.stdin" in combined_context or "lambda" in combined_context:
        return "python"

    if round_type == "CODING" and ("#include" in combined_context or "int " in combined_context):
        return "c"
    return "python" if "python" in str(round_type).lower() else "c"


class GeminiBatchCodeEvaluator:
    """Universal batch code evaluator for C, Python, and Data Analytics across all assessment domains."""

    async def evaluate_single_submission(
        self,
        question: Optional[AssessmentQuestion],
        eval_config: Optional[QuestionEvaluationConfig],
        code_str: str,
        max_marks: float = 10.0,
        snapshot_content: Optional[Dict[str, Any]] = None,
        round_type: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Evaluates a single code submission via Gemini API with language-adaptive rubrics.
        Raises EvaluationUnavailable if Gemini cannot be reached, so callers keep the
        attempt queued instead of awarding unearned marks.
        """
        snapshot_content = snapshot_content or {}
        if not code_str or not code_str.strip():
            return {
                "score_awarded": 0.0,
                "status": "No Code Submitted",
                "test_cases_simulated": [],
                "compiler_diagnostics": "Candidate submitted an empty response.",
                "qualitative_feedback": "No source code was submitted for evaluation.",
                "detected_language": "c"
            }

        q_type = str(snapshot_content.get("question_type") or getattr(question, "question_type", "") or "").lower()
        is_debugging = "debug" in q_type or round_type == "DEBUGGING"
        starter_code = (
            snapshot_content.get("candidate_code_template")
            or snapshot_content.get("code_template")
            or getattr(question, "candidate_code_template", None)
            or ""
        )

        # Submitting the starter code unchanged earns nothing, without spending an AI call.
        if starter_code and _normalize_code(code_str) == _normalize_code(starter_code):
            return {
                "score_awarded": 0.0,
                "status": "No Changes Made",
                "test_cases_simulated": [],
                "compiler_diagnostics": "The submitted code is identical to the provided starter code.",
                "qualitative_feedback": (
                    "The original buggy code was submitted without a fix." if is_debugging
                    else "Only the starter skeleton was submitted; no solution was implemented."
                ),
                "detected_language": "c"
            }

        # Safe extraction from question or snapshot
        q_title = getattr(question, 'title', None) or snapshot_content.get("title") or "Programming Task"
        q_diff = getattr(question, 'difficulty', None) or snapshot_content.get("difficulty") or "Medium"
        q_content = (
            snapshot_content.get("candidate_content")
            or snapshot_content.get("content")
            or getattr(question, 'candidate_content', None)
            or ""
        )

        # Detect language and select system instruction
        target_lang = detect_target_language(code_str, question, snapshot_content, round_type)
        if target_lang == "pandas":
            system_instruction = SYSTEM_INSTRUCTION_PANDAS
            fence_lang = "python"
        elif target_lang == "python":
            system_instruction = SYSTEM_INSTRUCTION_PYTHON
            fence_lang = "python"
        else:
            system_instruction = SYSTEM_INSTRUCTION_C_DEBUG if is_debugging else SYSTEM_INSTRUCTION_C
            fence_lang = "c"

        # Build test cases string
        tcs = []
        if eval_config:
            tcs.extend(eval_config.public_test_cases_json or [])
            tcs.extend(eval_config.hidden_test_cases_json or [])

        tcs_text = json.dumps(tcs, indent=2) if tcs else "No predefined test cases provided."
        ref_sol = (eval_config.reference_solution if eval_config else None) or "N/A"

        if is_debugging:
            opts = snapshot_content.get("options_json") if isinstance(snapshot_content.get("options_json"), dict) else {}
            known_defect = (eval_config.correct_answer if eval_config else None) or opts.get("debug_hint") or "Not specified"
            user_prompt = f"""Problem Title: {q_title}
Difficulty: {q_diff}
Target Language: {target_lang.upper()}
Max Marks: {max_marks}

Problem Description:
{q_content}

Known Defect & Expected Fix (grader-only, never shown to the candidate):
{known_defect}

Original Buggy Code Given to the Candidate:
```{fence_lang}
{starter_code or 'N/A'}
```

Test Cases (if any):
{tcs_text}

Candidate's Fixed Code:
```{fence_lang}
{code_str}
```

Evaluate the fix rigorously and return the JSON evaluation:"""
        else:
            user_prompt = f"""Problem Title: {q_title}
Difficulty: {q_diff}
Target Language: {target_lang.upper()}
Max Marks: {max_marks}

Problem Description & Requirements:
{q_content}

Reference Solution (for comparison):
```{fence_lang}
{ref_sol}
```

Standard Test Cases (Public & Hidden):
{tcs_text}

Candidate's Submitted Source Code:
```{fence_lang}
{code_str}
```

Evaluate the code rigorously and return the JSON evaluation:"""

        try:
            raw_response = await gemini_evaluator._call_gemini_cascade(
                system_instruction=system_instruction,
                user_prompt=user_prompt,
                timeout_seconds=20.0
            )
            parsed = gemini_evaluator._extract_json(raw_response)
            score = float(parsed.get("score_awarded", 0.0))
        except Exception as e:
            logger.error("Gemini evaluation failed for question %s: %s", getattr(question, 'id', 'unknown'), str(e))
            raise EvaluationUnavailable(str(e)) from e

        parsed["score_awarded"] = round(max(0.0, min(score, max_marks)), 2)
        parsed["detected_language"] = "python" if target_lang in ["python", "pandas"] else "c"
        return parsed

    # ------------------------------------------------------------------
    # Attempt-level evaluation
    # ------------------------------------------------------------------

    def _claim_attempt(self, attempt_id: int, db: Session) -> bool:
        """Atomically marks an attempt as EVALUATING. Returns False if someone else holds it."""
        stale_before = datetime.datetime.utcnow() - datetime.timedelta(minutes=STALE_CLAIM_MINUTES)
        claimed = db.query(AssessmentAttempt).filter(
            AssessmentAttempt.id == attempt_id,
            AssessmentAttempt.status == "SUBMITTED",
            or_(
                AssessmentAttempt.evaluation_status.in_(["PENDING_BATCH", "FAILED"]),
                and_(
                    AssessmentAttempt.evaluation_status == "EVALUATING",
                    or_(AssessmentAttempt.batch_evaluated_at.is_(None), AssessmentAttempt.batch_evaluated_at < stale_before)
                )
            )
        ).update(
            {"evaluation_status": "EVALUATING", "batch_evaluated_at": datetime.datetime.utcnow()},
            synchronize_session=False
        )
        db.commit()
        return claimed == 1

    def pending_attempts_query(self, db: Session):
        stale_before = datetime.datetime.utcnow() - datetime.timedelta(minutes=STALE_CLAIM_MINUTES)
        return db.query(AssessmentAttempt).filter(
            AssessmentAttempt.status == "SUBMITTED",
            or_(
                AssessmentAttempt.evaluation_status.in_(["PENDING_BATCH", "FAILED"]),
                and_(
                    AssessmentAttempt.evaluation_status == "EVALUATING",
                    or_(AssessmentAttempt.batch_evaluated_at.is_(None), AssessmentAttempt.batch_evaluated_at < stale_before)
                )
            )
        )

    async def evaluate_attempt_now(self, attempt_id: int, db: Session) -> Dict[str, Any]:
        """
        Claims and evaluates one submitted coding/debugging attempt.
        Returns {"status": "completed" | "busy" | "retry_later" | "not_pending", ...}.
        """
        if not self._claim_attempt(attempt_id, db):
            attempt = db.query(AssessmentAttempt).filter(AssessmentAttempt.id == attempt_id).first()
            if attempt and attempt.evaluation_status == "EVALUATING":
                return {"status": "busy", "attempt_id": attempt_id}
            return {"status": "not_pending", "attempt_id": attempt_id}

        attempt = db.query(AssessmentAttempt).filter(AssessmentAttempt.id == attempt_id).populate_existing().first()
        round_obj = attempt.round
        round_type = round_obj.round_type if round_obj else "CODING"
        logger.info("Evaluating attempt ID %d (Round ID: %d, Type: %s)...", attempt.id, attempt.round_id, round_type)

        try:
            responses = db.query(AssessmentResponse).filter(AssessmentResponse.attempt_id == attempt.id).all()
            resp_map = {r.question_id: r.response_payload for r in responses}
            snapshots = list(attempt.snapshots or [])

            # Gather per-question jobs first, then run all AI calls concurrently.
            items = []
            for snap in snapshots:
                q_data = snap.snapshot_content_json or {}
                q_id = q_data.get("id") or snap.question_id
                q_marks = float(q_data.get("marks", 10.0))
                q_type = str(q_data.get("question_type", "coding")).lower()
                question = db.query(AssessmentQuestion).filter(AssessmentQuestion.id == q_id).first()
                eval_config = db.query(QuestionEvaluationConfig).filter(QuestionEvaluationConfig.question_id == q_id).first()
                raw_payload = resp_map.get(q_id, "")
                opts = q_data.get("options_json")
                is_mcq = q_type in ["mcq", "multiple_choice", "objective"] or (isinstance(opts, list) and len(opts) > 0)
                items.append((snap, q_data, q_id, q_marks, question, eval_config, raw_payload, is_mcq))

            async def _grade(item):
                snap, q_data, q_id, q_marks, question, eval_config, raw_payload, is_mcq = item
                if is_mcq:
                    cand_ans = str(raw_payload).strip().upper() if raw_payload else ""
                    correct_ans = str(eval_config.correct_answer or "").strip().upper() if eval_config else ""
                    earned = q_marks if (cand_ans and correct_ans and cand_ans == correct_ans) else 0.0
                    return {"mcq": True, "score_awarded": earned}

                code_str = ""
                if isinstance(raw_payload, str) and raw_payload.startswith("{"):
                    try:
                        code_str = json.loads(raw_payload).get("code", "")
                    except Exception:
                        code_str = raw_payload
                else:
                    code_str = str(raw_payload) if raw_payload else ""

                res = await self.evaluate_single_submission(
                    question=question,
                    eval_config=eval_config,
                    code_str=code_str,
                    max_marks=q_marks,
                    snapshot_content=q_data,
                    round_type=round_type
                )
                res["code_str"] = code_str
                return res

            results = await asyncio.gather(*[_grade(it) for it in items])

            total_attempt_score = 0.0
            max_attempt_score = 0.0
            competency_accumulator: Dict[int, Dict[str, float]] = {}
            question_details = []

            db.query(CodingSubmission).filter(CodingSubmission.attempt_id == attempt.id).delete(synchronize_session=False)

            for item, res in zip(items, results):
                snap, q_data, q_id, q_marks, question, eval_config, raw_payload, is_mcq = item
                earned = float(res["score_awarded"])
                total_attempt_score += earned
                max_attempt_score += q_marks
                comp_id = q_data.get("competency_id")
                if comp_id:
                    acc = competency_accumulator.setdefault(comp_id, {"score": 0.0, "max_score": 0.0})
                    acc["score"] += earned
                    acc["max_score"] += q_marks

                question_details.append({
                    "question_id": q_id,
                    "title": q_data.get("title", ""),
                    "marks_earned": earned,
                    "max_marks": q_marks,
                    "note": res.get("status", "MCQ") if not is_mcq else ("Correct" if earned else "Incorrect"),
                })
                if is_mcq:
                    continue

                simulated_tcs = res.get("test_cases_simulated", []) or []
                det_lang = res.get("detected_language", "python" if "python" in round_type.lower() else "c")
                sub = CodingSubmission(
                    attempt_id=attempt.id,
                    question_id=q_id,
                    language=det_lang,
                    source_code=res.get("code_str", ""),
                    status=res.get("status", "Evaluated"),
                    judge0_status_id=3 if res.get("status") == "Accepted" else 4,
                    test_cases_passed=sum(1 for tc in simulated_tcs if tc.get("passed")),
                    total_test_cases=len(simulated_tcs),
                    score_awarded=earned,
                    compiler_output=f"{res.get('qualitative_feedback', '')}\n[Diagnostics]: {res.get('compiler_diagnostics', '')}"
                )
                db.add(sub)
                db.flush()
                for idx, tc in enumerate(simulated_tcs):
                    db.add(CodeExecutionResult(
                        submission_id=sub.id,
                        test_case_index=idx,
                        is_passed=tc.get("passed", False),
                        input_data=str(tc.get("input", "")),
                        expected_output=str(tc.get("expected", "")),
                        actual_output=str(tc.get("simulated_output", "")),
                        error_output=str(tc.get("reason", ""))
                    ))

            # Competency scores
            for comp_id, scores in competency_accumulator.items():
                score_val = round(scores["score"], 2)
                max_val = round(scores["max_score"], 2)
                pct = round((score_val / max_val * 100.0), 2) if max_val > 0 else 0.0
                c_score = db.query(CompetencyScore).filter(
                    CompetencyScore.attempt_id == attempt.id,
                    CompetencyScore.competency_id == comp_id
                ).first()
                if not c_score:
                    c_score = CompetencyScore(attempt_id=attempt.id, competency_id=comp_id)
                    db.add(c_score)
                c_score.score = score_val
                c_score.max_score = max_val
                c_score.percentage = pct
                c_score.readiness_level = scoring_service.calculate_readiness_level(pct)

            percentage = round((total_attempt_score / max_attempt_score * 100.0), 2) if max_attempt_score > 0 else 0.0
            policy = round_obj.policy if round_obj else None
            policy_passing = policy.passing_score if policy else 60.0
            is_passed = scoring_service.evaluate_pass_fail(percentage, policy_passing)
            readiness = scoring_service.calculate_readiness_level(percentage)

            attempt.score = round(total_attempt_score, 2)
            attempt.percentage = percentage
            attempt.passed = is_passed
            attempt.status = "EVALUATED"
            attempt.evaluation_status = "COMPLETED"
            attempt.batch_evaluated_at = datetime.datetime.utcnow()
            attempt.evaluation_details_json = {
                "questions": question_details,
                "passing_score": policy_passing,
                "max_score": max_attempt_score,
            }

            res_obj = db.query(AssessmentResult).filter(AssessmentResult.attempt_id == attempt.id).first()
            if not res_obj:
                res_obj = AssessmentResult(attempt_id=attempt.id)
                db.add(res_obj)
            res_obj.total_score = round(total_attempt_score, 2)
            res_obj.max_score = round(max_attempt_score, 2)
            res_obj.percentage = percentage
            res_obj.passed = is_passed
            res_obj.readiness_index = readiness
            res_obj.evaluated_at = datetime.datetime.utcnow()
            from app.services.assessment.result_notifications import notify_result
            notify_result(db, attempt, percentage, is_passed)

            db.commit()
            logger.info("Attempt ID %d evaluated (Score: %.2f/%.2f, Passed: %s)", attempt.id, total_attempt_score, max_attempt_score, is_passed)
            # Round completed: store the student's updated radar / round results now.
            from app.services.assessment.competency_profiles import refresh_for_attempt
            refresh_for_attempt(db, attempt_id)
            return {"status": "completed", "attempt_id": attempt_id, "questions": len(items)}

        except Exception as e:
            db.rollback()
            retry = isinstance(e, EvaluationUnavailable)
            logger.error("Failed to evaluate attempt ID %d (%s): %s", attempt_id, "will retry" if retry else "error", str(e))
            db.query(AssessmentAttempt).filter(AssessmentAttempt.id == attempt_id).update(
                {"evaluation_status": "FAILED"}, synchronize_session=False
            )
            db.commit()
            return {"status": "retry_later", "attempt_id": attempt_id, "error": str(e)[:200]}

    async def evaluate_pending_batch(self, db: Session, batch_limit: int = 50, time_budget_seconds: Optional[float] = None) -> Dict[str, Any]:
        """
        Evaluates submitted coding/debugging attempts that are pending, failed, or abandoned mid-evaluation.
        Stops starting new attempts once `time_budget_seconds` is spent (for serverless time limits).
        """
        logger.info("Starting Universal Gemini Batch Code Evaluation run...")
        started = time.monotonic()
        attempt_ids = [a.id for a in self.pending_attempts_query(db).order_by(AssessmentAttempt.submitted_at.asc()).limit(batch_limit).all()]

        if not attempt_ids:
            return {"processed_attempts": 0, "status": "idle", "message": "No pending submissions."}

        processed, retry_later, skipped = 0, 0, 0
        for attempt_id in attempt_ids:
            if time_budget_seconds is not None and time.monotonic() - started > time_budget_seconds:
                break
            res = await self.evaluate_attempt_now(attempt_id, db)
            if res["status"] == "completed":
                processed += 1
            elif res["status"] == "retry_later":
                retry_later += 1
            else:
                skipped += 1

        remaining = self.pending_attempts_query(db).count()
        return {
            "processed_attempts": processed,
            "retry_later": retry_later,
            "skipped": skipped,
            "remaining_pending": remaining,
            "status": "completed",
            "timestamp": datetime.datetime.utcnow().isoformat()
        }

# Singleton instance
gemini_batch_code_evaluator = GeminiBatchCodeEvaluator()
