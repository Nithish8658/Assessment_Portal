import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import { AuditLogItem } from '../../types';
import { ShieldAlert, Search } from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = () => {
    let url = '/audit?';
    if (search) url += `search=${search}&`;
    apiClient.get(url).then(res => setLogs(res.data));
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-xl font-bold text-slate-900">System Security Audit Log Trail</h2>
        <p className="text-xs text-slate-500">Immutable Audit Trail of Sensitive Marks Edits, Result Publications & Role Changes</p>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3 text-xs">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Filter audit trail by action, username or module..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && fetchLogs()}
          className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs"
        />
        <button onClick={fetchLogs} className="bg-slate-800 text-white font-semibold px-4 py-2 rounded-lg">Search</button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
              <th className="p-3">Timestamp</th>
              <th className="p-3">User</th>
              <th className="p-3">Action Event</th>
              <th className="p-3">Module</th>
              <th className="p-3">Details / Value Change</th>
              <th className="p-3">IP Address</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {logs.map((l) => (
              <tr key={l.id} className="hover:bg-slate-50 font-mono text-[11px]">
                <td className="p-3 text-slate-500">{l.timestamp}</td>
                <td className="p-3 font-bold text-slate-900">{l.user_full_name} (@{l.username})</td>
                <td className="p-3 font-bold text-blue-700">{l.action}</td>
                <td className="p-3 text-purple-700 font-semibold">{l.module}</td>
                <td className="p-3 text-slate-700 max-w-xs truncate">{l.new_value || l.old_value || '-'}</td>
                <td className="p-3 text-slate-400">{l.ip_address}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
