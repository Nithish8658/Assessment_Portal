"""
Academic calendar: the single source of truth for the current academic year and term.

- Administrators set each academic year's dates and its two semesters' dates.
- Term 1 is the Odd semester (I, III, V...), term 2 the Even semester (II, IV, VI...).
- A batch's semester number follows from its start year and the current term:
      semester = (academic_year_start - batch_start_year) * 2 + term
  e.g. batch 2024-2027 in the Odd semester of 2025-2026 is in semester 3.
"""

import datetime
import re
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy.orm import Session

from app.models.models import AcademicClass, AcademicYear, Semester, StudentProfile

TERM_NAMES = {1: "Odd Semester", 2: "Even Semester"}
ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"]
_YEAR_CODE = re.compile(r"^(\d{4})-(\d{4})$")


def parse_year_code(code: str) -> Optional[Tuple[int, int]]:
    m = _YEAR_CODE.match((code or "").strip())
    if not m:
        return None
    start, end = int(m.group(1)), int(m.group(2))
    return (start, end) if end == start + 1 else None


def parse_batch(batch_name: Optional[str]) -> Optional[Tuple[int, int]]:
    m = _YEAR_CODE.match((batch_name or "").strip())
    if not m:
        return None
    start, end = int(m.group(1)), int(m.group(2))
    return (start, end) if end > start else None


def roman(n: Optional[int]) -> str:
    return ROMAN[n - 1] if n and 1 <= n <= len(ROMAN) else str(n or "")


def _today(today: Optional[datetime.date]) -> datetime.date:
    return today or datetime.date.today()


def current_year(db: Session, today: Optional[datetime.date] = None) -> Optional[AcademicYear]:
    """The academic year whose dates contain today; otherwise the latest one that has already started."""
    t = _today(today)
    years = [y for y in db.query(AcademicYear).all() if y.start_date and y.end_date]
    inside = [y for y in years if y.start_date <= t <= y.end_date]
    if inside:
        return inside[0]
    started = sorted([y for y in years if y.start_date <= t], key=lambda y: y.start_date)
    if started:
        return started[-1]
    flagged = db.query(AcademicYear).filter(AcademicYear.is_current == True).first()  # undated legacy setup
    return flagged


def current_term(db: Session, today: Optional[datetime.date] = None) -> Dict[str, Any]:
    """Current academic year and term. Between terms, the most recently started term applies."""
    t = _today(today)
    year = current_year(db, t)
    if not year:
        return {"configured": False}
    terms = sorted([s for s in db.query(Semester).filter(Semester.academic_year == year.year_code).all()
                    if s.start_date and s.end_date], key=lambda s: s.start_date)
    term = next((s for s in terms if s.start_date <= t <= s.end_date), None)
    status = "in_term"
    if not term:
        started = [s for s in terms if s.start_date <= t]
        term = started[-1] if started else (terms[0] if terms else None)
        status = "between_terms" if term else "terms_not_set"
    return {
        "configured": True,
        "academic_year": year.year_code,
        "academic_year_id": year.id,
        "year_start_date": year.start_date.isoformat() if year.start_date else None,
        "year_end_date": year.end_date.isoformat() if year.end_date else None,
        "term_number": term.number if term else None,
        "term_name": TERM_NAMES.get(term.number, term.name) if term else None,
        "term_start_date": term.start_date.isoformat() if term else None,
        "term_end_date": term.end_date.isoformat() if term else None,
        "status": status,
    }


def batch_semester(batch_name: Optional[str], ctx: Dict[str, Any]) -> Optional[int]:
    """Semester number of a batch in the current term, or None if the batch has not started or has finished."""
    if not ctx.get("configured") or not ctx.get("term_number"):
        return None
    batch = parse_batch(batch_name)
    year = parse_year_code(ctx["academic_year"])
    if not batch or not year:
        return None
    n = (year[0] - batch[0]) * 2 + ctx["term_number"]
    return n if 1 <= n <= (batch[1] - batch[0]) * 2 else None


