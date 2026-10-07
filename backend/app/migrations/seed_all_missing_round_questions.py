import os
import sys
import json
import psycopg2

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, ROOT_DIR)

# --------------------------------------------------------------------------------------
# 1. SOFTWARE DEVELOPMENT > ROUND 3: TECHNICAL KNOWLEDGE (27 MCQs) -> Round ID: 3
# --------------------------------------------------------------------------------------
SD_R3_QUESTIONS = [
    {
        "competency_id": 7, # DBMS
        "title": "B+ Tree Indexing vs Hash Index Characteristics",
        "content": "Why are B+ Tree indices preferred over Hash indices as the primary default index structure in relational database storage engines (such as InnoDB)?",
        "options": [
            {"id": 1, "text": "B+ Trees support efficient range scans (BETWEEN, <, >) and ordered traversals"},
            {"id": 2, "text": "B+ Trees offer O(1) exact point lookups compared to O(N) for Hash indices"},
            {"id": 3, "text": "Hash indices require contiguous physical disk blocks"},
            {"id": 4, "text": "B+ Trees eliminate disk I/O entirely"}
        ],
        "correct_id": 1,
        "difficulty": "Medium",
        "explanation": "B+ Tree leaf nodes are linked sequentially in a doubly-linked list, allowing fast range queries and ordered scans. Hash indices only support exact equality lookups (=, IN) and cannot accelerate range filters."
    },
    {
        "competency_id": 7, # DBMS
        "title": "Write-Ahead Logging (WAL) & Durability",
        "content": "In relational DBMS transaction engines, how does the Write-Ahead Logging (WAL) protocol guarantee ACID Durability without immediately flushing dirty table pages to disk on commit?",
        "options": [
            {"id": 1, "text": "Changes are sequentially appended to an immutable append-only log on disk before commit acknowledges"},
            {"id": 2, "text": "Dirty pages are compressed and stored directly into CPU registers"},
            {"id": 3, "text": "Transactions bypass cache and write directly to non-volatile RAM"},
            {"id": 4, "text": "Table pages are locked permanently until database restart"}
        ],
        "correct_id": 1,
        "difficulty": "Medium",
        "explanation": "WAL guarantees that log records describing data mutations are flushed to disk sequentially before the corresponding modified table pages are written (fsynced). Upon unexpected crash, the engine replays the WAL (REDO/UNDO) to restore consistency."
    },
    {
        "competency_id": 7, # DBMS
        "title": "Database Isolation Levels: Read Committed vs Repeatable Read",
        "content": "Under the SQL standard `READ COMMITTED` isolation level, which concurrency anomaly can still occur that is strictly prevented under `REPEATABLE READ`?",
        "options": [
            {"id": 1, "text": "Dirty Read"},
            {"id": 2, "text": "Non-Repeatable (Fuzzy) Read"},
            {"id": 3, "text": "Dirty Write"},
            {"id": 4, "text": "Lost Update during row lock"}
        ],
        "correct_id": 2,
        "difficulty": "Medium",
        "explanation": "In READ COMMITTED, each query in a transaction reads the latest committed snapshot. If another transaction commits an update between two SELECTs, the same row yields different values (Non-Repeatable Read). REPEATABLE READ holds a snapshot created at transaction start."
    },
    {
        "competency_id": 7, # DBMS
        "title": "Database Connection Pool Starvation Root Cause",
        "content": "An API service under peak load experiences `PoolTimeoutError: Connection not available`. System metrics show database CPU is at 8% and memory is stable. What is the most likely software architecture defect?",
        "options": [
            {"id": 1, "text": "Database connections are opened in HTTP handlers but not released in a finally/context manager block during errors"},
            {"id": 2, "text": "The database storage disk is running out of inodes"},
            {"id": 3, "text": "The query cache has exceeded 100% capacity"},
            {"id": 4, "text": "PostgreSQL is executing automatic VACUUM on unindexed tables"}
        ],
        "correct_id": 1,
        "difficulty": "Medium",
        "explanation": "Connection leak occurs when application threads acquire database connections from the pool but fail to close/return them (e.g. unhandled exceptions bypass conn.close()). The pool becomes exhausted while the database server itself remains idle."
    },
    {
        "competency_id": 7, # DBMS
        "title": "Database Sharding vs Horizontal Partitioning",
        "content": "What is the key architectural difference between database Horizontal Partitioning and Database Sharding?",
        "options": [
            {"id": 1, "text": "Sharding distributes partitions across multiple distinct physical database server instances, whereas horizontal partitioning typically resides on a single instance"},
            {"id": 2, "text": "Partitioning splits tables column-wise, whereas sharding splits tables row-wise"},
            {"id": 3, "text": "Sharding is only possible in NoSQL databases"},
            {"id": 4, "text": "Horizontal partitioning requires distributed 2-Phase Commit"}
        ],
        "correct_id": 1,
        "difficulty": "Medium",
        "explanation": "Horizontal partitioning splits a table into multiple sub-tables within the same database instance. Sharding is a shared-nothing architecture that distributes partitioned chunks across independent physical database servers."
    },
    {
        "competency_id": 9, # OS
        "title": "Mutex vs Counting Semaphore Synchronization",
        "content": "What is the primary operational distinction between a Binary Mutex and a Counting Semaphore initialized to count 1?",
        "options": [
            {"id": 1, "text": "A Mutex enforces ownership: only the specific thread that acquired/locked the Mutex can unlock it"},
            {"id": 2, "text": "A Counting Semaphore can only be used between separate processes, not threads"},
            {"id": 3, "text": "A Mutex allows up to 2 concurrent threads"},
            {"id": 4, "text": "A Semaphore disables CPU interrupts upon lock"}
        ],
        "correct_id": 1,
        "difficulty": "Medium",
        "explanation": "A Mutex has the concept of thread ownership (only the thread that locked the mutex is permitted to unlock it). Semaphores are signaling mechanisms without ownership (any thread can signal/post to increment the semaphore count)."
    },
    {
        "competency_id": 9, # OS
        "title": "Compare-And-Swap (CAS) & Lock-Free Atomic Primitives",
        "content": "How do lock-free data structures (such as `AtomicInteger` in Java or `std::atomic` in C++) achieve thread-safe updates without using OS mutex locks?",
        "options": [
            {"id": 1, "text": "Using hardware-supported atomic Compare-And-Swap (CAS) CPU instructions in an optimistic retry loop"},
            {"id": 2, "text": "By pausing the OS thread scheduler during the update"},
            {"id": 3, "text": "By duplicating memory addresses per CPU core"},
            {"id": 4, "text": "By converting concurrent reads into serial disk writes"}
        ],
        "correct_id": 1,
        "difficulty": "Medium",
        "explanation": "CAS instructions (e.g. cmpxchg on x86) compare the contents of a memory location to an expected value and, if matching, modify it to a new value as an atomic CPU hardware operation. If another thread intervened, the CAS fails and retries without context switching."
    },
    {
        "competency_id": 9, # OS
        "title": "Thread Context Switching Overhead Components",
        "content": "When an OS pre-empts Thread A and switches execution to Thread B, which of the following is a direct source of performance overhead?",
        "options": [
            {"id": 1, "text": "Saving/restoring CPU registers, program counter, and CPU cache/TLB invalidation"},
            {"id": 2, "text": "Recompiling the thread binary code into bytecode"},
            {"id": 3, "text": "Re-allocating the thread heap memory space"},
            {"id": 4, "text": "Zeroing out physical RAM blocks"}
        ],
        "correct_id": 1,
        "difficulty": "Medium",
        "explanation": "Context switching requires saving Thread A's state (registers, stack pointer, PC) into its PCB/TCB and loading Thread B's state. In addition, indirect overhead occurs due to CPU cache misses and TLB churn for the new execution context."
    },
    {
        "competency_id": 9, # OS
        "title": "Translation Lookaside Buffer (TLB) Miss Resolution",
        "content": "In a modern CPU with Virtual Memory, what happens immediately when a Translation Lookaside Buffer (TLB) miss occurs during a memory read?",
        "options": [
            {"id": 1, "text": "The hardware Page Table Walker traverses multi-level page tables in RAM to resolve the virtual-to-physical address mapping"},
            {"id": 2, "text": "The OS generates a Fatal Page Fault and terminates the process"},
            {"id": 3, "text": "The CPU swaps the active process to secondary storage swap space"},
            {"id": 4, "text": "The memory controller restarts the CPU core"}
        ],
        "correct_id": 1,
        "difficulty": "Hard",
        "explanation": "On a TLB miss, the MMU/hardware page table walker traverses the multi-level page tables in physical RAM (CR3 register on x86) to find the Page Table Entry (PTE). If the page is present in RAM, the TLB is loaded; if not present, a Page Fault exception is raised to the OS."
    },
    {
        "competency_id": 9, # OS
        "title": "Thread Starvation vs Deadlock Distinction",
        "content": "What is the key technical difference between Thread Starvation and Deadlock in concurrent systems?",
        "options": [
            {"id": 1, "text": "In starvation, some threads continue making progress while others wait indefinitely; in deadlock, no involved thread can make progress"},
            {"id": 2, "text": "Starvation only occurs on single-core CPUs; deadlock only occurs on multi-core CPUs"},
            {"id": 3, "text": "Deadlock can be resolved by increasing thread priority; starvation cannot"},
            {"id": 4, "text": "Starvation is an OS hardware fault; deadlock is a network protocol error"}
        ],
        "correct_id": 1,
        "difficulty": "Easy",
        "explanation": "Deadlock is a circular wait state where every thread in the set is blocked waiting for a resource held by another. Starvation occurs when runnable threads are perpetually denied access to resources (e.g. greedy high-priority threads always preempting low-priority threads)."
    },
    {
        "competency_id": 10, # NET
        "title": "TLS 1.3 Handshake Round Trips vs TLS 1.2",
        "content": "How many round-trip times (RTTs) are required to complete a full initial cryptographic handshake in TLS 1.3 compared to TLS 1.2?",
        "options": [
            {"id": 1, "text": "TLS 1.3 requires 1-RTT (or 0-RTT on resumption); TLS 1.2 requires 2-RTTs"},
            {"id": 2, "text": "TLS 1.3 requires 3-RTTs; TLS 1.2 requires 1-RTT"},
            {"id": 3, "text": "Both protocols require exactly 2-RTTs"},
            {"id": 4, "text": "TLS 1.3 eliminates the underlying TCP handshake"}
        ],
        "correct_id": 1,
        "difficulty": "Medium",
        "explanation": "TLS 1.3 combines key exchange (Diffie-Hellman parameters) directly into the ClientHello message, completing the cryptographic handshake in 1-RTT (and supporting 0-RTT early data on session resumption), saving 1 full round trip over TLS 1.2's 2-RTTs."
    },
    {
        "competency_id": 10, # NET
        "title": "TCP 3-Way Handshake Connection Establishment",
        "content": "What is the exact sequence of TCP packet flags exchanged between client and server to establish a reliable stream connection?",
        "options": [
            {"id": 1, "text": "Client sends SYN -> Server responds SYN-ACK -> Client sends ACK"},
            {"id": 2, "text": "Client sends ACK -> Server responds SYN -> Client sends ACK"},
            {"id": 3, "text": "Client sends SYN -> Server responds ACK -> Client sends FIN"},
            {"id": 4, "text": "Client sends PING -> Server responds PONG -> Client sends DATA"}
        ],
        "correct_id": 1,
        "difficulty": "Easy",
        "explanation": "The standard TCP 3-way handshake begins with the client sending a SYN packet with an initial sequence number (ISN). The server responds with SYN-ACK (acknowledging client ISN and providing server ISN). The client replies with ACK, completing connection setup."
    },
    {
        "competency_id": 11, # REST
        "title": "CORS Preflight OPTIONS Request Trigger Conditions",
        "content": "Under the Cross-Origin Resource Sharing (CORS) standard, which of the following triggers a browser to send an automatic preflight `OPTIONS` request before the actual HTTP request?",
        "options": [
            {"id": 1, "text": "A PUT or DELETE request, or a request with custom headers like `Authorization: Bearer <token>`"},
            {"id": 2, "text": "Any standard GET request without custom headers"},
            {"id": 3, "text": "A POST request with `Content-Type: application/x-www-form-urlencoded`"},
            {"id": 4, "text": "An image loaded via standard `<img src='...'>` HTML tag"}
        ],
        "correct_id": 1,
        "difficulty": "Medium",
        "explanation": "A CORS preflight OPTIONS request is triggered whenever a cross-origin request is 'non-simple'—such as using HTTP methods other than GET/HEAD/POST, using Content-Type other than text/plain, form-urlencoded, or multipart/form-data (e.g. application/json), or including custom headers (e.g. Authorization)."
    },
    {
        "competency_id": 10, # NET
        "title": "DNS Recursive vs Iterative Query Resolution",
        "content": "When a client machine queries a local Recursive DNS Resolver for `api.example.com`, what role does the recursive resolver perform on behalf of the client?",
        "options": [
            {"id": 1, "text": "It queries the Root DNS server, TLD (.com) server, and Authoritative DNS server iteratively until the final IP is obtained, then caches and returns it to the client"},
            {"id": 2, "text": "It immediately forwards the request to the client browser to resolve directly"},
            {"id": 3, "text": "It performs an SSL/TLS decryption on the domain name"},
            {"id": 4, "text": "It redirects the client HTTP socket to port 53"}
        ],
        "correct_id": 1,
        "difficulty": "Medium",
        "explanation": "A recursive resolver handles the full lookup on behalf of the client. It queries root nameservers (for .com), TLD nameservers (for example.com), and authoritative nameservers (for api.example.com) iteratively, caches the answer based on TTL, and returns the result to the client."
    },
    {
        "competency_id": 10, # NET
        "title": "HTTP/2 vs HTTP/3 Protocol Transport Architecture",
        "content": "What is the primary underlying transport protocol innovation of HTTP/3 that completely eliminates TCP Head-of-Line (HOL) blocking at the transport layer?",
        "options": [
            {"id": 1, "text": "QUIC protocol built on top of UDP with stream-level packet loss recovery"},
            {"id": 2, "text": "Multiple parallel TCP sockets opened per domain"},
            {"id": 3, "text": "SCTP protocol over raw Ethernet frames"},
            {"id": 4, "text": "WebSocket compression frames"}
        ],
        "correct_id": 1,
        "difficulty": "Medium",
        "explanation": "HTTP/2 multiplexes multiple streams over a single TCP connection; however, if a single TCP packet is dropped, all streams stall (TCP Head-of-Line blocking). HTTP/3 uses QUIC over UDP, ensuring packet loss in one stream does not block unrelated concurrent streams."
    },
    {
        "competency_id": 6, # OOP
        "title": "Liskov Substitution Principle (LSP) Violation Scenario",
        "content": "Which of the following object-oriented designs is a classic violation of the Liskov Substitution Principle (LSP)?",
        "options": [
            {"id": 1, "text": "A `Square` subclass inherits from `Rectangle`, overriding `setWidth()` to simultaneously alter `height` and breaking caller assumptions of independent dimensions"},
            {"id": 2, "text": "A `Car` class implements a `Vehicle` interface and provides a `drive()` method"},
            {"id": 3, "text": "A `UserRepository` class implements a `Repository` interface using Dependency Injection"},
            {"id": 4, "text": "A `Circle` class encapsulates a private `radius` field with public getters"}
        ],
        "correct_id": 1,
        "difficulty": "Medium",
        "explanation": "LSP states that objects of a superclass should be replaceable with objects of its subclasses without breaking program correctness. If client code expecting a Rectangle sets width=5 and height=10 (expecting area=50), passing a Square will violate this invariant (yielding area=25 or 100)."
    },
    {
        "competency_id": 6, # OOP
        "title": "Factory Method vs Abstract Factory Design Pattern",
        "content": "When should an architect select the **Abstract Factory** design pattern over a simple **Factory Method**?",
        "options": [
            {"id": 1, "text": "When a system needs to create families of related or dependent product objects (e.g. MacButton + MacCheckbox vs WinButton + WinCheckbox) without specifying concrete classes"},
            {"id": 2, "text": "When only a single object needs to be instantiated globally across the entire application lifetime"},
            {"id": 3, "text": "When adding dynamic behavior to an existing object at runtime without subclassing"},
            {"id": 4, "text": "When converting the interface of a legacy class into an interface expected by clients"}
        ],
        "correct_id": 1,
        "difficulty": "Medium",
        "explanation": "Factory Method defines an interface for creating a single product, deferring instantiation to subclasses. Abstract Factory provides an interface for creating entire families of related products (e.g. DarkThemeUI vs LightThemeUI) ensuring consistency across components."
    },
    {
        "competency_id": 6, # OOP
        "title": "Observer Pattern & Event-Driven Decoupling",
        "content": "What is the primary architectural advantage of using the **Observer Pattern** (Publish-Subscribe) for inter-component communication in GUI or event-driven applications?",
        "options": [
            {"id": 1, "text": "Loose coupling: Subject maintains a list of dependents without knowing their concrete implementations, notifying them via a common interface"},
            {"id": 2, "text": "Elimination of dynamic memory allocations during event dispatch"},
            {"id": 3, "text": "Guaranteeing strictly synchronous sequential execution across CPU threads"},
            {"id": 4, "text": "Automatic persistence of events to a SQL database"}
        ],
        "correct_id": 1,
        "difficulty": "Easy",
        "explanation": "The Observer pattern establishes a one-to-many dependency between objects so that when one object changes state, all its dependents are notified automatically. The Subject only depends on the Observer interface, achieving clean architectural decoupling."
    },
    {
        "competency_id": 6, # OOP
        "title": "Dependency Injection & Inversion of Control (IoC)",
        "content": "Why is Dependency Injection (DI) considered a best practice in enterprise software engineering?",
        "options": [
            {"id": 1, "text": "It decouples class implementation from object construction, allowing dependencies to be swapped for mock implementations during unit testing"},
            {"id": 2, "text": "It compiles application code into native assembly binaries automatically"},
            {"id": 3, "text": "It replaces relational database queries with memory pointers"},
            {"id": 4, "text": "It forces all class methods to execute in parallel"}
        ],
        "correct_id": 1,
        "difficulty": "Easy",
        "explanation": "Dependency Injection inverts control: rather than a class creating its own dependencies (`new DatabaseService()`), dependencies are injected from the outside (via constructor or framework). This makes classes loosely coupled, modular, and easily testable via test doubles/mocks."
    },
    {
        "competency_id": 15, # Architecture
        "title": "Microservices Circuit Breaker Pattern State Transitions",
        "content": "In a distributed microservice architecture, how does the **Circuit Breaker** pattern prevent cascading service failures when a downstream dependency is failing?",
        "options": [
            {"id": 1, "text": "Transitions from CLOSED to OPEN after error threshold is breached, immediately failing fast without calling downstream, then enters HALF-OPEN to probe recovery"},
            {"id": 2, "text": "Spawns 10x more worker threads to retry failed calls continuously"},
            {"id": 3, "text": "Caches all failed requests directly on client browsers forever"},
            {"id": 4, "text": "Reroutes all database queries to unencrypted HTTP endpoints"}
        ],
        "correct_id": 1,
        "difficulty": "Medium",
        "explanation": "Circuit Breaker states: CLOSED (normal calls flow through). When failure rate exceeds threshold, it trips to OPEN (fails fast immediately without calling downstream, saving thread resources). After a timeout, it transitions to HALF-OPEN (allows a small trial traffic sample to verify health)."
    },
    {
        "competency_id": 11, # REST / Security
        "title": "JSON Web Token (JWT) Security: Signature vs Encryption",
        "content": "A developer stores a raw plaintext database password inside a standard HMAC-SHA256 signed JSON Web Token (JWT) payload. Why is this a critical security vulnerability?",
        "options": [
            {"id": 1, "text": "A standard JWT signature only provides cryptographic integrity and authenticity; the payload is only Base64URL-encoded and can be read by anyone"},
            {"id": 2, "text": "HMAC-SHA256 automatically reverses plaintext into public key pairs"},
            {"id": 3, "text": "JWT tokens cannot be transmitted over HTTPS"},
            {"id": 4, "text": "The signature expires after 5 seconds"}
        ],
        "correct_id": 1,
        "difficulty": "Easy",
        "explanation": "Standard signed JWTs (JWS) are signed, NOT encrypted (JWE). The payload is encoded using Base64URL, which can be trivially decoded by anyone who intercepts or receives the token. Confidential data must never be placed in a standard JWT payload."
    },
    {
        "competency_id": 7, # Security / DBMS
        "title": "SQL Injection Prevention Mechanism",
        "content": "Why does using **Parameterized Queries (Prepared Statements)** completely eliminate SQL Injection vulnerabilities?",
        "options": [
            {"id": 1, "text": "The database driver compiles the SQL statement structure beforehand and treats user input strictly as literal data parameters, never executable SQL code"},
            {"id": 2, "text": "It strips all quotation marks and apostrophes from user inputs"},
            {"id": 3, "text": "It converts all SQL statements to NoSQL documents"},
            {"id": 4, "text": "It runs queries inside a dedicated web application firewall (WAF)"}
        ],
        "correct_id": 1,
        "difficulty": "Easy",
        "explanation": "Prepared statements separate the SQL query logic from the data. The SQL syntax is parsed and compiled by the database engine first with parameter placeholders (`?` or `$1`). User inputs are bound separately and treated strictly as scalar values, eliminating any syntax injection."
    },
    {
        "competency_id": 11, # Security
        "title": "Cross-Site Request Forgery (CSRF) & SameSite Cookie Attribute",
        "content": "How does setting `SameSite=Strict` on authentication session cookies defend web applications against Cross-Site Request Forgery (CSRF) attacks?",
        "options": [
            {"id": 1, "text": "The browser will refuse to send the cookie on any cross-site request originating from a third-party domain"},
            {"id": 2, "text": "It encrypts the cookie using the client's SSL private certificate"},
            {"id": 3, "text": "It prevents JavaScript from accessing the cookie via document.cookie"},
            {"id": 4, "text": "It limits the cookie expiration to the active tab session"}
        ],
        "correct_id": 1,
        "difficulty": "Medium",
        "explanation": "SameSite=Strict ensures that cookies are only sent in a first-party context (when the domain in the address bar matches the cookie domain). If a malicious site attempts a cross-origin POST or link click, the browser strictly strips the cookie, preventing CSRF impersonation."
    },
    {
        "competency_id": 11, # Software Engineering
        "title": "Rate Limiting: Token Bucket vs Leaky Bucket Algorithms",
        "content": "What is the key behavioral difference between the **Token Bucket** and **Leaky Bucket** rate-limiting algorithms when handling bursts of incoming traffic?",
        "options": [
            {"id": 1, "text": "Token Bucket allows bursts of requests up to bucket capacity while maintaining a constant fill rate; Leaky Bucket outputs requests at a strictly smooth, constant rate"},
            {"id": 2, "text": "Leaky Bucket allows infinite bursts; Token Bucket drops all burst traffic"},
            {"id": 3, "text": "Token Bucket can only be used on TCP level; Leaky Bucket works on HTTP level"},
            {"id": 4, "text": "Leaky Bucket requires distributed Redis memory; Token Bucket requires local CPU registers"}
        ],
        "correct_id": 1,
        "difficulty": "Medium",
        "explanation": "In Token Bucket, tokens accumulate up to max capacity; a burst of requests can consume all accumulated tokens immediately (burst tolerance). In Leaky Bucket, requests enter a FIFO queue and are processed at a constant leak rate, smoothing out bursts completely."
    },
    {
        "competency_id": 11, # REST
        "title": "Idempotent HTTP Methods in RESTful API Architecture",
        "content": "According to RFC 9110 (HTTP Semantics), which of the following HTTP methods are strictly defined as **Idempotent**?",
        "options": [
            {"id": 1, "text": "GET, PUT, DELETE, HEAD, and OPTIONS"},
            {"id": 2, "text": "POST, PATCH, and CONNECT"},
            {"id": 3, "text": "Only GET and POST"},
            {"id": 4, "text": "POST and PUT only"}
        ],
        "correct_id": 1,
        "difficulty": "Easy",
        "explanation": "An HTTP method is idempotent if the intended effect on the server of multiple identical requests is the same as for a single request. GET, PUT (complete replacement), DELETE (deleting resource), HEAD, and OPTIONS are idempotent. POST and PATCH are non-idempotent."
    },
    {
        "competency_id": 12, # Git
        "title": "Git Fast-Forward Merge vs 3-Way Merge Commit",
        "content": "When executing `git merge feature-branch` into `main`, under what exact condition will Git perform a **Fast-Forward (FF)** merge instead of creating a 3-way merge commit?",
        "options": [
            {"id": 1, "text": "When the HEAD of `main` is an ancestor of `feature-branch` and no new commits have occurred on `main` since branching"},
            {"id": 2, "text": "When both branches have exactly the same number of commits"},
            {"id": 3, "text": "When all commits on feature-branch are signed with GPG keys"},
            {"id": 4, "text": "When merge conflicts are resolved automatically by Git"}
        ],
        "correct_id": 1,
        "difficulty": "Easy",
        "explanation": "A Fast-Forward merge occurs when there is a linear path from the target branch tip to the source branch tip (no divergent commits on main). Git simply advances the target branch pointer to match the feature branch without creating an extra merge commit."
    },
    {
        "competency_id": 15, # Architecture
        "title": "Cache-Aside (Lazy-Loading) vs Write-Through Caching Pattern",
        "content": "In high-throughput microservice caching architectures, what is the defining characteristic of the **Cache-Aside** pattern?",
        "options": [
            {"id": 1, "text": "The application code first checks cache; on cache miss, it reads from database, updates the cache, and returns data to client"},
            {"id": 2, "text": "The database writes to the cache synchronously upon every table INSERT/UPDATE"},
            {"id": 3, "text": "Cache entries are persisted to disk and never expire"},
            {"id": 4, "text": "The cache intercepts network sockets directly at the OS kernel level"}
        ],
        "correct_id": 1,
        "difficulty": "Medium",
        "explanation": "In Cache-Aside (Lazy-Loading), the application manages caching explicitly: it requests data from cache first; if absent (cache miss), it fetches data from database, writes data into cache for subsequent queries, and returns it to caller."
    }
]

