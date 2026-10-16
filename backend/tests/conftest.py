"""Test setup: every test gets an empty in-memory SQLite database, and the network is blocked.

The environment is fixed before the app is imported, so a developer's backend/.env (which points
at the production database) is never used: python-dotenv does not override variables already set.
"""
import os

os.environ.update({
    "DATABASE_URL": "postgresql+psycopg2://test:test@localhost:5432/test",  # never connected to
    "DIRECT_DATABASE_URL": "postgresql+psycopg2://test:test@localhost:5432/test",
    "SECRET_KEY": "test-secret-key",
    "VERCEL": "1",  # skips create_all and background loops on import
    "GEMINI_API_KEY": "test-gemini-key",
    "GEMINI_MODELS": "gemini-3.1-flash-lite,gemini-3.5-flash-lite,gemini-2.5-flash",
    "GOOGLE_OAUTH_CLIENT_ID": "cid.apps.googleusercontent.com",
    "GOOGLE_OAUTH_CLIENT_SECRET": "secret",
    "SENTRY_DSN": "",
    "CRON_SECRET": "cron-secret",
})

import datetime
import httpx
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.database as database
import app.models.models as M
import app.models.assessment_models as A


@pytest.fixture(autouse=True)
def no_network(monkeypatch):
    def refuse(*args, **kwargs):
        raise AssertionError("Tests must not make network calls; patch the call instead.")
    monkeypatch.setattr(httpx, "post", refuse)
    monkeypatch.setattr(httpx, "request", refuse)
    monkeypatch.setattr(httpx.AsyncClient, "post", refuse)


@pytest.fixture
def Session(monkeypatch):
    engine = create_engine("sqlite://", poolclass=StaticPool, connect_args={"check_same_thread": False})
    M.Base.metadata.create_all(engine)
    factory = sessionmaker(bind=engine)
    monkeypatch.setattr(database, "SessionLocal", factory)
    yield factory
    engine.dispose()


@pytest.fixture
def db(Session):
    session = Session()
    yield session
    session.close()


class World:
    """A department with one class, its tutor, a student, and a C track with coding/debugging rounds."""

    def __init__(self, db):
        self.db = db
        now = datetime.datetime.utcnow()
        for name in ("Student", "Class Tutor", "HoD", "Administrator"):
            db.add(M.Role(name=name))
        db.flush()
        self.dept = M.Department(code="CS", name="Computer Science")
        db.add(self.dept); db.flush()
        self.prog = M.Programme(code="BCA", name="BCA", department_id=self.dept.id)
        db.add(self.prog); db.flush()
        self.tutor = self.user("tutor1", "Class Tutor")
        self.tutor_faculty = M.FacultyProfile(user_id=self.tutor.id, employee_id="E1", department_id=self.dept.id,
                                              assigned_programme_id=self.prog.id, assigned_batch="2024-2027", assigned_section="A")
        db.add(self.tutor_faculty); db.flush()
        self.klass = M.AcademicClass(class_code="BCA-A", name="BCA A", programme_id=self.prog.id,
                                     batch_name="2024-2027", section_name="A", tutor_id=self.tutor_faculty.id)
        db.add(self.klass); db.flush()
        self.student = self.user("R001", "Student", email="asha@gmail.com")
        self.profile = M.StudentProfile(user_id=self.student.id, register_number="R001", programme_id=self.prog.id,
                                        batch_name="2024-2027", section_name="A", semester_num=3)
        db.add(self.profile); db.flush()
        self.domain = A.AssessmentDomain(slug="c-programming-track", title="C Track")
        db.add(self.domain); db.flush()
        self.coding = self.round(3, "CODING")
        self.debugging = self.round(4, "DEBUGGING")
        request = A.AssessmentActivationRequest(domain_id=self.domain.id, academic_class_id=self.klass.id,
                                                requested_by_id=self.tutor.id, status="APPROVED",
                                                valid_from=now, valid_until=now + datetime.timedelta(days=5))
        db.add(request); db.flush()
        self.allocation = A.AssessmentStudentAllocation(request_id=request.id, student_id=self.profile.id,
                                                        valid_from=now, valid_until=now + datetime.timedelta(days=5))
        db.add(self.allocation); db.flush()
        self._attempt_no = 0
        db.commit()

    def user(self, username, role, email=None):
        u = M.User(username=username, email=email or f"{username.lower()}@example.com", hashed_password="x",
                   full_name=username.title())
        u.roles.append(self.db.query(M.Role).filter_by(name=role).one())
        self.db.add(u); self.db.flush()
        return u

    def round(self, number, round_type):
        r = A.AssessmentRound(domain_id=self.domain.id, round_number=number, slug=round_type.lower(),
                              title=round_type.title(), round_type=round_type, duration_minutes=30)
        self.db.add(r); self.db.flush()
        self.db.add(A.AssessmentPolicy(round_id=r.id, passing_score=60))
        return r

    def question(self, round_obj, title, tests=None, starter="int main() { return 0; }"):
        qtype = "debugging" if round_obj.round_type == "DEBUGGING" else "coding"
        q = A.AssessmentQuestion(round_id=round_obj.id, question_type=qtype, title=title, candidate_content=f"Solve {title}",
                                 candidate_code_template=starter, marks=10.0)
        self.db.add(q); self.db.flush()
        self.db.add(A.QuestionEvaluationConfig(question_id=q.id, evaluation_type="AIEvaluation", reference_solution="ref",
                                               correct_answer="the defect" if qtype == "debugging" else None,
                                               public_test_cases_json=tests or [], hidden_test_cases_json=[]))
        self.db.flush()
        return q

    def attempt(self, round_obj, answers, status="SUBMITTED", evaluation_status="PENDING_BATCH", **kw):
        """answers: list of (question, code)."""
        self._attempt_no += 1
        a = A.AssessmentAttempt(allocation_id=self.allocation.id, round_id=round_obj.id, attempt_number=self._attempt_no,
                                status=status, evaluation_status=evaluation_status,
                                started_at=datetime.datetime.utcnow() - datetime.timedelta(hours=1), duration_minutes=30, **kw)
        self.db.add(a); self.db.flush()
        for q, code in answers:
            self.db.add(A.AttemptQuestionSnapshot(attempt_id=a.id, question_id=q.id, snapshot_content_json={
                "id": q.id, "title": q.title, "question_type": q.question_type, "marks": 10.0,
                "candidate_content": q.candidate_content, "candidate_code_template": q.candidate_code_template}))
            self.db.add(A.AssessmentResponse(attempt_id=a.id, question_id=q.id,
                                             response_payload='{"code": %s}' % __import__("json").dumps(code)))
        self.db.commit()
        return a


@pytest.fixture
def world(db):
    return World(db)
