export interface RoundSummary {
  id: number;
  domain_id: number;
  round_number: number;
  slug: string;
  title: string;
  description?: string;
  round_type: string;
  duration_minutes: number;
  questions_per_attempt: number;
  passing_score: number;
  weightage_percent: number;
  rules: Record<string, any>;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'SUBMITTED' | 'EVALUATING' | 'EVALUATED';
  score?: number | null;
  percentage?: number | null;
  max_score?: number | null;
  passed?: boolean | null;
  reattempt_status?: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
  has_reattempt_request?: boolean;
  rejection_reason?: string | null;
  attempt_number?: number;
  attempt_id?: number | null;
}

export interface DomainDetail {
  id: number;
  slug: string;
  title: string;
  description?: string;
  is_active: boolean;
  allocation_id?: number;
  allocated_at?: string;
  valid_from?: string;
  valid_until?: string;
  schedule_status?: 'ACTIVE' | 'UPCOMING' | 'EXPIRED';
  formatted_assigned_time?: string;
  starts_in_minutes?: number;
  rounds: RoundSummary[];
}

export interface CandidateQuestion {
  id: number;
  round_id: number;
  competency_id?: number | null;
  competency_code?: string | null;
  competency_name?: string | null;
  question_type: string;
  title: string;
  content: string;
  code_template?: string | null;
  options?: Array<{ key: string; text: string }> | null;
  options_json?: any;
  debug_hint?: string | null;
  problem?: string | null;
  difficulty: string;
  marks: number;
  time_limit_seconds: number;
}

export interface StartAttemptResponse {
  attempt_id: number;
  allocation_id: number;
  domain_slug: string;
  round_id: number;
  round_number: number;
  round_title: string;
  round_type: string;
  duration_minutes: number;
  questions_per_attempt: number;
  passing_score: number;
  rules: Record<string, any>;
  questions: CandidateQuestion[];
  started_at: string;
  saved_answers: Record<string, any>;
  time_remaining_seconds: number;
  expires_at: string;
  server_time: string;
  client_received_at?: number;
  client_received_monotonic?: number;
}

export interface CompetencyRadarItem {
  competency_code: string;
  competency_name: string;
  category: string;
  score: number;
  max_score: number;
  percentage: number;
  readiness_level: string;
}

export interface CandidateResult {
  attempt_id: number;
  round_id?: number;
  domain_slug: string;
  round_number: number;
  round_title: string;
  round_type: string;
  total_score: number;
  max_score: number;
  percentage: number;
  passed: boolean;
  readiness_index: string;
  competencies: CompetencyRadarItem[];
  strengths: string[];
  gaps: string[];
  evaluated_at?: string;
  status?: string;
  evaluation_status?: string;
  message?: string;
}

export interface ActivationRequestItem {
  id: number;
  domain_id: number;
  domain_title: string;
  academic_class_id: number;
  class_name: string;
  department_id?: number;
  department_name?: string;
  programme_name?: string;
  batch_name: string;
  section_name: string;
  requested_by_name: string;
  reviewed_by_name?: string | null;
  status: string;
  complexity_level?: string;
  candidate_count: number;
  selected_round_ids?: number[] | null;
  round_durations: Record<string, number>;
  round_timings: Array<{ round_id: number; round_number: number; title: string; duration_minutes: number }>;
  valid_from: string;
  valid_until: string;
  requested_at: string;
  reviewed_at?: string | null;
  rejection_reason?: string | null;
}

export interface TutorClassOption {
  id: number;
  class_code: string;
  name: string;
  programme_name: string;
  batch_name: string;
  section_name: string;
  semester_num: number;
  student_count: number;
}

export interface TutorCohortItem {
  student_id: number;
  user_id: number;
  register_number: string;
  full_name: string;
  email: string;
  programme_name: string;
  batch_name: string;
  section_name: string;
  class_id?: number | null;
  class_name?: string | null;
  class_code?: string | null;
  allocation_status: string;
  round1_score?: number | null;
  round2_score?: number | null;
  round3_score?: number | null;
  round4_score?: number | null;
  round5_score?: number | null;
  overall_percentage?: number | null;
  overall_status: string;
  readiness_index: string;
}