# --------------------------------------------------------------------------------------
# 2. SOFTWARE DEVELOPMENT > ROUND 4: DEBUGGING & PROBLEM SOLVING (3 Problems) -> Round ID: 4
# --------------------------------------------------------------------------------------
SD_R4_QUESTIONS = [
    {
        "competency_id": 13, # DEBUG
        "title": "Fix Infinite Recursion in Graph Cycle Detection (DFS)",
        "content": "The following Python function is designed to detect if a directed graph has a cycle using Depth-First Search (DFS). However, it contains a bug where it causes a `RecursionError: maximum recursion depth exceeded` on cyclical graphs because node state tracking is missing. Fix the function so that it correctly returns `True` if a cycle exists and `False` otherwise.",
        "code_template": """import sys
from collections import defaultdict

def has_cycle(num_nodes, edges):
    adj = defaultdict(list)
    for u, v in edges:
        adj[u].append(v)
    
    # BUG: Node state tracking is incomplete
    def dfs(node):
        for neighbor in adj[node]:
            if dfs(neighbor):
                return True
        return False

    for i in range(num_nodes):
        if dfs(i):
            return True
    return False

def main():
    lines = sys.stdin.read().strip().splitlines()
    if not lines:
        return
    n, m = map(int, lines[0].split())
    edges = []
    for line in lines[1:m+1]:
        u, v = map(int, line.split())
        edges.append((u, v))
    print("true" if has_cycle(n, edges) else "false")

if __name__ == '__main__':
    main()
""",
        "solution": """import sys
from collections import defaultdict

def has_cycle(num_nodes, edges):
    adj = defaultdict(list)
    for u, v in edges:
        adj[u].append(v)
    
    # 0 = unvisited, 1 = visiting (in current DFS stack), 2 = fully visited
    state = [0] * num_nodes
    
    def dfs(node):
        if state[node] == 1:
            return True # Cycle detected
        if state[node] == 2:
            return False
        
        state[node] = 1
        for neighbor in adj[node]:
            if dfs(neighbor):
                return True
        state[node] = 2
        return False

    for i in range(num_nodes):
        if state[i] == 0:
            if dfs(i):
                return True
    return False

def main():
    lines = sys.stdin.read().strip().splitlines()
    if not lines:
        return
    n, m = map(int, lines[0].split())
    edges = []
    for line in lines[1:m+1]:
        u, v = map(int, line.split())
        edges.append((u, v))
    print("true" if has_cycle(n, edges) else "false")

if __name__ == '__main__':
    main()
""",
        "public_test_cases": [
            {"input": "3 3\n0 1\n1 2\n2 0", "expected_output": "true"},
            {"input": "3 2\n0 1\n1 2", "expected_output": "false"}
        ],
        "hidden_test_cases": [
            {"input": "4 4\n0 1\n1 2\n2 3\n3 1", "expected_output": "true"},
            {"input": "4 3\n0 1\n0 2\n2 3", "expected_output": "false"}
        ],
        "marks": 5.0,
        "difficulty": "Hard"
    },
    {
        "competency_id": 13, # DEBUG
        "title": "Fix Off-by-One in Sliding Window Maximum Monotonic Deque",
        "content": "The following function computes the maximum value in each sliding window of size `K` across an array of numbers using a monotonic deque. It contains an off-by-one index bug when evicting out-of-window elements and populating the output. Fix the function so that it prints space-separated maximum values for all valid windows.",
        "code_template": """import sys
from collections import deque

def max_sliding_window(nums, k):
    if not nums or k <= 0:
        return []
    dq = deque()
    res = []
    
    for i in range(len(nums)):
        # BUG: Incorrect out-of-bounds eviction condition
        if dq and dq[0] < i - k:
            dq.popleft()
            
        while dq and nums[dq[-1]] < nums[i]:
            dq.pop()
            
        dq.append(i)
        
        # BUG: Incorrect starting index for recording window max
        if i >= k:
            res.append(nums[dq[0]])
            
    return res

def main():
    lines = sys.stdin.read().strip().splitlines()
    if not lines:
        return
    k = int(lines[0].strip())
    nums = list(map(int, lines[1].split()))
    result = max_sliding_window(nums, k)
    print(" ".join(map(str, result)))

if __name__ == '__main__':
    main()
""",
        "solution": """import sys
from collections import deque

def max_sliding_window(nums, k):
    if not nums or k <= 0:
        return []
    dq = deque()
    res = []
    
    for i in range(len(nums)):
        # Correctly evict elements outside the current window [i - k + 1, i]
        if dq and dq[0] <= i - k:
            dq.popleft()
            
        while dq and nums[dq[-1]] < nums[i]:
            dq.pop()
            
        dq.append(i)
        
        # First valid window completes at index k - 1
        if i >= k - 1:
            res.append(nums[dq[0]])
            
    return res

def main():
    lines = sys.stdin.read().strip().splitlines()
    if not lines:
        return
    k = int(lines[0].strip())
    nums = list(map(int, lines[1].split()))
    result = max_sliding_window(nums, k)
    print(" ".join(map(str, result)))

if __name__ == '__main__':
    main()
""",
        "public_test_cases": [
            {"input": "3\n1 3 -1 -3 5 3 6 7", "expected_output": "3 3 5 5 6 7"},
            {"input": "1\n1", "expected_output": "1"}
        ],
        "hidden_test_cases": [
            {"input": "2\n9 11", "expected_output": "11"},
            {"input": "4\n4 3 8 9 0 1", "expected_output": "9 9 9"}
        ],
        "marks": 5.0,
        "difficulty": "Medium"
    },
    {
        "competency_id": 13, # DEBUG
        "title": "Fix Data Corruption in LRU Cache Double-Linked List Eviction",
        "content": "The following implementation of an LRU (Least Recently Used) Cache uses a hash map and a doubly linked list with dummy head and tail. It contains a pointer reassignment bug in `_remove` and `_add` methods that causes key lookup errors or orphaned nodes after reaching max capacity. Fix the pointer manipulation bugs.",
        "code_template": """import sys

class Node:
    def __init__(self, key=0, value=0):
        self.key = key
        self.value = value
        self.prev = None
        self.next = None

class LRUCache:
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache = {}
        self.head = Node()
        self.tail = Node()
        self.head.next = self.tail
        self.tail.prev = self.head

    def _remove(self, node: Node):
        # BUG: Incorrect pointer reassignment
        node.prev = node.next
        node.next = node.prev

    def _add(self, node: Node):
        # Insert right after head
        node.prev = self.head
        node.next = self.head.next
        self.head.next = node
        # BUG: missing node.next.prev link

    def get(self, key: int) -> int:
        if key in self.cache:
            node = self.cache[key]
            self._remove(node)
            self._add(node)
            return node.value
        return -1

    def put(self, key: int, value: int) -> None:
        if key in self.cache:
            self._remove(self.cache[key])
        node = Node(key, value)
        self.cache[key] = node
        self._add(node)
        if len(self.cache) > self.capacity:
            lru = self.tail.prev
            self._remove(lru)
            del self.cache[lru.key]

def main():
    lines = sys.stdin.read().strip().splitlines()
    if not lines:
        return
    cap = int(lines[0].strip())
    lru = LRUCache(cap)
    out = []
    for line in lines[1:]:
        parts = line.split()
        if parts[0] == 'PUT':
            lru.put(int(parts[1]), int(parts[2]))
        elif parts[0] == 'GET':
            out.append(str(lru.get(int(parts[1]))))
    print(" ".join(out))

if __name__ == '__main__':
    main()
""",
        "solution": """import sys

class Node:
    def __init__(self, key=0, value=0):
        self.key = key
        self.value = value
        self.prev = None
        self.next = None

class LRUCache:
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache = {}
        self.head = Node()
        self.tail = Node()
        self.head.next = self.tail
        self.tail.prev = self.head

    def _remove(self, node: Node):
        prev_node = node.prev
        next_node = node.next
        prev_node.next = next_node
        next_node.prev = prev_node

    def _add(self, node: Node):
        first_node = self.head.next
        node.prev = self.head
        node.next = first_node
        self.head.next = node
        first_node.prev = node

    def get(self, key: int) -> int:
        if key in self.cache:
            node = self.cache[key]
            self._remove(node)
            self._add(node)
            return node.value
        return -1

    def put(self, key: int, value: int) -> None:
        if key in self.cache:
            self._remove(self.cache[key])
        node = Node(key, value)
        self.cache[key] = node
        self._add(node)
        if len(self.cache) > self.capacity:
            lru = self.tail.prev
            self._remove(lru)
            del self.cache[lru.key]

def main():
    lines = sys.stdin.read().strip().splitlines()
    if not lines:
        return
    cap = int(lines[0].strip())
    lru = LRUCache(cap)
    out = []
    for line in lines[1:]:
        parts = line.split()
        if parts[0] == 'PUT':
            lru.put(int(parts[1]), int(parts[2]))
        elif parts[0] == 'GET':
            out.append(str(lru.get(int(parts[1]))))
    print(" ".join(out))

if __name__ == '__main__':
    main()
""",
        "public_test_cases": [
            {"input": "2\nPUT 1 1\nPUT 2 2\nGET 1\nPUT 3 3\nGET 2\nPUT 4 4\nGET 1\nGET 3\nGET 4", "expected_output": "1 -1 -1 3 4"}
        ],
        "hidden_test_cases": [
            {"input": "1\nPUT 2 1\nGET 2\nPUT 3 2\nGET 2\nGET 3", "expected_output": "1 -1 2"}
        ],
        "marks": 5.0,
        "difficulty": "Hard"
    }
]

