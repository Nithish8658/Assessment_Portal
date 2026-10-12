import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/client';
import {
  Users, Building2, BookOpen, Sparkles, ArrowRight, Calendar, ShieldCheck, Clock
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
    <div className="space-y-4 sm:space-y-6">
      {/* Welcome Banner */}
      <div className="bg-[#1C1B18] p-4 sm:p-6 rounded-2xl border border-[#2A2824] shadow-xl text-[#F8F5ED] flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F8F5ED]">
            Welcome <span className="text-[#E3C766]">{user?.full_name}</span>
          </h2>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-1.5">
            <span className="bg-[#C9A227]/10 text-[#E3C766] px-2 sm:px-2.5 py-0.5 rounded border border-[#C9A227]/25 text-[11px] sm:text-xs font-semibold">
              Active Role: {activeRole}
            </span>
            {user?.assigned_department_name && (
              <span className="text-[11px] sm:text-xs text-[#D8D2C5] bg-[#141311] px-2 sm:px-2.5 py-0.5 rounded border border-[#2A2824]">
                {user.assigned_department_name}
              </span>
            )}

          </div>
        </div>
      </div>

      {/* Class Tutor Dedicated Callout */}
      {activeRole === 'Class Tutor' && (user?.assigned_class_name || user?.assigned_class_code) && (
        <div className="bg-[#1C1B18] p-4 rounded-xl border border-[#C9A227]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-md">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-[#24231F] text-[#C9A227] rounded-lg border border-[#2A2824]">
              <Building2 className="w-5 h-5 text-[#C9A227]" />
            </div>
            <div>
              <div className="font-bold text-[#F8F5ED] text-sm flex items-center space-x-2">
                <span>Class Tutor Workspace — {user.assigned_class_name} ({user.assigned_class_code})</span>
              </div>
              <div className="text-[#9E988A] text-[11px] mt-0.5">
                Batch: {user.assigned_batch} | Section: {user.assigned_section} | Programme: {user.assigned_programme_name}
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('users')}
            className="bg-[#C9A227] hover:bg-[#B89220] text-[#11110F] font-bold px-3.5 py-2 rounded-lg transition text-xs flex items-center space-x-1.5 shrink-0 cursor-pointer"
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
            <div className="bg-[#1C1B18] p-5 rounded-2xl border border-[#2A2824] shadow-sm space-y-1">
              <span className="text-[11px] font-mono text-[#9E988A] uppercase tracking-wider">Candidate Register No</span>
              <div className="text-xl font-bold font-mono text-[#F8F5ED]">
                {user?.username || 'N/A'}
              </div>
              <div className="text-[11px] text-[#C9A227]">{user?.assigned_programme_name || 'Degree Track'}</div>
            </div>

            <div className="bg-[#1C1B18] p-5 rounded-2xl border border-[#2A2824] shadow-sm space-y-1">
              <span className="text-[11px] font-mono text-[#9E988A] uppercase tracking-wider">Academic Batch & Section</span>
              <div className="text-xl font-bold font-mono text-[#F8F5ED]">
                {user?.assigned_batch || 'Batch'} ({user?.assigned_section || 'A'})
              </div>
              <div className="text-[11px] text-[#4ADE80]">Active Enrolled Candidate</div>
            </div>

            <div className="bg-[#1C1B18] p-5 rounded-2xl border border-[#2A2824] shadow-sm space-y-1">
              <span className="text-[11px] font-mono text-[#9E988A] uppercase tracking-wider">Assessment Status</span>
              <div className="text-xl font-bold font-mono text-[#E3C766]">
                Allocated Track Active
              </div>
              <div className="text-[11px] text-[#9E988A]">MockRun Assessment Platform</div>
            </div>
          </div>

          {/* Student Launchpad Action Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div
              onClick={() => onNavigate('assessment-tracks')}
              className="bg-[#1C1B18] border border-[#2A2824] hover:border-[#C9A227] p-6 rounded-2xl shadow-xl transition cursor-pointer group space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-[#C9A227]/10 border border-[#C9A227]/30 flex items-center justify-center text-[#C9A227]">
                  <Sparkles className="w-5 h-5" />
                </div>
                <ArrowRight className="w-5 h-5 text-[#9E988A] group-hover:text-[#C9A227] group-hover:translate-x-1 transition" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#F8F5ED] group-hover:text-[#C9A227] transition">
                  My Assessment Tracks
                </h3>
                <p className="text-xs text-[#9E988A] mt-1 leading-relaxed">
                  Access your allocated corporate assessment tracks, complete proctored evaluation rounds, and view detailed competency radar report cards.
                </p>
              </div>
            </div>

            <div
              onClick={() => onNavigate('calendar')}
              className="bg-[#1C1B18] border border-[#2A2824] hover:border-[#C9A227] p-6 rounded-2xl shadow-xl transition cursor-pointer group space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-[#C9A227]/10 border border-[#C9A227]/30 flex items-center justify-center text-[#C9A227]">
                  <Calendar className="w-5 h-5" />
                </div>
                <ArrowRight className="w-5 h-5 text-[#9E988A] group-hover:text-[#C9A227] group-hover:translate-x-1 transition" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#F8F5ED] group-hover:text-[#C9A227] transition">
                  Academic Calendar & Schedules
                </h3>
                <p className="text-xs text-[#9E988A] mt-1 leading-relaxed">
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
            <div className="bg-[#1C1B18] p-4 sm:p-5 rounded-2xl border border-[#2A2824] shadow-sm hover:border-[#C9A227]/40 transition">
              <div className="flex justify-between items-start">
                <span className="text-[11px] sm:text-xs font-semibold text-[#9E988A] uppercase tracking-wider">Class Students</span>
                <div className="p-2 bg-[#24231F] rounded-lg text-[#C9A227] border border-[#2A2824]">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-[#F8F5ED] mt-2">
                {metrics.total_students}
              </div>
              <div className="text-[10px] sm:text-[11px] text-[#9E988A] mt-1">Section Roster Enrolled</div>
            </div>

            <div className="bg-[#1C1B18] p-4 sm:p-5 rounded-2xl border border-[#2A2824] shadow-sm hover:border-[#C9A227]/40 transition">
              <div className="flex justify-between items-start">
                <span className="text-[11px] sm:text-xs font-semibold text-[#9E988A] uppercase tracking-wider">Class Section</span>
                <div className="p-2 bg-[#24231F] rounded-lg text-[#C9A227] border border-[#2A2824]">
                  <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-[#F8F5ED] mt-2">
                Sec {user?.assigned_section || 'A'}
              </div>
              <div className="text-[10px] sm:text-[11px] text-[#9E988A] mt-1">{user?.assigned_batch || 'Batch'}</div>
            </div>

            <div className="bg-[#1C1B18] p-4 sm:p-5 rounded-2xl border border-[#2A2824] shadow-sm hover:border-[#C9A227]/40 transition">
              <div className="flex justify-between items-start">
                <span className="text-[11px] sm:text-xs font-semibold text-[#9E988A] uppercase tracking-wider">Pending Excel Rosters</span>
                <div className="p-2 bg-[#24231F] rounded-lg text-[#F59E0B] border border-[#2A2824]">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-[#F59E0B] mt-2">
                {metrics.pending_rosters}
              </div>
              <div className="text-[10px] sm:text-[11px] text-[#9E988A] mt-1">Awaiting HoD Review</div>
            </div>

            <div className="bg-[#1C1B18] p-4 sm:p-5 rounded-2xl border border-[#2A2824] shadow-sm hover:border-[#C9A227]/40 transition">
              <div className="flex justify-between items-start">
                <span className="text-[11px] sm:text-xs font-semibold text-[#9E988A] uppercase tracking-wider">Assessment Status</span>
                <div className="p-2 bg-[#24231F] rounded-lg text-[#4ADE80] border border-[#2A2824]">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-[#4ADE80] mt-2">
                Active
              </div>
              <div className="text-[10px] sm:text-[11px] text-[#9E988A] mt-1">Track Activation Ready</div>
            </div>
          </div>

          {/* Class Tutor Launchpad Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              onClick={() => onNavigate('assessment-activation')}
              className="bg-[#1C1B18] border border-[#2A2824] hover:border-[#C9A227] p-5 rounded-2xl shadow-xl transition cursor-pointer group space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-[#E3C766]">Assessment Track Activation</span>
                <ArrowRight className="w-4 h-4 text-[#9E988A] group-hover:text-[#C9A227] group-hover:translate-x-1 transition" />
              </div>
              <p className="text-xs text-[#9E988A] leading-relaxed">
                Select assessment tracks and check off candidate students from your class roster to send for HoD approval.
              </p>
            </div>

            <div
              onClick={() => onNavigate('assessment-cohort')}
              className="bg-[#1C1B18] border border-[#2A2824] hover:border-[#C9A227] p-5 rounded-2xl shadow-xl transition cursor-pointer group space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-[#E3C766]">Cohort Analytics & 360° Dossier</span>
                <ArrowRight className="w-4 h-4 text-[#9E988A] group-hover:text-[#C9A227] group-hover:translate-x-1 transition" />
              </div>
              <p className="text-xs text-[#9E988A] leading-relaxed">
                Inspect real-time multi-round scorecards, readiness levels, and detailed competency radar profiles.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {activeRole === 'HoD' ? (
            <div className="bg-[#1C1B18] p-4 sm:p-5 rounded-2xl border border-[#C9A227]/30 shadow-sm hover:border-[#C9A227]/60 transition">
              <div className="flex justify-between items-start">
                <span className="text-[11px] sm:text-xs font-semibold text-[#9E988A] uppercase tracking-wider">Assigned Department</span>
                <div className="p-2 bg-[#24231F] rounded-lg text-[#C9A227] border border-[#2A2824]">
                  <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
              </div>
              <div className="text-sm sm:text-base font-bold text-[#E3C766] mt-2 truncate">
                {user?.assigned_department_name || 'My Department'}
              </div>
              <div className="text-[10px] sm:text-[11px] text-[#4ADE80] mt-1 font-semibold">Autonomous Academic Unit</div>
            </div>
          ) : (
            <div className="bg-[#1C1B18] p-4 sm:p-5 rounded-2xl border border-[#2A2824] shadow-sm hover:border-[#C9A227]/40 transition">
              <div className="flex justify-between items-start">
                <span className="text-[11px] sm:text-xs font-semibold text-[#9E988A] uppercase tracking-wider">Departments</span>
                <div className="p-2 bg-[#24231F] rounded-lg text-[#C9A227] border border-[#2A2824]">
                  <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-[#F8F5ED] mt-2">
                {metrics.total_departments}
              </div>
              <div className="text-[10px] sm:text-[11px] text-[#9E988A] mt-1">Active Academic Units</div>
            </div>
          )}

          <div className="bg-[#1C1B18] p-4 sm:p-5 rounded-2xl border border-[#2A2824] shadow-sm hover:border-[#C9A227]/40 transition">
            <div className="flex justify-between items-start">
              <span className="text-[11px] sm:text-xs font-semibold text-[#9E988A] uppercase tracking-wider">Degree Programmes</span>
              <div className="p-2 bg-[#24231F] rounded-lg text-[#C9A227] border border-[#2A2824]">
                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-[#F8F5ED] mt-2">
              {metrics.total_programmes}
            </div>
            <div className="text-[10px] sm:text-[11px] text-[#9E988A] mt-1">UG / PG Degree Tracks</div>
          </div>

          <div className="bg-[#1C1B18] p-4 sm:p-5 rounded-2xl border border-[#2A2824] shadow-sm hover:border-[#C9A227]/40 transition">
            <div className="flex justify-between items-start">
              <span className="text-[11px] sm:text-xs font-semibold text-[#9E988A] uppercase tracking-wider">Academic Classes</span>
              <div className="p-2 bg-[#24231F] rounded-lg text-[#C9A227] border border-[#2A2824]">
                <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-[#F8F5ED] mt-2">
              {metrics.total_classes}
            </div>
            <div className="text-[10px] sm:text-[11px] text-[#9E988A] mt-1">Active Batch Sections</div>
          </div>

          <div className="bg-[#1C1B18] p-4 sm:p-5 rounded-2xl border border-[#2A2824] shadow-sm hover:border-[#C9A227]/40 transition">
            <div className="flex justify-between items-start">
              <span className="text-[11px] sm:text-xs font-semibold text-[#9E988A] uppercase tracking-wider">Total Courses</span>
              <div className="p-2 bg-[#24231F] rounded-lg text-[#C9A227] border border-[#2A2824]">
                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-[#F8F5ED] mt-2">
              {metrics.total_courses}
            </div>
            <div className="text-[10px] sm:text-[11px] text-[#9E988A] mt-1">Curriculum Subjects</div>
          </div>

          <div className="bg-[#1C1B18] p-4 sm:p-5 rounded-2xl border border-[#2A2824] shadow-sm hover:border-[#C9A227]/40 transition">
            <div className="flex justify-between items-start">
              <span className="text-[11px] sm:text-xs font-semibold text-[#9E988A] uppercase tracking-wider">Enrolled Students</span>
              <div className="p-2 bg-[#24231F] rounded-lg text-[#C9A227] border border-[#2A2824]">
                <Users className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-[#F8F5ED] mt-2">
              {metrics.total_students}
            </div>
            <div className="text-[10px] sm:text-[11px] text-[#9E988A] mt-1">Registered Student Records</div>
          </div>

          <div className="bg-[#1C1B18] p-4 sm:p-5 rounded-2xl border border-[#2A2824] shadow-sm hover:border-[#C9A227]/40 transition">
            <div className="flex justify-between items-start">
              <span className="text-[11px] sm:text-xs font-semibold text-[#9E988A] uppercase tracking-wider">Faculty Members</span>
              <div className="p-2 bg-[#24231F] rounded-lg text-[#C9A227] border border-[#2A2824]">
                <Users className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-[#F8F5ED] mt-2">
              {metrics.total_faculty}
            </div>
            <div className="text-[10px] sm:text-[11px] text-[#9E988A] mt-1">Teaching Staff Directory</div>
          </div>

          <div className="bg-[#1C1B18] p-4 sm:p-5 rounded-2xl border border-[#2A2824] shadow-sm hover:border-[#C9A227]/40 transition">
            <div className="flex justify-between items-start">
              <span className="text-[11px] sm:text-xs font-semibold text-[#9E988A] uppercase tracking-wider">Faculty Allocations</span>
              <div className="p-2 bg-[#24231F] rounded-lg text-[#C9A227] border border-[#2A2824]">
                <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-[#F8F5ED] mt-2">
              {metrics.total_allocations}
            </div>
            <div className="text-[10px] sm:text-[11px] text-[#9E988A] mt-1">Course-Faculty Links</div>
          </div>

          <div className="bg-[#1C1B18] p-4 sm:p-5 rounded-2xl border border-[#2A2824] shadow-sm hover:border-[#C9A227]/40 transition">
            <div className="flex justify-between items-start">
              <span className="text-[11px] sm:text-xs font-semibold text-[#9E988A] uppercase tracking-wider">Pending Rosters</span>
              <div className="p-2 bg-[#24231F] rounded-lg text-[#F59E0B] border border-[#2A2824]">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-[#F59E0B] mt-2">
              {metrics.pending_rosters}
            </div>
            <div className="text-[10px] sm:text-[11px] text-[#9E988A] mt-1">Awaiting HoD Review</div>
          </div>
        </div>
      )}

      {/* Quick Launchpad & Academic Classes (Hidden for Student) */}
      {activeRole !== 'Student' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Quick Launchpad Actions */}
          <div className="bg-[#1C1B18] p-5 rounded-2xl border border-[#2A2824] shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-[#F8F5ED] flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-[#C9A227]" />
              <span>Academic Setup Actions</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(activeRole === 'Administrator' || activeRole === 'HoD') && (
                <button
                  onClick={() => onNavigate('master')}
                  className="p-3.5 bg-[#141311] hover:bg-[#24231F] border border-[#2A2824] rounded-xl text-left transition flex items-center justify-between group cursor-pointer"
                >
                  <div>
                    <div className="text-xs font-bold text-[#F8F5ED] group-hover:text-[#C9A227]">Curriculum & Courses</div>
                    <div className="text-[11px] text-[#9E988A]">Manage course allocations & credits</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#9E988A] group-hover:text-[#C9A227]" />
                </button>
              )}

              <button
                onClick={() => onNavigate('users')}
                className="p-3.5 bg-[#141311] hover:bg-[#24231F] border border-[#2A2824] rounded-xl text-left transition flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <div className="text-xs font-bold text-[#F8F5ED] group-hover:text-[#C9A227]">
                    {activeRole === 'Class Tutor' ? 'Upload Student Roster' : 'User Directory & Rosters'}
                  </div>
                  <div className="text-[11px] text-[#9E988A]">
                    {activeRole === 'Class Tutor' ? 'Excel dropzone & validation' : 'Manage staff & student accounts'}
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#9E988A] group-hover:text-[#C9A227]" />
              </button>

              <button
                onClick={() => onNavigate('calendar')}
                className="p-3.5 bg-[#141311] hover:bg-[#24231F] border border-[#2A2824] rounded-xl text-left transition flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <div className="text-xs font-bold text-[#F8F5ED] group-hover:text-[#C9A227]">Academic Calendar</div>
                  <div className="text-[11px] text-[#9E988A]">Semester terms & schedules</div>
                </div>
                <Calendar className="w-4 h-4 text-[#9E988A] group-hover:text-[#C9A227]" />
              </button>

              {activeRole === 'Administrator' && (
                <button
                  onClick={() => onNavigate('audit')}
                  className="p-3.5 bg-[#141311] hover:bg-[#24231F] border border-[#2A2824] rounded-xl text-left transition flex items-center justify-between group cursor-pointer"
                >
                  <div>
                    <div className="text-xs font-bold text-[#F8F5ED] group-hover:text-[#C9A227]">Security Audit Trail</div>
                    <div className="text-[11px] text-[#9E988A]">Master data & login logs</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#9E988A] group-hover:text-[#C9A227]" />
                </button>
              )}
            </div>
          </div>

          {/* Academic Classes Overview */}
          <div className="bg-[#1C1B18] p-5 rounded-2xl border border-[#2A2824] shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-[#F8F5ED] flex items-center space-x-2">
                <Users className="w-4 h-4 text-[#C9A227]" />
                <span>Configured Academic Classes</span>
              </h3>
              <button
                onClick={() => onNavigate('master')}
                className="text-[11px] text-[#C9A227] hover:underline font-semibold cursor-pointer"
              >
                View All
              </button>
            </div>

            <div className="space-y-2">
              {classesList.length > 0 ? (
                classesList.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 bg-[#141311] border border-[#2A2824] rounded-xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-[#F8F5ED]">{c.name} ({c.class_code})</div>
                      <div className="text-[11px] text-[#9E988A]">{c.programme_name} • Batch {c.batch_name} (Sec {c.section_name})</div>
                    </div>
                    <span className="bg-[#24231F] text-[#E3C766] px-2.5 py-1 rounded border border-[#2A2824] font-semibold text-[11px]">
                      Sem {c.semester_num}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-6 bg-[#141311] border border-[#2A2824] rounded-xl text-center text-xs text-[#9E988A]">
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
