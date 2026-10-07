"""Approved round durations and immutable, UTC attempt deadlines."""
import datetime
import math

from fastapi import HTTPException


def as_utc_naive(value):
    if value.tzinfo is not None:
        return value.astimezone(datetime.timezone.utc).replace(tzinfo=None)
    return value


def utc_iso(value):
    return as_utc_naive(value).isoformat() + "Z"


def approved_duration(round_obj, request=None):
    durations = getattr(request, "approved_round_durations_json", None) or {}
    if durations and str(round_obj.id) not in durations:
        raise HTTPException(409, "This round was not included in the approved timings.")
    duration = durations.get(str(round_obj.id), round_obj.duration_minutes)
    if not isinstance(duration, int) or isinstance(duration, bool) or duration <= 0:
        raise HTTPException(409, "The approved round duration must be a positive number of minutes.")
    return duration


def freeze_approval_durations(request):
    selected = request.selected_rounds_json
    rounds = [r for r in request.domain.rounds if not selected or r.id in selected]
    if not rounds or (selected and set(selected) != {r.id for r in rounds}):
        raise HTTPException(400, "Selected rounds must belong to the assessment domain.")
    request.approved_round_durations_json = {str(r.id): approved_duration(r) for r in rounds}
    request.selected_rounds_json = [r.id for r in rounds]


def approval_durations(request):
    if request.approved_round_durations_json:
        return request.approved_round_durations_json
    return {str(r.id): approved_duration(r) for r in request.domain.rounds
            if not request.selected_rounds_json or r.id in request.selected_rounds_json}


def approval_round_timings(request):
    durations = approval_durations(request)
    return [{"round_id": r.id, "round_number": r.round_number, "title": r.title,
             "duration_minutes": durations[str(r.id)]}
            for r in sorted(request.domain.rounds, key=lambda r: r.round_number) if str(r.id) in durations]


def freeze_attempt_deadline(attempt):
    if attempt.duration_minutes is None:
        alloc_req = getattr(attempt.allocation, "request", None) if attempt.allocation else None
        attempt.duration_minutes = approved_duration(attempt.round, alloc_req)
    if attempt.expires_at is None:
        attempt.expires_at = as_utc_naive(attempt.started_at) + datetime.timedelta(minutes=attempt.duration_minutes)
    return as_utc_naive(attempt.expires_at)


def attempt_timing(attempt, now=None):
    now = as_utc_naive(now or datetime.datetime.utcnow())
    deadline = freeze_attempt_deadline(attempt)
    return {
        "duration_minutes": attempt.duration_minutes,
        "started_at": utc_iso(attempt.started_at),
        "expires_at": utc_iso(deadline),
        "server_time": utc_iso(now),
        "time_remaining_seconds": max(0, math.ceil((deadline - now).total_seconds())) if attempt.status == "IN_PROGRESS" else 0,
    }


def require_open_attempt(attempt, now=None):
    now = as_utc_naive(now or datetime.datetime.utcnow())
    if attempt.status != "IN_PROGRESS":
        raise HTTPException(409, "This attempt is closed for answers.")
    if now >= freeze_attempt_deadline(attempt):
        raise HTTPException(410, "The approved round time has ended. Only answers saved before the deadline will be evaluated.")
