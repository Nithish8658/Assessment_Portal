"""
Tool & Data Connector Layer for the Autonomous Executive AI Assistant.
Provides:
- UserContext (RBAC, Multi-Tenancy Scoping)
- DatabaseTool (Universal Read-Only SQL Engine with Schema Introspection & Department Guardrails)
- WebAppInternalTool (Screen & DOM Table Ingestion)
- ToolRegistry (Unified Tool Dispatcher & Function Declarations for Gemini)
"""

import re
import json
import logging
import decimal
import uuid
import datetime
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from sqlalchemy import text
from app.database import engine

logger = logging.getLogger(__name__)

def make_json_safe(obj: Any) -> Any:
    """
    Recursively converts non-JSON serializable objects (Decimal, date, datetime, UUID, bytes)
    into standard JSON-serializable types (float/int, ISO string, etc.).
    """
    if isinstance(obj, decimal.Decimal):
        return int(obj) if obj % 1 == 0 else float(obj)
    if isinstance(obj, (datetime.date, datetime.datetime)):
        return obj.isoformat()
    if isinstance(obj, uuid.UUID):
        return str(obj)
    if isinstance(obj, bytes):
        return obj.decode("utf-8", errors="replace")
    if isinstance(obj, dict):
        return {str(k): make_json_safe(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple, set)):
        return [make_json_safe(item) for item in obj]
    return obj

# List of dangerous/mutating SQL keywords strictly forbidden in the read-only engine
FORBIDDEN_SQL_KEYWORDS = [
    r"\bINSERT\b",
    r"\bUPDATE\b",
    r"\bDELETE\b",
    r"\bDROP\b",
    r"\bALTER\b",
    r"\bTRUNCATE\b",
    r"\bCREATE\b",
    r"\bREPLACE\b",
    r"\bGRANT\b",
    r"\bREVOKE\b",
    r"\bEXEC\b",
    r"\bEXECUTE\b",
    r"\bCOPY\b",
    r"\bVACUUM\b",
    r"\bLOCK\b",
    r"\bCALL\b"
]

# Credential-like columns that must never reach the model.
SENSITIVE_COLUMNS_PATTERN = r"\b(hashed_password|password\w*|\w*_token|token|secret\w*|api_key\w*)\b"
# Tables whose rows belong to a department; HoD SQL on these must filter by department_id.
SCOPED_TABLES = [
    "students", "academic_classes", "programmes", "faculty", "assessment_activation_requests",
    "assessment_student_allocations", "assessment_attempts", "assessment_results", "competency_scores",
    "student_competency_profiles", "assessment_responses",
]
MAX_SQL_ROWS = 50
MAX_CELL_CHARS = 300
SQL_TIMEOUT_MS = 5000


@dataclass
class UserContext:
    user_id: int
    user_name: str
    roles: List[str]
    primary_role: str
    department_id: Optional[int] = None
    department_name: Optional[str] = None
    department_code: Optional[str] = None

    @property
    def is_admin(self) -> bool:
        return any(r in ["Administrator", "Super Admin", "Assessment Coordinator"] for r in self.roles)

    @property
    def is_hod(self) -> bool:
        return any(r in ["HoD", "Head of Department"] for r in self.roles)


