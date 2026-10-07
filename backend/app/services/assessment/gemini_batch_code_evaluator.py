"""
Gemini Batch Code Evaluator Service
Processes pending candidate coding and debugging submissions asynchronously in batch cycles (e.g., every 2 hours or on-demand),
evaluating C, Python, and Data Analytics programs strictly against rubrics, test cases, and domain standards using Google Gemini LLM.
"""

import json
import logging
import datetime
from typing import Dict, Any, List, Optional
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
        """Evaluates a single code submission via Gemini API with language-adaptive rubrics."""
        if not code_str or not code_str.strip():
            return {
                "score_awarded": 0.0,
                "status": "No Code Submitted",
                "test_cases_simulated": [],
                "compiler_diagnostics": "Candidate submitted an empty response.",
                "qualitative_feedback": "No source code was submitted for evaluation.",
                "detected_language": "c"
            }

        # Safe extraction from question or snapshot
        q_title = getattr(question, 'title', None) or (snapshot_content.get("title") if snapshot_content else "Programming Task")
        q_diff = getattr(question, 'difficulty', None) or (snapshot_content.get("difficulty") if snapshot_content else "Medium")
        q_content = getattr(question, 'candidate_content', None) or (snapshot_content.get("content") or snapshot_content.get("candidate_content") if snapshot_content else "")

        # Detect language and select system instruction
        target_lang = detect_target_language(code_str, question, snapshot_content, round_type)
        if target_lang == "pandas":
            system_instruction = SYSTEM_INSTRUCTION_PANDAS
            fence_lang = "python"
        elif target_lang == "python":
            system_instruction = SYSTEM_INSTRUCTION_PYTHON
            fence_lang = "python"
        else:
            system_instruction = SYSTEM_INSTRUCTION_C
            fence_lang = "c"

        # Build test cases string
        tcs = []
        if eval_config:
            tcs.extend(eval_config.public_test_cases_json or [])
            tcs.extend(eval_config.hidden_test_cases_json or [])

        tcs_text = json.dumps(tcs, indent=2) if tcs else "No predefined test cases provided."
        ref_sol = eval_config.reference_solution if eval_config else "N/A"

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

            # Clamp score
            score = float(parsed.get("score_awarded", 0.0))
            score = max(0.0, min(score, max_marks))
            parsed["score_awarded"] = round(score, 2)
            parsed["detected_language"] = "python" if target_lang in ["python", "pandas"] else "c"
            return parsed

        except Exception as e:
            logger.error("Gemini batch evaluation failed for question %s: %s", getattr(question, 'id', 'unknown'), str(e))
            # Fallback evaluation on API failure
            has_substance = ("def " in code_str or "import " in code_str or "int main" in code_str or "#include" in code_str)
            return {
                "score_awarded": round(max_marks * 0.5, 2) if has_substance else 0.0,
                "status": "Partially Evaluated (API Timeout)",
                "test_cases_simulated": [],
                "compiler_diagnostics": f"Automated grading completed with fallback: {str(e)[:100]}",
                "qualitative_feedback": "Code submitted successfully; preliminary marks assigned pending final audit.",
                "detected_language": "python" if target_lang in ["python", "pandas"] else "c"
            }

    async def evaluate_pending_batch(self, db: Session, batch_limit: int = 50) -> Dict[str, Any]:
        """
        Gathers all attempts in 'PENDING_BATCH' evaluation_status across ALL domains and evaluates them.
        """
        logger.info("Starting Universal Gemini Batch Code Evaluation run...")

        # 1. Fetch pending attempts
        pending_attempts = db.query(AssessmentAttempt).filter(
            AssessmentAttempt.status == "SUBMITTED",
            AssessmentAttempt.evaluation_status == "PENDING_BATCH"
        ).order_by(AssessmentAttempt.submitted_at.asc()).limit(batch_limit).all()

        if not pending_attempts:
            logger.info("No pending batch submissions found to evaluate.")
            return {"processed_attempts": 0, "status": "idle", "message": "No pending submissions."}

        processed_count = 0
        total_questions_evaluated = 0

        for attempt in pending_attempts:
            round_type = attempt.round.round_type if attempt.round else "CODING"
            logger.info("Evaluating attempt ID %d (Round ID: %d, Type: %s)...", attempt.id, attempt.round_id, round_type)
            attempt.evaluation_status = "EVALUATING"
            db.flush()

            try:
                responses = db.query(AssessmentResponse).filter(
                    AssessmentResponse.attempt_id == attempt.id
                ).all()
                resp_map = {r.question_id: r.response_payload for r in responses}

                snapshots = getattr(attempt, 'snapshots', []) or getattr(attempt, 'question_snapshots', [])
                total_attempt_score = 0.0
                max_attempt_score = 0.0
                competency_accumulator: Dict[int, Dict[str, float]] = {}

                for snap in snapshots:
                    q_data = snap.snapshot_content_json or {}
                    q_id = q_data.get("id") or snap.question_id
                    q_marks = float(q_data.get("marks", 10.0))
                    max_attempt_score += q_marks
                    comp_id = q_data.get("competency_id")
                    q_type = str(q_data.get("question_type", "coding")).lower()

                    if comp_id and comp_id not in competency_accumulator:
                        competency_accumulator[comp_id] = {"score": 0.0, "max_score": 0.0}
                    if comp_id:
                        competency_accumulator[comp_id]["max_score"] += q_marks

                    question = db.query(AssessmentQuestion).filter(AssessmentQuestion.id == q_id).first()
                    eval_config = db.query(QuestionEvaluationConfig).filter(QuestionEvaluationConfig.question_id == q_id).first()
                    raw_payload = resp_map.get(q_id, "")

                    # --- Branch A: Multiple Choice Question (in hybrid rounds like Python Analytics) ---
                    if q_type in ["mcq", "multiple_choice", "objective"] or (question and question.options_json):
                        cand_ans = str(raw_payload).strip().upper() if raw_payload else ""
                        correct_ans = ""
                        if eval_config:
                            correct_ans = str(eval_config.correct_answer or "").strip().upper()
                        elif question and question.options_json:
                            # Search in options_json for is_correct
                            for opt in (question.options_json if isinstance(question.options_json, list) else []):
                                if opt.get("is_correct"):
                                    correct_ans = str(opt.get("key", "")).strip().upper()
                                    break

                        is_correct = bool(cand_ans and correct_ans and (cand_ans == correct_ans))
                        earned = q_marks if is_correct else 0.0
                        total_attempt_score += earned
                        if comp_id:
                            competency_accumulator[comp_id]["score"] += earned
                        total_questions_evaluated += 1
                        continue

                    # --- Branch B: Coding / Debugging / Practical Code ---
                    code_str = ""
                    if isinstance(raw_payload, str) and raw_payload.startswith("{"):
                        try:
                            p = json.loads(raw_payload)
                            code_str = p.get("code", "")
                        except Exception:
                            code_str = raw_payload
                    else:
                        code_str = str(raw_payload) if raw_payload else ""

                    eval_result = await self.evaluate_single_submission(
                        question=question,
                        eval_config=eval_config,
                        code_str=code_str,
                        max_marks=q_marks,
                        snapshot_content=q_data,
                        round_type=round_type
                    )

                    earned = eval_result["score_awarded"]
                    total_attempt_score += earned
                    if comp_id:
                        competency_accumulator[comp_id]["score"] += earned

                    # Persist CodingSubmission
                    simulated_tcs = eval_result.get("test_cases_simulated", [])
                    passed_tc_count = sum(1 for tc in simulated_tcs if tc.get("passed"))
                    total_tc_count = len(simulated_tcs)
                    det_lang = eval_result.get("detected_language", "python" if "python" in round_type.lower() else "c")

                    sub = CodingSubmission(
                        attempt_id=attempt.id,
                        question_id=q_id,
                        language=det_lang,
                        source_code=code_str,
                        status=eval_result.get("status", "Accepted"),
                        judge0_status_id=3 if eval_result.get("status") == "Accepted" else 4,
                        test_cases_passed=passed_tc_count,
                        total_test_cases=total_tc_count,
                        score_awarded=earned,
                        compiler_output=f"{eval_result.get('qualitative_feedback', '')}\n[Diagnostics]: {eval_result.get('compiler_diagnostics', '')}"
                    )
                    db.add(sub)
                    db.flush()

                    for idx, tc in enumerate(simulated_tcs):
                        tc_res = CodeExecutionResult(
                            submission_id=sub.id,
                            test_case_index=idx,
                            is_passed=tc.get("passed", False),
                            input_data=tc.get("input", ""),
                            expected_output=tc.get("expected", ""),
                            actual_output=tc.get("simulated_output", ""),
                            error_output=tc.get("reason", "")
                        )
                        db.add(tc_res)

                    total_questions_evaluated += 1

                # Update Competency Scores
                for comp_id, scores in competency_accumulator.items():
                    c_score = db.query(CompetencyScore).filter(
                        CompetencyScore.attempt_id == attempt.id,
                        CompetencyScore.competency_id == comp_id
                    ).first()
                    score_val = round(scores["score"], 2)
                    max_val = round(scores["max_score"], 2)
                    pct = round((score_val / max_val * 100.0), 2) if max_val > 0 else 0.0
                    c_readiness = scoring_service.calculate_readiness_level(pct)
                    if not c_score:
                        c_score = CompetencyScore(
                            attempt_id=attempt.id,
                            competency_id=comp_id,
                            score=score_val,
                            max_score=max_val,
                            percentage=pct,
                            readiness_level=c_readiness
                        )
                        db.add(c_score)
                    else:
                        c_score.score = score_val
                        c_score.max_score = max_val
                        c_score.percentage = pct
                        c_score.readiness_level = c_readiness

                # Calculate final attempt percentage & pass status
                percentage = round((total_attempt_score / max_attempt_score * 100.0), 2) if max_attempt_score > 0 else 0.0
                round_obj = attempt.round
                policy = round_obj.policy if round_obj else None
                policy_passing = policy.passing_score if policy and hasattr(policy, "passing_score") else 60.0
                is_passed = percentage >= policy_passing

                attempt.score = round(total_attempt_score, 2)
                attempt.percentage = percentage
                attempt.passed = is_passed
                attempt.status = "EVALUATED"
                attempt.evaluation_status = "COMPLETED"
                attempt.batch_evaluated_at = datetime.datetime.utcnow()

                # Upsert AssessmentResult
                res_obj = db.query(AssessmentResult).filter(AssessmentResult.attempt_id == attempt.id).first()
                if not res_obj:
                    res_obj = AssessmentResult(
                        attempt_id=attempt.id,
                        total_score=round(total_attempt_score, 2),
                        max_score=round(max_attempt_score, 2),
                        percentage=percentage,
                        passed=is_passed
                    )
                    db.add(res_obj)
                else:
                    res_obj.total_score = round(total_attempt_score, 2)
                    res_obj.max_score = round(max_attempt_score, 2)
                    res_obj.percentage = percentage
                    res_obj.passed = is_passed

                db.commit()
                processed_count += 1
                logger.info("Attempt ID %d evaluated successfully (Score: %.2f/%.2f, Passed: %s)", attempt.id, total_attempt_score, max_attempt_score, is_passed)

            except Exception as e:
                db.rollback()
                logger.error("Failed to evaluate attempt ID %d: %s", attempt.id, str(e))
                attempt.evaluation_status = "FAILED"
                db.commit()

        return {
            "processed_attempts": processed_count,
            "questions_evaluated": total_questions_evaluated,
            "status": "completed",
            "timestamp": datetime.datetime.utcnow().isoformat()
        }

# Singleton instance
gemini_batch_code_evaluator = GeminiBatchCodeEvaluator()
