"""
Database Sequence Synchronization Script
----------------------------------------
Synchronizes all PostgreSQL sequences to match the maximum ID in their corresponding tables.
This prevents:
  psycopg2.errors.UniqueViolation: duplicate key value violates unique constraint "<table_name>_pkey"
when inserting new records after data seeding, dumps, or manual insertions.
"""

import os
import sys
from dotenv import load_dotenv

# Ensure backend root is on sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

load_dotenv(os.path.join(backend_dir, ".env"))

from sqlalchemy import create_engine, text

def sync_sequences(target_bind=None):
    """
    Synchronize all PostgreSQL sequences with table MAX(id) values.
    Can be run standalone with DATABASE_URL or passed an engine/connection.
    """
    if target_bind is None:
        db_url = os.getenv("DIRECT_DATABASE_URL") or os.getenv("DATABASE_URL")
        if not db_url:
            print("[ERROR] DATABASE_URL not set!")
            return {"error": "DATABASE_URL not set"}
        engine = create_engine(db_url)
    else:
        engine = target_bind

    find_seqs_query = text("""
        SELECT 
            c.table_name,
            c.column_name,
            pg_get_serial_sequence(format('"%s"."%s"', c.table_schema, c.table_name), c.column_name) AS seq_name
        FROM information_schema.columns c
        JOIN information_schema.tables t ON t.table_schema = c.table_schema AND t.table_name = c.table_name
        WHERE c.table_schema = 'public' 
          AND t.table_type = 'BASE TABLE'
          AND pg_get_serial_sequence(format('"%s"."%s"', c.table_schema, c.table_name), c.column_name) IS NOT NULL
        ORDER BY c.table_name;
    """)

    details = []
    updated_count = 0
    already_synced = 0

    def _execute_sync(conn):
        nonlocal updated_count, already_synced
        rows = conn.execute(find_seqs_query).fetchall()

        for table_name, column_name, seq_name in rows:
            max_id = conn.execute(
                text(f'SELECT COALESCE(MAX("{column_name}"), 0) FROM "{table_name}"')
            ).scalar()

            seq_info = conn.execute(
                text(f'SELECT last_value, is_called FROM {seq_name}')
            ).mappings().first()

            last_val = seq_info["last_value"] if seq_info else None
            is_called = seq_info["is_called"] if seq_info else False
            next_val = (last_val + 1) if is_called else last_val

            if max_id == 0:
                # Table is empty: sequence should yield 1 next
                if last_val != 1 or is_called != False:
                    conn.execute(text(f"SELECT setval('{seq_name}', 1, false)"))
                    msg = f"[RESET EMPTY] {table_name}.{column_name} -> {seq_name} reset to 1"
                    print(f"  {msg}")
                    details.append(msg)
                    updated_count += 1
                else:
                    already_synced += 1
            else:
                # Table has data: if sequence next_val <= max_id, it is out of sync
                if next_val is None or next_val <= max_id:
                    conn.execute(text(f"SELECT setval('{seq_name}', {max_id}, true)"))
                    msg = f"[FIXED] {table_name}.{column_name}: max_id={max_id}, was next={next_val} -> next={max_id + 1}"
                    print(f"  {msg}")
                    details.append(msg)
                    updated_count += 1
                else:
                    already_synced += 1

        return len(rows)

    if hasattr(engine, "begin"):
        with engine.begin() as conn:
            total_rows = _execute_sync(conn)
    else:
        total_rows = _execute_sync(engine)

    summary = {
        "total_checked": total_rows,
        "updated": updated_count,
        "already_synced": already_synced,
        "details": details
    }
    print(f"\n[SUMMARY] Checked {total_rows} sequences: {updated_count} updated, {already_synced} already in sync.")
    return summary

if __name__ == "__main__":
    sync_sequences()
