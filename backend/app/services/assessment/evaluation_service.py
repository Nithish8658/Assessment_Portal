import json
import logging
import re
import asyncio
from typing import Dict, Any, List
from sqlalchemy.orm import Session

from app.models.assessment_models import (
    AssessmentAttempt,
    AssessmentResponse,
    AssessmentQuestion,
    QuestionEvaluationConfig,
    CodingSubmission,
    CodeExecutionResult,
    CompetencyScore,
    AssessmentResult,
    Competency
)
from app.services.assessment.gemini_batch_code_evaluator import gemini_batch_code_evaluator
from app.services.assessment.scoring_service import scoring_service
from app.services.assessment.gemini_evaluator import gemini_evaluator
from app.services.assessment.hardware_evaluator import hardware_evaluator

logger = logging.getLogger(__name__)

class EvaluationService:
    """Server-side grading engine for MCQs, sandboxed code, SQL, typing tests, and simulation rubrics."""

    def result_payload(self, attempt, db):
        result = attempt.result
        radar = [{
            "competency_code": cs.competency.code if cs.competency else "COMP",
            "competency_name": cs.competency.name if cs.competency else "Competency",
            "category": cs.competency.category if cs.competency else "General",
            "score": cs.score, "max_score": cs.max_score,
            "percentage": cs.percentage, "readiness_level": cs.readiness_level,
        } for cs in db.query(CompetencyScore).filter(CompetencyScore.attempt_id == attempt.id).all()]
        strengths, gaps = scoring_service.derive_strengths_and_gaps(radar)
        return {
            "attempt_id": attempt.id, "round_id": attempt.round_id,
            "domain_slug": attempt.round.domain.slug,
            "round_number": attempt.round.round_number,
            "round_title": attempt.round.title, "round_type": attempt.round.round_type,
            "total_score": result.total_score, "max_score": result.max_score,
            "percentage": result.percentage, "passed": result.passed,
            "readiness_index": result.readiness_index, "competencies": radar,
            "strengths": strengths, "gaps": gaps,
            "evaluated_at": result.evaluated_at.isoformat() if result.evaluated_at else None,
        }

    def evaluate_attempt(self, attempt: AssessmentAttempt, db: Session) -> Dict[str, Any]:
        attempt.status = "EVALUATING"
        db.flush()

        try:
            responses = db.query(AssessmentResponse).filter(AssessmentResponse.attempt_id == attempt.id).all()
            resp_map = {r.question_id: r.response_payload for r in responses}

            snapshots = getattr(attempt, 'snapshots', []) or getattr(attempt, 'question_snapshots', [])
            total_score = 0.0
            max_score = 0.0
            competency_accumulator: Dict[int, Dict[str, float]] = {}
            iot_competency_accumulator: Dict[str, Dict[str, float]] = {
                "IOT_MCU_ARCH": {"score": 0.0, "max_score": 0.0},
                "IOT_BUS_PROTOCOLS": {"score": 0.0, "max_score": 0.0},
                "IOT_SENSOR_AFE": {"score": 0.0, "max_score": 0.0},
                "IOT_POWER_ISOLATION": {"score": 0.0, "max_score": 0.0},
                "IOT_ACTUATOR_DRIVE": {"score": 0.0, "max_score": 0.0}
            }
            has_iot_hardware_eval = False

            question_eval_details = []

            for snap in snapshots:
                q_data = snap.snapshot_content_json or {}
                q_id = q_data.get("id") or snap.question_id
                q_marks = float(q_data.get("marks", 1.0))
                max_score += q_marks
                comp_id = q_data.get("competency_id")

                if comp_id and comp_id not in competency_accumulator:
                    competency_accumulator[comp_id] = {"score": 0.0, "max_score": 0.0}

                if comp_id:
                    competency_accumulator[comp_id]["max_score"] += q_marks

                snapshot_eval_cfg = q_data.get("eval_config")
                if snapshot_eval_cfg and isinstance(snapshot_eval_cfg, dict):
                    class SnapshotEvalConfig:
                        def __init__(self, d):
                            self.evaluation_type = d.get("evaluation_type", "ExactMatch")
                            self.correct_answer = d.get("correct_answer")
                            self.reference_solution = d.get("reference_solution")
                            self.scoring_rules_json = d.get("scoring_rules_json") or {}
                            self.public_test_cases_json = d.get("public_test_cases_json") or []
                            self.hidden_test_cases_json = d.get("hidden_test_cases_json") or []
                    eval_config = SnapshotEvalConfig(snapshot_eval_cfg)
                else:
                    eval_config = db.query(QuestionEvaluationConfig).filter(
                        QuestionEvaluationConfig.question_id == q_id
                    ).first()

                cand_payload = resp_map.get(q_id, "")
                earned_marks = 0.0
                eval_note = ""

                q_type_raw = str(q_data.get("question_type") or "MCQ").strip()
                q_type_upper = q_type_raw.upper()

                raw_opts = q_data.get("options_json") or q_data.get("options") or []
                has_options = isinstance(raw_opts, list) and len(raw_opts) > 0

                # --- 1. MCQ, Single-Select, Scenario, & SOP Option Resolution ---
                if "MCQ" in q_type_upper or q_type_upper in ["SINGLESELECT", "MULTIPLECHOICE", "DESCRIPTIVE_MCQ", "SCENARIO", "SOP_CASE", "TABLEAU_PROCEDURAL"] or has_options:
                    correct_ans = eval_config.correct_answer if eval_config else None
                    is_correct = False
                    if correct_ans and cand_payload:
                        c_str = str(cand_payload).strip().lower()
                        ans_str = str(correct_ans).strip().lower()

                        # A. Direct match
                        if c_str == ans_str:
                            is_correct = True
                        else:
                            # B. Check options array for letter (A,B..), 1-based index (1,2..), and text value
                            if isinstance(raw_opts, list):
                                for idx, opt in enumerate(raw_opts):
                                    letter_key = chr(65 + idx).lower()
                                    num_key = str(idx + 1)
                                    opt_text = ""
                                    opt_val = ""
                                    if isinstance(opt, (str, int, float)):
                                        opt_text = str(opt).strip().lower()
                                        opt_val = opt_text
                                    elif isinstance(opt, dict):
                                        opt_text = str(opt.get("text") or opt.get("label") or opt.get("value") or "").strip().lower()
                                        opt_val = str(opt.get("value") or opt.get("key") or opt.get("id") or opt_text).strip().lower()

                                    valid_keys = [letter_key, num_key, opt_val, opt_text]
                                    if (c_str in valid_keys) and (ans_str in valid_keys):
                                        is_correct = True
                                        break

                    if is_correct:
                        earned_marks = q_marks
                        eval_note = "Correct option matched"
                    elif cand_payload:
                        eval_note = "Incorrect option selected"
                    else:
                        eval_note = "Unanswered"

                # --- 2. Typing Speed & Accuracy Benchmark ---
                elif "TYPING" in q_type_upper or q_type_upper in ["TYPINGTEST", "COMMUNICATION"]:
                    try:
                        payload_dict = json.loads(cand_payload) if isinstance(cand_payload, str) and cand_payload.startswith("{") else {}
                        wpm = float(payload_dict.get("wpm", 0.0))
                        accuracy = float(payload_dict.get("accuracy", 0.0))
                        if wpm >= 35.0 and accuracy >= 90.0:
                            earned_marks = q_marks
                            eval_note = f"Met typing benchmark ({wpm:.0f} WPM, {accuracy:.0f}% accuracy)"
                        elif wpm >= 25.0 and accuracy >= 80.0:
                            earned_marks = round(q_marks * 0.7, 2)
                            eval_note = f"Developing typing rate ({wpm:.0f} WPM, {accuracy:.0f}% accuracy)"
                        else:
                            earned_marks = round(q_marks * 0.3, 2) if wpm > 0 else 0.0
                            eval_note = f"Below typing threshold ({wpm:.0f} WPM, {accuracy:.0f}% accuracy)"
                    except Exception:
                        earned_marks = 0.0
                        eval_note = "Invalid typing payload format"

                # --- 3. Hands-on Code & Debugging (Gemini Batch AI Evaluation) ---
                elif "CODING" in q_type_upper or "DEBUG" in q_type_upper or q_type_upper in ["PROGRAMMING", "HANDSON"]:
                    # Parse code payload
                    code_str = ""
                    lang = "c"
                    if isinstance(cand_payload, str) and cand_payload.startswith("{"):
                        try:
                            p = json.loads(cand_payload)
                            code_str = p.get("code", "")
                            lang = p.get("language", "c")
                        except Exception:
                            code_str = cand_payload
                    else:
                        code_str = str(cand_payload) if cand_payload else ""

                    question_obj = db.query(AssessmentQuestion).filter(AssessmentQuestion.id == q_id).first()
                    eval_res = asyncio.run(gemini_batch_code_evaluator.evaluate_single_submission(
                        question=question_obj,
                        eval_config=eval_config,
                        code_str=code_str,
                        max_marks=q_marks
                    ))

                    earned_marks = eval_res.get("score_awarded", 0.0)
                    eval_note = f"{eval_res.get('status', 'Evaluated')}: {eval_res.get('qualitative_feedback', '')}"

                    simulated_tcs = eval_res.get("test_cases_simulated", [])
                    passed_tc = sum(1 for tc in simulated_tcs if tc.get("passed"))
                    total_tc = len(simulated_tcs)

                    sub = CodingSubmission(
                        attempt_id=attempt.id,
                        question_id=q_id,
                        language=lang,
                        source_code=code_str,
                        status=eval_res.get("status", "Accepted"),
                        judge0_status_id=3 if eval_res.get("status") == "Accepted" else 4,
                        test_cases_passed=passed_tc,
                        total_test_cases=total_tc,
                        score_awarded=earned_marks,
                        compiler_output=f"{eval_res.get('qualitative_feedback', '')}\n[Diagnostics]: {eval_res.get('compiler_diagnostics', '')}"
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

                # --- 4. SQL Practical Evaluation (Native In-Memory SQLite Engine) ---
                elif "SQL" in q_type_upper or q_type_upper in ["DATABASE", "QUERY"]:
                    import sqlite3
                    if cand_payload and str(cand_payload).strip():
                        try:
                            conn = sqlite3.connect(":memory:")
                            cursor = conn.cursor()
                            cursor.execute(str(cand_payload))
                            conn.close()
                            earned_marks = q_marks
                            eval_note = "SQL query parsed and executed successfully"
                        except Exception as sqle:
                            earned_marks = 0.0
                            eval_note = f"SQL Syntax/Execution Error: {str(sqle)}"
                    else:
                        eval_note = "No SQL query submitted"


                # --- 5. Multi-Turn Customer Chat Simulation (Strict Gemini QA Evaluation) ---
                elif q_type_upper in ["MULTI_CHAT_SIMULATION", "SUPPORT_CONSOLE_SIMULATION", "CHAT_SIMULATION"] or (isinstance(cand_payload, str) and '"messages"' in cand_payload):
                    rubric_text = eval_config.reference_solution or eval_config.correct_answer or "" if eval_config else ""
                    sim_eval = asyncio.run(gemini_evaluator.evaluate_simulation_transcript(
                        scenario_title=q_data.get("title", "Customer Support Simulation"),
                        scenario_content=q_data.get("candidate_content", ""),
                        rubric=rubric_text,
                        transcript_data=cand_payload,
                        max_marks=q_marks
                    ))
                # --- 6. IoT Hardware Component Selection & Placement (Deterministic Slot Matching) ---
                elif q_type_upper in ["HARDWARE_PLACEMENT", "HARDWARE_SELECTION_PLACEMENT", "IOT_HARDWARE_PLACEMENT"] or (
                    eval_config and getattr(eval_config, "evaluation_type", "") == "HARDWARE_SLOT_MATCH"
                ):
                    rules_dict = (
                        getattr(eval_config, "scoring_rules_json", None)
                        or (snapshot_eval_cfg.get("scoring_rules_json") if isinstance(snapshot_eval_cfg, dict) else None)
                        or (q_data.get("options_json", {}).get("eval_config") if isinstance(q_data.get("options_json"), dict) else None)
                        or {}
                    )
                    hw_res = hardware_evaluator.evaluate_placement(
                        eval_config_rules=rules_dict,
                        candidate_payload=cand_payload,
                        max_marks=q_marks
                    )
                    earned_marks = hw_res["earned_marks"]
                    eval_note = hw_res["eval_note"]

                    has_iot_hardware_eval = True
                    for c_code, c_data in hw_res.get("competency_scores", {}).items():
                        if c_code in iot_competency_accumulator:
                            iot_competency_accumulator[c_code]["score"] += c_data.get("score", 0.0)
                            iot_competency_accumulator[c_code]["max_score"] += c_data.get("max_score", 0.0)

                # --- 7. Descriptive, Architectural, Business Case & Project Interview (Strict Gemini Evaluation) ---
                else:
                    correct_ans = eval_config.correct_answer if eval_config else None
                    ref_sol = eval_config.reference_solution if eval_config else None
                    eval_type_str = str(getattr(eval_config, "evaluation_type", "") or "").lower()
                    is_ai_rubric = "rubric" in eval_type_str or "ai" in eval_type_str or "subjective" in eval_type_str
                    
                    # Exact string match if configured for ExactMatch and candidate matched verbatim
                    if not is_ai_rubric and correct_ans and str(cand_payload).strip().lower() == str(correct_ans).strip().lower():
                        earned_marks = q_marks
                        eval_note = "Exact answer matched"
                    elif not is_ai_rubric and ref_sol and str(cand_payload).strip().lower() == str(ref_sol).strip().lower():
                        earned_marks = q_marks
                        eval_note = "Reference solution matched"
                    elif cand_payload and str(cand_payload).strip():
                        # Strict Gemini evaluation against rubric criteria
                        rubric_text = correct_ans or ref_sol or "Evaluate technical depth, completeness, and architectural feasibility."
                        gemini_res = asyncio.run(gemini_evaluator.evaluate_subjective_response(
                            question_title=q_data.get("title", "Descriptive Response"),
                            question_content=q_data.get("candidate_content", ""),
                            rubric=rubric_text,
                            candidate_answer=str(cand_payload),
                            max_marks=q_marks
                        ))
                        earned_marks = gemini_res["score_awarded"]
                        eval_note = f"Gemini Evaluation: {gemini_res.get('feedback', 'Scored')} ({earned_marks}/{q_marks})"
                    else:
                        eval_note = "Unanswered"

                total_score += earned_marks
                if comp_id:
                    competency_accumulator[comp_id]["score"] += earned_marks

                question_eval_details.append({
                    "question_id": q_id,
                    "title": q_data.get("title", ""),
                    "marks_earned": earned_marks,
                    "max_marks": q_marks,
                    "note": eval_note
                })

            percentage = round((total_score / max_score) * 100.0, 2) if max_score > 0 else 0.0
            policy = attempt.round.policy if attempt.round else None
            passing_score = policy.passing_score if policy else 60.0
            passed = scoring_service.evaluate_pass_fail(percentage, passing_score)
            readiness_index = scoring_service.calculate_readiness_level(percentage)

            attempt.score = total_score
            attempt.percentage = percentage
            attempt.passed = passed
            attempt.status = "EVALUATED"
            attempt.evaluation_details_json = {
                "questions": question_eval_details,
                "passing_score": passing_score,
                "max_score": max_score
            }

            # Save Competency Scores
            db.query(CompetencyScore).filter(CompetencyScore.attempt_id == attempt.id).delete()
            comp_radar_list = []

            if has_iot_hardware_eval:
                # Persist all 5 IoT domain competencies for a rich 5-axis radar chart across all logins
                iot_codes = ["IOT_MCU_ARCH", "IOT_BUS_PROTOCOLS", "IOT_SENSOR_AFE", "IOT_POWER_ISOLATION", "IOT_ACTUATOR_DRIVE"]
                for code in iot_codes:
                    comp_obj = db.query(Competency).filter(Competency.code == code).first()
                    if comp_obj:
                        c_vals = iot_competency_accumulator[code]
                        c_score = c_vals["score"]
                        c_max = c_vals["max_score"]
                        if c_max > 0:
                            c_pct = round((c_score / c_max) * 100.0, 2)
                        else:
                            # If this competency was not directly in the 2 drawn questions,
                            # align with candidate's overall round percentage as a baseline
                            c_pct = percentage
                            c_max = round(max_score / len(iot_codes), 2)
                            c_score = round(c_max * (c_pct / 100.0), 2)
                        c_readiness = scoring_service.calculate_readiness_level(c_pct)

                        cs = CompetencyScore(
                            attempt_id=attempt.id,
                            competency_id=comp_obj.id,
                            score=c_score,
                            max_score=c_max,
                            percentage=c_pct,
                            readiness_level=c_readiness
                        )
                        db.add(cs)

                        comp_radar_list.append({
                            "competency_code": comp_obj.code,
                            "competency_name": comp_obj.name,
                            "category": comp_obj.category or "IoT Hardware",
                            "score": c_score,
                            "max_score": c_max,
                            "percentage": c_pct,
                            "readiness_level": c_readiness
                        })
            else:
                for c_id, vals in competency_accumulator.items():
                    c_score = vals["score"]
                    c_max = vals["max_score"]
                    c_pct = round((c_score / c_max) * 100.0, 2) if c_max > 0 else 0.0
                    c_readiness = scoring_service.calculate_readiness_level(c_pct)

                    cs = CompetencyScore(
                        attempt_id=attempt.id,
                        competency_id=c_id,
                        score=c_score,
                        max_score=c_max,
                        percentage=c_pct,
                        readiness_level=c_readiness
                    )
                    db.add(cs)

                    comp_obj = db.query(Competency).filter(Competency.id == c_id).first()
                    comp_radar_list.append({
                        "competency_code": comp_obj.code if comp_obj else "COMP",
                        "competency_name": comp_obj.name if comp_obj else "Competency",
                        "category": comp_obj.category if comp_obj else "General",
                        "score": c_score,
                        "max_score": c_max,
                        "percentage": c_pct,
                        "readiness_level": c_readiness
                    })

            # Save AssessmentResult
            db.query(AssessmentResult).filter(AssessmentResult.attempt_id == attempt.id).delete()
            result = AssessmentResult(
                attempt_id=attempt.id,
                total_score=total_score,
                max_score=max_score,
                percentage=percentage,
                passed=passed,
                readiness_index=readiness_index
            )
            db.add(result)
            db.commit()

            strengths, gaps = scoring_service.derive_strengths_and_gaps(comp_radar_list)
            domain_slug = attempt.round.domain.slug if (attempt.round and attempt.round.domain) else (
                attempt.allocation.request.domain.slug if (attempt.allocation and attempt.allocation.request and attempt.allocation.request.domain) else "assessment"
            )

            return {
                "attempt_id": attempt.id,
                "round_id": attempt.round_id,
                "domain_slug": domain_slug,
                "round_number": attempt.round.round_number if attempt.round else 1,
                "round_title": attempt.round.title if attempt.round else "Round",
                "round_type": attempt.round.round_type if attempt.round else "COGNITIVE_MCQ",
                "total_score": total_score,
                "max_score": max_score,
                "percentage": percentage,
                "passed": passed,
                "readiness_index": readiness_index,
                "competencies": comp_radar_list,
                "strengths": strengths,
                "gaps": gaps,
                "evaluated_at": result.evaluated_at.isoformat() if result.evaluated_at else None
            }

        except Exception as e:
            logger.exception("Error during automated evaluation of attempt %s: %s", attempt.id, e)
            db.rollback()
            # Preserve the closed answer window while allowing evaluation retry.
            attempt.status = "SUBMITTED"
            db.commit()
            raise e

evaluation_service = EvaluationService()
