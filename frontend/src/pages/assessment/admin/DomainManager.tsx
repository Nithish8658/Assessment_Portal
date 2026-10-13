import React, { useEffect, useMemo, useState } from 'react';
import apiClient from '../../../api/client';
import { Archive, Edit2, FileText, Plus, Power, RotateCcw, Save, Search, Wand2, X } from 'lucide-react';

interface AdminRound {
  id: number;
  domain_id: number;
  round_number: number;
  title: string;
  round_type: string;
  duration_minutes: number;
  questions_per_attempt: number;
  passing_score: number;
  weightage_percent: number;
  active_questions: number;
  archived_questions: number;
  active_by_difficulty: Record<string, number>;
}

interface AdminDomain {
  id: number;
  slug: string;
  title: string;
  description?: string;
  is_active: boolean;
  rounds: AdminRound[];
}

interface AdminQuestion {
  id: number;
  round_id: number;
  competency_id?: number | null;
  question_type: string;
  title: string;
  candidate_content: string;
  candidate_code_template?: string | null;
  options_json?: any;
  difficulty: string;
  marks: number;
  time_limit_seconds: number;
  version: number;
  status: string;
  evaluation_type?: string | null;
  correct_answer?: string | null;
  reference_solution?: string | null;
  public_test_cases?: any[];
  hidden_test_cases?: any[];
}

interface Competency { id: number; code: string; name: string; category: string }

interface Draft {
  id?: number;
  question_type: string;
  title: string;
  candidate_content: string;
  candidate_code_template: string;
  options: string[];
  difficulty: string;
  marks: number;
  time_limit_seconds: number;
  competency_id: number | '';
  correct_answer: string;
  reference_solution: string;
  public_tests: string;
  hidden_tests: string;
}

const DIFFICULTIES = ['Easy', 'Medium', 'Hard', 'Expert'];
const QUESTION_TYPES = ['mcq', 'coding', 'debugging', 'text_response', 'scenario'];

const emptyDraft = (roundType: string): Draft => {
  const t = roundType === 'CODING' ? 'coding' : roundType === 'DEBUGGING' ? 'debugging' : 'mcq';
  return {
    question_type: t, title: '', candidate_content: '', candidate_code_template: '', options: ['', '', '', ''],
    difficulty: 'Medium', marks: t === 'mcq' ? 2 : 10, time_limit_seconds: t === 'mcq' ? 60 : 300, competency_id: '',
    correct_answer: '', reference_solution: '', public_tests: '[]', hidden_tests: '[]',
  };
};

// Seeded MCQs store options as {id, text} and the answer as an option id; the editor works on text
const optionText = (o: any) => (o && typeof o === 'object' ? String(o.text ?? o.label ?? o.value ?? '') : String(o));
const answerText = (q: AdminQuestion) => {
  const match = Array.isArray(q.options_json)
    ? q.options_json.find((o: any) => o && typeof o === 'object' && String(o.id) === String(q.correct_answer))
    : null;
  return match ? optionText(match) : q.correct_answer || '';
};

const draftFrom = (q: AdminQuestion): Draft => ({
  id: q.id,
  question_type: q.question_type,
  title: q.title,
  candidate_content: q.candidate_content,
  candidate_code_template: q.candidate_code_template || '',
  options: Array.isArray(q.options_json) ? q.options_json.map(optionText) : ['', '', '', ''],
  difficulty: q.difficulty,
  marks: q.marks,
  time_limit_seconds: q.time_limit_seconds,
  competency_id: q.competency_id ?? '',
  correct_answer: answerText(q),
  reference_solution: q.reference_solution || '',
  public_tests: JSON.stringify(q.public_test_cases || [], null, 2),
  hidden_tests: JSON.stringify(q.hidden_test_cases || [], null, 2),
});

