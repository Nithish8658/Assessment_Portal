"""Coding/debugging grading: scoring rules, one Gemini request per attempt, retries and requeueing."""
import asyncio
import datetime
import json

import pytest

import app.models.assessment_models as A
import app.models.models as M
from app.services.assessment import gemini_batch_code_evaluator as G
from app.services.assessment import gemini_evaluator as GE

ev = G.gemini_batch_code_evaluator
TESTS = [{"input": "1", "expected_output": "1"}, {"input": "2", "expected_output": "2"},
         {"input": "3", "expected_output": "3"}, {"input": "4", "expected_output": "4"}]


class FakeGemini:
    """Stands in for the Gemini cascade. `answer(k, prompt)` returns the result for question k."""

    def __init__(self, monkeypatch, answer=None):
        self.calls = []
        self.answer = answer or (lambda k, section: {"score_awarded": 7, "status": "Accepted", "compiles": True,
                                                      "test_cases_simulated": [{"passed": True}] * 4})
        monkeypatch.setattr(GE.gemini_evaluator, "_call_gemini_cascade", self)

    async def __call__(self, system_instruction, user_prompt, **kwargs):
        sections = user_prompt.split("=== Question ")[1:]
        self.calls.append(len(sections))
        results = []
        for k, section in enumerate(sections, 1):
            r = self.answer(k, section)
            if r is not None:
                results.append({"question": k, **r})
        return json.dumps({"results": results})


def run(coro):
    return asyncio.run(coro)


# --- scoring rules -------------------------------------------------------------

def test_test_case_questions_score_by_share_of_cases_passed():
    tcs = G._test_inputs(type("C", (), {"public_test_cases_json": TESTS, "hidden_test_cases_json": []})())
    parsed = {"score_awarded": 9, "compiles": True, "test_cases_simulated": [{"passed": True}, {"passed": False},
                                                                            {"passed": True}, {"passed": True}]}
    G._apply_score(parsed, tcs, 10.0, by_tests=True)
    assert parsed["score_awarded"] == 7.5 and parsed["status"] == "Partially Accepted"
    # the stored test data is the real one, not what the model echoed back
    assert parsed["test_cases_simulated"][1]["expected"] == "2"


def test_code_that_does_not_compile_scores_zero_on_test_cases():
    tcs = [{"input": "1", "expected": "1"}]
    parsed = {"score_awarded": 9, "compiles": False, "test_cases_simulated": [{"passed": True}]}
    G._apply_score(parsed, tcs, 10.0, by_tests=True)
    assert parsed["score_awarded"] == 0 and parsed["status"] == "Compilation Error"


def test_debugging_compile_error_is_capped():
    parsed = {"score_awarded": 9, "compiles": False}
    G._apply_score(parsed, [], 10.0, by_tests=False)
    assert parsed["score_awarded"] == 2.0 and parsed["status"] == "Compilation Error"


def test_empty_and_unchanged_answers_cost_no_request(monkeypatch):
    fake = FakeGemini(monkeypatch)
    starter = "int main() { return 0; }"
    jobs = [{"code_str": "  ", "max_marks": 10, "snapshot_content": {"question_type": "coding"}},
            {"code_str": starter + "\n// no change\n", "max_marks": 10,
             "snapshot_content": {"question_type": "debugging", "candidate_code_template": starter}}]
    out = run(ev.grade_batch(jobs, "DEBUGGING"))
    assert fake.calls == []
    assert [o["status"] for o in out] == ["No Code Submitted", "No Changes Made"]


# --- one request per attempt -----------------------------------------------------

def test_all_answers_of_an_attempt_go_in_one_request(world, monkeypatch):
    fake = FakeGemini(monkeypatch)
    qs = [world.question(world.coding, f"Q{i}", tests=TESTS) for i in range(3)]
    attempt = world.attempt(world.coding, [(q, f"int main() {{ return {i + 1}; }}") for i, q in enumerate(qs)])
    assert run(ev.evaluate_attempt_now(attempt.id, world.db))["status"] == "completed"
    world.db.expire_all()
    a = world.db.get(A.AssessmentAttempt, attempt.id)
    assert fake.calls == [3]
    assert a.status == "EVALUATED" and a.score == 30.0 and a.passed
    assert world.db.query(A.CodingSubmission).filter_by(attempt_id=a.id).count() == 3
    note = world.db.query(M.Notification).filter_by(user_id=world.student.id).one()
    assert "evaluated" in note.message


def test_only_unusable_answers_are_sent_again(world, monkeypatch):
    def answer(k, section):
        if len(fake.calls) == 1 and k == 2:
            return {"status": "Accepted"}  # no test results: unusable
        return {"score_awarded": 5, "compiles": True, "test_cases_simulated": [{"passed": True}] * 4}
    fake = FakeGemini(monkeypatch, answer)
    qs = [world.question(world.coding, f"Q{i}", tests=TESTS) for i in range(3)]
    attempt = world.attempt(world.coding, [(q, f"int main() {{ return {i + 1}; }}") for i, q in enumerate(qs)])
    run(ev.evaluate_attempt_now(attempt.id, world.db))
    assert fake.calls == [3, 1]


