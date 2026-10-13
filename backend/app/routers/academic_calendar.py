"""
Academic Calendar settings: academic years, their Odd/Even semester dates, and batches.

Every panel reads the current academic year, term and each batch's semester from here
(GET /api/v1/academic-calendar), so Administrator, HoD, Tutor and Student views agree.
"""

import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.auth.jwt import get_current_user
from app.database import get_db
from app.models.models import AcademicClass, AcademicYear, Batch, Semester, StudentProfile, User
from app.services.academic_calendar import (
    TERM_NAMES,
    apply_semester_sync,
    batch_semester,
    current_term,
    parse_batch,
    parse_year_code,
    roman,
    semester_label,
    semester_sync_plan,
)
from app.services.audit import record_audit
from app.services import cache
from app.services.academic_calendar import CALENDAR_CACHE_PREFIX

router = APIRouter(prefix="/api/v1/academic-calendar", tags=["Academic Calendar"])


def _is_admin(user: User) -> bool:
    return "Administrator" in {r.name for r in user.roles}


def _require_admin(user: User) -> None:
    if not _is_admin(user):
        raise HTTPException(status_code=403, detail="Only Administrators can change the academic calendar.")


class YearRequest(BaseModel):
    year_code: str
    start_date: datetime.date
    end_date: datetime.date
    odd_start: datetime.date
    odd_end: datetime.date
    even_start: datetime.date
    even_end: datetime.date


class BatchRequest(BaseModel):
    name: str


def _validate_year(data: YearRequest, db: Session, year_id: Optional[int] = None) -> None:
    code = data.year_code.strip()
    parsed = parse_year_code(code)
    if not parsed:
        raise HTTPException(status_code=400, detail="Academic year must look like 2026-2027 (consecutive years).")
    data.year_code = code
    if not data.start_date < data.end_date:
        raise HTTPException(status_code=400, detail="The academic year must end after it starts.")
    if data.start_date.year != parsed[0]:
        raise HTTPException(status_code=400, detail=f"Academic year {code} must start in {parsed[0]}.")
    if not (data.odd_start < data.odd_end):
        raise HTTPException(status_code=400, detail="The Odd semester must end after it starts.")
    if not (data.even_start < data.even_end):
        raise HTTPException(status_code=400, detail="The Even semester must end after it starts.")
    if not (data.odd_end < data.even_start):
        raise HTTPException(status_code=400, detail="The Even semester must start after the Odd semester ends.")
    if data.odd_start < data.start_date or data.even_end > data.end_date:
        raise HTTPException(status_code=400, detail="Both semesters must fall within the academic year's dates.")
    clash = db.query(AcademicYear).filter(func.lower(AcademicYear.year_code) == code.lower())
    if year_id:
        clash = clash.filter(AcademicYear.id != year_id)
    if clash.first():
        raise HTTPException(status_code=400, detail=f"Academic year {code} already exists.")
    for other in db.query(AcademicYear).all():
        if other.id == year_id or not (other.start_date and other.end_date):
            continue
        if data.start_date <= other.end_date and other.start_date <= data.end_date:
            raise HTTPException(status_code=400, detail=f"These dates overlap academic year {other.year_code}.")


def _upsert_terms(db: Session, year_code: str, data: YearRequest, old_code: Optional[str] = None) -> None:
    rows = {s.number: s for s in db.query(Semester).filter(Semester.academic_year == (old_code or year_code)).all()}
    for number, start, end in ((1, data.odd_start, data.odd_end), (2, data.even_start, data.even_end)):
        s = rows.get(number)
        if not s:
            s = Semester(number=number)
            db.add(s)
        s.name = TERM_NAMES[number]
        s.academic_year = year_code
        s.start_date, s.end_date = start, end


def _refresh_current_flags(db: Session) -> None:
    """Keeps the legacy is_current flag in step with the dates (the year containing today)."""
    db.flush()
    ctx = current_term(db)
    for y in db.query(AcademicYear).all():
        y.is_current = bool(ctx.get("configured") and y.id == ctx.get("academic_year_id"))


