from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# ==============================================================================
# Domain & Round Schemas
# ==============================================================================

class RoundSummaryResponse(BaseModel):
    id: int
    domain_id: int
    round_number: int
    slug: str
    title: str
    description: Optional[str] = None
    round_type: str
    duration_minutes: int
    questions_per_attempt: int
    passing_score: float
    weightage_percent: float
    rules: Dict[str, Any] = {}
    status: str = "NOT_STARTED" # NOT_STARTED, IN_PROGRESS, SUBMITTED, EVALUATED
    score: Optional[float] = None
    percentage: Optional[float] = None
    max_score: Optional[float] = None
    passed: Optional[bool] = None
    reattempt_status: Optional[str] = None
    has_reattempt_request: bool = False
    rejection_reason: Optional[str] = None
    attempt_number: int = 1
    attempt_id: Optional[int] = None

class DomainDetailResponse(BaseModel):
    id: int
    slug: str
    title: str
    description: Optional[str] = None
    is_active: bool
    allocation_id: Optional[int] = None
    allocated_at: Optional[str] = None
    valid_from: Optional[str] = None
    valid_until: Optional[str] = None
    schedule_status: str = "ACTIVE" # ACTIVE, UPCOMING, EXPIRED
    formatted_assigned_time: Optional[str] = None
    starts_in_minutes: Optional[int] = None
    rounds: List[RoundSummaryResponse] = []

class CompetencyResponse(BaseModel):
    id: int
    code: str
    name: str
    category: str
    description: Optional[str] = None

# ==============================================================================
# Candidate-Facing Question Schema (PROTECTED - No Answers or Solutions)
# ==============================================================================

class CandidateQuestionResponse(BaseModel):
    id: int
    round_id: Optional[int] = None
    competency_id: Optional[int] = None
    competency_code: Optional[str] = None
    competency_name: Optional[str] = None
    question_type: str = "MCQ"
    title: str = "Question"
    content: Optional[str] = ""
    candidate_content: Optional[str] = None
    code_template: Optional[str] = None
    candidate_code_template: Optional[str] = None
    options: Optional[Any] = None
    options_json: Optional[Any] = None
    difficulty: Optional[str] = "Medium"
    marks: Optional[float] = 1.0
    time_limit_seconds: Optional[int] = 60

# ==============================================================================
# Admin & Coordinator Question Schema (With Evaluation Config)
# ==============================================================================

class AdminQuestionResponse(BaseModel):
    id: int
    round_id: int
    competency_id: Optional[int] = None
    question_type: str
    title: str
    candidate_content: str
    candidate_code_template: Optional[str] = None
    options_json: Optional[Any] = None
    difficulty: str
    marks: float
    time_limit_seconds: int
    version: int
    status: str
    evaluation_type: Optional[str] = None
    correct_answer: Optional[str] = None
    reference_solution: Optional[str] = None
    public_test_cases: Optional[List[Any]] = None
    hidden_test_cases: Optional[List[Any]] = None
    scoring_rules: Optional[Dict[str, Any]] = None

# ==============================================================================
# Attempt Lifecycle Schemas
# ==============================================================================

class StartAttemptRequest(BaseModel):
    round_id: int
    allocation_id: Optional[int] = None

class StartAttemptResponse(BaseModel):
    attempt_id: int
    allocation_id: int
    domain_slug: str
    round_id: int
    round_number: int
    round_title: str
    round_type: str
    duration_minutes: int
    questions_per_attempt: int
    passing_score: float
    rules: Dict[str, Any] = {}
    questions: List[CandidateQuestionResponse]
    started_at: str
    saved_answers: Dict[str, Any] = {}
    time_remaining_seconds: int
    expires_at: str
    server_time: str

class SaveResponseRequest(BaseModel):
    attempt_id: int
    question_id: int
    response_payload: Any
    is_marked_for_review: bool = False
