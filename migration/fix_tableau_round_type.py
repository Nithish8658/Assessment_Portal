import psycopg2
import os

db_url = os.getenv("DATABASE_URL", "postgresql://nasc_admin:nasc_secure_password_2026@localhost:5432/nasc_portal")
conn = psycopg2.connect(db_url)
conn.autocommit = True
cur = conn.cursor()

cur.execute("UPDATE assessment_rounds SET round_type = 'TABLEAU_PRACTICAL' WHERE id = 12;")
cur.execute("SELECT id, title, round_type FROM assessment_rounds WHERE id = 12;")
row = cur.fetchone()
print(f"Updated Round ID {row[0]}: {row[1]} -> round_type = '{row[2]}'")

cur.close()
conn.close()
