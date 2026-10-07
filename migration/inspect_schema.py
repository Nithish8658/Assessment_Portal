import psycopg2
import json

db_url = "postgresql://nasc_admin:nasc_secure_password_2026@localhost:5432/nasc_portal"
conn = psycopg2.connect(db_url)
cur = conn.cursor()

# Query columns
for table in ['assessment_domains', 'assessment_rounds', 'assessment_questions', 'question_evaluation_configs']:
    cur.execute(f"SELECT column_name FROM information_schema.columns WHERE table_name = '{table}'")
    cols = [r[0] for r in cur.fetchall()]
    print(f"{table} columns:", cols)

cur.close()
conn.close()
