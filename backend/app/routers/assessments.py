import datetime
import random
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from app.database import get_db
from app.models.models import (
    Assessment, AssessmentAttempt, StudentAnswer, Question, QuestionOption, QuestionPaper, QuestionPaperQuestion, Course, User, StudentProfile, AuditLog
)
from app.schemas.schemas import AssessmentCreate, SubmitAttemptRequest
from app.auth.jwt import get_current_user
from app.ai.yolo_engine import analyze_webcam_frame

router = APIRouter(prefix="/api/v1/assessments", tags=["Online & Offline Assessment Engine"])

class LogViolationRequest(BaseModel):
    attempt_id: int
    violation_type: str # TAB_SWITCH, FULLSCREEN_EXIT, KEYBOARD_LOCKDOWN, CAMERA_DISABLED, NO_FACE_DETECTED, MULTIPLE_FACES_DETECTED, LOOKING_AWAY
    details: Optional[str] = None
    snapshot_data: Optional[str] = None

class AIAnalyzeFrameRequest(BaseModel):
    attempt_id: int
    frame_data: str # Base64 JPEG frame data URL

@router.get("")
def get_assessments(course_id: Optional[int] = None, student_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(Assessment)
    if course_id:
        query = query.filter(Assessment.course_id == course_id)
    assessments = query.order_by(Assessment.id.desc()).all()
    res = []
    for a in assessments:
        attempt_status = "Not Started"
        score = 0.0
        malpractice_flagged = False
        tab_switches = 0
        if student_id:
            att = db.query(AssessmentAttempt).filter(
                AssessmentAttempt.assessment_id == a.id,
                AssessmentAttempt.student_id == student_id
            ).first()
            if att:
                attempt_status = att.status
                score = att.total_score
                malpractice_flagged = att.malpractice_flagged
                tab_switches = att.tab_switch_count
                
        res.append({
            "id": a.id,
            "title": a.title,
            "assessment_type": a.assessment_type,
            "course_id": a.course_id,
            "course_code": a.course.code if a.course else "N/A",
            "course_title": a.course.title if a.course else "N/A",
            "max_marks": a.max_marks,
            "weightage_percent": a.weightage_percent,
            "duration_minutes": a.duration_minutes,
            "is_online": a.is_online,
            "status": a.status,
            "student_attempt_status": attempt_status,
            "student_score": score,
            "malpractice_flagged": malpractice_flagged,
            "tab_switches": tab_switches
        })
    return res

@router.post("")
def create_assessment(data: AssessmentCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ass = Assessment(
        title=data.title,
        assessment_type=data.assessment_type,
        course_id=data.course_id,
        max_marks=data.max_marks,
        weightage_percent=data.weightage_percent,
        duration_minutes=data.duration_minutes,
        instructions=data.instructions,
        is_online=data.is_online,
        question_paper_id=data.question_paper_id,
        created_by_id=current_user.id,
        status="Published"
    )
    db.add(ass)
    db.commit()
    db.refresh(ass)
    return {"message": "Assessment created and published", "assessment_id": ass.id}

@router.post("/{id}/start")
def start_assessment_attempt(id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    student = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=400, detail="Current user is not registered as a Student")
        
    ass = db.query(Assessment).filter(Assessment.id == id).first()
    if not ass:
        raise HTTPException(status_code=404, detail="Assessment not found")
        
    existing_att = db.query(AssessmentAttempt).filter(
        AssessmentAttempt.assessment_id == id,
        AssessmentAttempt.student_id == student.id
    ).first()
    
    if existing_att and existing_att.status == "In Progress":
        att = existing_att
        # Reset proctoring state for fresh test session launch
        att.tab_switch_count = 0
        att.malpractice_flagged = False
        att.violation_logs = []
        att.webcam_snapshots = []
        db.commit()
        db.refresh(att)
    else:
        att = AssessmentAttempt(
            assessment_id=id,
            student_id=student.id,
            start_time=datetime.datetime.utcnow(),
            status="In Progress",
            malpractice_flagged=False,
            tab_switch_count=0,
            violation_logs=[],
            webcam_snapshots=[]
        )
        db.add(att)
        db.commit()
        db.refresh(att)
        
    # Get questions from linked QuestionPaper or fallback course questions
    questions_list = []
    if ass.question_paper_id:
        paper_qs = db.query(QuestionPaperQuestion).filter(QuestionPaperQuestion.paper_id == ass.question_paper_id).order_by(QuestionPaperQuestion.order_num).all()
        for pq in paper_qs:
            q = db.query(Question).filter(Question.id == pq.question_id).first()
            if q:
                questions_list.append(q)
    else:
        questions_list = db.query(Question).filter(Question.course_id == ass.course_id).limit(10).all()
        
    qs_out = []
    saved_answers = {ans.question_id: ans for ans in att.answers}
    
    for q in questions_list:
        ans = saved_answers.get(q.id)
        opts = [{"id": o.id, "option_text": o.option_text} for o in q.options]
        # Randomize options per student to prevent peer copying
        random.seed(att.id * 1000 + q.id)
        random.shuffle(opts)
        
        qs_out.append({
            "question_id": q.id,
            "question_text": q.question_text,
            "question_type": q.question_type,
            "marks": q.marks,
            "unit": q.unit,
            "bloom_level": q.bloom_level,
            "co_code": q.co.code if q.co else "CO1",
            "options": opts,
            "selected_option_id": ans.selected_option_id if ans else None,
            "descriptive_text": ans.descriptive_text if ans else None,
            "is_marked_for_review": ans.is_marked_for_review if ans else False
        })
        
    return {
        "attempt_id": att.id,
        "assessment_id": ass.id,
        "title": ass.title,
        "duration_minutes": ass.duration_minutes,
        "start_time": att.start_time.isoformat(),
        "tab_switch_count": att.tab_switch_count or 0,
        "malpractice_flagged": att.malpractice_flagged or False,
        "questions": qs_out
    }

@router.post("/log-violation")
def log_proctoring_violation(req: LogViolationRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    att = db.query(AssessmentAttempt).filter(AssessmentAttempt.id == req.attempt_id).first()
    if not att:
        raise HTTPException(status_code=404, detail="Attempt not found")
        
    current_logs = list(att.violation_logs or [])
    new_log = {
        "timestamp": datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
        "type": req.violation_type,
        "details": req.details or "Student left examination viewport or triggered security restriction."
    }
    current_logs.append(new_log)
    att.violation_logs = current_logs
    
    if req.snapshot_data:
        current_snapshots = list(att.webcam_snapshots or [])
        current_snapshots.append({
            "timestamp": datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
            "type": req.violation_type,
            "snapshot": req.snapshot_data
        })
        att.webcam_snapshots = current_snapshots
    
    if req.violation_type in ["TAB_SWITCH", "WINDOW_BLUR", "PHONE_DETECTED", "MULTIPLE_PERSONS_DETECTED", "CAMERA_DISABLED"]:
        att.tab_switch_count = min(3, (att.tab_switch_count or 0) + 1)
        if att.tab_switch_count >= 3:
            att.malpractice_flagged = True
            
    # Record in central audit log
    audit = AuditLog(
        user_id=current_user.id,
        action=f"MALPRACTICE_{req.violation_type}",
        module="AssessmentProctoring",
        record_id=str(att.assessment_id),
        new_value=f"Proctoring Warning {att.tab_switch_count}/3 logged for attempt {att.id}"
    )
    db.add(audit)
    
    db.commit()
    return {
        "message": "Violation logged successfully",
        "tab_switch_count": att.tab_switch_count,
        "malpractice_flagged": att.malpractice_flagged
    }

@router.post("/submit")
def submit_assessment_attempt(
    data: SubmitAttemptRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    att = db.query(AssessmentAttempt).filter(AssessmentAttempt.id == data.attempt_id).first()
    if not att:
        raise HTTPException(status_code=404, detail="Attempt not found")
        
    # Clear previous answer records for fresh save
    db.query(StudentAnswer).filter(StudentAnswer.attempt_id == att.id).delete()
    
    total_score = 0.0
    for ans_data in data.answers:
        q = db.query(Question).filter(Question.id == ans_data.question_id).first()
        marks_awarded = 0.0
        
        # Auto-grade Multiple Choice / Objective
        if q and q.question_type in ["Multiple Choice", "True/False"]:
            if ans_data.selected_option_id:
                opt = db.query(QuestionOption).filter(QuestionOption.id == ans_data.selected_option_id).first()
                if opt and opt.is_correct:
                    marks_awarded = q.marks
                    
        total_score += marks_awarded
        
        student_ans = StudentAnswer(
            attempt_id=att.id,
            question_id=ans_data.question_id,
            selected_option_id=ans_data.selected_option_id,
            descriptive_text=ans_data.descriptive_text,
            is_marked_for_review=ans_data.is_marked_for_review,
            marks_awarded=marks_awarded
        )
        db.add(student_ans)
        
    att.status = "Submitted"
    att.submit_time = datetime.datetime.utcnow()
    att.total_score = total_score
    
    audit = AuditLog(
        user_id=current_user.id,
        action="ASSESSMENT_SUBMITTED",
        module="Assessment",
        record_id=str(att.assessment_id),
        new_value=f"Student submitted assessment. Score: {total_score}. Malpractice Flag: {att.malpractice_flagged}"
    )
    db.add(audit)
    
    db.commit()
    return {"message": "Assessment submitted successfully", "total_score": total_score, "malpractice_flagged": att.malpractice_flagged}

@router.post("/ai-analyze-frame")
def ai_analyze_webcam_frame(req: AIAnalyzeFrameRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    att = db.query(AssessmentAttempt).filter(AssessmentAttempt.id == req.attempt_id).first()
    if not att:
        raise HTTPException(status_code=404, detail="Attempt not found")
        
    analysis = analyze_webcam_frame(req.frame_data)
    if not analysis.get("success"):
        return analysis
        
    violations = analysis.get("violations", [])
    annotated_snapshot = analysis.get("annotated_snapshot")
    
    if violations:
        current_logs = list(att.violation_logs or [])
        current_snapshots = list(att.webcam_snapshots or [])
        
        for v in violations:
            log_item = {
                "timestamp": datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
                "type": f"AI_{v['type']}",
                "details": v["details"]
            }
            current_logs.append(log_item)
            
            if annotated_snapshot:
                current_snapshots.append({
                    "timestamp": log_item["timestamp"],
                    "type": f"AI_{v['type']}",
                    "snapshot": annotated_snapshot
                })
                
            if v["type"] in ["PHONE_DETECTED", "MULTIPLE_PERSONS_DETECTED"]:
                att.tab_switch_count = min(3, (att.tab_switch_count or 0) + 1)
                if att.tab_switch_count >= 3:
                    att.malpractice_flagged = True

        att.violation_logs = current_logs
        att.webcam_snapshots = current_snapshots
        db.commit()
        
    return {
        "success": True,
        "person_count": analysis.get("person_count", 0),
        "detected_objects": analysis.get("detected_objects", []),
        "violations": violations,
        "annotated_snapshot": annotated_snapshot,
        "tab_switch_count": att.tab_switch_count,
        "malpractice_flagged": att.malpractice_flagged
    }
