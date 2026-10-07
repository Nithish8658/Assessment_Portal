# Corporate Software Developer Assessment Portal (V1)
## Hardened Production Architecture & Full-Stack Implementation Specification (V2)

---

## 1. Executive Summary

This document defines the production architecture, data ownership models, security boundaries, sandboxing protocols, and phased implementation strategy for the **Standalone Corporate Software Developer Assessment Portal (V1)**.

The system is a computer-based technical recruitment assessment platform specifically tailored for the **Software Developer** job role. It interfaces with the **Existing NASC Portal** (running on PostgreSQL 16.12 at `http://localhost:8000`) purely as an external consumer of institutional identity and academic context, with **zero cross-database foreign key coupling**, **zero duplicate user storage**, and **strict separation between candidate assessment state and evaluation secrets**.

---

## 2. System Architecture & Two-System Boundary

```
┌─────────────────────────────────────────────────────────────┐
│                    EXISTING NASC PORTAL                     │
│                  (PostgreSQL 16.12 : 5432)                  │
│                                                             │
│  [Institutional Source of Truth]                            │
│  • Users & Credentials (bcrypt hashes)                      │
│  • Students, Faculty, Class Tutors, HoDs, Administrators    │
│  • Departments, Programmes, Academic Classes, Courses       │
│  • Institutional Role-Based Access Control (RBAC)           │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               │ Authenticated REST APIs (JWT)
                               │ (Base URL: http://localhost:8000)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│             EXISTING PORTAL INTEGRATION LAYER               │
│                                                             │
│  • ExistingPortalClient (Async httpx connection pool)       │
│  • StudentIdentityService & TutorIdentityService            │
│  • Short-Lived Transient Cache (TTL: 15 mins, invalidatable)│
│  • Scoped Tutor Cohort Resolution                           │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│        CORPORATE ASSESSMENT BACKEND (FastAPI : 8001)        │
│                                                             │
│  • AssessmentOrchestrator (Lifecycle & State Machine)       │
│  • Assessment Policy & Objective Scoring Engine             │
│  • Candidate API (Candidate-safe serialization)             │
│  • Protected Evaluation Service (Hidden test cases/rules)   │
│  • CodeExecutionService & Queue Broker Interface            │
│  • Competency & 360° Readiness Analytics Engine             │
└──────────────────────────────┬──────────────────────────────┘
                               │
             ┌─────────────────┴─────────────────┐
             ▼                                   ▼
┌─────────────────────────┐         ┌─────────────────────────┐
│     STUDENT PORTAL      │         │      TUTOR PORTAL       │
│  (Monaco IDE, Desktop)  │         │   (Cohort Analytics)    │
│                         │         │                         │
│ • Round 1: Cognitive    │         │ • Student Roster Matrix │
│ • Round 2: Coding       │         │ • 360° Assessment View  │
│ • Round 3: Technical    │         │ • Competency Radar      │
│ • Round 4: Debugging    │         │ • Strengths & Gap Map   │
│ • Real-time Autosave    │         │ • Attempt Audit Ledger  │
└─────────────────────────┘         └─────────────────────────┘
```

---

## 3. Data Ownership & Non-Duplication Matrix

| Entity Domain | Existing NASC Portal (Owner) | Corporate Assessment Portal (Owner) |
| :--- | :---: | :---: |
| **Students, Register Numbers, Names, Emails** | **Owner** (Source of Truth) | Reference only (`external_student_id`) |
| **Faculty, Class Tutors, Designations** | **Owner** (Source of Truth) | Reference only (`external_tutor_id`) |
| **Departments, Programmes, Academic Classes** | **Owner** (Source of Truth) | Reference only (`external_department_id`, etc.) |
| **Authentication, Passwords, Role Claims** | **Owner** (Source of Truth) | Validates via Integration Client |
| **Software Developer Assessment Domains & Rounds** | Not Involved | **Owner** (Assessment Policy) |
| **Corporate Technical Question Bank & Versions** | Not Involved | **Owner** (Candidate Content vs Evaluation Secrets) |
| **Candidate Attempts, Snapshots & Responses** | Not Involved | **Owner** (Deterministic State Machine & Autosave) |
| **Coding Submissions, Sandboxed Test Runs** | Not Involved | **Owner** (Isolated Sandbox Execution) |
| **Objective Scoring & Competency Readiness Index** | Not Involved | **Owner** (Deterministic Analytics Engine) |

---

## 4. API Integration & Identity Resolution Architecture

