from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.models import School, Department, Programme, Course, CourseAllocation, FacultyProfile, StudentProfile
from app.schemas.schemas import SchoolCreate, DepartmentCreate, ProgrammeCreate, CourseCreate, AllocationCreate
from app.auth.jwt import get_current_user

router = APIRouter(prefix="/api/v1/master", tags=["Academic Master Data"])

@router.get("/schools")
def get_schools(db: Session = Depends(get_db)):
    return db.query(School).all()

@router.post("/schools")
def create_school(data: SchoolCreate, db: Session = Depends(get_db)):
    school = School(**data.model_dump())
    db.add(school)
    db.commit()
    db.refresh(school)
    return school

@router.get("/departments")
def get_departments(db: Session = Depends(get_db)):
    depts = db.query(Department).all()
    res = []
    for d in depts:
        res.append({
            "id": d.id,
            "code": d.code,
            "name": d.name,
            "school_name": d.school.name if d.school else "School of Computer Science",
            "programme_count": len(d.programmes),
            "faculty_count": len(d.faculty_members)
        })
    return res

@router.post("/departments")
def create_department(data: DepartmentCreate, db: Session = Depends(get_db)):
    dept = Department(**data.model_dump())
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return dept

@router.get("/programmes")
def get_programmes(db: Session = Depends(get_db)):
    progs = db.query(Programme).all()
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
def create_programme(data: ProgrammeCreate, db: Session = Depends(get_db)):
    prog = Programme(**data.model_dump())
    db.add(prog)
    db.commit()
    db.refresh(prog)
    return prog

@router.get("/courses")
def get_courses(programme_id: int = None, db: Session = Depends(get_db)):
    query = db.query(Course)
    if programme_id:
        query = query.filter(Course.programme_id == programme_id)
    courses = query.all()
    res = []
    for c in courses:
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
            "co_count": len(c.cos)
        })
    return res

@router.post("/courses")
def create_course(data: CourseCreate, db: Session = Depends(get_db)):
    course = Course(**data.model_dump())
    db.add(course)
    db.commit()
    db.refresh(course)
    return course

@router.get("/allocations")
def get_allocations(faculty_id: int = None, db: Session = Depends(get_db)):
    query = db.query(CourseAllocation)
    if faculty_id:
        query = query.filter(CourseAllocation.faculty_id == faculty_id)
    allocs = query.all()
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
def create_allocation(data: AllocationCreate, db: Session = Depends(get_db)):
    alloc = CourseAllocation(**data.model_dump())
    db.add(alloc)
    db.commit()
    db.refresh(alloc)
    return alloc
