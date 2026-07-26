import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import { COAttainment } from '../../types';
import { BarChart3, Layers, Target, Award, CheckCircle2 } from 'lucide-react';

export const COAttainmentPage: React.FC = () => {
  const [courseId, setCourseId] = useState(1);
  const [targetThreshold, setTargetThreshold] = useState(60.0);
  const [attainmentList, setAttainmentList] = useState<COAttainment[]>([]);
  const [coPoMatrix, setCoPoMatrix] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'attainment' | 'matrix'>('attainment');

  useEffect(() => {
    fetchAttainment();
    fetchMatrix();
  }, [courseId, targetThreshold]);

  const fetchAttainment = () => {
    apiClient.get(`/obe/attainment?course_id=${courseId}&target_percent=${targetThreshold}`)
      .then(res => setAttainmentList(res.data.co_attainment));
  };

  const fetchMatrix = () => {
    apiClient.get(`/obe/co-po-matrix?course_id=${courseId}`)
      .then(res => setCoPoMatrix(res.data));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Outcome-Based Education (OBE) & CO Attainment</h2>
          <p className="text-xs text-slate-500">Course Outcome (CO) Attainment Calculations & CO-PO Direct/Indirect Mapping Matrix</p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
          <button
            onClick={() => setActiveTab('attainment')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${activeTab === 'attainment' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'}`}
          >
            CO Attainment Level Report
          </button>
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${activeTab === 'matrix' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'}`}
          >
            CO-PO Mapping Matrix
          </button>
        </div>
      </div>

      {activeTab === 'attainment' && (
        <>
          {/* Threshold Control Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between text-xs">
            <div className="flex items-center space-x-3">
              <Target className="w-4 h-4 text-blue-600" />
              <span className="font-semibold text-slate-700">Target Score Attainment Threshold:</span>
              <input
                type="number"
                value={targetThreshold}
                onChange={(e) => setTargetThreshold(parseFloat(e.target.value) || 60)}
                className="w-20 bg-slate-50 border border-slate-300 rounded p-1 font-bold text-center"
              />
              <span className="text-slate-500">% of Max Marks</span>
            </div>

            <div className="text-slate-500 font-medium">
              Attainment Threshold Rules: Level 3 (≥70%), Level 2 (≥60%), Level 1 (≥50%)
            </div>
          </div>

          {/* Attainment Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-bold text-sm text-slate-800">Course Outcome (CO) Attainment Ledger</h3>
            </div>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <th className="p-3">CO Code</th>
                  <th className="p-3">Course Outcome Statement</th>
                  <th className="p-3">Bloom Level</th>
                  <th className="p-3 text-center">Students Assessed</th>
                  <th className="p-3 text-center">Students Above Target</th>
                  <th className="p-3">Attainment %</th>
                  <th className="p-3">Attainment Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {attainmentList.map((co) => (
                  <tr key={co.co_id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-blue-700">{co.co_code}</td>
                    <td className="p-3 text-slate-800 font-medium">{co.statement}</td>
                    <td className="p-3">
                      <span className="bg-purple-100 text-purple-800 font-semibold px-2 py-0.5 rounded text-[11px]">
                        {co.bloom_level}
                      </span>
                    </td>
                    <td className="p-3 text-center font-semibold text-slate-700">{co.total_students}</td>
                    <td className="p-3 text-center font-bold text-emerald-600">{co.students_above_target}</td>
                    <td className="p-3 font-bold text-blue-800 text-sm">{co.attainment_percentage}%</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-1 rounded text-[11px] font-bold ${
                        co.attainment_level.includes('Level 3') ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                        co.attainment_level.includes('Level 2') ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                        'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}>
                        {co.attainment_level}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === 'matrix' && coPoMatrix && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
            <h3 className="font-bold text-sm text-slate-800">CO-PO Mapping Strength Matrix (3: High, 2: Medium, 1: Low)</h3>
          </div>
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <th className="p-3">CO Code</th>
                <th className="p-3">Bloom</th>
                {coPoMatrix.pos.map((p: any) => (
                  <th key={p.id} className="p-3 text-center font-bold">{p.code}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {coPoMatrix.matrix.map((row: any) => (
                <tr key={row.co_id} className="hover:bg-slate-50">
                  <td className="p-3 font-mono font-bold text-blue-700">{row.co_code}</td>
                  <td className="p-3 font-semibold text-purple-700">{row.bloom_level}</td>
                  {coPoMatrix.pos.map((p: any) => (
                    <td key={p.id} className="p-3 text-center font-bold text-slate-800">
                      {row.mappings[p.code] > 0 ? row.mappings[p.code] : '-'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
