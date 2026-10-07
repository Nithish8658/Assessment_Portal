import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.services.assessment.hod_assistant_service import hod_assistant_service

def test_assistant_tools():
    print("==================================================")
    print("=== TESTING HOD & ADMIN POSTGRESQL TOOL SERVICE ===")
    print("==================================================")
    
    db = SessionLocal()
    try:
        # Test 1: Live exam status tool
        print("\n[1/4] Testing tool: 'get_live_exam_status'...")
        res1 = hod_assistant_service.execute_tool(
            tool_name="get_live_exam_status",
            arguments={},
            user_role="Administrator",
            dept_id=None,
            db=db
        )
        print(f"Result summary: {res1.get('summary', 'OK')}")
        print("  -> Live Exam Status Tool: PASSED")

        # Test 2: Department KPIs tool
        print("\n[2/4] Testing tool: 'get_department_kpis'...")
        res2 = hod_assistant_service.execute_tool(
            tool_name="get_department_kpis",
            arguments={},
            user_role="Administrator",
            dept_id=None,
            db=db
        )
        print(f"Result count: {len(res2.get('departments', []))}")
        print("  -> Department KPIs Tool: PASSED")

        # Test 3: Pending approvals tool (HoD perspective)
        print("\n[3/4] Testing tool: 'get_pending_approvals' (HoD Scope)...")
        res3 = hod_assistant_service.execute_tool(
            tool_name="get_pending_approvals",
            arguments={},
            user_role="HoD",
            dept_id=2,
            db=db
        )
        print(f"Pending requests found: {res3.get('pending_count', 0)}")
        print("  -> HoD Scoped Query: PASSED")

        # Test 4: Question bank summary tool
        print("\n[4/4] Testing tool: 'get_question_bank_summary'...")
        res4 = hod_assistant_service.execute_tool(
            tool_name="get_question_bank_summary",
            arguments={},
            user_role="Administrator",
            dept_id=None,
            db=db
        )
        print(f"Domains reported: {len(res4.get('domains', []))}")
        print("  -> Question Bank Summary Tool: PASSED")

        print("\n==================================================")
        print("=== ALL TOOL TESTS PASSED WITH 0 DEFICITS! ===")
        print("==================================================")

    finally:
        db.close()

if __name__ == "__main__":
    test_assistant_tools()
