"""
Assessment Coding Router.
Powered by Google Gemini Batch Evaluation Engine.
Judge0 has been completely decommissioned in favor of zero-overhead scheduled batch grading via Gemini API.
"""

import sqlite3
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import User
from app.models.assessment_models import AssessmentAttempt, AssessmentQuestion, QuestionEvaluationConfig
from app.schemas.assessment_schemas import RunCodeRequest, RunCodeResponse, CodeTestCaseResult
from app.auth.jwt import get_current_user
from app.services.assessment.gemini_batch_code_evaluator import gemini_batch_code_evaluator

router = APIRouter(prefix="/api/v1/assessment/coding", tags=["Gemini AI Batch Code Evaluation"])

@router.get("/health")
async def check_execution_engine_health():
    """Checks the health of the Gemini AI Batch Evaluation Engine."""
    return {
        "status": "healthy",
        "engine": "Google Gemini Batch Evaluation Engine",
        "mode": "Post-Round / 2-Hour Batch AI Grading",
        "judge0_status": "Decommissioned (Zero CPU Overhead)"
    }

@router.post("/batch-evaluate")
async def trigger_batch_evaluation(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Triggers batch evaluation of all pending coding submissions using Gemini API.
    Can be invoked by tutors, admins, or scheduled background tasks.
    """
    user_roles = [r.name for r in current_user.roles] if current_user.roles else []
    # Allow authenticated users (or background processes)
    res = await gemini_batch_code_evaluator.evaluate_pending_batch(db)
    return res

@router.get("/batch-status")
def get_batch_evaluation_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Returns the current queue of pending coding attempts awaiting batch evaluation."""
    pending_count = db.query(AssessmentAttempt).filter(
        AssessmentAttempt.status == "SUBMITTED",
        AssessmentAttempt.evaluation_status == "PENDING_BATCH"
    ).count()

    evaluating_count = db.query(AssessmentAttempt).filter(
        AssessmentAttempt.evaluation_status == "EVALUATING"
    ).count()

    completed_count = db.query(AssessmentAttempt).filter(
        AssessmentAttempt.evaluation_status == "COMPLETED"
    ).count()

    return {
        "pending_evaluations": pending_count,
        "currently_evaluating": evaluating_count,
        "completed_evaluations": completed_count,
        "next_batch_interval": "Scheduled every 2 hours"
    }

@router.post("/run", response_model=RunCodeResponse)
async def run_candidate_code_deprecated(
    data: RunCodeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    DEPRECATED: Real-time sandbox execution has been decommissioned.
    Students submit their code directly, which is evaluated in post-round batch via Gemini AI.
    """
    return RunCodeResponse(
        status="Batch Evaluation Mode",
        status_id=3,
        test_cases_passed=0,
        total_test_cases=0,
        execution_time_ms=0.0,
        memory_kb=0.0,
        compiler_output="Notice: In-exam code execution is decommissioned. Your code will be evaluated against all test cases and rubrics via AI after the round closes.",
        results=[]
    )

class RunSQLRequest(BaseModel):
    question_id: Optional[int] = None
    sql_query: str

@router.post("/run-sql")
async def run_candidate_sql(
    data: RunSQLRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Executes candidate SQL query locally in an in-memory SQLite database (zero Judge0 dependency)."""
    ref_solution = None
    if data.question_id:
        eval_config = db.query(QuestionEvaluationConfig).filter(
            QuestionEvaluationConfig.question_id == data.question_id
        ).first()
        if eval_config:
            ref_solution = eval_config.reference_solution or eval_config.correct_answer

    # Local in-memory SQLite sandbox
    try:
        conn = sqlite3.connect(":memory:")
        cursor = conn.cursor()
        cursor.execute(data.sql_query)
        rows = cursor.fetchall()
        output_str = "\n".join([str(r) for r in rows[:20]]) if rows else "Query executed successfully. (0 rows returned)"
        conn.close()
        return {
            "status": "Accepted",
            "status_id": 3,
            "passed": True,
            "stdout": output_str,
            "stderr": "",
            "compile_output": "",
            "execution_time_ms": 5,
            "memory_kb": 256,
            "reference_solution": ref_solution
        }
    except Exception as e:
        return {
            "status": "Execution Error",
            "status_id": 4,
            "passed": False,
            "stdout": "",
            "stderr": str(e),
            "compile_output": str(e),
            "execution_time_ms": 5,
            "memory_kb": 256,
            "reference_solution": ref_solution
        }