# --------------------------------------------------------------------------------------
# 3. DATA ANALYST & BI > ROUND 1: ANALYTICAL & DATA INTERPRETATION (1 MCQ) -> Round ID: 9
# --------------------------------------------------------------------------------------
DA_R1_QUESTIONS = [
    {
        "competency_id": 31, # DATA_INTERPRETATION
        "title": "Customer Retention Cohort & Churn Rate Analysis",
        "content": "An enterprise SaaS business acquires a January cohort of 1,000 customers. At Month 1, 800 customers remain active. At Month 2, 720 customers remain active. At Month 3, 648 customers remain active. What is the constant compound monthly churn rate of this cohort from Month 1 to Month 3?",
        "options": [
            {"id": 1, "text": "8.0%"},
            {"id": 2, "text": "10.0%"},
            {"id": 3, "text": "12.5%"},
            {"id": 4, "text": "15.0%"}
        ],
        "correct_id": 2,
        "difficulty": "Medium",
        "explanation": "From Month 1 to Month 2: (800 - 720) / 800 = 80 / 800 = 10.0% churn. From Month 2 to Month 3: (720 - 648) / 720 = 72 / 720 = 10.0% churn. The constant monthly churn rate is 10.0%."
    }
]

# --------------------------------------------------------------------------------------
# 4. DATA ANALYST & BI > ROUND 2: SQL + EXCEL + DATA EXTRACTION (3 Questions) -> Round ID: 10
# --------------------------------------------------------------------------------------
DA_R2_QUESTIONS = [
    {
        "competency_id": 33, # SQL_QUERY
        "question_type": "sql",
        "title": "Year-over-Year (YoY) Quarterly Growth Rate via LAG() Window Function",
        "content": "Given a table `quarterly_sales (year INT, quarter INT, revenue NUMERIC)`, write a standard SQL query to calculate each quarter's Year-over-Year (YoY) percentage revenue growth compared to the exact same quarter of the previous year. Columns returned should be: `year`, `quarter`, `revenue`, and `yoy_growth_pct`.",
        "options_json": "[]",
        "correct_answer": """SELECT 
    year, 
    quarter, 
    revenue, 
    ROUND(((revenue - LAG(revenue, 1) OVER (PARTITION BY quarter ORDER BY year)) / LAG(revenue, 1) OVER (PARTITION BY quarter ORDER BY year)) * 100.0, 2) AS yoy_growth_pct
FROM quarterly_sales
ORDER BY quarter, year;""",
        "difficulty": "Medium",
        "marks": 4.0
    },
    {
        "competency_id": 33, # SQL_QUERY
        "question_type": "sql",
        "title": "Identify Consecutive Active Login Streaks via Gaps-and-Islands CTE",
        "content": "Given a table `user_logins (user_id INT, login_date DATE)`, write a SQL query to identify users who logged in for at least 3 consecutive calendar days. Output unique `user_id` values.",
        "options_json": "[]",
        "correct_answer": """WITH ranked AS (
    SELECT 
        user_id, 
        login_date, 
        login_date - (ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY login_date)) * INTERVAL '1 day' AS grp
    FROM (SELECT DISTINCT user_id, login_date FROM user_logins) sub
)
SELECT user_id
FROM ranked
GROUP BY user_id, grp
HAVING COUNT(*) >= 3;""",
        "difficulty": "Hard",
        "marks": 4.0
    },
    {
        "competency_id": 35, # EXCEL_ADV
        "question_type": "mcq",
        "title": "Dynamic Two-Way Matrix Lookup in Excel",
        "content": "In an Excel financial model with products listed in rows (A2:A100) and months listed in columns (B1:M1), which formula dynamically retrieves the exact sales value for product in cell P2 and month in cell Q2 without hardcoding ranges?",
        "options": [
            {"id": 1, "text": "=INDEX(B2:M100, MATCH(P2, A2:A100, 0), MATCH(Q2, B1:M1, 0))"},
            {"id": 2, "text": "=VLOOKUP(P2, A2:M100, Q2, FALSE)"},
            {"id": 3, "text": "=HLOOKUP(Q2, A1:M100, MATCH(P2, A2:A100, 0), TRUE)"},
            {"id": 4, "text": "=XLOOKUP(P2, A2:A100, Q2:Q100)"}
        ],
        "correct_id": 1,
        "difficulty": "Easy",
        "marks": 2.0,
        "explanation": "The two-way INDEX-MATCH combination `=INDEX(data_array, MATCH(row_val, row_header, 0), MATCH(col_val, col_header, 0))` dynamically resolves both the row offset and column offset independently."
    }
]

