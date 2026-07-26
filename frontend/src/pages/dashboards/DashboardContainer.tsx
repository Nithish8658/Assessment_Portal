import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Users, Building2, BookOpen, CheckSquare, Award, AlertCircle, FileCheck,
  TrendingUp, ArrowRight, ShieldCheck, Clock
} from 'lucide-react';

interface DashboardProps {
  onNavigate: (tab: string) => void;
}

export const DashboardContainer: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { user, activeRole } = useAuth();

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 p-6 rounded-2xl border border-slate-800 shadow-xl text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span>Nehru Arts and Science College (Autonomous)</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">
            Welcome back, <span className="text-blue-300">{user?.full_name}</span>
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Active Role: <span className="bg-blue-900/80 text-blue-200 px-2.5 py-0.5 rounded border border-blue-700 font-semibold">{activeRole}</span>
          </p>
        </div>
        <div className="flex items-center space-x-3 text-xs bg-slate-900/60 p-3 rounded-xl border border-slate-800">
          <Clock className="w-4 h-4 text-amber-400 shrink-0" />
          <div>
            <div className="text-slate-400">Current Academic Term</div>
            <div className="font-semibold text-slate-200">2025-2026 — Semester IV</div>
          </div>
        </div>
      </div>

      {/* Role-Specific Metric Cards */}
      {activeRole === 'Administrator' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button onClick={() => onNavigate('users')} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition text-left group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Total Students</span>
                <Users className="w-5 h-5 text-blue-600 group-hover:scale-110 transition" />
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-2">60</div>
              <div className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center">
                <span>Active & Enrolled</span>
              </div>
            </button>

            <button onClick={() => onNavigate('users')} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition text-left group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Faculty Members</span>
                <Users className="w-5 h-5 text-purple-600 group-hover:scale-110 transition" />
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-2">10</div>
              <div className="text-[11px] text-slate-500 font-medium mt-1">across 3 Departments</div>
            </button>

            <button onClick={() => onNavigate('assessments')} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition text-left group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Active Assessments</span>
                <CheckSquare className="w-5 h-5 text-emerald-600 group-hover:scale-110 transition" />
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-2">8</div>
              <div className="text-[11px] text-emerald-600 font-medium mt-1">4 Online / 4 Offline</div>
            </button>

            <button onClick={() => onNavigate('results')} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition text-left group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Overall Pass Rate</span>
                <Award className="w-5 h-5 text-amber-600 group-hover:scale-110 transition" />
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-2">90.0%</div>
              <div className="text-[11px] text-slate-500 font-medium mt-1">CIA Attainment Target: Level 3</div>
            </button>
          </div>
        </>
      )}

      {(activeRole === 'Faculty' || activeRole === 'Class Tutor') && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button onClick={() => onNavigate('assessments')} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition text-left group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Allocated Courses</span>
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2">2 Courses</div>
            <div className="text-[11px] text-slate-500 mt-1">Data Structures, Web Tech</div>
          </button>

          <button onClick={() => onNavigate('evaluation')} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition text-left group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Pending Evaluation</span>
              <FileCheck className="w-5 h-5 text-amber-600" />
            </div>
            <div className="text-2xl font-bold text-amber-600 mt-2">1 Attempt</div>
            <div className="text-[11px] text-amber-700 font-medium mt-1">Click to grade online submission</div>
          </button>

          <button onClick={() => onNavigate('marks')} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition text-left group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Offline Marks Grid</span>
              <Award className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2">CIA Test I</div>
            <div className="text-[11px] text-emerald-600 font-medium mt-1">Status: Verified</div>
          </button>

          <button onClick={() => onNavigate('obe')} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition text-left group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">CO Attainment</span>
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2">72.5%</div>
            <div className="text-[11px] text-emerald-600 font-medium mt-1">Level 3 High Attainment</div>
          </button>
        </div>
      )}

      {activeRole === 'Student' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button onClick={() => onNavigate('assessments')} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition text-left group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Upcoming Tests</span>
              <CheckSquare className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2">1 Active Test</div>
            <div className="text-[11px] text-blue-600 font-semibold mt-1">CIA Test I — Data Structures</div>
          </button>

          <button onClick={() => onNavigate('assignments')} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition text-left group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Pending Assignments</span>
              <FileCheck className="w-5 h-5 text-amber-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2">1 Assignment</div>
            <div className="text-[11px] text-amber-600 font-semibold mt-1">Linked List Implementation</div>
          </button>

          <button onClick={() => onNavigate('results')} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition text-left group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Latest CIA Score</span>
              <Award className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-emerald-600 mt-2">42.0 / 50.0</div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-1">84.0% — Status: Pass</div>
          </button>

          <button onClick={() => onNavigate('obe')} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition text-left group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">CO Performance</span>
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2">4/5 COs Passed</div>
            <div className="text-[11px] text-slate-500 mt-1">CO1, CO2, CO3, CO5 Attained</div>
          </button>
        </div>
      )}

      {/* Quick Action Navigation Grid */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center space-x-2">
          <ArrowRight className="w-4 h-4 text-blue-600" />
          <span>Quick Module Actions</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 text-xs">
          {activeRole !== 'Student' && (
            <>
              <button onClick={() => onNavigate('questionbank')} className="p-3 bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded-xl font-semibold text-slate-700 hover:text-blue-700 transition text-left">
                Question Bank
              </button>
              <button onClick={() => onNavigate('questionpapers')} className="p-3 bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded-xl font-semibold text-slate-700 hover:text-blue-700 transition text-left">
                Paper Generator & Blueprint
              </button>
              <button onClick={() => onNavigate('marks')} className="p-3 bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded-xl font-semibold text-slate-700 hover:text-blue-700 transition text-left">
                Spreadsheet Mark Entry
              </button>
              <button onClick={() => onNavigate('results')} className="p-3 bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded-xl font-semibold text-slate-700 hover:text-blue-700 transition text-left">
                Results & Publication
              </button>
            </>
          )}
          <button onClick={() => onNavigate('assessments')} className="p-3 bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded-xl font-semibold text-slate-700 hover:text-blue-700 transition text-left">
            Online Assessments
          </button>
          <button onClick={() => onNavigate('obe')} className="p-3 bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded-xl font-semibold text-slate-700 hover:text-blue-700 transition text-left">
            CO Attainment & OBE
          </button>
          <button onClick={() => onNavigate('reports')} className="p-3 bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded-xl font-semibold text-slate-700 hover:text-blue-700 transition text-left">
            Reports Center
          </button>
          <button onClick={() => onNavigate('calendar')} className="p-3 bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded-xl font-semibold text-slate-700 hover:text-blue-700 transition text-left">
            Academic Calendar
          </button>
        </div>
      </div>
    </div>
  );
};
