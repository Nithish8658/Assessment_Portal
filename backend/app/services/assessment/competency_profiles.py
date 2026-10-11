"""
Precomputed student competency profiles (radar chart data and round results).

Write path: refresh_for_attempt() / refresh_profile() run when an attempt starts, is
submitted, is graded, or is removed. They rebuild the student's profile for that domain
using the latest-published rule (services/assessment/latest_results.py) and store it.

Read path: views call load_profiles(), which returns the stored rows. A single grouped
query compares each row with the attempts it was built from (count and latest change);
only a row that missed a refresh is rebuilt, so normal views never recompute charts.
"""

import datetime
import logging
from typing import Dict, Iterable, List, Optional, Tuple

from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.models.assessment_models import (
    AssessmentActivationRequest,
    AssessmentAttempt,
    AssessmentDomain,
    AssessmentStudentAllocation,
    StudentCompetencyProfile,
)
from app.services.assessment.latest_results import (
    attempt_max_score,
    attempt_passed,
    attempt_percentage,
    attempt_score,
    attempts_per_student_round,
    competency_radar,
    latest_any_by_student_round,
    latest_published_by_student_round,
)
from app.services.assessment.scoring_service import scoring_service

logger = logging.getLogger(__name__)


def _domain_attempts_query(db: Session, domain_id: int):
    return db.query(AssessmentAttempt).join(
        AssessmentStudentAllocation, AssessmentAttempt.allocation_id == AssessmentStudentAllocation.id
    ).join(
        AssessmentActivationRequest, AssessmentStudentAllocation.request_id == AssessmentActivationRequest.id
    ).filter(AssessmentActivationRequest.domain_id == domain_id)


def _build(db: Session, student_id: int, domain: AssessmentDomain) -> dict:
    attempts = _domain_attempts_query(db, domain.id).options(
        joinedload(AssessmentAttempt.round),
        joinedload(AssessmentAttempt.result),
    ).filter(AssessmentStudentAllocation.student_id == student_id).all()

    owner = lambda a: student_id
    latest_pub = {rid: a for (_, rid), a in latest_published_by_student_round(attempts, owner).items()}
    latest_any = {rid: a for (_, rid), a in latest_any_by_student_round(attempts, owner).items()}
    counts = {rid: n for (_, rid), n in attempts_per_student_round(attempts, owner).items()}

    rounds = []
    for r in sorted(domain.rounds, key=lambda x: x.round_number):
        pub = latest_pub.get(r.id)
        live = latest_any.get(r.id)
        rounds.append({
            "round_id": r.id,
            "round_number": r.round_number,
            "round_title": r.title,
            "domain_title": domain.title,
            "published": pub is not None,
            "status": live.status if live else "NOT_STARTED",
            "score": round(attempt_score(pub), 2) if pub else None,
            "max_score": attempt_max_score(pub) if pub else None,
            "percentage": round(attempt_percentage(pub), 2) if pub else None,
            "passed": attempt_passed(pub) if pub else None,
            "attempt_number": pub.attempt_number if pub else None,
            "total_attempts": counts.get(r.id, 0),
            "newer_attempt_status": live.status if (live and pub and live.id != pub.id) else None,
            "evaluated_at": (pub.result.evaluated_at.isoformat() + "Z") if (pub and pub.result and pub.result.evaluated_at) else None,
            "started_at": live.started_at.isoformat() if (live and live.started_at) else "",
            "submitted_at": live.submitted_at.isoformat() if (live and live.submitted_at) else "",
        })

    radar = competency_radar(db, [a.id for a in latest_pub.values()])
    strengths, gaps = scoring_service.derive_strengths_and_gaps(radar)
    pcts = [attempt_percentage(a) for a in latest_pub.values()]
    overall = round(sum(pcts) / len(pcts), 1) if pcts else None
    last_activity = max((a.last_activity_at for a in attempts if a.last_activity_at), default=None)
    return {
        "rounds_json": rounds,
        "competencies_json": radar,
        "strengths_json": strengths,
        "gaps_json": gaps,
        "overall_percentage": overall,
        "readiness_index": scoring_service.calculate_readiness_level(overall) if overall is not None else "Pending",
        "rounds_completed": len(latest_pub),
        "rounds_total": len(domain.rounds),
        "has_activity": bool(attempts),
        "source_attempt_count": len(attempts),
        "source_last_activity_at": last_activity,
    }


