import re

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional

from app.database import get_db
from app.models.models import User
from app.models.assessment_models import (
    AssessmentDomain,
    AssessmentRound,
    AssessmentPolicy,
    AssessmentQuestion,
    QuestionEvaluationConfig,
    QuestionVersion,
    Competency,
)
from app.services.audit import record_audit
from app.services.assessment.c_question_content import make_c_starter_template
from app.schemas.assessment_schemas import AdminQuestionResponse, DomainDetailResponse, RoundSummaryResponse
from app.auth.jwt import get_current_user, require_roles

router = APIRouter(prefix="/api/v1/assessment/admin", tags=["Assessment Administration & Track Customizer"])

ADMIN_ROLES = ["Administrator"]
# Class Tutors may browse tracks, rounds and questions; only Administrators change them
VIEW_ROLES = ["Administrator", "Class Tutor"]
DIFFICULTIES = {"Easy", "Medium", "Hard", "Expert"}

class UpdateRoundConfigRequest(BaseModel):
    duration_minutes: Optional[int] = Field(default=None, gt=0)
    questions_per_attempt: Optional[int] = None
    passing_score: Optional[float] = None
    weightage_percent: Optional[float] = None
    rules_json: Optional[Dict[str, Any]] = None

@router.put("/rounds/{round_id}", response_model=RoundSummaryResponse)
def update_round_config(
    round_id: int,
    data: UpdateRoundConfigRequest,
    request: Request,
    current_user: User = Depends(require_roles(ADMIN_ROLES)),
    db: Session = Depends(get_db)
):
    round_obj = db.query(AssessmentRound).filter(AssessmentRound.id == round_id).first()
    if not round_obj:
        raise HTTPException(status_code=404, detail="Round not found.")
    if data.questions_per_attempt is not None:
        active = db.query(AssessmentQuestion).filter(
            AssessmentQuestion.round_id == round_id, AssessmentQuestion.status == "Active"
        ).count()
        if data.questions_per_attempt < 1 or data.questions_per_attempt > active:
            raise HTTPException(status_code=400, detail=f"Questions per attempt must be between 1 and the {active} active questions in this round.")
    if data.passing_score is not None and not (0 <= data.passing_score <= 100):
        raise HTTPException(status_code=400, detail="Passing score must be between 0 and 100.")
    if data.weightage_percent is not None and not (0 <= data.weightage_percent <= 100):
        raise HTTPException(status_code=400, detail="Weightage must be between 0 and 100.")
    before = {
        "duration_minutes": round_obj.duration_minutes,
        "questions_per_attempt": round_obj.questions_per_attempt,
        "passing_score": round_obj.policy.passing_score if round_obj.policy else None,
        "weightage_percent": round_obj.policy.weightage_percent if round_obj.policy else None,
    }

    if data.duration_minutes is not None:
        round_obj.duration_minutes = data.duration_minutes
    if data.questions_per_attempt is not None:
        round_obj.questions_per_attempt = data.questions_per_attempt
    if data.rules_json is not None:
        round_obj.rules_json = data.rules_json

    policy = round_obj.policy
    if not policy:
        policy = AssessmentPolicy(round_id=round_obj.id)
        db.add(policy)

    if data.passing_score is not None:
        policy.passing_score = data.passing_score
    if data.weightage_percent is not None:
        policy.weightage_percent = data.weightage_percent

    record_audit(db, current_user, "ROUND_CONFIG_UPDATED", "QUESTION_BANK", round_obj.id, before,
                 data.model_dump(exclude_none=True), request)
    db.commit()
    db.refresh(round_obj)

    return RoundSummaryResponse(
        id=round_obj.id,
        domain_id=round_obj.domain_id,
        round_number=round_obj.round_number,
        slug=round_obj.slug,
        title=round_obj.title,
        description=round_obj.description,
        round_type=round_obj.round_type,
        duration_minutes=round_obj.duration_minutes,
        questions_per_attempt=round_obj.questions_per_attempt,
        passing_score=policy.passing_score,
        weightage_percent=policy.weightage_percent,
        rules=round_obj.rules_json or {}
    )

