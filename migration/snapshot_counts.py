import psycopg2
import json
import os

def snapshot_counts(db_url, output_file):
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    cur.execute("SELECT tablename FROM pg_tables WHERE schemaname = 'public'")
    tables = [r[0] for r in cur.fetchall()]
    counts = {}
    for t in sorted(tables):
        cur.execute(f"SELECT count(*) FROM {t}")
        counts[t] = cur.fetchone()[0]
    
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(counts, f, indent=2)
    print(f"Recorded row counts for {len(counts)} tables to {output_file}")
    for k, v in counts.items():
        if v > 0:
            print(f"  {k}: {v}")
    cur.close()
    conn.close()
    return counts

if __name__ == "__main__":
    db_url = os.getenv("DATABASE_URL", "postgresql://notebook:notebook@localhost:5432/nasc_portal")
    snapshot_counts(db_url, "migration/manifests/pre_migration_counts.json")
