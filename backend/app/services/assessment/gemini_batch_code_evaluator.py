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

from app import database
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
from app.services.assessment.gemini_evaluator import QuotaUnavailable, gemini_evaluator
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

TEST_CASE_RULES = """
Grading mode: TEST CASES. The score is computed from your test results, so trace the program
faithfully on each input, exactly as the compiled program would run; do not give the benefit of
the doubt and do not judge by intent.
- "test_cases_simulated" must hold exactly one entry per test case listed, in the same order.
- "passed" is true only if the program's output equals the expected output (ignoring trailing
  spaces and newlines).
- Also return "compiles": false if the program would not compile (gcc -std=c11, or a Python
  syntax error), otherwise true. A program that does not compile passes no test case.
"""

COMPILE_RULE = """
Also return "compiles": false if the program would not compile (gcc -std=c11, or a Python syntax
error), otherwise true.
"""

BATCH_RULES = """
You are grading {n} independent questions from one candidate's attempt, marked "=== Question k ===".
Grade each on its own merits, by the rubric named in its "Grading mode" line.
Return STRICTLY one JSON object: {{"results": [ ... ]}} with exactly {n} objects in "results", one per
question in the same order. Each object has "question": k plus every field of the schema above
(score_awarded, status, test_cases_simulated, compiles, compiler_diagnostics, qualitative_feedback).
"""

# One evaluation never runs longer than this, so a claim older than STALE_CLAIM_MINUTES means the
# grader died (for example a serverless instance stopped mid-run) and the attempt is retried.
QUESTION_DEADLINE_SECONDS = 45
STALE_CLAIM_MINUTES = 3
# A FAILED attempt (AI unavailable or rate limited) is not retried more often than this
RETRY_AFTER_SECONDS = 30
# Attempts graded at once by a queue run
PARALLEL_ATTEMPTS = 3
# Code that does not compile earns at most this share when graded by rubric (debugging)
COMPILE_ERROR_CAP = 0.2


class EvaluationUnavailable(RuntimeError):
    """Raised when the AI grader cannot be reached; the attempt stays queued for retry."""


class BatchIncomplete(RuntimeError):
    """Not every answer in a batch could be graded; `done` maps job index to finished results."""

    def __init__(self, done: Dict[int, Dict[str, Any]], cause: BaseException):
        super().__init__(str(cause))
        self.done, self.cause = done, cause


class PartialEvaluation(RuntimeError):
    """Some questions of an attempt could not be graded; `done` holds the ones that were."""

    def __init__(self, done: Dict[str, Any], cause: BaseException):
        super().__init__(str(cause))
        self.done, self.cause = done, cause


def _test_inputs(eval_config) -> List[Dict[str, str]]:
    tcs = []
    if eval_config:
        tcs.extend(eval_config.public_test_cases_json or [])
        tcs.extend(eval_config.hidden_test_cases_json or [])
    return [{"input": str(tc.get("input", "")), "expected": str(tc.get("expected_output", tc.get("expected", "")))}
            for tc in tcs if isinstance(tc, dict)]


