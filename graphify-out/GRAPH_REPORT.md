# Graph Report - c:\Users\HP\Desktop\Assessment_Portal  (2026-09-18)

## Corpus Check
- 205 files · ~536,505 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1214 nodes · 3419 edges · 98 communities (85 shown, 13 thin omitted)
- Extraction: 56% EXTRACTED · 44% INFERRED · 0% AMBIGUOUS · INFERRED: 1493 edges (avg confidence: 0.53)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Question Bank & Paper Builder|Question Bank & Paper Builder]]
- [[_COMMUNITY_Student Assessment Workstations & Runner|Student Assessment Workstations & Runner]]
- [[_COMMUNITY_Question Bank & Paper Builder|Question Bank & Paper Builder]]
- [[_COMMUNITY_Cognitive RAG & Pinecone AI|Cognitive RAG & Pinecone AI]]
- [[_COMMUNITY_User Roster & Student Approvals|User Roster & Student Approvals]]
- [[_COMMUNITY_Question Bank & Paper Builder|Question Bank & Paper Builder]]
- [[_COMMUNITY_Security Guard & Proctoring Engine|Security Guard & Proctoring Engine]]
- [[_COMMUNITY_Security Guard & Proctoring Engine|Security Guard & Proctoring Engine]]
- [[_COMMUNITY_Authentication & Access Control|Authentication & Access Control]]
- [[_COMMUNITY_Authentication & Access Control|Authentication & Access Control]]
- [[_COMMUNITY_dependencies & axios|dependencies & axios]]
- [[_COMMUNITY_Authentication & Access Control|Authentication & Access Control]]
- [[_COMMUNITY_Question Bank & Paper Builder|Question Bank & Paper Builder]]
- [[_COMMUNITY_Student Assessment Workstations & Runner|Student Assessment Workstations & Runner]]
- [[_COMMUNITY_OBE Attainment & Bloom Analytics|OBE Attainment & Bloom Analytics]]
- [[_COMMUNITY_User Roster & Student Approvals|User Roster & Student Approvals]]
- [[_COMMUNITY_Cognitive RAG & Pinecone AI|Cognitive RAG & Pinecone AI]]
- [[_COMMUNITY_Evaluation & Mark Management|Evaluation & Mark Management]]
- [[_COMMUNITY_User Roster & Student Approvals|User Roster & Student Approvals]]
- [[_COMMUNITY_Question Bank & Paper Builder|Question Bank & Paper Builder]]
- [[_COMMUNITY_Question Bank & Paper Builder|Question Bank & Paper Builder]]
- [[_COMMUNITY_Question Bank & Paper Builder|Question Bank & Paper Builder]]
- [[_COMMUNITY_Authentication & Access Control|Authentication & Access Control]]
- [[_COMMUNITY_User Roster & Student Approvals|User Roster & Student Approvals]]
- [[_COMMUNITY_Security Guard & Proctoring Engine|Security Guard & Proctoring Engine]]
- [[_COMMUNITY_Security Guard & Proctoring Engine|Security Guard & Proctoring Engine]]
- [[_COMMUNITY_User Roster & Student Approvals|User Roster & Student Approvals]]
- [[_COMMUNITY_Question Bank & Paper Builder|Question Bank & Paper Builder]]
- [[_COMMUNITY_Authentication & Access Control|Authentication & Access Control]]
- [[_COMMUNITY_backup_file & backup_sha256|backup_file & backup_sha256]]
- [[_COMMUNITY_Coding Sandbox & Execution Engine|Coding Sandbox & Execution Engine]]
- [[_COMMUNITY_._build_system_instruction() & ._get_client()|._build_system_instruction() & ._get_client()]]
- [[_COMMUNITY_Question Bank & Paper Builder|Question Bank & Paper Builder]]
- [[_COMMUNITY_Authentication & Access Control|Authentication & Access Control]]
- [[_COMMUNITY_User Roster & Student Approvals|User Roster & Student Approvals]]
- [[_COMMUNITY_Coding Sandbox & Execution Engine|Coding Sandbox & Execution Engine]]
- [[_COMMUNITY_Student Assessment Workstations & Runner|Student Assessment Workstations & Runner]]
- [[_COMMUNITY_Authentication & Access Control|Authentication & Access Control]]
- [[_COMMUNITY_Database Models & Configuration|Database Models & Configuration]]
- [[_COMMUNITY_Authentication & Access Control|Authentication & Access Control]]
- [[_COMMUNITY_Student Assessment Workstations & Runner|Student Assessment Workstations & Runner]]
- [[_COMMUNITY_.oxlintrc.json & plugins|.oxlintrc.json & plugins]]
- [[_COMMUNITY_Database Models & Configuration|Database Models & Configuration]]
- [[_COMMUNITY_assessmentTiming.test.mjs & data|assessmentTiming.test.mjs & data]]
- [[_COMMUNITY_builds & routes|builds & routes]]
- [[_COMMUNITY_test_universal_batch_evaluator.py & End-to-End Multi-Domain Universal Batch Evaluator Test Verifies that GeminiBatch|test_universal_batch_evaluator.py & End-to-End Multi-Domain Universal Batch Evaluator Test Verifies that GeminiBatch]]
- [[_COMMUNITY_Database Models & Configuration|Database Models & Configuration]]
- [[_COMMUNITY_test_gemini_batch_evaluator.py & End-to-End Test for Gemini Batch Code Evaluator Verifies that 1. An attempt in|test_gemini_batch_evaluator.py & End-to-End Test for Gemini Batch Code Evaluator Verifies that: 1. An attempt in]]
- [[_COMMUNITY_Database Models & Configuration|Database Models & Configuration]]
- [[_COMMUNITY_Question Bank & Paper Builder|Question Bank & Paper Builder]]
- [[_COMMUNITY_freeze_assessment_timing.py & migrate()|freeze_assessment_timing.py & migrate()]]
- [[_COMMUNITY_Question Bank & Paper Builder|Question Bank & Paper Builder]]
- [[_COMMUNITY_Question Bank & Paper Builder|Question Bank & Paper Builder]]
- [[_COMMUNITY_Question Bank & Paper Builder|Question Bank & Paper Builder]]
- [[_COMMUNITY_UnsupportedRoundAlert.tsx & UnsupportedRoundAlert()|UnsupportedRoundAlert.tsx & UnsupportedRoundAlert()]]
- [[_COMMUNITY_OBE Attainment & Bloom Analytics|OBE Attainment & Bloom Analytics]]
- [[_COMMUNITY_OBE Attainment & Bloom Analytics|OBE Attainment & Bloom Analytics]]
- [[_COMMUNITY_Security Guard & Proctoring Engine|Security Guard & Proctoring Engine]]
- [[_COMMUNITY_Cognitive RAG & Pinecone AI|Cognitive RAG & Pinecone AI]]

