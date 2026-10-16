"""Keeps every Gemini call under the model's free-tier limits: requests per minute (RPM),
tokens per minute (TPM) and requests per day (RPD).

Usage is counted in the gemini_usage table, so all server instances share one budget. Before a
request, reserve() checks the model's budget and books the request; if the model has no room,
the caller tries the next model or waits, and no request is sent. RPM is kept by spacing requests
at least 60 / RPM seconds apart, which holds in any 60-second window, however Google counts it.

Limits come from GEMINI_LIMITS ("model:rpm/tpm/rpd,..."), defaulting to the free tier below.
"""
import datetime
import logging
import os
from typing import Dict, Optional, Tuple

from sqlalchemy.exc import IntegrityError

from app import database
from app.models.assessment_models import GeminiUsage

logger = logging.getLogger(__name__)

# Free tier, from the project's AI Studio rate-limit page: (RPM, TPM, RPD)
DEFAULT_LIMITS: Dict[str, Tuple[int, int, int]] = {
    "gemini-3.1-flash-lite": (15, 250_000, 500),
    "gemini-3.5-flash-lite": (15, 250_000, 500),
    "gemini-2.5-flash": (5, 250_000, 20),
}
UNLISTED_MODEL_LIMITS = (5, 250_000, 20)
# Headroom for clock differences and calls made outside the app (e.g. AI Studio)
TPM_SHARE = 0.8
RPD_RESERVE = 0.02

try:
    from zoneinfo import ZoneInfo
    PACIFIC = ZoneInfo("America/Los_Angeles")
except Exception:  # no tz database: fixed UTC-8 is at most an hour off
    PACIFIC = datetime.timezone(datetime.timedelta(hours=-8))


def _parse_limits(raw: str) -> Dict[str, Tuple[int, int, int]]:
    limits = dict(DEFAULT_LIMITS)
    for part in (raw or "").split(","):
        try:
            model, nums = part.strip().split(":")
            rpm, tpm, rpd = (int(x) for x in nums.split("/"))
            limits[model.strip()] = (rpm, tpm, rpd)
        except ValueError:
            continue
    return limits


LIMITS = _parse_limits(os.getenv("GEMINI_LIMITS", ""))


def limits_for(model: str) -> Tuple[int, int, int]:
    return LIMITS.get(model, UNLISTED_MODEL_LIMITS)


def _utcnow() -> datetime.datetime:
    return datetime.datetime.utcnow()


def day_start(now: datetime.datetime) -> datetime.datetime:
    """Start (as naive UTC) of the Pacific-time day containing `now`; Google's RPD resets then."""
    local = now.replace(tzinfo=datetime.timezone.utc).astimezone(PACIFIC)
    midnight = local.replace(hour=0, minute=0, second=0, microsecond=0)
    return midnight.astimezone(datetime.timezone.utc).replace(tzinfo=None)


def next_reset(now: Optional[datetime.datetime] = None) -> datetime.datetime:
    """When the daily quota resets next (naive UTC)."""
    return day_start(day_start(now or _utcnow()) + datetime.timedelta(hours=25))


def _row(db, model: str, window: str, start: datetime.datetime) -> GeminiUsage:
    q = db.query(GeminiUsage).filter(GeminiUsage.model == model, GeminiUsage.window == window,
                                     GeminiUsage.window_start == start)
    row = q.with_for_update().first()
    if row:
        return row
    try:
        with db.begin_nested():
            db.add(GeminiUsage(model=model, window=window, window_start=start, requests=0, tokens=0))
    except IntegrityError:
        pass  # another instance created it first
    return q.with_for_update().first()


_warned = False


def reserve(model: str, est_tokens: int) -> Tuple[str, float]:
    """Books one request. Returns ("ok", 0), ("wait", seconds until the model has room) or
    ("day", 0) when the model's daily requests are used up."""
    global _warned
    rpm, tpm, rpd = limits_for(model)
    now = _utcnow()
    db = database.SessionLocal()
    try:
        day = _row(db, model, "day", day_start(now))
        if day.requests >= int(rpd * (1 - RPD_RESERVE)):
            db.rollback()
            return "day", 0.0
        gap = 60.0 / rpm
        if day.last_request_at:
            since = (now - day.last_request_at).total_seconds()
            if since < gap:
                db.rollback()
                return "wait", gap - since
        minute = _row(db, model, "minute", now.replace(second=0, microsecond=0))
        if minute.tokens + est_tokens > tpm * TPM_SHARE:
            db.rollback()
            return "wait", 60.0 - now.second
        day.requests += 1
        day.tokens += est_tokens
        day.last_request_at = now
        minute.requests += 1
        minute.tokens += est_tokens
        db.commit()
        return "ok", 0.0
    except Exception as exc:
        db.rollback()
        # Without the table (migration not run yet) grading still works, just unguarded
        if not _warned:
            logger.error("Gemini quota guard unavailable, sending without it: %s", exc)
            _warned = True
        return "ok", 0.0
    finally:
        db.close()


def record(model: str, est_tokens: int, actual_tokens: Optional[int] = None, rate_limited: Optional[str] = None) -> None:
    """After a request: corrects the token estimate, or, when Google still answered 429 (for
    example quota used outside the app), marks the model full for the minute or the day."""
    now = _utcnow()
    db = database.SessionLocal()
    try:
        if rate_limited == "day":
            day = _row(db, model, "day", day_start(now))
            day.requests = max(day.requests, limits_for(model)[2])
        elif rate_limited == "minute":
            day = _row(db, model, "day", day_start(now))
            # next request no sooner than a minute from now
            day.last_request_at = now + datetime.timedelta(seconds=60 - 60.0 / limits_for(model)[0])
        elif actual_tokens is not None:
            minute = _row(db, model, "minute", now.replace(second=0, microsecond=0))
            minute.tokens = max(0, minute.tokens + actual_tokens - est_tokens)
            day = _row(db, model, "day", day_start(now))
            day.tokens = max(0, day.tokens + actual_tokens - est_tokens)
        db.commit()
    except Exception:
        db.rollback()
    finally:
        db.close()


def usage_today(db) -> list:
    """Requests used today per model against its daily limit, for the Exam Operations page."""
    now = _utcnow()
    start = day_start(now)
    used = {r.model: r for r in db.query(GeminiUsage).filter(GeminiUsage.window == "day", GeminiUsage.window_start == start)}
    out = []
    for model, (rpm, tpm, rpd) in LIMITS.items():
        row = used.get(model)
        out.append({"model": model, "requests_today": row.requests if row else 0, "rpd": rpd, "rpm": rpm, "tpm": tpm,
                    "tokens_today": row.tokens if row else 0})
    return out


def prune(db, keep_days: int = 3) -> None:
    """Drops minute rows older than an hour and day rows older than `keep_days`."""
    now = _utcnow()
    db.query(GeminiUsage).filter(GeminiUsage.window == "minute",
                                 GeminiUsage.window_start < now - datetime.timedelta(hours=1)).delete(synchronize_session=False)
    db.query(GeminiUsage).filter(GeminiUsage.window == "day",
                                 GeminiUsage.window_start < now - datetime.timedelta(days=keep_days)).delete(synchronize_session=False)
    db.commit()