def _apply_score(parsed: Dict[str, Any], tcs: List[Dict[str, str]], max_marks: float, by_tests: bool) -> None:
    """Sets the final score and status on the AI's answer. With test cases the score is the share
    of cases passed, counted here, so the AI cannot hand out partial credit to wrong programs."""
    compiles = parsed.get("compiles") is not False and parsed.get("status") != "Compilation Error"
    if by_tests:
        results = (parsed.get("test_cases_simulated") or [])[:len(tcs)]
        for tc, r in zip(tcs, results):
            r["input"], r["expected"] = tc["input"], tc["expected"]  # keep the real test data
            if not compiles:
                r["passed"] = False
        passed = sum(1 for r in results if r.get("passed") is True)
        parsed["test_cases_simulated"] = results
        score = max_marks * passed / len(tcs)
        parsed["status"] = ("Compilation Error" if not compiles else "Accepted" if passed == len(tcs)
                            else "Partially Accepted" if passed else "Wrong Answer")
    else:
        score = float(parsed.get("score_awarded", 0.0))
        if not compiles:
            score = min(score, max_marks * COMPILE_ERROR_CAP)
            parsed["status"] = "Compilation Error"
    parsed["score_awarded"] = round(max(0.0, min(score, max_marks)), 2)


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

    def _prepare(self, job: Dict[str, Any], round_type: Optional[str]) -> Dict[str, Any]:
        """Works out how one answer is graded. Returns {"final": result} when no AI is needed
        (empty or unchanged code), otherwise the prompt section and scoring details."""
        question, eval_config = job.get("question"), job.get("eval_config")
        code_str, max_marks = job.get("code_str") or "", float(job.get("max_marks", 10.0))
        snapshot_content = job.get("snapshot_content") or {}
        if not code_str.strip():
            return {"final": {
                "score_awarded": 0.0,
                "status": "No Code Submitted",
                "test_cases_simulated": [],
                "compiler_diagnostics": "Candidate submitted an empty response.",
                "qualitative_feedback": "No source code was submitted for evaluation.",
                "detected_language": "c"
            }}

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
            return {"final": {
                "score_awarded": 0.0,
                "status": "No Changes Made",
                "test_cases_simulated": [],
                "compiler_diagnostics": "The submitted code is identical to the provided starter code.",
                "qualitative_feedback": (
                    "The original buggy code was submitted without a fix." if is_debugging
                    else "Only the starter skeleton was submitted; no solution was implemented."
                ),
                "detected_language": "c"
            }}

        q_title = getattr(question, 'title', None) or snapshot_content.get("title") or "Programming Task"
        q_diff = getattr(question, 'difficulty', None) or snapshot_content.get("difficulty") or "Medium"
        q_content = (
            snapshot_content.get("candidate_content")
            or snapshot_content.get("content")
            or getattr(question, 'candidate_content', None)
            or ""
        )

        target_lang = detect_target_language(code_str, question, snapshot_content, round_type)
        if target_lang == "pandas":
            rubric, fence_lang = SYSTEM_INSTRUCTION_PANDAS, "python"
        elif target_lang == "python":
            rubric, fence_lang = SYSTEM_INSTRUCTION_PYTHON, "python"
        else:
            rubric, fence_lang = (SYSTEM_INSTRUCTION_C_DEBUG if is_debugging else SYSTEM_INSTRUCTION_C), "c"

        # Coding questions with test cases are scored by the share of cases passed; debugging
        # questions (and coding questions without cases) by the rubric
        tcs = _test_inputs(eval_config)
        by_tests = bool(tcs) and not is_debugging
        if tcs:
            tcs_text = "\n\n".join(f"Test {i}:\nInput:\n{tc['input']}\nExpected output:\n{tc['expected']}"
                                   for i, tc in enumerate(tcs, 1))
        else:
            tcs_text = "No predefined test cases provided."
        ref_sol = (eval_config.reference_solution if eval_config else None) or "N/A"

        if is_debugging:
            opts = snapshot_content.get("options_json") if isinstance(snapshot_content.get("options_json"), dict) else {}
            known_defect = (eval_config.correct_answer if eval_config else None) or opts.get("debug_hint") or "Not specified"
            section = f"""Grading mode: RUBRIC (debugging task, use the debugging rubric)
Problem Title: {q_title}
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
```"""
        else:
            section = f"""Grading mode: {"TEST CASES" if by_tests else "RUBRIC"}
Problem Title: {q_title}
Difficulty: {q_diff}
Target Language: {target_lang.upper()}
Max Marks: {max_marks}

Problem Description & Requirements:
{q_content}

Reference Solution (for comparison):
```{fence_lang}
{ref_sol}
```

Test Cases ({len(tcs)}):
{tcs_text}

Candidate's Submitted Source Code:
```{fence_lang}
{code_str}
```"""
        return {"section": section, "rubric": rubric, "tcs": tcs, "by_tests": by_tests,
                "max_marks": max_marks, "target_lang": target_lang}

    @staticmethod
    def _usable(p: Dict[str, Any], r: Any) -> bool:
        if not isinstance(r, dict):
            return False
        if p["by_tests"]:
            return r.get("compiles") is False or len(r.get("test_cases_simulated") or []) >= len(p["tcs"])
        try:
            float(r["score_awarded"])
            return True
        except (KeyError, TypeError, ValueError):
            return False

    async def grade_batch(self, jobs: List[Dict[str, Any]], round_type: Optional[str] = None) -> List[Dict[str, Any]]:
        """Grades several answers (normally one attempt's questions) in ONE Gemini request, to
        spend as few requests as possible. Answers whose result comes back unusable are sent
        again on their own batch, until QUESTION_DEADLINE_SECONDS.

        Each job: question, eval_config, code_str, max_marks, snapshot_content. Returns one result
        per job, in order. Raises BatchIncomplete (holding the results that did finish) when the
        rest could not be graded; its cause is QuotaUnavailable when the rate limits had no room.
        """
        prepared = [self._prepare(j, round_type) for j in jobs]
        results: Dict[int, Dict[str, Any]] = {i: p["final"] for i, p in enumerate(prepared) if "final" in p}
        todo = [i for i in range(len(jobs)) if i not in results]
        deadline = time.monotonic() + QUESTION_DEADLINE_SECONDS
        backoff = 2.0
        while todo:
            rubrics = []
            for i in todo:
                if prepared[i]["rubric"] not in rubrics:
                    rubrics.append(prepared[i]["rubric"])
            any_tests = any(prepared[i]["by_tests"] for i in todo)
            system_instruction = "\n\n".join(rubrics) + (TEST_CASE_RULES if any_tests else "") + COMPILE_RULE + BATCH_RULES.format(n=len(todo))
            user_prompt = "\n\n".join(f"=== Question {k} ===\n{prepared[i]['section']}" for k, i in enumerate(todo, 1)) \
                + f"\n\nGrade all {len(todo)} questions rigorously and return the JSON object:"
            try:
                raw_response = await gemini_evaluator._call_gemini_cascade(
                    system_instruction=system_instruction,
                    user_prompt=user_prompt,
                    timeout_seconds=30.0,
                    temperature=0.0,
                    max_output_tokens=min(8192 * 2, 2500 * len(todo) + 1000),
                    deadline=deadline,
                )
                parsed = gemini_evaluator._extract_json(raw_response)
                answers = parsed.get("results") if isinstance(parsed, dict) else parsed
                if not isinstance(answers, list):
                    answers = [parsed] if len(todo) == 1 and isinstance(parsed, dict) else []
                by_number = {}
                for pos, a in enumerate(answers, 1):
                    num = a.get("question") if isinstance(a, dict) else None
                    by_number[num if isinstance(num, int) and 1 <= num <= len(todo) else pos] = a
                still = []
                for k, i in enumerate(todo, 1):
                    a = by_number.get(k)
                    if self._usable(prepared[i], a):
                        p = prepared[i]
                        _apply_score(a, p["tcs"], p["max_marks"], p["by_tests"])
                        a["detected_language"] = "python" if p["target_lang"] in ["python", "pandas"] else "c"
                        a.pop("question", None)
                        results[i] = a
                    else:
                        still.append(i)
                if still and time.monotonic() + 5 > deadline:
                    raise ValueError(f"{len(still)} answer(s) came back unusable")
                todo = still
            except QuotaUnavailable as e:
                left = deadline - time.monotonic()
                if e.wait_seconds is not None and e.wait_seconds + 8 < left:
                    await asyncio.sleep(e.wait_seconds + 0.2)
                    continue
                raise BatchIncomplete(results, e) from e
            except Exception as e:
                if time.monotonic() + backoff + 5 > deadline:
                    logger.error("Gemini batch evaluation failed (%d answers left): %s", len(todo), str(e))
                    raise BatchIncomplete(results, EvaluationUnavailable(str(e))) from e
                await asyncio.sleep(backoff)
                backoff = min(backoff * 2, 10.0)
        return [results[i] for i in range(len(jobs))]

    async def evaluate_single_submission(
        self,
        question: Optional[AssessmentQuestion],
        eval_config: Optional[QuestionEvaluationConfig],
        code_str: str,
        max_marks: float = 10.0,
        snapshot_content: Optional[Dict[str, Any]] = None,
        round_type: Optional[str] = None
    ) -> Dict[str, Any]:
        """Grades one answer (a batch of one). Raises EvaluationUnavailable when it cannot be
        graded now, so callers keep the attempt queued instead of awarding unearned marks."""
        try:
            return (await self.grade_batch([{"question": question, "eval_config": eval_config, "code_str": code_str,
                                             "max_marks": max_marks, "snapshot_content": snapshot_content}], round_type))[0]
        except BatchIncomplete as e:
            raise EvaluationUnavailable(str(e.cause)) from e

    # ------------------------------------------------------------------
    # Attempt-level evaluation
    # ------------------------------------------------------------------

    def _claim_attempt(self, attempt_id: int, db: Session) -> bool:
        """Atomically marks an attempt as EVALUATING. Returns False if someone else holds it."""
        claimed = db.query(AssessmentAttempt).filter(
            AssessmentAttempt.id == attempt_id,
            self._claimable(),
        ).update(
            {"evaluation_status": "EVALUATING", "batch_evaluated_at": datetime.datetime.utcnow()},
            synchronize_session=False
        )
        db.commit()
        return claimed == 1

    @staticmethod
    def _claimable():
        now = datetime.datetime.utcnow()
        stale_before = now - datetime.timedelta(minutes=STALE_CLAIM_MINUTES)
        retry_before = now - datetime.timedelta(seconds=RETRY_AFTER_SECONDS)
        return and_(
            AssessmentAttempt.status == "SUBMITTED",
            or_(
                AssessmentAttempt.evaluation_status == "PENDING_BATCH",
                and_(
                    AssessmentAttempt.evaluation_status == "FAILED",
                    or_(AssessmentAttempt.batch_evaluated_at.is_(None), AssessmentAttempt.batch_evaluated_at < retry_before)
                ),
                and_(
                    AssessmentAttempt.evaluation_status == "EVALUATING",
                    or_(AssessmentAttempt.batch_evaluated_at.is_(None), AssessmentAttempt.batch_evaluated_at < stale_before)
                )
            )
        )

    def pending_attempts_query(self, db: Session):
        """Attempts waiting for grading, including failed ones still in their retry pause."""
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
            # Questions graded before an earlier run failed are not sent to the AI again
            partial = (attempt.evaluation_details_json or {}).get("partial_grades") or {}

            # Gather per-question jobs first, then grade every code answer in ONE request.
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

            results: List[Any] = [None] * len(items)
            to_ai = []  # (item index, job)
            for idx, (snap, q_data, q_id, q_marks, question, eval_config, raw_payload, is_mcq) in enumerate(items):
                if is_mcq:
                    cand_ans = str(raw_payload).strip().upper() if raw_payload else ""
                    correct_ans = str(eval_config.correct_answer or "").strip().upper() if eval_config else ""
                    earned = q_marks if (cand_ans and correct_ans and cand_ans == correct_ans) else 0.0
                    results[idx] = {"mcq": True, "score_awarded": earned}
                    continue
                code_str = ""
                if isinstance(raw_payload, str) and raw_payload.startswith("{"):
                    try:
                        code_str = json.loads(raw_payload).get("code", "")
                    except Exception:
                        code_str = raw_payload
                else:
                    code_str = str(raw_payload) if raw_payload else ""
                saved = partial.get(str(q_id))
                if saved and saved.get("code_str") == code_str:
                    results[idx] = saved
                    continue
                to_ai.append((idx, {"question": question, "eval_config": eval_config, "code_str": code_str,
                                    "max_marks": q_marks, "snapshot_content": q_data}))

            if to_ai:
                try:
                    graded = await self.grade_batch([job for _, job in to_ai], round_type)
                except BatchIncomplete as e:
                    done = {}
                    for k, res in e.done.items():
                        idx, job = to_ai[k]
                        done[str(items[idx][2])] = {**res, "code_str": job["code_str"]}
                    raise PartialEvaluation(done, e.cause)
                for (idx, job), res in zip(to_ai, graded):
                    results[idx] = {**res, "code_str": job["code_str"]}

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
            values = {"evaluation_status": "FAILED", "batch_evaluated_at": datetime.datetime.utcnow()}
            if isinstance(e, PartialEvaluation):
                if e.done:
                    details = dict(attempt.evaluation_details_json or {})
                    details["partial_grades"] = {**(details.get("partial_grades") or {}), **e.done}
                    values["evaluation_details_json"] = details
                e = e.cause
            if isinstance(e, QuotaUnavailable):
                # Nothing was sent: back in the queue, picked up when a model has room again
                values["evaluation_status"] = "PENDING_BATCH"
                db.query(AssessmentAttempt).filter(AssessmentAttempt.id == attempt_id).update(values, synchronize_session=False)
                db.commit()
                logger.info("Attempt ID %d waits for Gemini quota: %s", attempt_id, e)
                return {"status": "quota_wait", "attempt_id": attempt_id, "daily_limit": e.wait_seconds is None}
            retry = isinstance(e, EvaluationUnavailable)
            logger.error("Failed to evaluate attempt ID %d (%s): %s", attempt_id, "will retry" if retry else "error", str(e))
            db.query(AssessmentAttempt).filter(AssessmentAttempt.id == attempt_id).update(
                values, synchronize_session=False
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

        # A few attempts at a time, each in its own session: the quota guard spaces the requests,
        # so this only keeps both lite models busy. Stops once the models have no room left.
        queue = list(attempt_ids)
        tally = {"processed": 0, "retry_later": 0, "skipped": 0, "quota_wait": 0}

        async def worker():
            while queue and not tally["quota_wait"]:
                if time_budget_seconds is not None and time.monotonic() - started > time_budget_seconds:
                    return
                attempt_id = queue.pop(0)
                own = database.SessionLocal()
                try:
                    res = await self.evaluate_attempt_now(attempt_id, own)
                finally:
                    own.close()
                key = {"completed": "processed", "retry_later": "retry_later", "quota_wait": "quota_wait"}.get(res["status"], "skipped")
                tally[key] += 1

        await asyncio.gather(*[worker() for _ in range(PARALLEL_ATTEMPTS)])
        processed, retry_later, skipped = tally["processed"], tally["retry_later"], tally["skipped"]

        remaining = self.pending_attempts_query(db).count()
        return {
            "processed_attempts": processed,
            "retry_later": retry_later,
            "skipped": skipped,
            "remaining_pending": remaining,
            "waiting_for_quota": bool(tally["quota_wait"]),
            "status": "completed",
            "timestamp": datetime.datetime.utcnow().isoformat()
        }

# Singleton instance
gemini_batch_code_evaluator = GeminiBatchCodeEvaluator()
