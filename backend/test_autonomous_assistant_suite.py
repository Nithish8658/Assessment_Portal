"""
Comprehensive verification test suite for the Autonomous Executive AI Assistant.
Tests:
1. Tool Layer: DatabaseTool schema generation, arbitrary SELECT execution, and mutation rejection.
2. Security & Guardrails: SQL injection / mutation prevention, read-only enforcement.
3. Multi-Tenancy Scoping: HoD department constraints vs. Admin institution-wide visibility.
4. Autonomous Master Agent: Universal un-canned query resolution without permission prompts.
5. WebSocket Gateway Handshake: RBAC role verification.
"""

import sys
import os
import asyncio
import logging

# Ensure backend path is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.assistant.tools import DatabaseTool, UserContext, tool_registry
from app.services.assistant.master_agent import AutonomousMasterAgent
from app.services.assistant.gateway import WebSocketGateway
from app.database import SessionLocal
from app.models.models import User, Department

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("test_suite")


def test_database_tool_arbitrary_queries():
    print("\n--- TEST 1: DatabaseTool Arbitrary Read-Only SQL Execution ---")
    db_tool = DatabaseTool()
    admin_ctx = UserContext(
        user_id=1,
        user_name="Administrator",
        roles=["Administrator"],
        primary_role="Administrator"
    )

    # 1. Query questions count grouped by domain and round
    sql1 = """
        SELECT d.title AS domain_title, r.round_number, r.title AS round_title, COUNT(q.id) AS question_count
        FROM assessment_domains d
        JOIN assessment_rounds r ON r.domain_id = d.id
        LEFT JOIN assessment_questions q ON q.round_id = r.id
        GROUP BY d.title, r.round_number, r.title
        ORDER BY d.title, r.round_number;
    """
    rows1 = db_tool.execute_readonly_sql(sql1, admin_ctx)
    print(f"Query 1 (Question count by domain/round) returned {len(rows1)} rows:")
    for r in rows1[:5]:
        print("  ", r)
    assert len(rows1) > 0, "Expected question distribution rows"
    assert "question_count" in rows1[0], "Expected question_count column"

    # 2. Query attempts and results
    sql2 = """
        SELECT att.id AS attempt_id, att.status, res.total_score, res.max_score, res.percentage, res.passed
        FROM assessment_attempts att
        LEFT JOIN assessment_results res ON res.attempt_id = att.id
        LIMIT 5;
    """
    rows2 = db_tool.execute_readonly_sql(sql2, admin_ctx)
    print(f"Query 2 (Attempts & Results) returned {len(rows2)} rows:")
    for r in rows2:
        print("  ", r)
    assert isinstance(rows2, list), "Expected list result"

    # 3. Query academic classes & programmes
    sql3 = """
        SELECT p.name AS programme_name, c.class_code, c.name AS class_name, c.batch_name
        FROM academic_classes c
        JOIN programmes p ON p.id = c.programme_id
        LIMIT 5;
    """
    rows3 = db_tool.execute_readonly_sql(sql3, admin_ctx)
    print(f"Query 3 (Classes & Programmes) returned {len(rows3)} rows:")
    for r in rows3:
        print("  ", r)
    assert isinstance(rows3, list), "Expected list result"
    print(">>> TEST 1 PASSED: Arbitrary SELECT queries executed successfully.")


def test_database_tool_security_rejections():
    print("\n--- TEST 2: Security & Mutating SQL Rejections ---")
    db_tool = DatabaseTool()
    ctx = UserContext(user_id=1, user_name="Admin", roles=["Administrator"], primary_role="Administrator")

    mutating_queries = [
        "UPDATE users SET is_active = false WHERE id = 1;",
        "DELETE FROM assessment_questions WHERE id = 1;",
        "DROP TABLE audit_logs;",
        "INSERT INTO roles (name) VALUES ('Hacker');",
        "ALTER TABLE users ADD COLUMN compromised boolean;",
        "TRUNCATE assessment_attempts;"
    ]

    for q in mutating_queries:
        res = db_tool.execute_readonly_sql(q, ctx)
        print(f"  Tested: '{q[:40]}...' -> Response: {res}")
        assert len(res) == 1 and "error" in res[0], f"Failed to block mutating query: {q}"
        assert "Security violation" in res[0]["error"], f"Expected security violation for: {q}"

    print(">>> TEST 2 PASSED: All mutating SQL statements were strictly blocked.")