### 4.1 Integration Layer Modules
* [`ExistingPortalClient`](file:///c:/Users/HP/Desktop/Assessment_Portal/docs/integration/EXISTING_PORTAL_API_MAP.md): Async HTTP client (`httpx`) with connection pooling, timeout budgets (3.0s connect, 5.0s read), and automatic exponential backoff retries for safe `GET` operations.
* `StudentIdentityService`: Resolves `external_student_id` into candidate name, register number, department, programme, and batch for rendering in assessment lobbies and candidate results.
* `TutorIdentityService`: Resolves `external_tutor_id` into tutor designations and calculates the exact permitted student cohort based on institutional assignments (`assigned_programme_id`, `assigned_batch`, `assigned_section`).
* `AcademicIdentityService`: Resolves institutional department and programme structures.

### 4.2 Transient In-Memory Cache Policy
* **Cache Contents**: Read-only academic taxonomy (departments, programmes) and short-lived student profile summaries.
* **Cache TTL**: Maximum 15 minutes.
* **Cache Invalidation**: Explicit invalidation on re-login or cohort refresh.
* **Strict Privacy Rule**: Passwords, bcrypt hashes, JWT secrets, and sensitive tokens are **never cached**.

---

## 5. Authentication Flow & Zero-Duplication Handshake

```
Candidate / Tutor (Browser)
             │
             │ 1. Submits Institutional Credentials (username, password)
             ▼
┌───────────────────────────────────────────────┐
│     CORPORATE ASSESSMENT BACKEND (8001)       │
│                                               │
│  2. Calls Existing Portal /api/v1/auth/login  │
│  3. Existing Portal verifies bcrypt hash      │
│  4. Returns Institutional JWT & Metadata      │
│  5. Assessment Backend validates roles        │
│  6. Derives external_student_id / tutor_id    │
│  7. Issues Assessment Session Token           │
└──────────────────────┬────────────────────────┘
                       │
                       │ 8. Authenticated Client Session
                       ▼
┌───────────────────────────────────────────────┐
│         STUDENT OR TUTOR PANEL ACCESS         │
└───────────────────────────────────────────────┘
```

---

## 6. Assessment Architecture & Four-Round Design (Software Developer V1)

```
SOFTWARE DEVELOPER ASSESSMENT (V1)
│
├── ROUND 1: Cognitive & Software Aptitude
│   ├── Target Duration: 30 Minutes | Target Items: 25 Questions
│   ├── Competencies: Logical Reasoning, Quantitative Analysis, Computational Deductions
│   └── Interface: Timed question palette, answered/unanswered/review state, autosave.
│
├── ROUND 2: Programming & Coding
│   ├── Target Duration: 60 Minutes | Target Items: 2 Problems
│   ├── Competencies: Data Structures, Algorithmic Logic, Code Efficiency
│   └── Interface: Monaco Code Editor, Multi-language (Python, JavaScript, Java, C++), Live Sandboxed Test Runner.
│
├── ROUND 3: Technical Knowledge
│   ├── Target Duration: 45 Minutes | Target Items: 30 Questions
│   ├── Competencies: OOP, Data Structures, DBMS & SQL, Operating Systems, Networking, REST APIs
│   └── Interface: Single-choice, multiple-choice, code snippet output, SQL analysis.
│
└── ROUND 4: Debugging & Software Problem Solving
    ├── Target Duration: 45 Minutes | Target Items: 4 Challenges
    ├── Competencies: Root-Cause Analysis, Bug Fixing, Algorithmic Optimization, SQL Debugging
    └── Interface: Developer workstation layout, buggy codebase inspection, fix verification.
```

---

## 7. Assessment Orchestrator & Deterministic Attempt State Machine

### 7.1 Assessment Orchestrator Layer
The `AssessmentOrchestrator` centralizes and coordinates the entire assessment lifecycle, delegating to specialized services:
* `EligibilityService`: Verifies whether candidate is authorized to start the specified round.
* `AttemptService`: Provisions the attempt and establishes the immutable `attempt_question_snapshots`.
* `AutosaveService`: Handles high-frequency, non-blocking response persistence.
* `EvaluationService`: Executes test runners, evaluates MCQ answers, and invokes `ScoringService`.
* `ScoringService`: Evaluates assessment policies, competency weightages, and pass/fail thresholds.

### 7.2 Deterministic State Machine Transitions

```
                 ┌───────────────┐
                 │  NOT_STARTED  │
                 └───────┬───────┘
                         │ Start Round
                         ▼
                 ┌───────────────┐  Timeout   ┌───────────┐
                 │  IN_PROGRESS  ├───────────►│  EXPIRED  │
                 └───────┬───────┘            └───────────┘
                         │ Submit
                         ▼
                 ┌───────────────┐
                 │   SUBMITTED   │
                 └───────┬───────┘
                         │ Trigger Evaluation
                         ▼
                 ┌───────────────┐
                 │  EVALUATING   │
                 └───────┬───────┘
                         │ Finalize Scores
                         ▼
                 ┌───────────────┐
                 │   EVALUATED   │
                 └───────────────┘

* Cancellation State: `NOT_STARTED` or `IN_PROGRESS` -> `CANCELLED` (by Administrator / Proctor).
* Strict Server Enforcement: Any transition not explicitly depicted above is rejected with `HTTP 400 Bad Request`.
```

---

## 8. Database Architecture (Dedicated PostgreSQL Schema / DB)

Managed via **Alembic** under `corporate-assessment/backend/`:

```
assessment_domains (id, slug, title, description, is_active)
       │
       ├── assessment_rounds (id, domain_id, round_number, slug, title, duration_minutes, passing_score, rules_json)
       │          │
       │          ├── assessment_policies (id, round_id, min_score_percent, mandatory_pass, weightage_percent)
       │          │
       │          ├── assessment_questions (id, round_id, competency_id, question_type, title, candidate_content, candidate_code_template, options, difficulty, marks, time_limit_seconds, version)
       │          │          │
       │          │          ├── question_evaluation_configs [PROTECTED] (id, question_id, evaluation_type, correct_answer, reference_solution, hidden_test_cases, scoring_rules)
       │          │          └── question_versions (id, question_id, version_num, snapshot_json, created_at)
       │          │
       │          └── assessment_attempts (id, external_student_id, domain_id, round_id, started_at, submitted_at, status, score, percentage, passed)
       │                     │
       │                     ├── attempt_question_snapshots [IMMUTABLE] (id, attempt_id, question_id, question_version_id, snapshot_content_json)
       │                     ├── assessment_responses (id, attempt_id, question_id, response_payload, auto_saved_at, is_marked_for_review)
       │                     ├── coding_submissions (id, attempt_id, question_id, language, source_code, status, test_cases_passed, total_test_cases, execution_time_ms)
       │                     ├── code_execution_results (id, submission_id, test_case_id, is_passed, actual_output, error_output, execution_time_ms)
       │                     ├── competency_scores (id, attempt_id, external_student_id, competency_id, score, max_score, percentage, readiness_level)
       │                     └── assessment_results [FINAL] (id, attempt_id, external_student_id, total_score, max_score, percentage, passed, readiness_index)
       │
       ├── competencies (id, code, name, category)
       ├── assessment_audits (id, external_user_id, attempt_id, event_type, event_payload_json, timestamp)
       └── security_audit_events (id, external_user_id, event_type, client_ip, user_agent, details_json, timestamp)
```

---

## 9. Critical Security Hardening & Secret Isolation

### 9.1 Separation of Candidate Content from Evaluation Secrets
* `assessment_questions`: Contains candidate-visible content only (`candidate_content`, `candidate_code_template`, `options`, `time_limit_seconds`, `marks`).
* `question_evaluation_configs`: Stores protected secrets (`correct_answer`, `reference_solution`, `hidden_test_cases`, `scoring_rules`).
* **Pydantic Serialization Guarantee**:
  - `CandidateQuestionResponse`: Omits all evaluation secrets.
  - `EvaluationQuestionInternal`: Restricted strictly to server-side evaluation workers.
  - Candidate-facing APIs **never serialize or query evaluation config secrets**.

### 9.2 Attempt Immutability & Question Versioning
* When an attempt starts, `attempt_question_snapshots` freezes the exact question version, test cases, and scoring policy.
* Future edits or updates to the master question bank will **never alter historical candidate attempts or evaluation results**.

---

## 10. Sandboxed Code Execution Architecture

```
Candidate Code Submission (JSON)
               │
               ▼
┌───────────────────────────────────────────────┐
│           ASSESSMENT API ENDPOINT             │
│   (Validates language, size, time budgets)    │
└──────────────────────┬────────────────────────┘
                       │
                       ▼
┌───────────────────────────────────────────────┐
│            EXECUTION QUEUE BROKER             │
│            (Async Celery / Redis)             │
└──────────────────────┬────────────────────────┘
                       │
                       ▼
┌───────────────────────────────────────────────┐
│             CODE EXECUTION WORKER             │
│                                               │
│  1. Spawns Ephemeral Isolated Sandbox         │
│  2. Drops Privileges (Non-root user `sandbox`)│
│  3. Disables Network Access (`--net=none`)    │
│  4. Mounts Read-Only Compiler/Runtime         │
│  5. Enforces CPU, Memory & Wall-Clock Limits  │
│  6. Runs Public & Hidden Test Cases (stdin)   │
│  7. Captures stdout/stderr (max 64 KB output) │
│  8. Purges Sandbox Directory Instantly        │
└──────────────────────┬────────────────────────┘
                       │
                       ▼
┌───────────────────────────────────────────────┐
│     ExecutionResult -> EvaluationService      │
└───────────────────────────────────────────────┘
```

### Security Constraints:
* **No Direct FastAPI Execution**: Untrusted candidate code is never compiled or run inside the FastAPI application process.
* **No Host/Database Access**: Sandboxes have no network access and cannot reach PostgreSQL, the file system, `.env` files, or internal microservices.
* **Dynamic Timeouts**: Governed dynamically by `question.time_limit_seconds` (e.g. 1.0s to 5.0s per test case).
* **Resource Ceiling**: Memory capped at `128 MB`, Process/PID ceiling capped at `16 PIDs`.

---

## 11. Student Portal, Tutor Portal & Analytics Specification

### 11.1 Candidate Assessment Experience
* **Professional Recruitment Aesthetic**: Minimalist, high-density workstation interface designed for laptop/desktop keyboards.
* **Monaco Code Editor**: Real-time syntax highlighting, indentation, line numbering, and keyboard shortcuts (`Ctrl+Enter` to run code).
* **Autosave Engine**: Periodic, non-blocking background response sync with graceful network recovery.
* **Results View**: Competency radar chart, readiness tier (`Developing`, `Proficient`, `Advanced`), round-by-round breakdown with zero hidden answer leakage.

### 11.2 Tutor 360° Performance Analytics
* **Cohort Roster Table**: Filterable and searchable by Department, Programme, Batch, Section, and Readiness Tier.
* **Student 360° Profile**: Combines institutional identity from the Existing Portal with detailed assessment execution metrics, test case pass rates, and time-per-question analysis.
* **Deterministic Strength & Gap Map**: Algorithmic derivation of candidate strengths (e.g., *Strong in SQL and OOP, Gaps in Algorithmic Optimization*) without artificial placeholders.
* **Strict Non-Fabrication Rule**: Students with zero attempts display `"No assessment attempts recorded"`—no fabricated analytics.

---

## 12. Phased Development Plan

```
┌────────────────────────────────────────────────────────┐
│ PHASE 1: Architecture Hardening & Docs (CURRENT)       │
│ Hardened Plan V2, API Map, Privacy & Security Docs     │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ PHASE 2: Standalone Scaffolding                        │
│ Scaffold corporate-assessment/ (backend/ & frontend/)  │
│ Alembic setup, PostgreSQL connection pool, healthcheck │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ PHASE 3: Real Identity Integration Proof               │
│ ExistingPortalClient authentication & scoped cohort     │
│ validation with real accounts (admin, tutor, student)  │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ PHASE 4: Database Models & Question System             │
│ Alembic migrations for all assessment tables           │
│ Separate candidate questions from evaluation configs   │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ PHASE 5: Assessment Orchestrator & State Machine       │
│ Attempt lifecycle, eligibility, snapshots & autosave   │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ PHASE 6: Sandboxed Code Execution Worker               │
│ Isolated multi-language runner (Python, JS, Java, C++) │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ PHASE 7: Student & Tutor UI Implementation             │
│ React 19 + Vite + Tailwind + Monaco Editor + Recharts  │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ PHASE 8: Security Hardening & End-to-End Testing       │
│ Penetration testing, sandbox escape tests, API tests   │
└────────────────────────────────────────────────────────┘
```

---

## 13. Acceptance Criteria

* [ ] Existing NASC Portal database remains unmodified.
* [ ] Zero duplicate student/tutor records created in Assessment database.
* [ ] No cross-database foreign key dependencies.
* [ ] Candidate-facing APIs cannot leak answers, solution code, or hidden test cases.
* [ ] Candidate code executes in an isolated sandbox with resource constraints.
* [ ] Attempt state machine transitions strictly enforced server-side.
* [ ] Historical attempts remain immutable and reproducible.
* [ ] Tutor dashboard enforces cohort boundaries from Existing Portal assignments.
* [ ] No mock or fabricated assessment analytics.
* [ ] Both applications run independently and communicate via authenticated REST APIs.
