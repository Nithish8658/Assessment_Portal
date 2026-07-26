import React from 'react';
import { Cpu, RefreshCw, Sparkles, Database, ShieldCheck } from 'lucide-react';

export const ERPAIPlaceholders: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-xl font-bold text-slate-900">Institutional ERP Synchronization & AI Module Architecture</h2>
        <p className="text-xs text-slate-500">Service Integration Readiness Layer & Experimental Non-Authoritative AI Assistive Modules</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ERP Sync Placeholder */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 text-blue-700 rounded-xl">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Institutional ERP Integration Readiness Layer</h3>
              <p className="text-xs text-slate-500">Bi-directional Synchronization Adapter for College ERP Data</p>
            </div>
          </div>

          <div className="space-y-2 text-xs text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex justify-between border-b pb-1 font-semibold"><span>Synchronized Entity</span><span>Status</span></div>
            <div className="flex justify-between"><span>Student Register & Enrolment Data</span><span className="text-emerald-600 font-bold">Adapter Ready</span></div>
            <div className="flex justify-between"><span>Faculty Employee Profiles</span><span className="text-emerald-600 font-bold">Adapter Ready</span></div>
            <div className="flex justify-between"><span>College ERP Attendance Integration</span><span className="text-blue-600 font-bold">Mock Active</span></div>
          </div>
        </div>

        {/* Future AI Module Placeholder */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-100 text-purple-700 rounded-xl">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Experimental AI Assistance Placeholder</h3>
              <p className="text-xs text-slate-500">Faculty-Governed Assistive AI Architecture Module</p>
            </div>
          </div>

          <div className="space-y-2 text-xs text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex justify-between border-b pb-1 font-semibold"><span>AI Capability</span><span>Authority State</span></div>
            <div className="flex justify-between"><span>AI Bloom's Taxonomy Tagging</span><span className="text-purple-600 font-bold">Faculty Override Mandatory</span></div>
            <div className="flex justify-between"><span>Descriptive Answer Draft Grading</span><span className="text-purple-600 font-bold">Faculty Approval Mandatory</span></div>
            <div className="flex justify-between"><span>Student Weakness Pattern Analyzer</span><span className="text-emerald-600 font-bold">Active Advisor</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};
