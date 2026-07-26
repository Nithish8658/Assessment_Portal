import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.models import (
    Result, Mark, Assessment, StudentProfile, Course, User, AuditLog
)
from app.schemas.schemas import PublishResultsRequest
from app.auth.jwt import get_current_user

router = APIRouter(prefix="/api/v1/results", tags=["Result Calculation & Publication Engine"])

@router.get("")
def get_results(
    course_id: Optional[int] = None,
    student_id: Optional[int] = None,
    academic_year: str = "2025-2026",
    db: Session = Depends(get_db)
):
    query = db.query(Result).filter(Result.academic_year == academic_year)
    if course_id:
        query = query.filter(Result.course_id == course_id)
    if student_id:
        query = query.filter(Result.student_id == student_id)
        
    results = query.all()
    res = []
    for r in results:
        student = db.query(StudentProfile).filter(StudentProfile.id == r.student_id).first()
        course = db.query(Course).filter(Course.id == r.course_id).first()
        res.append({
            "id": r.id,
            "student_id": r.student_id,
            "register_number": student.register_number if student else "N/A",
            "student_name": student.user.full_name if student and student.user else "N/A",
            "course_id": r.course_id,
            "course_code": course.code if course else "N/A",
            "course_title": course.title if course else "N/A",
            "cia_score": r.cia_score,
            "cia_max": r.cia_max,
            "percentage": r.percentage,
            "status": r.status,
            "is_published": r.is_published,
            "published_at": r.published_at.strftime("%Y-%m-%d %H:%M") if r.published_at else "N/A"
        })
    return res

@router.post("/calculate")
def calculate_course_results(
    course_id: int,
    academic_year: str = "2025-2026",
    semester_num: int = 4,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    assessments = db.query(Assessment).filter(Assessment.course_id == course_id).all()
    students = db.query(StudentProfile).all()
    
    calc_count = 0
    for s in students:
        total_weighted_score = 0.0
        total_weightage = 0.0
        
        for ass in assessments:
            mark = db.query(Mark).filter(
                Mark.assessment_id == ass.id,
                Mark.student_id == s.id
            ).first()
            
            obtained = mark.marks_obtained if mark else 0.0
            if ass.max_marks > 0:
                weighted = (obtained / ass.max_marks) * ass.weightage_percent
            else:
                weighted = 0.0
                
            total_weighted_score += weighted
            total_weightage += ass.weightage_percent
            
        cia_max = total_weightage if total_weightage > 0 else 50.0
        percentage = (total_weighted_score / cia_max * 100.0) if cia_max > 0 else 0.0
        result_status = "Pass" if percentage >= 40.0 else "Fail"
        
        existing = db.query(Result).filter(
            Result.course_id == course_id,
            Result.student_id == s.id,
            Result.academic_year == academic_year
        ).first()
        
        if existing:
            existing.cia_score = round(total_weighted_score, 2)
            existing.cia_max = round(cia_max, 2)
            existing.percentage = round(percentage, 2)
            existing.status = result_status
        else:
            r = Result(
                student_id=s.id,
                course_id=course_id,
                academic_year=academic_year,
                semester_num=semester_num,
                cia_score=round(total_weighted_score, 2),
                cia_max=round(cia_max, 2),
                percentage=round(percentage, 2),
                status=result_status,
                is_published=False
            )
            db.add(r)
            
        calc_count += 1
        
    audit = AuditLog(
        user_id=current_user.id,
        action="RESULTS_CALCULATED",
        module="Results",
        record_id=str(course_id),
        new_value=f"Calculated results for {calc_count} students in course_id {course_id}"
    )
    db.add(audit)
    
    db.commit()
    return {"message": f"Successfully calculated results for {calc_count} students", "calculated_count": calc_count}

@router.post("/publish")
def publish_course_results(
    req: PublishResultsRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    results = db.query(Result).filter(
        Result.course_id == req.course_id,
        Result.academic_year == req.academic_year,
        Result.semester_num == req.semester_num
    ).all()
    
    if not results:
        raise HTTPException(status_code=404, detail="No calculated results found to publish for this course")
        
    for r in results:
        r.is_published = True
        r.published_at = datetime.datetime.utcnow()
        
    audit = AuditLog(
        user_id=current_user.id,
        action="RESULTS_PUBLISHED",
        module="Results",
        record_id=str(req.course_id),
        new_value=f"Published results for course_id {req.course_id}"
    )
    db.add(audit)
    
    db.commit()
    return {"message": f"Results for course published successfully. {len(results)} student records released."}
