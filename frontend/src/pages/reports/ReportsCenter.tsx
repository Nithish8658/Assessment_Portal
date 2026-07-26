import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import { FileSpreadsheet, Printer, Download, Award, Building2, CheckCircle2 } from 'lucide-react';

export const ReportsCenter: React.FC = () => {
  const [summary, setSummary] = useState<any | null>(null);

  useEffect(() => {
    apiClient.get('/reports/summary').then(res => setSummary(res.data));
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-slate-200 pb-4 no-print">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Institutional Reports Center</h2>
          <p className="text-xs text-slate-500">Official NASC Academic Mark Sheets, Attainment Audits & Exportable Summaries</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handlePrint}
            className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center space-x-1.5 shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Print Official Report</span>
          </button>
        </div>
      </div>

      {summary && (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          {/* Institutional Header */}
          <div className="text-center border-b border-slate-200 pb-6 space-y-1">
            <h1 className="text-xl font-bold text-slate-900">{summary.institution}</h1>
            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Controller of Examinations & OBE Evaluation Cell</p>
            <p className="text-xs text-slate-500">Academic Year 2025-2026 — Comprehensive Mark & Attainment Summary Report</p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="p-4 bg-slate-50 border rounded-xl">
              <span className="text-slate-500 text-xs">Total Evaluated Records</span>
              <p className="text-2xl font-bold text-slate-900 mt-1">{summary.total_records}</p>
            </div>
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <span className="text-emerald-700 text-xs font-semibold">Passed Students</span>
              <p className="text-2xl font-bold text-emerald-800 mt-1">{summary.pass_count}</p>
            </div>
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl">
              <span className="text-rose-700 text-xs font-semibold">Failed Students</span>
              <p className="text-2xl font-bold text-rose-800 mt-1">{summary.fail_count}</p>
            </div>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <span className="text-blue-700 text-xs font-semibold">Pass Percentage</span>
              <p className="text-2xl font-bold text-blue-900 mt-1">{summary.overall_pass_percentage}%</p>
            </div>
          </div>

          {/* Report Catalog */}
          <div className="space-y-3 no-print">
            <h3 className="font-bold text-xs text-slate-500 uppercase tracking-wider">Available Printable Reports</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {summary.available_reports.map((rep: string, idx: number) => (
                <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-800">{rep}</span>
                  <button onClick={handlePrint} className="text-blue-600 hover:underline font-bold">Generate PDF</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
