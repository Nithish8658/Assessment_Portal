"""
Purpose-built, scope-enforced data tools for the assistant.

- latest_results(): a student's (or a class's) CURRENT grades, read from the stored
  competency profiles (latest published result per round). No recomputation.
- student_progress(): how a student progressed across attempts, round by round,
  from the attempt history (every graded attempt, in order, with score changes).

HoD users are limited to students of their own department; this is enforced here,
not left to the language model.
"""

from typing import Any, Dict, List, Optional

from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from app.database import SessionLocal
from app.models.models import AcademicClass, Programme, StudentProfile, User
from app.models.assessment_models import (
    AssessmentActivationRequest,
    AssessmentAttempt,
    AssessmentDomain,
    AssessmentStudentAllocation,
)
from app.services.assessment.competency_profiles import load_profiles, profile_view
from app.services.assessment.latest_results import (
    _recency_key,
    attempt_passed,
    attempt_percentage,
)

MAX_CLASS_ROWS = 80


def _scoped_students(db: Session, ctx):
    q = db.query(StudentProfile).join(User, StudentProfile.user_id == User.id)
    if not ctx.is_admin:
        if not (ctx.is_hod and ctx.department_id):
            return None
        q = q.join(Programme, StudentProfile.programme_id == Programme.id).filter(Programme.department_id == ctx.department_id)
    return q


def _find_student(db: Session, ctx, student: str):
    q = _scoped_students(db, ctx)
    if q is None:
        return None, {"error": "Your account has no department scope for student data."}
    term = (student or "").strip()
    if not term:
        return None, {"error": "Provide a student's register number or name."}
    exact = q.filter(StudentProfile.register_number.ilike(term)).all()
    matches = exact or q.filter(or_(User.full_name.ilike(f"%{term}%"), StudentProfile.register_number.ilike(f"%{term}%"))).limit(6).all()
    if not matches:
        return None, {"error": f"No student matching '{term}' within your permitted scope."}
    if len(matches) > 1:
        return None, {
            "needs_clarification": True,
            "message": "Several students match; ask which one is meant.",
            "candidates": [{"register_number": s.register_number, "name": s.user.full_name if s.user else ""} for s in matches],
        }
    return matches[0], None


def _find_domain(db: Session, domain: Optional[str]):
    if not domain:
        return None
    term = domain.strip()
    return db.query(AssessmentDomain).filter(
        or_(AssessmentDomain.slug.ilike(term), AssessmentDomain.title.ilike(f"%{term}%"))
    ).first()


def _compact_view(view: Dict[str, Any], domain_title: str) -> Dict[str, Any]:
    return {
        "domain": domain_title,
        "overall_percentage": view["overall_percentage"],
        "readiness": view["readiness_index"],
        "rounds_completed": f"{view['rounds_completed']}/{view['rounds_total']}",
        "rounds": [
            {
                "round": f"R{r['round_number']}: {r['round_title']}",
                "latest_percentage": r["percentage"] if r["published"] else None,
                "passed": r["passed"] if r["published"] else None,
                "from_attempt": f"{r['attempt_number']} of {r['total_attempts']}" if r["published"] else None,
                "status": "graded" if r["published"] else r["status"].lower().replace("_", " "),
                "retake_in_progress": r.get("newer_attempt_status"),
            }
            for r in view["rounds"]
        ],
        "competencies": [{"competency": c["competency_name"], "percentage": c["percentage"]} for c in view["competencies"]],
        "strengths": view["strengths"],
        "gaps": view["gaps"],
        "last_updated": view["updated_at"],
    }