class DatabaseTool:
    """
    Universal, safe PostgreSQL read-only query engine with automated schema discovery
    and department-level multi-tenancy enforcement.
    """

    def __init__(self):
        self._schema_cache: Optional[str] = None

    def get_schema_overview(self, ctx: UserContext) -> str:
        """
        Returns a concise overview of institutional database tables and relationships
        to guide the agent's SQL generation.
        """
        dept_info = f"Department Scope: ID={ctx.department_id} ('{ctx.department_name}')" if ctx.is_hod else "Scope: All Departments (Institutional Administrator)"
        
        schema_text = f"""
# PostgreSQL schema ({dept_info}). Prefer the dedicated tools; use SQL only when no tool fits.

## Academic master
- users (id, username, email, full_name, is_active)   [never select credential columns]
- departments (id, code, name)
- programmes (id, code, name, department_id)
- academic_classes (id, class_code, name, programme_id, batch_name, section_name, tutor_id)
- students (id, register_number, user_id, programme_id, batch_name, section_name)
- faculty (id, employee_id, user_id, department_id, designation)

## Assessments
- assessment_domains (id, title, slug, is_active)
- assessment_rounds (id, domain_id, round_number, title, round_type, duration_minutes, questions_per_attempt)
- assessment_questions (id, round_id, competency_id, question_type, title, difficulty, marks, status)
- assessment_activation_requests (id, domain_id, academic_class_id, requested_by_id, status, complexity_level, valid_from, valid_until, requested_at, reviewed_at)
- assessment_student_allocations (id, request_id, student_id, status, valid_from, valid_until)
- assessment_attempts (id, allocation_id, round_id, attempt_number, status, evaluation_status, score, percentage, passed, started_at, submitted_at)
  status: IN_PROGRESS, SUBMITTED, EVALUATING, EVALUATED. Only EVALUATED attempts have published results.
- assessment_results (id, attempt_id, total_score, max_score, percentage, passed, readiness_index, evaluated_at)
- competency_scores (id, attempt_id, competency_id, score, max_score, percentage)
- student_competency_profiles (student_id, domain_id, overall_percentage, readiness_index, rounds_completed, rounds_total, rounds_json, competencies_json, updated_at)
  = stored CURRENT results per student and domain (latest published attempt per round).

## Rules
- A student may retake a round. The current grade is the LATEST EVALUATED attempt per (student, round):
  SELECT DISTINCT ON (asa.student_id, att.round_id) ... ORDER BY asa.student_id, att.round_id, att.attempt_number DESC, att.submitted_at DESC
  Never average, sum or take the best across attempts of the same round.
- Department -> students: programmes p (p.department_id = X) JOIN students s ON s.programme_id = p.id
- Students -> attempts: students s JOIN assessment_student_allocations asa ON asa.student_id = s.id JOIN assessment_attempts att ON att.allocation_id = asa.id
- Round floats with ROUND(x::numeric, 2).
"""
        return schema_text.strip()

    def execute_readonly_sql(self, sql_query: str, ctx: UserContext) -> List[Dict[str, Any]]:
        """
        Safely executes a single read-only SELECT query.
        Guarantees:
        1. Query must be a SELECT statement.
        2. No modifying SQL statements allowed.
        3. Read-only transaction enforcement.
        4. Automatic LIMIT 100 to prevent buffer overflow.
        5. For HoD users: enforces multi-tenancy constraints on department-specific tables.
        """
        clean_query = sql_query.strip().rstrip(";")
        
        # 1. Reject empty queries
        if not clean_query:
            return [{"error": "Empty query provided."}]

        # 2. Enforce SELECT only
        if not clean_query.upper().startswith("SELECT"):
            return [{"error": "Security violation: Only SELECT queries are permitted in the read-only intelligence tool."}]

        # 3. Check for forbidden keywords (regex word-boundary match)
        for pattern in FORBIDDEN_SQL_KEYWORDS:
            if re.search(pattern, clean_query, re.IGNORECASE):
                keyword = pattern.replace(r"\b", "")
                return [{"error": f"Security violation: Forbidden keyword '{keyword}' detected. Modification is strictly disallowed."}]

        # 4. Credential columns are never readable through the assistant.
        if re.search(SENSITIVE_COLUMNS_PATTERN, clean_query, re.IGNORECASE):
            return [{"error": "Security violation: credential columns cannot be queried."}]

        # 5. Multi-tenancy guardrail for HoD: queries touching student/class data must be
        #    filtered to the HoD's department (department_id = <id>), or they are refused.
        if not ctx.is_admin:
            if not (ctx.is_hod and ctx.department_id):
                return [{"error": "Your account has no department scope for SQL queries."}]
            lower_q = clean_query.lower()
            needs_scoping = any(re.search(rf"\b{tbl}\b", lower_q) for tbl in SCOPED_TABLES)
            if needs_scoping and not re.search(rf"department_id\s*=\s*{int(ctx.department_id)}\b", lower_q):
                return [{"error": (
                    f"Scope violation: add a filter 'department_id = {int(ctx.department_id)}' "
                    "(via programmes or faculty) to every query on students, classes, attempts or results. "
                    "Prefer the dedicated tools, which apply the scope automatically."
                )}]

        # 6. Enforce safety limit if none exists
        if not re.search(r"\bLIMIT\s+\d+\b", clean_query, re.IGNORECASE):
            clean_query = f"{clean_query} LIMIT {MAX_SQL_ROWS}"

        # 6. Execute inside strict read-only transaction
        try:
            with engine.connect() as conn:
                # Read-only transaction with a hard time limit, so one bad query cannot hog the database.
                if conn.dialect.name == "postgresql":
                    conn.execute(text("SET TRANSACTION READ ONLY;"))
                    conn.execute(text(f"SET LOCAL statement_timeout = {SQL_TIMEOUT_MS};"))
                result = conn.execute(text(clean_query))

                rows = []
                keys = list(result.keys())
                for row in result.fetchmany(MAX_SQL_ROWS):
                    row_dict = {}
                    for k, v in zip(keys, row):
                        v = make_json_safe(v)
                        if isinstance(v, str) and len(v) > MAX_CELL_CHARS:
                            v = v[:MAX_CELL_CHARS] + "…"
                        row_dict[k] = v
                    rows.append(row_dict)
                    
                logger.info("DatabaseTool executed SQL [%d rows returned]: %s", len(rows), clean_query[:100])
                return rows

        except Exception as err:
            logger.error("DatabaseTool SQL Execution error: %s (Query: %s)", err, clean_query)
            return [{"error": f"SQL execution error: {str(err)}"}]


