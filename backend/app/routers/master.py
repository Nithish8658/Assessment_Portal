from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import func
from app.services.audit import record_audit
from sqlalchemy.orm import Session, joinedload, selectinload
from typing import List, Optional
from app.database import get_db
from app.models.models import User, School, Department, Programme, Course, CourseAllocation, FacultyProfile, StudentProfile, AcademicClass
from app.schemas.schemas import SchoolCreate, DepartmentCreate, ProgrammeCreate, CourseCreate, AllocationCreate, ClassCreate
from app.auth.jwt import get_current_user


def _calendar():
    from app.services import academic_calendar
    return academic_calendar


def _current_year_code(db) -> str:
    """Academic year stamped on new allocations/enrolments: from the Academic Calendar settings."""
    from app.config import CURRENT_ACADEMIC_YEAR
    from app.services.academic_calendar import current_academic_year_code
    return current_academic_year_code(db, CURRENT_ACADEMIC_YEAR)

router = APIRouter(prefix="/api/v1/master", tags=["Academic Master Data"])

import time
from app.services import cache
from app.services.academic_calendar import CALENDAR_CACHE_PREFIX

_MASTER_CACHE = {}
_CACHE_TTL_SECONDS = 60

def invalidate_master_cache():
    """Clear cached master bundle data upon any mutation (create/update/delete)."""
    global _MASTER_CACHE
    _MASTER_CACHE.clear()
    cache.clear(CALENDAR_CACHE_PREFIX)  # class edits change batch lists and counts


def _school_payload(sc: School) -> dict:
    depts = sorted(sc.departments or [], key=lambda d: d.code)
    return {"id": sc.id, "code": sc.code, "name": sc.name, "department_count": len(depts),
            "departments": [{"id": d.id, "code": d.code, "name": d.name} for d in depts]}


def _clean_school(data: SchoolCreate) -> SchoolCreate:
    data.code = (data.code or "").strip().upper()
    data.name = (data.name or "").strip()
    if not data.code or len(data.code) > 20:
        raise HTTPException(status_code=400, detail="School code is required (max 20 characters).")
    if len(data.name) < 3:
        raise HTTPException(status_code=400, detail="School name is required.")
    return data


