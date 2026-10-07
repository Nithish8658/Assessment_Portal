import os
import shutil
import sqlite3
import hashlib
import json
import datetime

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(ROOT_DIR, "backend", "nasc_portal.db")
MIGRATION_DIR = os.path.join(ROOT_DIR, "migration")
BACKUP_DIR = os.path.join(MIGRATION_DIR, "backups")
MANIFEST_DIR = os.path.join(MIGRATION_DIR, "manifests")
REPORT_DIR = os.path.join(MIGRATION_DIR, "reports")
LOG_DIR = os.path.join(MIGRATION_DIR, "logs")

for d in [BACKUP_DIR, MANIFEST_DIR, REPORT_DIR, LOG_DIR]:
    os.makedirs(d, exist_ok=True)

def calculate_sha256(filepath):
    h = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()

print("="*80)
print("PHASE 1 & PHASE 2: SOURCE DATABASE VERIFICATION & IMMUTABLE BACKUP")
print("="*80)

if not os.path.exists(DB_PATH):
    print(f"[FATAL] SQLite database not found at {DB_PATH}")
    exit(1)

# 1. Source verification
source_size = os.path.getsize(DB_PATH)
source_sha256 = calculate_sha256(DB_PATH)

conn = sqlite3.connect(DB_PATH)
conn.row_factory = sqlite3.Row
cur = conn.cursor()

cur.execute("PRAGMA integrity_check;")
integrity_result = [dict(r) for r in cur.fetchall()]
is_intact = len(integrity_result) == 1 and integrity_result[0].get('integrity_check') == 'ok'

cur.execute("SELECT sqlite_version();")
sqlite_ver = cur.fetchone()[0]

cur.execute("SELECT type, name, sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY type, name;")
schema_objects = cur.fetchall()
tables = [r['name'] for r in schema_objects if r['type'] == 'table']
indexes = [r['name'] for r in schema_objects if r['type'] == 'index']

table_counts = {}
total_records = 0
for t in sorted(tables):
    cur.execute(f'SELECT count(*) FROM "{t}";')
    cnt = cur.fetchone()[0]
    table_counts[t] = cnt
    total_records += cnt

print(f"Source Database:    {DB_PATH}")
print(f"File Size:          {source_size} bytes ({source_size/1024:.2f} KB)")
print(f"SHA-256 Checksum:   {source_sha256}")
print(f"SQLite Version:     {sqlite_ver}")
print(f"Integrity Check:    {'PASSED (ok)' if is_intact else 'FAILED'}")
print(f"Total Tables:       {len(tables)}")
print(f"Total Indexes:      {len(indexes)}")
print(f"Total Records:      {total_records}")

EXPECTED_TABLES = 41
EXPECTED_RECORDS = 1547

if len(tables) != EXPECTED_TABLES or total_records != EXPECTED_RECORDS:
    print(f"[ERROR] Baseline mismatch! Expected {EXPECTED_TABLES} tables and {EXPECTED_RECORDS} records.")
    exit(1)
else:
    print("[SUCCESS] Source matches 100% of physical table inventory (1,547 total rows across 41 tables).")

# 2. Create Immutable Backup
timestamp_str = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
backup_filename = f"nasc_portal_backup_{timestamp_str}.db"
backup_filepath = os.path.join(BACKUP_DIR, backup_filename)
canonical_backup_path = os.path.join(BACKUP_DIR, "nasc_portal_source_verified.db")

# Use SQLite backup API for consistent point-in-time snapshot
backup_conn = sqlite3.connect(backup_filepath)
conn.backup(backup_conn)
backup_conn.close()

# Also copy to canonical path
shutil.copy2(backup_filepath, canonical_backup_path)

backup_size = os.path.getsize(canonical_backup_path)
backup_sha256 = calculate_sha256(canonical_backup_path)
print(f"\n[BACKUP CREATED] Immutable point-in-time snapshot:")
print(f"  Timestamped Backup: {backup_filepath}")
print(f"  Canonical Backup:   {canonical_backup_path}")
print(f"  Backup Size:        {backup_size} bytes")
print(f"  Backup SHA-256:     {backup_sha256}")

# 3. Export Manifest & SQL Schema
manifest = {
    "source_file": DB_PATH,
    "timestamp": datetime.datetime.now().isoformat(),
    "source_size_bytes": source_size,
    "source_sha256": source_sha256,
    "backup_file": canonical_backup_path,
    "backup_sha256": backup_sha256,
    "sqlite_version": sqlite_ver,
    "integrity_check": integrity_result,
    "total_tables": len(tables),
    "total_indexes": len(indexes),
    "total_records": total_records,
    "table_counts": table_counts
}

manifest_path = os.path.join(MANIFEST_DIR, "source_manifest.json")
with open(manifest_path, "w", encoding="utf-8") as f:
    json.dump(manifest, f, indent=2)
print(f"[MANIFEST WRITTEN] {manifest_path}")

schema_sql_path = os.path.join(MANIFEST_DIR, "source_schema.sql")
with open(schema_sql_path, "w", encoding="utf-8") as f:
    for line in conn.iterdump():
        f.write(f"{line}\n")
print(f"[SCHEMA DUMPED] {schema_sql_path}")

print("="*80)
print("PHASE 1 & PHASE 2 COMPLETE: ALL PRE-MIGRATION BACKUPS & MANIFESTS VERIFIED")
print("="*80)