def latest_results(ctx, student: Optional[str] = None, class_code: Optional[str] = None, domain: Optional[str] = None) -> Dict[str, Any]:
    db = SessionLocal()
    try:
        dom = _find_domain(db, domain)
        if domain and not dom:
            return {"error": f"No assessment domain matching '{domain}'."}

        if student:
            s, err = _find_student(db, ctx, student)
            if err:
                return err
            profiles = load_profiles(db, [s.id], dom.id if dom else None)
            domains = {d.id: d.title for d in db.query(AssessmentDomain).all()}
            results = [_compact_view(profile_view(p), domains.get(did, str(did))) for (sid, did), p in profiles.items()]
            return {
                "data_source": "stored competency profiles (latest published result per round; retakes replace earlier results)",
                "student": {"register_number": s.register_number, "name": s.user.full_name if s.user else ""},
                "results": results or "No rounds attempted yet.",
            }

        if class_code:
            q = _scoped_students(db, ctx)
            if q is None:
                return {"error": "Your account has no department scope for student data."}
            cls = db.query(AcademicClass).filter(
                or_(AcademicClass.class_code.ilike(class_code.strip()), AcademicClass.name.ilike(class_code.strip()))
            ).first()
            if not cls:
                return {"error": f"No class matching '{class_code}'."}
            students = q.filter(
                StudentProfile.programme_id == cls.programme_id,
                StudentProfile.batch_name == cls.batch_name,
                StudentProfile.section_name == cls.section_name,
            ).order_by(StudentProfile.register_number).limit(MAX_CLASS_ROWS).all()
            if not students:
                return {"error": f"Class '{class_code}' is outside your scope or has no students."}
            profiles = load_profiles(db, [s.id for s in students], dom.id if dom else None)
            rows = []
            for s in students:
                for (sid, did), p in profiles.items():
                    if sid != s.id:
                        continue
                    v = profile_view(p)
                    row = {"register_number": s.register_number, "name": s.user.full_name if s.user else ""}
                    if not dom:
                        row["domain_id"] = did
                    for r in v["rounds"]:
                        row[f"R{r['round_number']}"] = r["percentage"] if r["published"] else None
                    row["overall"] = v["overall_percentage"]
                    row["readiness"] = v["readiness_index"]
                    rows.append(row)
            return {
                "data_source": "stored competency profiles (latest published result per round)",
                "class": cls.name,
                "domain": dom.title if dom else "all domains",
                "students_with_results": len(rows),
                "rows": rows,
            }

        return {"error": "Provide either a student (register number or name) or a class_code."}
    finally:
        db.close()


def _trend(scores: List[float]) -> str:
    if not scores:
        return "not graded yet"
    if len(scores) == 1:
        return "single attempt"
    delta = scores[-1] - scores[0]
    if delta >= 5:
        return "improving"
    if delta <= -5:
        return "declining"
    return "steady"


def student_progress(ctx, student: str, domain: Optional[str] = None) -> Dict[str, Any]:
    db = SessionLocal()
    try:
        s, err = _find_student(db, ctx, student)
        if err:
            return err
        dom = _find_domain(db, domain)
        if domain and not dom:
            return {"error": f"No assessment domain matching '{domain}'."}

        q = db.query(AssessmentAttempt).join(
            AssessmentStudentAllocation, AssessmentAttempt.allocation_id == AssessmentStudentAllocation.id
        ).join(
            AssessmentActivationRequest, AssessmentStudentAllocation.request_id == AssessmentActivationRequest.id
        ).options(
            joinedload(AssessmentAttempt.round), joinedload(AssessmentAttempt.result)
        ).filter(AssessmentStudentAllocation.student_id == s.id)
        if dom:
            q = q.filter(AssessmentActivationRequest.domain_id == dom.id)
        attempts = sorted(q.all(), key=_recency_key)

        by_round: Dict[int, List[AssessmentAttempt]] = {}
        for a in attempts:
            by_round.setdefault(a.round_id, []).append(a)

        domains = {d.id: d.title for d in db.query(AssessmentDomain).all()}
        rounds_out, timeline = [], []
        improved = declined = 0
        for rid, lst in sorted(by_round.items(), key=lambda kv: (kv[1][0].round.domain_id, kv[1][0].round.round_number)):
            r = lst[0].round
            history, scores, prev = [], [], None
            for a in lst:
                graded = a.status == "EVALUATED"
                pct = round(attempt_percentage(a), 2) if graded else None
                entry = {
                    "attempt": a.attempt_number,
                    "status": "graded" if graded else a.status.lower().replace("_", " "),
                    "percentage": pct,
                    "passed": attempt_passed(a) if graded else None,
                    "date": (a.submitted_at or a.started_at).strftime("%Y-%m-%d") if (a.submitted_at or a.started_at) else None,
                    "change_vs_previous": round(pct - prev, 2) if (graded and prev is not None) else None,
                }
                history.append(entry)
                if graded:
                    scores.append(pct)
                    prev = pct
                    timeline.append({"date": entry["date"], "round": f"R{r.round_number}: {r.title}", "attempt": a.attempt_number, "percentage": pct})
            trend = _trend(scores)
            improved += trend == "improving"
            declined += trend == "declining"
            rounds_out.append({
                "domain": domains.get(r.domain_id, ""),
                "round": f"R{r.round_number}: {r.title}",
                "attempts": len(lst),
                "first_score": scores[0] if scores else None,
                "latest_score": scores[-1] if scores else None,
                "best_score": max(scores) if scores else None,
                "change_first_to_latest": round(scores[-1] - scores[0], 2) if len(scores) > 1 else None,
                "trend": trend,
                "history": history,
            })

        return {
            "data_source": "attempt history (every attempt, oldest first). The current grade of a round is its latest_score.",
            "student": {"register_number": s.register_number, "name": s.user.full_name if s.user else ""},
            "summary": {"rounds_attempted": len(rounds_out), "rounds_improving": improved, "rounds_declining": declined},
            "rounds": rounds_out or "No attempts yet.",
            "timeline": timeline,
        }
    finally:
        db.close()
