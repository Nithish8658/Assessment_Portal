"""
Exam Operations Center (Administrator: whole institution; Class Tutor: own class only).

Live exam health, problem attempts and the actions to fix them, the AI grading queue,
and maintenance utilities. Every action is written to the audit trail.
"""

import datetime
import os
import time
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy import func, or_
from sqlalchemy.orm import Session, joinedload

from app.auth.jwt import require_roles
from app.config import GEMINI_API_KEY
from app.database import get_db
from app.models.models import StudentProfile, User
from app.models.assessment_models import (
    AssessmentActivationRequest,
    AssessmentAttempt,
    AssessmentResponse,
    AssessmentRound,
    AssessmentStudentAllocation,
    AttemptQuestionSnapshot,
    CodingSubmission,
    ProctoringEvent,
)
from app.services.assessment.competency_profiles import refresh_for_attempt, refresh_profile
from app.services.assessment.timing import as_utc_naive, attempt_timing, freeze_attempt_deadline
from app.services.audit import record_audit

router = APIRouter(prefix="/api/v1/assessment/ops", tags=["Exam Operations Center"])

OPS_ROLES = ["Administrator", "Class Tutor"]
MAINTENANCE_ROLES = ["Administrator"]
AI_GRADED_ROUND_TYPES = {"CODING", "DEBUGGING", "PYTHON_PRACTICAL"}
STALE_GRADING_MINUTES = 15
PROBLEMS = ("overdue", "awaiting_grading", "grading_failed", "in_progress", "graded", "voided", "all")


def _now() -> datetime.datetime:
    return datetime.datetime.utcnow()


def _scope_class_ids(db: Session, user: User) -> Optional[List[int]]:
    """None for Administrators (everything); otherwise the ids of the tutor's own classes."""
    if any(r.name == "Administrator" for r in user.roles):
        return None
    from app.models.models import AcademicClass
    fp = user.faculty_profile
    if not fp:
        return []
    conds = [AcademicClass.tutor_id == fp.id]
    if fp.assigned_programme_id:
        conds.append((AcademicClass.programme_id == fp.assigned_programme_id)
                     & (AcademicClass.batch_name == fp.assigned_batch)
                     & (AcademicClass.section_name == (fp.assigned_section or "A")))
    return [c.id for c in db.query(AcademicClass.id).filter(or_(*conds)).all()]


def _base_query(db: Session, class_ids: Optional[List[int]] = None):
    q = db.query(AssessmentAttempt).join(
        AssessmentStudentAllocation, AssessmentAttempt.allocation_id == AssessmentStudentAllocation.id
    ).join(
        AssessmentActivationRequest, AssessmentStudentAllocation.request_id == AssessmentActivationRequest.id
    )
    if class_ids is not None:
        q = q.filter(AssessmentActivationRequest.academic_class_id.in_(class_ids or [-1]))
    return q


def _apply_problem(q, problem: str):
    now = _now()
    stale = now - datetime.timedelta(minutes=STALE_GRADING_MINUTES)
    if problem == "overdue":
        return q.filter(AssessmentAttempt.status == "IN_PROGRESS", AssessmentAttempt.expires_at < now)
    if problem == "in_progress":
        return q.filter(AssessmentAttempt.status == "IN_PROGRESS", or_(AssessmentAttempt.expires_at.is_(None), AssessmentAttempt.expires_at >= now))
    if problem == "awaiting_grading":
        return q.filter(AssessmentAttempt.status.in_(["SUBMITTED", "EVALUATING"]),
                        or_(AssessmentAttempt.evaluation_status.in_(["PENDING_BATCH", "NOT_EVALUATED"]),
                            (AssessmentAttempt.evaluation_status == "EVALUATING") & (AssessmentAttempt.batch_evaluated_at >= stale)))
    if problem == "grading_failed":
        return q.filter(AssessmentAttempt.status.in_(["SUBMITTED", "EVALUATING"]),
                        or_(AssessmentAttempt.evaluation_status == "FAILED",
                            (AssessmentAttempt.evaluation_status == "EVALUATING") & or_(AssessmentAttempt.batch_evaluated_at.is_(None), AssessmentAttempt.batch_evaluated_at < stale)))
    if problem == "graded":
        return q.filter(AssessmentAttempt.status == "EVALUATED")
    if problem == "voided":
        return q.filter(AssessmentAttempt.status == "VOIDED")
    return q


