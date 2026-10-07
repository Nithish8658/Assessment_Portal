"""
Empirical Dashboard Concurrency Benchmark
Simulates 200 concurrent virtual users (VUs) accessing the Assessment Portal dashboard
Comparing Baseline (8 parallel table endpoints) vs Optimized (1 consolidated metrics endpoint).
"""

import sys
import os
import time
import asyncio
import statistics
import argparse
from typing import List, Dict, Any

# Ensure backend root is on Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import httpx
from app.auth.jwt import create_access_token

BASE_URL = os.getenv("BENCHMARK_BASE_URL", "http://127.0.0.1:8000/api/v1")

BASELINE_ENDPOINTS = [
    "/master/departments",
    "/master/programmes",
    "/master/classes",
    "/master/courses",
    "/master/allocations",
    "/users/students",
    "/users/faculty",
    "/users/roster-pending"
]

OPTIMIZED_ENDPOINTS = [
    "/dashboard/metrics"
]

class BenchmarkMetrics:
    def __init__(self):
        self.latencies_user_ms: List[float] = []
        self.latencies_req_ms: List[float] = []
        self.status_codes: Dict[int, int] = {}
        self.total_bytes: int = 0
        self.errors: int = 0
        self.total_requests: int = 0

    def record_request(self, status: int, latency_ms: float, byte_count: int):
        self.total_requests += 1
        self.latencies_req_ms.append(latency_ms)
        self.status_codes[status] = self.status_codes.get(status, 0) + 1
        self.total_bytes += byte_count
        if status >= 400:
            self.errors += 1

    def record_user_duration(self, duration_ms: float):
        self.latencies_user_ms.append(duration_ms)

    def print_summary(self, mode: str, vus: int, total_wall_clock_s: float):
        print("\n" + "=" * 65)
        print(f"  BENCHMARK RESULTS: {mode.upper()} MODE ({vus} Concurrent VUs)")
        print("=" * 65)
        print(f"  Total Wall-Clock Time   : {total_wall_clock_s:.2f} s")
        print(f"  Total HTTP Requests     : {self.total_requests}")
        rps = self.total_requests / total_wall_clock_s if total_wall_clock_s > 0 else 0
        print(f"  Throughput (RPS)        : {rps:.1f} req/sec")
        print(f"  Total Data Transferred  : {self.total_bytes / 1024:.2f} KB ({self.total_bytes / (1024*1024):.2f} MB)")
        avg_per_user_kb = (self.total_bytes / vus) / 1024 if vus > 0 else 0
        print(f"  Avg Payload per User    : {avg_per_user_kb:.2f} KB")
        print(f"  Status Codes Breakdown  : {dict(sorted(self.status_codes.items()))}")
        error_rate = (self.errors / self.total_requests * 100) if self.total_requests > 0 else 0
        print(f"  Error Rate              : {error_rate:.1f}% ({self.errors} errors)")

        if self.latencies_user_ms:
            sorted_u = sorted(self.latencies_user_ms)
            p50_u = statistics.median(sorted_u)
            p90_u = sorted_u[int(len(sorted_u) * 0.90)]
            p95_u = sorted_u[int(len(sorted_u) * 0.95)]
            p99_u = sorted_u[int(len(sorted_u) * 0.99)]
            print("\n  [User-Perceived Dashboard Load Time - Start to Finish]")
            print(f"    Min     : {min(sorted_u):.2f} ms")
            print(f"    p50     : {p50_u:.2f} ms")
            print(f"    p90     : {p90_u:.2f} ms")
            print(f"    p95     : {p95_u:.2f} ms")
            print(f"    p99     : {p99_u:.2f} ms")
            print(f"    Max     : {max(sorted_u):.2f} ms")
            print(f"    Mean    : {statistics.mean(sorted_u):.2f} ms")

        if self.latencies_req_ms:
            sorted_r = sorted(self.latencies_req_ms)
            p50_r = statistics.median(sorted_r)
            p95_r = sorted_r[int(len(sorted_r) * 0.95)]
            p99_r = sorted_r[int(len(sorted_r) * 0.99)]
            print("\n  [Individual HTTP Request Latency]")
            print(f"    p50     : {p50_r:.2f} ms")
            print(f"    p95     : {p95_r:.2f} ms")
            print(f"    p99     : {p99_r:.2f} ms")
        print("=" * 65 + "\n")


async def simulate_vu(
    vu_id: int,
    client: httpx.AsyncClient,
    headers: Dict[str, str],
    endpoints: List[str],
    metrics: BenchmarkMetrics
):
    """Simulates a single virtual user logging in and loading the dashboard."""
    t_user_start = time.perf_counter()

    async def fetch(endpoint: str):
        t0 = time.perf_counter()
        try:
            r = await client.get(f"{BASE_URL}{endpoint}", headers=headers, timeout=25.0)
            elapsed_ms = (time.perf_counter() - t0) * 1000
            content_len = len(r.content)
            metrics.record_request(r.status_code, elapsed_ms, content_len)
        except Exception as e:
            elapsed_ms = (time.perf_counter() - t0) * 1000
            metrics.record_request(599, elapsed_ms, 0)

    # Fire all endpoints concurrently for this user
    await asyncio.gather(*(fetch(ep) for ep in endpoints))
    user_duration_ms = (time.perf_counter() - t_user_start) * 1000
    metrics.record_user_duration(user_duration_ms)


async def run_benchmark(mode: str, vus: int):
    token = create_access_token({"sub": "admin", "roles": ["Administrator"]})
    headers = {"Authorization": f"Bearer {token}"}

    endpoints = BASELINE_ENDPOINTS if mode == "baseline" else OPTIMIZED_ENDPOINTS
    metrics = BenchmarkMetrics()

    print(f"\n[*] Starting {mode.upper()} benchmark with {vus} concurrent Virtual Users...")
    print(f"[*] Endpoints per user ({len(endpoints)}): {endpoints}")

    limits = httpx.Limits(max_connections=vus * len(endpoints) + 50, max_keepalive_connections=vus * 2)
    
    t_start = time.perf_counter()
    async with httpx.AsyncClient(limits=limits) as client:
        tasks = [simulate_vu(i, client, headers, endpoints, metrics) for i in range(vus)]
        await asyncio.gather(*tasks)
    total_time = time.perf_counter() - t_start

    metrics.print_summary(mode, vus, total_time)
    return metrics


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Dashboard Concurrency Benchmark")
    parser.add_argument("--mode", choices=["baseline", "optimized"], default="baseline", help="Benchmark mode")
    parser.add_argument("--vus", type=int, default=200, help="Number of concurrent virtual users (default 200)")
    args = parser.parse_args()

    asyncio.run(run_benchmark(args.mode, args.vus))
