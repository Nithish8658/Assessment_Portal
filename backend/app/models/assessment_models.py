import datetime
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, Float, DateTime, ForeignKey, JSON,
    UniqueConstraint, Index
)
from sqlalchemy.orm import relationship
from app.database import Base

# ==============================================================================
# 1. Assessment Definition Models
# ==============================================================================

class AssessmentDomain(Base):
    __tablename__ = "assessment_domains"

    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String(64), unique=True, nullable=False, index=True)
    title = Column(String(128), nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    rounds = relationship("AssessmentRound", back_populates="domain", cascade="all, delete-orphan")
    activation_requests = relationship("AssessmentActivationRequest", back_populates="domain")


class AssessmentRound(Base):
    __tablename__ = "assessment_rounds"
    __table_args__ = (
        UniqueConstraint("domain_id", "round_number", name="uq_domain_round_number"),
        UniqueConstraint("domain_id", "slug", name="uq_domain_round_slug"),
    )

    id = Column(Integer, primary_key=True, index=True)
    domain_id = Column(Integer, ForeignKey("assessment_domains.id", ondelete="CASCADE"), nullable=False, index=True)
    round_number = Column(Integer, nullable=False)
    slug = Column(String(64), nullable=False, index=True)
    title = Column(String(128), nullable=False)
    description = Column(Text, nullable=True)
    round_type = Column(String(32), nullable=False, default="COGNITIVE_MCQ")
    duration_minutes = Column(Integer, default=45, nullable=False)
    questions_per_attempt = Column(Integer, default=7, nullable=False)
    rules_json = Column(JSON, default=dict, nullable=False)

    domain = relationship("AssessmentDomain", back_populates="rounds")
    policy = relationship("AssessmentPolicy", back_populates="round", uselist=False, cascade="all, delete-orphan")
    questions = relationship("AssessmentQuestion", back_populates="round", cascade="all, delete-orphan")


class AssessmentPolicy(Base):
    __tablename__ = "assessment_policies"

    id = Column(Integer, primary_key=True, index=True)
    round_id = Column(Integer, ForeignKey("assessment_rounds.id", ondelete="CASCADE"), unique=True, nullable=False)
    passing_score = Column(Float, default=60.0, nullable=False)
    weightage_percent = Column(Float, default=25.0, nullable=False)
    min_score_percent = Column(Float, default=50.0, nullable=False)
    mandatory_pass = Column(Boolean, default=True, nullable=False)

    round = relationship("AssessmentRound", back_populates="policy")


class Competency(Base):
    __tablename__ = "competencies"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(32), unique=True, nullable=False, index=True)
    name = Column(String(128), nullable=False)
    category = Column(String(64), nullable=False)
    description = Column(Text, nullable=True)

    questions = relationship("AssessmentQuestion", back_populates="competency")


class AssessmentQuestion(Base):
    __tablename__ = "assessment_questions"

    id = Column(Integer, primary_key=True, index=True)
    round_id = Column(Integer, ForeignKey("assessment_rounds.id", ondelete="CASCADE"), nullable=False, index=True)
    competency_id = Column(Integer, ForeignKey("competencies.id", ondelete="SET NULL"), nullable=True, index=True)
    question_type = Column(String(32), nullable=False)
    title = Column(String(256), nullable=False)
    candidate_content = Column(Text, nullable=False)
    candidate_code_template = Column(Text, nullable=True)
    options_json = Column(JSON, nullable=True)
    difficulty = Column(String(16), default="Medium", nullable=False)
    marks = Column(Float, default=1.0, nullable=False)
    time_limit_seconds = Column(Integer, default=60, nullable=False)
    version = Column(Integer, default=1, nullable=False)
    status = Column(String(16), default="Active", nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)

    round = relationship("AssessmentRound", back_populates="questions")
    competency = relationship("Competency", back_populates="questions")
    evaluation_config = relationship("QuestionEvaluationConfig", back_populates="question", uselist=False, cascade="all, delete-orphan")
    versions = relationship("QuestionVersion", back_populates="question", cascade="all, delete-orphan")


class QuestionEvaluationConfig(Base):
    __tablename__ = "question_evaluation_configs"

    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("assessment_questions.id", ondelete="CASCADE"), unique=True, nullable=False)
    evaluation_type = Column(String(32), default="ExactMatch", nullable=False)
    correct_answer = Column(Text, nullable=True)
    reference_solution = Column(Text, nullable=True)
    public_test_cases_json = Column(JSON, default=list, nullable=False)
    hidden_test_cases_json = Column(JSON, default=list, nullable=False)
    scoring_rules_json = Column(JSON, default=dict, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)

    question = relationship("AssessmentQuestion", back_populates="evaluation_config")


