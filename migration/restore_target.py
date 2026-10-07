import os
import subprocess
import psycopg2

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKUP_SQL = os.path.join(ROOT_DIR, "migration", "backups", "nasc_portal_target_verified.sql")

print("="*80)
print("RESTORING NASC_PORTAL BACKUP INTO DEDICATED CONTAINER (nasc-assessment-db)")
print("="*80)

if not os.path.exists(BACKUP_SQL):
    print(f"[ERROR] Backup file not found: {BACKUP_SQL}")
    exit(1)

print(f"Reading backup file: {BACKUP_SQL} ({os.path.getsize(BACKUP_SQL)} bytes)...")

# Execute restore via docker exec with input streaming
cmd = 'docker exec -i nasc-assessment-db psql -U nasc_admin -d nasc_portal'
with open(BACKUP_SQL, 'r', encoding='utf-8') as f:
    res = subprocess.run(cmd, shell=True, stdin=f, capture_output=True, text=True, encoding='utf-8')

print("Restore command output (stderr filtered for notices/warnings):")
if res.stderr:
    # Print lines that are not harmless DROP IF EXISTS warnings
    for line in res.stderr.splitlines():
        if "does not exist, skipping" not in line and "NOTICE:" not in line:
            print(f"  {line}")

print("[RESTORE COMPLETED]")

# Ensure ownership and permissions for nasc_admin on all public tables, sequences, views
db_url = "postgresql://nasc_admin:nasc_secure_password_2026@localhost:5432/nasc_portal"
conn = psycopg2.connect(db_url)
conn.autocommit = True
cur = conn.cursor()

cur.execute("""
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE format('ALTER TABLE %I OWNER TO nasc_admin;', r.tablename);
    END LOOP;
    FOR r IN (SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public') LOOP
        EXECUTE format('ALTER SEQUENCE %I OWNER TO nasc_admin;', r.sequence_name);
    END LOOP;
END $$;
""")
print("[PERMISSIONS & OWNERSHIP GRANTED TO nasc_admin]")

cur.close()
conn.close()
print("="*80)
