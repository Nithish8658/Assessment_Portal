from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.models import (
    AssessmentAttempt, StudentAnswer, Question, StudentProfile, User, AuditLog
)
from app.auth.jwt import get_current_user

router = APIRouter(prefix="/api/v1/evaluation", tags=["Faculty Evaluation Workspace"])

@router.get("/pending")
def get_pending_evaluations(db: Session = Depends(get_db)):
    attempts = db.query(AssessmentAttempt).filter(AssessmentAttempt.status == "Submitted").all()
    res = []
    for att in attempts:
        student = att.student
        res.append({
            "attempt_id": att.id,
            "assessment_id": att.assessment_id,
            "assessment_title": att.assessment.title if att.assessment else "N/A",
            "course_title": att.assessment.course.title if att.assessment and att.assessment.course else "N/A",
            "student_name": student.user.full_name if student and student.user else "N/A",
            "register_number": student.register_number if student else "N/A",
            "submit_time": att.submit_time.strftime("%Y-%m-%d %H:%M") if att.submit_time else "N/A",
            "malpractice_flagged": att.malpractice_flagged or False,
            "tab_switch_count": att.tab_switch_count or 0
        })
    return res

@router.get("/attempt/{attempt_id}")
def get_attempt_for_evaluation(attempt_id: int, db: Session = Depends(get_db)):
    att = db.query(AssessmentAttempt).filter(AssessmentAttempt.id == attempt_id).first()
    if not att:
        raise HTTPException(status_code=404, detail="Attempt not found")
        
    student = att.student
    answers = []
    for ans in att.answers:
        q = ans.question
        answers.append({
            "answer_id": ans.id,
            "question_id": q.id,
            "question_text": q.question_text,
            "question_type": q.question_type,
            "max_marks": q.marks,
            "solution_answer": q.solution_answer,
            "descriptive_text": ans.descriptive_text,
            "selected_option_id": ans.selected_option_id,
            "selected_option_text": next((o.option_text for o in q.options if o.id == ans.selected_option_id), None) if ans.selected_option_id else None,
            "marks_awarded": ans.marks_awarded,
            "evaluator_feedback": ans.evaluator_feedback
        })
        
    return {
        "attempt_id": att.id,
        "assessment_title": att.assessment.title if att.assessment else "N/A",
        "student_name": student.user.full_name if student and student.user else "N/A",
        "register_number": student.register_number if student else "N/A",
        "total_score": att.total_score,
        "malpractice_flagged": att.malpractice_flagged or False,
        "tab_switch_count": att.tab_switch_count or 0,
        "violation_logs": att.violation_logs or [],
        "webcam_snapshots": att.webcam_snapshots or [],
        "answers": answers
    }

@router.post("/evaluate-answer")
def evaluate_student_answer(
    answer_id: int,
    marks_awarded: float,
    feedback: str = "",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ans = db.query(StudentAnswer).filter(StudentAnswer.id == answer_id).first()
    if not ans:
        raise HTTPException(status_code=404, detail="Student answer not found")
        
    ans.marks_awarded = marks_awarded
    ans.evaluator_feedback = feedback
    
    # Recalculate total score for attempt
    att = ans.attempt
    if att:
        all_ans = db.query(StudentAnswer).filter(StudentAnswer.attempt_id == att.id).all()
        att.total_score = sum(a.marks_awarded for a in all_ans)
        att.status = "Evaluated"
        
    db.commit()
    return {"message": "Answer evaluated successfully", "new_total_score": att.total_score if att else 0.0}
