from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.models import Mark, Assessment, StudentProfile, Course, User, AuditLog
from app.schemas.schemas import BatchMarkEntryRequest
from app.auth.jwt import get_current_user

router = APIRouter(prefix="/api/v1/marks", tags=["Offline Mark Entry & Lock Engine"])

@router.get("/grid")
def get_marks_grid(assessment_id: int, course_id: int, db: Session = Depends(get_db)):
    ass = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not ass:
        raise HTTPException(status_code=404, detail="Assessment not found")
        
    students = db.query(StudentProfile).join(StudentProfile.user).order_by(StudentProfile.register_number).all()
    existing_marks = {
        m.student_id: m for m in db.query(Mark).filter(Mark.assessment_id == assessment_id).all()
    }
    
    grid = []
    overall_status = "Draft"
    
    for s in students:
        m = existing_marks.get(s.id)
        if m and m.status in ["Locked", "Verified", "Submitted"]:
            overall_status = m.status
            
        grid.append({
            "student_id": s.id,
            "register_number": s.register_number,
            "student_name": s.user.full_name if s.user else "N/A",
            "marks_obtained": m.marks_obtained if m else 0.0,
            "is_absent": m.is_absent if m else False,
            "is_exempted": m.is_exempted if m else False,
            "remarks": m.remarks if m else "",
            "status": m.status if m else "Draft"
        })
        
    return {
        "assessment_id": ass.id,
        "assessment_title": ass.title,
        "max_marks": ass.max_marks,
        "course_id": course_id,
        "overall_status": overall_status,
        "grid": grid
    }

@router.post("/batch")
def save_batch_marks(
    req: BatchMarkEntryRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ass = db.query(Assessment).filter(Assessment.id == req.assessment_id).first()
    if not ass:
        raise HTTPException(status_code=404, detail="Assessment not found")
        
    for item in req.marks:
        if item.marks_obtained > ass.max_marks:
            raise HTTPException(
                status_code=400,
                detail=f"Marks obtained ({item.marks_obtained}) exceeds maximum limit ({ass.max_marks})"
            )
            
        existing = db.query(Mark).filter(
            Mark.assessment_id == req.assessment_id,
            Mark.student_id == item.student_id
        ).first()
        
        if existing:
            if existing.status == "Locked":
                raise HTTPException(status_code=400, detail="Marks entry is locked for this assessment")
            existing.marks_obtained = item.marks_obtained
            existing.is_absent = item.is_absent
            existing.is_exempted = item.is_exempted
            existing.remarks = item.remarks
            existing.status = req.status
        else:
            m = Mark(
                student_id=item.student_id,
                course_id=req.course_id,
                assessment_id=req.assessment_id,
                marks_obtained=item.marks_obtained,
                is_absent=item.is_absent,
                is_exempted=item.is_exempted,
                remarks=item.remarks,
                status=req.status
            )
            db.add(m)
            
    audit = AuditLog(
        user_id=current_user.id,
        action=f"MARKS_ENTRY_{req.status.upper()}",
        module="Marks",
        record_id=str(req.assessment_id),
        new_value=f"Batch entry saved with status {req.status} for {len(req.marks)} students"
    )
    db.add(audit)
    
    db.commit()
    return {"message": f"Marks batch saved successfully with status {req.status}"}

@router.post("/{assessment_id}/lock")
def lock_marks(assessment_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    marks = db.query(Mark).filter(Mark.assessment_id == assessment_id).all()
    for m in marks:
        m.status = "Locked"
        
    audit = AuditLog(
        user_id=current_user.id,
        action="MARKS_LOCKED",
        module="Marks",
        record_id=str(assessment_id),
        new_value="Marks locked by supervisor"
    )
    db.add(audit)
    
    db.commit()
    return {"message": "Marks entry permanently locked for this assessment", "status": "Locked"}
