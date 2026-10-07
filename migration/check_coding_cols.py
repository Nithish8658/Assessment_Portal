import psycopg2

db_url = "postgresql://nasc_admin:nasc_secure_password_2026@localhost:5432/nasc_portal"
conn = psycopg2.connect(db_url)
cur = conn.cursor()

cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'coding_submissions'")
print("coding_submissions columns:", cur.fetchall())

cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'code_execution_results'")
print("code_execution_results columns:", cur.fetchall())

cur.close()
conn.close()
