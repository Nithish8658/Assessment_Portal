# Graph Report - Assessment_Portal  (2026-10-11)

## Corpus Check
- 198 files · ~653,089 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1332 nodes · 3641 edges · 66 communities (33 shown, 33 thin omitted)
- Extraction: 89% EXTRACTED · 11% INFERRED · 0% AMBIGUOUS · INFERRED: 418 edges (avg confidence: 0.95)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Authentication & Access Control
- Question Bank & Paper Builder
- Cognitive RAG & Pinecone AI
- Question Bank & Paper Builder
- Question Bank & Paper Builder
- Authentication & Access Control
- Authentication & Access Control
- Question Bank & Paper Builder
- Question Bank & Paper Builder
- Question Bank & Paper Builder
- Security Guard & Proctoring Engine
- Security Guard & Proctoring Engine
- Security Guard & Proctoring Engine
- Security Guard & Proctoring Engine
- Question Bank & Paper Builder
- Student Assessment Workstations & Runner
- Question Bank & Paper Builder
- Authentication & Access Control
- Question Bank & Paper Builder
- Database Models & Configuration
- Database Models & Configuration
- User Roster & Student Approvals
- Evaluation & Mark Management
- Authentication & Access Control
- Question Bank & Paper Builder
- User Roster & Student Approvals
- Student Assessment Workstations & Runner
- Authentication & Access Control
- dependencies & axios
- Question Bank & Paper Builder
- Cognitive RAG & Pinecone AI
- assessmentTiming.test.mjs & data
- master_agent.py & AutonomousTaskPlan
- Evaluation & Mark Management
- Student Assessment Workstations & Runner
- devDependencies & oxlint
- Student Assessment Workstations & Runner
- Authentication & Access Control
- hashlib & backup_source.py
- Evaluation & Mark Management
- Database Models & Configuration
- Frontend Core UI & Dashboards
- .oxlintrc.json & plugins
- Question Bank & Paper Builder
- Frontend Core UI & Dashboards
- Database Models & Configuration
- scripts & build
- vercel.json & builds
- assistant_live_websocket() & websocket
- Database Models & Configuration
- recharts.d.ts & recharts/umd/Recharts
- start_services.sh & start_services.sh script
- stop_services.sh & stop_services.sh script

## God Nodes (most connected - your core abstractions)
1. `User` - 108 edges
2. `react` - 55 edges
3. `AssessmentAttempt` - 50 edges
4. `lucide-react` - 45 edges
5. `AssessmentQuestion` - 41 edges
6. `AssessmentRound` - 40 edges
7. `AssessmentActivationRequest` - 38 edges
8. `apiClient` - 37 edges
9. `AcademicClass` - 36 edges
10. `AssessmentStudentAllocation` - 35 edges

## Surprising Connections (you probably didn't know these)
- `get_current_user()` --uses--> `User`  [INFERRED]
  backend/app/auth/jwt.py → backend/app/models/models.py
- `require_roles()` --uses--> `User`  [INFERRED]
  backend/app/auth/jwt.py → backend/app/models/models.py
- `run_migration()` --uses--> `AcademicClass`  [INFERRED]
  backend/app/migrations/migrate_corporate_assessment.py → backend/app/models/models.py
- `run_migration()` --uses--> `StudentProfile`  [INFERRED]
  backend/app/migrations/migrate_corporate_assessment.py → backend/app/models/models.py
- `run_migration()` --uses--> `User`  [INFERRED]
  backend/app/migrations/migrate_corporate_assessment.py → backend/app/models/models.py

## Import Cycles
- None detected.

## Communities (66 total, 33 thin omitted)

### Community 0 - "Authentication & Access Control"
Cohesion: 0.05
Nodes (84): get_password_hash(), verify_password(), AcademicClass, AcademicYear, Batch, Course, CourseAllocation, CourseEnrolment (+76 more)

### Community 1 - "Question Bank & Paper Builder"
Cohesion: 0.05
Nodes (86): academic_classes, academic_years, approval_history, approval_workflows, assessment_attempts, assessments, assignment_submissions, assignments (+78 more)

### Community 2 - "Cognitive RAG & Pinecone AI"
Cohesion: 0.07
Nodes (58): AssessmentCodeEditor(), AssessmentCodeEditorProps, CompilerDiagnostic, normalizeMonacoLanguage(), parseCompilerErrors(), QuestionPalette(), QuestionPaletteProps, AssessmentExpiryContext (+50 more)