def refresh_profile(db: Session, student_id: int, domain_id: int) -> Optional[StudentCompetencyProfile]:
    """Rebuilds and stores one profile. Commits its own work; never raises."""
    try:
        domain = db.query(AssessmentDomain).filter(AssessmentDomain.id == domain_id).first()
        if not domain:
            return None
        values = _build(db, student_id, domain)
        values["updated_at"] = datetime.datetime.utcnow()
        for _ in range(2):  # retry once if a concurrent refresh inserted the row first
            row = db.query(StudentCompetencyProfile).filter(
                StudentCompetencyProfile.student_id == student_id,
                StudentCompetencyProfile.domain_id == domain_id,
            ).first()
            try:
                if row is None:
                    row = StudentCompetencyProfile(student_id=student_id, domain_id=domain_id, **values)
                    db.add(row)
                else:
                    for k, v in values.items():
                        setattr(row, k, v)
                db.commit()
                return row
            except IntegrityError:
                db.rollback()
        return None
    except Exception:
        db.rollback()
        logger.exception("Competency profile refresh failed (student=%s, domain=%s)", student_id, domain_id)
        return None


def refresh_for_attempt(db: Session, attempt_or_id) -> None:
    """Refreshes the profile of the attempt's student in the attempt's domain."""
    try:
        attempt = attempt_or_id if isinstance(attempt_or_id, AssessmentAttempt) else \
            db.query(AssessmentAttempt).filter(AssessmentAttempt.id == attempt_or_id).first()
        if not attempt or not attempt.allocation or not attempt.allocation.request:
            return
        refresh_profile(db, attempt.allocation.student_id, attempt.allocation.request.domain_id)
    except Exception:
        db.rollback()
        logger.exception("Competency profile refresh failed for attempt %s", getattr(attempt_or_id, "id", attempt_or_id))


def load_profiles(db: Session, student_ids: Iterable[int], domain_id: Optional[int] = None) -> Dict[Tuple[int, int], StudentCompetencyProfile]:
    """
    Returns stored profiles keyed by (student_id, domain_id). Rows that are missing or
    that missed a refresh (attempt count / latest change differs) are rebuilt first.
    """
    student_ids = list({s for s in student_ids if s is not None})
    if not student_ids:
        return {}

    stats_q = db.query(
        AssessmentStudentAllocation.student_id,
        AssessmentActivationRequest.domain_id,
        func.count(AssessmentAttempt.id),
        func.max(AssessmentAttempt.last_activity_at),
    ).join(
        AssessmentStudentAllocation, AssessmentAttempt.allocation_id == AssessmentStudentAllocation.id
    ).join(
        AssessmentActivationRequest, AssessmentStudentAllocation.request_id == AssessmentActivationRequest.id
    ).filter(AssessmentStudentAllocation.student_id.in_(student_ids))
    if domain_id is not None:
        stats_q = stats_q.filter(AssessmentActivationRequest.domain_id == domain_id)
    live = {(sid, did): (cnt, last) for sid, did, cnt, last in stats_q.group_by(
        AssessmentStudentAllocation.student_id, AssessmentActivationRequest.domain_id).all()}

    rows_q = db.query(StudentCompetencyProfile).filter(StudentCompetencyProfile.student_id.in_(student_ids))
    if domain_id is not None:
        rows_q = rows_q.filter(StudentCompetencyProfile.domain_id == domain_id)
    stored = {(p.student_id, p.domain_id): p for p in rows_q.all()}

    stale = []
    for key, (cnt, last) in live.items():
        p = stored.get(key)
        if p is None or p.source_attempt_count != cnt or (last and (p.source_last_activity_at is None or last > p.source_last_activity_at)):
            stale.append(key)
    for key, p in stored.items():
        if key not in live and p.source_attempt_count:
            stale.append(key)  # all attempts were removed
    for sid, did in stale:
        logger.info("Rebuilding stale competency profile (student=%s, domain=%s)", sid, did)
        row = refresh_profile(db, sid, did)
        if row is not None:
            stored[(sid, did)] = row
    return stored


