export type Role = 'Student' | 'Faculty' | 'Class Tutor' | 'HoD' | 'Assessment Coordinator' | 'Administrator';

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  mobile?: string;
  is_active: boolean;
  roles: Role[];
  student_id?: number;
  faculty_id?: number;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  activeRole: Role | null;
  isAuthenticated: boolean;
}

export interface Department {
  id: number;
  code: string;
  name: string;
  school_name: string;
  programme_count: number;
  faculty_count: number;
}

export interface Programme {
  id: number;
  code: string;
  name: string;
  degree_type: string;
  department_name: string;
  department_id: number;
  duration_years: number;
  course_count: number;
  student_count: number;
}

export interface Course {
  id: number;
  code: string;
  title: string;
  course_type: string;
  credits: number;
  semester_num: number;
  regulation: string;
  programme_name: string;
  programme_id: number;
  co_count: number;
}

export interface QuestionOption {
  id?: number;
  option_text: string;
  is_correct: boolean;
}

export interface Question {
  id: number;
  question_text: string;
  course_id: number;
  course_code: string;
  unit: number;
  topic?: string;
  marks: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  bloom_level: 'Remember' | 'Understand' | 'Apply' | 'Analyze' | 'Evaluate' | 'Create';
  question_type: string;
  co_id?: number;
  co_code?: string;
  solution_answer?: string;
  status: string;
  options: QuestionOption[];
}

export interface QuestionPaper {
  id: number;
  title: string;
  course_id: number;
  course_code: string;
  course_title: string;
  max_marks: number;
  duration_minutes: number;
  status: 'Draft' | 'Submitted' | 'Under Review' | 'Changes Requested' | 'Approved' | 'Published';
  created_at: string;
  blueprint?: {
    unit_distribution: Record<string, number>;
    bloom_distribution: Record<string, number>;
    co_distribution: Record<string, number>;
    total_questions: number;
    total_marks: number;
  };
  questions?: any[];
}

export interface Assessment {
  id: number;
  title: string;
  assessment_type: string;
  course_id: number;
  course_code: string;
  course_title: string;
  max_marks: number;
  weightage_percent: number;
  duration_minutes: number;
  is_online: boolean;
  status: string;
  student_attempt_status?: string;
  student_score?: number;
}

export interface Assignment {
  id: number;
  title: string;
  description?: string;
  course_id: number;
  course_code: string;
  course_title: string;
  max_marks: number;
  due_date: string;
  student_status?: string;
  marks_awarded?: number;
}

export interface MarkGridRow {
  student_id: number;
  register_number: string;
  student_name: string;
  marks_obtained: number;
  is_absent: boolean;
  is_exempted: boolean;
  remarks: string;
  status: string;
}

export interface ResultRecord {
  id: number;
  student_id: number;
  register_number: string;
  student_name: string;
  course_id: number;
  course_code: string;
  course_title: string;
  cia_score: number;
  cia_max: number;
  percentage: number;
  status: string;
  is_published: boolean;
  published_at?: string;
}

export interface COAttainment {
  co_id: number;
  co_code: string;
  statement: string;
  bloom_level: string;
  total_students: number;
  students_above_target: number;
  attainment_percentage: number;
  attainment_level: string;
}

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'alert' | 'success' | 'warning';
  is_read: boolean;
  created_at: string;
}

export interface AuditLogItem {
  id: number;
  username: string;
  user_full_name: string;
  action: string;
  module: string;
  record_id?: string;
  old_value?: string;
  new_value?: string;
  ip_address: string;
  timestamp: string;
}
