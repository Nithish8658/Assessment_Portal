# Graph Report - Assessment_Portal  (2026-10-12)

## Corpus Check
- 217 files · ~681,514 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1664 nodes · 4922 edges · 78 communities (49 shown, 29 thin omitted)
- Extraction: 88% EXTRACTED · 12% INFERRED · 0% AMBIGUOUS · INFERRED: 607 edges (avg confidence: 0.95)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Authentication & Access Control
- Question Bank & Paper Builder
- User Roster & Student Approvals
- Cognitive RAG & Pinecone AI
- Authentication & Access Control
- Security Guard & Proctoring Engine
- Question Bank & Paper Builder
- Question Bank & Paper Builder
- Question Bank & Paper Builder
- Student Assessment Workstations & Runner
- Question Bank & Paper Builder
- Question Bank & Paper Builder
- Security Guard & Proctoring Engine
- Security Guard & Proctoring Engine
- Security Guard & Proctoring Engine
- Security Guard & Proctoring Engine
- User Roster & Student Approvals
- Student Assessment Workstations & Runner
- Question Bank & Paper Builder
- Security Guard & Proctoring Engine
- Question Bank & Paper Builder
- Authentication & Access Control
- Student Assessment Workstations & Runner
- Question Bank & Paper Builder
- Security Guard & Proctoring Engine
- Question Bank & Paper Builder
- Evaluation & Mark Management
- Question Bank & Paper Builder
- Question Bank & Paper Builder
- User Roster & Student Approvals
- package.json & name
- User Roster & Student Approvals
- Student Assessment Workstations & Runner
- Evaluation & Mark Management
- dependencies & axios
- Evaluation & Mark Management
- User Roster & Student Approvals
- Frontend Core UI & Dashboards
- Evaluation & Mark Management
- Question Bank & Paper Builder
- Question Bank & Paper Builder
- Cognitive RAG & Pinecone AI
- Question Bank & Paper Builder
- Assignments & Academic Calendar
- assessmentTiming.test.mjs & data
- Question Bank & Paper Builder
- Authentication & Access Control
- Database Models & Configuration
- devDependencies & oxlint
- hashlib & backup_source.py
- Database Models & Configuration
- Authentication & Access Control
- Student Assessment Workstations & Runner
- Deterministic server-side scoring, readiness level computation and radar… & ScoringService
- .oxlintrc.json & plugins
- Question Bank & Paper Builder
- Database Models & Configuration
- scripts & build
- vercel.json & builds
- Database Models & Configuration
- Database Models & Configuration
- Database Models & Configuration
- recharts.d.ts & recharts/umd/Recharts
- start_services.sh & start_services.sh script
- stop_services.sh & stop_services.sh script

## God Nodes (most connected - your core abstractions)
1. `User` - 168 edges
2. `AssessmentAttempt` - 78 edges
3. `react` - 59 edges
4. `AssessmentQuestion` - 51 edges
5. `StudentProfile` - 51 edges
6. `AssessmentDomain` - 48 edges
7. `AssessmentActivationRequest` - 48 edges
8. `AssessmentStudentAllocation` - 48 edges
9. `lucide-react` - 48 edges
10. `AcademicClass` - 47 edges

## Surprising Connections (you probably didn't know these)
- `run()` --uses--> `AssessmentActivationRequest`  [INFERRED]
  backend/app/migrations/backfill_competency_profiles.py → backend/app/models/assessment_models.py
- `run()` --uses--> `ProctoringEvent`  [INFERRED]
  backend/app/migrations/backfill_competency_profiles.py → backend/app/models/assessment_models.py
- `run()` --uses--> `AssessmentActivationRequest`  [INFERRED]
  backend/app/migrations/fix_c_track_question_bank.py → backend/app/models/assessment_models.py
- `run()` --uses--> `AssessmentDomain`  [INFERRED]
  backend/app/migrations/fix_c_track_question_bank.py → backend/app/models/assessment_models.py
- `run()` --uses--> `AssessmentQuestion`  [INFERRED]
  backend/app/migrations/fix_c_track_question_bank.py → backend/app/models/assessment_models.py

## Import Cycles
- None detected.

## Communities (78 total, 29 thin omitted)

### Community 0 - "Authentication & Access Control"
Cohesion: 0.05
Nodes (94): get_current_user(), get_password_hash(), require_roles(), verify_password(), AuditLog, Course, CourseAllocation, CourseEnrolment (+86 more)

### Community 1 - "Question Bank & Paper Builder"
Cohesion: 0.05
Nodes (86): academic_classes, academic_years, approval_history, approval_workflows, assessment_attempts, assessments, assignment_submissions, assignments (+78 more)

