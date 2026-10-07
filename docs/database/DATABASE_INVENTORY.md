# Database Inventory & Object Catalog (NASC Assessment Portal)

## 1. Executive Summary
This document provides the complete, authoritative database inventory of the NASC Assessment Portal across all 41 relational tables, documenting row counts, primary keys, foreign keys, and indexes.

---

## 2. Table Inventory Manifest

| Table Name | Row Count | Primary Key | Foreign Key Target Tables | Status |
| :--- | :---: | :--- | :--- | :--- |
| `academic_classes` | 5 | `id` (INTEGER PK) | `programmes(id)`, `faculty(id)` | Populated |
| `academic_years` | 1 | `id` (INTEGER PK) | None | Populated |
| `approval_history` | 0 | `id` (INTEGER PK) | `approval_workflows(id)`, `users(id)` | Ready (0 rows) |
| `approval_workflows` | 13 | `id` (INTEGER PK) | `users(id)` | Populated |
| `assessment_attempts` | 16 | `id` (INTEGER PK) | `assessments(id)`, `students(id)` | Populated |
| `assessments` | 13 | `id` (INTEGER PK) | `courses(id)`, `question_papers(id)`, `users(id)` | Populated |
| `assignment_submissions` | 0 | `id` (INTEGER PK) | `assignments(id)`, `students(id)` | Ready (0 rows) |
| `assignments` | 0 | `id` (INTEGER PK) | `courses(id)`, `rubrics(id)`, `users(id)` | Ready (0 rows) |
| `audit_logs` | 108 | `id` (INTEGER PK) | `users(id)` | Populated |
| `batches` | 1 | `id` (INTEGER PK) | None | Populated |
| `co_po_mappings` | 0 | `id` (INTEGER PK) | `course_outcomes(id)`, `programme_outcomes(id)` | Ready (0 rows) |
| `co_pso_mappings` | 0 | `id` (INTEGER PK) | `course_outcomes(id)`, `programme_specific_outcomes(id)` | Ready (0 rows) |
| `course_allocations` | 3 | `id` (INTEGER PK) | `faculty(id)`, `courses(id)` | Populated |
| `course_enrolments` | 96 | `id` (INTEGER PK) | `students(id)`, `courses(id)` | Populated |
| `course_outcomes` | 0 | `id` (INTEGER PK) | `courses(id)` | Ready (0 rows) |
| `courses` | 4 | `id` (INTEGER PK) | `programmes(id)` | Populated |
| `departments` | 4 | `id` (INTEGER PK) | `schools(id)`, `faculty(id)` | Populated |
| `faculty` | 5 | `id` (INTEGER PK) | `users(id)`, `departments(id)`, `programmes(id)` | Populated |
| `learning_resources` | 2 | `id` (INTEGER PK) | `courses(id)`, `users(id)` | Populated |
| `marks` | 61 | `id` (INTEGER PK) | `students(id)`, `courses(id)`, `assessments(id)` | Populated |
| `notifications` | 0 | `id` (INTEGER PK) | `users(id)` | Ready (0 rows) |
| `programme_outcomes` | 0 | `id` (INTEGER PK) | `programmes(id)` | Ready (0 rows) |
| `programme_specific_outcomes` | 0 | `id` (INTEGER PK) | `programmes(id)` | Ready (0 rows) |
| `programmes` | 3 | `id` (INTEGER PK) | `departments(id)` | Populated |
| `question_options` | 512 | `id` (INTEGER PK) | `questions(id)` | Populated |
| `question_paper_questions` | 148 | `id` (INTEGER PK) | `question_papers(id)`, `questions(id)` | Populated |
| `question_papers` | 15 | `id` (INTEGER PK) | `courses(id)`, `users(id)` | Populated |
| `questions` | 128 | `id` (INTEGER PK) | `courses(id)`, `course_outcomes(id)`, `users(id)` | Populated |
| `results` | 96 | `id` (INTEGER PK) | `students(id)`, `courses(id)` | Populated |
| `roles` | 7 | `id` (INTEGER PK) | None | Populated |
| `roster_approval_batches` | 0 | `id` (INTEGER PK) | `users(id)`, `programmes(id)` | Ready (0 rows) |
| `rubric_criteria` | 0 | `id` (INTEGER PK) | `rubrics(id)`, `course_outcomes(id)` | Ready (0 rows) |
| `rubric_levels` | 0 | `id` (INTEGER PK) | `rubric_criteria(id)` | Ready (0 rows) |
| `rubrics` | 0 | `id` (INTEGER PK) | `users(id)` | Ready (0 rows) |
| `schools` | 0 | `id` (INTEGER PK) | None | Ready (0 rows) |
| `sections` | 1 | `id` (INTEGER PK) | None | Populated |
| `semesters` | 1 | `id` (INTEGER PK) | None | Populated |
| `student_answers` | 148 | `id` (INTEGER PK) | `assessment_attempts(id)`, `questions(id)`, `question_options(id)` | Populated |
| `students` | 48 | `id` (INTEGER PK) | `users(id)`, `programmes(id)` | Populated |
| `user_roles` | 54 | `(user_id, role_id)` | `users(id)`, `roles(id)` | Populated |
| `users` | 56 | `id` (INTEGER PK) | None (includes 2 archived historical author shells) | Populated |
| **TOTAL** | **1,549 rows** | | | **100% Migrated** |
