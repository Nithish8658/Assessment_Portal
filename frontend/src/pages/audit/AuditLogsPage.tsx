import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import { AuditLogItem } from '../../types';
import { Search, RefreshCw } from 'lucide-react';

const MODULE_LABELS: Record<string, string> = {
  ASSESSMENT: 'Assessment activations',
  QUESTION_BANK: 'Question bank & rounds',
  EXAM_OPS: 'Exam operations',
  USERS: 'User accounts',
  MAINTENANCE: 'Maintenance',
};

const formatValue = (raw?: string) => {
  if (!raw) return '';
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return Object.entries(parsed)
        .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : String(v)}`)
        .join(' · ');
    }
  } catch {}
  return raw;
};

const formatTime = (ts?: string | null) => (ts ? new Date(ts).toLocaleString() : '');

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [search, setSearch] = useState('');
  const [module, setModule] = useState('');
  const [modules, setModules] = useState<string[]>(Object.keys(MODULE_LABELS));
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    apiClient.get('/audit/modules').then((res) => setModules(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [module]);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (module) params.append('module', module);
      const res = await apiClient.get(`/audit?${params.toString()}`);
      setLogs(res.data);
    } catch {
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-[#E2E8F0] pb-4">
        <h2 className="text-xl font-bold text-[#0F172A]">System Security Audit Log Trail</h2>
        <p className="text-xs text-[#64748B]">
          Who changed what and when: question bank and round settings, exam interventions, user accounts, activations and maintenance.
        </p>
      </div>

      <div className="bg-[#FFFFFF] p-4 rounded-xl border border-[#E2E8F0] shadow-sm flex flex-col sm:flex-row sm:items-center gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1">
          <Search className="w-4 h-4 text-[#94A3B8] shrink-0" />
          <input
            type="text"
            placeholder="Search by action, user, record id or value..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchLogs()}
            className="flex-1 bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] placeholder-[#94A3B8] focus:border-[#FF5500] outline-none rounded-lg px-3 py-2 text-xs"
          />
        </div>
        <select
          value={module}
          onChange={(e) => setModule(e.target.value)}
          className="bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] rounded-lg px-3 py-2 text-xs cursor-pointer focus:border-[#FF5500]"
        >
          <option value="">All categories</option>
          {modules.map((m) => (
            <option key={m} value={m}>{MODULE_LABELS[m] || m}</option>
          ))}
        </select>
        <button
          onClick={fetchLogs}
          className="bg-[#FF5500] hover:bg-[#E64D00] text-white font-bold px-4 py-2 rounded-lg cursor-pointer inline-flex items-center justify-center gap-1.5 shadow-sm transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Search
        </button>
      </div>

      <div className="bg-[#FFFFFF] rounded-xl border border-[#E2E8F0] shadow-sm overflow-x-auto">
        <table className="w-full min-w-[820px] text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#F8FAFC] text-[#475569] font-semibold border-b border-[#E2E8F0]">
              <th className="p-3">When</th>
              <th className="p-3">User</th>
              <th className="p-3">Action</th>
              <th className="p-3">Category</th>
              <th className="p-3">Record</th>
              <th className="p-3">Before → After</th>
              <th className="p-3">IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {logs.map((l) => (
              <tr key={l.id} className="hover:bg-[#F8FAFC] transition-colors align-top text-[11px]">
                <td className="p-3 text-[#64748B] whitespace-nowrap">{formatTime(l.timestamp)}</td>
                <td className="p-3 font-bold text-[#0F172A]">
                  {l.user_full_name}
                  <div className="font-normal text-[#64748B]">@{l.username}</div>
                </td>
                <td className="p-3 font-bold text-[#FF5500] font-mono">{l.action}</td>
                <td className="p-3 text-[#475569] font-semibold">{MODULE_LABELS[l.module] || l.module}</td>
                <td className="p-3 text-[#334155] font-mono">{l.record_id || '—'}</td>
                <td className="p-3 text-[#334155] max-w-md">
                  {l.old_value && <div className="text-[#64748B] break-words">Before: {formatValue(l.old_value)}</div>}
                  {l.new_value && <div className="break-words">{l.old_value ? 'After: ' : ''}{formatValue(l.new_value)}</div>}
                  {!l.old_value && !l.new_value && '—'}
                </td>
                <td className="p-3 text-[#64748B] font-mono">{l.ip_address}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-[#64748B]">
                  {isLoading ? 'Loading…' : 'No audit entries match these filters.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
