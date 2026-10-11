"""
One rule for every report, dashboard and radar chart:

    For each (student, round), the result that counts is the LATEST PUBLISHED attempt,
    i.e. the most recent attempt whose status is EVALUATED. Earlier attempts are history;
    they are never averaged, summed, or "best-of" merged with the latest one. Attempts
    that are still in progress or awaiting AI grading do not replace a published result.

Rounds are always keyed by round id (never by round number), so rounds from different
domains are never mixed together.
"""

from collections import defaultdict
from typing import Dict, Iterable, List, Optional, Tuple

from sqlalchemy.orm import Session

from app.models.assessment_models import AssessmentAttempt, CompetencyScore
from app.services.assessment.scoring_service import scoring_service


def _student_id(attempt: AssessmentAttempt) -> Optional[int]:
    return attempt.allocation.student_id if attempt.allocation else None


def _recency_key(attempt: AssessmentAttempt):
    """Newest first: higher attempt number, then later submission, then later id."""
    submitted = attempt.submitted_at or attempt.started_at
    return (attempt.attempt_number or 0, submitted.timestamp() if submitted else 0.0, attempt.id or 0)


def is_published(attempt: AssessmentAttempt) -> bool:
    return attempt.status == "EVALUATED"


def latest_published_by_student_round(
    attempts: Iterable[AssessmentAttempt],
    student_id_of=_student_id,
) -> Dict[Tuple[int, int], AssessmentAttempt]:
    """{(student_id, round_id): latest EVALUATED attempt}."""
    latest: Dict[Tuple[int, int], AssessmentAttempt] = {}
    for a in attempts:
        if not is_published(a):
            continue
        sid = student_id_of(a)
        if sid is None:
            continue
        key = (sid, a.round_id)
        if key not in latest or _recency_key(a) > _recency_key(latest[key]):
            latest[key] = a
    return latest


def latest_any_by_student_round(
    attempts: Iterable[AssessmentAttempt],
    student_id_of=_student_id,
) -> Dict[Tuple[int, int], AssessmentAttempt]:
    """{(student_id, round_id): most recent attempt of any status} (for live status labels)."""
    latest: Dict[Tuple[int, int], AssessmentAttempt] = {}
    for a in attempts:
        sid = student_id_of(a)
        if sid is None:
            continue
        key = (sid, a.round_id)
        if key not in latest or _recency_key(a) > _recency_key(latest[key]):
            latest[key] = a
    return latest


def attempt_percentage(a: AssessmentAttempt) -> float:
    return float(a.result.percentage if a.result else (a.percentage or 0.0))


def attempt_passed(a: AssessmentAttempt) -> bool:
    return bool(a.result.passed if a.result else a.passed)


def attempt_score(a: AssessmentAttempt) -> float:
    return float(a.result.total_score if a.result else (a.score or 0.0))


def attempt_max_score(a: AssessmentAttempt) -> Optional[float]:
    return float(a.result.max_score) if a.result else None


def competency_radar(db: Session, attempt_ids: List[int]) -> List[dict]:
    """
    Builds radar items from the given attempts only (callers pass latest-published ids,
    one per round). Scores for the same competency across different rounds are pooled
    by marks, so each round contributes exactly once.
    """
    if not attempt_ids:
        return []
    rows = db.query(CompetencyScore).filter(CompetencyScore.attempt_id.in_(attempt_ids)).all()
    pooled: Dict[str, dict] = {}
    for cs in rows:
        comp = cs.competency
        code = comp.code if comp else "COMP"
        item = pooled.setdefault(code, {
            "competency_code": code,
            "competency_name": comp.name if comp else "Competency",
            "category": comp.category if comp else "General",
            "score": 0.0,
            "max_score": 0.0,
        })
        item["score"] += cs.score or 0.0
        item["max_score"] += cs.max_score or 0.0
    radar = []
    for item in pooled.values():
        pct = round(item["score"] / item["max_score"] * 100.0, 1) if item["max_score"] > 0 else 0.0
        radar.append({
            **item,
            "score": round(item["score"], 2),
            "max_score": round(item["max_score"], 2),
            "percentage": pct,
            "readiness_level": scoring_service.calculate_readiness_level(pct),
        })
    radar.sort(key=lambda r: r["competency_code"])
    return radar


def attempts_per_student_round(attempts: Iterable[AssessmentAttempt], student_id_of=_student_id) -> Dict[Tuple[int, int], int]:
    counts: Dict[Tuple[int, int], int] = defaultdict(int)
    for a in attempts:
        sid = student_id_of(a)
        if sid is not None:
            counts[(sid, a.round_id)] += 1
    return counts
