import React, { useCallback, useEffect, useState } from 'react';
import apiClient from '../../../api/client';
import { useAuth } from '../../../context/AuthContext';
import { formatDateTime } from '../../../utils/dateUtils';
import {
  Activity, AlertTriangle, CheckCircle2, Clock, Eye, Hammer, RefreshCw, Search, ShieldAlert, Sparkles, Wrench, X, XCircle
} from 'lucide-react';

type Problem = 'all' | 'overdue' | 'in_progress' | 'awaiting_grading' | 'grading_failed' | 'graded' | 'voided';

interface OpsSummary {
  overdue: number;
  in_progress: number;
  awaiting_grading: number;
  grading_failed: number;
  graded_last_24h: number;
  violations_last_24h: number;
}

interface AttemptRow {
  attempt_id: number;
  student_name: string;
  register_number: string;
  domain: string;
  round: string;
  round_type: string;
  attempt_number: number;
  status: string;
  evaluation_status: string;
  problem: Problem;
  percentage: number | null;
  passed: boolean | null;
  started_at: string | null;
  expires_at: string | null;
  submitted_at: string | null;
  violations: number;
}

interface AttemptDetail extends AttemptRow {
  questions: number;
  answered: number;
  timing: { duration_minutes: number; time_remaining_seconds: number };
  violations_by_type: Record<string, number>;
  violation_timeline: Array<{ type: string; at: string }>;
  evaluation_details: any;
  ai_feedback: Array<{ question_id: number; status: string; score: number; feedback: string }>;
}

interface Checks {
  gemini_api_key_configured: boolean;
  cron_secret_configured: boolean;
  running_on_vercel: boolean;
  assistant_live_max_sessions: number;
  required_tables: Record<string, boolean>;
  all_tables_present: boolean;
  gemini_usage_today?: Array<{ model: string; requests_today: number; rpd: number; rpm: number; tpm: number; tokens_today: number }>;
  gemini_quota_resets_at?: string;
}

const PROBLEM_LABEL: Record<string, string> = {
  overdue: 'Overdue (time over, not submitted)',
  in_progress: 'In progress',
  awaiting_grading: 'Awaiting grading',
  grading_failed: 'Grading failed / stuck',
  graded: 'Graded',
  voided: 'Voided',
  all: 'All attempts',
};

const PROBLEM_STYLE: Record<string, string> = {
  overdue: 'bg-rose-50 text-rose-600 border-rose-200',
  in_progress: 'bg-sky-50 text-sky-600 border-sky-200',
  awaiting_grading: 'bg-amber-50 text-amber-600 border-amber-200',
  grading_failed: 'bg-rose-100 text-rose-700 border-rose-300',
  graded: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  voided: 'bg-slate-100 text-slate-600 border-slate-200',
};

const fmt = (ts?: string | null) => (ts ? new Date(ts).toLocaleString() : '—');
const errText = (e: any, fallback: string) => e?.response?.data?.detail || fallback;

