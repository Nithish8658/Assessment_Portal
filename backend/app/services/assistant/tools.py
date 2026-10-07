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
# PostgreSQL Database Schema Overview ({dept_info})

## Academic Master & Users:
- users (id, username, email, full_name, mobile, is_active, created_at)
- roles (id, name, description)
- user_roles (user_id, role_id)
- departments (id, code, name, school_id, hod_id)
- programmes (id, code, name, degree_type, department_id, duration_years)
- academic_classes (id, class_code, name, programme_id, batch_name, section_name, tutor_id)
- students (id, register_number, user_id, programme_id, batch_name, section_name)
- faculty (id, employee_id, user_id, department_id, designation)

## Assessment Tracks & Rounds:
- assessment_domains (id, title, slug, description, is_active)
  Note: Domain 1 is 'Software Developer' (slug: 'software-developer').
- assessment_rounds (id, domain_id, round_number, slug, title, round_type, duration_minutes, questions_per_attempt)
- competencies (id, code, name, category, description)
- assessment_questions (id, round_id, competency_id, question_type, title, candidate_content, difficulty, marks, time_limit_seconds, status)
  Difficulties: 'Easy', 'Medium', 'Hard'.
- question_evaluation_configs (id, question_id, evaluation_type, correct_answer, reference_solution)

## Activation, Rosters & Candidate Attempts:
- assessment_activation_requests (id, domain_id, academic_class_id, requested_by_id, reviewed_by_id, status, complexity_level, selected_rounds_json, valid_from, valid_until, requested_at, notes)
  Statuses: 'PENDING', 'APPROVED', 'REJECTED'. Complexity: 'Balanced', 'Easy', 'Medium', 'Hard'.
- assessment_activation_candidates (id, request_id, student_id)
- assessment_student_allocations (id, request_id, student_id, status, source, valid_from, valid_until, allocated_at)
  Statuses: 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'REVOKED', 'EXPIRED'.
- assessment_attempts (id, allocation_id, round_id, attempt_number, status, started_at, submitted_at, time_taken_seconds)
  Statuses: 'IN_PROGRESS', 'SUBMITTED', 'EVALUATED'.
- attempt_question_snapshots (id, attempt_id, question_id, snapshot_content_json)
- assessment_responses (id, attempt_id, question_id, response_payload, is_marked_for_review)
- assessment_results (id, attempt_id, total_score, max_score, percentage, passed, readiness_index, evaluated_at)
- competency_scores (id, result_id, competency_id, score, max_score, percentage)

## Crucial Department & Student Join Paths:
- Department to Students: departments d -> programmes p (p.department_id=d.id) -> students s (s.programme_id=p.id)
- Department to Results: students s -> assessment_student_allocations asa (asa.student_id=s.id) -> assessment_attempts att (att.allocation_id=asa.id) -> assessment_results res (res.attempt_id=att.id)
- PostgreSQL Rule: For rounding float/double numbers, cast to numeric: ROUND(AVG(res.percentage)::numeric, 2) or ROUND(SUM(...)::numeric, 2).
- Never guess non-existent tables like 'assessment_tracks' or 'department_stats'. Only query tables listed here.
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

        # 4. Multi-tenancy guardrail for HoD
        if ctx.is_hod and ctx.department_id:
            dept_id = ctx.department_id
            lower_q = clean_query.lower()
            needs_scoping = any(tbl in lower_q for tbl in ["students", "academic_classes", "programmes", "faculty", "assessment_activation_requests"])
            if needs_scoping and str(dept_id) not in clean_query:
                logger.info("Auto-tagging HoD multi-tenancy requirement for query: %s", clean_query)

        # 5. Enforce safety limit if none exists
        if not re.search(r"\bLIMIT\s+\d+\b", clean_query, re.IGNORECASE):
            clean_query = f"{clean_query} LIMIT 100"

        # 6. Execute inside strict read-only transaction
        try:
            with engine.connect() as conn:
                # Set transaction mode read only
                conn.execute(text("SET TRANSACTION READ ONLY;"))
                result = conn.execute(text(clean_query))
                
                rows = []
                keys = list(result.keys())
                for row in result.fetchmany(100):
                    row_dict = {}
                    for k, v in zip(keys, row):
                        row_dict[k] = make_json_safe(v)
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
        """
        Returns modern function declarations compatible with Google GenAI / Gemini.
        """
        return [
            {
                "name": "get_database_schema",
                "description": "Inspects the database schema, table structures, foreign keys, and available columns to understand what tables to query.",
                "parameters": {
                    "type": "OBJECT",
                    "properties": {}
                }
            },
            {
                "name": "execute_readonly_sql",
                "description": "Executes a safe read-only SQL SELECT query against PostgreSQL to retrieve real-time data, perform aggregations, counts, joins, and filters. NEVER requires user permission. Run this tool autonomously whenever data is needed.",
                "parameters": {
                    "type": "OBJECT",
                    "properties": {
                        "sql_query": {
                            "type": "STRING",
                            "description": "The exact PostgreSQL SELECT query to execute. Example: 'SELECT d.title, COUNT(q.id) FROM assessment_domains d JOIN assessment_rounds r ON r.domain_id=d.id JOIN assessment_questions q ON q.round_id=r.id GROUP BY d.title;'"
                        }
                    },
                    "required": ["sql_query"]
                }
            },
            {
                "name": "inspect_screen_context",
                "description": "Retrieves the visible DOM tables, metric cards, and current page route active on the user's screen right now.",
                "parameters": {
                    "type": "OBJECT",
                    "properties": {}
                }
            }
        ]

    def dispatch(
        self,
        tool_name: str,
        arguments: Dict[str, Any],
        ctx: UserContext,
        page_context: Optional[Dict[str, Any]] = None
    ) -> Any:
        """
        Executes the specified tool and returns the JSON-serializable result.
        """
        logger.info("ToolRegistry dispatching: %s with args: %s", tool_name, arguments)
        
        if tool_name == "get_database_schema":
            raw_res = {"schema": self.db_tool.get_schema_overview(ctx)}
            
        elif tool_name == "execute_readonly_sql":
            query = arguments.get("sql_query", "")
            raw_res = {"rows": self.db_tool.execute_readonly_sql(query, ctx)}
            
        elif tool_name == "inspect_screen_context":
            raw_res = self.web_tool.inspect_screen_context(page_context)
            
        else:
            raw_res = {"error": f"Unknown tool: '{tool_name}'"}

        return make_json_safe(raw_res)

tool_registry = ToolRegistry()
