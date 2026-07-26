import datetime
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.models import (
    Assignment, AssignmentSubmission, Rubric, RubricCriteria, RubricLevel, StudentProfile, User, AuditLog
)
from app.auth.jwt import get_current_user

router = APIRouter(prefix="/api/v1/assignments", tags=["Assignments & Rubric System"])

@router.get("")
def get_assignments(course_id: Optional[int] = None, student_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(Assignment)
    if course_id:
        query = query.filter(Assignment.course_id == course_id)
    assigns = query.order_by(Assignment.id.desc()).all()
    res = []
    for a in assigns:
        sub_status = "Not Submitted"
        marks = None
        if student_id:
            sub = db.query(AssignmentSubmission).filter(
                AssignmentSubmission.assignment_id == a.id,
                AssignmentSubmission.student_id == student_id
            ).first()
            if sub:
                sub_status = sub.status
                marks = sub.marks_awarded
                
        res.append({
            "id": a.id,
            "title": a.title,
            "description": a.description,
            "course_id": a.course_id,
            "course_code": a.course.code if a.course else "N/A",
            "course_title": a.course.title if a.course else "N/A",
            "max_marks": a.max_marks,
            "due_date": a.due_date.strftime("%Y-%m-%d %H:%M") if a.due_date else "N/A",
            "rubric_id": a.rubric_id,
            "student_status": sub_status,
            "marks_awarded": marks
        })
    return res

@router.post("")
def create_assignment(
    title: str,
    course_id: int,
    description: str = "",
    max_marks: float = 10.0,
    due_date_str: str = "2026-08-30 23:59",
    rubric_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        due = datetime.datetime.strptime(due_date_str, "%Y-%m-%d %H:%M")
    except:
        due = datetime.datetime.utcnow() + datetime.timedelta(days=7)
        
    assignment = Assignment(
        title=title,
        description=description,
        course_id=course_id,
        max_marks=max_marks,
        due_date=due,
        rubric_id=rubric_id,
        created_by_id=current_user.id
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return {"message": "Assignment created successfully", "assignment_id": assignment.id}

@router.get("/rubrics")
def get_rubrics(db: Session = Depends(get_db)):
    rubrics = db.query(Rubric).all()
    res = []
    for r in rubrics:
        criteria_list = []
        for c in r.criteria:
            levels = [{"id": l.id, "level_name": l.level_name, "description": l.description, "marks": l.marks} for l in c.levels]
            criteria_list.append({
                "id": c.id,
                "criterion_name": c.criterion_name,
                "max_marks": c.max_marks,
                "levels": levels
            })
        res.append({
            "id": r.id,
            "title": r.title,
            "description": r.description,
            "criteria": criteria_list
        })
    return res

@router.post("/rubrics")
def create_rubric(title: str, description: str = "", current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    r = Rubric(title=title, description=description, created_by_id=current_user.id)
    db.add(r)
    db.flush()
    
    # Default standard higher-ed rubric criteria
    c1 = RubricCriteria(rubric_id=r.id, criterion_name="Technical Content & Depth", max_marks=5.0)
    c2 = RubricCriteria(rubric_id=r.id, criterion_name="Structure & Presentation", max_marks=5.0)
    db.add_all([c1, c2])
    db.flush()
    
    db.add_all([
        RubricLevel(criteria_id=c1.id, level_name="Excellent", description="Thorough understanding with zero gaps", marks=5.0),
        RubricLevel(criteria_id=c1.id, level_name="Good", description="Good understanding with minor gaps", marks=4.0),
        RubricLevel(criteria_id=c1.id, level_name="Satisfactory", description="Basic understanding", marks=3.0),
        RubricLevel(criteria_id=c1.id, level_name="Needs Improvement", description="Incomplete or incorrect", marks=1.0),
        
        RubricLevel(criteria_id=c2.id, level_name="Excellent", description="Professional layout and references", marks=5.0),
        RubricLevel(criteria_id=c2.id, level_name="Good", description="Clear layout", marks=4.0),
        RubricLevel(criteria_id=c2.id, level_name="Satisfactory", description="Basic structure", marks=3.0),
        RubricLevel(criteria_id=c2.id, level_name="Needs Improvement", description="Poor formatting", marks=1.0)
    ])
    
    db.commit()
    db.refresh(r)
    return {"message": "Rubric created successfully", "rubric_id": r.id}

@router.post("/{id}/submit")
def submit_assignment(
    id: int,
    submission_text: str = "",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    student = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=400, detail="User is not a student")
        
    sub = AssignmentSubmission(
        assignment_id=id,
        student_id=student.id,
        submission_text=submission_text,
        submitted_at=datetime.datetime.utcnow(),
        status="Submitted"
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return {"message": "Assignment submitted successfully", "submission_id": sub.id}
