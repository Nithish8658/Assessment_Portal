import time
import httpx
import json
import statistics

BASE_IP = "103.183.240.6"
VITE_URL = f"http://{BASE_IP}:5173"
BACKEND_URL = "http://localhost:8001"

def print_header(title):
    print("\n" + "=" * 70)
    print(f"  {title}")
    print("=" * 70)

def benchmark_endpoint(client, method, url, name, headers=None, json_data=None):
    timings = []
    status_code = None
    content_length = 0
    
    # Run 3 iterations to get min/avg/max
    for _ in range(3):
        t0 = time.perf_counter()
        if method == "GET":
            resp = client.get(url, headers=headers)
        elif method == "POST":
            resp = client.post(url, headers=headers, json=json_data)
        elapsed_ms = (time.perf_counter() - t0) * 1000.0
        timings.append(elapsed_ms)
        status_code = resp.status_code
        content_length = len(resp.content)
    
    avg_ms = statistics.mean(timings)
    min_ms = min(timings)
    max_ms = max(timings)
    print(f"[{status_code}] {name:<35} | Avg: {avg_ms:6.1f} ms | Min: {min_ms:6.1f} ms | Max: {max_ms:6.1f} ms | Size: {content_length/1024:6.1f} KB")
    return {
        "name": name,
        "status": status_code,
        "avg_ms": avg_ms,
        "min_ms": min_ms,
        "max_ms": max_ms,
        "size_kb": content_length / 1024,
        "response": resp
    }

def run_benchmarks():
    print_header(f"ASSESSMENT PORTAL LATENCY BENCHMARK VIA IP: {BASE_IP}")
    
    with httpx.Client(timeout=30.0) as client:
        # 0. Asset / HTML Latency
        print("\n--- 1. STATIC ASSET & PROXY OVERHEAD (VITE) ---")
        benchmark_endpoint(client, "GET", f"{VITE_URL}/", "Frontend HTML Entry (index.html)")
        
        # 1. Login with eid / h
        print("\n--- 2. AUTHENTICATION (Login as HoD: eid / h) ---")
        login_res = benchmark_endpoint(
            client, "POST", f"{VITE_URL}/api/v1/auth/login",
            "POST /api/v1/auth/login",
            json_data={"username": "eid", "password": "h"}
        )
        
        if login_res["status"] != 200:
            print(f"FAILED TO LOGIN: {login_res['response'].text}")
            return
            
        token = login_res["response"].json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Profile check
        benchmark_endpoint(client, "GET", f"{VITE_URL}/api/v1/auth/me", "GET /api/v1/auth/me (User Profile)", headers=headers)
        
        # Page 1: Dashboard
        print("\n--- 3. PAGE: DASHBOARD ---")
        t_page_start = time.perf_counter()
        benchmark_endpoint(client, "GET", f"{VITE_URL}/api/v1/dashboard/metrics", "GET /api/v1/dashboard/metrics", headers=headers)
        print(f"-> Total Page API Latency: {(time.perf_counter() - t_page_start)*1000/3:6.1f} ms")

        # Page 2: Active Assessments
        print("\n--- 4. PAGE: ACTIVE ASSESSMENTS ---")
        t_page_start = time.perf_counter()
        benchmark_endpoint(client, "GET", f"{VITE_URL}/api/v1/assessment/activation-requests", "GET /api/v1/assessment/activation-requests", headers=headers)
        print(f"-> Total Page API Latency: {(time.perf_counter() - t_page_start)*1000/3:6.1f} ms")

        # Page 3: Cohort Analytics
        print("\n--- 5. PAGE: COHORT ANALYTICS ---")
        t_page_start = time.perf_counter()
        benchmark_endpoint(client, "GET", f"{VITE_URL}/api/v1/assessment/domains", "GET /api/v1/assessment/domains", headers=headers)
        benchmark_endpoint(client, "GET", f"{VITE_URL}/api/v1/assessment/tutor/classes?active_role=HoD", "GET /api/v1/assessment/tutor/classes", headers=headers)
        benchmark_endpoint(client, "GET", f"{VITE_URL}/api/v1/assessment/tutor/cohort?active_role=HoD", "GET /api/v1/assessment/tutor/cohort", headers=headers)
        print(f"-> Total Page API Latency (Sequential): {(time.perf_counter() - t_page_start)*1000/3:6.1f} ms")

        # Page 4: Master Data (6 parallel calls in browser)
        print("\n--- 6. PAGE: MASTER DATA ---")
        t_page_start = time.perf_counter()
        m_dept = benchmark_endpoint(client, "GET", f"{VITE_URL}/api/v1/master/departments", "GET /api/v1/master/departments", headers=headers)
        m_prog = benchmark_endpoint(client, "GET", f"{VITE_URL}/api/v1/master/programmes", "GET /api/v1/master/programmes", headers=headers)
        m_cls  = benchmark_endpoint(client, "GET", f"{VITE_URL}/api/v1/master/classes", "GET /api/v1/master/classes", headers=headers)
        m_crs  = benchmark_endpoint(client, "GET", f"{VITE_URL}/api/v1/master/courses", "GET /api/v1/master/courses", headers=headers)
        m_alc  = benchmark_endpoint(client, "GET", f"{VITE_URL}/api/v1/master/allocations", "GET /api/v1/master/allocations", headers=headers)
        m_fac  = benchmark_endpoint(client, "GET", f"{VITE_URL}/api/v1/users/faculty", "GET /api/v1/users/faculty", headers=headers)
        max_parallel_ms = max(m_dept["avg_ms"], m_prog["avg_ms"], m_cls["avg_ms"], m_crs["avg_ms"], m_alc["avg_ms"], m_fac["avg_ms"])
        print(f"-> Worst-case Parallel API Latency (Browser HTTP/1.1): {max_parallel_ms:6.1f} ms")

        # Page 5: User Management
        print("\n--- 7. PAGE: USER MANAGEMENT ---")
        t_page_start = time.perf_counter()
        u_std = benchmark_endpoint(client, "GET", f"{VITE_URL}/api/v1/users/students", "GET /api/v1/users/students", headers=headers)
        u_fac = benchmark_endpoint(client, "GET", f"{VITE_URL}/api/v1/users/faculty", "GET /api/v1/users/faculty", headers=headers)
        max_u_parallel = max(u_std["avg_ms"], u_fac["avg_ms"])
        print(f"-> Worst-case Parallel API Latency: {max_u_parallel:6.1f} ms")

        # Page 6: Calendar
        print("\n--- 8. PAGE: ACADEMIC CALENDAR ---")
        t_page_start = time.perf_counter()
        benchmark_endpoint(client, "GET", f"{VITE_URL}/api/v1/calendar-notifications/calendar", "GET /calendar-notifications/calendar", headers=headers)
        print(f"-> Total Page API Latency: {(time.perf_counter() - t_page_start)*1000/3:6.1f} ms")

        # Comparison: Direct Backend vs Vite Proxy
        print("\n--- 9. VITE PROXY VS DIRECT BACKEND LATENCY COMPARISON ---")
        res_proxy = benchmark_endpoint(client, "GET", f"{VITE_URL}/api/v1/dashboard/metrics", "Via Vite Proxy (103.183.240.6:5173)", headers=headers)
        res_direct = benchmark_endpoint(client, "GET", f"{BACKEND_URL}/api/v1/dashboard/metrics", "Direct Backend (localhost:8001)", headers=headers)
        diff_ms = res_proxy["avg_ms"] - res_direct["avg_ms"]
        print(f"\n=> Vite Proxy Overhead: {diff_ms:+.2f} ms")

if __name__ == "__main__":
    run_benchmarks()
