import React, { useCallback, useEffect, useState } from 'react';
import apiClient from '../../../api/client';
import { useAuth } from '../../../context/AuthContext';
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
  overdue: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  in_progress: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  awaiting_grading: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  grading_failed: 'bg-red-500/20 text-red-300 border-red-500/40',
  graded: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  voided: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
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
    // reload when the filter selectors change (search runs on Enter / button)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problem, domainId]);

  const refreshAll = () => {
    loadSummary();
    loadRows();
  };

  const act = async (row: AttemptRow, action: 'finalize' | 'grade') => {
    setBusyId(row.attempt_id);
    setNotice(null);
    try {
      await apiClient.post(`/assessment/ops/attempts/${row.attempt_id}/${action}`, {}, { timeout: 90000 });
      setNotice({
        kind: 'ok',
        text: action === 'finalize'
          ? `Attempt #${row.attempt_id} finalized with the answers saved before the deadline.`
          : `Attempt #${row.attempt_id} ${row.status === 'EVALUATED' ? 'regraded' : 'graded'}.`
      });
      refreshAll();
    } catch (e) {
      setNotice({ kind: 'err', text: errText(e, 'Action failed.') });
    } finally {
      setBusyId(null);
    }
  };

  const confirmVoid = async () => {
    if (!voidTarget || voidReason.trim().length < 5) return;
    setBusyId(voidTarget.attempt_id);
    try {
      await apiClient.post(`/assessment/ops/attempts/${voidTarget.attempt_id}/void`, { reason: voidReason.trim() });
      setNotice({ kind: 'ok', text: `Attempt #${voidTarget.attempt_id} voided. The student can start the round again.` });
      setVoidTarget(null);
      setVoidReason('');
      refreshAll();
    } catch (e) {
      setNotice({ kind: 'err', text: errText(e, 'Could not void the attempt.') });
    } finally {
      setBusyId(null);
    }
  };

  const openDetail = async (row: AttemptRow) => {
    try {
      const r = await apiClient.get(`/assessment/ops/attempts/${row.attempt_id}`);
      setDetail(r.data);
    } catch (e) {
      setNotice({ kind: 'err', text: errText(e, 'Could not load attempt details.') });
    }
  };

  const runMaintenance = async (key: string, url: string, describe: (d: any) => string) => {
    setMaintBusy(key);
    setNotice(null);
    try {
      const r = await apiClient.post(url, {}, { timeout: 90000 });
      setNotice({ kind: 'ok', text: describe(r.data) });
      refreshAll();
    } catch (e) {
      setNotice({ kind: 'err', text: errText(e, 'Maintenance action failed.') });
    } finally {
      setMaintBusy(null);
    }
  };

  const cards: Array<{ key: Problem; label: string; value?: number; icon: React.ReactNode }> = [
    { key: 'overdue', label: 'Overdue', value: summary?.overdue, icon: <Clock className="w-4 h-4 text-rose-400" /> },
    { key: 'grading_failed', label: 'Grading failed', value: summary?.grading_failed, icon: <XCircle className="w-4 h-4 text-red-400" /> },
    { key: 'awaiting_grading', label: 'Awaiting grading', value: summary?.awaiting_grading, icon: <Sparkles className="w-4 h-4 text-amber-400" /> },
    { key: 'in_progress', label: 'In progress now', value: summary?.in_progress, icon: <Activity className="w-4 h-4 text-sky-400" /> },
    { key: 'graded', label: 'Graded (24 h)', value: summary?.graded_last_24h, icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" /> },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#F8F5ED]">{isAdmin ? 'Exam Operations Center' : 'Exam Operations: My Class'}</h1>
          <p className="text-xs text-[#9E988A] mt-1">
            {isAdmin
              ? 'Live exam health, attempts that need attention, AI grading and maintenance. Every action is recorded in the audit trail.'
              : 'Your class\'s live attempts, attempts that need attention and AI grading. Every action is recorded in the audit trail.'}
          </p>
        </div>
        <button onClick={refreshAll} className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1C1B18] border border-[#2A2824] text-xs text-[#D8D2C5] hover:text-[#F8F5ED] cursor-pointer">
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {notice && (
        <div className={`flex items-start justify-between gap-3 p-3 rounded-xl border text-xs ${notice.kind === 'ok' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200' : 'bg-red-500/10 border-red-500/30 text-red-200'}`}>
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
            className={`text-left p-3.5 rounded-2xl border transition cursor-pointer ${problem === c.key ? 'bg-[#C9A227]/10 border-[#C9A227]' : 'bg-[#1C1B18] border-[#2A2824] hover:border-[#C9A227]/40'}`}
          >
            <div className="flex items-center gap-2 text-[11px] text-[#9E988A]">{c.icon}{c.label}</div>
            <div className="text-2xl font-bold text-[#F8F5ED] mt-1">{c.value ?? '–'}</div>
          </button>
        ))}
        <div className="p-3.5 rounded-2xl border bg-[#1C1B18] border-[#2A2824]">
          <div className="flex items-center gap-2 text-[11px] text-[#9E988A]"><ShieldAlert className="w-4 h-4 text-orange-400" />Proctoring flags (24 h)</div>
          <div className="text-2xl font-bold text-[#F8F5ED] mt-1">{summary?.violations_last_24h ?? '–'}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#1C1B18] p-3 rounded-2xl border border-[#2A2824] flex flex-col md:flex-row gap-2 text-xs">
        <select value={problem} onChange={(e) => setProblem(e.target.value as Problem)} className="bg-[#141311] border border-[#2A2824] text-[#F8F5ED] rounded-lg px-3 py-2 cursor-pointer">
          {(Object.keys(PROBLEM_LABEL) as Problem[]).map((p) => <option key={p} value={p}>{PROBLEM_LABEL[p]}</option>)}
        </select>
        <select value={domainId} onChange={(e) => setDomainId(e.target.value)} className="bg-[#141311] border border-[#2A2824] text-[#F8F5ED] rounded-lg px-3 py-2 cursor-pointer">
          <option value="">All domains</option>
          {domains.map((d) => <option key={d.id} value={d.id}>{d.title}</option>)}
        </select>
        <div className="flex items-center gap-2 flex-1">
          <Search className="w-4 h-4 text-[#9E988A] shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadRows()}
            placeholder="Student name or register number (Enter to search)"
            className="flex-1 bg-[#141311] border border-[#2A2824] text-[#F8F5ED] placeholder-[#9E988A]/60 rounded-lg px-3 py-2 outline-none focus:border-[#C9A227]"
          />
        </div>
      </div>

      {/* Attempts table */}
      <div className="bg-[#1C1B18] rounded-2xl border border-[#2A2824] overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-xs">
          <thead className="bg-[#141311] text-[#9E988A] border-b border-[#2A2824]">
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
          <tbody className="divide-y divide-[#2A2824] text-[#D8D2C5]">
            {rows.map((r) => (
              <tr key={r.attempt_id} className="align-top hover:bg-[#24231F]">
                <td className="p-3">
                  <div className="font-bold text-[#F8F5ED]">{r.student_name}</div>
                  <div className="text-[#9E988A] font-mono">{r.register_number}</div>
                </td>
                <td className="p-3">
                  <div className="text-[#F8F5ED]">{r.round}</div>
                  <div className="text-[#9E988A]">{r.domain}</div>
                </td>
                <td className="p-3 font-mono">#{r.attempt_id} · try {r.attempt_number}</td>
                <td className="p-3">
                  <span className={`inline-block px-2 py-0.5 rounded border text-[10px] font-semibold ${PROBLEM_STYLE[r.problem] || ''}`}>
                    {PROBLEM_LABEL[r.problem] || r.status}
                  </span>
                </td>
                <td className="p-3">
                  {r.percentage != null ? (
                    <span className={r.passed ? 'text-emerald-300' : 'text-red-300'}>{r.percentage.toFixed(0)}% {r.passed ? 'pass' : 'fail'}</span>
                  ) : '—'}
                </td>
                <td className="p-3 text-[11px] text-[#9E988A]">
                  <div>Started {fmt(r.started_at)}</div>
                  {r.submitted_at ? <div>Submitted {fmt(r.submitted_at)}</div> : <div>Ends {fmt(r.expires_at)}</div>}
                </td>
                <td className="p-3">
                  {r.violations > 0 ? <span className="text-orange-300 font-bold">{r.violations}</span> : <span className="text-[#6B665E]">0</span>}
                </td>
                <td className="p-3">
                  <div className="flex flex-wrap justify-end gap-1.5">
                    <button onClick={() => openDetail(r)} className="px-2 py-1 rounded-lg bg-[#141311] border border-[#2A2824] hover:border-[#C9A227]/50 inline-flex items-center gap-1 cursor-pointer"><Eye className="w-3 h-3" />Details</button>
                    {r.problem === 'overdue' && (
                      <button disabled={busyId === r.attempt_id} onClick={() => act(r, 'finalize')} className="px-2 py-1 rounded-lg bg-[#C9A227] text-[#11110F] font-bold disabled:opacity-50 cursor-pointer">Finalize</button>
                    )}
                    {(r.problem === 'awaiting_grading' || r.problem === 'grading_failed') && (
                      <button disabled={busyId === r.attempt_id} onClick={() => act(r, 'grade')} className="px-2 py-1 rounded-lg bg-[#C9A227] text-[#11110F] font-bold disabled:opacity-50 cursor-pointer">{busyId === r.attempt_id ? 'Grading…' : 'Grade now'}</button>
                    )}
                    {r.problem === 'graded' && (
                      <button disabled={busyId === r.attempt_id} onClick={() => act(r, 'grade')} className="px-2 py-1 rounded-lg bg-[#141311] border border-[#2A2824] hover:border-[#C9A227]/50 disabled:opacity-50 cursor-pointer">{busyId === r.attempt_id ? 'Regrading…' : 'Regrade'}</button>
                    )}
                    {r.problem !== 'voided' && (
                      <button onClick={() => { setVoidTarget(r); setVoidReason(''); }} className="px-2 py-1 rounded-lg bg-[#141311] border border-red-500/30 text-red-300 hover:bg-red-500/10 cursor-pointer">Void</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={8} className="p-8 text-center text-[#9E988A]">{isLoading ? 'Loading…' : `No attempts in "${PROBLEM_LABEL[problem]}".`}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Maintenance */}
      <div className="bg-[#1C1B18] rounded-2xl border border-[#2A2824] p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-[#F8F5ED]"><Wrench className="w-4 h-4 text-[#C9A227]" />{isAdmin ? 'Maintenance & configuration' : 'AI grading'}</div>
        {checks && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
            {[
              ['Gemini API key', checks.gemini_api_key_configured, 'Required for AI grading and the assistant'],
              ['CRON_SECRET', checks.cron_secret_configured, 'Required for the daily grading sweep on Vercel'],
              ['Database tables', checks.all_tables_present, Object.entries(checks.required_tables).filter(([, v]) => !v).map(([k]) => k).join(', ') || 'All present'],
              ['Assistant Live sessions', true, `Max ${checks.assistant_live_max_sessions} at once`],
            ].map(([label, ok, hint]) => (
              <div key={String(label)} className="p-3 rounded-xl bg-[#141311] border border-[#2A2824]">
                <div className="flex items-center gap-1.5 font-semibold text-[#F8F5ED]">
                  {ok ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
                  {String(label)}
                </div>
                <div className="text-[11px] text-[#9E988A] mt-1">{String(hint)}</div>
              </div>
            ))}
          </div>
        )}
        <div className="flex flex-wrap gap-2 text-xs">
          <button disabled={!!maintBusy} onClick={() => runMaintenance('grade', '/assessment/ops/grading/run', (d) => `Grading run: ${d.processed_attempts ?? 0} graded, ${d.retry_later ?? 0} to retry, ${d.remaining_pending ?? 0} still queued.`)} className="px-3 py-2 rounded-xl bg-[#C9A227] text-[#11110F] font-bold disabled:opacity-50 inline-flex items-center gap-1.5 cursor-pointer">
            <Sparkles className="w-3.5 h-3.5" />{maintBusy === 'grade' ? 'Grading…' : 'Run AI grading queue'}
          </button>
          {isAdmin && (<>
          <button disabled={!!maintBusy} onClick={() => runMaintenance('profiles', '/assessment/ops/maintenance/rebuild-profiles', (d) => `Rebuilt ${d.profiles_rebuilt} of ${d.profiles_total} stored analytics profiles${d.complete ? '' : ' (time limit reached; run again to finish)'}.`)} className="px-3 py-2 rounded-xl bg-[#141311] border border-[#2A2824] text-[#D8D2C5] hover:border-[#C9A227]/50 disabled:opacity-50 inline-flex items-center gap-1.5 cursor-pointer">
            <RefreshCw className="w-3.5 h-3.5" />{maintBusy === 'profiles' ? 'Rebuilding…' : 'Rebuild radar / result profiles'}
          </button>
          <button disabled={!!maintBusy} onClick={() => runMaintenance('seq', '/assessment/admin/sync-sequences', (d) => `Database sequences checked: ${d.summary?.updated ?? 0} repaired.`)} className="px-3 py-2 rounded-xl bg-[#141311] border border-[#2A2824] text-[#D8D2C5] hover:border-[#C9A227]/50 disabled:opacity-50 inline-flex items-center gap-1.5 cursor-pointer">
            <Hammer className="w-3.5 h-3.5" />{maintBusy === 'seq' ? 'Repairing…' : 'Repair ID sequences'}
          </button>
          </>)}
        </div>
        <p className="text-[11px] text-[#9E988A]">
          {isAdmin
            ? 'Rebuild profiles after editing data directly in the database. Repair ID sequences if creating records fails with a "duplicate key" error after an import.'
            : 'Grades your class\'s coding and debugging submissions that are waiting for the AI grader.'}
        </p>
      </div>

      {/* Void dialog */}
      {voidTarget && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#1C1B18] border border-[#2A2824] rounded-2xl max-w-md w-full p-5 space-y-3">
            <h3 className="text-sm font-bold text-[#F8F5ED]">Void attempt #{voidTarget.attempt_id}?</h3>
            <p className="text-xs text-[#9E988A]">
              {voidTarget.student_name} · {voidTarget.round}. The attempt will stop counting toward results and the student can start the round again. Use this for technical failures, not to give extra tries.
            </p>
            <textarea
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
              placeholder="Reason (required), e.g. power cut at the exam centre"
              rows={3}
              className="w-full bg-[#141311] border border-[#2A2824] rounded-lg p-2 text-xs text-[#F8F5ED] outline-none focus:border-[#C9A227]"
            />
            <div className="flex justify-end gap-2 text-xs">
              <button onClick={() => setVoidTarget(null)} className="px-3 py-2 rounded-lg bg-[#141311] border border-[#2A2824] text-[#D8D2C5] cursor-pointer">Cancel</button>
              <button disabled={voidReason.trim().length < 5 || busyId === voidTarget.attempt_id} onClick={confirmVoid} className="px-3 py-2 rounded-lg bg-red-600 text-white font-bold disabled:opacity-50 cursor-pointer">Void attempt</button>
            </div>
          </div>
        </div>
      )}

      {/* Detail drawer */}
      {detail && (
        <div className="fixed inset-0 z-50 bg-black/70 flex justify-end">
          <div className="w-full max-w-lg h-full bg-[#1C1B18] border-l border-[#2A2824] overflow-y-auto p-5 space-y-4 text-xs">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[10px] font-mono text-[#C9A227]">Attempt #{detail.attempt_id} · try {detail.attempt_number}</div>
                <h3 className="text-sm font-bold text-[#F8F5ED]">{detail.student_name} ({detail.register_number})</h3>
                <div className="text-[#9E988A]">{detail.round} · {detail.domain}</div>
              </div>
              <button onClick={() => setDetail(null)} className="p-1.5 rounded-lg hover:bg-[#24231F] cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-xl bg-[#141311] border border-[#2A2824]"><div className="text-[#9E988A]">State</div><div className="font-bold text-[#F8F5ED]">{PROBLEM_LABEL[detail.problem] || detail.status}</div></div>
              <div className="p-3 rounded-xl bg-[#141311] border border-[#2A2824]"><div className="text-[#9E988A]">Answered</div><div className="font-bold text-[#F8F5ED]">{detail.answered} of {detail.questions}</div></div>
              <div className="p-3 rounded-xl bg-[#141311] border border-[#2A2824]"><div className="text-[#9E988A]">Duration</div><div className="font-bold text-[#F8F5ED]">{detail.timing?.duration_minutes} min</div></div>
              <div className="p-3 rounded-xl bg-[#141311] border border-[#2A2824]"><div className="text-[#9E988A]">Score</div><div className="font-bold text-[#F8F5ED]">{detail.percentage != null ? `${detail.percentage.toFixed(1)}%` : '—'}</div></div>
            </div>
            {detail.evaluation_details?.voided && (
              <div className="p-3 rounded-xl bg-slate-500/10 border border-slate-500/30 text-slate-200">
                Voided by {detail.evaluation_details.voided.by} on {fmt(detail.evaluation_details.voided.at)}: {detail.evaluation_details.voided.reason}
              </div>
            )}
            <div className="space-y-2">
              <div className="font-bold text-[#F8F5ED] flex items-center gap-1.5"><ShieldAlert className="w-3.5 h-3.5 text-orange-400" />Proctoring flags ({detail.violations})</div>
              {detail.violations === 0 ? <div className="text-[#9E988A]">No flags recorded.</div> : (
                <>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(detail.violations_by_type).map(([t, n]) => (
                      <span key={t} className="px-2 py-0.5 rounded bg-orange-500/10 border border-orange-500/30 text-orange-200">{t.replace(/_/g, ' ').toLowerCase()} × {n}</span>
                    ))}
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-0.5 text-[11px] text-[#9E988A]">
                    {detail.violation_timeline.map((v, i) => <div key={i}>{fmt(v.at)} · {v.type.replace(/_/g, ' ').toLowerCase()}</div>)}
                  </div>
                </>
              )}
            </div>
            {detail.ai_feedback.length > 0 && (
              <div className="space-y-2">
                <div className="font-bold text-[#F8F5ED] flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-[#C9A227]" />AI grader feedback</div>
                {detail.ai_feedback.map((f) => (
                  <div key={f.question_id} className="p-3 rounded-xl bg-[#141311] border border-[#2A2824] space-y-1">
                    <div className="flex justify-between"><span className="text-[#F8F5ED]">Question #{f.question_id}</span><span className="text-[#C9A227]">{f.status} · {f.score}</span></div>
                    <div className="text-[#9E988A] whitespace-pre-wrap">{f.feedback}</div>
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
