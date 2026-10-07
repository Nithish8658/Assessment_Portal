"""
HoD & Administrator AI Intelligence Assistant Service.
Powered by Gemini 3 Flash Live (gemini-3.1-flash-lite / gemini-2.5-flash) with Native Function Calling.
Provides dynamic real-time database-aware intelligence for institutional leadership.
"""

import json
import logging
import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from app.models.models import User, Department, Programme, AcademicClass, StudentProfile, FacultyProfile
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

logger = logging.getLogger(__name__)

# ==============================================================================
# Gemini Tool Declarations (Function Calling Schema)
# ==============================================================================

ASSISTANT_TOOLS = [
    {
        "name": "get_live_exam_status",
        "description": "Retrieves real-time counts of active in-progress exams, completed submissions, and domain activity.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "domain_name": {
                    "type": "STRING",
                    "description": "Optional domain filter (e.g. 'Software Developer', 'Data Analyst')."
                }
            }
        }
    },
    {
        "name": "get_department_kpis",
        "description": "Calculates real-time pass percentage, average test scores, total attempts, and enrollment across departments. Leave department_code_or_name empty or pass 'ALL' to retrieve institution-wide KPIs.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "department_code_or_name": {
                    "type": "STRING",
                    "description": "Optional department code (e.g. 'CS', 'AI', 'IOT & AIML') or full name. Leave empty to retrieve all departments."
                }
            }
        }
    },
    {
        "name": "get_pending_approvals",
        "description": "Fetches all pending student assessment activation requests awaiting HoD review and sign-off.",
        "parameters": {
            "type": "OBJECT",
            "properties": {}
        }
    },
    {
        "name": "get_at_risk_students",
        "description": "Identifies students scoring below passing thresholds or failing consecutive assessment rounds.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "score_threshold": {
                    "type": "NUMBER",
                    "description": "Percentage score threshold below which a student is flagged as at-risk (default 50.0)."
                },
                "limit": {
                    "type": "INTEGER",
                    "description": "Maximum number of candidate records to return (default 10)."
                }
            }
        }
    },
    {
        "name": "get_student_dossier",
        "description": "Looks up a specific student by name or register number and returns their complete assessment history, scores, and round outcomes.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "search_query": {
                    "type": "STRING",
                    "description": "Student register number (e.g. '23CSE101') or name."
                }
            },
            "required": ["search_query"]
        }
    },
    {
        "name": "get_question_bank_summary",
        "description": "Provides an inventory summary of questions across all assessment domains and rounds.",
        "parameters": {
            "type": "OBJECT",
            "properties": {}
        }
    }
]

