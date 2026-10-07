import os
import sys
import json
import psycopg2

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, ROOT_DIR)

QUESTIONS_DATA = [
    # Q4: COMP_THINK (Bit manipulation)
    {
        "competency_id": 3, # COMP_THINK
        "title": "XOR Swap & Identity Theorem",
        "content": "Given two integers `x = 45` and `y = 20`, the three operations `x = x ^ y; y = x ^ y; x = x ^ y;` are executed sequentially. What are the final values of `x` and `y`?",
        "options": [
            {"id": 1, "text": "x = 45, y = 20"},
            {"id": 2, "text": "x = 20, y = 45"},
            {"id": 3, "text": "x = 65, y = 25"},
            {"id": 4, "text": "x = 0, y = 0"}
        ],
        "correct_id": 2,
        "difficulty": "Easy",
        "explanation": "The three-step XOR swap algorithm exploits the properties `a ^ a = 0` and `a ^ 0 = a` to exchange the values of x and y in-place without auxiliary memory."
    },
    # Q5: DSA (Big-O analysis)
    {
        "competency_id": 4, # DSA
        "title": "Time Complexity of Nested Dependent Loops",
        "content": "Consider the following code snippet:\n```python\nfor i in range(1, n + 1):\n    j = 1\n    while j < n:\n        j = j * 2\n```\nWhat is the asymptotic worst-case time complexity of this algorithm in Big-O notation?",
        "options": [
            {"id": 1, "text": "O(n)"},
            {"id": 2, "text": "O(n log n)"},
            {"id": 3, "text": "O(n^2)"},
            {"id": 4, "text": "O(log n)"}
        ],
        "correct_id": 2,
        "difficulty": "Medium",
        "explanation": "The outer loop runs n times. The inner while loop doubles j each step until j >= n, executing log2(n) times. The total operations are n * log2(n) = O(n log n)."
    },
    # Q6: QUANT (Rate of work)
    {
        "competency_id": 2, # QUANT
        "title": "Microservice Throughput & Work-Rate",
        "content": "Server Alpha processes a queue of 6,000 asynchronous jobs in 3 hours. Server Beta processes the same queue of 6,000 jobs in 2 hours. If both servers process the queue concurrently without lock contention, how many minutes will they take to process 6,000 jobs?",
        "options": [
            {"id": 1, "text": "60 minutes"},
            {"id": 2, "text": "72 minutes"},
            {"id": 3, "text": "80 minutes"},
            {"id": 4, "text": "90 minutes"}
        ],
        "correct_id": 2,
        "difficulty": "Medium",
        "explanation": "Alpha's rate is 6000/3 = 2000 jobs/hr. Beta's rate is 6000/2 = 3000 jobs/hr. Combined rate is 5000 jobs/hr. Time required = 6000 / 5000 = 1.2 hours = 72 minutes."
    },
    # Q7: LOGIC (Critical path / DAG)
    {
        "competency_id": 1, # LOGIC
        "title": "Critical Path & Task Dependency Graph",
        "content": "A CI/CD deployment pipeline consists of 4 tasks: A (Linting, 3 min), B (Unit Tests, 5 min), C (Security Scan, 4 min), and D (Deployment, 2 min). Task D strictly requires both B and C to complete. Tasks A, B, and C can run concurrently from start (time 0). What is the minimum duration from start to finish?",
        "options": [
            {"id": 1, "text": "7 minutes"},
            {"id": 2, "text": "9 minutes"},
            {"id": 3, "text": "11 minutes"},
            {"id": 4, "text": "14 minutes"}
        ],
        "correct_id": 1,
        "difficulty": "Easy",
        "explanation": "Concurrent start: max(duration(A), duration(B), duration(C)) = max(3, 5, 4) = 5 min. Task D (2 min) runs after B and C finish. Total minimum duration = 5 + 2 = 7 minutes."
    },
    # Q8: COMP_THINK (Recursive call stack)
    {
        "competency_id": 3, # COMP_THINK
        "title": "Recursive Call Stack Frame Evaluation",
        "content": "Consider the recurrence function `def f(n): return 1 if n <= 1 else f(n - 1) + f(n - 2)`. When evaluating `f(4)` without memoization, what is the total number of function calls (including the initial call) executed?",
        "options": [
            {"id": 1, "text": "7"},
            {"id": 2, "text": "8"},
            {"id": 3, "text": "9"},
            {"id": 4, "text": "15"}
        ],
        "correct_id": 3,
        "difficulty": "Medium",
        "explanation": "Call tree for f(4): f(4) calls f(3) and f(2). f(3) calls f(2) and f(1). f(2) calls f(1) and f(0). Right subtree f(2) calls f(1) and f(0). Total calls = 1 + 2 + 4 + 2 = 9."
    },
    # Q9: DSA (Amortized complexity)
    {
        "competency_id": 4, # DSA
        "title": "Queue using Two Stacks Amortized Cost",
        "content": "A Queue data structure is implemented using two standard LIFO stacks (`inbox` and `outbox`). For a sequence of `N` `enqueue` operations followed by `N` `dequeue` operations on an initially empty queue, what is the amortized time complexity per individual operation?",
        "options": [
            {"id": 1, "text": "O(1)"},
            {"id": 2, "text": "O(N)"},
            {"id": 3, "text": "O(log N)"},
            {"id": 4, "text": "O(N log N)"}
        ],
        "correct_id": 1,
        "difficulty": "Medium",
        "explanation": "Each element is pushed to inbox once, popped from inbox once, pushed to outbox once, and popped from outbox once across its entire lifecycle (4 operations). Over 2N operations, total cost is 4N, yielding an amortized cost of O(1) per operation."
    },
    # Q10: QUANT (Probability)
    {
        "competency_id": 2, # QUANT
        "title": "Fault Tolerance Cluster Availability Probability",
        "content": "A high-availability database cluster has 3 independent replica nodes. Each node has an independent failure probability of `p = 0.10` over a 24-hour period. The cluster remains online as long as AT LEAST ONE node is operational. What is the probability that the cluster remains online?",
        "options": [
            {"id": 1, "text": "0.900"},
            {"id": 2, "text": "0.970"},
            {"id": 3, "text": "0.990"},
            {"id": 4, "text": "0.999"}
        ],
        "correct_id": 4,
        "difficulty": "Medium",
        "explanation": "Probability of cluster failure = all 3 nodes fail simultaneously = 0.10^3 = 0.001. Probability cluster is online = 1 - 0.001 = 0.999 (99.9% availability)."
    },
    # Q11: LOGIC (De Morgan's Laws)
    {
        "competency_id": 1, # LOGIC
        "title": "Boolean Circuit Equivalence & Logic Optimization",
        "content": "Which of the following Boolean expressions is logically equivalent to `!(is_admin || !has_token)` according to De Morgan's laws?",
        "options": [
            {"id": 1, "text": "!is_admin && has_token"},
            {"id": 2, "text": "!is_admin || has_token"},
            {"id": 3, "text": "is_admin && !has_token"},
            {"id": 4, "text": "!is_admin && !has_token"}
        ],
        "correct_id": 1,
        "difficulty": "Easy",
        "explanation": "!(A || B) == (!A && !B). Here A = is_admin and B = !has_token. Therefore, !(is_admin || !has_token) == !is_admin && !(!has_token) == !is_admin && has_token."
    },
    # Q12: DSA (Binary Min-Heap)
    {
        "competency_id": 4, # DSA
        "title": "Min-Heap Insertion & Parent Node Calculation",
        "content": "In a 1-indexed binary min-heap array `[3, 8, 5, 12, 14, 9, 7]`, a new key `4` is inserted at the end of the array (index 8). After executing the standard bubble-up (heapify-up) procedure, at which index will the key `4` reside?",
        "options": [
            {"id": 1, "text": "Index 1"},
            {"id": 2, "text": "Index 2"},
            {"id": 3, "text": "Index 4"},
            {"id": 4, "text": "Index 8"}
        ],
        "correct_id": 2,
        "difficulty": "Medium",
        "explanation": "Inserted at index 8. Parent is floor(8/2) = index 4 (value 12). Since 4 < 12, swap 4 and 12 (4 is now at index 4). Next parent is floor(4/2) = index 2 (value 8). Since 4 < 8, swap 4 and 8 (4 is now at index 2). Next parent is floor(2/2) = index 1 (value 3). Since 4 > 3, bubble-up terminates. Key 4 is at Index 2."
    },
    # Q13: OS (CPU Scheduling)
    {
        "competency_id": 9, # OS
        "title": "CPU Scheduling Average Turnaround Time (SJF)",
        "content": "Three processes arrive at time 0 with burst times: P1 = 6ms, P2 = 2ms, P3 = 4ms. Using non-preemptive Shortest Job First (SJF) scheduling, what is the average Turnaround Time (TAT) of the processes?",
        "options": [
            {"id": 1, "text": "5.33 ms"},
            {"id": 2, "text": "6.67 ms"},
            {"id": 3, "text": "8.00 ms"},
            {"id": 4, "text": "9.33 ms"}
        ],
        "correct_id": 2,
        "difficulty": "Medium",
        "explanation": "SJF Execution Order: P2 (0-2ms), P3 (2-6ms), P1 (6-12ms). Turnaround Times (Completion - Arrival): P2 = 2ms, P3 = 6ms, P1 = 12ms. Average TAT = (2 + 6 + 12) / 3 = 20 / 3 = 6.67 ms."
    },
    # Q14: NET (CIDR Subnetting)
    {
        "competency_id": 10, # NET
        "title": "CIDR IPv4 Subnet Usable Host Capacity",
        "content": "A network engineer assigns an IPv4 subnet of `192.168.10.64/27` to a web server cluster. How many usable host IP addresses are available within this subnet for allocation to server network interfaces?",
        "options": [
            {"id": 1, "text": "28"},
            {"id": 2, "text": "30"},
            {"id": 3, "text": "32"},
            {"id": 4, "text": "62"}
        ],
        "correct_id": 2,
        "difficulty": "Easy",
        "explanation": "With a /27 prefix, host bits = 32 - 27 = 5 bits. Total IP addresses = 2^5 = 32. Subtract 2 addresses (1 for Network ID 192.168.10.64 and 1 for Broadcast ID 192.168.10.95). Usable host IPs = 32 - 2 = 30."
    },
    # Q15: QUANT (Data transfer duration)
    {
        "competency_id": 2, # QUANT
        "title": "Database Replication Lag & Bandwidth Calculation",
        "content": "A database write-ahead log (WAL) of size 1.8 Gigabytes (GB) needs to be replicated over a dedicated 100 Megabits per second (Mbps) network link. Assuming 100% link utilization and no protocol overhead (1 GB = 1,000 MB; 1 Byte = 8 bits), how many seconds will the replication take?",
        "options": [
            {"id": 1, "text": "14.4 seconds"},
            {"id": 2, "text": "18.0 seconds"},
            {"id": 3, "text": "144.0 seconds"},
            {"id": 4, "text": "180.0 seconds"}
        ],
        "correct_id": 3,
        "difficulty": "Medium",
        "explanation": "1.8 GB = 1,800 MB = 1,800 * 8 = 14,400 Megabits (Mb). At a transmission rate of 100 Mbps, duration = 14,400 / 100 = 144.0 seconds."
    },
    # Q16: COMP_THINK (Two-pointer technique)
    {
        "competency_id": 3, # COMP_THINK
        "title": "Two-Pointer Traversal Optimization",
        "content": "To find whether any two elements in a sorted array of `N` numbers sum to target `K`, which algorithmic pattern achieves $O(N)$ time complexity with $O(1)$ auxiliary space?",
        "options": [
            {"id": 1, "text": "Two pointers initialized at start and end of array moving inward"},
            {"id": 2, "text": "Nested binary search over all elements"},
            {"id": 3, "text": "Building an auxiliary hash set"},
            {"id": 4, "text": "Prefix sum scanning"}
        ],
        "correct_id": 1,
        "difficulty": "Easy",
        "explanation": "On a sorted array, placing one pointer at index 0 (left) and one at N-1 (right) and adjusting based on sum < K or sum > K scans the array in at most N steps with O(1) space."
    },
    # Q17: LOGIC (Syllogisms in QA)
    {
        "competency_id": 1, # LOGIC
        "title": "Deductive Syllogism in Software Testing",
        "content": "Given the following premises:\n1. All high-severity bugs block production releases.\n2. Some memory leak issues are high-severity bugs.\nWhich of the following conclusions logically follows with certainty?",
        "options": [
            {"id": 1, "text": "All memory leak issues block production releases."},
            {"id": 2, "text": "Some memory leak issues block production releases."},
            {"id": 3, "text": "No low-severity bugs block production releases."},
            {"id": 4, "text": "All production releases contain memory leaks."}
        ],
        "correct_id": 2,
        "difficulty": "Easy",
        "explanation": "From Premise 2, a subset of memory leak issues are high-severity. From Premise 1, all high-severity bugs block releases. Therefore, that specific subset of memory leaks blocks production releases."
    },
    # Q18: DSA (Hash Collision)
    {
        "competency_id": 4, # DSA
        "title": "Hash Table Primary Clustering in Linear Probing",
        "content": "What is the primary drawback of using Linear Probing `(h(k, i) = (h'(k) + i) % m)` compared to Quadratic Probing or Double Hashing for collision resolution in an open-addressed hash table?",
        "options": [
            {"id": 1, "text": "Primary clustering where occupied slots form long contiguous chains"},
            {"id": 2, "text": "Inability to store negative integer keys"},
            {"id": 3, "text": "Excessive dynamic memory allocation overhead"},
            {"id": 4, "text": "Requirement of quadratic hash functions"}
        ],
        "correct_id": 1,
        "difficulty": "Medium",
        "explanation": "Linear probing suffers from primary clustering: when multiple collisions occur in nearby slots, long contiguous runs of occupied slots develop, steadily degrading lookup and insertion times towards O(n)."
    },
    # Q19: QUANT (Effective Memory Access Time)
    {
        "competency_id": 2, # QUANT
        "title": "Cache Hit Ratio & Effective Memory Access Time (EMAT)",
        "content": "A processor has an L1 cache access time of 2 ns and main memory access time of 50 ns. If the L1 cache hit ratio is `90%` (0.90), what is the Effective Memory Access Time (EMAT)?",
        "options": [
            {"id": 1, "text": "4.8 ns"},
            {"id": 2, "text": "6.8 ns"},
            {"id": 3, "text": "7.0 ns"},
            {"id": 4, "text": "9.2 ns"}
        ],
        "correct_id": 2,
        "difficulty": "Medium",
        "explanation": "EMAT = Hit_Ratio * L1_Time + (1 - Hit_Ratio) * (L1_Time + Memory_Time) = 0.90 * 2ns + 0.10 * (2ns + 50ns) = 1.8ns + 0.10 * 52ns = 1.8ns + 5.2ns = 6.8 ns."
    },
    # Q20: COMP_THINK (Power Set Bitmask)
    {
        "competency_id": 3, # COMP_THINK
        "title": "Bitmask Generation of Power Set Subsets",
        "content": "For a set `S = {'A', 'B', 'C', 'D'}` with 4 elements, bitmasks from `0` to `15` (`0b0000` to `0b1111`) are used to represent all subsets. Which subset is represented by the integer bitmask `11` (binary `1011` where LSB index 0 corresponds to 'A')?",
        "options": [
            {"id": 1, "text": "{'A', 'B', 'D'}"},
            {"id": 2, "text": "{'A', 'C', 'D'}"},
            {"id": 3, "text": "{'B', 'C', 'D'}"},
            {"id": 4, "text": "{'A', 'B', 'C'}"}
        ],
        "correct_id": 1,
        "difficulty": "Medium",
        "explanation": "11 in binary is 1011 (bit 0 = 1 -> 'A', bit 1 = 1 -> 'B', bit 2 = 0 -> omit 'C', bit 3 = 1 -> 'D'). The corresponding subset is {'A', 'B', 'D'}."
    },
    # Q21: OS (LRU Page Replacement)
    {
        "competency_id": 9, # OS
        "title": "LRU Page Replacement Fault Count",
        "content": "Consider a system with 3 initially empty physical page frames. The sequence of page references is: `[1, 2, 3, 2, 4, 1, 3]`. Using the Least Recently Used (LRU) page replacement algorithm, how many total page faults occur?",
        "options": [
            {"id": 1, "text": "4"},
            {"id": 2, "text": "5"},
            {"id": 3, "text": "6"},
            {"id": 4, "text": "7"}
        ],
        "correct_id": 3,
        "difficulty": "Hard",
        "explanation": "Trace: (1) PF [1]; (2) PF [1,2]; (3) PF [1,2,3]; (2) Hit [1,3,2]; (4) PF replace 1 -> [3,2,4]; (1) PF replace 3 -> [2,4,1]; (3) PF replace 2 -> [4,1,3]. Total Page Faults = 6."
    },
    # Q22: NET (Bandwidth-Delay Product)
    {
        "competency_id": 10, # NET
        "title": "TCP Window Size & Bandwidth-Delay Product (BDP)",
        "content": "A high-speed cross-continental fiber link has a capacity of 10 Gbps and a round-trip time (RTT) of 80 milliseconds. What is the Bandwidth-Delay Product (BDP) required for a single TCP connection to fully saturate the pipe?",
        "options": [
            {"id": 1, "text": "10 Megabytes"},
            {"id": 2, "text": "80 Megabytes"},
            {"id": 3, "text": "100 Megabytes"},
            {"id": 4, "text": "800 Megabytes"}
        ],
        "correct_id": 3,
        "difficulty": "Hard",
        "explanation": "BDP = Bandwidth * RTT = 10,000,000,000 bits/sec * 0.080 sec = 800,000,000 bits. Converting to Bytes = 800,000,000 / 8 = 100,000,000 Bytes = 100 Megabytes (MB)."
    },
    # Q23: LOGIC (RBAC Truth Table)
    {
        "competency_id": 1, # LOGIC
        "title": "Truth Table Verification for Resource Authorization",
        "content": "An API gateway evaluates access with the rule: `Allow = (is_owner || is_admin) && !is_suspended`. Under which of the following combinations is access GRANTED?",
        "options": [
            {"id": 1, "text": "is_owner = False, is_admin = True, is_suspended = False"},
            {"id": 2, "text": "is_owner = True, is_admin = False, is_suspended = True"},
            {"id": 3, "text": "is_owner = False, is_admin = False, is_suspended = False"},
            {"id": 4, "text": "is_owner = True, is_admin = True, is_suspended = True"}
        ],
        "correct_id": 1,
        "difficulty": "Easy",
        "explanation": "For (is_owner || is_admin) && !is_suspended to evaluate to True: (False || True) && !False = True && True = True."
    },
    # Q24: DSA (Balanced BST Height)
    {
        "competency_id": 4, # DSA
        "title": "Balanced Binary Search Tree Minimum Height",
        "content": "What is the minimum possible height of a balanced Binary Search Tree containing `N = 1000` distinct nodes (defining height of a single-node tree as 0)?",
        "options": [
            {"id": 1, "text": "8"},
            {"id": 2, "text": "9"},
            {"id": 3, "text": "10"},
            {"id": 4, "text": "11"}
        ],
        "correct_id": 2,
        "difficulty": "Medium",
        "explanation": "For N nodes, minimum height h = floor(log2(N)). Since 2^9 = 512 and 2^10 = 1024, floor(log2(1000)) = 9."
    },
    # Q25: QUANT (Huffman Coding Savings)
    {
        "competency_id": 2, # QUANT
        "title": "Data Compression Ratio & Space Savings",
        "content": "An uncompressed text file contains 10,000 characters encoded in standard 8-bit ASCII (80,000 bits total). After applying Huffman variable-length prefix coding, the average character length is reduced to 3.2 bits. What percentage of space savings is achieved?",
        "options": [
            {"id": 1, "text": "40%"},
            {"id": 2, "text": "50%"},
            {"id": 3, "text": "60%"},
            {"id": 4, "text": "65%"}
        ],
        "correct_id": 3,
        "difficulty": "Medium",
        "explanation": "Original bits per char = 8 bits. Compressed bits per char = 3.2 bits. Space saved per char = 8 - 3.2 = 4.8 bits. Space savings percentage = (4.8 / 8.0) * 100% = 60%."
    }
]