def _year_payload(y: AcademicYear, db: Session) -> Dict[str, Any]:
    terms = {s.number: s for s in db.query(Semester).filter(Semester.academic_year == y.year_code).all()}
    def term(n):
        s = terms.get(n)
        return {"name": TERM_NAMES[n], "start_date": s.start_date.isoformat() if s and s.start_date else None,
                "end_date": s.end_date.isoformat() if s and s.end_date else None}
    return {"id": y.id, "year_code": y.year_code, "is_current": bool(y.is_current),
            "start_date": y.start_date.isoformat() if y.start_date else None,
            "end_date": y.end_date.isoformat() if y.end_date else None,
            "odd": term(1), "even": term(2)}


def _all_batch_names(db: Session) -> List[str]:
    names = {b.name for b in db.query(Batch).all()}
    names |= {c.batch_name for c in db.query(AcademicClass.batch_name).distinct() if c.batch_name}
    names |= {s.batch_name for s in db.query(StudentProfile.batch_name).distinct() if s.batch_name}
    return sorted(n for n in names if parse_batch(n))


def _batches_payload(db: Session, ctx: Dict[str, Any]) -> List[Dict[str, Any]]:
    registered = {b.name: b for b in db.query(Batch).all()}
    class_counts = dict(db.query(AcademicClass.batch_name, func.count(AcademicClass.id)).group_by(AcademicClass.batch_name).all())
    student_counts = dict(db.query(StudentProfile.batch_name, func.count(StudentProfile.id)).group_by(StudentProfile.batch_name).all())
    out = []
    for name in sorted(_all_batch_names(db), reverse=True):
        start, end = parse_batch(name)
        sem = batch_semester(name, ctx)
        ay = parse_year_code(ctx.get("academic_year") or "")
        if sem:
            status = "active"
        elif ay and start > ay[0]:
            status = "upcoming"
        else:
            status = "completed"
        out.append({
            "id": registered[name].id if name in registered else None,
            "name": name, "start_year": start, "end_year": end,
            "current_semester": sem, "current_semester_label": f"Semester {roman(sem)}" if sem else None,
            "year_of_study": ((sem + 1) // 2) if sem else None,
            "status": status,
            "classes": class_counts.get(name, 0), "students": student_counts.get(name, 0),
        })
    return out


@router.get("")
def get_academic_calendar(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Current academic year, term and every batch's semester. Readable by every signed-in user."""
    def shared_payload() -> Dict[str, Any]:
        ctx = current_term(db)
        batches = _batches_payload(db, ctx)
        return {
            "context": ctx,
            "semester_label": semester_label(ctx, [b["name"] for b in batches]),
            "batches": batches,
            "active_batches": [b["name"] for b in batches if b["status"] == "active"],
        }
    # The part every user sees; admin-only years and sync plan below stay live
    payload: Dict[str, Any] = cache.get_or_set(f"{CALENDAR_CACHE_PREFIX}payload", 60, shared_payload)
    if _is_admin(current_user):
        years = sorted(db.query(AcademicYear).all(), key=lambda y: y.year_code, reverse=True)
        payload["years"] = [_year_payload(y, db) for y in years]
        plan = semester_sync_plan(db)
        payload["sync"] = {"class_changes": plan["class_changes"], "student_changes": plan["student_changes"]}
    return payload


@router.post("/years")
def create_year(data: YearRequest, request: Request, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _require_admin(current_user)
    _validate_year(data, db)
    y = AcademicYear(year_code=data.year_code, start_date=data.start_date, end_date=data.end_date, is_current=False)
    db.add(y)
    _upsert_terms(db, data.year_code, data)
    _refresh_current_flags(db)
    record_audit(db, current_user, "ACADEMIC_YEAR_CREATED", "ACADEMIC_CALENDAR", data.year_code, None,
                 data.model_dump(mode="json"), request)
    db.commit()
    cache.clear(CALENDAR_CACHE_PREFIX)
    return _year_payload(y, db)


@router.put("/years/{year_id}")
def update_year(year_id: int, data: YearRequest, request: Request, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _require_admin(current_user)
    y = db.query(AcademicYear).filter(AcademicYear.id == year_id).first()
    if not y:
        raise HTTPException(status_code=404, detail="Academic year not found.")
    _validate_year(data, db, year_id)
    before = _year_payload(y, db)
    old_code = y.year_code
    y.year_code, y.start_date, y.end_date = data.year_code, data.start_date, data.end_date
    _upsert_terms(db, data.year_code, data, old_code)
    _refresh_current_flags(db)
    record_audit(db, current_user, "ACADEMIC_YEAR_UPDATED", "ACADEMIC_CALENDAR", data.year_code, before,
                 data.model_dump(mode="json"), request)
    db.commit()
    cache.clear(CALENDAR_CACHE_PREFIX)
    return _year_payload(y, db)


@router.delete("/years/{year_id}")
def delete_year(year_id: int, request: Request, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _require_admin(current_user)
    y = db.query(AcademicYear).filter(AcademicYear.id == year_id).first()
    if not y:
        raise HTTPException(status_code=404, detail="Academic year not found.")
    if current_term(db).get("academic_year_id") == y.id:
        raise HTTPException(status_code=409, detail="The current academic year cannot be deleted. Add the next year first.")
    before = _year_payload(y, db)
    db.query(Semester).filter(Semester.academic_year == y.year_code).delete(synchronize_session=False)
    db.delete(y)
    record_audit(db, current_user, "ACADEMIC_YEAR_DELETED", "ACADEMIC_CALENDAR", before["year_code"], before, None, request)
    db.commit()
    cache.clear(CALENDAR_CACHE_PREFIX)
    return {"message": f"Academic year {before['year_code']} deleted."}


@router.post("/batches")
def create_batch(data: BatchRequest, request: Request, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _require_admin(current_user)
    name = data.name.strip()
    parsed = parse_batch(name)
    if not parsed or not (1 <= parsed[1] - parsed[0] <= 6):
        raise HTTPException(status_code=400, detail="A batch looks like 2026-2029 (entry year - completion year).")
    if db.query(Batch).filter(Batch.name == name).first():
        raise HTTPException(status_code=400, detail=f"Batch {name} already exists.")
    b = Batch(name=name, start_year=parsed[0], end_year=parsed[1])
    db.add(b)
    record_audit(db, current_user, "BATCH_CREATED", "ACADEMIC_CALENDAR", name, None, {"name": name}, request)
    db.commit()
    cache.clear(CALENDAR_CACHE_PREFIX)
    return {"id": b.id, "name": b.name}


@router.delete("/batches/{batch_id}")
def delete_batch(batch_id: int, request: Request, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _require_admin(current_user)
    b = db.query(Batch).filter(Batch.id == batch_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Batch not found.")
    used = db.query(AcademicClass).filter(AcademicClass.batch_name == b.name).count() + \
        db.query(StudentProfile).filter(StudentProfile.batch_name == b.name).count()
    if used:
        raise HTTPException(status_code=409, detail=f"Batch {b.name} still has classes or students.")
    db.delete(b)
    record_audit(db, current_user, "BATCH_DELETED", "ACADEMIC_CALENDAR", b.name, {"name": b.name}, None, request)
    db.commit()
    cache.clear(CALENDAR_CACHE_PREFIX)
    return {"message": f"Batch {b.name} deleted."}


@router.get("/semester-sync")
def preview_semester_sync(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _require_admin(current_user)
    return semester_sync_plan(db)


@router.post("/semester-sync")
def run_semester_sync(request: Request, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Updates every class's and student's stored semester to match the calendar."""
    _require_admin(current_user)
    plan = semester_sync_plan(db)
    result = apply_semester_sync(db)
    record_audit(db, current_user, "SEMESTERS_SYNCED", "ACADEMIC_CALENDAR", result["context"].get("academic_year"),
                 {"classes": plan["classes"], "students_by_batch": plan["students_by_batch"]},
                 {"classes_updated": result["classes_updated"], "students_updated": result["students_updated"]}, request)
    db.commit()
    cache.clear(CALENDAR_CACHE_PREFIX)
    return result