def _problem_of(a: AssessmentAttempt) -> str:
    now = _now()
    if a.status == "IN_PROGRESS":
        return "overdue" if (a.expires_at and as_utc_naive(a.expires_at) < now) else "in_progress"
    if a.status in ("SUBMITTED", "EVALUATING"):
        stale = now - datetime.timedelta(minutes=STALE_GRADING_MINUTES)
        if a.evaluation_status == "FAILED" or (a.evaluation_status == "EVALUATING" and (not a.batch_evaluated_at or a.batch_evaluated_at < stale)):
            return "grading_failed"
        return "awaiting_grading"
    if a.status == "EVALUATED":
        return "graded"
    if a.status == "VOIDED":
        return "voided"
    return a.status.lower()


def _row(a: AssessmentAttempt, violations: int) -> Dict[str, Any]:
    st = a.allocation.student if a.allocation else None
    r = a.round
    return {
        "attempt_id": a.id,
        "student_id": st.id if st else None,
        "student_name": st.user.full_name if (st and st.user) else "",
        "register_number": st.register_number if st else "",
        "domain": r.domain.title if (r and r.domain) else "",
        "round": f"R{r.round_number}: {r.title}" if r else "",
        "round_type": r.round_type if r else "",
        "attempt_number": a.attempt_number,
        "status": a.status,
        "evaluation_status": a.evaluation_status,
        "problem": _problem_of(a),
        "percentage": round(a.percentage, 1) if a.status == "EVALUATED" and a.percentage is not None else None,
        "passed": a.passed if a.status == "EVALUATED" else None,
        "started_at": (a.started_at.isoformat() + "Z") if a.started_at else None,
        "expires_at": (as_utc_naive(a.expires_at).isoformat() + "Z") if a.expires_at else None,
        "submitted_at": (a.submitted_at.isoformat() + "Z") if a.submitted_at else None,
        "violations": violations,
    }


def _get_attempt(db: Session, attempt_id: int, user: Optional[User] = None) -> AssessmentAttempt:
    q = _base_query(db, _scope_class_ids(db, user)) if user is not None else db.query(AssessmentAttempt)
    a = q.filter(AssessmentAttempt.id == attempt_id).populate_existing().first()
    if not a:
        raise HTTPException(status_code=404, detail="Attempt not found.")
    return a


@router.get("/summary")
def ops_summary(current_user: User = Depends(require_roles(OPS_ROLES)), db: Session = Depends(get_db)):
    scope = _scope_class_ids(db, current_user)
    counts = {p: _apply_problem(_base_query(db, scope), p).count() for p in ("overdue", "in_progress", "awaiting_grading", "grading_failed")}
    since = _now() - datetime.timedelta(hours=24)
    counts["graded_last_24h"] = _base_query(db, scope).filter(
        AssessmentAttempt.status == "EVALUATED",
        or_(AssessmentAttempt.batch_evaluated_at >= since, AssessmentAttempt.submitted_at >= since)
    ).count()
    scoped_ids = _base_query(db, scope).with_entities(AssessmentAttempt.id)
    counts["violations_last_24h"] = db.query(ProctoringEvent).filter(
        ProctoringEvent.occurred_at >= since, ProctoringEvent.attempt_id.in_(scoped_ids)
    ).count()
    return counts


@router.get("/attempts")
def list_attempts(
    problem: str = "all",
    domain_id: Optional[int] = None,
    search: Optional[str] = None,
    limit: int = 100,
    current_user: User = Depends(require_roles(OPS_ROLES)),
    db: Session = Depends(get_db)
):
    if problem not in PROBLEMS:
        raise HTTPException(status_code=400, detail=f"problem must be one of {PROBLEMS}")
    q = _apply_problem(_base_query(db, _scope_class_ids(db, current_user)), problem).options(
        joinedload(AssessmentAttempt.round).joinedload(AssessmentRound.domain),
        joinedload(AssessmentAttempt.allocation).joinedload(AssessmentStudentAllocation.student).joinedload(StudentProfile.user),
    )
    if domain_id:
        q = q.filter(AssessmentActivationRequest.domain_id == domain_id)
    if search:
        term = f"%{search.strip()}%"
        q = q.join(StudentProfile, AssessmentStudentAllocation.student_id == StudentProfile.id).join(
            User, StudentProfile.user_id == User.id
        ).filter(or_(StudentProfile.register_number.ilike(term), User.full_name.ilike(term)))
    attempts = q.order_by(AssessmentAttempt.id.desc()).limit(max(1, min(limit, 300))).all()
    ids = [a.id for a in attempts]
    vio = dict(db.query(ProctoringEvent.attempt_id, func.count(ProctoringEvent.id)).filter(
        ProctoringEvent.attempt_id.in_(ids)).group_by(ProctoringEvent.attempt_id).all()) if ids else {}
    return [_row(a, vio.get(a.id, 0)) for a in attempts]


