import datetime
import threading
import time
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Dict, Any, List, Optional

from app.database import get_db
from app.models.models import User, AcademicClass, Programme
from app.auth.jwt import get_current_user

router = APIRouter(prefix="/api/v1/dashboard", tags=["Dashboard Intelligence"])

# In-memory short-TTL cache with lock to completely prevent Cache Stampede / Thundering Herd
_METRICS_CACHE: Dict[str, Dict[str, Any]] = {}
_CACHE_LOCK = threading.Lock()
CACHE_TTL_SECONDS = 10.0

def invalidate_dashboard_cache():
    """Call this on mutations (e.g. roster approve, user create) to bust the cache."""
    with _CACHE_LOCK:
        _METRICS_CACHE.clear()

@router.get("/metrics")
def get_dashboard_metrics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    High-performance consolidated dashboard metrics endpoint.
    1. Single-statement SQL aggregation (1 DB round-trip instead of 8).
    2. Double-checked locking to prevent Cache Stampede (Thundering Herd) on concurrent cold starts.
    3. Short-TTL in-memory cache (10s) to protect DB pool under 200+ VU bursts.
    4. Scoped by role: Administrator, HoD, Class Tutor, Student.
    """
    user_roles = [r.name for r in current_user.roles]
    is_admin = "Administrator" in user_roles
    is_hod = "HoD" in user_roles
    is_tutor = "Class Tutor" in user_roles

    fp = current_user.faculty_profile
    dept_id = fp.department_id if fp else None
    prog_id = fp.assigned_programme_id if fp else None
    batch = fp.assigned_batch if fp else None
    sec = fp.assigned_section if fp else None

    cache_key = f"admin" if is_admin else f"hod_{dept_id}" if is_hod else f"tutor_{prog_id}_{batch}_{sec}" if is_tutor else "student"
    now = time.time()

    # Fast-path check without acquiring lock
    if cache_key in _METRICS_CACHE:
        cached = _METRICS_CACHE[cache_key]
        if now - cached["timestamp"] < CACHE_TTL_SECONDS:
            return cached["data"]

    # Double-checked lock: only 1 winning thread queries DB; remaining 199 return from RAM immediately
    with _CACHE_LOCK:
        now = time.time()
        if cache_key in _METRICS_CACHE:
            cached = _METRICS_CACHE[cache_key]
            if now - cached["timestamp"] < CACHE_TTL_SECONDS:
                return cached["data"]

        metrics = {
            "total_departments": 0,
            "total_programmes": 0,
            "total_classes": 0,
            "total_courses": 0,
            "total_allocations": 0,
            "total_students": 0,
            "total_faculty": 0,
            "pending_rosters": 0,
        }
        recent_classes: List[Dict[str, Any]] = []

        if is_admin:
            # Combined single-statement aggregation (1 network roundtrip)
            sql = text("""
                SELECT 
                    (SELECT count(*) FROM departments) AS depts,
                    (SELECT count(*) FROM programmes) AS progs,
                    (SELECT count(*) FROM academic_classes) AS cls,
                    (SELECT count(*) FROM courses) AS crs,
                    (SELECT count(*) FROM course_allocations) AS allocs,
                    (SELECT count(*) FROM students) AS studs,
                    (SELECT count(*) FROM faculty) AS facs,
                    (SELECT count(*) FROM roster_approval_batches WHERE status = 'Pending') AS rosters
            """)
            row = db.execute(sql).mappings().first()
            if row:
                metrics["total_departments"] = row["depts"] or 0
                metrics["total_programmes"] = row["progs"] or 0
                metrics["total_classes"] = row["cls"] or 0
                metrics["total_courses"] = row["crs"] or 0
                metrics["total_allocations"] = row["allocs"] or 0
                metrics["total_students"] = row["studs"] or 0
                metrics["total_faculty"] = row["facs"] or 0
                metrics["pending_rosters"] = row["rosters"] or 0

            classes = db.query(AcademicClass).order_by(AcademicClass.id.desc()).limit(5).all()
            for c in classes:
                recent_classes.append({
                    "id": c.id,
                    "class_code": c.class_code,
                    "name": c.name,
                    "programme_id": c.programme_id,
                    "programme_name": c.programme.name if c.programme else "N/A",
                    "batch_name": c.batch_name,
                    "semester_num": c.semester_num,
                    "section_name": c.section_name
                })

        elif is_hod and dept_id:
            sql = text("""
                SELECT 
                    (SELECT count(*) FROM programmes WHERE department_id = :dept_id) AS progs,
                    (SELECT count(*) FROM academic_classes ac JOIN programmes p ON ac.programme_id = p.id WHERE p.department_id = :dept_id) AS cls,
                    (SELECT count(*) FROM courses crs JOIN programmes p ON crs.programme_id = p.id WHERE p.department_id = :dept_id) AS crs,
                    (SELECT count(*) FROM faculty WHERE department_id = :dept_id) AS facs,
                    (SELECT count(*) FROM students s JOIN programmes p ON s.programme_id = p.id WHERE p.department_id = :dept_id) AS studs,
                    (SELECT count(*) FROM course_allocations ca JOIN courses c ON ca.course_id = c.id JOIN programmes p ON c.programme_id = p.id WHERE p.department_id = :dept_id) AS allocs,
                    (SELECT count(*) FROM roster_approval_batches rb JOIN programmes p ON rb.programme_id = p.id WHERE p.department_id = :dept_id AND rb.status = 'Pending') AS rosters
            """)
            row = db.execute(sql, {"dept_id": dept_id}).mappings().first()
            if row:
                metrics["total_departments"] = 1
                metrics["total_programmes"] = row["progs"] or 0
                metrics["total_classes"] = row["cls"] or 0
                metrics["total_courses"] = row["crs"] or 0
                metrics["total_allocations"] = row["allocs"] or 0
                metrics["total_students"] = row["studs"] or 0
                metrics["total_faculty"] = row["facs"] or 0
                metrics["pending_rosters"] = row["rosters"] or 0

            classes = db.query(AcademicClass).join(
                Programme, AcademicClass.programme_id == Programme.id
            ).filter(Programme.department_id == dept_id).order_by(AcademicClass.id.desc()).limit(5).all()

            for c in classes:
                recent_classes.append({
                    "id": c.id,
                    "class_code": c.class_code,
                    "name": c.name,
                    "programme_id": c.programme_id,
                    "programme_name": c.programme.name if c.programme else "N/A",
                    "batch_name": c.batch_name,
                    "semester_num": c.semester_num,
                    "section_name": c.section_name
                })

        elif is_tutor and prog_id and batch and sec:
            sql = text("""
                SELECT 
                    (SELECT count(*) FROM students WHERE programme_id = :prog_id AND batch_name = :batch AND section_name = :sec) AS studs,
                    (SELECT count(*) FROM roster_approval_batches WHERE tutor_id = :tutor_id AND status = 'Pending') AS rosters
            """)
            row = db.execute(sql, {"prog_id": prog_id, "batch": batch, "sec": sec, "tutor_id": fp.id}).mappings().first()
            metrics["total_departments"] = 1
            metrics["total_programmes"] = 1
            metrics["total_classes"] = 1
            if row:
                metrics["total_students"] = row["studs"] or 0
                metrics["pending_rosters"] = row["rosters"] or 0

            classes = db.query(AcademicClass).filter(
                AcademicClass.programme_id == prog_id,
                AcademicClass.batch_name == batch,
                AcademicClass.section_name == sec
            ).limit(1).all()

            for c in classes:
                recent_classes.append({
                    "id": c.id,
                    "class_code": c.class_code,
                    "name": c.name,
                    "programme_id": c.programme_id,
                    "programme_name": c.programme.name if c.programme else "N/A",
                    "batch_name": c.batch_name,
                    "semester_num": c.semester_num,
                    "section_name": c.section_name
                })
        else:
            metrics["total_departments"] = 1

        payload = {
            "metrics": metrics,
            "recent_classes": recent_classes
        }
        _METRICS_CACHE[cache_key] = {"data": payload, "timestamp": time.time()}
        return payload


# --- HoD homepage analytics: class trends, score distribution, skill strengths and gaps ---
# Every score follows app.services.assessment.latest_results: per (student, round) only the
# latest EVALUATED attempt counts; earlier attempts are never averaged in.

HOD_ANALYTICS_TTL_SECONDS = 60


def _month_ends(db: Session) -> List[datetime.date]:
    """Month starts of the current academic year up to this month (last 6 months if unset)."""
    from app.services.academic_calendar import current_term
    ctx = current_term(db)
    today = datetime.date.today()
    if ctx.get("year_start_date"):
        start = datetime.date.fromisoformat(ctx["year_start_date"]).replace(day=1)
        end = min(datetime.date.fromisoformat(ctx["year_end_date"]) if ctx.get("year_end_date") else today, today)
    else:
        y, m = today.year, today.month - 5
        while m < 1:
            y, m = y - 1, m + 12
        start, end = datetime.date(y, m, 1), today
    months, cur = [], start
    while cur <= end:
        months.append(cur)
        cur = datetime.date(cur.year + (cur.month == 12), cur.month % 12 + 1, 1)
    return months


def _build_hod_analytics(db: Session, department_id: Optional[int]) -> Dict[str, Any]:
    from sqlalchemy.orm import joinedload, selectinload
    from app.models.assessment_models import (
        AssessmentAttempt, AssessmentStudentAllocation, AssessmentActivationRequest, CompetencyScore,
    )
    from app.services.assessment.latest_results import (
        latest_published_by_student_round, attempt_percentage,
    )

    q = db.query(AcademicClass).join(Programme, AcademicClass.programme_id == Programme.id)
    if department_id:
        q = q.filter(Programme.department_id == department_id)
    classes = q.order_by(AcademicClass.id).all()
    class_ids = [c.id for c in classes]

    attempts = db.query(AssessmentAttempt).join(
        AssessmentStudentAllocation, AssessmentAttempt.allocation_id == AssessmentStudentAllocation.id
    ).join(
        AssessmentActivationRequest, AssessmentStudentAllocation.request_id == AssessmentActivationRequest.id
    ).filter(
        AssessmentActivationRequest.academic_class_id.in_(class_ids),
        AssessmentAttempt.status == "EVALUATED",
    ).options(
        joinedload(AssessmentAttempt.allocation).joinedload(AssessmentStudentAllocation.request),
        joinedload(AssessmentAttempt.result),
        selectinload(AssessmentAttempt.competency_scores).joinedload(CompetencyScore.competency),
    ).all() if class_ids else []

    class_of = lambda a: a.allocation.request.academic_class_id
    when = lambda a: a.submitted_at or a.started_at

    # I. Class trends: each month's point is the class as it stood at the end of that month
    months = _month_ends(db)
    trend = {c.id: [] for c in classes}
    for m in months:
        month_end = datetime.datetime(m.year + (m.month == 12), m.month % 12 + 1, 1)
        latest = latest_published_by_student_round(a for a in attempts if when(a) and when(a) < month_end)
        per_class: Dict[int, List[float]] = {}
        for a in latest.values():
            per_class.setdefault(class_of(a), []).append(attempt_percentage(a))
        for cid in trend:
            vals = per_class.get(cid, [])
            trend[cid].append({
                "month": m.strftime("%Y-%m"),
                "avg": round(sum(vals) / len(vals), 1) if vals else None,
                "results": len(vals),
            })

    # J. Score distribution: each student's average over their latest published result per
    # round, counted into the grade bands below
    bands = [{"label": "Excellent", "min": 90}, {"label": "V Good", "min": 75}, {"label": "Good", "min": 60},
             {"label": "Average", "min": 40}, {"label": "Bad", "min": 0}]
    latest_now = latest_published_by_student_round(attempts)
    per_student: Dict[tuple, List[float]] = {}
    for (sid, _), a in latest_now.items():
        per_student.setdefault((class_of(a), sid), []).append(attempt_percentage(a))
    dist = {c.id: [0] * len(bands) for c in classes}
    for (cid, _), vals in per_student.items():
        avg = sum(vals) / len(vals)
        dist[cid][next((i for i, b in enumerate(bands) if avg >= b["min"]), len(bands) - 1)] += 1

    # L. Skills: competency scores from each student's latest published attempt per round
    skills: Dict[int, Dict[str, Any]] = {}
    for a in latest_now.values():
        for cs in a.competency_scores:
            row = skills.setdefault(cs.competency_id, {"code": cs.competency.code, "name": cs.competency.name, "vals": [], "students": set()})
            row["vals"].append(cs.percentage or 0.0)
            row["students"].add(a.allocation.student_id)

    return {
        "months": [m.strftime("%Y-%m") for m in months],
        "month_labels": [m.strftime("%b") for m in months],
        "bands": bands,
        "classes": [{"id": c.id, "name": c.name, "code": c.class_code, "trend": trend[c.id]} for c in classes],
        # counts per band, in the same order as "bands" (Excellent first)
        "distribution": [{"class_id": c.id, "name": c.name, "counts": dist[c.id], "students": sum(dist[c.id])}
                         for c in classes],
        "skills": sorted(
            [{"code": r["code"], "name": r["name"], "avg": round(sum(r["vals"]) / len(r["vals"]), 1), "students": len(r["students"])}
             for r in skills.values()],
            key=lambda r: -r["avg"],
        ),
        "skill_target": 60,
    }


@router.get("/hod-analytics")
def get_hod_analytics(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Class trends, score distribution and skill gaps for the HoD's department (Admin: all departments)."""
    from fastapi import HTTPException
    from app.routers.users import get_user_department_id
    from app.services import cache
    roles = {r.name for r in current_user.roles}
    if not roles & {"HoD", "Administrator"}:
        raise HTTPException(status_code=403, detail="Department analytics are available to HoDs and Administrators.")
    department_id = None if "Administrator" in roles else get_user_department_id(current_user)
    if "Administrator" not in roles and not department_id:
        raise HTTPException(status_code=404, detail="No department is assigned to your account.")
    return cache.get_or_set(f"hod-analytics:{department_id or 'all'}", HOD_ANALYTICS_TTL_SECONDS,
                            lambda: _build_hod_analytics(db, department_id))