class WebAppInternalTool:
    """
    Ingests live DOM tables, metrics, and active route information from the client screen.
    Allows the agent to answer questions grounded directly in what the user is currently viewing.
    """

    def __init__(self):
        pass

    def inspect_screen_context(self, page_context: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Formats active page context into a structured summary for the reasoning agent.
        """
        if not page_context:
            return {"status": "No active page context provided by client."}

        current_path = page_context.get("current_path", "")
        page_title = page_context.get("page_title", "")
        active_tab = page_context.get("active_tab", "")
        metrics = page_context.get("metrics_summary", {})
        visible_tables = page_context.get("visible_tables", [])
        
        return {
            "current_path": current_path,
            "page_title": page_title,
            "active_tab": active_tab,
            "visible_metrics": metrics,
            "visible_tables_count": len(visible_tables),
            "tables": visible_tables[:3]
        }


class ToolRegistry:
    """
    Central dispatch and schema registry for the Autonomous Master Agent.
    """

    def __init__(self):
        self.db_tool = DatabaseTool()
        self.web_tool = WebAppInternalTool()

    def get_tool_declarations(self) -> List[Dict[str, Any]]:
        """Function declarations for Gemini. Dedicated tools come first; SQL is the fallback."""
        str_param = lambda d: {"type": "STRING", "description": d}
        return [
            {
                "name": "get_latest_results",
                "description": (
                    "CURRENT / LATEST grades. Use for any question about a student's or a class's current scores, "
                    "round results, pass/fail, readiness, competencies, strengths or gaps. Reads the stored profiles "
                    "(latest published attempt per round). Give either student or class_code."
                ),
                "parameters": {"type": "OBJECT", "properties": {
                    "student": str_param("Student register number or name."),
                    "class_code": str_param("Class code or class name, for the whole class."),
                    "domain": str_param("Optional domain title or slug, e.g. 'C & Systems Programming'."),
                }},
            },
            {
                "name": "get_student_progress",
                "description": (
                    "PROGRESS over time. Use when asked how a student progressed, improved or declined, or about their "
                    "attempt history and retakes. Returns every attempt per round in order with score changes and a trend."
                ),
                "parameters": {"type": "OBJECT", "properties": {
                    "student": str_param("Student register number or name."),
                    "domain": str_param("Optional domain title or slug."),
                }, "required": ["student"]},
            },
            {
                "name": "get_department_kpis",
                "description": "Department pass rates, average scores and enrolment (latest result per student per round).",
                "parameters": {"type": "OBJECT", "properties": {
                    "department_code_or_name": str_param("Optional department code or name; empty for all permitted departments."),
                }},
            },
            {
                "name": "get_at_risk_students",
                "description": "Students whose latest published result in a round is below a threshold.",
                "parameters": {"type": "OBJECT", "properties": {
                    "score_threshold": {"type": "NUMBER", "description": "Percentage threshold (default 50)."},
                    "limit": {"type": "INTEGER", "description": "Maximum students (default 10)."},
                }},
            },
            {
                "name": "get_pending_approvals",
                "description": "Activation requests awaiting review.",
                "parameters": {"type": "OBJECT", "properties": {}},
            },
            {
                "name": "get_live_exam_status",
                "description": "Live counts of in-progress exams, attempts awaiting AI grading, completed results and pass rate.",
                "parameters": {"type": "OBJECT", "properties": {
                    "domain_name": str_param("Optional domain filter."),
                }},
            },
            {
                "name": "get_database_schema",
                "description": "Schema and SQL rules. Call only before writing SQL for a question no dedicated tool answers.",
                "parameters": {"type": "OBJECT", "properties": {}},
            },
            {
                "name": "execute_readonly_sql",
                "description": "Fallback: one read-only PostgreSQL SELECT (max 50 rows, 5 s). Use only when no dedicated tool fits.",
                "parameters": {"type": "OBJECT", "properties": {
                    "sql_query": str_param("A single PostgreSQL SELECT statement."),
                }, "required": ["sql_query"]},
            },
            {
                "name": "inspect_screen_context",
                "description": "Reads the tables and metric cards on the user's current screen.",
                "parameters": {"type": "OBJECT", "properties": {}},
            },
        ]

    def dispatch(
        self,
        tool_name: str,
        arguments: Dict[str, Any],
        ctx: UserContext,
        page_context: Optional[Dict[str, Any]] = None
    ) -> Any:
        """Executes the specified tool and returns the JSON-serializable result."""
        logger.info("ToolRegistry dispatching: %s with args: %s", tool_name, arguments)
        arguments = arguments or {}
        try:
            if tool_name == "get_latest_results":
                from app.services.assistant.student_insights import latest_results
                raw_res = latest_results(ctx, arguments.get("student"), arguments.get("class_code"), arguments.get("domain"))
            elif tool_name == "get_student_progress":
                from app.services.assistant.student_insights import student_progress
                raw_res = student_progress(ctx, arguments.get("student", ""), arguments.get("domain"))
            elif tool_name in ("get_department_kpis", "get_at_risk_students", "get_pending_approvals", "get_live_exam_status"):
                raw_res = self._run_leadership_tool(tool_name, arguments, ctx)
            elif tool_name == "get_database_schema":
                raw_res = {"schema": self.db_tool.get_schema_overview(ctx)}
            elif tool_name == "execute_readonly_sql":
                raw_res = {"rows": self.db_tool.execute_readonly_sql(arguments.get("sql_query", ""), ctx)}
            elif tool_name == "inspect_screen_context":
                raw_res = self.web_tool.inspect_screen_context(page_context)
            else:
                raw_res = {"error": f"Unknown tool: '{tool_name}'"}
        except Exception as err:
            logger.exception("Tool %s failed", tool_name)
            raw_res = {"error": f"{tool_name} failed: {str(err)[:200]}"}
        return make_json_safe(raw_res)

    @staticmethod
    def _run_leadership_tool(tool_name: str, arguments: Dict[str, Any], ctx: UserContext) -> Any:
        from app.database import SessionLocal
        from app.services.assessment.hod_assistant_service import hod_assistant_service
        if not ctx.is_admin and not (ctx.is_hod and ctx.department_id):
            return {"error": "Your account has no department scope."}
        role = "Administrator" if ctx.is_admin else "HoD"
        db = SessionLocal()
        try:
            return hod_assistant_service.execute_tool(tool_name, arguments, role, ctx.department_id, db)
        finally:
            db.close()

tool_registry = ToolRegistry()
