# Foreign Key Anomaly Resolution & Historical Reference Strategy

## 1. Executive Summary
During the comprehensive Phase 0 database reconnaissance of `backend/nasc_portal.db`, `PRAGMA foreign_key_check` identified **124 referential discrepancies** caused by SQLite's default disabled foreign-key enforcement (`PRAGMA foreign_keys = OFF`).

This document records the forensic investigation of every anomaly, categorizes them by parent-child relationship, and defines the zero-data-loss resolution strategy for the target PostgreSQL production database.

---

## 2. Inventory of Referential Anomalies

### Category 1: Historical Author References (`users.id = 2` and `users.id = 3`)
* **Impacted Tables & Counts**:
  - `questions.created_by_id`: 70 records (`user_id = 2` [12 rows], `user_id = 3` [58 rows])
  - `question_papers.created_by_id`: 7 records (`user_id = 2` [2 rows], `user_id = 3` [5 rows])
  - `assessments.created_by_id`: 5 records (`user_id = 2` [2 rows], `user_id = 3` [3 rows])
  - `approval_workflows.submitted_by_id`: 7 records (`user_id = 2` [2 rows], `user_id = 3` [5 rows])
  - `audit_logs.user_id`: 23 records (`user_id = 2` [1 row], `user_id = 3` [22 rows])
* **Forensic Investigation**:
  - Audit logs verify that `user_id = 2` and `user_id = 3` were active administrative/faculty accounts who generated Cognitive RAG question papers (e.g., *CIA -I Python TEST*, *CIA I*) and ingested study materials on `2026-08-08`.
  - These accounts were subsequently removed during a user clean-up, leaving historical author IDs intact in content tables.
* **Resolution Strategy (Strategy A & B)**:
  - To prevent altering historical question/paper authorship from `2` and `3` to other IDs, we restore preserved archive user records for `id = 2` (`username = 'archived_user_2'`, `full_name = 'Archived Historical Creator (ID: 2)'`, `is_active = False`) and `id = 3` (`username = 'archived_user_3'`, `full_name = 'Archived Historical Creator (ID: 3)'`, `is_active = False`).
  - These accounts are disabled (`is_active = False`) with locked credentials, preserving 100% author traceability without altering historical records.

---

### Category 2: Unlinked School References (`schools.id = 1`)
* **Impacted Table & Count**:
  - `departments.school_id`: 3 records (`departments.id = 1, 2, 4` reference `school_id = 1`)
* **Forensic Investigation**:
  - The `schools` table is currently empty (0 records).
  - In the SQLAlchemy data model (`app/models/models.py`), `departments.school_id` is defined as `nullable=True`.
* **Resolution Strategy (Strategy C)**:
  - In accordance with non-invasive domain rules, since no formal School entity has been established in the institutional master data, `departments.school_id` is set to `NULL`.
  - Once the institution registers its School master records, departments can be mapped to valid School IDs via the master API.

---

### Category 3: Unlinked Course Outcome References (`course_outcomes.id = 1, 2`)
* **Impacted Table & Count**:
  - `questions.co_id`: 8 records (`questions.id = 1..8` reference `co_id = 1` or `2`)
* **Forensic Investigation**:
  - The `course_outcomes` table is currently empty (0 records).
  - In the SQLAlchemy data model (`app/models/models.py`), `questions.co_id` is defined as `nullable=True`.
* **Resolution Strategy (Strategy C)**:
  - Questions 1 through 8 have complete Bloom taxonomy levels, topics, difficulty, and options. Because no Course Outcomes are currently seeded in the database, `questions.co_id` is set to `NULL`.
  - This satisfies strict PostgreSQL foreign keys without altering or losing question content.

---

### Category 4: Unlinked Class Tutor Reference (`faculty.id = 2`)
* **Impacted Table & Count**:
  - `academic_classes.tutor_id`: 1 record (`academic_classes.id = 2` references `tutor_id = 2`)
* **Forensic Investigation**:
  - The `faculty` table contains 5 active faculty profiles with IDs `3, 4, 5, 6, 7`.
  - In the SQLAlchemy model, `academic_classes.tutor_id` is defined as `nullable=True`.
* **Resolution Strategy (Strategy C)**:
  - Class `id = 2` (`2025-B.COM IT`) tutor assignment is set to `NULL` (unassigned class tutor), matching the other unassigned classes (`id = 1, 3, 4`).

---

## 3. Summary of Resolution Impact

| Category | Impacted Rows | Resolution Method | Data Loss | Logical Impact |
| :--- | :---: | :--- | :---: | :--- |
| **Historical Users (2, 3)** | 112 | Preserved via Archived User Shell (`is_active=False`) | **0%** | Authorship IDs 2 and 3 preserved |
| **School References** | 3 | Set `departments.school_id = NULL` | **0%** | Nullable master relationship cleared |
| **Course Outcomes** | 8 | Set `questions.co_id = NULL` | **0%** | Questions preserved 100% |
| **Class Tutor** | 1 | Set `academic_classes.tutor_id = NULL` | **0%** | Class unassigned tutor status |
| **TOTAL** | **124** | | **0%** | **Strict PostgreSQL FK Compliance** |
