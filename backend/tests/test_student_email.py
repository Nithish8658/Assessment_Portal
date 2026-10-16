"""Student email: notifications and welcome emails go out from the class tutor's Gmail."""
import pytest
from fastapi import HTTPException

import app.models.models as M
from app.auth.jwt import get_password_hash
from app.config import STUDENT_DEFAULT_PASSWORD
from app.routers import auth as auth_router
from app.services import student_email as mail


@pytest.fixture
def gmail(world, monkeypatch):
    """Connects the tutor's Gmail and records what would be sent."""
    sent = []
    world.db.add(M.EmailSender(user_id=world.tutor.id, gmail_address="tutor1@college.edu",
                               refresh_token_encrypted=mail.encrypt_secret("RT"), portal_url="https://portal.test"))
    world.db.commit()
    monkeypatch.setattr(mail, "gmail_send", lambda sender, msg: sent.append(msg))
    return sent


def test_notification_is_queued_for_the_class_tutor(world):
    mail.notify_student(world.db, world.student.id, "Evaluation Result: Round 3", "Score 80%")
    world.db.commit()
    delivery = world.db.query(M.EmailDelivery).one()
    assert delivery.sender_user_id == world.tutor.id and delivery.to_address == "asha@gmail.com"
    assert world.db.query(M.Notification).filter_by(user_id=world.student.id).count() == 1


def test_queued_email_is_sent_from_the_tutor_gmail(world, gmail):
    mail.notify_student(world.db, world.student.id, "Evaluation Result: Round 3", "Score 80%")
    world.db.commit()
    assert mail.send_pending(world.db, world.tutor.id)["sent"] == 1
    assert gmail[0]["To"] == "asha@gmail.com" and "tutor1@college.edu" in gmail[0]["From"]
    assert "https://portal.test" in gmail[0].get_content()


def test_welcome_email_never_contains_a_password(world, gmail):
    mail.queue_credentials(world.db, [world.student], world.tutor.id)
    world.db.commit()
    mail.send_pending(world.db, world.tutor.id)
    body = gmail[0].get_content()
    assert STUDENT_DEFAULT_PASSWORD not in body and "MockRun@" not in body
    assert "successfully updated" in body and "R001" in body


def test_rolled_back_work_queues_nothing_to_send(world):
    token = mail.track_request()
    mail.notify_student(world.db, world.student.id, "Never", "never")
    world.db.rollback()
    assert mail.senders_to_flush(token) == set()


def test_committed_work_is_flushed_after_the_request(world):
    token = mail.track_request()
    mail.notify_student(world.db, world.student.id, "Result", "Score 80%")
    world.db.commit()
    assert mail.senders_to_flush(token) == {world.tutor.id}


def test_class_without_connected_gmail_borrows_a_department_tutor(world, gmail):
    other = world.user("tutor2", "Class Tutor")
    other_faculty = M.FacultyProfile(user_id=other.id, employee_id="E2", department_id=world.dept.id)
    world.db.add(other_faculty)
    world.db.flush()
    # the student's class moves to a tutor who never connected Gmail
    world.klass.tutor_id = other_faculty.id
    world.db.info.clear()
    world.db.commit()
    mail.notify_student(world.db, world.student.id, "Result", "Score 80%")
    world.db.commit()
    assert world.db.query(M.EmailDelivery).one().sender_user_id == other.id
    assert mail.adopt_unsent(world.db) == 1
    assert world.db.query(M.EmailDelivery).one().sender_user_id == world.tutor.id


# --- password change -----------------------------------------------------------

def change(world, current, new, confirm=None):
    return auth_router.change_my_password(auth_router.PasswordChangeRequest(
        current_password=current, new_password=new, confirm_password=confirm or new),
        current_user=world.student, db=world.db)


@pytest.fixture
def default_password(world):
    world.student.hashed_password = get_password_hash(STUDENT_DEFAULT_PASSWORD)
    world.db.commit()


@pytest.mark.parametrize("current,new,confirm", [
    ("wrong-password", "Asha2026x", None),             # current password wrong
    (STUDENT_DEFAULT_PASSWORD, "Asha2026x", "Other2026x"),  # confirmation differs
    (STUDENT_DEFAULT_PASSWORD, "short1", None),         # too short
    (STUDENT_DEFAULT_PASSWORD, "onlyletters", None),    # no digit
    (STUDENT_DEFAULT_PASSWORD, STUDENT_DEFAULT_PASSWORD, None),  # still the shared password
])
def test_weak_or_wrong_password_changes_are_refused(world, default_password, gmail, current, new, confirm):
    with pytest.raises(HTTPException):
        change(world, current, new, confirm)
    assert gmail == []


def test_password_change_is_confirmed_by_email_without_the_password(world, default_password, gmail):
    change(world, STUDENT_DEFAULT_PASSWORD, "Asha2026x")
    assert world.db.query(M.AuditLog).filter_by(user_id=world.student.id, action="PASSWORD_CHANGED").count() == 1
    assert len(gmail) == 1 and "changed" in gmail[0]["Subject"]
    assert "Asha2026x" not in gmail[0].get_content()