export interface Student360Data {
  student: {
    id: number;
    register_number: string;
    full_name: string;
    email: string;
    programme_name: string;
    batch_name: string;
    section_name: string;
  };
  rounds_performance: Array<{
    round_number: number;
    round_title: string;
    status: string;
    score: number;
    percentage: number;
    passed: boolean;
    started_at: string;
    submitted_at: string;
  }>;
  competency_scores: CompetencyRadarItem[];
  strengths: string[];
  areas_to_improve: string[];
}

export interface Class360Info {
  id: number;
  class_code: string;
  name: string;
  programme_name: string;
  department_name: string;
  batch_name: string;
  section_name: string;
  semester_num: number;
  tutor_name: string;
  total_enrolled: number;
}

export interface Class360Kpis {
  total_students: number;
  participated_count: number;
  participation_rate: number;
  class_average_pct?: number | null;
  cleared_all_rounds_count: number;
  highest_score?: number | null;
  lowest_score?: number | null;
}

export interface ClassRoundSummary {
  round_number: number;
  round_title: string;
  attempted_count: number;
  passed_count: number;
  pass_rate: number;
  average_score: number;
}

export interface ClassReadinessDistribution {
  advanced: number;
  proficient: number;
  developing: number;
  beginner: number;
  pending: number;
}

export interface ClassStudentRankingItem {
  student_id: number;
  register_number: string;
  full_name: string;
  round1_score?: number | null;
  round2_score?: number | null;
  round3_score?: number | null;
  round4_score?: number | null;
  overall_percentage?: number | null;
  readiness_index: string;
}

export interface Class360Data {
  class_info: Class360Info;
  kpis: Class360Kpis;
  rounds_performance: ClassRoundSummary[];
  readiness_distribution: ClassReadinessDistribution;
  competency_scores: CompetencyRadarItem[];
  strengths: string[];
  areas_to_improve: string[];
  student_rankings: ClassStudentRankingItem[];
}

export interface RoundCandidateSummaryItem {
  student_id: number;
  register_number: string;
  full_name: string;
  email: string;
  allocation_id: number;
  score?: number | null;
  percentage?: number | null;
  status: 'PASSED' | 'FAILED' | 'NOT_STARTED' | 'IN_PROGRESS';
  attempt_number?: number;
  has_active_grant?: boolean;
  evaluated_at?: string | null;
}

export interface DynamicRoundPerformance {
  round_id: number;
  round_number: number;
  slug: string;
  title: string;
  passing_score: number;
  passed_count: number;
  failed_count: number;
  not_started_count: number;
  passed_students: RoundCandidateSummaryItem[];
  failed_students: RoundCandidateSummaryItem[];
  pending_students: RoundCandidateSummaryItem[];
}

export interface ActivationRoundsPerformance {
  activation_id: number;
  domain_title: string;
  class_name: string;
  batch_name: string;
  section_name: string;
  total_candidates: number;
  rounds: DynamicRoundPerformance[];
}

export interface MotherboardSlot {
  slot_id: string;
  label: string;
  supported_types: string[];
  pin_bus: string;
  coordinates?: { x: number; y: number; width: number; height: number };
}

export interface HardwareComponentItem {
  component_id: string;
  name: string;
  category: string;
  image_url?: string;
  specifications: string;
}

export interface MotherboardConfig {
  board_id: string;
  board_name: string;
  slots: MotherboardSlot[];
}

export interface IoTOptionsPayload {
  task_id: string;
  domain: string;
  round_type: string;
  motherboard_config: MotherboardConfig;
  component_palette: HardwareComponentItem[];
}

export interface SubmittedHardwarePlacement {
  slot_id: string;
  component_id: string;
}
