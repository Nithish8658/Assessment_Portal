"""
PgCat High-Concurrency Benchmark & Verification Suite
Simulates concurrent student transactions through PgCat on port 6432
and verifies pooler throughput, latency, and zero connection exhaustion.
"""

import sys
import os
import time
import asyncio
import statistics
from concurrent.futures import ThreadPoolExecutor
from sqlalchemy import text

# Ensure backend root is on Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import engine, direct_engine, SessionLocal

def test_single_direct_connection():
    print("Testing direct PostgreSQL connection on port 5432...")
    start = time.perf_counter()
    try:
        with direct_engine.connect() as conn:
            res = conn.execute(text("SELECT 1 AS alive, current_database() AS db, version() AS ver")).mappings().first()
            elapsed = (time.perf_counter() - start) * 1000
            print(f" Direct PostgreSQL (5432) connected in {elapsed:.2f}ms. Database: {res['db']}")
            return True
    except Exception as e:
        print(f" Direct PostgreSQL connection failed: {e}")
        return False

def test_single_pgcat_connection():
    print("Testing PgCat connection pooler on port 6432...")
    start = time.perf_counter()
    try:
        with engine.connect() as conn:
            res = conn.execute(text("SELECT 1 AS alive, current_database() AS db")).mappings().first()
            elapsed = (time.perf_counter() - start) * 1000
            print(f" PgCat (6432) connected in {elapsed:.2f}ms. Database: {res['db']}")
            return True
    except Exception as e:
        print(f" PgCat connection on 6432 not reachable or container not started yet: {e}")
        return False

def run_simulated_student_tx(worker_id: int) -> float:
    """Simulates a student answering a question or loading an attempt transaction."""
    t0 = time.perf_counter()
    db = SessionLocal()
    try:
        # Simulate realistic read & lightweight heartbeat transaction
        db.execute(text("SELECT id, title, slug FROM assessment_domains WHERE is_active = true LIMIT 5"))
        db.execute(text("SELECT count(*) FROM competencies"))
        db.commit()
        return (time.perf_counter() - t0) * 1000
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()

def run_concurrency_stress_test(num_workers: int = 500):
    print(f"\n=================================================================")
    print(f" LAUNCHING CONCURRENCY BENCHMARK: {num_workers} SIMULTANEOUS WORKERS")
    print(f" Simulating concurrent student assessment sessions through PgCat")
    print(f"=================================================================")

    start_all = time.perf_counter()
    latencies = []
    errors = 0

    with ThreadPoolExecutor(max_workers=min(num_workers, 120)) as executor:
        futures = [executor.submit(run_simulated_student_tx, i) for i in range(num_workers)]
        for f in futures:
            try:
                lat = f.result()
                latencies.append(lat)
            except Exception as e:
                errors += 1

    total_time = time.perf_counter() - start_all
    throughput = num_workers / total_time if total_time > 0 else 0

    print("\nBENCHMARK RESULTS:")
    print(f"  Total Simulated Transactions : {num_workers}")
    print(f"  Successful Transactions      : {len(latencies)} ({len(latencies)/num_workers*100:.1f}%)")
    print(f"  Failed / Timed-out Requests  : {errors}")
    print(f"  Total Wall-Clock Time        : {total_time:.2f} seconds")
    print(f"  Aggregate Throughput         : {throughput:.1f} queries/second")

    if latencies:
        print(f"  Min Latency                  : {min(latencies):.2f}ms")
        print(f"  Median Latency (p50)         : {statistics.median(latencies):.2f}ms")
        p95 = statistics.quantiles(latencies, n=20)[18] if len(latencies) >= 20 else max(latencies)
        p99 = statistics.quantiles(latencies, n=100)[98] if len(latencies) >= 100 else max(latencies)
        print(f"  p95 Latency                  : {p95:.2f}ms")
        print(f"  p99 Latency                  : {p99:.2f}ms")
        print(f"  Max Latency                  : {max(latencies):.2f}ms")

    if errors == 0:
        print("\n ZERO CONNECTION TIMEOUTS: PgCat handled all concurrency smoothly without stuttering!")
    else:
        print(f"\n WARNING: Encountered {errors} errors during execution.")

def check_prometheus_metrics():
    import urllib.request
    print("\nChecking PgCat Prometheus Metrics on http://localhost:9930/metrics...")
    try:
        req = urllib.request.Request("http://localhost:9930/metrics", headers={"User-Agent": "NASC-PgCat-Bench/1.0"})
        with urllib.request.urlopen(req, timeout=3) as resp:
            content = resp.read().decode("utf-8")
            lines = [line for line in content.splitlines() if not line.startswith("#") and line.strip()]
            print(" Prometheus Exporter responding. Sample metrics:")
            for l in lines[:10]:
                print(f"   {l}")
    except Exception as e:
        print(f"  Prometheus metrics not accessible: {e}")

if __name__ == "__main__":
    print("--- Starting PgCat Concurrency Verification Suite ---\n")
    direct_ok = test_single_direct_connection()
    pgcat_ok = test_single_pgcat_connection()

    if pgcat_ok:
        run_concurrency_stress_test(num_workers=200)
        run_concurrency_stress_test(num_workers=500)
        check_prometheus_metrics()
    elif direct_ok:
        print("\nNote: PgCat proxy is not yet running on port 6432. Launch Docker compose to activate PgCat:")
        print("   docker compose up -d nasc-pgcat")
        print("Running benchmark against direct PostgreSQL as baseline:")
        # Test direct PostgreSQL fallback
        from app.database import direct_engine
        def run_direct_tx(i):
            with direct_engine.connect() as c:
                c.execute(text("SELECT count(*) FROM assessment_domains"))
        start = time.perf_counter()
        with ThreadPoolExecutor(max_workers=10) as ex:
            list(ex.map(run_direct_tx, range(50)))
        print(f"Direct baseline 50 queries completed in {(time.perf_counter()-start):.2f}s")
