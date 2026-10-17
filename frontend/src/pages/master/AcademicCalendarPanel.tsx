import React, { useEffect, useState } from 'react';
import apiClient from '../../api/client';
import { CalendarDays, Edit3, Plus, RefreshCw, Save, Trash2, X } from 'lucide-react';
import { confirmDialog } from '../../components/ui/Dialogs';

interface Term { name: string; start_date: string | null; end_date: string | null }
interface Year {
  id: number;
  year_code: string;
  is_current: boolean;
  start_date: string | null;
  end_date: string | null;
  odd: Term;
  even: Term;
}
interface BatchRow {
  id: number | null;
  name: string;
  status: 'active' | 'upcoming' | 'completed';
  current_semester: number | null;
  current_semester_label: string | null;
  year_of_study: number | null;
  classes: number;
  students: number;
}
interface CalendarData {
  context: { configured: boolean; academic_year?: string; term_name?: string; term_start_date?: string; term_end_date?: string; status?: string };
  semester_label: string;
  batches: BatchRow[];
  years?: Year[];
  sync?: { class_changes: number; student_changes: number };
}
interface YearForm {
  id?: number;
  year_code: string;
  start_date: string;
  end_date: string;
  odd_start: string;
  odd_end: string;
  even_start: string;
  even_end: string;
}