# --------------------------------------------------------------------------------------
# 5. DATA ANALYST & BI > ROUND 4: TABLEAU + VISUALIZATION (4 Questions) -> Round ID: 12
# --------------------------------------------------------------------------------------
DA_R4_QUESTIONS = [
    {
        "competency_id": 37, # TABLEAU_VIZ
        "question_type": "mcq",
        "title": "Tableau Level of Detail (LOD) FIXED vs INCLUDE Expressions",
        "content": "In Tableau Desktop, what is the primary behavioral difference between `{FIXED [Region] : SUM([Sales])}` and `{INCLUDE [Region] : SUM([Sales])}`?",
        "options": [
            {"id": 1, "text": "`FIXED` computes the aggregate strictly at the Region dimension level regardless of the view's granularity, whereas `INCLUDE` adds Region to whatever dimensions are already present in the view"},
            {"id": 2, "text": "`FIXED` cannot be used in calculated fields; `INCLUDE` can only be used on measures"},
            {"id": 3, "text": "`FIXED` is calculated after Dimension filters; `INCLUDE` is calculated before Context filters"},
            {"id": 4, "text": "`INCLUDE` filters out all NULL regions automatically"}
        ],
        "correct_id": 1,
        "difficulty": "Medium",
        "marks": 2.0,
        "explanation": "FIXED LOD expressions compute values using the specified dimensions without reference to dimensions in the view. INCLUDE LOD expressions calculate at the level of detail determined by the dimensions in the view plus the specified dimensions."
    },
    {
        "competency_id": 50, # DATA_VISUALIZATION
        "question_type": "mcq",
        "title": "Visual Perception & Chart Selection for Net Sentiment Scores",
        "content": "A Business Intelligence analyst needs to display customer satisfaction survey responses across 10 service categories containing both positive (+40% to +100%) and negative (-40% to -10%) net promoter ratings. Which chart type provides the highest cognitive clarity for visual comparison across the zero baseline?",
        "options": [
            {"id": 1, "text": "Diverging Horizontal Bar Chart anchored at the zero axis"},
            {"id": 2, "text": "Pie chart with 10 colored slices"},
            {"id": 3, "text": "Stacked Area chart"},
            {"id": 4, "text": "Radar chart with filled polygons"}
        ],
        "correct_id": 1,
        "difficulty": "Easy",
        "marks": 2.0,
        "explanation": "Diverging bar charts aligned along a shared vertical baseline enable rapid pre-attentive visual comparison of magnitude and polarity (positive vs negative deviations from zero), outperforming pie, area, and radar charts."
    },
    {
        "competency_id": 49, # TABLEAU
        "question_type": "mcq",
        "title": "Tableau Order of Operations: Context Filters vs Dimension Filters",
        "content": "In Tableau's Order of Operations, why would an analyst promote a normal Dimension Filter (e.g. `Year = 2026`) to a **Context Filter** (gray pill)?",
        "options": [
            {"id": 1, "text": "To force the filter to execute BEFORE Top-N filters and FIXED Level of Detail (LOD) calculations"},
            {"id": 2, "text": "To hide the filter control from dashboard viewers"},
            {"id": 3, "text": "To convert the field from discrete to continuous"},
            {"id": 4, "text": "To bypass user security filters"}
        ],
        "correct_id": 1,
        "difficulty": "Medium",
        "marks": 2.0,
        "explanation": "According to Tableau's Order of Operations: Extract Filters -> Data Source Filters -> Context Filters -> FIXED LOD & Top-N -> Dimension Filters. A Context Filter executes prior to FIXED LODs and Top-N filters, scoping the dataset before those calculations occur."
    },
    {
        "competency_id": 37, # TABLEAU_VIZ
        "question_type": "mcq",
        "title": "Tableau Performance Optimization: Extract Aggregation Strategy",
        "content": "A Tableau workbook connected to a 50-million row database table experiences slow rendering on an executive summary dashboard that only displays monthly regional sales. What is the most effective extract optimization technique?",
        "options": [
            {"id": 1, "text": "Aggregate data to visible dimensions (Month, Region) and hide all unused columns during extract creation"},
            {"id": 2, "text": "Convert all numeric measures to string data types"},
            {"id": 3, "text": "Switch from Hyper extract format to live CSV file link"},
            {"id": 4, "text": "Add 20 floating text objects to cache rendering"}
        ],
        "correct_id": 1,
        "difficulty": "Easy",
        "marks": 2.0,
        "explanation": "Aggregating the extract to visible dimensions rolls up millions of granular transactional rows into a few hundred summarized rows, dramatically reducing extract size, disk I/O, and query computation time."
    }
]

