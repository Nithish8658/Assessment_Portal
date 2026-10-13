import datetime
import random
from concurrent.futures import ThreadPoolExecutor
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified
from typing import List, Optional
import io
import re
import csv
from app.database import get_db
from app.models.models import User, Role, StudentProfile, FacultyProfile, Department, Programme, Course, CourseEnrolment, RosterApprovalBatch, CourseAllocation, AcademicClass
from app.schemas.schemas import UserResponse
from app.auth.jwt import get_password_hash, get_current_user, require_roles
from app.services.audit import record_audit


def _default_batch(db) -> Optional[str]:
    """Current first-year batch from the Academic Calendar (used when a form omits the batch)."""
    from app.services.academic_calendar import default_batch
    return default_batch(db)


def _semester_for(db, batch_name: Optional[str]) -> Optional[int]:
    from app.services.academic_calendar import semester_for_batch
    return semester_for_batch(db, batch_name)


def _current_year_code(db) -> str:
    """Academic year stamped on new allocations/enrolments: from the Academic Calendar settings."""
    from app.config import CURRENT_ACADEMIC_YEAR
    from app.services.academic_calendar import current_academic_year_code
    return current_academic_year_code(db, CURRENT_ACADEMIC_YEAR)

router = APIRouter(prefix="/api/v1/users", tags=["User Management"])

def get_user_department_id(user: User) -> Optional[int]:
    """Helper to determine the department_id associated with a non-admin user."""
    if not user:
        return None
    user_roles = [r.name for r in user.roles]
    if "Administrator" in user_roles:
        return None  # Administrator operates across all departments
    
    if user.faculty_profile and user.faculty_profile.department_id:
        return user.faculty_profile.department_id
    if user.student_profile and user.student_profile.programme and user.student_profile.programme.department_id:
        return user.student_profile.programme.department_id
    return None

STAFF_ROLES = {"Administrator", "HoD", "Class Tutor", "Assessment Coordinator", "ERP Coordinator"}


def _roles(user: User) -> set:
    return {r.name for r in user.roles}


def _require_staff(user: User) -> None:
    if not _roles(user) & STAFF_ROLES:
        raise HTTPException(status_code=403, detail="Staff access required.")


def _check_roster_access(user: User, batch, approve: bool = False) -> None:
    """Tutors: only their own batches (and never approve). HoD: own department. Admin: all."""
    roles = _roles(user)
    if "Administrator" in roles:
        return
    if "HoD" in roles:
        batch_dept = batch.programme.department_id if getattr(batch, "programme", None) else None
        if batch_dept and get_user_department_id(user) != batch_dept:
            raise HTTPException(status_code=403, detail="This roster belongs to another department.")
        return
    if approve:
        raise HTTPException(status_code=403, detail="Only an HoD or Administrator can approve or reject rosters.")
    if "Class Tutor" in roles and batch.tutor_id == user.id:
        return
    raise HTTPException(status_code=403, detail="You can only manage your own roster uploads.")


