import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import { MarkGridRow } from '../../types';
import { Edit3, Lock, Save, CheckCircle, ShieldAlert, AlertCircle } from 'lucide-react';

export const MarkEntrySpreadsheet: React.FC = () => {
  const [assessmentId, setAssessmentId] = useState(1);
  const [courseId, setCourseId] = useState(1);
  const [gridData, setGridData] = useState<MarkGridRow[]>([]);
  const [overallStatus, setOverallStatus] = useState('Draft');
  const [maxMarks, setMaxMarks] = useState(50.0);
  const [assTitle, setAssTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchGrid();
  }, [assessmentId]);

  const fetchGrid = () => {
    apiClient.get(`/marks/grid?assessment_id=${assessmentId}&course_id=${courseId}`)
      .then(res => {
        setGridData(res.data.grid);
        setOverallStatus(res.data.overall_status);
        setMaxMarks(res.data.max_marks);
        setAssTitle(res.data.assessment_title);
      });
  };

  const handleCellChange = (index: number, field: keyof MarkGridRow, value: any) => {
    const copy = [...gridData];
    copy[index] = { ...copy[index], [field]: value };
    if (field === 'is_absent' && value === true) {
      copy[index].marks_obtained = 0.0;
    }
    setGridData(copy);
  };

  const handleSave = async (statusToSet: string) => {
    setSaving(true);
    setMsg(null);
    try {
      await apiClient.post('/marks/batch', {
        assessment_id: assessmentId,
        course_id: courseId,
        status: statusToSet,
        marks: gridData.map(g => ({
          student_id: g.student_id,
          marks_obtained: Number(g.marks_obtained),
          is_absent: g.is_absent,
          is_exempted: g.is_exempted,
          remarks: g.remarks
        }))
      });
      setMsg(`Marks grid successfully saved with status '${statusToSet}'!`);
      fetchGrid();
    } catch (err: any) {
      setMsg(err.response?.data?.detail || 'Error saving mark entry grid.');
    } finally {
      setSaving(false);
    }
  };

  const handleLock = async () => {
    await apiClient.post(`/marks/${assessmentId}/lock`);
    setMsg('Marks entry has been permanently locked for this assessment.');
    fetchGrid();
  };

  const isLocked = overallStatus === 'Locked';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Spreadsheet Mark Entry Workspace</h2>
          <p className="text-xs text-slate-500">Keyboard-Friendly Grid, Real-Time Validation & Multi-Stage Lock Engine</p>
        </div>

        <div className="flex items-center space-x-3">
          <span className={`text-xs font-bold px-3 py-1 rounded-lg border ${
            isLocked ? 'bg-rose-100 text-rose-800 border-rose-200' :
            overallStatus === 'Verified' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
            'bg-amber-100 text-amber-800 border-amber-200'
          }`}>
            Lock Status: {overallStatus}
          </span>

          {!isLocked && (
            <>
              <button
                onClick={() => handleSave('Draft')}
                disabled={saving}
                className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center space-x-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Draft</span>
              </button>
              <button
                onClick={() => handleSave('Verified')}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center space-x-1.5"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Verify & Submit</span>
              </button>
              <button
                onClick={handleLock}
                className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center space-x-1.5"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Lock Grid</span>
              </button>
            </>
          )}
        </div>
      </div>

      {msg && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl text-xs font-semibold flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-blue-600 shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      {/* Grid Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center text-xs">
          <h3 className="font-bold text-slate-800">{assTitle} (Max Marks: {maxMarks})</h3>
          <span className="text-slate-500">{gridData.length} Student Records Loaded</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <th className="p-3 w-12">#</th>
                <th className="p-3">Register Number</th>
                <th className="p-3">Student Name</th>
                <th className="p-3 w-32">Marks ({maxMarks})</th>
                <th className="p-3 w-24 text-center">Absent</th>
                <th className="p-3 w-24 text-center">Exempted</th>
                <th className="p-3">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {gridData.map((row, idx) => (
                <tr key={row.student_id} className={`hover:bg-slate-50 ${row.is_absent ? 'bg-rose-50/50' : ''}`}>
                  <td className="p-3 text-slate-400 font-medium">{idx + 1}</td>
                  <td className="p-3 font-mono font-bold text-blue-700">{row.register_number}</td>
                  <td className="p-3 font-semibold text-slate-900">{row.student_name}</td>
                  <td className="p-3">
                    <input
                      type="number"
                      step={0.5}
                      max={maxMarks}
                      min={0}
                      disabled={isLocked || row.is_absent}
                      value={row.marks_obtained}
                      onChange={(e) => handleCellChange(idx, 'marks_obtained', parseFloat(e.target.value) || 0)}
                      className={`w-full bg-slate-50 border rounded p-1.5 font-bold text-xs ${
                        row.marks_obtained > maxMarks ? 'border-rose-500 text-rose-600 bg-rose-50' : 'border-slate-300 text-slate-900'
                      }`}
                    />
                  </td>
                  <td className="p-3 text-center">
                    <input
                      type="checkbox"
                      disabled={isLocked}
                      checked={row.is_absent}
                      onChange={(e) => handleCellChange(idx, 'is_absent', e.target.checked)}
                      className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                    />
                  </td>
                  <td className="p-3 text-center">
                    <input
                      type="checkbox"
                      disabled={isLocked}
                      checked={row.is_exempted}
                      onChange={(e) => handleCellChange(idx, 'is_exempted', e.target.checked)}
                      className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="text"
                      disabled={isLocked}
                      placeholder="Optional remark..."
                      value={row.remarks}
                      onChange={(e) => handleCellChange(idx, 'remarks', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-xs"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
