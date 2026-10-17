import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/client';
import { HodAnalytics } from '../../components/dashboard/HodAnalytics';
import {
  Users, Building2, BookOpen, Sparkles, ArrowRight, Calendar, ShieldCheck, Clock, CheckCircle2
} from 'lucide-react';

interface DashboardProps {
  onNavigate: (tab: string) => void;
}

export const DashboardContainer: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { user, activeRole } = useAuth();

  const [metrics, setMetrics] = useState({
    total_departments: 0,
    total_programmes: 0,
    total_classes: 0,
    total_courses: 0,
    total_students: 0,
    total_faculty: 0,
    pending_rosters: 0,
    total_allocations: 0
  });

  const [classesList, setClassesList] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    apiClient.get('/dashboard/metrics')
      .then((res) => {
        if (res.data?.metrics) {
          setMetrics(res.data.metrics);
        }
        if (res.data?.recent_classes) {
          setClassesList(res.data.recent_classes);
        }
      })
      .catch((err) => {
        console.error('Failed to load dashboard metrics:', err);
      });
  }, [user?.id, activeRole]);

  return (
    <div className="space-y-4">
      {/* Welcome Banner */}
      <div className="bg-[#FFFFFF] px-4 py-3 sm:px-6 sm:py-4 rounded-2xl border border-[#E2E8F0] shadow-sm text-[#0F172A] flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0F172A]">
            Welcome <span className="text-[#FF5500]">{user?.full_name}</span>
          </h2>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-1.5">
            <span className="bg-[#FFF5F0] text-[#FF5500] px-2.5 py-0.5 rounded border border-[#FF5500]/25 text-[11px] sm:text-xs font-semibold">
              Active Role: {activeRole}
            </span>
            {user?.assigned_department_name && (
              <span className="text-[11px] sm:text-xs text-[#475569] bg-[#F8FAFC] px-2.5 py-0.5 rounded border border-[#E2E8F0]">
                {user.assigned_department_name}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* HoD department analytics: class trends, score distribution, skill gaps */}
      {activeRole === 'HoD' && <HodAnalytics />}

      {/* Class Tutor Dedicated Callout */}
      {activeRole === 'Class Tutor' && (user?.assigned_class_name || user?.assigned_class_code) && (
        <div className="bg-[#FFF5F0] p-4 rounded-xl border border-[#FF5500]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-[#FFFFFF] text-[#FF5500] rounded-lg border border-[#FF5500]/20 shadow-xs">
              <Building2 className="w-5 h-5 text-[#FF5500]" />
            </div>
            <div>
              <div className="font-bold text-[#0F172A] text-sm flex items-center space-x-2">
                <span>Class Tutor Workspace — {user.assigned_class_name} ({user.assigned_class_code})</span>
              </div>
              <div className="text-[#64748B] text-[11px] mt-0.5">
                Batch: {user.assigned_batch} | Section: {user.assigned_section} | Programme: {user.assigned_programme_name}
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('users')}
            className="bg-[#FF5500] hover:bg-[#E64D00] text-white font-bold px-3.5 py-2 rounded-lg transition text-xs flex items-center space-x-1.5 shrink-0 cursor-pointer shadow-sm"
          >
            <span>Upload Student Roster Excel</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Primary KPI Grid (Role Scoped) */}
      {activeRole === 'Student' ? (
        <div className="space-y-6">
          {/* Student Profile Quick Info & Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[#FFFFFF] p-5 rounded-2xl border border-[#E2E8F0] shadow-sm space-y-1">
              <span className="text-[11px] font-mono text-[#64748B] uppercase tracking-wider">Candidate Register No</span>
              <div className="text-xl font-bold font-mono text-[#0F172A]">
                {user?.username || 'N/A'}
              </div>
              <div className="text-[11px] text-[#FF5500] font-semibold">{user?.assigned_programme_name || 'Degree Track'}</div>
            </div>

            <div className="bg-[#FFFFFF] p-5 rounded-2xl border border-[#E2E8F0] shadow-sm space-y-1">
              <span className="text-[11px] font-mono text-[#64748B] uppercase tracking-wider">Academic Batch & Section</span>
              <div className="text-xl font-bold font-mono text-[#0F172A]">
                {user?.assigned_batch || 'Batch'} ({user?.assigned_section || 'A'})
              </div>
              <div className="text-[11px] text-[#22C55E] font-semibold">Active Enrolled Candidate</div>
            </div>

            <div className="bg-[#FFFFFF] p-5 rounded-2xl border border-[#E2E8F0] shadow-sm space-y-1">
              <span className="text-[11px] font-mono text-[#64748B] uppercase tracking-wider">Assessment Status</span>
              <div className="text-xl font-bold font-mono text-[#FF5500]">
                Allocated Track Active
              </div>
              <div className="text-[11px] text-[#64748B]">MockRun Assessment Platform</div>
            </div>
          </div>

          {/* Student Launchpad Action Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div
              onClick={() => onNavigate('assessment-tracks')}
              className="bg-[#FFFFFF] border border-[#E2E8F0] hover:border-[#FF5500] p-6 rounded-2xl shadow-sm hover:shadow-md transition cursor-pointer group space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-[#FFF5F0] border border-[#FF5500]/25 flex items-center justify-center text-[#FF5500]">
                  <Sparkles className="w-5 h-5" />
                </div>
                <ArrowRight className="w-5 h-5 text-[#94A3B8] group-hover:text-[#FF5500] group-hover:translate-x-1 transition" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#0F172A] group-hover:text-[#FF5500] transition">
                  My Assessment Tracks
                </h3>
                <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                  Access your allocated corporate assessment tracks, complete proctored evaluation rounds, and view detailed competency radar report cards.
                </p>
              </div>
            </div>

            <div
              onClick={() => onNavigate('calendar')}
              className="bg-[#FFFFFF] border border-[#E2E8F0] hover:border-[#FF5500] p-6 rounded-2xl shadow-sm hover:shadow-md transition cursor-pointer group space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-[#FFF5F0] border border-[#FF5500]/25 flex items-center justify-center text-[#FF5500]">
                  <Calendar className="w-5 h-5" />
                </div>
                <ArrowRight className="w-5 h-5 text-[#94A3B8] group-hover:text-[#FF5500] group-hover:translate-x-1 transition" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#0F172A] group-hover:text-[#FF5500] transition">
                  Academic Calendar & Schedules
                </h3>
                <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                  View semester schedules, examination timetables, holiday announcements, and academic key dates.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : activeRole === 'Class Tutor' ? (
        <div className="space-y-6">
          {/* Class Tutor KPI Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-[#FFFFFF] p-4 sm:p-5 rounded-2xl border border-[#E2E8F0] shadow-sm hover:border-[#FF5500]/40 transition">
              <div className="flex justify-between items-start">
                <span className="text-[11px] sm:text-xs font-semibold text-[#64748B] uppercase tracking-wider">Class Students</span>
                <div className="p-2 bg-[#FFF5F0] rounded-lg text-[#FF5500] border border-[#FF5500]/20">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-[#0F172A] mt-2">
                {metrics.total_students}
              </div>
              <div className="text-[10px] sm:text-[11px] text-[#64748B] mt-1">Section Roster Enrolled</div>
            </div>

            <div className="bg-[#FFFFFF] p-4 sm:p-5 rounded-2xl border border-[#E2E8F0] shadow-sm hover:border-[#FF5500]/40 transition">
              <div className="flex justify-between items-start">
                <span className="text-[11px] sm:text-xs font-semibold text-[#64748B] uppercase tracking-wider">Class Section</span>
                <div className="p-2 bg-[#FFF5F0] rounded-lg text-[#FF5500] border border-[#FF5500]/20">
                  <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-[#0F172A] mt-2">
                Sec {user?.assigned_section || 'A'}
              </div>
              <div className="text-[10px] sm:text-[11px] text-[#64748B] mt-1">{user?.assigned_batch || 'Batch'}</div>
            </div>

            <div className="bg-[#FFFFFF] p-4 sm:p-5 rounded-2xl border border-[#E2E8F0] shadow-sm hover:border-[#22C55E]/40 transition">
              <div className="flex justify-between items-start">
                <span className="text-[11px] sm:text-xs font-semibold text-[#64748B] uppercase tracking-wider">Student Roster</span>
                <div className="p-2 bg-[#F0FDF4] rounded-lg text-[#22C55E] border border-[#22C55E]/20">
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-[#22C55E] mt-2">
                Direct Load
              </div>
              <div className="text-[10px] sm:text-[11px] text-[#64748B] mt-1">No HoD Approval Needed</div>
            </div>

            <div className="bg-[#FFFFFF] p-4 sm:p-5 rounded-2xl border border-[#E2E8F0] shadow-sm hover:border-[#22C55E]/40 transition">
              <div className="flex justify-between items-start">
                <span className="text-[11px] sm:text-xs font-semibold text-[#64748B] uppercase tracking-wider">Assessment Status</span>
                <div className="p-2 bg-[#F0FDF4] rounded-lg text-[#22C55E] border border-[#22C55E]/20">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-[#22C55E] mt-2">
                Active
              </div>
              <div className="text-[10px] sm:text-[11px] text-[#64748B] mt-1">Track Activation Ready</div>
            </div>
          </div>

          {/* Class Tutor Launchpad Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              onClick={() => onNavigate('assessment-activation')}
              className="bg-[#FFFFFF] border border-[#E2E8F0] hover:border-[#FF5500] p-5 rounded-2xl shadow-sm hover:shadow-md transition cursor-pointer group space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-[#FF5500]">Assessment Track Activation</span>
                <ArrowRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#FF5500] group-hover:translate-x-1 transition" />
              </div>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Select assessment tracks and check off candidate students from your class roster to send for HoD approval.
              </p>
            </div>

            <div
              onClick={() => onNavigate('assessment-cohort')}
              className="bg-[#FFFFFF] border border-[#E2E8F0] hover:border-[#FF5500] p-5 rounded-2xl shadow-sm hover:shadow-md transition cursor-pointer group space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-[#FF5500]">Cohort Analytics & 360° Dossier</span>
                <ArrowRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#FF5500] group-hover:translate-x-1 transition" />
              </div>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Inspect real-time multi-round scorecards, readiness levels, and detailed competency radar profiles.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {activeRole === 'HoD' ? (
            <div className="bg-[#FFFFFF] p-4 sm:p-5 rounded-2xl border border-[#FF5500]/30 shadow-sm hover:border-[#FF5500]/60 transition">
              <div className="flex justify-between items-start">
                <span className="text-[11px] sm:text-xs font-semibold text-[#64748B] uppercase tracking-wider">Assigned Department</span>
                <div className="p-2 bg-[#FFF5F0] rounded-lg text-[#FF5500] border border-[#FF5500]/20">
                  <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
              </div>
              <div className="text-sm sm:text-base font-bold text-[#FF5500] mt-2 truncate">
                {user?.assigned_department_name || 'My Department'}
              </div>
              <div className="text-[10px] sm:text-[11px] text-[#22C55E] mt-1 font-semibold">Autonomous Academic Unit</div>
            </div>
          ) : (
            <div className="bg-[#FFFFFF] p-4 sm:p-5 rounded-2xl border border-[#E2E8F0] shadow-sm hover:border-[#FF5500]/40 transition">
              <div className="flex justify-between items-start">
                <span className="text-[11px] sm:text-xs font-semibold text-[#64748B] uppercase tracking-wider">Departments</span>
                <div className="p-2 bg-[#FFF5F0] rounded-lg text-[#FF5500] border border-[#FF5500]/20">
                  <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-[#0F172A] mt-2">
                {metrics.total_departments}
              </div>
              <div className="text-[10px] sm:text-[11px] text-[#64748B] mt-1">Active Academic Units</div>
            </div>
          )}

          <div className="bg-[#FFFFFF] p-4 sm:p-5 rounded-2xl border border-[#E2E8F0] shadow-sm hover:border-[#FF5500]/40 transition">
            <div className="flex justify-between items-start">
              <span className="text-[11px] sm:text-xs font-semibold text-[#64748B] uppercase tracking-wider">Degree Programmes</span>
              <div className="p-2 bg-[#FFF5F0] rounded-lg text-[#FF5500] border border-[#FF5500]/20">
                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-[#0F172A] mt-2">
              {metrics.total_programmes}
            </div>
            <div className="text-[10px] sm:text-[11px] text-[#64748B] mt-1">UG / PG Degree Tracks</div>
          </div>

          <div className="bg-[#FFFFFF] p-4 sm:p-5 rounded-2xl border border-[#E2E8F0] shadow-sm hover:border-[#FF5500]/40 transition">
            <div className="flex justify-between items-start">
              <span className="text-[11px] sm:text-xs font-semibold text-[#64748B] uppercase tracking-wider">Academic Classes</span>
              <div className="p-2 bg-[#FFF5F0] rounded-lg text-[#FF5500] border border-[#FF5500]/20">
                <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-[#0F172A] mt-2">
              {metrics.total_classes}
            </div>
            <div className="text-[10px] sm:text-[11px] text-[#64748B] mt-1">Active Batch Sections</div>
          </div>

          <div className="bg-[#FFFFFF] p-4 sm:p-5 rounded-2xl border border-[#E2E8F0] shadow-sm hover:border-[#FF5500]/40 transition">
            <div className="flex justify-between items-start">
              <span className="text-[11px] sm:text-xs font-semibold text-[#64748B] uppercase tracking-wider">Total Courses</span>
              <div className="p-2 bg-[#FFF5F0] rounded-lg text-[#FF5500] border border-[#FF5500]/20">
                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-[#0F172A] mt-2">
              {metrics.total_courses}
            </div>
            <div className="text-[10px] sm:text-[11px] text-[#64748B] mt-1">Curriculum Subjects</div>
          </div>

          <div className="bg-[#FFFFFF] p-4 sm:p-5 rounded-2xl border border-[#E2E8F0] shadow-sm hover:border-[#FF5500]/40 transition">
            <div className="flex justify-between items-start">
              <span className="text-[11px] sm:text-xs font-semibold text-[#64748B] uppercase tracking-wider">Enrolled Students</span>
              <div className="p-2 bg-[#FFF5F0] rounded-lg text-[#FF5500] border border-[#FF5500]/20">
                <Users className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-[#0F172A] mt-2">
              {metrics.total_students}
            </div>
            <div className="text-[10px] sm:text-[11px] text-[#64748B] mt-1">Registered Student Records</div>
          </div>

          <div className="bg-[#FFFFFF] p-4 sm:p-5 rounded-2xl border border-[#E2E8F0] shadow-sm hover:border-[#FF5500]/40 transition">
            <div className="flex justify-between items-start">
              <span className="text-[11px] sm:text-xs font-semibold text-[#64748B] uppercase tracking-wider">Faculty Members</span>
              <div className="p-2 bg-[#FFF5F0] rounded-lg text-[#FF5500] border border-[#FF5500]/20">
                <Users className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-[#0F172A] mt-2">
              {metrics.total_faculty}
            </div>
            <div className="text-[10px] sm:text-[11px] text-[#64748B] mt-1">Teaching Staff Directory</div>
          </div>

          <div className="bg-[#FFFFFF] p-4 sm:p-5 rounded-2xl border border-[#E2E8F0] shadow-sm hover:border-[#FF5500]/40 transition">
            <div className="flex justify-between items-start">
              <span className="text-[11px] sm:text-xs font-semibold text-[#64748B] uppercase tracking-wider">Faculty Allocations</span>
              <div className="p-2 bg-[#FFF5F0] rounded-lg text-[#FF5500] border border-[#FF5500]/20">
                <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-[#0F172A] mt-2">
              {metrics.total_allocations}
            </div>
            <div className="text-[10px] sm:text-[11px] text-[#64748B] mt-1">Course-Faculty Links</div>
          </div>

          <div className="bg-[#FFFFFF] p-4 sm:p-5 rounded-2xl border border-[#E2E8F0] shadow-sm hover:border-[#22C55E]/40 transition">
            <div className="flex justify-between items-start">
              <span className="text-[11px] sm:text-xs font-semibold text-[#64748B] uppercase tracking-wider">Student Rosters</span>
              <div className="p-2 bg-[#F0FDF4] rounded-lg text-[#22C55E] border border-[#22C55E]/20">
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-[#22C55E] mt-2">
              Direct Load
            </div>
            <div className="text-[10px] sm:text-[11px] text-[#64748B] mt-1">Managed by Class Tutors</div>
          </div>
        </div>
      )}

      {/* Quick Launchpad & Academic Classes (Hidden for Student) */}
      {activeRole !== 'Student' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Quick Launchpad Actions */}
          <div className="bg-[#FFFFFF] p-5 rounded-2xl border border-[#E2E8F0] shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-[#0F172A] flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-[#FF5500]" />
              <span>Academic Setup Actions</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(activeRole === 'Administrator' || activeRole === 'HoD') && (
                <button
                  onClick={() => onNavigate('master')}
                  className="p-3.5 bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-xl text-left transition flex items-center justify-between group cursor-pointer"
                >
                  <div>
                    <div className="text-xs font-bold text-[#0F172A] group-hover:text-[#FF5500]">Curriculum & Courses</div>
                    <div className="text-[11px] text-[#64748B]">Manage course allocations & credits</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#FF5500]" />
                </button>
              )}

              <button
                onClick={() => onNavigate('users')}
                className="p-3.5 bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-xl text-left transition flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <div className="text-xs font-bold text-[#0F172A] group-hover:text-[#FF5500]">
                    {activeRole === 'Class Tutor' ? 'Upload Student Roster' : 'User Directory & Rosters'}
                  </div>
                  <div className="text-[11px] text-[#64748B]">
                    {activeRole === 'Class Tutor' ? 'Excel dropzone & validation' : 'Manage staff & student accounts'}
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#FF5500]" />
              </button>

              <button
                onClick={() => onNavigate('calendar')}
                className="p-3.5 bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-xl text-left transition flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <div className="text-xs font-bold text-[#0F172A] group-hover:text-[#FF5500]">Academic Calendar</div>
                  <div className="text-[11px] text-[#64748B]">Semester terms & schedules</div>
                </div>
                <Calendar className="w-4 h-4 text-[#94A3B8] group-hover:text-[#FF5500]" />
              </button>

              {activeRole === 'Administrator' && (
                <button
                  onClick={() => onNavigate('audit')}
                  className="p-3.5 bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-xl text-left transition flex items-center justify-between group cursor-pointer"
                >
                  <div>
                    <div className="text-xs font-bold text-[#0F172A] group-hover:text-[#FF5500]">Security Audit Trail</div>
                    <div className="text-[11px] text-[#64748B]">Master data & login logs</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#FF5500]" />
                </button>
              )}
            </div>
          </div>

          {/* Academic Classes Overview */}
          <div className="bg-[#FFFFFF] p-5 rounded-2xl border border-[#E2E8F0] shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-[#0F172A] flex items-center space-x-2">
                <Users className="w-4 h-4 text-[#FF5500]" />
                <span>Configured Academic Classes</span>
              </h3>
              <button
                onClick={() => onNavigate('master')}
                className="text-[11px] text-[#FF5500] hover:underline font-semibold cursor-pointer"
              >
                View All
              </button>
            </div>

            <div className="space-y-2">
              {classesList.length > 0 ? (
                classesList.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-[#0F172A]">{c.name} ({c.class_code})</div>
                      <div className="text-[11px] text-[#64748B]">{c.programme_name} • Batch {c.batch_name} (Sec {c.section_name})</div>
                    </div>
                    <span className="bg-[#FFF5F0] text-[#FF5500] px-2.5 py-1 rounded border border-[#FF5500]/25 font-semibold text-[11px]">
                      Sem {c.semester_num}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-6 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-center text-xs text-[#64748B]">
                  No academic classes configured yet. Navigate to Academic Master Data to set up classes.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
