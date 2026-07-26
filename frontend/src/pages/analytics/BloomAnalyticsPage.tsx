import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import { BarChart3, AlertTriangle, CheckCircle2, PieChart } from 'lucide-react';

export const BloomAnalyticsPage: React.FC = () => {
  const [bloomData, setBloomData] = useState<any | null>(null);
  const [itemData, setItemData] = useState<any[]>([]);

  useEffect(() => {
    apiClient.get('/analytics/bloom-distribution').then(res => setBloomData(res.data));
    apiClient.get('/analytics/item-analysis').then(res => setItemData(res.data.items));
  }, []);

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-xl font-bold text-slate-900">Bloom's Taxonomy & Item Quality Analytics</h2>
        <p className="text-xs text-slate-500">Cognitive Distribution Analytics & Item Discrimination / Difficulty Indicators</p>
      </div>

      {bloomData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cognitive Breakdown Cards */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
              <PieChart className="w-4 h-4 text-purple-600" />
              <span>Cognitive Level Breakdown ({bloomData.total_questions} Questions)</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              {bloomData.distribution.map((b: any) => (
                <div key={b.bloom_level} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="font-bold text-slate-700">{b.bloom_level}</div>
                  <div className="text-xl font-bold text-purple-700">{b.percentage}%</div>
                  <div className="text-[10px] text-slate-500">{b.count} Questions</div>
                </div>
              ))}
            </div>
          </div>

          {/* Cognitive Imbalance Warnings */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="font-bold text-xs text-slate-500 uppercase tracking-wider">Cognitive Imbalance Warning Engine</h3>
            {bloomData.warnings.length === 0 ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Cognitive distribution is optimal and balanced across lower and higher-order levels.</span>
              </div>
            ) : (
              bloomData.warnings.map((w: string, i: number) => (
                <div key={i} className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>{w}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Item Analysis Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h3 className="font-bold text-sm text-slate-800">Post-Assessment Item Analysis Ledger</h3>
        </div>
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
              <th className="p-3">Question Text</th>
              <th className="p-3">Type</th>
              <th className="p-3">Bloom</th>
              <th className="p-3">Difficulty</th>
              <th className="p-3 text-center">Attempts</th>
              <th className="p-3 text-center">Success %</th>
              <th className="p-3">Difficulty Index</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {itemData.map((item) => (
              <tr key={item.question_id} className="hover:bg-slate-50">
                <td className="p-3 font-semibold text-slate-900 max-w-xs truncate">{item.question_text}</td>
                <td className="p-3 text-slate-600">{item.question_type}</td>
                <td className="p-3 font-semibold text-purple-700">{item.bloom_level}</td>
                <td className="p-3 text-slate-700">{item.difficulty}</td>
                <td className="p-3 text-center font-bold text-slate-800">{item.total_attempts}</td>
                <td className="p-3 text-center font-bold text-blue-700">{item.success_percentage}%</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    item.difficulty_index === 'Optimal' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {item.difficulty_index}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
