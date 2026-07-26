import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import { Assignment } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { FileCheck, Calendar, Upload, Plus, Award, CheckCircle } from 'lucide-react';

export const AssignmentManager: React.FC = () => {
  const { activeRole } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [rubrics, setRubrics] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'assignments' | 'rubrics'>('assignments');
  const [submissionText, setSubmissionText] = useState('');
  const [activeSubmissionId, setActiveSubmissionId] = useState<number | null>(null);

  useEffect(() => {
    fetchAssignments();
    fetchRubrics();
  }, []);

  const fetchAssignments = () => {
    apiClient.get('/assignments').then(res => setAssignments(res.data));
  };

  const fetchRubrics = () => {
    apiClient.get('/assignments/rubrics').then(res => setRubrics(res.data));
  };

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSubmissionId) return;
    await apiClient.post(`/assignments/${activeSubmissionId}/submit`, { submission_text: submissionText });
    setActiveSubmissionId(null);
    setSubmissionText('');
    fetchAssignments();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Assignments & Rubric Workspace</h2>
          <p className="text-xs text-slate-500">Criteria-based Rubric Systems & Student Digital Submissions</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
          <button
            onClick={() => setActiveTab('assignments')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${activeTab === 'assignments' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'}`}
          >
            Assignments ({assignments.length})
          </button>
          <button
            onClick={() => setActiveTab('rubrics')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${activeTab === 'rubrics' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'}`}
          >
            Reusable Rubrics ({rubrics.length})
          </button>
        </div>
      </div>

      {activeTab === 'assignments' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assignments.map((a) => (
            <div key={a.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div>
                <div className="flex justify-between items-start">
                  <h3 className="text-base font-bold text-slate-900">{a.title}</h3>
                  <span className="text-xs font-semibold text-slate-500">{a.max_marks} Marks</span>
                </div>
                <p className="text-xs text-slate-600 mt-2">{a.description}</p>
              </div>

              <div className="text-xs text-slate-500 flex items-center space-x-2 bg-slate-50 p-2.5 rounded-lg">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>Due Date: <strong className="text-slate-800">{a.due_date}</strong></span>
              </div>

              {activeRole === 'Student' && (
                <div className="pt-2 border-t flex justify-end">
                  {a.student_status === 'Submitted' || a.student_status === 'Evaluated' ? (
                    <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center space-x-1">
                      <CheckCircle className="w-4 h-4" />
                      <span>{a.student_status} (Marks: {a.marks_awarded || 'Pending'})</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => setActiveSubmissionId(a.id)}
                      className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-lg"
                    >
                      Upload Submission
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'rubrics' && (
        <div className="space-y-4">
          {rubrics.map((r) => (
            <div key={r.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">{r.title}</h3>
                <p className="text-xs text-slate-500">{r.description}</p>
              </div>

              <div className="space-y-3">
                {r.criteria.map((c: any) => (
                  <div key={c.id} className="p-3 bg-slate-50 border rounded-xl text-xs space-y-2">
                    <div className="font-bold text-slate-800 flex justify-between">
                      <span>Criterion: {c.criterion_name}</span>
                      <span>Max: {c.max_marks} Marks</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {c.levels.map((lvl: any) => (
                        <div key={lvl.id} className="p-2 bg-white border rounded text-[11px]">
                          <div className="font-bold text-blue-700">{lvl.level_name} ({lvl.marks}m)</div>
                          <div className="text-slate-500 text-[10px] mt-0.5">{lvl.description}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Student Upload Modal */}
      {activeSubmissionId && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <h3 className="text-base font-bold text-slate-900 border-b pb-2">Submit Digital Assignment</h3>
            <form onSubmit={handleStudentSubmit} className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Submission Text / Repository Link</label>
                <textarea
                  value={submissionText}
                  onChange={(e) => setSubmissionText(e.target.value)}
                  placeholder="Paste your report summary or Github project URL..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5"
                  rows={4}
                  required
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button type="button" onClick={() => setActiveSubmissionId(null)} className="px-4 py-2 border rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg">Submit Assignment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