### Community 3 - "Question Bank & Paper Builder"
Cohesion: 0.07
Nodes (43): get_attempt_result(), get_attempt_timing(), get_latest_round_result(), save_answers_bulk(), save_response(), start_attempt(), submit_attempt(), submit_attempt_by_path() (+35 more)

### Community 4 - "Question Bank & Paper Builder"
Cohesion: 0.06
Nodes (27): AuditLog, Notification, get_activation_request_by_id(), get_activation_requests(), get_activation_rounds_roster(), review_request(), submit_activation_request(), update_activation_request() (+19 more)

### Community 5 - "Authentication & Access Control"
Cohesion: 0.09
Nodes (11): get_current_user(), require_roles(), get_db(), get_direct_db(), docs_redirect(), health(), root(), AssistantChatSession (+3 more)

### Community 6 - "Authentication & Access Control"
Cohesion: 0.08
Nodes (42): App(), MainPortal(), ChatMessage, extractLivePageContext(), HodAdminChatbot(), PageContextPayload, QUICK_CHIPS, QuickSummary (+34 more)

### Community 7 - "Question Bank & Paper Builder"
Cohesion: 0.04
Nodes (56): public.academic_classes, public.academic_years, public.approval_history, public.approval_workflows, public.assessment_attempts, public.assessment_audits, public.assessment_domains, public.assessment_policies (+48 more)

### Community 8 - "Question Bank & Paper Builder"
Cohesion: 0.12
Nodes (16): AssessmentActivationCandidate, AssessmentAttempt, AssessmentReattemptRequest, AssessmentResponse, AssessmentResult, AttemptQuestionSnapshot, CodeExecutionResult, CodingSubmission (+8 more)

### Community 9 - "Question Bank & Paper Builder"
Cohesion: 0.05
Nodes (41): public.academic_classes, public.academic_years, public.approval_history, public.approval_workflows, public.assessment_attempts, public.assessments, public.assignment_submissions, public.assignments (+33 more)

### Community 10 - "Security Guard & Proctoring Engine"
Cohesion: 0.05
Nodes (41): public.academic_classes, public.academic_scopes, public.academic_years, public.allocation_approval_history, public.assessment_activation_candidates, public.assessment_activation_requests, public.assessment_attempts, public.assessment_domains (+33 more)

### Community 11 - "Security Guard & Proctoring Engine"
Cohesion: 0.05
Nodes (41): public.academic_classes, public.academic_scopes, public.academic_years, public.allocation_approval_history, public.assessment_activation_candidates, public.assessment_activation_requests, public.assessment_attempts, public.assessment_domains (+33 more)

### Community 12 - "Security Guard & Proctoring Engine"
Cohesion: 0.05
Nodes (41): public.academic_classes, public.academic_scopes, public.academic_years, public.allocation_approval_history, public.assessment_activation_candidates, public.assessment_activation_requests, public.assessment_attempts, public.assessment_domains (+33 more)

### Community 13 - "Security Guard & Proctoring Engine"
Cohesion: 0.13
Nodes (26): apiClient, FullscreenGuard(), FullscreenGuardProps, SecurityGuard(), SecurityGuardProps, AssessmentContainer(), AssessmentLobby(), AssessmentLobbyProps (+18 more)

### Community 14 - "Question Bank & Paper Builder"
Cohesion: 0.23
Nodes (18): run_migration(), run_migration(), run_migration(), seed_c_coding_60(), run_seeding(), seed_c_domain(), seed_iot_hardware_domain(), run_validation() (+10 more)

### Community 15 - "Student Assessment Workstations & Runner"
Cohesion: 0.12
Nodes (24): CompetencyRadar(), CompetencyRadarProps, ActivationSessionItem, CandidateStudent, Class360Modal(), Class360ModalProps, CohortAnalytics(), Student360Modal() (+16 more)

### Community 16 - "Question Bank & Paper Builder"
Cohesion: 0.16
Nodes (6): analyze_audit(), run_seeding(), generate_markdown_table(), format_cell(), format_options(), snapshot_counts()

### Community 17 - "Authentication & Access Control"
Cohesion: 0.16
Nodes (7): create_access_token(), BenchmarkMetrics, run_benchmark(), simulate_vu(), benchmark_endpoint(), print_header(), run_benchmarks()

