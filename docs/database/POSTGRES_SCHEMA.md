# PostgreSQL Production Database Schema

## 1. Schema Overview
The PostgreSQL database `nasc_portal` (PostgreSQL 16.12) serves as the primary relational database for the institutional assessment, OBE analytics, and AI proctoring engines.

All tables use standard PostgreSQL typed columns, strict Foreign Key constraints, and automated sequence auto-increment management.

---

## 2. Table Definitions

### Identity & Access Management (IAM)
* **`roles`**: System permission roles (`id`, `name`, `description`).
* **`users`**: System user credentials (`id`, `username`, `email`, `hashed_password`, `full_name`, `mobile`, `is_active`, `created_at`).
* **`user_roles`**: Many-to-many role mapping (`user_id`, `role_id`).
* **`students`**: Student academic profile (`id`, `user_id`, `register_number`, `programme_id`, `batch_name`, `semester_num`, `section_name`, `initial_password`, `status`).
* **`faculty`**: Faculty/tutor profiles (`id`, `user_id`, `employee_id`, `designation`, `department_id`, `status`, `assigned_programme_id`, `assigned_batch`, `assigned_section`).

### Academic Master Data
* **`schools`**: Academic school divisions (`id`, `code`, `name`).
* **`departments`**: Department divisions (`id`, `code`, `name`, `school_id`, `hod_id`).
* **`programmes`**: Degree programmes (`id`, `code`, `name`, `degree_type`, `department_id`, `duration_years`).
* **`academic_classes`**: Classes & sections (`id`, `class_code`, `name`, `programme_id`, `batch_name`, `semester_num`, `section_name`, `tutor_id`).
* **`courses`**: Course catalog (`id`, `code`, `title`, `course_type`, `credits`, `semester_num`, `regulation`, `programme_id`).
* **`course_allocations`**: Faculty teaching assignments (`id`, `faculty_id`, `course_id`, `academic_year`, `semester_num`, `section_name`, `batch_name`).
* **`course_enrolments`**: Student course rosters (`id`, `student_id`, `course_id`, `academic_year`).
* **`academic_years`**, **`semesters`**, **`batches`**, **`sections`**: Term structures.

### Question Bank & Examination Blueprints
* **`questions`**: Question Bank items with Bloom taxonomy (`id`, `question_text`, `course_id`, `unit`, `topic`, `marks`, `difficulty`, `bloom_level`, `question_type`, `co_id`, `solution_answer`, `keywords`, `created_by_id`, `created_at`, `status`).
* **`question_options`**: MCQ/MSQ choice options (`id`, `question_id`, `option_text`, `is_correct`).
* **`question_papers`**: Exam blueprints & papers (`id`, `title`, `course_id`, `academic_year`, `max_marks`, `duration_minutes`, `created_by_id`, `status`, `blueprint_metadata` [JSON], `created_at`).
* **`question_paper_questions`**: Paper question layout (`id`, `paper_id`, `question_id`, `section_name`, `order_num`).

### Assessments, Anti-Cheating & Student Submissions
* **`assessments`**: Scheduled assessments (`id`, `title`, `assessment_type`, `course_id`, `max_marks`, `weightage_percent`, `start_time`, `end_time`, `duration_minutes`, `instructions`, `is_online`, `status`, `question_paper_id`, `created_by_id`).
* **`assessment_attempts`**: Student exam sessions with proctoring telemetry (`id`, `assessment_id`, `student_id`, `start_time`, `submit_time`, `status`, `total_score`, `malpractice_flagged`, `tab_switch_count`, `violation_logs` [JSON], `webcam_enabled`, `webcam_snapshots` [JSON]).
* **`student_answers`**: Graded student responses (`id`, `attempt_id`, `question_id`, `selected_option_id`, `descriptive_text`, `marks_awarded`, `evaluator_feedback`, `is_marked_for_review`).

### Marks, CIA Results & OBE Attainment
* **`marks`**: Continuous internal assessment mark entry (`id`, `student_id`, `course_id`, `assessment_id`, `marks_obtained`, `is_absent`, `is_exempted`, `remarks`, `status`, `updated_at`).
* **`results`**: Semester CIA consolidated outcomes (`id`, `student_id`, `course_id`, `academic_year`, `semester_num`, `cia_score`, `cia_max`, `percentage`, `status`, `is_published`, `published_at`).
* **`course_outcomes`**, **`programme_outcomes`**, **`programme_specific_outcomes`**, **`co_po_mappings`**, **`co_pso_mappings`**: OBE outcome mapping matrices.

### Rubrics, Assignments, Resources & Audit Trail
* **`assignments`**, **`assignment_submissions`**, **`rubrics`**, **`rubric_criteria`**, **`rubric_levels`**: Descriptive evaluation models.
* **`learning_resources`**: Ingested syllabus PDFs/DOCX with Pinecone vector counts (`id`, `title`, `filename`, `course_id`, `unit`, `topic`, `chunks_count`, `vectors_count`, `file_size_bytes`, `uploaded_by_id`, `created_at`, `status`).
* **`approval_workflows`**, **`approval_history`**: Exam paper lifecycle audit trail.
* **`audit_logs`**: System security and mutation audit trail (`id`, `user_id`, `action`, `module`, `record_id`, `old_value`, `new_value`, `ip_address`, `timestamp`).
* **`roster_approval_batches`**: Staged bulk student roster onboarding.