@router.get("/attempts/{attempt_id}")
def attempt_detail(attempt_id: int, current_user: User = Depends(require_roles(OPS_ROLES)), db: Session = Depends(get_db)):
    a = _get_attempt(db, attempt_id, current_user)
    events = db.query(ProctoringEvent).filter(ProctoringEvent.attempt_id == a.id).order_by(ProctoringEvent.occurred_at).all()
    by_type: Dict[str, int] = {}
    for e in events:
        by_type[e.event_type] = by_type.get(e.event_type, 0) + 1
    detail = _row(a, len(events))
    detail.update({
        "questions": db.query(AttemptQuestionSnapshot).filter(AttemptQuestionSnapshot.attempt_id == a.id).count(),
        "answered": db.query(AssessmentResponse).filter(AssessmentResponse.attempt_id == a.id).count(),
        "timing": attempt_timing(a),
        "violations_by_type": by_type,
        "violation_timeline": [{"type": e.event_type, "at": e.occurred_at.isoformat() + "Z"} for e in events[-50:]],
        "evaluation_details": a.evaluation_details_json or {},
        "ai_feedback": [
            {"question_id": s.question_id, "status": s.status, "score": s.score_awarded,
             "feedback": (s.compiler_output or "")[:600]}
            for s in db.query(CodingSubmission).filter(CodingSubmission.attempt_id == a.id).all()
        ],
    })
    db.commit()
    return detail


class VoidRequest(BaseModel):
    reason: str = Field(..., min_length=5, max_length=500)


@router.post("/attempts/{attempt_id}/finalize")
def finalize_attempt(attempt_id: int, request: Request, current_user: User = Depends(require_roles(OPS_ROLES)), db: Session = Depends(get_db)):
    """Submits an attempt whose time has run out, using only answers saved before the deadline."""
    a = _get_attempt(db, attempt_id, current_user)
    if a.status != "IN_PROGRESS":
        raise HTTPException(status_code=409, detail=f"Only in-progress attempts can be finalized (status is {a.status}).")
    if as_utc_naive(freeze_attempt_deadline(a)) > _now():
        raise HTTPException(status_code=409, detail="The attempt's time has not run out yet; the student is still working on it.")
    from app.services.assessment.orchestrator import orchestrator
    result = orchestrator.submit_and_evaluate(a.id, a.allocation.student_id, db)
    record_audit(db, current_user, "ATTEMPT_FINALIZED", "EXAM_OPS", a.id, {"status": "IN_PROGRESS"},
                 {"status": result.get("status") or "EVALUATED", "percentage": result.get("percentage")}, request)
    db.commit()
    refresh_for_attempt(db, a.id)
    return {"attempt_id": a.id, "result": result}


@router.post("/attempts/{attempt_id}/grade")
async def grade_attempt(attempt_id: int, request: Request, current_user: User = Depends(require_roles(OPS_ROLES)), db: Session = Depends(get_db)):
    """Grades a submitted attempt now, or regrades a graded one (AI rounds re-run the AI grader)."""
    a = _get_attempt(db, attempt_id, current_user)
    if a.status not in ("SUBMITTED", "EVALUATING", "EVALUATED"):
        raise HTTPException(status_code=409, detail=f"Attempt is {a.status}; only submitted or graded attempts can be graded.")
    before = {"status": a.status, "percentage": a.percentage, "evaluation_status": a.evaluation_status}
    round_type = a.round.round_type if a.round else ""
    if round_type in AI_GRADED_ROUND_TYPES:
        from app.services.assessment.gemini_batch_code_evaluator import gemini_batch_code_evaluator
        a.status = "SUBMITTED"
        a.evaluation_status = "PENDING_BATCH"
        db.commit()
        outcome = await gemini_batch_code_evaluator.evaluate_attempt_now(a.id, db)
        if outcome.get("status") != "completed":
            raise HTTPException(status_code=503, detail=f"AI grading did not complete ({outcome.get('status')}). It stays queued for retry.")
    else:
        from app.services.assessment.evaluation_service import evaluation_service
        evaluation_service.evaluate_attempt(a, db)
    a = _get_attempt(db, attempt_id)
    record_audit(db, current_user, "ATTEMPT_REGRADED" if before["status"] == "EVALUATED" else "ATTEMPT_GRADED", "EXAM_OPS",
                 a.id, before, {"status": a.status, "percentage": a.percentage}, request)
    db.commit()
    refresh_for_attempt(db, a.id)
    return _row(a, db.query(ProctoringEvent).filter(ProctoringEvent.attempt_id == a.id).count())


