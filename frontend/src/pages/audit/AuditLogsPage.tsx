import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import { AuditLogItem } from '../../types';
import { Search } from 'lucide-react';

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
      <div className="border-b border-[#2A2824] pb-4">
        <h2 className="text-xl font-bold text-[#F8F5ED]">System Security Audit Log Trail</h2>
        <p className="text-xs text-[#9E988A]">Immutable Audit Trail of Sensitive Marks Edits, Result Publications & Role Changes</p>
      </div>

      <div className="bg-[#1C1B18] p-4 rounded-xl border border-[#2A2824] shadow-sm flex items-center space-x-3 text-xs">
        <Search className="w-4 h-4 text-[#9E988A]" />
        <input
          type="text"
          placeholder="Filter audit trail by action, username or module..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && fetchLogs()}
          className="flex-1 bg-[#141311] border border-[#2A2824] text-[#F8F5ED] placeholder-[#9E988A]/60 focus:border-[#C9A227] outline-none rounded-lg px-3 py-2 text-xs"
        />
        <button onClick={fetchLogs} className="bg-[#C9A227] hover:bg-[#B89220] text-[#11110F] font-bold px-4 py-2 rounded-lg cursor-pointer">Search</button>
      </div>

      <div className="bg-[#1C1B18] rounded-xl border border-[#2A2824] shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#141311] text-[#9E988A] font-semibold border-b border-[#2A2824]">
              <th className="p-3">Timestamp</th>
              <th className="p-3">User</th>
              <th className="p-3">Action Event</th>
              <th className="p-3">Module</th>
              <th className="p-3">Details / Value Change</th>
              <th className="p-3">IP Address</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2A2824]">
            {logs.map((l) => (
              <tr key={l.id} className="hover:bg-[#24231F] font-mono text-[11px]">
                <td className="p-3 text-[#9E988A]">{l.timestamp}</td>
                <td className="p-3 font-bold text-[#F8F5ED]">{l.user_full_name} (@{l.username})</td>
                <td className="p-3 font-bold text-[#C9A227]">{l.action}</td>
                <td className="p-3 text-[#E3C766] font-semibold">{l.module}</td>
                <td className="p-3 text-[#D8D2C5] max-w-xs truncate">{l.new_value || l.old_value || '—'}</td>
                <td className="p-3 text-[#9E988A]">{l.ip_address}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-[#9E988A]">No audit trail logs recorded.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
