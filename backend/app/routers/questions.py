from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.models import Question, QuestionOption, Course, CourseOutcome, User
from app.schemas.schemas import QuestionCreate
from app.auth.jwt import get_current_user

router = APIRouter(prefix="/api/v1/questions", tags=["Question Bank"])

@router.get("")
def get_questions(
    course_id: Optional[int] = None,
    unit: Optional[int] = None,
    bloom_level: Optional[str] = None,
    difficulty: Optional[str] = None,
    question_type: Optional[str] = None,
    co_id: Optional[int] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Question)
    if course_id:
        query = query.filter(Question.course_id == course_id)
    if unit:
        query = query.filter(Question.unit == unit)
    if bloom_level:
        query = query.filter(Question.bloom_level == bloom_level)
    if difficulty:
        query = query.filter(Question.difficulty == difficulty)
    if question_type:
        query = query.filter(Question.question_type == question_type)
    if co_id:
        query = query.filter(Question.co_id == co_id)
    if search:
        query = query.filter(Question.question_text.ilike(f"%{search}%"))
        
    questions = query.order_by(Question.id.desc()).all()
    res = []
    for q in questions:
        res.append({
            "id": q.id,
            "question_text": q.question_text,
            "course_id": q.course_id,
            "course_code": q.course.code if q.course else "N/A",
            "unit": q.unit,
            "topic": q.topic,
            "marks": q.marks,
            "difficulty": q.difficulty,
            "bloom_level": q.bloom_level,
            "question_type": q.question_type,
            "co_id": q.co_id,
            "co_code": q.co.code if q.co else "N/A",
            "solution_answer": q.solution_answer,
            "status": q.status,
            "options": [{"id": o.id, "option_text": o.option_text, "is_correct": o.is_correct} for o in q.options]
        })
    return res

@router.post("")
def create_question(
    data: QuestionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    q = Question(
        question_text=data.question_text,
        course_id=data.course_id,
        unit=data.unit,
        topic=data.topic,
        marks=data.marks,
        difficulty=data.difficulty,
        bloom_level=data.bloom_level,
        question_type=data.question_type,
        co_id=data.co_id,
        solution_answer=data.solution_answer,
        keywords=data.keywords,
        created_by_id=current_user.id
    )
    db.add(q)
    db.flush()
    
    if data.options:
        for opt in data.options:
            option = QuestionOption(
                question_id=q.id,
                option_text=opt.option_text,
                is_correct=opt.is_correct
            )
            db.add(option)
            
    db.commit()
    db.refresh(q)
    return {"message": "Question created successfully", "question_id": q.id}

@router.post("/{id}/duplicate")
def duplicate_question(id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    orig = db.query(Question).filter(Question.id == id).first()
    if not orig:
        raise HTTPException(status_code=404, detail="Question not found")
        
    dup = Question(
        question_text=f"[Copy] {orig.question_text}",
        course_id=orig.course_id,
        unit=orig.unit,
        topic=orig.topic,
        marks=orig.marks,
        difficulty=orig.difficulty,
        bloom_level=orig.bloom_level,
        question_type=orig.question_type,
        co_id=orig.co_id,
        solution_answer=orig.solution_answer,
        keywords=orig.keywords,
        created_by_id=current_user.id
    )
    db.add(dup)
    db.flush()
    
    for opt in orig.options:
        dup_opt = QuestionOption(
            question_id=dup.id,
            option_text=opt.option_text,
            is_correct=opt.is_correct
        )
        db.add(dup_opt)
        
    db.commit()
    return {"message": "Question duplicated successfully", "new_question_id": dup.id}