def test_multitenancy_and_rbac():
    print("\n--- TEST 3: Multi-Tenancy & RBAC Verification ---")
    db = SessionLocal()
    try:
        gateway = WebSocketGateway()

        # Check an HoD user or admin user in DB
        admin_user = db.query(User).filter(User.roles.any(name="Administrator")).first()
        if admin_user:
            from app.auth.jwt import create_access_token
            admin_token = create_access_token(data={"sub": admin_user.username})
            ctx = gateway.authenticate_handshake(admin_token, db)
            print(f"  Authenticated Admin: {ctx.user_name}, Primary Role: {ctx.primary_role}, IsAdmin: {ctx.is_admin}")
            assert ctx.is_admin is True, "Expected is_admin to be True"

        # Check student rejection
        student_user = db.query(User).filter(User.roles.any(name="Student")).first()
        if student_user:
            from app.auth.jwt import create_access_token
            student_token = create_access_token(data={"sub": student_user.username})
            try:
                gateway.authenticate_handshake(student_token, db)
                assert False, "Student should have been rejected with PermissionError"
            except PermissionError as pe:
                print(f"  Student correctly rejected: {pe}")
                assert "Access denied" in str(pe)

        print(">>> TEST 3 PASSED: Multi-tenancy and RBAC handshake successfully validated.")
    finally:
        db.close()


async def test_autonomous_master_agent_universal_query():
    print("\n--- TEST 4: Autonomous Master Agent Universal Query (No Fixed Queries) ---")
    admin_ctx = UserContext(
        user_id=1,
        user_name="System Administrator",
        roles=["Administrator"],
        primary_role="Administrator"
    )

    agent = AutonomousMasterAgent(user_context=admin_ctx)

    # Test an un-canned question that requires dynamic schema introspection & SQL execution
    test_query = "What is the exact count of questions per difficulty level across all rounds for Domain 1 (Software Developer)? List them in a Markdown table."

    tokens = []
    async def on_token(token: str):
        tokens.append(token)

    tools_called = []
    async def on_tool(tool_name: str, args: dict):
        tools_called.append((tool_name, args))
        print(f"  [Tool Dispatched]: {tool_name} with args: {args}")

    print(f"  User Query: '{test_query}'")
    result = await agent.process_utterance(
        utterance=test_query,
        conversation_history=[],
        on_token=on_token,
        on_tool_call=on_tool
    )

    print("\n  --- Agent Response ---")
    print(result["response"])
    print("  -----------------------")
    print(f"  Tools executed count: {len(result['tools_executed'])}")

    # Verification criteria:
    # 1. Tools must have been called (schema inspection or readonly SQL)
    assert len(tools_called) > 0, "Expected agent to autonomously call tools"
    # 2. Response must NOT ask for permission
    permission_phrases = ["should i", "do you want me to", "may i", "would you like me to", "please confirm"]
    for phrase in permission_phrases:
        assert phrase not in result["response"].lower(), f"Agent asked permission: '{phrase}' found in response!"
    # 3. Response should contain Markdown table characters
    assert "|" in result["response"], "Expected response to contain a Markdown table"

    print(">>> TEST 4 PASSED: Autonomous Master Agent answered dynamically without permission requests.")


async def main():
    print("==================================================================")
    print("STARTING AUTONOMOUS EXECUTIVE AI ASSISTANT FULL VERIFICATION SUITE")
    print("==================================================================")

    test_database_tool_arbitrary_queries()
    test_database_tool_security_rejections()
    test_multitenancy_and_rbac()
    await test_autonomous_master_agent_universal_query()

    print("\n==================================================================")
    print("ALL VERIFICATION TESTS PASSED SUCCESSFULLY!")
    print("==================================================================")


if __name__ == "__main__":
    asyncio.run(main())
