"""Proctoring events reported by the exam browser, including pastes the code editor refused."""
import datetime

import pytest
from fastapi import HTTPException

import app.models.assessment_models as A
from app.routers.assessment import attempts


def report(world, attempt, event_type):
    return attempts.record_proctoring_event(attempt.id, attempts.ProctoringEventRequest(event_type=event_type),
                                            current_user=world.student, db=world.db)


def test_blocked_paste_is_recorded(world):
    q = world.question(world.coding, "Q")
    attempt = world.attempt(world.coding, [(q, "")], status="IN_PROGRESS", evaluation_status="NOT_EVALUATED",
                            expires_at=datetime.datetime.utcnow() + datetime.timedelta(minutes=20))
    assert report(world, attempt, "PASTE_BLOCKED") == {"recorded": True}
    assert report(world, attempt, "PASTE_BLOCKED")["reason"] == "duplicate"  # within 5 s
    assert world.db.query(A.ProctoringEvent).filter_by(attempt_id=attempt.id, event_type="PASTE_BLOCKED").count() == 1


def test_unknown_event_types_are_refused(world):
    q = world.question(world.coding, "Q")
    attempt = world.attempt(world.coding, [(q, "")], status="IN_PROGRESS", evaluation_status="NOT_EVALUATED")
    with pytest.raises(HTTPException):
        report(world, attempt, "SOMETHING_ELSE")