def merge_profiles(profiles: List[StudentCompetencyProfile]) -> dict:
    """Combines one student's profiles across domains (used when no domain is selected)."""
    rounds, pooled = [], {}
    for p in sorted(profiles, key=lambda x: x.domain_id):
        rounds.extend(p.rounds_json or [])
        for c in p.competencies_json or []:
            item = pooled.setdefault(c["competency_code"], {**c, "score": 0.0, "max_score": 0.0})
            item["score"] += c.get("score", 0.0)
            item["max_score"] += c.get("max_score", 0.0)
    radar = []
    for item in pooled.values():
        pct = round(item["score"] / item["max_score"] * 100.0, 1) if item["max_score"] > 0 else 0.0
        radar.append({**item, "percentage": pct, "readiness_level": scoring_service.calculate_readiness_level(pct)})
    radar.sort(key=lambda r: r["competency_code"])
    published = [r for r in rounds if r.get("published")]
    pcts = [r["percentage"] for r in published if r.get("percentage") is not None]
    overall = round(sum(pcts) / len(pcts), 1) if pcts else None
    strengths, gaps = scoring_service.derive_strengths_and_gaps(radar)
    updated = max((p.updated_at for p in profiles if p.updated_at), default=None)
    return {
        "rounds": rounds,
        "competencies": radar,
        "strengths": strengths,
        "gaps": gaps,
        "overall_percentage": overall,
        "readiness_index": scoring_service.calculate_readiness_level(overall) if overall is not None else "Pending",
        "rounds_completed": len(published),
        "rounds_total": len(rounds),
        "has_activity": any(p.has_activity for p in profiles),
        "updated_at": (updated.isoformat() + "Z") if updated else None,
    }


def profile_view(p: StudentCompetencyProfile) -> dict:
    return {
        "rounds": p.rounds_json or [],
        "competencies": p.competencies_json or [],
        "strengths": p.strengths_json or [],
        "gaps": p.gaps_json or [],
        "overall_percentage": p.overall_percentage,
        "readiness_index": p.readiness_index,
        "rounds_completed": p.rounds_completed,
        "rounds_total": p.rounds_total,
        "has_activity": p.has_activity,
        "updated_at": (p.updated_at.isoformat() + "Z") if p.updated_at else None,
    }


def empty_view(domain: Optional[AssessmentDomain]) -> dict:
    rounds = []
    if domain:
        for r in sorted(domain.rounds, key=lambda x: x.round_number):
            rounds.append({
                "round_id": r.id, "round_number": r.round_number, "round_title": r.title, "domain_title": domain.title,
                "published": False, "status": "NOT_STARTED", "score": None, "max_score": None, "percentage": None,
                "passed": None, "attempt_number": None, "total_attempts": 0, "newer_attempt_status": None,
                "evaluated_at": None, "started_at": "", "submitted_at": "",
            })
    strengths, gaps = scoring_service.derive_strengths_and_gaps([])
    return {"rounds": rounds, "competencies": [], "strengths": strengths, "gaps": gaps, "overall_percentage": None,
            "readiness_index": "Pending", "rounds_completed": 0, "rounds_total": len(rounds), "has_activity": False,
            "updated_at": None}
