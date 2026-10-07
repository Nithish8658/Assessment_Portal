# Database Migration Rollback & Recovery Plan

## 1. Objective & Reversibility Guarantee
The SQLite to PostgreSQL migration for the NASC Assessment Portal has been engineered to be **100% non-destructive and instantly reversible**.

The source SQLite database (`backend/nasc_portal.db`) has been left completely intact and unmodified, and verified point-in-time snapshots are secured under `migration/backups/`.

---

## 2. Emergency Rollback Procedure (Step-by-Step)

If an unforeseen production issue arises requiring an immediate return to the SQLite backend:

### Step 1: Revert Environment Configuration
Edit `backend/.env`:
```ini
# Comment out or remove PostgreSQL URL
# DATABASE_URL=postgresql+psycopg2://notebook:notebook@localhost:5432/nasc_portal

# Set fallback SQLite path
DATABASE_URL=sqlite:///c:/Users/HP/Desktop/Assessment_Portal/backend/nasc_portal.db
```

### Step 2: Verify Source SQLite Snapshot
Confirm the verified snapshot is in place:
```powershell
python -c "import sqlite3; conn = sqlite3.connect('backend/nasc_portal.db'); print('Integrity check:', conn.execute('PRAGMA integrity_check;').fetchall())"
```

If the working copy SQLite was altered during runtime, restore the canonical backup:
```powershell
Copy-Item "migration/backups/nasc_portal_source_verified.db" "backend/nasc_portal.db" -Force
```

### Step 3: Restart Backend Services
Restart the FastAPI server:
```powershell
python backend/run.py
```

### Step 4: Verify Fallback Operation
Execute smoke test against SQLite:
```powershell
python backend/check_env.py
```

---

## 3. Preserving Post-Migration Logs
During any rollback, all migration logs and artifacts in `migration/logs/`, `migration/manifests/`, and `migration/reports/` are preserved for post-mortem diagnostics.