@router.get("/schools")
def get_schools(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return [_school_payload(sc) for sc in db.query(School).options(selectinload(School.departments)).order_by(School.code).all()]


@router.post("/schools")
def create_school(data: SchoolCreate, request: Request, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _require_admin(current_user)
    data = _clean_school(data)
    if db.query(School).filter(func.upper(School.code) == data.code).first():
        raise HTTPException(status_code=400, detail=f"A school with code '{data.code}' already exists.")
    school = School(code=data.code, name=data.name)
    db.add(school)
    db.flush()
    record_audit(db, current_user, "SCHOOL_CREATED", "MASTER_DATA", school.id, None, {"code": school.code, "name": school.name}, request)
    db.commit()
    db.refresh(school)
    invalidate_master_cache()
    return _school_payload(school)


@router.put("/schools/{id}")
def update_school(id: int, data: SchoolCreate, request: Request, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _require_admin(current_user)
    school = db.query(School).filter(School.id == id).first()
    if not school:
        raise HTTPException(status_code=404, detail="School not found.")
    data = _clean_school(data)
    clash = db.query(School).filter(func.upper(School.code) == data.code, School.id != id).first()
    if clash:
        raise HTTPException(status_code=400, detail=f"A school with code '{data.code}' already exists.")
    before = {"code": school.code, "name": school.name}
    school.code, school.name = data.code, data.name
    record_audit(db, current_user, "SCHOOL_UPDATED", "MASTER_DATA", school.id, before, {"code": school.code, "name": school.name}, request)
    db.commit()
    db.refresh(school)
    invalidate_master_cache()
    return _school_payload(school)


@router.delete("/schools/{id}")
def delete_school(id: int, request: Request, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _require_admin(current_user)
    school = db.query(School).filter(School.id == id).first()
    if not school:
        raise HTTPException(status_code=404, detail="School not found.")
    if school.departments:
        names = ", ".join(d.code for d in school.departments)
        raise HTTPException(status_code=409, detail=f"Move or delete its departments first ({names}).")
    before = {"code": school.code, "name": school.name}
    db.delete(school)
    record_audit(db, current_user, "SCHOOL_DELETED", "MASTER_DATA", id, before, None, request)
    db.commit()
    invalidate_master_cache()
    return {"message": f"School '{before['name']}' deleted."}


def _check_school(db: Session, school_id: Optional[int]) -> None:
    if school_id is not None and not db.query(School).filter(School.id == school_id).first():
        raise HTTPException(status_code=400, detail="The selected school does not exist.")


@router.get("/departments")
def get_departments(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    depts = db.query(Department).options(
        joinedload(Department.hod).joinedload(FacultyProfile.user),
        joinedload(Department.school),
        selectinload(Department.programmes),
        selectinload(Department.faculty_members)
    ).all()
    res = []
    for d in depts:
        hod_name = "Not Set"
        if d.hod and d.hod.user:
            hod_name = d.hod.user.full_name
        res.append({
            "id": d.id,
            "code": d.code,
            "name": d.name,
            "school_id": d.school_id,
            "school_name": d.school.name if d.school else None,
            "programme_count": len(d.programmes),
            "faculty_count": len(d.faculty_members),
            "hod_id": d.hod_id,
            "hod_name": hod_name
        })
    return res

@router.post("/departments")
def create_department(data: DepartmentCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _require_admin(current_user)
    existing = db.query(Department).filter(Department.code == data.code).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Department with code '{data.code}' already exists")
    _check_school(db, data.school_id)
    dept = Department(**data.model_dump())
    db.add(dept)
    db.flush()
    record_audit(db, current_user, "DEPARTMENT_CREATED", "MASTER_DATA", dept.id, None, data.model_dump())
    db.commit()
    db.refresh(dept)
    invalidate_master_cache()
    return dept

@router.delete("/departments/{id}")
def delete_department(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _require_admin(current_user)
    dept = db.query(Department).filter(Department.id == id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    record_audit(db, current_user, "DEPARTMENT_DELETED", "MASTER_DATA", dept.id, {"code": dept.code, "name": dept.name}, None)
    db.delete(dept)
    db.commit()
    invalidate_master_cache()
    return {"message": f"Department '{dept.name}' deleted successfully"}

def get_user_department_id(user: User) -> Optional[int]:
    """Helper to determine the department_id associated with a non-admin user."""
    if not user:
        return None
    user_roles = [r.name for r in user.roles]
    if "Administrator" in user_roles:
        return None  # Administrator sees across all departments
    
    if user.faculty_profile and user.faculty_profile.department_id:
        return user.faculty_profile.department_id
    if user.student_profile and user.student_profile.programme and user.student_profile.programme.department_id:
        return user.student_profile.programme.department_id
    return None

MASTER_EDITOR_ROLES = {"Administrator", "HoD", "ERP Coordinator"}
ALLOCATION_EDITOR_ROLES = MASTER_EDITOR_ROLES | {"Assessment Coordinator"}


def _require_editor(current_user: User, target_dept_id: Optional[int], roles=MASTER_EDITOR_ROLES) -> None:
    """Who may change academic master data: Administrators anywhere; HoD/coordinators in their own department."""
    user_roles = {r.name for r in current_user.roles}
    if not user_roles & set(roles):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not permitted to change academic master data.")
    if "Administrator" in user_roles:
        return
    own_dept = get_user_department_id(current_user)
    if own_dept and target_dept_id and own_dept != target_dept_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only change records within your assigned department.")


def _require_admin(current_user: User) -> None:
    if "Administrator" not in {r.name for r in current_user.roles}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only Administrators can change institution structure.")


@router.get("/programmes")
def get_programmes(
    department_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Programme)
    user_roles = [r.name for r in current_user.roles] if current_user else []
    
    if "Administrator" not in user_roles and current_user:
        dept_id = get_user_department_id(current_user)
        if dept_id:
            query = query.filter(Programme.department_id == dept_id)
    elif department_id:
        query = query.filter(Programme.department_id == department_id)
        
    progs = query.options(
        joinedload(Programme.department),
        selectinload(Programme.courses),
        selectinload(Programme.students)
    ).all()
    res = []
    for p in progs:
        res.append({
            "id": p.id,
            "code": p.code,
            "name": p.name,
            "degree_type": p.degree_type,
            "department_name": p.department.name if p.department else "N/A",
            "department_id": p.department_id,
            "duration_years": p.duration_years,
            "course_count": len(p.courses),
            "student_count": len(p.students)
        })
    return res

@router.post("/programmes")
def create_programme(
    data: ProgrammeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user_roles = [r.name for r in current_user.roles]
    allowed_roles = ["Administrator", "HoD", "ERP Coordinator"]
    if not any(r in user_roles for r in allowed_roles):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Administrator, HoD, and ERP Coordinator can create classes/programmes"
        )
    
    if "Administrator" not in user_roles:
        dept_id = get_user_department_id(current_user)
        if dept_id and data.department_id != dept_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only create programmes for your assigned department"
            )
            
    existing = db.query(Programme).filter(Programme.code == data.code).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Programme with code '{data.code}' already exists")
    prog = Programme(**data.model_dump())
    db.add(prog)
    db.commit()
    db.refresh(prog)
    invalidate_master_cache()
    return prog

@router.get("/classes")
def get_classes(
    programme_id: Optional[int] = None,
    department_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(AcademicClass).join(Programme)
    user_roles = [r.name for r in current_user.roles] if current_user else []
    
    if "Administrator" not in user_roles and current_user:
        if "Class Tutor" in user_roles:
            fp = current_user.faculty_profile
            if fp and fp.assigned_programme_id:
                query = query.filter(
                    AcademicClass.programme_id == fp.assigned_programme_id,
                    AcademicClass.batch_name == fp.assigned_batch,
                    AcademicClass.section_name == fp.assigned_section
                )
        elif "Faculty" in user_roles:
            fp = current_user.faculty_profile
            if fp:
                query = query.filter(
                    AcademicClass.programme_id.in_([alloc.course.programme_id for alloc in fp.allocations if alloc.course])
                )
        else:
            dept_id = get_user_department_id(current_user)
            if dept_id:
                query = query.filter(Programme.department_id == dept_id)
    elif department_id:
        query = query.filter(Programme.department_id == department_id)
        
    if programme_id:
        query = query.filter(AcademicClass.programme_id == programme_id)
        
    classes_list = query.options(
        joinedload(AcademicClass.programme).joinedload(Programme.department),
        joinedload(AcademicClass.tutor).joinedload(FacultyProfile.user)
    ).all()
    res = []
    for c in classes_list:
        res.append({
            "id": c.id,
            "class_code": c.class_code,
            "name": c.name,
            "programme_id": c.programme_id,
            "programme_name": c.programme.name if c.programme else "N/A",
            "programme_code": c.programme.code if c.programme else "N/A",
            "department_id": c.programme.department_id if c.programme else None,
            "department_name": c.programme.department.name if c.programme and c.programme.department else "N/A",
            "batch_name": c.batch_name,
            "semester_num": c.semester_num,
            "section_name": c.section_name,
            "tutor_id": c.tutor_id,
            "tutor_name": c.tutor.user.full_name if c.tutor and c.tutor.user else "Unassigned"
        })
    return res

@router.post("/classes")
def create_class(
    data: ClassCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user_roles = [r.name for r in current_user.roles]
    allowed_roles = ["Administrator", "HoD", "ERP Coordinator"]
    if not any(r in user_roles for r in allowed_roles):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Administrator, HoD, and ERP Coordinator can create classes"
        )
    
    prog = db.query(Programme).filter(Programme.id == data.programme_id).first()
    if not prog:
        raise HTTPException(status_code=404, detail="Selected programme not found")
        
    if "Administrator" not in user_roles:
        dept_id = get_user_department_id(current_user)
        if dept_id and prog.department_id != dept_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only create classes for programmes within your assigned department"
            )
            
    existing = db.query(AcademicClass).filter(AcademicClass.class_code == data.class_code).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Academic class with code '{data.class_code}' already exists")
        
    # A running batch's semester always comes from the Academic Calendar.
    calendar_sem = _calendar().semester_for_batch(db, data.batch_name)
    if calendar_sem:
        data.semester_num = calendar_sem
    ac_class = AcademicClass(**data.model_dump())
    
    if ac_class.tutor_id:
        conflict_class = db.query(AcademicClass).filter(
            AcademicClass.tutor_id == ac_class.tutor_id
        ).first()
        if conflict_class:
            tutor_fp = db.query(FacultyProfile).filter(FacultyProfile.id == ac_class.tutor_id).first()
            tutor_name = tutor_fp.user.full_name if (tutor_fp and tutor_fp.user) else f"Tutor #{ac_class.tutor_id}"
            raise HTTPException(
                status_code=400,
                detail=f"Faculty '{tutor_name}' is already assigned as Class Tutor for class '{conflict_class.class_code}'. A tutor cannot be assigned to multiple classes."
            )
        tutor_fp = db.query(FacultyProfile).filter(FacultyProfile.id == ac_class.tutor_id).first()
        if tutor_fp:
            tutor_fp.assigned_programme_id = ac_class.programme_id
            tutor_fp.assigned_batch = ac_class.batch_name
            tutor_fp.assigned_section = ac_class.section_name
            tutor_fp.designation = "Class Tutor"
    else:
        existing_tutor = db.query(FacultyProfile).filter(
            FacultyProfile.designation == "Class Tutor",
            FacultyProfile.assigned_programme_id == ac_class.programme_id,
            FacultyProfile.assigned_batch == ac_class.batch_name,
            FacultyProfile.assigned_section == ac_class.section_name,
            FacultyProfile.status == "Active"
        ).first()
        if existing_tutor:
            ac_class.tutor_id = existing_tutor.id

    db.add(ac_class)
    db.commit()
    db.refresh(ac_class)
    invalidate_master_cache()
    return ac_class

@router.get("/courses")
def get_courses(
    programme_id: Optional[int] = None,
    department_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Course).join(Programme)
    user_roles = [r.name for r in current_user.roles] if current_user else []
    
    if "Administrator" not in user_roles and current_user:
        if "HoD" in user_roles:
            dept_id = get_user_department_id(current_user)
            if dept_id:
                query = query.filter(Programme.department_id == dept_id)
        elif "Class Tutor" in user_roles:
            fp = current_user.faculty_profile
            if fp and fp.assigned_programme_id:
                query = query.filter(Course.programme_id == fp.assigned_programme_id)
        elif "Faculty" in user_roles:
            fp = current_user.faculty_profile
            if fp:
                query = query.filter(Course.id.in_([alloc.course_id for alloc in fp.allocations]))
        else:
            dept_id = get_user_department_id(current_user)
            if dept_id:
                query = query.filter(Programme.department_id == dept_id)
    elif department_id:
        query = query.filter(Programme.department_id == department_id)
        
    if programme_id:
        query = query.filter(Course.programme_id == programme_id)
        
    courses = query.options(
        joinedload(Course.programme).joinedload(Programme.department),
        selectinload(Course.allocations).joinedload(CourseAllocation.faculty).joinedload(FacultyProfile.user)
    ).all()
    res = []
    for c in courses:
        allocated_faculty = []
        for alloc in c.allocations:
            if alloc.faculty and alloc.faculty.user:
                allocated_faculty.append({
                    "id": alloc.faculty.id,
                    "name": alloc.faculty.user.full_name,
                    "section": alloc.section_name
                })
        res.append({
            "id": c.id,
            "code": c.code,
            "title": c.title,
            "course_type": c.course_type,
            "credits": c.credits,
            "semester_num": c.semester_num,
            "regulation": c.regulation,
            "programme_name": c.programme.name if c.programme else "N/A",
            "programme_id": c.programme_id,
            "department_id": c.programme.department_id if c.programme else None,
            "department_name": c.programme.department.name if c.programme and c.programme.department else "N/A",
            "co_count": len(c.cos) if hasattr(c, "cos") and c.cos is not None else 0,
            "allocated_faculty": allocated_faculty
        })
    return res

@router.post("/courses")
def create_course(
    data: CourseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user_roles = [r.name for r in current_user.roles]
    allowed_roles = ["Administrator", "HoD", "ERP Coordinator"]
    if not any(r in user_roles for r in allowed_roles):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Administrator, HoD, and ERP Coordinator can create courses"
        )
    
    prog = db.query(Programme).filter(Programme.id == data.programme_id).first()
    if not prog:
        raise HTTPException(status_code=404, detail="Selected programme not found")
        
    if "Administrator" not in user_roles:
        dept_id = get_user_department_id(current_user)
        if dept_id and prog.department_id != dept_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only create courses for programmes within your assigned department"
            )
            
    existing = db.query(Course).filter(Course.code == data.code).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Course with code '{data.code}' already exists")
        
    course_data = data.model_dump()
    faculty_id = course_data.pop("faculty_id", None)
    course = Course(**course_data)
    db.add(course)
    db.commit()
    db.refresh(course)
    
    if faculty_id:
        alloc = CourseAllocation(
            faculty_id=faculty_id,
            course_id=course.id,
            academic_year=_current_year_code(db),
            semester_num=course.semester_num,
            section_name="A",
            batch_name=_calendar().batch_for_semester(db, course.semester_num, course.programme_id)
        )
        db.add(alloc)
        db.commit()
    return course

@router.get("/allocations")
def get_allocations(faculty_id: int = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(CourseAllocation)
    if faculty_id:
        query = query.filter(CourseAllocation.faculty_id == faculty_id)
    allocs = query.options(
        joinedload(CourseAllocation.course),
        joinedload(CourseAllocation.faculty).joinedload(FacultyProfile.user)
    ).all()
    res = []
    for a in allocs:
        res.append({
            "id": a.id,
            "faculty_id": a.faculty_id,
            "faculty_name": a.faculty.user.full_name if a.faculty and a.faculty.user else "N/A",
            "course_id": a.course_id,
            "course_code": a.course.code if a.course else "N/A",
            "course_title": a.course.title if a.course else "N/A",
            "academic_year": a.academic_year,
            "semester_num": a.semester_num,
            "section_name": a.section_name,
            "batch_name": a.batch_name
        })
    return res

@router.post("/allocations")
def create_allocation(data: AllocationCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    course = db.query(Course).filter(Course.id == data.course_id).first()
    _require_editor(current_user, course.programme.department_id if (course and course.programme) else None, ALLOCATION_EDITOR_ROLES)
    values = data.model_dump()
    values["academic_year"] = values.get("academic_year") or _current_year_code(db)
    values["batch_name"] = values.get("batch_name") or (
        _calendar().batch_for_semester(db, course.semester_num, course.programme_id) if course else None)
    alloc = CourseAllocation(**values)
    db.add(alloc)
    db.commit()
    db.refresh(alloc)
    invalidate_master_cache()
    return alloc

# --- UPDATE & DELETE ENDPOINTS FOR MASTER DATA ---

@router.put("/departments/{id}")
def update_department(id: int, data: DepartmentCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _require_admin(current_user)
    dept = db.query(Department).filter(Department.id == id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    before = {"code": dept.code, "name": dept.name, "school_id": dept.school_id, "hod_id": dept.hod_id}
    dept.code = data.code
    dept.name = data.name
    dept.hod_id = data.hod_id
    if "school_id" in data.model_fields_set:  # an explicit null unassigns the school
        _check_school(db, data.school_id)
        dept.school_id = data.school_id
    record_audit(db, current_user, "DEPARTMENT_UPDATED", "MASTER_DATA", dept.id, before,
                 {"code": dept.code, "name": dept.name, "school_id": dept.school_id, "hod_id": dept.hod_id})
    db.commit()
    db.refresh(dept)
    invalidate_master_cache()
    return dept

@router.put("/programmes/{id}")
def update_programme(id: int, data: ProgrammeCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    prog = db.query(Programme).filter(Programme.id == id).first()
    if not prog:
        raise HTTPException(status_code=404, detail="Programme not found")
    _require_editor(current_user, prog.department_id)
    _require_editor(current_user, data.department_id)
    prog.code = data.code
    prog.name = data.name
    prog.degree_type = data.degree_type
    prog.department_id = data.department_id
    prog.duration_years = data.duration_years
    db.commit()
    db.refresh(prog)
    invalidate_master_cache()
    return prog

@router.delete("/programmes/{id}")
def delete_programme(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    prog = db.query(Programme).filter(Programme.id == id).first()
    if not prog:
        raise HTTPException(status_code=404, detail="Programme not found")
    _require_editor(current_user, prog.department_id)
    db.delete(prog)
    db.commit()
    return {"message": f"Programme '{prog.name}' deleted successfully"}

@router.put("/classes/{id}")
def update_class(id: int, data: ClassCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ac_class = db.query(AcademicClass).filter(AcademicClass.id == id).first()
    if not ac_class:
        raise HTTPException(status_code=404, detail="Class not found")
    _require_editor(current_user, ac_class.programme.department_id if ac_class.programme else None)
    new_prog = db.query(Programme).filter(Programme.id == data.programme_id).first()
    _require_editor(current_user, new_prog.department_id if new_prog else None)
    ac_class.class_code = data.class_code
    ac_class.name = data.name
    ac_class.programme_id = data.programme_id
    ac_class.batch_name = data.batch_name
    ac_class.semester_num = _calendar().semester_for_batch(db, data.batch_name) or data.semester_num
    ac_class.section_name = data.section_name
    if data.tutor_id:
        conflict_class = db.query(AcademicClass).filter(
            AcademicClass.id != ac_class.id,
            AcademicClass.tutor_id == data.tutor_id
        ).first()
        if conflict_class:
            tutor_fp = db.query(FacultyProfile).filter(FacultyProfile.id == data.tutor_id).first()
            tutor_name = tutor_fp.user.full_name if (tutor_fp and tutor_fp.user) else f"Tutor #{data.tutor_id}"
            raise HTTPException(
                status_code=400,
                detail=f"Faculty '{tutor_name}' is already assigned as Class Tutor for class '{conflict_class.class_code}'. A tutor cannot be assigned to multiple classes."
            )

        # If previous tutor was different, clear their class info
        if ac_class.tutor_id and ac_class.tutor_id != data.tutor_id:
            old_tutor = db.query(FacultyProfile).filter(FacultyProfile.id == ac_class.tutor_id).first()
            if old_tutor:
                old_tutor.assigned_programme_id = None
                old_tutor.assigned_batch = None
                old_tutor.assigned_section = None

        ac_class.tutor_id = data.tutor_id
        tutor_fp = db.query(FacultyProfile).filter(FacultyProfile.id == data.tutor_id).first()
        if tutor_fp:
            tutor_fp.assigned_programme_id = ac_class.programme_id
            tutor_fp.assigned_batch = ac_class.batch_name
            tutor_fp.assigned_section = ac_class.section_name
            tutor_fp.designation = "Class Tutor"
    else:
        if ac_class.tutor_id:
            old_tutor = db.query(FacultyProfile).filter(FacultyProfile.id == ac_class.tutor_id).first()
            if old_tutor:
                old_tutor.assigned_programme_id = None
                old_tutor.assigned_batch = None
                old_tutor.assigned_section = None
        ac_class.tutor_id = None

    db.commit()
    db.refresh(ac_class)
    invalidate_master_cache()
    return ac_class

@router.delete("/classes/{id}")
def delete_class(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ac_class = db.query(AcademicClass).filter(AcademicClass.id == id).first()
    if not ac_class:
        raise HTTPException(status_code=404, detail="Class not found")
    _require_editor(current_user, ac_class.programme.department_id if ac_class.programme else None)
    db.delete(ac_class)
    db.commit()
    return {"message": f"Class '{ac_class.name}' deleted successfully"}

@router.put("/courses/{id}")
def update_course(id: int, data: CourseCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    course = db.query(Course).filter(Course.id == id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    _require_editor(current_user, course.programme.department_id if course.programme else None)
    new_prog = db.query(Programme).filter(Programme.id == data.programme_id).first()
    _require_editor(current_user, new_prog.department_id if new_prog else None)
    course.code = data.code
    course.title = data.title
    course.course_type = data.course_type
    course.credits = data.credits
    course.semester_num = data.semester_num
    course.regulation = data.regulation
    course.programme_id = data.programme_id
    
    if data.faculty_id is not None:
        existing_alloc = db.query(CourseAllocation).filter(CourseAllocation.course_id == course.id).first()
        if data.faculty_id:
            if existing_alloc:
                existing_alloc.faculty_id = data.faculty_id
            else:
                alloc = CourseAllocation(
                    faculty_id=data.faculty_id,
                    course_id=course.id,
                    academic_year=_current_year_code(db),
                    semester_num=course.semester_num,
                    section_name="A",
                    batch_name=_calendar().batch_for_semester(db, course.semester_num, course.programme_id)
                )
                db.add(alloc)
        elif existing_alloc:
            db.delete(existing_alloc)

    db.commit()
    db.refresh(course)
    invalidate_master_cache()
    return course

@router.delete("/courses/{id}")
def delete_course(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    course = db.query(Course).filter(Course.id == id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    _require_editor(current_user, course.programme.department_id if course.programme else None)
    db.delete(course)
    db.commit()
    return {"message": f"Course '{course.title}' deleted successfully"}

@router.put("/allocations/{id}")
def update_allocation(id: int, data: AllocationCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    alloc = db.query(CourseAllocation).filter(CourseAllocation.id == id).first()
    if not alloc:
        raise HTTPException(status_code=404, detail="Allocation not found")
    _require_editor(current_user, alloc.course.programme.department_id if (alloc.course and alloc.course.programme) else None, ALLOCATION_EDITOR_ROLES)
    alloc.faculty_id = data.faculty_id
    alloc.course_id = data.course_id
    alloc.academic_year = data.academic_year or alloc.academic_year or _current_year_code(db)
    alloc.semester_num = data.semester_num
    alloc.section_name = data.section_name
    alloc.batch_name = data.batch_name or alloc.batch_name
    db.commit()
    db.refresh(alloc)
    invalidate_master_cache()
    return alloc

@router.delete("/allocations/{id}")
def delete_allocation(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    alloc = db.query(CourseAllocation).filter(CourseAllocation.id == id).first()
    if not alloc:
        raise HTTPException(status_code=404, detail="Allocation not found")
    _require_editor(current_user, alloc.course.programme.department_id if (alloc.course and alloc.course.programme) else None, ALLOCATION_EDITOR_ROLES)
    db.delete(alloc)
    db.commit()
    return {"message": "Allocation deleted successfully"}

@router.get("/bundle")
def get_master_bundle(
    department_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Consolidated single-trip master data bundle with in-memory TTL caching.
    Delivers sub-5ms responses on repeated hits while preventing connection pool starvation.
    """
    user_roles = tuple(sorted(r.name for r in current_user.roles)) if current_user else ()
    user_dept = get_user_department_id(current_user)
    effective_dept = department_id or user_dept
    cache_key = (user_roles, effective_dept)
    
    now = time.time()
    if cache_key in _MASTER_CACHE:
        cached_time, cached_data = _MASTER_CACHE[cache_key]
        if now - cached_time < _CACHE_TTL_SECONDS:
            return cached_data

    depts = get_departments(db)
    progs = get_programmes(effective_dept, db, current_user)
    classes = get_classes(None, effective_dept, db, current_user)
    courses = get_courses(None, effective_dept, db, current_user)
    allocs = get_allocations(None, db)
    
    from app.routers.users import get_faculty_members
    faculties = get_faculty_members(effective_dept, current_user, db)
    
    data = {
        "departments": depts,
        "programmes": progs,
        "classes": classes,
        "courses": courses,
        "allocations": allocs,
        "faculties": faculties
    }
    
    _MASTER_CACHE[cache_key] = (now, data)
    return data