class HodAssistantService:
    """Real-time PostgreSQL Tool Dispatcher for HoD and Institutional Leadership Live Agent."""

    # --------------------------------------------------------------------------
    # Dynamic Real-Time Tool Implementations (Live SQL Queries)
    # --------------------------------------------------------------------------

    def _tool_get_live_exam_status(self, db: Session, user_role: str, dept_id: Optional[int], domain_name: Optional[str] = None) -> Dict[str, Any]:
        """Queries live assessment attempt states from PostgreSQL."""
        query = db.query(AssessmentAttempt)

        # Department scoping for HoD
        if user_role == "HoD" and dept_id:
            query = query.join(AssessmentStudentAllocation, AssessmentAttempt.allocation_id == AssessmentStudentAllocation.id)\
                         .join(StudentProfile, AssessmentStudentAllocation.student_id == StudentProfile.id)\
                         .join(Programme, StudentProfile.programme_id == Programme.id)\
                         .filter(Programme.department_id == dept_id)

        in_progress_count = query.filter(AssessmentAttempt.status == "IN_PROGRESS").count()
        evaluated_count = query.filter(AssessmentAttempt.status.in_(["EVALUATED", "SUBMITTED"])).count()
        passed_count = query.filter(AssessmentAttempt.passed == True).count()

        # Domain breakdown
        domains = db.query(AssessmentDomain).filter(AssessmentDomain.is_active == True).all()
        domain_stats = []
        for d in domains:
            if domain_name and domain_name.lower() not in d.title.lower():
                continue
            d_attempts = db.query(AssessmentAttempt)\
                           .join(AssessmentRound, AssessmentAttempt.round_id == AssessmentRound.id)\
                           .filter(AssessmentRound.domain_id == d.id).count()
            d_active = db.query(AssessmentAttempt)\
                         .join(AssessmentRound, AssessmentAttempt.round_id == AssessmentRound.id)\
                         .filter(AssessmentRound.domain_id == d.id, AssessmentAttempt.status == "IN_PROGRESS").count()
            domain_stats.append({
                "domain": d.title,
                "total_attempts": d_attempts,
                "currently_active": d_active
            })

        pass_rate = round((passed_count / evaluated_count * 100.0), 1) if evaluated_count > 0 else 0.0

        return {
            "timestamp": datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"),
            "currently_in_progress": in_progress_count,
            "total_completed": evaluated_count,
            "overall_pass_rate_percentage": pass_rate,
            "domain_breakdown": domain_stats
        }

    def _tool_get_department_kpis(self, db: Session, user_role: str, dept_id: Optional[int], department_code_or_name: Optional[str] = None) -> Dict[str, Any]:
        """Calculates live department pass rates, scores, and attempts."""
        dept_query = db.query(Department)
        filter_applied = False

        if user_role == "HoD" and dept_id:
            dept_query = dept_query.filter(Department.id == dept_id)
            filter_applied = True
        elif department_code_or_name:
            raw_input = department_code_or_name.strip()
            if raw_input.upper() not in ["ALL", "NONE", "*", "OVERVIEW", "INSTITUTION"]:
                alias_map = {
                    "CSE": "CS",
                    "IT": "CS",
                    "AI-DS": "AI",
                    "AIML": "IOT & AIML",
                    "IOT": "IOT & AIML"
                }
                mapped = alias_map.get(raw_input.upper(), raw_input)
                dept_query = dept_query.filter(
                    (Department.code.ilike(f"%{mapped}%")) |
                    (Department.name.ilike(f"%{mapped}%")) |
                    (Department.code.ilike(f"%{raw_input}%")) |
                    (Department.name.ilike(f"%{raw_input}%"))
                )
                filter_applied = True

        departments = dept_query.all()
        # Fallback: if filter returned nothing, fetch all departments so the model always receives institutional metrics
        if not departments:
            departments = db.query(Department).all()
            filter_applied = False

        dept_results = []

        for dept in departments:
            attempts = db.query(AssessmentAttempt)\
                         .join(AssessmentStudentAllocation, AssessmentAttempt.allocation_id == AssessmentStudentAllocation.id)\
                         .join(StudentProfile, AssessmentStudentAllocation.student_id == StudentProfile.id)\
                         .join(Programme, StudentProfile.programme_id == Programme.id)\
                         .filter(Programme.department_id == dept.id).all()

            total_attempts = len(attempts)
            evaluated = [a for a in attempts if a.status in ["EVALUATED", "SUBMITTED"]]
            passed = [a for a in evaluated if a.passed]
            avg_score = round(sum(a.percentage for a in evaluated) / len(evaluated), 1) if evaluated else 0.0
            pass_rate = round((len(passed) / len(evaluated) * 100.0), 1) if evaluated else 0.0

            # Student count
            total_students = db.query(StudentProfile)\
                               .join(Programme, StudentProfile.programme_id == Programme.id)\
                               .filter(Programme.department_id == dept.id).count()

            dept_results.append({
                "department_code": dept.code,
                "department_name": dept.name,
                "total_enrolled_students": total_students,
                "total_attempts": total_attempts,
                "completed_evaluations": len(evaluated),
                "passed_count": len(passed),
                "pass_rate_percentage": pass_rate,
                "average_score_percentage": avg_score,
                "status": "Active assessments logged" if total_attempts > 0 else "Ready - No attempts submitted yet this cycle"
            })

        return {
            "summary": f"KPI metrics across {len(dept_results)} department(s)",
            "departments": dept_results,
            "evaluated_at": datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"),
            "note": "Filter relaxed to institution overview" if not filter_applied and department_code_or_name else None
        }

    def _tool_get_pending_approvals(self, db: Session, user_role: str, dept_id: Optional[int]) -> Dict[str, Any]:
        """Fetches activation requests pending HoD approval."""
        req_query = db.query(AssessmentActivationRequest).filter(AssessmentActivationRequest.status == "PENDING")

        if user_role == "HoD" and dept_id:
            req_query = req_query.join(AcademicClass, AssessmentActivationRequest.academic_class_id == AcademicClass.id)\
                                 .join(Programme, AcademicClass.programme_id == Programme.id)\
                                 .filter(Programme.department_id == dept_id)

        pending_reqs = req_query.order_by(desc(AssessmentActivationRequest.requested_at)).all()
        res_list = []

        for r in pending_reqs:
            dept_name = "N/A"
            if r.academic_class and r.academic_class.programme and r.academic_class.programme.department:
                dept_name = r.academic_class.programme.department.name

            res_list.append({
                "request_id": r.id,
                "domain": r.domain.title if r.domain else "N/A",
                "department": dept_name,
                "class_code": r.academic_class.class_code if r.academic_class else "N/A",
                "requested_by": r.requested_by.full_name if r.requested_by else "Tutor",
                "candidates_count": len(r.candidates),
                "requested_at": r.requested_at.strftime("%Y-%m-%d %H:%M") if r.requested_at else "N/A"
            })

        return {
            "total_pending_requests": len(res_list),
            "pending_requests": res_list,
            "status": "Pending review required" if len(res_list) > 0 else "All roster activation requests are up-to-date (0 pending)"
        }

    def _tool_get_at_risk_students(self, db: Session, user_role: str, dept_id: Optional[int], score_threshold: float = 50.0, limit: int = 10) -> Dict[str, Any]:
        """Finds students struggling or scoring below threshold."""
        query = db.query(AssessmentAttempt)\
                  .filter(AssessmentAttempt.status == "EVALUATED", AssessmentAttempt.percentage < score_threshold)

        if user_role == "HoD" and dept_id:
            query = query.join(AssessmentStudentAllocation, AssessmentAttempt.allocation_id == AssessmentStudentAllocation.id)\
                         .join(StudentProfile, AssessmentStudentAllocation.student_id == StudentProfile.id)\
                         .join(Programme, StudentProfile.programme_id == Programme.id)\
                         .filter(Programme.department_id == dept_id)

        failed_attempts = query.order_by(AssessmentAttempt.percentage.asc()).limit(limit).all()
        records = []

        for a in failed_attempts:
            student = a.allocation.student if a.allocation else None
            user = student.user if student else None
            round_obj = a.round

            records.append({
                "student_name": user.full_name if user else "Unknown Student",
                "register_number": student.register_number if student else "N/A",
                "class": student.batch_name if student else "N/A",
                "round_attempted": round_obj.title if round_obj else f"Round {a.round_id}",
                "score_obtained": a.score,
                "percentage": a.percentage,
                "attempt_date": a.started_at.strftime("%Y-%m-%d")
            })

        total_students_enrolled = db.query(StudentProfile).count()

        return {
            "score_threshold_checked": score_threshold,
            "flagged_candidate_count": len(records),
            "at_risk_students": records,
            "total_enrolled_candidates_checked": total_students_enrolled,
            "status": "All candidates in good standing" if len(records) == 0 else f"{len(records)} candidates scored below {score_threshold}%",
            "summary": "No students currently flagged below the score threshold. All candidates are performing satisfactorily or have not completed scored attempts yet." if len(records) == 0 else f"Found {len(records)} candidates requiring academic intervention."
        }

    def _tool_get_student_dossier(self, db: Session, user_role: str, dept_id: Optional[int], search_query: str) -> Dict[str, Any]:
        """Looks up student assessment history."""
        q = search_query.strip()
        student_query = db.query(StudentProfile).join(User, StudentProfile.user_id == User.id)\
                          .filter((StudentProfile.register_number.ilike(f"%{q}%")) | (User.full_name.ilike(f"%{q}%")))

        if user_role == "HoD" and dept_id:
            student_query = student_query.join(Programme, StudentProfile.programme_id == Programme.id)\
                                         .filter(Programme.department_id == dept_id)

        student = student_query.first()
        if not student:
            return {"error": f"No student found matching '{search_query}' within your authorized department."}

        allocations = db.query(AssessmentStudentAllocation).filter(AssessmentStudentAllocation.student_id == student.id).all()
        history = []

        for alloc in allocations:
            attempts = db.query(AssessmentAttempt).filter(AssessmentAttempt.allocation_id == alloc.id).all()
            for a in attempts:
                history.append({
                    "round": a.round.title if a.round else f"Round {a.round_id}",
                    "status": a.status,
                    "score": a.score,
                    "percentage": a.percentage,
                    "passed": a.passed,
                    "attempt_number": a.attempt_number,
                    "date": a.started_at.strftime("%Y-%m-%d %H:%M")
                })

        return {
            "student_name": student.user.full_name if student.user else "N/A",
            "register_number": student.register_number,
            "programme": student.programme.name if student.programme else "N/A",
            "batch": student.batch_name,
            "total_attempts": len(history),
            "attempt_records": history
        }

    def _tool_get_question_bank_summary(self, db: Session) -> Dict[str, Any]:
        """Summarizes question bank status across all rounds."""
        domains = db.query(AssessmentDomain).all()
        summary = []
        total_questions = 0

        for d in domains:
            r_summaries = []
            for r in d.rounds:
                q_count = len(r.questions)
                total_questions += q_count
                r_summaries.append({
                    "round_title": r.title,
                    "round_type": r.round_type,
                    "question_count": q_count,
                    "target_per_attempt": r.questions_per_attempt
                })
            summary.append({
                "domain_title": d.title,
                "rounds": r_summaries
            })

        return {
            "total_questions_in_portal": total_questions,
            "domains": summary
        }

    def execute_tool(self, tool_name: str, arguments: Dict[str, Any], user_role: str, dept_id: Optional[int], db: Session) -> Dict[str, Any]:
        """Executes the requested tool and returns dynamic live data."""
        logger.info("Executing assistant tool: %s with args: %s (Role: %s, Dept: %s)", tool_name, arguments, user_role, dept_id)
        
        if tool_name == "get_live_exam_status":
            return self._tool_get_live_exam_status(db, user_role, dept_id, arguments.get("domain_name"))
        elif tool_name == "get_department_kpis":
            return self._tool_get_department_kpis(db, user_role, dept_id, arguments.get("department_code_or_name"))
        elif tool_name == "get_pending_approvals":
            return self._tool_get_pending_approvals(db, user_role, dept_id)
        elif tool_name == "get_at_risk_students":
            thresh = float(arguments.get("score_threshold", 50.0))
            limit = int(arguments.get("limit", 10))
            return self._tool_get_at_risk_students(db, user_role, dept_id, thresh, limit)
        elif tool_name == "get_student_dossier":
            return self._tool_get_student_dossier(db, user_role, dept_id, arguments.get("search_query", ""))
        elif tool_name == "get_question_bank_summary":
            return self._tool_get_question_bank_summary(db)
        else:
            return {"error": f"Unknown tool: {tool_name}"}

hod_assistant_service = HodAssistantService()
