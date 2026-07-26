import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import { Department, Programme, Course } from '../../types';
import { Building2, BookOpen, Layers, Plus, CheckCircle2 } from 'lucide-react';

export const MasterData: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'departments' | 'programmes' | 'courses' | 'allocations'>('departments');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [allocations, setAllocations] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    apiClient.get('/master/departments').then(res => setDepartments(res.data));
    apiClient.get('/master/programmes').then(res => setProgrammes(res.data));
    apiClient.get('/master/courses').then(res => setCourses(res.data));
    apiClient.get('/master/allocations').then(res => setAllocations(res.data));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Academic Master Data Management</h2>
          <p className="text-xs text-slate-500">Configure Schools, Departments, Programmes, Courses & Faculty Allocations</p>
        </div>

        {/* Tab Switchers */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
          <button
            onClick={() => setActiveTab('departments')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${activeTab === 'departments' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'}`}
          >
            Departments ({departments.length})
          </button>
          <button
            onClick={() => setActiveTab('programmes')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${activeTab === 'programmes' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'}`}
          >
            Programmes ({programmes.length})
          </button>
          <button
            onClick={() => setActiveTab('courses')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${activeTab === 'courses' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'}`}
          >
            Courses ({courses.length})
          </button>
          <button
            onClick={() => setActiveTab('allocations')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${activeTab === 'allocations' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'}`}
          >
            Allocations ({allocations.length})
          </button>
        </div>
      </div>

      {/* Departments Table */}
      {activeTab === 'departments' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <h3 className="font-bold text-sm text-slate-800">Department Master Registry</h3>
          </div>
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <th className="p-3">Code</th>
                <th className="p-3">Department Name</th>
                <th className="p-3">School</th>
                <th className="p-3">Programmes</th>
                <th className="p-3">Faculty Count</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {departments.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50">
                  <td className="p-3 font-mono font-bold text-blue-700">{d.code}</td>
                  <td className="p-3 font-semibold text-slate-900">{d.name}</td>
                  <td className="p-3 text-slate-600">{d.school_name}</td>
                  <td className="p-3 text-slate-700">{d.programme_count} Programmes</td>
                  <td className="p-3 text-slate-700">{d.faculty_count} Faculty Members</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Programmes Table */}
      {activeTab === 'programmes' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
            <h3 className="font-bold text-sm text-slate-800">Degree Programme Registry</h3>
          </div>
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <th className="p-3">Code</th>
                <th className="p-3">Programme Title</th>
                <th className="p-3">Degree Type</th>
                <th className="p-3">Department</th>
                <th className="p-3">Duration</th>
                <th className="p-3">Courses</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {programmes.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="p-3 font-mono font-bold text-purple-700">{p.code}</td>
                  <td className="p-3 font-semibold text-slate-900">{p.name}</td>
                  <td className="p-3 text-slate-600 font-medium">{p.degree_type}</td>
                  <td className="p-3 text-slate-700">{p.department_name}</td>
                  <td className="p-3 text-slate-600">{p.duration_years} Years</td>
                  <td className="p-3 text-slate-700 font-semibold">{p.course_count} Courses</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Courses Table */}
      {activeTab === 'courses' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
            <h3 className="font-bold text-sm text-slate-800">Course Master Catalog</h3>
          </div>
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <th className="p-3">Course Code</th>
                <th className="p-3">Course Title</th>
                <th className="p-3">Type</th>
                <th className="p-3">Credits</th>
                <th className="p-3">Semester</th>
                <th className="p-3">Programme</th>
                <th className="p-3">CO Count</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {courses.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="p-3 font-mono font-bold text-blue-700">{c.code}</td>
                  <td className="p-3 font-semibold text-slate-900">{c.title}</td>
                  <td className="p-3">
                    <span className="bg-slate-100 text-slate-700 border border-slate-300 px-2 py-0.5 rounded text-[11px] font-medium">
                      {c.course_type}
                    </span>
                  </td>
                  <td className="p-3 text-slate-700 font-semibold">{c.credits}</td>
                  <td className="p-3 text-slate-600">Sem {c.semester_num}</td>
                  <td className="p-3 text-slate-700">{c.programme_name}</td>
                  <td className="p-3 text-emerald-700 font-bold">{c.co_count} COs Tagged</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Course Allocations Table */}
      {activeTab === 'allocations' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
            <h3 className="font-bold text-sm text-slate-800">Faculty-Course Allocation Mappings</h3>
          </div>
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <th className="p-3">Faculty Member</th>
                <th className="p-3">Allocated Course</th>
                <th className="p-3">Academic Year</th>
                <th className="p-3">Semester</th>
                <th className="p-3">Section</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {allocations.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className="p-3 font-semibold text-slate-900">{a.faculty_name}</td>
                  <td className="p-3 font-medium text-blue-700">{a.course_code} — {a.course_title}</td>
                  <td className="p-3 text-slate-600">{a.academic_year}</td>
                  <td className="p-3 text-slate-600">Sem {a.semester_num}</td>
                  <td className="p-3 font-bold text-slate-700">Sec {a.section_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
