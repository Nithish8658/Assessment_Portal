import psycopg2
import json
import os

db_url = "postgresql://nasc_admin:nasc_secure_password_2026@localhost:5432/nasc_portal"
conn = psycopg2.connect(db_url)
cur = conn.cursor()

query = """
SELECT 
    d.title AS domain_title,
    r.round_number,
    r.title AS round_title,
    q.question_type,
    q.title AS question_title,
    q.candidate_content,
    q.options_json,
    e.evaluation_type,
    e.correct_answer,
    e.reference_solution
FROM assessment_domains d
JOIN assessment_rounds r ON r.domain_id = d.id
JOIN assessment_questions q ON q.round_id = r.id
LEFT JOIN question_evaluation_configs e ON e.question_id = q.id
ORDER BY d.id, r.round_number, q.id;
"""

cur.execute(query)
rows = cur.fetchall()

def format_cell(text, max_len=120):
    if text is None:
        return "-"
    if isinstance(text, (dict, list)):
        text = json.dumps(text)
    text = str(text).replace("\n", " <br> ").replace("|", "\\|")
    if len(text) > max_len:
        text = text[:max_len] + "..."
    return text

def format_options(opt_json):
    if not opt_json:
        return "-"
    try:
        opts = json.loads(opt_json) if isinstance(opt_json, str) else opt_json
        if isinstance(opts, list):
            items = []
            for i, opt in enumerate(opts):
                if isinstance(opt, dict):
                    lbl = opt.get('label', opt.get('id', str(i+1)))
                    txt = opt.get('text', opt.get('content', str(opt)))
                    items.append(f"**({lbl})** {txt}")
                else:
                    items.append(f"**({i+1})** {opt}")
            return " <br> ".join(items)
        elif isinstance(opts, dict):
            return " <br> ".join([f"**({k})** {v}" for k, v in opts.items()])
    except:
        pass
    return str(opt_json).replace("\n", " ").replace("|", "\\|")

def format_answer(q_type, ans, ref):
    if ans:
        ans_str = str(ans).strip()
        if len(ans_str) > 150:
            ans_str = ans_str[:150] + "..."
        return ans_str.replace("\n", " <br> ").replace("|", "\\|")
    if ref:
        ref_str = str(ref).strip()
        if len(ref_str) > 150:
            ref_str = ref_str[:150] + "..."
        return ref_str.replace("\n", " <br> ").replace("|", "\\|")
    return "Automated / Sandbox Rule"

doc = [
    "# Assessment Hierarchy Catalog",
    "Comprehensive mapping of **Assessment Domain > Rounds > Question Type > Question > Evaluation Technique > Options > Answers** across the entire NASC Assessment Portal.",
    "",
    "## Summary Overview",
    "| Assessment Domain | Total Rounds | Total Questions | Key Question Types | Evaluation Engines |",
    "| :--- | :--- | :--- | :--- | :--- |",
    "| **Software Development** | 4 Rounds | 9 Questions | MCQ, Coding, Open-Ended, Debugging | ExactMatch, SandboxTestRunner, LLMEvaluation |",
    "| **C & Systems Programming Master Track** | 4 Rounds | 35 Questions | MCQ, Coding, Code Debugging | ExactMatch, SandboxTestRunner (Judge0 C GCC) |",
    "| **Data Analyst & Business Intelligence** | 5 Rounds | 38 Questions | MCQ, SQL Execution, Coding, Case Study | ExactMatch, SandboxTestRunner (Postgres/Python), RubricMatrix |",
    "| **Chat Process Executive – International Support** | 4 Rounds | 54 Questions | Typing Test, Grammar MCQ, Situational Judgment, Chat Simulation | RealtimeWPM, ExactMatch, LLMJury, InteractiveAIAgent |",
    "",
    "---",
    ""
]

# Group by Domain and Round
current_domain = None
current_round = None

for r in rows:
    domain_title, round_num, round_title, q_type, q_title, content, options_json, eval_type, correct_ans, ref_sol = r
    
    if domain_title != current_domain:
        current_domain = domain_title
        doc.append(f"## Assessment Domain: {domain_title}\n")
        current_round = None
        
    if round_title != current_round:
        current_round = round_title
        doc.append(f"### Round {round_num}: {round_title}\n")
        doc.append("| # | Question Type | Question (Title & Prompt) | Evaluation Technique | Options | Correct Answer / Reference |")
        doc.append("| :--- | :--- | :--- | :--- | :--- | :--- |")
        
    q_prompt = f"**{q_title}**"
    if content and content != q_title:
        short_c = content.strip().replace("\n", " ").replace("|", "\\|")
        if len(short_c) > 120:
            short_c = short_c[:120] + "..."
        q_prompt += f"<br>_{short_c}_"
        
    opts = format_options(options_json)
    ans = format_answer(q_type, correct_ans, ref_sol)
    eval_tech = eval_type or "Standard Evaluation"
    
    doc.append(f"| Q{len(doc)} | `{q_type.upper()}` | {q_prompt} | `{eval_tech}` | {opts} | {ans} |")

output_path = "c:\\Users\\HP\\Desktop\\Assessment_Portal\\docs\\ASSESSMENT_ROUNDS_QUESTIONS_CATALOG.md"
os.makedirs(os.path.dirname(output_path), exist_ok=True)
with open(output_path, "w", encoding="utf-8") as f:
    f.write("\n".join(doc))

print(f"Catalog successfully written to {output_path}")

cur.close()
conn.close()
