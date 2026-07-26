import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import { ResultRecord } from '../../types';
import { Award, Calculator, Send, CheckCircle2, FileSpreadsheet } from 'lucide-react';

export const ResultManager: React.FC = () => {
  const [results, setResults] = useState<ResultRecord[]>([]);
  const [courseId, setCourseId] = useState(1);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchResults();
  }, [courseId]);

  const fetchResults = () => {
    apiClient.get(`/results?course_id=${courseId}`).then(res => setResults(res.data));
  };

  const handleCalculate = async () => {
    setLoading(true);
    setMsg(null);
    try {
      const res = await apiClient.post(`/results/calculate?course_id=${courseId}`);
      setMsg(res.data.message);
      fetchResults();
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    setLoading(true);
    setMsg(null);
    try {
      const res = await apiClient.post('/results/publish', { course_id: courseId });
      setMsg(res.data.message);
      fetchResults();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Result Calculation & Publication Pipeline</h2>
          <p className="text-xs text-slate-500">Configurable CIA Weightage Calculations, Verification & Student Release Workflow</p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleCalculate}
            disabled={loading}
            className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center space-x-1.5"
          >
            <Calculator className="w-4 h-4 text-blue-400" />
            <span>Recalculate Weighted CIA</span>
          </button>
          <button
            onClick={handlePublish}
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center space-x-1.5 shadow-sm"
          >
            <Send className="w-4 h-4" />
            <span>Publish Results to Students</span>
          </button>
        </div>
      </div>

      {msg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      {/* Results Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center text-xs">
          <h3 className="font-bold text-slate-800">Course CIA Marks Ledger ({results.length} Records)</h3>
          <span className="text-slate-500">Passing Threshold: 40.0%</span>
        </div>
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
              <th className="p-3">Register Number</th>
              <th className="p-3">Student Name</th>
              <th className="p-3">Course Code</th>
              <th className="p-3">Weighted CIA Score</th>
              <th className="p-3">Percentage</th>
              <th className="p-3">Status</th>
              <th className="p-3">Publication State</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {results.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="p-3 font-mono font-bold text-blue-700">{r.register_number}</td>
                <td className="p-3 font-semibold text-slate-900">{r.student_name}</td>
                <td className="p-3 text-slate-600 font-medium">{r.course_code}</td>
                <td className="p-3 font-bold text-slate-900">{r.cia_score} / {r.cia_max} Marks</td>
                <td className="p-3 font-bold text-blue-800">{r.percentage}%</td>
                <td className="p-3">
                  <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${
                    r.status === 'Pass' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {r.status}
                  </span>
                </td>
                <td className="p-3">
                  {r.is_published ? (
                    <span className="text-emerald-600 font-semibold flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Published ({r.published_at})</span>
                    </span>
                  ) : (
                    <span className="text-amber-600 font-semibold">Unpublished Draft</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
