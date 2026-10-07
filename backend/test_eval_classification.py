import json

def test_classification():
    with open("audit_dump.json", "r", encoding="utf-8") as f:
        data = json.load(f)
        
    classified = {
        "MCQ_BLOCK": [],
        "TYPING_BLOCK": [],
        "CODING_BLOCK": [],
        "SQL_BLOCK": [],
        "SIMULATION_BLOCK": [],
        "SUBJECTIVE_LLM_BLOCK": [],
        "FALLTHROUGH_OPTION_MISMATCH": []
    }
    
    for q in data:
        q_type_raw = str(q.get("question_type") or "MCQ").strip()
        q_type_upper = q_type_raw.upper()
        raw_opts = q.get("options") or []
        has_options = q.get("options_count", 0) > 0
        
        if "MCQ" in q_type_upper or q_type_upper in ["SINGLESELECT", "MULTIPLECHOICE", "DESCRIPTIVE_MCQ", "SCENARIO", "SOP_CASE", "TABLEAU_PROCEDURAL"] or has_options:
            classified["MCQ_BLOCK"].append(q)
        elif "TYPING" in q_type_upper or q_type_upper in ["TYPINGTEST", "COMMUNICATION"]:
            classified["TYPING_BLOCK"].append(q)
        elif "CODING" in q_type_upper or "DEBUG" in q_type_upper or q_type_upper in ["PROGRAMMING", "HANDSON"]:
            classified["CODING_BLOCK"].append(q)
        elif "SQL" in q_type_upper or q_type_upper in ["DATABASE", "QUERY"]:
            classified["SQL_BLOCK"].append(q)
        elif q_type_upper in ["MULTI_CHAT_SIMULATION", "SUPPORT_CONSOLE_SIMULATION", "CHAT_SIMULATION"]:
            classified["SIMULATION_BLOCK"].append(q)
        else:
            classified["SUBJECTIVE_LLM_BLOCK"].append(q)
                
    print("=== EVALUATION ROUTING CLASSIFICATION ===")
    for k, v in classified.items():
        print(f" - {k}: {len(v)} questions")
        
    if classified["FALLTHROUGH_OPTION_MISMATCH"]:
        print("\nQuestions with options that fall through to Subjective block:")
        for q in classified["FALLTHROUGH_OPTION_MISMATCH"]:
            print(f"   * Q{q['question_id']} ({q['round_title']}): type='{q['question_type']}', opts={q['options_count']}, correct='{q['correct_answer'][:40]}'")

if __name__ == "__main__":
    test_classification()
