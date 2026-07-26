import datetime
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, Float, DateTime, ForeignKey, Enum as SQLEnum, Table, JSON
)
from sqlalchemy.orm import relationship
import enum
from app.database import Base

# Enums
class RoleEnum(str, enum.Enum):
    STUDENT = "Student"
    FACULTY = "Faculty"
    CLASS_TUTOR = "Class Tutor"
    HOD = "HoD"
    ASSESSMENT_COORDINATOR = "Assessment Coordinator"
    ADMINISTRATOR = "Administrator"

class CourseTypeEnum(str, enum.Enum):
    THEORY = "Theory"
    PRACTICAL = "Practical"
    THEORY_PRACTICAL = "Theory + Practical"
    PROJECT = "Project"
    INTERNSHIP = "Internship"
    VALUE_ADDED = "Value Added Course"
    OTHER = "Other"

class DifficultyEnum(str, enum.Enum):
    EASY = "Easy"
    MEDIUM = "Medium"
    HARD = "Hard"

class BloomLevelEnum(str, enum.Enum):
    REMEMBER = "Remember"
    UNDERSTAND = "Understand"
    APPLY = "Apply"
    ANALYZE = "Analyze"
    EVALUATE = "Evaluate"
    CREATE = "Create"

class QuestionTypeEnum(str, enum.Enum):
    MCQ = "Multiple Choice"
    MSQ = "Multiple Select"
    TRUE_FALSE = "True/False"
    FILL_BLANK = "Fill in the Blank"
    SHORT_ANSWER = "Short Answer"
    ESSAY = "Long Answer/Essay"
    NUMERICAL = "Numerical"
    MATCHING = "Matching"
    DESCRIPTIVE = "Descriptive"
    CASE_STUDY = "Case Study"

class ApprovalStatusEnum(str, enum.Enum):
    DRAFT = "Draft"
    SUBMITTED = "Submitted"
    UNDER_REVIEW = "Under Review"
    CHANGES_REQUESTED = "Changes Requested"
    APPROVED = "Approved"
    PUBLISHED = "Published"

class MarkStatusEnum(str, enum.Enum):
    DRAFT = "Draft"
    SUBMITTED = "Submitted"
    VERIFIED = "Verified"
    LOCKED = "Locked"

# Many-to-Many Association Tables
user_roles = Table(
    "user_roles",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("role_id", Integer, ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True)
)

# Models Definition
class Role(Base):
    __tablename__ = "roles"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    description = Column(String(255))
    
    users = relationship("User", secondary=user_roles, back_populates="roles")

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    mobile = Column(String(20), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    roles = relationship("Role", secondary=user_roles, back_populates="users")
    student_profile = relationship("StudentProfile", back_populates="user", uselist=False)
    faculty_profile = relationship("FacultyProfile", back_populates="user", uselist=False)

class School(Base):
    __tablename__ = "schools"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(20), unique=True, nullable=False)
    name = Column(String(150), nullable=False)
    
    departments = relationship("Department", back_populates="school")

class Department(Base):
    __tablename__ = "departments"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(20), unique=True, nullable=False)
    name = Column(String(150), nullable=False)
    school_id = Column(Integer, ForeignKey("schools.id"), nullable=True)
    
    school = relationship("School", back_populates="departments")
    programmes = relationship("Programme", back_populates="department")
    faculty_members = relationship("FacultyProfile", back_populates="department")

class Programme(Base):
    __tablename__ = "programmes"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(20), unique=True, nullable=False)
    name = Column(String(150), nullable=False)
    degree_type = Column(String(50), default="UG") # UG, PG, M.Phil, Ph.D
    department_id = Column(Integer, ForeignKey("departments.id"))
    duration_years = Column(Integer, default=3)
    
    department = relationship("Department", back_populates="programmes")
    courses = relationship("Course", back_populates="programme")
    students = relationship("StudentProfile", back_populates="programme")
    pos = relationship("ProgrammeOutcome", back_populates="programme")
    psos = relationship("ProgrammeSpecificOutcome", back_populates="programme")

class AcademicYear(Base):
    __tablename__ = "academic_years"
    id = Column(Integer, primary_key=True, index=True)
    year_code = Column(String(20), unique=True, nullable=False) # e.g. 2025-2026
    is_current = Column(Boolean, default=True)

class Semester(Base):
    __tablename__ = "semesters"
    id = Column(Integer, primary_key=True, index=True)
    number = Column(Integer, nullable=False) # 1 to 8
    name = Column(String(50), nullable=False) # Semester IV
    academic_year = Column(String(20), nullable=False)

class Batch(Base):
    __tablename__ = "batches"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False) # 2023-2026
    start_year = Column(Integer, nullable=False)
    end_year = Column(Integer, nullable=False)

