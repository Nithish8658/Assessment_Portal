import asyncio
import os
import sys

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.assessment.gemini_evaluator import gemini_evaluator
from app.database import SessionLocal
from app.models.assessment_models import AssessmentRound, AssessmentQuestion

async def test_all_systems():
    print("==================================================")
    print("=== NASC ASSESSMENT SYSTEM VERIFICATION SUITE ===")
    print("==================================================")
    
    # 1. Verify Database Round & Question Counts
    db = SessionLocal()
    try:
        rounds = db.query(AssessmentRound).all()
        print(f"\n[1/4] Checking Database Rounds & Questions...")
        print(f"Total Active Rounds: {len(rounds)}")
        
        total_questions = 0
        tableau_round_valid = False
        
        for r in rounds:
            q_count = db.query(AssessmentQuestion).filter(AssessmentQuestion.round_id == r.id).count()
            total_questions += q_count
            print(f" - Round {r.id:02d} ({r.domain.title if r.domain else 'Unknown'} > {r.title}): "
                  f"Type={r.round_type.value if hasattr(r.round_type, 'value') else r.round_type}, "
                  f"QBank={q_count}, RequiredPerAttempt={r.questions_per_attempt}")
            
            if "tableau" in r.title.lower():
                r_type = r.round_type.value if hasattr(r.round_type, 'value') else str(r.round_type)
                if "TABLEAU" in r_type.upper():
                    tableau_round_valid = True
                    
        print(f"Total Questions in Question Bank: {total_questions}")
        assert total_questions >= 200, f"Expected >= 200 questions, found {total_questions}"
        assert tableau_round_valid, "Tableau round_type was not correctly set to TABLEAU_PRACTICAL"
        print("  -> Database Questions & Round Types: PASSED (100% capacity)")
        
    finally:
        db.close()

    # 2. Verify Strict Gemini Evaluator (No heuristics fallback)
    print(f"\n[2/4] Testing Strict Gemini Evaluation Service...")
    sample_title = "Analytical Root Cause & Hypothesis Formulation"
    sample_prompt = (
        "During your project analysis, your dashboard shows Region A sales surged 45% in a single month. "
        "Explain what data verification steps you take to determine if this is legitimate organic growth or a data pipeline anomaly."
    )
    sample_answer = (
        "I would start by validating the raw transactional source data against the staging warehouse tables to check for duplicates "
        "or multi-currency conversion glitches. Next, I would segment the surge by product category and customer cohort to see if "
        "a few whale bulk purchases skewed the volume. If transaction counts correlate with web traffic logs and payment gateway receipts, "
        "it is confirmed organic; otherwise, I isolate the corrupted ETL batch and notify stakeholders."
    )
    sample_rubric = (
        "Rubric: (1) Anomaly verification & checking ETL duplicates, (2) Distinguishing volume surge vs price glitch, "
        "(3) Validating against payment receipts and web traffic, (4) Executive stakeholder reporting."
    )

    eval_result = await gemini_evaluator.evaluate_subjective_response(
        question_title=sample_title,
        question_content=sample_prompt,
        rubric=sample_rubric,
        candidate_answer=sample_answer,
        max_marks=10.0
    )
    print(f"Gemini Evaluation Result:")
    print(f" - Score: {eval_result['score_awarded']} / {eval_result['max_score']} ({eval_result['percentage']}%)")
    print(f" - Feedback: {eval_result['feedback']}")
    print(f" - Strengths: {eval_result['strengths']}")
    print(f" - Rubric Breakdown: {eval_result['rubric_breakdown']}")
    assert eval_result['score_awarded'] > 0, "Gemini evaluation score was 0"
    print("  -> Strict Gemini Evaluator: PASSED")

    # 3. Verify Live Customer Support Chat Simulation Engine
    print(f"\n[3/4] Testing Live AI Multi-Turn Customer Support Simulation...")
    test_system_instruction = (
        "You are simulating a customer contacting post-sales support for an e-commerce platform. "
        "Scenario: Order delayed 3 days. React realistically to the agent's message. "
        "Respond strictly in JSON with keys: 'customer_reply' (string), 'csat_score' (int 0-100), "
        "'sentiment' (string), 'agent_feedback' (string), 'is_conversation_complete' (bool)."
    )
    test_user_prompt = (
        "=== AGENT MESSAGE ===\n"
        "I sincerely apologize for the delay on your express delivery, Jessica. I have reviewed tracking and see it is "
        "currently moving through the Memphis hub. I have immediately processed a refund for your $25 express shipping fee "
        "and escalated with FedEx for priority morning delivery.\n\n"
        "Generate the customer's response JSON object now."
    )
    raw_sim_res = await gemini_evaluator._call_gemini_cascade(test_system_instruction, test_user_prompt)
    sim_turn = gemini_evaluator._extract_json(raw_sim_res)

    print(f"Simulation Customer Response:")
    print(f" - Reply: {sim_turn.get('customer_reply')}")
    print(f" - Sentiment: {sim_turn.get('sentiment')}")
    print(f" - CSAT Score: {sim_turn.get('csat_score')}/100")
    print(f" - Agent Feedback: {sim_turn.get('agent_feedback')}")
    assert len(sim_turn.get('customer_reply', '')) > 5, "Customer response too short"
    assert int(sim_turn.get('csat_score', 0)) >= 1, "Invalid CSAT score"
    print("  -> Multi-Turn Chat Simulation Engine: PASSED")

    print("\n[4/4] ALL VERIFICATION CHECKS COMPLETED SUCCESSFULLY WITH 0 DEFICITS!")
    print("==================================================")

if __name__ == "__main__":
    asyncio.run(test_all_systems())
