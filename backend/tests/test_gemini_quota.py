"""The quota guard keeps every model under its requests/minute, tokens/minute and requests/day."""
import datetime

import pytest

from app.services.assessment import gemini_quota as Q

LITE = "gemini-3.1-flash-lite"
FLASH = "gemini-2.5-flash"


@pytest.fixture
def clock(Session, monkeypatch):
    now = [datetime.datetime(2026, 10, 16, 6, 0, 0)]
    monkeypatch.setattr(Q, "_utcnow", lambda: now[0])
    return now


def advance(clock, seconds):
    clock[0] += datetime.timedelta(seconds=seconds)


def test_requests_are_spaced_by_the_per_minute_limit(clock):
    assert Q.reserve(LITE, 3000) == ("ok", 0.0)
    verdict, wait = Q.reserve(LITE, 3000)
    assert verdict == "wait" and wait == pytest.approx(4.0)  # 15 RPM
    advance(clock, 4)
    assert Q.reserve(LITE, 3000)[0] == "ok"
    assert Q.reserve(FLASH, 3000)[0] == "ok"
    advance(clock, 6)
    assert Q.reserve(FLASH, 3000)[0] == "wait"  # 5 RPM: one every 12 s


def test_daily_limit_keeps_a_reserve(clock, db):
    import app.models.assessment_models as A
    assert Q.reserve(LITE, 100)[0] == "ok"
    day = db.query(A.GeminiUsage).filter_by(model=LITE, window="day").one()
    day.requests = 489
    db.commit()
    advance(clock, 5)
    assert Q.reserve(LITE, 100)[0] == "ok"   # the 490th
    advance(clock, 5)
    assert Q.reserve(LITE, 100) == ("day", 0.0)


def test_tokens_per_minute_are_capped(clock):
    assert Q.reserve(LITE, 150_000)[0] == "ok"
    advance(clock, 5)
    assert Q.reserve(LITE, 60_000)[0] == "wait"  # 210K would pass 80% of 250K


def test_rate_limit_answers_from_google_close_the_model(clock):
    assert Q.reserve(FLASH, 100)[0] == "ok"
    Q.record(FLASH, 100, rate_limited="minute")
    advance(clock, 15)
    verdict, wait = Q.reserve(FLASH, 100)
    assert verdict == "wait" and wait > 30
    Q.record(FLASH, 100, rate_limited="day")
    assert Q.reserve(FLASH, 100)[0] == "day"


def test_day_follows_pacific_midnight():
    assert Q.day_start(datetime.datetime(2026, 10, 16, 6, 59)) == datetime.datetime(2026, 10, 15, 7, 0)
    assert Q.day_start(datetime.datetime(2026, 10, 16, 7, 0)) == datetime.datetime(2026, 10, 16, 7, 0)
    assert Q.day_start(datetime.datetime(2026, 12, 16, 7, 59)) == datetime.datetime(2026, 12, 15, 8, 0)  # PST
    assert Q.next_reset(datetime.datetime(2026, 10, 16, 6, 0)) == datetime.datetime(2026, 10, 16, 7, 0)


def test_limits_can_be_overridden():
    limits = Q._parse_limits("gemini-3.1-flash-lite:30/1000000/1500, bad-entry")
    assert limits[LITE] == (30, 1_000_000, 1500) and limits[FLASH] == (5, 250_000, 20)
