export type Role = 'Student' | 'Faculty' | 'Class Tutor' | 'HoD' | 'Assessment Coordinator' | 'ERP Coordinator' | 'Administrator';

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
  assigned_class_name?: string;
  assigned_class_code?: string;
  assigned_programme_name?: string;
  assigned_programme_code?: string;
  assigned_batch?: string;
  assigned_section?: string;
  assigned_semester_num?: number;
  assigned_department_name?: string;
  assigned_department_id?: number;
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
  hod_id?: number | null;
  hod_name?: string;
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

export interface AcademicClass {
  id: number;
  class_code: string;
  name: string;
  programme_id: number;
  programme_name: string;
  programme_code: string;
  department_id: number;
  department_name: string;
  batch_name: string;
  semester_num: number;
  section_name: string;
  tutor_id?: number;
  tutor_name?: string;
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
  allocated_faculty?: Array<{ id: number; name: string; section?: string }>;
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
