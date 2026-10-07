# Database Architecture & Integration Foundation

## 1. Architectural Overview
The NASC Assessment Portal backend has transitioned from a single-file SQLite database to an enterprise PostgreSQL relational architecture, providing high-concurrency connection pooling, strict referential integrity, and isolated transactional boundaries.

```
┌─────────────────────────────────────────────────────────────┐
│                    NASC ASSESSMENT PORTAL                   │
│               FastAPI Backend + React Frontend              │
└──────────────────────────────┬──────────────────────────────┘
                               │
                       SQLAlchemy 2.0 ORM
                 (Connection Pool: size=10, max=20)
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                  POSTGRESQL 16 PRODUCTION DB                │
│                        (nasc_portal)                        │
│                                                             │
│  • Identity & Roles (users, students, faculty, user_roles)  │
│  • Academic Masters (departments, programmes, courses)      │
│  • Question Bank & Papers (questions, options, blueprints)  │
│  • Assessment Engine (assessments, attempts, answers)       │
│  • OBE & Attainment (marks, results, CO-PO matrices)        │
│  • Audit Trail & Workflows (audit_logs, approval_workflows) │
└──────────────────────────────┬──────────────────────────────┘
                               │
                       Future Integration
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│             CORPORATE ASSESSMENT INTEGRATION LAYER          │
│                                                             │
│  Consumes Institutional Identity & Academic Structure via:   │
│  • /api/v1/auth/login, /api/v1/auth/me                      │
│  • /api/v1/users/students, /api/v1/users/faculty            │
│  • /api/v1/master/courses, /api/v1/master/classes           │
│                                                             │
│  (Corporate Assessment Platform maintains isolated schema)  │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Integration Readiness for Future Assessment Portal

The PostgreSQL migration establishes the following stable API contracts for the upcoming Corporate Assessment Platform:

### Identity & Authentication
* **Endpoint**: `/api/v1/auth/login` (POST JSON) -> Returns Bearer JWT with `sub`, `user_id`, `role`.
* **Endpoint**: `/api/v1/auth/me` (GET) -> Returns authenticated profile, role permissions, and academic mappings.
* **Endpoint**: `/api/v1/users/students` (GET) -> Returns institutional student roster with register numbers and degree programmes.
* **Endpoint**: `/api/v1/users/faculty` (GET) -> Returns faculty and class tutor assignments.

### Academic Context
* **Endpoint**: `/api/v1/master/departments` (GET)
* **Endpoint**: `/api/v1/master/programmes` (GET)
* **Endpoint**: `/api/v1/master/courses` (GET)
* **Endpoint**: `/api/v1/master/classes` (GET)

### Assessment & Evaluation Engine
* **Endpoint**: `/api/v1/assessments` (GET, POST)
* **Endpoint**: `/api/v1/questions` (GET, POST)
* **Endpoint**: `/api/v1/question-papers` (GET, POST)
* **Endpoint**: `/api/v1/marks/grid` (GET, POST)
* **Endpoint**: `/api/v1/obe/attainment` (GET)
