"""
Migration: academic calendar dates.

- Adds start_date / end_date to academic_years and semesters (create_all never adds columns).
- Removes undated legacy semester rows that are not Odd (1) / Even (2) terms, e.g. the old
  "Semester IV" placeholder. Real terms are entered in Master Data > Academic Calendar.

Usage (from backend/):
    python -m app.migrations.academic_calendar_setup --dry-run
    python -m app.migrations.academic_calendar_setup
"""

import argparse
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from sqlalchemy import inspect, text

from app.database import engine


def run(dry_run: bool) -> dict:
    insp = inspect(engine)
    summary = {"dry_run": dry_run, "columns_added": [], "legacy_semesters_removed": []}
    with engine.begin() as conn:
        for table in ("academic_years", "semesters"):
            existing = {c["name"] for c in insp.get_columns(table)}
            for col in ("start_date", "end_date"):
                if col not in existing:
                    summary["columns_added"].append(f"{table}.{col}")
                    if not dry_run:
                        conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {col} DATE"))
        cols = {c["name"] for c in inspect(conn).get_columns("semesters")}
        where = "number NOT IN (1, 2)" + (" AND start_date IS NULL" if "start_date" in cols else "")
        legacy = conn.execute(text(f"SELECT id, number, name, academic_year FROM semesters WHERE {where}")).fetchall()
        summary["legacy_semesters_removed"] = [dict(r._mapping) for r in legacy]
        if legacy and not dry_run:
            conn.execute(text(f"DELETE FROM semesters WHERE {where}"))
        if dry_run:
            conn.rollback()
    return summary


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    print(json.dumps(run(parser.parse_args().dry_run), indent=2, default=str))
