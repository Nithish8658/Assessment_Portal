from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import User, Role, FacultyProfile, StudentProfile, AcademicClass, Programme, Department
from app.schemas.schemas import LoginRequest, TokenResponse, UserResponse
from app.auth.jwt import verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])

def _get_user_assigned_details(user: User, db: Session):
    """Extracts class tutor assignment or student class details."""
    details = {
        "assigned_class_name": None,
        "assigned_class_code": None,
        "assigned_programme_name": None,
        "assigned_programme_code": None,
        "assigned_batch": None,
        "assigned_section": None,
        "assigned_semester_num": None,
        "assigned_department_name": None
    }
    
    if user.faculty_profile:
        fp = user.faculty_profile
        # Check if tutor of an AcademicClass
        cls = db.query(AcademicClass).filter(AcademicClass.tutor_id == fp.id).first()
        if not cls and fp.assigned_programme_id:
            cls_query = db.query(AcademicClass).filter(
                AcademicClass.programme_id == fp.assigned_programme_id,
                AcademicClass.batch_name == fp.assigned_batch
            )
            if fp.assigned_section:
                cls_query = cls_query.filter(AcademicClass.section_name == fp.assigned_section)
            cls = cls_query.first()
            
        if cls:
            details["assigned_class_name"] = cls.name
            details["assigned_class_code"] = cls.class_code
            details["assigned_batch"] = cls.batch_name
            details["assigned_section"] = cls.section_name
            details["assigned_semester_num"] = cls.semester_num
            if cls.programme:
                details["assigned_programme_name"] = cls.programme.name
                details["assigned_programme_code"] = cls.programme.code
                if cls.programme.department:
                    details["assigned_department_name"] = cls.programme.department.name
                    details["assigned_department_id"] = cls.programme.department.id
        else:
            if fp.assigned_batch:
                details["assigned_batch"] = fp.assigned_batch
                batch = fp.assigned_batch
                if "2026" in batch:
                    details["assigned_semester_num"] = 1
                elif "2025" in batch:
                    details["assigned_semester_num"] = 3
                elif "2024" in batch:
                    details["assigned_semester_num"] = 5
                else:
                    details["assigned_semester_num"] = 1
            if fp.assigned_section:
                details["assigned_section"] = fp.assigned_section
            if fp.assigned_programme:
                details["assigned_programme_name"] = fp.assigned_programme.name
                details["assigned_programme_code"] = fp.assigned_programme.code
                sem_str = f" • Sem {details['assigned_semester_num']}" if details['assigned_semester_num'] else ""
                details["assigned_class_name"] = f"{fp.assigned_programme.code} ({fp.assigned_batch or '2025-2028'} - Sec {fp.assigned_section or 'A'}{sem_str})"
            if fp.department:
                details["assigned_department_name"] = fp.department.name
                details["assigned_department_id"] = fp.department.id

        # Check if this faculty is assigned as HoD of a Department
        from app.models.models import Department
        hod_dept = db.query(Department).filter(Department.hod_id == fp.id).first()
        if hod_dept:
            details["assigned_department_name"] = hod_dept.name
            details["assigned_department_id"] = hod_dept.id

    elif user.student_profile:
        sp = user.student_profile
        details["assigned_batch"] = sp.batch_name or "2025-2028"
        details["assigned_section"] = sp.section_name or "A"
        details["assigned_semester_num"] = sp.semester_num or (3 if "2025" in (sp.batch_name or "") else 1)
        
        # Try matching AcademicClass
        ac = db.query(AcademicClass).filter(
            AcademicClass.programme_id == sp.programme_id,
            AcademicClass.batch_name == sp.batch_name,
            AcademicClass.section_name == sp.section_name
        ).first()
        if not ac:
            ac = db.query(AcademicClass).filter(AcademicClass.programme_id == sp.programme_id).first()
        if ac:
            details["assigned_class_name"] = f"{ac.name} ({sp.section_name or 'A'})"
            details["assigned_class_code"] = ac.class_code
        elif sp.programme:
            details["assigned_class_name"] = f"Sem {details['assigned_semester_num']}-{sp.programme.code} ({sp.section_name or 'A'})"
            details["assigned_class_code"] = f"{sp.programme.code}-{sp.batch_name or '2024'}"

        if sp.programme:
            details["assigned_programme_name"] = sp.programme.name
            details["assigned_programme_code"] = sp.programme.code
            if sp.programme.department:
                details["assigned_department_name"] = sp.programme.department.name
                details["assigned_department_id"] = sp.programme.department.id

    return details

@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    from app.auth.jwt import get_password_hash
    user = db.query(User).filter(User.username == request.username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )
        
    is_valid, needs_rehash = verify_password(request.password, user.hashed_password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )
        
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User account is deactivated"
        )

    # Seamlessly upgrade legacy plain password to bcrypt on successful login
    if needs_rehash:
        try:
            user.hashed_password = get_password_hash(request.password)
            db.commit()
        except Exception as e:
            db.rollback()
            print("Warning: Password bcrypt upgrade failed:", e)
        
    role_names = [r.name for r in user.roles]
    student_id = user.student_profile.id if user.student_profile else None
    faculty_id = user.faculty_profile.id if user.faculty_profile else None
    
    assigned_details = _get_user_assigned_details(user, db)
    
    token_data = {
        "sub": user.username,
        "user_id": user.id,
        "roles": role_names
    }
    
    access_token = create_access_token(token_data)
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user_id=user.id,
        username=user.username,
        full_name=user.full_name,
        roles=role_names,
        student_id=student_id,
        faculty_id=faculty_id,
        **assigned_details
    )

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    assigned_details = _get_user_assigned_details(current_user, db)
    
    return UserResponse(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        full_name=current_user.full_name,
        mobile=current_user.mobile,
        is_active=current_user.is_active,
        roles=[r.name for r in current_user.roles],
        student_id=current_user.student_profile.id if current_user.student_profile else None,
        faculty_id=current_user.faculty_profile.id if current_user.faculty_profile else None,
        **assigned_details
    )

@router.get("/institution-info")
def get_institution_info():
    from app.config import (
        APP_NAME, BRAND_PROVIDER, INSTITUTION_NAME, INSTITUTION_SHORT,
        CURRENT_ACADEMIC_YEAR, CURRENT_SEMESTER
    )
    return {
        "app_name": APP_NAME,
        "brand_provider": BRAND_PROVIDER,
        "institution_name": INSTITUTION_NAME,
        "institution_short": INSTITUTION_SHORT,
        "academic_year": CURRENT_ACADEMIC_YEAR,
        "semester": CURRENT_SEMESTER
    }