class SaveResponsesRequest(BaseModel):
    attempt_id: int
    responses: Dict[int, Any] # question_id -> answer payload (str, int, code dict, etc.)

class BulkAnswerItem(BaseModel):
    question_id: int
    selected_option: Optional[str] = None
    code: Optional[str] = None
    is_marked_for_review: bool = False

class SaveAnswersBulkRequest(BaseModel):
    attempt_id: int
    answers: List[BulkAnswerItem]

class SubmitAttemptRequest(BaseModel):
    attempt_id: int

# ==============================================================================
# Results & Competency Radar Schemas
# ==============================================================================

class CompetencyRadarItem(BaseModel):
    competency_code: str
    competency_name: str
    category: str
    score: float
    max_score: float
    percentage: float
    readiness_level: str

class CandidateResultResponse(BaseModel):
    attempt_id: int
    round_id: Optional[int] = None
    domain_slug: str
    round_number: int
    round_title: str
    round_type: str
    total_score: float
    max_score: float
    percentage: float
    passed: bool
    readiness_index: str
    competencies: List[CompetencyRadarItem] = []
    strengths: List[str] = []
    gaps: List[str] = []
    evaluated_at: Optional[str] = None

# ==============================================================================
# Assessment Activation Schemas
# ==============================================================================

class CreateActivationRequest(BaseModel):
    domain_id: int
    academic_class_id: int
    candidate_student_ids: List[int]
    selected_round_ids: Optional[List[int]] = None
    complexity_level: Optional[str] = "Balanced"
    valid_from: datetime
    valid_until: datetime
    notes: Optional[str] = None

class UpdateActivationRequest(BaseModel):
    valid_from: Optional[datetime] = None
    valid_until: Optional[datetime] = None
    notes: Optional[str] = None
    candidate_student_ids: Optional[List[int]] = None
    selected_round_ids: Optional[List[int]] = None
    complexity_level: Optional[str] = None
    status: Optional[str] = None

class ReviewActivationRequest(BaseModel):
    action: str # "APPROVE" or "REJECT"
    rejection_reason: Optional[str] = None
    round_durations: Optional[Dict[str, int]] = None

class ActivationRequestResponse(BaseModel):
    id: int
    domain_id: int
    domain_title: str
    academic_class_id: int
    class_name: str
    department_id: Optional[int] = None
    department_name: Optional[str] = None
    programme_name: Optional[str] = None
    batch_name: str
    section_name: str
    requested_by_name: str
    reviewed_by_name: Optional[str] = None
    status: str
    complexity_level: Optional[str] = "Balanced"
    candidate_count: int
    selected_round_ids: Optional[List[int]] = None
    valid_from: str
    round_durations: Dict[str, int] = {}
    round_timings: List[Dict[str, Any]] = []
    valid_until: str
    requested_at: str
    reviewed_at: Optional[str] = None
    rejection_reason: Optional[str] = None
    notes: Optional[str] = None
    candidate_students: List[Dict[str, Any]] = []

class TutorGrantAttemptRequest(BaseModel):
    allocation_id: int
    round_id: int
    student_ids: List[int]
    reason: Optional[str] = "Granted by Class Tutor"

class RoundCandidateSummaryItem(BaseModel):
    student_id: int
    register_number: str
    full_name: str
    email: str
    allocation_id: int
    score: Optional[float] = None
    percentage: Optional[float] = None
    status: str # "PASSED", "FAILED", "NOT_STARTED", "IN_PROGRESS"
    attempt_number: int = 1
    has_active_grant: bool = False
    evaluated_at: Optional[str] = None

class DynamicRoundPerformanceResponse(BaseModel):
    round_id: int
    round_number: int
    slug: str
    title: str
    passing_score: float
    passed_count: int
    failed_count: int
    not_started_count: int
    passed_students: List[RoundCandidateSummaryItem]
    failed_students: List[RoundCandidateSummaryItem]
    pending_students: List[RoundCandidateSummaryItem]

