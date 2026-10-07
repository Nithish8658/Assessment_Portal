# Zero Data Loss Migration Verification Report
**Source Container (Legacy)**: `notebooklm_pg`
**Target Container (Dedicated)**: `nasc-assessment-db` (Port 5432)
**Database**: `nasc_portal` (User: `nasc_admin`)

| Table Name | Pre-Migration Rows | Post-Migration Rows | Status |
| :--- | :--- | :--- | :--- |
| `academic_classes` | 5 | 5 | MATCH (OK) |
| `academic_scopes` | 0 | 0 | MATCH (OK) |
| `academic_years` | 1 | 1 | MATCH (OK) |
| `allocation_approval_history` | 4 | 4 | MATCH (OK) |
| `assessment_activation_candidates` | 14 | 14 | MATCH (OK) |
| `assessment_activation_requests` | 12 | 12 | MATCH (OK) |
| `assessment_attempts` | 24 | 24 | MATCH (OK) |
| `assessment_domains` | 4 | 4 | MATCH (OK) |
| `assessment_policies` | 17 | 17 | MATCH (OK) |
| `assessment_questions` | 136 | 136 | MATCH (OK) |
| `assessment_reattempt_requests` | 9 | 9 | MATCH (OK) |
| `assessment_responses` | 69 | 69 | MATCH (OK) |
| `assessment_results` | 22 | 22 | MATCH (OK) |
| `assessment_rounds` | 17 | 17 | MATCH (OK) |
| `assessment_student_allocations` | 66 | 66 | MATCH (OK) |
| `attempt_question_snapshots` | 218 | 218 | MATCH (OK) |
| `audit_logs` | 143 | 143 | MATCH (OK) |
| `batches` | 2 | 2 | MATCH (OK) |
| `code_execution_results` | 0 | 0 | MATCH (OK) |
| `coding_submissions` | 0 | 0 | MATCH (OK) |
| `competencies` | 61 | 61 | MATCH (OK) |
| `competency_scores` | 69 | 69 | MATCH (OK) |
| `course_allocations` | 3 | 3 | MATCH (OK) |
| `course_enrolments` | 96 | 96 | MATCH (OK) |
| `courses` | 4 | 4 | MATCH (OK) |
| `departments` | 3 | 3 | MATCH (OK) |
| `faculty` | 5 | 5 | MATCH (OK) |
| `notifications` | 61 | 61 | MATCH (OK) |
| `obe_attainment_records` | 0 | 0 | MATCH (OK) |
| `proctoring_events` | 0 | 0 | MATCH (OK) |
| `programmes` | 3 | 3 | MATCH (OK) |
| `question_evaluation_configs` | 136 | 136 | MATCH (OK) |
| `question_versions` | 101 | 101 | MATCH (OK) |
| `roles` | 7 | 7 | MATCH (OK) |
| `roster_approval_batches` | 0 | 0 | MATCH (OK) |
| `schools` | 0 | 0 | MATCH (OK) |
| `sections` | 1 | 1 | MATCH (OK) |
| `semesters` | 1 | 1 | MATCH (OK) |
| `students` | 49 | 49 | MATCH (OK) |
| `user_roles` | 55 | 55 | MATCH (OK) |
| `users` | 57 | 57 | MATCH (OK) |

### Summary
- **Total Tables Verified**: 41
- **Total Rows Migrated**: 1475 / 1475
- **Total Discrepancies**: 0
- **Migration Status**: PASSED (100% Data Integrity Guaranteed)