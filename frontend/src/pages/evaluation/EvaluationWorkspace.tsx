import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import { FileCheck, ShieldAlert, ShieldCheck, AlertCircle, ChevronDown, ChevronUp, Camera, Video } from 'lucide-react';

export const EvaluationWorkspace: React.FC = () => {
  const [pendingList, setPendingList] = useState<any[]>([]);
  const [activeAttempt, setActiveAttempt] = useState<any | null>(null);
  const [feedback, setFeedback] = useState<Record<number, string>>({});
  const [marks, setMarks] = useState<Record<number, number>>({});
  const [showLogs, setShowLogs] = useState(false);

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = () => {
    apiClient.get('/evaluation/pending').then(res => setPendingList(res.data));
  };

  const loadAttempt = async (id: number) => {
    const res = await apiClient.get(`/evaluation/attempt/${id}`);
    setActiveAttempt(res.data);
    setShowLogs(false);
    const initMarks: Record<number, number> = {};
    const initFB: Record<number, string> = {};
    res.data.answers.forEach((ans: any) => {
      initMarks[ans.answer_id] = ans.marks_awarded || 0;
      initFB[ans.answer_id] = ans.evaluator_feedback || '';
    });
    setMarks(initMarks);
    setFeedback(initFB);
  };

  const handleSaveGrade = async (answerId: number) => {
    await apiClient.post(`/evaluation/evaluate-answer?answer_id=${answerId}&marks_awarded=${marks[answerId] || 0}&feedback=${encodeURIComponent(feedback[answerId] || '')}`);
    alert('Answer grade & feedback saved successfully!');
    fetchPending();
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-xl font-bold text-slate-900">Faculty Fast Evaluation Workspace</h2>
        <p className="text-xs text-slate-500">Student Grading, Descriptive Evaluation & Malpractice Integrity Audit Review</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Attempts Queue */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="font-bold text-xs text-slate-500 uppercase tracking-wider">Submissions Awaiting Grading ({pendingList.length})</h3>
          <div className="divide-y divide-slate-100">
            {pendingList.map((att) => (
              <div
                key={att.attempt_id}
                onClick={() => loadAttempt(att.attempt_id)}
                className={`p-3 rounded-lg cursor-pointer transition ${activeAttempt?.attempt_id === att.attempt_id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-slate-50'}`}
              >
                <div className="flex justify-between font-bold text-xs text-slate-900">
                  <span>{att.student_name}</span>
                  <span className="text-blue-700 font-mono">{att.register_number}</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1 flex justify-between items-center">
                  <span>{att.assessment_title}</span>
                  {att.malpractice_flagged ? (
                    <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-1.5 py-0.5 rounded">FLAGGED</span>
                  ) : (
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-semibold px-1.5 py-0.5 rounded">Clean</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Grading Workspace */}
        <div className="lg:col-span-2">
          {activeAttempt ? (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
              <div className="border-b pb-4 flex justify-between items-start">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{activeAttempt.student_name} ({activeAttempt.register_number})</h3>
                  <p className="text-xs text-slate-500">{activeAttempt.assessment_title}</p>
                </div>

                <div className="flex flex-col items-end space-y-1">
                  <div className="text-right">
                    <span className="text-xs text-slate-500">Total Awarded Score:</span>
                    <p className="text-lg font-bold text-emerald-600">{activeAttempt.total_score} Marks</p>
                  </div>

                  {/* Malpractice Security Integrity Badge */}
                  {activeAttempt.malpractice_flagged ? (
                    <span className="bg-rose-100 text-rose-900 border border-rose-300 text-xs font-bold px-3 py-1 rounded-lg flex items-center space-x-1">
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                      <span>MALPRACTICE FLAGGED ({activeAttempt.tab_switch_count} Tab Switches)</span>
                    </span>
                  ) : (
                    <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-semibold px-3 py-1 rounded-lg flex items-center space-x-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Proctoring Clean (0 Violations)</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Malpractice Audit Logs Drawer */}
              {activeAttempt.violation_logs && activeAttempt.violation_logs.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2 text-xs">
                  <button
                    onClick={() => setShowLogs(!showLogs)}
                    className="w-full flex items-center justify-between font-bold text-amber-900"
                  >
                    <span className="flex items-center space-x-2">
                      <ShieldAlert className="w-4 h-4 text-amber-600" />
                      <span>Proctoring Security Violation Audit Trail ({activeAttempt.violation_logs.length} Events)</span>
                    </span>
                    {showLogs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {showLogs && (
                    <div className="space-y-1.5 pt-2 border-t border-amber-200 text-[11px] font-mono">
                      {activeAttempt.violation_logs.map((log: any, i: number) => (
                        <div key={i} className="flex justify-between text-amber-950 bg-amber-100/60 p-2 rounded">
                          <span>[{log.timestamp}] {log.type}: {log.details}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Webcam Video Security Gallery & Snapshot Audit */}
              {activeAttempt.webcam_snapshots && activeAttempt.webcam_snapshots.length > 0 && (
                <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-xl p-4 space-y-3 text-xs shadow-lg">
                  <div className="flex items-center justify-between font-bold text-white border-b border-slate-800 pb-2">
                    <span className="flex items-center space-x-2">
                      <Camera className="w-4 h-4 text-emerald-400" />
                      <span>Webcam Video Proctoring Snapshot Gallery ({activeAttempt.webcam_snapshots.length} Incident Frames Captured)</span>
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                    {activeAttempt.webcam_snapshots.map((snap: any, i: number) => (
                      <div key={i} className="bg-slate-950 p-2 rounded-lg border border-slate-800 space-y-1">
                        <div className="aspect-video bg-black rounded overflow-hidden flex items-center justify-center border border-slate-800">
                          {snap.snapshot ? (
                            <img src={snap.snapshot} alt={`Incident ${i}`} className="w-full h-full object-cover" />
                          ) : (
                            <div className="text-[10px] text-slate-500 font-mono">No Frame Image</div>
                          )}
                        </div>
                        <div className="text-[10px] text-amber-400 font-bold font-mono truncate">{snap.type}</div>
                        <div className="text-[9px] text-slate-400 font-mono">{snap.timestamp}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Questions Grading */}
              <div className="space-y-6">
                {activeAttempt.answers.map((ans: any, idx: number) => (
                  <div key={ans.answer_id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs">
                    <div className="flex justify-between font-bold text-slate-800">
                      <span>Q{idx+1}: {ans.question_text}</span>
                      <span>Max: {ans.max_marks} Marks</span>
                    </div>

                    <div className="p-3 bg-white border border-slate-200 rounded-lg text-slate-700 font-mono text-[11px]">
                      <strong>Student Answer:</strong>
                      <p className="mt-1">{ans.descriptive_text || ans.selected_option_text || '(No answer provided)'}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Marks Awarded</label>
                        <input
                          type="number"
                          step={0.5}
                          max={ans.max_marks}
                          value={marks[ans.answer_id] ?? ans.marks_awarded}
                          onChange={(e) => setMarks({ ...marks, [ans.answer_id]: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-white border border-slate-300 rounded p-2 font-bold"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Evaluator Feedback</label>
                        <input
                          type="text"
                          placeholder="Feedback comment for student..."
                          value={feedback[ans.answer_id] ?? ans.evaluator_feedback}
                          onChange={(e) => setFeedback({ ...feedback, [ans.answer_id]: e.target.value })}
                          className="w-full bg-white border border-slate-300 rounded p-2"
                        />
                      </div>
                    </div>

                    <div className="text-right">
                      <button
                        onClick={() => handleSaveGrade(ans.answer_id)}
                        className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-1.5 rounded-lg"
                      >
                        Save Question Grade
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-slate-400 text-xs">
              Select a student attempt from the queue on the left to begin evaluation.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
