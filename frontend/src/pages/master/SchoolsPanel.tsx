import React, { useEffect, useState } from 'react';
import apiClient from '../../api/client';
import { Department } from '../../types';
import { Edit3, Plus, Save, Trash2, X } from 'lucide-react';
import { confirmDialog } from '../../components/ui/Dialogs';

interface School {
  id: number;
  code: string;
  name: string;
  department_count: number;
  departments: Array<{ id: number; code: string; name: string }>;
}

interface SchoolsPanelProps {
  departments: Department[];
  onChanged: () => void;
}

const inputCls = 'w-full bg-[#141311] border border-[#2A2824] text-[#F8F5ED] rounded-lg px-3 py-2 text-xs outline-none focus:border-[#C9A227]';
const errText = (e: any, fallback: string) => e?.response?.data?.detail || fallback;

export const SchoolsPanel: React.FC<SchoolsPanelProps> = ({ departments, onChanged }) => {
  const [schools, setSchools] = useState<School[]>([]);
  const [form, setForm] = useState<{ id?: number; code: string; name: string } | null>(null);
  const [notice, setNotice] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [assign, setAssign] = useState<Record<number, string>>({});

  const load = () => apiClient.get('/master/schools').then((r) => setSchools(r.data)).catch(() => setSchools([]));

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!form) return;
    try {
      if (form.id) {
        await apiClient.put(`/master/schools/${form.id}`, { code: form.code, name: form.name });
      } else {
        await apiClient.post('/master/schools', { code: form.code, name: form.name });
      }
      setNotice({ kind: 'ok', text: form.id ? 'School updated.' : 'School added.' });
      setForm(null);
      load();
      onChanged();
    } catch (e) {
      setNotice({ kind: 'err', text: errText(e, 'Could not save the school.') });
    }
  };

  const remove = async (s: School) => {
    if (!(await confirmDialog(`Delete school "${s.name}"?`))) return;
    try {
      await apiClient.delete(`/master/schools/${s.id}`);
      setNotice({ kind: 'ok', text: `School "${s.name}" deleted.` });
      load();
      onChanged();
    } catch (e) {
      setNotice({ kind: 'err', text: errText(e, 'Could not delete the school.') });
    }
  };

  const assignSchool = async (d: Department) => {
    const target = assign[d.id];
    if (!target) return;
    try {
      await apiClient.put(`/master/departments/${d.id}`, {
        code: d.code,
        name: d.name,
        hod_id: d.hod_id ?? null,
        school_id: Number(target),
      });
      setNotice({ kind: 'ok', text: `${d.code} linked to its school.` });
      load();
      onChanged();
    } catch (e) {
      setNotice({ kind: 'err', text: errText(e, 'Could not link the department.') });
    }
  };

  const unassigned = departments.filter((d) => !d.school_id);

  return (
    <div className="space-y-4">
      {notice && (
        <div className={`flex items-start justify-between gap-3 p-3 rounded-xl border text-xs ${notice.kind === 'ok' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200' : 'bg-red-500/10 border-red-500/30 text-red-200'}`}>
          <span>{notice.text}</span>
          <button onClick={() => setNotice(null)} className="cursor-pointer"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      <div className="bg-[#1C1B18] rounded-xl border border-[#2A2824] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#2A2824] bg-[#141311] flex justify-between items-center">
          <h3 className="font-bold text-sm text-[#F8F5ED]">Schools ({schools.length})</h3>
          <button onClick={() => setForm({ code: '', name: '' })} className="px-3 py-1.5 rounded-lg bg-[#C9A227] text-[#11110F] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer">
            <Plus className="w-3.5 h-3.5" />Add school
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-xs">
            <thead>
              <tr className="bg-[#141311] text-[#9E988A] font-semibold border-b border-[#2A2824]">
                <th className="p-3">Code</th>
                <th className="p-3">School name</th>
                <th className="p-3">Departments</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2824]">
              {schools.map((s) => (
                <tr key={s.id} className="hover:bg-[#24231F] align-top">
                  <td className="p-3 font-mono font-bold text-[#C9A227]">{s.code}</td>
                  <td className="p-3 font-semibold text-[#F8F5ED]">{s.name}</td>
                  <td className="p-3 text-[#D8D2C5]">
                    {s.department_count === 0 ? (
                      <span className="text-[#9E988A]">No departments</span>
                    ) : (
                      s.departments.map((d) => d.code).join(', ')
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex justify-end gap-1.5">
                      <button onClick={() => setForm({ id: s.id, code: s.code, name: s.name })} className="px-2.5 py-1 bg-[#24231F] text-[#E3C766] border border-[#2A2824] font-bold text-[11px] rounded-lg inline-flex items-center gap-1 cursor-pointer">
                        <Edit3 className="w-3 h-3" />Edit
                      </button>
                      <button
                        onClick={() => remove(s)}
                        disabled={s.department_count > 0}
                        title={s.department_count > 0 ? 'Move or delete its departments first' : 'Delete school'}
                        className="px-2.5 py-1 bg-[#141311] text-[#EF4444] border border-[#EF4444]/30 font-bold text-[11px] rounded-lg inline-flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-3 h-3" />Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {schools.length === 0 && (
                <tr><td colSpan={4} className="p-8 text-center text-[#9E988A]">No schools yet. Add one, then link departments to it.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {unassigned.length > 0 && (
        <div className="bg-[#1C1B18] rounded-xl border border-amber-500/30 p-4 space-y-3">
          <div className="text-xs font-bold text-amber-200">Departments without a school ({unassigned.length})</div>
          {schools.length === 0 ? (
            <p className="text-xs text-[#9E988A]">Add a school first, then link these departments to it.</p>
          ) : (
            <div className="space-y-2">
              {unassigned.map((d) => (
                <div key={d.id} className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs">
                  <span className="sm:w-64 text-[#F8F5ED]"><span className="font-mono text-[#C9A227]">{d.code}</span> · {d.name}</span>
                  <select value={assign[d.id] || ''} onChange={(e) => setAssign({ ...assign, [d.id]: e.target.value })} className={`${inputCls} sm:w-64`}>
                    <option value="">Choose a school</option>
                    {schools.map((s) => <option key={s.id} value={s.id}>{s.code} · {s.name}</option>)}
                  </select>
                  <button disabled={!assign[d.id]} onClick={() => assignSchool(d)} className="px-3 py-2 rounded-lg bg-[#C9A227] text-[#11110F] font-bold disabled:opacity-40 cursor-pointer">Link</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {form && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#1C1B18] border border-[#2A2824] rounded-2xl w-full max-w-md p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#F8F5ED]">{form.id ? 'Edit school' : 'Add school'}</h3>
              <button onClick={() => setForm(null)} className="cursor-pointer"><X className="w-4 h-4 text-[#9E988A]" /></button>
            </div>
            <label className="block space-y-1 text-xs">
              <span className="text-[#9E988A]">School code</span>
              <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} maxLength={20} className={inputCls} />
            </label>
            <label className="block space-y-1 text-xs">
              <span className="text-[#9E988A]">School name</span>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={150} className={inputCls} />
            </label>
            <div className="flex justify-end gap-2 text-xs">
              <button onClick={() => setForm(null)} className="px-3 py-2 rounded-lg bg-[#141311] border border-[#2A2824] text-[#D8D2C5] cursor-pointer">Cancel</button>
              <button disabled={!form.code.trim() || form.name.trim().length < 3} onClick={save} className="px-4 py-2 rounded-lg bg-[#C9A227] text-[#11110F] font-bold disabled:opacity-50 inline-flex items-center gap-1.5 cursor-pointer">
                <Save className="w-3.5 h-3.5" />Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