## God Nodes (most connected - your core abstractions)
1. `User` - 114 edges
2. `AssessmentAttempt` - 81 edges
3. `StudentProfile` - 73 edges
4. `FacultyProfile` - 61 edges
5. `AcademicClass` - 60 edges
6. `Department` - 57 edges
7. `AssessmentRound` - 55 edges
8. `AssessmentStudentAllocation` - 51 edges
9. `AssessmentActivationRequest` - 47 edges
10. `Programme` - 46 edges

## Surprising Connections (you probably didn't know these)
- `Session` --uses--> `User`  [INFERRED]
  backend/app/routers/assessment/simulation.py → backend/app/models/models.py
- `User` --uses--> `User`  [INFERRED]
  backend/app/routers/assessment/simulation.py → backend/app/models/models.py
- `Any` --uses--> `UserContext`  [INFERRED]
  backend/app/services/assistant/master_agent.py → backend/app/services/assistant/tools.py
- `AssessmentTimingTests` --uses--> `AssessmentActivationRequest`  [INFERRED]
  backend/test_assessment_timing.py → backend/app/models/assessment_models.py
- `AssessmentTimingTests` --uses--> `ReviewActivationRequest`  [INFERRED]
  backend/test_assessment_timing.py → backend/app/schemas/assessment_schemas.py

