import psycopg2
import json

db_url = "postgresql://nasc_admin:nasc_secure_password_2026@localhost:5432/nasc_portal"
conn = psycopg2.connect(db_url)
cur = conn.cursor()

# 1. Round info
cur.execute("""
SELECT d.id, d.title, r.id, r.title, r.round_number, r.round_type, r.questions_per_attempt, r.duration_minutes
FROM assessment_domains d
JOIN assessment_rounds r ON r.domain_id = d.id
WHERE d.title ILIKE '%Software Development%' AND r.round_number = 1
""")
round_info = cur.fetchall()
print("Round info:", round_info)
round_id = round_info[0][2]

# 2. Competencies columns
cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'competencies'")
cols = [r[0] for r in cur.fetchall()]
print("Competencies columns:", cols)

cur.execute(f"SELECT {', '.join(cols)} FROM competencies LIMIT 10")
print("Sample Competencies:", cur.fetchall())

# 3. Existing questions in Round 1
cur.execute("""
SELECT q.id, q.competency_id, q.title, q.candidate_content, q.options_json, q.marks, q.difficulty, q.time_limit_seconds, e.evaluation_type, e.correct_answer
FROM assessment_questions q
LEFT JOIN question_evaluation_configs e ON e.question_id = q.id
WHERE q.round_id = %s
ORDER BY q.id
""", (round_id,))
questions = cur.fetchall()
print(f"\nExisting Questions in Round {round_id}: ({len(questions)} found)")
for q in questions:
    print(f"  ID: {q[0]} | CompID: {q[1]} | Title: {q[2]} | Marks: {q[5]} | Eval: {q[8]} | Correct: {q[9]}")
    print(f"    Content: {q[3]}")
    print(f"    Options: {q[4]}")

cur.close()
conn.close()
