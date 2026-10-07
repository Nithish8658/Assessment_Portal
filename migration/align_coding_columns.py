import psycopg2

db_url = "postgresql://nasc_admin:nasc_secure_password_2026@localhost:5432/nasc_portal"
conn = psycopg2.connect(db_url)
conn.autocommit = True
cur = conn.cursor()

cur.execute("""
ALTER TABLE coding_submissions ADD COLUMN IF NOT EXISTS judge0_status_id INTEGER;
ALTER TABLE code_execution_results ADD COLUMN IF NOT EXISTS judge0_token VARCHAR;
ALTER TABLE code_execution_results ADD COLUMN IF NOT EXISTS judge0_status_id INTEGER;
ALTER TABLE code_execution_results ADD COLUMN IF NOT EXISTS input_data TEXT;
ALTER TABLE code_execution_results ADD COLUMN IF NOT EXISTS expected_output TEXT;
ALTER TABLE code_execution_results ADD COLUMN IF NOT EXISTS memory_kb DOUBLE PRECISION;
""")

print("Successfully ensured all Judge0 metadata columns exist in coding_submissions and code_execution_results.")

cur.close()
conn.close()