## Import Cycles
- 1-file cycle: `backend/app/main.py -> backend/app/main.py`
- 1-file cycle: `backend/app/routers/__init__.py -> backend/app/routers/__init__.py`

## Communities (98 total, 13 thin omitted)

### Community 0 - "Question Bank & Paper Builder"
Cohesion: 0.08
Nodes (103): delete_activation_request(), get_activation_request_by_id(), get_activation_requests(), get_activation_rounds_roster(), grant_tutor_attempt(), review_request(), submit_activation_request(), update_activation_request() (+95 more)

### Community 1 - "Student Assessment Workstations & Runner"
Cohesion: 0.06
Nodes (43): DomainManager(), ChatMessage, HodAdminChatbot(), PageContextPayload, QUICK_CHIPS, QuickSummary, VisibleTableData, AuditLogsPage() (+35 more)

### Community 2 - "Question Bank & Paper Builder"
Cohesion: 0.09
Nodes (52): check_execution_engine_health(), get_batch_evaluation_status(), Assessment Coding Router. Powered by Google Gemini Batch Evaluation Engine. Judg, Executes candidate SQL query locally in an in-memory SQLite database (zero Judge, Checks the health of the Gemini AI Batch Evaluation Engine., Triggers batch evaluation of all pending coding submissions using Gemini API., Returns the current queue of pending coding attempts awaiting batch evaluation., DEPRECATED: Real-time sandbox execution has been decommissioned.     Students su (+44 more)

### Community 3 - "Cognitive RAG & Pinecone AI"
Cohesion: 0.10
Nodes (35): AssessmentCodeEditor(), AssessmentCodeEditorProps, CompilerDiagnostic, normalizeMonacoLanguage(), TimerHeader(), TimerHeaderProps, ChatRound1Communication(), WorkstationProps (+27 more)

### Community 4 - "User Roster & Student Approvals"
Cohesion: 0.19
Nodes (43): AllocationCreate, int, Session, User, ClassCreate, CourseCreate, DepartmentCreate, Course (+35 more)

### Community 5 - "Question Bank & Paper Builder"
Cohesion: 0.05
Nodes (42): table_counts, academic_classes, academic_years, approval_history, approval_workflows, assessment_attempts, assessments, assignment_submissions (+34 more)

### Community 6 - "Security Guard & Proctoring Engine"
Cohesion: 0.05
Nodes (41): academic_classes, academic_scopes, academic_years, allocation_approval_history, assessment_activation_candidates, assessment_activation_requests, assessment_attempts, assessment_domains (+33 more)

### Community 7 - "Security Guard & Proctoring Engine"
Cohesion: 0.05
Nodes (41): academic_classes, academic_scopes, academic_years, allocation_approval_history, assessment_activation_candidates, assessment_activation_requests, assessment_attempts, assessment_domains (+33 more)

### Community 8 - "Authentication & Access Control"
Cohesion: 0.08
Nodes (18): lifespan(), Periodic background worker running once every 2 hours to evaluate pending coding, scheduled_batch_code_evaluation_loop(), get_tutor_authorized_students_query(), Two-Layer Tutor Scope Resolver:     Uses exact tuple matching (programme_id, bat, Customer Support Multi-Turn Chat Simulation Engine. Powers real-time, interactiv, approved_duration(), as_utc_naive() (+10 more)

### Community 9 - "Authentication & Access Control"
Cohesion: 0.13
Nodes (34): assistant_live_websocket(), AssistantQuickSummaryResponse, delete_assistant_session(), get_assistant_quick_summary(), get_assistant_session(), list_assistant_sessions(), Lists recent conversation sessions for the current authenticated user.     Enfor, Fetches full message history and page context for a given session. (+26 more)

### Community 10 - "dependencies & axios"
Cohesion: 0.06
Nodes (32): dependencies, axios, canvas-confetti, clsx, es-toolkit, lucide-react, @monaco-editor/react, react (+24 more)

### Community 11 - "Authentication & Access Control"
Cohesion: 0.23
Nodes (31): get_password_hash(), int, Session, str, User, CourseEnrolment, Role, RosterApprovalBatch (+23 more)

### Community 12 - "Question Bank & Paper Builder"
Cohesion: 0.19
Nodes (26): create_activation_request(), HoD or Administrator approves or rejects an activation request atomically., Class Tutor creates an activation request attached to a specific academic class, review_activation_request_atomic(), AssessmentOrchestrator, Coordinates attempt start, question snapshot delivery, autosave, and submission., AssessmentActivationRequest, Session (+18 more)

### Community 13 - "Student Assessment Workstations & Runner"
Cohesion: 0.13
Nodes (21): AssessmentApprovals(), AssessmentContainer(), AssessmentLobby(), AssessmentLobbyProps, CandidateResults(), CandidateResultsProps, DomainCatalogPage(), DomainCatalogProps (+13 more)

### Community 14 - "OBE Attainment & Bloom Analytics"
Cohesion: 0.14
Nodes (17): Judge0Client, _normalize_output(), Judge0 Remote Code Execution Engine Client. Single source of truth for sandboxed, Submits multiple test cases in a single batch to Judge0 and polls for completion, Normalizes CRLF -> LF and trims trailing whitespace per line and outer whitespac, Production client for Judge0 remote sandboxed execution., Probes the Judge0 cluster daemon status., Executes a single source code submission synchronously (wait=true) on Judge0 san (+9 more)

### Community 15 - "User Roster & Student Approvals"
Cohesion: 0.12
Nodes (18): append_message_to_session(), get_or_create_chat_session(), LiveAgentSession, Autonomous Live Agent Service for HoD & Administrator Portal. Powered by Gemini, Synthesizes executive markdown presentation when live model responds in audio., Executes a live conversational turn.         Formats webpage DOM context, transm, Represents a persistent, department-scoped Live Agent WebSocket session.     Bri, Closes the Google WebSocket cleanly. (+10 more)

### Community 16 - "Cognitive RAG & Pinecone AI"
Cohesion: 0.17
Nodes (18): AssistantSession, FastAPI WebSocket Gateway & Session Runtime Layer. Provides: - WebSocketGateway, Central connection gateway managing WebSocket lifecycles, JWT auth, and event ro, Validates JWT token and creates UserContext with role and department metadata., Main WebSocket connection loop.         Authenticates handshake, streams histori, Encapsulates a user's active assistant session thread with persistent PostgreSQL, Retrieves existing session thread from PostgreSQL or initializes a new one., Appends a message atomically to PostgreSQL assistant_chat_sessions. (+10 more)

### Community 17 - "Evaluation & Mark Management"
Cohesion: 0.13
Nodes (16): DatabaseTool, make_json_safe(), Tool & Data Connector Layer for the Autonomous Executive AI Assistant. Provides:, Safely executes a single read-only SELECT query.         Guarantees:         1., Ingests live DOM tables, metrics, and active route information from the client s, Formats active page context into a structured summary for the reasoning agent., Central dispatch and schema registry for the Autonomous Master Agent., Recursively converts non-JSON serializable objects (Decimal, date, datetime, UUI (+8 more)

### Community 18 - "User Roster & Student Approvals"
Cohesion: 0.14
Nodes (19): apiClient, CompetencyRadar(), CompetencyRadarProps, Class360Modal(), Class360ModalProps, Student360Modal(), Student360ModalProps, Class360Data (+11 more)

### Community 19 - "Question Bank & Paper Builder"
Cohesion: 0.15
Nodes (18): QuestionPalette(), QuestionPaletteProps, ComponentPalette(), ComponentPaletteProps, HardwareModuleIllustration(), HardwareModuleIllustrationProps, IoTHardwarePlacementConsole(), IoTHardwarePlacementConsoleProps (+10 more)

### Community 20 - "Question Bank & Paper Builder"
Cohesion: 0.24
Nodes (18): get_admin_round_questions(), update_round_config(), UpdateRoundConfigRequest, get_assessment_domains(), get_domain_by_slug(), Returns assessment domains.     - If student: Returns only domains where an act, int, Session (+10 more)

### Community 21 - "Question Bank & Paper Builder"
Cohesion: 0.22
Nodes (14): HodAssistantService, HoD & Administrator AI Intelligence Assistant Service. Powered by Gemini 3 Flash, Real-time PostgreSQL Tool Dispatcher for HoD and Institutional Leadership Live A, Queries live assessment attempt states from PostgreSQL., Calculates live department pass rates, scores, and attempts., Fetches activation requests pending HoD approval., Finds students struggling or scoring below threshold., Looks up student assessment history. (+6 more)

### Community 22 - "Authentication & Access Control"
Cohesion: 0.20
Nodes (18): seed_database(), int, Session, User, Base, AcademicYear, Batch, CourseTypeEnum (+10 more)

### Community 23 - "User Roster & Student Approvals"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 24 - "Security Guard & Proctoring Engine"
Cohesion: 0.15
Nodes (14): FullscreenGuard(), FullscreenGuardProps, SecurityGuard(), SecurityGuardProps, AssessmentExpiryContext, AssessmentRunner(), AssessmentRunnerProps, createDeadlineClock() (+6 more)

### Community 25 - "Security Guard & Proctoring Engine"
Cohesion: 0.21
Nodes (11): create_access_token(), BenchmarkMetrics, AsyncClient, float, int, str, Empirical Dashboard Concurrency Benchmark Simulates 200 concurrent virtual users, Simulates a single virtual user logging in and loading the dashboard. (+3 more)

### Community 26 - "User Roster & Student Approvals"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 27 - "Question Bank & Paper Builder"
Cohesion: 0.22
Nodes (10): GeminiEvaluator, Strict Google Gemini LLM Qualitative Evaluation Client. Evaluates candidate open, Evaluates a candidate's descriptive, architectural, or business case answer stri, Strict Gemini-powered qualitative rubric evaluation service., Evaluates a complete customer support chat simulation transcript., Cascades through Gemini models strictly until a valid response is received., Extracts and parses JSON object from LLM response text with multi-layer fallback, Any (+2 more)

### Community 28 - "Authentication & Access Control"
Cohesion: 0.28
Nodes (12): main(), obtain_auth_token(), Any, AsyncClient, int, str, Real Web Application Traffic Concurrency Benchmark for NASC Assessment Portal Si, Obtains a valid JWT token by simulating user login. (+4 more)

### Community 29 - "backup_file & backup_sha256"
Cohesion: 0.17
Nodes (11): backup_file, backup_sha256, integrity_check, source_file, source_sha256, source_size_bytes, sqlite_version, timestamp (+3 more)

### Community 30 - "Coding Sandbox & Execution Engine"
Cohesion: 0.22
Nodes (7): DecommissionedCodingSandbox, DEPRECATED: Legacy Host Subprocess Sandbox. This module has been decommissioned., Bridge legacy calls to Judge0 remote execution client., Bridge legacy SQL calls to Judge0 SQLite runtime., Any, float, str

### Community 31 - "._build_system_instruction() & ._get_client()"
Cohesion: 0.20
Nodes (6): Executes an autonomous turn strictly using gemini-3.1-flash-live-preview via cli, Returns a genai.Client using the active API key., Rotates to backup API key if rate limited., Any, str, Client

### Community 32 - "Question Bank & Paper Builder"
Cohesion: 0.20
Nodes (6): float, int, PgCat High-Concurrency Benchmark & Verification Suite Simulates concurrent stude, Simulates a student answering a question or loading an attempt transaction., run_concurrency_stress_test(), run_simulated_student_tx()

### Community 33 - "Authentication & Access Control"
Cohesion: 0.36
Nodes (9): Session, User, LoginRequest, get_me(), _get_user_assigned_details(), login(), Extracts class tutor assignment or student class details., LoginRequest (+1 more)

### Community 34 - "User Roster & Student Approvals"
Cohesion: 0.24
Nodes (6): AutonomousTaskPlan, Autonomous Master Agent Engine for HoD & Administrator Portal. Strictly powered, TaskStep, UserContext, UserContext, bool

### Community 35 - "Coding Sandbox & Execution Engine"
Cohesion: 0.24
Nodes (6): Deterministic server-side scoring, readiness level computation and radar analyti, ScoringService, Any, bool, float, str

### Community 36 - "Student Assessment Workstations & Runner"
Cohesion: 0.28
Nodes (6): HardwareEvaluator, Deterministic evaluation engine for IoT Hardware Component Selection and Placeme, Evaluates candidate's motherboard slot placements.                  :param eval_, Any, float, str

### Community 37 - "Authentication & Access Control"
Cohesion: 0.28
Nodes (8): get_current_user(), Returns (is_valid, needs_rehash).     Smooth transition: Validates legacy 'plain, require_roles(), verify_password(), bool, Session, str, User

### Community 38 - "Database Models & Configuration"
Cohesion: 0.25
Nodes (7): backup_file, backup_sha256, backup_size_bytes, database, engine, status, timestamp

### Community 39 - "Authentication & Access Control"
Cohesion: 0.48
Nodes (6): main(), Comprehensive verification test suite for the Autonomous Executive AI Assistant., test_autonomous_master_agent_universal_query(), test_database_tool_arbitrary_queries(), test_database_tool_security_rejections(), test_multitenancy_and_rbac()

### Community 40 - "Student Assessment Workstations & Runner"
Cohesion: 0.29
Nodes (6): CANNED_MACROS, ChatMessage, ChatRound4SupportConsole(), ChatSession, DEFAULT_SESSIONS, WorkstationProps

### Community 41 - ".oxlintrc.json & plugins"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 42 - "Database Models & Configuration"
Cohesion: 0.40
Nodes (4): get_db(), get_direct_db(), Standard database session dependency routing through PgCat connection pooler., Direct database session dependency bypassing PgCat for administrative migrations

### Community 43 - "assessmentTiming.test.mjs & data"
Cohesion: 0.40
Nodes (3): data, { outputText }, source

### Community 44 - "builds & routes"
Cohesion: 0.50
Nodes (3): builds, routes, version

### Community 45 - "test_universal_batch_evaluator.py & End-to-End Multi-Domain Universal Batch Evaluator Test Verifies that GeminiBatch"
Cohesion: 0.67
Nodes (3): End-to-End Multi-Domain Universal Batch Evaluator Test Verifies that GeminiBatch, run_all(), test_round()

## Knowledge Gaps
- **268 isolated node(s):** `version`, `builds`, `routes`, `float`, `str` (+263 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `UserContext` connect `User Roster & Student Approvals` to `Cognitive RAG & Pinecone AI`, `Evaluation & Mark Management`, `._build_system_instruction() & ._get_client()`?**
  _High betweenness centrality (0.173) - this node is a cross-community bridge._
- **Why does `Client` connect `._build_system_instruction() & ._get_client()` to `User Roster & Student Approvals`?**
  _High betweenness centrality (0.156) - this node is a cross-community bridge._
- **Why does `User` connect `Authentication & Access Control` to `Question Bank & Paper Builder`, `Authentication & Access Control`, `Question Bank & Paper Builder`, `User Roster & Student Approvals`, `Authentication & Access Control`, `Authentication & Access Control`, `Question Bank & Paper Builder`, `User Roster & Student Approvals`, `Cognitive RAG & Pinecone AI`, `Question Bank & Paper Builder`, `Question Bank & Paper Builder`, `Authentication & Access Control`?**
  _High betweenness centrality (0.146) - this node is a cross-community bridge._
- **Are the 112 inferred relationships involving `User` (e.g. with `AllocationCreate` and `UpdateRoundConfigRequest`) actually correct?**
  _`User` has 112 INFERRED edges - model-reasoned connections that need verification._
- **Are the 76 inferred relationships involving `AssessmentAttempt` (e.g. with `AssistantQuickSummaryResponse` and `AttemptService`) actually correct?**
  _`AssessmentAttempt` has 76 INFERRED edges - model-reasoned connections that need verification._
- **Are the 71 inferred relationships involving `StudentProfile` (e.g. with `AllocationCreate` and `HodAssistantService`) actually correct?**
  _`StudentProfile` has 71 INFERRED edges - model-reasoned connections that need verification._
- **Are the 59 inferred relationships involving `FacultyProfile` (e.g. with `AllocationCreate` and `AssistantQuickSummaryResponse`) actually correct?**
  _`FacultyProfile` has 59 INFERRED edges - model-reasoned connections that need verification._