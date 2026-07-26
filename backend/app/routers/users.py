from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
import io
import csv
from app.database import get_db
from app.models.models import User, Role, StudentProfile, FacultyProfile, Department, Programme
from app.schemas.schemas import UserResponse
from app.auth.jwt import get_password_hash, get_current_user, require_roles

router = APIRouter(prefix="/api/v1/users", tags=["User Management"])

@router.get("", response_model=List[UserResponse])
def get_users(role: Optional[str] = None, db: Session = Depends(get_db)):
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
def get_students(programme_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(StudentProfile)
    if programme_id:
        query = query.filter(StudentProfile.programme_id == programme_id)
    students = query.all()
    res = []
    for s in students:
        res.append({
            "id": s.id,
            "user_id": s.user_id,
            "register_number": s.register_number,
            "full_name": s.user.full_name if s.user else "N/A",
            "email": s.user.email if s.user else "N/A",
            "programme_name": s.programme.name if s.programme else "N/A",
            "programme_code": s.programme.code if s.programme else "N/A",
            "batch_name": s.batch_name,
            "semester_num": s.semester_num,
            "section_name": s.section_name,
            "status": s.status
        })
    return res

@router.get("/faculty")
def get_faculty_members(department_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(FacultyProfile)
    if department_id:
        query = query.filter(FacultyProfile.department_id == department_id)
    faculties = query.all()
    res = []
    for f in faculties:
        alloc_courses = [f"{a.course.code} ({a.course.title})" for a in f.allocations if a.course]
        res.append({
            "id": f.id,
            "user_id": f.user_id,
            "employee_id": f.employee_id,
            "full_name": f.user.full_name if f.user else "N/A",
            "email": f.user.email if f.user else "N/A",
            "designation": f.designation,
            "department_name": f.department.name if f.department else "N/A",
            "status": f.status,
            "allocated_courses": alloc_courses
        })
    return res

@router.post("/bulk-import")
async def bulk_import_users(
    user_type: str, # student or faculty
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    contents = await file.read()
    decoded = contents.decode("utf-8")
    csv_reader = csv.DictReader(io.StringIO(decoded))
    
    count = 0
    errors = []
    for row in csv_reader:
        try:
            username = row.get("username") or row.get("register_number") or row.get("employee_id")
            if not username:
                continue
            
            existing = db.query(User).filter(User.username == username).first()
            if existing:
                continue
                
            email = row.get("email", f"{username.lower()}@nasccbe.ac.in")
            full_name = row.get("full_name", username)
            mobile = row.get("mobile", "9876543210")
            
            user = User(
                username=username,
                email=email,
                full_name=full_name,
                mobile=mobile,
                hashed_password=get_password_hash("password123"),
                is_active=True
            )
            db.add(user)
            db.flush()
            
            if user_type == "student":
                role_student = db.query(Role).filter(Role.name == "Student").first()
                if role_student:
                    user.roles.append(role_student)
                
                reg_num = row.get("register_number", username)
                prog_code = row.get("programme_code", "BCA")
                prog = db.query(Programme).filter(Programme.code == prog_code).first()
                prog_id = prog.id if prog else 1
                
                sp = StudentProfile(
                    user_id=user.id,
                    register_number=reg_num,
                    programme_id=prog_id,
                    batch_name=row.get("batch", "2023-2026"),
                    semester_num=int(row.get("semester", 4)),
                    section_name=row.get("section", "A")
                )
                db.add(sp)
                
            elif user_type == "faculty":
                role_fac = db.query(Role).filter(Role.name == "Faculty").first()
                if role_fac:
                    user.roles.append(role_fac)
                    
                emp_id = row.get("employee_id", username)
                dept_code = row.get("department_code", "CS")
                dept = db.query(Department).filter(Department.code == dept_code).first()
                dept_id = dept.id if dept else 1
                
                fp = FacultyProfile(
                    user_id=user.id,
                    employee_id=emp_id,
                    designation=row.get("designation", "Assistant Professor"),
                    department_id=dept_id
                )
                db.add(fp)
                
            count += 1
        except Exception as e:
            errors.append(f"Row {count+1}: {str(e)}")
            
    db.commit()
    return {"message": f"Successfully imported {count} {user_type} records.", "errors": errors}

from pydantic import BaseModel

class UserCreateRequest(BaseModel):
    username: str
    email: str
    full_name: str
    mobile: Optional[str] = "9876543210"
    password: Optional[str] = "password123"
    role_name: str # Student, Faculty, Assessment Coordinator, HoD, Administrator
    register_number_or_emp_id: Optional[str] = None
    programme_code: Optional[str] = "23BCA"
    department_code: Optional[str] = "CS"
    section_name: Optional[str] = "A"
    batch_name: Optional[str] = "2023-2026"
    designation: Optional[str] = "Assistant Professor"

class UserUpdateRequest(BaseModel):
    email: Optional[str] = None
    full_name: Optional[str] = None
    mobile: Optional[str] = None
    password: Optional[str] = None
    role_name: Optional[str] = None
    is_active: Optional[bool] = None
    register_number_or_emp_id: Optional[str] = None
    programme_code: Optional[str] = None
    department_code: Optional[str] = None
    section_name: Optional[str] = None
    designation: Optional[str] = None

@router.post("")
def create_user(req: UserCreateRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.username == req.username).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Username/Register No '{req.username}' already exists")

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
        prog = db.query(Programme).filter(Programme.code == req.programme_code).first()
        sp = StudentProfile(
            user_id=user.id,
            register_number=req.register_number_or_emp_id or req.username,
            programme_id=prog.id if prog else 1,
            batch_name=req.batch_name or "2023-2026",
            semester_num=4,
            section_name=req.section_name or "A"
        )
        db.add(sp)
    else:
        dept = db.query(Department).filter(Department.code == req.department_code).first()
        fp = FacultyProfile(
            user_id=user.id,
            employee_id=req.register_number_or_emp_id or req.username,
            designation=req.designation or "Assistant Professor",
            department_id=dept.id if dept else 1
        )
        db.add(fp)

    db.commit()
    db.refresh(user)
    return {"message": "User created successfully", "user_id": user.id}

@router.put("/{id}")
def update_user_details(id: int, req: UserUpdateRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if req.full_name is not None:
        user.full_name = req.full_name
    if req.email is not None:
        user.email = req.email
    if req.mobile is not None:
        user.mobile = req.mobile
    if req.is_active is not None:
        user.is_active = req.is_active
    if req.password:
        user.hashed_password = get_password_hash(req.password)

    if req.role_name:
        role = db.query(Role).filter(Role.name == req.role_name).first()
        if role:
            user.roles = [role]

    sp = db.query(StudentProfile).filter(StudentProfile.user_id == user.id).first()
    if sp:
        if req.register_number_or_emp_id:
            sp.register_number = req.register_number_or_emp_id
            user.username = req.register_number_or_emp_id
        if req.section_name:
            sp.section_name = req.section_name
        if req.programme_code:
            prog = db.query(Programme).filter(Programme.code == req.programme_code).first()
            if prog:
                sp.programme_id = prog.id

    fp = db.query(FacultyProfile).filter(FacultyProfile.user_id == user.id).first()
    if fp:
        if req.register_number_or_emp_id:
            fp.employee_id = req.register_number_or_emp_id
            user.username = req.register_number_or_emp_id
        if req.designation:
            fp.designation = req.designation
        if req.department_code:
            dept = db.query(Department).filter(Department.code == req.department_code).first()
            if dept:
                fp.department_id = dept.id

    db.commit()
    db.refresh(user)
    return {"message": "User details corrected successfully"}
