import random
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.models import (
    QuestionPaper, QuestionPaperQuestion, Question, Course, User, ApprovalWorkflow, ApprovalHistory, AuditLog
)
from app.schemas.schemas import PaperGenerateRule
from app.auth.jwt import get_current_user

from pydantic import BaseModel

class ManualPaperCreateRule(BaseModel):
    title: str
    course_id: int
    max_marks: float = 50.0
    duration_minutes: int = 90
    question_ids: List[int]

router = APIRouter(prefix="/api/v1/question-papers", tags=["Question Paper Creation"])

@router.get("")
def get_question_papers(course_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(QuestionPaper)
    if course_id:
        query = query.filter(QuestionPaper.course_id == course_id)
    papers = query.order_by(QuestionPaper.id.desc()).all()
    res = []
    for p in papers:
        res.append({
            "id": p.id,
            "title": p.title,
            "course_id": p.course_id,
            "course_code": p.course.code if p.course else "N/A",
            "course_title": p.course.title if p.course else "N/A",
            "max_marks": p.max_marks,
            "duration_minutes": p.duration_minutes,
            "status": p.status,
            "created_at": p.created_at.strftime("%Y-%m-%d %H:%M") if p.created_at else "N/A",
            "question_count": len(p.id if hasattr(p, 'questions') else [])
        })
    return res

@router.get("/{id}")
def get_question_paper_detail(id: int, db: Session = Depends(get_db)):
    p = db.query(QuestionPaper).filter(QuestionPaper.id == id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Question paper not found")
        
    paper_qs = db.query(QuestionPaperQuestion).filter(QuestionPaperQuestion.paper_id == id).order_by(QuestionPaperQuestion.order_num).all()
    
    questions_list = []
    bloom_counts = {}
    unit_counts = {}
    co_counts = {}
    total_marks = 0.0
    
    for pq in paper_qs:
        q = db.query(Question).filter(Question.id == pq.question_id).first()
        if q:
            questions_list.append({
                "paper_question_id": pq.id,
                "question_id": q.id,
                "section": pq.section_name,
                "order": pq.order_num,
                "text": q.question_text,
                "marks": q.marks,
                "unit": q.unit,
                "bloom_level": q.bloom_level,
                "difficulty": q.difficulty,
                "question_type": q.question_type,
                "co_code": q.co.code if q.co else "CO1",
                "options": [{"id": o.id, "text": o.option_text, "is_correct": o.is_correct} for o in q.options]
            })
            bloom_counts[q.bloom_level] = bloom_counts.get(q.bloom_level, 0) + 1
            unit_counts[q.unit] = unit_counts.get(q.unit, 0) + 1
            co_code = q.co.code if q.co else "CO1"
            co_counts[co_code] = co_counts.get(co_code, 0) + 1
            total_marks += q.marks
            
    blueprint = {
        "unit_distribution": unit_counts,
        "bloom_distribution": bloom_counts,
        "co_distribution": co_counts,
        "total_questions": len(questions_list),
        "total_marks": total_marks
    }
    
    return {
        "id": p.id,
        "title": p.title,
        "course_id": p.course_id,
        "course_code": p.course.code if p.course else "N/A",
        "course_title": p.course.title if p.course else "N/A",
        "max_marks": p.max_marks,
        "duration_minutes": p.duration_minutes,
        "status": p.status,
        "blueprint": blueprint,
        "questions": questions_list
    }

@router.post("/generate")
def generate_rule_based_paper(
    rule: PaperGenerateRule,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    course = db.query(Course).filter(Course.id == rule.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
        
    selected_question_ids = []
    
    for unit_num, target_count in rule.unit_distribution.items():
        avail_qs = db.query(Question).filter(
            Question.course_id == rule.course_id,
            Question.unit == unit_num,
            Question.status == "Active"
        ).all()
        
        if len(avail_qs) < target_count:
            # Fallback if not enough unit questions
            chosen = avail_qs
        else:
            chosen = random.sample(avail_qs, target_count)
            
        selected_question_ids.extend([q.id for q in chosen])
        
    if not selected_question_ids:
        # Fallback to any questions in course
        all_qs = db.query(Question).filter(Question.course_id == rule.course_id).all()
        selected_question_ids = [q.id for q in all_qs[:10]]
        
    paper = QuestionPaper(
        title=rule.title,
        course_id=rule.course_id,
        max_marks=rule.max_marks,
        duration_minutes=rule.duration_minutes,
        created_by_id=current_user.id,
        status="Submitted",
        blueprint_metadata={"rule": rule.model_dump()}
    )
    db.add(paper)
    db.flush()
    
    order = 1
    for qid in selected_question_ids:
        section = "Section A" if order <= 5 else ("Section B" if order <= 10 else "Section C")
        pq = QuestionPaperQuestion(
            paper_id=paper.id,
            question_id=qid,
            section_name=section,
            order_num=order
        )
        db.add(pq)
        order += 1
        
    # Workflow record
    wf = ApprovalWorkflow(
        entity_type="QuestionPaper",
        entity_id=paper.id,
        current_status="Submitted",
        submitted_by_id=current_user.id
    )
    db.add(wf)
    
    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action="QUESTION_PAPER_GENERATED",
        module="QuestionPaper",
        record_id=str(paper.id),
        new_value=f"Generated paper {paper.title} with {len(selected_question_ids)} questions"
    )
    db.add(audit)
    
    db.commit()
    db.refresh(paper)
    return {"message": "Question paper generated successfully", "paper_id": paper.id}

@router.post("/manual-create")
def create_manual_paper(
    rule: ManualPaperCreateRule,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    course = db.query(Course).filter(Course.id == rule.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
        
    if not rule.question_ids:
        raise HTTPException(status_code=400, detail="Please select at least 1 question for the paper")
        
    paper = QuestionPaper(
        title=rule.title,
        course_id=rule.course_id,
        max_marks=rule.max_marks,
        duration_minutes=rule.duration_minutes,
        created_by_id=current_user.id,
        status="Submitted",
        blueprint_metadata={"mode": "Manual", "selected_count": len(rule.question_ids)}
    )
    db.add(paper)
    db.flush()
    
    order = 1
    for qid in rule.question_ids:
        section = "Section A" if order <= 5 else ("Section B" if order <= 10 else "Section C")
        pq = QuestionPaperQuestion(
            paper_id=paper.id,
            question_id=qid,
            section_name=section,
            order_num=order
        )
        db.add(pq)
        order += 1
        
    wf = ApprovalWorkflow(
        entity_type="QuestionPaper",
        entity_id=paper.id,
        current_status="Submitted",
        submitted_by_id=current_user.id
    )
    db.add(wf)
    
    audit = AuditLog(
        user_id=current_user.id,
        action="QUESTION_PAPER_MANUAL_CREATED",
        module="QuestionPaper",
        record_id=str(paper.id),
        new_value=f"Manually created paper {paper.title} with {len(rule.question_ids)} questions"
    )
    db.add(audit)
    
    db.commit()
    db.refresh(paper)
    return {"message": "Manual Question paper created successfully", "paper_id": paper.id}

@router.post("/{id}/action")
def update_paper_status(
    id: int,
    action: str, # Submit, Approve, Reject, Request Changes
    comments: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    p = db.query(QuestionPaper).filter(QuestionPaper.id == id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Paper not found")
        
    old_status = p.status
    if action == "Approve":
        p.status = "Approved"
    elif action == "Reject":
        p.status = "Changes Requested"
    elif action == "Publish":
        p.status = "Published"
    elif action == "Submit":
        p.status = "Submitted"
        
    audit = AuditLog(
        user_id=current_user.id,
        action=f"PAPER_{action.upper()}",
        module="QuestionPaper",
        record_id=str(p.id),
        old_value=old_status,
        new_value=p.status
    )
    db.add(audit)
    
    db.commit()
    return {"message": f"Paper status updated to {p.status}", "status": p.status}
