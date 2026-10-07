"""
Real Web Application Traffic Concurrency Benchmark for NASC Assessment Portal
Simulates true HTTP client traffic (TCP/HTTP handshake, Starlette middleware,
FastAPI routing, JWT authentication, SessionLocal DB checkout via PgCat 6432,
and JSON payload delivery) across 200, 500, 1,000, and 2,000 concurrent users.
"""

import sys
import os
import time
import asyncio
import statistics
from typing import List, Dict, Any
import httpx

# Ensure backend root is on Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

BASE_URL = "http://127.0.0.1:8000"

async def obtain_auth_token(client: httpx.AsyncClient) -> str:
    """Obtains a valid JWT token by simulating user login."""
    res = await client.post(
        f"{BASE_URL}/api/v1/auth/login",
        json={"username": "admin", "password": "admin123"},
        timeout=10.0
    )
    if res.status_code == 200:
        return res.json()["access_token"]
    raise RuntimeError(f"Login failed with status {res.status_code}: {res.text}")

async def simulate_student_web_request(
    user_id: int,
    client: httpx.AsyncClient,
    headers: Dict[str, str],
    request_type: str = "domains"
) -> Dict[str, Any]:
    """
    Simulates a real student browser sending an authenticated HTTP request
    through the FastAPI web server down into PgCat and PostgreSQL.
    """
    t0 = time.perf_counter()
    try:
        if request_type == "domains":
            # Real student loading active domain catalog & round details
            resp = await client.get(
                f"{BASE_URL}/api/v1/assessment/domains",
                headers=headers,
                timeout=45.0
            )
        elif request_type == "profile":
            # Real student fetching profile/user details
            resp = await client.get(
                f"{BASE_URL}/api/v1/auth/me",
                headers=headers,
                timeout=45.0
            )
        else:
            # Root status check
            resp = await client.get(f"{BASE_URL}/", timeout=45.0)

        elapsed_ms = (time.perf_counter() - t0) * 1000
        return {
            "user_id": user_id,
            "status_code": resp.status_code,
            "latency_ms": elapsed_ms,
            "success": resp.status_code == 200,
            "error": None
        }
    except Exception as e:
        elapsed_ms = (time.perf_counter() - t0) * 1000
        return {
            "user_id": user_id,
            "status_code": 0,
            "latency_ms": elapsed_ms,
            "success": False,
            "error": str(e)
        }

async def run_http_concurrency_tier(concurrency_level: int, token: str) -> Dict[str, Any]:
    """Runs a simultaneous burst of N concurrent HTTP requests against the live FastAPI server."""
    print(f"\n" + "=" * 70)
    print(f" TESTING REAL WEB HTTP TRAFFIC: {concurrency_level} CONCURRENT USERS")
    print(f" Simulating {concurrency_level} students making authenticated API calls simultaneously")
    print(f"=" * 70)

    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
        "User-Agent": f"NASC-StudentPortal-Benchmark/{concurrency_level}"
    }

    # Configure high-concurrency HTTP client pool
    limits = httpx.Limits(
        max_connections=concurrency_level + 50,
        max_keepalive_connections=concurrency_level,
        keepalive_expiry=30.0
    )

    async with httpx.AsyncClient(limits=limits, timeout=30.0) as client:
        start_wall = time.perf_counter()

        # Fire all requests simultaneously
        tasks = [
            simulate_student_web_request(
                user_id=i,
                client=client,
                headers=headers,
                request_type="domains"
            )
            for i in range(concurrency_level)
        ]

        results = await asyncio.gather(*tasks, return_exceptions=False)
        total_wall_s = time.perf_counter() - start_wall

    successes = [r for r in results if r["success"]]
    failures = [r for r in results if not r["success"]]
    latencies = [r["latency_ms"] for r in successes]

    rps = concurrency_level / total_wall_s if total_wall_s > 0 else 0
    success_rate = (len(successes) / concurrency_level) * 100

    print(f"\n--- RESULTS FOR {concurrency_level} CONCURRENT HTTP USERS ---")
    print(f"  Total HTTP Requests          : {concurrency_level}")
    print(f"  Successful (HTTP 200 OK)     : {len(successes)} ({success_rate:.1f}%)")
    print(f"  Failed / Timed-out Requests  : {len(failures)}")
    print(f"  Total Wall-Clock Time        : {total_wall_s:.2f} seconds")
    print(f"  Throughput (HTTP RPS)        : {rps:.1f} req/second")

    if latencies:
        p50 = statistics.median(latencies)
        p95 = statistics.quantiles(latencies, n=20)[18] if len(latencies) >= 20 else max(latencies)
        p99 = statistics.quantiles(latencies, n=100)[98] if len(latencies) >= 100 else max(latencies)
        print(f"  Min HTTP Latency             : {min(latencies):.2f}ms")
        print(f"  Median HTTP Latency (p50)    : {p50:.2f}ms")
        print(f"  95th Percentile (p95)        : {p95:.2f}ms")
        print(f"  99th Percentile (p99)        : {p99:.2f}ms")
        print(f"  Max HTTP Latency             : {max(latencies):.2f}ms")
    else:
        p50 = p95 = p99 = 0

    if len(failures) > 0:
        sample_errs = set(r["error"] for r in failures[:5])
        print(f"  Sample Failure Reasons       : {sample_errs}")

    return {
        "concurrency": concurrency_level,
        "total": concurrency_level,
        "successful": len(successes),
        "failed": len(failures),
        "success_rate": success_rate,
        "wall_time_s": round(total_wall_s, 2),
        "rps": round(rps, 1),
        "min_ms": round(min(latencies), 2) if latencies else 0,
        "p50_ms": round(p50, 2),
        "p95_ms": round(p95, 2),
        "p99_ms": round(p99, 2),
        "max_ms": round(max(latencies), 2) if latencies else 0
    }

async def main():
    print("--- NASC Real Web Application Traffic Concurrency Test ---")
    print(f"Target Server: {BASE_URL}")

    async with httpx.AsyncClient() as init_client:
        print("Logging in to obtain candidate JWT session...")
        token = await obtain_auth_token(init_client)
        print(f" Authentication successful (Token preview: {token[:20]}...)")

    tiers = [200, 500, 1000, 2000]
    tier_results = []

    for tier in tiers:
        # Pause slightly between runs to let connection pool settle
        await asyncio.sleep(1.0)
        res = await run_http_concurrency_tier(tier, token)
        tier_results.append(res)

    print("\n" + "=" * 80)
    print(" SUMMARY MATRIX: REAL WEB APPLICATION TRAFFIC UNDER PGCAT MULTIPLEXING")
    print("=" * 80)
    header = f"{'Concurrency':<15} | {'Success':<10} | {'Wall Time':<10} | {'Throughput':<12} | {'p50 (Median)':<12} | {'p95':<10} | {'Failed':<8}"
    print(header)
    print("-" * len(header))
    for r in tier_results:
        print(f"{r['concurrency']:<15} | {r['success_rate']:<9.1f}% | {r['wall_time_s']:<9}s | {r['rps']:<8} req/s | {r['p50_ms']:<10}ms | {r['p95_ms']:<8}ms | {r['failed']:<8}")

if __name__ == "__main__":
    asyncio.run(main())