const inputCls = 'w-full bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] rounded-lg px-3 py-2 text-xs outline-none focus:border-[#FF5500]';
const errText = (e: any, fallback: string) => {
  const d = e?.response?.data?.detail;
  if (Array.isArray(d)) return d.map((x: any) => `${(x.loc || []).slice(-1)[0]}: ${x.msg}`).join('; ');
  return d || fallback;
};
const fmtDate = (d?: string | null) => (d ? new Date(`${d}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
const lastDay = (y: number, m: number) => new Date(y, m, 0).getDate();

/** Institution pattern: Odd semester June to November, Even semester December to April. */
const defaultsFor = (code: string): Partial<YearForm> => {
  const m = /^(\d{4})-(\d{4})$/.exec(code.trim());
  if (!m || Number(m[2]) !== Number(m[1]) + 1) return {};
  const a = Number(m[1]);
  const b = a + 1;
  return {
    start_date: `${a}-06-01`, odd_start: `${a}-06-01`, odd_end: `${a}-11-30`,
    even_start: `${a}-12-01`, even_end: `${b}-04-${lastDay(b, 4)}`, end_date: `${b}-04-${lastDay(b, 4)}`,
  };
};

const STATUS_STYLE: Record<string, string> = {
  active: 'bg-[#22C55E]/15 text-[#15803D] border-[#22C55E]/30',
  upcoming: 'bg-[#FF5500]/10 text-[#FF5500] border-[#FF5500]/25',
  completed: 'bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0]',
};

export const AcademicCalendarPanel: React.FC<{ onChanged?: () => void }> = ({ onChanged }) => {
  const [data, setData] = useState<CalendarData | null>(null);
  const [form, setForm] = useState<YearForm | null>(null);
  const [newBatch, setNewBatch] = useState('');
  const [notice, setNotice] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () => apiClient.get('/academic-calendar').then((r) => setData(r.data)).catch((e) => setNotice({ kind: 'err', text: errText(e, 'Could not load the academic calendar.') }));

  useEffect(() => {
    load();
  }, []);

  const changed = (text: string) => {
    setNotice({ kind: 'ok', text });
    load();
    onChanged?.();
  };

  const openNewYear = () => {
    const years = data?.years || [];
    const latest = years.map((y) => Number(y.year_code.slice(0, 4))).sort((a, b) => b - a)[0];
    const start = latest ? latest + 1 : new Date().getFullYear();
    const code = `${start}-${start + 1}`;
    setForm({ year_code: code, start_date: '', end_date: '', odd_start: '', odd_end: '', even_start: '', even_end: '', ...defaultsFor(code) } as YearForm);
  };

  const openEditYear = (y: Year) => setForm({
    id: y.id, year_code: y.year_code,
    start_date: y.start_date || '', end_date: y.end_date || '',
    odd_start: y.odd.start_date || '', odd_end: y.odd.end_date || '',
    even_start: y.even.start_date || '', even_end: y.even.end_date || '',
    ...(y.start_date ? {} : defaultsFor(y.year_code)),
  });

  const saveYear = async () => {
    if (!form) return;
    setBusy(true);
    try {
      const body = { ...form };
      delete (body as any).id;
      if (form.id) await apiClient.put(`/academic-calendar/years/${form.id}`, body);
      else await apiClient.post('/academic-calendar/years', body);
      setForm(null);
      changed(`Academic year ${form.year_code} saved.`);
    } catch (e) {
      setNotice({ kind: 'err', text: errText(e, 'Could not save the academic year.') });
    } finally {
      setBusy(false);
    }
  };

  const deleteYear = async (y: Year) => {
    if (!(await confirmDialog(`Delete academic year ${y.year_code} and its semester dates?`))) return;
    try {
      await apiClient.delete(`/academic-calendar/years/${y.id}`);
      changed(`Academic year ${y.year_code} deleted.`);
    } catch (e) {
      setNotice({ kind: 'err', text: errText(e, 'Could not delete the academic year.') });
    }
  };

  const addBatch = async () => {
    try {
      await apiClient.post('/academic-calendar/batches', { name: newBatch.trim() });
      setNewBatch('');
      changed(`Batch ${newBatch.trim()} added.`);
    } catch (e) {
      setNotice({ kind: 'err', text: errText(e, 'Could not add the batch.') });
    }
  };

  const deleteBatch = async (b: BatchRow) => {
    if (!b.id || !(await confirmDialog(`Remove batch ${b.name}?`))) return;
    try {
      await apiClient.delete(`/academic-calendar/batches/${b.id}`);
      changed(`Batch ${b.name} removed.`);
    } catch (e) {
      setNotice({ kind: 'err', text: errText(e, 'Could not remove the batch.') });
    }
  };

  const syncSemesters = async () => {
    setBusy(true);
    try {
      const r = await apiClient.post('/academic-calendar/semester-sync');
      changed(`Semesters updated: ${r.data.classes_updated} classes and ${r.data.students_updated} students now match the calendar.`);
    } catch (e) {
      setNotice({ kind: 'err', text: errText(e, 'Could not update semesters.') });
    } finally {
      setBusy(false);
    }
  };

  const ctx = data?.context;
  const pending = (data?.sync?.class_changes || 0) + (data?.sync?.student_changes || 0);

  return (
    <div className="space-y-4">
      {notice && (
        <div className={`flex items-start justify-between gap-3 p-3 rounded-xl border text-xs ${notice.kind === 'ok' ? 'bg-[#F0FDF4] border-[#22C55E]/30 text-[#15803D]' : 'bg-[#FEF2F2] border-[#EF4444]/30 text-[#B91C1C]'}`}>
          <span>{notice.text}</span>
          <button onClick={() => setNotice(null)} className="cursor-pointer"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* Current status */}
      <div className="bg-[#FFFFFF] rounded-xl border border-[#E2E8F0] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FFF5F0] border border-[#FF5500]/25 flex items-center justify-center text-[#FF5500] shrink-0">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase text-[#64748B]">Current academic period</div>
            {ctx?.configured && ctx.term_name ? (
              <>
                <div className="text-sm font-bold text-[#0F172A]">{ctx.academic_year} · {data?.semester_label}</div>
                <div className="text-xs text-[#64748B]">
                  {ctx.term_name}: {fmtDate(ctx.term_start_date)} to {fmtDate(ctx.term_end_date)}
                  {ctx.status === 'between_terms' ? ' (between semesters; the last started semester applies)' : ''}
                </div>
              </>
            ) : (
              <div className="text-sm font-bold text-[#D97706]">Not configured. Add the academic year and its semester dates below.</div>
            )}
          </div>
        </div>
        {pending > 0 && (
          <div className="p-3 rounded-xl bg-[#FFFBEB] border border-[#F59E0B]/30 text-xs text-[#B45309] space-y-2 md:max-w-sm">
            <div>
              {data?.sync?.class_changes} classes and {data?.sync?.student_changes} students have a stored semester that doesn't match this calendar.
            </div>
            <button disabled={busy} onClick={syncSemesters} className="px-3 py-1.5 rounded-lg bg-[#FF5500] hover:bg-[#E64D00] text-white font-bold inline-flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-sm">
              <RefreshCw className="w-3.5 h-3.5" />Update semesters
            </button>
          </div>
        )}
      </div>

      {/* Academic years */}
      <div className="bg-[#FFFFFF] rounded-xl border border-[#E2E8F0] overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-[#E2E8F0] bg-[#F8FAFC] flex justify-between items-center">
          <h3 className="font-bold text-sm text-[#0F172A]">Academic years & semester dates</h3>
          <button onClick={openNewYear} className="px-3 py-1.5 rounded-lg bg-[#FF5500] hover:bg-[#E64D00] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-sm">
            <Plus className="w-3.5 h-3.5" />Add academic year
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-xs">
            <thead>
              <tr className="bg-[#F8FAFC] text-[#475569] font-semibold border-b border-[#E2E8F0]">
                <th className="p-3">Academic year</th>
                <th className="p-3">Year dates</th>
                <th className="p-3">Odd semester (I · III · V)</th>
                <th className="p-3">Even semester (II · IV · VI)</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {(data?.years || []).map((y) => (
                <tr key={y.id} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="p-3 font-bold text-[#0F172A]">
                    {y.year_code}
                    {ctx?.academic_year === y.year_code && <span className="ml-2 text-[9px] px-1.5 py-0.5 rounded bg-[#22C55E]/15 text-[#15803D] border border-[#22C55E]/30 font-bold">CURRENT</span>}
                  </td>
                  <td className="p-3 text-[#334155]">{y.start_date ? `${fmtDate(y.start_date)} – ${fmtDate(y.end_date)}` : <span className="text-[#D97706]">Dates not set</span>}</td>
                  <td className="p-3 text-[#334155]">{y.odd.start_date ? `${fmtDate(y.odd.start_date)} – ${fmtDate(y.odd.end_date)}` : '—'}</td>
                  <td className="p-3 text-[#334155]">{y.even.start_date ? `${fmtDate(y.even.start_date)} – ${fmtDate(y.even.end_date)}` : '—'}</td>
                  <td className="p-3">
                    <div className="flex justify-end gap-1.5">
                      <button onClick={() => openEditYear(y)} className="px-2.5 py-1 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0F172A] border border-[#E2E8F0] font-bold text-[11px] rounded-lg inline-flex items-center gap-1 cursor-pointer"><Edit3 className="w-3 h-3" />Edit</button>
                      <button onClick={() => deleteYear(y)} disabled={ctx?.academic_year === y.year_code} title={ctx?.academic_year === y.year_code ? 'The current year cannot be deleted' : 'Delete'} className="px-2.5 py-1 bg-white hover:bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/30 font-bold text-[11px] rounded-lg inline-flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"><Trash2 className="w-3 h-3" />Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {(data?.years || []).length === 0 && (
                <tr><td colSpan={5} className="p-8 text-center text-[#64748B]">No academic years yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Batches */}
      <div className="bg-[#FFFFFF] rounded-xl border border-[#E2E8F0] overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-[#E2E8F0] bg-[#F8FAFC] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-sm text-[#0F172A]">Batches & current semester</h3>
            <p className="text-[11px] text-[#64748B]">Each batch's semester follows from its entry year and the current semester dates.</p>
          </div>
          <div className="flex gap-2">
            <input value={newBatch} onChange={(e) => setNewBatch(e.target.value)} placeholder="2027-2030" className={`${inputCls} w-32`} />
            <button disabled={!/^\d{4}-\d{4}$/.test(newBatch.trim())} onClick={addBatch} className="px-3 py-1.5 rounded-lg bg-[#FF5500] hover:bg-[#E64D00] text-white text-xs font-bold disabled:opacity-40 inline-flex items-center gap-1.5 cursor-pointer shadow-sm"><Plus className="w-3.5 h-3.5" />Add batch</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-xs">
            <thead>
              <tr className="bg-[#F8FAFC] text-[#475569] font-semibold border-b border-[#E2E8F0]">
                <th className="p-3">Batch</th>
                <th className="p-3">Status</th>
                <th className="p-3">Year of study</th>
                <th className="p-3">Current semester</th>
                <th className="p-3">Classes</th>
                <th className="p-3">Students</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {(data?.batches || []).map((b) => (
                <tr key={b.name} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="p-3 font-mono font-bold text-[#FF5500]">{b.name}</td>
                  <td className="p-3"><span className={`px-2 py-0.5 rounded border text-[10px] font-semibold ${STATUS_STYLE[b.status]}`}>{b.status}</span></td>
                  <td className="p-3 text-[#334155]">{b.year_of_study ? `Year ${b.year_of_study}` : '—'}</td>
                  <td className="p-3 text-[#0F172A] font-semibold">{b.current_semester_label || '—'}</td>
                  <td className="p-3 text-[#334155]">{b.classes}</td>
                  <td className="p-3 text-[#334155]">{b.students}</td>
                  <td className="p-3 text-right">
                    {b.id && b.classes === 0 && b.students === 0 ? (
                      <button onClick={() => deleteBatch(b)} className="px-2.5 py-1 bg-white hover:bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/30 font-bold text-[11px] rounded-lg inline-flex items-center gap-1 cursor-pointer"><Trash2 className="w-3 h-3" />Remove</button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Year editor */}
      {form && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl w-full max-w-lg p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#0F172A]">{form.id ? `Edit ${form.year_code}` : 'Add academic year'}</h3>
              <button onClick={() => setForm(null)} className="cursor-pointer"><X className="w-4 h-4 text-[#64748B] hover:text-[#0F172A]" /></button>
            </div>
            <label className="block space-y-1 text-xs">
              <span className="text-[#64748B]">Academic year</span>
              <input
                value={form.year_code}
                onChange={(e) => {
                  const code = e.target.value;
                  setForm({ ...form, year_code: code, ...(form.id ? {} : defaultsFor(code)) });
                }}
                placeholder="2026-2027"
                className={inputCls}
              />
            </label>
            {([
              ['Academic year', 'start_date', 'end_date'],
              ['Odd semester (I · III · V)', 'odd_start', 'odd_end'],
              ['Even semester (II · IV · VI)', 'even_start', 'even_end'],
            ] as Array<[string, keyof YearForm, keyof YearForm]>).map(([label, s, e]) => (
              <div key={label} className="space-y-1 text-xs">
                <span className="text-[#64748B]">{label}</span>
                <div className="grid grid-cols-2 gap-2">
                  <input type="date" value={String(form[s] || '')} onChange={(ev) => setForm({ ...form, [s]: ev.target.value })} className={inputCls} />
                  <input type="date" value={String(form[e] || '')} onChange={(ev) => setForm({ ...form, [e]: ev.target.value })} className={inputCls} />
                </div>
              </div>
            ))}
            <p className="text-[11px] text-[#64748B]">The usual pattern is filled in for you: Odd semester June to November, Even semester December to April.</p>
            <div className="flex justify-end gap-2 text-xs">
              <button onClick={() => setForm(null)} className="px-3 py-2 rounded-lg bg-[#F1F5F9] border border-[#E2E8F0] text-[#475569] hover:bg-[#E2E8F0] cursor-pointer">Cancel</button>
              <button disabled={busy} onClick={saveYear} className="px-4 py-2 rounded-lg bg-[#FF5500] hover:bg-[#E64D00] text-white font-bold disabled:opacity-50 inline-flex items-center gap-1.5 cursor-pointer shadow-sm"><Save className="w-3.5 h-3.5" />Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
