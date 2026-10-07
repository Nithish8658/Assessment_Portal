import json

def analyze_audit():
    with open("audit_dump.json", "r", encoding="utf-8") as f:
        data = json.load(f)
        
    print(f"Total entries: {len(data)}")
    
    rounds = {}
    for item in data:
        r_key = (item["domain_title"], item["round_number"], item["round_title"], item["round_type"])
        if r_key not in rounds:
            rounds[r_key] = []
        rounds[r_key].append(item)
        
    for (d_title, r_num, r_title, r_type), q_list in rounds.items():
        q_types = set(q["question_type"] for q in q_list)
        eval_techs = set(q["eval_technique"] for q in q_list)
        print(f"\n[{d_title}] Round {r_num}: {r_title} (Type: {r_type})")
        print(f"  - Questions: {len(q_list)}")
        print(f"  - Question Types: {q_types}")
        print(f"  - Eval Techniques: {eval_techs}")
        
if __name__ == "__main__":
    analyze_audit()