@router.get("", response_model=List[UserResponse])
def get_users(role: Optional[str] = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _require_staff(current_user)
    query = db.query(User)
    if role:
        query = query.join(User.roles).filter(Role.name == role)
    users = query.all()
    res = []
    for u in users:
        res.append(UserResponse(
            id=u.id,
            username=u.username,
            email=u.email,
            full_name=u.full_name,
            mobile=u.mobile,
            is_active=u.is_active,
            roles=[r.name for r in u.roles]
        ))
    return res

@router.get("/students")
def get_students(
    programme_id: Optional[int] = None,
    department_id: Optional[int] = None,
    batch_name: Optional[str] = None,
    section_name: Optional[str] = None,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(StudentProfile)
    
    # Scoped filtering based on current user role
    user_roles = [r.name for r in current_user.roles] if current_user else []
    if "HoD" in user_roles:
        dept_id = get_user_department_id(current_user)
        if dept_id:
            query = query.join(StudentProfile.programme).filter(Programme.department_id == dept_id)
    elif "Class Tutor" in user_roles:
        fp = current_user.faculty_profile
        if fp and fp.assigned_programme_id:
            query = query.filter(
                StudentProfile.programme_id == fp.assigned_programme_id,
                StudentProfile.batch_name == fp.assigned_batch,
                StudentProfile.section_name == fp.assigned_section
            )
            
    if department_id and "HoD" not in user_roles:
        query = query.join(StudentProfile.programme).filter(Programme.department_id == department_id)
    if programme_id and "Class Tutor" not in user_roles:
        query = query.filter(StudentProfile.programme_id == programme_id)
    if batch_name and "Class Tutor" not in user_roles:
        query = query.filter(StudentProfile.batch_name == batch_name)
    if section_name and "Class Tutor" not in user_roles:
        query = query.filter(StudentProfile.section_name == section_name)
    students = query.all()
    res = []
    for s in students:
        full_name = s.user.full_name if s.user else "N/A"
        email = s.user.email if s.user else "N/A"
        if search:
            s_str = f"{s.register_number} {full_name} {email} {s.batch_name}".lower()
            if search.lower() not in s_str:
                continue
        res.append({
            "id": s.id,
            "user_id": s.user_id,
            "register_number": s.register_number,
            "full_name": full_name,
            "email": email,
            "programme_name": s.programme.name if s.programme else "N/A",
            "programme_code": s.programme.code if s.programme else "N/A",
            "batch_name": s.batch_name,
            "semester_num": s.semester_num,
            "section_name": s.section_name,
            "allocated_password": s.initial_password or "student123",
            "status": s.status
        })
    return res

@router.get("/faculty")
def get_faculty_members(
    department_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(FacultyProfile)
    
    # Scoped filtering based on current user role
    user_roles = [r.name for r in current_user.roles] if current_user else []
    if "HoD" in user_roles:
        dept_id = get_user_department_id(current_user)
        if dept_id:
            query = query.filter(FacultyProfile.department_id == dept_id)
    elif "Class Tutor" in user_roles:
        fp = current_user.faculty_profile
        if fp:
            query = query.filter(FacultyProfile.department_id == fp.department_id)
            
    if department_id and "HoD" not in user_roles:
        query = query.filter(FacultyProfile.department_id == department_id)
    faculties = query.all()
    res = []
    for f in faculties:
        alloc_courses = [f"{a.course.code} ({a.course.title})" for a in f.allocations if a.course]
        assigned_prog_name = f.assigned_programme.name if f.assigned_programme else None
        assigned_prog_code = f.assigned_programme.code if f.assigned_programme else None
        
        assigned_class = None
        assigned_sem = None
        if f.assigned_programme_id:
            ac = db.query(AcademicClass).filter(
                AcademicClass.programme_id == f.assigned_programme_id,
                AcademicClass.batch_name == f.assigned_batch,
                AcademicClass.section_name == f.assigned_section
            ).first()
            if ac and ac.semester_num:
                assigned_sem = ac.semester_num
            else:
                batch = f.assigned_batch or "2025-2028"
                if "2026" in batch:
                    assigned_sem = 1
                elif "2025" in batch:
                    assigned_sem = 3
                elif "2024" in batch:
                    assigned_sem = 5
                else:
                    assigned_sem = 1

        if assigned_prog_code:
            sem_str = f" • Sem {assigned_sem}" if assigned_sem else ""
            assigned_class = f"{assigned_prog_code} — {f.assigned_batch or '2025-2028'} (Sec {f.assigned_section or 'A'}{sem_str})"
        elif f.assigned_section:
            sem_str = f" • Sem {assigned_sem}" if assigned_sem else ""
            assigned_class = f"Sec {f.assigned_section}{sem_str}"

        res.append({
            "id": f.id,
            "user_id": f.user_id,
            "employee_id": f.employee_id,
            "full_name": f.user.full_name if f.user else "N/A",
            "email": f.user.email if f.user else "N/A",
            "designation": f.designation,
            "department_name": f.department.name if f.department else "N/A",
            "department_id": f.department_id,
            "status": f.status,
            "allocated_courses": alloc_courses,
            "assigned_programme_id": f.assigned_programme_id,
            "assigned_programme_code": assigned_prog_code,
            "assigned_programme_name": assigned_prog_name,
            "assigned_batch": f.assigned_batch,
            "assigned_section": f.assigned_section,
            "assigned_semester_num": assigned_sem,
            "assigned_class_display": assigned_class
        })
    return res

@router.post("/bulk-import")
async def bulk_import_users(
    user_type: str, # student or faculty
    file: UploadFile = File(...),
    current_user: User = Depends(require_roles(["Administrator", "HoD"])),
    db: Session = Depends(get_db)
):
    contents = await file.read()
    decoded = contents.decode("utf-8")
    csv_reader = csv.DictReader(io.StringIO(decoded))
    
    count = 0
    errors = []
    for row in csv_reader:
        try:
            username = row.get("username", "").strip()
            email = row.get("email", "").strip()
            full_name = row.get("full_name", "").strip()
            mobile = row.get("mobile", "9876543210").strip()
            prog_code = row.get("programme_code", "23BCA").strip()
            batch = (row.get("batch") or "").strip() or (_default_batch(db) or "")
            sec = row.get("section", "A").strip()
            
            if not username or not email or not full_name:
                continue

            if db.query(User).filter(User.username == username).first():
                continue

            user = User(
                username=username,
                email=email,
                full_name=full_name,
                mobile=mobile,
                hashed_password=get_password_hash("student123" if user_type == "student" else "faculty123"),
                is_active=True
            )
            db.add(user)
            db.flush()

            role_name = "Student" if user_type == "student" else "Faculty"
            role = db.query(Role).filter(Role.name == role_name).first()
            if role:
                user.roles.append(role)

            if user_type == "student":
                prog = db.query(Programme).filter(Programme.code == prog_code).first()
                sp = StudentProfile(
                    user_id=user.id,
                    register_number=username,
                    programme_id=prog.id if prog else 1,
                    batch_name=batch,
                    semester_num=4,
                    section_name=sec,
                    initial_password="student123"
                )
                db.add(sp)
            else:
                fp = FacultyProfile(
                    user_id=user.id,
                    employee_id=username,
                    designation="Assistant Professor",
                    department_id=1
                )
                db.add(fp)

            count += 1
        except Exception as e:
            errors.append(f"Row {username}: {str(e)}")

    db.commit()
    return {"message": f"Successfully imported {count} {user_type} records.", "errors": errors}

from pydantic import BaseModel

class UserCreateRequest(BaseModel):
    username: str
    email: str
    full_name: str
    mobile: Optional[str] = "9876543210"
    password: Optional[str] = "password123"
    role_name: str # Student, Faculty, Class Tutor, Assessment Coordinator, ERP Coordinator, HoD, Administrator
    register_number_or_emp_id: Optional[str] = None
    programme_code: Optional[str] = "23BCA"
    programme_id: Optional[int] = None
    department_code: Optional[str] = "CS"
    department_id: Optional[int] = None
    section_name: Optional[str] = "A"
    batch_name: Optional[str] = None
    designation: Optional[str] = "Assistant Professor"
    assigned_programme_id: Optional[int] = None
    assigned_batch: Optional[str] = "2025-2028"
    assigned_section: Optional[str] = "A"
    course_id: Optional[int] = None
    semester_num: Optional[int] = None

class UserUpdateRequest(BaseModel):
    email: Optional[str] = None
    full_name: Optional[str] = None
    mobile: Optional[str] = None
    password: Optional[str] = None
    role_name: Optional[str] = None
    is_active: Optional[bool] = None
    register_number_or_emp_id: Optional[str] = None
    programme_code: Optional[str] = None
    programme_id: Optional[int] = None
    department_code: Optional[str] = None
    department_id: Optional[int] = None
    section_name: Optional[str] = None
    batch_name: Optional[str] = None
    designation: Optional[str] = None
    assigned_programme_id: Optional[int] = None
    assigned_batch: Optional[str] = None
    assigned_section: Optional[str] = None
    semester_num: Optional[int] = None

@router.post("")
def create_user(
    req: UserCreateRequest,
    current_user: User = Depends(require_roles(["Administrator", "HoD", "Class Tutor", "ERP Coordinator", "Assessment Coordinator"])),
    db: Session = Depends(get_db)
):
    user_role_names = [r.name for r in current_user.roles]
    is_admin = "Administrator" in user_role_names
    is_hod = "HoD" in user_role_names
    is_tutor = "Class Tutor" in user_role_names

    # Authorization checks on target role:
    if not is_admin and not is_hod:
        # Class Tutor and ERP Coordinators can ONLY create Student and Faculty
        if req.role_name not in ["Student", "Faculty"]:
            raise HTTPException(
                status_code=403,
                detail=f"Class Tutors and ERP Coordinators are only authorized to create Student and Faculty accounts. Creating '{req.role_name}' accounts is restricted to Administrators and HoDs."
            )

    if not is_admin and req.role_name in ["Administrator", "HoD", "ERP Coordinator", "Assessment Coordinator"]:
        raise HTTPException(
            status_code=403,
            detail=f"Creating '{req.role_name}' accounts is restricted to System Administrators."
        )

    # Scoped validation checks for HOD & Class Tutor
    if not is_admin:
        if is_hod:
            if req.role_name == "Student":
                raise HTTPException(
                    status_code=403,
                    detail="Student user creation is not permitted for HoD accounts. Student candidate onboarding is handled exclusively by the designated Class Tutor."
                )
            dept_id = get_user_department_id(current_user)
            target_dept_id = req.department_id
            if not target_dept_id and req.department_code:
                dept = db.query(Department).filter(Department.code == req.department_code).first()
                if dept:
                    target_dept_id = dept.id
            if target_dept_id and target_dept_id != dept_id:
                raise HTTPException(status_code=403, detail="As HOD, you can only create faculty profiles within your department.")
        
        elif is_tutor:
            if req.role_name != "Student":
                raise HTTPException(status_code=403, detail="As Class Tutor, you can only create student profiles.")
            fp = current_user.faculty_profile
            if fp:
                prog_id = req.programme_id
                if not prog_id and req.programme_code:
                    prog = db.query(Programme).filter(Programme.code == req.programme_code).first()
                    if prog:
                        prog_id = prog.id
                if prog_id != fp.assigned_programme_id or req.batch_name != fp.assigned_batch or req.section_name != fp.assigned_section:
                    raise HTTPException(status_code=403, detail="As Class Tutor, you can only create students belonging to your assigned class.")

    existing = db.query(User).filter(User.username == req.username).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Username/Register No '{req.username}' already exists")

    existing_email = db.query(User).filter(User.email == req.email).first()
    if existing_email:
        raise HTTPException(
            status_code=400,
            detail=f"Email address '{req.email}' is already registered to user '{existing_email.full_name}' (ID: {existing_email.username}). Please specify a unique email address."
        )

    user = User(
        username=req.username,
        email=req.email,
        full_name=req.full_name,
        mobile=req.mobile or "9876543210",
        hashed_password=get_password_hash(req.password or "password123"),
        is_active=True
    )
    db.add(user)
    db.flush()

    role = db.query(Role).filter(Role.name == req.role_name).first()
    if role:
        user.roles.append(role)

    if req.role_name == "Student":
        prog_id = req.programme_id
        if not prog_id and req.programme_code:
            prog = db.query(Programme).filter(Programme.code == req.programme_code).first()
            if prog:
                prog_id = prog.id
        
        sem_num = req.semester_num
        if not sem_num:
            batch = req.batch_name or "2025-2028"
            if "2026" in batch:
                sem_num = 1
            elif "2025" in batch:
                sem_num = 3
            elif "2024" in batch:
                sem_num = 5
            else:
                sem_num = 1

        sp = StudentProfile(
            user_id=user.id,
            register_number=req.register_number_or_emp_id or req.username,
            programme_id=prog_id or 1,
            batch_name=req.batch_name or "2025-2028",
            semester_num=sem_num,
            section_name=req.section_name or "A",
            initial_password=req.password or "student123"
        )
        db.add(sp)
    else:
        dept_id = req.department_id
        if req.course_id:
            c_obj = db.query(Course).filter(Course.id == req.course_id).first()
            if c_obj and c_obj.programme and c_obj.programme.department_id:
                dept_id = c_obj.programme.department_id

        if not dept_id and req.department_code:
            dept = db.query(Department).filter(Department.code == req.department_code).first()
            if dept:
                dept_id = dept.id
        if not dept_id:
            dept_id = 1

        assigned_prog_id = req.assigned_programme_id or req.programme_id
        if not assigned_prog_id and req.programme_code:
            prog = db.query(Programme).filter(Programme.code == req.programme_code).first()
            if prog:
                assigned_prog_id = prog.id

        is_tutor = req.role_name == "Class Tutor"
        tutor_prog_id = assigned_prog_id
        tutor_batch = req.assigned_batch or req.batch_name or _default_batch(db)
        tutor_section = req.assigned_section or req.section_name or "A"

        if is_tutor:
            if not tutor_prog_id:
                raise HTTPException(
                    status_code=400,
                    detail="Please select an assigned Degree Programme for the Class Tutor."
                )

            # Prevent duplicate Class Tutor assignment for the same class
            existing_tutor = db.query(FacultyProfile).filter(
                FacultyProfile.designation == "Class Tutor",
                FacultyProfile.assigned_programme_id == tutor_prog_id,
                FacultyProfile.assigned_batch == tutor_batch,
                FacultyProfile.assigned_section == tutor_section,
                FacultyProfile.status == "Active"
            ).first()

            if existing_tutor:
                prog_name = existing_tutor.assigned_programme.name if existing_tutor.assigned_programme else f"Programme #{tutor_prog_id}"
                tutor_name = existing_tutor.user.full_name if existing_tutor.user else existing_tutor.employee_id
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Duplicate Tutor Assignment Conflict: Faculty '{tutor_name}' (ID: {existing_tutor.employee_id}) "
                        f"is already assigned as Class Tutor for {prog_name} — Batch {tutor_batch} (Sec {tutor_section}). "
                        "A single class cannot have two tutors assigned. Please edit or reassign the existing tutor first."
                    )
                )

            # Also check if an AcademicClass exists that already has a tutor
            matching_class = db.query(AcademicClass).filter(
                AcademicClass.programme_id == tutor_prog_id,
                AcademicClass.batch_name == tutor_batch,
                AcademicClass.section_name == tutor_section
            ).first()
            if matching_class and matching_class.tutor_id:
                existing_class_tutor = db.query(FacultyProfile).filter(FacultyProfile.id == matching_class.tutor_id).first()
                if existing_class_tutor:
                    tutor_name = existing_class_tutor.user.full_name if existing_class_tutor.user else existing_class_tutor.employee_id
                    raise HTTPException(
                        status_code=400,
                        detail=(
                            f"Duplicate Tutor Assignment Conflict: Academic Class '{matching_class.class_code}' "
                            f"already has an assigned tutor: '{tutor_name}' (ID: {existing_class_tutor.employee_id}). "
                            "A single class cannot have two tutors."
                        )
                    )

        if req.role_name in ["HoD", "Head of Department (HoD)"]:
            designation_str = "Head of Department (HoD)"
        elif req.role_name in ["ERP Coordinator", "Assessment Coordinator", "Administrator", "Class Tutor"]:
            designation_str = req.role_name
        else:
            designation_str = req.designation or "Assistant Professor"

        fp = FacultyProfile(
            user_id=user.id,
            employee_id=req.register_number_or_emp_id or req.username,
            designation=designation_str,
            department_id=dept_id,
            assigned_programme_id=tutor_prog_id if is_tutor else None,
            assigned_batch=tutor_batch if is_tutor else None,
            assigned_section=tutor_section if is_tutor else None
        )
        db.add(fp)
        db.flush()

        if is_tutor and tutor_prog_id:
            # Sync with AcademicClass
            ac_class = db.query(AcademicClass).filter(
                AcademicClass.programme_id == tutor_prog_id,
                AcademicClass.batch_name == tutor_batch,
                AcademicClass.section_name == tutor_section
            ).first()
            if ac_class:
                ac_class.tutor_id = fp.id

        # If a target course was specified, create allocation for the faculty
        if req.course_id and not is_tutor:
            c_obj = db.query(Course).filter(Course.id == req.course_id).first()
            if c_obj:
                alloc_batch = req.batch_name or (current_user.faculty_profile.assigned_batch if current_user.faculty_profile and current_user.faculty_profile.assigned_batch else "2025-2028")
                alloc_sec = req.section_name or (current_user.faculty_profile.assigned_section if current_user.faculty_profile and current_user.faculty_profile.assigned_section else "A")
                alloc = CourseAllocation(
                    faculty_id=fp.id,
                    course_id=c_obj.id,
                    academic_year=_current_year_code(db),
                    semester_num=c_obj.semester_num or 4,
                    section_name=alloc_sec,
                    batch_name=alloc_batch
                )
                db.add(alloc)

        if is_tutor and fp.assigned_programme_id:
            ac_class = db.query(AcademicClass).filter(
                AcademicClass.programme_id == fp.assigned_programme_id,
                AcademicClass.batch_name == fp.assigned_batch,
                AcademicClass.section_name == fp.assigned_section
            ).first()
            if ac_class:
                ac_class.tutor_id = fp.id

    db.flush()
    record_audit(db, current_user, "USER_CREATED", "USERS", user.id, None,
                 {"username": user.username, "full_name": user.full_name, "roles": [r.name for r in user.roles]})
    db.commit()
    db.refresh(user)
    return {"message": "User created successfully", "user_id": user.id}

@router.put("/{id}")
def update_user_details(
    id: int,
    req: UserUpdateRequest,
    current_user: User = Depends(require_roles(["Administrator", "HoD", "Class Tutor"])),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user_roles = [r.name for r in current_user.roles]
    if "Administrator" not in user_roles:
        # Check HOD limit
        if "HoD" in user_roles:
            dept_id = get_user_department_id(current_user)
            target_dept_id = None
            if user.faculty_profile:
                target_dept_id = user.faculty_profile.department_id
            elif user.student_profile and user.student_profile.programme:
                target_dept_id = user.student_profile.programme.department_id
            if target_dept_id != dept_id:
                raise HTTPException(status_code=403, detail="As HOD, you can only update users within your assigned department.")
        # Check Class Tutor limit
        elif "Class Tutor" in user_roles:
            fp = current_user.faculty_profile
            if not fp or not user.student_profile:
                raise HTTPException(status_code=403, detail="As Class Tutor, you are only authorized to update students within your assigned class.")
            sp = user.student_profile
            if sp.programme_id != fp.assigned_programme_id or sp.batch_name != fp.assigned_batch or sp.section_name != fp.assigned_section:
                raise HTTPException(status_code=403, detail="As Class Tutor, you can only update students within your assigned class.")

    if req.full_name is not None:
        user.full_name = req.full_name
    if req.email is not None:
        email = req.email.strip().lower()
        existing_email = db.query(User).filter(
            User.email == email,
            User.id != user.id
        ).first()
        if existing_email:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Email address '{email}' is already registered to "
                    f"user '{existing_email.full_name}' (ID: {existing_email.username}). "
                    "Please specify a unique email address."
                )
            )
        user.email = email
    if req.mobile is not None:
        user.mobile = req.mobile
    if req.is_active is not None:
        user.is_active = req.is_active
    if req.password:
        user.hashed_password = get_password_hash(req.password)

    if req.role_name:
        role = db.query(Role).filter(Role.name == req.role_name).first()
        if role and role not in user.roles:
            user.roles = [role]

    if user.student_profile:
        sp = user.student_profile
        if req.register_number_or_emp_id:
            sp.register_number = req.register_number_or_emp_id
            user.username = req.register_number_or_emp_id
        if req.section_name:
            sp.section_name = req.section_name
        if req.batch_name:
            sp.batch_name = req.batch_name
        if req.semester_num:
            sp.semester_num = req.semester_num
        if req.programme_code:
            prog = db.query(Programme).filter(Programme.code == req.programme_code).first()
            if prog:
                sp.programme_id = prog.id
        if req.password:
            sp.initial_password = req.password

    fp = db.query(FacultyProfile).filter(FacultyProfile.user_id == user.id).first()
    if fp:
        if req.register_number_or_emp_id:
            fp.employee_id = req.register_number_or_emp_id
            user.username = req.register_number_or_emp_id
        if req.role_name:
            if req.role_name in ["HoD", "Head of Department (HoD)"]:
                fp.designation = "Head of Department (HoD)"
            elif req.role_name in ["ERP Coordinator", "Assessment Coordinator", "Administrator", "Class Tutor"]:
                fp.designation = req.role_name
            elif req.designation:
                fp.designation = req.designation
        elif req.designation:
            fp.designation = req.designation
        if req.department_code:
            dept = db.query(Department).filter(Department.code == req.department_code).first()
            if dept:
                fp.department_id = dept.id
        # Determine if faculty is or will become a Class Tutor
        is_now_tutor = (req.role_name == "Class Tutor") or (req.role_name is None and fp.designation == "Class Tutor")
        target_prog_id = req.assigned_programme_id or (fp.assigned_programme_id if is_now_tutor else None)
        target_batch = req.assigned_batch or (fp.assigned_batch if is_now_tutor else _default_batch(db))
        target_section = req.assigned_section or (fp.assigned_section if is_now_tutor else "A")

        if is_now_tutor and target_prog_id:
            # Check for another existing Class Tutor for the same class
            existing_tutor = db.query(FacultyProfile).filter(
                FacultyProfile.id != fp.id,
                FacultyProfile.designation == "Class Tutor",
                FacultyProfile.assigned_programme_id == target_prog_id,
                FacultyProfile.assigned_batch == target_batch,
                FacultyProfile.assigned_section == target_section,
                FacultyProfile.status == "Active"
            ).first()

            if existing_tutor:
                prog_name = existing_tutor.assigned_programme.name if existing_tutor.assigned_programme else f"Programme #{target_prog_id}"
                tutor_name = existing_tutor.user.full_name if existing_tutor.user else existing_tutor.employee_id
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Duplicate Tutor Assignment Conflict: Faculty '{tutor_name}' (ID: {existing_tutor.employee_id}) "
                        f"is already assigned as Class Tutor for {prog_name} — Batch {target_batch} (Sec {target_section}). "
                        "A single class cannot have two tutors assigned. Please edit or reassign the existing tutor first."
                    )
                )

            fp.assigned_programme_id = target_prog_id
            fp.assigned_batch = target_batch
            fp.assigned_section = target_section
            fp.designation = "Class Tutor"

            # Clear old tutor_id for this tutor across any classes
            old_classes = db.query(AcademicClass).filter(AcademicClass.tutor_id == fp.id).all()
            for old_c in old_classes:
                old_c.tutor_id = None
            
            # Set new matching class
            ac_class = db.query(AcademicClass).filter(
                AcademicClass.programme_id == target_prog_id,
                AcademicClass.batch_name == target_batch,
                AcademicClass.section_name == target_section
            ).first()
            if ac_class:
                ac_class.tutor_id = fp.id
        elif req.role_name and req.role_name != "Class Tutor":
            # Role changed away from Class Tutor: clear class assignments
            fp.assigned_programme_id = None
            fp.assigned_batch = None
            fp.assigned_section = None
            old_classes = db.query(AcademicClass).filter(AcademicClass.tutor_id == fp.id).all()
            for old_c in old_classes:
                old_c.tutor_id = None

    record_audit(db, current_user, "USER_UPDATED", "USERS", user.id, None,
                 {"username": user.username, "full_name": user.full_name, "roles": [r.name for r in user.roles],
                  "password_changed": bool(getattr(req, "password", None))})
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        if "users.email" in str(exc.orig):
            raise HTTPException(
                status_code=400,
                detail="This email address is already registered to another user. Please specify a unique email address."
            ) from exc
        raise
    db.refresh(user)
    return {"message": "User details corrected successfully"}

