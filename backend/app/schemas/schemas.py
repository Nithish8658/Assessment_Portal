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
    assigned_class_name: Optional[str] = None
    assigned_class_code: Optional[str] = None
    assigned_programme_name: Optional[str] = None
    assigned_programme_code: Optional[str] = None
    assigned_batch: Optional[str] = None
    assigned_section: Optional[str] = None
    assigned_department_name: Optional[str] = None
    assigned_department_id: Optional[int] = None

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: str
    mobile: Optional[str] = None
    is_active: bool
    roles: List[str]
    student_id: Optional[int] = None
    faculty_id: Optional[int] = None
    assigned_class_name: Optional[str] = None
    assigned_class_code: Optional[str] = None
    assigned_programme_name: Optional[str] = None
    assigned_programme_code: Optional[str] = None
    assigned_batch: Optional[str] = None
    assigned_section: Optional[str] = None
    assigned_department_name: Optional[str] = None
    assigned_department_id: Optional[int] = None

    class Config:
        from_attributes = True

# Master Data Schemas (Block 1 Core)
class SchoolCreate(BaseModel):
    code: str
    name: str

class DepartmentCreate(BaseModel):
    code: str
    name: str
    school_id: Optional[int] = None
    hod_id: Optional[int] = None

class ProgrammeCreate(BaseModel):
    code: str
    name: str
    degree_type: str = "UG"
    department_id: int
    duration_years: int = 3

class ClassCreate(BaseModel):
    class_code: str
    name: str
    programme_id: int
    batch_name: str = "2023-2026"
    semester_num: int = 4
    section_name: str = "A"
    tutor_id: Optional[int] = None

class CourseCreate(BaseModel):
    code: str
    title: str
    course_type: str = "Theory"
    credits: float = 4.0
    semester_num: int = 1
    regulation: str = "2023"
    programme_id: int
    faculty_id: Optional[int] = None

class AllocationCreate(BaseModel):
    faculty_id: int
    course_id: int
    academic_year: str = "2025-2026"
    semester_num: int = 4
    section_name: str = "A"
    batch_name: str = "2023-2026"