const errText = (e: any, fallback: string) => {
  const d = e?.response?.data?.detail;
  if (Array.isArray(d)) return d.map((x: any) => `${(x.loc || []).slice(-1)[0]}: ${x.msg}`).join('; ');
  return d || fallback;
};

const inputCls = 'w-full bg-[#141311] text-[#F8F5ED] border border-[#2A2824] rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-[#C9A227]';
const labelCls = 'text-[10px] uppercase text-[#9E988A] font-mono';

export const DomainManager: React.FC = () => {
  const [domains, setDomains] = useState<AdminDomain[]>([]);
  const [domainId, setDomainId] = useState<number | null>(null);
  const [roundId, setRoundId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<AdminQuestion[]>([]);
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [notice, setNotice] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const [isEditingRound, setIsEditingRound] = useState(false);
  const [roundForm, setRoundForm] = useState({ duration_minutes: 30, questions_per_attempt: 1, passing_score: 60, weightage_percent: 25 });

  const [statusFilter, setStatusFilter] = useState<'Active' | 'Archived' | 'All'>('Active');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [textFilter, setTextFilter] = useState('');

  const [draft, setDraft] = useState<Draft | null>(null);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const domain = domains.find((d) => d.id === domainId) || null;
  const round = domain?.rounds.find((r) => r.id === roundId) || null;

  const loadDomains = async (keepSelection = true) => {
    try {
      const res = await apiClient.get('/assessment/admin/domains');
      const list: AdminDomain[] = res.data;
      setDomains(list);
      if (!keepSelection || !list.some((d) => d.id === domainId)) {
        const first = list[0];
        setDomainId(first?.id ?? null);
        setRoundId(first?.rounds[0]?.id ?? null);
      }
    } catch (e) {
      setNotice({ kind: 'err', text: errText(e, 'Could not load assessment domains.') });
    }
  };

  const loadQuestions = async (rid: number) => {
    try {
      const res = await apiClient.get(`/assessment/admin/rounds/${rid}/questions`);
      setQuestions(res.data);
    } catch {
      setQuestions([]);
    }
  };

  useEffect(() => {
    loadDomains(false);
    apiClient.get('/assessment/admin/competencies').then((r) => setCompetencies(r.data)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (roundId) loadQuestions(roundId);
    setIsEditingRound(false);
  }, [roundId]);

  useEffect(() => {
    if (round) {
      setRoundForm({
        duration_minutes: round.duration_minutes,
        questions_per_attempt: round.questions_per_attempt,
        passing_score: round.passing_score,
        weightage_percent: round.weightage_percent,
      });
    }
  }, [round?.id, round?.duration_minutes, round?.questions_per_attempt, round?.passing_score, round?.weightage_percent]);

  const filteredQuestions = useMemo(() => {
    const t = textFilter.trim().toLowerCase();
    return questions.filter((q) =>
      (statusFilter === 'All' || q.status === statusFilter) &&
      (!difficultyFilter || q.difficulty === difficultyFilter) &&
      (!t || q.title.toLowerCase().includes(t) || q.candidate_content.toLowerCase().includes(t))
    );
  }, [questions, statusFilter, difficultyFilter, textFilter]);

  const toggleDomain = async (d: AdminDomain) => {
    try {
      await apiClient.put(`/assessment/admin/domains/${d.id}`, { is_active: !d.is_active });
      setNotice({ kind: 'ok', text: `${d.title} is now ${d.is_active ? 'inactive (hidden from activation)' : 'active'}.` });
      loadDomains();
    } catch (e) {
      setNotice({ kind: 'err', text: errText(e, 'Could not change the domain status.') });
    }
  };

  const saveRound = async () => {
    if (!round) return;
    try {
      await apiClient.put(`/assessment/admin/rounds/${round.id}`, roundForm);
      setNotice({ kind: 'ok', text: 'Round settings saved. New attempts use them; attempts already started keep their timing.' });
      setIsEditingRound(false);
      loadDomains();
    } catch (e) {
      setNotice({ kind: 'err', text: errText(e, 'Could not save round settings.') });
    }
  };

  const setQuestionStatus = async (q: AdminQuestion, status: 'Active' | 'Archived') => {
    try {
      await apiClient.post(`/assessment/admin/questions/${q.id}/status`, { status });
      setNotice({ kind: 'ok', text: `"${q.title}" ${status === 'Archived' ? 'archived' : 'restored'}.` });
      if (roundId) loadQuestions(roundId);
      loadDomains();
    } catch (e) {
      setNotice({ kind: 'err', text: errText(e, 'Could not change the question status.') });
    }
  };

  const generateStarter = async () => {
    if (!draft?.reference_solution.trim()) {
      setDraftError('Enter the reference solution first.');
      return;
    }
    try {
      const r = await apiClient.post('/assessment/admin/questions/starter-preview', { reference_solution: draft.reference_solution });
      setDraft({ ...draft, candidate_code_template: r.data.candidate_code_template });
      setDraftError(null);
    } catch (e) {
      setDraftError(errText(e, 'Could not generate a starter skeleton.'));
    }
  };

  const saveDraft = async () => {
    if (!draft || !round) return;
    let publicTests: any[] = [];
    let hiddenTests: any[] = [];
    if (draft.question_type === 'coding') {
      try {
        publicTests = JSON.parse(draft.public_tests || '[]');
        hiddenTests = JSON.parse(draft.hidden_tests || '[]');
        if (!Array.isArray(publicTests) || !Array.isArray(hiddenTests)) throw new Error();
      } catch {
        setDraftError('Test cases must be JSON lists, e.g. [{"input": "1 2", "expected_output": "3"}].');
        return;
      }
    }
    const payload: any = {
      question_type: draft.question_type,
      title: draft.title,
      candidate_content: draft.candidate_content,
      candidate_code_template: draft.candidate_code_template || null,
      difficulty: draft.difficulty,
      marks: Number(draft.marks),
      time_limit_seconds: Number(draft.time_limit_seconds),
      competency_id: draft.competency_id === '' ? null : Number(draft.competency_id),
      correct_answer: draft.correct_answer || null,
      reference_solution: draft.reference_solution || null,
      public_test_cases: publicTests,
      hidden_test_cases: hiddenTests,
    };
    if (draft.question_type === 'mcq' || draft.question_type === 'scenario') {
      payload.options_json = draft.options.map((o) => o.trim()).filter(Boolean);
    }
    setIsSaving(true);
    setDraftError(null);
    try {
      if (draft.id) {
        await apiClient.put(`/assessment/admin/questions/${draft.id}`, payload);
      } else {
        await apiClient.post(`/assessment/admin/rounds/${round.id}/questions`, payload);
      }
      setNotice({ kind: 'ok', text: draft.id ? 'Question updated. Attempts already started keep their original copy.' : 'Question added to the bank.' });
      setDraft(null);
      loadQuestions(round.id);
      loadDomains();
    } catch (e) {
      setDraftError(errText(e, 'Could not save the question.'));
    } finally {
      setIsSaving(false);
    }
  };

  const optionList = draft ? draft.options.map((o) => o.trim()).filter(Boolean) : [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 font-sans">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#F8F5ED]">Assessment Track Manager</h1>
        <p className="text-xs text-[#9E988A] mt-1">
          Turn tracks on or off, tune round settings, and maintain the question bank. Changes are versioned and recorded in the audit trail.
        </p>
      </div>

      {notice && (
        <div className={`flex items-start justify-between gap-3 p-3 rounded-xl border text-xs ${notice.kind === 'ok' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200' : 'bg-red-500/10 border-red-500/30 text-red-200'}`}>
          <span>{notice.text}</span>
          <button onClick={() => setNotice(null)} className="cursor-pointer"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* Domain selector */}
      <div className="flex flex-wrap gap-2">
        {domains.map((d) => (
          <button
            key={d.id}
            onClick={() => { setDomainId(d.id); setRoundId(d.rounds[0]?.id ?? null); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer border inline-flex items-center gap-2 ${domainId === d.id ? 'bg-[#C9A227] text-[#11110F] border-[#C9A227]' : 'bg-[#1C1B18] text-[#9E988A] border-[#2A2824] hover:text-[#F8F5ED]'}`}
          >
            {d.title}
            {!d.is_active && <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/30 uppercase">inactive</span>}
          </button>
        ))}
      </div>

      {domain && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#1C1B18] border border-[#2A2824]">
          <div className="text-xs text-[#9E988A]">
            <span className="font-bold text-[#F8F5ED]">{domain.title}</span> · {domain.rounds.length} rounds ·{' '}
            {domain.is_active ? <span className="text-emerald-300">Active: tutors can activate it</span> : <span className="text-amber-300">Inactive: hidden from tutors and students</span>}
          </div>
          <button onClick={() => toggleDomain(domain)} className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-[#141311] border border-[#2A2824] text-xs text-[#D8D2C5] hover:border-[#C9A227]/50 inline-flex items-center gap-1.5 cursor-pointer">
            <Power className="w-3.5 h-3.5" />{domain.is_active ? 'Deactivate track' : 'Activate track'}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Rounds */}
        <div className="lg:col-span-4 bg-[#1C1B18] border border-[#2A2824] rounded-2xl p-4 space-y-2">
          <h3 className="text-xs font-bold text-[#9E988A] uppercase font-mono px-1 pb-2 border-b border-[#2A2824]">Rounds ({domain?.rounds.length || 0})</h3>
          <div className="space-y-1.5 max-h-[70vh] overflow-y-auto">
            {(domain?.rounds || []).map((r) => {
              const short = r.active_questions < r.questions_per_attempt;
              return (
                <button
                  key={r.id}
                  onClick={() => setRoundId(r.id)}
                  className={`w-full text-left p-3 rounded-xl border text-xs transition cursor-pointer ${roundId === r.id ? 'bg-[#C9A227]/10 border-[#C9A227]' : 'bg-[#141311] border-[#2A2824] hover:border-[#C9A227]/40'}`}
                >
                  <div className="font-bold text-[#F8F5ED]">R{r.round_number}: {r.title}</div>
                  <div className="text-[10px] text-[#9E988A] mt-0.5">
                    {r.round_type} · {r.duration_minutes} min · {r.questions_per_attempt} per attempt
                  </div>
                  <div className={`text-[10px] mt-0.5 ${short ? 'text-red-300' : 'text-[#9E988A]'}`}>
                    {r.active_questions} active ({Object.entries(r.active_by_difficulty).map(([k, v]) => `${k} ${v}`).join(', ') || 'none'})
                    {short && ' · not enough questions'}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-8 space-y-4">
          {round && (
            <>
              {/* Round settings */}
              <div className="bg-[#1C1B18] border border-[#2A2824] rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-[#2A2824] pb-3">
                  <div>
                    <span className="text-[10px] font-mono text-[#E3C766] uppercase">Round {round.round_number} settings</span>
                    <h2 className="text-sm font-bold text-[#F8F5ED]">{round.title}</h2>
                  </div>
                  {!isEditingRound ? (
                    <button onClick={() => setIsEditingRound(true)} className="py-1.5 px-3 rounded-xl bg-[#141311] text-xs font-bold text-[#C9A227] border border-[#2A2824] hover:bg-[#24231F] inline-flex items-center gap-1.5 cursor-pointer">
                      <Edit2 className="w-3.5 h-3.5" />Edit settings
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => setIsEditingRound(false)} className="py-1.5 px-3 rounded-xl bg-[#141311] text-xs font-bold text-[#9E988A] border border-[#2A2824] cursor-pointer">Cancel</button>
                      <button onClick={saveRound} className="py-1.5 px-3.5 rounded-xl bg-[#C9A227] text-xs font-bold text-[#11110F] inline-flex items-center gap-1.5 cursor-pointer"><Save className="w-3.5 h-3.5" />Save</button>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  {([
                    ['duration_minutes', 'Duration (min)', 1, 240],
                    ['questions_per_attempt', 'Questions per attempt', 1, round.active_questions],
                    ['passing_score', 'Pass mark (%)', 0, 100],
                    ['weightage_percent', 'Weightage (%)', 0, 100],
                  ] as Array<[keyof typeof roundForm, string, number, number]>).map(([key, label, min, max]) => (
                    <div key={key} className="p-3 bg-[#141311] rounded-xl border border-[#2A2824] space-y-1">
                      <span className={labelCls}>{label}</span>
                      {isEditingRound ? (
                        <input type="number" min={min} max={max} value={roundForm[key]} onChange={(e) => setRoundForm({ ...roundForm, [key]: Number(e.target.value) })} className={inputCls} />
                      ) : (
                        <div className="font-bold text-[#F8F5ED]">{round[key]}</div>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-[#9E988A]">Questions per attempt cannot exceed the {round.active_questions} active questions in this round.</p>
              </div>

              {/* Question bank */}
              <div className="bg-[#1C1B18] border border-[#2A2824] rounded-2xl p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#2A2824] pb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#C9A227]" />
                    <h3 className="text-xs font-bold text-[#F8F5ED]">Question bank ({round.active_questions} active, {round.archived_questions} archived)</h3>
                  </div>
                  <button onClick={() => { setDraft(emptyDraft(round.round_type)); setDraftError(null); }} className="self-start sm:self-auto py-1.5 px-3 rounded-xl bg-[#C9A227] text-xs font-bold text-[#11110F] inline-flex items-center gap-1.5 cursor-pointer">
                    <Plus className="w-3.5 h-3.5" />Add question
                  </button>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 text-xs">
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className={`${inputCls} sm:w-36`}>
                    <option value="Active">Active</option>
                    <option value="Archived">Archived</option>
                    <option value="All">All</option>
                  </select>
                  <select value={difficultyFilter} onChange={(e) => setDifficultyFilter(e.target.value)} className={`${inputCls} sm:w-36`}>
                    <option value="">Any difficulty</option>
                    {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <div className="flex items-center gap-2 flex-1">
                    <Search className="w-4 h-4 text-[#9E988A] shrink-0" />
                    <input value={textFilter} onChange={(e) => setTextFilter(e.target.value)} placeholder="Search title or text" className={inputCls} />
                  </div>
                </div>
                <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                  {filteredQuestions.map((q) => (
                    <div key={q.id} className={`p-3 bg-[#141311] rounded-xl border space-y-1 text-xs ${q.status === 'Archived' ? 'border-[#2A2824] opacity-60' : 'border-[#2A2824]'}`}>
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-[#F8F5ED]">{q.title}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button onClick={() => { setDraft(draftFrom(q)); setDraftError(null); }} className="p-1 rounded hover:bg-[#24231F] text-[#C9A227] cursor-pointer" title="Edit"><Edit2 className="w-3.5 h-3.5" /></button>
                          {q.status === 'Active' ? (
                            <button onClick={() => setQuestionStatus(q, 'Archived')} className="p-1 rounded hover:bg-[#24231F] text-[#9E988A] cursor-pointer" title="Archive"><Archive className="w-3.5 h-3.5" /></button>
                          ) : (
                            <button onClick={() => setQuestionStatus(q, 'Active')} className="p-1 rounded hover:bg-[#24231F] text-emerald-300 cursor-pointer" title="Restore"><RotateCcw className="w-3.5 h-3.5" /></button>
                          )}
                        </div>
                      </div>
                      <div className="text-[10px] text-[#9E988A]">
                        {q.question_type} · {q.difficulty} · {q.marks} marks · v{q.version}{q.status === 'Archived' ? ' · archived' : ''}
                      </div>
                      <p className="text-[11px] text-[#9E988A] line-clamp-2 whitespace-pre-line">{q.candidate_content}</p>
                      {q.correct_answer && q.question_type === 'mcq' && (
                        <div className="text-[10px] text-emerald-300">Answer: <span className="font-bold">{q.correct_answer}</span></div>
                      )}
                    </div>
                  ))}
                  {filteredQuestions.length === 0 && <div className="p-6 text-center text-xs text-[#9E988A]">No questions match these filters.</div>}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Question editor */}
      {draft && round && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-start sm:items-center justify-center p-3 overflow-y-auto">
          <div className="bg-[#1C1B18] border border-[#2A2824] rounded-2xl w-full max-w-3xl p-5 space-y-4 my-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[10px] font-mono text-[#C9A227] uppercase">R{round.round_number}: {round.title}</div>
                <h3 className="text-sm font-bold text-[#F8F5ED]">{draft.id ? 'Edit question' : 'New question'}</h3>
              </div>
              <button onClick={() => setDraft(null)} className="p-1.5 rounded-lg hover:bg-[#24231F] cursor-pointer"><X className="w-4 h-4" /></button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <label className="space-y-1"><span className={labelCls}>Type</span>
                <select value={draft.question_type} onChange={(e) => setDraft({ ...draft, question_type: e.target.value })} className={inputCls}>
                  {Array.from(new Set([draft.question_type, ...QUESTION_TYPES])).map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>
              <label className="space-y-1"><span className={labelCls}>Difficulty</span>
                <select value={draft.difficulty} onChange={(e) => setDraft({ ...draft, difficulty: e.target.value })} className={inputCls}>
                  {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </label>
              <label className="space-y-1"><span className={labelCls}>Marks</span>
                <input type="number" min={0.5} step={0.5} value={draft.marks} onChange={(e) => setDraft({ ...draft, marks: Number(e.target.value) })} className={inputCls} />
              </label>
              <label className="space-y-1"><span className={labelCls}>Time hint (s)</span>
                <input type="number" min={10} value={draft.time_limit_seconds} onChange={(e) => setDraft({ ...draft, time_limit_seconds: Number(e.target.value) })} className={inputCls} />
              </label>
            </div>

            <label className="block space-y-1"><span className={labelCls}>Title</span>
              <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className={inputCls} />
            </label>
            <label className="block space-y-1"><span className={labelCls}>{draft.question_type === 'debugging' ? 'Problem statement (what the program should do)' : 'Question text shown to candidates'}</span>
              <textarea rows={4} value={draft.candidate_content} onChange={(e) => setDraft({ ...draft, candidate_content: e.target.value })} className={`${inputCls} font-mono`} />
            </label>
            <label className="block space-y-1"><span className={labelCls}>Competency</span>
              <select value={draft.competency_id} onChange={(e) => setDraft({ ...draft, competency_id: e.target.value === '' ? '' : Number(e.target.value) })} className={inputCls}>
                <option value="">None</option>
                {competencies.map((c) => <option key={c.id} value={c.id}>{c.code}: {c.name}</option>)}
              </select>
            </label>

            {(draft.question_type === 'mcq' || draft.question_type === 'scenario') && (
              <div className="space-y-2">
                <span className={labelCls}>Options</span>
                {draft.options.map((o, i) => (
                  <div key={i} className="flex gap-2">
                    <input value={o} onChange={(e) => { const opts = [...draft.options]; opts[i] = e.target.value; setDraft({ ...draft, options: opts }); }} placeholder={`Option ${String.fromCharCode(65 + i)}`} className={inputCls} />
                    {draft.options.length > 2 && (
                      <button onClick={() => setDraft({ ...draft, options: draft.options.filter((_, j) => j !== i) })} className="px-2 rounded-lg bg-[#141311] border border-[#2A2824] text-[#9E988A] cursor-pointer"><X className="w-3.5 h-3.5" /></button>
                    )}
                  </div>
                ))}
                {draft.options.length < 6 && (
                  <button onClick={() => setDraft({ ...draft, options: [...draft.options, ''] })} className="text-xs text-[#C9A227] cursor-pointer">+ Add option</button>
                )}
                <label className="block space-y-1"><span className={labelCls}>Correct answer</span>
                  <select value={draft.correct_answer} onChange={(e) => setDraft({ ...draft, correct_answer: e.target.value })} className={inputCls}>
                    <option value="">Select the correct option</option>
                    {optionList.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </label>
              </div>
            )}

            {draft.question_type === 'coding' && (
              <div className="space-y-3">
                <label className="block space-y-1"><span className={labelCls}>Reference solution (grader-only, never shown)</span>
                  <textarea rows={8} value={draft.reference_solution} onChange={(e) => setDraft({ ...draft, reference_solution: e.target.value })} className={`${inputCls} font-mono`} />
                </label>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className={labelCls}>Starter code shown to candidates</span>
                    <button onClick={generateStarter} className="text-[11px] text-[#C9A227] inline-flex items-center gap-1 cursor-pointer"><Wand2 className="w-3 h-3" />Generate from solution</button>
                  </div>
                  <textarea rows={6} value={draft.candidate_code_template} onChange={(e) => setDraft({ ...draft, candidate_code_template: e.target.value })} placeholder="Leave empty to generate a skeleton automatically" className={`${inputCls} font-mono`} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="space-y-1"><span className={labelCls}>Public test cases (JSON)</span>
                    <textarea rows={5} value={draft.public_tests} onChange={(e) => setDraft({ ...draft, public_tests: e.target.value })} className={`${inputCls} font-mono`} />
                  </label>
                  <label className="space-y-1"><span className={labelCls}>Hidden test cases (JSON)</span>
                    <textarea rows={5} value={draft.hidden_tests} onChange={(e) => setDraft({ ...draft, hidden_tests: e.target.value })} className={`${inputCls} font-mono`} />
                  </label>
                </div>
              </div>
            )}

            {draft.question_type === 'debugging' && (
              <div className="space-y-3">
                <label className="block space-y-1"><span className={labelCls}>Buggy code given to candidates</span>
                  <textarea rows={8} value={draft.candidate_code_template} onChange={(e) => setDraft({ ...draft, candidate_code_template: e.target.value })} className={`${inputCls} font-mono`} />
                </label>
                <label className="block space-y-1"><span className={labelCls}>Known defect & expected fix (grader-only, never shown)</span>
                  <textarea rows={3} value={draft.correct_answer} onChange={(e) => setDraft({ ...draft, correct_answer: e.target.value })} className={inputCls} />
                </label>
              </div>
            )}

            {!['mcq', 'scenario', 'coding', 'debugging'].includes(draft.question_type) && (
              <label className="block space-y-1"><span className={labelCls}>Expected answer / grading rubric (grader-only)</span>
                <textarea rows={4} value={draft.correct_answer} onChange={(e) => setDraft({ ...draft, correct_answer: e.target.value })} className={inputCls} />
              </label>
            )}

            {draftError && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-200">{draftError}</div>}

            <div className="flex justify-end gap-2 text-xs">
              <button onClick={() => setDraft(null)} className="px-3 py-2 rounded-lg bg-[#141311] border border-[#2A2824] text-[#D8D2C5] cursor-pointer">Cancel</button>
              <button disabled={isSaving} onClick={saveDraft} className="px-4 py-2 rounded-lg bg-[#C9A227] text-[#11110F] font-bold disabled:opacity-50 inline-flex items-center gap-1.5 cursor-pointer">
                <Save className="w-3.5 h-3.5" />{isSaving ? 'Saving…' : draft.id ? 'Save changes' : 'Add question'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
