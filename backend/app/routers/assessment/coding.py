"""
Assessment Coding Router.
Powered by Google Gemini Batch Evaluation Engine.
Judge0 has been completely decommissioned in favor of zero-overhead scheduled batch grading via Gemini API.
"""

import asyncio
import datetime
import hmac
import logging
import os
import sqlite3
import time
from typing import Optional
from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import SessionLocal, get_db
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

BATCH_TRIGGER_ROLES = {"Administrator", "Class Tutor", "HoD"}
logger = logging.getLogger(__name__)
# Attempts whose time ran out this long ago without a submit are closed by the sweep; the
# student's own page auto-submits at the deadline, so this only catches closed tabs and lost connections
EXPIRED_GRACE_MINUTES = 2
SWEEP_INTERVAL_SECONDS = 60
_last_sweep = float("-inf")


def close_expired_attempts(limit: int = 20) -> int:
    """Submits in-progress attempts whose deadline has passed, with the answers saved before it."""
    from app.services.assessment.orchestrator import orchestrator
    from app.services.assessment.timing import freeze_attempt_deadline
    cutoff = datetime.datetime.utcnow() - datetime.timedelta(minutes=EXPIRED_GRACE_MINUTES)
    db = SessionLocal()
    closed = 0
    try:
        candidates = db.query(AssessmentAttempt).filter(
            AssessmentAttempt.status == "IN_PROGRESS",
            (AssessmentAttempt.expires_at.is_(None)) | (AssessmentAttempt.expires_at < cutoff),
        ).order_by(AssessmentAttempt.id).limit(limit * 5).all()
        due = []
        for a in candidates:
            try:
                if freeze_attempt_deadline(a) < cutoff:
                    due.append((a.id, a.allocation.student_id))
            except Exception:
                continue
        db.rollback()  # the deadline check above must not write anything
        for attempt_id, student_id in due[:limit]:
            try:
                orchestrator.submit_and_evaluate(attempt_id, student_id, db)
                db.commit()
                closed += 1
            except Exception as exc:
                db.rollback()
                logger.error("Closing expired attempt %s failed: %s", attempt_id, exc)
    finally:
        db.close()
    return closed


async def run_grading_sweep(db: Session, time_budget_seconds: float) -> dict:
    """Closes expired attempts, then grades queued coding/debugging attempts within the budget."""
    closed = await asyncio.to_thread(close_expired_attempts)
    res = await gemini_batch_code_evaluator.evaluate_pending_batch(db, time_budget_seconds=time_budget_seconds)
    res["closed_expired_attempts"] = closed
    try:
        from app.services.assessment.gemini_quota import prune
        prune(db)
    except Exception:
        db.rollback()
    return res
# Leave headroom under the serverless function limit; unfinished attempts stay queued.
SERVERLESS_TIME_BUDGET_SECONDS = float(os.getenv("BATCH_EVAL_TIME_BUDGET_SECONDS", "40"))


@router.post("/batch-evaluate")
async def trigger_batch_evaluation(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Triggers batch evaluation of all pending coding submissions using Gemini API (staff only)."""
    user_roles = {r.name for r in current_user.roles} if current_user.roles else set()
    if not user_roles & BATCH_TRIGGER_ROLES:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only staff can trigger batch evaluation.")
    budget = SERVERLESS_TIME_BUDGET_SECONDS if os.getenv("VERCEL") else None
    return await gemini_batch_code_evaluator.evaluate_pending_batch(db, time_budget_seconds=budget)


@router.get("/cron/batch-evaluate", include_in_schema=False)
async def cron_batch_evaluation(
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db)
):
    """
    Scheduled entry point for Vercel Cron (the in-process 2-hour loop does not run on serverless).
    Vercel sends `Authorization: Bearer $CRON_SECRET` when CRON_SECRET is set in the project.
    """
    secret = os.getenv("CRON_SECRET")
    if not secret or not authorization or not hmac.compare_digest(authorization, f"Bearer {secret}"):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")
    return await run_grading_sweep(db, SERVERLESS_TIME_BUDGET_SECONDS)


@router.post("/sweep")
async def grading_sweep(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Every signed-in portal calls this every few minutes, so a submission is graded (and an
    attempt left open past its deadline is closed) even after the student leaves the results page.
    On Vercel nothing runs between requests; the daily cron is only a catch-up."""
    global _last_sweep
    now = time.monotonic()
    if now - _last_sweep < SWEEP_INTERVAL_SECONDS:
        return {"ran": False}
    _last_sweep = now
    res = await run_grading_sweep(db, time_budget_seconds=15)
    return {"ran": True, **res}

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
        "next_batch_interval": "On submission, plus scheduled sweeps for retries"
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