@router.post("/attempts/{attempt_id}/void")
def void_attempt(attempt_id: int, data: VoidRequest, request: Request, current_user: User = Depends(require_roles(OPS_ROLES)), db: Session = Depends(get_db)):
    """Cancels an attempt (e.g. technical failure). It no longer counts, and the student can start the round again."""
    a = _get_attempt(db, attempt_id, current_user)
    if a.status == "VOIDED":
        raise HTTPException(status_code=409, detail="Attempt is already voided.")
    before = {"status": a.status, "percentage": a.percentage}
    details = dict(a.evaluation_details_json or {})
    details["voided"] = {"by": current_user.full_name or current_user.username, "at": _now().isoformat() + "Z",
                         "reason": data.reason, "previous_status": a.status}
    a.evaluation_details_json = details
    a.status = "VOIDED"
    record_audit(db, current_user, "ATTEMPT_VOIDED", "EXAM_OPS", a.id, before, {"status": "VOIDED", "reason": data.reason}, request)
    db.commit()
    refresh_for_attempt(db, a.id)
    return {"attempt_id": a.id, "status": "VOIDED"}


@router.post("/grading/run")
async def run_grading_queue(request: Request, current_user: User = Depends(require_roles(OPS_ROLES)), db: Session = Depends(get_db)):
    from app.services.assessment.gemini_batch_code_evaluator import gemini_batch_code_evaluator
    budget = float(os.getenv("BATCH_EVAL_TIME_BUDGET_SECONDS", "40"))
    scope = _scope_class_ids(db, current_user)
    if scope is None:
        res = await gemini_batch_code_evaluator.evaluate_pending_batch(db, time_budget_seconds=budget)
    else:
        # A tutor grades only their own class's queue
        pending = [a.id for a in _apply_problem(_base_query(db, scope), "awaiting_grading").join(
            AssessmentRound, AssessmentAttempt.round_id == AssessmentRound.id
        ).filter(AssessmentRound.round_type.in_(AI_GRADED_ROUND_TYPES)).all()]
        started, outcomes = time.monotonic(), []
        for attempt_id in pending:
            if time.monotonic() - started > budget:
                break
            outcomes.append((await gemini_batch_code_evaluator.evaluate_attempt_now(attempt_id, db)).get("status"))
        done = outcomes.count("completed")
        res = {"processed_attempts": done, "retry_later": len(outcomes) - done, "remaining_pending": len(pending) - done}
    record_audit(db, current_user, "GRADING_QUEUE_RUN", "EXAM_OPS", None, None, res, request)
    db.commit()
    return res


@router.post("/maintenance/rebuild-profiles")
def rebuild_profiles(request: Request, current_user: User = Depends(require_roles(MAINTENANCE_ROLES)), db: Session = Depends(get_db)):
    """Rebuilds every stored analytics profile (radar/round results) from attempts, within a time budget."""
    pairs = db.query(AssessmentStudentAllocation.student_id, AssessmentActivationRequest.domain_id).join(
        AssessmentAttempt, AssessmentAttempt.allocation_id == AssessmentStudentAllocation.id
    ).join(
        AssessmentActivationRequest, AssessmentStudentAllocation.request_id == AssessmentActivationRequest.id
    ).distinct().all()
    started, built = time.monotonic(), 0
    for sid, did in pairs:
        if time.monotonic() - started > 40:
            break
        if refresh_profile(db, sid, did) is not None:
            built += 1
    res = {"profiles_total": len(pairs), "profiles_rebuilt": built, "complete": built == len(pairs)}
    record_audit(db, current_user, "PROFILES_REBUILT", "MAINTENANCE", None, None, res, request)
    db.commit()
    return res


@router.get("/maintenance/checks")
def system_checks(current_user: User = Depends(require_roles(MAINTENANCE_ROLES)), db: Session = Depends(get_db)):
    from sqlalchemy import inspect
    from app.database import engine
    insp = inspect(engine)
    tables = {t: insp.has_table(t) for t in ("student_competency_profiles", "assistant_leases", "proctoring_events", "gemini_usage")}
    from app.services.assessment.gemini_quota import next_reset, usage_today
    return {
        "gemini_usage_today": usage_today(db) if tables["gemini_usage"] else [],
        "gemini_quota_resets_at": next_reset().isoformat() + "Z",
        "gemini_api_key_configured": bool(GEMINI_API_KEY),
        "cron_secret_configured": bool(os.getenv("CRON_SECRET")),
        "running_on_vercel": bool(os.getenv("VERCEL")),
        "assistant_live_max_sessions": int(os.getenv("ASSISTANT_LIVE_MAX_SESSIONS", "3")),
        "required_tables": tables,
        "all_tables_present": all(tables.values()),
    }