### Community 2 - "User Roster & Student Approvals"
Cohesion: 0.08
Nodes (43): run(), AcademicYear, Batch, Section, Semester, _all_batch_names(), _batches_payload(), BatchRequest (+35 more)

### Community 3 - "Cognitive RAG & Pinecone AI"
Cohesion: 0.08
Nodes (55): AssessmentCodeEditor(), AssessmentCodeEditorProps, CompilerDiagnostic, normalizeMonacoLanguage(), parseCompilerErrors(), QuestionPalette(), AssessmentExpiryContext, TimerHeader() (+47 more)

### Community 4 - "Authentication & Access Control"
Cohesion: 0.08
Nodes (46): apiClient, App(), MainPortal(), Navbar(), NavbarProps, Sidebar(), SidebarProps, ExcelStudentImporter() (+38 more)

### Community 5 - "Security Guard & Proctoring Engine"
Cohesion: 0.09
Nodes (28): run(), AssessmentAttempt, AssessmentStudentAllocation, AssistantLease, StudentCompetencyProfile, _build(), _domain_attempts_query(), load_profiles() (+20 more)

### Community 6 - "Question Bank & Paper Builder"
Cohesion: 0.04
Nodes (56): public.academic_classes, public.academic_years, public.approval_history, public.approval_workflows, public.assessment_attempts, public.assessment_audits, public.assessment_domains, public.assessment_policies (+48 more)

### Community 7 - "Question Bank & Paper Builder"
Cohesion: 0.12
Nodes (16): get_db(), AcademicClass, CourseTypeEnum, Notification, RoleEnum, invalidate_dashboard_cache(), create_activation_request(), review_activation_request_atomic() (+8 more)

### Community 8 - "Question Bank & Paper Builder"
Cohesion: 0.10
Nodes (16): AssessmentActivationCandidate, AssessmentResponse, AssessmentResult, AttemptQuestionSnapshot, CodeExecutionResult, CodingSubmission, CompetencyScore, delete_activation_request() (+8 more)

### Community 9 - "Student Assessment Workstations & Runner"
Cohesion: 0.10
Nodes (35): CompetencyRadar(), CompetencyRadarProps, AssessmentApprovals(), ActivationSessionItem, ActiveAssessmentsManager(), CandidateStudent, CandidateResults(), CandidateResultsProps (+27 more)

### Community 10 - "Question Bank & Paper Builder"
Cohesion: 0.18
Nodes (18): get_direct_db(), run_migration(), run_migration(), run_migration(), seed_c_coding_60(), run_seeding(), seed_c_domain(), seed_iot_hardware_domain() (+10 more)

### Community 11 - "Question Bank & Paper Builder"
Cohesion: 0.05
Nodes (41): public.academic_classes, public.academic_years, public.approval_history, public.approval_workflows, public.assessment_attempts, public.assessments, public.assignment_submissions, public.assignments (+33 more)

### Community 12 - "Security Guard & Proctoring Engine"
Cohesion: 0.05
Nodes (41): public.academic_classes, public.academic_scopes, public.academic_years, public.allocation_approval_history, public.assessment_activation_candidates, public.assessment_activation_requests, public.assessment_attempts, public.assessment_domains (+33 more)

### Community 13 - "Security Guard & Proctoring Engine"
Cohesion: 0.05
Nodes (41): public.academic_classes, public.academic_scopes, public.academic_years, public.allocation_approval_history, public.assessment_activation_candidates, public.assessment_activation_requests, public.assessment_attempts, public.assessment_domains (+33 more)

### Community 14 - "Security Guard & Proctoring Engine"
Cohesion: 0.05
Nodes (41): public.academic_classes, public.academic_scopes, public.academic_years, public.allocation_approval_history, public.assessment_activation_candidates, public.assessment_activation_requests, public.assessment_attempts, public.assessment_domains (+33 more)

### Community 15 - "Security Guard & Proctoring Engine"
Cohesion: 0.11
Nodes (21): StudentProfile, evaluate_submitted_attempt(), get_attempt_result(), get_attempt_timing(), get_latest_round_result(), ProctoringEventRequest, record_proctoring_event(), save_answers_bulk() (+13 more)

### Community 16 - "User Roster & Student Approvals"
Cohesion: 0.09
Nodes (7): AutonomousTaskPlan, TaskStep, DatabaseTool, make_json_safe(), ToolRegistry, UserContext, WebAppInternalTool

### Community 17 - "Student Assessment Workstations & Runner"
Cohesion: 0.09
Nodes (10): assistant_chat(), assistant_live_websocket(), AssistantChatRequest, AssistantQuickSummaryResponse, clear_assistant_session(), delete_assistant_session(), get_assistant_quick_summary(), get_assistant_session() (+2 more)

