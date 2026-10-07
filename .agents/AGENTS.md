# Project Rules & Architecture Brain (Assessment Portal)

## 🧠 Graphify as the Project Knowledge Brain

This repository uses **Graphify** (`graphify-out/graph.json`) as its central, persistent knowledge graph and architectural brain. 

### 1. Graph-First Memory & Symbol Lookup
- **DO NOT** perform wide, exhaustive codebase scans (`grep_search` across entire directory trees) for simple conceptual lookups, component navigation, route lookups, or call graph questions.
- **Always consult the Knowledge Graph first**:
  - Run `python graphify-out/query_brain.py "<concept or symbol>"` or read `graphify-out/graph.json` directly.
  - Use `python graphify-out/query_brain.py --explain "<NodeName>"` to inspect caller/callee connections, file paths, and exact line numbers.
  - Use `python graphify-out/query_brain.py --overview` for structural domain maps.

### 2. Core Architectural Domains (Community Hubs)
- **Cognitive RAG & Pinecone AI (`backend/app/ai/`)**:
  - `PineconeRAGClient` ([pinecone_client.py](file:///c:/Users/HP/Desktop/Assessment_Portal/backend/app/ai/pinecone_client.py)): Vector indexing, multilingual embeddings, syllabus chunking, Bloom taxonomy retrieval.
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

### 3. Keeping the Brain Synchronized
- When adding new modules, routes, models, or components, synchronize the knowledge graph using:
  ```powershell
  python graphify-out/run_ast.py
  python graphify-out/run_merge.py
  python graphify-out/run_build.py
  ```
- This updates `graphify-out/graph.json`, `graphify-out/graph.html`, and `graphify-out/GRAPH_REPORT.md` with zero drift.