def test_graded_answers_are_kept_when_the_rest_fails(world, monkeypatch):
    qs = [world.question(world.coding, f"Q{i}", tests=TESTS) for i in range(2)]
    attempt = world.attempt(world.coding, [(qs[0], "int main() { return 1; }"), (qs[1], "int main() { return 2; }")])
    good = {"score_awarded": 5, "compiles": True, "test_cases_simulated": [{"passed": True}] * 4}
    monkeypatch.setattr(G, "QUESTION_DEADLINE_SECONDS", 0.5)  # no time to retry within the run
    fake = FakeGemini(monkeypatch, lambda k, s: good if k == 1 else {"status": "?"})
    assert run(ev.evaluate_attempt_now(attempt.id, world.db))["status"] == "retry_later"
    world.db.expire_all()
    a = world.db.get(A.AssessmentAttempt, attempt.id)
    assert a.evaluation_status == "FAILED" and list(a.evaluation_details_json["partial_grades"]) == [str(qs[0].id)]

    # after the retry pause only the missing answer is sent
    a.batch_evaluated_at = datetime.datetime.utcnow() - datetime.timedelta(minutes=1)
    world.db.commit()
    monkeypatch.setattr(G, "QUESTION_DEADLINE_SECONDS", 45)
    fake = FakeGemini(monkeypatch, lambda k, s: good)
    assert run(ev.evaluate_attempt_now(attempt.id, world.db))["status"] == "completed"
    assert fake.calls == [1]


def test_failed_attempt_is_not_retried_before_the_pause(world, monkeypatch):
    q = world.question(world.coding, "Q", tests=TESTS)
    attempt = world.attempt(world.coding, [(q, "int main(){}")], evaluation_status="FAILED",
                            batch_evaluated_at=datetime.datetime.utcnow())
    assert run(ev.evaluate_attempt_now(attempt.id, world.db))["status"] == "not_pending"


def test_stuck_evaluation_is_picked_up_after_three_minutes(world, monkeypatch):
    FakeGemini(monkeypatch)
    q = world.question(world.coding, "Q", tests=TESTS)
    now = datetime.datetime.utcnow()
    stale = world.attempt(world.coding, [(q, "int main(){ return 1; }")], evaluation_status="EVALUATING",
                          batch_evaluated_at=now - datetime.timedelta(minutes=4))
    fresh = world.attempt(world.coding, [(q, "int main(){ return 1; }")], evaluation_status="EVALUATING",
                          batch_evaluated_at=now - datetime.timedelta(minutes=1))
    assert run(ev.evaluate_attempt_now(stale.id, world.db))["status"] == "completed"
    assert run(ev.evaluate_attempt_now(fresh.id, world.db))["status"] == "busy"


def test_no_quota_sends_nothing_and_requeues(world, monkeypatch):
    async def no_room(*a, **k):
        raise GE.QuotaUnavailable(None)
    monkeypatch.setattr(GE.gemini_evaluator, "_call_gemini_cascade", no_room)
    q = world.question(world.coding, "Q", tests=TESTS)
    ids = [world.attempt(world.coding, [(q, f"int main(){{ return {i + 1}; }}")]).id for i in range(3)]
    res = run(ev.evaluate_pending_batch(world.db, time_budget_seconds=10))
    assert res["waiting_for_quota"] and res["processed_attempts"] == 0
    world.db.expire_all()
    assert {world.db.get(A.AssessmentAttempt, i).evaluation_status for i in ids} == {"PENDING_BATCH"}


def test_sweep_closes_expired_attempts_only(world, monkeypatch):
    FakeGemini(monkeypatch)
    from app.routers.assessment import coding
    q = world.question(world.coding, "Q", tests=TESTS)
    now = datetime.datetime.utcnow()
    expired = world.attempt(world.coding, [(q, "int main(){ return 1; }")], status="IN_PROGRESS",
                            evaluation_status="NOT_EVALUATED", expires_at=now - datetime.timedelta(minutes=5))
    live = world.attempt(world.coding, [(q, "int main(){ return 1; }")], status="IN_PROGRESS",
                         evaluation_status="NOT_EVALUATED", expires_at=now + datetime.timedelta(minutes=5))
    res = run(coding.run_grading_sweep(world.db, 20))
    world.db.expire_all()
    assert res["closed_expired_attempts"] == 1
    assert world.db.get(A.AssessmentAttempt, expired.id).status == "EVALUATED"
    assert world.db.get(A.AssessmentAttempt, live.id).status == "IN_PROGRESS"
