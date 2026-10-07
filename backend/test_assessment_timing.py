import datetime as dt
import unittest
from types import SimpleNamespace as NS
from unittest.mock import MagicMock, patch, AsyncMock

from fastapi import HTTPException
from app.services.assessment.timing import (
    approved_duration, freeze_approval_durations, freeze_attempt_deadline,
    attempt_timing, require_open_attempt, as_utc_naive,
)
from app.services.assessment.attempt_service import attempt_service
from app.services.assessment.orchestrator import orchestrator
from app.services.assessment.evaluation_service import evaluation_service
from app.services.assessment.allocation_service import review_activation_request_atomic
from app.schemas.assessment_schemas import ReviewActivationRequest
from app.models.assessment_models import AssessmentActivationRequest


class AssessmentTimingTests(unittest.TestCase):
    def setUp(self):
        self.start = dt.datetime(2026, 9, 8, 10, 0)
        self.round = NS(id=24, duration_minutes=45, round_number=3, title='Coding', domain=NS(slug='test', title='Test Track'))
        self.request = NS(selected_rounds_json=[24], domain=NS(rounds=[self.round]), approved_round_durations_json=None)
        freeze_approval_durations(self.request)
        self.attempt = NS(id=1, round_id=24, started_at=self.start, duration_minutes=None, expires_at=None,
                          status='IN_PROGRESS', submitted_at=None, result=None, round=self.round,
                          allocation=NS(student_id=7, student=NS(user_id=None), request=self.request))

    def test_approval_survives_global_duration_edit(self):
        self.round.duration_minutes = 5
        self.assertEqual(approved_duration(self.round, self.request), 45)
        self.assertEqual(freeze_attempt_deadline(self.attempt), self.start + dt.timedelta(minutes=45))

    def test_resume_never_resets_deadline(self):
        deadline = freeze_attempt_deadline(self.attempt)
        self.request.approved_round_durations_json = {'24': 120}
        self.assertEqual(freeze_attempt_deadline(self.attempt), deadline)
        self.assertEqual(attempt_timing(self.attempt, self.start + dt.timedelta(minutes=15))['time_remaining_seconds'], 1800)

    def test_grace_attempt_gets_full_approved_duration(self):
        self.attempt.started_at += dt.timedelta(days=1)
        self.assertEqual(attempt_timing(self.attempt, self.attempt.started_at)['time_remaining_seconds'], 2700)

    def test_utc_and_ist_represent_same_deadline(self):
        aware = self.start.replace(tzinfo=dt.timezone.utc).astimezone(dt.timezone(dt.timedelta(hours=5, minutes=30)))
        self.assertEqual(as_utc_naive(aware), self.start)
        self.attempt.started_at = aware
        payload = attempt_timing(self.attempt, self.start)
        self.assertEqual(payload['expires_at'], '2026-09-08T10:45:00Z')
        self.assertTrue(payload['server_time'].endswith('Z'))

    def test_exact_deadline_rejects_answers(self):
        deadline = freeze_attempt_deadline(self.attempt)
        require_open_attempt(self.attempt, deadline - dt.timedelta(microseconds=1))
        with self.assertRaises(HTTPException) as ctx:
            require_open_attempt(self.attempt, deadline)
        self.assertEqual(ctx.exception.status_code, 410)
        self.assertEqual(attempt_timing(self.attempt, deadline)['time_remaining_seconds'], 0)

    def test_closed_attempt_never_reopens(self):
        for state in ['SUBMITTED', 'EVALUATING', 'EVALUATED', 'CANCELLED']:
            self.attempt.status = state
            with self.assertRaises(HTTPException):
                require_open_attempt(self.attempt, self.start)
            self.assertEqual(attempt_timing(self.attempt, self.start)['time_remaining_seconds'], 0)

    def test_save_service_rejects_expired_payload_before_writing(self):
        self.attempt.started_at = dt.datetime.utcnow() - dt.timedelta(hours=2)
        db = MagicMock()
        db.query.return_value.filter.return_value.populate_existing.return_value.with_for_update.return_value.first.return_value = self.attempt
        with self.assertRaises(HTTPException) as ctx:
            attempt_service.save_response(1, 4, 'late answer', False, db)
        self.assertEqual(ctx.exception.status_code, 410)
        db.add.assert_not_called()
        db.commit.assert_not_called()

    def test_late_submit_uses_deadline_as_submission_time(self):
        self.attempt.started_at = dt.datetime.utcnow() - dt.timedelta(hours=2)
        deadline = freeze_attempt_deadline(self.attempt)
        db = MagicMock()
        db.query.return_value.filter.return_value.populate_existing.return_value.with_for_update.return_value.first.return_value = self.attempt
        with patch.object(evaluation_service, 'evaluate_attempt', return_value={'percentage': 0}):
            orchestrator.submit_and_evaluate(1, 7, db)
        self.assertEqual(self.attempt.submitted_at, deadline)

    def test_duplicate_submission_returns_existing_result(self):
        self.attempt.status = 'EVALUATED'
        self.attempt.result = NS()
        db = MagicMock()
        db.query.return_value.filter.return_value.populate_existing.return_value.with_for_update.return_value.first.return_value = self.attempt
        with patch.object(evaluation_service, 'result_payload', return_value={'passed': True}), patch.object(evaluation_service, 'evaluate_attempt') as evaluate:
            self.assertEqual(orchestrator.submit_and_evaluate(1, 7, db), {'passed': True})
            evaluate.assert_not_called()

    def test_engine_outage_keeps_answers_closed_and_allows_retry(self):
        self.attempt.status = 'EVALUATING'
        self.attempt.snapshots = [NS(question_id=4, snapshot_content_json={'id': 4, 'question_type': 'SQL', 'marks': 5})]
        db = MagicMock()
        db.query.return_value.filter.return_value.all.return_value = [NS(question_id=4, response_payload='SELECT 1;')]
        with patch('sqlite3.connect', side_effect=Exception('test outage')), self.assertLogs('app.services.assessment.evaluation_service', level='ERROR'):
            with self.assertRaises(Exception):
                evaluation_service.evaluate_attempt(self.attempt, db)
        self.assertEqual(self.attempt.status, 'SUBMITTED')

    def test_approval_rejects_stale_timings_shown_to_reviewer(self):
        req = self.request
        req.id = 1
        req.status = 'PENDING'
        req.candidates = [NS(student_id=7)]
        self.round.duration_minutes = 60
        db = MagicMock()
        db.query.return_value.filter.return_value.with_for_update.return_value.first.return_value = req
        user = NS(roles=[NS(name='Administrator')])
        with self.assertRaises(HTTPException) as ctx:
            review_activation_request_atomic(1, ReviewActivationRequest(action='APPROVE', round_durations={'24': 45}), user, db)
        self.assertEqual(ctx.exception.status_code, 409)
        db.commit.assert_not_called()

    def test_invalid_durations_and_cross_domain_rounds_are_rejected(self):
        for duration in [0, -1, True]:
            self.round.duration_minutes = duration
            with self.assertRaises(HTTPException):
                freeze_approval_durations(self.request)
        self.round.duration_minutes = 45
        self.request.selected_rounds_json = [999]
        with self.assertRaises(HTTPException):
            freeze_approval_durations(self.request)


if __name__ == '__main__':
    unittest.main()
