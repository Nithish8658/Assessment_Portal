from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Dict, Any, Optional
import datetime

from app.database import get_db
from app.models.models import User, StudentProfile, FacultyProfile, AcademicClass, Programme, Department, Notification
from app.models.assessment_models import (
    AssessmentDomain,
    AssessmentRound,
    AssessmentActivationRequest,
    AssessmentStudentAllocation,
    AssessmentAttempt,
    AssessmentResult,
    CompetencyScore,
    Competency
)
from app.schemas.assessment_schemas import (
    TutorStudentCohortItem,
    Student360Response,
    CompetencyRadarItem,
    TutorClassOption,
    Class360Response,
    Class360Info,
    Class360Kpis,
    ClassRoundSummary,
    ClassReadinessDistribution,
    ClassStudentRankingItem
)
from app.auth.jwt import get_current_user
from app.services.assessment.authorization import get_tutor_authorized_students_query, can_view_student_attempt
from app.services.assessment.scoring_service import scoring_service
from app.services.assessment.competency_profiles import load_profiles, merge_profiles, profile_view, empty_view


def _utc_now_iso() -> str:
    return datetime.datetime.utcnow().isoformat() + "Z"


def _readiness_bucket(readiness: str) -> str:
    r = (readiness or "").lower()
    if "adv" in r:
        return "advanced"
    if "pro" in r:
        return "proficient"
    if "dev" in r or "inter" in r:
        return "developing"
    if "beg" in r or "needs" in r:
        return "beginner"
    return "pending"


def _student_views(db, student_ids, target_domain):
    """{student_id: stored analytics view} for the domain (or merged across domains)."""
    profiles = load_profiles(db, student_ids, target_domain.id if target_domain else None)
    views = {}
    if target_domain:
        for sid in student_ids:
            p = profiles.get((sid, target_domain.id))
            views[sid] = profile_view(p) if p else empty_view(target_domain)
    else:
        by_student = {}
        for (sid, _), p in profiles.items():
            by_student.setdefault(sid, []).append(p)
        for sid in student_ids:
            views[sid] = merge_profiles(by_student[sid]) if sid in by_student else empty_view(None)
    return views


def _round_scores(view, by_number=True):
    return {str(r["round_number"]): r.get("percentage") if r.get("published") else None for r in view["rounds"]} if by_number else {}


def _legacy_round_columns(round_scores):
    return {f"round{n}_score": round_scores.get(str(n)) for n in range(1, 6)}

router = APIRouter(prefix="/api/v1/assessment/tutor", tags=["Tutor Cohort Analytics"])

