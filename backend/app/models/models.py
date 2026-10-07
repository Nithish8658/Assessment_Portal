import datetime
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, Float, DateTime, ForeignKey, Table, JSON, Index
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
    ERP_COORDINATOR = "ERP Coordinator"
    ADMINISTRATOR = "Administrator"

class CourseTypeEnum(str, enum.Enum):
    THEORY = "Theory"
    PRACTICAL = "Practical"
    THEORY_PRACTICAL = "Theory + Practical"
    PROJECT = "Project"
    INTERNSHIP = "Internship"
    VALUE_ADDED = "Value Added Course"
    OTHER = "Other"

# Many-to-Many Association Table for User Roles
user_roles = Table(
    "user_roles",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("role_id", Integer, ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True)
)

# Core Models Definition (Block 1: Academic Master & Student Setup)
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
    hod_id = Column(Integer, ForeignKey("faculty.id", use_alter=True, name="fk_departments_hod_id"), nullable=True)
    
    school = relationship("School", back_populates="departments")
    hod = relationship("FacultyProfile", foreign_keys=[hod_id])
    programmes = relationship("Programme", back_populates="department")
    faculty_members = relationship("FacultyProfile", foreign_keys="FacultyProfile.department_id", back_populates="department")

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
    classes = relationship("AcademicClass", back_populates="programme")

class AcademicClass(Base):
    __tablename__ = "academic_classes"
    id = Column(Integer, primary_key=True, index=True)
    class_code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    programme_id = Column(Integer, ForeignKey("programmes.id"))
    batch_name = Column(String(50), nullable=False, default="2023-2026")
    semester_num = Column(Integer, default=4)
    section_name = Column(String(10), default="A")
    tutor_id = Column(Integer, ForeignKey("faculty.id"), nullable=True)
    
    __table_args__ = (
        Index("ix_academic_classes_prog_batch_sec", "programme_id", "batch_name", "section_name"),
    )
    programme = relationship("Programme", back_populates="classes")
    tutor = relationship("FacultyProfile")

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
    initial_password = Column(String(100), nullable=True)
    status = Column(String(20), default="Active")
    
    __table_args__ = (
        Index("ix_students_prog_batch_sec", "programme_id", "batch_name", "section_name"),
    )
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
    assigned_programme_id = Column(Integer, ForeignKey("programmes.id", use_alter=True, name="fk_faculty_assigned_programme_id"), nullable=True)
    assigned_batch = Column(String(50), nullable=True)
    assigned_section = Column(String(10), nullable=True)
    
    __table_args__ = (
        Index("ix_faculty_dept", "department_id"),
        Index("ix_faculty_assigned_prog", "assigned_programme_id"),
    )
    user = relationship("User", back_populates="faculty_profile")
    department = relationship("Department", foreign_keys=[department_id], back_populates="faculty_members")
    assigned_programme = relationship("Programme", foreign_keys=[assigned_programme_id])
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
    
    __table_args__ = (
        Index("ix_courses_prog", "programme_id"),
    )
    programme = relationship("Programme", back_populates="courses")
    allocations = relationship("CourseAllocation", back_populates="course")
    enrolments = relationship("CourseEnrolment", back_populates="course")

class CourseAllocation(Base):
    __tablename__ = "course_allocations"
    id = Column(Integer, primary_key=True, index=True)
    faculty_id = Column(Integer, ForeignKey("faculty.id"))
    course_id = Column(Integer, ForeignKey("courses.id"))
    academic_year = Column(String(20), default="2025-2026")
    semester_num = Column(Integer, default=4)
    section_name = Column(String(10), default="A")
    batch_name = Column(String(50), default="2023-2026")
    
    __table_args__ = (
        Index("ix_course_allocations_fac_crs", "faculty_id", "course_id"),
    )
    faculty = relationship("FacultyProfile", back_populates="allocations")
    course = relationship("Course", back_populates="allocations")

class CourseEnrolment(Base):
    __tablename__ = "course_enrolments"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    course_id = Column(Integer, ForeignKey("courses.id"))
    academic_year = Column(String(20), default="2025-2026")
    
    student = relationship("StudentProfile", back_populates="enrolments")
    course = relationship("Course", back_populates="enrolments")

class RosterApprovalBatch(Base):
    __tablename__ = "roster_approval_batches"
    id = Column(Integer, primary_key=True, index=True)
    tutor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    programme_id = Column(Integer, ForeignKey("programmes.id"), nullable=False)
    section_name = Column(String(10), default="A")
    batch_name = Column(String(50), default="2023-2026")
    semester_num = Column(Integer, default=4)
    file_name = Column(String(255), nullable=True)
    status = Column(String(30), default="Pending") # Pending, Approved, Rejected
    staged_data = Column(JSON, nullable=False)
    rejection_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    approved_at = Column(DateTime, nullable=True)
    approved_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    tutor = relationship("User", foreign_keys=[tutor_id])
    programme = relationship("Programme")
    approved_by = relationship("User", foreign_keys=[approved_by_id])

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(100), nullable=False)
    module = Column(String(50), nullable=False)
    record_id = Column(String(50), nullable=True)
    old_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)
    ip_address = Column(String(50), default="127.0.0.1")
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(30), default="info") # info, alert, success, warning
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