class QuestionVersion(Base):
    __tablename__ = "question_versions"
    __table_args__ = (
        UniqueConstraint("question_id", "version_num", name="uq_question_version"),
        Index("ix_question_version_composite", "question_id", "version_num"),
    )

    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("assessment_questions.id", ondelete="CASCADE"), nullable=False, index=True)
    version_num = Column(Integer, nullable=False)
    snapshot_json = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    question = relationship("AssessmentQuestion", back_populates="versions")


# ==============================================================================
# 2. Activation, Candidate Roster & Allocation Models
# ==============================================================================

class AssessmentActivationRequest(Base):
    __tablename__ = "assessment_activation_requests"

    id = Column(Integer, primary_key=True, index=True)
    domain_id = Column(Integer, ForeignKey("assessment_domains.id", ondelete="RESTRICT"), nullable=False, index=True)
    academic_class_id = Column(Integer, ForeignKey("academic_classes.id", ondelete="RESTRICT"), nullable=False, index=True)
    
    requested_by_id = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    reviewed_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    status = Column(String(30), default="PENDING", nullable=False, index=True) # PENDING, APPROVED, REJECTED, CANCELLED
    complexity_level = Column(String(20), default="Balanced", nullable=False) # Balanced, Easy, Medium, Hard
    selected_rounds_json = Column(JSON, nullable=True) # List of round_ids included in this activation session
    approved_round_durations_json = Column(JSON, nullable=True)
    valid_from = Column(DateTime, nullable=False)
    valid_until = Column(DateTime, nullable=False)
    notes = Column(Text, nullable=True)
    rejection_reason = Column(Text, nullable=True)
    
    requested_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    reviewed_at = Column(DateTime, nullable=True)

    domain = relationship("AssessmentDomain", back_populates="activation_requests")
    academic_class = relationship("AcademicClass")
    requested_by = relationship("User", foreign_keys=[requested_by_id])
    reviewed_by = relationship("User", foreign_keys=[reviewed_by_id])
    candidates = relationship("AssessmentActivationCandidate", back_populates="request", cascade="all, delete-orphan")
    allocations = relationship("AssessmentStudentAllocation", back_populates="request", cascade="all, delete-orphan")

    @property
    def department_id(self):
        return self.academic_class.programme.department_id if self.academic_class and self.academic_class.programme else None

    @property
    def programme_id(self):
        return self.academic_class.programme_id if self.academic_class else None

    @property
    def batch_name(self):
        return self.academic_class.batch_name if self.academic_class else None

    @property
    def section_name(self):
        return self.academic_class.section_name if self.academic_class else None


