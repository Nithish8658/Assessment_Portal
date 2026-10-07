import psycopg2
import json

db_url = "postgresql://nasc_admin:nasc_secure_password_2026@localhost:5432/nasc_portal"
conn = psycopg2.connect(db_url)
cur = conn.cursor()

query = """
SELECT 
    d.title AS assessment_domain,
    r.round_number,
    r.title AS round_title,
    r.round_type,
    q.id AS question_id,
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

print(f"Total Questions retrieved: {len(rows)}")

# Sample first 5
for r in rows[:5]:
    print(f"Domain: {r[0]} | Round {r[1]}: {r[2]} | Type: {r[5]} | Title: {r[6]} | Eval: {r[9]} | Correct: {r[10]}")

cur.close()
conn.close()