class Section(Base):
    __tablename__ = "sections"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(10), nullable=False) # A, B, C

class StudentProfile(Base):
    __tablename__ = "students"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    register_number = Column(String(30), unique=True, index=True, nullable=False)
    programme_id = Column(Integer, ForeignKey("programmes.id"))
    batch_name = Column(String(50), nullable=False, default="2023-2026")
    semester_num = Column(Integer, default=4)
    section_name = Column(String(10), default="A")
    status = Column(String(20), default="Active")
    
    user = relationship("User", back_populates="student_profile")
    programme = relationship("Programme", back_populates="students")
    enrolments = relationship("CourseEnrolment", back_populates="student")

class FacultyProfile(Base):
    __tablename__ = "faculty"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    employee_id = Column(String(30), unique=True, index=True, nullable=False)
    designation = Column(String(100), default="Assistant Professor")
    department_id = Column(Integer, ForeignKey("departments.id"))
    status = Column(String(20), default="Active")
    
    user = relationship("User", back_populates="faculty_profile")
    department = relationship("Department", back_populates="faculty_members")
    allocations = relationship("CourseAllocation", back_populates="faculty")

class Course(Base):
    __tablename__ = "courses"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(30), unique=True, index=True, nullable=False)
    title = Column(String(150), nullable=False)
    course_type = Column(String(50), default="Theory") # Theory, Practical, etc.
    credits = Column(Float, default=4.0)
    semester_num = Column(Integer, default=1)
    regulation = Column(String(20), default="2023")
    programme_id = Column(Integer, ForeignKey("programmes.id"))
    
    programme = relationship("Programme", back_populates="courses")
    allocations = relationship("CourseAllocation", back_populates="course")
    cos = relationship("CourseOutcome", back_populates="course")
    questions = relationship("Question", back_populates="course")
    assessments = relationship("Assessment", back_populates="course")

class CourseAllocation(Base):
    __tablename__ = "course_allocations"
    id = Column(Integer, primary_key=True, index=True)
    faculty_id = Column(Integer, ForeignKey("faculty.id"))
    course_id = Column(Integer, ForeignKey("courses.id"))
    academic_year = Column(String(20), default="2025-2026")
    semester_num = Column(Integer, default=4)
    section_name = Column(String(10), default="A")
    batch_name = Column(String(50), default="2023-2026")
    
    faculty = relationship("FacultyProfile", back_populates="allocations")
    course = relationship("Course", back_populates="allocations")

class CourseEnrolment(Base):
    __tablename__ = "course_enrolments"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    course_id = Column(Integer, ForeignKey("courses.id"))
    academic_year = Column(String(20), default="2025-2026")
    
    student = relationship("StudentProfile", back_populates="enrolments")
    course = relationship("Course")

# OBE Models
class ProgrammeOutcome(Base):
    __tablename__ = "programme_outcomes"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(20), nullable=False) # PO1, PO2...
    statement = Column(Text, nullable=False)
    programme_id = Column(Integer, ForeignKey("programmes.id"))
    
    programme = relationship("Programme", back_populates="pos")

class ProgrammeSpecificOutcome(Base):
    __tablename__ = "programme_specific_outcomes"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(20), nullable=False) # PSO1, PSO2...
    statement = Column(Text, nullable=False)
    programme_id = Column(Integer, ForeignKey("programmes.id"))
    
    programme = relationship("Programme", back_populates="psos")

class CourseOutcome(Base):
    __tablename__ = "course_outcomes"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(20), nullable=False) # CO1, CO2...
    statement = Column(Text, nullable=False)
    bloom_level = Column(String(30), default="Apply")
    course_id = Column(Integer, ForeignKey("courses.id"))
    
    course = relationship("Course", back_populates="cos")

class COPOMapping(Base):
    __tablename__ = "co_po_mappings"
    id = Column(Integer, primary_key=True, index=True)
    co_id = Column(Integer, ForeignKey("course_outcomes.id"))
    po_id = Column(Integer, ForeignKey("programme_outcomes.id"))
    weightage = Column(Integer, default=3) # 1=Slight, 2=Moderate, 3=Substantial

class COPSOMapping(Base):
    __tablename__ = "co_pso_mappings"
    id = Column(Integer, primary_key=True, index=True)
    co_id = Column(Integer, ForeignKey("course_outcomes.id"))
    pso_id = Column(Integer, ForeignKey("programme_specific_outcomes.id"))
    weightage = Column(Integer, default=3)