### Community 18 - "Question Bank & Paper Builder"
Cohesion: 0.15
Nodes (22): _admin_question_response(), _apply_question(), create_question(), _domain_admin_payload(), get_admin_round_questions(), list_competencies(), list_domains_admin(), _norm_code() (+14 more)

### Community 19 - "Security Guard & Proctoring Engine"
Cohesion: 0.16
Nodes (17): ProctoringEvent, _apply_problem(), attempt_detail(), _base_query(), finalize_attempt(), _get_attempt(), grade_attempt(), list_attempts() (+9 more)

### Community 20 - "Question Bank & Paper Builder"
Cohesion: 0.14
Nodes (26): get_class_360(), _readiness_bucket(), test_serialization(), BulkAnswerItem, CandidateQuestionResponse, Class360Info, Class360Kpis, Class360Response (+18 more)

### Community 21 - "Authentication & Access Control"
Cohesion: 0.13
Nodes (8): create_access_token(), get_dashboard_metrics(), BenchmarkMetrics, run_benchmark(), simulate_vu(), benchmark_endpoint(), print_header(), run_benchmarks()

### Community 22 - "Student Assessment Workstations & Runner"
Cohesion: 0.12
Nodes (10): check_execution_engine_health(), cron_batch_evaluation(), get_batch_evaluation_status(), run_candidate_code_deprecated(), run_candidate_sql(), RunSQLRequest, trigger_batch_evaluation(), CodeTestCaseResult (+2 more)

### Community 24 - "Security Guard & Proctoring Engine"
Cohesion: 0.19
Nodes (16): FullscreenGuard(), FullscreenGuardProps, SecurityGuard(), SecurityGuardProps, AssessmentContainer(), AssessmentLobby(), AssessmentLobbyProps, AssessmentRunner() (+8 more)

### Community 25 - "Question Bank & Paper Builder"
Cohesion: 0.19
Nodes (16): QuestionPaletteProps, ComponentPalette(), ComponentPaletteProps, HardwareModuleIllustration(), HardwareModuleIllustrationProps, IoTHardwarePlacementConsole(), MotherboardCanvas(), MotherboardCanvasProps (+8 more)

### Community 26 - "Evaluation & Mark Management"
Cohesion: 0.12
Nodes (3): append_message_to_session(), get_or_create_chat_session(), LiveAgentSession

### Community 27 - "Question Bank & Paper Builder"
Cohesion: 0.16
Nodes (8): _norm(), run(), _default_return(), make_c_starter_template(), _matching_brace(), strip_debug_hint(), unescape_text(), number_from_title()

### Community 29 - "User Roster & Student Approvals"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 30 - "package.json & name"
Cohesion: 0.11
Nodes (18): name, private, type, version, axios, canvas-confetti, clsx, es-toolkit (+10 more)

### Community 31 - "User Roster & Student Approvals"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 32 - "Student Assessment Workstations & Runner"
Cohesion: 0.23
Nodes (12): get_activation_request_by_id(), get_activation_requests(), get_activation_rounds_roster(), review_request(), submit_activation_request(), update_activation_request(), ActivationRequestResponse, ActivationRoundsPerformanceResponse (+4 more)

### Community 33 - "Evaluation & Mark Management"
Cohesion: 0.18
Nodes (6): docs_redirect(), health(), lifespan(), no_store_api_responses(), root(), scheduled_batch_code_evaluation_loop()

### Community 34 - "dependencies & axios"
Cohesion: 0.13
Nodes (15): dependencies, axios, canvas-confetti, clsx, es-toolkit, lucide-react, @monaco-editor/react, react (+7 more)

### Community 35 - "Evaluation & Mark Management"
Cohesion: 0.19
Nodes (14): ChatInput(), ChatInputProps, ChatMessage, cleanCell(), extractLivePageContext(), formatMarkdownText(), formatMessageTime(), HodAdminChatbot() (+6 more)

### Community 36 - "User Roster & Student Approvals"
Cohesion: 0.19
Nodes (5): AssessmentActivationRequest, AssessmentReattemptRequest, grant_tutor_attempt(), get_assessment_domains(), get_domain_by_slug()

### Community 37 - "Frontend Core UI & Dashboards"
Cohesion: 0.33
Nodes (8): AssistantChatSession, append_message(), clear_session(), get_or_create_session(), handle_message(), _now_hm(), _small_talk_reply(), welcome_message()

### Community 38 - "Evaluation & Mark Management"
Cohesion: 0.24
Nodes (4): analyze_audit(), generate_markdown_table(), format_cell(), format_options()