export const ExamOperations: React.FC = () => {
  // Class Tutors see only their own class; system maintenance stays with Administrators
  const { activeRole } = useAuth();
  const isAdmin = activeRole === 'Administrator';
  const [summary, setSummary] = useState<OpsSummary | null>(null);
  const [rows, setRows] = useState<AttemptRow[]>([]);
  const [problem, setProblem] = useState<Problem>('overdue');
  const [domains, setDomains] = useState<Array<{ id: number; title: string }>>([]);
  const [domainId, setDomainId] = useState<string>('');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [notice, setNotice] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [detail, setDetail] = useState<AttemptDetail | null>(null);
  const [voidTarget, setVoidTarget] = useState<AttemptRow | null>(null);
  const [voidReason, setVoidReason] = useState('');
  const [checks, setChecks] = useState<Checks | null>(null);
  const [maintBusy, setMaintBusy] = useState<string | null>(null);

  const loadSummary = useCallback(() => {
    apiClient.get('/assessment/ops/summary').then((r) => setSummary(r.data)).catch(() => {});
  }, []);

  const loadRows = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ problem });
      if (domainId) params.append('domain_id', domainId);
      if (search.trim()) params.append('search', search.trim());
      const r = await apiClient.get(`/assessment/ops/attempts?${params.toString()}`);
      setRows(r.data);
    } catch (e) {
      setNotice({ kind: 'err', text: errText(e, 'Could not load attempts.') });
    } finally {
      setIsLoading(false);
    }
  }, [problem, domainId, search]);

  useEffect(() => {
    loadSummary();
    apiClient.get('/assessment/admin/domains').then((r) => setDomains(r.data)).catch(() => {});
    if (isAdmin) apiClient.get('/assessment/ops/maintenance/checks').then((r) => setChecks(r.data)).catch(() => {});
  }, [loadSummary]);

  useEffect(() => {
    loadRows();
  }, [problem, domainId]);

  const refreshAll = () => {
    loadSummary();
    loadRows();
  };

  const act = async (row: AttemptRow, action: 'finalize' | 'grade') => {
    setBusyId(row.attempt_id);
    setNotice(null);
    try {
      if (action === 'finalize') {
        const r = await apiClient.post(`/assessment/ops/attempts/${row.attempt_id}/finalize-overdue`);
        setNotice({ kind: 'ok', text: `Attempt #${row.attempt_id} finalized and queued for AI grading.` });
      } else {
        const r = await apiClient.post(`/assessment/ops/attempts/${row.attempt_id}/grade-now`);
        setNotice({
          kind: 'ok',
          text: `Attempt #${row.attempt_id} graded: ${r.data.status} · score ${r.data.percentage?.toFixed(0) ?? '–'}% (${r.data.passed ? 'pass' : 'fail'}).`,
        });
      }
      refreshAll();
    } catch (e) {
      setNotice({ kind: 'err', text: errText(e, `Action failed for #${row.attempt_id}.`) });
    } finally {
      setBusyId(null);
    }
  };

  const confirmVoid = async () => {
    if (!voidTarget) return;
    setBusyId(voidTarget.attempt_id);
    setNotice(null);
    try {
      await apiClient.post(`/assessment/ops/attempts/${voidTarget.attempt_id}/void`, { reason: voidReason });
      setNotice({ kind: 'ok', text: `Attempt #${voidTarget.attempt_id} has been voided.` });
      setVoidTarget(null);
      refreshAll();
    } catch (e) {
      setNotice({ kind: 'err', text: errText(e, `Could not void attempt #${voidTarget.attempt_id}.`) });
    } finally {
      setBusyId(null);
    }
  };

  const openDetail = async (row: AttemptRow) => {
    try {
      const r = await apiClient.get(`/assessment/ops/attempts/${row.attempt_id}`);
      setDetail(r.data);
    } catch (e) {
      setNotice({ kind: 'err', text: errText(e, 'Could not load details.') });
    }
  };

  const runMaintenance = async (task: string, path: string, msg: (d: any) => string) => {
    setMaintBusy(task);
    setNotice(null);
    try {
      const r = await apiClient.post(path);
      setNotice({ kind: 'ok', text: msg(r.data) });
      refreshAll();
    } catch (e) {
      setNotice({ kind: 'err', text: errText(e, 'Maintenance task failed.') });
    } finally {
      setMaintBusy(null);
    }
  };

  const cards: Array<{ key: Problem; label: string; value?: number; icon: React.ReactNode }> = [
    { key: 'overdue', label: 'Overdue to finalize', value: summary?.overdue, icon: <Clock className="w-4 h-4 text-rose-500" /> },
    { key: 'awaiting_grading', label: 'Awaiting grading', value: summary?.awaiting_grading, icon: <Sparkles className="w-4 h-4 text-amber-500" /> },
    { key: 'grading_failed', label: 'Grading failed', value: summary?.grading_failed, icon: <AlertTriangle className="w-4 h-4 text-rose-500" /> },
    { key: 'in_progress', label: 'In progress now', value: summary?.in_progress, icon: <Activity className="w-4 h-4 text-sky-500" /> },
    { key: 'graded', label: 'Graded (24 h)', value: summary?.graded_last_24h, icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" /> },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A]">{isAdmin ? 'Exam Operations Center' : 'Exam Operations: My Class'}</h1>
          <p className="text-xs text-[#64748B] mt-1">
            {isAdmin
              ? 'Live exam health, attempts that need attention, AI grading and maintenance. Every action is recorded in the audit trail.'
              : 'Your class\'s live attempts, attempts that need attention and AI grading. Every action is recorded in the audit trail.'}
          </p>
        </div>
        <button onClick={refreshAll} className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#E2E8F0] text-xs text-[#475569] hover:text-[#0F172A] hover:bg-[#F8FAFC] shadow-sm cursor-pointer transition">
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {notice && (
        <div className={`flex items-start justify-between gap-3 p-3 rounded-xl border text-xs ${notice.kind === 'ok' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
          <span>{notice.text}</span>
          <button onClick={() => setNotice(null)} className="cursor-pointer"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* Summary cards (click to filter) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {cards.map((c) => (
          <button
            key={c.key}
            onClick={() => setProblem(c.key)}
            className={`text-left p-3.5 rounded-2xl border transition cursor-pointer shadow-sm ${problem === c.key ? 'bg-[#FF5500]/10 border-[#FF5500]' : 'bg-[#FFFFFF] border-[#E2E8F0] hover:border-[#FF5500]/40'}`}
          >
            <div className="flex items-center gap-2 text-[11px] text-[#64748B]">{c.icon}{c.label}</div>
            <div className="text-2xl font-bold text-[#0F172A] mt-1">{c.value ?? '–'}</div>
          </button>
        ))}
        <div className="p-3.5 rounded-2xl border bg-[#FFFFFF] border-[#E2E8F0] shadow-sm">
          <div className="flex items-center gap-2 text-[11px] text-[#64748B]"><ShieldAlert className="w-4 h-4 text-amber-500" />Proctoring flags (24 h)</div>
          <div className="text-2xl font-bold text-[#0F172A] mt-1">{summary?.violations_last_24h ?? '–'}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#FFFFFF] p-3 rounded-2xl border border-[#E2E8F0] flex flex-col md:flex-row gap-2 text-xs shadow-sm">
        <select value={problem} onChange={(e) => setProblem(e.target.value as Problem)} className="bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] rounded-lg px-3 py-2 cursor-pointer focus:border-[#FF5500]">
          {(Object.keys(PROBLEM_LABEL) as Problem[]).map((p) => <option key={p} value={p}>{PROBLEM_LABEL[p]}</option>)}
        </select>
        <select value={domainId} onChange={(e) => setDomainId(e.target.value)} className="bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] rounded-lg px-3 py-2 cursor-pointer focus:border-[#FF5500]">
          <option value="">All domains</option>
          {domains.map((d) => <option key={d.id} value={d.id}>{d.title}</option>)}
        </select>
        <div className="flex items-center gap-2 flex-1">
          <Search className="w-4 h-4 text-[#64748B] shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadRows()}
            placeholder="Student name or register number (Enter to search)"
            className="flex-1 bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] placeholder-[#64748B]/60 rounded-lg px-3 py-2 outline-none focus:border-[#FF5500]"
          />
        </div>
      </div>

      {/* Attempts table */}
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#E2E8F0] overflow-x-auto shadow-sm">
        <table className="w-full min-w-[900px] text-left text-xs">
          <thead className="bg-[#F8FAFC] text-[#64748B] border-b border-[#E2E8F0]">
            <tr>
              <th className="p-3">Student</th>
              <th className="p-3">Round</th>
              <th className="p-3">Attempt</th>
              <th className="p-3">State</th>
              <th className="p-3">Score</th>
              <th className="p-3">Timing</th>
              <th className="p-3">Flags</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0] text-[#475569]">
            {rows.map((r) => (
              <tr key={r.attempt_id} className="align-top hover:bg-[#F8FAFC] transition">
                <td className="p-3">
                  <div className="font-bold text-[#0F172A]">{r.student_name}</div>
                  <div className="text-[#64748B] font-mono">{r.register_number}</div>
                </td>
                <td className="p-3">
                  <div className="text-[#0F172A]">{r.round}</div>
                  <div className="text-[#64748B]">{r.domain}</div>
                </td>
                <td className="p-3 font-mono">#{r.attempt_id} · try {r.attempt_number}</td>
                <td className="p-3">
                  <span className={`inline-block px-2 py-0.5 rounded border text-[10px] font-semibold ${PROBLEM_STYLE[r.problem] || ''}`}>
                    {PROBLEM_LABEL[r.problem] || r.status}
                  </span>
                </td>
                <td className="p-3">
                  {r.percentage != null ? (
                    <span className={r.passed ? 'text-[#22C55E] font-semibold' : 'text-rose-500 font-semibold'}>{r.percentage.toFixed(0)}% {r.passed ? 'pass' : 'fail'}</span>
                  ) : '—'}
                </td>
                <td className="p-3 text-[11px] text-[#64748B]">
                  <div>Started {fmt(r.started_at)}</div>
                  {r.submitted_at ? <div>Submitted {fmt(r.submitted_at)}</div> : <div>Ends {fmt(r.expires_at)}</div>}
                </td>
                <td className="p-3">
                  {r.violations > 0 ? <span className="text-amber-600 font-bold">{r.violations}</span> : <span className="text-[#94A3B8]">0</span>}
                </td>
                <td className="p-3">
                  <div className="flex flex-wrap justify-end gap-1.5">
                    <button onClick={() => openDetail(r)} className="px-2 py-1 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#FF5500]/50 text-[#0F172A] inline-flex items-center gap-1 cursor-pointer"><Eye className="w-3 h-3" />Details</button>
                    {r.problem === 'overdue' && (
                      <button disabled={busyId === r.attempt_id} onClick={() => act(r, 'finalize')} className="px-2 py-1 rounded-lg bg-[#FF5500] hover:bg-[#E64D00] text-white font-bold disabled:opacity-50 cursor-pointer shadow-xs">Finalize</button>
                    )}
                    {(r.problem === 'awaiting_grading' || r.problem === 'grading_failed') && (
                      <button disabled={busyId === r.attempt_id} onClick={() => act(r, 'grade')} className="px-2 py-1 rounded-lg bg-[#FF5500] hover:bg-[#E64D00] text-white font-bold disabled:opacity-50 cursor-pointer shadow-xs">{busyId === r.attempt_id ? 'Grading…' : 'Grade now'}</button>
                    )}
                    {r.problem === 'graded' && (
                      <button disabled={busyId === r.attempt_id} onClick={() => act(r, 'grade')} className="px-2 py-1 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#FF5500]/50 text-[#0F172A] disabled:opacity-50 cursor-pointer">{busyId === r.attempt_id ? 'Regrading…' : 'Regrade'}</button>
                    )}
                    {r.problem !== 'voided' && (
                      <button onClick={() => { setVoidTarget(r); setVoidReason(''); }} className="px-2 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 cursor-pointer">Void</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={8} className="p-8 text-center text-[#64748B]">{isLoading ? 'Loading…' : `No attempts in "${PROBLEM_LABEL[problem]}".`}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Maintenance */}
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#E2E8F0] p-5 space-y-4 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-bold text-[#0F172A]"><Wrench className="w-4 h-4 text-[#FF5500]" />{isAdmin ? 'Maintenance & configuration' : 'AI grading'}</div>
        {checks && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
            {[
              ['Gemini API key', checks.gemini_api_key_configured, 'Required for AI grading and the assistant'],
              ['CRON_SECRET', checks.cron_secret_configured, 'Required for the daily grading sweep on Vercel'],
              ['Database tables', checks.all_tables_present, Object.entries(checks.required_tables).filter(([, v]) => !v).map(([k]) => k).join(', ') || 'All present'],
              ['Assistant Live sessions', true, `Max ${checks.assistant_live_max_sessions} at once`],
            ].map(([label, ok, hint]) => (
              <div key={String(label)} className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <div className="flex items-center gap-1.5 font-semibold text-[#0F172A]">
                  {ok ? <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" /> : <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                  {String(label)}
                </div>
                <div className="text-[11px] text-[#64748B] mt-1">{String(hint)}</div>
              </div>
            ))}
          </div>
        )}
        {checks?.gemini_usage_today && checks.gemini_usage_today.length > 0 && (
          <div className="text-xs space-y-1.5">
            <div className="font-semibold text-[#0F172A]">Gemini requests today (daily limit resets {checks.gemini_quota_resets_at ? formatDateTime(checks.gemini_quota_resets_at) : 'at midnight Pacific time'})</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {checks.gemini_usage_today.map((m) => (
                <div key={m.model} className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                  <div className="font-mono text-[11px] text-[#0F172A]">{m.model}</div>
                  <div className="mt-1 h-1.5 rounded-full bg-[#E2E8F0] overflow-hidden">
                    <div className={`h-full ${m.requests_today >= m.rpd * 0.9 ? 'bg-amber-500' : 'bg-[#FF5500]'}`} style={{ width: `${Math.min(100, (m.requests_today / m.rpd) * 100)}%` }} />
                  </div>
                  <div className="text-[11px] text-[#64748B] mt-1">{m.requests_today} / {m.rpd} requests · limit {m.rpm}/min</div>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="flex flex-wrap gap-2 text-xs">
          <button disabled={!!maintBusy} onClick={() => runMaintenance('grade', '/assessment/ops/grading/run', (d) => `Grading run: ${d.processed_attempts ?? 0} graded, ${d.retry_later ?? 0} to retry, ${d.remaining_pending ?? 0} still queued.`)} className="px-3 py-2 rounded-xl bg-[#FF5500] hover:bg-[#E64D00] text-white font-bold disabled:opacity-50 inline-flex items-center gap-1.5 cursor-pointer shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />{maintBusy === 'grade' ? 'Grading…' : 'Run AI grading queue'}
          </button>
          {isAdmin && (<>
          <button disabled={!!maintBusy} onClick={() => runMaintenance('profiles', '/assessment/ops/maintenance/rebuild-profiles', (d) => `Rebuilt ${d.profiles_rebuilt} of ${d.profiles_total} stored analytics profiles${d.complete ? '' : ' (time limit reached; run again to finish)'}.`)} className="px-3 py-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] hover:border-[#FF5500]/50 disabled:opacity-50 inline-flex items-center gap-1.5 cursor-pointer shadow-xs">
            <RefreshCw className="w-3.5 h-3.5" />{maintBusy === 'profiles' ? 'Rebuilding…' : 'Rebuild radar / result profiles'}
          </button>
          <button disabled={!!maintBusy} onClick={() => runMaintenance('seq', '/assessment/admin/sync-sequences', (d) => `Database sequences checked: ${d.summary?.updated ?? 0} repaired.`)} className="px-3 py-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] hover:border-[#FF5500]/50 disabled:opacity-50 inline-flex items-center gap-1.5 cursor-pointer shadow-xs">
            <Hammer className="w-3.5 h-3.5" />{maintBusy === 'seq' ? 'Repairing…' : 'Repair ID sequences'}
          </button>
          </>)}
        </div>
        <p className="text-[11px] text-[#64748B]">
          {isAdmin
            ? 'Rebuild profiles after editing data directly in the database. Repair ID sequences if creating records fails with a "duplicate key" error after an import.'
            : 'Grades your class\'s coding and debugging submissions that are waiting for the AI grader.'}
        </p>
      </div>

      {/* Void dialog */}
      {voidTarget && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl max-w-md w-full p-5 space-y-3 shadow-2xl">
            <h3 className="text-sm font-bold text-[#0F172A]">Void attempt #{voidTarget.attempt_id}?</h3>
            <p className="text-xs text-[#64748B]">
              {voidTarget.student_name} · {voidTarget.round}. The attempt will stop counting toward results and the student can start the round again. Use this for technical failures, not to give extra tries.
            </p>
            <textarea
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
              placeholder="Reason (required), e.g. power cut at the exam centre"
              rows={3}
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-2 text-xs text-[#0F172A] outline-none focus:border-[#FF5500]"
            />
            <div className="flex justify-end gap-2 text-xs">
              <button onClick={() => setVoidTarget(null)} className="px-3 py-2 rounded-lg bg-[#FFFFFF] border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] cursor-pointer">Cancel</button>
              <button disabled={voidReason.trim().length < 5 || busyId === voidTarget.attempt_id} onClick={confirmVoid} className="px-3 py-2 rounded-lg bg-rose-600 text-white font-bold disabled:opacity-50 cursor-pointer">Void attempt</button>
            </div>
          </div>
        </div>
      )}

      {/* Detail drawer */}
      {detail && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/40 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-lg h-full bg-[#FFFFFF] border-l border-[#E2E8F0] overflow-y-auto p-5 space-y-4 text-xs shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[10px] font-mono text-[#FF5500] font-semibold">Attempt #{detail.attempt_id} · try {detail.attempt_number}</div>
                <h3 className="text-sm font-bold text-[#0F172A]">{detail.student_name} ({detail.register_number})</h3>
                <div className="text-[#64748B]">{detail.round} · {detail.domain}</div>
              </div>
              <button onClick={() => setDetail(null)} className="p-1.5 rounded-lg hover:bg-[#F0F3F6] text-[#64748B] hover:text-[#0F172A] cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]"><div className="text-[#64748B]">State</div><div className="font-bold text-[#0F172A]">{PROBLEM_LABEL[detail.problem] || detail.status}</div></div>
              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]"><div className="text-[#64748B]">Answered</div><div className="font-bold text-[#0F172A]">{detail.answered} of {detail.questions}</div></div>
              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]"><div className="text-[#64748B]">Duration</div><div className="font-bold text-[#0F172A]">{detail.timing?.duration_minutes} min</div></div>
              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]"><div className="text-[#64748B]">Score</div><div className="font-bold text-[#0F172A]">{detail.percentage != null ? `${detail.percentage.toFixed(1)}%` : '—'}</div></div>
            </div>
            {detail.evaluation_details?.voided && (
              <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-700">
                Voided by {detail.evaluation_details.voided.by} on {fmt(detail.evaluation_details.voided.at)}: {detail.evaluation_details.voided.reason}
              </div>
            )}
            <div className="space-y-2">
              <div className="font-bold text-[#0F172A] flex items-center gap-1.5"><ShieldAlert className="w-3.5 h-3.5 text-amber-500" />Proctoring flags ({detail.violations})</div>
              {detail.violations === 0 ? <div className="text-[#64748B]">No flags recorded.</div> : (
                <>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(detail.violations_by_type).map(([t, n]) => (
                      <span key={t} className="px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-700">{t.replace(/_/g, ' ').toLowerCase()} × {n}</span>
                    ))}
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-0.5 text-[11px] text-[#64748B]">
                    {detail.violation_timeline.map((v, i) => <div key={i}>{fmt(v.at)} · {v.type.replace(/_/g, ' ').toLowerCase()}</div>)}
                  </div>
                </>
              )}
            </div>
            {detail.ai_feedback.length > 0 && (
              <div className="space-y-2">
                <div className="font-bold text-[#0F172A] flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-[#FF5500]" />AI grader feedback</div>
                {detail.ai_feedback.map((f) => (
                  <div key={f.question_id} className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
                    <div className="flex justify-between"><span className="text-[#0F172A]">Question #{f.question_id}</span><span className="text-[#FF5500] font-semibold">{f.status} · {f.score}</span></div>
                    <div className="text-[#64748B] whitespace-pre-wrap">{f.feedback}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
