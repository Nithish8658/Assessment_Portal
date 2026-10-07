--
-- PostgreSQL database dump
--

\restrict 4IaJryi6Yhxomoa9CnITOLKRje9yfuxUn9My66kmk1vlHsevb1AMVOF6L9hNF0n

-- Dumped from database version 16.15
-- Dumped by pg_dump version 16.15

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.user_roles DROP CONSTRAINT IF EXISTS user_roles_role_id_fkey;
ALTER TABLE IF EXISTS ONLY public.students DROP CONSTRAINT IF EXISTS students_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.students DROP CONSTRAINT IF EXISTS students_programme_id_fkey;
ALTER TABLE IF EXISTS ONLY public.roster_approval_batches DROP CONSTRAINT IF EXISTS roster_approval_batches_tutor_id_fkey;
ALTER TABLE IF EXISTS ONLY public.roster_approval_batches DROP CONSTRAINT IF EXISTS roster_approval_batches_programme_id_fkey;
ALTER TABLE IF EXISTS ONLY public.roster_approval_batches DROP CONSTRAINT IF EXISTS roster_approval_batches_approved_by_id_fkey;
ALTER TABLE IF EXISTS ONLY public.question_versions DROP CONSTRAINT IF EXISTS question_versions_question_id_fkey;
ALTER TABLE IF EXISTS ONLY public.question_evaluation_configs DROP CONSTRAINT IF EXISTS question_evaluation_configs_question_id_fkey;
ALTER TABLE IF EXISTS ONLY public.programmes DROP CONSTRAINT IF EXISTS programmes_department_id_fkey;
ALTER TABLE IF EXISTS ONLY public.obe_attainment_records DROP CONSTRAINT IF EXISTS obe_attainment_records_student_id_fkey;
ALTER TABLE IF EXISTS ONLY public.notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.faculty DROP CONSTRAINT IF EXISTS fk_faculty_assigned_programme_id;
ALTER TABLE IF EXISTS ONLY public.departments DROP CONSTRAINT IF EXISTS fk_departments_hod_id;
ALTER TABLE IF EXISTS ONLY public.faculty DROP CONSTRAINT IF EXISTS faculty_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.faculty DROP CONSTRAINT IF EXISTS faculty_department_id_fkey;
ALTER TABLE IF EXISTS ONLY public.departments DROP CONSTRAINT IF EXISTS departments_school_id_fkey;
ALTER TABLE IF EXISTS ONLY public.courses DROP CONSTRAINT IF EXISTS courses_programme_id_fkey;
ALTER TABLE IF EXISTS ONLY public.course_enrolments DROP CONSTRAINT IF EXISTS course_enrolments_student_id_fkey;
ALTER TABLE IF EXISTS ONLY public.course_enrolments DROP CONSTRAINT IF EXISTS course_enrolments_course_id_fkey;
ALTER TABLE IF EXISTS ONLY public.course_allocations DROP CONSTRAINT IF EXISTS course_allocations_faculty_id_fkey;
ALTER TABLE IF EXISTS ONLY public.course_allocations DROP CONSTRAINT IF EXISTS course_allocations_course_id_fkey;
ALTER TABLE IF EXISTS ONLY public.competency_scores DROP CONSTRAINT IF EXISTS competency_scores_competency_id_fkey;
ALTER TABLE IF EXISTS ONLY public.competency_scores DROP CONSTRAINT IF EXISTS competency_scores_attempt_id_fkey;
ALTER TABLE IF EXISTS ONLY public.coding_submissions DROP CONSTRAINT IF EXISTS coding_submissions_question_id_fkey;
ALTER TABLE IF EXISTS ONLY public.coding_submissions DROP CONSTRAINT IF EXISTS coding_submissions_attempt_id_fkey;
ALTER TABLE IF EXISTS ONLY public.code_execution_results DROP CONSTRAINT IF EXISTS code_execution_results_submission_id_fkey;
ALTER TABLE IF EXISTS ONLY public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.attempt_question_snapshots DROP CONSTRAINT IF EXISTS attempt_question_snapshots_question_version_id_fkey;
ALTER TABLE IF EXISTS ONLY public.attempt_question_snapshots DROP CONSTRAINT IF EXISTS attempt_question_snapshots_question_id_fkey;
ALTER TABLE IF EXISTS ONLY public.attempt_question_snapshots DROP CONSTRAINT IF EXISTS attempt_question_snapshots_attempt_id_fkey;
ALTER TABLE IF EXISTS ONLY public.assessment_student_allocations DROP CONSTRAINT IF EXISTS assessment_student_allocations_student_id_fkey;
ALTER TABLE IF EXISTS ONLY public.assessment_student_allocations DROP CONSTRAINT IF EXISTS assessment_student_allocations_request_id_fkey;
ALTER TABLE IF EXISTS ONLY public.assessment_rounds DROP CONSTRAINT IF EXISTS assessment_rounds_domain_id_fkey;
ALTER TABLE IF EXISTS ONLY public.assessment_results DROP CONSTRAINT IF EXISTS assessment_results_attempt_id_fkey;
ALTER TABLE IF EXISTS ONLY public.assessment_responses DROP CONSTRAINT IF EXISTS assessment_responses_question_id_fkey;
ALTER TABLE IF EXISTS ONLY public.assessment_responses DROP CONSTRAINT IF EXISTS assessment_responses_attempt_id_fkey;
ALTER TABLE IF EXISTS ONLY public.assessment_reattempt_requests DROP CONSTRAINT IF EXISTS assessment_reattempt_requests_student_id_fkey;
ALTER TABLE IF EXISTS ONLY public.assessment_reattempt_requests DROP CONSTRAINT IF EXISTS assessment_reattempt_requests_round_id_fkey;
ALTER TABLE IF EXISTS ONLY public.assessment_reattempt_requests DROP CONSTRAINT IF EXISTS assessment_reattempt_requests_reviewed_by_id_fkey;
ALTER TABLE IF EXISTS ONLY public.assessment_reattempt_requests DROP CONSTRAINT IF EXISTS assessment_reattempt_requests_requested_by_id_fkey;
ALTER TABLE IF EXISTS ONLY public.assessment_reattempt_requests DROP CONSTRAINT IF EXISTS assessment_reattempt_requests_allocation_id_fkey;
ALTER TABLE IF EXISTS ONLY public.assessment_questions DROP CONSTRAINT IF EXISTS assessment_questions_round_id_fkey;
ALTER TABLE IF EXISTS ONLY public.assessment_questions DROP CONSTRAINT IF EXISTS assessment_questions_competency_id_fkey;
ALTER TABLE IF EXISTS ONLY public.assessment_policies DROP CONSTRAINT IF EXISTS assessment_policies_round_id_fkey;
ALTER TABLE IF EXISTS ONLY public.assessment_attempts DROP CONSTRAINT IF EXISTS assessment_attempts_round_id_fkey;
ALTER TABLE IF EXISTS ONLY public.assessment_attempts DROP CONSTRAINT IF EXISTS assessment_attempts_allocation_id_fkey;
ALTER TABLE IF EXISTS ONLY public.assessment_activation_requests DROP CONSTRAINT IF EXISTS assessment_activation_requests_reviewed_by_id_fkey;
ALTER TABLE IF EXISTS ONLY public.assessment_activation_requests DROP CONSTRAINT IF EXISTS assessment_activation_requests_requested_by_id_fkey;
ALTER TABLE IF EXISTS ONLY public.assessment_activation_requests DROP CONSTRAINT IF EXISTS assessment_activation_requests_domain_id_fkey;
ALTER TABLE IF EXISTS ONLY public.assessment_activation_requests DROP CONSTRAINT IF EXISTS assessment_activation_requests_academic_class_id_fkey;
ALTER TABLE IF EXISTS ONLY public.assessment_activation_candidates DROP CONSTRAINT IF EXISTS assessment_activation_candidates_student_id_fkey;
ALTER TABLE IF EXISTS ONLY public.assessment_activation_candidates DROP CONSTRAINT IF EXISTS assessment_activation_candidates_request_id_fkey;
ALTER TABLE IF EXISTS ONLY public.allocation_approval_history DROP CONSTRAINT IF EXISTS allocation_approval_history_performed_by_faculty_id_fkey;
ALTER TABLE IF EXISTS ONLY public.academic_scopes DROP CONSTRAINT IF EXISTS academic_scopes_section_id_fkey;
ALTER TABLE IF EXISTS ONLY public.academic_scopes DROP CONSTRAINT IF EXISTS academic_scopes_programme_id_fkey;
ALTER TABLE IF EXISTS ONLY public.academic_scopes DROP CONSTRAINT IF EXISTS academic_scopes_faculty_id_fkey;
ALTER TABLE IF EXISTS ONLY public.academic_scopes DROP CONSTRAINT IF EXISTS academic_scopes_department_id_fkey;
ALTER TABLE IF EXISTS ONLY public.academic_scopes DROP CONSTRAINT IF EXISTS academic_scopes_batch_id_fkey;
ALTER TABLE IF EXISTS ONLY public.academic_classes DROP CONSTRAINT IF EXISTS academic_classes_tutor_id_fkey;
ALTER TABLE IF EXISTS ONLY public.academic_classes DROP CONSTRAINT IF EXISTS academic_classes_programme_id_fkey;
DROP INDEX IF EXISTS public.ix_users_username;
DROP INDEX IF EXISTS public.ix_users_id;
DROP INDEX IF EXISTS public.ix_students_register_number;
DROP INDEX IF EXISTS public.ix_students_id;
DROP INDEX IF EXISTS public.ix_semesters_id;
DROP INDEX IF EXISTS public.ix_sections_id;
DROP INDEX IF EXISTS public.ix_schools_id;
DROP INDEX IF EXISTS public.ix_roster_approval_batches_id;
DROP INDEX IF EXISTS public.ix_roles_id;
DROP INDEX IF EXISTS public.ix_reattempt_req_status;
DROP INDEX IF EXISTS public.ix_reattempt_req_allocation_round;
DROP INDEX IF EXISTS public.ix_question_versions_question_id;
DROP INDEX IF EXISTS public.ix_question_versions_id;
DROP INDEX IF EXISTS public.ix_question_version_composite;
DROP INDEX IF EXISTS public.ix_question_evaluation_configs_id;
DROP INDEX IF EXISTS public.ix_programmes_id;
DROP INDEX IF EXISTS public.ix_proctoring_events_id;
DROP INDEX IF EXISTS public.ix_obe_attainment_records_id;
DROP INDEX IF EXISTS public.ix_notifications_id;
DROP INDEX IF EXISTS public.ix_faculty_id;
DROP INDEX IF EXISTS public.ix_faculty_employee_id;
DROP INDEX IF EXISTS public.ix_departments_id;
DROP INDEX IF EXISTS public.ix_courses_id;
DROP INDEX IF EXISTS public.ix_courses_code;
DROP INDEX IF EXISTS public.ix_course_enrolments_id;
DROP INDEX IF EXISTS public.ix_course_allocations_id;
DROP INDEX IF EXISTS public.ix_competency_scores_id;
DROP INDEX IF EXISTS public.ix_competency_scores_competency_id;
DROP INDEX IF EXISTS public.ix_competency_scores_attempt_id;
DROP INDEX IF EXISTS public.ix_competencies_id;
DROP INDEX IF EXISTS public.ix_competencies_code;
DROP INDEX IF EXISTS public.ix_coding_submissions_id;
DROP INDEX IF EXISTS public.ix_coding_submissions_attempt_id;
DROP INDEX IF EXISTS public.ix_code_execution_results_submission_id;
DROP INDEX IF EXISTS public.ix_code_execution_results_id;
DROP INDEX IF EXISTS public.ix_batches_id;
DROP INDEX IF EXISTS public.ix_audit_logs_id;
DROP INDEX IF EXISTS public.ix_attempt_status;
DROP INDEX IF EXISTS public.ix_attempt_question_snapshots_id;
DROP INDEX IF EXISTS public.ix_attempt_question_snapshots_attempt_id;
DROP INDEX IF EXISTS public.ix_attempt_allocation_round;
DROP INDEX IF EXISTS public.ix_assessment_student_allocations_student_id;
DROP INDEX IF EXISTS public.ix_assessment_student_allocations_status;
DROP INDEX IF EXISTS public.ix_assessment_student_allocations_request_id;
DROP INDEX IF EXISTS public.ix_assessment_student_allocations_id;
DROP INDEX IF EXISTS public.ix_assessment_rounds_slug;
DROP INDEX IF EXISTS public.ix_assessment_rounds_id;
DROP INDEX IF EXISTS public.ix_assessment_rounds_domain_id;
DROP INDEX IF EXISTS public.ix_assessment_results_id;
DROP INDEX IF EXISTS public.ix_assessment_responses_id;
DROP INDEX IF EXISTS public.ix_assessment_responses_attempt_id;
DROP INDEX IF EXISTS public.ix_assessment_reattempt_requests_student_id;
DROP INDEX IF EXISTS public.ix_assessment_reattempt_requests_status;
DROP INDEX IF EXISTS public.ix_assessment_reattempt_requests_round_id;
DROP INDEX IF EXISTS public.ix_assessment_reattempt_requests_id;
DROP INDEX IF EXISTS public.ix_assessment_reattempt_requests_allocation_id;
DROP INDEX IF EXISTS public.ix_assessment_questions_round_id;
DROP INDEX IF EXISTS public.ix_assessment_questions_id;
DROP INDEX IF EXISTS public.ix_assessment_questions_competency_id;
DROP INDEX IF EXISTS public.ix_assessment_policies_id;
DROP INDEX IF EXISTS public.ix_assessment_domains_slug;
DROP INDEX IF EXISTS public.ix_assessment_domains_id;
DROP INDEX IF EXISTS public.ix_assessment_attempts_status;
DROP INDEX IF EXISTS public.ix_assessment_attempts_round_id;
DROP INDEX IF EXISTS public.ix_assessment_attempts_id;
DROP INDEX IF EXISTS public.ix_assessment_attempts_allocation_id;
DROP INDEX IF EXISTS public.ix_assessment_activation_requests_status;
DROP INDEX IF EXISTS public.ix_assessment_activation_requests_id;
DROP INDEX IF EXISTS public.ix_assessment_activation_requests_domain_id;
DROP INDEX IF EXISTS public.ix_assessment_activation_requests_academic_class_id;
DROP INDEX IF EXISTS public.ix_assessment_activation_candidates_student_id;
DROP INDEX IF EXISTS public.ix_assessment_activation_candidates_request_id;
DROP INDEX IF EXISTS public.ix_assessment_activation_candidates_id;
DROP INDEX IF EXISTS public.ix_allocation_student_status;
DROP INDEX IF EXISTS public.ix_allocation_approval_history_id;
DROP INDEX IF EXISTS public.ix_academic_years_id;
DROP INDEX IF EXISTS public.ix_academic_scopes_id;
DROP INDEX IF EXISTS public.ix_academic_classes_id;
DROP INDEX IF EXISTS public.ix_academic_classes_class_code;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_key;
ALTER TABLE IF EXISTS ONLY public.user_roles DROP CONSTRAINT IF EXISTS user_roles_pkey;
ALTER TABLE IF EXISTS ONLY public.assessment_student_allocations DROP CONSTRAINT IF EXISTS uq_request_student_allocation;
ALTER TABLE IF EXISTS ONLY public.assessment_activation_candidates DROP CONSTRAINT IF EXISTS uq_request_candidate;
ALTER TABLE IF EXISTS ONLY public.question_versions DROP CONSTRAINT IF EXISTS uq_question_version;
ALTER TABLE IF EXISTS ONLY public.assessment_rounds DROP CONSTRAINT IF EXISTS uq_domain_round_slug;
ALTER TABLE IF EXISTS ONLY public.assessment_rounds DROP CONSTRAINT IF EXISTS uq_domain_round_number;
ALTER TABLE IF EXISTS ONLY public.assessment_responses DROP CONSTRAINT IF EXISTS uq_attempt_question_response;
ALTER TABLE IF EXISTS ONLY public.assessment_attempts DROP CONSTRAINT IF EXISTS uq_allocation_round_attempt_num;
ALTER TABLE IF EXISTS ONLY public.students DROP CONSTRAINT IF EXISTS students_user_id_key;
ALTER TABLE IF EXISTS ONLY public.students DROP CONSTRAINT IF EXISTS students_pkey;
ALTER TABLE IF EXISTS ONLY public.semesters DROP CONSTRAINT IF EXISTS semesters_pkey;
ALTER TABLE IF EXISTS ONLY public.sections DROP CONSTRAINT IF EXISTS sections_pkey;
ALTER TABLE IF EXISTS ONLY public.schools DROP CONSTRAINT IF EXISTS schools_pkey;
ALTER TABLE IF EXISTS ONLY public.schools DROP CONSTRAINT IF EXISTS schools_code_key;
ALTER TABLE IF EXISTS ONLY public.roster_approval_batches DROP CONSTRAINT IF EXISTS roster_approval_batches_pkey;
ALTER TABLE IF EXISTS ONLY public.roles DROP CONSTRAINT IF EXISTS roles_pkey;
ALTER TABLE IF EXISTS ONLY public.roles DROP CONSTRAINT IF EXISTS roles_name_key;
ALTER TABLE IF EXISTS ONLY public.question_versions DROP CONSTRAINT IF EXISTS question_versions_pkey;
ALTER TABLE IF EXISTS ONLY public.question_evaluation_configs DROP CONSTRAINT IF EXISTS question_evaluation_configs_question_id_key;
ALTER TABLE IF EXISTS ONLY public.question_evaluation_configs DROP CONSTRAINT IF EXISTS question_evaluation_configs_pkey;
ALTER TABLE IF EXISTS ONLY public.programmes DROP CONSTRAINT IF EXISTS programmes_pkey;
ALTER TABLE IF EXISTS ONLY public.programmes DROP CONSTRAINT IF EXISTS programmes_code_key;
ALTER TABLE IF EXISTS ONLY public.proctoring_events DROP CONSTRAINT IF EXISTS proctoring_events_pkey;
ALTER TABLE IF EXISTS ONLY public.obe_attainment_records DROP CONSTRAINT IF EXISTS obe_attainment_records_pkey;
ALTER TABLE IF EXISTS ONLY public.notifications DROP CONSTRAINT IF EXISTS notifications_pkey;
ALTER TABLE IF EXISTS ONLY public.faculty DROP CONSTRAINT IF EXISTS faculty_user_id_key;
ALTER TABLE IF EXISTS ONLY public.faculty DROP CONSTRAINT IF EXISTS faculty_pkey;
ALTER TABLE IF EXISTS ONLY public.departments DROP CONSTRAINT IF EXISTS departments_pkey;
ALTER TABLE IF EXISTS ONLY public.departments DROP CONSTRAINT IF EXISTS departments_code_key;
ALTER TABLE IF EXISTS ONLY public.courses DROP CONSTRAINT IF EXISTS courses_pkey;
ALTER TABLE IF EXISTS ONLY public.course_enrolments DROP CONSTRAINT IF EXISTS course_enrolments_pkey;
ALTER TABLE IF EXISTS ONLY public.course_allocations DROP CONSTRAINT IF EXISTS course_allocations_pkey;
ALTER TABLE IF EXISTS ONLY public.competency_scores DROP CONSTRAINT IF EXISTS competency_scores_pkey;
ALTER TABLE IF EXISTS ONLY public.competencies DROP CONSTRAINT IF EXISTS competencies_pkey;
ALTER TABLE IF EXISTS ONLY public.coding_submissions DROP CONSTRAINT IF EXISTS coding_submissions_pkey;
ALTER TABLE IF EXISTS ONLY public.code_execution_results DROP CONSTRAINT IF EXISTS code_execution_results_pkey;
ALTER TABLE IF EXISTS ONLY public.batches DROP CONSTRAINT IF EXISTS batches_pkey;
ALTER TABLE IF EXISTS ONLY public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_pkey;
ALTER TABLE IF EXISTS ONLY public.attempt_question_snapshots DROP CONSTRAINT IF EXISTS attempt_question_snapshots_pkey;
ALTER TABLE IF EXISTS ONLY public.assessment_student_allocations DROP CONSTRAINT IF EXISTS assessment_student_allocations_pkey;
ALTER TABLE IF EXISTS ONLY public.assessment_rounds DROP CONSTRAINT IF EXISTS assessment_rounds_pkey;
ALTER TABLE IF EXISTS ONLY public.assessment_results DROP CONSTRAINT IF EXISTS assessment_results_pkey;
ALTER TABLE IF EXISTS ONLY public.assessment_results DROP CONSTRAINT IF EXISTS assessment_results_attempt_id_key;
ALTER TABLE IF EXISTS ONLY public.assessment_responses DROP CONSTRAINT IF EXISTS assessment_responses_pkey;
ALTER TABLE IF EXISTS ONLY public.assessment_reattempt_requests DROP CONSTRAINT IF EXISTS assessment_reattempt_requests_pkey;
ALTER TABLE IF EXISTS ONLY public.assessment_questions DROP CONSTRAINT IF EXISTS assessment_questions_pkey;
ALTER TABLE IF EXISTS ONLY public.assessment_policies DROP CONSTRAINT IF EXISTS assessment_policies_round_id_key;
ALTER TABLE IF EXISTS ONLY public.assessment_policies DROP CONSTRAINT IF EXISTS assessment_policies_pkey;
ALTER TABLE IF EXISTS ONLY public.assessment_domains DROP CONSTRAINT IF EXISTS assessment_domains_pkey;
ALTER TABLE IF EXISTS ONLY public.assessment_attempts DROP CONSTRAINT IF EXISTS assessment_attempts_pkey;
ALTER TABLE IF EXISTS ONLY public.assessment_activation_requests DROP CONSTRAINT IF EXISTS assessment_activation_requests_pkey;
ALTER TABLE IF EXISTS ONLY public.assessment_activation_candidates DROP CONSTRAINT IF EXISTS assessment_activation_candidates_pkey;
ALTER TABLE IF EXISTS ONLY public.allocation_approval_history DROP CONSTRAINT IF EXISTS allocation_approval_history_pkey;
ALTER TABLE IF EXISTS ONLY public.academic_years DROP CONSTRAINT IF EXISTS academic_years_year_code_key;
ALTER TABLE IF EXISTS ONLY public.academic_years DROP CONSTRAINT IF EXISTS academic_years_pkey;
ALTER TABLE IF EXISTS ONLY public.academic_scopes DROP CONSTRAINT IF EXISTS academic_scopes_pkey;
ALTER TABLE IF EXISTS ONLY public.academic_classes DROP CONSTRAINT IF EXISTS academic_classes_pkey;
ALTER TABLE IF EXISTS public.users ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.students ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.semesters ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.sections ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.schools ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.roster_approval_batches ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.roles ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.question_versions ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.question_evaluation_configs ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.programmes ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.proctoring_events ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.obe_attainment_records ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.notifications ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.faculty ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.departments ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.courses ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.course_enrolments ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.course_allocations ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.competency_scores ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.competencies ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.coding_submissions ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.code_execution_results ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.batches ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.audit_logs ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.attempt_question_snapshots ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.assessment_student_allocations ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.assessment_rounds ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.assessment_results ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.assessment_responses ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.assessment_reattempt_requests ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.assessment_questions ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.assessment_policies ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.assessment_domains ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.assessment_attempts ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.assessment_activation_requests ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.assessment_activation_candidates ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.allocation_approval_history ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.academic_years ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.academic_scopes ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.academic_classes ALTER COLUMN id DROP DEFAULT;
DROP SEQUENCE IF EXISTS public.users_id_seq;
DROP TABLE IF EXISTS public.users;
DROP TABLE IF EXISTS public.user_roles;
DROP SEQUENCE IF EXISTS public.students_id_seq;
DROP TABLE IF EXISTS public.students;
DROP SEQUENCE IF EXISTS public.semesters_id_seq;
DROP TABLE IF EXISTS public.semesters;
DROP SEQUENCE IF EXISTS public.sections_id_seq;
DROP TABLE IF EXISTS public.sections;
DROP SEQUENCE IF EXISTS public.schools_id_seq;
DROP TABLE IF EXISTS public.schools;
DROP SEQUENCE IF EXISTS public.roster_approval_batches_id_seq;
DROP TABLE IF EXISTS public.roster_approval_batches;
DROP SEQUENCE IF EXISTS public.roles_id_seq;
DROP TABLE IF EXISTS public.roles;
DROP SEQUENCE IF EXISTS public.question_versions_id_seq;
DROP TABLE IF EXISTS public.question_versions;
DROP SEQUENCE IF EXISTS public.question_evaluation_configs_id_seq;
DROP TABLE IF EXISTS public.question_evaluation_configs;
DROP SEQUENCE IF EXISTS public.programmes_id_seq;
DROP TABLE IF EXISTS public.programmes;
DROP SEQUENCE IF EXISTS public.proctoring_events_id_seq;
DROP TABLE IF EXISTS public.proctoring_events;
DROP SEQUENCE IF EXISTS public.obe_attainment_records_id_seq;
DROP TABLE IF EXISTS public.obe_attainment_records;
DROP SEQUENCE IF EXISTS public.notifications_id_seq;
DROP TABLE IF EXISTS public.notifications;
DROP SEQUENCE IF EXISTS public.faculty_id_seq;
DROP TABLE IF EXISTS public.faculty;
DROP SEQUENCE IF EXISTS public.departments_id_seq;
DROP TABLE IF EXISTS public.departments;
DROP SEQUENCE IF EXISTS public.courses_id_seq;
DROP TABLE IF EXISTS public.courses;
DROP SEQUENCE IF EXISTS public.course_enrolments_id_seq;
DROP TABLE IF EXISTS public.course_enrolments;
DROP SEQUENCE IF EXISTS public.course_allocations_id_seq;
DROP TABLE IF EXISTS public.course_allocations;
DROP SEQUENCE IF EXISTS public.competency_scores_id_seq;
DROP TABLE IF EXISTS public.competency_scores;
DROP SEQUENCE IF EXISTS public.competencies_id_seq;
DROP TABLE IF EXISTS public.competencies;
DROP SEQUENCE IF EXISTS public.coding_submissions_id_seq;
DROP TABLE IF EXISTS public.coding_submissions;
DROP SEQUENCE IF EXISTS public.code_execution_results_id_seq;
DROP TABLE IF EXISTS public.code_execution_results;
DROP SEQUENCE IF EXISTS public.batches_id_seq;
DROP TABLE IF EXISTS public.batches;
DROP SEQUENCE IF EXISTS public.audit_logs_id_seq;
DROP TABLE IF EXISTS public.audit_logs;
DROP SEQUENCE IF EXISTS public.attempt_question_snapshots_id_seq;
DROP TABLE IF EXISTS public.attempt_question_snapshots;
DROP SEQUENCE IF EXISTS public.assessment_student_allocations_id_seq;
DROP TABLE IF EXISTS public.assessment_student_allocations;
DROP SEQUENCE IF EXISTS public.assessment_rounds_id_seq;
DROP TABLE IF EXISTS public.assessment_rounds;
DROP SEQUENCE IF EXISTS public.assessment_results_id_seq;
DROP TABLE IF EXISTS public.assessment_results;
DROP SEQUENCE IF EXISTS public.assessment_responses_id_seq;
DROP TABLE IF EXISTS public.assessment_responses;
DROP SEQUENCE IF EXISTS public.assessment_reattempt_requests_id_seq;
DROP TABLE IF EXISTS public.assessment_reattempt_requests;
DROP SEQUENCE IF EXISTS public.assessment_questions_id_seq;
DROP TABLE IF EXISTS public.assessment_questions;
DROP SEQUENCE IF EXISTS public.assessment_policies_id_seq;
DROP TABLE IF EXISTS public.assessment_policies;
DROP SEQUENCE IF EXISTS public.assessment_domains_id_seq;
DROP TABLE IF EXISTS public.assessment_domains;
DROP SEQUENCE IF EXISTS public.assessment_attempts_id_seq;
DROP TABLE IF EXISTS public.assessment_attempts;
DROP SEQUENCE IF EXISTS public.assessment_activation_requests_id_seq;
DROP TABLE IF EXISTS public.assessment_activation_requests;
DROP SEQUENCE IF EXISTS public.assessment_activation_candidates_id_seq;
DROP TABLE IF EXISTS public.assessment_activation_candidates;
DROP SEQUENCE IF EXISTS public.allocation_approval_history_id_seq;
DROP TABLE IF EXISTS public.allocation_approval_history;
DROP SEQUENCE IF EXISTS public.academic_years_id_seq;
DROP TABLE IF EXISTS public.academic_years;
DROP SEQUENCE IF EXISTS public.academic_scopes_id_seq;
DROP TABLE IF EXISTS public.academic_scopes;
DROP SEQUENCE IF EXISTS public.academic_classes_id_seq;
DROP TABLE IF EXISTS public.academic_classes;
--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: pg_database_owner
--

COMMENT ON SCHEMA public IS '';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: academic_classes; Type: TABLE; Schema: public; Owner: nasc_admin
--

CREATE TABLE public.academic_classes (
    id integer NOT NULL,
    class_code character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    programme_id integer,
    batch_name character varying(50) NOT NULL,
    semester_num integer,
    section_name character varying(10),
    tutor_id integer
);


ALTER TABLE public.academic_classes OWNER TO nasc_admin;

--
-- Name: academic_classes_id_seq; Type: SEQUENCE; Schema: public; Owner: nasc_admin
--

CREATE SEQUENCE public.academic_classes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.academic_classes_id_seq OWNER TO nasc_admin;

--
-- Name: academic_classes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nasc_admin
--

ALTER SEQUENCE public.academic_classes_id_seq OWNED BY public.academic_classes.id;


--
-- Name: academic_scopes; Type: TABLE; Schema: public; Owner: nasc_admin
--

CREATE TABLE public.academic_scopes (
    id integer NOT NULL,
    faculty_id integer NOT NULL,
    department_id integer,
    programme_id integer,
    batch_id integer,
    section_id integer,
    role_type character varying(32) NOT NULL,
    is_active boolean,
    created_at timestamp without time zone
);


ALTER TABLE public.academic_scopes OWNER TO nasc_admin;

--
-- Name: academic_scopes_id_seq; Type: SEQUENCE; Schema: public; Owner: nasc_admin
--

CREATE SEQUENCE public.academic_scopes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.academic_scopes_id_seq OWNER TO nasc_admin;

--
-- Name: academic_scopes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nasc_admin
--

ALTER SEQUENCE public.academic_scopes_id_seq OWNED BY public.academic_scopes.id;


--
-- Name: academic_years; Type: TABLE; Schema: public; Owner: nasc_admin
--

CREATE TABLE public.academic_years (
    id integer NOT NULL,
    year_code character varying(20) NOT NULL,
    is_current boolean
);


ALTER TABLE public.academic_years OWNER TO nasc_admin;

--
-- Name: academic_years_id_seq; Type: SEQUENCE; Schema: public; Owner: nasc_admin
--

CREATE SEQUENCE public.academic_years_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.academic_years_id_seq OWNER TO nasc_admin;

--
-- Name: academic_years_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nasc_admin
--

ALTER SEQUENCE public.academic_years_id_seq OWNED BY public.academic_years.id;


--
-- Name: allocation_approval_history; Type: TABLE; Schema: public; Owner: nasc_admin
--

CREATE TABLE public.allocation_approval_history (
    id integer NOT NULL,
    allocation_id integer NOT NULL,
    action character varying(32) NOT NULL,
    performed_by_faculty_id integer NOT NULL,
    comments text,
    previous_status character varying(32),
    new_status character varying(32) NOT NULL,
    config_snapshot_json json,
    created_at timestamp without time zone
);


ALTER TABLE public.allocation_approval_history OWNER TO nasc_admin;

--
-- Name: allocation_approval_history_id_seq; Type: SEQUENCE; Schema: public; Owner: nasc_admin
--

CREATE SEQUENCE public.allocation_approval_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.allocation_approval_history_id_seq OWNER TO nasc_admin;

--
-- Name: allocation_approval_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nasc_admin
--

ALTER SEQUENCE public.allocation_approval_history_id_seq OWNED BY public.allocation_approval_history.id;


--
-- Name: assessment_activation_candidates; Type: TABLE; Schema: public; Owner: nasc_admin
--

CREATE TABLE public.assessment_activation_candidates (
    id integer NOT NULL,
    request_id integer NOT NULL,
    student_id integer NOT NULL
);


ALTER TABLE public.assessment_activation_candidates OWNER TO nasc_admin;

--
-- Name: assessment_activation_candidates_id_seq; Type: SEQUENCE; Schema: public; Owner: nasc_admin
--

CREATE SEQUENCE public.assessment_activation_candidates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.assessment_activation_candidates_id_seq OWNER TO nasc_admin;

--
-- Name: assessment_activation_candidates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nasc_admin
--

ALTER SEQUENCE public.assessment_activation_candidates_id_seq OWNED BY public.assessment_activation_candidates.id;


--
-- Name: assessment_activation_requests; Type: TABLE; Schema: public; Owner: nasc_admin
--

CREATE TABLE public.assessment_activation_requests (
    id integer NOT NULL,
    domain_id integer NOT NULL,
    academic_class_id integer NOT NULL,
    requested_by_id integer NOT NULL,
    reviewed_by_id integer,
    status character varying(30) NOT NULL,
    valid_from timestamp without time zone NOT NULL,
    valid_until timestamp without time zone NOT NULL,
    notes text,
    rejection_reason text,
    requested_at timestamp without time zone NOT NULL,
    reviewed_at timestamp without time zone,
    selected_rounds_json jsonb
);


ALTER TABLE public.assessment_activation_requests OWNER TO nasc_admin;

--
-- Name: assessment_activation_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: nasc_admin
--

CREATE SEQUENCE public.assessment_activation_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.assessment_activation_requests_id_seq OWNER TO nasc_admin;

--
-- Name: assessment_activation_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nasc_admin
--

ALTER SEQUENCE public.assessment_activation_requests_id_seq OWNED BY public.assessment_activation_requests.id;


--
-- Name: assessment_attempts; Type: TABLE; Schema: public; Owner: nasc_admin
--

CREATE TABLE public.assessment_attempts (
    id integer NOT NULL,
    allocation_id integer NOT NULL,
    round_id integer NOT NULL,
    status character varying(32) NOT NULL,
    score double precision NOT NULL,
    percentage double precision NOT NULL,
    passed boolean NOT NULL,
    evaluation_details_json json NOT NULL,
    started_at timestamp without time zone NOT NULL,
    last_activity_at timestamp without time zone NOT NULL,
    submitted_at timestamp without time zone,
    attempt_number integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.assessment_attempts OWNER TO nasc_admin;

--
-- Name: assessment_attempts_id_seq; Type: SEQUENCE; Schema: public; Owner: nasc_admin
--

CREATE SEQUENCE public.assessment_attempts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.assessment_attempts_id_seq OWNER TO nasc_admin;

--
-- Name: assessment_attempts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nasc_admin
--

ALTER SEQUENCE public.assessment_attempts_id_seq OWNED BY public.assessment_attempts.id;


--
-- Name: assessment_domains; Type: TABLE; Schema: public; Owner: nasc_admin
--

CREATE TABLE public.assessment_domains (
    id integer NOT NULL,
    slug character varying(64) NOT NULL,
    title character varying(128) NOT NULL,
    description text,
    icon_name character varying(32),
    is_active boolean,
    created_at timestamp without time zone
);


ALTER TABLE public.assessment_domains OWNER TO nasc_admin;

--
-- Name: assessment_domains_id_seq; Type: SEQUENCE; Schema: public; Owner: nasc_admin
--

CREATE SEQUENCE public.assessment_domains_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.assessment_domains_id_seq OWNER TO nasc_admin;

--
-- Name: assessment_domains_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nasc_admin
--

ALTER SEQUENCE public.assessment_domains_id_seq OWNED BY public.assessment_domains.id;


--
-- Name: assessment_policies; Type: TABLE; Schema: public; Owner: nasc_admin
--

CREATE TABLE public.assessment_policies (
    id integer NOT NULL,
    round_id integer NOT NULL,
    passing_score double precision NOT NULL,
    weightage_percent double precision NOT NULL,
    min_score_percent double precision NOT NULL,
    mandatory_pass boolean NOT NULL
);


ALTER TABLE public.assessment_policies OWNER TO nasc_admin;

--
-- Name: assessment_policies_id_seq; Type: SEQUENCE; Schema: public; Owner: nasc_admin
--

CREATE SEQUENCE public.assessment_policies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.assessment_policies_id_seq OWNER TO nasc_admin;

--
-- Name: assessment_policies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nasc_admin
--

ALTER SEQUENCE public.assessment_policies_id_seq OWNED BY public.assessment_policies.id;


--
-- Name: assessment_questions; Type: TABLE; Schema: public; Owner: nasc_admin
--

CREATE TABLE public.assessment_questions (
    id integer NOT NULL,
    round_id integer NOT NULL,
    competency_id integer,
    question_type character varying(32) NOT NULL,
    title character varying(256) NOT NULL,
    candidate_content text NOT NULL,
    candidate_code_template text,
    options_json json,
    difficulty character varying(16) NOT NULL,
    marks double precision NOT NULL,
    time_limit_seconds integer NOT NULL,
    version integer NOT NULL,
    status character varying(16) NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


ALTER TABLE public.assessment_questions OWNER TO nasc_admin;

--
-- Name: assessment_questions_id_seq; Type: SEQUENCE; Schema: public; Owner: nasc_admin
--

CREATE SEQUENCE public.assessment_questions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.assessment_questions_id_seq OWNER TO nasc_admin;

--
-- Name: assessment_questions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nasc_admin
--

ALTER SEQUENCE public.assessment_questions_id_seq OWNED BY public.assessment_questions.id;


--
-- Name: assessment_reattempt_requests; Type: TABLE; Schema: public; Owner: nasc_admin
--

CREATE TABLE public.assessment_reattempt_requests (
    id integer NOT NULL,
    allocation_id integer NOT NULL,
    round_id integer NOT NULL,
    student_id integer NOT NULL,
    requested_by_id integer NOT NULL,
    reviewed_by_id integer,
    status character varying(30) NOT NULL,
    attempt_number integer NOT NULL,
    reason text,
    rejection_reason text,
    created_at timestamp without time zone NOT NULL,
    reviewed_at timestamp without time zone
);


ALTER TABLE public.assessment_reattempt_requests OWNER TO nasc_admin;

--
-- Name: assessment_reattempt_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: nasc_admin
--

CREATE SEQUENCE public.assessment_reattempt_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.assessment_reattempt_requests_id_seq OWNER TO nasc_admin;

--
-- Name: assessment_reattempt_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nasc_admin
--

ALTER SEQUENCE public.assessment_reattempt_requests_id_seq OWNED BY public.assessment_reattempt_requests.id;


--
-- Name: assessment_responses; Type: TABLE; Schema: public; Owner: nasc_admin
--

CREATE TABLE public.assessment_responses (
    id integer NOT NULL,
    attempt_id integer NOT NULL,
    question_id integer NOT NULL,
    response_payload text,
    auto_saved_at timestamp without time zone NOT NULL,
    is_marked_for_review boolean NOT NULL
);


ALTER TABLE public.assessment_responses OWNER TO nasc_admin;

--
-- Name: assessment_responses_id_seq; Type: SEQUENCE; Schema: public; Owner: nasc_admin
--

CREATE SEQUENCE public.assessment_responses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.assessment_responses_id_seq OWNER TO nasc_admin;

--
-- Name: assessment_responses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nasc_admin
--

ALTER SEQUENCE public.assessment_responses_id_seq OWNED BY public.assessment_responses.id;


--
-- Name: assessment_results; Type: TABLE; Schema: public; Owner: nasc_admin
--

CREATE TABLE public.assessment_results (
    id integer NOT NULL,
    attempt_id integer NOT NULL,
    total_score double precision NOT NULL,
    max_score double precision NOT NULL,
    percentage double precision NOT NULL,
    passed boolean NOT NULL,
    readiness_index character varying(32) NOT NULL,
    evaluated_at timestamp without time zone NOT NULL
);


ALTER TABLE public.assessment_results OWNER TO nasc_admin;

--
-- Name: assessment_results_id_seq; Type: SEQUENCE; Schema: public; Owner: nasc_admin
--

CREATE SEQUENCE public.assessment_results_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.assessment_results_id_seq OWNER TO nasc_admin;

--
-- Name: assessment_results_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nasc_admin
--

ALTER SEQUENCE public.assessment_results_id_seq OWNED BY public.assessment_results.id;


--
-- Name: assessment_rounds; Type: TABLE; Schema: public; Owner: nasc_admin
--

CREATE TABLE public.assessment_rounds (
    id integer NOT NULL,
    domain_id integer NOT NULL,
    round_number integer NOT NULL,
    slug character varying(64) NOT NULL,
    title character varying(128) NOT NULL,
    description text,
    round_type character varying(32) NOT NULL,
    duration_minutes integer NOT NULL,
    questions_per_attempt integer NOT NULL,
    rules_json json NOT NULL
);


ALTER TABLE public.assessment_rounds OWNER TO nasc_admin;

--
-- Name: assessment_rounds_id_seq; Type: SEQUENCE; Schema: public; Owner: nasc_admin
--

CREATE SEQUENCE public.assessment_rounds_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.assessment_rounds_id_seq OWNER TO nasc_admin;

--
-- Name: assessment_rounds_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nasc_admin
--

ALTER SEQUENCE public.assessment_rounds_id_seq OWNED BY public.assessment_rounds.id;


--
-- Name: assessment_student_allocations; Type: TABLE; Schema: public; Owner: nasc_admin
--

CREATE TABLE public.assessment_student_allocations (
    id integer NOT NULL,
    request_id integer NOT NULL,
    student_id integer NOT NULL,
    status character varying(30) NOT NULL,
    source character varying(50) NOT NULL,
    valid_from timestamp without time zone NOT NULL,
    valid_until timestamp without time zone NOT NULL,
    allocated_at timestamp without time zone NOT NULL
);


ALTER TABLE public.assessment_student_allocations OWNER TO nasc_admin;

--
-- Name: assessment_student_allocations_id_seq; Type: SEQUENCE; Schema: public; Owner: nasc_admin
--

CREATE SEQUENCE public.assessment_student_allocations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.assessment_student_allocations_id_seq OWNER TO nasc_admin;

--
-- Name: assessment_student_allocations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nasc_admin
--

ALTER SEQUENCE public.assessment_student_allocations_id_seq OWNED BY public.assessment_student_allocations.id;


--
-- Name: attempt_question_snapshots; Type: TABLE; Schema: public; Owner: nasc_admin
--

CREATE TABLE public.attempt_question_snapshots (
    id integer NOT NULL,
    attempt_id integer NOT NULL,
    question_id integer NOT NULL,
    question_version_id integer,
    snapshot_content_json json NOT NULL
);


ALTER TABLE public.attempt_question_snapshots OWNER TO nasc_admin;

--
-- Name: attempt_question_snapshots_id_seq; Type: SEQUENCE; Schema: public; Owner: nasc_admin
--

CREATE SEQUENCE public.attempt_question_snapshots_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.attempt_question_snapshots_id_seq OWNER TO nasc_admin;

--
-- Name: attempt_question_snapshots_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nasc_admin
--

ALTER SEQUENCE public.attempt_question_snapshots_id_seq OWNED BY public.attempt_question_snapshots.id;


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: nasc_admin
--

CREATE TABLE public.audit_logs (
    id integer NOT NULL,
    user_id integer,
    action character varying(100) NOT NULL,
    module character varying(50) NOT NULL,
    record_id character varying(50),
    old_value text,
    new_value text,
    ip_address character varying(50),
    "timestamp" timestamp without time zone
);


ALTER TABLE public.audit_logs OWNER TO nasc_admin;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: nasc_admin
--

CREATE SEQUENCE public.audit_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.audit_logs_id_seq OWNER TO nasc_admin;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nasc_admin
--

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;


--
-- Name: batches; Type: TABLE; Schema: public; Owner: nasc_admin
--

CREATE TABLE public.batches (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    start_year integer NOT NULL,
    end_year integer NOT NULL
);


ALTER TABLE public.batches OWNER TO nasc_admin;

--
-- Name: batches_id_seq; Type: SEQUENCE; Schema: public; Owner: nasc_admin
--

CREATE SEQUENCE public.batches_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.batches_id_seq OWNER TO nasc_admin;

--
-- Name: batches_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nasc_admin
--

ALTER SEQUENCE public.batches_id_seq OWNED BY public.batches.id;


--
-- Name: code_execution_results; Type: TABLE; Schema: public; Owner: nasc_admin
--

CREATE TABLE public.code_execution_results (
    id integer NOT NULL,
    submission_id integer NOT NULL,
    test_case_index integer NOT NULL,
    is_passed boolean NOT NULL,
    actual_output text,
    error_output text,
    execution_time_ms double precision NOT NULL
);


ALTER TABLE public.code_execution_results OWNER TO nasc_admin;

--
-- Name: code_execution_results_id_seq; Type: SEQUENCE; Schema: public; Owner: nasc_admin
--

CREATE SEQUENCE public.code_execution_results_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.code_execution_results_id_seq OWNER TO nasc_admin;

--
-- Name: code_execution_results_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nasc_admin
--

ALTER SEQUENCE public.code_execution_results_id_seq OWNED BY public.code_execution_results.id;


--
-- Name: coding_submissions; Type: TABLE; Schema: public; Owner: nasc_admin
--

CREATE TABLE public.coding_submissions (
    id integer NOT NULL,
    attempt_id integer NOT NULL,
    question_id integer NOT NULL,
    language character varying(32) NOT NULL,
    source_code text NOT NULL,
    status character varying(32) NOT NULL,
    test_cases_passed integer NOT NULL,
    total_test_cases integer NOT NULL,
    execution_time_ms double precision NOT NULL,
    memory_kb double precision NOT NULL,
    compiler_output text,
    submitted_at timestamp without time zone NOT NULL,
    score_awarded double precision DEFAULT 0.0
);


ALTER TABLE public.coding_submissions OWNER TO nasc_admin;

--
-- Name: coding_submissions_id_seq; Type: SEQUENCE; Schema: public; Owner: nasc_admin
--

CREATE SEQUENCE public.coding_submissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.coding_submissions_id_seq OWNER TO nasc_admin;

--
-- Name: coding_submissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nasc_admin
--

ALTER SEQUENCE public.coding_submissions_id_seq OWNED BY public.coding_submissions.id;


--
-- Name: competencies; Type: TABLE; Schema: public; Owner: nasc_admin
--

CREATE TABLE public.competencies (
    id integer NOT NULL,
    code character varying(32) NOT NULL,
    name character varying(128) NOT NULL,
    category character varying(64) NOT NULL,
    description text
);


ALTER TABLE public.competencies OWNER TO nasc_admin;

--
-- Name: competencies_id_seq; Type: SEQUENCE; Schema: public; Owner: nasc_admin
--

CREATE SEQUENCE public.competencies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.competencies_id_seq OWNER TO nasc_admin;

--
-- Name: competencies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nasc_admin
--

ALTER SEQUENCE public.competencies_id_seq OWNED BY public.competencies.id;


--
-- Name: competency_scores; Type: TABLE; Schema: public; Owner: nasc_admin
--

CREATE TABLE public.competency_scores (
    id integer NOT NULL,
    attempt_id integer NOT NULL,
    competency_id integer NOT NULL,
    score double precision NOT NULL,
    max_score double precision NOT NULL,
    percentage double precision NOT NULL,
    readiness_level character varying(32) NOT NULL
);


ALTER TABLE public.competency_scores OWNER TO nasc_admin;

--
-- Name: competency_scores_id_seq; Type: SEQUENCE; Schema: public; Owner: nasc_admin
--

CREATE SEQUENCE public.competency_scores_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.competency_scores_id_seq OWNER TO nasc_admin;

--
-- Name: competency_scores_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nasc_admin
--

ALTER SEQUENCE public.competency_scores_id_seq OWNED BY public.competency_scores.id;


--
-- Name: course_allocations; Type: TABLE; Schema: public; Owner: nasc_admin
--

CREATE TABLE public.course_allocations (
    id integer NOT NULL,
    faculty_id integer,
    course_id integer,
    academic_year character varying(20),
    semester_num integer,
    section_name character varying(10),
    batch_name character varying(50)
);


ALTER TABLE public.course_allocations OWNER TO nasc_admin;

--
-- Name: course_allocations_id_seq; Type: SEQUENCE; Schema: public; Owner: nasc_admin
--

CREATE SEQUENCE public.course_allocations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.course_allocations_id_seq OWNER TO nasc_admin;

--
-- Name: course_allocations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nasc_admin
--

ALTER SEQUENCE public.course_allocations_id_seq OWNED BY public.course_allocations.id;


--
-- Name: course_enrolments; Type: TABLE; Schema: public; Owner: nasc_admin
--

CREATE TABLE public.course_enrolments (
    id integer NOT NULL,
    student_id integer,
    course_id integer,
    academic_year character varying(20)
);


ALTER TABLE public.course_enrolments OWNER TO nasc_admin;

--
-- Name: course_enrolments_id_seq; Type: SEQUENCE; Schema: public; Owner: nasc_admin
--

CREATE SEQUENCE public.course_enrolments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.course_enrolments_id_seq OWNER TO nasc_admin;

--
-- Name: course_enrolments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nasc_admin
--

ALTER SEQUENCE public.course_enrolments_id_seq OWNED BY public.course_enrolments.id;


--
-- Name: courses; Type: TABLE; Schema: public; Owner: nasc_admin
--

CREATE TABLE public.courses (
    id integer NOT NULL,
    code character varying(30) NOT NULL,
    title character varying(150) NOT NULL,
    course_type character varying(50),
    credits double precision,
    semester_num integer,
    regulation character varying(20),
    programme_id integer
);


ALTER TABLE public.courses OWNER TO nasc_admin;

--
-- Name: courses_id_seq; Type: SEQUENCE; Schema: public; Owner: nasc_admin
--

CREATE SEQUENCE public.courses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.courses_id_seq OWNER TO nasc_admin;

--
-- Name: courses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nasc_admin
--

ALTER SEQUENCE public.courses_id_seq OWNED BY public.courses.id;


--
-- Name: departments; Type: TABLE; Schema: public; Owner: nasc_admin
--

CREATE TABLE public.departments (
    id integer NOT NULL,
    code character varying(20) NOT NULL,
    name character varying(150) NOT NULL,
    school_id integer,
    hod_id integer
);


ALTER TABLE public.departments OWNER TO nasc_admin;

--
-- Name: departments_id_seq; Type: SEQUENCE; Schema: public; Owner: nasc_admin
--

CREATE SEQUENCE public.departments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.departments_id_seq OWNER TO nasc_admin;

--
-- Name: departments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nasc_admin
--

ALTER SEQUENCE public.departments_id_seq OWNED BY public.departments.id;


--
-- Name: faculty; Type: TABLE; Schema: public; Owner: nasc_admin
--

CREATE TABLE public.faculty (
    id integer NOT NULL,
    user_id integer,
    employee_id character varying(30) NOT NULL,
    designation character varying(100),
    department_id integer,
    status character varying(20),
    assigned_programme_id integer,
    assigned_batch character varying(50),
    assigned_section character varying(10)
);


ALTER TABLE public.faculty OWNER TO nasc_admin;

--
-- Name: faculty_id_seq; Type: SEQUENCE; Schema: public; Owner: nasc_admin
--

CREATE SEQUENCE public.faculty_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.faculty_id_seq OWNER TO nasc_admin;

--
-- Name: faculty_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nasc_admin
--

ALTER SEQUENCE public.faculty_id_seq OWNED BY public.faculty.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: nasc_admin
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    user_id integer,
    title character varying(150) NOT NULL,
    message text NOT NULL,
    type character varying(30),
    is_read boolean,
    created_at timestamp without time zone
);


ALTER TABLE public.notifications OWNER TO nasc_admin;

--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: nasc_admin
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifications_id_seq OWNER TO nasc_admin;

--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nasc_admin
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: obe_attainment_records; Type: TABLE; Schema: public; Owner: nasc_admin
--

CREATE TABLE public.obe_attainment_records (
    id integer NOT NULL,
    candidate_result_id integer NOT NULL,
    student_id integer NOT NULL,
    competency_id integer NOT NULL,
    course_outcome_code character varying(32),
    program_outcome_code character varying(32),
    attainment_percentage double precision,
    created_at timestamp without time zone
);


ALTER TABLE public.obe_attainment_records OWNER TO nasc_admin;

--
-- Name: obe_attainment_records_id_seq; Type: SEQUENCE; Schema: public; Owner: nasc_admin
--

CREATE SEQUENCE public.obe_attainment_records_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.obe_attainment_records_id_seq OWNER TO nasc_admin;

--
-- Name: obe_attainment_records_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nasc_admin
--

ALTER SEQUENCE public.obe_attainment_records_id_seq OWNED BY public.obe_attainment_records.id;


--
-- Name: proctoring_events; Type: TABLE; Schema: public; Owner: nasc_admin
--

CREATE TABLE public.proctoring_events (
    id integer NOT NULL,
    session_id integer NOT NULL,
    event_type character varying(64) NOT NULL,
    severity character varying(16) NOT NULL,
    metadata_json json,
    snapshot_url character varying(512),
    created_at timestamp without time zone
);


ALTER TABLE public.proctoring_events OWNER TO nasc_admin;

--
-- Name: proctoring_events_id_seq; Type: SEQUENCE; Schema: public; Owner: nasc_admin
--

CREATE SEQUENCE public.proctoring_events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.proctoring_events_id_seq OWNER TO nasc_admin;

--
-- Name: proctoring_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nasc_admin
--

ALTER SEQUENCE public.proctoring_events_id_seq OWNED BY public.proctoring_events.id;


--
-- Name: programmes; Type: TABLE; Schema: public; Owner: nasc_admin
--

CREATE TABLE public.programmes (
    id integer NOT NULL,
    code character varying(20) NOT NULL,
    name character varying(150) NOT NULL,
    degree_type character varying(50),
    department_id integer,
    duration_years integer
);


ALTER TABLE public.programmes OWNER TO nasc_admin;

--
-- Name: programmes_id_seq; Type: SEQUENCE; Schema: public; Owner: nasc_admin
--

CREATE SEQUENCE public.programmes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.programmes_id_seq OWNER TO nasc_admin;

--
-- Name: programmes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nasc_admin
--

ALTER SEQUENCE public.programmes_id_seq OWNED BY public.programmes.id;


--
-- Name: question_evaluation_configs; Type: TABLE; Schema: public; Owner: nasc_admin
--

CREATE TABLE public.question_evaluation_configs (
    id integer NOT NULL,
    question_id integer NOT NULL,
    evaluation_type character varying(32) NOT NULL,
    correct_answer text,
    reference_solution text,
    public_test_cases_json json NOT NULL,
    hidden_test_cases_json json NOT NULL,
    scoring_rules_json json NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


ALTER TABLE public.question_evaluation_configs OWNER TO nasc_admin;

--
-- Name: question_evaluation_configs_id_seq; Type: SEQUENCE; Schema: public; Owner: nasc_admin
--

CREATE SEQUENCE public.question_evaluation_configs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.question_evaluation_configs_id_seq OWNER TO nasc_admin;

--
-- Name: question_evaluation_configs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nasc_admin
--

ALTER SEQUENCE public.question_evaluation_configs_id_seq OWNED BY public.question_evaluation_configs.id;


--
-- Name: question_versions; Type: TABLE; Schema: public; Owner: nasc_admin
--

CREATE TABLE public.question_versions (
    id integer NOT NULL,
    question_id integer NOT NULL,
    version_num integer NOT NULL,
    snapshot_json json NOT NULL,
    created_at timestamp without time zone NOT NULL
);


ALTER TABLE public.question_versions OWNER TO nasc_admin;

--
-- Name: question_versions_id_seq; Type: SEQUENCE; Schema: public; Owner: nasc_admin
--

CREATE SEQUENCE public.question_versions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.question_versions_id_seq OWNER TO nasc_admin;

--
-- Name: question_versions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nasc_admin
--

ALTER SEQUENCE public.question_versions_id_seq OWNED BY public.question_versions.id;


--
-- Name: roles; Type: TABLE; Schema: public; Owner: nasc_admin
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    description character varying(255)
);


ALTER TABLE public.roles OWNER TO nasc_admin;

--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: nasc_admin
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.roles_id_seq OWNER TO nasc_admin;

--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nasc_admin
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- Name: roster_approval_batches; Type: TABLE; Schema: public; Owner: nasc_admin
--

CREATE TABLE public.roster_approval_batches (
    id integer NOT NULL,
    tutor_id integer NOT NULL,
    programme_id integer NOT NULL,
    section_name character varying(10),
    batch_name character varying(50),
    semester_num integer,
    file_name character varying(255),
    status character varying(30),
    staged_data json NOT NULL,
    rejection_notes text,
    created_at timestamp without time zone,
    approved_at timestamp without time zone,
    approved_by_id integer
);


ALTER TABLE public.roster_approval_batches OWNER TO nasc_admin;

--
-- Name: roster_approval_batches_id_seq; Type: SEQUENCE; Schema: public; Owner: nasc_admin
--

CREATE SEQUENCE public.roster_approval_batches_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.roster_approval_batches_id_seq OWNER TO nasc_admin;

--
-- Name: roster_approval_batches_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nasc_admin
--

ALTER SEQUENCE public.roster_approval_batches_id_seq OWNED BY public.roster_approval_batches.id;


--
-- Name: schools; Type: TABLE; Schema: public; Owner: nasc_admin
--

CREATE TABLE public.schools (
    id integer NOT NULL,
    code character varying(20) NOT NULL,
    name character varying(150) NOT NULL
);


ALTER TABLE public.schools OWNER TO nasc_admin;

--
-- Name: schools_id_seq; Type: SEQUENCE; Schema: public; Owner: nasc_admin
--

CREATE SEQUENCE public.schools_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.schools_id_seq OWNER TO nasc_admin;

--
-- Name: schools_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nasc_admin
--

ALTER SEQUENCE public.schools_id_seq OWNED BY public.schools.id;


--
-- Name: sections; Type: TABLE; Schema: public; Owner: nasc_admin
--

CREATE TABLE public.sections (
    id integer NOT NULL,
    name character varying(10) NOT NULL
);


ALTER TABLE public.sections OWNER TO nasc_admin;

--
-- Name: sections_id_seq; Type: SEQUENCE; Schema: public; Owner: nasc_admin
--

CREATE SEQUENCE public.sections_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sections_id_seq OWNER TO nasc_admin;

--
-- Name: sections_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nasc_admin
--

ALTER SEQUENCE public.sections_id_seq OWNED BY public.sections.id;


--
-- Name: semesters; Type: TABLE; Schema: public; Owner: nasc_admin
--

CREATE TABLE public.semesters (
    id integer NOT NULL,
    number integer NOT NULL,
    name character varying(50) NOT NULL,
    academic_year character varying(20) NOT NULL
);


ALTER TABLE public.semesters OWNER TO nasc_admin;

--
-- Name: semesters_id_seq; Type: SEQUENCE; Schema: public; Owner: nasc_admin
--

CREATE SEQUENCE public.semesters_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.semesters_id_seq OWNER TO nasc_admin;

--
-- Name: semesters_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nasc_admin
--

ALTER SEQUENCE public.semesters_id_seq OWNED BY public.semesters.id;


--
-- Name: students; Type: TABLE; Schema: public; Owner: nasc_admin
--

CREATE TABLE public.students (
    id integer NOT NULL,
    user_id integer,
    register_number character varying(30) NOT NULL,
    programme_id integer,
    batch_name character varying(50) NOT NULL,
    semester_num integer,
    section_name character varying(10),
    initial_password character varying(100),
    status character varying(20)
);


ALTER TABLE public.students OWNER TO nasc_admin;

--
-- Name: students_id_seq; Type: SEQUENCE; Schema: public; Owner: nasc_admin
--

CREATE SEQUENCE public.students_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.students_id_seq OWNER TO nasc_admin;

--
-- Name: students_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nasc_admin
--

ALTER SEQUENCE public.students_id_seq OWNED BY public.students.id;


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: nasc_admin
--

CREATE TABLE public.user_roles (
    user_id integer NOT NULL,
    role_id integer NOT NULL
);


ALTER TABLE public.user_roles OWNER TO nasc_admin;

--
-- Name: users; Type: TABLE; Schema: public; Owner: nasc_admin
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    email character varying(100) NOT NULL,
    hashed_password character varying(255) NOT NULL,
    full_name character varying(100) NOT NULL,
    mobile character varying(20),
    is_active boolean,
    created_at timestamp without time zone
);


ALTER TABLE public.users OWNER TO nasc_admin;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: nasc_admin
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO nasc_admin;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nasc_admin
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: academic_classes id; Type: DEFAULT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.academic_classes ALTER COLUMN id SET DEFAULT nextval('public.academic_classes_id_seq'::regclass);


--
-- Name: academic_scopes id; Type: DEFAULT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.academic_scopes ALTER COLUMN id SET DEFAULT nextval('public.academic_scopes_id_seq'::regclass);


--
-- Name: academic_years id; Type: DEFAULT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.academic_years ALTER COLUMN id SET DEFAULT nextval('public.academic_years_id_seq'::regclass);


--
-- Name: allocation_approval_history id; Type: DEFAULT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.allocation_approval_history ALTER COLUMN id SET DEFAULT nextval('public.allocation_approval_history_id_seq'::regclass);


--
-- Name: assessment_activation_candidates id; Type: DEFAULT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.assessment_activation_candidates ALTER COLUMN id SET DEFAULT nextval('public.assessment_activation_candidates_id_seq'::regclass);


--
-- Name: assessment_activation_requests id; Type: DEFAULT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.assessment_activation_requests ALTER COLUMN id SET DEFAULT nextval('public.assessment_activation_requests_id_seq'::regclass);


--
-- Name: assessment_attempts id; Type: DEFAULT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.assessment_attempts ALTER COLUMN id SET DEFAULT nextval('public.assessment_attempts_id_seq'::regclass);


--
-- Name: assessment_domains id; Type: DEFAULT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.assessment_domains ALTER COLUMN id SET DEFAULT nextval('public.assessment_domains_id_seq'::regclass);


--
-- Name: assessment_policies id; Type: DEFAULT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.assessment_policies ALTER COLUMN id SET DEFAULT nextval('public.assessment_policies_id_seq'::regclass);


--
-- Name: assessment_questions id; Type: DEFAULT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.assessment_questions ALTER COLUMN id SET DEFAULT nextval('public.assessment_questions_id_seq'::regclass);


--
-- Name: assessment_reattempt_requests id; Type: DEFAULT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.assessment_reattempt_requests ALTER COLUMN id SET DEFAULT nextval('public.assessment_reattempt_requests_id_seq'::regclass);


--
-- Name: assessment_responses id; Type: DEFAULT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.assessment_responses ALTER COLUMN id SET DEFAULT nextval('public.assessment_responses_id_seq'::regclass);


--
-- Name: assessment_results id; Type: DEFAULT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.assessment_results ALTER COLUMN id SET DEFAULT nextval('public.assessment_results_id_seq'::regclass);


--
-- Name: assessment_rounds id; Type: DEFAULT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.assessment_rounds ALTER COLUMN id SET DEFAULT nextval('public.assessment_rounds_id_seq'::regclass);


--
-- Name: assessment_student_allocations id; Type: DEFAULT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.assessment_student_allocations ALTER COLUMN id SET DEFAULT nextval('public.assessment_student_allocations_id_seq'::regclass);


--
-- Name: attempt_question_snapshots id; Type: DEFAULT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.attempt_question_snapshots ALTER COLUMN id SET DEFAULT nextval('public.attempt_question_snapshots_id_seq'::regclass);


--
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);


--
-- Name: batches id; Type: DEFAULT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.batches ALTER COLUMN id SET DEFAULT nextval('public.batches_id_seq'::regclass);


--
-- Name: code_execution_results id; Type: DEFAULT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.code_execution_results ALTER COLUMN id SET DEFAULT nextval('public.code_execution_results_id_seq'::regclass);


--
-- Name: coding_submissions id; Type: DEFAULT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.coding_submissions ALTER COLUMN id SET DEFAULT nextval('public.coding_submissions_id_seq'::regclass);


--
-- Name: competencies id; Type: DEFAULT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.competencies ALTER COLUMN id SET DEFAULT nextval('public.competencies_id_seq'::regclass);


--
-- Name: competency_scores id; Type: DEFAULT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.competency_scores ALTER COLUMN id SET DEFAULT nextval('public.competency_scores_id_seq'::regclass);


--
-- Name: course_allocations id; Type: DEFAULT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.course_allocations ALTER COLUMN id SET DEFAULT nextval('public.course_allocations_id_seq'::regclass);


--
-- Name: course_enrolments id; Type: DEFAULT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.course_enrolments ALTER COLUMN id SET DEFAULT nextval('public.course_enrolments_id_seq'::regclass);


--
-- Name: courses id; Type: DEFAULT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.courses ALTER COLUMN id SET DEFAULT nextval('public.courses_id_seq'::regclass);


--
-- Name: departments id; Type: DEFAULT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.departments ALTER COLUMN id SET DEFAULT nextval('public.departments_id_seq'::regclass);


--
-- Name: faculty id; Type: DEFAULT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.faculty ALTER COLUMN id SET DEFAULT nextval('public.faculty_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: obe_attainment_records id; Type: DEFAULT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.obe_attainment_records ALTER COLUMN id SET DEFAULT nextval('public.obe_attainment_records_id_seq'::regclass);


--
-- Name: proctoring_events id; Type: DEFAULT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.proctoring_events ALTER COLUMN id SET DEFAULT nextval('public.proctoring_events_id_seq'::regclass);


--
-- Name: programmes id; Type: DEFAULT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.programmes ALTER COLUMN id SET DEFAULT nextval('public.programmes_id_seq'::regclass);


--
-- Name: question_evaluation_configs id; Type: DEFAULT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.question_evaluation_configs ALTER COLUMN id SET DEFAULT nextval('public.question_evaluation_configs_id_seq'::regclass);


--
-- Name: question_versions id; Type: DEFAULT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.question_versions ALTER COLUMN id SET DEFAULT nextval('public.question_versions_id_seq'::regclass);


--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- Name: roster_approval_batches id; Type: DEFAULT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.roster_approval_batches ALTER COLUMN id SET DEFAULT nextval('public.roster_approval_batches_id_seq'::regclass);


--
-- Name: schools id; Type: DEFAULT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.schools ALTER COLUMN id SET DEFAULT nextval('public.schools_id_seq'::regclass);


--
-- Name: sections id; Type: DEFAULT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.sections ALTER COLUMN id SET DEFAULT nextval('public.sections_id_seq'::regclass);


--
-- Name: semesters id; Type: DEFAULT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.semesters ALTER COLUMN id SET DEFAULT nextval('public.semesters_id_seq'::regclass);


--
-- Name: students id; Type: DEFAULT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.students ALTER COLUMN id SET DEFAULT nextval('public.students_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: academic_classes; Type: TABLE DATA; Schema: public; Owner: nasc_admin
--

COPY public.academic_classes (id, class_code, name, programme_id, batch_name, semester_num, section_name, tutor_id) FROM stdin;
1	23BCA-A	2023-2026 BCA Section A1	1	2023-2026	4	A	\N
2	2025-B.COM IT	II-B.Com IT	2	2025-2028	3	A	\N
3	24BCOM IT	III- B.com IT	2	2024-2027	5	A	\N
4	25BSCIOT	2025-2028 BSC IOT	1	2025-2028	3	A	\N
5	24BSCIOT	2024-2027 BSC IOT Section A	3	2024-2027	3	A	7
\.


--
-- Data for Name: academic_scopes; Type: TABLE DATA; Schema: public; Owner: nasc_admin
--

COPY public.academic_scopes (id, faculty_id, department_id, programme_id, batch_id, section_id, role_type, is_active, created_at) FROM stdin;
\.


--
-- Data for Name: academic_years; Type: TABLE DATA; Schema: public; Owner: nasc_admin
--

COPY public.academic_years (id, year_code, is_current) FROM stdin;
1	2025-2026	t
\.


--
-- Data for Name: allocation_approval_history; Type: TABLE DATA; Schema: public; Owner: nasc_admin
--

COPY public.allocation_approval_history (id, allocation_id, action, performed_by_faculty_id, comments, previous_status, new_status, config_snapshot_json, created_at) FROM stdin;
1	1	SUBMIT_FOR_REVIEW	3	Placement cell practical readiness assessment.	\N	UNDER_REVIEW	{"template_version_id": 1, "scheduled_start": "2026-08-18T15:02:19.716970", "scheduled_end": "2026-08-25T16:02:19.716970", "section_id": 1}	2026-08-18 16:02:19.740683
2	1	HOD_APPROVED	3	Approved by HOD. Ready for candidate evaluation.	UNDER_REVIEW	APPROVED	{"template_id": 1, "domain_id": 1, "domain_slug": "software-development", "domain_title": "Software Development", "version_tag": "v1.0", "rounds": [{"round_order": 1, "title": "Round 1: Cognitive & Software Aptitude", "description": null, "round_type": "MCQ_APTITUDE", "duration_minutes": 30, "total_questions": 20, "passing_score": 60.0, "weightage_percent": 25.0, "rules": {}, "evaluation_policy": {}}, {"round_order": 2, "title": "Round 2: Programming & Coding", "description": null, "round_type": "CODING_SANDBOX", "duration_minutes": 60, "total_questions": 2, "passing_score": 70.0, "weightage_percent": 35.0, "rules": {}, "evaluation_policy": {}}, {"round_order": 3, "title": "Round 3: Technical Knowledge", "description": null, "round_type": "MCQ_APTITUDE", "duration_minutes": 45, "total_questions": 25, "passing_score": 60.0, "weightage_percent": 20.0, "rules": {}, "evaluation_policy": {}}, {"round_order": 4, "title": "Round 4: Debugging & Optimization", "description": null, "round_type": "CODING_SANDBOX", "duration_minutes": 45, "total_questions": 3, "passing_score": 65.0, "weightage_percent": 20.0, "rules": {}, "evaluation_policy": {}}], "frozen_at": "2026-08-18T16:02:19.774669", "approved_by_faculty_id": 3}	2026-08-18 16:02:19.790244
3	3	SUBMIT_FOR_REVIEW	3	Submitted to HOD for approval.	\N	UNDER_REVIEW	{"template_version_id": 1, "scheduled_start": "2026-08-18T15:03:03.031965", "scheduled_end": "2026-08-25T16:03:03.031965", "section_id": 1}	2026-08-18 16:03:03.037562
4	3	HOD_APPROVED	3	Approved for 2025-2028 Batch.	UNDER_REVIEW	APPROVED	{"template_id": 1, "domain_id": 1, "domain_slug": "software-development", "domain_title": "Software Development", "version_tag": "v1.0", "rounds": [{"round_order": 1, "title": "Round 1: Cognitive & Software Aptitude", "description": null, "round_type": "MCQ_APTITUDE", "duration_minutes": 30, "total_questions": 20, "passing_score": 60.0, "weightage_percent": 25.0, "rules": {}, "evaluation_policy": {}}, {"round_order": 2, "title": "Round 2: Programming & Coding", "description": null, "round_type": "CODING_SANDBOX", "duration_minutes": 60, "total_questions": 2, "passing_score": 70.0, "weightage_percent": 35.0, "rules": {}, "evaluation_policy": {}}, {"round_order": 3, "title": "Round 3: Technical Knowledge", "description": null, "round_type": "MCQ_APTITUDE", "duration_minutes": 45, "total_questions": 25, "passing_score": 60.0, "weightage_percent": 20.0, "rules": {}, "evaluation_policy": {}}, {"round_order": 4, "title": "Round 4: Debugging & Optimization", "description": null, "round_type": "CODING_SANDBOX", "duration_minutes": 45, "total_questions": 3, "passing_score": 65.0, "weightage_percent": 20.0, "rules": {}, "evaluation_policy": {}}], "frozen_at": "2026-08-18T16:03:03.068700", "approved_by_faculty_id": 3}	2026-08-18 16:03:03.0687
\.


--
-- Data for Name: assessment_activation_candidates; Type: TABLE DATA; Schema: public; Owner: nasc_admin
--

COPY public.assessment_activation_candidates (id, request_id, student_id) FROM stdin;
1	6	1
5	11	50
8	13	48
9	13	50
10	16	48
11	16	50
12	17	48
13	17	50
14	18	48
15	18	50
16	19	48
17	19	50
22	23	48
23	23	50
\.


--
-- Data for Name: assessment_activation_requests; Type: TABLE DATA; Schema: public; Owner: nasc_admin
--

COPY public.assessment_activation_requests (id, domain_id, academic_class_id, requested_by_id, reviewed_by_id, status, valid_from, valid_until, notes, rejection_reason, requested_at, reviewed_at, selected_rounds_json) FROM stdin;
2	1	1	1	1	APPROVED	2025-08-20 14:01:15.092151	2027-08-20 14:01:15.092151	LEGACY_CORPORATE_MIGRATION	\N	2026-08-20 14:01:15.092151	\N	\N
3	2	1	1	1	APPROVED	2025-08-20 14:01:15.164868	2027-08-20 14:01:15.164868	LEGACY_CORPORATE_MIGRATION	\N	2026-08-20 14:01:15.164868	\N	\N
4	3	1	1	1	APPROVED	2025-08-20 14:01:15.189225	2027-08-20 14:01:15.189225	LEGACY_CORPORATE_MIGRATION	\N	2026-08-20 14:01:15.196122	\N	\N
6	1	2	1	\N	PENDING	2026-08-20 14:54:28.381922	2026-09-19 14:54:28.381922	Test activation request	\N	2026-08-20 14:54:28.405478	\N	\N
9	8	1	1	1	APPROVED	2026-07-24 03:40:44.208351	2027-08-23 03:40:44.208911	CORE_TRACK_ACTIVATION	\N	2026-08-23 03:40:44.208911	\N	\N
13	1	5	55	53	APPROVED	2026-08-23 10:15:13.938	2026-09-22 10:15:13.938	Updated by Automated Test	\N	2026-08-23 10:15:13.959764	2026-08-23 10:28:38.683075	\N
16	3	5	55	53	APPROVED	2026-08-23 12:47:18.617	2026-09-22 12:47:18.617	\N	\N	2026-08-23 12:47:18.650535	2026-08-23 12:48:11.736122	[10, 9, 12, 11]
19	3	5	55	53	APPROVED	2026-08-27 15:05:48.231	2026-09-26 15:05:48.231	\N	\N	2026-08-27 15:05:48.252951	2026-08-27 15:06:43.081963	[9, 10, 11, 12, 13]
18	8	5	55	53	APPROVED	2026-08-27 15:05:41.976	2026-09-26 15:05:41.976	\N	\N	2026-08-27 15:05:41.994473	2026-08-27 15:06:47.841854	[22, 23, 24, 25]
17	1	5	55	53	APPROVED	2026-08-27 15:05:35.272	2026-09-26 15:05:35.272	\N	\N	2026-08-27 15:05:35.300487	2026-08-27 15:06:51.570823	[1, 2, 3, 4]
23	1	5	55	53	APPROVED	2026-09-03 15:33:01.492	2026-10-03 15:33:01.492	\N	\N	2026-09-03 15:33:01.906014	2026-09-05 15:33:28.355924	[1, 2, 3, 4]
11	8	5	55	53	APPROVED	2026-08-23 06:52:00	2026-08-22 06:52:00		\N	2026-08-23 06:52:57.200585	2026-08-23 06:53:41.17597	\N
\.


--
-- Data for Name: assessment_attempts; Type: TABLE DATA; Schema: public; Owner: nasc_admin
--

COPY public.assessment_attempts (id, allocation_id, round_id, status, score, percentage, passed, evaluation_details_json, started_at, last_activity_at, submitted_at, attempt_number) FROM stdin;
121	60	1	EVALUATED	0	0	f	{"questions": [{"question_id": 1, "title": "Bitwise Operations & Shift Logic", "marks_earned": 0.0, "max_marks": 2.0, "note": "Unanswered"}, {"question_id": 2, "title": "Binary Tree Traversal Deductions", "marks_earned": 0.0, "max_marks": 2.0, "note": "Unanswered"}, {"question_id": 3, "title": "Server Request Latency Calculation", "marks_earned": 0.0, "max_marks": 2.0, "note": "Unanswered"}], "passing_score": 65.0, "max_score": 6.0}	2026-08-23 11:31:55.923375	2026-08-23 11:33:49.932559	2026-08-23 11:33:49.889649	3
125	61	1	EVALUATED	0	0	f	{"questions": [{"question_id": 1, "title": "Bitwise Operations & Shift Logic", "marks_earned": 0.0, "max_marks": 2.0, "note": "Unanswered"}, {"question_id": 2, "title": "Binary Tree Traversal Deductions", "marks_earned": 0.0, "max_marks": 2.0, "note": "Unanswered"}, {"question_id": 3, "title": "Server Request Latency Calculation", "marks_earned": 0.0, "max_marks": 2.0, "note": "Unanswered"}], "passing_score": 65.0, "max_score": 6.0}	2026-08-23 12:15:27.49994	2026-08-23 12:15:49.014453	2026-08-23 12:15:48.977364	1
176	4	9	EVALUATED	1	2.22	f	{"questions": [{"question_id": 64, "title": "Q1.1: Revenue Trend Analysis", "marks_earned": 1.0, "max_marks": 1.0, "note": "Correct option matched"}, {"question_id": 65, "title": "Q1.2: Data Quality & Missing Value Strategy", "marks_earned": 0.0, "max_marks": 1.0, "note": "Incorrect option selected"}, {"question_id": 66, "title": "Q1.3: Noesys Information Security Policy & Data Protection", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 67, "title": "Q1.4: Stakeholder Business Communication", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 68, "title": "Q1.3: Information Security Policy & Data Protection", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 69, "title": "Regional Sales Growth Rate Analysis", "marks_earned": 0.0, "max_marks": 10.0, "note": "Unanswered"}, {"question_id": 70, "title": "Customer Acquisition Trend & Outlier Detection", "marks_earned": 0.0, "max_marks": 10.0, "note": "Unanswered"}, {"question_id": 71, "title": "Product Margin & Revenue Weighted Average", "marks_earned": 0.0, "max_marks": 10.0, "note": "Unanswered"}, {"question_id": 72, "title": "Analytical Root Cause & Hypothesis Formulation", "marks_earned": 0.0, "max_marks": 10.0, "note": "Unanswered"}], "passing_score": 60.0, "max_score": 45.0}	2026-09-03 15:18:28.984205	2026-09-05 15:59:57.122645	\N	1
33	2	1	EVALUATED	0	0	f	{"questions": [{"question_id": 1, "title": "Bitwise Operations & Shift Logic", "marks_earned": 0.0, "max_marks": 2.0, "note": "Unanswered"}, {"question_id": 2, "title": "Binary Tree Traversal Deductions", "marks_earned": 0.0, "max_marks": 2.0, "note": "Unanswered"}, {"question_id": 3, "title": "Server Request Latency Calculation", "marks_earned": 0.0, "max_marks": 2.0, "note": "Unanswered"}], "passing_score": 65.0, "max_score": 6.0}	2026-08-20 16:34:27.41332	2026-09-05 15:59:57.183795	\N	2
32	2	1	EVALUATED	3	30	f	{}	2026-08-20 16:34:27.309114	2026-08-20 16:34:27.309114	\N	1
62	55	22	EVALUATED	3	20	f	{"questions": [{"question_id": 185, "title": "Iterative Loop Sum Deduction", "marks_earned": 1.0, "max_marks": 1.0, "note": "Correct option matched"}, {"question_id": 186, "title": "Conditional Discount Flow Deduction", "marks_earned": 1.0, "max_marks": 1.0, "note": "Correct option matched"}, {"question_id": 172, "title": "Ratio & Proportion Division", "marks_earned": 0.0, "max_marks": 1.0, "note": "Incorrect option selected"}, {"question_id": 173, "title": "Percentage Profit Calculation", "marks_earned": 0.0, "max_marks": 1.0, "note": "Incorrect option selected"}, {"question_id": 174, "title": "Arithmetic Progression Series", "marks_earned": 1.0, "max_marks": 1.0, "note": "Correct option matched"}, {"question_id": 175, "title": "Combined Work Rate", "marks_earned": 0.0, "max_marks": 1.0, "note": "Incorrect option selected"}, {"question_id": 176, "title": "Speed, Distance and Time", "marks_earned": 0.0, "max_marks": 1.0, "note": "Incorrect option selected"}, {"question_id": 177, "title": "Simple Interest Accrual", "marks_earned": 0.0, "max_marks": 1.0, "note": "Incorrect option selected"}, {"question_id": 178, "title": "Arithmetic Mean of Integer Set", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 179, "title": "Dice Roll Probability", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 180, "title": "Pattern Coding & Transposition", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 181, "title": "Family Tree Logical Deduction", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 182, "title": "Categorical Syllogism", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 183, "title": "Linear Age Relationship", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 184, "title": "Analog Clock Hand Angle", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}], "passing_score": 60.0, "max_score": 15.0}	2026-08-23 03:43:58.464611	2026-08-23 03:57:38.304559	2026-08-23 03:57:38.236313	1
64	8	22	EVALUATED	1	6.67	f	{"questions": [{"question_id": 172, "title": "Ratio & Proportion Division", "marks_earned": 1.0, "max_marks": 1.0, "note": "Correct option matched"}, {"question_id": 173, "title": "Percentage Profit Calculation", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 174, "title": "Arithmetic Progression Series", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 175, "title": "Combined Work Rate", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 176, "title": "Speed, Distance and Time", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 177, "title": "Simple Interest Accrual", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 178, "title": "Arithmetic Mean of Integer Set", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 179, "title": "Dice Roll Probability", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 180, "title": "Pattern Coding & Transposition", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 181, "title": "Family Tree Logical Deduction", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 182, "title": "Categorical Syllogism", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 183, "title": "Linear Age Relationship", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 184, "title": "Analog Clock Hand Angle", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 185, "title": "Iterative Loop Sum Deduction", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 186, "title": "Conditional Discount Flow Deduction", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}], "passing_score": 60.0, "max_score": 15.0}	2026-08-23 03:44:56.481947	2026-08-23 03:52:34.379875	\N	1
171	73	2	EVALUATED	0	0	f	{}	2026-08-30 13:35:47.326467	2026-09-05 15:50:25.805886	2026-09-05 15:50:00.951193	1
101	55	22	EVALUATED	0	0	f	{"questions": [{"question_id": 180, "title": "Pattern Coding & Transposition", "marks_earned": 0.0, "max_marks": 1.0, "note": "Incorrect option selected"}, {"question_id": 181, "title": "Family Tree Logical Deduction", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 182, "title": "Categorical Syllogism", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 183, "title": "Linear Age Relationship", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 184, "title": "Analog Clock Hand Angle", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 185, "title": "Iterative Loop Sum Deduction", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 186, "title": "Conditional Discount Flow Deduction", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 172, "title": "Ratio & Proportion Division", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 173, "title": "Percentage Profit Calculation", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 174, "title": "Arithmetic Progression Series", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 175, "title": "Combined Work Rate", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 176, "title": "Speed, Distance and Time", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 177, "title": "Simple Interest Accrual", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 178, "title": "Arithmetic Mean of Integer Set", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 179, "title": "Dice Roll Probability", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}], "passing_score": 60.0, "max_score": 15.0}	2026-08-23 06:42:59.560338	2026-08-23 06:47:16.341318	2026-08-23 06:47:16.278576	2
102	58	22	EVALUATED	2	13.33	f	{"questions": [{"question_id": 179, "title": "Dice Roll Probability", "marks_earned": 0.0, "max_marks": 1.0, "note": "Incorrect option selected"}, {"question_id": 180, "title": "Pattern Coding & Transposition", "marks_earned": 1.0, "max_marks": 1.0, "note": "Correct option matched"}, {"question_id": 181, "title": "Family Tree Logical Deduction", "marks_earned": 1.0, "max_marks": 1.0, "note": "Correct option matched"}, {"question_id": 182, "title": "Categorical Syllogism", "marks_earned": 0.0, "max_marks": 1.0, "note": "Incorrect option selected"}, {"question_id": 183, "title": "Linear Age Relationship", "marks_earned": 0.0, "max_marks": 1.0, "note": "Incorrect option selected"}, {"question_id": 184, "title": "Analog Clock Hand Angle", "marks_earned": 0.0, "max_marks": 1.0, "note": "Incorrect option selected"}, {"question_id": 185, "title": "Iterative Loop Sum Deduction", "marks_earned": 0.0, "max_marks": 1.0, "note": "Incorrect option selected"}, {"question_id": 172, "title": "Ratio & Proportion Division", "marks_earned": 0.0, "max_marks": 1.0, "note": "Incorrect option selected"}, {"question_id": 173, "title": "Percentage Profit Calculation", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 174, "title": "Arithmetic Progression Series", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 175, "title": "Combined Work Rate", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 176, "title": "Speed, Distance and Time", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 177, "title": "Simple Interest Accrual", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 178, "title": "Arithmetic Mean of Integer Set", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 186, "title": "Conditional Discount Flow Deduction", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}], "passing_score": 60.0, "max_score": 15.0}	2026-08-23 06:54:30.659837	2026-08-23 07:02:08.120843	2026-08-23 06:59:20.457349	1
104	58	22	EVALUATED	0	0	f	{"questions": [{"question_id": 172, "title": "Ratio & Proportion Division", "marks_earned": 0.0, "max_marks": 1.0, "note": "Incorrect option selected"}, {"question_id": 173, "title": "Percentage Profit Calculation", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 174, "title": "Arithmetic Progression Series", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 175, "title": "Combined Work Rate", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 176, "title": "Speed, Distance and Time", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 177, "title": "Simple Interest Accrual", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 178, "title": "Arithmetic Mean of Integer Set", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 179, "title": "Dice Roll Probability", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 180, "title": "Pattern Coding & Transposition", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 181, "title": "Family Tree Logical Deduction", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 182, "title": "Categorical Syllogism", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 183, "title": "Linear Age Relationship", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 184, "title": "Analog Clock Hand Angle", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 185, "title": "Iterative Loop Sum Deduction", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 186, "title": "Conditional Discount Flow Deduction", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}], "passing_score": 60.0, "max_score": 15.0}	2026-08-23 07:03:54.243433	2026-08-23 07:05:55.812753	2026-08-23 07:05:55.757587	2
127	66	9	EVALUATED	0	0	f	{"questions": [{"question_id": 64, "title": "Q1.1: Revenue Trend Analysis", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 65, "title": "Q1.2: Data Quality & Missing Value Strategy", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 66, "title": "Q1.3: Noesys Information Security Policy & Data Protection", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 67, "title": "Q1.4: Stakeholder Business Communication", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 68, "title": "Q1.3: Information Security Policy & Data Protection", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 69, "title": "Regional Sales Growth Rate Analysis", "marks_earned": 0.0, "max_marks": 10.0, "note": "Unanswered"}, {"question_id": 70, "title": "Customer Acquisition Trend & Outlier Detection", "marks_earned": 0.0, "max_marks": 10.0, "note": "Unanswered"}, {"question_id": 71, "title": "Product Margin & Revenue Weighted Average", "marks_earned": 0.0, "max_marks": 10.0, "note": "Unanswered"}, {"question_id": 72, "title": "Analytical Root Cause & Hypothesis Formulation", "marks_earned": 0.0, "max_marks": 10.0, "note": "Unanswered"}], "passing_score": 60.0, "max_score": 45.0}	2026-08-23 12:48:49.932286	2026-09-05 15:59:57.236206	\N	1
131	2	1	EVALUATED	0	0	f	{"questions": [{"question_id": 1, "title": "Bitwise Operations & Shift Logic", "marks_earned": 0.0, "max_marks": 2.0, "note": "Unanswered"}, {"question_id": 2, "title": "Binary Tree Traversal Deductions", "marks_earned": 0.0, "max_marks": 2.0, "note": "Unanswered"}, {"question_id": 3, "title": "Server Request Latency Calculation", "marks_earned": 0.0, "max_marks": 2.0, "note": "Unanswered"}], "passing_score": 65.0, "max_score": 6.0}	2026-08-27 15:18:00.59032	2026-09-05 15:59:57.277628	\N	999
110	9	22	EVALUATED	2	13.3	f	{}	2026-08-23 07:31:21.642856	2026-08-23 07:31:21.694859	\N	1
111	9	22	EVALUATED	15	100	t	{"questions": [{"question_id": 172, "title": "Ratio & Proportion Division", "marks_earned": 1.0, "max_marks": 1.0, "note": "Correct option matched"}, {"question_id": 173, "title": "Percentage Profit Calculation", "marks_earned": 1.0, "max_marks": 1.0, "note": "Correct option matched"}, {"question_id": 174, "title": "Arithmetic Progression Series", "marks_earned": 1.0, "max_marks": 1.0, "note": "Correct option matched"}, {"question_id": 175, "title": "Combined Work Rate", "marks_earned": 1.0, "max_marks": 1.0, "note": "Correct option matched"}, {"question_id": 176, "title": "Speed, Distance and Time", "marks_earned": 1.0, "max_marks": 1.0, "note": "Correct option matched"}, {"question_id": 177, "title": "Simple Interest Accrual", "marks_earned": 1.0, "max_marks": 1.0, "note": "Correct option matched"}, {"question_id": 178, "title": "Arithmetic Mean of Integer Set", "marks_earned": 1.0, "max_marks": 1.0, "note": "Correct option matched"}, {"question_id": 179, "title": "Dice Roll Probability", "marks_earned": 1.0, "max_marks": 1.0, "note": "Correct option matched"}, {"question_id": 180, "title": "Pattern Coding & Transposition", "marks_earned": 1.0, "max_marks": 1.0, "note": "Correct option matched"}, {"question_id": 181, "title": "Family Tree Logical Deduction", "marks_earned": 1.0, "max_marks": 1.0, "note": "Correct option matched"}, {"question_id": 182, "title": "Categorical Syllogism", "marks_earned": 1.0, "max_marks": 1.0, "note": "Correct option matched"}, {"question_id": 183, "title": "Linear Age Relationship", "marks_earned": 1.0, "max_marks": 1.0, "note": "Correct option matched"}, {"question_id": 184, "title": "Analog Clock Hand Angle", "marks_earned": 1.0, "max_marks": 1.0, "note": "Correct option matched"}, {"question_id": 185, "title": "Iterative Loop Sum Deduction", "marks_earned": 1.0, "max_marks": 1.0, "note": "Correct option matched"}, {"question_id": 186, "title": "Conditional Discount Flow Deduction", "marks_earned": 1.0, "max_marks": 1.0, "note": "Correct option matched"}], "passing_score": 60.0, "max_score": 15.0}	2026-08-23 07:31:21.72629	2026-08-23 07:31:21.861297	2026-08-23 07:31:21.825028	2
112	8	22	EVALUATED	0	0	f	{"questions": [{"question_id": 172, "title": "Ratio & Proportion Division", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 173, "title": "Percentage Profit Calculation", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 174, "title": "Arithmetic Progression Series", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 175, "title": "Combined Work Rate", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 176, "title": "Speed, Distance and Time", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 177, "title": "Simple Interest Accrual", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 178, "title": "Arithmetic Mean of Integer Set", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 179, "title": "Dice Roll Probability", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 180, "title": "Pattern Coding & Transposition", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 181, "title": "Family Tree Logical Deduction", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 182, "title": "Categorical Syllogism", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 183, "title": "Linear Age Relationship", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 184, "title": "Analog Clock Hand Angle", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 185, "title": "Iterative Loop Sum Deduction", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 186, "title": "Conditional Discount Flow Deduction", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}], "passing_score": 60.0, "max_score": 15.0}	2026-08-23 10:06:52.095823	2026-08-23 10:07:02.662511	2026-08-23 10:07:02.600172	2
113	10	22	EVALUATED	0	0	f	{"questions": [{"question_id": 172, "title": "Ratio & Proportion Division", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 173, "title": "Percentage Profit Calculation", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 174, "title": "Arithmetic Progression Series", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 175, "title": "Combined Work Rate", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 176, "title": "Speed, Distance and Time", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 177, "title": "Simple Interest Accrual", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 178, "title": "Arithmetic Mean of Integer Set", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 179, "title": "Dice Roll Probability", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 180, "title": "Pattern Coding & Transposition", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 181, "title": "Family Tree Logical Deduction", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 182, "title": "Categorical Syllogism", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 183, "title": "Linear Age Relationship", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 184, "title": "Analog Clock Hand Angle", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 185, "title": "Iterative Loop Sum Deduction", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 186, "title": "Conditional Discount Flow Deduction", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}], "passing_score": 60.0, "max_score": 15.0}	2026-08-23 10:11:10.466216	2026-08-23 10:11:10.609109	2026-08-23 10:11:10.549631	1
114	10	22	EVALUATED	15	100	t	{"questions": [{"question_id": 173, "title": "Percentage Profit Calculation", "marks_earned": 1.0, "max_marks": 1.0, "note": "Correct option matched"}, {"question_id": 174, "title": "Arithmetic Progression Series", "marks_earned": 1.0, "max_marks": 1.0, "note": "Correct option matched"}, {"question_id": 175, "title": "Combined Work Rate", "marks_earned": 1.0, "max_marks": 1.0, "note": "Correct option matched"}, {"question_id": 176, "title": "Speed, Distance and Time", "marks_earned": 1.0, "max_marks": 1.0, "note": "Correct option matched"}, {"question_id": 177, "title": "Simple Interest Accrual", "marks_earned": 1.0, "max_marks": 1.0, "note": "Correct option matched"}, {"question_id": 178, "title": "Arithmetic Mean of Integer Set", "marks_earned": 1.0, "max_marks": 1.0, "note": "Correct option matched"}, {"question_id": 179, "title": "Dice Roll Probability", "marks_earned": 1.0, "max_marks": 1.0, "note": "Correct option matched"}, {"question_id": 180, "title": "Pattern Coding & Transposition", "marks_earned": 1.0, "max_marks": 1.0, "note": "Correct option matched"}, {"question_id": 172, "title": "Ratio & Proportion Division", "marks_earned": 1.0, "max_marks": 1.0, "note": "Correct option matched"}, {"question_id": 181, "title": "Family Tree Logical Deduction", "marks_earned": 1.0, "max_marks": 1.0, "note": "Correct option matched"}, {"question_id": 182, "title": "Categorical Syllogism", "marks_earned": 1.0, "max_marks": 1.0, "note": "Correct option matched"}, {"question_id": 183, "title": "Linear Age Relationship", "marks_earned": 1.0, "max_marks": 1.0, "note": "Correct option matched"}, {"question_id": 184, "title": "Analog Clock Hand Angle", "marks_earned": 1.0, "max_marks": 1.0, "note": "Correct option matched"}, {"question_id": 185, "title": "Iterative Loop Sum Deduction", "marks_earned": 1.0, "max_marks": 1.0, "note": "Correct option matched"}, {"question_id": 186, "title": "Conditional Discount Flow Deduction", "marks_earned": 1.0, "max_marks": 1.0, "note": "Correct option matched"}], "passing_score": 60.0, "max_score": 15.0}	2026-08-23 10:11:10.704884	2026-08-23 10:11:10.875667	2026-08-23 10:11:10.827727	2
117	60	1	EVALUATED	0	0	f	{"questions": [{"question_id": 1, "title": "Bitwise Operations & Shift Logic", "marks_earned": 0.0, "max_marks": 2.0, "note": "Unanswered"}, {"question_id": 2, "title": "Binary Tree Traversal Deductions", "marks_earned": 0.0, "max_marks": 2.0, "note": "Unanswered"}, {"question_id": 3, "title": "Server Request Latency Calculation", "marks_earned": 0.0, "max_marks": 2.0, "note": "Unanswered"}], "passing_score": 65.0, "max_score": 6.0}	2026-08-23 11:15:59.194573	2026-08-23 11:16:07.113782	2026-08-23 11:16:07.051101	1
119	60	1	EVALUATED	0	0	f	{"questions": [{"question_id": 1, "title": "Bitwise Operations & Shift Logic", "marks_earned": 0.0, "max_marks": 2.0, "note": "Unanswered"}, {"question_id": 2, "title": "Binary Tree Traversal Deductions", "marks_earned": 0.0, "max_marks": 2.0, "note": "Unanswered"}, {"question_id": 3, "title": "Server Request Latency Calculation", "marks_earned": 0.0, "max_marks": 2.0, "note": "Unanswered"}], "passing_score": 65.0, "max_score": 6.0}	2026-08-23 11:17:05.61596	2026-08-23 11:17:15.305134	2026-08-23 11:17:15.243717	2
134	69	9	EVALUATED	11	24.44	f	{"questions": [{"question_id": 64, "title": "Q1.1: Revenue Trend Analysis", "marks_earned": 0.0, "max_marks": 1.0, "note": "Incorrect option selected"}, {"question_id": 65, "title": "Q1.2: Data Quality & Missing Value Strategy", "marks_earned": 0.0, "max_marks": 1.0, "note": "Incorrect option selected"}, {"question_id": 66, "title": "Q1.3: Noesys Information Security Policy & Data Protection", "marks_earned": 1.0, "max_marks": 1.0, "note": "Correct option matched"}, {"question_id": 67, "title": "Q1.4: Stakeholder Business Communication", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 68, "title": "Q1.3: Information Security Policy & Data Protection", "marks_earned": 0.0, "max_marks": 1.0, "note": "Incorrect option selected"}, {"question_id": 69, "title": "Regional Sales Growth Rate Analysis", "marks_earned": 0.0, "max_marks": 10.0, "note": "Incorrect option selected"}, {"question_id": 70, "title": "Customer Acquisition Trend & Outlier Detection", "marks_earned": 10.0, "max_marks": 10.0, "note": "Correct option matched"}, {"question_id": 71, "title": "Product Margin & Revenue Weighted Average", "marks_earned": 0.0, "max_marks": 10.0, "note": "Unanswered"}, {"question_id": 72, "title": "Analytical Root Cause & Hypothesis Formulation", "marks_earned": 0.0, "max_marks": 10.0, "note": "Unanswered"}], "passing_score": 60.0, "max_score": 45.0}	2026-08-27 15:31:24.555103	2026-08-27 16:08:18.130271	2026-08-27 16:08:16.619132	1
169	73	1	EVALUATED	6	100	t	{"questions": [{"question_id": 1, "title": "Bitwise Operations & Shift Logic", "marks_earned": 2.0, "max_marks": 2.0, "note": "Correct option matched"}, {"question_id": 2, "title": "Binary Tree Traversal Deductions", "marks_earned": 2.0, "max_marks": 2.0, "note": "Correct option matched"}, {"question_id": 3, "title": "Server Request Latency Calculation", "marks_earned": 2.0, "max_marks": 2.0, "note": "Correct option matched"}], "passing_score": 65.0, "max_score": 6.0}	2026-08-30 13:34:43.893469	2026-08-30 13:35:34.35686	2026-08-30 13:35:34.326582	1
178	77	1	EVALUATED	0	0	f	{"questions": [{"question_id": 1, "title": "Bitwise Operations & Shift Logic", "marks_earned": 0.0, "max_marks": 2.0, "note": "Incorrect option selected"}, {"question_id": 2, "title": "Binary Tree Traversal Deductions", "marks_earned": 0.0, "max_marks": 2.0, "note": "Incorrect option selected"}, {"question_id": 3, "title": "Server Request Latency Calculation", "marks_earned": 0.0, "max_marks": 2.0, "note": "Incorrect option selected"}], "passing_score": 65.0, "max_score": 6.0}	2026-09-05 15:48:29.065253	2026-09-05 16:03:03.332527	2026-09-05 15:48:42.174871	1
136	71	22	EVALUATED	0	0	f	{"questions": [{"question_id": 184, "title": "Analog Clock Hand Angle", "marks_earned": 0.0, "max_marks": 1.0, "note": "Incorrect option selected"}, {"question_id": 185, "title": "Iterative Loop Sum Deduction", "marks_earned": 0.0, "max_marks": 1.0, "note": "Incorrect option selected"}, {"question_id": 172, "title": "Ratio & Proportion Division", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 173, "title": "Percentage Profit Calculation", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 174, "title": "Arithmetic Progression Series", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 175, "title": "Combined Work Rate", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 176, "title": "Speed, Distance and Time", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 177, "title": "Simple Interest Accrual", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 178, "title": "Arithmetic Mean of Integer Set", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 179, "title": "Dice Roll Probability", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 180, "title": "Pattern Coding & Transposition", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 181, "title": "Family Tree Logical Deduction", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 182, "title": "Categorical Syllogism", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 183, "title": "Linear Age Relationship", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}, {"question_id": 186, "title": "Conditional Discount Flow Deduction", "marks_earned": 0.0, "max_marks": 1.0, "note": "Unanswered"}], "passing_score": 60.0, "max_score": 15.0}	2026-08-27 16:11:57.322139	2026-08-30 13:34:11.667213	2026-08-30 13:34:10.115115	1
\.


--
-- Data for Name: assessment_domains; Type: TABLE DATA; Schema: public; Owner: nasc_admin
--

COPY public.assessment_domains (id, slug, title, description, icon_name, is_active, created_at) FROM stdin;
1	software-development	Software Development	Technical hiring track covering cognitive aptitude, programming skills, CS fundamentals, and software debugging.	Code2	t	2026-08-18 15:53:39.655872
2	chat-process-executive	Chat Process Executive — International Post-Sales Support	Non-voice support assessment assessing typing speed, customer empathy, judgment, and live simulation.	Headphones	t	2026-08-18 15:53:39.698491
3	data-analyst	Data Analyst & Business Intelligence	Analytics hiring track evaluating statistical analysis, SQL querying, data hygiene, and case insights.	BarChart3	t	2026-08-18 15:53:39.716585
8	c-programming-track	C & Systems Programming Master Track	Comprehensive multi-round benchmark evaluating quantitative & logical aptitude, core C language constructs, pointer arithmetic, memory management (malloc/free), and systems debugging.	\N	t	2026-08-23 03:40:44.021365
\.


--
-- Data for Name: assessment_policies; Type: TABLE DATA; Schema: public; Owner: nasc_admin
--

COPY public.assessment_policies (id, round_id, passing_score, weightage_percent, min_score_percent, mandatory_pass) FROM stdin;
1	1	65	25	60	t
2	2	70	35	70	t
3	3	60	20	60	t
4	4	65	20	65	t
5	5	60	20	60	t
6	6	65	25	65	t
7	7	65	25	65	t
8	8	70	30	70	t
9	9	60	15	60	t
10	10	65	30	65	t
11	11	60	20	65	t
12	12	65	20	65	t
13	13	60	15	70	t
22	22	60	20	50	t
23	23	65	25	50	t
24	24	60	30	50	t
25	25	65	25	50	t
\.


--
-- Data for Name: assessment_questions; Type: TABLE DATA; Schema: public; Owner: nasc_admin
--

COPY public.assessment_questions (id, round_id, competency_id, question_type, title, candidate_content, candidate_code_template, options_json, difficulty, marks, time_limit_seconds, version, status, created_at, updated_at) FROM stdin;
1	1	1	mcq	Bitwise Operations & Shift Logic	What is the result of evaluating `(16 >> 2) | (4 << 1)` in standard integer arithmetic?	\N	[{"id": 1, "text": "12"}, {"id": 2, "text": "14"}, {"id": 3, "text": "8"}, {"id": 4, "text": "16"}]	Easy	2	60	1	Active	2026-08-20 13:59:34.074069	2026-08-20 13:59:34.074069
2	1	3	mcq	Binary Tree Traversal Deductions	A complete binary tree has 15 nodes. How many leaf nodes does this tree possess?	\N	[{"id": 1, "text": "7"}, {"id": 2, "text": "8"}, {"id": 3, "text": "9"}, {"id": 4, "text": "10"}]	Medium	2	60	1	Active	2026-08-20 13:59:34.094749	2026-08-20 13:59:34.094749
3	1	2	mcq	Server Request Latency Calculation	A microservice cluster processes 1,200 requests per second across 4 parallel worker instances. Each instance handles requests synchronously at an average duration of 2.5ms. What is the CPU utilization per instance?	\N	[{"id": 1, "text": "50%"}, {"id": 2, "text": "75%"}, {"id": 3, "text": "80%"}, {"id": 4, "text": "90%"}]	Medium	2	60	1	Active	2026-08-20 13:59:34.105263	2026-08-20 13:59:34.105263
4	2	4	coding	Two Sum Target Indices	### Problem Statement\nGiven an array of integers `nums` and an integer `target`, return the 0-based indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input will have exactly one solution, and you may not use the same element twice.\n\n### Input Format\n- Line 1: Space-separated integers representing `nums`\n- Line 2: Single integer representing `target`\n\n### Output Format\n- Space-separated indices in ascending order (e.g. `0 1`)\n\n### Constraints\n- $2 \\le \text{nums.length} \\le 10^5$\n- $-10^9 \\le \text{nums}[i] \\le 10^9$\n- Time Limit: 2.0 seconds\n	import sys\n\ndef solve():\n    lines = sys.stdin.read().splitlines()\n    if not lines:\n        return\n    nums = list(map(int, lines[0].split()))\n    target = int(lines[1].strip())\n    \n    # Write your solution here\n    seen = {}\n    for i, num in enumerate(nums):\n        complement = target - num\n        if complement in seen:\n            print(f"{seen[complement]} {i}")\n            return\n        seen[num] = i\n\nif __name__ == '__main__':\n    solve()\n	[]	Medium	20	3	1	Active	2026-08-20 13:59:34.124738	2026-08-20 13:59:34.124738
5	2	5	coding	Valid Anagram Checker	### Problem Statement\nGiven two strings `s` and `t`, return `true` if `t` is an anagram of `s`, and `false` otherwise.\nAn anagram is a word or phrase formed by rearranging the letters of a different word or phrase, using all the original letters exactly once.\n\n### Input Format\n- Line 1: String `s`\n- Line 2: String `t`\n\n### Output Format\n- Print `true` or `false` (lowercase).\n	import sys\n\ndef solve():\n    lines = sys.stdin.read().splitlines()\n    if len(lines) < 2:\n        return\n    s = lines[0].strip()\n    t = lines[1].strip()\n    \n    # Write your solution here\n    if sorted(s) == sorted(t):\n        print("true")\n    else:\n        print("false")\n\nif __name__ == '__main__':\n    solve()\n	[]	Easy	15	2	1	Active	2026-08-20 13:59:34.129651	2026-08-20 13:59:34.129651
6	3	7	mcq	Database Indexing Performance	Which of the following index structures is standardly utilized in PostgreSQL for handling range queries (e.g. `WHERE age BETWEEN 20 AND 30`) efficiently?	\N	[{"id": 1, "text": "Hash Index"}, {"id": 2, "text": "B-Tree Index"}, {"id": 3, "text": "GIN Index"}, {"id": 4, "text": "BRIN Index"}]	Medium	2	60	1	Active	2026-08-20 13:59:34.146756	2026-08-20 13:59:34.146756
7	3	11	mcq	REST API Idempotency	Which HTTP method is defined as idempotent according to RFC 7231 standards?	\N	[{"id": 1, "text": "POST"}, {"id": 2, "text": "PATCH"}, {"id": 3, "text": "PUT"}, {"id": 4, "text": "CONNECT"}]	Easy	2	60	1	Active	2026-08-20 13:59:34.149852	2026-08-20 13:59:34.149852
8	3	9	mcq	Operating Systems Deadlock Conditions	Which of the following is NOT one of Coffman's four necessary conditions for deadlock?	\N	[{"id": 1, "text": "Mutual Exclusion"}, {"id": 2, "text": "Hold and Wait"}, {"id": 3, "text": "Preemption Allowed"}, {"id": 4, "text": "Circular Wait"}]	Medium	2	60	1	Active	2026-08-20 13:59:34.159765	2026-08-20 13:59:34.159765
9	4	13	debugging	Fix Binary Search Boundary Condition	### Scenario: Broken Binary Search\nA junior developer wrote the following binary search routine, but it enters an infinite loop or produces incorrect indices on several edge cases.\n\n### Bug Description\nIdentify and fix the pointer update and loop condition bugs so the routine returns the exact index of `target`, or `-1` if not found.\n\n### Input Format\n- Line 1: Sorted space-separated integers\n- Line 2: Target integer\n	import sys\n\ndef binary_search(arr, target):\n    left = 0\n    right = len(arr) - 1\n    \n    # FIX THE BUGGY IMPLEMENTATION BELOW:\n    while left <= right:\n        mid = (left + right) // 2\n        if arr[mid] == target:\n            return mid\n        elif arr[mid] < target:\n            left = mid + 1\n        else:\n            right = mid - 1\n    return -1\n\ndef solve():\n    lines = sys.stdin.read().splitlines()\n    if not lines: return\n    arr = list(map(int, lines[0].split()))\n    target = int(lines[1].strip())\n    print(binary_search(arr, target))\n\nif __name__ == '__main__':\n    solve()\n	[]	Hard	15	2	1	Active	2026-08-20 13:59:34.177829	2026-08-20 13:59:34.177829
10	5	16	mcq	R1-Q01: Subject-Verb Agreement	Choose the grammatically correct sentence for customer communication:		[{"id": 1, "text": "Neither the order number nor the tracking details is available in the system."}, {"id": 2, "text": "Neither the order number nor the tracking details are available in the system."}, {"id": 3, "text": "Neither the order number nor the tracking details were being available."}, {"id": 4, "text": "Neither the order number or tracking details are available."}]	Easy	1	60	1	Active	2026-08-20 13:59:34.192752	2026-08-20 13:59:34.192752
11	5	16	mcq	R1-Q02: Past Participle & Tense	Select the correct sentence to confirm a processed refund:		[{"id": 1, "text": "Our accounts team has already did the refund yesterday."}, {"id": 2, "text": "Our accounts team has already processed the refund yesterday."}, {"id": 3, "text": "Our accounts team has already processed your refund."}, {"id": 4, "text": "Our accounts team have already process your refund."}]	Easy	1	60	1	Active	2026-08-20 13:59:34.199658	2026-08-20 13:59:34.199658
12	5	16	mcq	R1-Q03: Preposition Accuracy	Identify the correct preposition for shipping timeframe:		[{"id": 1, "text": "Your replacement package will be delivered on 3 to 5 business days."}, {"id": 2, "text": "Your replacement package will be delivered within 3 to 5 business days."}, {"id": 3, "text": "Your replacement package will be delivered inside 3 to 5 business days."}, {"id": 4, "text": "Your replacement package will be delivered at 3 to 5 business days."}]	Easy	1	60	1	Active	2026-08-20 13:59:34.205607	2026-08-20 13:59:34.205607
13	5	16	mcq	R1-Q04: Pronoun Agreement	Select the sentence with proper pronoun agreement:		[{"id": 1, "text": "Every customer must verify their account before we can share order details."}, {"id": 2, "text": "Every customer must verify there account before we can share order details."}, {"id": 3, "text": "Every customer must verify they're account before we can share order details."}, {"id": 4, "text": "Every customer have to verify their accounts."}]	Easy	1	60	1	Active	2026-08-20 13:59:34.209834	2026-08-20 13:59:34.209834
14	5	16	mcq	R1-Q05: Punctuation & Clarity	Which option uses professional punctuation for customer reassurance?		[{"id": 1, "text": "Don't worry I will check your account, and update you in a minute!"}, {"id": 2, "text": "Please rest assured; I am currently checking your order details and will update you shortly."}, {"id": 3, "text": "Please rest assured I am checking your order details, and will update you shortly?"}, {"id": 4, "text": "Rest assured, I am checking your details and updating you: shortly."}]	Easy	1	60	1	Active	2026-08-20 13:59:34.219682	2026-08-20 13:59:34.219682
15	5	17	mcq	R1-Q06: Vocabulary & Tone	Choose the most professional alternative to 'You have to wait':		[{"id": 1, "text": "You need to stay calm and hold on."}, {"id": 2, "text": "I kindly request your patience while I retrieve your billing records."}, {"id": 3, "text": "Wait a minute while I look into this."}, {"id": 4, "text": "You are required to wait for my response."}]	Easy	1	60	1	Active	2026-08-20 13:59:34.224472	2026-08-20 13:59:34.224472
16	5	17	mcq	R1-Q07: Modal Verbs & Politeness	Select the most polite request for order number:		[{"id": 1, "text": "Give me your order number."}, {"id": 2, "text": "Could you please provide your 8-digit order number so I can assist you?"}, {"id": 3, "text": "Order number is needed now."}, {"id": 4, "text": "Can you give the order number immediately?"}]	Easy	1	60	1	Active	2026-08-20 13:59:34.229486	2026-08-20 13:59:34.229486
17	5	16	mcq	R1-Q08: Conditional Sentences	Select the correct conditional sentence for policy explanation:		[{"id": 1, "text": "If the package arrives damaged, we would have replaced it immediately."}, {"id": 2, "text": "If the package arrives damaged, we will arrange a complimentary replacement immediately."}, {"id": 3, "text": "If the package will arrive damaged, we will replace it."}, {"id": 4, "text": "If package arrives damaged, we are replace it."}]	Medium	1	60	1	Active	2026-08-20 13:59:34.242952	2026-08-20 13:59:34.242952
18	5	22	mcq	R1-Q09: Active Voice & Directness	Which sentence communicates proactive ownership in active voice?		[{"id": 1, "text": "An investigation will be conducted by us regarding your delayed shipment."}, {"id": 2, "text": "I have escalated this issue to our courier partner to expedite your delivery."}, {"id": 3, "text": "The courier is being contacted by our department."}, {"id": 4, "text": "Your issue was taken by our team."}]	Medium	1	60	1	Active	2026-08-20 13:59:34.250336	2026-08-20 13:59:34.250336
19	5	16	mcq	R1-Q10: Spelling & Common Errors	Identify the sentence without any spelling errors:		[{"id": 1, "text": "We apologize for the inconvienience caused by the courier delay."}, {"id": 2, "text": "We apologize for the inconvenience caused by the courier delay."}, {"id": 3, "text": "We appologize for the inconvenience caused by the courier delay."}, {"id": 4, "text": "We apologize for the inconveneince caused by courier delay."}]	Medium	1	60	1	Active	2026-08-20 13:59:34.250336	2026-08-20 13:59:34.250336
20	5	16	mcq	R1-Q11: Word Choice - Affect vs Effect	Select the sentence with correct word usage:		[{"id": 1, "text": "The holiday weekend will not effect your scheduled delivery date."}, {"id": 2, "text": "The holiday weekend will not affect your scheduled delivery date."}, {"id": 3, "text": "The holiday weekend has no affect on your delivery."}, {"id": 4, "text": "The delivery is not effected by the holiday."}]	Medium	1	60	1	Active	2026-08-20 13:59:34.260885	2026-08-20 13:59:34.260885
21	5	17	mcq	R1-Q12: Redundancy Reduction	Choose the most concise and professional statement:		[{"id": 1, "text": "At this exact point in time right now, your order is being packed."}, {"id": 2, "text": "Your order is currently being packed for shipment."}, {"id": 3, "text": "Presently at this moment, your order is undergoing packaging."}, {"id": 4, "text": "Your order is in the process of being packed right now at this time."}]	Medium	1	60	1	Active	2026-08-20 13:59:34.271011	2026-08-20 13:59:34.271011
22	5	17	mcq	R1-Q13: Business Email Closing	Which is the most appropriate closing statement for a support chat?		[{"id": 1, "text": "Bye bye and have fun."}, {"id": 2, "text": "Thank you for contacting support. Please let me know if there is anything else I can assist you with today!"}, {"id": 3, "text": "That's all from my side. Closing chat now."}, {"id": 4, "text": "Chat closed by agent."}]	Medium	1	60	1	Active	2026-08-20 13:59:34.279589	2026-08-20 13:59:34.279589
23	5	16	mcq	R1-Q14: Adjective vs Adverb	Select the correct sentence:		[{"id": 1, "text": "Our technical support team works quick to resolve server outages."}, {"id": 2, "text": "Our technical support team works quickly to resolve server outages."}, {"id": 3, "text": "Our technical support team works more quicker to resolve outages."}, {"id": 4, "text": "Our team resolves outages very fastly."}]	Medium	1	60	1	Active	2026-08-20 13:59:34.281113	2026-08-20 13:59:34.281113
24	5	20	mcq	R1-Q15: Clarity in Apology	Choose the best statement to express sincere empathy without over-promising:		[{"id": 1, "text": "I am terribly sorry, our company made a huge mistake and everything is ruined."}, {"id": 2, "text": "I understand how frustrating this delay is, and I am personally reviewing your shipment records to resolve this for you."}, {"id": 3, "text": "Sorry for this, but our warehouse is having problems today."}, {"id": 4, "text": "Don't be mad, I promise you will get your item today no matter what."}]	Medium	1	60	1	Active	2026-08-20 13:59:34.291352	2026-08-20 13:59:34.291352
25	5	16	mcq	R1-Q16: Singular vs Plural	Select the grammatically accurate sentence:		[{"id": 1, "text": "The criteria for warranty replacement has been met."}, {"id": 2, "text": "The criteria for warranty replacement have been met."}, {"id": 3, "text": "The criterias for warranty replacement is met."}, {"id": 4, "text": "The criterion for warranty replacement are met."}]	Hard	1	60	1	Active	2026-08-20 13:59:34.301452	2026-08-20 13:59:34.301452
26	5	17	mcq	R1-Q17: Direct Question Formatting	Which is the correct way to ask a customer for confirmation?		[{"id": 1, "text": "May I confirm if 742 Evergreen Terrace is your current mailing address?"}, {"id": 2, "text": "Can I know your address is 742 Evergreen Terrace?"}, {"id": 3, "text": "Tell me if your address is 742 Evergreen Terrace or not?"}, {"id": 4, "text": "Your address 742 Evergreen Terrace, right?"}]	Hard	1	60	1	Active	2026-08-20 13:59:34.311628	2026-08-20 13:59:34.311628
27	5	17	mcq	R1-Q18: Avoidance of Jargon	Which message avoids confusing internal jargon for an international customer?		[{"id": 1, "text": "The WMS flagged your SKU as OOS so the 3PL couldn't generate the AWB."}, {"id": 2, "text": "The item you ordered is temporarily out of stock, so our warehouse has not yet created the shipping label."}, {"id": 3, "text": "Our ERP system triggered a backlog exception for your order ID."}, {"id": 4, "text": "The logistics node failed to fulfill your dispatch token."}]	Hard	1	60	1	Active	2026-08-20 13:59:34.327793	2026-08-20 13:59:34.327793
28	5	16	mcq	R1-Q19: Hyphenation & Modifiers	Select the properly punctuated sentence:		[{"id": 1, "text": "We provide twenty four hour customer assistance."}, {"id": 2, "text": "We provide 24-hour customer assistance for all post-sales inquiries."}, {"id": 3, "text": "We provide twenty-four hours customer assistance."}, {"id": 4, "text": "We provide 24 hours-customer assistance."}]	Hard	1	60	1	Active	2026-08-20 13:59:34.338308	2026-08-20 13:59:34.338308
29	5	21	mcq	R1-Q20: Tone Softening & Courtesy	Choose the best phrasing when unable to fulfill an out-of-policy request:		[{"id": 1, "text": "You cannot get a refund because it is against our policy."}, {"id": 2, "text": "While our policy does not permit cash refunds after 30 days, I can gladly offer you a full store credit or product exchange today."}, {"id": 3, "text": "No refund allowed. Read our terms of service."}, {"id": 4, "text": "Our policy strictly prohibits what you are asking."}]	Hard	1	60	1	Active	2026-08-20 13:59:34.35014	2026-08-20 13:59:34.35014
79	10	8	sql	Department High Earner Salary SQL Query	Given a table `employees` with columns `employee_id`, `employee_name`, `department`, `salary`, and `hire_date`, write a SQL query to calculate average salary per department and filter for departments with an average salary exceeding $80,000.	\N	[]	Medium	15	300	1	Active	2026-08-20 13:59:34.811681	2026-08-20 13:59:34.811681
30	5	17	mcq	R1-Q21: Tone Correction 1	Original Customer Support Message:\n"u need wait we already told you tracking will update tomorrow."\n\nWhich is the best professional revision?		[{"id": 1, "text": "You must wait as we told you tracking updates tomorrow."}, {"id": 2, "text": "Thank you for your patience. Your tracking details are scheduled to update by tomorrow morning, and I will be glad to monitor it for you."}, {"id": 3, "text": "Wait until tomorrow because the system is slow."}, {"id": 4, "text": "We already told you it will update tomorrow, please check then."}]	Medium	1.5	60	1	Active	2026-08-20 13:59:34.363932	2026-08-20 13:59:34.363932
31	5	21	mcq	R1-Q22: Tone Correction 2	Original Customer Support Message:\n"Thats not our fault the courier lost it contact them yourself."\n\nWhich is the best professional revision?		[{"id": 1, "text": "The courier lost your parcel, so please reach out to them directly."}, {"id": 2, "text": "I am so sorry to hear that your parcel has been delayed by the carrier. Let me contact our shipping partner right now to file a claim and resolve this for you."}, {"id": 3, "text": "We are not responsible for courier mistakes, but here is their phone number."}, {"id": 4, "text": "You should call the courier company because it is out of our hands."}]	Medium	1.5	60	1	Active	2026-08-20 13:59:34.375497	2026-08-20 13:59:34.375497
32	5	20	mcq	R1-Q23: Tone Correction 3	Original Customer Support Message:\n"Why are you asking for refund again? We said no yesterday."\n\nWhich is the best professional revision?		[{"id": 1, "text": "You were already informed yesterday that a refund cannot be issued."}, {"id": 2, "text": "I understand your concern regarding the refund request. Let me review the case history from yesterday to ensure we have explored all available solutions for you."}, {"id": 3, "text": "We cannot process refunds once denied, stop asking."}, {"id": 4, "text": "As stated yesterday, no refund is possible."}]	Medium	1.5	60	1	Active	2026-08-20 13:59:34.3853	2026-08-20 13:59:34.3853
33	5	28	mcq	R1-Q24: Tone Correction 4	Original Customer Support Message:\n"give me your credit card password and otp so i can fix billing."\n\nWhat is the critical failure in this message and how should it be corrected?		[{"id": 1, "text": "Minor error; it should ask for CVV instead."}, {"id": 2, "text": "Critical compliance violation; agents must never request passwords or OTPs. The agent should guide the customer to update payment securely via their account dashboard."}, {"id": 3, "text": "It is acceptable if the customer agrees in chat."}, {"id": 4, "text": "The agent should request credit card photos instead."}]	Medium	1.5	60	1	Active	2026-08-20 13:59:34.399715	2026-08-20 13:59:34.399715
34	5	21	mcq	R1-Q25: Tone Correction 5	Original Customer Support Message:\n"Calm down bro its just a small delay of 2 days."\n\nWhich is the best professional revision for a US/Canada customer?		[{"id": 1, "text": "Calm down, your order is only 2 days late."}, {"id": 2, "text": "I completely understand your frustration with this two-day delay, especially when you were expecting prompt delivery. Let me check the courier status immediately."}, {"id": 3, "text": "Bro, it will arrive soon so please do not worry."}, {"id": 4, "text": "Two days delay is normal during holiday seasons."}]	Medium	1.5	60	1	Active	2026-08-20 13:59:34.410372	2026-08-20 13:59:34.410372
35	5	18	typing_test	R1-Q26: Post-Sales Support Typing Benchmark	Thank you for contacting customer support today. I understand that your recent shipment has not arrived as scheduled, and I sincerely apologize for the inconvenience this delay has caused. I am currently reviewing your order details, tracking information, and warehouse logs to locate your package. Please rest assured that our priority is ensuring you receive your items safely and promptly. If the package cannot be located within twenty-four hours, we will be glad to arrange an expedited replacement or process a full refund to your original payment method.		[]	Medium	5	180	1	Active	2026-08-20 13:59:34.421365	2026-08-20 13:59:34.421365
36	6	20	scenario	R2-Case01: Scenario 1: Delayed International Delivery (US to Canada)	Customer: David Miller (Toronto, Canada)\nOrder: #US-8492 ($189.00 - Express 2-Day Shipping)\nStatus: Shipped 5 days ago, stuck in customs clearance.\nCustomer Message: 'I paid $35 extra for Express 2-day delivery because this was a birthday gift for my daughter yesterday. It has been 5 days and nobody is updating me. This is unacceptable!'\n\nWhat is the best immediate response?		[{"id": 1, "text": "Customs delays are beyond our control, so please wait until border services clear it."}, {"id": 2, "text": "I completely understand your disappointment, David, especially since this was a special birthday gift for your daughter. I have reviewed tracking and see it is currently held at Toronto customs. I am immediately refunding your $35 express shipping fee and contacting our international carrier liaison to expedite release."}, {"id": 3, "text": "You can file a complaint with Canada Post directly."}, {"id": 4, "text": "I will cancel your order right now so you get your money back in 10 days."}]	Medium	2	60	1	Active	2026-08-20 13:59:34.452194	2026-08-20 13:59:34.452194
37	6	21	scenario	R2-Case02: Scenario 2: Duplicate Credit Card Charge	Customer: Sarah Jenkins (Chicago, USA)\nAccount: Verified ($450.00 Order)\nCustomer Message: 'My online bank statement shows two pending charges of $450.00 from your store today. You charged me $900 for a single order! Fix this immediately or I am filing a bank dispute!'\n\nWhat is the most accurate and reassuring resolution?		[{"id": 1, "text": "Please provide your full 16-digit card number and CVV so I can check with our payment gateway."}, {"id": 2, "text": "I understand your concern about the duplicate charge, Sarah. Let me check our merchant gateway records right now. Oftentimes, one entry is a temporary pre-authorization hold that automatically drops off within 24-48 hours. Let me verify whether we captured one or two payments, and if duplicate, I will void it instantly."}, {"id": 3, "text": "Go ahead and file the dispute with your bank, they will handle it."}, {"id": 4, "text": "Our system never makes mistakes, so check with your bank."}]	Medium	2	60	1	Active	2026-08-20 13:59:34.45764	2026-08-20 13:59:34.45764
38	6	22	scenario	R2-Case03: Scenario 3: Damaged Goods Received	Customer: Michael Chang (Seattle, USA)\nOrder: #US-9912 (Ceramic Cookware Set - $240.00)\nCustomer Message: 'The box arrived crushed and two of the ceramic pots are completely shattered. I need this for a dinner party this Friday.'\n\nWhat is the correct protocol?		[{"id": 1, "text": "Ship the broken glass pieces back to our warehouse before we can issue a replacement."}, {"id": 2, "text": "I am so sorry to hear the cookware arrived broken, Michael. For your safety, please do not handle the broken ceramic. If you can quickly upload a photo of the damaged box and pots in this chat, I will dispatch an express replacement today with overnight delivery so you have it before Friday."}, {"id": 3, "text": "You must wait 14 business days for our insurance claim with FedEx to settle."}, {"id": 4, "text": "We cannot help with shipping damages; contact FedEx."}]	Medium	2	60	1	Active	2026-08-20 13:59:34.465228	2026-08-20 13:59:34.465228
76	10	43	mcq	Dynamic Excel Lookup with XLOOKUP	You need to retrieve the `Employee_Salary` from Column D matching an `Employee_ID` in cell A2. Which XLOOKUP formula correctly performs this lookup with a default fallback of 'Not Found'?	\N	[{"key": "A", "text": "=XLOOKUP(A2, Employee_ID_Range, Salary_Range, \\"Not Found\\")"}, {"key": "B", "text": "=VLOOKUP(A2, Salary_Range, 4, FALSE)"}, {"key": "C", "text": "=LOOKUP(A2, Employee_ID_Range, \\"Not Found\\")"}, {"key": "D", "text": "=XLOOKUP(Salary_Range, A2, \\"Not Found\\")"}]	Easy	10	180	1	Active	2026-08-20 13:59:34.785997	2026-08-20 13:59:34.785997
39	6	21	scenario	R2-Case04: Scenario 4: Out of Policy Refund Demand with Review Threat	Customer: Robert Taylor (Miami, USA)\nOrder: #US-7011 (Leather Jacket - Purchased 65 days ago, Return Policy is 30 days)\nCustomer Message: 'I wore this twice and don't like the fit. Give me a full refund to my card now, or I will post 1-star reviews on Trustpilot, Reddit, and Twitter with screenshots of your awful service!'\n\nHow should you handle this situation professionally?		[{"id": 1, "text": "Threatening us with bad reviews violates our terms. I am disconnecting this chat."}, {"id": 2, "text": "I understand you are unhappy with the fit, Robert. While our credit card refund policy is strictly 30 days from purchase, I genuinely want to help find a positive resolution for you. I can arrange an exception for a full store credit or facilitate an exchange for a size that fits you comfortably."}, {"id": 3, "text": "Since you threatened us, I will give you a full cash refund immediately so you don't post bad reviews."}, {"id": 4, "text": "Our policy is 30 days. There is nothing we can do."}]	Medium	2	60	1	Active	2026-08-20 13:59:34.469868	2026-08-20 13:59:34.469868
40	6	22	scenario	R2-Case05: Scenario 5: Supervisor Escalation Request	Customer: Amanda White (Boston, USA)\nCustomer Message: 'I have been transferred three times already and nobody knows what they are doing. Transfer me to your supervisor right now, I refuse to talk to front-line agents!'\n\nWhat is the best de-escalation response before initiating supervisor transfer?		[{"id": 1, "text": "My supervisor is busy and will tell you the exact same thing as me."}, {"id": 2, "text": "I completely understand your frustration with being transferred multiple times, Amanda. I am an experienced senior support specialist, and I want to take full personal ownership of your issue so you don't have to repeat yourself. If you'll give me one opportunity to look into your case, I will do everything within my authority to resolve it, or connect you directly with my team lead if needed."}, {"id": 3, "text": "Please hold for 45 minutes while I look for a supervisor."}, {"id": 4, "text": "Supervisors do not take chat requests."}]	Medium	2	60	1	Active	2026-08-20 13:59:34.478159	2026-08-20 13:59:34.478159
41	6	22	scenario	R2-Case06: Scenario 6: Incorrect Item Received (Wrong Color/Model)	Customer: James Wilson (Vancouver, Canada)\nOrder: #CA-3301 (Ordered: Matte Black Headphones / Received: Neon Green)\nCustomer Message: 'I opened the box and received neon green headphones instead of matte black. How does your warehouse mess up something so simple?'\n\nWhat is the appropriate customer resolution?		[{"id": 1, "text": "Neon green is actually our newest model, maybe give it a try?"}, {"id": 2, "text": "I apologize for our warehouse mix-up, James. You ordered Matte Black and that is exactly what you should have received. I have just generated a prepaid return shipping label for the green unit and placed a priority re-shipment for the Matte Black model at no extra cost."}, {"id": 3, "text": "Please return the item at your own shipping expense and we will refund when it arrives."}, {"id": 4, "text": "Warehouse mistakes happen all the time; wait for next batch."}]	Medium	2	60	1	Active	2026-08-20 13:59:34.479677	2026-08-20 13:59:34.479677
42	6	23	scenario	R2-Case07: Scenario 7: Defective Product under Warranty	Customer: Lisa Brown (Austin, USA)\nOrder: #US-6102 (Electric Espresso Machine - Purchased 5 months ago, 1-Year Warranty)\nCustomer Message: 'The pressure pump stopped working this morning and water is leaking from the base. I need a replacement machine.'\n\nWhat is the correct protocol?		[{"id": 1, "text": "5 months is too long; you must buy a new machine."}, {"id": 2, "text": "I am sorry to hear your espresso machine is leaking, Lisa. Since your product is well within our 1-Year Manufacturer Warranty, let's get this resolved. I can guide you through a quick 1-minute reset, and if that does not resolve the pump, I will immediately issue a warranty replacement unit."}, {"id": 3, "text": "Call the manufacturer in China directly; we only sell the items."}, {"id": 4, "text": "Send it to a local repair shop and pay for it yourself."}]	Hard	2	60	1	Active	2026-08-20 13:59:34.489802	2026-08-20 13:59:34.489802
43	6	25	scenario	R2-Case08: Scenario 8: Cancellation Request on Shipped Order	Customer: Kevin Harris (Dallas, USA)\nOrder: #US-8820 ($320.00 Gaming Chair)\nStatus: Shipped via UPS 2 hours ago (Tracking generated)\nCustomer Message: 'I changed my mind 10 minutes ago. Cancel this order immediately and refund my card before it ships!'\n\nHow should you handle an order that has already been dispatched?		[{"id": 1, "text": "Your order has been cancelled and refunded. Have a great day!"}, {"id": 2, "text": "I checked your order, Kevin, and our warehouse dispatched it via UPS earlier this morning. Because it is already with the carrier, I cannot cancel it in the warehouse system. However, I have just submitted a UPS Package Intercept request to return it to our hub, or you can simply refuse delivery when the driver arrives for an automatic full refund."}, {"id": 3, "text": "You should have cancelled earlier; it is your responsibility now."}, {"id": 4, "text": "No cancellations allowed ever."}]	Hard	2	60	1	Active	2026-08-20 13:59:34.492406	2026-08-20 13:59:34.492406
44	6	28	scenario	R2-Case09: Scenario 9: Unrecognized Account Login / Security Alert	Customer: Rachel Adams (New York, USA)\nCustomer Message: 'I got an email saying someone logged into my account from Russia and placed an order for $800 gift cards! Cancel that order and lock my account!'\n\nWhat is the immediate security protocol?		[{"id": 1, "text": "What is your account password so I can log in and cancel it for you?"}, {"id": 2, "text": "I am treating this with highest security priority, Rachel. I have immediately locked your account credentials and placed a fraud freeze on the pending gift card transaction so no funds are transferred. I am sending a secure password reset link to your verified email address to restore your account safely."}, {"id": 3, "text": "Check if your family members used your card before panicking."}, {"id": 4, "text": "We cannot lock accounts via chat; send a physical letter."}]	Hard	2	60	1	Active	2026-08-20 13:59:34.499764	2026-08-20 13:59:34.499764
45	6	21	scenario	R2-Case10: Scenario 10: Aggressive Customer Using Profanity	Customer: John Doe (Philadelphia, USA)\nCustomer Message: 'Your f***ing software crashed and ruined my work presentation. You guys are complete idiots and thieves!'\n\nHow should an international chat agent handle abusive language while de-escalating?		[{"id": 1, "text": "Do not curse at me, you are the idiot here."}, {"id": 2, "text": "I understand that the software crash caused a major disruption to your presentation, and I truly want to help resolve the technical issue for you. However, I kindly ask that we maintain a respectful conversation so I can assist you effectively. Let's look into the crash log together."}, {"id": 3, "text": "Chat disconnected due to foul language."}, {"id": 4, "text": "I will give you $100 cash if you stop swearing."}]	Hard	2	60	1	Active	2026-08-20 13:59:34.508841	2026-08-20 13:59:34.508841
77	10	46	mcq	Multi-Source CSV & SQL Data Ingestion Strategy	When extracting monthly transactions from legacy CSV files and combining them with live SQL database tables, what is the best practice for handling schema mismatches and duplicate records?	\N	[{"key": "A", "text": "Append raw CSV strings directly into SQL without validation."}, {"key": "B", "text": "Standardize data types & column headers during staging, deduplicate on primary key, and load into analytical model."}, {"key": "C", "text": "Ignore CSV files and only query SQL database tables."}, {"key": "D", "text": "Delete duplicate rows manually in Excel before SQL import."}]	Medium	10	200	1	Active	2026-08-20 13:59:34.795104	2026-08-20 13:59:34.795104
46	6	17	scenario	R2-Case11: Scenario 11: International Customer with Language Barrier	Customer: Jean-Pierre (Montreal, Canada)\nCustomer Message: 'Bonjour, package no arrive. tracking say delivered but no package in my porte. please aidez moi.'\n\nHow do you respond with clear, simple, and supportive language?		[{"id": 1, "text": "We only speak English in this support queue. Transferring you to French."}, {"id": 2, "text": "Hello Jean-Pierre! I understand your package shows delivered, but you have not received it. Let me help you right now. Please confirm if your postal code is H2X 1Y4 so I can check with Canada Post GPS delivery scan."}, {"id": 3, "text": "You must write in perfect English or we cannot help."}, {"id": 4, "text": "Canada Post delivered it so look around your building."}]	Hard	2	60	1	Active	2026-08-20 13:59:34.509871	2026-08-20 13:59:34.509871
47	6	19	scenario	R2-Case12: Scenario 12: High-Value Customer VIP Retention	Customer: Victoria Sterling (San Francisco, USA)\nCustomer Status: Platinum Tier (50+ orders, $8,000 annual spend)\nCustomer Message: 'I have been a loyal customer for 4 years, but my anniversary promo code is saying invalid at checkout. If your system won't honor my loyalty reward, I will take my business elsewhere.'\n\nWhat is the empowered resolution?		[{"id": 1, "text": "Promo codes expire automatically, so read the expiration date on your email."}, {"id": 2, "text": "First, Victoria, thank you so much for being a valued Platinum member for over 4 years! I can see your account history, and I am glad to apply your 25% anniversary discount directly to your cart right now from my console. You can proceed to checkout with the discount applied."}, {"id": 3, "text": "You can place order at full price and maybe email us later."}, {"id": 4, "text": "Sorry, computer says code invalid."}]	Hard	2	60	1	Active	2026-08-20 13:59:34.51974	2026-08-20 13:59:34.51974
48	7	23	sop_case	R3-SOP01: SOP Case 1: Return Window Eligibility (Electronics)	SOP Reference: KB-RET-01 (Return Windows)\nPolicy: Consumer electronics are eligible for return within 30 days of delivery. Returns requested between 31-45 days are eligible for Store Credit only. Returns after 45 days are strictly ineligible.\n\nCase Details:\nCustomer purchased a DSLR camera delivered 38 days ago. Item is in original packaging.\n\nWhat is the compliant resolution and required documentation?		[{"id": 1, "text": "Issue full refund to original credit card; Tag: REFUND_ORIGINAL"}, {"id": 2, "text": "Approve return for Store Credit only; Tag: RETURN_STORE_CREDIT; Internal Note: 'Camera delivered 38 days ago (31-45 day window). Approved store credit per KB-RET-01.'"}, {"id": 3, "text": "Reject return completely; Tag: RETURN_REJECTED"}, {"id": 4, "text": "Tell customer to sell it online."}]	Medium	2	60	1	Active	2026-08-20 13:59:34.529628	2026-08-20 13:59:34.529628
49	7	25	sop_case	R3-SOP02: SOP Case 2: Lost in Transit (Package Investigation Window)	SOP Reference: KB-LOG-04 (Lost in Transit Claims)\nPolicy: If carrier tracking shows no movement for 5 consecutive business days, agent is authorized to declare package Lost-in-Transit (LIT) and trigger immediate replacement or refund. If under 5 days, customer must be advised to allow 48 hours for carrier updates.\n\nCase Details:\nCustomer tracking has had zero scan updates for 7 consecutive days.\n\nWhat is the compliant SOP action?		[{"id": 1, "text": "Advise customer to wait another week before contacting support."}, {"id": 2, "text": "Declare package Lost-in-Transit (LIT). Offer customer choice of priority replacement or full refund. File carrier claim reference #LIT-CARRIER."}, {"id": 3, "text": "Tell customer to drive to carrier regional sorting facility."}, {"id": 4, "text": "Close ticket as pending courier."}]	Medium	2	60	1	Active	2026-08-20 13:59:34.542774	2026-08-20 13:59:34.542774
50	7	28	sop_case	R3-SOP03: SOP Case 3: Identity Verification before Disclosing Account Data	SOP Reference: KB-SEC-02 (Customer Authentication Protocol)\nPolicy: Before sharing order history, updating shipping addresses, or discussing financial details, agent MUST verify 2 account credentials: 1) Full Name on account, and 2) Either Order Number or Billing Zip Code. Never ask for Passwords or CVV.\n\nCase Details:\nA chat user asks to change the shipping address on Order #8849. User provides only first name 'John'.\n\nWhat is the required SOP verification?		[{"id": 1, "text": "Change address immediately because they have the order number."}, {"id": 2, "text": "Ask for account password to verify identity."}, {"id": 3, "text": "Request full name and billing zip code associated with the account before executing address change."}, {"id": 4, "text": "Refuse to assist and terminate chat."}]	Medium	2	60	1	Active	2026-08-20 13:59:34.550248	2026-08-20 13:59:34.550248
51	7	29	sop_case	R3-SOP04: SOP Case 4: High-Value Refund Approval Matrix ($500+)	SOP Reference: KB-REF-03 (Refund Authorization Levels)\nPolicy: Tier-1 Chat Agents can authorize refunds up to $250.00 independently. Refunds between $250.01 - $500.00 require Senior Agent approval. Refunds above $500.00 require Tier-2 Supervisor approval and photo proof of return receipt.\n\nCase Details:\nCustomer requests refund of $680.00 for returned laptop.\n\nWhat is the mandatory escalation protocol?		[{"id": 1, "text": "Process $680.00 refund directly from Tier-1 console."}, {"id": 2, "text": "Verify return receipt in warehouse records, attach documentation, and escalate ticket to Tier-2 Supervisor for $680.00 refund authorization."}, {"id": 3, "text": "Split the refund into three $220 charges so you don't need supervisor approval."}, {"id": 4, "text": "Tell customer high value items are non-refundable."}]	Medium	2	60	1	Active	2026-08-20 13:59:34.559381	2026-08-20 13:59:34.559381
52	7	23	sop_case	R3-SOP05: SOP Case 5: Warranty Defect vs Accidental Damage	SOP Reference: KB-WAR-01 (Warranty Scope)\nPolicy: Manufacturer warranty covers internal hardware malfunctions, component failures, and factory defects. It excludes cosmetic damage, water immersion, cracked screens from drops, and unauthorized modifications.\n\nCase Details:\nCustomer states: 'My tablet slipped out of my hand on the driveway and the screen is cracked.'\n\nWhat is the correct policy determination?		[{"id": 1, "text": "Issue a free warranty replacement under manufacturer defect policy."}, {"id": 2, "text": "Explain politely that accidental drop damage is not covered under the 1-year manufacturer warranty, and provide options for paid out-of-warranty repair or trade-in discount."}, {"id": 3, "text": "Tell customer to lie on the warranty form and say it arrived cracked."}, {"id": 4, "text": "Disconnect chat because warranty is void."}]	Medium	2	60	1	Active	2026-08-20 13:59:34.566208	2026-08-20 13:59:34.566208
53	7	25	sop_case	R3-SOP06: SOP Case 6: Price Match Policy Within 14 Days	SOP Reference: KB-BIL-02 (Price Protection)\nPolicy: Customers are eligible for a price match refund if the identical product is discounted on our store within 14 days of purchase. Excludes clearance items and third-party marketplace sellers.\n\nCase Details:\nCustomer purchased jacket for $120.00 8 days ago. Today our official store price is $90.00.\n\nWhat is the action and refund calculation?		[{"id": 1, "text": "Deny price match because order is already delivered."}, {"id": 2, "text": "Approve price match adjustment of $30.00 ($120 - $90) refund to original card under 14-day price protection policy."}, {"id": 3, "text": "Tell customer to return the jacket and buy it again."}, {"id": 4, "text": "Give $90 store credit."}]	Medium	2	60	1	Active	2026-08-20 13:59:34.570691	2026-08-20 13:59:34.570691
54	7	28	sop_case	R3-SOP07: SOP Case 7: Fraud Alert - Stolen Card Claim	SOP Reference: KB-SEC-05 (Fraud Protocol)\nPolicy: If a contact claims their credit card was used fraudulently on our site without authorization, agent MUST: 1) Immediately cancel unshipped orders, 2) Freeze account, 3) Escalate to Trust & Safety team. Never argue or disclose fraudster's shipping address to the caller.\n\nCase Details:\nCaller states: 'Someone made a $400 charge on my Visa card at your store.'\n\nWhat is the compliant protocol?		[{"id": 1, "text": "Read out the thief's delivery address to the caller."}, {"id": 2, "text": "Locate transaction by transaction ID / last 4 digits of card, halt shipment, apply fraud freeze, and route ticket to Trust & Safety team. Advise caller to contact card issuer for chargeback."}, {"id": 3, "text": "Tell caller it is their own bank's problem."}, {"id": 4, "text": "Ignore the claim if order is already packed."}]	Medium	2	60	1	Active	2026-08-20 13:59:34.580861	2026-08-20 13:59:34.580861
55	7	23	sop_case	R3-SOP08: SOP Case 8: Hazardous Material / Battery Return Policy	SOP Reference: KB-RET-04 (Hazardous Materials)\nPolicy: Lithium-ion batteries that are swollen, punctured, or leaking CANNOT be shipped via standard postal returns due to federal air transport safety regulations. Customer must dispose safely locally; agent issues direct replacement/refund upon photo confirmation.\n\nCase Details:\nCustomer reports laptop battery is swollen and bulging out of the case.\n\nWhat is the compliant safety action?		[{"id": 1, "text": "Ask customer to put swollen battery in a cardboard box and ship via standard mail."}, {"id": 2, "text": "Instruct customer to safely stop using device, do not mail back due to hazardous materials regulations, request photo for compliance, and process replacement unit."}, {"id": 3, "text": "Tell customer to throw it in regular trash bin."}, {"id": 4, "text": "Refuse refund until physical battery arrives at warehouse."}]	Medium	2	60	1	Active	2026-08-20 13:59:34.583699	2026-08-20 13:59:34.583699
56	7	24	sop_case	R3-SOP09: SOP Case 9: Restocking Fee Exemptions	SOP Reference: KB-RET-05 (Restocking Fees)\nPolicy: Standard discretionary returns incur a 15% restocking fee. Restocking fees are 100% WAIVED if: 1) Item is defective, 2) Wrong item sent by warehouse, or 3) Customer is Platinum VIP member.\n\nCase Details:\nPlatinum VIP customer returns an unopened monitor because they changed their mind.\n\nIs a restocking fee charged?		[{"id": 1, "text": "Charge 15% restocking fee ($30)."}, {"id": 2, "text": "Waive the 15% restocking fee entirely per Platinum VIP exemption policy in KB-RET-05."}, {"id": 3, "text": "Charge 5% fee as compromise."}, {"id": 4, "text": "Refuse return because monitors cannot be returned."}]	Hard	2	60	1	Active	2026-08-20 13:59:34.592688	2026-08-20 13:59:34.592688
57	7	25	sop_case	R3-SOP10: SOP Case 10: Address Correction After Dispatch	SOP Reference: KB-LOG-02 (In-Transit Address Modifications)\nPolicy: Address modifications cannot be made directly in warehouse system once carrier has received shipment. Agent must submit carrier package redirect request ($10 fee charged by carrier, waived if error was warehouse fault).\n\nCase Details:\nCustomer entered wrong street number during checkout and package is on delivery truck.\n\nWhat is the SOP action?		[{"id": 1, "text": "Edit address in internal database and tell customer it will arrive today."}, {"id": 2, "text": "Inform customer package is in carrier possession; initiate carrier package reroute request via carrier API portal and set expectation of 24-hour delay."}, {"id": 3, "text": "Tell customer to run after delivery truck."}, {"id": 4, "text": "Cancel shipment and keep the money."}]	Hard	2	60	1	Active	2026-08-20 13:59:34.601466	2026-08-20 13:59:34.601466
58	7	23	sop_case	R3-SOP11: SOP Case 11: International Duty & Customs Taxes	SOP Reference: KB-INT-01 (Customs & Import Duties)\nPolicy: For DDP (Delivered Duty Paid) shipping, our store pays all customs taxes upfront. If local carrier mistakenly demands payment from customer upon delivery, agent verifies receipt and reimburses customer immediately.\n\nCase Details:\nCanadian customer with DDP shipping was charged $28 CAD import tax by DHL courier.\n\nWhat is the correct resolution?		[{"id": 1, "text": "Tell customer international taxes are always their responsibility."}, {"id": 2, "text": "Confirm DDP shipping was selected, request photo of DHL customs tax receipt, and issue immediate $28 CAD credit adjustment to customer."}, {"id": 3, "text": "Tell customer to refuse delivery and return package."}, {"id": 4, "text": "Advise customer to contact Canadian government."}]	Hard	2	60	1	Active	2026-08-20 13:59:34.608621	2026-08-20 13:59:34.608621
59	7	24	sop_case	R3-SOP12: SOP Case 12: Partial Order Fulfillment Notification	SOP Reference: KB-ORD-03 (Split Shipments)\nPolicy: When multi-item orders ship from different regional warehouses, each shipment has an independent tracking number. Agent must look up all fulfillment child-IDs before declaring items missing.\n\nCase Details:\nCustomer ordered a keyboard and mouse. Received only keyboard and claims mouse is missing.\n\nWhat investigation step is required?		[{"id": 1, "text": "Immediately process refund for mouse as missing item."}, {"id": 2, "text": "Check order fulfillment breakdown for split shipments; locate second tracking number for mouse shipping from secondary warehouse and share tracking with customer."}, {"id": 3, "text": "Accuse customer of hiding the mouse."}, {"id": 4, "text": "Tell customer to re-order the mouse."}]	Hard	2	60	1	Active	2026-08-20 13:59:34.611848	2026-08-20 13:59:34.611848
60	7	29	sop_case	R3-SOP13: SOP Case 13: Chargeback Dispute Notification	SOP Reference: KB-BIL-06 (Active Bank Disputes)\nPolicy: When a customer files a formal chargeback with their bank, the account enters legal dispute status. Agents CANNOT process manual refunds or exchanges in chat while dispute is active, as bank holds the funds. Must route to Dispute Management.\n\nCase Details:\nCustomer states: 'I filed a chargeback with Chase Bank yesterday, but give me my money now.'\n\nWhat is the required SOP handling?		[{"id": 1, "text": "Issue a full refund on top of the active chargeback."}, {"id": 2, "text": "Explain politely that because a formal bank dispute is active, the funds are held under bank review and manual refunds are locked. Route ticket to Dispute Management Team for bank response filing."}, {"id": 3, "text": "Threaten the customer with legal lawsuit in chat."}, {"id": 4, "text": "Ignore the customer message."}]	Hard	2	60	1	Active	2026-08-20 13:59:34.622328	2026-08-20 13:59:34.622328
61	7	25	sop_case	R3-SOP14: SOP Case 14: Subscription Cancellation and Prorated Refunds	SOP Reference: KB-SUB-02 (SaaS/Software Subscription Policy)\nPolicy: Annual software subscriptions cancelled within first 14 days receive 100% refund. Cancellations between 15-90 days receive prorated refund for unused months. Cancellations after 90 days cancel future auto-renewals only with no refund.\n\nCase Details:\nCustomer cancels annual subscription on day 45 of 365.\n\nWhat is the correct refund entitlement?		[{"id": 1, "text": "Zero refund; annual subscriptions are non-refundable."}, {"id": 2, "text": "Calculate prorated refund for the remaining 10 full unused months per KB-SUB-02 and disable future renewal."}, {"id": 3, "text": "100% full refund."}, {"id": 4, "text": "Charge cancellation penalty fee."}]	Hard	2	60	1	Active	2026-08-20 13:59:34.629481	2026-08-20 13:59:34.629481
78	10	8	code_completion	SQL Aggregation & Having Filter Completion	Complete the SQL query below to calculate total sales per customer and filter for customers with total revenue strictly exceeding $1,000.	SELECT customer_id, SUM(amount) AS total_revenue\nFROM orders\nGROUP BY {{BLANK_1}}\nHAVING {{BLANK_2}};	[]	Medium	15	300	1	Active	2026-08-20 13:59:34.805712	2026-08-20 13:59:34.805712
62	7	29	sop_case	R3-SOP15: SOP Case 15: Escalation Matrix - Priority 1 System Outage	SOP Reference: KB-ESC-01 (Severity Classification)\nPolicy: Severity 1 (Critical) is reserved for system-wide outages affecting checkout, multiple user data corruption, or payment gateway crash. Must alert On-Call Engineering within 5 minutes with incident ticket.\n\nCase Details:\nMultiple customers simultaneously report credit card checkout throwing '502 Gateway Error'.\n\nWhat is the correct escalation tier and SLA?		[{"id": 1, "text": "Classify as Low priority ticket for next business day review."}, {"id": 2, "text": "Tag as P1 - Critical System Outage, notify On-Call Engineering team immediately, and broadcast status banner."}, {"id": 3, "text": "Tell customers to restart their personal laptops."}, {"id": 4, "text": "Ignore reports until supervisor arrives."}]	Hard	2	60	1	Active	2026-08-20 13:59:34.632768	2026-08-20 13:59:34.632768
63	8	27	multi_chat_simulation	R4-SIM: Production Multi-Chat Support Console	[{"session_id": "CHAT-A", "customer_name": "Jessica Miller", "market": "USA (Chicago, IL)", "order_id": "#US-94821", "order_amount": "$289.00", "initial_state": "ACTIVE", "priority": "HIGH", "issue_category": "DELIVERY", "sla_first_response_sec": 60, "sla_resolution_min": 12, "timeline": [{"time_sec": 0, "sender": "customer", "message": "Hi, my package was supposed to be delivered yesterday for an anniversary gift. Tracking says 'Delayed in Transit'. Can someone please tell me where it is?"}, {"time_sec": 45, "trigger": "if_no_response", "message": "Hello? Is anyone there? I really need an update."}, {"time_sec": 120, "sender": "customer", "message": "I checked with my neighbors and nobody has seen the FedEx truck. Can you check if it's lost?"}, {"time_sec": 240, "sender": "customer", "message": "If this can't arrive by tomorrow, I want to cancel and get a replacement sent to my office address."}], "correct_resolution": {"ticket_category": "Delivery", "priority": "High", "resolution_code": "Replacement Initiated / Lost in Transit", "required_kb_search": "Lost in Transit", "required_internal_note": "Package delayed >48h with FedEx. Verified address. Issued replacement with priority overnight."}}, {"session_id": "CHAT-B", "customer_name": "Alexander Hayes", "market": "Canada (Vancouver, BC)", "order_id": "#CA-40291", "order_amount": "$145.50", "initial_state": "WAITING", "priority": "URGENT", "issue_category": "BILLING", "sla_first_response_sec": 45, "sla_resolution_min": 10, "timeline": [{"time_sec": 30, "sender": "customer", "message": "I was promised a refund of $145.50 last Tuesday by your agent Mark. My credit card statement arrived today and there is NO refund. Why are you holding my money?"}, {"time_sec": 90, "sender": "customer", "message": "I have the chat transcript from Mark saying it would take 3 business days. It has been 6 business days!"}, {"time_sec": 180, "sender": "customer", "message": "Give me the ARN refund reference number so I can give it to my bank."}], "correct_resolution": {"ticket_category": "Billing / Refund", "priority": "Critical", "resolution_code": "Refund Verified / Acquirer Reference Provided", "required_kb_search": "Refund Pending", "required_internal_note": "Checked merchant gateway. Refund was processed on Friday. Provided ARN #749281920 to customer. Reassured 3-5 bank processing days."}}, {"session_id": "CHAT-C", "customer_name": "Daniel Kim", "market": "USA (Austin, TX)", "order_id": "#US-77182", "order_amount": "$89.99", "initial_state": "WAITING", "priority": "NORMAL", "issue_category": "WARRANTY", "sla_first_response_sec": 90, "sla_resolution_min": 15, "timeline": [{"time_sec": 60, "sender": "customer", "message": "Hey there! My wireless earbuds keep disconnecting from Bluetooth every 5 minutes. Bought them 2 months ago."}, {"time_sec": 180, "sender": "customer", "message": "I already tried forgetting device and reconnecting. Still drops connection."}, {"time_sec": 300, "sender": "customer", "message": "I have the original box and receipt from Best Buy online store."}], "correct_resolution": {"ticket_category": "Warranty / Hardware", "priority": "Normal", "resolution_code": "Warranty Replacement Approved", "required_kb_search": "Warranty Eligibility", "required_internal_note": "Bluetooth disconnection unresolved by hardware reset. Unit within 1-year warranty. Generated prepaid RMA label and warranty replacement."}}]		[]	Hard	30	3000	1	Active	2026-08-20 13:59:34.658368	2026-08-20 13:59:34.658368
64	9	30	mcq	Q1.1: Revenue Trend Analysis	A retail company reported $120,000 in Q1 revenue, which grew by 25% in Q2, and then dropped by 10% in Q3. What is the net revenue for Q3?		[{"id": "A", "text": "$135,000"}, {"id": "B", "text": "$140,000"}, {"id": "C", "text": "$145,000"}, {"id": "D", "text": "$150,000"}]	Medium	1	60	1	Active	2026-08-20 13:59:34.677752	2026-08-20 13:59:34.677752
65	9	31	mcq	Q1.2: Data Quality & Missing Value Strategy	When analyzing a customer dataset of 100,000 records, you discover that 15% of 'Customer Age' entries are null. Which approach is statistically sound for descriptive profiling before building a model?		[{"id": "A", "text": "Immediately delete all 15,000 rows containing nulls."}, {"id": "B", "text": "Analyze missingness pattern (MCAR/MAR), impute using median/mode by customer segment, or analyze complete cases separately."}, {"id": "C", "text": "Replace all nulls with 0."}, {"id": "D", "text": "Replace all nulls with 100."}]	Medium	1	60	1	Active	2026-08-20 13:59:34.679757	2026-08-20 13:59:34.679757
66	9	32	mcq	Q1.3: Noesys Information Security Policy & Data Protection	According to Information Security Policy, a candidate data file containing Personally Identifiable Information (PII) like employee SSNs and salaries must be exported for external presentation. What is the compliant procedure?		[{"id": "A", "text": "Email the unencrypted file as an attachment to external personal email."}, {"id": "B", "text": "Anonymize/mask PII fields, encrypt the dataset at rest/transit, and share via authorized secure channels with access controls."}, {"id": "C", "text": "Store the unencrypted file on a public cloud drive."}, {"id": "D", "text": "Print the raw spreadsheet and leave it in the conference room."}]	Medium	1	60	1	Active	2026-08-20 13:59:34.689412	2026-08-20 13:59:34.689412
67	9	39	text_response	Q1.4: Stakeholder Business Communication	Draft a 150-200 word email reply to a business manager explaining why Q3 sales dropped by 12% due to supply chain delays, and outline 2 data-backed recommendations.	Dear Manager,\n\nI have completed the Q3 sales data analysis...	[]	Medium	1	60	1	Active	2026-08-20 13:59:34.695013	2026-08-20 13:59:34.695013
68	9	32	mcq	Q1.3: Information Security Policy & Data Protection	According to Information Security Policy, a candidate data file containing Personally Identifiable Information (PII) like employee SSNs and salaries must be exported for external presentation. What is the compliant procedure?		[{"id": "A", "text": "Email the unencrypted file as an attachment to external personal email."}, {"id": "B", "text": "Anonymize/mask PII fields, encrypt the dataset at rest/transit, and share via authorized secure channels with access controls."}, {"id": "C", "text": "Store the unencrypted file on a public cloud drive."}, {"id": "D", "text": "Print the raw spreadsheet and leave it in the conference room."}]	Medium	1	60	1	Active	2026-08-20 13:59:34.703316	2026-08-20 13:59:34.703316
69	9	31	mcq	Regional Sales Growth Rate Analysis	Region A sales grew from $120,000 in Q1 to $156,000 in Q2. Region B sales grew from $80,000 to $108,000 in the same period. Which region achieved a higher percentage growth rate?	\N	[{"key": "A", "text": "Region A achieved higher growth (30% vs 35%)"}, {"key": "B", "text": "Region B achieved higher growth (35% vs 30%)"}, {"key": "C", "text": "Both regions achieved equal growth (30%)"}, {"key": "D", "text": "Region A achieved higher growth (36% vs 28%)"}]	Medium	10	180	1	Active	2026-08-20 13:59:34.709848	2026-08-20 13:59:34.709848
70	9	31	mcq	Customer Acquisition Trend & Outlier Detection	Monthly new signups for 6 consecutive months are: Jan: 1,200 | Feb: 1,250 | Mar: 1,220 | Apr: 4,800 | May: 1,300 | Jun: 1,310. What is the most likely analytical interpretation of the April data point?	\N	[{"key": "A", "text": "Natural baseline growth trend that will double every quarter."}, {"key": "B", "text": "An anomaly/outlier caused by a marketing campaign or data entry error requiring isolation."}, {"key": "C", "text": "Standard seasonal variation expected in B2B SaaS analytics."}, {"key": "D", "text": "The median signup rate across the half-year period."}]	Medium	10	180	1	Active	2026-08-20 13:59:34.715912	2026-08-20 13:59:34.715912
71	9	42	mcq	Product Margin & Revenue Weighted Average	Product X yields $50,000 revenue at a 40% gross margin. Product Y yields $150,000 revenue at a 20% gross margin. What is the overall revenue-weighted gross margin percentage of the portfolio?	\N	[{"key": "A", "text": "30.0%"}, {"key": "B", "text": "25.0%"}, {"key": "C", "text": "27.5%"}, {"key": "D", "text": "22.5%"}]	Hard	10	240	1	Active	2026-08-20 13:59:34.725614	2026-08-20 13:59:34.725614
72	9	42	descriptive	Analytical Root Cause & Hypothesis Formulation	A digital commerce platform experiences a sudden 25% drop in weekly checkout conversion rate despite steady traffic volume. Detail your structured step-by-step analytical approach to isolate the root cause (e.g., funnel metrics, breakdown dimensions, technical vs marketing anomalies, and data verification steps).	\N	[]	Medium	10	300	1	Active	2026-08-20 13:59:34.736613	2026-08-20 13:59:34.736613
73	10	33	sql	Q2.1: Top Performing Sales Representatives by Region	Write an SQL query to retrieve the top sales rep (`rep_name`), region, and total revenue for each region where total revenue exceeds $50,000. Order by total revenue descending.	SELECT rep_name, region, SUM(amount) AS total_revenue\nFROM sales\nGROUP BY rep_name, region\nHAVING SUM(amount) > 50000\nORDER BY total_revenue DESC;	[]	Medium	1	60	1	Active	2026-08-20 13:59:34.762593	2026-08-20 13:59:34.762593
74	10	34	sql	Q2.2: Multi-Source Customer Order Reconciliation	Write an SQL query joining `online_orders` with legacy `access_inventory_dump` on `product_id` to compute unfulfilled order count and lost revenue.	SELECT o.product_id, COUNT(o.order_id) AS unfulfilled_orders, SUM(o.unit_price * o.quantity) AS lost_revenue\nFROM online_orders o\nLEFT JOIN access_inventory_dump i ON o.product_id = i.product_id\nWHERE i.stock_quantity = 0 OR i.stock_quantity IS NULL\nGROUP BY o.product_id;	[]	Medium	1	60	1	Active	2026-08-20 13:59:34.768883	2026-08-20 13:59:34.768883
75	10	8	sql	Top 3 Revenue Customers SQL Query	Given a table `orders` with columns `customer_id`, `amount`, and `order_date`, write a SQL query to calculate total revenue per customer and return the top 3 customers ordered by revenue descending.	\N	[]	Medium	15	300	1	Active	2026-08-20 13:59:34.776921	2026-08-20 13:59:34.776921
80	11	35	mcq	Q3.1: Modern Lookup Formulas (XLOOKUP vs VLOOKUP)	Which statement correctly describes why XLOOKUP is preferred over VLOOKUP in financial modeling?		[{"id": "A", "text": "XLOOKUP defaults to exact match, allows leftward lookups without column index numbers, and handles array outputs natively."}, {"id": "B", "text": "VLOOKUP can look left whereas XLOOKUP cannot."}, {"id": "C", "text": "XLOOKUP requires sorted data whereas VLOOKUP does not."}, {"id": "D", "text": "There is no difference in functionality."}]	Medium	1	60	1	Active	2026-08-20 13:59:34.843007	2026-08-20 13:59:34.843007
81	11	36	code_debug	Q3.2: VBA Macro Loop Debugging	The following VBA macro is supposed to highlight rows where column C (Sales) is less than 1000, but it throws a runtime 1004 error. Fix the boundary condition.	Sub HighlightLowSales()\n    Dim i As Long\n    For i = 2 To LastRow ' Missing LastRow initialization\n        If Cells(i, 3).Value < 1000 Then\n            Cells(i, 3).Interior.Color = RGB(255, 0, 0)\n        End If\n    Next i\nEnd Sub	[]	Medium	1	60	1	Active	2026-08-20 13:59:34.849414	2026-08-20 13:59:34.849414
82	11	37	mcq	Q3.3: Tableau Chart Selection for KPI Dashboards	You need to visualize monthly sales performance against quarterly targets across 5 product categories. Which chart layout is most effective for executive decision-making?		[{"id": "A", "text": "A 3D Pie Chart with 15 colored slices."}, {"id": "B", "text": "Bullet Graphs or Combo Bar Charts with Target Reference Lines for each category."}, {"id": "C", "text": "A raw unformatted cross-tab table with 500 rows."}, {"id": "D", "text": "A scatter plot of customer age vs zip code."}]	Medium	1	60	1	Active	2026-08-20 13:59:34.860615	2026-08-20 13:59:34.860615
83	11	48	coding	Filter Employees Above Threshold in Pandas	Write or select the correct Python Pandas snippet `filter_high_earners(df, threshold)` that accepts a Pandas DataFrame `df` with columns `['name', 'salary']` and returns a list of employee names earning strictly greater than `threshold`.	import pandas as pd\n\ndef filter_high_earners(df: pd.DataFrame, threshold: float):\n    # Return list of names where salary > threshold\n    return df[df['salary'] > threshold]['name'].tolist()\n	[{"key": "A", "text": "return df[df['salary'] > threshold]['name'].tolist()"}, {"key": "B", "text": "return df.filter(lambda x: x['salary'] > threshold)"}, {"key": "C", "text": "return df.query('salary == threshold')['name']"}, {"key": "D", "text": "return df['salary'].max()"}]	Medium	15	360	1	Active	2026-08-20 13:59:34.869904	2026-08-20 13:59:34.869904
84	11	47	debugging	Python Data Aggregation Bug Fixing	The following code contains a bug in calculating average order value per customer from a list of tuples `(customer, amount)`. Identify and fix the zero division bug when a customer has no orders.	def calc_average(orders):\n    totals = {}\n    counts = {}\n    for cust, amt in orders:\n        totals[cust] = totals.get(cust, 0) + amt\n        counts[cust] = counts.get(cust, 0) + 1\n    \n    averages = {}\n    for cust in totals:\n        # FIX BUG HERE\n        averages[cust] = totals[cust] / counts[cust] if counts.get(cust, 0) > 0 else 0.0\n    return averages\n	[{"key": "A", "text": "averages[cust] = totals[cust] / counts[cust] if counts.get(cust, 0) > 0 else 0.0"}, {"key": "B", "text": "averages[cust] = totals[cust] / (counts[cust] + 1)"}, {"key": "C", "text": "averages[cust] = totals[cust] * 0"}, {"key": "D", "text": "del totals[cust]"}]	Easy	10	240	1	Active	2026-08-20 13:59:34.878189	2026-08-20 13:59:34.878189
85	11	48	mcq	Q3.1: Pandas DataFrame Groupby & Aggregation Concepts	Given a Pandas DataFrame `df` containing `['Region', 'Revenue']`, what is the returned data structure when executing `df.groupby('Region')['Revenue'].agg(['mean', 'sum'])`?	\N	[{"key": "A", "text": "A Series containing only the sum of revenue."}, {"key": "B", "text": "A DataFrame indexed by Region with columns 'mean' and 'sum' representing revenue metrics."}, {"key": "C", "text": "A Python list of tuples."}, {"key": "D", "text": "An error because agg() requires a custom lambda function."}]	Easy	10	180	1	Active	2026-08-20 13:59:34.884104	2026-08-20 13:59:34.884104
86	11	48	mcq	Q3.2: Pandas Merge vs Join Methodologies	You need to combine two Pandas DataFrames `df_orders` and `df_customers` on a common column `customer_id` keeping all orders regardless of customer match. Which Pandas method call correctly performs this operation?	\N	[{"key": "A", "text": "pd.merge(df_orders, df_customers, on='customer_id', how='left')"}, {"key": "B", "text": "pd.concat([df_orders, df_customers], axis=1)"}, {"key": "C", "text": "df_orders.join(df_customers, on='customer_id', how='right')"}, {"key": "D", "text": "pd.merge(df_orders, df_customers, how='outer')"}]	Easy	10	180	1	Active	2026-08-20 13:59:34.894644	2026-08-20 13:59:34.894644
87	11	47	mcq	Q3.3: Vectorized NumPy Operations vs Python Loops	Why is NumPy vectorization significantly faster than iterating through Python lists with explicit `for` loops when computing array element-wise operations?	\N	[{"key": "A", "text": "NumPy converts Python code into JavaScript prior to execution."}, {"key": "B", "text": "NumPy arrays use contiguous memory blocks and compiled C-level SIMD operations, avoiding Python dynamic type checking per element."}, {"key": "C", "text": "Python `for` loops consume twice as much disk space."}, {"key": "D", "text": "NumPy automatically disables multi-threading during execution."}]	Medium	10	180	1	Active	2026-08-20 13:59:34.904907	2026-08-20 13:59:34.904907
88	11	48	mcq	Q3.4: Pandas Missing Data Imputation Strategies	A DataFrame `df` has missing numeric values in column `'score'`. Which Pandas code fills missing values with the column mean inplace?	\N	[{"key": "A", "text": "df['score'].fillna(df['score'].mean(), inplace=True)"}, {"key": "B", "text": "df['score'].dropna(mean=True)"}, {"key": "C", "text": "df.replace('score', df['score'].mean())"}, {"key": "D", "text": "df['score'].apply(lambda x: x == None)"}]	Medium	10	180	1	Active	2026-08-20 13:59:34.909535	2026-08-20 13:59:34.909535
89	11	47	mcq	Q3.5: Python List Comprehensions for Data Filtering	Which list comprehension correctly filters a list of sales figures `sales = [120, 450, 80, 600, 310]` to keep values greater than or equal to 300?	\N	[{"key": "A", "text": "[s for s in sales if s >= 300]"}, {"key": "B", "text": "[for s in sales if s >= 300 select s]"}, {"key": "C", "text": "sales.filter(s => s >= 300)"}, {"key": "D", "text": "[s if s >= 300 for s in sales]"}]	Easy	10	180	1	Active	2026-08-20 13:59:34.919543	2026-08-20 13:59:34.919543
90	11	48	coding	Q3.6: Filter High Earner Employees in Pandas	Write or select the correct Python Pandas function `filter_high_earners(df, threshold)` that accepts a Pandas DataFrame `df` with columns `['name', 'salary']` and returns a list of employee names earning strictly greater than `threshold`.	import pandas as pd\n\ndef filter_high_earners(df: pd.DataFrame, threshold: float):\n    # Return list of names where salary > threshold\n    return df[df['salary'] > threshold]['name'].tolist()\n	[{"key": "A", "text": "return df[df['salary'] > threshold]['name'].tolist()"}, {"key": "B", "text": "return df.filter(lambda x: x['salary'] > threshold)"}, {"key": "C", "text": "return df.query('salary == threshold')['name']"}, {"key": "D", "text": "return df['salary'].max()"}]	Medium	15	360	1	Active	2026-08-20 13:59:34.926298	2026-08-20 13:59:34.926298
91	11	48	coding	Q3.7: Calculate Monthly Sales Growth Rate in Pandas	Write a Python Pandas function `calculate_growth_rate(sales_series)` that accepts a Pandas Series of monthly sales values and returns a Series representing percentage change between consecutive months rounded to 2 decimal places.	import pandas as pd\n\ndef calculate_growth_rate(sales_series: pd.Series):\n    # Return percentage change rounded to 2 decimal places\n    return sales_series.pct_change().round(2)\n	[{"key": "A", "text": "return sales_series.pct_change().round(2)"}, {"key": "B", "text": "return sales_series.diff() / 100"}, {"key": "C", "text": "return sales_series.cumsum()"}, {"key": "D", "text": "return sales_series.shift(1)"}]	Hard	15	360	1	Active	2026-08-20 13:59:34.93588	2026-08-20 13:59:34.93588
92	11	47	debugging	Q3.8: Python Data Aggregation Zero-Division Bug Fixing	The following code contains a bug in calculating average order value per customer from a list of tuples `(customer, amount)`. Identify and fix the zero division bug when a customer has no orders.	def calc_average(orders):\n    totals = {}\n    counts = {}\n    for cust, amt in orders:\n        totals[cust] = totals.get(cust, 0) + amt\n        counts[cust] = counts.get(cust, 0) + 1\n    \n    averages = {}\n    for cust in totals:\n        # FIX BUG HERE\n        averages[cust] = totals[cust] / counts[cust] if counts.get(cust, 0) > 0 else 0.0\n    return averages\n	[{"key": "A", "text": "averages[cust] = totals[cust] / counts[cust] if counts.get(cust, 0) > 0 else 0.0"}, {"key": "B", "text": "averages[cust] = totals[cust] / (counts[cust] + 1)"}, {"key": "C", "text": "averages[cust] = totals[cust] * 0"}, {"key": "D", "text": "del totals[cust]"}]	Easy	10	240	1	Active	2026-08-20 13:59:34.942905	2026-08-20 13:59:34.942905
93	11	47	code_completion	Q3.5b: Find Maximum Value Algorithmic Code Completion	Complete the missing loop body section to find and return the maximum value in a list of numbers.	def find_max(numbers):\n    max_value = numbers[0]\n    for number in numbers:\n        {{BLANK_1}}\n    return max_value\n	[]	Easy	15	240	1	Active	2026-08-20 13:59:34.949847	2026-08-20 13:59:34.949847
94	12	38	mcq	Q4.1: Pandas DataFrame Groupby & Aggregation Concepts	In Pandas, what does `df.groupby('Region')['Revenue'].agg(['mean', 'sum'])` return?		[{"id": "A", "text": "A Series containing only the sum of revenue."}, {"id": "B", "text": "A DataFrame indexed by Region with columns 'mean' and 'sum' representing revenue metrics."}, {"id": "C", "text": "A Python list of tuples."}, {"id": "D", "text": "An error because agg() requires a custom lambda."}]	Medium	1	60	1	Active	2026-08-20 13:59:34.971736	2026-08-20 13:59:34.971736
95	12	38	coding	Q4.2: Pandas Practical Coding — Clean and Group Customer Sales	Write a Python function `process_sales(df)` that filters out records with null `Customer_ID`, fills missing `Sales_Amount` with the column median, and returns total sales grouped by `Category` sorted descending.	import pandas as pd\n\ndef process_sales(df: pd.DataFrame) -> pd.DataFrame:\n    # Filter null Customer_ID\n    df_clean = df[df['Customer_ID'].notnull()].copy()\n    # Impute missing Sales_Amount with median\n    median_sales = df_clean['Sales_Amount'].median()\n    df_clean['Sales_Amount'] = df_clean['Sales_Amount'].fillna(median_sales)\n    # Groupby Category and sum\n    result = df_clean.groupby('Category')['Sales_Amount'].sum().reset_index()\n    return result.sort_values(by='Sales_Amount', ascending=False)	[]	Medium	1	60	1	Active	2026-08-20 13:59:34.9794	2026-08-20 13:59:34.9794
96	12	49	tableau_procedural	Tableau Executive Sales Dashboard Creation	Explain the procedural step sequence in Tableau Desktop to build an executive sales dashboard displaying: 1. Total Sales KPI Card | 2. Regional Sales Bar Chart | 3. Monthly Sales Trend Line | 4. Global Region Filter.	\N	[{"key": "A", "text": "Step 1: Create 3 individual worksheets (KPI, Bar Chart, Line Chart) -> Step 2: Combine on Dashboard -> Step 3: Apply Region Filter to All Worksheets."}, {"key": "B", "text": "Step 1: Put all charts on 1 worksheet -> Step 2: Export directly to PDF -> Step 3: Publish to Server."}, {"key": "C", "text": "Step 1: Connect to database -> Step 2: Group measures into dimensions -> Step 3: Delete unassigned sheets."}, {"key": "D", "text": "Step 1: Create calculated field SUM(Sales) -> Step 2: Drag to Color Marks card -> Step 3: Disable dashboard actions."}]	Medium	15	300	1	Active	2026-08-20 13:59:34.987359	2026-08-20 13:59:34.987359
97	12	51	business_case	Retail Q3 Revenue Decline Business Case Analysis	A national retail chain experienced a 15% revenue decline during Q3. Data reveals: Units sold declined 5%, average discount increased from 10% to 22%, and return rates rose from 3% to 8% in Apparel. Analyze the root cause and outline your data-driven recommendation.	\N	[]	Hard	20	450	1	Active	2026-08-20 13:59:34.992919	2026-08-20 13:59:34.992919
98	13	41	text_response	Q5.2: Section B — Analytical Decision & Anomaly Investigation	During your project analysis, your dashboard shows Region A sales surged 45% in a single month. Explain what data verification steps you would take before presenting this finding to leadership.	Verification Steps:\n1. Check for data duplication or bulk test orders.\n2. Analyze transaction count vs average basket size...\n3. Verify external seasonality or marketing campaign launch...	[]	Medium	1	60	1	Active	2026-08-20 13:59:35.009819	2026-08-20 13:59:35.009819
99	13	53	project_discussion	Project-Derived Data Cleaning & Transformation Validation	In the context of your declared project, explain how you handled missing values, duplicate records, or data type inconsistencies. Why did you select those specific cleaning techniques for your dataset?	\N	[]	Medium	15	360	1	Active	2026-08-20 13:59:35.009819	2026-08-20 13:59:35.009819
100	13	40	text_response	Q5.1: Section A — Project Architecture & Data Lineage	Describe your primary Data Analytics project. What was the business objective, dataset origin, data cleaning steps, and what specific tools (Excel, SQL, Tableau, Python) did you personally use?	My project title: ...\nBusiness Objective: ...\nDataset Source: ...\nTools Used: ...\nMy Role & Contribution: ...	[]	Medium	1	60	1	Active	2026-08-20 13:59:35.019776	2026-08-20 13:59:35.019776
101	13	52	project_discussion	Candidate Project Overview & Technology Declaration	Describe your primary Data Analytics project. Detail: 1. Project Title | 2. Business Problem Solved | 3. Data Sources Used | 4. Specific Tools Used (e.g. SQL, Excel, Python, Tableau) | 5. Key Analytical Findings.	\N	[]	Medium	15	360	1	Active	2026-08-20 13:59:35.029423	2026-08-20 13:59:35.029423
172	22	70	MCQ	Ratio & Proportion Division	Two numbers are in the ratio 4 : 5. If their sum is 180, what is the value of the larger number?	\N	["80", "90", "100", "110"]	Easy	1	90	1	Active	2026-08-23 03:40:44.052736	2026-08-23 03:40:44.052736
173	22	70	MCQ	Percentage Profit Calculation	An item purchased for $400 is sold for $500. What is the percentage profit gained on this transaction?	\N	["20%", "25%", "30%", "15%"]	Easy	1	90	1	Active	2026-08-23 03:40:44.058508	2026-08-23 03:40:44.058508
174	22	71	MCQ	Arithmetic Progression Series	Identify the next number in the sequence: 3, 6, 12, 24, 48, ___	\N	["64", "72", "96", "84"]	Easy	1	90	1	Active	2026-08-23 03:40:44.062865	2026-08-23 03:40:44.062865
175	22	70	MCQ	Combined Work Rate	Worker A can finish a project in 6 days, while Worker B takes 12 days for the same project. Working together, how many days will they take to complete it?	\N	["4 days", "3 days", "5 days", "4.5 days"]	Easy	1	90	1	Active	2026-08-23 03:40:44.068161	2026-08-23 03:40:44.068161
176	22	70	MCQ	Speed, Distance and Time	A train 150 meters long travels at a constant speed of 54 km/h. How many seconds does it take to cross a stationary signal pole?	\N	["10 seconds", "12 seconds", "15 seconds", "8 seconds"]	Easy	1	90	1	Active	2026-08-23 03:40:44.068606	2026-08-23 03:40:44.068606
177	22	70	MCQ	Simple Interest Accrual	What is the Simple Interest on a principal amount of $5,000 invested at an annual rate of 10% for a period of 3 years?	\N	["$1,200", "$1,500", "$1,650", "$1,800"]	Easy	1	90	1	Active	2026-08-23 03:40:44.073171	2026-08-23 03:40:44.073171
178	22	70	MCQ	Arithmetic Mean of Integer Set	Find the average (arithmetic mean) of the numbers: 12, 18, 24, 30, and 36.	\N	["22", "24", "26", "28"]	Easy	1	90	1	Active	2026-08-23 03:40:44.078383	2026-08-23 03:40:44.078383
179	22	71	MCQ	Dice Roll Probability	When two standard six-sided dice are rolled simultaneously, what is the probability that the sum of the rolled numbers is exactly 7?	\N	["1/6", "1/12", "5/36", "7/36"]	Easy	1	90	1	Active	2026-08-23 03:40:44.083927	2026-08-23 03:40:44.083927
180	22	71	MCQ	Pattern Coding & Transposition	If the word 'SYSTEM' is encoded as 'SYSMET' by reversing the second half of the word, how will 'FORMAT' be encoded under the exact same rule?	\N	["FORTAM", "FORATM", "TAMFOR", "FORTMA"]	Easy	1	90	1	Active	2026-08-23 03:40:44.088509	2026-08-23 03:40:44.088509
181	22	71	MCQ	Family Tree Logical Deduction	Pointing to a photograph, a woman says: 'He is the only son of the mother of my only brother.' How is the man in the photograph related to the woman?	\N	["Brother", "Father", "Uncle", "Nephew"]	Easy	1	90	1	Active	2026-08-23 03:40:44.09177	2026-08-23 03:40:44.09177
182	22	71	MCQ	Categorical Syllogism	Premises:\n1. All squares are rectangles.\n2. All rectangles are polygons.\nConclusion: Which statement is strictly valid?	\N	["All squares are polygons", "All polygons are squares", "Some polygons are not rectangles", "No rectangles are squares"]	Easy	1	90	1	Active	2026-08-23 03:40:44.094656	2026-08-23 03:40:44.094656
183	22	70	MCQ	Linear Age Relationship	A father is currently 3 times as old as his son. In 12 years, the father will be twice as old as his son. What is the son's current age?	\N	["10 years", "12 years", "14 years", "16 years"]	Medium	1	90	1	Active	2026-08-23 03:40:44.099702	2026-08-23 03:40:44.099702
184	22	71	MCQ	Analog Clock Hand Angle	What is the acute angle between the hour hand and minute hand of a clock at 3:30?	\N	["75\\u00b0", "70\\u00b0", "80\\u00b0", "90\\u00b0"]	Medium	1	90	1	Active	2026-08-23 03:40:44.104429	2026-08-23 03:40:44.104429
185	22	72	MCQ	Iterative Loop Sum Deduction	Consider this algorithmic step:\nlet sum = 0;\nfor (i = 1 to 4) {\n  sum = sum + (i * i);\n}\nWhat is the final value of sum?	\N	["20", "30", "14", "25"]	Easy	1	90	1	Active	2026-08-23 03:40:44.108412	2026-08-23 03:40:44.108412
186	22	72	MCQ	Conditional Discount Flow Deduction	A billing algorithm states: 'If total > 500 give 20% discount; else if total > 200 give 10% discount; else give 0% discount.' What is the final payable amount for a cart value of exactly $500?	\N	["$400", "$450", "$500", "$425"]	Easy	1	90	1	Active	2026-08-23 03:40:44.108412	2026-08-23 03:40:44.108412
187	23	74	MCQ	Pointer Dereference and Modification	What is the output of the following C code snippet?\n\nint x = 10;\nint *ptr = &x;\n*ptr += 5;\nprintf("%d", x);	\N	["10", "15", "Garbage value", "Compilation Error"]	Easy	1	90	1	Active	2026-08-23 03:40:44.115977	2026-08-23 03:40:44.115977
188	23	74	MCQ	Pointer Arithmetic Stride	On a standard 64-bit architecture where sizeof(int) == 4 bytes, if ptr points to memory address 0x1000, what address will (ptr + 2) evaluate to?	\N	["0x1002", "0x1004", "0x1008", "0x1010"]	Easy	1	90	1	Active	2026-08-23 03:40:44.118953	2026-08-23 03:40:44.118953
189	23	74	MCQ	Array Identifier Decay	Given 'int arr[5] = {1, 2, 3, 4, 5};', which of the following expressions is equivalent to '*(arr + 3)'?	\N	["arr[3]", "&arr[3]", "arr + 3", "*arr + 3"]	Easy	1	90	1	Active	2026-08-23 03:40:44.118953	2026-08-23 03:40:44.118953
190	23	74	MCQ	Double Pointer Indirection	What is printed by this code snippet?\n\nint a = 5;\nint *p = &a;\nint **pp = &p;\n**pp = 20;\nprintf("%d", a);	\N	["5", "20", "Memory address", "Compiler Error"]	Medium	1	90	1	Active	2026-08-23 03:40:44.125244	2026-08-23 03:40:44.125244
191	23	74	MCQ	Pointer Variable Size	What is the value of 'sizeof(char*)' on a target 64-bit operating system?	\N	["1 byte", "4 bytes", "8 bytes", "Depends on string length"]	Easy	1	90	1	Active	2026-08-23 03:40:44.12826	2026-08-23 03:40:44.12826
192	23	73	MCQ	Bitwise Left Shift Operator	What is the result of the bitwise expression '8 << 2' in C?	\N	["16", "32", "64", "4"]	Easy	1	90	1	Active	2026-08-23 03:40:44.135804	2026-08-23 03:40:44.135804
193	23	73	MCQ	Macro Parenthesization Hazard	Given:\n#define SQUARE(x) x * x\nWhat is the output of 'printf("%d", SQUARE(2 + 3));'?	\N	["25", "11", "13", "10"]	Medium	1	90	1	Active	2026-08-23 03:40:44.138314	2026-08-23 03:40:44.138314
194	23	73	MCQ	Static Variable Lifetime	What is printed when 'counter()' is called twice in main?\n\nvoid counter() {\n    static int c = 0;\n    c++;\n    printf("%d ", c);\n}	\N	["1 1 ", "1 2 ", "0 1 ", "2 2 "]	Easy	1	90	1	Active	2026-08-23 03:40:44.138314	2026-08-23 03:40:44.138314
195	23	73	MCQ	String Literal Memory Size	What is the value returned by 'sizeof("HELLO")' in C?	\N	["5", "6", "4", "8"]	Easy	1	90	1	Active	2026-08-23 03:40:44.145753	2026-08-23 03:40:44.145753
196	23	75	MCQ	Structure vs Union Memory Layout	What is the primary difference in memory allocation between a 'struct' and a 'union' in C?	\N	["A union allocates memory only for its largest member, sharing space among all members", "A struct can only contain primitive data types whereas a union can contain pointers", "A union allocates the sum of all members plus padding", "There is no difference in memory allocation"]	Medium	1	90	1	Active	2026-08-23 03:40:44.153005	2026-08-23 03:40:44.153005
197	23	76	MCQ	malloc Return Value & Type	What generic pointer type is returned by the standard library function 'malloc(size_t size)' in C?	\N	["char*", "void*", "int*", "NULL*"]	Easy	1	90	1	Active	2026-08-23 03:40:44.156061	2026-08-23 03:40:44.156061
198	23	77	MCQ	Dangling Pointer Definition	What is a 'dangling pointer' in C?	\N	["A pointer that points to a deallocated/freed memory location", "A pointer initialized to NULL", "A pointer pointing to address 0x00000000", "A pointer that has not been initialized"]	Easy	1	90	1	Active	2026-08-23 03:40:44.158085	2026-08-23 03:40:44.158085
199	23	74	MCQ	Pointer to Const vs Const Pointer	In the declaration 'const int *ptr;', which of the following operations is forbidden by the C compiler?	\N	["*ptr = 25;", "ptr = &another_var;", "ptr++;", "int val = *ptr;"]	Medium	1	90	1	Active	2026-08-23 03:40:44.158085	2026-08-23 03:40:44.158085
200	23	73	MCQ	Bitwise In-place XOR Swap	What happens after executing:\na ^= b;\nb ^= a;\na ^= b;\n(Assuming a and b are distinct integer variables)?	\N	["The values of a and b are swapped without temporary memory", "Both a and b become 0", "Both a and b become -1", "a retains its value, b becomes 0"]	Easy	1	90	1	Active	2026-08-23 03:40:44.170174	2026-08-23 03:40:44.170174
201	23	74	MCQ	Function Pointer Declaration	Which declaration correctly defines a function pointer named 'funcPtr' that takes two ints as parameters and returns an int?	\N	["int (*funcPtr)(int, int);", "int *funcPtr(int, int);", "int (funcPtr*)(int, int);", "(*int funcPtr)(int, int);"]	Medium	1	90	1	Active	2026-08-23 03:40:44.170174	2026-08-23 03:40:44.170174
202	24	76	Coding	In-Place String Reversal using Two Pointers	Implement a C program that reads a string from standard input and prints the reversed string to standard output using a two-pointer approach.\n\nInput Example:\nhello\n\nOutput Example:\nolleh	#include <stdio.h>\n#include <string.h>\n\nvoid reverseString(char *str) {\n    int left = 0;\n    int right = strlen(str) - 1;\n    while (left < right) {\n        char temp = str[left];\n        str[left] = str[right];\n        str[right] = temp;\n        left++;\n        right--;\n    }\n}\n\nint main() {\n    char str[1000];\n    if (scanf("%s", str) == 1) {\n        reverseString(str);\n        printf("%s", str);\n    }\n    return 0;\n}\n	\N	Medium	10	180	1	Active	2026-08-23 03:40:44.177933	2026-08-23 03:40:44.177933
203	24	76	Coding	Dynamic Array Min-Max Finder	Write a C program that reads an integer N followed by N integers. Allocate memory dynamically using malloc(), find the minimum and maximum elements in the array, and print them formatted as 'Min: X, Max: Y'.\n\nInput Example:\n5\n10 25 5 40 15\n\nOutput Example:\nMin: 5, Max: 40	#include <stdio.h>\n#include <stdlib.h>\n\nint main() {\n    int n;\n    if (scanf("%d", &n) != 1 || n <= 0) return 0;\n    \n    int *arr = (int*)malloc(n * sizeof(int));\n    for (int i = 0; i < n; i++) {\n        scanf("%d", &arr[i]);\n    }\n    \n    int min = arr[0];\n    int max = arr[0];\n    for (int i = 1; i < n; i++) {\n        if (arr[i] < min) min = arr[i];\n        if (arr[i] > max) max = arr[i];\n    }\n    \n    printf("Min: %d, Max: %d", min, max);\n    free(arr);\n    return 0;\n}\n	\N	Medium	10	180	1	Active	2026-08-23 03:40:44.178456	2026-08-23 03:40:44.178456
204	24	76	Coding	Character Frequency Counter	Write a C program that reads a string and a target character. Count and print the total occurrences of the target character in the string.\n\nInput Example:\nprogramming\nm\n\nOutput Example:\n2	#include <stdio.h>\n#include <string.h>\n\nint countOccurrences(const char *str, char target) {\n    int count = 0;\n    while (*str) {\n        if (*str == target) count++;\n        str++;\n    }\n    return count;\n}\n\nint main() {\n    char str[1000];\n    char target;\n    if (scanf("%s %c", str, &target) == 2) {\n        printf("%d", countOccurrences(str, target));\n    }\n    return 0;\n}\n	\N	Easy	10	180	1	Active	2026-08-23 03:40:44.185651	2026-08-23 03:40:44.185651
205	25	77	Debug	Fix String Copy Buffer & Missing Null Terminator	The following C program attempts to copy an input string to an allocated buffer, but contains an off-by-one boundary error and missing null termination causing undefined behavior. Fix the bug so that the string copies safely and matches the expected output.\n\nInput Example:\nsystems\n\nOutput Example:\nsystems	#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\n// BUGGY CODE: Fix memory allocation & null termination\nint main() {\n    char input[100];\n    if (scanf("%s", input) != 1) return 0;\n    \n    int len = strlen(input);\n    // FIX: Allocate len + 1 for null terminator\n    char *copy = (char*)malloc((len + 1) * sizeof(char));\n    \n    for (int i = 0; i < len; i++) {\n        copy[i] = input[i];\n    }\n    copy[len] = '\\0'; // FIX: Ensure null-termination\n    \n    printf("%s", copy);\n    free(copy);\n    return 0;\n}\n	\N	Medium	10	180	1	Active	2026-08-23 03:40:44.188392	2026-08-23 03:40:44.188392
206	25	77	Debug	Fix Binary Search Infinite Loop Indexing	The following C binary search implementation hangs in an infinite loop due to improper boundary updates. Fix the search logic so that it prints the 0-based index of the target integer, or -1 if not found.\n\nInput Example:\n5\n10 20 30 40 50\n30\n\nOutput Example:\n2	#include <stdio.h>\n\nint binarySearch(int arr[], int n, int target) {\n    int low = 0;\n    int high = n - 1;\n    \n    while (low <= high) {\n        int mid = low + (high - low) / 2;\n        if (arr[mid] == target) {\n            return mid;\n        } else if (arr[mid] < target) {\n            low = mid + 1; // FIX: increment low\n        } else {\n            high = mid - 1; // FIX: decrement high\n        }\n    }\n    return -1;\n}\n\nint main() {\n    int n;\n    if (scanf("%d", &n) != 1) return 0;\n    int arr[100];\n    for (int i = 0; i < n; i++) scanf("%d", &arr[i]);\n    int target;\n    if (scanf("%d", &target) != 1) return 0;\n    \n    printf("%d", binarySearch(arr, n, target));\n    return 0;\n}\n	\N	Medium	10	180	1	Active	2026-08-23 03:40:44.188392	2026-08-23 03:40:44.188392
\.


--
-- Data for Name: assessment_reattempt_requests; Type: TABLE DATA; Schema: public; Owner: nasc_admin
--

COPY public.assessment_reattempt_requests (id, allocation_id, round_id, student_id, requested_by_id, reviewed_by_id, status, attempt_number, reason, rejection_reason, created_at, reviewed_at) FROM stdin;
39	55	22	48	56	55	CONSUMED	2	\N	\N	2026-08-23 04:12:43.054359	2026-08-23 04:13:27.087663
40	58	22	50	58	55	CONSUMED	2	\N	\N	2026-08-23 07:02:33.305047	2026-08-23 07:03:38.672298
43	9	22	2	7	\N	CONSUMED	2	\N	\N	2026-08-23 07:31:21.715799	\N
37	8	22	1	6	55	CONSUMED	2	\N	\N	2026-08-23 04:02:17.089313	2026-08-23 07:39:09.261816
44	8	22	1	6	\N	APPROVED	2	\N	\N	2026-08-23 10:07:14.504666	\N
45	10	22	3	8	\N	CONSUMED	2	\N	\N	2026-08-23 10:11:10.675703	\N
5	2	1	1	6	1	APPROVED	3	Granted by Class Tutor	\N	2026-08-20 16:34:27.339372	2026-08-23 11:01:51.722143
46	60	1	48	55	55	CONSUMED	3	Granted by Class Tutor / HoD	\N	2026-08-23 11:16:48.549316	2026-08-23 11:17:32.866954
47	72	22	50	55	55	APPROVED	2	Granted by Class Tutor / HoD	\N	2026-08-30 14:01:36.923364	2026-08-30 14:01:40.626306
\.


--
-- Data for Name: assessment_responses; Type: TABLE DATA; Schema: public; Owner: nasc_admin
--

COPY public.assessment_responses (id, attempt_id, question_id, response_payload, auto_saved_at, is_marked_for_review) FROM stdin;
1	64	172	100	2026-08-23 03:51:17.64917	f
2	62	185	30	2026-08-23 03:56:48.412184	f
3	62	186	$450	2026-08-23 03:56:52.086307	f
4	62	172	110	2026-08-23 03:56:54.567223	f
5	62	173	20%	2026-08-23 03:56:56.515961	f
6	62	174	96	2026-08-23 03:57:11.620211	f
7	62	175	4.5 days	2026-08-23 03:57:20.229105	f
8	62	176	15 seconds	2026-08-23 03:57:27.423094	f
9	62	177	$1,800	2026-08-23 03:57:29.62246	f
22	101	180	FORTMA	2026-08-23 06:47:08.238454	f
23	102	179	7/36	2026-08-23 06:57:04.598198	f
24	102	180	FORTAM	2026-08-23 06:57:13.073901	f
25	102	181	Brother	2026-08-23 06:57:37.605819	f
26	102	182	Some polygons are not rectangles	2026-08-23 06:58:04.415773	f
27	102	183	10 years	2026-08-23 06:59:05.65462	f
28	102	184	70°	2026-08-23 06:59:08.817936	f
29	102	185	20	2026-08-23 06:59:10.411625	f
30	102	172	110	2026-08-23 06:59:13.985698	f
31	104	172	110	2026-08-23 07:05:41.56627	f
47	111	172	100	2026-08-23 07:31:21.809831	f
48	111	173	25%	2026-08-23 07:31:21.809831	f
49	111	174	96	2026-08-23 07:31:21.809831	f
50	111	175	4 days	2026-08-23 07:31:21.809831	f
51	111	176	10 seconds	2026-08-23 07:31:21.809831	f
52	111	177	$1,500	2026-08-23 07:31:21.809831	f
53	111	178	24	2026-08-23 07:31:21.809831	f
54	111	179	1/6	2026-08-23 07:31:21.809831	f
55	111	180	FORTAM	2026-08-23 07:31:21.809831	f
56	111	181	Brother	2026-08-23 07:31:21.809831	f
57	111	182	All squares are polygons	2026-08-23 07:31:21.809831	f
58	111	183	12 years	2026-08-23 07:31:21.809831	f
59	111	184	75°	2026-08-23 07:31:21.809831	f
60	111	185	30	2026-08-23 07:31:21.809831	f
61	111	186	$450	2026-08-23 07:31:21.809831	f
62	114	172	100	2026-08-23 10:11:10.809997	f
63	114	173	25%	2026-08-23 10:11:10.809997	f
64	114	174	96	2026-08-23 10:11:10.809997	f
65	114	175	4 days	2026-08-23 10:11:10.809997	f
66	114	176	10 seconds	2026-08-23 10:11:10.809997	f
67	114	177	$1,500	2026-08-23 10:11:10.809997	f
68	114	178	24	2026-08-23 10:11:10.809997	f
69	114	179	1/6	2026-08-23 10:11:10.809997	f
70	114	180	FORTAM	2026-08-23 10:11:10.809997	f
71	114	181	Brother	2026-08-23 10:11:10.809997	f
72	114	182	All squares are polygons	2026-08-23 10:11:10.809997	f
73	114	183	12 years	2026-08-23 10:11:10.809997	f
74	114	184	75°	2026-08-23 10:11:10.809997	f
75	114	185	30	2026-08-23 10:11:10.809997	f
76	114	186	$450	2026-08-23 10:11:10.809997	f
78	110	172	Option B selected	2026-08-27 15:47:26.606361	t
79	134	64	$140,000	2026-08-27 15:52:01.094443	f
80	134	65	Replace all nulls with 100.	2026-08-27 15:52:03.157497	f
81	134	66	Anonymize/mask PII fields, encrypt the dataset at rest/transit, and share via authorized secure channels with access controls.	2026-08-27 15:52:05.738692	f
122	171	4	{"language":"python","code":"import sys\\n\\ndef solve():\\n    lines = sys.stdin.read().splitlines()\\n    if not lines:\\n        return\\n    nums = list(map(int, lines[0].split()))\\n    target = int(lines[1].strip())\\n    \\n    # Write your solution here\\n    seen = {}\\n    for i, num in enumerate(nums):\\n        complement = target - num\\n        if complement in seen:\\n            print(f\\"{seen[complement]} {i}\\")\\n            return\\n        seen[num] = i\\n\\nif __name__ == '__main__':\\n    solve()\\n"}	2026-09-05 15:50:26.003255	f
82	134	67		2026-08-27 15:52:23.885618	f
83	134	68	Print the raw spreadsheet and leave it in the conference room.	2026-08-27 15:52:26.172336	f
84	134	69	Both regions achieved equal growth (30%)	2026-08-27 15:52:30.481781	f
85	134	70	An anomaly/outlier caused by a marketing campaign or data entry error requiring isolation.	2026-08-27 15:52:32.521813	f
86	136	184	90°	2026-08-27 16:12:31.396047	f
87	136	185	20	2026-08-27 16:12:36.210901	f
119	169	1	12	2026-08-30 13:35:02.76059	f
120	169	2	8	2026-08-30 13:35:18.811565	f
121	169	3	75%	2026-08-30 13:35:30.235845	f
123	176	64	$135,000	2026-09-03 15:18:57.411633	f
124	176	65	Replace all nulls with 0.	2026-09-03 15:21:30.821617	f
125	171	5	{"language":"python","code":"import sys\\n\\ndef solve():\\n    lines = sys.stdin.read().splitlines()\\n    if len(lines) < 2:\\n        return\\n    s = lines[0].strip()\\n    t = lines[1].strip()\\n    \\n    # Write your solution here\\n    if sorted(s) == sorted(t):\\n        print(\\"true\\")\\n    else:\\n        print(\\"false\\")\\n\\nif __name__ == '__main__':\\n    solve()\\n"}	2026-09-03 16:07:36.430615	f
126	178	1	14	2026-09-05 15:48:31.303526	f
127	178	2	9	2026-09-05 15:48:34.345923	f
128	178	3	50%	2026-09-05 15:48:38.790188	f
\.


--
-- Data for Name: assessment_results; Type: TABLE DATA; Schema: public; Owner: nasc_admin
--

COPY public.assessment_results (id, attempt_id, total_score, max_score, percentage, passed, readiness_index, evaluated_at) FROM stdin;
22	32	3	10	30	f	Developing	2026-08-20 16:34:27.309114
54	64	1	15	6.67	f	Needs Improvement	2026-08-23 03:52:34.380474
55	62	3	15	20	f	Needs Improvement	2026-08-23 03:57:38.30673
91	101	0	15	0	f	Needs Improvement	2026-08-23 06:47:16.341318
93	102	2	15	13.33	f	Needs Improvement	2026-08-23 07:02:08.120843
94	104	0	15	0	f	Needs Improvement	2026-08-23 07:05:55.819919
96	111	15	15	100	t	Advanced	2026-08-23 07:31:21.861297
97	112	0	15	0	f	Needs Improvement	2026-08-23 10:07:02.666805
98	113	0	15	0	f	Needs Improvement	2026-08-23 10:11:10.613758
99	114	15	15	100	t	Advanced	2026-08-23 10:11:10.879004
101	117	0	6	0	f	Needs Improvement	2026-08-23 11:16:07.114338
102	119	0	6	0	f	Needs Improvement	2026-08-23 11:17:15.305134
103	121	0	6	0	f	Needs Improvement	2026-08-23 11:33:49.934734
105	125	0	6	0	f	Needs Improvement	2026-08-23 12:15:49.016984
110	134	11	45	24.44	f	Needs Improvement	2026-08-27 16:08:18.130271
114	136	0	15	0	f	Needs Improvement	2026-08-30 13:34:11.668723
115	169	6	6	100	t	Advanced	2026-08-30 13:35:34.35686
119	176	1	45	2.22	f	Needs Improvement	2026-09-05 15:59:57.122645
120	33	0	6	0	f	Needs Improvement	2026-09-05 15:59:57.185142
121	127	0	45	0	f	Needs Improvement	2026-09-05 15:59:57.236206
122	131	0	6	0	f	Needs Improvement	2026-09-05 15:59:57.282701
123	178	0	6	0	f	Needs Improvement	2026-09-05 16:03:03.332527
\.


--
-- Data for Name: assessment_rounds; Type: TABLE DATA; Schema: public; Owner: nasc_admin
--

COPY public.assessment_rounds (id, domain_id, round_number, slug, title, description, round_type, duration_minutes, questions_per_attempt, rules_json) FROM stdin;
1	1	1	cognitive-aptitude	Round 1: Cognitive & Software Aptitude	Assesses logical reasoning, analytical problem solving, and computational thinking for software engineering.	DATA_APTITUDE_MCQ	35	25	{"full_screen_required": true, "copy_paste_disabled": false, "tab_switch_limit": 3, "shuffle_questions": true, "auto_submit_on_expiry": true}
2	1	2	programming-coding	Round 2: Programming & Coding	Hands-on coding challenges in an isolated developer workstation with live test case verification.	CODING	60	2	{}
3	1	3	technical-knowledge	Round 3: Technical Knowledge	Deep technical assessment across OOP, Data Structures, DBMS, SQL, Operating Systems, and REST APIs.	TECHNICAL_MCQ	45	30	{}
4	1	4	debugging-problem-solving	Round 4: Debugging & Software Problem Solving	Developer workstation debugging scenarios focusing on fixing broken code, optimizing slow routines, and SQL query repair.	DEBUGGING	45	4	{}
5	2	1	round-1-communication-typing	Round 1: Written Communication & Typing	Evaluates written English grammar, chat tone correction, and real-time typing speed and accuracy.	COMMUNICATION_BENCHMARK	30	26	{}
6	2	2	round-2-customer-judgment	Round 2: Customer Judgment & De-escalation	Scenario-based evaluation measuring customer understanding, empathy, ownership, and conflict de-escalation.	CUSTOMER_JUDGMENT	35	12	{}
7	2	3	round-3-sop-knowledge-base	Round 3: SOP, Knowledge Base & Resolution	Workstation case studies requiring Knowledge Base search, policy eligibility verification, and ticket documentation.	KNOWLEDGE_BASE_PRACTICAL	40	15	{}
8	2	4	round-4-live-chat-simulation	Round 4: Production Post-Sales Chat Simulation	High-fidelity live agent console simulation managing 3 concurrent customer chats with dynamic events, SLA timers, and ticketing.	SUPPORT_CONSOLE_SIMULATION	50	3	{}
9	3	1	round-1-analytical-fundamentals	Round 1: Analytical & Data Interpretation	Evaluates quantitative reasoning, data interpretation, trend analysis, and numerical problem solving.	DATA_APTITUDE_MCQ	35	10	{}
10	3	2	round-2-sql-data-extraction	Round 2: SQL + Excel + Data Extraction	Hands-on technical assessment covering SQL queries, Excel formulas, Pivot Tables, and multi-source data extraction.	SQL_PRACTICAL	50	10	{}
11	3	3	round-3-excel-vba-visualization	Round 3: Python Concepts + Coding	Core Python fundamentals, Pandas analytics coding challenges, and broken script debugging.	PYTHON_PRACTICAL	35	8	{}
12	3	4	round-4-python-data-analytics	Round 4: Tableau + Visualization + Business Case	Procedural Tableau tasks, chart selection best practices, and retail business decline case analysis.	PYTHON_PRACTICAL	45	8	{}
13	3	5	round-5-project-based-interview	Round 5: Project-Based Technical Interview	Project validation featuring Section A (Project Discussion) & Section B (Project-Derived Technical Questions).	BUSINESS_CASE_AND_INTERVIEW	40	6	{}
22	8	1	round-1-basic-aptitude	Round 1: Foundational Quantitative & Logical Aptitude	Evaluate numerical agility, arithmetic reasoning, percentages, ratios, number patterns, and basic algorithmic deduction logic.	DATA_APTITUDE_MCQ	30	15	{"allow_review": true, "shuffle_questions": false}
23	8	2	round-2-c-fundamentals	Round 2: C Language Syntax, Pointers & Memory Fundamentals	Test understanding of pointer dereferencing, pointer arithmetic, memory layout, storage classes, structs, unions, bitwise operators, and preprocessor macros.	TECHNICAL_MCQ	30	15	{"allow_review": true, "shuffle_questions": false}
24	8	3	round-3-c-coding	Round 3: Core C Algorithmic Coding	Hands-on C program implementation testing string manipulation, dynamic memory allocation with malloc, and pointer manipulation.	CODING	45	3	{"allow_review": true, "shuffle_questions": false}
25	8	4	round-4-c-debugging	Round 4: C Memory Safety & Systems Debugging	Inspect and fix buggy C source code containing segmentation faults, off-by-one pointer arithmetic, and uninitialized pointers.	DEBUGGING	35	2	{"allow_review": true, "shuffle_questions": false}
\.


--
-- Data for Name: assessment_student_allocations; Type: TABLE DATA; Schema: public; Owner: nasc_admin
--

COPY public.assessment_student_allocations (id, request_id, student_id, status, source, valid_from, valid_until, allocated_at) FROM stdin;
2	2	1	MIGRATED	LEGACY_CORPORATE_ASSESSMENT	2025-08-20 14:01:15.092151	2027-08-20 14:01:15.092151	2026-08-20 14:01:15.099535
3	3	1	MIGRATED	LEGACY_CORPORATE_ASSESSMENT	2025-08-20 14:01:15.164868	2027-08-20 14:01:15.164868	2026-08-20 14:01:15.170332
4	4	1	MIGRATED	LEGACY_CORPORATE_ASSESSMENT	2025-08-20 14:01:15.189225	2027-08-20 14:01:15.189225	2026-08-20 14:01:15.199235
5	4	2	MIGRATED	LEGACY_CORPORATE_ASSESSMENT	2025-08-20 14:01:15.189225	2027-08-20 14:01:15.189225	2026-08-20 14:01:15.28848
6	2	2	MIGRATED	LEGACY_CORPORATE_ASSESSMENT	2025-08-20 14:01:15.092151	2027-08-20 14:01:15.092151	2026-08-20 14:01:15.309515
8	9	1	APPROVED	TUTOR_ACTIVATION	2026-07-24 03:40:44.219059	2027-08-23 03:40:44.219059	2026-08-23 03:40:44.219059
9	9	2	APPROVED	TUTOR_ACTIVATION	2026-07-24 03:40:44.219059	2027-08-23 03:40:44.219059	2026-08-23 03:40:44.219059
10	9	3	APPROVED	TUTOR_ACTIVATION	2026-07-24 03:40:44.219059	2027-08-23 03:40:44.219059	2026-08-23 03:40:44.219059
11	9	4	APPROVED	TUTOR_ACTIVATION	2026-07-24 03:40:44.219059	2027-08-23 03:40:44.219059	2026-08-23 03:40:44.219059
12	9	5	APPROVED	TUTOR_ACTIVATION	2026-07-24 03:40:44.219059	2027-08-23 03:40:44.219059	2026-08-23 03:40:44.219059
13	9	6	APPROVED	TUTOR_ACTIVATION	2026-07-24 03:40:44.228113	2027-08-23 03:40:44.228113	2026-08-23 03:40:44.228113
14	9	7	APPROVED	TUTOR_ACTIVATION	2026-07-24 03:40:44.229634	2027-08-23 03:40:44.229634	2026-08-23 03:40:44.229634
15	9	8	APPROVED	TUTOR_ACTIVATION	2026-07-24 03:40:44.229634	2027-08-23 03:40:44.229634	2026-08-23 03:40:44.229634
16	9	9	APPROVED	TUTOR_ACTIVATION	2026-07-24 03:40:44.229634	2027-08-23 03:40:44.229634	2026-08-23 03:40:44.229634
17	9	10	APPROVED	TUTOR_ACTIVATION	2026-07-24 03:40:44.233281	2027-08-23 03:40:44.233281	2026-08-23 03:40:44.233281
18	9	11	APPROVED	TUTOR_ACTIVATION	2026-07-24 03:40:44.235745	2027-08-23 03:40:44.235745	2026-08-23 03:40:44.235745
19	9	12	APPROVED	TUTOR_ACTIVATION	2026-07-24 03:40:44.235745	2027-08-23 03:40:44.235745	2026-08-23 03:40:44.235745
20	9	13	APPROVED	TUTOR_ACTIVATION	2026-07-24 03:40:44.238252	2027-08-23 03:40:44.238252	2026-08-23 03:40:44.238252
21	9	14	APPROVED	TUTOR_ACTIVATION	2026-07-24 03:40:44.238252	2027-08-23 03:40:44.238252	2026-08-23 03:40:44.238252
22	9	15	APPROVED	TUTOR_ACTIVATION	2026-07-24 03:40:44.239796	2027-08-23 03:40:44.239796	2026-08-23 03:40:44.239796
23	9	16	APPROVED	TUTOR_ACTIVATION	2026-07-24 03:40:44.239796	2027-08-23 03:40:44.239796	2026-08-23 03:40:44.239796
24	9	17	APPROVED	TUTOR_ACTIVATION	2026-07-24 03:40:44.239796	2027-08-23 03:40:44.239796	2026-08-23 03:40:44.239796
25	9	18	APPROVED	TUTOR_ACTIVATION	2026-07-24 03:40:44.239796	2027-08-23 03:40:44.239796	2026-08-23 03:40:44.239796
26	9	19	APPROVED	TUTOR_ACTIVATION	2026-07-24 03:40:44.239796	2027-08-23 03:40:44.239796	2026-08-23 03:40:44.239796
27	9	20	APPROVED	TUTOR_ACTIVATION	2026-07-24 03:40:44.239796	2027-08-23 03:40:44.239796	2026-08-23 03:40:44.239796
28	9	21	APPROVED	TUTOR_ACTIVATION	2026-07-24 03:40:44.239796	2027-08-23 03:40:44.239796	2026-08-23 03:40:44.239796
29	9	22	APPROVED	TUTOR_ACTIVATION	2026-07-24 03:40:44.248274	2027-08-23 03:40:44.248274	2026-08-23 03:40:44.248274
30	9	23	APPROVED	TUTOR_ACTIVATION	2026-07-24 03:40:44.249178	2027-08-23 03:40:44.249178	2026-08-23 03:40:44.249178
31	9	24	APPROVED	TUTOR_ACTIVATION	2026-07-24 03:40:44.251985	2027-08-23 03:40:44.251985	2026-08-23 03:40:44.251985
32	9	25	APPROVED	TUTOR_ACTIVATION	2026-07-24 03:40:44.252515	2027-08-23 03:40:44.252515	2026-08-23 03:40:44.252515
33	9	26	APPROVED	TUTOR_ACTIVATION	2026-07-24 03:40:44.254158	2027-08-23 03:40:44.254158	2026-08-23 03:40:44.254158
34	9	27	APPROVED	TUTOR_ACTIVATION	2026-07-24 03:40:44.254158	2027-08-23 03:40:44.254158	2026-08-23 03:40:44.254158
35	9	28	APPROVED	TUTOR_ACTIVATION	2026-07-24 03:40:44.254158	2027-08-23 03:40:44.254158	2026-08-23 03:40:44.254158
36	9	29	APPROVED	TUTOR_ACTIVATION	2026-07-24 03:40:44.258239	2027-08-23 03:40:44.258239	2026-08-23 03:40:44.258239
37	9	30	APPROVED	TUTOR_ACTIVATION	2026-07-24 03:40:44.258239	2027-08-23 03:40:44.258239	2026-08-23 03:40:44.258239
38	9	31	APPROVED	TUTOR_ACTIVATION	2026-07-24 03:40:44.260754	2027-08-23 03:40:44.260754	2026-08-23 03:40:44.260754
39	9	32	APPROVED	TUTOR_ACTIVATION	2026-07-24 03:40:44.260754	2027-08-23 03:40:44.260754	2026-08-23 03:40:44.260754
40	9	33	APPROVED	TUTOR_ACTIVATION	2026-07-24 03:40:44.260754	2027-08-23 03:40:44.260754	2026-08-23 03:40:44.260754
41	9	34	APPROVED	TUTOR_ACTIVATION	2026-07-24 03:40:44.260754	2027-08-23 03:40:44.260754	2026-08-23 03:40:44.260754
42	9	35	APPROVED	TUTOR_ACTIVATION	2026-07-24 03:40:44.260754	2027-08-23 03:40:44.260754	2026-08-23 03:40:44.260754
43	9	36	APPROVED	TUTOR_ACTIVATION	2026-07-24 03:40:44.260754	2027-08-23 03:40:44.260754	2026-08-23 03:40:44.260754
44	9	37	APPROVED	TUTOR_ACTIVATION	2026-07-24 03:40:44.268042	2027-08-23 03:40:44.268042	2026-08-23 03:40:44.268042
45	9	38	APPROVED	TUTOR_ACTIVATION	2026-07-24 03:40:44.269439	2027-08-23 03:40:44.269439	2026-08-23 03:40:44.269439
46	9	39	APPROVED	TUTOR_ACTIVATION	2026-07-24 03:40:44.270988	2027-08-23 03:40:44.270988	2026-08-23 03:40:44.270988
47	9	40	APPROVED	TUTOR_ACTIVATION	2026-07-24 03:40:44.270988	2027-08-23 03:40:44.270988	2026-08-23 03:40:44.270988
48	9	41	APPROVED	TUTOR_ACTIVATION	2026-07-24 03:40:44.270988	2027-08-23 03:40:44.270988	2026-08-23 03:40:44.270988
49	9	42	APPROVED	TUTOR_ACTIVATION	2026-07-24 03:40:44.270988	2027-08-23 03:40:44.270988	2026-08-23 03:40:44.270988
50	9	43	APPROVED	TUTOR_ACTIVATION	2026-07-24 03:40:44.270988	2027-08-23 03:40:44.270988	2026-08-23 03:40:44.270988
51	9	44	APPROVED	TUTOR_ACTIVATION	2026-07-24 03:40:44.276189	2027-08-23 03:40:44.276189	2026-08-23 03:40:44.276189
52	9	45	APPROVED	TUTOR_ACTIVATION	2026-07-24 03:40:44.276189	2027-08-23 03:40:44.276189	2026-08-23 03:40:44.276189
53	9	46	APPROVED	TUTOR_ACTIVATION	2026-07-24 03:40:44.276189	2027-08-23 03:40:44.276189	2026-08-23 03:40:44.276189
54	9	47	APPROVED	TUTOR_ACTIVATION	2026-07-24 03:40:44.278208	2027-08-23 03:40:44.278208	2026-08-23 03:40:44.278208
55	9	48	APPROVED	TUTOR_ACTIVATION	2026-07-24 03:40:44.278208	2027-08-23 03:40:44.278208	2026-08-23 03:40:44.278208
60	13	48	APPROVED	TUTOR_ACTIVATION	2026-08-23 10:15:13.938	2026-09-22 10:15:13.938	2026-08-23 10:28:38.703528
61	13	50	APPROVED	TUTOR_ACTIVATION	2026-08-23 10:15:13.938	2026-09-22 10:15:13.938	2026-08-23 10:28:38.703528
65	16	48	APPROVED	TUTOR_ACTIVATION	2026-08-23 12:47:18.617	2026-09-22 12:47:18.617	2026-08-23 12:48:11.746641
66	16	50	APPROVED	TUTOR_ACTIVATION	2026-08-23 12:47:18.617	2026-09-22 12:47:18.617	2026-08-23 12:48:11.746641
77	23	48	APPROVED	TUTOR_ACTIVATION	2026-09-03 15:33:01.492	2026-10-03 15:33:01.492	2026-09-05 15:33:28.382191
78	23	50	APPROVED	TUTOR_ACTIVATION	2026-09-03 15:33:01.492	2026-10-03 15:33:01.492	2026-09-05 15:33:28.382191
58	11	50	APPROVED	TUTOR_ACTIVATION	2026-08-23 06:52:00	2026-08-22 06:52:00	2026-08-23 06:53:41.17597
69	19	48	APPROVED	TUTOR_ACTIVATION	2026-08-27 15:05:48.231	2026-09-26 15:05:48.231	2026-08-27 15:06:43.086481
70	19	50	APPROVED	TUTOR_ACTIVATION	2026-08-27 15:05:48.231	2026-09-26 15:05:48.231	2026-08-27 15:06:43.086481
71	18	48	APPROVED	TUTOR_ACTIVATION	2026-08-27 15:05:41.976	2026-09-26 15:05:41.976	2026-08-27 15:06:47.845407
72	18	50	APPROVED	TUTOR_ACTIVATION	2026-08-27 15:05:41.976	2026-09-26 15:05:41.976	2026-08-27 15:06:47.845407
73	17	48	APPROVED	TUTOR_ACTIVATION	2026-08-27 15:05:35.272	2026-09-26 15:05:35.272	2026-08-27 15:06:51.575523
74	17	50	APPROVED	TUTOR_ACTIVATION	2026-08-27 15:05:35.272	2026-09-26 15:05:35.272	2026-08-27 15:06:51.575523
\.


--
-- Data for Name: attempt_question_snapshots; Type: TABLE DATA; Schema: public; Owner: nasc_admin
--

COPY public.attempt_question_snapshots (id, attempt_id, question_id, question_version_id, snapshot_content_json) FROM stdin;
244	110	172	\N	{"id": 172, "title": "Ratio & Proportion Division", "candidate_content": "Two numbers are in the ratio 4 : 5. If their sum is 180, what is the value of the larger number?", "candidate_code_template": null, "options_json": ["80", "90", "100", "110"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 70, "competency_code": "APT_NUM", "competency_name": "Numerical Reasoning & Arithmetic Basics"}
13	33	1	1	{"id": 1, "title": "Bitwise Operations & Shift Logic", "candidate_content": "What is the result of evaluating `(16 >> 2) | (4 << 1)` in standard integer arithmetic?", "candidate_code_template": null, "options_json": [{"id": 1, "text": "12"}, {"id": 2, "text": "14"}, {"id": 3, "text": "8"}, {"id": 4, "text": "16"}], "marks": 2.0, "difficulty": "Easy", "time_limit_seconds": 60, "question_type": "mcq", "competency_id": 1, "competency_code": "LOGIC", "competency_name": "Logical & Analytical Reasoning"}
59	62	185	\N	{"id": 185, "title": "Iterative Loop Sum Deduction", "candidate_content": "Consider this algorithmic step:\\nlet sum = 0;\\nfor (i = 1 to 4) {\\n  sum = sum + (i * i);\\n}\\nWhat is the final value of sum?", "candidate_code_template": null, "options_json": ["20", "30", "14", "25"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 72, "competency_code": "APT_ALGO", "competency_name": "Flow Logic & Algorithmic Deductions"}
60	62	186	\N	{"id": 186, "title": "Conditional Discount Flow Deduction", "candidate_content": "A billing algorithm states: 'If total > 500 give 20% discount; else if total > 200 give 10% discount; else give 0% discount.' What is the final payable amount for a cart value of exactly $500?", "candidate_code_template": null, "options_json": ["$400", "$450", "$500", "$425"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 72, "competency_code": "APT_ALGO", "competency_name": "Flow Logic & Algorithmic Deductions"}
61	64	172	\N	{"id": 172, "title": "Ratio & Proportion Division", "candidate_content": "Two numbers are in the ratio 4 : 5. If their sum is 180, what is the value of the larger number?", "candidate_code_template": null, "options_json": ["80", "90", "100", "110"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 70, "competency_code": "APT_NUM", "competency_name": "Numerical Reasoning & Arithmetic Basics"}
62	64	173	\N	{"id": 173, "title": "Percentage Profit Calculation", "candidate_content": "An item purchased for $400 is sold for $500. What is the percentage profit gained on this transaction?", "candidate_code_template": null, "options_json": ["20%", "25%", "30%", "15%"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 70, "competency_code": "APT_NUM", "competency_name": "Numerical Reasoning & Arithmetic Basics"}
63	64	174	\N	{"id": 174, "title": "Arithmetic Progression Series", "candidate_content": "Identify the next number in the sequence: 3, 6, 12, 24, 48, ___", "candidate_code_template": null, "options_json": ["64", "72", "96", "84"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 71, "competency_code": "APT_LOGIC", "competency_name": "Logical Deductions & Series Patterns"}
64	64	175	\N	{"id": 175, "title": "Combined Work Rate", "candidate_content": "Worker A can finish a project in 6 days, while Worker B takes 12 days for the same project. Working together, how many days will they take to complete it?", "candidate_code_template": null, "options_json": ["4 days", "3 days", "5 days", "4.5 days"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 70, "competency_code": "APT_NUM", "competency_name": "Numerical Reasoning & Arithmetic Basics"}
65	64	176	\N	{"id": 176, "title": "Speed, Distance and Time", "candidate_content": "A train 150 meters long travels at a constant speed of 54 km/h. How many seconds does it take to cross a stationary signal pole?", "candidate_code_template": null, "options_json": ["10 seconds", "12 seconds", "15 seconds", "8 seconds"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 70, "competency_code": "APT_NUM", "competency_name": "Numerical Reasoning & Arithmetic Basics"}
66	64	177	\N	{"id": 177, "title": "Simple Interest Accrual", "candidate_content": "What is the Simple Interest on a principal amount of $5,000 invested at an annual rate of 10% for a period of 3 years?", "candidate_code_template": null, "options_json": ["$1,200", "$1,500", "$1,650", "$1,800"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 70, "competency_code": "APT_NUM", "competency_name": "Numerical Reasoning & Arithmetic Basics"}
67	64	178	\N	{"id": 178, "title": "Arithmetic Mean of Integer Set", "candidate_content": "Find the average (arithmetic mean) of the numbers: 12, 18, 24, 30, and 36.", "candidate_code_template": null, "options_json": ["22", "24", "26", "28"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 70, "competency_code": "APT_NUM", "competency_name": "Numerical Reasoning & Arithmetic Basics"}
68	64	179	\N	{"id": 179, "title": "Dice Roll Probability", "candidate_content": "When two standard six-sided dice are rolled simultaneously, what is the probability that the sum of the rolled numbers is exactly 7?", "candidate_code_template": null, "options_json": ["1/6", "1/12", "5/36", "7/36"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 71, "competency_code": "APT_LOGIC", "competency_name": "Logical Deductions & Series Patterns"}
14	33	2	2	{"id": 2, "title": "Binary Tree Traversal Deductions", "candidate_content": "A complete binary tree has 15 nodes. How many leaf nodes does this tree possess?", "candidate_code_template": null, "options_json": [{"id": 1, "text": "7"}, {"id": 2, "text": "8"}, {"id": 3, "text": "9"}, {"id": 4, "text": "10"}], "marks": 2.0, "difficulty": "Medium", "time_limit_seconds": 60, "question_type": "mcq", "competency_id": 3, "competency_code": "COMP_THINK", "competency_name": "Computational Thinking"}
15	33	3	3	{"id": 3, "title": "Server Request Latency Calculation", "candidate_content": "A microservice cluster processes 1,200 requests per second across 4 parallel worker instances. Each instance handles requests synchronously at an average duration of 2.5ms. What is the CPU utilization per instance?", "candidate_code_template": null, "options_json": [{"id": 1, "text": "50%"}, {"id": 2, "text": "75%"}, {"id": 3, "text": "80%"}, {"id": 4, "text": "90%"}], "marks": 2.0, "difficulty": "Medium", "time_limit_seconds": 60, "question_type": "mcq", "competency_id": 2, "competency_code": "QUANT", "competency_name": "Quantitative & Data Interpretation"}
46	62	172	\N	{"id": 172, "title": "Ratio & Proportion Division", "candidate_content": "Two numbers are in the ratio 4 : 5. If their sum is 180, what is the value of the larger number?", "candidate_code_template": null, "options_json": ["80", "90", "100", "110"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 70, "competency_code": "APT_NUM", "competency_name": "Numerical Reasoning & Arithmetic Basics"}
47	62	173	\N	{"id": 173, "title": "Percentage Profit Calculation", "candidate_content": "An item purchased for $400 is sold for $500. What is the percentage profit gained on this transaction?", "candidate_code_template": null, "options_json": ["20%", "25%", "30%", "15%"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 70, "competency_code": "APT_NUM", "competency_name": "Numerical Reasoning & Arithmetic Basics"}
48	62	174	\N	{"id": 174, "title": "Arithmetic Progression Series", "candidate_content": "Identify the next number in the sequence: 3, 6, 12, 24, 48, ___", "candidate_code_template": null, "options_json": ["64", "72", "96", "84"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 71, "competency_code": "APT_LOGIC", "competency_name": "Logical Deductions & Series Patterns"}
49	62	175	\N	{"id": 175, "title": "Combined Work Rate", "candidate_content": "Worker A can finish a project in 6 days, while Worker B takes 12 days for the same project. Working together, how many days will they take to complete it?", "candidate_code_template": null, "options_json": ["4 days", "3 days", "5 days", "4.5 days"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 70, "competency_code": "APT_NUM", "competency_name": "Numerical Reasoning & Arithmetic Basics"}
50	62	176	\N	{"id": 176, "title": "Speed, Distance and Time", "candidate_content": "A train 150 meters long travels at a constant speed of 54 km/h. How many seconds does it take to cross a stationary signal pole?", "candidate_code_template": null, "options_json": ["10 seconds", "12 seconds", "15 seconds", "8 seconds"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 70, "competency_code": "APT_NUM", "competency_name": "Numerical Reasoning & Arithmetic Basics"}
51	62	177	\N	{"id": 177, "title": "Simple Interest Accrual", "candidate_content": "What is the Simple Interest on a principal amount of $5,000 invested at an annual rate of 10% for a period of 3 years?", "candidate_code_template": null, "options_json": ["$1,200", "$1,500", "$1,650", "$1,800"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 70, "competency_code": "APT_NUM", "competency_name": "Numerical Reasoning & Arithmetic Basics"}
52	62	178	\N	{"id": 178, "title": "Arithmetic Mean of Integer Set", "candidate_content": "Find the average (arithmetic mean) of the numbers: 12, 18, 24, 30, and 36.", "candidate_code_template": null, "options_json": ["22", "24", "26", "28"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 70, "competency_code": "APT_NUM", "competency_name": "Numerical Reasoning & Arithmetic Basics"}
53	62	179	\N	{"id": 179, "title": "Dice Roll Probability", "candidate_content": "When two standard six-sided dice are rolled simultaneously, what is the probability that the sum of the rolled numbers is exactly 7?", "candidate_code_template": null, "options_json": ["1/6", "1/12", "5/36", "7/36"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 71, "competency_code": "APT_LOGIC", "competency_name": "Logical Deductions & Series Patterns"}
54	62	180	\N	{"id": 180, "title": "Pattern Coding & Transposition", "candidate_content": "If the word 'SYSTEM' is encoded as 'SYSMET' by reversing the second half of the word, how will 'FORMAT' be encoded under the exact same rule?", "candidate_code_template": null, "options_json": ["FORTAM", "FORATM", "TAMFOR", "FORTMA"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 71, "competency_code": "APT_LOGIC", "competency_name": "Logical Deductions & Series Patterns"}
55	62	181	\N	{"id": 181, "title": "Family Tree Logical Deduction", "candidate_content": "Pointing to a photograph, a woman says: 'He is the only son of the mother of my only brother.' How is the man in the photograph related to the woman?", "candidate_code_template": null, "options_json": ["Brother", "Father", "Uncle", "Nephew"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 71, "competency_code": "APT_LOGIC", "competency_name": "Logical Deductions & Series Patterns"}
56	62	182	\N	{"id": 182, "title": "Categorical Syllogism", "candidate_content": "Premises:\\n1. All squares are rectangles.\\n2. All rectangles are polygons.\\nConclusion: Which statement is strictly valid?", "candidate_code_template": null, "options_json": ["All squares are polygons", "All polygons are squares", "Some polygons are not rectangles", "No rectangles are squares"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 71, "competency_code": "APT_LOGIC", "competency_name": "Logical Deductions & Series Patterns"}
57	62	183	\N	{"id": 183, "title": "Linear Age Relationship", "candidate_content": "A father is currently 3 times as old as his son. In 12 years, the father will be twice as old as his son. What is the son's current age?", "candidate_code_template": null, "options_json": ["10 years", "12 years", "14 years", "16 years"], "marks": 1.0, "difficulty": "Medium", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 70, "competency_code": "APT_NUM", "competency_name": "Numerical Reasoning & Arithmetic Basics"}
58	62	184	\N	{"id": 184, "title": "Analog Clock Hand Angle", "candidate_content": "What is the acute angle between the hour hand and minute hand of a clock at 3:30?", "candidate_code_template": null, "options_json": ["75\\u00b0", "70\\u00b0", "80\\u00b0", "90\\u00b0"], "marks": 1.0, "difficulty": "Medium", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 71, "competency_code": "APT_LOGIC", "competency_name": "Logical Deductions & Series Patterns"}
69	64	180	\N	{"id": 180, "title": "Pattern Coding & Transposition", "candidate_content": "If the word 'SYSTEM' is encoded as 'SYSMET' by reversing the second half of the word, how will 'FORMAT' be encoded under the exact same rule?", "candidate_code_template": null, "options_json": ["FORTAM", "FORATM", "TAMFOR", "FORTMA"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 71, "competency_code": "APT_LOGIC", "competency_name": "Logical Deductions & Series Patterns"}
70	64	181	\N	{"id": 181, "title": "Family Tree Logical Deduction", "candidate_content": "Pointing to a photograph, a woman says: 'He is the only son of the mother of my only brother.' How is the man in the photograph related to the woman?", "candidate_code_template": null, "options_json": ["Brother", "Father", "Uncle", "Nephew"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 71, "competency_code": "APT_LOGIC", "competency_name": "Logical Deductions & Series Patterns"}
71	64	182	\N	{"id": 182, "title": "Categorical Syllogism", "candidate_content": "Premises:\\n1. All squares are rectangles.\\n2. All rectangles are polygons.\\nConclusion: Which statement is strictly valid?", "candidate_code_template": null, "options_json": ["All squares are polygons", "All polygons are squares", "Some polygons are not rectangles", "No rectangles are squares"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 71, "competency_code": "APT_LOGIC", "competency_name": "Logical Deductions & Series Patterns"}
72	64	183	\N	{"id": 183, "title": "Linear Age Relationship", "candidate_content": "A father is currently 3 times as old as his son. In 12 years, the father will be twice as old as his son. What is the son's current age?", "candidate_code_template": null, "options_json": ["10 years", "12 years", "14 years", "16 years"], "marks": 1.0, "difficulty": "Medium", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 70, "competency_code": "APT_NUM", "competency_name": "Numerical Reasoning & Arithmetic Basics"}
73	64	184	\N	{"id": 184, "title": "Analog Clock Hand Angle", "candidate_content": "What is the acute angle between the hour hand and minute hand of a clock at 3:30?", "candidate_code_template": null, "options_json": ["75\\u00b0", "70\\u00b0", "80\\u00b0", "90\\u00b0"], "marks": 1.0, "difficulty": "Medium", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 71, "competency_code": "APT_LOGIC", "competency_name": "Logical Deductions & Series Patterns"}
74	64	185	\N	{"id": 185, "title": "Iterative Loop Sum Deduction", "candidate_content": "Consider this algorithmic step:\\nlet sum = 0;\\nfor (i = 1 to 4) {\\n  sum = sum + (i * i);\\n}\\nWhat is the final value of sum?", "candidate_code_template": null, "options_json": ["20", "30", "14", "25"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 72, "competency_code": "APT_ALGO", "competency_name": "Flow Logic & Algorithmic Deductions"}
75	64	186	\N	{"id": 186, "title": "Conditional Discount Flow Deduction", "candidate_content": "A billing algorithm states: 'If total > 500 give 20% discount; else if total > 200 give 10% discount; else give 0% discount.' What is the final payable amount for a cart value of exactly $500?", "candidate_code_template": null, "options_json": ["$400", "$450", "$500", "$425"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 72, "competency_code": "APT_ALGO", "competency_name": "Flow Logic & Algorithmic Deductions"}
245	110	173	\N	{"id": 173, "title": "Percentage Profit Calculation", "candidate_content": "An item purchased for $400 is sold for $500. What is the percentage profit gained on this transaction?", "candidate_code_template": null, "options_json": ["20%", "25%", "30%", "15%"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 70, "competency_code": "APT_NUM", "competency_name": "Numerical Reasoning & Arithmetic Basics"}
246	110	174	\N	{"id": 174, "title": "Arithmetic Progression Series", "candidate_content": "Identify the next number in the sequence: 3, 6, 12, 24, 48, ___", "candidate_code_template": null, "options_json": ["64", "72", "96", "84"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 71, "competency_code": "APT_LOGIC", "competency_name": "Logical Deductions & Series Patterns"}
247	110	175	\N	{"id": 175, "title": "Combined Work Rate", "candidate_content": "Worker A can finish a project in 6 days, while Worker B takes 12 days for the same project. Working together, how many days will they take to complete it?", "candidate_code_template": null, "options_json": ["4 days", "3 days", "5 days", "4.5 days"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 70, "competency_code": "APT_NUM", "competency_name": "Numerical Reasoning & Arithmetic Basics"}
248	110	176	\N	{"id": 176, "title": "Speed, Distance and Time", "candidate_content": "A train 150 meters long travels at a constant speed of 54 km/h. How many seconds does it take to cross a stationary signal pole?", "candidate_code_template": null, "options_json": ["10 seconds", "12 seconds", "15 seconds", "8 seconds"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 70, "competency_code": "APT_NUM", "competency_name": "Numerical Reasoning & Arithmetic Basics"}
249	110	177	\N	{"id": 177, "title": "Simple Interest Accrual", "candidate_content": "What is the Simple Interest on a principal amount of $5,000 invested at an annual rate of 10% for a period of 3 years?", "candidate_code_template": null, "options_json": ["$1,200", "$1,500", "$1,650", "$1,800"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 70, "competency_code": "APT_NUM", "competency_name": "Numerical Reasoning & Arithmetic Basics"}
250	110	178	\N	{"id": 178, "title": "Arithmetic Mean of Integer Set", "candidate_content": "Find the average (arithmetic mean) of the numbers: 12, 18, 24, 30, and 36.", "candidate_code_template": null, "options_json": ["22", "24", "26", "28"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 70, "competency_code": "APT_NUM", "competency_name": "Numerical Reasoning & Arithmetic Basics"}
251	110	179	\N	{"id": 179, "title": "Dice Roll Probability", "candidate_content": "When two standard six-sided dice are rolled simultaneously, what is the probability that the sum of the rolled numbers is exactly 7?", "candidate_code_template": null, "options_json": ["1/6", "1/12", "5/36", "7/36"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 71, "competency_code": "APT_LOGIC", "competency_name": "Logical Deductions & Series Patterns"}
252	110	180	\N	{"id": 180, "title": "Pattern Coding & Transposition", "candidate_content": "If the word 'SYSTEM' is encoded as 'SYSMET' by reversing the second half of the word, how will 'FORMAT' be encoded under the exact same rule?", "candidate_code_template": null, "options_json": ["FORTAM", "FORATM", "TAMFOR", "FORTMA"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 71, "competency_code": "APT_LOGIC", "competency_name": "Logical Deductions & Series Patterns"}
253	110	181	\N	{"id": 181, "title": "Family Tree Logical Deduction", "candidate_content": "Pointing to a photograph, a woman says: 'He is the only son of the mother of my only brother.' How is the man in the photograph related to the woman?", "candidate_code_template": null, "options_json": ["Brother", "Father", "Uncle", "Nephew"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 71, "competency_code": "APT_LOGIC", "competency_name": "Logical Deductions & Series Patterns"}
254	110	182	\N	{"id": 182, "title": "Categorical Syllogism", "candidate_content": "Premises:\\n1. All squares are rectangles.\\n2. All rectangles are polygons.\\nConclusion: Which statement is strictly valid?", "candidate_code_template": null, "options_json": ["All squares are polygons", "All polygons are squares", "Some polygons are not rectangles", "No rectangles are squares"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 71, "competency_code": "APT_LOGIC", "competency_name": "Logical Deductions & Series Patterns"}
255	110	183	\N	{"id": 183, "title": "Linear Age Relationship", "candidate_content": "A father is currently 3 times as old as his son. In 12 years, the father will be twice as old as his son. What is the son's current age?", "candidate_code_template": null, "options_json": ["10 years", "12 years", "14 years", "16 years"], "marks": 1.0, "difficulty": "Medium", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 70, "competency_code": "APT_NUM", "competency_name": "Numerical Reasoning & Arithmetic Basics"}
256	110	184	\N	{"id": 184, "title": "Analog Clock Hand Angle", "candidate_content": "What is the acute angle between the hour hand and minute hand of a clock at 3:30?", "candidate_code_template": null, "options_json": ["75\\u00b0", "70\\u00b0", "80\\u00b0", "90\\u00b0"], "marks": 1.0, "difficulty": "Medium", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 71, "competency_code": "APT_LOGIC", "competency_name": "Logical Deductions & Series Patterns"}
257	110	185	\N	{"id": 185, "title": "Iterative Loop Sum Deduction", "candidate_content": "Consider this algorithmic step:\\nlet sum = 0;\\nfor (i = 1 to 4) {\\n  sum = sum + (i * i);\\n}\\nWhat is the final value of sum?", "candidate_code_template": null, "options_json": ["20", "30", "14", "25"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 72, "competency_code": "APT_ALGO", "competency_name": "Flow Logic & Algorithmic Deductions"}
258	110	186	\N	{"id": 186, "title": "Conditional Discount Flow Deduction", "candidate_content": "A billing algorithm states: 'If total > 500 give 20% discount; else if total > 200 give 10% discount; else give 0% discount.' What is the final payable amount for a cart value of exactly $500?", "candidate_code_template": null, "options_json": ["$400", "$450", "$500", "$425"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 72, "competency_code": "APT_ALGO", "competency_name": "Flow Logic & Algorithmic Deductions"}
259	111	172	\N	{"id": 172, "title": "Ratio & Proportion Division", "candidate_content": "Two numbers are in the ratio 4 : 5. If their sum is 180, what is the value of the larger number?", "candidate_code_template": null, "options_json": ["80", "90", "100", "110"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 70, "competency_code": "APT_NUM", "competency_name": "Numerical Reasoning & Arithmetic Basics"}
260	111	173	\N	{"id": 173, "title": "Percentage Profit Calculation", "candidate_content": "An item purchased for $400 is sold for $500. What is the percentage profit gained on this transaction?", "candidate_code_template": null, "options_json": ["20%", "25%", "30%", "15%"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 70, "competency_code": "APT_NUM", "competency_name": "Numerical Reasoning & Arithmetic Basics"}
261	111	174	\N	{"id": 174, "title": "Arithmetic Progression Series", "candidate_content": "Identify the next number in the sequence: 3, 6, 12, 24, 48, ___", "candidate_code_template": null, "options_json": ["64", "72", "96", "84"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 71, "competency_code": "APT_LOGIC", "competency_name": "Logical Deductions & Series Patterns"}
262	111	175	\N	{"id": 175, "title": "Combined Work Rate", "candidate_content": "Worker A can finish a project in 6 days, while Worker B takes 12 days for the same project. Working together, how many days will they take to complete it?", "candidate_code_template": null, "options_json": ["4 days", "3 days", "5 days", "4.5 days"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 70, "competency_code": "APT_NUM", "competency_name": "Numerical Reasoning & Arithmetic Basics"}
263	111	176	\N	{"id": 176, "title": "Speed, Distance and Time", "candidate_content": "A train 150 meters long travels at a constant speed of 54 km/h. How many seconds does it take to cross a stationary signal pole?", "candidate_code_template": null, "options_json": ["10 seconds", "12 seconds", "15 seconds", "8 seconds"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 70, "competency_code": "APT_NUM", "competency_name": "Numerical Reasoning & Arithmetic Basics"}
264	111	177	\N	{"id": 177, "title": "Simple Interest Accrual", "candidate_content": "What is the Simple Interest on a principal amount of $5,000 invested at an annual rate of 10% for a period of 3 years?", "candidate_code_template": null, "options_json": ["$1,200", "$1,500", "$1,650", "$1,800"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 70, "competency_code": "APT_NUM", "competency_name": "Numerical Reasoning & Arithmetic Basics"}
265	111	178	\N	{"id": 178, "title": "Arithmetic Mean of Integer Set", "candidate_content": "Find the average (arithmetic mean) of the numbers: 12, 18, 24, 30, and 36.", "candidate_code_template": null, "options_json": ["22", "24", "26", "28"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 70, "competency_code": "APT_NUM", "competency_name": "Numerical Reasoning & Arithmetic Basics"}
266	111	179	\N	{"id": 179, "title": "Dice Roll Probability", "candidate_content": "When two standard six-sided dice are rolled simultaneously, what is the probability that the sum of the rolled numbers is exactly 7?", "candidate_code_template": null, "options_json": ["1/6", "1/12", "5/36", "7/36"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 71, "competency_code": "APT_LOGIC", "competency_name": "Logical Deductions & Series Patterns"}
267	111	180	\N	{"id": 180, "title": "Pattern Coding & Transposition", "candidate_content": "If the word 'SYSTEM' is encoded as 'SYSMET' by reversing the second half of the word, how will 'FORMAT' be encoded under the exact same rule?", "candidate_code_template": null, "options_json": ["FORTAM", "FORATM", "TAMFOR", "FORTMA"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 71, "competency_code": "APT_LOGIC", "competency_name": "Logical Deductions & Series Patterns"}
147	101	180	\N	{"id": 180, "title": "Pattern Coding & Transposition", "candidate_content": "If the word 'SYSTEM' is encoded as 'SYSMET' by reversing the second half of the word, how will 'FORMAT' be encoded under the exact same rule?", "candidate_code_template": null, "options_json": ["FORTAM", "FORATM", "TAMFOR", "FORTMA"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 71, "competency_code": "APT_LOGIC", "competency_name": "Logical Deductions & Series Patterns"}
148	101	181	\N	{"id": 181, "title": "Family Tree Logical Deduction", "candidate_content": "Pointing to a photograph, a woman says: 'He is the only son of the mother of my only brother.' How is the man in the photograph related to the woman?", "candidate_code_template": null, "options_json": ["Brother", "Father", "Uncle", "Nephew"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 71, "competency_code": "APT_LOGIC", "competency_name": "Logical Deductions & Series Patterns"}
149	101	182	\N	{"id": 182, "title": "Categorical Syllogism", "candidate_content": "Premises:\\n1. All squares are rectangles.\\n2. All rectangles are polygons.\\nConclusion: Which statement is strictly valid?", "candidate_code_template": null, "options_json": ["All squares are polygons", "All polygons are squares", "Some polygons are not rectangles", "No rectangles are squares"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 71, "competency_code": "APT_LOGIC", "competency_name": "Logical Deductions & Series Patterns"}
150	101	183	\N	{"id": 183, "title": "Linear Age Relationship", "candidate_content": "A father is currently 3 times as old as his son. In 12 years, the father will be twice as old as his son. What is the son's current age?", "candidate_code_template": null, "options_json": ["10 years", "12 years", "14 years", "16 years"], "marks": 1.0, "difficulty": "Medium", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 70, "competency_code": "APT_NUM", "competency_name": "Numerical Reasoning & Arithmetic Basics"}
151	101	184	\N	{"id": 184, "title": "Analog Clock Hand Angle", "candidate_content": "What is the acute angle between the hour hand and minute hand of a clock at 3:30?", "candidate_code_template": null, "options_json": ["75\\u00b0", "70\\u00b0", "80\\u00b0", "90\\u00b0"], "marks": 1.0, "difficulty": "Medium", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 71, "competency_code": "APT_LOGIC", "competency_name": "Logical Deductions & Series Patterns"}
152	101	185	\N	{"id": 185, "title": "Iterative Loop Sum Deduction", "candidate_content": "Consider this algorithmic step:\\nlet sum = 0;\\nfor (i = 1 to 4) {\\n  sum = sum + (i * i);\\n}\\nWhat is the final value of sum?", "candidate_code_template": null, "options_json": ["20", "30", "14", "25"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 72, "competency_code": "APT_ALGO", "competency_name": "Flow Logic & Algorithmic Deductions"}
153	101	186	\N	{"id": 186, "title": "Conditional Discount Flow Deduction", "candidate_content": "A billing algorithm states: 'If total > 500 give 20% discount; else if total > 200 give 10% discount; else give 0% discount.' What is the final payable amount for a cart value of exactly $500?", "candidate_code_template": null, "options_json": ["$400", "$450", "$500", "$425"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 72, "competency_code": "APT_ALGO", "competency_name": "Flow Logic & Algorithmic Deductions"}
161	102	179	\N	{"id": 179, "title": "Dice Roll Probability", "candidate_content": "When two standard six-sided dice are rolled simultaneously, what is the probability that the sum of the rolled numbers is exactly 7?", "candidate_code_template": null, "options_json": ["1/6", "1/12", "5/36", "7/36"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 71, "competency_code": "APT_LOGIC", "competency_name": "Logical Deductions & Series Patterns"}
162	102	180	\N	{"id": 180, "title": "Pattern Coding & Transposition", "candidate_content": "If the word 'SYSTEM' is encoded as 'SYSMET' by reversing the second half of the word, how will 'FORMAT' be encoded under the exact same rule?", "candidate_code_template": null, "options_json": ["FORTAM", "FORATM", "TAMFOR", "FORTMA"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 71, "competency_code": "APT_LOGIC", "competency_name": "Logical Deductions & Series Patterns"}
163	102	181	\N	{"id": 181, "title": "Family Tree Logical Deduction", "candidate_content": "Pointing to a photograph, a woman says: 'He is the only son of the mother of my only brother.' How is the man in the photograph related to the woman?", "candidate_code_template": null, "options_json": ["Brother", "Father", "Uncle", "Nephew"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 71, "competency_code": "APT_LOGIC", "competency_name": "Logical Deductions & Series Patterns"}
164	102	182	\N	{"id": 182, "title": "Categorical Syllogism", "candidate_content": "Premises:\\n1. All squares are rectangles.\\n2. All rectangles are polygons.\\nConclusion: Which statement is strictly valid?", "candidate_code_template": null, "options_json": ["All squares are polygons", "All polygons are squares", "Some polygons are not rectangles", "No rectangles are squares"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 71, "competency_code": "APT_LOGIC", "competency_name": "Logical Deductions & Series Patterns"}
165	102	183	\N	{"id": 183, "title": "Linear Age Relationship", "candidate_content": "A father is currently 3 times as old as his son. In 12 years, the father will be twice as old as his son. What is the son's current age?", "candidate_code_template": null, "options_json": ["10 years", "12 years", "14 years", "16 years"], "marks": 1.0, "difficulty": "Medium", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 70, "competency_code": "APT_NUM", "competency_name": "Numerical Reasoning & Arithmetic Basics"}
166	102	184	\N	{"id": 184, "title": "Analog Clock Hand Angle", "candidate_content": "What is the acute angle between the hour hand and minute hand of a clock at 3:30?", "candidate_code_template": null, "options_json": ["75\\u00b0", "70\\u00b0", "80\\u00b0", "90\\u00b0"], "marks": 1.0, "difficulty": "Medium", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 71, "competency_code": "APT_LOGIC", "competency_name": "Logical Deductions & Series Patterns"}
167	102	185	\N	{"id": 185, "title": "Iterative Loop Sum Deduction", "candidate_content": "Consider this algorithmic step:\\nlet sum = 0;\\nfor (i = 1 to 4) {\\n  sum = sum + (i * i);\\n}\\nWhat is the final value of sum?", "candidate_code_template": null, "options_json": ["20", "30", "14", "25"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 72, "competency_code": "APT_ALGO", "competency_name": "Flow Logic & Algorithmic Deductions"}
139	101	172	\N	{"id": 172, "title": "Ratio & Proportion Division", "candidate_content": "Two numbers are in the ratio 4 : 5. If their sum is 180, what is the value of the larger number?", "candidate_code_template": null, "options_json": ["80", "90", "100", "110"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 70, "competency_code": "APT_NUM", "competency_name": "Numerical Reasoning & Arithmetic Basics"}
140	101	173	\N	{"id": 173, "title": "Percentage Profit Calculation", "candidate_content": "An item purchased for $400 is sold for $500. What is the percentage profit gained on this transaction?", "candidate_code_template": null, "options_json": ["20%", "25%", "30%", "15%"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 70, "competency_code": "APT_NUM", "competency_name": "Numerical Reasoning & Arithmetic Basics"}
141	101	174	\N	{"id": 174, "title": "Arithmetic Progression Series", "candidate_content": "Identify the next number in the sequence: 3, 6, 12, 24, 48, ___", "candidate_code_template": null, "options_json": ["64", "72", "96", "84"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 71, "competency_code": "APT_LOGIC", "competency_name": "Logical Deductions & Series Patterns"}
142	101	175	\N	{"id": 175, "title": "Combined Work Rate", "candidate_content": "Worker A can finish a project in 6 days, while Worker B takes 12 days for the same project. Working together, how many days will they take to complete it?", "candidate_code_template": null, "options_json": ["4 days", "3 days", "5 days", "4.5 days"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 70, "competency_code": "APT_NUM", "competency_name": "Numerical Reasoning & Arithmetic Basics"}
143	101	176	\N	{"id": 176, "title": "Speed, Distance and Time", "candidate_content": "A train 150 meters long travels at a constant speed of 54 km/h. How many seconds does it take to cross a stationary signal pole?", "candidate_code_template": null, "options_json": ["10 seconds", "12 seconds", "15 seconds", "8 seconds"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 70, "competency_code": "APT_NUM", "competency_name": "Numerical Reasoning & Arithmetic Basics"}
144	101	177	\N	{"id": 177, "title": "Simple Interest Accrual", "candidate_content": "What is the Simple Interest on a principal amount of $5,000 invested at an annual rate of 10% for a period of 3 years?", "candidate_code_template": null, "options_json": ["$1,200", "$1,500", "$1,650", "$1,800"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 70, "competency_code": "APT_NUM", "competency_name": "Numerical Reasoning & Arithmetic Basics"}
145	101	178	\N	{"id": 178, "title": "Arithmetic Mean of Integer Set", "candidate_content": "Find the average (arithmetic mean) of the numbers: 12, 18, 24, 30, and 36.", "candidate_code_template": null, "options_json": ["22", "24", "26", "28"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 70, "competency_code": "APT_NUM", "competency_name": "Numerical Reasoning & Arithmetic Basics"}
146	101	179	\N	{"id": 179, "title": "Dice Roll Probability", "candidate_content": "When two standard six-sided dice are rolled simultaneously, what is the probability that the sum of the rolled numbers is exactly 7?", "candidate_code_template": null, "options_json": ["1/6", "1/12", "5/36", "7/36"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 71, "competency_code": "APT_LOGIC", "competency_name": "Logical Deductions & Series Patterns"}
154	102	172	\N	{"id": 172, "title": "Ratio & Proportion Division", "candidate_content": "Two numbers are in the ratio 4 : 5. If their sum is 180, what is the value of the larger number?", "candidate_code_template": null, "options_json": ["80", "90", "100", "110"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 70, "competency_code": "APT_NUM", "competency_name": "Numerical Reasoning & Arithmetic Basics"}
155	102	173	\N	{"id": 173, "title": "Percentage Profit Calculation", "candidate_content": "An item purchased for $400 is sold for $500. What is the percentage profit gained on this transaction?", "candidate_code_template": null, "options_json": ["20%", "25%", "30%", "15%"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 70, "competency_code": "APT_NUM", "competency_name": "Numerical Reasoning & Arithmetic Basics"}
156	102	174	\N	{"id": 174, "title": "Arithmetic Progression Series", "candidate_content": "Identify the next number in the sequence: 3, 6, 12, 24, 48, ___", "candidate_code_template": null, "options_json": ["64", "72", "96", "84"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 71, "competency_code": "APT_LOGIC", "competency_name": "Logical Deductions & Series Patterns"}
157	102	175	\N	{"id": 175, "title": "Combined Work Rate", "candidate_content": "Worker A can finish a project in 6 days, while Worker B takes 12 days for the same project. Working together, how many days will they take to complete it?", "candidate_code_template": null, "options_json": ["4 days", "3 days", "5 days", "4.5 days"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 70, "competency_code": "APT_NUM", "competency_name": "Numerical Reasoning & Arithmetic Basics"}
158	102	176	\N	{"id": 176, "title": "Speed, Distance and Time", "candidate_content": "A train 150 meters long travels at a constant speed of 54 km/h. How many seconds does it take to cross a stationary signal pole?", "candidate_code_template": null, "options_json": ["10 seconds", "12 seconds", "15 seconds", "8 seconds"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 70, "competency_code": "APT_NUM", "competency_name": "Numerical Reasoning & Arithmetic Basics"}
159	102	177	\N	{"id": 177, "title": "Simple Interest Accrual", "candidate_content": "What is the Simple Interest on a principal amount of $5,000 invested at an annual rate of 10% for a period of 3 years?", "candidate_code_template": null, "options_json": ["$1,200", "$1,500", "$1,650", "$1,800"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 70, "competency_code": "APT_NUM", "competency_name": "Numerical Reasoning & Arithmetic Basics"}
160	102	178	\N	{"id": 178, "title": "Arithmetic Mean of Integer Set", "candidate_content": "Find the average (arithmetic mean) of the numbers: 12, 18, 24, 30, and 36.", "candidate_code_template": null, "options_json": ["22", "24", "26", "28"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 70, "competency_code": "APT_NUM", "competency_name": "Numerical Reasoning & Arithmetic Basics"}
168	102	186	\N	{"id": 186, "title": "Conditional Discount Flow Deduction", "candidate_content": "A billing algorithm states: 'If total > 500 give 20% discount; else if total > 200 give 10% discount; else give 0% discount.' What is the final payable amount for a cart value of exactly $500?", "candidate_code_template": null, "options_json": ["$400", "$450", "$500", "$425"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 72, "competency_code": "APT_ALGO", "competency_name": "Flow Logic & Algorithmic Deductions"}
169	104	172	\N	{"id": 172, "title": "Ratio & Proportion Division", "candidate_content": "Two numbers are in the ratio 4 : 5. If their sum is 180, what is the value of the larger number?", "candidate_code_template": null, "options_json": ["80", "90", "100", "110"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 70, "competency_code": "APT_NUM", "competency_name": "Numerical Reasoning & Arithmetic Basics"}
170	104	173	\N	{"id": 173, "title": "Percentage Profit Calculation", "candidate_content": "An item purchased for $400 is sold for $500. What is the percentage profit gained on this transaction?", "candidate_code_template": null, "options_json": ["20%", "25%", "30%", "15%"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 70, "competency_code": "APT_NUM", "competency_name": "Numerical Reasoning & Arithmetic Basics"}
171	104	174	\N	{"id": 174, "title": "Arithmetic Progression Series", "candidate_content": "Identify the next number in the sequence: 3, 6, 12, 24, 48, ___", "candidate_code_template": null, "options_json": ["64", "72", "96", "84"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 71, "competency_code": "APT_LOGIC", "competency_name": "Logical Deductions & Series Patterns"}
172	104	175	\N	{"id": 175, "title": "Combined Work Rate", "candidate_content": "Worker A can finish a project in 6 days, while Worker B takes 12 days for the same project. Working together, how many days will they take to complete it?", "candidate_code_template": null, "options_json": ["4 days", "3 days", "5 days", "4.5 days"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 70, "competency_code": "APT_NUM", "competency_name": "Numerical Reasoning & Arithmetic Basics"}
173	104	176	\N	{"id": 176, "title": "Speed, Distance and Time", "candidate_content": "A train 150 meters long travels at a constant speed of 54 km/h. How many seconds does it take to cross a stationary signal pole?", "candidate_code_template": null, "options_json": ["10 seconds", "12 seconds", "15 seconds", "8 seconds"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 70, "competency_code": "APT_NUM", "competency_name": "Numerical Reasoning & Arithmetic Basics"}
174	104	177	\N	{"id": 177, "title": "Simple Interest Accrual", "candidate_content": "What is the Simple Interest on a principal amount of $5,000 invested at an annual rate of 10% for a period of 3 years?", "candidate_code_template": null, "options_json": ["$1,200", "$1,500", "$1,650", "$1,800"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 70, "competency_code": "APT_NUM", "competency_name": "Numerical Reasoning & Arithmetic Basics"}
175	104	178	\N	{"id": 178, "title": "Arithmetic Mean of Integer Set", "candidate_content": "Find the average (arithmetic mean) of the numbers: 12, 18, 24, 30, and 36.", "candidate_code_template": null, "options_json": ["22", "24", "26", "28"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 70, "competency_code": "APT_NUM", "competency_name": "Numerical Reasoning & Arithmetic Basics"}
176	104	179	\N	{"id": 179, "title": "Dice Roll Probability", "candidate_content": "When two standard six-sided dice are rolled simultaneously, what is the probability that the sum of the rolled numbers is exactly 7?", "candidate_code_template": null, "options_json": ["1/6", "1/12", "5/36", "7/36"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 71, "competency_code": "APT_LOGIC", "competency_name": "Logical Deductions & Series Patterns"}
177	104	180	\N	{"id": 180, "title": "Pattern Coding & Transposition", "candidate_content": "If the word 'SYSTEM' is encoded as 'SYSMET' by reversing the second half of the word, how will 'FORMAT' be encoded under the exact same rule?", "candidate_code_template": null, "options_json": ["FORTAM", "FORATM", "TAMFOR", "FORTMA"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 71, "competency_code": "APT_LOGIC", "competency_name": "Logical Deductions & Series Patterns"}
178	104	181	\N	{"id": 181, "title": "Family Tree Logical Deduction", "candidate_content": "Pointing to a photograph, a woman says: 'He is the only son of the mother of my only brother.' How is the man in the photograph related to the woman?", "candidate_code_template": null, "options_json": ["Brother", "Father", "Uncle", "Nephew"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 71, "competency_code": "APT_LOGIC", "competency_name": "Logical Deductions & Series Patterns"}
179	104	182	\N	{"id": 182, "title": "Categorical Syllogism", "candidate_content": "Premises:\\n1. All squares are rectangles.\\n2. All rectangles are polygons.\\nConclusion: Which statement is strictly valid?", "candidate_code_template": null, "options_json": ["All squares are polygons", "All polygons are squares", "Some polygons are not rectangles", "No rectangles are squares"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 71, "competency_code": "APT_LOGIC", "competency_name": "Logical Deductions & Series Patterns"}
180	104	183	\N	{"id": 183, "title": "Linear Age Relationship", "candidate_content": "A father is currently 3 times as old as his son. In 12 years, the father will be twice as old as his son. What is the son's current age?", "candidate_code_template": null, "options_json": ["10 years", "12 years", "14 years", "16 years"], "marks": 1.0, "difficulty": "Medium", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 70, "competency_code": "APT_NUM", "competency_name": "Numerical Reasoning & Arithmetic Basics"}
181	104	184	\N	{"id": 184, "title": "Analog Clock Hand Angle", "candidate_content": "What is the acute angle between the hour hand and minute hand of a clock at 3:30?", "candidate_code_template": null, "options_json": ["75\\u00b0", "70\\u00b0", "80\\u00b0", "90\\u00b0"], "marks": 1.0, "difficulty": "Medium", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 71, "competency_code": "APT_LOGIC", "competency_name": "Logical Deductions & Series Patterns"}
182	104	185	\N	{"id": 185, "title": "Iterative Loop Sum Deduction", "candidate_content": "Consider this algorithmic step:\\nlet sum = 0;\\nfor (i = 1 to 4) {\\n  sum = sum + (i * i);\\n}\\nWhat is the final value of sum?", "candidate_code_template": null, "options_json": ["20", "30", "14", "25"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 72, "competency_code": "APT_ALGO", "competency_name": "Flow Logic & Algorithmic Deductions"}
183	104	186	\N	{"id": 186, "title": "Conditional Discount Flow Deduction", "candidate_content": "A billing algorithm states: 'If total > 500 give 20% discount; else if total > 200 give 10% discount; else give 0% discount.' What is the final payable amount for a cart value of exactly $500?", "candidate_code_template": null, "options_json": ["$400", "$450", "$500", "$425"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 72, "competency_code": "APT_ALGO", "competency_name": "Flow Logic & Algorithmic Deductions"}
268	111	181	\N	{"id": 181, "title": "Family Tree Logical Deduction", "candidate_content": "Pointing to a photograph, a woman says: 'He is the only son of the mother of my only brother.' How is the man in the photograph related to the woman?", "candidate_code_template": null, "options_json": ["Brother", "Father", "Uncle", "Nephew"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 71, "competency_code": "APT_LOGIC", "competency_name": "Logical Deductions & Series Patterns"}
269	111	182	\N	{"id": 182, "title": "Categorical Syllogism", "candidate_content": "Premises:\\n1. All squares are rectangles.\\n2. All rectangles are polygons.\\nConclusion: Which statement is strictly valid?", "candidate_code_template": null, "options_json": ["All squares are polygons", "All polygons are squares", "Some polygons are not rectangles", "No rectangles are squares"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 71, "competency_code": "APT_LOGIC", "competency_name": "Logical Deductions & Series Patterns"}
270	111	183	\N	{"id": 183, "title": "Linear Age Relationship", "candidate_content": "A father is currently 3 times as old as his son. In 12 years, the father will be twice as old as his son. What is the son's current age?", "candidate_code_template": null, "options_json": ["10 years", "12 years", "14 years", "16 years"], "marks": 1.0, "difficulty": "Medium", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 70, "competency_code": "APT_NUM", "competency_name": "Numerical Reasoning & Arithmetic Basics"}
271	111	184	\N	{"id": 184, "title": "Analog Clock Hand Angle", "candidate_content": "What is the acute angle between the hour hand and minute hand of a clock at 3:30?", "candidate_code_template": null, "options_json": ["75\\u00b0", "70\\u00b0", "80\\u00b0", "90\\u00b0"], "marks": 1.0, "difficulty": "Medium", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 71, "competency_code": "APT_LOGIC", "competency_name": "Logical Deductions & Series Patterns"}
272	111	185	\N	{"id": 185, "title": "Iterative Loop Sum Deduction", "candidate_content": "Consider this algorithmic step:\\nlet sum = 0;\\nfor (i = 1 to 4) {\\n  sum = sum + (i * i);\\n}\\nWhat is the final value of sum?", "candidate_code_template": null, "options_json": ["20", "30", "14", "25"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 72, "competency_code": "APT_ALGO", "competency_name": "Flow Logic & Algorithmic Deductions"}
273	111	186	\N	{"id": 186, "title": "Conditional Discount Flow Deduction", "candidate_content": "A billing algorithm states: 'If total > 500 give 20% discount; else if total > 200 give 10% discount; else give 0% discount.' What is the final payable amount for a cart value of exactly $500?", "candidate_code_template": null, "options_json": ["$400", "$450", "$500", "$425"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 72, "competency_code": "APT_ALGO", "competency_name": "Flow Logic & Algorithmic Deductions"}
305	114	173	\N	{"id": 173, "title": "Percentage Profit Calculation", "candidate_content": "An item purchased for $400 is sold for $500. What is the percentage profit gained on this transaction?", "candidate_code_template": null, "options_json": ["20%", "25%", "30%", "15%"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 70, "competency_code": "APT_NUM", "competency_name": "Numerical Reasoning & Arithmetic Basics"}
306	114	174	\N	{"id": 174, "title": "Arithmetic Progression Series", "candidate_content": "Identify the next number in the sequence: 3, 6, 12, 24, 48, ___", "candidate_code_template": null, "options_json": ["64", "72", "96", "84"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 71, "competency_code": "APT_LOGIC", "competency_name": "Logical Deductions & Series Patterns"}
307	114	175	\N	{"id": 175, "title": "Combined Work Rate", "candidate_content": "Worker A can finish a project in 6 days, while Worker B takes 12 days for the same project. Working together, how many days will they take to complete it?", "candidate_code_template": null, "options_json": ["4 days", "3 days", "5 days", "4.5 days"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 70, "competency_code": "APT_NUM", "competency_name": "Numerical Reasoning & Arithmetic Basics"}
308	114	176	\N	{"id": 176, "title": "Speed, Distance and Time", "candidate_content": "A train 150 meters long travels at a constant speed of 54 km/h. How many seconds does it take to cross a stationary signal pole?", "candidate_code_template": null, "options_json": ["10 seconds", "12 seconds", "15 seconds", "8 seconds"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 70, "competency_code": "APT_NUM", "competency_name": "Numerical Reasoning & Arithmetic Basics"}
309	114	177	\N	{"id": 177, "title": "Simple Interest Accrual", "candidate_content": "What is the Simple Interest on a principal amount of $5,000 invested at an annual rate of 10% for a period of 3 years?", "candidate_code_template": null, "options_json": ["$1,200", "$1,500", "$1,650", "$1,800"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 70, "competency_code": "APT_NUM", "competency_name": "Numerical Reasoning & Arithmetic Basics"}
310	114	178	\N	{"id": 178, "title": "Arithmetic Mean of Integer Set", "candidate_content": "Find the average (arithmetic mean) of the numbers: 12, 18, 24, 30, and 36.", "candidate_code_template": null, "options_json": ["22", "24", "26", "28"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 70, "competency_code": "APT_NUM", "competency_name": "Numerical Reasoning & Arithmetic Basics"}
311	114	179	\N	{"id": 179, "title": "Dice Roll Probability", "candidate_content": "When two standard six-sided dice are rolled simultaneously, what is the probability that the sum of the rolled numbers is exactly 7?", "candidate_code_template": null, "options_json": ["1/6", "1/12", "5/36", "7/36"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 71, "competency_code": "APT_LOGIC", "competency_name": "Logical Deductions & Series Patterns"}
312	114	180	\N	{"id": 180, "title": "Pattern Coding & Transposition", "candidate_content": "If the word 'SYSTEM' is encoded as 'SYSMET' by reversing the second half of the word, how will 'FORMAT' be encoded under the exact same rule?", "candidate_code_template": null, "options_json": ["FORTAM", "FORATM", "TAMFOR", "FORTMA"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 71, "competency_code": "APT_LOGIC", "competency_name": "Logical Deductions & Series Patterns"}
274	112	172	\N	{"id": 172, "title": "Ratio & Proportion Division", "candidate_content": "Two numbers are in the ratio 4 : 5. If their sum is 180, what is the value of the larger number?", "candidate_code_template": null, "options_json": ["80", "90", "100", "110"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 70, "competency_code": "APT_NUM", "competency_name": "Numerical Reasoning & Arithmetic Basics"}
275	112	173	\N	{"id": 173, "title": "Percentage Profit Calculation", "candidate_content": "An item purchased for $400 is sold for $500. What is the percentage profit gained on this transaction?", "candidate_code_template": null, "options_json": ["20%", "25%", "30%", "15%"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 70, "competency_code": "APT_NUM", "competency_name": "Numerical Reasoning & Arithmetic Basics"}
276	112	174	\N	{"id": 174, "title": "Arithmetic Progression Series", "candidate_content": "Identify the next number in the sequence: 3, 6, 12, 24, 48, ___", "candidate_code_template": null, "options_json": ["64", "72", "96", "84"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 71, "competency_code": "APT_LOGIC", "competency_name": "Logical Deductions & Series Patterns"}
277	112	175	\N	{"id": 175, "title": "Combined Work Rate", "candidate_content": "Worker A can finish a project in 6 days, while Worker B takes 12 days for the same project. Working together, how many days will they take to complete it?", "candidate_code_template": null, "options_json": ["4 days", "3 days", "5 days", "4.5 days"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 70, "competency_code": "APT_NUM", "competency_name": "Numerical Reasoning & Arithmetic Basics"}
278	112	176	\N	{"id": 176, "title": "Speed, Distance and Time", "candidate_content": "A train 150 meters long travels at a constant speed of 54 km/h. How many seconds does it take to cross a stationary signal pole?", "candidate_code_template": null, "options_json": ["10 seconds", "12 seconds", "15 seconds", "8 seconds"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 70, "competency_code": "APT_NUM", "competency_name": "Numerical Reasoning & Arithmetic Basics"}
279	112	177	\N	{"id": 177, "title": "Simple Interest Accrual", "candidate_content": "What is the Simple Interest on a principal amount of $5,000 invested at an annual rate of 10% for a period of 3 years?", "candidate_code_template": null, "options_json": ["$1,200", "$1,500", "$1,650", "$1,800"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 70, "competency_code": "APT_NUM", "competency_name": "Numerical Reasoning & Arithmetic Basics"}
280	112	178	\N	{"id": 178, "title": "Arithmetic Mean of Integer Set", "candidate_content": "Find the average (arithmetic mean) of the numbers: 12, 18, 24, 30, and 36.", "candidate_code_template": null, "options_json": ["22", "24", "26", "28"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 70, "competency_code": "APT_NUM", "competency_name": "Numerical Reasoning & Arithmetic Basics"}
281	112	179	\N	{"id": 179, "title": "Dice Roll Probability", "candidate_content": "When two standard six-sided dice are rolled simultaneously, what is the probability that the sum of the rolled numbers is exactly 7?", "candidate_code_template": null, "options_json": ["1/6", "1/12", "5/36", "7/36"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 71, "competency_code": "APT_LOGIC", "competency_name": "Logical Deductions & Series Patterns"}
282	112	180	\N	{"id": 180, "title": "Pattern Coding & Transposition", "candidate_content": "If the word 'SYSTEM' is encoded as 'SYSMET' by reversing the second half of the word, how will 'FORMAT' be encoded under the exact same rule?", "candidate_code_template": null, "options_json": ["FORTAM", "FORATM", "TAMFOR", "FORTMA"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 71, "competency_code": "APT_LOGIC", "competency_name": "Logical Deductions & Series Patterns"}
283	112	181	\N	{"id": 181, "title": "Family Tree Logical Deduction", "candidate_content": "Pointing to a photograph, a woman says: 'He is the only son of the mother of my only brother.' How is the man in the photograph related to the woman?", "candidate_code_template": null, "options_json": ["Brother", "Father", "Uncle", "Nephew"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 71, "competency_code": "APT_LOGIC", "competency_name": "Logical Deductions & Series Patterns"}
284	112	182	\N	{"id": 182, "title": "Categorical Syllogism", "candidate_content": "Premises:\\n1. All squares are rectangles.\\n2. All rectangles are polygons.\\nConclusion: Which statement is strictly valid?", "candidate_code_template": null, "options_json": ["All squares are polygons", "All polygons are squares", "Some polygons are not rectangles", "No rectangles are squares"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 71, "competency_code": "APT_LOGIC", "competency_name": "Logical Deductions & Series Patterns"}
285	112	183	\N	{"id": 183, "title": "Linear Age Relationship", "candidate_content": "A father is currently 3 times as old as his son. In 12 years, the father will be twice as old as his son. What is the son's current age?", "candidate_code_template": null, "options_json": ["10 years", "12 years", "14 years", "16 years"], "marks": 1.0, "difficulty": "Medium", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 70, "competency_code": "APT_NUM", "competency_name": "Numerical Reasoning & Arithmetic Basics"}
286	112	184	\N	{"id": 184, "title": "Analog Clock Hand Angle", "candidate_content": "What is the acute angle between the hour hand and minute hand of a clock at 3:30?", "candidate_code_template": null, "options_json": ["75\\u00b0", "70\\u00b0", "80\\u00b0", "90\\u00b0"], "marks": 1.0, "difficulty": "Medium", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 71, "competency_code": "APT_LOGIC", "competency_name": "Logical Deductions & Series Patterns"}
287	112	185	\N	{"id": 185, "title": "Iterative Loop Sum Deduction", "candidate_content": "Consider this algorithmic step:\\nlet sum = 0;\\nfor (i = 1 to 4) {\\n  sum = sum + (i * i);\\n}\\nWhat is the final value of sum?", "candidate_code_template": null, "options_json": ["20", "30", "14", "25"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 72, "competency_code": "APT_ALGO", "competency_name": "Flow Logic & Algorithmic Deductions"}
288	112	186	\N	{"id": 186, "title": "Conditional Discount Flow Deduction", "candidate_content": "A billing algorithm states: 'If total > 500 give 20% discount; else if total > 200 give 10% discount; else give 0% discount.' What is the final payable amount for a cart value of exactly $500?", "candidate_code_template": null, "options_json": ["$400", "$450", "$500", "$425"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 72, "competency_code": "APT_ALGO", "competency_name": "Flow Logic & Algorithmic Deductions"}
289	113	172	\N	{"id": 172, "title": "Ratio & Proportion Division", "candidate_content": "Two numbers are in the ratio 4 : 5. If their sum is 180, what is the value of the larger number?", "candidate_code_template": null, "options_json": ["80", "90", "100", "110"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 70, "competency_code": "APT_NUM", "competency_name": "Numerical Reasoning & Arithmetic Basics"}
290	113	173	\N	{"id": 173, "title": "Percentage Profit Calculation", "candidate_content": "An item purchased for $400 is sold for $500. What is the percentage profit gained on this transaction?", "candidate_code_template": null, "options_json": ["20%", "25%", "30%", "15%"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 70, "competency_code": "APT_NUM", "competency_name": "Numerical Reasoning & Arithmetic Basics"}
291	113	174	\N	{"id": 174, "title": "Arithmetic Progression Series", "candidate_content": "Identify the next number in the sequence: 3, 6, 12, 24, 48, ___", "candidate_code_template": null, "options_json": ["64", "72", "96", "84"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 71, "competency_code": "APT_LOGIC", "competency_name": "Logical Deductions & Series Patterns"}
292	113	175	\N	{"id": 175, "title": "Combined Work Rate", "candidate_content": "Worker A can finish a project in 6 days, while Worker B takes 12 days for the same project. Working together, how many days will they take to complete it?", "candidate_code_template": null, "options_json": ["4 days", "3 days", "5 days", "4.5 days"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 70, "competency_code": "APT_NUM", "competency_name": "Numerical Reasoning & Arithmetic Basics"}
293	113	176	\N	{"id": 176, "title": "Speed, Distance and Time", "candidate_content": "A train 150 meters long travels at a constant speed of 54 km/h. How many seconds does it take to cross a stationary signal pole?", "candidate_code_template": null, "options_json": ["10 seconds", "12 seconds", "15 seconds", "8 seconds"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 70, "competency_code": "APT_NUM", "competency_name": "Numerical Reasoning & Arithmetic Basics"}
294	113	177	\N	{"id": 177, "title": "Simple Interest Accrual", "candidate_content": "What is the Simple Interest on a principal amount of $5,000 invested at an annual rate of 10% for a period of 3 years?", "candidate_code_template": null, "options_json": ["$1,200", "$1,500", "$1,650", "$1,800"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 70, "competency_code": "APT_NUM", "competency_name": "Numerical Reasoning & Arithmetic Basics"}
295	113	178	\N	{"id": 178, "title": "Arithmetic Mean of Integer Set", "candidate_content": "Find the average (arithmetic mean) of the numbers: 12, 18, 24, 30, and 36.", "candidate_code_template": null, "options_json": ["22", "24", "26", "28"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 70, "competency_code": "APT_NUM", "competency_name": "Numerical Reasoning & Arithmetic Basics"}
296	113	179	\N	{"id": 179, "title": "Dice Roll Probability", "candidate_content": "When two standard six-sided dice are rolled simultaneously, what is the probability that the sum of the rolled numbers is exactly 7?", "candidate_code_template": null, "options_json": ["1/6", "1/12", "5/36", "7/36"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 71, "competency_code": "APT_LOGIC", "competency_name": "Logical Deductions & Series Patterns"}
297	113	180	\N	{"id": 180, "title": "Pattern Coding & Transposition", "candidate_content": "If the word 'SYSTEM' is encoded as 'SYSMET' by reversing the second half of the word, how will 'FORMAT' be encoded under the exact same rule?", "candidate_code_template": null, "options_json": ["FORTAM", "FORATM", "TAMFOR", "FORTMA"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 71, "competency_code": "APT_LOGIC", "competency_name": "Logical Deductions & Series Patterns"}
298	113	181	\N	{"id": 181, "title": "Family Tree Logical Deduction", "candidate_content": "Pointing to a photograph, a woman says: 'He is the only son of the mother of my only brother.' How is the man in the photograph related to the woman?", "candidate_code_template": null, "options_json": ["Brother", "Father", "Uncle", "Nephew"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 71, "competency_code": "APT_LOGIC", "competency_name": "Logical Deductions & Series Patterns"}
299	113	182	\N	{"id": 182, "title": "Categorical Syllogism", "candidate_content": "Premises:\\n1. All squares are rectangles.\\n2. All rectangles are polygons.\\nConclusion: Which statement is strictly valid?", "candidate_code_template": null, "options_json": ["All squares are polygons", "All polygons are squares", "Some polygons are not rectangles", "No rectangles are squares"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 71, "competency_code": "APT_LOGIC", "competency_name": "Logical Deductions & Series Patterns"}
300	113	183	\N	{"id": 183, "title": "Linear Age Relationship", "candidate_content": "A father is currently 3 times as old as his son. In 12 years, the father will be twice as old as his son. What is the son's current age?", "candidate_code_template": null, "options_json": ["10 years", "12 years", "14 years", "16 years"], "marks": 1.0, "difficulty": "Medium", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 70, "competency_code": "APT_NUM", "competency_name": "Numerical Reasoning & Arithmetic Basics"}
301	113	184	\N	{"id": 184, "title": "Analog Clock Hand Angle", "candidate_content": "What is the acute angle between the hour hand and minute hand of a clock at 3:30?", "candidate_code_template": null, "options_json": ["75\\u00b0", "70\\u00b0", "80\\u00b0", "90\\u00b0"], "marks": 1.0, "difficulty": "Medium", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 71, "competency_code": "APT_LOGIC", "competency_name": "Logical Deductions & Series Patterns"}
302	113	185	\N	{"id": 185, "title": "Iterative Loop Sum Deduction", "candidate_content": "Consider this algorithmic step:\\nlet sum = 0;\\nfor (i = 1 to 4) {\\n  sum = sum + (i * i);\\n}\\nWhat is the final value of sum?", "candidate_code_template": null, "options_json": ["20", "30", "14", "25"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 72, "competency_code": "APT_ALGO", "competency_name": "Flow Logic & Algorithmic Deductions"}
303	113	186	\N	{"id": 186, "title": "Conditional Discount Flow Deduction", "candidate_content": "A billing algorithm states: 'If total > 500 give 20% discount; else if total > 200 give 10% discount; else give 0% discount.' What is the final payable amount for a cart value of exactly $500?", "candidate_code_template": null, "options_json": ["$400", "$450", "$500", "$425"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 72, "competency_code": "APT_ALGO", "competency_name": "Flow Logic & Algorithmic Deductions"}
304	114	172	\N	{"id": 172, "title": "Ratio & Proportion Division", "candidate_content": "Two numbers are in the ratio 4 : 5. If their sum is 180, what is the value of the larger number?", "candidate_code_template": null, "options_json": ["80", "90", "100", "110"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 70, "competency_code": "APT_NUM", "competency_name": "Numerical Reasoning & Arithmetic Basics"}
313	114	181	\N	{"id": 181, "title": "Family Tree Logical Deduction", "candidate_content": "Pointing to a photograph, a woman says: 'He is the only son of the mother of my only brother.' How is the man in the photograph related to the woman?", "candidate_code_template": null, "options_json": ["Brother", "Father", "Uncle", "Nephew"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 71, "competency_code": "APT_LOGIC", "competency_name": "Logical Deductions & Series Patterns"}
314	114	182	\N	{"id": 182, "title": "Categorical Syllogism", "candidate_content": "Premises:\\n1. All squares are rectangles.\\n2. All rectangles are polygons.\\nConclusion: Which statement is strictly valid?", "candidate_code_template": null, "options_json": ["All squares are polygons", "All polygons are squares", "Some polygons are not rectangles", "No rectangles are squares"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 71, "competency_code": "APT_LOGIC", "competency_name": "Logical Deductions & Series Patterns"}
315	114	183	\N	{"id": 183, "title": "Linear Age Relationship", "candidate_content": "A father is currently 3 times as old as his son. In 12 years, the father will be twice as old as his son. What is the son's current age?", "candidate_code_template": null, "options_json": ["10 years", "12 years", "14 years", "16 years"], "marks": 1.0, "difficulty": "Medium", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 70, "competency_code": "APT_NUM", "competency_name": "Numerical Reasoning & Arithmetic Basics"}
316	114	184	\N	{"id": 184, "title": "Analog Clock Hand Angle", "candidate_content": "What is the acute angle between the hour hand and minute hand of a clock at 3:30?", "candidate_code_template": null, "options_json": ["75\\u00b0", "70\\u00b0", "80\\u00b0", "90\\u00b0"], "marks": 1.0, "difficulty": "Medium", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 71, "competency_code": "APT_LOGIC", "competency_name": "Logical Deductions & Series Patterns"}
317	114	185	\N	{"id": 185, "title": "Iterative Loop Sum Deduction", "candidate_content": "Consider this algorithmic step:\\nlet sum = 0;\\nfor (i = 1 to 4) {\\n  sum = sum + (i * i);\\n}\\nWhat is the final value of sum?", "candidate_code_template": null, "options_json": ["20", "30", "14", "25"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 72, "competency_code": "APT_ALGO", "competency_name": "Flow Logic & Algorithmic Deductions"}
318	114	186	\N	{"id": 186, "title": "Conditional Discount Flow Deduction", "candidate_content": "A billing algorithm states: 'If total > 500 give 20% discount; else if total > 200 give 10% discount; else give 0% discount.' What is the final payable amount for a cart value of exactly $500?", "candidate_code_template": null, "options_json": ["$400", "$450", "$500", "$425"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 72, "competency_code": "APT_ALGO", "competency_name": "Flow Logic & Algorithmic Deductions"}
334	117	1	1	{"id": 1, "title": "Bitwise Operations & Shift Logic", "candidate_content": "What is the result of evaluating `(16 >> 2) | (4 << 1)` in standard integer arithmetic?", "candidate_code_template": null, "options_json": [{"id": 1, "text": "12"}, {"id": 2, "text": "14"}, {"id": 3, "text": "8"}, {"id": 4, "text": "16"}], "marks": 2.0, "difficulty": "Easy", "time_limit_seconds": 60, "question_type": "mcq", "competency_id": 1, "competency_code": "LOGIC", "competency_name": "Logical & Analytical Reasoning"}
335	117	2	2	{"id": 2, "title": "Binary Tree Traversal Deductions", "candidate_content": "A complete binary tree has 15 nodes. How many leaf nodes does this tree possess?", "candidate_code_template": null, "options_json": [{"id": 1, "text": "7"}, {"id": 2, "text": "8"}, {"id": 3, "text": "9"}, {"id": 4, "text": "10"}], "marks": 2.0, "difficulty": "Medium", "time_limit_seconds": 60, "question_type": "mcq", "competency_id": 3, "competency_code": "COMP_THINK", "competency_name": "Computational Thinking"}
336	117	3	3	{"id": 3, "title": "Server Request Latency Calculation", "candidate_content": "A microservice cluster processes 1,200 requests per second across 4 parallel worker instances. Each instance handles requests synchronously at an average duration of 2.5ms. What is the CPU utilization per instance?", "candidate_code_template": null, "options_json": [{"id": 1, "text": "50%"}, {"id": 2, "text": "75%"}, {"id": 3, "text": "80%"}, {"id": 4, "text": "90%"}], "marks": 2.0, "difficulty": "Medium", "time_limit_seconds": 60, "question_type": "mcq", "competency_id": 2, "competency_code": "QUANT", "competency_name": "Quantitative & Data Interpretation"}
337	119	1	1	{"id": 1, "title": "Bitwise Operations & Shift Logic", "candidate_content": "What is the result of evaluating `(16 >> 2) | (4 << 1)` in standard integer arithmetic?", "candidate_code_template": null, "options_json": [{"id": 1, "text": "12"}, {"id": 2, "text": "14"}, {"id": 3, "text": "8"}, {"id": 4, "text": "16"}], "marks": 2.0, "difficulty": "Easy", "time_limit_seconds": 60, "question_type": "mcq", "competency_id": 1, "competency_code": "LOGIC", "competency_name": "Logical & Analytical Reasoning"}
338	119	2	2	{"id": 2, "title": "Binary Tree Traversal Deductions", "candidate_content": "A complete binary tree has 15 nodes. How many leaf nodes does this tree possess?", "candidate_code_template": null, "options_json": [{"id": 1, "text": "7"}, {"id": 2, "text": "8"}, {"id": 3, "text": "9"}, {"id": 4, "text": "10"}], "marks": 2.0, "difficulty": "Medium", "time_limit_seconds": 60, "question_type": "mcq", "competency_id": 3, "competency_code": "COMP_THINK", "competency_name": "Computational Thinking"}
339	119	3	3	{"id": 3, "title": "Server Request Latency Calculation", "candidate_content": "A microservice cluster processes 1,200 requests per second across 4 parallel worker instances. Each instance handles requests synchronously at an average duration of 2.5ms. What is the CPU utilization per instance?", "candidate_code_template": null, "options_json": [{"id": 1, "text": "50%"}, {"id": 2, "text": "75%"}, {"id": 3, "text": "80%"}, {"id": 4, "text": "90%"}], "marks": 2.0, "difficulty": "Medium", "time_limit_seconds": 60, "question_type": "mcq", "competency_id": 2, "competency_code": "QUANT", "competency_name": "Quantitative & Data Interpretation"}
340	121	1	1	{"id": 1, "title": "Bitwise Operations & Shift Logic", "candidate_content": "What is the result of evaluating `(16 >> 2) | (4 << 1)` in standard integer arithmetic?", "candidate_code_template": null, "options_json": [{"id": 1, "text": "12"}, {"id": 2, "text": "14"}, {"id": 3, "text": "8"}, {"id": 4, "text": "16"}], "marks": 2.0, "difficulty": "Easy", "time_limit_seconds": 60, "question_type": "mcq", "competency_id": 1, "competency_code": "LOGIC", "competency_name": "Logical & Analytical Reasoning"}
341	121	2	2	{"id": 2, "title": "Binary Tree Traversal Deductions", "candidate_content": "A complete binary tree has 15 nodes. How many leaf nodes does this tree possess?", "candidate_code_template": null, "options_json": [{"id": 1, "text": "7"}, {"id": 2, "text": "8"}, {"id": 3, "text": "9"}, {"id": 4, "text": "10"}], "marks": 2.0, "difficulty": "Medium", "time_limit_seconds": 60, "question_type": "mcq", "competency_id": 3, "competency_code": "COMP_THINK", "competency_name": "Computational Thinking"}
342	121	3	3	{"id": 3, "title": "Server Request Latency Calculation", "candidate_content": "A microservice cluster processes 1,200 requests per second across 4 parallel worker instances. Each instance handles requests synchronously at an average duration of 2.5ms. What is the CPU utilization per instance?", "candidate_code_template": null, "options_json": [{"id": 1, "text": "50%"}, {"id": 2, "text": "75%"}, {"id": 3, "text": "80%"}, {"id": 4, "text": "90%"}], "marks": 2.0, "difficulty": "Medium", "time_limit_seconds": 60, "question_type": "mcq", "competency_id": 2, "competency_code": "QUANT", "competency_name": "Quantitative & Data Interpretation"}
358	125	1	1	{"id": 1, "title": "Bitwise Operations & Shift Logic", "candidate_content": "What is the result of evaluating `(16 >> 2) | (4 << 1)` in standard integer arithmetic?", "candidate_code_template": null, "options_json": [{"id": 1, "text": "12"}, {"id": 2, "text": "14"}, {"id": 3, "text": "8"}, {"id": 4, "text": "16"}], "marks": 2.0, "difficulty": "Easy", "time_limit_seconds": 60, "question_type": "mcq", "competency_id": 1, "competency_code": "LOGIC", "competency_name": "Logical & Analytical Reasoning"}
359	125	2	2	{"id": 2, "title": "Binary Tree Traversal Deductions", "candidate_content": "A complete binary tree has 15 nodes. How many leaf nodes does this tree possess?", "candidate_code_template": null, "options_json": [{"id": 1, "text": "7"}, {"id": 2, "text": "8"}, {"id": 3, "text": "9"}, {"id": 4, "text": "10"}], "marks": 2.0, "difficulty": "Medium", "time_limit_seconds": 60, "question_type": "mcq", "competency_id": 3, "competency_code": "COMP_THINK", "competency_name": "Computational Thinking"}
360	125	3	3	{"id": 3, "title": "Server Request Latency Calculation", "candidate_content": "A microservice cluster processes 1,200 requests per second across 4 parallel worker instances. Each instance handles requests synchronously at an average duration of 2.5ms. What is the CPU utilization per instance?", "candidate_code_template": null, "options_json": [{"id": 1, "text": "50%"}, {"id": 2, "text": "75%"}, {"id": 3, "text": "80%"}, {"id": 4, "text": "90%"}], "marks": 2.0, "difficulty": "Medium", "time_limit_seconds": 60, "question_type": "mcq", "competency_id": 2, "competency_code": "QUANT", "competency_name": "Quantitative & Data Interpretation"}
361	127	64	64	{"id": 64, "title": "Q1.1: Revenue Trend Analysis", "candidate_content": "A retail company reported $120,000 in Q1 revenue, which grew by 25% in Q2, and then dropped by 10% in Q3. What is the net revenue for Q3?", "candidate_code_template": "", "options_json": [{"id": "A", "text": "$135,000"}, {"id": "B", "text": "$140,000"}, {"id": "C", "text": "$145,000"}, {"id": "D", "text": "$150,000"}], "marks": 1.0, "difficulty": "Medium", "time_limit_seconds": 60, "question_type": "mcq", "competency_id": 30, "competency_code": "ANALYTICAL_PS", "competency_name": "Analytical & Numerical Problem Solving"}
362	127	65	65	{"id": 65, "title": "Q1.2: Data Quality & Missing Value Strategy", "candidate_content": "When analyzing a customer dataset of 100,000 records, you discover that 15% of 'Customer Age' entries are null. Which approach is statistically sound for descriptive profiling before building a model?", "candidate_code_template": "", "options_json": [{"id": "A", "text": "Immediately delete all 15,000 rows containing nulls."}, {"id": "B", "text": "Analyze missingness pattern (MCAR/MAR), impute using median/mode by customer segment, or analyze complete cases separately."}, {"id": "C", "text": "Replace all nulls with 0."}, {"id": "D", "text": "Replace all nulls with 100."}], "marks": 1.0, "difficulty": "Medium", "time_limit_seconds": 60, "question_type": "mcq", "competency_id": 31, "competency_code": "DATA_INTERPRETATION", "competency_name": "Data Interpretation & Trends"}
363	127	66	66	{"id": 66, "title": "Q1.3: Noesys Information Security Policy & Data Protection", "candidate_content": "According to Information Security Policy, a candidate data file containing Personally Identifiable Information (PII) like employee SSNs and salaries must be exported for external presentation. What is the compliant procedure?", "candidate_code_template": "", "options_json": [{"id": "A", "text": "Email the unencrypted file as an attachment to external personal email."}, {"id": "B", "text": "Anonymize/mask PII fields, encrypt the dataset at rest/transit, and share via authorized secure channels with access controls."}, {"id": "C", "text": "Store the unencrypted file on a public cloud drive."}, {"id": "D", "text": "Print the raw spreadsheet and leave it in the conference room."}], "marks": 1.0, "difficulty": "Medium", "time_limit_seconds": 60, "question_type": "mcq", "competency_id": 32, "competency_code": "INFO_SEC", "competency_name": "Information Security & Data Asset Protection"}
364	127	67	67	{"id": 67, "title": "Q1.4: Stakeholder Business Communication", "candidate_content": "Draft a 150-200 word email reply to a business manager explaining why Q3 sales dropped by 12% due to supply chain delays, and outline 2 data-backed recommendations.", "candidate_code_template": "Dear Manager,\\n\\nI have completed the Q3 sales data analysis...", "options_json": [], "marks": 1.0, "difficulty": "Medium", "time_limit_seconds": 60, "question_type": "text_response", "competency_id": 39, "competency_code": "BUSINESS_COMM", "competency_name": "Stakeholder Communication & Technical Writing"}
365	127	68	68	{"id": 68, "title": "Q1.3: Information Security Policy & Data Protection", "candidate_content": "According to Information Security Policy, a candidate data file containing Personally Identifiable Information (PII) like employee SSNs and salaries must be exported for external presentation. What is the compliant procedure?", "candidate_code_template": "", "options_json": [{"id": "A", "text": "Email the unencrypted file as an attachment to external personal email."}, {"id": "B", "text": "Anonymize/mask PII fields, encrypt the dataset at rest/transit, and share via authorized secure channels with access controls."}, {"id": "C", "text": "Store the unencrypted file on a public cloud drive."}, {"id": "D", "text": "Print the raw spreadsheet and leave it in the conference room."}], "marks": 1.0, "difficulty": "Medium", "time_limit_seconds": 60, "question_type": "mcq", "competency_id": 32, "competency_code": "INFO_SEC", "competency_name": "Information Security & Data Asset Protection"}
366	127	69	69	{"id": 69, "title": "Regional Sales Growth Rate Analysis", "candidate_content": "Region A sales grew from $120,000 in Q1 to $156,000 in Q2. Region B sales grew from $80,000 to $108,000 in the same period. Which region achieved a higher percentage growth rate?", "candidate_code_template": null, "options_json": [{"key": "A", "text": "Region A achieved higher growth (30% vs 35%)"}, {"key": "B", "text": "Region B achieved higher growth (35% vs 30%)"}, {"key": "C", "text": "Both regions achieved equal growth (30%)"}, {"key": "D", "text": "Region A achieved higher growth (36% vs 28%)"}], "marks": 10.0, "difficulty": "Medium", "time_limit_seconds": 180, "question_type": "mcq", "competency_id": 31, "competency_code": "DATA_INTERPRETATION", "competency_name": "Data Interpretation & Trends"}
420	136	184	\N	{"id": 184, "title": "Analog Clock Hand Angle", "candidate_content": "What is the acute angle between the hour hand and minute hand of a clock at 3:30?", "candidate_code_template": null, "options_json": ["75\\u00b0", "70\\u00b0", "80\\u00b0", "90\\u00b0"], "marks": 1.0, "difficulty": "Medium", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 71, "competency_code": "APT_LOGIC", "competency_name": "Logical Deductions & Series Patterns"}
367	127	70	70	{"id": 70, "title": "Customer Acquisition Trend & Outlier Detection", "candidate_content": "Monthly new signups for 6 consecutive months are: Jan: 1,200 | Feb: 1,250 | Mar: 1,220 | Apr: 4,800 | May: 1,300 | Jun: 1,310. What is the most likely analytical interpretation of the April data point?", "candidate_code_template": null, "options_json": [{"key": "A", "text": "Natural baseline growth trend that will double every quarter."}, {"key": "B", "text": "An anomaly/outlier caused by a marketing campaign or data entry error requiring isolation."}, {"key": "C", "text": "Standard seasonal variation expected in B2B SaaS analytics."}, {"key": "D", "text": "The median signup rate across the half-year period."}], "marks": 10.0, "difficulty": "Medium", "time_limit_seconds": 180, "question_type": "mcq", "competency_id": 31, "competency_code": "DATA_INTERPRETATION", "competency_name": "Data Interpretation & Trends"}
368	127	71	71	{"id": 71, "title": "Product Margin & Revenue Weighted Average", "candidate_content": "Product X yields $50,000 revenue at a 40% gross margin. Product Y yields $150,000 revenue at a 20% gross margin. What is the overall revenue-weighted gross margin percentage of the portfolio?", "candidate_code_template": null, "options_json": [{"key": "A", "text": "30.0%"}, {"key": "B", "text": "25.0%"}, {"key": "C", "text": "27.5%"}, {"key": "D", "text": "22.5%"}], "marks": 10.0, "difficulty": "Hard", "time_limit_seconds": 240, "question_type": "mcq", "competency_id": 42, "competency_code": "ANALYTICAL_REASONING", "competency_name": "Analytical & Logical Reasoning"}
369	127	72	72	{"id": 72, "title": "Analytical Root Cause & Hypothesis Formulation", "candidate_content": "A digital commerce platform experiences a sudden 25% drop in weekly checkout conversion rate despite steady traffic volume. Detail your structured step-by-step analytical approach to isolate the root cause (e.g., funnel metrics, breakdown dimensions, technical vs marketing anomalies, and data verification steps).", "candidate_code_template": null, "options_json": [], "marks": 10.0, "difficulty": "Medium", "time_limit_seconds": 300, "question_type": "descriptive", "competency_id": 42, "competency_code": "ANALYTICAL_REASONING", "competency_name": "Analytical & Logical Reasoning"}
370	131	1	1	{"id": 1, "title": "Bitwise Operations & Shift Logic", "candidate_content": "What is the result of evaluating `(16 >> 2) | (4 << 1)` in standard integer arithmetic?", "candidate_code_template": null, "options_json": [{"id": 1, "text": "12"}, {"id": 2, "text": "14"}, {"id": 3, "text": "8"}, {"id": 4, "text": "16"}], "marks": 2.0, "difficulty": "Easy", "time_limit_seconds": 60, "question_type": "mcq", "competency_id": 1, "competency_code": "LOGIC", "competency_name": "Logical & Analytical Reasoning"}
371	131	2	2	{"id": 2, "title": "Binary Tree Traversal Deductions", "candidate_content": "A complete binary tree has 15 nodes. How many leaf nodes does this tree possess?", "candidate_code_template": null, "options_json": [{"id": 1, "text": "7"}, {"id": 2, "text": "8"}, {"id": 3, "text": "9"}, {"id": 4, "text": "10"}], "marks": 2.0, "difficulty": "Medium", "time_limit_seconds": 60, "question_type": "mcq", "competency_id": 3, "competency_code": "COMP_THINK", "competency_name": "Computational Thinking"}
372	131	3	3	{"id": 3, "title": "Server Request Latency Calculation", "candidate_content": "A microservice cluster processes 1,200 requests per second across 4 parallel worker instances. Each instance handles requests synchronously at an average duration of 2.5ms. What is the CPU utilization per instance?", "candidate_code_template": null, "options_json": [{"id": 1, "text": "50%"}, {"id": 2, "text": "75%"}, {"id": 3, "text": "80%"}, {"id": 4, "text": "90%"}], "marks": 2.0, "difficulty": "Medium", "time_limit_seconds": 60, "question_type": "mcq", "competency_id": 2, "competency_code": "QUANT", "competency_name": "Quantitative & Data Interpretation"}
421	136	185	\N	{"id": 185, "title": "Iterative Loop Sum Deduction", "candidate_content": "Consider this algorithmic step:\\nlet sum = 0;\\nfor (i = 1 to 4) {\\n  sum = sum + (i * i);\\n}\\nWhat is the final value of sum?", "candidate_code_template": null, "options_json": ["20", "30", "14", "25"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 72, "competency_code": "APT_ALGO", "competency_name": "Flow Logic & Algorithmic Deductions"}
399	134	64	64	{"id": 64, "title": "Q1.1: Revenue Trend Analysis", "candidate_content": "A retail company reported $120,000 in Q1 revenue, which grew by 25% in Q2, and then dropped by 10% in Q3. What is the net revenue for Q3?", "candidate_code_template": "", "options_json": [{"id": "A", "text": "$135,000"}, {"id": "B", "text": "$140,000"}, {"id": "C", "text": "$145,000"}, {"id": "D", "text": "$150,000"}], "marks": 1.0, "difficulty": "Medium", "time_limit_seconds": 60, "question_type": "mcq", "competency_id": 30, "competency_code": "ANALYTICAL_PS", "competency_name": "Analytical & Numerical Problem Solving"}
400	134	65	65	{"id": 65, "title": "Q1.2: Data Quality & Missing Value Strategy", "candidate_content": "When analyzing a customer dataset of 100,000 records, you discover that 15% of 'Customer Age' entries are null. Which approach is statistically sound for descriptive profiling before building a model?", "candidate_code_template": "", "options_json": [{"id": "A", "text": "Immediately delete all 15,000 rows containing nulls."}, {"id": "B", "text": "Analyze missingness pattern (MCAR/MAR), impute using median/mode by customer segment, or analyze complete cases separately."}, {"id": "C", "text": "Replace all nulls with 0."}, {"id": "D", "text": "Replace all nulls with 100."}], "marks": 1.0, "difficulty": "Medium", "time_limit_seconds": 60, "question_type": "mcq", "competency_id": 31, "competency_code": "DATA_INTERPRETATION", "competency_name": "Data Interpretation & Trends"}
401	134	66	66	{"id": 66, "title": "Q1.3: Noesys Information Security Policy & Data Protection", "candidate_content": "According to Information Security Policy, a candidate data file containing Personally Identifiable Information (PII) like employee SSNs and salaries must be exported for external presentation. What is the compliant procedure?", "candidate_code_template": "", "options_json": [{"id": "A", "text": "Email the unencrypted file as an attachment to external personal email."}, {"id": "B", "text": "Anonymize/mask PII fields, encrypt the dataset at rest/transit, and share via authorized secure channels with access controls."}, {"id": "C", "text": "Store the unencrypted file on a public cloud drive."}, {"id": "D", "text": "Print the raw spreadsheet and leave it in the conference room."}], "marks": 1.0, "difficulty": "Medium", "time_limit_seconds": 60, "question_type": "mcq", "competency_id": 32, "competency_code": "INFO_SEC", "competency_name": "Information Security & Data Asset Protection"}
402	134	67	67	{"id": 67, "title": "Q1.4: Stakeholder Business Communication", "candidate_content": "Draft a 150-200 word email reply to a business manager explaining why Q3 sales dropped by 12% due to supply chain delays, and outline 2 data-backed recommendations.", "candidate_code_template": "Dear Manager,\\n\\nI have completed the Q3 sales data analysis...", "options_json": [], "marks": 1.0, "difficulty": "Medium", "time_limit_seconds": 60, "question_type": "text_response", "competency_id": 39, "competency_code": "BUSINESS_COMM", "competency_name": "Stakeholder Communication & Technical Writing"}
403	134	68	68	{"id": 68, "title": "Q1.3: Information Security Policy & Data Protection", "candidate_content": "According to Information Security Policy, a candidate data file containing Personally Identifiable Information (PII) like employee SSNs and salaries must be exported for external presentation. What is the compliant procedure?", "candidate_code_template": "", "options_json": [{"id": "A", "text": "Email the unencrypted file as an attachment to external personal email."}, {"id": "B", "text": "Anonymize/mask PII fields, encrypt the dataset at rest/transit, and share via authorized secure channels with access controls."}, {"id": "C", "text": "Store the unencrypted file on a public cloud drive."}, {"id": "D", "text": "Print the raw spreadsheet and leave it in the conference room."}], "marks": 1.0, "difficulty": "Medium", "time_limit_seconds": 60, "question_type": "mcq", "competency_id": 32, "competency_code": "INFO_SEC", "competency_name": "Information Security & Data Asset Protection"}
404	134	69	69	{"id": 69, "title": "Regional Sales Growth Rate Analysis", "candidate_content": "Region A sales grew from $120,000 in Q1 to $156,000 in Q2. Region B sales grew from $80,000 to $108,000 in the same period. Which region achieved a higher percentage growth rate?", "candidate_code_template": null, "options_json": [{"key": "A", "text": "Region A achieved higher growth (30% vs 35%)"}, {"key": "B", "text": "Region B achieved higher growth (35% vs 30%)"}, {"key": "C", "text": "Both regions achieved equal growth (30%)"}, {"key": "D", "text": "Region A achieved higher growth (36% vs 28%)"}], "marks": 10.0, "difficulty": "Medium", "time_limit_seconds": 180, "question_type": "mcq", "competency_id": 31, "competency_code": "DATA_INTERPRETATION", "competency_name": "Data Interpretation & Trends"}
405	134	70	70	{"id": 70, "title": "Customer Acquisition Trend & Outlier Detection", "candidate_content": "Monthly new signups for 6 consecutive months are: Jan: 1,200 | Feb: 1,250 | Mar: 1,220 | Apr: 4,800 | May: 1,300 | Jun: 1,310. What is the most likely analytical interpretation of the April data point?", "candidate_code_template": null, "options_json": [{"key": "A", "text": "Natural baseline growth trend that will double every quarter."}, {"key": "B", "text": "An anomaly/outlier caused by a marketing campaign or data entry error requiring isolation."}, {"key": "C", "text": "Standard seasonal variation expected in B2B SaaS analytics."}, {"key": "D", "text": "The median signup rate across the half-year period."}], "marks": 10.0, "difficulty": "Medium", "time_limit_seconds": 180, "question_type": "mcq", "competency_id": 31, "competency_code": "DATA_INTERPRETATION", "competency_name": "Data Interpretation & Trends"}
406	134	71	71	{"id": 71, "title": "Product Margin & Revenue Weighted Average", "candidate_content": "Product X yields $50,000 revenue at a 40% gross margin. Product Y yields $150,000 revenue at a 20% gross margin. What is the overall revenue-weighted gross margin percentage of the portfolio?", "candidate_code_template": null, "options_json": [{"key": "A", "text": "30.0%"}, {"key": "B", "text": "25.0%"}, {"key": "C", "text": "27.5%"}, {"key": "D", "text": "22.5%"}], "marks": 10.0, "difficulty": "Hard", "time_limit_seconds": 240, "question_type": "mcq", "competency_id": 42, "competency_code": "ANALYTICAL_REASONING", "competency_name": "Analytical & Logical Reasoning"}
407	134	72	72	{"id": 72, "title": "Analytical Root Cause & Hypothesis Formulation", "candidate_content": "A digital commerce platform experiences a sudden 25% drop in weekly checkout conversion rate despite steady traffic volume. Detail your structured step-by-step analytical approach to isolate the root cause (e.g., funnel metrics, breakdown dimensions, technical vs marketing anomalies, and data verification steps).", "candidate_code_template": null, "options_json": [], "marks": 10.0, "difficulty": "Medium", "time_limit_seconds": 300, "question_type": "descriptive", "competency_id": 42, "competency_code": "ANALYTICAL_REASONING", "competency_name": "Analytical & Logical Reasoning"}
408	136	172	\N	{"id": 172, "title": "Ratio & Proportion Division", "candidate_content": "Two numbers are in the ratio 4 : 5. If their sum is 180, what is the value of the larger number?", "candidate_code_template": null, "options_json": ["80", "90", "100", "110"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 70, "competency_code": "APT_NUM", "competency_name": "Numerical Reasoning & Arithmetic Basics"}
409	136	173	\N	{"id": 173, "title": "Percentage Profit Calculation", "candidate_content": "An item purchased for $400 is sold for $500. What is the percentage profit gained on this transaction?", "candidate_code_template": null, "options_json": ["20%", "25%", "30%", "15%"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 70, "competency_code": "APT_NUM", "competency_name": "Numerical Reasoning & Arithmetic Basics"}
410	136	174	\N	{"id": 174, "title": "Arithmetic Progression Series", "candidate_content": "Identify the next number in the sequence: 3, 6, 12, 24, 48, ___", "candidate_code_template": null, "options_json": ["64", "72", "96", "84"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 71, "competency_code": "APT_LOGIC", "competency_name": "Logical Deductions & Series Patterns"}
411	136	175	\N	{"id": 175, "title": "Combined Work Rate", "candidate_content": "Worker A can finish a project in 6 days, while Worker B takes 12 days for the same project. Working together, how many days will they take to complete it?", "candidate_code_template": null, "options_json": ["4 days", "3 days", "5 days", "4.5 days"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 70, "competency_code": "APT_NUM", "competency_name": "Numerical Reasoning & Arithmetic Basics"}
412	136	176	\N	{"id": 176, "title": "Speed, Distance and Time", "candidate_content": "A train 150 meters long travels at a constant speed of 54 km/h. How many seconds does it take to cross a stationary signal pole?", "candidate_code_template": null, "options_json": ["10 seconds", "12 seconds", "15 seconds", "8 seconds"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 70, "competency_code": "APT_NUM", "competency_name": "Numerical Reasoning & Arithmetic Basics"}
413	136	177	\N	{"id": 177, "title": "Simple Interest Accrual", "candidate_content": "What is the Simple Interest on a principal amount of $5,000 invested at an annual rate of 10% for a period of 3 years?", "candidate_code_template": null, "options_json": ["$1,200", "$1,500", "$1,650", "$1,800"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 70, "competency_code": "APT_NUM", "competency_name": "Numerical Reasoning & Arithmetic Basics"}
414	136	178	\N	{"id": 178, "title": "Arithmetic Mean of Integer Set", "candidate_content": "Find the average (arithmetic mean) of the numbers: 12, 18, 24, 30, and 36.", "candidate_code_template": null, "options_json": ["22", "24", "26", "28"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 70, "competency_code": "APT_NUM", "competency_name": "Numerical Reasoning & Arithmetic Basics"}
415	136	179	\N	{"id": 179, "title": "Dice Roll Probability", "candidate_content": "When two standard six-sided dice are rolled simultaneously, what is the probability that the sum of the rolled numbers is exactly 7?", "candidate_code_template": null, "options_json": ["1/6", "1/12", "5/36", "7/36"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 71, "competency_code": "APT_LOGIC", "competency_name": "Logical Deductions & Series Patterns"}
416	136	180	\N	{"id": 180, "title": "Pattern Coding & Transposition", "candidate_content": "If the word 'SYSTEM' is encoded as 'SYSMET' by reversing the second half of the word, how will 'FORMAT' be encoded under the exact same rule?", "candidate_code_template": null, "options_json": ["FORTAM", "FORATM", "TAMFOR", "FORTMA"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 71, "competency_code": "APT_LOGIC", "competency_name": "Logical Deductions & Series Patterns"}
417	136	181	\N	{"id": 181, "title": "Family Tree Logical Deduction", "candidate_content": "Pointing to a photograph, a woman says: 'He is the only son of the mother of my only brother.' How is the man in the photograph related to the woman?", "candidate_code_template": null, "options_json": ["Brother", "Father", "Uncle", "Nephew"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 71, "competency_code": "APT_LOGIC", "competency_name": "Logical Deductions & Series Patterns"}
418	136	182	\N	{"id": 182, "title": "Categorical Syllogism", "candidate_content": "Premises:\\n1. All squares are rectangles.\\n2. All rectangles are polygons.\\nConclusion: Which statement is strictly valid?", "candidate_code_template": null, "options_json": ["All squares are polygons", "All polygons are squares", "Some polygons are not rectangles", "No rectangles are squares"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 71, "competency_code": "APT_LOGIC", "competency_name": "Logical Deductions & Series Patterns"}
419	136	183	\N	{"id": 183, "title": "Linear Age Relationship", "candidate_content": "A father is currently 3 times as old as his son. In 12 years, the father will be twice as old as his son. What is the son's current age?", "candidate_code_template": null, "options_json": ["10 years", "12 years", "14 years", "16 years"], "marks": 1.0, "difficulty": "Medium", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 70, "competency_code": "APT_NUM", "competency_name": "Numerical Reasoning & Arithmetic Basics"}
422	136	186	\N	{"id": 186, "title": "Conditional Discount Flow Deduction", "candidate_content": "A billing algorithm states: 'If total > 500 give 20% discount; else if total > 200 give 10% discount; else give 0% discount.' What is the final payable amount for a cart value of exactly $500?", "candidate_code_template": null, "options_json": ["$400", "$450", "$500", "$425"], "marks": 1.0, "difficulty": "Easy", "time_limit_seconds": 90, "question_type": "MCQ", "competency_id": 72, "competency_code": "APT_ALGO", "competency_name": "Flow Logic & Algorithmic Deductions"}
441	169	1	1	{"id": 1, "title": "Bitwise Operations & Shift Logic", "candidate_content": "What is the result of evaluating `(16 >> 2) | (4 << 1)` in standard integer arithmetic?", "candidate_code_template": null, "options_json": [{"id": 1, "text": "12"}, {"id": 2, "text": "14"}, {"id": 3, "text": "8"}, {"id": 4, "text": "16"}], "marks": 2.0, "difficulty": "Easy", "time_limit_seconds": 60, "question_type": "mcq", "competency_id": 1, "competency_code": "LOGIC", "competency_name": "Logical & Analytical Reasoning"}
442	169	2	2	{"id": 2, "title": "Binary Tree Traversal Deductions", "candidate_content": "A complete binary tree has 15 nodes. How many leaf nodes does this tree possess?", "candidate_code_template": null, "options_json": [{"id": 1, "text": "7"}, {"id": 2, "text": "8"}, {"id": 3, "text": "9"}, {"id": 4, "text": "10"}], "marks": 2.0, "difficulty": "Medium", "time_limit_seconds": 60, "question_type": "mcq", "competency_id": 3, "competency_code": "COMP_THINK", "competency_name": "Computational Thinking"}
443	169	3	3	{"id": 3, "title": "Server Request Latency Calculation", "candidate_content": "A microservice cluster processes 1,200 requests per second across 4 parallel worker instances. Each instance handles requests synchronously at an average duration of 2.5ms. What is the CPU utilization per instance?", "candidate_code_template": null, "options_json": [{"id": 1, "text": "50%"}, {"id": 2, "text": "75%"}, {"id": 3, "text": "80%"}, {"id": 4, "text": "90%"}], "marks": 2.0, "difficulty": "Medium", "time_limit_seconds": 60, "question_type": "mcq", "competency_id": 2, "competency_code": "QUANT", "competency_name": "Quantitative & Data Interpretation"}
444	171	4	4	{"id": 4, "title": "Two Sum Target Indices", "candidate_content": "### Problem Statement\\nGiven an array of integers `nums` and an integer `target`, return the 0-based indices of the two numbers such that they add up to `target`.\\n\\nYou may assume that each input will have exactly one solution, and you may not use the same element twice.\\n\\n### Input Format\\n- Line 1: Space-separated integers representing `nums`\\n- Line 2: Single integer representing `target`\\n\\n### Output Format\\n- Space-separated indices in ascending order (e.g. `0 1`)\\n\\n### Constraints\\n- $2 \\\\le \\text{nums.length} \\\\le 10^5$\\n- $-10^9 \\\\le \\text{nums}[i] \\\\le 10^9$\\n- Time Limit: 2.0 seconds\\n", "candidate_code_template": "import sys\\n\\ndef solve():\\n    lines = sys.stdin.read().splitlines()\\n    if not lines:\\n        return\\n    nums = list(map(int, lines[0].split()))\\n    target = int(lines[1].strip())\\n    \\n    # Write your solution here\\n    seen = {}\\n    for i, num in enumerate(nums):\\n        complement = target - num\\n        if complement in seen:\\n            print(f\\"{seen[complement]} {i}\\")\\n            return\\n        seen[num] = i\\n\\nif __name__ == '__main__':\\n    solve()\\n", "options_json": [], "marks": 20.0, "difficulty": "Medium", "time_limit_seconds": 3, "question_type": "coding", "competency_id": 4, "competency_code": "DSA", "competency_name": "Data Structures & Algorithms"}
445	171	5	5	{"id": 5, "title": "Valid Anagram Checker", "candidate_content": "### Problem Statement\\nGiven two strings `s` and `t`, return `true` if `t` is an anagram of `s`, and `false` otherwise.\\nAn anagram is a word or phrase formed by rearranging the letters of a different word or phrase, using all the original letters exactly once.\\n\\n### Input Format\\n- Line 1: String `s`\\n- Line 2: String `t`\\n\\n### Output Format\\n- Print `true` or `false` (lowercase).\\n", "candidate_code_template": "import sys\\n\\ndef solve():\\n    lines = sys.stdin.read().splitlines()\\n    if len(lines) < 2:\\n        return\\n    s = lines[0].strip()\\n    t = lines[1].strip()\\n    \\n    # Write your solution here\\n    if sorted(s) == sorted(t):\\n        print(\\"true\\")\\n    else:\\n        print(\\"false\\")\\n\\nif __name__ == '__main__':\\n    solve()\\n", "options_json": [], "marks": 15.0, "difficulty": "Easy", "time_limit_seconds": 2, "question_type": "coding", "competency_id": 5, "competency_code": "PROG", "competency_name": "Programming & Coding"}
446	176	64	64	{"id": 64, "title": "Q1.1: Revenue Trend Analysis", "candidate_content": "A retail company reported $120,000 in Q1 revenue, which grew by 25% in Q2, and then dropped by 10% in Q3. What is the net revenue for Q3?", "candidate_code_template": "", "options_json": [{"id": "A", "text": "$135,000"}, {"id": "B", "text": "$140,000"}, {"id": "C", "text": "$145,000"}, {"id": "D", "text": "$150,000"}], "marks": 1.0, "difficulty": "Medium", "time_limit_seconds": 60, "question_type": "mcq", "competency_id": 30, "competency_code": "ANALYTICAL_PS", "competency_name": "Analytical & Numerical Problem Solving"}
447	176	65	65	{"id": 65, "title": "Q1.2: Data Quality & Missing Value Strategy", "candidate_content": "When analyzing a customer dataset of 100,000 records, you discover that 15% of 'Customer Age' entries are null. Which approach is statistically sound for descriptive profiling before building a model?", "candidate_code_template": "", "options_json": [{"id": "A", "text": "Immediately delete all 15,000 rows containing nulls."}, {"id": "B", "text": "Analyze missingness pattern (MCAR/MAR), impute using median/mode by customer segment, or analyze complete cases separately."}, {"id": "C", "text": "Replace all nulls with 0."}, {"id": "D", "text": "Replace all nulls with 100."}], "marks": 1.0, "difficulty": "Medium", "time_limit_seconds": 60, "question_type": "mcq", "competency_id": 31, "competency_code": "DATA_INTERPRETATION", "competency_name": "Data Interpretation & Trends"}
448	176	66	66	{"id": 66, "title": "Q1.3: Noesys Information Security Policy & Data Protection", "candidate_content": "According to Information Security Policy, a candidate data file containing Personally Identifiable Information (PII) like employee SSNs and salaries must be exported for external presentation. What is the compliant procedure?", "candidate_code_template": "", "options_json": [{"id": "A", "text": "Email the unencrypted file as an attachment to external personal email."}, {"id": "B", "text": "Anonymize/mask PII fields, encrypt the dataset at rest/transit, and share via authorized secure channels with access controls."}, {"id": "C", "text": "Store the unencrypted file on a public cloud drive."}, {"id": "D", "text": "Print the raw spreadsheet and leave it in the conference room."}], "marks": 1.0, "difficulty": "Medium", "time_limit_seconds": 60, "question_type": "mcq", "competency_id": 32, "competency_code": "INFO_SEC", "competency_name": "Information Security & Data Asset Protection"}
449	176	67	67	{"id": 67, "title": "Q1.4: Stakeholder Business Communication", "candidate_content": "Draft a 150-200 word email reply to a business manager explaining why Q3 sales dropped by 12% due to supply chain delays, and outline 2 data-backed recommendations.", "candidate_code_template": "Dear Manager,\\n\\nI have completed the Q3 sales data analysis...", "options_json": [], "marks": 1.0, "difficulty": "Medium", "time_limit_seconds": 60, "question_type": "text_response", "competency_id": 39, "competency_code": "BUSINESS_COMM", "competency_name": "Stakeholder Communication & Technical Writing"}
450	176	68	68	{"id": 68, "title": "Q1.3: Information Security Policy & Data Protection", "candidate_content": "According to Information Security Policy, a candidate data file containing Personally Identifiable Information (PII) like employee SSNs and salaries must be exported for external presentation. What is the compliant procedure?", "candidate_code_template": "", "options_json": [{"id": "A", "text": "Email the unencrypted file as an attachment to external personal email."}, {"id": "B", "text": "Anonymize/mask PII fields, encrypt the dataset at rest/transit, and share via authorized secure channels with access controls."}, {"id": "C", "text": "Store the unencrypted file on a public cloud drive."}, {"id": "D", "text": "Print the raw spreadsheet and leave it in the conference room."}], "marks": 1.0, "difficulty": "Medium", "time_limit_seconds": 60, "question_type": "mcq", "competency_id": 32, "competency_code": "INFO_SEC", "competency_name": "Information Security & Data Asset Protection"}
451	176	69	69	{"id": 69, "title": "Regional Sales Growth Rate Analysis", "candidate_content": "Region A sales grew from $120,000 in Q1 to $156,000 in Q2. Region B sales grew from $80,000 to $108,000 in the same period. Which region achieved a higher percentage growth rate?", "candidate_code_template": null, "options_json": [{"key": "A", "text": "Region A achieved higher growth (30% vs 35%)"}, {"key": "B", "text": "Region B achieved higher growth (35% vs 30%)"}, {"key": "C", "text": "Both regions achieved equal growth (30%)"}, {"key": "D", "text": "Region A achieved higher growth (36% vs 28%)"}], "marks": 10.0, "difficulty": "Medium", "time_limit_seconds": 180, "question_type": "mcq", "competency_id": 31, "competency_code": "DATA_INTERPRETATION", "competency_name": "Data Interpretation & Trends"}
452	176	70	70	{"id": 70, "title": "Customer Acquisition Trend & Outlier Detection", "candidate_content": "Monthly new signups for 6 consecutive months are: Jan: 1,200 | Feb: 1,250 | Mar: 1,220 | Apr: 4,800 | May: 1,300 | Jun: 1,310. What is the most likely analytical interpretation of the April data point?", "candidate_code_template": null, "options_json": [{"key": "A", "text": "Natural baseline growth trend that will double every quarter."}, {"key": "B", "text": "An anomaly/outlier caused by a marketing campaign or data entry error requiring isolation."}, {"key": "C", "text": "Standard seasonal variation expected in B2B SaaS analytics."}, {"key": "D", "text": "The median signup rate across the half-year period."}], "marks": 10.0, "difficulty": "Medium", "time_limit_seconds": 180, "question_type": "mcq", "competency_id": 31, "competency_code": "DATA_INTERPRETATION", "competency_name": "Data Interpretation & Trends"}
453	176	71	71	{"id": 71, "title": "Product Margin & Revenue Weighted Average", "candidate_content": "Product X yields $50,000 revenue at a 40% gross margin. Product Y yields $150,000 revenue at a 20% gross margin. What is the overall revenue-weighted gross margin percentage of the portfolio?", "candidate_code_template": null, "options_json": [{"key": "A", "text": "30.0%"}, {"key": "B", "text": "25.0%"}, {"key": "C", "text": "27.5%"}, {"key": "D", "text": "22.5%"}], "marks": 10.0, "difficulty": "Hard", "time_limit_seconds": 240, "question_type": "mcq", "competency_id": 42, "competency_code": "ANALYTICAL_REASONING", "competency_name": "Analytical & Logical Reasoning"}
454	176	72	72	{"id": 72, "title": "Analytical Root Cause & Hypothesis Formulation", "candidate_content": "A digital commerce platform experiences a sudden 25% drop in weekly checkout conversion rate despite steady traffic volume. Detail your structured step-by-step analytical approach to isolate the root cause (e.g., funnel metrics, breakdown dimensions, technical vs marketing anomalies, and data verification steps).", "candidate_code_template": null, "options_json": [], "marks": 10.0, "difficulty": "Medium", "time_limit_seconds": 300, "question_type": "descriptive", "competency_id": 42, "competency_code": "ANALYTICAL_REASONING", "competency_name": "Analytical & Logical Reasoning"}
455	178	1	1	{"id": 1, "title": "Bitwise Operations & Shift Logic", "candidate_content": "What is the result of evaluating `(16 >> 2) | (4 << 1)` in standard integer arithmetic?", "candidate_code_template": null, "options_json": [{"id": 1, "text": "12"}, {"id": 2, "text": "14"}, {"id": 3, "text": "8"}, {"id": 4, "text": "16"}], "marks": 2.0, "difficulty": "Easy", "time_limit_seconds": 60, "question_type": "mcq", "competency_id": 1, "competency_code": "LOGIC", "competency_name": "Logical & Analytical Reasoning"}
456	178	2	2	{"id": 2, "title": "Binary Tree Traversal Deductions", "candidate_content": "A complete binary tree has 15 nodes. How many leaf nodes does this tree possess?", "candidate_code_template": null, "options_json": [{"id": 1, "text": "7"}, {"id": 2, "text": "8"}, {"id": 3, "text": "9"}, {"id": 4, "text": "10"}], "marks": 2.0, "difficulty": "Medium", "time_limit_seconds": 60, "question_type": "mcq", "competency_id": 3, "competency_code": "COMP_THINK", "competency_name": "Computational Thinking"}
457	178	3	3	{"id": 3, "title": "Server Request Latency Calculation", "candidate_content": "A microservice cluster processes 1,200 requests per second across 4 parallel worker instances. Each instance handles requests synchronously at an average duration of 2.5ms. What is the CPU utilization per instance?", "candidate_code_template": null, "options_json": [{"id": 1, "text": "50%"}, {"id": 2, "text": "75%"}, {"id": 3, "text": "80%"}, {"id": 4, "text": "90%"}], "marks": 2.0, "difficulty": "Medium", "time_limit_seconds": 60, "question_type": "mcq", "competency_id": 2, "competency_code": "QUANT", "competency_name": "Quantitative & Data Interpretation"}
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: nasc_admin
--

COPY public.audit_logs (id, user_id, action, module, record_id, old_value, new_value, ip_address, "timestamp") FROM stdin;
1	1	RESULTS_CALCULATED	Results	1	\N	Calculated results for 47 students in course_id 1	127.0.0.1	2026-08-08 15:03:17.197724
2	1	RESULTS_CALCULATED	Results	1	\N	Calculated results for 47 students in course_id 1	127.0.0.1	2026-08-08 15:04:36.43001
3	2	COGNITIVE_RAG_PAPER_GENERATED	PineconeRAG	3	\N	Generated Cognitive RAG paper 'CIA I' with 20 Bloom-aligned questions	127.0.0.1	2026-08-08 15:14:48.599005
4	3	PAPER_REJECT	QuestionPaper	3	Submitted	Changes Requested	127.0.0.1	2026-08-08 16:18:50.098032
5	3	LEARNING_RESOURCE_DELETED	ResourceRepository	2	\N	Deleted resource 'Unit 1 & 2: Python Core Foundations & OOP Architecture' (sample_python_syllabus_notes.txt)	127.0.0.1	2026-08-08 17:09:41.53754
6	3	LEARNING_RESOURCE_DELETED	ResourceRepository	1	\N	Deleted resource 'Unit 1 & 2: Python Core Foundations & OOP Architecture' (sample_python_syllabus_notes.txt)	127.0.0.1	2026-08-08 17:09:44.39559
7	3	LEARNING_RESOURCE_INGESTED	ResourceRepository	2	\N	Ingested Study Material Unit 1.pdf for Unit 1 (42 chunks, 42 vectors) into Pinecone	127.0.0.1	2026-08-08 17:10:39.000635
8	3	LEARNING_RESOURCE_INGESTED	ResourceRepository	2	\N	Ingested UNIT 2 STUDY MATERIAL.docx for Unit 1 (14 chunks, 14 vectors) into Pinecone	127.0.0.1	2026-08-08 17:11:30.648271
9	3	COGNITIVE_RAG_PAPER_GENERATED	PineconeRAG	4	\N	Generated Cognitive RAG paper 'CIA -I Python TEST' with 10 Bloom-aligned questions	127.0.0.1	2026-08-08 17:17:24.904714
10	3	COGNITIVE_RAG_PAPER_GENERATED	PineconeRAG	5	\N	Generated Cognitive RAG paper 'CIA I' with 10 Bloom-aligned questions	127.0.0.1	2026-08-08 17:27:43.322266
11	3	COGNITIVE_RAG_PAPER_GENERATED	PineconeRAG	6	\N	Generated Cognitive RAG paper 'CIA I' with 10 Bloom-aligned questions	127.0.0.1	2026-08-08 17:30:00.542291
12	3	COGNITIVE_RAG_PAPER_GENERATED	PineconeRAG	7	\N	Generated Cognitive RAG paper 'CIA I' with 10 Bloom-aligned questions	127.0.0.1	2026-08-08 17:33:16.517652
13	3	PAPER_APPROVE	QuestionPaper	7	Submitted	Approved - Notes: None	127.0.0.1	2026-08-08 17:34:06.26148
14	3	PAPER_PUBLISH	QuestionPaper	7	Approved	Published - Notes: None	127.0.0.1	2026-08-08 17:34:55.433794
15	6	MALPRACTICE_NO_STUDENT_DETECTED	AssessmentProctoring	3	\N	Proctoring Warning 2/3 logged for attempt 3	127.0.0.1	2026-08-08 17:38:05.531986
16	6	MALPRACTICE_NO_STUDENT_DETECTED	AssessmentProctoring	3	\N	Proctoring Warning 3/3 logged for attempt 3	127.0.0.1	2026-08-08 17:38:11.993224
17	6	ASSESSMENT_SUBMITTED	Assessment	3	\N	Student submitted assessment. Score: 0.0. Malpractice Flag: True	127.0.0.1	2026-08-08 17:38:12.052686
18	6	RESULTS_PUBLISHED	Results	1	\N	Published results for course_id 1	127.0.0.1	2026-08-08 17:40:46.630787
19	2	QUESTION_PAPER_CLONED_FROM_BANK	QuestionPaper	8	\N	Cloned from approved paper #7 (CIA I)	127.0.0.1	2026-08-09 01:18:15.945467
20	2	PAPER_APPROVE	QuestionPaper	6	Submitted	Approved - Notes: None	127.0.0.1	2026-08-10 06:46:33.335321
21	2	PAPER_APPROVE	QuestionPaper	8	Submitted	Approved - Notes: None	127.0.0.1	2026-08-10 06:46:38.817322
22	2	PAPER_PUBLISH	QuestionPaper	8	Approved	Published - Notes: None	127.0.0.1	2026-08-10 06:48:20.105324
23	2	PAPER_PUBLISH	QuestionPaper	6	Approved	Published - Notes: None	127.0.0.1	2026-08-10 06:48:23.880054
24	2	PAPER_APPROVE	QuestionPaper	5	Submitted	Approved - Notes: None	127.0.0.1	2026-08-10 06:48:27.977208
25	2	PAPER_PUBLISH	QuestionPaper	5	Approved	Published - Notes: None	127.0.0.1	2026-08-10 06:48:29.152178
26	6	MALPRACTICE_NO_STUDENT_DETECTED	AssessmentProctoring	6	\N	Proctoring Warning 3/3 logged for attempt 4	127.0.0.1	2026-08-10 06:50:47.279204
27	6	MALPRACTICE_MULTIPLE_PERSONS_DETECTED	AssessmentProctoring	6	\N	Proctoring Warning 3/3 logged for attempt 4	127.0.0.1	2026-08-10 06:50:48.190971
28	6	ASSESSMENT_SUBMITTED	Assessment	6	\N	Student submitted assessment. Score: 0.0. Malpractice Flag: True	127.0.0.1	2026-08-10 06:50:48.614822
29	6	ASSESSMENT_SUBMITTED	Assessment	6	\N	Student submitted assessment. Score: 0.0. Malpractice Flag: True	127.0.0.1	2026-08-10 06:50:48.683107
30	6	MALPRACTICE_MULTIPLE_PERSONS_DETECTED	AssessmentProctoring	5	\N	Proctoring Warning 2/3 logged for attempt 5	127.0.0.1	2026-08-10 06:51:35.053127
31	6	MALPRACTICE_MULTIPLE_PERSONS_DETECTED	AssessmentProctoring	5	\N	Proctoring Warning 3/3 logged for attempt 5	127.0.0.1	2026-08-10 06:51:41.113245
32	6	ASSESSMENT_SUBMITTED	Assessment	5	\N	Student submitted assessment. Score: 0.0. Malpractice Flag: True	127.0.0.1	2026-08-10 06:51:41.184212
33	6	MALPRACTICE_MULTIPLE_PERSONS_DETECTED	AssessmentProctoring	4	\N	Proctoring Warning 2/3 logged for attempt 6	127.0.0.1	2026-08-10 06:52:37.071323
34	6	ASSESSMENT_SUBMITTED	Assessment	4	\N	Student submitted assessment. Score: 2.0. Malpractice Flag: True	127.0.0.1	2026-08-10 06:53:25.236461
35	1	RESULTS_CALCULATED	Results	1	\N	Calculated results for 47 students in course_id 1	127.0.0.1	2026-08-10 07:33:07.261287
36	1	MARKS_ENTRY_DRAFT	Marks	1	\N	Batch entry saved with status Draft for 47 students	127.0.0.1	2026-08-10 07:34:16.488279
37	1	MARKS_ENTRY_VERIFIED	Marks	1	\N	Batch entry saved with status Verified for 47 students	127.0.0.1	2026-08-10 07:35:13.03387
38	1	RESULTS_CALCULATED	Results	1	\N	Calculated results for 47 students in course_id 1	127.0.0.1	2026-08-10 07:36:18.293534
39	2	PAPER_APPROVE	QuestionPaper	4	Submitted	Approved - Notes: None	127.0.0.1	2026-08-10 08:51:55.349308
40	2	PAPER_PUBLISH	QuestionPaper	4	Approved	Published - Notes: None	127.0.0.1	2026-08-10 08:51:57.456689
41	6	MALPRACTICE_NO_STUDENT_DETECTED	AssessmentProctoring	7	\N	Proctoring Warning 3/3 logged for attempt 7	127.0.0.1	2026-08-10 08:53:33.75014
42	6	MALPRACTICE_MULTIPLE_PERSONS_DETECTED	AssessmentProctoring	7	\N	Proctoring Warning 3/3 logged for attempt 7	127.0.0.1	2026-08-10 08:53:33.820265
43	6	ASSESSMENT_SUBMITTED	Assessment	7	\N	Student submitted assessment. Score: 0.0. Malpractice Flag: True	127.0.0.1	2026-08-10 08:53:34.023553
44	6	ASSESSMENT_SUBMITTED	Assessment	7	\N	Student submitted assessment. Score: 0.0. Malpractice Flag: True	127.0.0.1	2026-08-10 08:53:34.115309
45	6	MALPRACTICE_MULTIPLE_PERSONS_DETECTED	AssessmentProctoring	7	\N	Proctoring Warning 3/3 logged for attempt 7	127.0.0.1	2026-08-10 08:53:34.562158
46	6	ASSESSMENT_SUBMITTED	Assessment	7	\N	Student submitted assessment. Score: 0.0. Malpractice Flag: True	127.0.0.1	2026-08-10 08:53:34.615592
47	8	ASSESSMENT_SUBMITTED	Assessment	7	\N	Student submitted assessment. Score: 4.0. Malpractice Flag: False	127.0.0.1	2026-08-10 10:09:29.769576
48	3	COGNITIVE_RAG_PAPER_GENERATED	PineconeRAG	9	\N	Generated Cognitive RAG paper 'Sample test for python course (VB.net questions)' with 10 Bloom-aligned questions	127.0.0.1	2026-08-10 15:31:34.325325
49	1	PAPER_APPROVE	QuestionPaper	9	Submitted	Approved - Notes: None	127.0.0.1	2026-08-10 15:32:25.241734
50	1	PAPER_PUBLISH	QuestionPaper	9	Approved	Published - Notes: None	127.0.0.1	2026-08-10 15:32:27.301576
51	9	MALPRACTICE_NO_STUDENT_DETECTED	AssessmentProctoring	8	\N	Proctoring Warning 1/3 logged for attempt 9	127.0.0.1	2026-08-10 15:34:10.090503
52	9	MALPRACTICE_MULTIPLE_PERSONS_DETECTED	AssessmentProctoring	8	\N	Proctoring Warning 3/3 logged for attempt 9	127.0.0.1	2026-08-10 15:34:17.572627
53	9	ASSESSMENT_SUBMITTED	Assessment	8	\N	Student submitted assessment. Score: 0.0. Malpractice Flag: True	127.0.0.1	2026-08-10 15:34:17.653614
54	12	MALPRACTICE_MULTIPLE_PERSONS_DETECTED	AssessmentProctoring	8	\N	Proctoring Warning 3/3 logged for attempt 10	127.0.0.1	2026-08-10 17:09:48.555742
55	12	ASSESSMENT_SUBMITTED	Assessment	8	\N	Student submitted assessment. Score: 0.0. Malpractice Flag: True	127.0.0.1	2026-08-10 17:09:48.611329
56	12	ASSESSMENT_SUBMITTED	Assessment	7	\N	Student submitted assessment. Score: 8.0. Malpractice Flag: False	127.0.0.1	2026-08-10 17:12:06.300926
57	3	EVALUATION_COMPLETED	Evaluation	11	\N	Completed grading for attempt 11. Score: 8.0	127.0.0.1	2026-08-10 17:13:01.635395
58	54	LEARNING_RESOURCE_INGESTED	ResourceRepository	4	\N	Ingested AI unit 1 docs.pdf for Unit 1 (6 chunks, 6 vectors) into Pinecone	127.0.0.1	2026-08-11 01:57:00.205914
59	54	LEARNING_RESOURCE_DELETED	ResourceRepository	3	\N	Deleted resource 'AI unit 1 docs' (AI unit 1 docs.pdf)	127.0.0.1	2026-08-11 02:10:59.539724
60	54	LEARNING_RESOURCE_DELETED	ResourceRepository	2	\N	Deleted resource 'UNIT 2 STUDY MATERIAL' (UNIT 2 STUDY MATERIAL.docx)	127.0.0.1	2026-08-11 02:11:01.929694
61	54	LEARNING_RESOURCE_DELETED	ResourceRepository	1	\N	Deleted resource 'Study Material Unit 1' (Study Material Unit 1.pdf)	127.0.0.1	2026-08-11 02:11:06.129391
62	54	LEARNING_RESOURCE_INGESTED	ResourceRepository	4	\N	Ingested AI unit 1 docs.pdf for Unit 1 (6 chunks, 6 vectors) into Pinecone	127.0.0.1	2026-08-11 02:12:17.979996
63	54	COGNITIVE_RAG_PAPER_GENERATED	PineconeRAG	10	\N	Generated Cognitive RAG paper 'CIA-1' with 10 Bloom-aligned questions	127.0.0.1	2026-08-11 02:13:33.888684
64	1	PAPER_APPROVE	QuestionPaper	10	Submitted	Approved - Notes: None	127.0.0.1	2026-08-11 02:14:45.307684
65	1	PAPER_PUBLISH	QuestionPaper	10	Approved	Published - Notes: None	127.0.0.1	2026-08-11 02:14:47.363606
66	54	COGNITIVE_RAG_PAPER_GENERATED	PineconeRAG	11	\N	Generated Cognitive RAG paper 'CIA -1 arificial intelligence ' with 10 Bloom-aligned questions	127.0.0.1	2026-08-11 14:38:27.318839
67	54	COGNITIVE_RAG_PAPER_GENERATED	PineconeRAG	12	\N	Generated Cognitive RAG paper 'CIA -1 artificial int' with 10 Bloom-aligned questions	127.0.0.1	2026-08-11 15:02:39.105688
68	1	PAPER_APPROVE	QuestionPaper	11	Submitted	Approved - Notes: None	127.0.0.1	2026-08-12 01:27:56.192514
69	1	PAPER_PUBLISH	QuestionPaper	11	Approved	Published - Notes: None	127.0.0.1	2026-08-12 01:27:58.424198
70	1	PAPER_APPROVE	QuestionPaper	12	Submitted	Approved - Notes: None	127.0.0.1	2026-08-12 01:28:03.120559
71	1	PAPER_PUBLISH	QuestionPaper	12	Approved	Published - Notes: None	127.0.0.1	2026-08-12 01:28:04.568177
72	21	MALPRACTICE_NO_STUDENT_DETECTED	AssessmentProctoring	11	\N	Proctoring Warning 1/3 logged for attempt 12	127.0.0.1	2026-08-12 01:31:37.7033
73	21	MALPRACTICE_WINDOW_BLUR	AssessmentProctoring	11	\N	Proctoring Warning 2/3 logged for attempt 12	127.0.0.1	2026-08-12 01:31:44.04995
74	21	MALPRACTICE_WINDOW_BLUR	AssessmentProctoring	11	\N	Proctoring Warning 3/3 logged for attempt 12	127.0.0.1	2026-08-12 01:31:49.023768
75	21	ASSESSMENT_SUBMITTED	Assessment	11	\N	Student submitted assessment. Score: 0.0. Malpractice Flag: True	127.0.0.1	2026-08-12 01:31:49.173685
76	21	ASSESSMENT_SUBMITTED	Assessment	10	\N	Student submitted assessment. Score: 4.0. Malpractice Flag: False	127.0.0.1	2026-08-12 01:32:38.974099
77	1	RESULTS_CALCULATED	Results	1	\N	Calculated results for 47 students in course_id 1	127.0.0.1	2026-08-12 01:33:13.362824
78	1	RESULTS_CALCULATED	Results	1	\N	Calculated results for 47 students in course_id 1	127.0.0.1	2026-08-12 01:33:26.984618
79	1	RESULTS_CALCULATED	Results	1	\N	Calculated results for 47 students in course_id 1	127.0.0.1	2026-08-12 01:33:27.436445
80	1	RESULTS_CALCULATED	Results	4	\N	Calculated results for 47 students in course_id 4	127.0.0.1	2026-08-12 01:33:32.611146
81	1	RESULTS_PUBLISHED	Results	4	\N	Published results for course_id 4	127.0.0.1	2026-08-12 01:33:44.747168
82	56	MALPRACTICE_NO_STUDENT_DETECTED	AssessmentProctoring	11	\N	Proctoring Warning 1/3 logged for attempt 14	127.0.0.1	2026-08-12 02:06:45.933792
83	56	MALPRACTICE_FULLSCREEN_EXIT	AssessmentProctoring	11	\N	Proctoring Warning 1/3 logged for attempt 14	127.0.0.1	2026-08-12 02:06:55.509133
84	56	MALPRACTICE_WINDOW_BLUR	AssessmentProctoring	11	\N	Proctoring Warning 2/3 logged for attempt 14	127.0.0.1	2026-08-12 02:06:57.718222
85	56	MALPRACTICE_TAB_SWITCH	AssessmentProctoring	11	\N	Proctoring Warning 3/3 logged for attempt 14	127.0.0.1	2026-08-12 02:06:57.745819
86	56	ASSESSMENT_SUBMITTED	Assessment	11	\N	Student submitted assessment. Score: 0.0. Malpractice Flag: True	127.0.0.1	2026-08-12 02:06:57.799046
87	56	ASSESSMENT_SUBMITTED	Assessment	10	\N	Student submitted assessment. Score: 18.0. Malpractice Flag: False	127.0.0.1	2026-08-12 02:20:02.810141
88	53	RESULTS_CALCULATED	Results	4	\N	Calculated results for 48 students in course_id 4	127.0.0.1	2026-08-12 02:20:35.915204
89	53	RESULTS_CALCULATED	Results	4	\N	Calculated results for 48 students in course_id 4	127.0.0.1	2026-08-12 02:20:37.319161
90	53	RESULTS_CALCULATED	Results	4	\N	Calculated results for 48 students in course_id 4	127.0.0.1	2026-08-12 02:20:37.986713
91	53	RESULTS_CALCULATED	Results	4	\N	Calculated results for 48 students in course_id 4	127.0.0.1	2026-08-12 02:21:07.684207
92	53	RESULTS_PUBLISHED	Results	4	\N	Published results for course_id 4	127.0.0.1	2026-08-12 02:21:09.504886
93	55	LEARNING_RESOURCE_INGESTED	ResourceRepository	4	\N	Ingested Python is one of the most popular programming languages.pdf for Unit 1 (1 chunks, 1 vectors) into Pinecone	127.0.0.1	2026-08-12 04:28:43.762919
94	55	COGNITIVE_RAG_PAPER_GENERATED	PineconeRAG	13	\N	Generated Cognitive RAG paper 'Python  CIA-1' with 10 Bloom-aligned questions	127.0.0.1	2026-08-12 04:31:55.132603
95	53	PAPER_APPROVE	QuestionPaper	13	Submitted	Approved - Notes: None	127.0.0.1	2026-08-12 04:53:46.839453
96	53	PAPER_PUBLISH	QuestionPaper	13	Approved	Published - Notes: None	127.0.0.1	2026-08-12 04:53:48.75155
97	55	QUESTION_PAPER_CLONED_FROM_BANK	QuestionPaper	14	\N	Cloned from approved paper #13 (Python  CIA-1)	127.0.0.1	2026-08-12 05:02:11.198113
98	53	PAPER_APPROVE	QuestionPaper	14	Submitted	Approved - Notes: None	127.0.0.1	2026-08-12 05:02:20.739889
99	53	PAPER_PUBLISH	QuestionPaper	14	Approved	Published - Notes: None	127.0.0.1	2026-08-12 05:02:22.376424
100	56	MALPRACTICE_NO_STUDENT_DETECTED	AssessmentProctoring	13	\N	Proctoring Warning 1/3 logged for attempt 16	127.0.0.1	2026-08-12 06:02:37.491372
101	56	ASSESSMENT_SUBMITTED	Assessment	13	\N	Student submitted assessment. Score: 16.0. Malpractice Flag: False	127.0.0.1	2026-08-12 06:03:29.857779
102	53	RESULTS_CALCULATED	Results	4	\N	Calculated results for 48 students in course_id 4	127.0.0.1	2026-08-12 06:07:19.742768
103	55	BULK_EVALUATION_COMPLETED	Evaluation	course_4	\N	Bulk evaluated 1 student attempts.	127.0.0.1	2026-08-12 06:14:50.129062
104	53	RESULTS_CALCULATED	Results	4	\N	Calculated results for 48 students in course_id 4	127.0.0.1	2026-08-12 06:15:14.340846
105	53	RESULTS_CALCULATED	Results	4	\N	Calculated results for 48 students in course_id 4	127.0.0.1	2026-08-12 06:15:15.070646
106	53	RESULTS_PUBLISHED	Results	4	\N	Published results for course_id 4	127.0.0.1	2026-08-12 06:15:50.956112
107	53	RESULTS_CALCULATED	Results	4	\N	Calculated results for 48 students in course_id 4	127.0.0.1	2026-08-12 15:08:32.933172
108	55	COGNITIVE_RAG_PAPER_GENERATED	PineconeRAG	15	\N	Generated Cognitive RAG paper 'test' with 10 Bloom-aligned questions	127.0.0.1	2026-08-12 16:05:55.759209
109	1	ASSESSMENT_DELETED	AssessmentManager	13	\N	Assessment 'Cloned — Python  CIA-1' deleted by System Administrator	127.0.0.1	2026-08-19 15:21:29.747663
110	1	ASSESSMENT_DELETED	AssessmentManager	2	\N	Assessment 'CIA 1 — Data Structures & Bloom Taxonomy Blueprint' deleted by System Administrator	127.0.0.1	2026-08-19 15:21:39.952058
111	1	ASSESSMENT_DELETED	AssessmentManager	4	\N	Assessment 'Cloned — CIA I' deleted by System Administrator	127.0.0.1	2026-08-19 15:21:42.536462
112	1	ASSESSMENT_DELETED	AssessmentManager	6	\N	Assessment 'CIA I' deleted by System Administrator	127.0.0.1	2026-08-19 15:21:45.321202
113	1	ASSESSMENT_DELETED	AssessmentManager	5	\N	Assessment 'CIA I' deleted by System Administrator	127.0.0.1	2026-08-19 15:21:48.724717
114	1	ASSESSMENT_DELETED	AssessmentManager	8	\N	Assessment 'Sample test for python course (VB.net questions)' deleted by System Administrator	127.0.0.1	2026-08-19 15:21:52.132555
115	1	ASSESSMENT_DELETED	AssessmentManager	7	\N	Assessment 'CIA -I Python TEST' deleted by System Administrator	127.0.0.1	2026-08-19 15:21:55.081315
116	1	ASSESSMENT_DELETED	AssessmentManager	9	\N	Assessment 'CIA-1' deleted by System Administrator	127.0.0.1	2026-08-19 15:22:01.114967
117	1	ASSESSMENT_DELETED	AssessmentManager	1	\N	Assessment 'CIA 1 — Data Structures & Bloom Taxonomy Blueprint' deleted by System Administrator	127.0.0.1	2026-08-19 15:22:04.944228
118	1	ASSESSMENT_DELETED	AssessmentManager	3	\N	Assessment 'CIA I' deleted by System Administrator	127.0.0.1	2026-08-19 15:22:08.344889
119	1	ASSESSMENT_ACTIVATION_REQUESTED	ASSESSMENT	6	\N	{"domain_id": 1, "academic_class_id": 2, "candidates_count": 1}	127.0.0.1	2026-08-20 14:54:28.423302
120	55	ASSESSMENT_ACTIVATION_REQUESTED	ASSESSMENT	7	\N	{"domain_id": 1, "academic_class_id": 5, "candidates_count": 1}	127.0.0.1	2026-08-20 15:33:14.90603
121	55	ASSESSMENT_ACTIVATION_REQUESTED	ASSESSMENT	8	\N	{"domain_id": 1, "academic_class_id": 5, "candidates_count": 1}	127.0.0.1	2026-08-20 15:33:18.160466
122	53	ASSESSMENT_ACTIVATION_APPROVED	ASSESSMENT	8	\N	{"status": "APPROVED", "allocated_students_count": 1}	127.0.0.1	2026-08-20 15:34:44.153997
123	55	ASSESSMENT_ACTIVATION_REQUESTED	ASSESSMENT	10	\N	{"domain_id": 8, "academic_class_id": 5, "candidates_count": 1}	127.0.0.1	2026-08-23 03:42:58.502753
124	53	ASSESSMENT_ACTIVATION_APPROVED	ASSESSMENT	10	\N	{"status": "APPROVED", "allocated_students_count": 1}	127.0.0.1	2026-08-23 03:43:23.570016
125	55	ASSESSMENT_ACTIVATION_REQUESTED	ASSESSMENT	11	\N	{"domain_id": 8, "academic_class_id": 5, "candidates_count": 1}	127.0.0.1	2026-08-23 06:52:57.216715
126	53	ASSESSMENT_ACTIVATION_APPROVED	ASSESSMENT	7	\N	{"status": "APPROVED", "allocated_students_count": 1}	127.0.0.1	2026-08-23 06:53:27.257625
127	53	ASSESSMENT_ACTIVATION_APPROVED	ASSESSMENT	11	\N	{"status": "APPROVED", "allocated_students_count": 1}	127.0.0.1	2026-08-23 06:53:41.17597
128	55	ASSESSMENT_ACTIVATION_REQUESTED	ASSESSMENT	12	\N	{"domain_id": 8, "academic_class_id": 5, "candidates_count": 2}	127.0.0.1	2026-08-23 10:15:07.752523
129	55	ASSESSMENT_ACTIVATION_REQUESTED	ASSESSMENT	13	\N	{"domain_id": 1, "academic_class_id": 5, "candidates_count": 2}	127.0.0.1	2026-08-23 10:15:13.968788
130	53	ASSESSMENT_ACTIVATION_APPROVED	ASSESSMENT	13	\N	{"status": "APPROVED", "allocated_students_count": 2}	127.0.0.1	2026-08-23 10:28:38.694378
131	53	ASSESSMENT_ACTIVATION_APPROVED	ASSESSMENT	12	\N	{"status": "APPROVED", "allocated_students_count": 2}	127.0.0.1	2026-08-23 10:28:44.642989
132	55	ASSESSMENT_ACTIVATION_REQUESTED	ASSESSMENT	16	\N	{"domain_id": 3, "academic_class_id": 5, "candidates_count": 2}	127.0.0.1	2026-08-23 12:47:18.675717
133	53	ASSESSMENT_ACTIVATION_APPROVED	ASSESSMENT	16	\N	{"status": "APPROVED", "allocated_students_count": 2}	127.0.0.1	2026-08-23 12:48:11.737252
134	55	ASSESSMENT_ACTIVATION_REQUESTED	ASSESSMENT	17	\N	{"domain_id": 1, "academic_class_id": 5, "candidates_count": 2}	127.0.0.1	2026-08-27 15:05:35.325914
135	55	ASSESSMENT_ACTIVATION_REQUESTED	ASSESSMENT	18	\N	{"domain_id": 8, "academic_class_id": 5, "candidates_count": 2}	127.0.0.1	2026-08-27 15:05:42.004483
136	55	ASSESSMENT_ACTIVATION_REQUESTED	ASSESSMENT	19	\N	{"domain_id": 3, "academic_class_id": 5, "candidates_count": 2}	127.0.0.1	2026-08-27 15:05:48.259985
137	55	ASSESSMENT_ACTIVATION_REQUESTED	ASSESSMENT	20	\N	{"domain_id": 2, "academic_class_id": 5, "candidates_count": 2}	127.0.0.1	2026-08-27 15:05:56.653662
138	53	ASSESSMENT_ACTIVATION_APPROVED	ASSESSMENT	20	\N	{"status": "APPROVED", "allocated_students_count": 2}	127.0.0.1	2026-08-27 15:06:38.361715
139	53	ASSESSMENT_ACTIVATION_APPROVED	ASSESSMENT	19	\N	{"status": "APPROVED", "allocated_students_count": 2}	127.0.0.1	2026-08-27 15:06:43.081963
140	53	ASSESSMENT_ACTIVATION_APPROVED	ASSESSMENT	18	\N	{"status": "APPROVED", "allocated_students_count": 2}	127.0.0.1	2026-08-27 15:06:47.841854
141	53	ASSESSMENT_ACTIVATION_APPROVED	ASSESSMENT	17	\N	{"status": "APPROVED", "allocated_students_count": 2}	127.0.0.1	2026-08-27 15:06:51.572363
142	55	ASSESSMENT_ACTIVATION_REQUESTED	ASSESSMENT	23	\N	{"domain_id": 1, "academic_class_id": 5, "candidates_count": 2}	127.0.0.1	2026-09-03 15:33:01.938506
143	53	ASSESSMENT_ACTIVATION_APPROVED	ASSESSMENT	23	\N	{"status": "APPROVED", "allocated_students_count": 2}	127.0.0.1	2026-09-05 15:33:28.358105
\.


--
-- Data for Name: batches; Type: TABLE DATA; Schema: public; Owner: nasc_admin
--

COPY public.batches (id, name, start_year, end_year) FROM stdin;
1	2023-2026	2023	2026
2	2025-2028	2025	2028
\.


--
-- Data for Name: code_execution_results; Type: TABLE DATA; Schema: public; Owner: nasc_admin
--

COPY public.code_execution_results (id, submission_id, test_case_index, is_passed, actual_output, error_output, execution_time_ms) FROM stdin;
\.


--
-- Data for Name: coding_submissions; Type: TABLE DATA; Schema: public; Owner: nasc_admin
--

COPY public.coding_submissions (id, attempt_id, question_id, language, source_code, status, test_cases_passed, total_test_cases, execution_time_ms, memory_kb, compiler_output, submitted_at, score_awarded) FROM stdin;
\.


--
-- Data for Name: competencies; Type: TABLE DATA; Schema: public; Owner: nasc_admin
--

COPY public.competencies (id, code, name, category, description) FROM stdin;
1	LOGIC	Logical & Analytical Reasoning	Aptitude	Deductive reasoning and logical sequencing.
2	QUANT	Quantitative & Data Interpretation	Aptitude	Numerical computation, probability, and chart interpretation.
3	COMP_THINK	Computational Thinking	Aptitude	Pattern recognition, recursion, and algorithmic deductions.
4	DSA	Data Structures & Algorithms	Core CS	Arrays, Linked Lists, Trees, Graphs, Sorting, and Searching.
5	PROG	Programming & Coding	Programming	Clean syntax, idiomatic implementations, and data manipulation.
6	OOP	Object-Oriented Design	Core CS	Encapsulation, Inheritance, Polymorphism, and SOLID principles.
7	DBMS	Database Management Systems	Core CS	Relational modeling, normalization, indexing, and ACID properties.
8	SQL	SQL Querying & Aggregation	Data Engineering	SELECT, WHERE, GROUP BY, HAVING, JOINs, subqueries, and window functions.
9	OS	Operating Systems	Core CS	Process scheduling, concurrency, virtual memory, and deadlock prevention.
10	NET	Computer Networks	Core CS	TCP/IP, HTTP/HTTPS, DNS, routing, and network sockets.
11	REST	Web & API Fundamentals	Software Engineering	RESTful architectures, idempotency, status codes, and microservices.
12	GIT	Version Control & Git	Software Engineering	Branching, merging, rebasing, and conflict resolution.
13	DEBUG	Root-Cause Diagnosis & Bug Fixing	Problem Solving	Isolating runtime faults, boundary conditions, and logic errors.
14	OPTIM	Algorithmic Optimization	Problem Solving	Refactoring asymptotic complexity from O(N^2) to O(N) or O(N log N).
15	CODE_QUAL	Code Quality & Clean Architecture	Software Engineering	Modularity, naming conventions, and defensive programming.
16	WRITTEN_ENG	Written English Proficiency	Communication	Grammar, syntax, spelling, punctuation, and clear sentence construction.
17	CHAT_COMM	Professional Chat Communication	Communication	Tone, conciseness, natural flow, appropriate greetings, and avoiding robotic replies.
18	TYPING_WPM	Typing Speed & Accuracy	Operations	Net WPM, Gross WPM, accuracy rate, and keystroke error frequency.
19	CUST_UNDERSTAND	Customer Understanding	Customer Experience	Identifying root cause problems instead of only reacting to keywords.
20	EMPATHY_EQ	Empathy & Emotional Intelligence	Customer Experience	Recognizing frustration, anxiety, confusion, and urgency in customer messages.
21	DE_ESCALATE	Conflict Resolution & De-escalation	Customer Experience	Handling angry customers, threats to cancel/chargeback, and negative review risks.
22	OWNERSHIP	Ownership & Resolution Mindset	Customer Experience	Demonstrating personal responsibility and proactive problem investigation.
23	SOP_ADHERENCE	SOP & Policy Adherence	Operations	Strict adherence to company standard operating procedures without improvising.
24	KB_NAV	Knowledge Base Navigation	Operations	Efficiently searching and finding applicable Help Center policy articles.
25	DECISION_MAKING	Decision Making & Case Resolution	Operations	Evaluating options: resolve, verify identity, escalate, or reject with policy.
26	SLA_MGMT	Response Timing & SLA Management	Operations	Meeting first response SLAs, queue prioritization, and handling response delays.
27	MULTI_CHAT	Concurrent Multi-Chat Handling	Operations	Managing multiple active conversations simultaneously without context switching errors.
28	DATA_PROTECT	Customer Data Protection & Security	Risk & Compliance	Ensuring sensitive data (passwords, OTPs, CVVs, full cards) are never exposed or asked.
29	DOC_ESCALATION	Escalation & Ticket Documentation	Risk & Compliance	Accurate ticket categorization, priority tagging, internal notes, and supervisor handoffs.
30	ANALYTICAL_PS	Analytical & Numerical Problem Solving	Aptitude	Logical deduction, ratio calculations, averages, numerical trends, and business reasoning.
31	DATA_INTERPRETATION	Data Interpretation & Trends	Aptitude	Chart interpretation, percentage growth, ratios, and outlier detection.
32	INFO_SEC	Information Security & Data Asset Protection	Compliance	Implementing security policies, protecting data assets, and adherence to access controls.
33	SQL_QUERY	SQL Querying & Aggregation	Core Database	Multi-table JOINs, subqueries, CTEs, GROUP BY, HAVING, and window functions.
34	DATA_EXTRACT	Multi-Source Data Extraction	Core Database	Extracting and wrangling data across SQL, Excel dumps, Access DBs, CSV, and text logs.
35	EXCEL_ADV	Advanced Excel Functions & Formulas	Spreadsheets	XLOOKUP, VLOOKUP, INDEX/MATCH, SUMIFS, COUNTIFS, Pivot Tables, and formula auditing.
36	VB_MACROS	VBA Scripting & Macro Automation	Spreadsheets	Writing VBA scripts, loops, conditional logic, worksheet automation, and macro debugging.
37	TABLEAU_VIZ	Tableau & Business Dashboards	Visualization	Dimensions, measures, KPI indicators, filters, chart selection, and interactive dashboard design.
38	PYTHON_ANALYTICS	Python for Data Analytics	Programming	Pandas DataFrames, Series, NumPy arrays, groupby, merge, loc/iloc, and missing value handling.
39	BUSINESS_COMM	Stakeholder Communication & Technical Writing	Communication	English writing command, executive reporting, concise analytical findings, and tech blog publishing.
40	PROJECT_OWNERSHIP	Candidate Project Understanding	Project Assessment	Articulating project objectives, dataset lineage, tool stack, and candidate specific contribution.
41	PROJECT_TECHNICAL	Project Technical Decision-Making	Project Assessment	Defending analytical decisions, metric selection, anomaly investigation, and business recommendations.
42	ANALYTICAL_REASONING	Analytical & Logical Reasoning	Aptitude	Quantitative reasoning, numerical deductions, and pattern identification.
43	EXCEL	Microsoft Excel & Formulas	Analytics Tools	XLOOKUP, VLOOKUP, INDEX+MATCH, IF, SUMIFS, and COUNTIFS.
44	EXCEL_PIVOT	Pivot Tables & Data Cleaning	Analytics Tools	Pivot Tables, Pivot Charts, data validation, and deduplication.
45	EXCEL_VBA_AWARENESS	Excel Macros & VBA Awareness	Analytics Tools	Understanding Macro automation and basic VBA logic in Excel.
46	DATA_EXTRACTION	Multi-Source Data Extraction	Data Engineering	Extracting and combining data from CSV, SQL, Excel, Access, and Text files.
47	PYTHON	Python Core Concepts	Programming	Data types, structures, loops, functions, and list comprehensions.
48	PYTHON_DATA_ANALYSIS	Python for Analytics	Programming	Pandas DataFrames, NumPy array ops, filtering, and grouping.
49	TABLEAU	Tableau & Dashboarding	Visualization	Data connections, dimensions, measures, filters, and KPI cards.
50	DATA_VISUALIZATION	Data Visualization Best Practices	Visualization	Chart selection, visual hierarchy, and avoiding misleading charts.
51	BUSINESS_ANALYSIS	Business Case & Interpretation	Business Intelligence	Translating data observations into business recommendations.
52	PROJECT_UNDERSTANDING	Candidate Project Understanding	Technical Validation	Demonstrating deep conceptual understanding of submitted projects.
53	COMMUNICATION	Technical & Professional Communication	Communication	Explaining findings clearly with accurate technical vocabulary.
70	APT_NUM	Numerical Reasoning & Arithmetic Basics	Aptitude	Foundational arithmetic, ratios, percentages, time-speed-distance, and algebraic calculations.
71	APT_LOGIC	Logical Deductions & Series Patterns	Aptitude	Sequence deduction, syllogisms, pattern extrapolation, and relationship reasoning.
72	APT_ALGO	Flow Logic & Algorithmic Deductions	Aptitude	Flowchart logic, condition trees, and loop execution deduction.
73	C_SYNTAX	C Core Syntax & Control Flow	Core Programming	Variables, data types, operators, conditionals, iteration, and preprocessor directives.
74	C_POINTERS	Pointer Arithmetic & Memory Addressing	Systems Programming	Pointer dereferencing, double pointers, array-pointer duality, and address math.
75	C_STRUCTS	Structures, Unions & Bitfields	Systems Programming	Composite structures, alignment, memory layout, unions, and bitfields.
76	C_ALGO	Dynamic Memory & Data Structures in C	Data Structures	malloc/calloc/free heap management, strings, dynamic arrays, and linked lists in C.
77	C_DEBUG	C Memory Safety & Segfault Diagnosis	Debugging & Quality	Fixing segmentation faults, dangling pointers, buffer overflows, and memory leaks.
\.


--
-- Data for Name: competency_scores; Type: TABLE DATA; Schema: public; Owner: nasc_admin
--

COPY public.competency_scores (id, attempt_id, competency_id, score, max_score, percentage, readiness_level) FROM stdin;
62	64	70	1	7	14.29	Needs Improvement
63	64	71	0	6	0	Needs Improvement
64	64	72	0	2	0	Needs Improvement
65	62	72	2	2	100	Advanced
66	62	70	0	7	0	Needs Improvement
67	62	71	1	6	16.67	Needs Improvement
107	101	71	0	6	0	Needs Improvement
108	101	70	0	7	0	Needs Improvement
109	101	72	0	2	0	Needs Improvement
113	102	71	2	6	33.33	Needs Improvement
114	102	70	0	7	0	Needs Improvement
115	102	72	0	2	0	Needs Improvement
116	104	70	0	7	0	Needs Improvement
117	104	71	0	6	0	Needs Improvement
118	104	72	0	2	0	Needs Improvement
122	111	70	7	7	100	Advanced
123	111	71	6	6	100	Advanced
124	111	72	2	2	100	Advanced
125	112	70	0	7	0	Needs Improvement
126	112	71	0	6	0	Needs Improvement
127	112	72	0	2	0	Needs Improvement
128	113	70	0	7	0	Needs Improvement
129	113	71	0	6	0	Needs Improvement
130	113	72	0	2	0	Needs Improvement
131	114	70	7	7	100	Advanced
132	114	71	6	6	100	Advanced
133	114	72	2	2	100	Advanced
137	117	1	0	2	0	Needs Improvement
138	117	3	0	2	0	Needs Improvement
139	117	2	0	2	0	Needs Improvement
140	119	1	0	2	0	Needs Improvement
141	119	3	0	2	0	Needs Improvement
142	119	2	0	2	0	Needs Improvement
143	121	1	0	2	0	Needs Improvement
144	121	3	0	2	0	Needs Improvement
145	121	2	0	2	0	Needs Improvement
149	125	1	0	2	0	Needs Improvement
150	125	3	0	2	0	Needs Improvement
151	125	2	0	2	0	Needs Improvement
174	134	30	0	1	0	Needs Improvement
175	134	31	10	21	47.62	Needs Improvement
176	134	32	1	2	50	Developing
177	134	39	0	1	0	Needs Improvement
178	134	42	0	20	0	Needs Improvement
188	136	71	0	6	0	Needs Improvement
189	136	72	0	2	0	Needs Improvement
190	136	70	0	7	0	Needs Improvement
191	169	1	2	2	100	Advanced
192	169	3	2	2	100	Advanced
193	169	2	2	2	100	Advanced
197	176	30	1	1	100	Advanced
198	176	31	0	21	0	Needs Improvement
199	176	32	0	2	0	Needs Improvement
200	176	39	0	1	0	Needs Improvement
201	176	42	0	20	0	Needs Improvement
202	33	1	0	2	0	Needs Improvement
203	33	3	0	2	0	Needs Improvement
204	33	2	0	2	0	Needs Improvement
205	127	30	0	1	0	Needs Improvement
206	127	31	0	21	0	Needs Improvement
207	127	32	0	2	0	Needs Improvement
208	127	39	0	1	0	Needs Improvement
209	127	42	0	20	0	Needs Improvement
210	131	1	0	2	0	Needs Improvement
211	131	3	0	2	0	Needs Improvement
212	131	2	0	2	0	Needs Improvement
213	178	1	0	2	0	Needs Improvement
214	178	3	0	2	0	Needs Improvement
215	178	2	0	2	0	Needs Improvement
\.


--
-- Data for Name: course_allocations; Type: TABLE DATA; Schema: public; Owner: nasc_admin
--

COPY public.course_allocations (id, faculty_id, course_id, academic_year, semester_num, section_name, batch_name) FROM stdin;
1	\N	3	2025-2026	3	A	2025-2028
2	\N	2	2025-2026	3	A	2025-2028
3	6	4	2025-2026	3	A	2023-2026
\.


--
-- Data for Name: course_enrolments; Type: TABLE DATA; Schema: public; Owner: nasc_admin
--

COPY public.course_enrolments (id, student_id, course_id, academic_year) FROM stdin;
1	\N	1	2025-2026
2	\N	1	2025-2026
3	1	2	2025-2026
4	1	3	2025-2026
5	2	2	2025-2026
6	2	3	2025-2026
7	3	2	2025-2026
8	3	3	2025-2026
9	4	2	2025-2026
10	4	3	2025-2026
11	5	2	2025-2026
12	5	3	2025-2026
13	6	2	2025-2026
14	6	3	2025-2026
15	7	2	2025-2026
16	7	3	2025-2026
17	8	2	2025-2026
18	8	3	2025-2026
19	9	2	2025-2026
20	9	3	2025-2026
21	10	2	2025-2026
22	10	3	2025-2026
23	11	2	2025-2026
24	11	3	2025-2026
25	12	2	2025-2026
26	12	3	2025-2026
27	13	2	2025-2026
28	13	3	2025-2026
29	14	2	2025-2026
30	14	3	2025-2026
31	15	2	2025-2026
32	15	3	2025-2026
33	16	2	2025-2026
34	16	3	2025-2026
35	17	2	2025-2026
36	17	3	2025-2026
37	18	2	2025-2026
38	18	3	2025-2026
39	19	2	2025-2026
40	19	3	2025-2026
41	20	2	2025-2026
42	20	3	2025-2026
43	21	2	2025-2026
44	21	3	2025-2026
45	22	2	2025-2026
46	22	3	2025-2026
47	23	2	2025-2026
48	23	3	2025-2026
49	24	2	2025-2026
50	24	3	2025-2026
51	25	2	2025-2026
52	25	3	2025-2026
53	26	2	2025-2026
54	26	3	2025-2026
55	27	2	2025-2026
56	27	3	2025-2026
57	28	2	2025-2026
58	28	3	2025-2026
59	29	2	2025-2026
60	29	3	2025-2026
61	30	2	2025-2026
62	30	3	2025-2026
63	31	2	2025-2026
64	31	3	2025-2026
65	32	2	2025-2026
66	32	3	2025-2026
67	33	2	2025-2026
68	33	3	2025-2026
69	34	2	2025-2026
70	34	3	2025-2026
71	35	2	2025-2026
72	35	3	2025-2026
73	36	2	2025-2026
74	36	3	2025-2026
75	37	2	2025-2026
76	37	3	2025-2026
77	38	2	2025-2026
78	38	3	2025-2026
79	39	2	2025-2026
80	39	3	2025-2026
81	40	2	2025-2026
82	40	3	2025-2026
83	41	2	2025-2026
84	41	3	2025-2026
85	42	2	2025-2026
86	42	3	2025-2026
87	43	2	2025-2026
88	43	3	2025-2026
89	44	2	2025-2026
90	44	3	2025-2026
91	45	2	2025-2026
92	45	3	2025-2026
93	46	2	2025-2026
94	46	3	2025-2026
95	47	2	2025-2026
96	47	3	2025-2026
\.


--
-- Data for Name: courses; Type: TABLE DATA; Schema: public; Owner: nasc_admin
--

COPY public.courses (id, code, title, course_type, credits, semester_num, regulation, programme_id) FROM stdin;
1	23BCA401-DSA	Data Structures & Advanced Algorithms	Theory + Practical	4	4	2023	1
2	25U5CIC303	Python Programming	Theory	4	3	2025	2
3	23U5CIC310	Visual Analytics and reporting	Practical	4	3	2025	2
4	23IOT012	Artificial intelligence	Theory	4	3	2024	3
\.


--
-- Data for Name: departments; Type: TABLE DATA; Schema: public; Owner: nasc_admin
--

COPY public.departments (id, code, name, school_id, hod_id) FROM stdin;
2	CS	Computer Science	\N	\N
3	AI	Artificial Intelligence	\N	\N
4	IOT & AIML	Department of IOT and AIML	\N	5
\.


--
-- Data for Name: faculty; Type: TABLE DATA; Schema: public; Owner: nasc_admin
--

COPY public.faculty (id, user_id, employee_id, designation, department_id, status, assigned_programme_id, assigned_batch, assigned_section) FROM stdin;
3	4	hod_test1	Head of Department (HoD)	2	Active	\N	\N	\N
5	53	eid	Head of Department (HoD)	4	Active	\N	\N	\N
6	54	e6505	Assistant Professor	4	Active	\N	\N	\N
7	55	e6504	Class Tutor	4	Active	3	2024-2027	A
4	5	hod_test2	Head of Department (HoD)	\N	Active	\N	\N	\N
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: nasc_admin
--

COPY public.notifications (id, user_id, title, message, type, is_read, created_at) FROM stdin;
3	6	Attempt 2 Request APPROVED	Your request for Attempt 2 (Round 1: Cognitive & Software Aptitude) was APPROVED by your Class Tutor.	success	f	2026-08-20 16:34:12.85396
4	6	Attempt 2 Request APPROVED	Your request for Attempt 2 (Round 1: Cognitive & Software Aptitude) was APPROVED by your Class Tutor.	success	f	2026-08-20 16:34:27.375873
56	6	Attempt 2 Request APPROVED	Your request for Attempt 2 (Round 1: Foundational Quantitative & Logical Aptitude) was APPROVED by your Class Tutor.	success	f	2026-08-23 07:39:09.272242
36	55	Attempt 2 Request: Mr.Nithish kumar	Student Mr.Nithish kumar (23pgdt005) requested Attempt 2 for Round 1: Cognitive & Software Aptitude.	info	t	2026-08-21 13:37:30.167843
37	53	New Assessment Activation Request	Tutor Mr.S Nithish Kumar requested track 'C & Systems Programming Master Track' for 2024-2027 BSC IOT Section A (1 candidates).	info	f	2026-08-23 03:42:58.510304
39	55	Assessment Request Approved	Your activation request for 2024-2027 BSC IOT Section A (C & Systems Programming Master Track) was APPROVED by HoD.	success	f	2026-08-23 03:43:23.576787
41	55	Attempt 2 Request: Mr.Nithish kumar	Student Mr.Nithish kumar (23pgdt005) requested Attempt 2 for Round 1: Foundational Quantitative & Logical Aptitude.	info	f	2026-08-23 04:07:24.025035
2	56	Evaluation Result: Round 1: Cognitive & Software Aptitude	Your submission for Software Development - Round 1: Cognitive & Software Aptitude was evaluated: Score 0.0% (NEEDS IMPROVEMENT).	info	t	2026-08-20 16:07:37.92395
38	56	New Assessment Track Allocated	You have been allocated to Corporate Assessment Track: C & Systems Programming Master Track. Go to My Assessment Tracks to begin.	success	t	2026-08-23 03:43:23.576787
40	56	Evaluation Result: Round 1: Foundational Quantitative & Logical Aptitude	Your submission for C & Systems Programming Master Track - Round 1: Foundational Quantitative & Logical Aptitude was evaluated: Score 20.0% (NEEDS IMPROVEMENT).	info	t	2026-08-23 03:57:38.337394
42	56	Attempt 2 Request APPROVED	Your request for Attempt 2 (Round 1: Foundational Quantitative & Logical Aptitude) was APPROVED by your Class Tutor.	success	f	2026-08-23 04:10:30.686066
43	55	Attempt 2 Request: Mr.Nithish kumar	Student Mr.Nithish kumar (23pgdt005) requested Attempt 2 for Round 1: Foundational Quantitative & Logical Aptitude.	info	t	2026-08-23 04:12:43.059394
45	6	Attempt 2 Request REJECTED	Your request for Attempt 2 (Round 1: Foundational Quantitative & Logical Aptitude) was REJECTED by your Class Tutor.	warning	f	2026-08-23 04:13:31.953788
44	56	Attempt 2 Request APPROVED	Your request for Attempt 2 (Round 1: Foundational Quantitative & Logical Aptitude) was APPROVED by your Class Tutor.	success	t	2026-08-23 04:13:27.095507
46	56	Attempt 2 Request REJECTED	Your request for Attempt 2 (Round 1: Cognitive & Software Aptitude) was REJECTED by your Class Tutor.	warning	t	2026-08-23 04:13:34.335526
47	53	New Assessment Activation Request	Tutor Mr.S Nithish Kumar requested track 'C & Systems Programming Master Track' for 2024-2027 BSC IOT Section A (1 candidates).	info	t	2026-08-23 06:52:57.224859
48	56	New Assessment Track Allocated	You have been allocated to Corporate Assessment Track: Software Development. Go to My Assessment Tracks to begin.	success	f	2026-08-23 06:53:27.266503
50	58	New Assessment Track Allocated	You have been allocated to Corporate Assessment Track: C & Systems Programming Master Track. Go to My Assessment Tracks to begin.	success	t	2026-08-23 06:53:41.17597
52	58	Evaluation Result: Round 1: Foundational Quantitative & Logical Aptitude	Your submission for C & Systems Programming Master Track - Round 1: Foundational Quantitative & Logical Aptitude was evaluated: Score 13.33% (NEEDS IMPROVEMENT).	info	f	2026-08-23 06:59:20.557266
51	55	Assessment Request Approved	Your activation request for 2024-2027 BSC IOT Section A (C & Systems Programming Master Track) was APPROVED by HoD.	success	t	2026-08-23 06:53:41.17597
54	58	Attempt 2 Request APPROVED	Your request for Attempt 2 (Round 1: Foundational Quantitative & Logical Aptitude) was APPROVED by your Class Tutor.	success	f	2026-08-23 07:03:38.676566
53	55	Attempt 2 Request: stud	Student stud (stud1) requested Attempt 2 for Round 1: Foundational Quantitative & Logical Aptitude.	info	t	2026-08-23 07:02:33.315621
55	7	Evaluation Result: Round 1: Foundational Quantitative & Logical Aptitude	Your submission for C & Systems Programming Master Track - Round 1: Foundational Quantitative & Logical Aptitude was evaluated: Score 6.67% (NEEDS IMPROVEMENT).	info	f	2026-08-23 07:29:46.572023
57	6	Evaluation Result: Round 1: Foundational Quantitative & Logical Aptitude	Your submission for C & Systems Programming Master Track - Round 1: Foundational Quantitative & Logical Aptitude was evaluated: Score 0.0% (NEEDS IMPROVEMENT).	info	f	2026-08-23 10:07:02.697602
58	8	Evaluation Result: Round 1: Foundational Quantitative & Logical Aptitude	Your submission for C & Systems Programming Master Track - Round 1: Foundational Quantitative & Logical Aptitude was evaluated: Score 0.0% (NEEDS IMPROVEMENT).	info	f	2026-08-23 10:11:10.645763
61	56	New Assessment Track Allocated	You have been allocated to Corporate Assessment Track: Software Development. Go to My Assessment Tracks to begin.	success	f	2026-08-23 10:28:38.694378
62	58	New Assessment Track Allocated	You have been allocated to Corporate Assessment Track: Software Development. Go to My Assessment Tracks to begin.	success	f	2026-08-23 10:28:38.694378
64	56	New Assessment Track Allocated	You have been allocated to Corporate Assessment Track: C & Systems Programming Master Track. Go to My Assessment Tracks to begin.	success	t	2026-08-23 10:28:44.642989
67	58	Evaluation Result: Round 1: Cognitive & Software Aptitude	Your submission for Software Development - Round 1: Cognitive & Software Aptitude was evaluated: Score 0.0% (NEEDS IMPROVEMENT).	info	f	2026-08-23 12:15:49.041323
65	58	New Assessment Track Allocated	You have been allocated to Corporate Assessment Track: C & Systems Programming Master Track. Go to My Assessment Tracks to begin.	success	t	2026-08-23 10:28:44.642989
60	53	New Assessment Activation Request	Tutor Mr.S Nithish Kumar requested track 'Software Development' for 2024-2027 BSC IOT Section A (2 candidates).	info	t	2026-08-23 10:15:13.968788
59	53	New Assessment Activation Request	Tutor Mr.S Nithish Kumar requested track 'C & Systems Programming Master Track' for 2024-2027 BSC IOT Section A (2 candidates).	info	t	2026-08-23 10:15:07.76108
63	55	Assessment Request Approved	Your activation request for 2024-2027 BSC IOT Section A (Software Development) was APPROVED by HoD.	success	t	2026-08-23 10:28:38.694378
49	55	Assessment Request Approved	Your activation request for 2024-2027 BSC IOT Section A (Software Development) was APPROVED by HoD.	success	t	2026-08-23 06:53:27.266503
68	53	New Assessment Activation Request	Tutor Mr.S Nithish Kumar requested track 'Data Analyst & Business Intelligence' for 2024-2027 BSC IOT Section A (2 candidates).	info	t	2026-08-23 12:47:18.68303
70	58	New Assessment Track Allocated	You have been allocated to Corporate Assessment Track: Data Analyst & Business Intelligence. Go to My Assessment Tracks to begin.	success	f	2026-08-23 12:48:11.739821
71	55	Assessment Request Approved	Your activation request for 2024-2027 BSC IOT Section A (Data Analyst & Business Intelligence) was APPROVED by HoD.	success	t	2026-08-23 12:48:11.739821
66	55	Assessment Request Approved	Your activation request for 2024-2027 BSC IOT Section A (C & Systems Programming Master Track) was APPROVED by HoD.	success	t	2026-08-23 10:28:44.642989
69	56	New Assessment Track Allocated	You have been allocated to Corporate Assessment Track: Data Analyst & Business Intelligence. Go to My Assessment Tracks to begin.	success	t	2026-08-23 12:48:11.739821
72	53	New Assessment Activation Request	Tutor Mr.S Nithish Kumar requested track 'Software Development' for 2024-2027 BSC IOT Section A (2 candidates).	info	f	2026-08-27 15:05:35.332582
73	53	New Assessment Activation Request	Tutor Mr.S Nithish Kumar requested track 'C & Systems Programming Master Track' for 2024-2027 BSC IOT Section A (2 candidates).	info	f	2026-08-27 15:05:42.006005
74	53	New Assessment Activation Request	Tutor Mr.S Nithish Kumar requested track 'Data Analyst & Business Intelligence' for 2024-2027 BSC IOT Section A (2 candidates).	info	f	2026-08-27 15:05:48.261492
76	56	New Assessment Track Allocated	You have been allocated to Corporate Assessment Track: Chat Process Executive — International Post-Sales Support. Go to My Assessment Tracks to begin.	success	f	2026-08-27 15:06:38.364217
77	58	New Assessment Track Allocated	You have been allocated to Corporate Assessment Track: Chat Process Executive — International Post-Sales Support. Go to My Assessment Tracks to begin.	success	f	2026-08-27 15:06:38.364217
78	55	Assessment Request Approved	Your activation request for 2024-2027 BSC IOT Section A (Chat Process Executive — International Post-Sales Support) was APPROVED by HoD.	success	f	2026-08-27 15:06:38.364217
79	56	New Assessment Track Allocated	You have been allocated to Corporate Assessment Track: Data Analyst & Business Intelligence. Go to My Assessment Tracks to begin.	success	f	2026-08-27 15:06:43.083472
80	58	New Assessment Track Allocated	You have been allocated to Corporate Assessment Track: Data Analyst & Business Intelligence. Go to My Assessment Tracks to begin.	success	f	2026-08-27 15:06:43.083472
81	55	Assessment Request Approved	Your activation request for 2024-2027 BSC IOT Section A (Data Analyst & Business Intelligence) was APPROVED by HoD.	success	f	2026-08-27 15:06:43.083472
82	56	New Assessment Track Allocated	You have been allocated to Corporate Assessment Track: C & Systems Programming Master Track. Go to My Assessment Tracks to begin.	success	f	2026-08-27 15:06:47.843399
83	58	New Assessment Track Allocated	You have been allocated to Corporate Assessment Track: C & Systems Programming Master Track. Go to My Assessment Tracks to begin.	success	f	2026-08-27 15:06:47.843399
84	55	Assessment Request Approved	Your activation request for 2024-2027 BSC IOT Section A (C & Systems Programming Master Track) was APPROVED by HoD.	success	f	2026-08-27 15:06:47.843399
85	56	New Assessment Track Allocated	You have been allocated to Corporate Assessment Track: Software Development. Go to My Assessment Tracks to begin.	success	f	2026-08-27 15:06:51.573371
86	58	New Assessment Track Allocated	You have been allocated to Corporate Assessment Track: Software Development. Go to My Assessment Tracks to begin.	success	f	2026-08-27 15:06:51.573371
88	56	Evaluation Result: Round 1: Written Communication & Typing	Your submission for Chat Process Executive — International Post-Sales Support - Round 1: Written Communication & Typing was evaluated: Score 0.0% (NEEDS IMPROVEMENT).	info	f	2026-08-27 15:30:53.005597
89	56	Evaluation Result: Round 1: Analytical & Data Interpretation	Your submission for Data Analyst & Business Intelligence - Round 1: Analytical & Data Interpretation was evaluated: Score 24.44% (NEEDS IMPROVEMENT).	info	f	2026-08-27 16:08:16.694938
90	53	New Assessment Activation Request	Tutor Mr.S Nithish Kumar requested track 'Software Development' for 2024-2027 BSC IOT Section A (2 candidates).	info	f	2026-09-03 15:33:01.946336
91	56	New Assessment Track Allocated	You have been allocated to Corporate Assessment Track: Software Development. Go to My Assessment Tracks to begin.	success	f	2026-09-05 15:33:28.37361
92	58	New Assessment Track Allocated	You have been allocated to Corporate Assessment Track: Software Development. Go to My Assessment Tracks to begin.	success	f	2026-09-05 15:33:28.37361
93	55	Assessment Request Approved	Your activation request for 2024-2027 BSC IOT Section A (Software Development) was APPROVED by HoD.	success	f	2026-09-05 15:33:28.37361
75	53	New Assessment Activation Request	Tutor Mr.S Nithish Kumar requested track 'Chat Process Executive — International Post-Sales Support' for 2024-2027 BSC IOT Section A (2 candidates).	info	t	2026-08-27 15:05:56.654668
87	55	Assessment Request Approved	Your activation request for 2024-2027 BSC IOT Section A (Software Development) was APPROVED by HoD.	success	t	2026-08-27 15:06:51.573371
\.


--
-- Data for Name: obe_attainment_records; Type: TABLE DATA; Schema: public; Owner: nasc_admin
--

COPY public.obe_attainment_records (id, candidate_result_id, student_id, competency_id, course_outcome_code, program_outcome_code, attainment_percentage, created_at) FROM stdin;
\.


--
-- Data for Name: proctoring_events; Type: TABLE DATA; Schema: public; Owner: nasc_admin
--

COPY public.proctoring_events (id, session_id, event_type, severity, metadata_json, snapshot_url, created_at) FROM stdin;
\.


--
-- Data for Name: programmes; Type: TABLE DATA; Schema: public; Owner: nasc_admin
--

COPY public.programmes (id, code, name, degree_type, department_id, duration_years) FROM stdin;
1	BCA-AI	Bachelor of Computer Applications in AI	UG	2	3
3	BSCIOT	Bachelor of IOT	UG	4	3
2	B.COM IT	Bachelor of Commerce Information technology	UG	\N	3
\.


--
-- Data for Name: question_evaluation_configs; Type: TABLE DATA; Schema: public; Owner: nasc_admin
--

COPY public.question_evaluation_configs (id, question_id, evaluation_type, correct_answer, reference_solution, public_test_cases_json, hidden_test_cases_json, scoring_rules_json, created_at, updated_at) FROM stdin;
1	1	ExactMatch	1	\N	[]	[]	{"marks_per_case": 2.0}	2026-08-20 13:59:34.094749	2026-08-20 13:59:34.094749
2	2	ExactMatch	2	\N	[]	[]	{"marks_per_case": 2.0}	2026-08-20 13:59:34.109578	2026-08-20 13:59:34.109578
3	3	ExactMatch	2	\N	[]	[]	{"marks_per_case": 2.0}	2026-08-20 13:59:34.115539	2026-08-20 13:59:34.115539
4	4	SandboxTestRunner	import sys\ndef solve():\n    lines = sys.stdin.read().splitlines()\n    if not lines: return\n    nums = list(map(int, lines[0].split()))\n    target = int(lines[1].strip())\n    seen = {}\n    for i, n in enumerate(nums):\n        diff = target - n\n        if diff in seen:\n            print(f"{seen[diff]} {i}")\n            return\n        seen[n] = i\nif __name__ == '__main__':\n    solve()\n	import sys\ndef solve():\n    lines = sys.stdin.read().splitlines()\n    if not lines: return\n    nums = list(map(int, lines[0].split()))\n    target = int(lines[1].strip())\n    seen = {}\n    for i, n in enumerate(nums):\n        diff = target - n\n        if diff in seen:\n            print(f"{seen[diff]} {i}")\n            return\n        seen[n] = i\nif __name__ == '__main__':\n    solve()\n	[{"input": "2 7 11 15\\n9", "expected_output": "0 1"}, {"input": "3 2 4\\n6", "expected_output": "1 2"}]	[{"input": "3 3\\n6", "expected_output": "0 1"}, {"input": "1 5 8 12 19 25\\n27", "expected_output": "2 4"}, {"input": "-10 -5 0 5 10\\n0", "expected_output": "0 4"}]	{"marks_per_case": 4.0}	2026-08-20 13:59:34.129651	2026-08-20 13:59:34.129651
5	5	SandboxTestRunner	import sys\ndef solve():\n    lines = sys.stdin.read().splitlines()\n    if len(lines) < 2: return\n    s, t = lines[0].strip(), lines[1].strip()\n    print("true" if sorted(s) == sorted(t) else "false")\nif __name__ == '__main__':\n    solve()\n	import sys\ndef solve():\n    lines = sys.stdin.read().splitlines()\n    if len(lines) < 2: return\n    s, t = lines[0].strip(), lines[1].strip()\n    print("true" if sorted(s) == sorted(t) else "false")\nif __name__ == '__main__':\n    solve()\n	[{"input": "anagram\\nnagaram", "expected_output": "true"}, {"input": "rat\\ncar", "expected_output": "false"}]	[{"input": "listen\\nsilent", "expected_output": "true"}, {"input": "hello\\nworld", "expected_output": "false"}]	{"marks_per_case": 3.75}	2026-08-20 13:59:34.136221	2026-08-20 13:59:34.136221
6	6	ExactMatch	2	\N	[]	[]	{"marks_per_case": 2.0}	2026-08-20 13:59:34.149852	2026-08-20 13:59:34.149852
7	7	ExactMatch	3	\N	[]	[]	{"marks_per_case": 2.0}	2026-08-20 13:59:34.16184	2026-08-20 13:59:34.16184
8	8	ExactMatch	3	\N	[]	[]	{"marks_per_case": 2.0}	2026-08-20 13:59:34.169721	2026-08-20 13:59:34.169721
9	9	SandboxTestRunner	import sys\ndef binary_search(arr, target):\n    l, r = 0, len(arr) - 1\n    while l <= r:\n        mid = (l + r) // 2\n        if arr[mid] == target: return mid\n        elif arr[mid] < target: l = mid + 1\n        else: r = mid - 1\n    return -1\n\ndef solve():\n    lines = sys.stdin.read().splitlines()\n    if not lines: return\n    arr = list(map(int, lines[0].split()))\n    target = int(lines[1].strip())\n    print(binary_search(arr, target))\nif __name__ == '__main__':\n    solve()\n	import sys\ndef binary_search(arr, target):\n    l, r = 0, len(arr) - 1\n    while l <= r:\n        mid = (l + r) // 2\n        if arr[mid] == target: return mid\n        elif arr[mid] < target: l = mid + 1\n        else: r = mid - 1\n    return -1\n\ndef solve():\n    lines = sys.stdin.read().splitlines()\n    if not lines: return\n    arr = list(map(int, lines[0].split()))\n    target = int(lines[1].strip())\n    print(binary_search(arr, target))\nif __name__ == '__main__':\n    solve()\n	[{"input": "1 3 5 7 9\\n5", "expected_output": "2"}, {"input": "1 3 5 7 9\\n2", "expected_output": "-1"}]	[{"input": "10\\n10", "expected_output": "0"}, {"input": "2 4 6 8 10 12 14 16\\n16", "expected_output": "7"}, {"input": "2 4 6 8 10 12 14 16\\n1", "expected_output": "-1"}]	{"marks_per_case": 3.0}	2026-08-20 13:59:34.183075	2026-08-20 13:59:34.183075
10	10	ExactMatch	2	2	[]	[]	{"competency": "WRITTEN_ENG"}	2026-08-20 13:59:34.199658	2026-08-20 13:59:34.199658
11	11	ExactMatch	3	3	[]	[]	{"competency": "WRITTEN_ENG"}	2026-08-20 13:59:34.205607	2026-08-20 13:59:34.205607
12	12	ExactMatch	2	2	[]	[]	{"competency": "WRITTEN_ENG"}	2026-08-20 13:59:34.209834	2026-08-20 13:59:34.209834
13	13	ExactMatch	1	1	[]	[]	{"competency": "WRITTEN_ENG"}	2026-08-20 13:59:34.219682	2026-08-20 13:59:34.219682
14	14	ExactMatch	2	2	[]	[]	{"competency": "WRITTEN_ENG"}	2026-08-20 13:59:34.229486	2026-08-20 13:59:34.229486
15	15	ExactMatch	2	2	[]	[]	{"competency": "CHAT_COMM"}	2026-08-20 13:59:34.229486	2026-08-20 13:59:34.229486
16	16	ExactMatch	2	2	[]	[]	{"competency": "CHAT_COMM"}	2026-08-20 13:59:34.244489	2026-08-20 13:59:34.244489
17	17	ExactMatch	2	2	[]	[]	{"competency": "WRITTEN_ENG"}	2026-08-20 13:59:34.250336	2026-08-20 13:59:34.250336
18	18	ExactMatch	2	2	[]	[]	{"competency": "OWNERSHIP"}	2026-08-20 13:59:34.250336	2026-08-20 13:59:34.250336
19	19	ExactMatch	2	2	[]	[]	{"competency": "WRITTEN_ENG"}	2026-08-20 13:59:34.265894	2026-08-20 13:59:34.265894
20	20	ExactMatch	2	2	[]	[]	{"competency": "WRITTEN_ENG"}	2026-08-20 13:59:34.271011	2026-08-20 13:59:34.271011
21	21	ExactMatch	2	2	[]	[]	{"competency": "CHAT_COMM"}	2026-08-20 13:59:34.279589	2026-08-20 13:59:34.279589
22	22	ExactMatch	2	2	[]	[]	{"competency": "CHAT_COMM"}	2026-08-20 13:59:34.281113	2026-08-20 13:59:34.281113
23	23	ExactMatch	2	2	[]	[]	{"competency": "WRITTEN_ENG"}	2026-08-20 13:59:34.291352	2026-08-20 13:59:34.291352
24	24	ExactMatch	2	2	[]	[]	{"competency": "EMPATHY_EQ"}	2026-08-20 13:59:34.30642	2026-08-20 13:59:34.30642
25	25	ExactMatch	2	2	[]	[]	{"competency": "WRITTEN_ENG"}	2026-08-20 13:59:34.311628	2026-08-20 13:59:34.311628
26	26	ExactMatch	1	1	[]	[]	{"competency": "CHAT_COMM"}	2026-08-20 13:59:34.32993	2026-08-20 13:59:34.32993
27	27	ExactMatch	2	2	[]	[]	{"competency": "CHAT_COMM"}	2026-08-20 13:59:34.340183	2026-08-20 13:59:34.340183
28	28	ExactMatch	2	2	[]	[]	{"competency": "WRITTEN_ENG"}	2026-08-20 13:59:34.35174	2026-08-20 13:59:34.35174
29	29	ExactMatch	2	2	[]	[]	{"competency": "DE_ESCALATE"}	2026-08-20 13:59:34.36554	2026-08-20 13:59:34.36554
30	30	ExactMatch	2	2	[]	[]	{"competency": "CHAT_COMM"}	2026-08-20 13:59:34.377673	2026-08-20 13:59:34.377673
31	31	ExactMatch	2	2	[]	[]	{"competency": "DE_ESCALATE"}	2026-08-20 13:59:34.389504	2026-08-20 13:59:34.389504
32	32	ExactMatch	2	2	[]	[]	{"competency": "EMPATHY_EQ"}	2026-08-20 13:59:34.401021	2026-08-20 13:59:34.401021
33	33	ExactMatch	2	2	[]	[]	{"competency": "DATA_PROTECT"}	2026-08-20 13:59:34.412888	2026-08-20 13:59:34.412888
34	34	ExactMatch	2	2	[]	[]	{"competency": "DE_ESCALATE"}	2026-08-20 13:59:34.421365	2026-08-20 13:59:34.421365
35	35	ExactMatch	Thank you for contacting customer support today. I understand that your recent shipment has not arrived as scheduled, and I sincerely apologize for the inconvenience this delay has caused. I am currently reviewing your order details, tracking information, and warehouse logs to locate your package. Please rest assured that our priority is ensuring you receive your items safely and promptly. If the package cannot be located within twenty-four hours, we will be glad to arrange an expedited replacement or process a full refund to your original payment method.	Thank you for contacting customer support today. I understand that your recent shipment has not arrived as scheduled, and I sincerely apologize for the inconvenience this delay has caused. I am currently reviewing your order details, tracking information, and warehouse logs to locate your package. Please rest assured that our priority is ensuring you receive your items safely and promptly. If the package cannot be located within twenty-four hours, we will be glad to arrange an expedited replacement or process a full refund to your original payment method.	[]	[]	{"competency": "TYPING_WPM"}	2026-08-20 13:59:34.439404	2026-08-20 13:59:34.439404
36	36	ExactMatch	2	2	[]	[]	{"competency": "EMPATHY_EQ"}	2026-08-20 13:59:34.458703	2026-08-20 13:59:34.458703
37	37	ExactMatch	2	2	[]	[]	{"competency": "DE_ESCALATE"}	2026-08-20 13:59:34.466275	2026-08-20 13:59:34.466275
38	38	ExactMatch	2	2	[]	[]	{"competency": "OWNERSHIP"}	2026-08-20 13:59:34.469868	2026-08-20 13:59:34.469868
39	39	ExactMatch	2	2	[]	[]	{"competency": "DE_ESCALATE"}	2026-08-20 13:59:34.478159	2026-08-20 13:59:34.478159
40	40	ExactMatch	2	2	[]	[]	{"competency": "OWNERSHIP"}	2026-08-20 13:59:34.479677	2026-08-20 13:59:34.479677
41	41	ExactMatch	2	2	[]	[]	{"competency": "OWNERSHIP"}	2026-08-20 13:59:34.489802	2026-08-20 13:59:34.489802
42	42	ExactMatch	2	2	[]	[]	{"competency": "SOP_ADHERENCE"}	2026-08-20 13:59:34.492406	2026-08-20 13:59:34.492406
43	43	ExactMatch	2	2	[]	[]	{"competency": "DECISION_MAKING"}	2026-08-20 13:59:34.499764	2026-08-20 13:59:34.499764
44	44	ExactMatch	2	2	[]	[]	{"competency": "DATA_PROTECT"}	2026-08-20 13:59:34.509871	2026-08-20 13:59:34.509871
45	45	ExactMatch	2	2	[]	[]	{"competency": "DE_ESCALATE"}	2026-08-20 13:59:34.509871	2026-08-20 13:59:34.509871
46	46	ExactMatch	2	2	[]	[]	{"competency": "CHAT_COMM"}	2026-08-20 13:59:34.51974	2026-08-20 13:59:34.51974
47	47	ExactMatch	2	2	[]	[]	{"competency": "CUST_UNDERSTAND"}	2026-08-20 13:59:34.529628	2026-08-20 13:59:34.529628
48	48	ExactMatch	2	2	[]	[]	{"competency": "SOP_ADHERENCE"}	2026-08-20 13:59:34.542774	2026-08-20 13:59:34.542774
49	49	ExactMatch	2	2	[]	[]	{"competency": "DECISION_MAKING"}	2026-08-20 13:59:34.552868	2026-08-20 13:59:34.552868
50	50	ExactMatch	3	3	[]	[]	{"competency": "DATA_PROTECT"}	2026-08-20 13:59:34.560464	2026-08-20 13:59:34.560464
51	51	ExactMatch	2	2	[]	[]	{"competency": "DOC_ESCALATION"}	2026-08-20 13:59:34.566208	2026-08-20 13:59:34.566208
52	52	ExactMatch	2	2	[]	[]	{"competency": "SOP_ADHERENCE"}	2026-08-20 13:59:34.575012	2026-08-20 13:59:34.575012
53	53	ExactMatch	2	2	[]	[]	{"competency": "DECISION_MAKING"}	2026-08-20 13:59:34.580861	2026-08-20 13:59:34.580861
54	54	ExactMatch	2	2	[]	[]	{"competency": "DATA_PROTECT"}	2026-08-20 13:59:34.583699	2026-08-20 13:59:34.583699
55	55	ExactMatch	2	2	[]	[]	{"competency": "SOP_ADHERENCE"}	2026-08-20 13:59:34.592688	2026-08-20 13:59:34.592688
56	56	ExactMatch	2	2	[]	[]	{"competency": "KB_NAV"}	2026-08-20 13:59:34.601466	2026-08-20 13:59:34.601466
57	57	ExactMatch	2	2	[]	[]	{"competency": "DECISION_MAKING"}	2026-08-20 13:59:34.609835	2026-08-20 13:59:34.609835
58	58	ExactMatch	2	2	[]	[]	{"competency": "SOP_ADHERENCE"}	2026-08-20 13:59:34.611848	2026-08-20 13:59:34.611848
59	59	ExactMatch	2	2	[]	[]	{"competency": "KB_NAV"}	2026-08-20 13:59:34.622328	2026-08-20 13:59:34.622328
60	60	ExactMatch	2	2	[]	[]	{"competency": "DOC_ESCALATION"}	2026-08-20 13:59:34.629481	2026-08-20 13:59:34.629481
61	61	ExactMatch	2	2	[]	[]	{"competency": "DECISION_MAKING"}	2026-08-20 13:59:34.632768	2026-08-20 13:59:34.632768
62	62	ExactMatch	2	2	[]	[]	{"competency": "DOC_ESCALATION"}	2026-08-20 13:59:34.644909	2026-08-20 13:59:34.644909
63	63	ExactMatch	{"scenario_count": 3, "target_sla_adherence": 90.0}	{"scenario_count": 3, "target_sla_adherence": 90.0}	[]	[]	{"competency": "MULTI_CHAT"}	2026-08-20 13:59:34.666567	2026-08-20 13:59:34.666567
64	64	ExactMatch	A	\N	[]	[]	{}	2026-08-20 13:59:34.679757	2026-08-20 13:59:34.679757
65	65	ExactMatch	B	\N	[]	[]	{}	2026-08-20 13:59:34.691179	2026-08-20 13:59:34.691179
66	66	ExactMatch	B	\N	[]	[]	{}	2026-08-20 13:59:34.695013	2026-08-20 13:59:34.695013
67	67	ExactMatch	Rubric: Clear English, professional tone, data rationale, and 2 actionable recommendations.	\N	[]	[]	{}	2026-08-20 13:59:34.705425	2026-08-20 13:59:34.705425
68	68	ExactMatch	B	\N	[]	[]	{}	2026-08-20 13:59:34.709848	2026-08-20 13:59:34.709848
69	69	exact_match	B	\N	[]	[]	{}	2026-08-20 13:59:34.719696	2026-08-20 13:59:34.719696
70	70	exact_match	B	\N	[]	[]	{}	2026-08-20 13:59:34.72619	2026-08-20 13:59:34.72619
71	71	exact_match	B	\N	[]	[]	{}	2026-08-20 13:59:34.736613	2026-08-20 13:59:34.736613
72	72	ai_rubric_tutor_override	\N	\N	[]	[]	{"evaluation_prompt": "Evaluate candidate analytical framework, hypothesis formulation, funnel breakdown, and data validation steps.", "rubric": {"funnel_segmentation": "Explores conversion funnel stages (cart, payment gateway, UI).", "dimensional_breakdown": "Checks device type, region, browser, traffic source.", "data_integrity": "Verifies tracking tags and backend log error rates."}}	2026-08-20 13:59:34.749664	2026-08-20 13:59:34.749664
73	73	SandboxTestRunner	SELECT rep_name, region, SUM(amount) AS total_revenue FROM sales GROUP BY rep_name, region HAVING SUM(amount) > 50000 ORDER BY total_revenue DESC;	SELECT rep_name, region, SUM(amount) AS total_revenue FROM sales GROUP BY rep_name, region HAVING SUM(amount) > 50000 ORDER BY total_revenue DESC;	[{"input": "sales table sample", "expected": "top sales reps grouped by region"}]	[]	{}	2026-08-20 13:59:34.769845	2026-08-20 13:59:34.769845
74	74	SandboxTestRunner	SELECT o.product_id, COUNT(o.order_id) AS unfulfilled_orders, SUM(o.unit_price * o.quantity) AS lost_revenue FROM online_orders o LEFT JOIN access_inventory_dump i ON o.product_id = i.product_id WHERE i.stock_quantity = 0 OR i.stock_quantity IS NULL GROUP BY o.product_id;	SELECT o.product_id, COUNT(o.order_id) AS unfulfilled_orders, SUM(o.unit_price * o.quantity) AS lost_revenue FROM online_orders o LEFT JOIN access_inventory_dump i ON o.product_id = i.product_id WHERE i.stock_quantity = 0 OR i.stock_quantity IS NULL GROUP BY o.product_id;	[{"input": "online_orders and access_inventory_dump", "expected": "unfulfilled orders summary"}]	[]	{}	2026-08-20 13:59:34.779474	2026-08-20 13:59:34.779474
75	75	sql_match	\N	SELECT customer_id, SUM(amount) AS total_revenue FROM orders GROUP BY customer_id ORDER BY total_revenue DESC LIMIT 3;	[{"input": "orders (customer_id, amount, order_date, region)", "expected_output": "customer_id | total_revenue\\n104 | 3250.75\\n102 | 1550.00\\n103 | 890.25"}]	[]	{}	2026-08-20 13:59:34.786997	2026-08-20 13:59:34.786997
76	76	exact_match	A	\N	[]	[]	{}	2026-08-20 13:59:34.797388	2026-08-20 13:59:34.797388
77	77	exact_match	B	\N	[]	[]	{}	2026-08-20 13:59:34.807374	2026-08-20 13:59:34.807374
78	78	ExactMatch	\N	SELECT customer_id, SUM(amount) AS total_revenue FROM orders GROUP BY customer_id HAVING SUM(amount) > 1000 ORDER BY total_revenue DESC;	[]	[]	{}	2026-08-20 13:59:34.811681	2026-08-20 13:59:34.811681
79	79	sql_match	\N	SELECT department, AVG(salary) AS avg_salary FROM employees GROUP BY department HAVING AVG(salary) > 80000 ORDER BY avg_salary DESC;	[{"input": "employees (employee_id, employee_name, department, salary, hire_date)", "expected_output": "department | avg_salary\\nEngineering | 100000.0\\nAnalytics | 83000.0"}]	[]	{}	2026-08-20 13:59:34.830356	2026-08-20 13:59:34.830356
80	80	ExactMatch	A	\N	[]	[]	{}	2026-08-20 13:59:34.852746	2026-08-20 13:59:34.852746
81	81	ExactMatch	Sub HighlightLowSales()\n    Dim i As Long, LastRow As Long\n    LastRow = Cells(Rows.Count, 3).End(xlUp).Row\n    For i = 2 To LastRow\n        If Cells(i, 3).Value < 1000 Then\n            Cells(i, 3).Interior.Color = RGB(255, 0, 0)\n        End If\n    Next i\nEnd Sub	\N	[]	[]	{}	2026-08-20 13:59:34.861615	2026-08-20 13:59:34.861615
82	82	ExactMatch	B	\N	[]	[]	{}	2026-08-20 13:59:34.869904	2026-08-20 13:59:34.869904
83	83	code_execution	A	\N	[{"input": "df = pd.DataFrame({'name': ['Alice', 'Bob', 'Charlie'], 'salary': [50000, 35000, 65000]}); threshold = 40000", "expected_output": "['Alice', 'Charlie']"}]	[{"input": "df = pd.DataFrame({'name': ['X', 'Y'], 'salary': [20000, 25000]}); threshold = 30000", "expected_output": "[]"}]	{}	2026-08-20 13:59:34.879725	2026-08-20 13:59:34.879725
84	84	code_execution	A	\N	[{"input": "orders = [('A', 100), ('A', 200), ('B', 150)]", "expected_output": "{'A': 150.0, 'B': 150.0}"}]	[]	{}	2026-08-20 13:59:34.884104	2026-08-20 13:59:34.884104
85	85	exact_match	B	\N	[]	[]	{}	2026-08-20 13:59:34.894644	2026-08-20 13:59:34.894644
86	86	exact_match	A	\N	[]	[]	{}	2026-08-20 13:59:34.904907	2026-08-20 13:59:34.904907
87	87	exact_match	B	\N	[]	[]	{}	2026-08-20 13:59:34.909535	2026-08-20 13:59:34.909535
88	88	exact_match	A	\N	[]	[]	{}	2026-08-20 13:59:34.919543	2026-08-20 13:59:34.919543
89	89	exact_match	A	\N	[]	[]	{}	2026-08-20 13:59:34.929884	2026-08-20 13:59:34.929884
90	90	code_execution	A	\N	[{"input": "df = pd.DataFrame({'name': ['Alice', 'Bob', 'Charlie'], 'salary': [50000, 35000, 65000]}); threshold = 40000", "expected_output": "['Alice', 'Charlie']"}]	[{"input": "df = pd.DataFrame({'name': ['X', 'Y'], 'salary': [20000, 25000]}); threshold = 30000", "expected_output": "[]"}]	{}	2026-08-20 13:59:34.93588	2026-08-20 13:59:34.93588
91	91	code_execution	A	\N	[{"input": "sales = pd.Series([100, 150, 200])", "expected_output": "[NaN, 0.5, 0.33]"}]	[]	{}	2026-08-20 13:59:34.946056	2026-08-20 13:59:34.946056
92	92	code_execution	A	\N	[{"input": "orders = [('A', 100), ('A', 200), ('B', 150)]", "expected_output": "{'A': 150.0, 'B': 150.0}"}]	[]	{}	2026-08-20 13:59:34.949847	2026-08-20 13:59:34.949847
93	93	ExactMatch	\N	if number > max_value:\n    max_value = number	[{"input": "numbers = [3, 9, 2, 15, 6]", "expected_output": "15"}]	[{"input": "numbers = [-10, -5, -20, -1]", "expected_output": "-1"}, {"input": "numbers = [42]", "expected_output": "42"}]	{}	2026-08-20 13:59:34.959506	2026-08-20 13:59:34.959506
94	94	ExactMatch	B	\N	[]	[]	{}	2026-08-20 13:59:34.9794	2026-08-20 13:59:34.9794
95	95	SandboxTestRunner	import pandas as pd\ndef process_sales(df: pd.DataFrame) -> pd.DataFrame:\n    df_clean = df[df['Customer_ID'].notnull()].copy()\n    median_sales = df_clean['Sales_Amount'].median()\n    df_clean['Sales_Amount'] = df_clean['Sales_Amount'].fillna(median_sales)\n    result = df_clean.groupby('Category')['Sales_Amount'].sum().reset_index()\n    return result.sort_values(by='Sales_Amount', ascending=False)	import pandas as pd\ndef process_sales(df: pd.DataFrame) -> pd.DataFrame:\n    df_clean = df[df['Customer_ID'].notnull()].copy()\n    median_sales = df_clean['Sales_Amount'].median()\n    df_clean['Sales_Amount'] = df_clean['Sales_Amount'].fillna(median_sales)\n    result = df_clean.groupby('Category')['Sales_Amount'].sum().reset_index()\n    return result.sort_values(by='Sales_Amount', ascending=False)	[{"input": "sample DataFrame", "expected": "grouped category sales DataFrame"}]	[]	{}	2026-08-20 13:59:34.987359	2026-08-20 13:59:34.987359
96	96	exact_match	A	\N	[]	[]	{}	2026-08-20 13:59:34.992919	2026-08-20 13:59:34.992919
97	97	ai_rubric_tutor_override	\N	\N	[]	[]	{"evaluation_prompt": "Evaluate candidate analysis on identifying margin erosion from excessive discounting and quality/sizing issues in Apparel driving high returns.", "rubric": {"root_cause_identification": "Identifies both discount margin compression and apparel return surge.", "data_backed_reasoning": "Uses specific figures (22% discount, 8% returns) to support claims.", "actionable_recommendation": "Proposes inventory audit and promo strategy overhaul."}}	2026-08-20 13:59:34.999756	2026-08-20 13:59:34.999756
98	98	ExactMatch	Rubric: Anomaly verification, distinguishing volume vs price, checking data integrity, and executive reporting readiness.	\N	[]	[]	{}	2026-08-20 13:59:35.009819	2026-08-20 13:59:35.009819
99	99	ai_rubric_tutor_override	\N	\N	[]	[]	{"evaluation_prompt": "Validate candidate explanation of data cleaning steps grounded in their declared project scope."}	2026-08-20 13:59:35.019776	2026-08-20 13:59:35.019776
100	100	ExactMatch	Rubric: Clear objective, identified dataset lineage, tool stack explanation, individual contribution.	\N	[]	[]	{}	2026-08-20 13:59:35.029423	2026-08-20 13:59:35.029423
101	101	ai_rubric_tutor_override	\N	\N	[]	[]	{"evaluation_prompt": "Evaluate candidate project clarity, dataset realism, role authenticity, and tool alignment."}	2026-08-20 13:59:35.029423	2026-08-20 13:59:35.029423
172	172	ExactMatch	100	\N	[]	[]	{"case_sensitive": false}	2026-08-23 03:40:44.052736	2026-08-23 03:40:44.052736
173	173	ExactMatch	25%	\N	[]	[]	{"case_sensitive": false}	2026-08-23 03:40:44.058508	2026-08-23 03:40:44.058508
174	174	ExactMatch	96	\N	[]	[]	{"case_sensitive": false}	2026-08-23 03:40:44.062865	2026-08-23 03:40:44.062865
175	175	ExactMatch	4 days	\N	[]	[]	{"case_sensitive": false}	2026-08-23 03:40:44.068606	2026-08-23 03:40:44.068606
176	176	ExactMatch	10 seconds	\N	[]	[]	{"case_sensitive": false}	2026-08-23 03:40:44.073171	2026-08-23 03:40:44.073171
177	177	ExactMatch	$1,500	\N	[]	[]	{"case_sensitive": false}	2026-08-23 03:40:44.073171	2026-08-23 03:40:44.073171
178	178	ExactMatch	24	\N	[]	[]	{"case_sensitive": false}	2026-08-23 03:40:44.078383	2026-08-23 03:40:44.078383
179	179	ExactMatch	1/6	\N	[]	[]	{"case_sensitive": false}	2026-08-23 03:40:44.085448	2026-08-23 03:40:44.085448
180	180	ExactMatch	FORTAM	\N	[]	[]	{"case_sensitive": false}	2026-08-23 03:40:44.089517	2026-08-23 03:40:44.089517
181	181	ExactMatch	Brother	\N	[]	[]	{"case_sensitive": false}	2026-08-23 03:40:44.094027	2026-08-23 03:40:44.094027
182	182	ExactMatch	All squares are polygons	\N	[]	[]	{"case_sensitive": false}	2026-08-23 03:40:44.094656	2026-08-23 03:40:44.094656
183	183	ExactMatch	12 years	\N	[]	[]	{"case_sensitive": false}	2026-08-23 03:40:44.102382	2026-08-23 03:40:44.102382
184	184	ExactMatch	75°	\N	[]	[]	{"case_sensitive": false}	2026-08-23 03:40:44.104429	2026-08-23 03:40:44.104429
185	185	ExactMatch	30	\N	[]	[]	{"case_sensitive": false}	2026-08-23 03:40:44.108412	2026-08-23 03:40:44.108412
186	186	ExactMatch	$450	\N	[]	[]	{"case_sensitive": false}	2026-08-23 03:40:44.108412	2026-08-23 03:40:44.108412
187	187	ExactMatch	15	\N	[]	[]	{"case_sensitive": false}	2026-08-23 03:40:44.118062	2026-08-23 03:40:44.118062
188	188	ExactMatch	0x1008	\N	[]	[]	{"case_sensitive": false}	2026-08-23 03:40:44.118953	2026-08-23 03:40:44.118953
189	189	ExactMatch	arr[3]	\N	[]	[]	{"case_sensitive": false}	2026-08-23 03:40:44.125244	2026-08-23 03:40:44.125244
190	190	ExactMatch	20	\N	[]	[]	{"case_sensitive": false}	2026-08-23 03:40:44.12826	2026-08-23 03:40:44.12826
191	191	ExactMatch	8 bytes	\N	[]	[]	{"case_sensitive": false}	2026-08-23 03:40:44.12826	2026-08-23 03:40:44.12826
192	192	ExactMatch	32	\N	[]	[]	{"case_sensitive": false}	2026-08-23 03:40:44.135804	2026-08-23 03:40:44.135804
193	193	ExactMatch	11	\N	[]	[]	{"case_sensitive": false}	2026-08-23 03:40:44.138314	2026-08-23 03:40:44.138314
194	194	ExactMatch	1 2 	\N	[]	[]	{"case_sensitive": false}	2026-08-23 03:40:44.138314	2026-08-23 03:40:44.138314
195	195	ExactMatch	6	\N	[]	[]	{"case_sensitive": false}	2026-08-23 03:40:44.148268	2026-08-23 03:40:44.148268
196	196	ExactMatch	A union allocates memory only for its largest member, sharing space among all members	\N	[]	[]	{"case_sensitive": false}	2026-08-23 03:40:44.153005	2026-08-23 03:40:44.153005
197	197	ExactMatch	void*	\N	[]	[]	{"case_sensitive": false}	2026-08-23 03:40:44.158085	2026-08-23 03:40:44.158085
198	198	ExactMatch	A pointer that points to a deallocated/freed memory location	\N	[]	[]	{"case_sensitive": false}	2026-08-23 03:40:44.158085	2026-08-23 03:40:44.158085
199	199	ExactMatch	*ptr = 25;	\N	[]	[]	{"case_sensitive": false}	2026-08-23 03:40:44.158085	2026-08-23 03:40:44.158085
200	200	ExactMatch	The values of a and b are swapped without temporary memory	\N	[]	[]	{"case_sensitive": false}	2026-08-23 03:40:44.170174	2026-08-23 03:40:44.170174
201	201	ExactMatch	int (*funcPtr)(int, int);	\N	[]	[]	{"case_sensitive": false}	2026-08-23 03:40:44.170174	2026-08-23 03:40:44.170174
202	202	CodeSandbox	\N	#include <stdio.h>\n#include <string.h>\n\nvoid reverseString(char *str) {\n    int left = 0;\n    int right = strlen(str) - 1;\n    while (left < right) {\n        char temp = str[left];\n        str[left] = str[right];\n        str[right] = temp;\n        left++;\n        right--;\n    }\n}\n\nint main() {\n    char str[1000];\n    if (scanf("%s", str) == 1) {\n        reverseString(str);\n        printf("%s", str);\n    }\n    return 0;\n}\n	[{"input": "hello", "expected_output": "olleh"}, {"input": "system", "expected_output": "metsys"}]	[{"input": "a", "expected_output": "a"}, {"input": "algorithms", "expected_output": "smhtirogla"}]	{"language": "c", "pass_threshold": 1.0}	2026-08-23 03:40:44.178456	2026-08-23 03:40:44.178456
203	203	CodeSandbox	\N	#include <stdio.h>\n#include <stdlib.h>\n\nint main() {\n    int n;\n    if (scanf("%d", &n) != 1 || n <= 0) return 0;\n    \n    int *arr = (int*)malloc(n * sizeof(int));\n    for (int i = 0; i < n; i++) {\n        scanf("%d", &arr[i]);\n    }\n    \n    int min = arr[0];\n    int max = arr[0];\n    for (int i = 1; i < n; i++) {\n        if (arr[i] < min) min = arr[i];\n        if (arr[i] > max) max = arr[i];\n    }\n    \n    printf("Min: %d, Max: %d", min, max);\n    free(arr);\n    return 0;\n}\n	[{"input": "5\\n10 25 5 40 15", "expected_output": "Min: 5, Max: 40"}, {"input": "3\\n100 200 50", "expected_output": "Min: 50, Max: 200"}]	[{"input": "1\\n42", "expected_output": "Min: 42, Max: 42"}, {"input": "4\\n-10 -50 0 30", "expected_output": "Min: -50, Max: 30"}]	{"language": "c", "pass_threshold": 1.0}	2026-08-23 03:40:44.183643	2026-08-23 03:40:44.183643
204	204	CodeSandbox	\N	#include <stdio.h>\n#include <string.h>\n\nint countOccurrences(const char *str, char target) {\n    int count = 0;\n    while (*str) {\n        if (*str == target) count++;\n        str++;\n    }\n    return count;\n}\n\nint main() {\n    char str[1000];\n    char target;\n    if (scanf("%s %c", str, &target) == 2) {\n        printf("%d", countOccurrences(str, target));\n    }\n    return 0;\n}\n	[{"input": "programming m", "expected_output": "2"}, {"input": "assessment s", "expected_output": "4"}]	[{"input": "hello z", "expected_output": "0"}, {"input": "embedded d", "expected_output": "3"}]	{"language": "c", "pass_threshold": 1.0}	2026-08-23 03:40:44.188392	2026-08-23 03:40:44.188392
205	205	CodeSandbox	\N	#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\n// BUGGY CODE: Fix memory allocation & null termination\nint main() {\n    char input[100];\n    if (scanf("%s", input) != 1) return 0;\n    \n    int len = strlen(input);\n    // FIX: Allocate len + 1 for null terminator\n    char *copy = (char*)malloc((len + 1) * sizeof(char));\n    \n    for (int i = 0; i < len; i++) {\n        copy[i] = input[i];\n    }\n    copy[len] = '\\0'; // FIX: Ensure null-termination\n    \n    printf("%s", copy);\n    free(copy);\n    return 0;\n}\n	[{"input": "systems", "expected_output": "systems"}, {"input": "kernel", "expected_output": "kernel"}]	[{"input": "memory", "expected_output": "memory"}, {"input": "pointer", "expected_output": "pointer"}]	{"language": "c", "pass_threshold": 1.0}	2026-08-23 03:40:44.188392	2026-08-23 03:40:44.188392
206	206	CodeSandbox	\N	#include <stdio.h>\n\nint binarySearch(int arr[], int n, int target) {\n    int low = 0;\n    int high = n - 1;\n    \n    while (low <= high) {\n        int mid = low + (high - low) / 2;\n        if (arr[mid] == target) {\n            return mid;\n        } else if (arr[mid] < target) {\n            low = mid + 1; // FIX: increment low\n        } else {\n            high = mid - 1; // FIX: decrement high\n        }\n    }\n    return -1;\n}\n\nint main() {\n    int n;\n    if (scanf("%d", &n) != 1) return 0;\n    int arr[100];\n    for (int i = 0; i < n; i++) scanf("%d", &arr[i]);\n    int target;\n    if (scanf("%d", &target) != 1) return 0;\n    \n    printf("%d", binarySearch(arr, n, target));\n    return 0;\n}\n	[{"input": "5\\n10 20 30 40 50\\n30", "expected_output": "2"}, {"input": "4\\n2 4 6 8\\n9", "expected_output": "-1"}]	[{"input": "3\\n1 3 5\\n1", "expected_output": "0"}, {"input": "3\\n1 3 5\\n5", "expected_output": "2"}]	{"language": "c", "pass_threshold": 1.0}	2026-08-23 03:40:44.188392	2026-08-23 03:40:44.188392
\.


--
-- Data for Name: question_versions; Type: TABLE DATA; Schema: public; Owner: nasc_admin
--

COPY public.question_versions (id, question_id, version_num, snapshot_json, created_at) FROM stdin;
1	1	1	{"title": "Bitwise Operations & Shift Logic", "content": "What is the result of evaluating `(16 >> 2) | (4 << 1)` in standard integer arithmetic?"}	2026-08-20 13:59:34.099584
2	2	1	{"title": "Binary Tree Traversal Deductions", "content": "A complete binary tree has 15 nodes. How many leaf nodes does this tree possess?"}	2026-08-20 13:59:34.109578
3	3	1	{"title": "Server Request Latency Calculation", "content": "A microservice cluster processes 1,200 requests per second across 4 parallel worker instances. Each instance handles requests synchronously at an average duration of 2.5ms. What is the CPU utilization per instance?"}	2026-08-20 13:59:34.115539
4	4	1	{"title": "Two Sum Target Indices", "content": "### Problem Statement\\nGiven an array of integers `nums` and an integer `target`, return the 0-based indices of the two numbers such that they add up to `target`.\\n\\nYou may assume that each input will have exactly one solution, and you may not use the same element twice.\\n\\n### Input Format\\n- Line 1: Space-separated integers representing `nums`\\n- Line 2: Single integer representing `target`\\n\\n### Output Format\\n- Space-separated indices in ascending order (e.g. `0 1`)\\n\\n### Constraints\\n- $2 \\\\le \\text{nums.length} \\\\le 10^5$\\n- $-10^9 \\\\le \\text{nums}[i] \\\\le 10^9$\\n- Time Limit: 2.0 seconds\\n"}	2026-08-20 13:59:34.129651
5	5	1	{"title": "Valid Anagram Checker", "content": "### Problem Statement\\nGiven two strings `s` and `t`, return `true` if `t` is an anagram of `s`, and `false` otherwise.\\nAn anagram is a word or phrase formed by rearranging the letters of a different word or phrase, using all the original letters exactly once.\\n\\n### Input Format\\n- Line 1: String `s`\\n- Line 2: String `t`\\n\\n### Output Format\\n- Print `true` or `false` (lowercase).\\n"}	2026-08-20 13:59:34.139498
6	6	1	{"title": "Database Indexing Performance", "content": "Which of the following index structures is standardly utilized in PostgreSQL for handling range queries (e.g. `WHERE age BETWEEN 20 AND 30`) efficiently?"}	2026-08-20 13:59:34.149852
7	7	1	{"title": "REST API Idempotency", "content": "Which HTTP method is defined as idempotent according to RFC 7231 standards?"}	2026-08-20 13:59:34.16184
8	8	1	{"title": "Operating Systems Deadlock Conditions", "content": "Which of the following is NOT one of Coffman's four necessary conditions for deadlock?"}	2026-08-20 13:59:34.170235
9	9	1	{"title": "Fix Binary Search Boundary Condition", "content": "### Scenario: Broken Binary Search\\nA junior developer wrote the following binary search routine, but it enters an infinite loop or produces incorrect indices on several edge cases.\\n\\n### Bug Description\\nIdentify and fix the pointer update and loop condition bugs so the routine returns the exact index of `target`, or `-1` if not found.\\n\\n### Input Format\\n- Line 1: Sorted space-separated integers\\n- Line 2: Target integer\\n"}	2026-08-20 13:59:34.183075
10	10	1	{"title": "R1-Q01: Subject-Verb Agreement", "content": "Choose the grammatically correct sentence for customer communication:"}	2026-08-20 13:59:34.199658
11	11	1	{"title": "R1-Q02: Past Participle & Tense", "content": "Select the correct sentence to confirm a processed refund:"}	2026-08-20 13:59:34.208723
12	12	1	{"title": "R1-Q03: Preposition Accuracy", "content": "Identify the correct preposition for shipping timeframe:"}	2026-08-20 13:59:34.209834
13	13	1	{"title": "R1-Q04: Pronoun Agreement", "content": "Select the sentence with proper pronoun agreement:"}	2026-08-20 13:59:34.219682
14	14	1	{"title": "R1-Q05: Punctuation & Clarity", "content": "Which option uses professional punctuation for customer reassurance?"}	2026-08-20 13:59:34.229486
15	15	1	{"title": "R1-Q06: Vocabulary & Tone", "content": "Choose the most professional alternative to 'You have to wait':"}	2026-08-20 13:59:34.229486
16	16	1	{"title": "R1-Q07: Modal Verbs & Politeness", "content": "Select the most polite request for order number:"}	2026-08-20 13:59:34.244489
17	17	1	{"title": "R1-Q08: Conditional Sentences", "content": "Select the correct conditional sentence for policy explanation:"}	2026-08-20 13:59:34.250336
18	18	1	{"title": "R1-Q09: Active Voice & Directness", "content": "Which sentence communicates proactive ownership in active voice?"}	2026-08-20 13:59:34.259868
19	19	1	{"title": "R1-Q10: Spelling & Common Errors", "content": "Identify the sentence without any spelling errors:"}	2026-08-20 13:59:34.265894
20	20	1	{"title": "R1-Q11: Word Choice - Affect vs Effect", "content": "Select the sentence with correct word usage:"}	2026-08-20 13:59:34.271011
21	21	1	{"title": "R1-Q12: Redundancy Reduction", "content": "Choose the most concise and professional statement:"}	2026-08-20 13:59:34.281113
22	22	1	{"title": "R1-Q13: Business Email Closing", "content": "Which is the most appropriate closing statement for a support chat?"}	2026-08-20 13:59:34.287035
23	23	1	{"title": "R1-Q14: Adjective vs Adverb", "content": "Select the correct sentence:"}	2026-08-20 13:59:34.296889
24	24	1	{"title": "R1-Q15: Clarity in Apology", "content": "Choose the best statement to express sincere empathy without over-promising:"}	2026-08-20 13:59:34.30642
25	25	1	{"title": "R1-Q16: Singular vs Plural", "content": "Select the grammatically accurate sentence:"}	2026-08-20 13:59:34.319965
26	26	1	{"title": "R1-Q17: Direct Question Formatting", "content": "Which is the correct way to ask a customer for confirmation?"}	2026-08-20 13:59:34.331061
27	27	1	{"title": "R1-Q18: Avoidance of Jargon", "content": "Which message avoids confusing internal jargon for an international customer?"}	2026-08-20 13:59:34.341347
28	28	1	{"title": "R1-Q19: Hyphenation & Modifiers", "content": "Select the properly punctuated sentence:"}	2026-08-20 13:59:34.353359
29	29	1	{"title": "R1-Q20: Tone Softening & Courtesy", "content": "Choose the best phrasing when unable to fulfill an out-of-policy request:"}	2026-08-20 13:59:34.36725
30	30	1	{"title": "R1-Q21: Tone Correction 1", "content": "Original Customer Support Message:\\n\\"u need wait we already told you tracking will update tomorrow.\\"\\n\\nWhich is the best professional revision?"}	2026-08-20 13:59:34.379701
31	31	1	{"title": "R1-Q22: Tone Correction 2", "content": "Original Customer Support Message:\\n\\"Thats not our fault the courier lost it contact them yourself.\\"\\n\\nWhich is the best professional revision?"}	2026-08-20 13:59:34.390597
32	32	1	{"title": "R1-Q23: Tone Correction 3", "content": "Original Customer Support Message:\\n\\"Why are you asking for refund again? We said no yesterday.\\"\\n\\nWhich is the best professional revision?"}	2026-08-20 13:59:34.401021
33	33	1	{"title": "R1-Q24: Tone Correction 4", "content": "Original Customer Support Message:\\n\\"give me your credit card password and otp so i can fix billing.\\"\\n\\nWhat is the critical failure in this message and how should it be corrected?"}	2026-08-20 13:59:34.412888
34	34	1	{"title": "R1-Q25: Tone Correction 5", "content": "Original Customer Support Message:\\n\\"Calm down bro its just a small delay of 2 days.\\"\\n\\nWhich is the best professional revision for a US/Canada customer?"}	2026-08-20 13:59:34.427408
87	87	1	{"title": "Q3.3: Vectorized NumPy Operations vs Python Loops", "content": "Why is NumPy vectorization significantly faster than iterating through Python lists with explicit `for` loops when computing array element-wise operations?"}	2026-08-20 13:59:34.915447
35	35	1	{"title": "R1-Q26: Post-Sales Support Typing Benchmark", "content": "Thank you for contacting customer support today. I understand that your recent shipment has not arrived as scheduled, and I sincerely apologize for the inconvenience this delay has caused. I am currently reviewing your order details, tracking information, and warehouse logs to locate your package. Please rest assured that our priority is ensuring you receive your items safely and promptly. If the package cannot be located within twenty-four hours, we will be glad to arrange an expedited replacement or process a full refund to your original payment method."}	2026-08-20 13:59:34.441981
36	36	1	{"title": "R2-Case01: Scenario 1: Delayed International Delivery (US to Canada)", "content": "Customer: David Miller (Toronto, Canada)\\nOrder: #US-8492 ($189.00 - Express 2-Day Shipping)\\nStatus: Shipped 5 days ago, stuck in customs clearance.\\nCustomer Message: 'I paid $35 extra for Express 2-day delivery because this was a birthday gift for my daughter yesterday. It has been 5 days and nobody is updating me. This is unacceptable!'\\n\\nWhat is the best immediate response?"}	2026-08-20 13:59:34.46036
37	37	1	{"title": "R2-Case02: Scenario 2: Duplicate Credit Card Charge", "content": "Customer: Sarah Jenkins (Chicago, USA)\\nAccount: Verified ($450.00 Order)\\nCustomer Message: 'My online bank statement shows two pending charges of $450.00 from your store today. You charged me $900 for a single order! Fix this immediately or I am filing a bank dispute!'\\n\\nWhat is the most accurate and reassuring resolution?"}	2026-08-20 13:59:34.466806
38	38	1	{"title": "R2-Case03: Scenario 3: Damaged Goods Received", "content": "Customer: Michael Chang (Seattle, USA)\\nOrder: #US-9912 (Ceramic Cookware Set - $240.00)\\nCustomer Message: 'The box arrived crushed and two of the ceramic pots are completely shattered. I need this for a dinner party this Friday.'\\n\\nWhat is the correct protocol?"}	2026-08-20 13:59:34.469868
39	39	1	{"title": "R2-Case04: Scenario 4: Out of Policy Refund Demand with Review Threat", "content": "Customer: Robert Taylor (Miami, USA)\\nOrder: #US-7011 (Leather Jacket - Purchased 65 days ago, Return Policy is 30 days)\\nCustomer Message: 'I wore this twice and don't like the fit. Give me a full refund to my card now, or I will post 1-star reviews on Trustpilot, Reddit, and Twitter with screenshots of your awful service!'\\n\\nHow should you handle this situation professionally?"}	2026-08-20 13:59:34.479677
40	40	1	{"title": "R2-Case05: Scenario 5: Supervisor Escalation Request", "content": "Customer: Amanda White (Boston, USA)\\nCustomer Message: 'I have been transferred three times already and nobody knows what they are doing. Transfer me to your supervisor right now, I refuse to talk to front-line agents!'\\n\\nWhat is the best de-escalation response before initiating supervisor transfer?"}	2026-08-20 13:59:34.479677
41	41	1	{"title": "R2-Case06: Scenario 6: Incorrect Item Received (Wrong Color/Model)", "content": "Customer: James Wilson (Vancouver, Canada)\\nOrder: #CA-3301 (Ordered: Matte Black Headphones / Received: Neon Green)\\nCustomer Message: 'I opened the box and received neon green headphones instead of matte black. How does your warehouse mess up something so simple?'\\n\\nWhat is the appropriate customer resolution?"}	2026-08-20 13:59:34.489802
42	42	1	{"title": "R2-Case07: Scenario 7: Defective Product under Warranty", "content": "Customer: Lisa Brown (Austin, USA)\\nOrder: #US-6102 (Electric Espresso Machine - Purchased 5 months ago, 1-Year Warranty)\\nCustomer Message: 'The pressure pump stopped working this morning and water is leaking from the base. I need a replacement machine.'\\n\\nWhat is the correct protocol?"}	2026-08-20 13:59:34.492406
43	43	1	{"title": "R2-Case08: Scenario 8: Cancellation Request on Shipped Order", "content": "Customer: Kevin Harris (Dallas, USA)\\nOrder: #US-8820 ($320.00 Gaming Chair)\\nStatus: Shipped via UPS 2 hours ago (Tracking generated)\\nCustomer Message: 'I changed my mind 10 minutes ago. Cancel this order immediately and refund my card before it ships!'\\n\\nHow should you handle an order that has already been dispatched?"}	2026-08-20 13:59:34.499764
44	44	1	{"title": "R2-Case09: Scenario 9: Unrecognized Account Login / Security Alert", "content": "Customer: Rachel Adams (New York, USA)\\nCustomer Message: 'I got an email saying someone logged into my account from Russia and placed an order for $800 gift cards! Cancel that order and lock my account!'\\n\\nWhat is the immediate security protocol?"}	2026-08-20 13:59:34.509871
45	45	1	{"title": "R2-Case10: Scenario 10: Aggressive Customer Using Profanity", "content": "Customer: John Doe (Philadelphia, USA)\\nCustomer Message: 'Your f***ing software crashed and ruined my work presentation. You guys are complete idiots and thieves!'\\n\\nHow should an international chat agent handle abusive language while de-escalating?"}	2026-08-20 13:59:34.509871
46	46	1	{"title": "R2-Case11: Scenario 11: International Customer with Language Barrier", "content": "Customer: Jean-Pierre (Montreal, Canada)\\nCustomer Message: 'Bonjour, package no arrive. tracking say delivered but no package in my porte. please aidez moi.'\\n\\nHow do you respond with clear, simple, and supportive language?"}	2026-08-20 13:59:34.51974
47	47	1	{"title": "R2-Case12: Scenario 12: High-Value Customer VIP Retention", "content": "Customer: Victoria Sterling (San Francisco, USA)\\nCustomer Status: Platinum Tier (50+ orders, $8,000 annual spend)\\nCustomer Message: 'I have been a loyal customer for 4 years, but my anniversary promo code is saying invalid at checkout. If your system won't honor my loyalty reward, I will take my business elsewhere.'\\n\\nWhat is the empowered resolution?"}	2026-08-20 13:59:34.529628
48	48	1	{"title": "R3-SOP01: SOP Case 1: Return Window Eligibility (Electronics)", "content": "SOP Reference: KB-RET-01 (Return Windows)\\nPolicy: Consumer electronics are eligible for return within 30 days of delivery. Returns requested between 31-45 days are eligible for Store Credit only. Returns after 45 days are strictly ineligible.\\n\\nCase Details:\\nCustomer purchased a DSLR camera delivered 38 days ago. Item is in original packaging.\\n\\nWhat is the compliant resolution and required documentation?"}	2026-08-20 13:59:34.542774
49	49	1	{"title": "R3-SOP02: SOP Case 2: Lost in Transit (Package Investigation Window)", "content": "SOP Reference: KB-LOG-04 (Lost in Transit Claims)\\nPolicy: If carrier tracking shows no movement for 5 consecutive business days, agent is authorized to declare package Lost-in-Transit (LIT) and trigger immediate replacement or refund. If under 5 days, customer must be advised to allow 48 hours for carrier updates.\\n\\nCase Details:\\nCustomer tracking has had zero scan updates for 7 consecutive days.\\n\\nWhat is the compliant SOP action?"}	2026-08-20 13:59:34.552868
50	50	1	{"title": "R3-SOP03: SOP Case 3: Identity Verification before Disclosing Account Data", "content": "SOP Reference: KB-SEC-02 (Customer Authentication Protocol)\\nPolicy: Before sharing order history, updating shipping addresses, or discussing financial details, agent MUST verify 2 account credentials: 1) Full Name on account, and 2) Either Order Number or Billing Zip Code. Never ask for Passwords or CVV.\\n\\nCase Details:\\nA chat user asks to change the shipping address on Order #8849. User provides only first name 'John'.\\n\\nWhat is the required SOP verification?"}	2026-08-20 13:59:34.560464
88	88	1	{"title": "Q3.4: Pandas Missing Data Imputation Strategies", "content": "A DataFrame `df` has missing numeric values in column `'score'`. Which Pandas code fills missing values with the column mean inplace?"}	2026-08-20 13:59:34.919543
51	51	1	{"title": "R3-SOP04: SOP Case 4: High-Value Refund Approval Matrix ($500+)", "content": "SOP Reference: KB-REF-03 (Refund Authorization Levels)\\nPolicy: Tier-1 Chat Agents can authorize refunds up to $250.00 independently. Refunds between $250.01 - $500.00 require Senior Agent approval. Refunds above $500.00 require Tier-2 Supervisor approval and photo proof of return receipt.\\n\\nCase Details:\\nCustomer requests refund of $680.00 for returned laptop.\\n\\nWhat is the mandatory escalation protocol?"}	2026-08-20 13:59:34.566208
52	52	1	{"title": "R3-SOP05: SOP Case 5: Warranty Defect vs Accidental Damage", "content": "SOP Reference: KB-WAR-01 (Warranty Scope)\\nPolicy: Manufacturer warranty covers internal hardware malfunctions, component failures, and factory defects. It excludes cosmetic damage, water immersion, cracked screens from drops, and unauthorized modifications.\\n\\nCase Details:\\nCustomer states: 'My tablet slipped out of my hand on the driveway and the screen is cracked.'\\n\\nWhat is the correct policy determination?"}	2026-08-20 13:59:34.576045
53	53	1	{"title": "R3-SOP06: SOP Case 6: Price Match Policy Within 14 Days", "content": "SOP Reference: KB-BIL-02 (Price Protection)\\nPolicy: Customers are eligible for a price match refund if the identical product is discounted on our store within 14 days of purchase. Excludes clearance items and third-party marketplace sellers.\\n\\nCase Details:\\nCustomer purchased jacket for $120.00 8 days ago. Today our official store price is $90.00.\\n\\nWhat is the action and refund calculation?"}	2026-08-20 13:59:34.583699
54	54	1	{"title": "R3-SOP07: SOP Case 7: Fraud Alert - Stolen Card Claim", "content": "SOP Reference: KB-SEC-05 (Fraud Protocol)\\nPolicy: If a contact claims their credit card was used fraudulently on our site without authorization, agent MUST: 1) Immediately cancel unshipped orders, 2) Freeze account, 3) Escalate to Trust & Safety team. Never argue or disclose fraudster's shipping address to the caller.\\n\\nCase Details:\\nCaller states: 'Someone made a $400 charge on my Visa card at your store.'\\n\\nWhat is the compliant protocol?"}	2026-08-20 13:59:34.589593
55	55	1	{"title": "R3-SOP08: SOP Case 8: Hazardous Material / Battery Return Policy", "content": "SOP Reference: KB-RET-04 (Hazardous Materials)\\nPolicy: Lithium-ion batteries that are swollen, punctured, or leaking CANNOT be shipped via standard postal returns due to federal air transport safety regulations. Customer must dispose safely locally; agent issues direct replacement/refund upon photo confirmation.\\n\\nCase Details:\\nCustomer reports laptop battery is swollen and bulging out of the case.\\n\\nWhat is the compliant safety action?"}	2026-08-20 13:59:34.592688
56	56	1	{"title": "R3-SOP09: SOP Case 9: Restocking Fee Exemptions", "content": "SOP Reference: KB-RET-05 (Restocking Fees)\\nPolicy: Standard discretionary returns incur a 15% restocking fee. Restocking fees are 100% WAIVED if: 1) Item is defective, 2) Wrong item sent by warehouse, or 3) Customer is Platinum VIP member.\\n\\nCase Details:\\nPlatinum VIP customer returns an unopened monitor because they changed their mind.\\n\\nIs a restocking fee charged?"}	2026-08-20 13:59:34.601466
57	57	1	{"title": "R3-SOP10: SOP Case 10: Address Correction After Dispatch", "content": "SOP Reference: KB-LOG-02 (In-Transit Address Modifications)\\nPolicy: Address modifications cannot be made directly in warehouse system once carrier has received shipment. Agent must submit carrier package redirect request ($10 fee charged by carrier, waived if error was warehouse fault).\\n\\nCase Details:\\nCustomer entered wrong street number during checkout and package is on delivery truck.\\n\\nWhat is the SOP action?"}	2026-08-20 13:59:34.611848
58	58	1	{"title": "R3-SOP11: SOP Case 11: International Duty & Customs Taxes", "content": "SOP Reference: KB-INT-01 (Customs & Import Duties)\\nPolicy: For DDP (Delivered Duty Paid) shipping, our store pays all customs taxes upfront. If local carrier mistakenly demands payment from customer upon delivery, agent verifies receipt and reimburses customer immediately.\\n\\nCase Details:\\nCanadian customer with DDP shipping was charged $28 CAD import tax by DHL courier.\\n\\nWhat is the correct resolution?"}	2026-08-20 13:59:34.611848
59	59	1	{"title": "R3-SOP12: SOP Case 12: Partial Order Fulfillment Notification", "content": "SOP Reference: KB-ORD-03 (Split Shipments)\\nPolicy: When multi-item orders ship from different regional warehouses, each shipment has an independent tracking number. Agent must look up all fulfillment child-IDs before declaring items missing.\\n\\nCase Details:\\nCustomer ordered a keyboard and mouse. Received only keyboard and claims mouse is missing.\\n\\nWhat investigation step is required?"}	2026-08-20 13:59:34.624937
60	60	1	{"title": "R3-SOP13: SOP Case 13: Chargeback Dispute Notification", "content": "SOP Reference: KB-BIL-06 (Active Bank Disputes)\\nPolicy: When a customer files a formal chargeback with their bank, the account enters legal dispute status. Agents CANNOT process manual refunds or exchanges in chat while dispute is active, as bank holds the funds. Must route to Dispute Management.\\n\\nCase Details:\\nCustomer states: 'I filed a chargeback with Chase Bank yesterday, but give me my money now.'\\n\\nWhat is the required SOP handling?"}	2026-08-20 13:59:34.629481
61	61	1	{"title": "R3-SOP14: SOP Case 14: Subscription Cancellation and Prorated Refunds", "content": "SOP Reference: KB-SUB-02 (SaaS/Software Subscription Policy)\\nPolicy: Annual software subscriptions cancelled within first 14 days receive 100% refund. Cancellations between 15-90 days receive prorated refund for unused months. Cancellations after 90 days cancel future auto-renewals only with no refund.\\n\\nCase Details:\\nCustomer cancels annual subscription on day 45 of 365.\\n\\nWhat is the correct refund entitlement?"}	2026-08-20 13:59:34.632768
62	62	1	{"title": "R3-SOP15: SOP Case 15: Escalation Matrix - Priority 1 System Outage", "content": "SOP Reference: KB-ESC-01 (Severity Classification)\\nPolicy: Severity 1 (Critical) is reserved for system-wide outages affecting checkout, multiple user data corruption, or payment gateway crash. Must alert On-Call Engineering within 5 minutes with incident ticket.\\n\\nCase Details:\\nMultiple customers simultaneously report credit card checkout throwing '502 Gateway Error'.\\n\\nWhat is the correct escalation tier and SLA?"}	2026-08-20 13:59:34.644909
83	83	1	{"title": "Filter Employees Above Threshold in Pandas", "content": "Write or select the correct Python Pandas snippet `filter_high_earners(df, threshold)` that accepts a Pandas DataFrame `df` with columns `['name', 'salary']` and returns a list of employee names earning strictly greater than `threshold`."}	2026-08-20 13:59:34.879725
84	84	1	{"title": "Python Data Aggregation Bug Fixing", "content": "The following code contains a bug in calculating average order value per customer from a list of tuples `(customer, amount)`. Identify and fix the zero division bug when a customer has no orders."}	2026-08-20 13:59:34.889855
85	85	1	{"title": "Q3.1: Pandas DataFrame Groupby & Aggregation Concepts", "content": "Given a Pandas DataFrame `df` containing `['Region', 'Revenue']`, what is the returned data structure when executing `df.groupby('Region')['Revenue'].agg(['mean', 'sum'])`?"}	2026-08-20 13:59:34.899837
86	86	1	{"title": "Q3.2: Pandas Merge vs Join Methodologies", "content": "You need to combine two Pandas DataFrames `df_orders` and `df_customers` on a common column `customer_id` keeping all orders regardless of customer match. Which Pandas method call correctly performs this operation?"}	2026-08-20 13:59:34.904907
63	63	1	{"title": "R4-SIM: Production Multi-Chat Support Console", "content": "[{\\"session_id\\": \\"CHAT-A\\", \\"customer_name\\": \\"Jessica Miller\\", \\"market\\": \\"USA (Chicago, IL)\\", \\"order_id\\": \\"#US-94821\\", \\"order_amount\\": \\"$289.00\\", \\"initial_state\\": \\"ACTIVE\\", \\"priority\\": \\"HIGH\\", \\"issue_category\\": \\"DELIVERY\\", \\"sla_first_response_sec\\": 60, \\"sla_resolution_min\\": 12, \\"timeline\\": [{\\"time_sec\\": 0, \\"sender\\": \\"customer\\", \\"message\\": \\"Hi, my package was supposed to be delivered yesterday for an anniversary gift. Tracking says 'Delayed in Transit'. Can someone please tell me where it is?\\"}, {\\"time_sec\\": 45, \\"trigger\\": \\"if_no_response\\", \\"message\\": \\"Hello? Is anyone there? I really need an update.\\"}, {\\"time_sec\\": 120, \\"sender\\": \\"customer\\", \\"message\\": \\"I checked with my neighbors and nobody has seen the FedEx truck. Can you check if it's lost?\\"}, {\\"time_sec\\": 240, \\"sender\\": \\"customer\\", \\"message\\": \\"If this can't arrive by tomorrow, I want to cancel and get a replacement sent to my office address.\\"}], \\"correct_resolution\\": {\\"ticket_category\\": \\"Delivery\\", \\"priority\\": \\"High\\", \\"resolution_code\\": \\"Replacement Initiated / Lost in Transit\\", \\"required_kb_search\\": \\"Lost in Transit\\", \\"required_internal_note\\": \\"Package delayed >48h with FedEx. Verified address. Issued replacement with priority overnight.\\"}}, {\\"session_id\\": \\"CHAT-B\\", \\"customer_name\\": \\"Alexander Hayes\\", \\"market\\": \\"Canada (Vancouver, BC)\\", \\"order_id\\": \\"#CA-40291\\", \\"order_amount\\": \\"$145.50\\", \\"initial_state\\": \\"WAITING\\", \\"priority\\": \\"URGENT\\", \\"issue_category\\": \\"BILLING\\", \\"sla_first_response_sec\\": 45, \\"sla_resolution_min\\": 10, \\"timeline\\": [{\\"time_sec\\": 30, \\"sender\\": \\"customer\\", \\"message\\": \\"I was promised a refund of $145.50 last Tuesday by your agent Mark. My credit card statement arrived today and there is NO refund. Why are you holding my money?\\"}, {\\"time_sec\\": 90, \\"sender\\": \\"customer\\", \\"message\\": \\"I have the chat transcript from Mark saying it would take 3 business days. It has been 6 business days!\\"}, {\\"time_sec\\": 180, \\"sender\\": \\"customer\\", \\"message\\": \\"Give me the ARN refund reference number so I can give it to my bank.\\"}], \\"correct_resolution\\": {\\"ticket_category\\": \\"Billing / Refund\\", \\"priority\\": \\"Critical\\", \\"resolution_code\\": \\"Refund Verified / Acquirer Reference Provided\\", \\"required_kb_search\\": \\"Refund Pending\\", \\"required_internal_note\\": \\"Checked merchant gateway. Refund was processed on Friday. Provided ARN #749281920 to customer. Reassured 3-5 bank processing days.\\"}}, {\\"session_id\\": \\"CHAT-C\\", \\"customer_name\\": \\"Daniel Kim\\", \\"market\\": \\"USA (Austin, TX)\\", \\"order_id\\": \\"#US-77182\\", \\"order_amount\\": \\"$89.99\\", \\"initial_state\\": \\"WAITING\\", \\"priority\\": \\"NORMAL\\", \\"issue_category\\": \\"WARRANTY\\", \\"sla_first_response_sec\\": 90, \\"sla_resolution_min\\": 15, \\"timeline\\": [{\\"time_sec\\": 60, \\"sender\\": \\"customer\\", \\"message\\": \\"Hey there! My wireless earbuds keep disconnecting from Bluetooth every 5 minutes. Bought them 2 months ago.\\"}, {\\"time_sec\\": 180, \\"sender\\": \\"customer\\", \\"message\\": \\"I already tried forgetting device and reconnecting. Still drops connection.\\"}, {\\"time_sec\\": 300, \\"sender\\": \\"customer\\", \\"message\\": \\"I have the original box and receipt from Best Buy online store.\\"}], \\"correct_resolution\\": {\\"ticket_category\\": \\"Warranty / Hardware\\", \\"priority\\": \\"Normal\\", \\"resolution_code\\": \\"Warranty Replacement Approved\\", \\"required_kb_search\\": \\"Warranty Eligibility\\", \\"required_internal_note\\": \\"Bluetooth disconnection unresolved by hardware reset. Unit within 1-year warranty. Generated prepaid RMA label and warranty replacement.\\"}}]"}	2026-08-20 13:59:34.669811
64	64	1	{"title": "Q1.1: Revenue Trend Analysis", "content": "A retail company reported $120,000 in Q1 revenue, which grew by 25% in Q2, and then dropped by 10% in Q3. What is the net revenue for Q3?"}	2026-08-20 13:59:34.68488
65	65	1	{"title": "Q1.2: Data Quality & Missing Value Strategy", "content": "When analyzing a customer dataset of 100,000 records, you discover that 15% of 'Customer Age' entries are null. Which approach is statistically sound for descriptive profiling before building a model?"}	2026-08-20 13:59:34.691179
66	66	1	{"title": "Q1.3: Noesys Information Security Policy & Data Protection", "content": "According to Information Security Policy, a candidate data file containing Personally Identifiable Information (PII) like employee SSNs and salaries must be exported for external presentation. What is the compliant procedure?"}	2026-08-20 13:59:34.699778
67	67	1	{"title": "Q1.4: Stakeholder Business Communication", "content": "Draft a 150-200 word email reply to a business manager explaining why Q3 sales dropped by 12% due to supply chain delays, and outline 2 data-backed recommendations."}	2026-08-20 13:59:34.707055
68	68	1	{"title": "Q1.3: Information Security Policy & Data Protection", "content": "According to Information Security Policy, a candidate data file containing Personally Identifiable Information (PII) like employee SSNs and salaries must be exported for external presentation. What is the compliant procedure?"}	2026-08-20 13:59:34.709848
69	69	1	{"title": "Regional Sales Growth Rate Analysis", "content": "Region A sales grew from $120,000 in Q1 to $156,000 in Q2. Region B sales grew from $80,000 to $108,000 in the same period. Which region achieved a higher percentage growth rate?"}	2026-08-20 13:59:34.719696
70	70	1	{"title": "Customer Acquisition Trend & Outlier Detection", "content": "Monthly new signups for 6 consecutive months are: Jan: 1,200 | Feb: 1,250 | Mar: 1,220 | Apr: 4,800 | May: 1,300 | Jun: 1,310. What is the most likely analytical interpretation of the April data point?"}	2026-08-20 13:59:34.72619
71	71	1	{"title": "Product Margin & Revenue Weighted Average", "content": "Product X yields $50,000 revenue at a 40% gross margin. Product Y yields $150,000 revenue at a 20% gross margin. What is the overall revenue-weighted gross margin percentage of the portfolio?"}	2026-08-20 13:59:34.740683
72	72	1	{"title": "Analytical Root Cause & Hypothesis Formulation", "content": "A digital commerce platform experiences a sudden 25% drop in weekly checkout conversion rate despite steady traffic volume. Detail your structured step-by-step analytical approach to isolate the root cause (e.g., funnel metrics, breakdown dimensions, technical vs marketing anomalies, and data verification steps)."}	2026-08-20 13:59:34.751702
73	73	1	{"title": "Q2.1: Top Performing Sales Representatives by Region", "content": "Write an SQL query to retrieve the top sales rep (`rep_name`), region, and total revenue for each region where total revenue exceeds $50,000. Order by total revenue descending."}	2026-08-20 13:59:34.771313
74	74	1	{"title": "Q2.2: Multi-Source Customer Order Reconciliation", "content": "Write an SQL query joining `online_orders` with legacy `access_inventory_dump` on `product_id` to compute unfulfilled order count and lost revenue."}	2026-08-20 13:59:34.780936
75	75	1	{"title": "Top 3 Revenue Customers SQL Query", "content": "Given a table `orders` with columns `customer_id`, `amount`, and `order_date`, write a SQL query to calculate total revenue per customer and return the top 3 customers ordered by revenue descending."}	2026-08-20 13:59:34.788994
76	76	1	{"title": "Dynamic Excel Lookup with XLOOKUP", "content": "You need to retrieve the `Employee_Salary` from Column D matching an `Employee_ID` in cell A2. Which XLOOKUP formula correctly performs this lookup with a default fallback of 'Not Found'?"}	2026-08-20 13:59:34.79906
77	77	1	{"title": "Multi-Source CSV & SQL Data Ingestion Strategy", "content": "When extracting monthly transactions from legacy CSV files and combining them with live SQL database tables, what is the best practice for handling schema mismatches and duplicate records?"}	2026-08-20 13:59:34.807899
78	78	1	{"title": "SQL Aggregation & Having Filter Completion", "content": "Complete the SQL query below to calculate total sales per customer and filter for customers with total revenue strictly exceeding $1,000."}	2026-08-20 13:59:34.819847
79	79	1	{"title": "Department High Earner Salary SQL Query", "content": "Given a table `employees` with columns `employee_id`, `employee_name`, `department`, `salary`, and `hire_date`, write a SQL query to calculate average salary per department and filter for departments with an average salary exceeding $80,000."}	2026-08-20 13:59:34.833424
80	80	1	{"title": "Q3.1: Modern Lookup Formulas (XLOOKUP vs VLOOKUP)", "content": "Which statement correctly describes why XLOOKUP is preferred over VLOOKUP in financial modeling?"}	2026-08-20 13:59:34.852746
81	81	1	{"title": "Q3.2: VBA Macro Loop Debugging", "content": "The following VBA macro is supposed to highlight rows where column C (Sales) is less than 1000, but it throws a runtime 1004 error. Fix the boundary condition."}	2026-08-20 13:59:34.863122
82	82	1	{"title": "Q3.3: Tableau Chart Selection for KPI Dashboards", "content": "You need to visualize monthly sales performance against quarterly targets across 5 product categories. Which chart layout is most effective for executive decision-making?"}	2026-08-20 13:59:34.869904
89	89	1	{"title": "Q3.5: Python List Comprehensions for Data Filtering", "content": "Which list comprehension correctly filters a list of sales figures `sales = [120, 450, 80, 600, 310]` to keep values greater than or equal to 300?"}	2026-08-20 13:59:34.929884
90	90	1	{"title": "Q3.6: Filter High Earner Employees in Pandas", "content": "Write or select the correct Python Pandas function `filter_high_earners(df, threshold)` that accepts a Pandas DataFrame `df` with columns `['name', 'salary']` and returns a list of employee names earning strictly greater than `threshold`."}	2026-08-20 13:59:34.939862
91	91	1	{"title": "Q3.7: Calculate Monthly Sales Growth Rate in Pandas", "content": "Write a Python Pandas function `calculate_growth_rate(sales_series)` that accepts a Pandas Series of monthly sales values and returns a Series representing percentage change between consecutive months rounded to 2 decimal places."}	2026-08-20 13:59:34.946056
92	92	1	{"title": "Q3.8: Python Data Aggregation Zero-Division Bug Fixing", "content": "The following code contains a bug in calculating average order value per customer from a list of tuples `(customer, amount)`. Identify and fix the zero division bug when a customer has no orders."}	2026-08-20 13:59:34.956325
93	93	1	{"title": "Q3.5b: Find Maximum Value Algorithmic Code Completion", "content": "Complete the missing loop body section to find and return the maximum value in a list of numbers."}	2026-08-20 13:59:34.959506
94	94	1	{"title": "Q4.1: Pandas DataFrame Groupby & Aggregation Concepts", "content": "In Pandas, what does `df.groupby('Region')['Revenue'].agg(['mean', 'sum'])` return?"}	2026-08-20 13:59:34.9794
95	95	1	{"title": "Q4.2: Pandas Practical Coding \\u2014 Clean and Group Customer Sales", "content": "Write a Python function `process_sales(df)` that filters out records with null `Customer_ID`, fills missing `Sales_Amount` with the column median, and returns total sales grouped by `Category` sorted descending."}	2026-08-20 13:59:34.989879
96	96	1	{"title": "Tableau Executive Sales Dashboard Creation", "content": "Explain the procedural step sequence in Tableau Desktop to build an executive sales dashboard displaying: 1. Total Sales KPI Card | 2. Regional Sales Bar Chart | 3. Monthly Sales Trend Line | 4. Global Region Filter."}	2026-08-20 13:59:34.998673
97	97	1	{"title": "Retail Q3 Revenue Decline Business Case Analysis", "content": "A national retail chain experienced a 15% revenue decline during Q3. Data reveals: Units sold declined 5%, average discount increased from 10% to 22%, and return rates rose from 3% to 8% in Apparel. Analyze the root cause and outline your data-driven recommendation."}	2026-08-20 13:59:34.999756
98	98	1	{"title": "Q5.2: Section B \\u2014 Analytical Decision & Anomaly Investigation", "content": "During your project analysis, your dashboard shows Region A sales surged 45% in a single month. Explain what data verification steps you would take before presenting this finding to leadership."}	2026-08-20 13:59:35.018261
99	99	1	{"title": "Project-Derived Data Cleaning & Transformation Validation", "content": "In the context of your declared project, explain how you handled missing values, duplicate records, or data type inconsistencies. Why did you select those specific cleaning techniques for your dataset?"}	2026-08-20 13:59:35.019776
100	100	1	{"title": "Q5.1: Section A \\u2014 Project Architecture & Data Lineage", "content": "Describe your primary Data Analytics project. What was the business objective, dataset origin, data cleaning steps, and what specific tools (Excel, SQL, Tableau, Python) did you personally use?"}	2026-08-20 13:59:35.029423
101	101	1	{"title": "Candidate Project Overview & Technology Declaration", "content": "Describe your primary Data Analytics project. Detail: 1. Project Title | 2. Business Problem Solved | 3. Data Sources Used | 4. Specific Tools Used (e.g. SQL, Excel, Python, Tableau) | 5. Key Analytical Findings."}	2026-08-20 13:59:35.029423
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: nasc_admin
--

COPY public.roles (id, name, description) FROM stdin;
1	Student	Student role permissions
2	Faculty	Faculty role permissions
3	Class Tutor	Class Tutor role permissions
4	HoD	HoD role permissions
5	Assessment Coordinator	Assessment Coordinator role permissions
6	ERP Coordinator	ERP Coordinator role permissions
7	Administrator	Administrator role permissions
\.


--
-- Data for Name: roster_approval_batches; Type: TABLE DATA; Schema: public; Owner: nasc_admin
--

COPY public.roster_approval_batches (id, tutor_id, programme_id, section_name, batch_name, semester_num, file_name, status, staged_data, rejection_notes, created_at, approved_at, approved_by_id) FROM stdin;
\.


--
-- Data for Name: schools; Type: TABLE DATA; Schema: public; Owner: nasc_admin
--

COPY public.schools (id, code, name) FROM stdin;
\.


--
-- Data for Name: sections; Type: TABLE DATA; Schema: public; Owner: nasc_admin
--

COPY public.sections (id, name) FROM stdin;
1	A
\.


--
-- Data for Name: semesters; Type: TABLE DATA; Schema: public; Owner: nasc_admin
--

COPY public.semesters (id, number, name, academic_year) FROM stdin;
1	4	Semester IV	2025-2026
\.


--
-- Data for Name: students; Type: TABLE DATA; Schema: public; Owner: nasc_admin
--

COPY public.students (id, user_id, register_number, programme_id, batch_name, semester_num, section_name, initial_password, status) FROM stdin;
1	6	25UGCI001	2	2025-2028	3	A	NASC@7285	Active
2	7	25UGCI002	2	2025-2028	3	A	NASC@9029	Active
3	8	25UGCI003	2	2025-2028	3	A	NASC@6732	Active
4	9	25UGCI004	2	2025-2028	3	A	NASC@9163	Active
5	10	25UGCI005	2	2025-2028	3	A	NASC@6974	Active
6	11	25UGCI006	2	2025-2028	3	A	NASC@1213	Active
7	12	25UGCI007	2	2025-2028	3	A	NASC@9621	Active
8	13	25UGCI008	2	2025-2028	3	A	NASC@7747	Active
9	14	25UGCI009	2	2025-2028	3	A	NASC@1378	Active
10	15	25UGCI010	2	2025-2028	3	A	NASC@7719	Active
11	16	25UGCI011	2	2025-2028	3	A	NASC@8478	Active
12	17	25UGCI012	2	2025-2028	3	A	NASC@9100	Active
13	18	25UIGCI013	2	2025-2028	3	A	NASC@6458	Active
14	19	25UGCI052	2	2025-2028	3	A	NASC@3328	Active
15	20	25UGCI015	2	2025-2028	3	A	NASC@1965	Active
16	21	25UGCI016	2	2025-2028	3	A	NASC@5558	Active
17	22	25UGCI017	2	2025-2028	3	A	NASC@4609	Active
18	23	25UGCI018	2	2025-2028	3	A	NASC@8045	Active
19	24	25UGCI019	2	2025-2028	3	A	NASC@9437	Active
20	25	25UGCI020	2	2025-2028	3	A	NASC@9744	Active
21	26	25UGCI022	2	2025-2028	3	A	NASC@6683	Active
22	27	25UGCI023	2	2025-2028	3	A	NASC@7952	Active
23	28	25UGCI024	2	2025-2028	3	A	NASC@2587	Active
24	29	25UGCI025	2	2025-2028	3	A	NASC@2230	Active
25	30	25UGCI026	2	2025-2028	3	A	NASC@9617	Active
26	31	25UGCI027	2	2025-2028	3	A	NASC@2894	Active
27	32	25UGCI029	2	2025-2028	3	A	NASC@8381	Active
28	33	25UGCI031	2	2025-2028	3	A	NASC@9831	Active
29	34	25UGCI032	2	2025-2028	3	A	NASC@2020	Active
30	35	25UGCI033	2	2025-2028	3	A	NASC@2237	Active
31	36	25UGCI034	2	2025-2028	3	A	NASC@1312	Active
32	37	25UGCI035	2	2025-2028	3	A	NASC@9808	Active
33	38	25UGCI037	2	2025-2028	3	A	NASC@6980	Active
34	39	25UGCI038	2	2025-2028	3	A	NASC@3073	Active
35	40	25UGCI039	2	2025-2028	3	A	NASC@8956	Active
36	41	25UGCI040	2	2025-2028	3	A	NASC@4733	Active
37	42	25UGCI041	2	2025-2028	3	A	NASC@8751	Active
38	43	25UGCI042	2	2025-2028	3	A	NASC@4925	Active
39	44	25UGCI043	2	2025-2028	3	A	NASC@8683	Active
40	45	25UGCI044	2	2025-2028	3	A	NASC@6116	Active
41	46	25UGCI046	2	2025-2028	3	A	NASC@5377	Active
42	47	25UGCI045	2	2025-2028	3	A	NASC@5918	Active
43	48	25UGCI047	2	2025-2028	3	A	NASC@5402	Active
44	49	25UGCI048	2	2025-2028	3	A	NASC@3194	Active
45	50	25UGCI049	2	2025-2028	3	A	NASC@1480	Active
46	51	25UGCI050	2	2025-2028	3	A	NASC@3514	Active
47	52	25UGCI051	2	2025-2028	3	A	NASC@1979	Active
48	56	23pgdt005	3	2024-2027	3	A	s	Active
50	58	stud1	3	2024-2027	3	A	1	Active
\.


--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: nasc_admin
--

COPY public.user_roles (user_id, role_id) FROM stdin;
1	7
4	4
5	4
6	1
7	1
8	1
9	1
10	1
11	1
12	1
13	1
14	1
15	1
16	1
17	1
18	1
19	1
20	1
21	1
22	1
23	1
24	1
25	1
26	1
27	1
28	1
29	1
30	1
31	1
32	1
33	1
34	1
35	1
36	1
37	1
38	1
39	1
40	1
41	1
42	1
43	1
44	1
45	1
46	1
47	1
48	1
49	1
50	1
51	1
52	1
53	4
55	3
54	2
56	1
58	1
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: nasc_admin
--

COPY public.users (id, username, email, hashed_password, full_name, mobile, is_active, created_at) FROM stdin;
2	archived_creator_2	archived2@nasccbe.ac.in	$2b$12$e0...archived.locked.hash	Archived Creator (ID: 2)	\N	f	2026-08-08 00:00:00
3	archived_creator_3	archived3@nasccbe.ac.in	$2b$12$e0...archived.locked.hash	Archived Creator (ID: 3)	\N	f	2026-08-08 00:00:00
7	25UGCI002	allbinb1010@gmail.com	plain:NASC@9029	ALLBIN JEBUSTIN B	9876543210	t	2026-08-03 02:06:56.910826
8	25UGCI003	anfiyaraffik12@gmail.com	plain:NASC@6732	Anfiya Banu M	9876543210	t	2026-08-03 02:06:56.919126
9	25UGCI004	arjunarjun70495@gmail.com	plain:NASC@9163	ARJUN K  R	9876543210	t	2026-08-03 02:06:56.924792
10	25UGCI005	jasieelachippu@gmail.com	plain:NASC@6974	ASHIFA	9876543210	t	2026-08-03 02:06:56.931681
11	25UGCI006	azhaguswathi575@gmail.com	plain:NASC@1213	AZHAGU SWATHI M.S	9876543210	t	2026-08-03 02:06:56.937279
12	25UGCI007	balavarshan555777@gmail.com	plain:NASC@9621	BALAVARSHAN  R	9876543210	t	2026-08-03 02:06:56.943266
13	25UGCI008	deepikanasc2007@gmail.com	plain:NASC@7747	DEEPIKA B	9876543210	t	2026-08-03 02:06:56.955566
14	25UGCI009	eraja5048@gmail.com	plain:NASC@1378	ESAKKI RAJA S	9876543210	t	2026-08-03 02:06:56.959471
15	25UGCI010	fizafathimam0@gmail.com	plain:NASC@7719	Fiza Fathima M	9876543210	t	2026-08-03 02:06:56.969362
16	25UGCI011	fiyaina21@gmail.com	plain:NASC@8478	INAFIYA S	9876543210	t	2026-08-03 02:06:56.975826
17	25UGCI012	dheegirldheegril@gmail.com	plain:NASC@9100	INDHU MATHI R	9876543210	t	2026-08-03 02:06:56.98629
18	25UIGCI013	jprasath316@gmail.com	plain:NASC@6458	Jeevan Prasath J	9876543210	t	2026-08-03 02:06:56.993453
19	25UGCI052	25ugci052@nasccbe.ac.in	plain:NASC@3328	KABILAN K	9876543210	t	2026-08-03 02:06:57.003536
20	25UGCI015	keerth977@gmail.com	plain:NASC@1965	KEERTHANA R	9876543210	t	2026-08-03 02:06:57.009131
21	25UGCI016	skkishorekishore253@gmail.com	plain:NASC@5558	KISHORE S	9876543210	t	2026-08-03 02:06:57.016743
22	25UGCI017	logamithran390@gmail.com	plain:NASC@4609	LOGAMITHRAN S	9876543210	t	2026-08-03 02:06:57.021586
23	25UGCI018	lofixxx2007@gmail.com	plain:NASC@8045	LOKESH C	9876543210	t	2026-08-03 02:06:57.031634
24	25UGCI019	lokithalokitha135@gmail.com	plain:NASC@9437	LOKITHA P	9876543210	t	2026-08-03 02:06:57.035846
25	25UGCI020	Mohamedniyas333444@gmail.com	plain:NASC@9744	MOHAMED NIYAS M	9876543210	t	2026-08-03 02:06:57.047514
26	25UGCI022	mohanapriya1832008@gmail.com	plain:NASC@6683	MOHANA PRIYA S	9876543210	t	2026-08-03 02:06:57.057679
27	25UGCI023	25ugci023@nasccbe.ac.in	plain:NASC@7952	Natheeswaran B	9876543210	t	2026-08-03 02:06:57.06732
28	25UGCI024	25ugci024@nasccbe.ac.in	plain:NASC@2587	Navajeevan K	9876543210	t	2026-08-03 02:06:57.077465
29	25UGCI025	25ugci025@nasccbe.ac.in	plain:NASC@2230	NIKILA R	9876543210	t	2026-08-03 02:06:57.083815
30	25UGCI026	25ugci026@nasccbe.ac.in	plain:NASC@9617	PADHMANABAN G	9876543210	t	2026-08-03 02:06:57.090009
31	25UGCI027	25ugci027@nasccbe.ac.in	plain:NASC@2894	PRASITHA SREE J	9876543210	t	2026-08-03 02:06:57.093428
32	25UGCI029	25ugci029@nasccbe.ac.in	plain:NASC@8381	RAHUL K	9876543210	t	2026-08-03 02:06:57.098475
33	25UGCI031	25ugci031@nasccbe.ac.in	plain:NASC@9831	RIHFAN H	9876543210	t	2026-08-03 02:06:57.106612
34	25UGCI032	25ugci032@nasccbe.ac.in	plain:NASC@2020	RITHICK ROSHAN R	9876543210	t	2026-08-03 02:06:57.114806
35	25UGCI033	25ugci033@nasccbe.ac.in	plain:NASC@2237	RITHIKA S	9876543210	t	2026-08-03 02:06:57.123365
36	25UGCI034	25ugci034@nasccbe.ac.in	plain:NASC@1312	ROBIN JUSTIN B	9876543210	t	2026-08-03 02:06:57.126039
37	25UGCI035	25ugci035@nasccbe.ac.in	plain:NASC@9808	SAFRIN A	9876543210	t	2026-08-03 02:06:57.133516
38	25UGCI037	25ugci037@nasccbe.ac.in	plain:NASC@6980	SAKTHI M	9876543210	t	2026-08-03 02:06:57.140111
39	25UGCI038	25ugci038@nasccbe.ac.in	plain:NASC@3073	SANDHIYA S	9876543210	t	2026-08-03 02:06:57.143197
40	25UGCI039	25ugci039@nasccbe.ac.in	plain:NASC@8956	SARAVANA PRASATH S	9876543210	t	2026-08-03 02:06:57.148648
41	25UGCI040	25ugci040@nasccbe.ac.in	plain:NASC@4733	SARAVANAN K	9876543210	t	2026-08-03 02:06:57.156471
42	25UGCI041	25ugci041@nasccbe.ac.in	plain:NASC@8751	Siva Prakash R	9876543210	t	2026-08-03 02:06:57.163558
43	25UGCI042	25ugci042@nasccbe.ac.in	plain:NASC@4925	SRI MALINI D	9876543210	t	2026-08-03 02:06:57.164913
44	25UGCI043	25ugci043@nasccbe.ac.in	plain:NASC@8683	SUBIKSHA M	9876543210	t	2026-08-03 02:06:57.173497
45	25UGCI044	25ugci044@nasccbe.ac.in	plain:NASC@6116	Suhail Akthar M	9876543210	t	2026-08-03 02:06:57.176039
46	25UGCI046	25ugci046@nasccbe.ac.in	plain:NASC@5377	SUNDARESHWARAN S	9876543210	t	2026-08-03 02:06:57.183485
47	25UGCI045	25ugci045@nasccbe.ac.in	plain:NASC@5918	SURYA KUMAR A	9876543210	t	2026-08-03 02:06:57.190223
48	25UGCI047	25ugci047@nasccbe.ac.in	plain:NASC@5402	TAMILSELVAN M	9876543210	t	2026-08-03 02:06:57.197681
49	25UGCI048	25ugci048@nasccbe.ac.in	plain:NASC@3194	THIRUPATHI S	9876543210	t	2026-08-03 02:06:57.203355
50	25UGCI049	25ugci049@nasccbe.ac.in	plain:NASC@1480	VIKRAM H	9876543210	t	2026-08-03 02:06:57.207459
51	25UGCI050	25ugci050@nasccbe.ac.in	plain:NASC@3514	VISHNU B	9876543210	t	2026-08-03 02:06:57.214974
52	25UGCI051	25ugci051@nasccbe.ac.in	plain:NASC@1979	VISHNU V	9876543210	t	2026-08-03 02:06:57.223652
6	25UGCI001	abdulbashida001.bcomit25@nehrucolleges.com	$2b$12$k8ErGV66DJE51Dcb901/seii1OJ2C1GLyUGQD7GDgbNiSoY3/Dmcy	Abdul Basith A	9876543210	t	2026-08-03 02:06:56.89955
1	admin	admin@nasccbe.ac.in	$2b$12$WEEb5gW3gllZoTNfQjE29.ONjL65LXilik83BVx759qBTjHGK2Ux.	System Administrator	9876543210	t	2026-08-02 11:18:20.593691
4	hod_test1	hod1@test.com	$2b$12$opW.0MYMM/OVVPBWzwpDk.SRRutzNW77bXTdkqC1QEbNOs4Vb0oUG	HOD Test	9876543210	t	2026-08-02 14:41:48.35747
5	hod_test2	hod2@test.com	$2b$12$fT1cDV/EV4j1P5sQoj0GRuCqyXJXAulQFmIqtRzhJth..lxRVwJ.u	HOD Test 2	9876543210	t	2026-08-02 14:45:12.37415
53	eid	nascsaranya@nehrucolleges.com	$2b$12$RCOhYkxtVGms.pLpkS3mTeecOCCubA2roXfljd7MzpOJVOXZKhtfW	Dr.N.Saranya	9876543210	t	2026-08-10 08:22:24.15131
54	e6505	nithishkkumar253@gmail.com	$2b$12$m6e1UXqNBnriQ76OMcIX2eFEf7KbKV8nPVuygt.qt.ooLAJdhCEdS	Nithish Kumar S	9876543210	t	2026-08-11 01:51:58.855822
55	e6504	nithishkkumarshan@gmail.com	$2b$12$eE5stl3hyvXoiIAgkN8fkOKFrhL/skkdDBXPKTQg3lp9L/3cdC7ES	Mr.S Nithish Kumar	9876543210	t	2026-08-12 01:48:57.83693
56	23pgdt005	nithish.hink@gmail.com	$2b$12$M845pD7nBpYFwgmw2ES/UekFFMFLnN0Jjt6KyADSPY5IJqmK5Dxha	Mr.Nithish kumar	9876543210	t	2026-08-12 05:59:43.427315
58	stud1	stud@gmail	$2b$12$9oj2Wxh3tEhSOZuSY3AgHuRMaxZ.5wzOw680Kfx.zs/rn/b5GDO6G	stud	9876543210	t	2026-08-23 06:52:24.283427
\.


--
-- Name: academic_classes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nasc_admin
--

SELECT pg_catalog.setval('public.academic_classes_id_seq', 5, true);


--
-- Name: academic_scopes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nasc_admin
--

SELECT pg_catalog.setval('public.academic_scopes_id_seq', 1, false);


--
-- Name: academic_years_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nasc_admin
--

SELECT pg_catalog.setval('public.academic_years_id_seq', 1, true);


--
-- Name: allocation_approval_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nasc_admin
--

SELECT pg_catalog.setval('public.allocation_approval_history_id_seq', 4, true);


--
-- Name: assessment_activation_candidates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nasc_admin
--

SELECT pg_catalog.setval('public.assessment_activation_candidates_id_seq', 23, true);


--
-- Name: assessment_activation_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nasc_admin
--

SELECT pg_catalog.setval('public.assessment_activation_requests_id_seq', 23, true);


--
-- Name: assessment_attempts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nasc_admin
--

SELECT pg_catalog.setval('public.assessment_attempts_id_seq', 178, true);


--
-- Name: assessment_domains_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nasc_admin
--

SELECT pg_catalog.setval('public.assessment_domains_id_seq', 8, true);


--
-- Name: assessment_policies_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nasc_admin
--

SELECT pg_catalog.setval('public.assessment_policies_id_seq', 25, true);


--
-- Name: assessment_questions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nasc_admin
--

SELECT pg_catalog.setval('public.assessment_questions_id_seq', 206, true);


--
-- Name: assessment_reattempt_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nasc_admin
--

SELECT pg_catalog.setval('public.assessment_reattempt_requests_id_seq', 49, true);


--
-- Name: assessment_responses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nasc_admin
--

SELECT pg_catalog.setval('public.assessment_responses_id_seq', 128, true);


--
-- Name: assessment_results_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nasc_admin
--

SELECT pg_catalog.setval('public.assessment_results_id_seq', 123, true);


--
-- Name: assessment_rounds_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nasc_admin
--

SELECT pg_catalog.setval('public.assessment_rounds_id_seq', 25, true);


--
-- Name: assessment_student_allocations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nasc_admin
--

SELECT pg_catalog.setval('public.assessment_student_allocations_id_seq', 78, true);


--
-- Name: attempt_question_snapshots_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nasc_admin
--

SELECT pg_catalog.setval('public.attempt_question_snapshots_id_seq', 457, true);


--
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nasc_admin
--

SELECT pg_catalog.setval('public.audit_logs_id_seq', 143, true);


--
-- Name: batches_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nasc_admin
--

SELECT pg_catalog.setval('public.batches_id_seq', 2, true);


--
-- Name: code_execution_results_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nasc_admin
--

SELECT pg_catalog.setval('public.code_execution_results_id_seq', 1, false);


--
-- Name: coding_submissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nasc_admin
--

SELECT pg_catalog.setval('public.coding_submissions_id_seq', 1, false);


--
-- Name: competencies_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nasc_admin
--

SELECT pg_catalog.setval('public.competencies_id_seq', 77, true);


--
-- Name: competency_scores_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nasc_admin
--

SELECT pg_catalog.setval('public.competency_scores_id_seq', 215, true);


--
-- Name: course_allocations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nasc_admin
--

SELECT pg_catalog.setval('public.course_allocations_id_seq', 3, true);


--
-- Name: course_enrolments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nasc_admin
--

SELECT pg_catalog.setval('public.course_enrolments_id_seq', 96, true);


--
-- Name: courses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nasc_admin
--

SELECT pg_catalog.setval('public.courses_id_seq', 4, true);


--
-- Name: departments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nasc_admin
--

SELECT pg_catalog.setval('public.departments_id_seq', 4, true);


--
-- Name: faculty_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nasc_admin
--

SELECT pg_catalog.setval('public.faculty_id_seq', 7, true);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nasc_admin
--

SELECT pg_catalog.setval('public.notifications_id_seq', 93, true);


--
-- Name: obe_attainment_records_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nasc_admin
--

SELECT pg_catalog.setval('public.obe_attainment_records_id_seq', 1, false);


--
-- Name: proctoring_events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nasc_admin
--

SELECT pg_catalog.setval('public.proctoring_events_id_seq', 1, false);


--
-- Name: programmes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nasc_admin
--

SELECT pg_catalog.setval('public.programmes_id_seq', 3, true);


--
-- Name: question_evaluation_configs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nasc_admin
--

SELECT pg_catalog.setval('public.question_evaluation_configs_id_seq', 206, true);


--
-- Name: question_versions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nasc_admin
--

SELECT pg_catalog.setval('public.question_versions_id_seq', 101, true);


--
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nasc_admin
--

SELECT pg_catalog.setval('public.roles_id_seq', 7, true);


--
-- Name: roster_approval_batches_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nasc_admin
--

SELECT pg_catalog.setval('public.roster_approval_batches_id_seq', 1, true);


--
-- Name: schools_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nasc_admin
--

SELECT pg_catalog.setval('public.schools_id_seq', 1, true);


--
-- Name: sections_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nasc_admin
--

SELECT pg_catalog.setval('public.sections_id_seq', 1, true);


--
-- Name: semesters_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nasc_admin
--

SELECT pg_catalog.setval('public.semesters_id_seq', 1, true);


--
-- Name: students_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nasc_admin
--

SELECT pg_catalog.setval('public.students_id_seq', 50, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nasc_admin
--

SELECT pg_catalog.setval('public.users_id_seq', 58, true);


--
-- Name: academic_classes academic_classes_pkey; Type: CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.academic_classes
    ADD CONSTRAINT academic_classes_pkey PRIMARY KEY (id);


--
-- Name: academic_scopes academic_scopes_pkey; Type: CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.academic_scopes
    ADD CONSTRAINT academic_scopes_pkey PRIMARY KEY (id);


--
-- Name: academic_years academic_years_pkey; Type: CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.academic_years
    ADD CONSTRAINT academic_years_pkey PRIMARY KEY (id);


--
-- Name: academic_years academic_years_year_code_key; Type: CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.academic_years
    ADD CONSTRAINT academic_years_year_code_key UNIQUE (year_code);


--
-- Name: allocation_approval_history allocation_approval_history_pkey; Type: CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.allocation_approval_history
    ADD CONSTRAINT allocation_approval_history_pkey PRIMARY KEY (id);


--
-- Name: assessment_activation_candidates assessment_activation_candidates_pkey; Type: CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.assessment_activation_candidates
    ADD CONSTRAINT assessment_activation_candidates_pkey PRIMARY KEY (id);


--
-- Name: assessment_activation_requests assessment_activation_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.assessment_activation_requests
    ADD CONSTRAINT assessment_activation_requests_pkey PRIMARY KEY (id);


--
-- Name: assessment_attempts assessment_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.assessment_attempts
    ADD CONSTRAINT assessment_attempts_pkey PRIMARY KEY (id);


--
-- Name: assessment_domains assessment_domains_pkey; Type: CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.assessment_domains
    ADD CONSTRAINT assessment_domains_pkey PRIMARY KEY (id);


--
-- Name: assessment_policies assessment_policies_pkey; Type: CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.assessment_policies
    ADD CONSTRAINT assessment_policies_pkey PRIMARY KEY (id);


--
-- Name: assessment_policies assessment_policies_round_id_key; Type: CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.assessment_policies
    ADD CONSTRAINT assessment_policies_round_id_key UNIQUE (round_id);


--
-- Name: assessment_questions assessment_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.assessment_questions
    ADD CONSTRAINT assessment_questions_pkey PRIMARY KEY (id);


--
-- Name: assessment_reattempt_requests assessment_reattempt_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.assessment_reattempt_requests
    ADD CONSTRAINT assessment_reattempt_requests_pkey PRIMARY KEY (id);


--
-- Name: assessment_responses assessment_responses_pkey; Type: CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.assessment_responses
    ADD CONSTRAINT assessment_responses_pkey PRIMARY KEY (id);


--
-- Name: assessment_results assessment_results_attempt_id_key; Type: CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.assessment_results
    ADD CONSTRAINT assessment_results_attempt_id_key UNIQUE (attempt_id);


--
-- Name: assessment_results assessment_results_pkey; Type: CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.assessment_results
    ADD CONSTRAINT assessment_results_pkey PRIMARY KEY (id);


--
-- Name: assessment_rounds assessment_rounds_pkey; Type: CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.assessment_rounds
    ADD CONSTRAINT assessment_rounds_pkey PRIMARY KEY (id);


--
-- Name: assessment_student_allocations assessment_student_allocations_pkey; Type: CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.assessment_student_allocations
    ADD CONSTRAINT assessment_student_allocations_pkey PRIMARY KEY (id);


--
-- Name: attempt_question_snapshots attempt_question_snapshots_pkey; Type: CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.attempt_question_snapshots
    ADD CONSTRAINT attempt_question_snapshots_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: batches batches_pkey; Type: CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.batches
    ADD CONSTRAINT batches_pkey PRIMARY KEY (id);


--
-- Name: code_execution_results code_execution_results_pkey; Type: CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.code_execution_results
    ADD CONSTRAINT code_execution_results_pkey PRIMARY KEY (id);


--
-- Name: coding_submissions coding_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.coding_submissions
    ADD CONSTRAINT coding_submissions_pkey PRIMARY KEY (id);


--
-- Name: competencies competencies_pkey; Type: CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.competencies
    ADD CONSTRAINT competencies_pkey PRIMARY KEY (id);


--
-- Name: competency_scores competency_scores_pkey; Type: CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.competency_scores
    ADD CONSTRAINT competency_scores_pkey PRIMARY KEY (id);


--
-- Name: course_allocations course_allocations_pkey; Type: CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.course_allocations
    ADD CONSTRAINT course_allocations_pkey PRIMARY KEY (id);


--
-- Name: course_enrolments course_enrolments_pkey; Type: CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.course_enrolments
    ADD CONSTRAINT course_enrolments_pkey PRIMARY KEY (id);


--
-- Name: courses courses_pkey; Type: CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_pkey PRIMARY KEY (id);


--
-- Name: departments departments_code_key; Type: CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_code_key UNIQUE (code);


--
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);


--
-- Name: faculty faculty_pkey; Type: CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.faculty
    ADD CONSTRAINT faculty_pkey PRIMARY KEY (id);


--
-- Name: faculty faculty_user_id_key; Type: CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.faculty
    ADD CONSTRAINT faculty_user_id_key UNIQUE (user_id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: obe_attainment_records obe_attainment_records_pkey; Type: CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.obe_attainment_records
    ADD CONSTRAINT obe_attainment_records_pkey PRIMARY KEY (id);


--
-- Name: proctoring_events proctoring_events_pkey; Type: CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.proctoring_events
    ADD CONSTRAINT proctoring_events_pkey PRIMARY KEY (id);


--
-- Name: programmes programmes_code_key; Type: CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.programmes
    ADD CONSTRAINT programmes_code_key UNIQUE (code);


--
-- Name: programmes programmes_pkey; Type: CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.programmes
    ADD CONSTRAINT programmes_pkey PRIMARY KEY (id);


--
-- Name: question_evaluation_configs question_evaluation_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.question_evaluation_configs
    ADD CONSTRAINT question_evaluation_configs_pkey PRIMARY KEY (id);


--
-- Name: question_evaluation_configs question_evaluation_configs_question_id_key; Type: CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.question_evaluation_configs
    ADD CONSTRAINT question_evaluation_configs_question_id_key UNIQUE (question_id);


--
-- Name: question_versions question_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.question_versions
    ADD CONSTRAINT question_versions_pkey PRIMARY KEY (id);


--
-- Name: roles roles_name_key; Type: CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_key UNIQUE (name);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: roster_approval_batches roster_approval_batches_pkey; Type: CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.roster_approval_batches
    ADD CONSTRAINT roster_approval_batches_pkey PRIMARY KEY (id);


--
-- Name: schools schools_code_key; Type: CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.schools
    ADD CONSTRAINT schools_code_key UNIQUE (code);


--
-- Name: schools schools_pkey; Type: CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.schools
    ADD CONSTRAINT schools_pkey PRIMARY KEY (id);


--
-- Name: sections sections_pkey; Type: CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.sections
    ADD CONSTRAINT sections_pkey PRIMARY KEY (id);


--
-- Name: semesters semesters_pkey; Type: CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.semesters
    ADD CONSTRAINT semesters_pkey PRIMARY KEY (id);


--
-- Name: students students_pkey; Type: CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_pkey PRIMARY KEY (id);


--
-- Name: students students_user_id_key; Type: CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_user_id_key UNIQUE (user_id);


--
-- Name: assessment_attempts uq_allocation_round_attempt_num; Type: CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.assessment_attempts
    ADD CONSTRAINT uq_allocation_round_attempt_num UNIQUE (allocation_id, round_id, attempt_number);


--
-- Name: assessment_responses uq_attempt_question_response; Type: CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.assessment_responses
    ADD CONSTRAINT uq_attempt_question_response UNIQUE (attempt_id, question_id);


--
-- Name: assessment_rounds uq_domain_round_number; Type: CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.assessment_rounds
    ADD CONSTRAINT uq_domain_round_number UNIQUE (domain_id, round_number);


--
-- Name: assessment_rounds uq_domain_round_slug; Type: CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.assessment_rounds
    ADD CONSTRAINT uq_domain_round_slug UNIQUE (domain_id, slug);


--
-- Name: question_versions uq_question_version; Type: CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.question_versions
    ADD CONSTRAINT uq_question_version UNIQUE (question_id, version_num);


--
-- Name: assessment_activation_candidates uq_request_candidate; Type: CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.assessment_activation_candidates
    ADD CONSTRAINT uq_request_candidate UNIQUE (request_id, student_id);


--
-- Name: assessment_student_allocations uq_request_student_allocation; Type: CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.assessment_student_allocations
    ADD CONSTRAINT uq_request_student_allocation UNIQUE (request_id, student_id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (user_id, role_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: ix_academic_classes_class_code; Type: INDEX; Schema: public; Owner: nasc_admin
--

CREATE UNIQUE INDEX ix_academic_classes_class_code ON public.academic_classes USING btree (class_code);


--
-- Name: ix_academic_classes_id; Type: INDEX; Schema: public; Owner: nasc_admin
--

CREATE INDEX ix_academic_classes_id ON public.academic_classes USING btree (id);


--
-- Name: ix_academic_scopes_id; Type: INDEX; Schema: public; Owner: nasc_admin
--

CREATE INDEX ix_academic_scopes_id ON public.academic_scopes USING btree (id);


--
-- Name: ix_academic_years_id; Type: INDEX; Schema: public; Owner: nasc_admin
--

CREATE INDEX ix_academic_years_id ON public.academic_years USING btree (id);


--
-- Name: ix_allocation_approval_history_id; Type: INDEX; Schema: public; Owner: nasc_admin
--

CREATE INDEX ix_allocation_approval_history_id ON public.allocation_approval_history USING btree (id);


--
-- Name: ix_allocation_student_status; Type: INDEX; Schema: public; Owner: nasc_admin
--

CREATE INDEX ix_allocation_student_status ON public.assessment_student_allocations USING btree (student_id, status);


--
-- Name: ix_assessment_activation_candidates_id; Type: INDEX; Schema: public; Owner: nasc_admin
--

CREATE INDEX ix_assessment_activation_candidates_id ON public.assessment_activation_candidates USING btree (id);


--
-- Name: ix_assessment_activation_candidates_request_id; Type: INDEX; Schema: public; Owner: nasc_admin
--

CREATE INDEX ix_assessment_activation_candidates_request_id ON public.assessment_activation_candidates USING btree (request_id);


--
-- Name: ix_assessment_activation_candidates_student_id; Type: INDEX; Schema: public; Owner: nasc_admin
--

CREATE INDEX ix_assessment_activation_candidates_student_id ON public.assessment_activation_candidates USING btree (student_id);


--
-- Name: ix_assessment_activation_requests_academic_class_id; Type: INDEX; Schema: public; Owner: nasc_admin
--

CREATE INDEX ix_assessment_activation_requests_academic_class_id ON public.assessment_activation_requests USING btree (academic_class_id);


--
-- Name: ix_assessment_activation_requests_domain_id; Type: INDEX; Schema: public; Owner: nasc_admin
--

CREATE INDEX ix_assessment_activation_requests_domain_id ON public.assessment_activation_requests USING btree (domain_id);


--
-- Name: ix_assessment_activation_requests_id; Type: INDEX; Schema: public; Owner: nasc_admin
--

CREATE INDEX ix_assessment_activation_requests_id ON public.assessment_activation_requests USING btree (id);


--
-- Name: ix_assessment_activation_requests_status; Type: INDEX; Schema: public; Owner: nasc_admin
--

CREATE INDEX ix_assessment_activation_requests_status ON public.assessment_activation_requests USING btree (status);


--
-- Name: ix_assessment_attempts_allocation_id; Type: INDEX; Schema: public; Owner: nasc_admin
--

CREATE INDEX ix_assessment_attempts_allocation_id ON public.assessment_attempts USING btree (allocation_id);


--
-- Name: ix_assessment_attempts_id; Type: INDEX; Schema: public; Owner: nasc_admin
--

CREATE INDEX ix_assessment_attempts_id ON public.assessment_attempts USING btree (id);


--
-- Name: ix_assessment_attempts_round_id; Type: INDEX; Schema: public; Owner: nasc_admin
--

CREATE INDEX ix_assessment_attempts_round_id ON public.assessment_attempts USING btree (round_id);


--
-- Name: ix_assessment_attempts_status; Type: INDEX; Schema: public; Owner: nasc_admin
--

CREATE INDEX ix_assessment_attempts_status ON public.assessment_attempts USING btree (status);


--
-- Name: ix_assessment_domains_id; Type: INDEX; Schema: public; Owner: nasc_admin
--

CREATE INDEX ix_assessment_domains_id ON public.assessment_domains USING btree (id);


--
-- Name: ix_assessment_domains_slug; Type: INDEX; Schema: public; Owner: nasc_admin
--

CREATE UNIQUE INDEX ix_assessment_domains_slug ON public.assessment_domains USING btree (slug);


--
-- Name: ix_assessment_policies_id; Type: INDEX; Schema: public; Owner: nasc_admin
--

CREATE INDEX ix_assessment_policies_id ON public.assessment_policies USING btree (id);


--
-- Name: ix_assessment_questions_competency_id; Type: INDEX; Schema: public; Owner: nasc_admin
--

CREATE INDEX ix_assessment_questions_competency_id ON public.assessment_questions USING btree (competency_id);


--
-- Name: ix_assessment_questions_id; Type: INDEX; Schema: public; Owner: nasc_admin
--

CREATE INDEX ix_assessment_questions_id ON public.assessment_questions USING btree (id);


--
-- Name: ix_assessment_questions_round_id; Type: INDEX; Schema: public; Owner: nasc_admin
--

CREATE INDEX ix_assessment_questions_round_id ON public.assessment_questions USING btree (round_id);


--
-- Name: ix_assessment_reattempt_requests_allocation_id; Type: INDEX; Schema: public; Owner: nasc_admin
--

CREATE INDEX ix_assessment_reattempt_requests_allocation_id ON public.assessment_reattempt_requests USING btree (allocation_id);


--
-- Name: ix_assessment_reattempt_requests_id; Type: INDEX; Schema: public; Owner: nasc_admin
--

CREATE INDEX ix_assessment_reattempt_requests_id ON public.assessment_reattempt_requests USING btree (id);


--
-- Name: ix_assessment_reattempt_requests_round_id; Type: INDEX; Schema: public; Owner: nasc_admin
--

CREATE INDEX ix_assessment_reattempt_requests_round_id ON public.assessment_reattempt_requests USING btree (round_id);


--
-- Name: ix_assessment_reattempt_requests_status; Type: INDEX; Schema: public; Owner: nasc_admin
--

CREATE INDEX ix_assessment_reattempt_requests_status ON public.assessment_reattempt_requests USING btree (status);


--
-- Name: ix_assessment_reattempt_requests_student_id; Type: INDEX; Schema: public; Owner: nasc_admin
--

CREATE INDEX ix_assessment_reattempt_requests_student_id ON public.assessment_reattempt_requests USING btree (student_id);


--
-- Name: ix_assessment_responses_attempt_id; Type: INDEX; Schema: public; Owner: nasc_admin
--

CREATE INDEX ix_assessment_responses_attempt_id ON public.assessment_responses USING btree (attempt_id);


--
-- Name: ix_assessment_responses_id; Type: INDEX; Schema: public; Owner: nasc_admin
--

CREATE INDEX ix_assessment_responses_id ON public.assessment_responses USING btree (id);


--
-- Name: ix_assessment_results_id; Type: INDEX; Schema: public; Owner: nasc_admin
--

CREATE INDEX ix_assessment_results_id ON public.assessment_results USING btree (id);


--
-- Name: ix_assessment_rounds_domain_id; Type: INDEX; Schema: public; Owner: nasc_admin
--

CREATE INDEX ix_assessment_rounds_domain_id ON public.assessment_rounds USING btree (domain_id);


--
-- Name: ix_assessment_rounds_id; Type: INDEX; Schema: public; Owner: nasc_admin
--

CREATE INDEX ix_assessment_rounds_id ON public.assessment_rounds USING btree (id);


--
-- Name: ix_assessment_rounds_slug; Type: INDEX; Schema: public; Owner: nasc_admin
--

CREATE INDEX ix_assessment_rounds_slug ON public.assessment_rounds USING btree (slug);


--
-- Name: ix_assessment_student_allocations_id; Type: INDEX; Schema: public; Owner: nasc_admin
--

CREATE INDEX ix_assessment_student_allocations_id ON public.assessment_student_allocations USING btree (id);


--
-- Name: ix_assessment_student_allocations_request_id; Type: INDEX; Schema: public; Owner: nasc_admin
--

CREATE INDEX ix_assessment_student_allocations_request_id ON public.assessment_student_allocations USING btree (request_id);


--
-- Name: ix_assessment_student_allocations_status; Type: INDEX; Schema: public; Owner: nasc_admin
--

CREATE INDEX ix_assessment_student_allocations_status ON public.assessment_student_allocations USING btree (status);


--
-- Name: ix_assessment_student_allocations_student_id; Type: INDEX; Schema: public; Owner: nasc_admin
--

CREATE INDEX ix_assessment_student_allocations_student_id ON public.assessment_student_allocations USING btree (student_id);


--
-- Name: ix_attempt_allocation_round; Type: INDEX; Schema: public; Owner: nasc_admin
--

CREATE INDEX ix_attempt_allocation_round ON public.assessment_attempts USING btree (allocation_id, round_id);


--
-- Name: ix_attempt_question_snapshots_attempt_id; Type: INDEX; Schema: public; Owner: nasc_admin
--

CREATE INDEX ix_attempt_question_snapshots_attempt_id ON public.attempt_question_snapshots USING btree (attempt_id);


--
-- Name: ix_attempt_question_snapshots_id; Type: INDEX; Schema: public; Owner: nasc_admin
--

CREATE INDEX ix_attempt_question_snapshots_id ON public.attempt_question_snapshots USING btree (id);


--
-- Name: ix_attempt_status; Type: INDEX; Schema: public; Owner: nasc_admin
--

CREATE INDEX ix_attempt_status ON public.assessment_attempts USING btree (status);


--
-- Name: ix_audit_logs_id; Type: INDEX; Schema: public; Owner: nasc_admin
--

CREATE INDEX ix_audit_logs_id ON public.audit_logs USING btree (id);


--
-- Name: ix_batches_id; Type: INDEX; Schema: public; Owner: nasc_admin
--

CREATE INDEX ix_batches_id ON public.batches USING btree (id);


--
-- Name: ix_code_execution_results_id; Type: INDEX; Schema: public; Owner: nasc_admin
--

CREATE INDEX ix_code_execution_results_id ON public.code_execution_results USING btree (id);


--
-- Name: ix_code_execution_results_submission_id; Type: INDEX; Schema: public; Owner: nasc_admin
--

CREATE INDEX ix_code_execution_results_submission_id ON public.code_execution_results USING btree (submission_id);


--
-- Name: ix_coding_submissions_attempt_id; Type: INDEX; Schema: public; Owner: nasc_admin
--

CREATE INDEX ix_coding_submissions_attempt_id ON public.coding_submissions USING btree (attempt_id);


--
-- Name: ix_coding_submissions_id; Type: INDEX; Schema: public; Owner: nasc_admin
--

CREATE INDEX ix_coding_submissions_id ON public.coding_submissions USING btree (id);


--
-- Name: ix_competencies_code; Type: INDEX; Schema: public; Owner: nasc_admin
--

CREATE UNIQUE INDEX ix_competencies_code ON public.competencies USING btree (code);


--
-- Name: ix_competencies_id; Type: INDEX; Schema: public; Owner: nasc_admin
--

CREATE INDEX ix_competencies_id ON public.competencies USING btree (id);


--
-- Name: ix_competency_scores_attempt_id; Type: INDEX; Schema: public; Owner: nasc_admin
--

CREATE INDEX ix_competency_scores_attempt_id ON public.competency_scores USING btree (attempt_id);


--
-- Name: ix_competency_scores_competency_id; Type: INDEX; Schema: public; Owner: nasc_admin
--

CREATE INDEX ix_competency_scores_competency_id ON public.competency_scores USING btree (competency_id);


--
-- Name: ix_competency_scores_id; Type: INDEX; Schema: public; Owner: nasc_admin
--

CREATE INDEX ix_competency_scores_id ON public.competency_scores USING btree (id);


--
-- Name: ix_course_allocations_id; Type: INDEX; Schema: public; Owner: nasc_admin
--

CREATE INDEX ix_course_allocations_id ON public.course_allocations USING btree (id);


--
-- Name: ix_course_enrolments_id; Type: INDEX; Schema: public; Owner: nasc_admin
--

CREATE INDEX ix_course_enrolments_id ON public.course_enrolments USING btree (id);


--
-- Name: ix_courses_code; Type: INDEX; Schema: public; Owner: nasc_admin
--

CREATE UNIQUE INDEX ix_courses_code ON public.courses USING btree (code);


--
-- Name: ix_courses_id; Type: INDEX; Schema: public; Owner: nasc_admin
--

CREATE INDEX ix_courses_id ON public.courses USING btree (id);


--
-- Name: ix_departments_id; Type: INDEX; Schema: public; Owner: nasc_admin
--

CREATE INDEX ix_departments_id ON public.departments USING btree (id);


--
-- Name: ix_faculty_employee_id; Type: INDEX; Schema: public; Owner: nasc_admin
--

CREATE UNIQUE INDEX ix_faculty_employee_id ON public.faculty USING btree (employee_id);


--
-- Name: ix_faculty_id; Type: INDEX; Schema: public; Owner: nasc_admin
--

CREATE INDEX ix_faculty_id ON public.faculty USING btree (id);


--
-- Name: ix_notifications_id; Type: INDEX; Schema: public; Owner: nasc_admin
--

CREATE INDEX ix_notifications_id ON public.notifications USING btree (id);


--
-- Name: ix_obe_attainment_records_id; Type: INDEX; Schema: public; Owner: nasc_admin
--

CREATE INDEX ix_obe_attainment_records_id ON public.obe_attainment_records USING btree (id);


--
-- Name: ix_proctoring_events_id; Type: INDEX; Schema: public; Owner: nasc_admin
--

CREATE INDEX ix_proctoring_events_id ON public.proctoring_events USING btree (id);


--
-- Name: ix_programmes_id; Type: INDEX; Schema: public; Owner: nasc_admin
--

CREATE INDEX ix_programmes_id ON public.programmes USING btree (id);


--
-- Name: ix_question_evaluation_configs_id; Type: INDEX; Schema: public; Owner: nasc_admin
--

CREATE INDEX ix_question_evaluation_configs_id ON public.question_evaluation_configs USING btree (id);


--
-- Name: ix_question_version_composite; Type: INDEX; Schema: public; Owner: nasc_admin
--

CREATE INDEX ix_question_version_composite ON public.question_versions USING btree (question_id, version_num);


--
-- Name: ix_question_versions_id; Type: INDEX; Schema: public; Owner: nasc_admin
--

CREATE INDEX ix_question_versions_id ON public.question_versions USING btree (id);


--
-- Name: ix_question_versions_question_id; Type: INDEX; Schema: public; Owner: nasc_admin
--

CREATE INDEX ix_question_versions_question_id ON public.question_versions USING btree (question_id);


--
-- Name: ix_reattempt_req_allocation_round; Type: INDEX; Schema: public; Owner: nasc_admin
--

CREATE INDEX ix_reattempt_req_allocation_round ON public.assessment_reattempt_requests USING btree (allocation_id, round_id);


--
-- Name: ix_reattempt_req_status; Type: INDEX; Schema: public; Owner: nasc_admin
--

CREATE INDEX ix_reattempt_req_status ON public.assessment_reattempt_requests USING btree (status);


--
-- Name: ix_roles_id; Type: INDEX; Schema: public; Owner: nasc_admin
--

CREATE INDEX ix_roles_id ON public.roles USING btree (id);


--
-- Name: ix_roster_approval_batches_id; Type: INDEX; Schema: public; Owner: nasc_admin
--

CREATE INDEX ix_roster_approval_batches_id ON public.roster_approval_batches USING btree (id);


--
-- Name: ix_schools_id; Type: INDEX; Schema: public; Owner: nasc_admin
--

CREATE INDEX ix_schools_id ON public.schools USING btree (id);


--
-- Name: ix_sections_id; Type: INDEX; Schema: public; Owner: nasc_admin
--

CREATE INDEX ix_sections_id ON public.sections USING btree (id);


--
-- Name: ix_semesters_id; Type: INDEX; Schema: public; Owner: nasc_admin
--

CREATE INDEX ix_semesters_id ON public.semesters USING btree (id);


--
-- Name: ix_students_id; Type: INDEX; Schema: public; Owner: nasc_admin
--

CREATE INDEX ix_students_id ON public.students USING btree (id);


--
-- Name: ix_students_register_number; Type: INDEX; Schema: public; Owner: nasc_admin
--

CREATE UNIQUE INDEX ix_students_register_number ON public.students USING btree (register_number);


--
-- Name: ix_users_id; Type: INDEX; Schema: public; Owner: nasc_admin
--

CREATE INDEX ix_users_id ON public.users USING btree (id);


--
-- Name: ix_users_username; Type: INDEX; Schema: public; Owner: nasc_admin
--

CREATE UNIQUE INDEX ix_users_username ON public.users USING btree (username);


--
-- Name: academic_classes academic_classes_programme_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.academic_classes
    ADD CONSTRAINT academic_classes_programme_id_fkey FOREIGN KEY (programme_id) REFERENCES public.programmes(id);


--
-- Name: academic_classes academic_classes_tutor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.academic_classes
    ADD CONSTRAINT academic_classes_tutor_id_fkey FOREIGN KEY (tutor_id) REFERENCES public.faculty(id);


--
-- Name: academic_scopes academic_scopes_batch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.academic_scopes
    ADD CONSTRAINT academic_scopes_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES public.batches(id);


--
-- Name: academic_scopes academic_scopes_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.academic_scopes
    ADD CONSTRAINT academic_scopes_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id);


--
-- Name: academic_scopes academic_scopes_faculty_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.academic_scopes
    ADD CONSTRAINT academic_scopes_faculty_id_fkey FOREIGN KEY (faculty_id) REFERENCES public.faculty(id);


--
-- Name: academic_scopes academic_scopes_programme_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.academic_scopes
    ADD CONSTRAINT academic_scopes_programme_id_fkey FOREIGN KEY (programme_id) REFERENCES public.programmes(id);


--
-- Name: academic_scopes academic_scopes_section_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.academic_scopes
    ADD CONSTRAINT academic_scopes_section_id_fkey FOREIGN KEY (section_id) REFERENCES public.sections(id);


--
-- Name: allocation_approval_history allocation_approval_history_performed_by_faculty_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.allocation_approval_history
    ADD CONSTRAINT allocation_approval_history_performed_by_faculty_id_fkey FOREIGN KEY (performed_by_faculty_id) REFERENCES public.faculty(id);


--
-- Name: assessment_activation_candidates assessment_activation_candidates_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.assessment_activation_candidates
    ADD CONSTRAINT assessment_activation_candidates_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.assessment_activation_requests(id) ON DELETE CASCADE;


--
-- Name: assessment_activation_candidates assessment_activation_candidates_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.assessment_activation_candidates
    ADD CONSTRAINT assessment_activation_candidates_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: assessment_activation_requests assessment_activation_requests_academic_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.assessment_activation_requests
    ADD CONSTRAINT assessment_activation_requests_academic_class_id_fkey FOREIGN KEY (academic_class_id) REFERENCES public.academic_classes(id) ON DELETE RESTRICT;


--
-- Name: assessment_activation_requests assessment_activation_requests_domain_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.assessment_activation_requests
    ADD CONSTRAINT assessment_activation_requests_domain_id_fkey FOREIGN KEY (domain_id) REFERENCES public.assessment_domains(id) ON DELETE RESTRICT;


--
-- Name: assessment_activation_requests assessment_activation_requests_requested_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.assessment_activation_requests
    ADD CONSTRAINT assessment_activation_requests_requested_by_id_fkey FOREIGN KEY (requested_by_id) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: assessment_activation_requests assessment_activation_requests_reviewed_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.assessment_activation_requests
    ADD CONSTRAINT assessment_activation_requests_reviewed_by_id_fkey FOREIGN KEY (reviewed_by_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: assessment_attempts assessment_attempts_allocation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.assessment_attempts
    ADD CONSTRAINT assessment_attempts_allocation_id_fkey FOREIGN KEY (allocation_id) REFERENCES public.assessment_student_allocations(id) ON DELETE RESTRICT;


--
-- Name: assessment_attempts assessment_attempts_round_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.assessment_attempts
    ADD CONSTRAINT assessment_attempts_round_id_fkey FOREIGN KEY (round_id) REFERENCES public.assessment_rounds(id) ON DELETE RESTRICT;


--
-- Name: assessment_policies assessment_policies_round_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.assessment_policies
    ADD CONSTRAINT assessment_policies_round_id_fkey FOREIGN KEY (round_id) REFERENCES public.assessment_rounds(id) ON DELETE CASCADE;


--
-- Name: assessment_questions assessment_questions_competency_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.assessment_questions
    ADD CONSTRAINT assessment_questions_competency_id_fkey FOREIGN KEY (competency_id) REFERENCES public.competencies(id) ON DELETE SET NULL;


--
-- Name: assessment_questions assessment_questions_round_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.assessment_questions
    ADD CONSTRAINT assessment_questions_round_id_fkey FOREIGN KEY (round_id) REFERENCES public.assessment_rounds(id) ON DELETE CASCADE;


--
-- Name: assessment_reattempt_requests assessment_reattempt_requests_allocation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.assessment_reattempt_requests
    ADD CONSTRAINT assessment_reattempt_requests_allocation_id_fkey FOREIGN KEY (allocation_id) REFERENCES public.assessment_student_allocations(id) ON DELETE RESTRICT;


--
-- Name: assessment_reattempt_requests assessment_reattempt_requests_requested_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.assessment_reattempt_requests
    ADD CONSTRAINT assessment_reattempt_requests_requested_by_id_fkey FOREIGN KEY (requested_by_id) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: assessment_reattempt_requests assessment_reattempt_requests_reviewed_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.assessment_reattempt_requests
    ADD CONSTRAINT assessment_reattempt_requests_reviewed_by_id_fkey FOREIGN KEY (reviewed_by_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: assessment_reattempt_requests assessment_reattempt_requests_round_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.assessment_reattempt_requests
    ADD CONSTRAINT assessment_reattempt_requests_round_id_fkey FOREIGN KEY (round_id) REFERENCES public.assessment_rounds(id) ON DELETE RESTRICT;


--
-- Name: assessment_reattempt_requests assessment_reattempt_requests_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.assessment_reattempt_requests
    ADD CONSTRAINT assessment_reattempt_requests_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE RESTRICT;


--
-- Name: assessment_responses assessment_responses_attempt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.assessment_responses
    ADD CONSTRAINT assessment_responses_attempt_id_fkey FOREIGN KEY (attempt_id) REFERENCES public.assessment_attempts(id) ON DELETE CASCADE;


--
-- Name: assessment_responses assessment_responses_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.assessment_responses
    ADD CONSTRAINT assessment_responses_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.assessment_questions(id) ON DELETE RESTRICT;


--
-- Name: assessment_results assessment_results_attempt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.assessment_results
    ADD CONSTRAINT assessment_results_attempt_id_fkey FOREIGN KEY (attempt_id) REFERENCES public.assessment_attempts(id) ON DELETE CASCADE;


--
-- Name: assessment_rounds assessment_rounds_domain_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.assessment_rounds
    ADD CONSTRAINT assessment_rounds_domain_id_fkey FOREIGN KEY (domain_id) REFERENCES public.assessment_domains(id) ON DELETE CASCADE;


--
-- Name: assessment_student_allocations assessment_student_allocations_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.assessment_student_allocations
    ADD CONSTRAINT assessment_student_allocations_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.assessment_activation_requests(id) ON DELETE CASCADE;


--
-- Name: assessment_student_allocations assessment_student_allocations_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.assessment_student_allocations
    ADD CONSTRAINT assessment_student_allocations_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: attempt_question_snapshots attempt_question_snapshots_attempt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.attempt_question_snapshots
    ADD CONSTRAINT attempt_question_snapshots_attempt_id_fkey FOREIGN KEY (attempt_id) REFERENCES public.assessment_attempts(id) ON DELETE CASCADE;


--
-- Name: attempt_question_snapshots attempt_question_snapshots_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.attempt_question_snapshots
    ADD CONSTRAINT attempt_question_snapshots_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.assessment_questions(id) ON DELETE RESTRICT;


--
-- Name: attempt_question_snapshots attempt_question_snapshots_question_version_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.attempt_question_snapshots
    ADD CONSTRAINT attempt_question_snapshots_question_version_id_fkey FOREIGN KEY (question_version_id) REFERENCES public.question_versions(id) ON DELETE RESTRICT;


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: code_execution_results code_execution_results_submission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.code_execution_results
    ADD CONSTRAINT code_execution_results_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES public.coding_submissions(id) ON DELETE CASCADE;


--
-- Name: coding_submissions coding_submissions_attempt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.coding_submissions
    ADD CONSTRAINT coding_submissions_attempt_id_fkey FOREIGN KEY (attempt_id) REFERENCES public.assessment_attempts(id) ON DELETE CASCADE;


--
-- Name: coding_submissions coding_submissions_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.coding_submissions
    ADD CONSTRAINT coding_submissions_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.assessment_questions(id) ON DELETE RESTRICT;


--
-- Name: competency_scores competency_scores_attempt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.competency_scores
    ADD CONSTRAINT competency_scores_attempt_id_fkey FOREIGN KEY (attempt_id) REFERENCES public.assessment_attempts(id) ON DELETE CASCADE;


--
-- Name: competency_scores competency_scores_competency_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.competency_scores
    ADD CONSTRAINT competency_scores_competency_id_fkey FOREIGN KEY (competency_id) REFERENCES public.competencies(id) ON DELETE RESTRICT;


--
-- Name: course_allocations course_allocations_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.course_allocations
    ADD CONSTRAINT course_allocations_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id);


--
-- Name: course_allocations course_allocations_faculty_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.course_allocations
    ADD CONSTRAINT course_allocations_faculty_id_fkey FOREIGN KEY (faculty_id) REFERENCES public.faculty(id);


--
-- Name: course_enrolments course_enrolments_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.course_enrolments
    ADD CONSTRAINT course_enrolments_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id);


--
-- Name: course_enrolments course_enrolments_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.course_enrolments
    ADD CONSTRAINT course_enrolments_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id);


--
-- Name: courses courses_programme_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_programme_id_fkey FOREIGN KEY (programme_id) REFERENCES public.programmes(id);


--
-- Name: departments departments_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id);


--
-- Name: faculty faculty_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.faculty
    ADD CONSTRAINT faculty_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id);


--
-- Name: faculty faculty_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.faculty
    ADD CONSTRAINT faculty_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: departments fk_departments_hod_id; Type: FK CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT fk_departments_hod_id FOREIGN KEY (hod_id) REFERENCES public.faculty(id);


--
-- Name: faculty fk_faculty_assigned_programme_id; Type: FK CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.faculty
    ADD CONSTRAINT fk_faculty_assigned_programme_id FOREIGN KEY (assigned_programme_id) REFERENCES public.programmes(id);


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: obe_attainment_records obe_attainment_records_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.obe_attainment_records
    ADD CONSTRAINT obe_attainment_records_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id);


--
-- Name: programmes programmes_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.programmes
    ADD CONSTRAINT programmes_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id);


--
-- Name: question_evaluation_configs question_evaluation_configs_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.question_evaluation_configs
    ADD CONSTRAINT question_evaluation_configs_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.assessment_questions(id) ON DELETE CASCADE;


--
-- Name: question_versions question_versions_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.question_versions
    ADD CONSTRAINT question_versions_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.assessment_questions(id) ON DELETE CASCADE;


--
-- Name: roster_approval_batches roster_approval_batches_approved_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.roster_approval_batches
    ADD CONSTRAINT roster_approval_batches_approved_by_id_fkey FOREIGN KEY (approved_by_id) REFERENCES public.users(id);


--
-- Name: roster_approval_batches roster_approval_batches_programme_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.roster_approval_batches
    ADD CONSTRAINT roster_approval_batches_programme_id_fkey FOREIGN KEY (programme_id) REFERENCES public.programmes(id);


--
-- Name: roster_approval_batches roster_approval_batches_tutor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.roster_approval_batches
    ADD CONSTRAINT roster_approval_batches_tutor_id_fkey FOREIGN KEY (tutor_id) REFERENCES public.users(id);


--
-- Name: students students_programme_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_programme_id_fkey FOREIGN KEY (programme_id) REFERENCES public.programmes(id);


--
-- Name: students students_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: user_roles user_roles_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nasc_admin
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict 4IaJryi6Yhxomoa9CnITOLKRje9yfuxUn9My66kmk1vlHsevb1AMVOF6L9hNF0n