@router.get("/cohort", response_model=List[TutorStudentCohortItem])
def get_tutor_cohort_results(
    domain_slug: Optional[str] = None,
    academic_class_id: Optional[int] = None,
    active_role: Optional[str] = None,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns scoped student cohort results for the logged-in Class Tutor or HoD.
    """
    students_query = get_tutor_authorized_students_query(current_user, db)

    if academic_class_id:
        target_class = db.query(AcademicClass).filter(AcademicClass.id == academic_class_id).first()
        if target_class:
            students_query = students_query.filter(
                StudentProfile.programme_id == target_class.programme_id,
                StudentProfile.batch_name == target_class.batch_name,
                StudentProfile.section_name == target_class.section_name
            )

    if search:
        search_term = f"%{search.strip()}%"
        from sqlalchemy import or_
        students_query = students_query.join(User, StudentProfile.user_id == User.id).filter(
            or_(
                StudentProfile.register_number.ilike(search_term),
                User.full_name.ilike(search_term),
                User.email.ilike(search_term)
            )
        )

    students = students_query.options(
        joinedload(StudentProfile.user),
        joinedload(StudentProfile.programme)
    ).all()

    target_domain = None
    if domain_slug:
        target_domain = db.query(AssessmentDomain).filter(AssessmentDomain.slug == domain_slug).first()

    # Pre-fetch classes for O(1) matching
    all_classes = db.query(AcademicClass).all()
    class_map = {(c.programme_id, c.batch_name, c.section_name): c for c in all_classes}

    # Stored analytics profiles (latest published result per round), prefilled when rounds complete.
    views = _student_views(db, [s.id for s in students], target_domain)

    cohort_list = []
    for s in students:
        v = views[s.id]
        round_scores = _round_scores(v, by_number=bool(target_domain))
        if target_domain and v["rounds_total"] and v["rounds_completed"] >= v["rounds_total"]:
            overall_status = "Completed"
        elif v["has_activity"]:
            overall_status = "In Progress"
        else:
            overall_status = "Not Started"
        c_match = class_map.get((s.programme_id, s.batch_name, s.section_name))
        cohort_list.append(TutorStudentCohortItem(
            student_id=s.id,
            user_id=s.user_id,
            register_number=s.register_number,
            full_name=s.user.full_name if s.user else "N/A",
            email=s.user.email if s.user else "N/A",
            programme_name=s.programme.name if s.programme else "N/A",
            batch_name=s.batch_name or "",
            section_name=s.section_name or "",
            class_id=c_match.id if c_match else None,
            class_name=c_match.name if c_match else None,
            class_code=c_match.class_code if c_match else None,
            allocation_status="APPROVED" if v["has_activity"] else "NOT_ALLOCATED",
            round_scores=round_scores,
            rounds_completed=v["rounds_completed"],
            rounds_total=v["rounds_total"],
            overall_percentage=v["overall_percentage"],
            overall_status=overall_status,
            readiness_index=v["readiness_index"],
            **_legacy_round_columns(round_scores),
        ))

    return cohort_list

@router.get("/classes", response_model=List[TutorClassOption])
def get_tutor_authorized_classes(
    active_role: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns the list of classes authorized for the logged-in user (HoD, Tutor, or Admin),
    including enrolled student counts. Respects active_role if provided.
    """
    roles = [r.name for r in current_user.roles]
    query = db.query(AcademicClass).join(Programme)

    effective_role = active_role if active_role and active_role in roles else None

    if "Administrator" not in roles:
        if effective_role == "Class Tutor" or (not effective_role and "Class Tutor" in roles and "HoD" not in roles):
            fp = current_user.faculty_profile
            if not fp:
                return []
            query = query.filter(
                (AcademicClass.tutor_id == fp.id) |
                (
                    (AcademicClass.programme_id == fp.assigned_programme_id) &
                    (AcademicClass.batch_name == fp.assigned_batch) &
                    (AcademicClass.section_name == fp.assigned_section)
                )
            )
        elif effective_role == "HoD" or (not effective_role and "HoD" in roles):
            fp = current_user.faculty_profile
            if not fp or not fp.department_id:
                return []
            query = query.filter(Programme.department_id == fp.department_id)
        elif "Class Tutor" in roles:
            fp = current_user.faculty_profile
            if not fp:
                return []
            query = query.filter(
                (AcademicClass.tutor_id == fp.id) |
                (
                    (AcademicClass.programme_id == fp.assigned_programme_id) &
                    (AcademicClass.batch_name == fp.assigned_batch) &
                    (AcademicClass.section_name == fp.assigned_section)
                )
            )

    classes = query.order_by(AcademicClass.name.asc()).all()

    result = []
    for c in classes:
        stu_cnt = db.query(StudentProfile).filter(
            StudentProfile.programme_id == c.programme_id,
            StudentProfile.batch_name == c.batch_name,
            StudentProfile.section_name == c.section_name
        ).count()

        result.append(TutorClassOption(
            id=c.id,
            class_code=c.class_code,
            name=c.name,
            programme_name=c.programme.name if c.programme else "N/A",
            batch_name=c.batch_name or "",
            section_name=c.section_name or "",
            semester_num=c.semester_num or 1,
            student_count=stu_cnt
        ))

    return result

@router.get("/classes/{class_id}/360", response_model=Class360Response)
def get_class_360(
    class_id: int,
    domain_slug: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generates a comprehensive Class 360° Diagnostic Dossier aggregating cohort KPIs,
    round-by-round attainment, readiness distribution, competency scores, and student merit roster.
    """
    cls = db.query(AcademicClass).filter(AcademicClass.id == class_id).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Academic class not found.")

    roles = [r.name for r in current_user.roles]
    if "Administrator" not in roles:
        if "HoD" in roles:
            fp = current_user.faculty_profile
            dept_id = fp.department_id if fp else None
            if not dept_id or not cls.programme or cls.programme.department_id != dept_id:
                raise HTTPException(status_code=403, detail="Class is not within your department scope.")
        elif "Class Tutor" in roles:
            fp = current_user.faculty_profile
            is_authorized = False
            if fp:
                if cls.tutor_id == fp.id:
                    is_authorized = True
                elif fp.assigned_programme_id == cls.programme_id and fp.assigned_batch == cls.batch_name and fp.assigned_section == cls.section_name:
                    is_authorized = True
            if not is_authorized:
                raise HTTPException(status_code=403, detail="Class is not assigned to you.")

    # Students in class
    students = db.query(StudentProfile).filter(
        StudentProfile.programme_id == cls.programme_id,
        StudentProfile.batch_name == cls.batch_name,
        StudentProfile.section_name == cls.section_name
    ).all()

    total_enrolled = len(students)
    student_ids = [s.id for s in students]

    target_domain = None
    if domain_slug:
        target_domain = db.query(AssessmentDomain).filter(AssessmentDomain.slug == domain_slug).first()

    # Read the stored per-student profiles (prefilled when rounds complete) and aggregate.
    views = _student_views(db, student_ids, target_domain)

    # Rounds in scope: the domain's rounds, or every round present in the stored profiles.
    rounds_meta = {}
    for v in views.values():
        for r in v["rounds"]:
            rounds_meta.setdefault(r["round_id"], r)
    rounds = sorted(rounds_meta.values(), key=lambda r: (r.get("domain_title") or "", r["round_number"]))

    round_summaries = []
    for rm in rounds:
        results = [r for v in views.values() for r in v["rounds"] if r["round_id"] == rm["round_id"] and r.get("published")]
        n = len(results)
        passed_n = sum(1 for r in results if r.get("passed"))
        round_summaries.append(ClassRoundSummary(
            round_id=rm["round_id"],
            round_number=rm["round_number"],
            round_title=rm["round_title"],
            attempted_count=n,
            passed_count=passed_n,
            pass_rate=round(passed_n / n * 100.0, 1) if n else 0.0,
            average_score=round(sum(r["percentage"] or 0.0 for r in results) / n, 1) if n else 0.0,
        ))

    student_rankings = []
    readiness_counts = {"advanced": 0, "proficient": 0, "developing": 0, "beginner": 0, "pending": 0}
    cleared_all_count = 0
    pooled = {}
    for s in students:
        v = views[s.id]
        round_scores = _round_scores(v, by_number=bool(target_domain))
        readiness_counts[_readiness_bucket(v["readiness_index"])] += 1
        if v["rounds"] and all(r.get("published") and r.get("passed") for r in v["rounds"]):
            cleared_all_count += 1
        for c in v["competencies"]:
            item = pooled.setdefault(c["competency_code"], {**c, "score": 0.0, "max_score": 0.0})
            item["score"] += c.get("score", 0.0)
            item["max_score"] += c.get("max_score", 0.0)
        student_rankings.append(ClassStudentRankingItem(
            student_id=s.id,
            register_number=s.register_number,
            full_name=s.user.full_name if s.user else "Candidate",
            round_scores=round_scores,
            overall_percentage=v["overall_percentage"],
            readiness_index=v["readiness_index"],
            **_legacy_round_columns(round_scores),
        ))
    student_rankings.sort(key=lambda x: (x.overall_percentage is not None, x.overall_percentage or 0.0), reverse=True)

    competency_items = []
    for item in sorted(pooled.values(), key=lambda c: c["competency_code"]):
        pct = round(item["score"] / item["max_score"] * 100.0, 1) if item["max_score"] > 0 else 0.0
        competency_items.append({**item, "score": round(item["score"], 2), "max_score": round(item["max_score"], 2),
                                 "percentage": pct, "readiness_level": scoring_service.calculate_readiness_level(pct)})
    competency_radar_list = [CompetencyRadarItem(**c) for c in competency_items]
    strengths, gaps = scoring_service.derive_strengths_and_gaps(competency_items)

    participated_count = sum(1 for v in views.values() if v["has_activity"])
    part_rate = round((participated_count / total_enrolled) * 100.0, 1) if total_enrolled > 0 else 0.0
    all_evaluated_pcts = [x.overall_percentage for x in student_rankings if x.overall_percentage is not None]
    class_avg = round(sum(all_evaluated_pcts) / len(all_evaluated_pcts), 1) if all_evaluated_pcts else None
    updated_times = [v["updated_at"] for v in views.values() if v.get("updated_at")]

    tutor_name = cls.tutor.user.full_name if cls.tutor and cls.tutor.user else "Not Assigned"
    prog_name = cls.programme.name if cls.programme else "N/A"
    dept_name = cls.programme.department.name if cls.programme and cls.programme.department else "N/A"

    return Class360Response(
        class_info=Class360Info(
            id=cls.id,
            class_code=cls.class_code,
            name=cls.name,
            programme_name=prog_name,
            department_name=dept_name,
            batch_name=cls.batch_name or "",
            section_name=cls.section_name or "",
            semester_num=cls.semester_num or 1,
            tutor_name=tutor_name,
            total_enrolled=total_enrolled
        ),
        kpis=Class360Kpis(
            total_students=total_enrolled,
            participated_count=participated_count,
            participation_rate=part_rate,
            class_average_pct=class_avg,
            cleared_all_rounds_count=cleared_all_count,
            highest_score=max(all_evaluated_pcts) if all_evaluated_pcts else None,
            lowest_score=min(all_evaluated_pcts) if all_evaluated_pcts else None
        ),
        rounds_performance=round_summaries,
        readiness_distribution=ClassReadinessDistribution(**readiness_counts),
        competency_scores=competency_radar_list,
        strengths=strengths,
        areas_to_improve=gaps,
        student_rankings=student_rankings,
        domain_title=target_domain.title if target_domain else None,
        generated_at=max(updated_times) if updated_times else None,
    )

@router.get("/students/{student_id}/360", response_model=Student360Response)
def get_student_360(
    student_id: int,
    domain_slug: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Student 360 profile read from the stored analytics profile, which is rebuilt when
    the student's rounds start, are submitted or are graded. Each round shows the latest
    published result (retakes replace earlier results).
    """
    student = db.query(StudentProfile).filter(StudentProfile.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")
    if not can_view_student_attempt(current_user, student.id, db):
        raise HTTPException(status_code=403, detail="This student is outside your class or department scope.")

    target_domain = None
    if domain_slug:
        target_domain = db.query(AssessmentDomain).filter(AssessmentDomain.slug == domain_slug).first()

    # Stored profile, prefilled when the student's rounds complete.
    v = _student_views(db, [student.id], target_domain)[student.id]

    student_dict = {
        "id": student.id,
        "register_number": student.register_number,
        "full_name": student.user.full_name if student.user else "Candidate",
        "email": student.user.email if student.user else "",
        "programme_name": student.programme.name if student.programme else "",
        "batch_name": student.batch_name or "",
        "section_name": student.section_name or ""
    }

    return Student360Response(
        student=student_dict,
        rounds_performance=v["rounds"],
        competency_scores=[CompetencyRadarItem(**c) for c in v["competencies"]],
        strengths=v["strengths"],
        areas_to_improve=v["gaps"],
        overall_percentage=v["overall_percentage"],
        readiness_index=v["readiness_index"],
        generated_at=v["updated_at"],
    )
