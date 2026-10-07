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
from app.services.assessment.authorization import get_tutor_authorized_students_query
from app.services.assessment.scoring_service import scoring_service

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

    # Batch query all attempts for all students in one single trip with eager joinedload
    student_ids = [s.id for s in students]
    from collections import defaultdict
    student_attempts_map = defaultdict(list)

    if student_ids:
        attempts_q = db.query(
            AssessmentAttempt,
            AssessmentStudentAllocation.student_id
        ).join(
            AssessmentStudentAllocation, AssessmentAttempt.allocation_id == AssessmentStudentAllocation.id
        ).options(
            joinedload(AssessmentAttempt.round),
            joinedload(AssessmentAttempt.result)
        ).filter(
            AssessmentStudentAllocation.student_id.in_(student_ids)
        )

        if target_domain:
            attempts_q = attempts_q.join(
                AssessmentActivationRequest, AssessmentStudentAllocation.request_id == AssessmentActivationRequest.id
            ).filter(AssessmentActivationRequest.domain_id == target_domain.id)

        for attempt_obj, s_id in attempts_q.all():
            student_attempts_map[s_id].append(attempt_obj)

    cohort_list = []
    for s in students:
        full_name = s.user.full_name if s.user else "N/A"
        email = s.user.email if s.user else "N/A"

        attempts = student_attempts_map.get(s.id, [])

        round_best_scores = {}
        for a in attempts:
            r_num = a.round.round_number if a.round else 1
            pct = a.result.percentage if a.result else (a.percentage or 0.0)
            if a.status in ["EVALUATED", "SUBMITTED"]:
                round_key = f"round{r_num}"
                if round_key not in round_best_scores or pct > round_best_scores[round_key]:
                    round_best_scores[round_key] = pct

        total_pct = sum(round_best_scores.values())
        evaluated_count = len(round_best_scores)
        avg_pct = round(total_pct / evaluated_count, 2) if evaluated_count > 0 else None
        readiness = scoring_service.calculate_readiness_level(avg_pct) if avg_pct is not None else "Pending"

        c_match = class_map.get((s.programme_id, s.batch_name, s.section_name))

        cohort_list.append(TutorStudentCohortItem(
            student_id=s.id,
            user_id=s.user_id,
            register_number=s.register_number,
            full_name=full_name,
            email=email,
            programme_name=s.programme.name if s.programme else "N/A",
            batch_name=s.batch_name or "",
            section_name=s.section_name or "",
            class_id=c_match.id if c_match else None,
            class_name=c_match.name if c_match else None,
            class_code=c_match.class_code if c_match else None,
            allocation_status="APPROVED" if attempts else "NOT_ALLOCATED",
            round1_score=round_best_scores.get("round1"),
            round2_score=round_best_scores.get("round2"),
            round3_score=round_best_scores.get("round3"),
            round4_score=round_best_scores.get("round4"),
            round5_score=round_best_scores.get("round5"),
            overall_percentage=avg_pct,
            overall_status="Completed" if evaluated_count >= 4 else ("In Progress" if evaluated_count > 0 else "Not Started"),
            readiness_index=readiness
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

    if "Administrator" not in roles and "Assessment Coordinator" not in roles:
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
        elif "Class Tutor" in roles or "Faculty" in roles:
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
    if "Administrator" not in roles and "Assessment Coordinator" not in roles:
        if "HoD" in roles:
            fp = current_user.faculty_profile
            dept_id = fp.department_id if fp else None
            if not dept_id or not cls.programme or cls.programme.department_id != dept_id:
                raise HTTPException(status_code=403, detail="Class is not within your department scope.")
        elif "Class Tutor" in roles or "Faculty" in roles:
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

    # Query attempts for students in this class
    attempts = []
    if student_ids:
        attempts_q = db.query(AssessmentAttempt).join(
            AssessmentStudentAllocation, AssessmentAttempt.allocation_id == AssessmentStudentAllocation.id
        ).filter(
            AssessmentStudentAllocation.student_id.in_(student_ids)
        )

        if target_domain:
            attempts_q = attempts_q.join(
                AssessmentActivationRequest, AssessmentStudentAllocation.request_id == AssessmentActivationRequest.id
            ).filter(AssessmentActivationRequest.domain_id == target_domain.id)

        attempts = attempts_q.all()

    # Map attempts by student and by round
    student_attempts_map = {}
    round_attempts_map = {
        1: {"title": "Round 1 - Cognitive & Aptitude", "scores": [], "attempted": set(), "passed": set()},
        2: {"title": "Round 2 - Programming & Coding", "scores": [], "attempted": set(), "passed": set()},
        3: {"title": "Round 3 - Technical MCQs", "scores": [], "attempted": set(), "passed": set()},
        4: {"title": "Round 4 - Debugging & Systems", "scores": [], "attempted": set(), "passed": set()}
    }

    attempt_ids = []
    for a in attempts:
        attempt_ids.append(a.id)
        stu_id = a.allocation.student_id if a.allocation else None
        if not stu_id:
            continue
        if stu_id not in student_attempts_map:
            student_attempts_map[stu_id] = {}

        r_num = a.round.round_number if a.round else 1
        pct = a.result.percentage if a.result else (a.percentage or 0.0)
        passed = a.result.passed if a.result else (a.passed or False)

        if a.status in ["EVALUATED", "SUBMITTED"]:
            if r_num not in student_attempts_map[stu_id] or pct > student_attempts_map[stu_id][r_num]["score"]:
                student_attempts_map[stu_id][r_num] = {
                    "score": pct,
                    "passed": passed
                }

            if r_num not in round_attempts_map:
                round_attempts_map[r_num] = {
                    "title": a.round.title if a.round else f"Round {r_num}",
                    "scores": [],
                    "attempted": set(),
                    "passed": set()
                }
            round_attempts_map[r_num]["scores"].append(pct)
            round_attempts_map[r_num]["attempted"].add(stu_id)
            if passed:
                round_attempts_map[r_num]["passed"].add(stu_id)

    # Build student rankings
    student_rankings = []
    readiness_counts = {"advanced": 0, "proficient": 0, "developing": 0, "beginner": 0, "pending": 0}
    participated_students = set()

    for s in students:
        full_name = s.user.full_name if s.user else "Candidate"
        s_rounds = student_attempts_map.get(s.id, {})
        if s_rounds:
            participated_students.add(s.id)

        r1 = s_rounds.get(1, {}).get("score")
        r2 = s_rounds.get(2, {}).get("score")
        r3 = s_rounds.get(3, {}).get("score")
        r4 = s_rounds.get(4, {}).get("score")

        scores = [v["score"] for v in s_rounds.values()]
        avg_pct = round(sum(scores) / len(scores), 1) if scores else None
        readiness = scoring_service.calculate_readiness_level(avg_pct) if avg_pct is not None else "Pending"

        r_key = readiness.lower()
        if "adv" in r_key:
            readiness_counts["advanced"] += 1
        elif "pro" in r_key:
            readiness_counts["proficient"] += 1
        elif "dev" in r_key or "inter" in r_key:
            readiness_counts["developing"] += 1
        elif "beg" in r_key:
            readiness_counts["beginner"] += 1
        else:
            readiness_counts["pending"] += 1

        student_rankings.append(ClassStudentRankingItem(
            student_id=s.id,
            register_number=s.register_number,
            full_name=full_name,
            round1_score=r1,
            round2_score=r2,
            round3_score=r3,
            round4_score=r4,
            overall_percentage=avg_pct,
            readiness_index=readiness
        ))

    # Sort student rankings: evaluated scores desc, then register number
    student_rankings.sort(key=lambda x: (x.overall_percentage is not None, x.overall_percentage or 0.0), reverse=True)

    # Round summaries
    round_summaries = []
    for r_num in sorted(round_attempts_map.keys()):
        r_data = round_attempts_map[r_num]
        att_cnt = len(r_data["attempted"])
        pass_cnt = len(r_data["passed"])
        pass_rate = round((pass_cnt / att_cnt) * 100.0, 1) if att_cnt > 0 else 0.0
        avg_score = round(sum(r_data["scores"]) / len(r_data["scores"]), 1) if r_data["scores"] else 0.0
        round_summaries.append(ClassRoundSummary(
            round_number=r_num,
            round_title=r_data["title"],
            attempted_count=att_cnt,
            passed_count=pass_cnt,
            pass_rate=pass_rate,
            average_score=avg_score
        ))

    # Competency aggregation across class
    comp_scores = db.query(CompetencyScore).filter(CompetencyScore.attempt_id.in_(attempt_ids)).all() if attempt_ids else []
    comp_map = {}
    for cs in comp_scores:
        code = cs.competency.code if cs.competency else "COMP"
        name = cs.competency.name if cs.competency else "Competency"
        cat = cs.competency.category if cs.competency else "General"
        if code not in comp_map:
            comp_map[code] = {
                "competency_code": code,
                "competency_name": name,
                "category": cat,
                "score": 0.0,
                "max_score": 0.0
            }
        comp_map[code]["score"] += cs.score
        comp_map[code]["max_score"] += cs.max_score

    competency_radar = []
    for c in comp_map.values():
        avg_pct = round((c["score"] / c["max_score"]) * 100.0, 1) if c["max_score"] > 0 else 0.0
        competency_radar.append(CompetencyRadarItem(
            competency_code=c["competency_code"],
            competency_name=c["competency_name"],
            category=c["category"],
            score=round(c["score"], 1),
            max_score=round(c["max_score"], 1),
            percentage=avg_pct,
            readiness_level=scoring_service.calculate_readiness_level(avg_pct)
        ))

    strengths, gaps = scoring_service.derive_strengths_and_gaps([c.model_dump() for c in competency_radar])

    # KPIs
    participated_count = len(participated_students)
    part_rate = round((participated_count / total_enrolled) * 100.0, 1) if total_enrolled > 0 else 0.0
    all_evaluated_pcts = [s.overall_percentage for s in student_rankings if s.overall_percentage is not None]
    class_avg = round(sum(all_evaluated_pcts) / len(all_evaluated_pcts), 1) if all_evaluated_pcts else None
    cleared_all_count = sum(1 for s in student_rankings if (s.round1_score or 0) >= 50 and (s.round2_score or 0) >= 50 and (s.round3_score or 0) >= 50 and (s.round4_score or 0) >= 50)

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
        competency_scores=competency_radar,
        strengths=strengths,
        areas_to_improve=gaps,
        student_rankings=student_rankings
    )

@router.get("/students/{student_id}/360", response_model=Student360Response)
def get_student_360(
    student_id: int,
    domain_slug: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    student = db.query(StudentProfile).filter(StudentProfile.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")

    target_domain = None
    if domain_slug:
        target_domain = db.query(AssessmentDomain).filter(AssessmentDomain.slug == domain_slug).first()

    attempts_q = db.query(AssessmentAttempt).join(
        AssessmentStudentAllocation, AssessmentAttempt.allocation_id == AssessmentStudentAllocation.id
    ).filter(
        AssessmentStudentAllocation.student_id == student.id
    )

    if target_domain:
        attempts_q = attempts_q.join(
            AssessmentActivationRequest, AssessmentStudentAllocation.request_id == AssessmentActivationRequest.id
        ).filter(AssessmentActivationRequest.domain_id == target_domain.id)

    attempts = attempts_q.order_by(AssessmentAttempt.id.asc()).all()

    rounds_perf = []
    attempt_ids = []
    for a in attempts:
        attempt_ids.append(a.id)
        r_num = a.round.round_number if a.round else 1
        r_title = a.round.title if a.round else f"Round {r_num}"
        pct = a.result.percentage if a.result else (a.percentage or 0.0)
        passed = a.result.passed if a.result else (a.passed or False)
        score = a.result.total_score if a.result else (a.score or 0.0)

        rounds_perf.append({
            "round_number": r_num,
            "round_title": r_title,
            "status": a.status,
            "score": score,
            "percentage": pct,
            "passed": passed,
            "started_at": a.started_at.isoformat() if a.started_at else "",
            "submitted_at": a.submitted_at.isoformat() if a.submitted_at else ""
        })

    # Competency Scores mapping
    comp_scores = db.query(CompetencyScore).filter(CompetencyScore.attempt_id.in_(attempt_ids)).all() if attempt_ids else []
    comp_map: Dict[str, Dict[str, Any]] = {}
    for cs in comp_scores:
        code = cs.competency.code if cs.competency else "COMP"
        name = cs.competency.name if cs.competency else "Competency"
        cat = cs.competency.category if cs.competency else "General"
        if code not in comp_map:
            comp_map[code] = {
                "competency_code": code,
                "competency_name": name,
                "category": cat,
                "score": 0.0,
                "max_score": 0.0
            }
        comp_map[code]["score"] += cs.score
        comp_map[code]["max_score"] += cs.max_score

    competency_radar = []
    for c in comp_map.values():
        avg_pct = round((c["score"] / c["max_score"]) * 100.0, 1) if c["max_score"] > 0 else 0.0
        competency_radar.append(CompetencyRadarItem(
            competency_code=c["competency_code"],
            competency_name=c["competency_name"],
            category=c["category"],
            score=c["score"],
            max_score=c["max_score"],
            percentage=avg_pct,
            readiness_level=scoring_service.calculate_readiness_level(avg_pct)
        ))

    strengths, gaps = scoring_service.derive_strengths_and_gaps([c.model_dump() for c in competency_radar])

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
        rounds_performance=rounds_perf,
        competency_scores=competency_radar,
        strengths=strengths,
        areas_to_improve=gaps
    )