@router.get("/rounds/{round_id}/questions", response_model=List[AdminQuestionResponse])
def get_admin_round_questions(
    round_id: int,
    current_user: User = Depends(require_roles(["Administrator", "Class Tutor", "HoD"])),
    db: Session = Depends(get_db)
):
    questions = db.query(AssessmentQuestion).filter(AssessmentQuestion.round_id == round_id).order_by(AssessmentQuestion.id).all()
    # Answer keys, reference solutions and hidden tests are visible to administrators only;
    # tutors and HoDs see the questions without them (their classes may be taking the round).
    can_see_keys = any(r.name in ADMIN_ROLES for r in current_user.roles)
    res = []
    for q in questions:
        cfg = q.evaluation_config if can_see_keys else None
        res.append(AdminQuestionResponse(
            id=q.id,
            round_id=q.round_id,
            competency_id=q.competency_id,
            question_type=q.question_type,
            title=q.title,
            candidate_content=q.candidate_content,
            candidate_code_template=q.candidate_code_template,
            options_json=q.options_json,
            difficulty=q.difficulty,
            marks=q.marks,
            time_limit_seconds=q.time_limit_seconds,
            version=q.version,
            status=q.status,
            evaluation_type=cfg.evaluation_type if cfg else (q.evaluation_config.evaluation_type if q.evaluation_config else None),
            correct_answer=cfg.correct_answer if cfg else None,
            reference_solution=cfg.reference_solution if cfg else None,
            public_test_cases=cfg.public_test_cases_json if cfg else [],
            hidden_test_cases=cfg.hidden_test_cases_json if cfg else [],
            scoring_rules=cfg.scoring_rules_json if cfg else {}
        ))
    return res

@router.post("/sync-sequences")
def trigger_sync_sequences(
    current_user: User = Depends(require_roles(ADMIN_ROLES)),
    db: Session = Depends(get_db)
):
    """
    Administrative utility: re-synchronizes all primary key sequences across PostgreSQL tables
    to match the current MAX(id). Prevents duplicate key violation errors after data imports.
    """
    from app.migrations.sync_database_sequences import sync_sequences
    res = sync_sequences(db.get_bind())
    record_audit(db, current_user, "DB_SEQUENCES_SYNCED", "MAINTENANCE", None, None, {"updated": res.get("updated")})
    db.commit()
    return {"status": "success", "summary": res}


# ==============================================================================
# Domains (admin view includes inactive domains)
# ==============================================================================

class UpdateDomainRequest(BaseModel):
    is_active: Optional[bool] = None
    title: Optional[str] = Field(default=None, min_length=3, max_length=128)
    description: Optional[str] = None


def _domain_admin_payload(d: AssessmentDomain, db: Session) -> Dict[str, Any]:
    rounds = []
    for r in sorted(d.rounds, key=lambda x: x.round_number):
        counts = {}
        for diff, status_val in db.query(AssessmentQuestion.difficulty, AssessmentQuestion.status).filter(
            AssessmentQuestion.round_id == r.id
        ).all():
            key = "active" if status_val == "Active" else "archived"
            counts.setdefault(key, {}).setdefault(diff, 0)
            counts[key][diff] += 1
        policy = r.policy
        rounds.append({
            "id": r.id, "domain_id": d.id, "round_number": r.round_number, "slug": r.slug, "title": r.title,
            "description": r.description, "round_type": r.round_type, "duration_minutes": r.duration_minutes,
            "questions_per_attempt": r.questions_per_attempt,
            "passing_score": policy.passing_score if policy else 60.0,
            "weightage_percent": policy.weightage_percent if policy else 25.0,
            "rules": r.rules_json or {},
            "active_questions": sum((counts.get("active") or {}).values()),
            "archived_questions": sum((counts.get("archived") or {}).values()),
            "active_by_difficulty": counts.get("active") or {},
        })
    return {"id": d.id, "slug": d.slug, "title": d.title, "description": d.description,
            "is_active": d.is_active, "rounds": rounds}


@router.get("/domains")
def list_domains_admin(
    current_user: User = Depends(require_roles(VIEW_ROLES)),
    db: Session = Depends(get_db)
):
    domains = db.query(AssessmentDomain).order_by(AssessmentDomain.id).all()
    return [_domain_admin_payload(d, db) for d in domains]