# Question Bank & Papers
class Question(Base):
    __tablename__ = "questions"
    id = Column(Integer, primary_key=True, index=True)
    question_text = Column(Text, nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"))
    unit = Column(Integer, default=1)
    topic = Column(String(100), nullable=True)
    marks = Column(Float, default=2.0)
    difficulty = Column(String(20), default="Medium") # Easy, Medium, Hard
    bloom_level = Column(String(30), default="Understand") # Remember, Understand, Apply, etc.
    question_type = Column(String(30), default="Multiple Choice") # MCQ, MSQ, Descriptive...
    co_id = Column(Integer, ForeignKey("course_outcomes.id"), nullable=True)
    solution_answer = Column(Text, nullable=True)
    keywords = Column(String(255), nullable=True)
    created_by_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    status = Column(String(20), default="Active")
    
    course = relationship("Course", back_populates="questions")
    options = relationship("QuestionOption", back_populates="question", cascade="all, delete-orphan")
    co = relationship("CourseOutcome")

class QuestionOption(Base):
    __tablename__ = "question_options"
    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("questions.id", ondelete="CASCADE"))
    option_text = Column(Text, nullable=False)
    is_correct = Column(Boolean, default=False)
    
    question = relationship("Question", back_populates="options")

class QuestionPaper(Base):
    __tablename__ = "question_papers"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"))
    academic_year = Column(String(20), default="2025-2026")
    max_marks = Column(Float, default=50.0)
    duration_minutes = Column(Integer, default=90)
    created_by_id = Column(Integer, ForeignKey("users.id"))
    status = Column(String(30), default="Draft") # Draft, Submitted, Approved, Published
    blueprint_metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    course = relationship("Course")

class QuestionPaperQuestion(Base):
    __tablename__ = "question_paper_questions"
    id = Column(Integer, primary_key=True, index=True)
    paper_id = Column(Integer, ForeignKey("question_papers.id", ondelete="CASCADE"))
    question_id = Column(Integer, ForeignKey("questions.id"))
    section_name = Column(String(20), default="Section A")
    order_num = Column(Integer, default=1)

# Assessments & Assignments
class Assessment(Base):
    __tablename__ = "assessments"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=False)
    assessment_type = Column(String(50), default="Internal Test 1") # Internal Test, Assignment, Quiz, Practical, Model Exam
    course_id = Column(Integer, ForeignKey("courses.id"))
    max_marks = Column(Float, default=50.0)
    weightage_percent = Column(Float, default=20.0)
    start_time = Column(DateTime, nullable=True)
    end_time = Column(DateTime, nullable=True)
    duration_minutes = Column(Integer, default=60)
    instructions = Column(Text, nullable=True)
    is_online = Column(Boolean, default=True)
    status = Column(String(30), default="Published") # Draft, Published, Completed
    question_paper_id = Column(Integer, ForeignKey("question_papers.id"), nullable=True)
    created_by_id = Column(Integer, ForeignKey("users.id"))
    
    course = relationship("Course", back_populates="assessments")
    attempts = relationship("AssessmentAttempt", back_populates="assessment")

class AssessmentAttempt(Base):
    __tablename__ = "assessment_attempts"
    id = Column(Integer, primary_key=True, index=True)
    assessment_id = Column(Integer, ForeignKey("assessments.id"))
    student_id = Column(Integer, ForeignKey("students.id"))
    start_time = Column(DateTime, default=datetime.datetime.utcnow)
    submit_time = Column(DateTime, nullable=True)
    status = Column(String(20), default="In Progress") # In Progress, Submitted, Evaluated
    total_score = Column(Float, default=0.0)
    malpractice_flagged = Column(Boolean, default=False)
    tab_switch_count = Column(Integer, default=0)
    violation_logs = Column(JSON, nullable=True)
    webcam_enabled = Column(Boolean, default=True)
    webcam_snapshots = Column(JSON, nullable=True)
    
    assessment = relationship("Assessment", back_populates="attempts")
    student = relationship("StudentProfile")
    answers = relationship("StudentAnswer", back_populates="attempt", cascade="all, delete-orphan")

class StudentAnswer(Base):
    __tablename__ = "student_answers"
    id = Column(Integer, primary_key=True, index=True)
    attempt_id = Column(Integer, ForeignKey("assessment_attempts.id", ondelete="CASCADE"))
    question_id = Column(Integer, ForeignKey("questions.id"))
    selected_option_id = Column(Integer, ForeignKey("question_options.id"), nullable=True)
    descriptive_text = Column(Text, nullable=True)
    marks_awarded = Column(Float, default=0.0)
    evaluator_feedback = Column(Text, nullable=True)
    is_marked_for_review = Column(Boolean, default=False)
    
    attempt = relationship("AssessmentAttempt", back_populates="answers")
    question = relationship("Question")