def current_academic_year_code(db: Session, fallback: str) -> str:
    y = current_year(db)
    return y.year_code if y else fallback


def semester_label(ctx: Dict[str, Any], batches: List[str]) -> str:
    """e.g. 'Odd Semester (I · III · V)' using the semesters active batches are in."""
    if not ctx.get("configured") or not ctx.get("term_name"):
        return "Not configured"
    nums = sorted({n for n in (batch_semester(b, ctx) for b in batches) if n})
    return f"{ctx['term_name']} ({' · '.join(roman(n) for n in nums)})" if nums else ctx["term_name"]


def semester_sync_plan(db: Session) -> Dict[str, Any]:
    """Which classes and students have a stored semester number that differs from the calendar."""
    ctx = current_term(db)
    plan = {"context": ctx, "classes": [], "students_by_batch": {}, "class_changes": 0, "student_changes": 0}
    if not ctx.get("configured") or not ctx.get("term_number"):
        return plan
    for c in db.query(AcademicClass).all():
        expected = batch_semester(c.batch_name, ctx)
        if expected and c.semester_num != expected:
            plan["classes"].append({"id": c.id, "class_code": c.class_code, "batch": c.batch_name,
                                    "from": c.semester_num, "to": expected})
    plan["class_changes"] = len(plan["classes"])
    for s in db.query(StudentProfile.batch_name, StudentProfile.semester_num).all():
        expected = batch_semester(s.batch_name, ctx)
        if expected and s.semester_num != expected:
            row = plan["students_by_batch"].setdefault(s.batch_name, {"to": expected, "count": 0})
            row["count"] += 1
            plan["student_changes"] += 1
    return plan


def apply_semester_sync(db: Session) -> Dict[str, Any]:
    ctx = current_term(db)
    changed_classes = changed_students = 0
    if ctx.get("configured") and ctx.get("term_number"):
        for c in db.query(AcademicClass).all():
            expected = batch_semester(c.batch_name, ctx)
            if expected and c.semester_num != expected:
                c.semester_num = expected
                changed_classes += 1
        for s in db.query(StudentProfile).all():
            expected = batch_semester(s.batch_name, ctx)
            if expected and s.semester_num != expected:
                s.semester_num = expected
                changed_students += 1
    return {"context": ctx, "classes_updated": changed_classes, "students_updated": changed_students}


# ---------------------------------------------------------------------------
# Defaults derived from the calendar (used instead of hard-coded batch years)
# ---------------------------------------------------------------------------

def _known_batches(db: Session) -> List[str]:
    from app.models.models import Batch
    names = {b.name for b in db.query(Batch).all()}
    names |= {c.batch_name for c in db.query(AcademicClass.batch_name).distinct() if c.batch_name}
    return [n for n in names if parse_batch(n)]


def semester_for_batch(db: Session, batch_name: Optional[str]) -> Optional[int]:
    """The batch's semester in the current term, or None if it isn't running now."""
    return batch_semester(batch_name, current_term(db))


def default_batch(db: Session) -> Optional[str]:
    """The current first-year batch: the active batch in the lowest semester."""
    ctx = current_term(db)
    active = [(batch_semester(n, ctx), n) for n in _known_batches(db)]
    active = sorted((s, n) for s, n in active if s)
    return active[0][1] if active else None


def batch_for_semester(db: Session, semester_num: Optional[int], programme_id: Optional[int] = None) -> Optional[str]:
    """Which batch is in this semester now: the programme's class in that semester, else any active batch."""
    if not semester_num:
        return None
    ctx = current_term(db)
    if programme_id:
        for c in db.query(AcademicClass).filter(AcademicClass.programme_id == programme_id).all():
            if batch_semester(c.batch_name, ctx) == semester_num:
                return c.batch_name
    for n in sorted(_known_batches(db)):
        if batch_semester(n, ctx) == semester_num:
            return n
    return None