@router.put("/domains/{domain_id}")
def update_domain(
    domain_id: int,
    data: UpdateDomainRequest,
    request: Request,
    current_user: User = Depends(require_roles(ADMIN_ROLES)),
    db: Session = Depends(get_db)
):
    d = db.query(AssessmentDomain).filter(AssessmentDomain.id == domain_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Domain not found.")
    before = {"is_active": d.is_active, "title": d.title, "description": d.description}
    changes = data.model_dump(exclude_none=True)
    for k, v in changes.items():
        setattr(d, k, v)
    record_audit(db, current_user, "DOMAIN_UPDATED", "QUESTION_BANK", d.id, before, changes, request)
    db.commit()
    return _domain_admin_payload(d, db)


# ==============================================================================
# Question bank editing
# ==============================================================================

class QuestionUpsertRequest(BaseModel):
    question_type: str = Field(..., min_length=2, max_length=32)
    title: str = Field(..., min_length=3, max_length=256)
    candidate_content: str = Field(..., min_length=3)
    candidate_code_template: Optional[str] = None
    options_json: Optional[Any] = None
    difficulty: str = "Medium"
    marks: float = Field(default=1.0, gt=0, le=100)
    time_limit_seconds: int = Field(default=60, gt=0, le=7200)
    competency_id: Optional[int] = None
    evaluation_type: Optional[str] = None
    correct_answer: Optional[str] = None
    reference_solution: Optional[str] = None
    public_test_cases: Optional[List[Any]] = None
    hidden_test_cases: Optional[List[Any]] = None
    scoring_rules: Optional[Dict[str, Any]] = None


class QuestionStatusRequest(BaseModel):
    status: str


class StarterPreviewRequest(BaseModel):
    reference_solution: str


def _norm_code(code: Optional[str]) -> str:
    code = re.sub(r"/\*.*?\*/", "", code or "", flags=re.S)
    code = re.sub(r"//[^\n]*", "", code)
    return re.sub(r"\s+", "", code)


def _validate_question(data: QuestionUpsertRequest) -> QuestionUpsertRequest:
    qt = data.question_type.strip().lower()
    data.question_type = qt
    if data.difficulty not in DIFFICULTIES:
        raise HTTPException(status_code=400, detail=f"Difficulty must be one of {sorted(DIFFICULTIES)}.")
    if qt == "mcq":
        opts = data.options_json
        if not isinstance(opts, list) or len(opts) < 2:
            raise HTTPException(status_code=400, detail="An MCQ needs at least two options.")
        opts = [str(o).strip() for o in opts]
        if any(not o for o in opts) or len(set(o.lower() for o in opts)) != len(opts):
            raise HTTPException(status_code=400, detail="MCQ options must be non-empty and distinct.")
        data.options_json = opts
        if not data.correct_answer or data.correct_answer.strip().lower() not in {o.lower() for o in opts}:
            raise HTTPException(status_code=400, detail="The correct answer must exactly match one of the options.")
        data.evaluation_type = data.evaluation_type or "ExactMatch"
    elif qt == "coding":
        if not (data.reference_solution or "").strip():
            raise HTTPException(status_code=400, detail="A coding question needs a reference solution (kept grader-side).")
        if not (data.candidate_code_template or "").strip():
            data.candidate_code_template = make_c_starter_template(data.reference_solution)
        if _norm_code(data.candidate_code_template) == _norm_code(data.reference_solution):
            raise HTTPException(status_code=400, detail="The starter code is identical to the reference solution; candidates would receive the answer.")
        data.options_json = None
        data.evaluation_type = data.evaluation_type or "AIEvaluation"
    elif qt == "debugging":
        if not (data.candidate_code_template or "").strip():
            raise HTTPException(status_code=400, detail="A debugging question needs the buggy code candidates will fix.")
        if not (data.correct_answer or "").strip():
            raise HTTPException(status_code=400, detail="Describe the known defect and expected fix (grader-only; never shown to candidates).")
        problem = data.candidate_content.replace("Problem Statement:", "").strip()
        data.options_json = {"problem": problem}  # no hints are ever stored for candidates
        data.evaluation_type = data.evaluation_type or "AIEvaluation"
        data.reference_solution = data.reference_solution or f"Known defect and expected fix: {data.correct_answer}"
    return data


def _question_snapshot(q: AssessmentQuestion) -> Dict[str, Any]:
    cfg = q.evaluation_config
    return {
        "question_type": q.question_type, "title": q.title, "candidate_content": q.candidate_content,
        "candidate_code_template": q.candidate_code_template, "options_json": q.options_json,
        "difficulty": q.difficulty, "marks": q.marks, "time_limit_seconds": q.time_limit_seconds,
        "competency_id": q.competency_id, "status": q.status, "version": q.version,
        "evaluation_type": cfg.evaluation_type if cfg else None,
        "correct_answer": cfg.correct_answer if cfg else None,
        "reference_solution": cfg.reference_solution if cfg else None,
        "public_test_cases": cfg.public_test_cases_json if cfg else [],
        "hidden_test_cases": cfg.hidden_test_cases_json if cfg else [],
        "scoring_rules": cfg.scoring_rules_json if cfg else {},
    }


def _apply_question(q: AssessmentQuestion, data: QuestionUpsertRequest, db: Session) -> None:
    if data.competency_id is not None and not db.query(Competency).filter(Competency.id == data.competency_id).first():
        raise HTTPException(status_code=400, detail="Unknown competency.")
    q.question_type = data.question_type
    q.title = data.title.strip()
    q.candidate_content = data.candidate_content
    q.candidate_code_template = data.candidate_code_template
    q.options_json = data.options_json
    q.difficulty = data.difficulty
    q.marks = data.marks
    q.time_limit_seconds = data.time_limit_seconds
    q.competency_id = data.competency_id
    cfg = q.evaluation_config
    if not cfg:
        cfg = QuestionEvaluationConfig(question_id=q.id)
        db.add(cfg)
        q.evaluation_config = cfg
    cfg.evaluation_type = data.evaluation_type or "ExactMatch"
    cfg.correct_answer = data.correct_answer
    cfg.reference_solution = data.reference_solution
    cfg.public_test_cases_json = data.public_test_cases or []
    cfg.hidden_test_cases_json = data.hidden_test_cases or []
    cfg.scoring_rules_json = data.scoring_rules or {}


def _admin_question_response(q: AssessmentQuestion) -> AdminQuestionResponse:
    cfg = q.evaluation_config
    return AdminQuestionResponse(
        id=q.id, round_id=q.round_id, competency_id=q.competency_id, question_type=q.question_type,
        title=q.title, candidate_content=q.candidate_content, candidate_code_template=q.candidate_code_template,
        options_json=q.options_json, difficulty=q.difficulty, marks=q.marks, time_limit_seconds=q.time_limit_seconds,
        version=q.version, status=q.status,
        evaluation_type=cfg.evaluation_type if cfg else None, correct_answer=cfg.correct_answer if cfg else None,
        reference_solution=cfg.reference_solution if cfg else None,
        public_test_cases=cfg.public_test_cases_json if cfg else [], hidden_test_cases=cfg.hidden_test_cases_json if cfg else [],
        scoring_rules=cfg.scoring_rules_json if cfg else {},
    )


@router.get("/competencies")
def list_competencies(
    current_user: User = Depends(require_roles(VIEW_ROLES)),
    db: Session = Depends(get_db)
):
    return [{"id": c.id, "code": c.code, "name": c.name, "category": c.category}
            for c in db.query(Competency).order_by(Competency.category, Competency.code).all()]


@router.post("/questions/starter-preview")
def preview_starter_template(
    data: StarterPreviewRequest,
    current_user: User = Depends(require_roles(ADMIN_ROLES)),
):
    """Builds a C starter skeleton (signatures + TODO bodies) from a reference solution."""
    return {"candidate_code_template": make_c_starter_template(data.reference_solution)}


@router.post("/rounds/{round_id}/questions", response_model=AdminQuestionResponse)
def create_question(
    round_id: int,
    data: QuestionUpsertRequest,
    request: Request,
    current_user: User = Depends(require_roles(ADMIN_ROLES)),
    db: Session = Depends(get_db)
):
    round_obj = db.query(AssessmentRound).filter(AssessmentRound.id == round_id).first()
    if not round_obj:
        raise HTTPException(status_code=404, detail="Round not found.")
    data = _validate_question(data)
    q = AssessmentQuestion(round_id=round_id, question_type=data.question_type, title=data.title,
                           candidate_content=data.candidate_content, version=1, status="Active")
    db.add(q)
    db.flush()
    _apply_question(q, data, db)
    db.flush()
    record_audit(db, current_user, "QUESTION_CREATED", "QUESTION_BANK", q.id, None,
                 {"round_id": round_id, "title": q.title, "difficulty": q.difficulty}, request)
    db.commit()
    db.refresh(q)
    return _admin_question_response(q)


@router.put("/questions/{question_id}", response_model=AdminQuestionResponse)
def update_question(
    question_id: int,
    data: QuestionUpsertRequest,
    request: Request,
    current_user: User = Depends(require_roles(ADMIN_ROLES)),
    db: Session = Depends(get_db)
):
    """Edits a question. The previous version is snapshotted; attempts already started keep their frozen copy."""
    q = db.query(AssessmentQuestion).filter(AssessmentQuestion.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found.")
    data = _validate_question(data)
    if data.question_type == "mcq" and isinstance(q.options_json, list) and q.options_json \
            and all(isinstance(o, dict) and "id" in o for o in q.options_json):
        # Seeded MCQs keep their {id, text} options with the answer stored as the option id,
        # the shape the exam screens and grader were built against.
        texts = data.options_json
        answer = data.correct_answer.strip().lower()
        data.options_json = [{"id": i + 1, "text": t} for i, t in enumerate(texts)]
        data.correct_answer = str(next(i + 1 for i, t in enumerate(texts) if t.lower() == answer))
    before = _question_snapshot(q)
    # 165 seeded questions already have a snapshot row for their current version
    existing = db.query(QuestionVersion).filter(
        QuestionVersion.question_id == q.id, QuestionVersion.version_num == (q.version or 1)
    ).first()
    if existing:
        existing.snapshot_json = before
    else:
        db.add(QuestionVersion(question_id=q.id, version_num=q.version or 1, snapshot_json=before))
    _apply_question(q, data, db)
    q.version = (q.version or 1) + 1
    record_audit(db, current_user, "QUESTION_UPDATED", "QUESTION_BANK", q.id,
                 {"version": before["version"], "title": before["title"], "difficulty": before["difficulty"]},
                 {"version": q.version, "title": q.title, "difficulty": q.difficulty}, request)
    db.commit()
    db.refresh(q)
    return _admin_question_response(q)


@router.post("/questions/{question_id}/status", response_model=AdminQuestionResponse)
def set_question_status(
    question_id: int,
    data: QuestionStatusRequest,
    request: Request,
    current_user: User = Depends(require_roles(ADMIN_ROLES)),
    db: Session = Depends(get_db)
):
    if data.status not in ("Active", "Archived"):
        raise HTTPException(status_code=400, detail="Status must be Active or Archived.")
    q = db.query(AssessmentQuestion).filter(AssessmentQuestion.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found.")
    if data.status == "Archived" and q.status == "Active":
        round_obj = q.round
        remaining = db.query(AssessmentQuestion).filter(
            AssessmentQuestion.round_id == q.round_id, AssessmentQuestion.status == "Active", AssessmentQuestion.id != q.id
        ).count()
        if round_obj and remaining < (round_obj.questions_per_attempt or 1):
            raise HTTPException(status_code=400, detail=(
                f"Archiving would leave {remaining} active questions, fewer than the {round_obj.questions_per_attempt} "
                "drawn per attempt. Add questions or lower questions per attempt first."))
    before = q.status
    q.status = data.status
    record_audit(db, current_user, "QUESTION_ARCHIVED" if data.status == "Archived" else "QUESTION_RESTORED",
                 "QUESTION_BANK", q.id, {"status": before}, {"status": q.status}, request)
    db.commit()
    db.refresh(q)
    return _admin_question_response(q)