# --------------------------------------------------------------------------------------
# 6. DATA ANALYST & BI > ROUND 5: PROJECT-BASED TECHNICAL INTERVIEW (2 Questions) -> Round ID: 13
# --------------------------------------------------------------------------------------
DA_R5_QUESTIONS = [
    {
        "competency_id": 41, # PROJECT_TECHNICAL
        "question_type": "text_response",
        "title": "Handling Data Skew & Salting Join Keys in Large-Scale Analytics Pipelines",
        "content": "In your data analytics projects, suppose you encounter a severe data skew issue where 90% of order transactions belong to a single default `customer_id = 0` (Guest Checkout), causing distributed joins to bottle-neck on a single reducer/worker node. Explain how you would detect this skew and implement key salting or two-stage aggregation to resolve the bottleneck.",
        "options_json": "[]",
        "correct_answer": "Rubric: Candidate must describe: (1) Diagnosing task duration disparity and spill-to-disk on skewed key, (2) Adding random integer suffix / salt (e.g. customer_id_salted = concat(id, '_', random(1..N))) to disperse rows across partitions, (3) Replicating lookup dimension, (4) Stripping salt in final aggregation stage.",
        "difficulty": "Hard",
        "marks": 5.0
    },
    {
        "competency_id": 40, # PROJECT_OWNERSHIP
        "question_type": "text_response",
        "title": "Automated Data Drift Detection & Schema Evolution in Production ETL",
        "content": "Describe how you implemented or would design an automated data validation and drift detection layer in your analytics pipeline. Address: (1) Handling schema drift (new unexpected columns or changed data types from source APIs), (2) Detecting statistical distribution drift (e.g. sudden drop in non-null rates or mean transaction value), and (3) Automated alerting and quarantine dead-letter queues.",
        "options_json": "[]",
        "correct_answer": "Rubric: Evaluated on completeness: (1) Schema enforcement / evolution contract (Pydantic/Great Expectations/Delta Lake), (2) Statistical metric thresholds & anomaly checks (z-score, Kolmogorov-Smirnov test, null rate tolerance), (3) Quarantine table isolation & Slack/PagerDuty webhook alerts.",
        "difficulty": "Hard",
        "marks": 5.0
    }
]

