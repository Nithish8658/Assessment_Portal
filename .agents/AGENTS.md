# Project Architecture & Reference (Assessment Portal)

## Core Architectural Domains

- **Cognitive RAG & Pinecone AI (`backend/app/ai/`)**:
  - `PineconeRAGClient`: Vector indexing, multilingual embeddings, syllabus chunking, Bloom taxonomy retrieval.
  - `cognitive_rag_engine.py`: Dynamic question generation with Bloom level distribution and syllabus grounding.

- **Browser Security Guard & Proctoring Engine (`frontend/src/components/assessment/SecurityGuard.tsx`)**:
  - `SecurityGuard.tsx` / `FullscreenGuard.tsx`: Client-side assessment environment lockdown (fullscreen enforcement, tab-switch monitoring, context menu and copy-paste restriction, DevTools blocking, window blur detection).
  - Malpractice audit ledger, event logging, and attempt violation threshold enforcement.

- **OBE & CO-PO Attainment (`backend/app/routers/obe.py` & `frontend/src/pages/obe/`)**:
  - Direct and indirect attainment calculation formulas for NBA/NAAC accreditation compliance.
  - Bloom taxonomy breakdown (Remember, Understand, Apply, Analyze, Evaluate, Create).

- **Assessment, Exam & Question Bank Management**:
  - `QuestionBank.tsx`, `QuestionPaperBuilder.tsx`, `AssessmentManager.tsx`, `EvaluationWorkspace.tsx`.

- **Authentication & Security (`backend/app/auth/jwt.py`)**:
  - Role-Based Access Control (RBAC): `super_admin`, `admin`, `faculty`, `hod`, `student`.