class AssessmentActivationCandidate(Base):
    __tablename__ = "assessment_activation_candidates"
    __table_args__ = (
        UniqueConstraint("request_id", "student_id", name="uq_request_candidate"),
    )

    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey("assessment_activation_requests.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)

    request = relationship("AssessmentActivationRequest", back_populates="candidates")
    student = relationship("StudentProfile")


class AssessmentStudentAllocation(Base):
    __tablename__ = "assessment_student_allocations"
    __table_args__ = (
        UniqueConstraint("request_id", "student_id", name="uq_request_student_allocation"),
        Index("ix_allocation_student_status", "student_id", "status"),
    )

    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey("assessment_activation_requests.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # State: APPROVED -> IN_PROGRESS -> COMPLETED; APPROVED -> REVOKED / EXPIRED; MIGRATED
    status = Column(String(30), default="APPROVED", nullable=False, index=True)
    source = Column(String(50), default="TUTOR_ACTIVATION", nullable=False) # TUTOR_ACTIVATION, LEGACY_CORPORATE_ASSESSMENT, ADMIN_OVERRIDE
    
    valid_from = Column(DateTime, nullable=False)
    valid_until = Column(DateTime, nullable=False)
    allocated_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    request = relationship("AssessmentActivationRequest", back_populates="allocations")
    student = relationship("StudentProfile")
    attempts = relationship("AssessmentAttempt", back_populates="allocation", cascade="all, delete-orphan")
    reattempt_requests = relationship("AssessmentReattemptRequest", back_populates="allocation", cascade="all, delete-orphan")

    @property
    def domain_id(self):
        return self.request.domain_id if self.request else None

    @property
    def domain(self):
        return self.request.domain if self.request else None


# ==============================================================================
# 3. Normalized Attempts, Snapshots, Responses, Coding & Results
# ==============================================================================

class AssessmentAttempt(Base):
    __tablename__ = "assessment_attempts"
    __table_args__ = (
        UniqueConstraint("allocation_id", "round_id", "attempt_number", name="uq_allocation_round_attempt_num"),
        Index("ix_attempt_allocation_round", "allocation_id", "round_id"),
        Index("ix_attempt_status", "status"),
    )

    id = Column(Integer, primary_key=True, index=True)
    allocation_id = Column(Integer, ForeignKey("assessment_student_allocations.id", ondelete="CASCADE"), nullable=False, index=True)
    round_id = Column(Integer, ForeignKey("assessment_rounds.id", ondelete="RESTRICT"), nullable=False, index=True)
    attempt_number = Column(Integer, default=1, nullable=False)
    
    status = Column(String(32), default="IN_PROGRESS", nullable=False, index=True) # IN_PROGRESS, SUBMITTED, EVALUATING, EVALUATED, EXPIRED, CANCELLED
    evaluation_status = Column(String(32), default="NOT_EVALUATED", nullable=False, index=True) # NOT_EVALUATED, PENDING_BATCH, EVALUATING, COMPLETED, FAILED
    score = Column(Float, default=0.0, nullable=False)
    percentage = Column(Float, default=0.0, nullable=False)
    passed = Column(Boolean, default=False, nullable=False)
    evaluation_details_json = Column(JSON, default=dict, nullable=False)
    
    started_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    last_activity_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)
    submitted_at = Column(DateTime, nullable=True)
    batch_evaluated_at = Column(DateTime, nullable=True)
    duration_minutes = Column(Integer, nullable=True)
    expires_at = Column(DateTime, nullable=True)

    allocation = relationship("AssessmentStudentAllocation", back_populates="attempts")
    round = relationship("AssessmentRound")
    snapshots = relationship("AttemptQuestionSnapshot", back_populates="attempt", cascade="all, delete-orphan")
    responses = relationship("AssessmentResponse", back_populates="attempt", cascade="all, delete-orphan")
    coding_submissions = relationship("CodingSubmission", back_populates="attempt", cascade="all, delete-orphan")
    competency_scores = relationship("CompetencyScore", back_populates="attempt", cascade="all, delete-orphan")
    result = relationship("AssessmentResult", back_populates="attempt", uselist=False, cascade="all, delete-orphan")

    @property
    def student_id(self):
        return self.allocation.student_id if self.allocation else None

    @property
    def domain_id(self):
        return self.allocation.domain_id if self.allocation else None

    @property
    def domain(self):
        return self.allocation.domain if self.allocation else None


class AssessmentReattemptRequest(Base):
    __tablename__ = "assessment_reattempt_requests"
    __table_args__ = (
        Index("ix_reattempt_req_allocation_round", "allocation_id", "round_id"),
        Index("ix_reattempt_req_status", "status"),
    )

    id = Column(Integer, primary_key=True, index=True)
    allocation_id = Column(Integer, ForeignKey("assessment_student_allocations.id", ondelete="CASCADE"), nullable=False, index=True)
    round_id = Column(Integer, ForeignKey("assessment_rounds.id", ondelete="RESTRICT"), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    
    requested_by_id = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    reviewed_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    status = Column(String(30), default="PENDING", nullable=False, index=True) # PENDING, APPROVED, REJECTED
    attempt_number = Column(Integer, default=2, nullable=False)
    reason = Column(Text, nullable=True)
    rejection_reason = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    reviewed_at = Column(DateTime, nullable=True)

    allocation = relationship("AssessmentStudentAllocation", back_populates="reattempt_requests")
    round = relationship("AssessmentRound")
    student = relationship("StudentProfile", foreign_keys=[student_id])
    requested_by = relationship("User", foreign_keys=[requested_by_id])
    reviewed_by = relationship("User", foreign_keys=[reviewed_by_id])

    @property
    def domain_id(self):
        return self.allocation.domain_id if self.allocation else None

    @property
    def domain(self):
        return self.allocation.domain if self.allocation else None


class AttemptQuestionSnapshot(Base):
    __tablename__ = "attempt_question_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    attempt_id = Column(Integer, ForeignKey("assessment_attempts.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id = Column(Integer, ForeignKey("assessment_questions.id", ondelete="RESTRICT"), nullable=False)
    question_version_id = Column(Integer, ForeignKey("question_versions.id", ondelete="RESTRICT"), nullable=True)
    snapshot_content_json = Column(JSON, nullable=False)

    attempt = relationship("AssessmentAttempt", back_populates="snapshots")
    question = relationship("AssessmentQuestion")


class AssessmentResponse(Base):
    __tablename__ = "assessment_responses"
    __table_args__ = (
        UniqueConstraint("attempt_id", "question_id", name="uq_attempt_question_response"),
    )

    id = Column(Integer, primary_key=True, index=True)
    attempt_id = Column(Integer, ForeignKey("assessment_attempts.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id = Column(Integer, ForeignKey("assessment_questions.id", ondelete="RESTRICT"), nullable=False)
    response_payload = Column(Text, nullable=True)
    auto_saved_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)
    is_marked_for_review = Column(Boolean, default=False, nullable=False)

    attempt = relationship("AssessmentAttempt", back_populates="responses")
    question = relationship("AssessmentQuestion")


class CodingSubmission(Base):
    __tablename__ = "coding_submissions"

    id = Column(Integer, primary_key=True, index=True)
    attempt_id = Column(Integer, ForeignKey("assessment_attempts.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id = Column(Integer, ForeignKey("assessment_questions.id", ondelete="RESTRICT"), nullable=False)
    language = Column(String(32), nullable=False)
    source_code = Column(Text, nullable=False)
    status = Column(String(64), default="Pending", nullable=False)
    judge0_status_id = Column(Integer, nullable=True)
    test_cases_passed = Column(Integer, default=0, nullable=False)
    total_test_cases = Column(Integer, default=0, nullable=False)
    execution_time_ms = Column(Float, default=0.0, nullable=False)
    memory_kb = Column(Float, default=0.0, nullable=False)
    compiler_output = Column(Text, nullable=True)
    score_awarded = Column(Float, default=0.0, nullable=False)
    submitted_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    attempt = relationship("AssessmentAttempt", back_populates="coding_submissions")
    question = relationship("AssessmentQuestion")
    execution_results = relationship("CodeExecutionResult", back_populates="submission", cascade="all, delete-orphan")


class CodeExecutionResult(Base):
    __tablename__ = "code_execution_results"

    id = Column(Integer, primary_key=True, index=True)
    submission_id = Column(Integer, ForeignKey("coding_submissions.id", ondelete="CASCADE"), nullable=False, index=True)
    test_case_index = Column(Integer, nullable=False)
    judge0_token = Column(String(64), nullable=True)
    judge0_status_id = Column(Integer, nullable=True)
    is_passed = Column(Boolean, default=False, nullable=False)
    input_data = Column(Text, nullable=True)
    expected_output = Column(Text, nullable=True)
    actual_output = Column(Text, nullable=True)
    error_output = Column(Text, nullable=True)
    execution_time_ms = Column(Float, default=0.0, nullable=False)
    memory_kb = Column(Float, default=0.0, nullable=False)

    submission = relationship("CodingSubmission", back_populates="execution_results")



class CompetencyScore(Base):
    __tablename__ = "competency_scores"

    id = Column(Integer, primary_key=True, index=True)
    attempt_id = Column(Integer, ForeignKey("assessment_attempts.id", ondelete="CASCADE"), nullable=False, index=True)
    competency_id = Column(Integer, ForeignKey("competencies.id", ondelete="RESTRICT"), nullable=False, index=True)
    score = Column(Float, default=0.0, nullable=False)
    max_score = Column(Float, default=0.0, nullable=False)
    percentage = Column(Float, default=0.0, nullable=False)
    readiness_level = Column(String(32), default="Developing", nullable=False)

    attempt = relationship("AssessmentAttempt", back_populates="competency_scores")
    competency = relationship("Competency")


class AssessmentResult(Base):
    __tablename__ = "assessment_results"

    id = Column(Integer, primary_key=True, index=True)
    attempt_id = Column(Integer, ForeignKey("assessment_attempts.id", ondelete="CASCADE"), unique=True, nullable=False)
    total_score = Column(Float, default=0.0, nullable=False)
    max_score = Column(Float, default=0.0, nullable=False)
    percentage = Column(Float, default=0.0, nullable=False)
    passed = Column(Boolean, default=False, nullable=False)
    readiness_index = Column(String(32), default="Developing", nullable=False)
    evaluated_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    attempt = relationship("AssessmentAttempt", back_populates="result")


class AssistantChatSession(Base):
    __tablename__ = "assistant_chat_sessions"
    __table_args__ = (
        Index("ix_assistant_user_dept", "user_id", "department_id"),
    )

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(64), unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    user_role = Column(String(32), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="SET NULL"), nullable=True, index=True)
    title = Column(String(256), nullable=True)
    page_context_json = Column(JSON, default=dict, nullable=True)
    messages_json = Column(JSON, default=list, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)

    user = relationship("User")
    department = relationship("Department")