# --------------------------------------------------------------------------------------
# 7. CHAT PROCESS EXECUTIVE > ROUND 4: PRODUCTION CHAT SIMULATION (2 Scenarios) -> Round ID: 8
# --------------------------------------------------------------------------------------
CHAT_R4_QUESTIONS = [
    {
        "competency_id": 27, # MULTI_CHAT
        "question_type": "multi_chat_simulation",
        "title": "Simulation Scenario 2: Cross-Border Customs Hold & Urgent Shipment Delivery Escalation",
        "content": "Customer Interaction Simulation: Candidate manages an urgent international post-sales chat from an enterprise client whose medical equipment shipment is stuck in German customs due to missing import tariff classification documentation. Customer is threatening contract cancellation.",
        "options_json": "[]",
        "correct_answer": "Rubric: (1) Empathy & acknowledgment of commercial impact, (2) Immediate verification of AWB and customs hold code in carrier portal, (3) Proactive dispatch of Commercial Invoice & Harmonized Code certificate to carrier customs desk within 15 minutes, (4) Providing daily tracking cadence and supervisor direct escalation line.",
        "difficulty": "Hard",
        "marks": 10.0
    },
    {
        "competency_id": 21, # DE_ESCALATE
        "question_type": "multi_chat_simulation",
        "title": "Simulation Scenario 3: Damaged In-Transit High-Value Electronics Return & Express Replacement",
        "content": "Customer Interaction Simulation: A customer unboxes a high-end 4K editing monitor purchased for a project deadline, discovering the display panel is cracked and packaging is water-damaged. Customer demands immediate same-day courier replacement before returning the broken unit.",
        "options_json": "[]",
        "correct_answer": "Rubric: (1) De-escalation with sincere ownership, (2) Waiving standard return-first policy under High-Value Damaged Goods SOP with photo upload, (3) Issuing prepaid expedited courier pickup label and triggering immediate Advance Replacement dispatch from nearest regional hub.",
        "difficulty": "Hard",
        "marks": 10.0
    }
]