### Community 42 - "Question Bank & Paper Builder"
Cohesion: 0.21
Nodes (11): AdminDomain, AdminQuestion, AdminRound, Competency, DIFFICULTIES, DomainManager(), Draft, draftFrom() (+3 more)

### Community 43 - "Assignments & Academic Calendar"
Cohesion: 0.23
Nodes (11): AcademicCalendarPanel(), BatchRow, CalendarData, defaultsFor(), errText(), fmtDate(), lastDay(), STATUS_STYLE (+3 more)

### Community 44 - "assessmentTiming.test.mjs & data"
Cohesion: 0.17
Nodes (5): data, { outputText }, source, react-dom, typescript

### Community 45 - "Question Bank & Paper Builder"
Cohesion: 0.24
Nodes (10): AttemptDetail, AttemptRow, Checks, errText(), ExamOperations(), fmt(), OpsSummary, Problem (+2 more)

### Community 46 - "Authentication & Access Control"
Cohesion: 0.22
Nodes (6): get_tutor_authorized_classes(), get_tutor_cohort_results(), _legacy_round_columns(), _round_scores(), TutorClassOption, TutorStudentCohortItem

### Community 47 - "Database Models & Configuration"
Cohesion: 0.29
Nodes (4): acquire_slot(), new_holder(), release(), try_acquire()

### Community 48 - "devDependencies & oxlint"
Cohesion: 0.22
Nodes (9): devDependencies, oxlint, @types/canvas-confetti, @types/node, @types/react, @types/react-dom, typescript, vite (+1 more)

### Community 50 - "Database Models & Configuration"
Cohesion: 0.33
Nodes (3): ChatTurnRequest, ChatTurnResponse, process_live_chat_turn()

### Community 54 - ".oxlintrc.json & plugins"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 57 - "scripts & build"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, preview

### Community 58 - "vercel.json & builds"
Cohesion: 0.40
Nodes (4): builds, crons, routes, version

### Community 60 - "Database Models & Configuration"
Cohesion: 0.50
Nodes (3): @tailwindcss/vite, vite, @vitejs/plugin-react

## Knowledge Gaps
- **10 isolated node(s):** `canvas-confetti`, `clsx`, `es-toolkit`, `tailwind-merge`, `tailwindcss` (+5 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 675 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **29 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `User` connect `Authentication & Access Control` to `User Roster & Student Approvals`, `Security Guard & Proctoring Engine`, `Question Bank & Paper Builder`, `Question Bank & Paper Builder`, `Question Bank & Paper Builder`, `Security Guard & Proctoring Engine`, `Student Assessment Workstations & Runner`, `Question Bank & Paper Builder`, `Security Guard & Proctoring Engine`, `Question Bank & Paper Builder`, `Authentication & Access Control`, `Student Assessment Workstations & Runner`, `Evaluation & Mark Management`, `Question Bank & Paper Builder`, `Student Assessment Workstations & Runner`, `User Roster & Student Approvals`, `Frontend Core UI & Dashboards`, `Authentication & Access Control`, `Database Models & Configuration`, `Authentication & Access Control`?**
  _High betweenness centrality (0.095) - this node is a cross-community bridge._
- **Are the 135 inferred relationships involving `User` (e.g. with `get_current_user()` and `require_roles()`) actually correct?**
  _`User` has 135 INFERRED edges - model-reasoned connections that need verification._
- **What connects `canvas-confetti`, `clsx`, `es-toolkit` to the rest of the system?**
  _10 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Authentication & Access Control` be split into smaller, more focused modules?**
  _Cohesion score 0.051628352490421456 - nodes in this community are weakly interconnected._
- **Why does `AssessmentAttempt` connect `Security Guard & Proctoring Engine` to `Student Assessment Workstations & Runner`, `Authentication & Access Control`, `User Roster & Student Approvals`, `Question Bank & Paper Builder`, `Question Bank & Paper Builder`, `Question Bank & Paper Builder`, `Question Bank & Paper Builder`, `Security Guard & Proctoring Engine`, `Student Assessment Workstations & Runner`, `Security Guard & Proctoring Engine`, `Student Assessment Workstations & Runner`, `Database Models & Configuration`, `Question Bank & Paper Builder`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Are the 47 inferred relationships involving `AssessmentAttempt` (e.g. with `run()` and `run_validation()`) actually correct?**
  _`AssessmentAttempt` has 47 INFERRED edges - model-reasoned connections that need verification._
- **Should `Question Bank & Paper Builder` be split into smaller, more focused modules?**
  _Cohesion score 0.051590483827853514 - nodes in this community are weakly interconnected._