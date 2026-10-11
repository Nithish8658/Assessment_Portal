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
      <div className="border-b border-[#2A2824] pb-4">
        <h2 className="text-xl font-bold text-[#F8F5ED]">System Security Audit Log Trail</h2>
        <p className="text-xs text-[#9E988A]">
          Who changed what and when: question bank and round settings, exam interventions, user accounts, activations and maintenance.
        </p>
      </div>

      <div className="bg-[#1C1B18] p-4 rounded-xl border border-[#2A2824] flex flex-col sm:flex-row sm:items-center gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1">
          <Search className="w-4 h-4 text-[#9E988A] shrink-0" />
          <input
            type="text"
            placeholder="Search by action, user, record id or value..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchLogs()}
            className="flex-1 bg-[#141311] border border-[#2A2824] text-[#F8F5ED] placeholder-[#9E988A]/60 focus:border-[#C9A227] outline-none rounded-lg px-3 py-2 text-xs"
          />
        </div>
        <select
          value={module}
          onChange={(e) => setModule(e.target.value)}
          className="bg-[#141311] border border-[#2A2824] text-[#F8F5ED] rounded-lg px-3 py-2 text-xs cursor-pointer"
        >
          <option value="">All categories</option>
          {modules.map((m) => (
            <option key={m} value={m}>{MODULE_LABELS[m] || m}</option>
          ))}
        </select>
        <button
          onClick={fetchLogs}
          className="bg-[#C9A227] hover:bg-[#B89220] text-[#11110F] font-bold px-4 py-2 rounded-lg cursor-pointer inline-flex items-center justify-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Search
        </button>
      </div>

      <div className="bg-[#1C1B18] rounded-xl border border-[#2A2824] overflow-x-auto">
        <table className="w-full min-w-[820px] text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#141311] text-[#9E988A] font-semibold border-b border-[#2A2824]">
              <th className="p-3">When</th>
              <th className="p-3">User</th>
              <th className="p-3">Action</th>
              <th className="p-3">Category</th>
              <th className="p-3">Record</th>
              <th className="p-3">Before → After</th>
              <th className="p-3">IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2A2824]">
            {logs.map((l) => (
              <tr key={l.id} className="hover:bg-[#24231F] align-top text-[11px]">
                <td className="p-3 text-[#9E988A] whitespace-nowrap">{formatTime(l.timestamp)}</td>
                <td className="p-3 font-bold text-[#F8F5ED]">
                  {l.user_full_name}
                  <div className="font-normal text-[#9E988A]">@{l.username}</div>
                </td>
                <td className="p-3 font-bold text-[#C9A227] font-mono">{l.action}</td>
                <td className="p-3 text-[#E3C766]">{MODULE_LABELS[l.module] || l.module}</td>
                <td className="p-3 text-[#D8D2C5] font-mono">{l.record_id || '—'}</td>
                <td className="p-3 text-[#D8D2C5] max-w-md">
                  {l.old_value && <div className="text-[#9E988A] break-words">Before: {formatValue(l.old_value)}</div>}
                  {l.new_value && <div className="break-words">{l.old_value ? 'After: ' : ''}{formatValue(l.new_value)}</div>}
                  {!l.old_value && !l.new_value && '—'}
                </td>
                <td className="p-3 text-[#9E988A] font-mono">{l.ip_address}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-[#9E988A]">
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