def seed_all_rounds():
    db_url = os.getenv("DATABASE_URL", "postgresql://nasc_admin:nasc_secure_password_2026@localhost:5432/nasc_portal")
    conn = psycopg2.connect(db_url)
    conn.autocommit = False
    cur = conn.cursor()

    try:
        print("="*80)
        print("UNIFIED SEEDING: 42 MISSING QUESTIONS ACROSS 7 ASSESSMENT ROUNDS")
        print("="*80)

        total_inserted = 0

        # --- Helper for inserting MCQs ---
        def insert_mcqs(round_id, questions_list):
            nonlocal total_inserted
            for q in questions_list:
                cur.execute("SELECT id FROM assessment_questions WHERE round_id = %s AND title = %s", (round_id, q["title"]))
                if cur.fetchone():
                    print(f"  [SKIP] '{q['title']}' already exists in Round {round_id}.")
                    continue

                q_type = q.get("question_type", "mcq")
                cur.execute("""
                    INSERT INTO assessment_questions (
                        round_id, competency_id, question_type, title, candidate_content,
                        options_json, difficulty, marks, time_limit_seconds, version, status, created_at, updated_at
                    ) VALUES (
                        %s, %s, %s, %s, %s,
                        %s, %s, %s, 90, 1, 'Active', NOW(), NOW()
                    ) RETURNING id
                """, (
                    round_id,
                    q["competency_id"],
                    q_type,
                    q["title"],
                    q["content"],
                    json.dumps(q["options"]) if isinstance(q.get("options"), list) else q.get("options_json", "[]"),
                    q["difficulty"],
                    q.get("marks", 2.0)
                ))
                q_id = cur.fetchone()[0]

                scoring_rules = {"award_full": q.get("marks", 2.0), "penalty_wrong": 0.0}
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
                    str(q.get("correct_id", q.get("correct_answer", "1"))),
                    q.get("explanation", q.get("correct_answer", "")),
                    json.dumps(scoring_rules)
                ))

                snap = {
                    "id": q_id,
                    "round_id": round_id,
                    "title": q["title"],
                    "candidate_content": q["content"],
                    "options_json": q.get("options", []),
                    "marks": q.get("marks", 2.0),
                    "difficulty": q["difficulty"],
                    "question_type": q_type,
                    "competency_id": q["competency_id"]
                }
                cur.execute("""
                    INSERT INTO question_versions (question_id, version_num, snapshot_json, created_at)
                    VALUES (%s, 1, %s, NOW())
                """, (q_id, json.dumps(snap)))

                total_inserted += 1
                print(f"  [INSERTED] (Round {round_id}) {q['title']} (ID: {q_id})")

        # --- Helper for inserting Coding / Debugging Problems ---
        def insert_coding_problems(round_id, problems_list):
            nonlocal total_inserted
            for p in problems_list:
                cur.execute("SELECT id FROM assessment_questions WHERE round_id = %s AND title = %s", (round_id, p["title"]))
                if cur.fetchone():
                    print(f"  [SKIP] '{p['title']}' already exists in Round {round_id}.")
                    continue

                cur.execute("""
                    INSERT INTO assessment_questions (
                        round_id, competency_id, question_type, title, candidate_content,
                        candidate_code_template, options_json, difficulty, marks, time_limit_seconds, version, status, created_at, updated_at
                    ) VALUES (
                        %s, %s, 'debugging', %s, %s,
                        %s, '[]'::json, %s, %s, 180, 1, 'Active', NOW(), NOW()
                    ) RETURNING id
                """, (
                    round_id,
                    p["competency_id"],
                    p["title"],
                    p["content"],
                    p["code_template"],
                    p["difficulty"],
                    p["marks"]
                ))
                q_id = cur.fetchone()[0]

                scoring_rules = {"award_full": p["marks"], "test_case_ratio": True}
                cur.execute("""
                    INSERT INTO question_evaluation_configs (
                        question_id, evaluation_type, correct_answer, reference_solution,
                        public_test_cases_json, hidden_test_cases_json, scoring_rules_json, created_at, updated_at
                    ) VALUES (
                        %s, 'SandboxTestRunner', %s, %s,
                        %s, %s, %s, NOW(), NOW()
                    )
                """, (
                    q_id,
                    p["solution"],
                    p["solution"],
                    json.dumps(p["public_test_cases"]),
                    json.dumps(p["hidden_test_cases"]),
                    json.dumps(scoring_rules)
                ))

                snap = {
                    "id": q_id,
                    "round_id": round_id,
                    "title": p["title"],
                    "candidate_content": p["content"],
                    "candidate_code_template": p["code_template"],
                    "marks": p["marks"],
                    "difficulty": p["difficulty"],
                    "question_type": "debugging",
                    "competency_id": p["competency_id"]
                }
                cur.execute("""
                    INSERT INTO question_versions (question_id, version_num, snapshot_json, created_at)
                    VALUES (%s, 1, %s, NOW())
                """, (q_id, json.dumps(snap)))

                total_inserted += 1
                print(f"  [INSERTED DEBUG] (Round {round_id}) {p['title']} (ID: {q_id})")

        # --- Helper for SQL / Descriptive / Rubric questions ---
        def insert_subjective_or_sql(round_id, questions_list, eval_type="ExactMatch"):
            nonlocal total_inserted
            for q in questions_list:
                cur.execute("SELECT id FROM assessment_questions WHERE round_id = %s AND title = %s", (round_id, q["title"]))
                if cur.fetchone():
                    print(f"  [SKIP] '{q['title']}' already exists in Round {round_id}.")
                    continue

                q_type = q.get("question_type", "mcq")
                opts = q.get("options")
                opts_json = json.dumps(opts) if isinstance(opts, list) else q.get("options_json", "[]")

                cur.execute("""
                    INSERT INTO assessment_questions (
                        round_id, competency_id, question_type, title, candidate_content,
                        options_json, difficulty, marks, time_limit_seconds, version, status, created_at, updated_at
                    ) VALUES (
                        %s, %s, %s, %s, %s,
                        %s, %s, %s, 120, 1, 'Active', NOW(), NOW()
                    ) RETURNING id
                """, (
                    round_id,
                    q["competency_id"],
                    q_type,
                    q["title"],
                    q["content"],
                    opts_json,
                    q["difficulty"],
                    q.get("marks", 2.0)
                ))
                q_id = cur.fetchone()[0]

                scoring_rules = {"award_full": q.get("marks", 2.0), "penalty_wrong": 0.0}
                cur.execute("""
                    INSERT INTO question_evaluation_configs (
                        question_id, evaluation_type, correct_answer, reference_solution,
                        public_test_cases_json, hidden_test_cases_json, scoring_rules_json, created_at, updated_at
                    ) VALUES (
                        %s, %s, %s, %s,
                        '[]'::jsonb, '[]'::jsonb, %s, NOW(), NOW()
                    )
                """, (
                    q_id,
                    eval_type if q_type != 'mcq' else 'ExactMatch',
                    str(q.get("correct_id", q.get("correct_answer", ""))),
                    q.get("explanation", q.get("correct_answer", "")),
                    json.dumps(scoring_rules)
                ))

                snap = {
                    "id": q_id,
                    "round_id": round_id,
                    "title": q["title"],
                    "candidate_content": q["content"],
                    "marks": q.get("marks", 2.0),
                    "difficulty": q["difficulty"],
                    "question_type": q_type,
                    "competency_id": q["competency_id"]
                }
                cur.execute("""
                    INSERT INTO question_versions (question_id, version_num, snapshot_json, created_at)
                    VALUES (%s, 1, %s, NOW())
                """, (q_id, json.dumps(snap)))

                total_inserted += 1
                print(f"  [INSERTED {q_type.upper()}] (Round {round_id}) {q['title']} (ID: {q_id})")

        # 1. Seed Software Development Round 3 (ID: 3)
        print("\n--- Seeding Software Development Round 3: Technical Knowledge (Target: 30) ---")
        insert_mcqs(3, SD_R3_QUESTIONS)

        # 2. Seed Software Development Round 4 (ID: 4)
        print("\n--- Seeding Software Development Round 4: Debugging (Target: 4) ---")
        insert_coding_problems(4, SD_R4_QUESTIONS)

        # 3. Seed Data Analyst Round 1 (ID: 9)
        print("\n--- Seeding Data Analyst Round 1: Analytical & Data Interpretation (Target: 10) ---")
        insert_mcqs(9, DA_R1_QUESTIONS)

        # 4. Seed Data Analyst Round 2 (ID: 10)
        print("\n--- Seeding Data Analyst Round 2: SQL + Excel (Target: 10) ---")
        insert_subjective_or_sql(10, DA_R2_QUESTIONS, eval_type="SandboxTestRunner")

        # 5. Seed Data Analyst Round 4 (ID: 12)
        print("\n--- Seeding Data Analyst Round 4: Tableau + Visualization (Target: 8) ---")
        insert_mcqs(12, DA_R4_QUESTIONS)

        # 6. Seed Data Analyst Round 5 (ID: 13)
        print("\n--- Seeding Data Analyst Round 5: Technical Interview (Target: 6) ---")
        insert_subjective_or_sql(13, DA_R5_QUESTIONS, eval_type="ExactMatch")

        # 7. Seed Chat Process Executive Round 4 (ID: 8)
        print("\n--- Seeding Chat Process Executive Round 4: Chat Simulation (Target: 3) ---")
        insert_subjective_or_sql(8, CHAT_R4_QUESTIONS, eval_type="ExactMatch")

        conn.commit()
        print("\n" + "="*80)
        print(f"[SUCCESS] Total {total_inserted} new questions successfully committed into PostgreSQL!")
        print("="*80)

    except Exception as e:
        conn.rollback()
        print(f"[ERROR] Unified seeding failed: {e}")
        raise e
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    seed_all_rounds()