class ActivationRoundsPerformanceResponse(BaseModel):
    activation_id: int
    domain_title: str
    class_name: str
    batch_name: str
    section_name: str
    total_candidates: int
    rounds: List[DynamicRoundPerformanceResponse]

class TutorClassOption(BaseModel):
    id: int
    class_code: str
    name: str
    programme_name: str
    batch_name: str
    section_name: str
    semester_num: int
    student_count: int

class TutorStudentCohortItem(BaseModel):
    student_id: int
    user_id: int
    register_number: str
    full_name: str
    email: str
    programme_name: str
    batch_name: str
    section_name: str
    class_id: Optional[int] = None
    class_name: Optional[str] = None
    class_code: Optional[str] = None
    allocation_status: str = "NOT_ALLOCATED"
    round1_score: Optional[float] = None
    round2_score: Optional[float] = None
    round3_score: Optional[float] = None
    round4_score: Optional[float] = None
    round5_score: Optional[float] = None
    overall_percentage: Optional[float] = None
    overall_status: str = "Not Started"
    readiness_index: str = "Pending"

class Student360Response(BaseModel):
    student: Dict[str, Any]
    rounds_performance: List[Dict[str, Any]]
    competency_scores: List[CompetencyRadarItem]
    strengths: List[str]
    areas_to_improve: List[str]

class Class360Info(BaseModel):
    id: int
    class_code: str
    name: str
    programme_name: str
    department_name: str
    batch_name: str
    section_name: str
    semester_num: int
    tutor_name: str
    total_enrolled: int

class Class360Kpis(BaseModel):
    total_students: int
    participated_count: int
    participation_rate: float
    class_average_pct: Optional[float] = None
    cleared_all_rounds_count: int
    highest_score: Optional[float] = None
    lowest_score: Optional[float] = None

class ClassRoundSummary(BaseModel):
    round_number: int
    round_title: str
    attempted_count: int
    passed_count: int
    pass_rate: float
    average_score: float

class ClassReadinessDistribution(BaseModel):
    advanced: int = 0
    proficient: int = 0
    developing: int = 0
    beginner: int = 0
    pending: int = 0

class ClassStudentRankingItem(BaseModel):
    student_id: int
    register_number: str
    full_name: str
    round1_score: Optional[float] = None
    round2_score: Optional[float] = None
    round3_score: Optional[float] = None
    round4_score: Optional[float] = None
    overall_percentage: Optional[float] = None
    readiness_index: str

class Class360Response(BaseModel):
    class_info: Class360Info
    kpis: Class360Kpis
    rounds_performance: List[ClassRoundSummary]
    readiness_distribution: ClassReadinessDistribution
    competency_scores: List[CompetencyRadarItem]
    strengths: List[str]
    areas_to_improve: List[str]
    student_rankings: List[ClassStudentRankingItem]

# ==============================================================================
# Sandboxed Code Execution Schemas
# ==============================================================================

class RunCodeRequest(BaseModel):
    question_id: int
    language: str
    source_code: Optional[str] = None
    code: Optional[str] = None

    def get_code(self) -> str:
        return self.source_code or self.code or ""

class CodeTestCaseResult(BaseModel):
    test_case_index: int
    passed: bool
    status_id: Optional[int] = None
    status: Optional[str] = "Unknown"
    input: str = ""
    expected_output: str = ""
    actual_output: Optional[str] = ""
    error_output: Optional[str] = None
    error: Optional[str] = None
    compile_output: Optional[str] = None
    execution_time_ms: float = 0.0
    memory_kb: float = 0.0
    token: Optional[str] = None

class RunCodeResponse(BaseModel):
    status: str
    status_id: Optional[int] = None
    test_cases_passed: int
    total_test_cases: int
    execution_time_ms: float
    memory_kb: Optional[float] = 0.0
    compiler_output: Optional[str] = None
    results: List[CodeTestCaseResult] = []
