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
    is_admin = any(r in user_roles for r in ["Administrator", "Assessment Coordinator", "ERP Coordinator"])
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