def run_seeding():
    db_url = os.getenv("DATABASE_URL", "postgresql://nasc_admin:nasc_secure_password_2026@localhost:5432/nasc_portal")
    conn = psycopg2.connect(db_url)
    conn.autocommit = False
    cur = conn.cursor()

    try:
        print("="*80)
        print("SEEDING SOFTWARE DEVELOPMENT ROUND 1: COGNITIVE & SOFTWARE APTITUDE")
        print("="*80)

        # Get round_id for Software Development Round 1
        cur.execute("""
            SELECT r.id FROM assessment_rounds r
            JOIN assessment_domains d ON r.domain_id = d.id
            WHERE d.title ILIKE '%Software Development%' AND r.round_number = 1
        """)
        row = cur.fetchone()
        if not row:
            raise Exception("Software Development Round 1 not found!")
        round_id = row[0]
        print(f"Target Round ID: {round_id}")

        # Check existing count
        cur.execute("SELECT count(*) FROM assessment_questions WHERE round_id = %s", (round_id,))
        existing_count = cur.fetchone()[0]
        print(f"Existing questions before seeding: {existing_count}")

        inserted = 0
        for q in QUESTIONS_DATA:
            # Check if title already exists
            cur.execute("SELECT id FROM assessment_questions WHERE round_id = %s AND title = %s", (round_id, q["title"]))
            if cur.fetchone():
                print(f"  [SKIP] Question '{q['title']}' already exists.")
                continue

            # Insert question
            cur.execute("""
                INSERT INTO assessment_questions (
                    round_id, competency_id, question_type, title, candidate_content,
                    options_json, difficulty, marks, time_limit_seconds, version, status, created_at, updated_at
                ) VALUES (
                    %s, %s, 'mcq', %s, %s,
                    %s, %s, 2.0, 90, 1, 'Active', NOW(), NOW()
                ) RETURNING id
            """, (
                round_id,
                q["competency_id"],
                q["title"],
                q["content"],
                json.dumps(q["options"]),
                q["difficulty"]
            ))
            q_id = cur.fetchone()[0]

            # Insert evaluation config (ExactMatch)
            scoring_rules = {"award_full": 2.0, "penalty_wrong": 0.0}
            cur.execute("""
                INSERT INTO question_evaluation_configs (
                    question_id, evaluation_type, correct_answer, reference_solution,
                    public_test_cases_json, hidden_test_cases_json, scoring_rules_json, created_at, updated_at
                ) VALUES (
                    %s, 'ExactMatch', %s, %s,
                    '[]'::jsonb, '[]'::jsonb, %s, NOW(), NOW()
                )
            """, (
                q_id,
                str(q["correct_id"]),
                q["explanation"],
                json.dumps(scoring_rules)
            ))

            # Insert version snapshot
            snap_content = {
                "id": q_id,
                "round_id": round_id,
                "title": q["title"],
                "candidate_content": q["content"],
                "options_json": q["options"],
                "marks": 2.0,
                "difficulty": q["difficulty"],
                "time_limit_seconds": 90,
                "question_type": "mcq",
                "competency_id": q["competency_id"]
            }
            cur.execute("""
                INSERT INTO question_versions (
                    question_id, version_num, snapshot_json, created_at
                ) VALUES (
                    %s, 1, %s, NOW()
                )
            """, (
                q_id,
                json.dumps(snap_content)
            ))

            inserted += 1
            print(f"  [INSERTED] Q{existing_count + inserted}: {q['title']} (ID: {q_id})")

        conn.commit()
        print(f"\n[SUCCESS] Inserted {inserted} new questions into Round {round_id}.")

        cur.execute("SELECT count(*) FROM assessment_questions WHERE round_id = %s", (round_id,))
        final_count = cur.fetchone()[0]
        print(f"Total Questions in Round 1: {final_count}/25")

    except Exception as e:
        conn.rollback()
        print(f"[ERROR] Seeding failed: {e}")
        raise e
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    run_seeding()
