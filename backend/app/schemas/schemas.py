from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime

# Auth Schemas
class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    username: str
    full_name: str
    roles: List[str]
    student_id: Optional[int] = None
    faculty_id: Optional[int] = None

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: str
    mobile: Optional[str] = None
    is_active: bool
    roles: List[str]

    class Config:
        from_attributes = True

# Master Data Schemas
class SchoolCreate(BaseModel):
    code: str
    name: str

class DepartmentCreate(BaseModel):
    code: str
    name: str
    school_id: Optional[int] = None

class ProgrammeCreate(BaseModel):
    code: str
    name: str
    degree_type: str = "UG"
    department_id: int
    duration_years: int = 3

class CourseCreate(BaseModel):
    code: str
    title: str
    course_type: str = "Theory"
    credits: float = 4.0
    semester_num: int = 1
    regulation: str = "2023"
    programme_id: int

class AllocationCreate(BaseModel):
    faculty_id: int
    course_id: int
    academic_year: str = "2025-2026"
    semester_num: int = 4
    section_name: str = "A"
    batch_name: str = "2023-2026"

# Question Schemas
class QuestionOptionSchema(BaseModel):
    id: Optional[int] = None
    option_text: str
    is_correct: bool = False

class QuestionCreate(BaseModel):
    question_text: str
    course_id: int
    unit: int = 1
    topic: Optional[str] = None
    marks: float = 2.0
    difficulty: str = "Medium"
    bloom_level: str = "Understand"
    question_type: str = "Multiple Choice"
    co_id: Optional[int] = None
    solution_answer: Optional[str] = None
    keywords: Optional[str] = None
    options: Optional[List[QuestionOptionSchema]] = []

# Question Paper & Blueprint Schemas
class PaperGenerateRule(BaseModel):
    course_id: int
    title: str
    max_marks: float = 50.0
    duration_minutes: int = 90
    unit_distribution: Dict[int, int] # e.g. {1: 5, 2: 5} -> 5 questions from unit 1, 5 from unit 2
    target_bloom_percent: Optional[Dict[str, float]] = None # e.g. {"Apply": 30.0}

# Assessment Schemas
class AssessmentCreate(BaseModel):
    title: str
    assessment_type: str = "Internal Test 1"
    course_id: int
    max_marks: float = 50.0
    weightage_percent: float = 20.0
    duration_minutes: int = 60
    instructions: Optional[str] = None
    is_online: bool = True
    question_paper_id: Optional[int] = None

class SubmitAnswerSchema(BaseModel):
    question_id: int
    selected_option_id: Optional[int] = None
    descriptive_text: Optional[str] = None
    is_marked_for_review: bool = False

class SubmitAttemptRequest(BaseModel):
    attempt_id: int
    answers: List[SubmitAnswerSchema]

# Mark Entry Schema
class MarkEntrySchema(BaseModel):
    student_id: int
    marks_obtained: float
    is_absent: bool = False
    is_exempted: bool = False
    remarks: Optional[str] = None

class BatchMarkEntryRequest(BaseModel):
    assessment_id: int
    course_id: int
    marks: List[MarkEntrySchema]
    status: str = "Submitted" # Draft, Submitted, Verified, Locked

# Result Publication Schema
class PublishResultsRequest(BaseModel):
    course_id: int
    academic_year: str = "2025-2026"
    semester_num: int = 4