### Community 18 - "Question Bank & Paper Builder"
Cohesion: 0.10
Nodes (9): sync_sequences(), get_admin_round_questions(), trigger_sync_sequences(), update_round_config(), UpdateRoundConfigRequest, get_assessment_domains(), get_domain_by_slug(), DomainDetailResponse (+1 more)

### Community 19 - "Database Models & Configuration"
Cohesion: 0.10
Nodes (20): name, private, type, version, axios, canvas-confetti, clsx, es-toolkit (+12 more)

### Community 20 - "Database Models & Configuration"
Cohesion: 0.23
Nodes (15): ComponentPalette(), ComponentPaletteProps, HardwareModuleIllustration(), HardwareModuleIllustrationProps, IoTHardwarePlacementConsole(), MotherboardCanvas(), MotherboardCanvasProps, SlotSnapTarget() (+7 more)

### Community 21 - "User Roster & Student Approvals"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 22 - "Evaluation & Mark Management"
Cohesion: 0.13
Nodes (3): append_message_to_session(), get_or_create_chat_session(), LiveAgentSession

### Community 23 - "Authentication & Access Control"
Cohesion: 0.18
Nodes (4): AssessmentActivationRequest, AssessmentStudentAllocation, get_calendar_events(), verify_student_can_start_round()

### Community 25 - "User Roster & Student Approvals"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 26 - "Student Assessment Workstations & Runner"
Cohesion: 0.14
Nodes (6): check_execution_engine_health(), get_batch_evaluation_status(), run_candidate_code_deprecated(), run_candidate_sql(), RunSQLRequest, trigger_batch_evaluation()

### Community 28 - "dependencies & axios"
Cohesion: 0.14
Nodes (14): dependencies, axios, canvas-confetti, clsx, es-toolkit, lucide-react, @monaco-editor/react, react (+6 more)

### Community 31 - "assessmentTiming.test.mjs & data"
Cohesion: 0.17
Nodes (5): data, { outputText }, source, react-dom, typescript

### Community 35 - "devDependencies & oxlint"
Cohesion: 0.22
Nodes (9): devDependencies, oxlint, @types/canvas-confetti, @types/node, @types/react, @types/react-dom, typescript, vite (+1 more)

### Community 40 - "Database Models & Configuration"
Cohesion: 0.33
Nodes (3): ChatTurnRequest, ChatTurnResponse, process_live_chat_turn()

### Community 42 - ".oxlintrc.json & plugins"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 46 - "scripts & build"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, preview

### Community 47 - "vercel.json & builds"
Cohesion: 0.50
Nodes (3): builds, routes, version

## Knowledge Gaps
- **10 isolated node(s):** `canvas-confetti`, `clsx`, `es-toolkit`, `tailwind-merge`, `tailwindcss` (+5 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 580 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **33 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `User` connect `Authentication & Access Control` to `Question Bank & Paper Builder`, `Question Bank & Paper Builder`, `Authentication & Access Control`, `Authentication & Access Control`, `Question Bank & Paper Builder`, `Database Models & Configuration`, `Frontend Core UI & Dashboards`, `Question Bank & Paper Builder`, `Question Bank & Paper Builder`, `Evaluation & Mark Management`, `Authentication & Access Control`, `Question Bank & Paper Builder`, `Student Assessment Workstations & Runner`?**
  _High betweenness centrality (0.074) - this node is a cross-community bridge._
- **Are the 79 inferred relationships involving `User` (e.g. with `get_current_user()` and `require_roles()`) actually correct?**
  _`User` has 79 INFERRED edges - model-reasoned connections that need verification._
- **What connects `canvas-confetti`, `clsx`, `es-toolkit` to the rest of the system?**
  _10 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Authentication & Access Control` be split into smaller, more focused modules?**
  _Cohesion score 0.05411823522059742 - nodes in this community are weakly interconnected._
- **Why does `HodAssistantService` connect `Question Bank & Paper Builder` to `Question Bank & Paper Builder`, `Authentication & Access Control`, `Question Bank & Paper Builder`, `Authentication & Access Control`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Are the 24 inferred relationships involving `AssessmentAttempt` (e.g. with `run_validation()` and `delete_activation_request()`) actually correct?**
  _`AssessmentAttempt` has 24 INFERRED edges - model-reasoned connections that need verification._
- **Should `Question Bank & Paper Builder` be split into smaller, more focused modules?**
  _Cohesion score 0.051590483827853514 - nodes in this community are weakly interconnected._