@router.delete("/{id}")
def delete_user(
    id: int,
    current_user: User = Depends(require_roles(["Administrator", "HoD", "Class Tutor"])),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user_roles = [r.name for r in current_user.roles]
    if "Administrator" not in user_roles:
        # Check HOD limit
        if "HoD" in user_roles:
            dept_id = get_user_department_id(current_user)
            target_dept_id = None
            if user.faculty_profile:
                target_dept_id = user.faculty_profile.department_id
            elif user.student_profile and user.student_profile.programme:
                target_dept_id = user.student_profile.programme.department_id
            if target_dept_id != dept_id:
                raise HTTPException(status_code=403, detail="As HOD, you can only delete users within your assigned department.")
        # Check Class Tutor limit
        elif "Class Tutor" in user_roles:
            fp = current_user.faculty_profile
            if not fp or not user.student_profile:
                raise HTTPException(status_code=403, detail="As Class Tutor, you are only authorized to delete students within your assigned class.")
            sp = user.student_profile
            if sp.programme_id != fp.assigned_programme_id or sp.batch_name != fp.assigned_batch or sp.section_name != fp.assigned_section:
                raise HTTPException(status_code=403, detail="As Class Tutor, you can only delete students within your assigned class.")
    
    sp = db.query(StudentProfile).filter(StudentProfile.user_id == user.id).first()
    if sp:
        db.delete(sp)
        
    fp = db.query(FacultyProfile).filter(FacultyProfile.user_id == user.id).first()
    if fp:
        db.delete(fp)
        
    record_audit(db, current_user, "USER_DELETED", "USERS", user.id,
                 {"username": user.username, "full_name": user.full_name, "roles": [r.name for r in user.roles]}, None)
    user.roles.clear()
    db.delete(user)
    db.commit()
    return {"message": f"User '{user.full_name}' deleted successfully"}

@router.get("/my-department-programmes")
def get_my_department_programmes(user_id: Optional[int] = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _require_staff(current_user)
    dept_id = 1
    if user_id:
        fp = db.query(FacultyProfile).filter(FacultyProfile.user_id == user_id).first()
        if fp and fp.department_id:
            dept_id = fp.department_id

    dept = db.query(Department).filter(Department.id == dept_id).first()
    programmes = db.query(Programme).filter(Programme.department_id == dept_id).all()

    res = []
    for p in programmes:
        res.append({
            "id": p.id,
            "code": p.code,
            "name": p.name,
            "department_id": p.department_id,
            "department_name": dept.name if dept else "N/A",
            "degree_type": p.degree_type,
            "duration_years": p.duration_years
        })
    return res


def _tutor_assigned_classes(db: Session, user: User) -> List[dict]:
    """Classes a Class Tutor is allotted: AcademicClass rows naming them as tutor, plus the
    programme/batch/section pinned on their faculty profile."""
    fp = user.faculty_profile
    if not fp:
        return []

    res = []
    seen = set()

    def add(programme, batch_name, section_name, semester_num):
        key = (programme.id, batch_name, section_name or "A")
        if key in seen:
            return
        seen.add(key)
        res.append({
            "programme_id": programme.id,
            "programme_code": programme.code,
            "programme_name": programme.name,
            "department_name": programme.department.name if programme.department else "",
            "batch_name": batch_name,
            "section_name": section_name or "A",
            "semester_num": _semester_for(db, batch_name) or semester_num or 1,
        })

    for c in db.query(AcademicClass).filter(AcademicClass.tutor_id == fp.id).all():
        if c.programme:
            add(c.programme, c.batch_name, c.section_name, c.semester_num)

    if fp.assigned_programme_id and fp.assigned_programme:
        batch = fp.assigned_batch or _default_batch(db)
        if batch:
            add(fp.assigned_programme, batch, fp.assigned_section, None)

    return res


@router.get("/my-assigned-classes")
def get_my_assigned_classes(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Programme / section / batch combinations the logged-in Class Tutor may upload rosters for."""
    _require_staff(current_user)
    return _tutor_assigned_classes(db, current_user)

# --- Roster Approval Batch Endpoints (Class Tutor Staging & HoD Approval Workflow) ---

class RosterBatchCreateRequest(BaseModel):
    tutor_id: Optional[int] = None
    uploaded_by_id: Optional[int] = None
    programme_id: int
    section_name: str = "A"
    batch_name: Optional[str] = None
    semester_num: Optional[int] = None
    default_semester: Optional[int] = None
    file_name: Optional[str] = None
    source_filename: Optional[str] = None
    staged_data: Optional[List[dict]] = None
    students: Optional[List[dict]] = None

class RosterBatchUpdateRequest(BaseModel):
    staged_data: Optional[List[dict]] = None
    rejection_notes: Optional[str] = None

@router.post("/roster-batches")
@router.post("/roster-upload")
@router.post("/upload-roster-staging")
def create_roster_upload_batch(req: RosterBatchCreateRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    roles = _roles(current_user)
    if not roles & {"Administrator", "HoD", "Class Tutor"}:
        raise HTTPException(status_code=403, detail="Only tutors, HoDs and Administrators can upload rosters.")
    tutor_id = req.tutor_id or req.uploaded_by_id or current_user.id
    batch_name = req.batch_name or _default_batch(db)
    section_name = req.section_name or "A"
    if "Class Tutor" in roles and not roles & {"Administrator", "HoD"}:
        tutor_id = current_user.id  # a tutor cannot file a roster under someone else's name
        allowed = {(c["programme_id"], c["batch_name"], c["section_name"]) for c in _tutor_assigned_classes(db, current_user)}
        if (req.programme_id, batch_name, section_name) not in allowed:
            raise HTTPException(status_code=403, detail="You can only upload rosters for your assigned classes.")
    if not (req.staged_data or req.students):
        raise HTTPException(status_code=400, detail="No student records provided to load.")
    # No HoD approval step: the roster is loaded into the student registry as soon as it is uploaded.
    batch = RosterApprovalBatch(
        tutor_id=tutor_id,
        programme_id=req.programme_id,
        section_name=section_name,
        batch_name=batch_name,
        semester_num=req.semester_num or req.default_semester or _semester_for(db, batch_name) or 1,
        file_name=req.file_name or req.source_filename or "Student_List.xlsx",
        status="Pending",
        staged_data=req.staged_data or req.students or []
    )
    db.add(batch)
    db.flush()
    count = _load_roster_batch(db, batch, current_user.id)
    record_audit(db, current_user, "ROSTER_LOADED", "USERS", batch.id, None,
                 {"loaded_count": count, "programme_id": batch.programme_id, "batch": batch_name, "section": section_name})
    db.commit()
    return {"message": f"Successfully loaded {count} students into DB with allocated login passwords", "batch_id": batch.id, "loaded_count": count}

@router.get("/roster-batches")
def get_roster_batches(tutor_id: Optional[int] = None, department_id: Optional[int] = None, status: Optional[str] = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _require_staff(current_user)
    roles = _roles(current_user)
    if "Administrator" not in roles:
        if "HoD" in roles:
            department_id = get_user_department_id(current_user)
        elif "Class Tutor" in roles:
            tutor_id = current_user.id
    query = db.query(RosterApprovalBatch)
    if department_id:
        query = query.join(RosterApprovalBatch.programme).filter(Programme.department_id == department_id)
    if tutor_id:
        query = query.filter(RosterApprovalBatch.tutor_id == tutor_id)
    if status:
        query = query.filter(RosterApprovalBatch.status == status)
    batches = query.order_by(RosterApprovalBatch.created_at.desc()).all()
    res = []
    for b in batches:
        res.append({
            "id": b.id,
            "tutor_id": b.tutor_id,
            "tutor_name": b.tutor.full_name if b.tutor else "Class Tutor",
            "programme_id": b.programme_id,
            "programme_name": b.programme.name if b.programme else "N/A",
            "programme_code": b.programme.code if b.programme else "N/A",
            "section_name": b.section_name,
            "batch_name": b.batch_name,
            "semester_num": b.semester_num,
            "file_name": b.file_name,
            "status": b.status,
            "staged_data": b.staged_data,
            "rejection_notes": b.rejection_notes,
            "created_at": b.created_at.isoformat() if b.created_at else None,
            "approved_at": b.approved_at.isoformat() if b.approved_at else None,
            "approved_by_name": b.approved_by.full_name if b.approved_by else None
        })
    return res

@router.get("/roster-batches/{id}")
def get_roster_batch_detail(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    b = db.query(RosterApprovalBatch).filter(RosterApprovalBatch.id == id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Roster batch not found")
    _check_roster_access(current_user, b)
    return {
        "id": b.id,
        "tutor_id": b.tutor_id,
        "tutor_name": b.tutor.full_name if b.tutor else "Class Tutor",
        "programme_id": b.programme_id,
        "programme_name": b.programme.name if b.programme else "N/A",
        "programme_code": b.programme.code if b.programme else "N/A",
        "section_name": b.section_name,
        "batch_name": b.batch_name,
        "semester_num": b.semester_num,
        "file_name": b.file_name,
        "status": b.status,
        "staged_data": b.staged_data,
        "rejection_notes": b.rejection_notes,
        "created_at": b.created_at.isoformat() if b.created_at else None,
        "approved_at": b.approved_at.isoformat() if b.approved_at else None,
        "approved_by_name": b.approved_by.full_name if b.approved_by else None
    }

@router.put("/roster-batches/{id}")
def update_roster_batch(id: int, req: RosterBatchUpdateRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    batch = db.query(RosterApprovalBatch).filter(RosterApprovalBatch.id == id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Roster batch not found")
    _check_roster_access(current_user, batch)
    if batch.status == "Approved":
        raise HTTPException(status_code=409, detail="An approved roster can no longer be edited.")
    if req.staged_data is not None:
        batch.staged_data = req.staged_data
    if req.rejection_notes is not None:
        batch.rejection_notes = req.rejection_notes
    db.commit()
    return {"message": "Roster batch updated successfully"}

BATCH_PATTERN = re.compile(r"^\d{4}-\d{4}$")


def _load_roster_batch(db: Session, batch: RosterApprovalBatch, loader_id: int) -> int:
    """Create/update the student accounts in a roster batch and mark it Approved. Caller commits.

    Existing rows are read in bulk and new rows inserted in batches: one query per student
    made a 60-student roster take ~50s and time out on the deployed backend."""
    role_student = db.query(Role).filter(Role.name == "Student").first()
    courses = db.query(Course).filter(Course.programme_id == batch.programme_id).all()
    academic_year = _current_year_code(db) if courses else None

    entries = []
    updated_staged_data = []
    for row in batch.staged_data:
        reg_num = str(row.get("register_number") or row.get("UnivregNo") or row.get("univreg_no") or "").strip()
        if not reg_num:
            continue

        # Allot unique password per student
        allocated_pwd = str(row.get("allocated_password") or row.get("password") or "").strip()
        if not allocated_pwd or allocated_pwd == "student123":
            rand_num = random.randint(1000, 9999)
            allocated_pwd = f"MockRun@{rand_num}"

        row_copy = dict(row)
        row_copy["allocated_password"] = allocated_pwd
        updated_staged_data.append(row_copy)

        # Get individual student semester_num if available, else batch.semester_num
        staged_sem = row.get("semester_num")
        if staged_sem is None:
            staged_sem = row.get("semester")
        if staged_sem is None:
            staged_sem = row.get("Current Sem")
        if staged_sem is None:
            staged_sem = row.get("current_sem")
        try:
            student_sem = int(staged_sem) if staged_sem is not None else batch.semester_num
        except ValueError:
            student_sem = batch.semester_num

        # iCampus exports put the class name (e.g. "B.Sc ... Learning-A") in their Batch column;
        # only a real batch like 2026-2029 may override the roster's batch.
        row_batch = str(row.get("batch_name") or row.get("batch") or "").strip()
        entries.append({
            "reg_num": reg_num,
            "email": str(row.get("email") or f"{reg_num.lower()}@openlectern.com").strip(),
            "name": str(row.get("full_name") or row.get("name") or reg_num).strip(),
            "batch_name": row_batch if BATCH_PATTERN.match(row_batch) else batch.batch_name,
            "semester": student_sem,
            "password": allocated_pwd,
        })

    # bcrypt releases the GIL, so hashing in threads runs in parallel
    with ThreadPoolExecutor(max_workers=8) as pool:
        hashes = list(pool.map(get_password_hash, [e["password"] for e in entries]))

    reg_nums = {e["reg_num"] for e in entries}
    users = {u.username: u for u in db.query(User).filter(User.username.in_(reg_nums)).all()} if reg_nums else {}
    # email -> username of its current owner, kept current as rows are processed
    candidate_emails = {e["email"] for e in entries}
    email_owner = dict(db.query(User.email, User.username).filter(User.email.in_(candidate_emails)).all()) if candidate_emails else {}

    for e, hashed in zip(entries, hashes):
        reg_num, email = e["reg_num"], e["email"]
        user = users.get(reg_num)
        if email_owner.get(email, reg_num) != reg_num:  # email belongs to another user
            email = f"{reg_num.lower()}@openlectern.com" if not user else f"{reg_num.lower()}@nasccbe.ac.in"
        if not user:
            user = User(
                username=reg_num,
                email=email,
                full_name=e["name"],
                mobile="9876543210",
                hashed_password=hashed,
                is_active=True
            )
            db.add(user)
            if role_student:
                user.roles.append(role_student)
            users[reg_num] = user
        else:
            if email_owner.get(user.email) == reg_num:
                del email_owner[user.email]
            user.full_name = e["name"]
            user.email = email
            user.hashed_password = hashed
        email_owner[email] = reg_num
    db.flush()

    user_ids = [u.id for u in users.values()]
    profiles = {sp.user_id: sp for sp in db.query(StudentProfile).filter(StudentProfile.user_id.in_(user_ids)).all()} if user_ids else {}
    new_profiles = []
    for e in entries:
        user = users[e["reg_num"]]
        sp = profiles.get(user.id)
        if not sp:
            sp = StudentProfile(
                user_id=user.id,
                register_number=e["reg_num"],
                programme_id=batch.programme_id,
                batch_name=e["batch_name"],
                semester_num=e["semester"],
                section_name=batch.section_name,
                initial_password=e["password"]
            )
            db.add(sp)
            profiles[user.id] = sp
            new_profiles.append(sp)
        else:
            sp.batch_name = e["batch_name"]
            sp.semester_num = e["semester"]
            sp.section_name = batch.section_name
            sp.initial_password = e["password"]
    db.flush()

    for sp in new_profiles:
        for c in courses:
            db.add(CourseEnrolment(student_id=sp.id, course_id=c.id, academic_year=academic_year))

    batch.staged_data = updated_staged_data
    flag_modified(batch, "staged_data")
    batch.status = "Approved"
    batch.approved_at = datetime.datetime.utcnow()
    batch.approved_by_id = loader_id
    return len(entries)


@router.post("/roster-batches/{id}/approve")
def approve_roster_batch(id: int, approver_id: Optional[int] = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    batch = db.query(RosterApprovalBatch).filter(RosterApprovalBatch.id == id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Roster batch not found")
    _check_roster_access(current_user, batch, approve=True)
    if batch.status != "Pending":
        raise HTTPException(status_code=409, detail=f"Only pending rosters can be approved (this one is {batch.status}).")
    count = _load_roster_batch(db, batch, current_user.id)  # the approver is whoever is logged in
    db.commit()
    return {"message": f"Successfully approved batch and loaded {count} students into DB with allocated login passwords"}

@router.post("/roster-batches/{id}/reject")
def reject_roster_batch(id: int, notes: Optional[str] = "Changes requested by HoD", db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    batch = db.query(RosterApprovalBatch).filter(RosterApprovalBatch.id == id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Roster batch not found")
    _check_roster_access(current_user, batch, approve=True)
    if batch.status != "Pending":
        raise HTTPException(status_code=409, detail=f"Only pending rosters can be rejected (this one is {batch.status}).")
    batch.status = "Rejected"
    batch.rejection_notes = notes
    db.commit()
    return {"message": "Roster batch rejected successfully"}

@router.delete("/roster-batches/{id}")
def delete_roster_batch(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    batch = db.query(RosterApprovalBatch).filter(RosterApprovalBatch.id == id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Roster batch not found")
    _check_roster_access(current_user, batch)
    db.delete(batch)
    db.commit()
    return {"message": "Roster batch removed successfully"}