class Assignment(Base):
    __tablename__ = "assignments"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    course_id = Column(Integer, ForeignKey("courses.id"))
    max_marks = Column(Float, default=10.0)
    due_date = Column(DateTime, nullable=False)
    allow_late_submission = Column(Boolean, default=False)
    rubric_id = Column(Integer, ForeignKey("rubrics.id"), nullable=True)
    created_by_id = Column(Integer, ForeignKey("users.id"))
    
    course = relationship("Course")

class AssignmentSubmission(Base):
    __tablename__ = "assignment_submissions"
    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("assignments.id"))
    student_id = Column(Integer, ForeignKey("students.id"))
    submission_text = Column(Text, nullable=True)
    file_path = Column(String(255), nullable=True)
    submitted_at = Column(DateTime, default=datetime.datetime.utcnow)
    is_late = Column(Boolean, default=False)
    marks_awarded = Column(Float, nullable=True)
    feedback = Column(Text, nullable=True)
    rubric_evaluation = Column(JSON, nullable=True)
    status = Column(String(30), default="Submitted") # Submitted, Evaluated

class Rubric(Base):
    __tablename__ = "rubrics"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    created_by_id = Column(Integer, ForeignKey("users.id"))
    
    criteria = relationship("RubricCriteria", back_populates="rubric", cascade="all, delete-orphan")

class RubricCriteria(Base):
    __tablename__ = "rubric_criteria"
    id = Column(Integer, primary_key=True, index=True)
    rubric_id = Column(Integer, ForeignKey("rubrics.id", ondelete="CASCADE"))
    criterion_name = Column(String(100), nullable=False)
    max_marks = Column(Float, default=5.0)
    weightage = Column(Float, default=1.0)
    co_id = Column(Integer, ForeignKey("course_outcomes.id"), nullable=True)
    
    rubric = relationship("Rubric", back_populates="criteria")
    levels = relationship("RubricLevel", back_populates="criteria", cascade="all, delete-orphan")

class RubricLevel(Base):
    __tablename__ = "rubric_levels"
    id = Column(Integer, primary_key=True, index=True)
    criteria_id = Column(Integer, ForeignKey("rubric_criteria.id", ondelete="CASCADE"))
    level_name = Column(String(50), nullable=False) # Excellent, Good, Satisfactory, Needs Improvement
    description = Column(Text, nullable=True)
    marks = Column(Float, default=5.0)
    
    criteria = relationship("RubricCriteria", back_populates="levels")

# Marks & Results
class Mark(Base):
    __tablename__ = "marks"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    course_id = Column(Integer, ForeignKey("courses.id"))
    assessment_id = Column(Integer, ForeignKey("assessments.id"))
    marks_obtained = Column(Float, default=0.0)
    is_absent = Column(Boolean, default=False)
    is_exempted = Column(Boolean, default=False)
    remarks = Column(String(255), nullable=True)
    status = Column(String(20), default="Draft") # Draft, Submitted, Verified, Locked
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class Result(Base):
    __tablename__ = "results"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    course_id = Column(Integer, ForeignKey("courses.id"))
    academic_year = Column(String(20), default="2025-2026")
    semester_num = Column(Integer, default=4)
    cia_score = Column(Float, default=0.0) # Continuous Internal Assessment Total (out of 50 or 100)
    cia_max = Column(Float, default=50.0)
    percentage = Column(Float, default=0.0)
    status = Column(String(20), default="Pass") # Pass, Fail, Re-appear
    is_published = Column(Boolean, default=False)
    published_at = Column(DateTime, nullable=True)

# System & Audit
class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(30), default="info") # info, alert, success, warning
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class ApprovalWorkflow(Base):
    __tablename__ = "approval_workflows"
    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(String(50), nullable=False) # QuestionPaper, Result, Marks
    entity_id = Column(Integer, nullable=False)
    current_status = Column(String(30), default="Submitted")
    submitted_by_id = Column(Integer, ForeignKey("users.id"))
    reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class ApprovalHistory(Base):
    __tablename__ = "approval_history"
    id = Column(Integer, primary_key=True, index=True)
    workflow_id = Column(Integer, ForeignKey("approval_workflows.id"))
    action = Column(String(50), nullable=False) # Approved, Rejected, Changes Requested
    comments = Column(Text, nullable=True)
    acted_by_id = Column(Integer, ForeignKey("users.id"))
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(100), nullable=False) # MARKS_EDIT, RESULT_PUBLISH, etc.
    module = Column(String(50), nullable=False) # Marks, Results, QB, Auth
    record_id = Column(String(50), nullable=True)
    old_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)
    ip_address = Column(String(50), default="127.0.0.1")
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
