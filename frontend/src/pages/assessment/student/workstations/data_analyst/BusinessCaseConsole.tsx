import React, { useState, useEffect, useMemo, useRef } from 'react';
import { StartAttemptResponse, CandidateResult } from '../../../../../types/assessment';
import { TimerHeader } from '../../../../../components/assessment/TimerHeader';
import apiClient from '../../../../../api/client';
import {
  FileText,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Bookmark,
  Sparkles,
  Layers,
  Database,
  Lightbulb,
  ShieldCheck,
  TrendingUp,
  Award,
  HelpCircle,
  Clock,
  Eye,
  Edit3,
  BarChart3,
  Cpu,
  Save,
  AlertCircle
} from 'lucide-react';

interface WorkstationProps {
  attemptData: StartAttemptResponse;
  onSubmitComplete: (res: CandidateResult) => void;
}

interface StructuredSection {
  id: string;
  label: string;
  icon: any;
  placeholder: string;
  hint: string;
  minWords: number;
}

const SECTIONS: StructuredSection[] = [
  {
    id: 'executive_summary',
    label: '1. Executive Summary & Problem Framing',
    icon: Lightbulb,
    placeholder: 'Summarize the core business problem, context, primary hypothesis, and high-level analytical objective...',
    hint: 'Frame the business context clearly. Detail what metrics dropped, root causes suspected, and primary business impact.',
    minWords: 50
  },
  {
    id: 'architecture_lineage',
    label: '2. Data Architecture, Lineage & Cleaning',
    icon: Database,
    placeholder: 'Detail the data sources, ETL pipeline steps, anomaly isolation, missing data handling, and schema validation...',
    hint: 'Explain data cleaning decisions: handling nulls, outliers, data skew, join keys, and automated validation rules.',
    minWords: 60
  },
  {
    id: 'deep_dive_analysis',
    label: '3. Technical Deep-Dive & Root Cause',
    icon: Cpu,
    placeholder: 'Explain the detailed quantitative findings, statistical tests, or architectural design used to solve the problem...',
    hint: 'Provide specific technical mechanics, query logic, metric formulations (e.g. margin weighting, drift detection, windowing).',
    minWords: 60
  },
  {
    id: 'actionable_recommendations',
    label: '4. Actionable Business Recommendations',
    icon: TrendingUp,
    placeholder: 'List prioritized, high-impact recommendations with measurable KPIs, risk mitigation steps, and timeline...',
    hint: 'Give executive-ready recommendations. Prioritize by ROI and implementation effort with monitoring metrics.',
    minWords: 40
  }
];

export const BusinessCaseConsole: React.FC<WorkstationProps> = ({ attemptData, onSubmitComplete }) => {
  const questions = attemptData.questions || [];
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const currentQ = questions[currentIndex];

  const [savedAnswers, setSavedAnswers] = useState<Record<string, any>>(attemptData.saved_answers || {});
  const [reviewFlags, setReviewFlags] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<string>('executive_summary');
  const [previewMode, setPreviewMode] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [lastSavedTime, setLastSavedTime] = useState<string>('');

  // Structured response state for current question
  const [sectionResponses, setSectionResponses] = useState<Record<string, string>>({
    executive_summary: '',
    architecture_lineage: '',
    deep_dive_analysis: '',
    actionable_recommendations: ''
  });

  // Single text response for simple open-ended
  const [rawTextResponse, setRawTextResponse] = useState<string>('');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const isMcq = useMemo(() => {
    if (!currentQ) return false;
    const qType = (currentQ.question_type || '').toLowerCase();
    const opts = currentQ.options || (currentQ as any).options_json || [];
    return qType.includes('mcq') || (Array.isArray(opts) && opts.length > 0);
  }, [currentQ]);

  // Load question answer
  useEffect(() => {
    if (!currentQ) return;
    const existing = savedAnswers[currentQ.id];

    if (existing) {
      if (typeof existing === 'object' && existing !== null && !Array.isArray(existing)) {
        setSectionResponses({
          executive_summary: existing.executive_summary || '',
          architecture_lineage: existing.architecture_lineage || '',
          deep_dive_analysis: existing.deep_dive_analysis || '',
          actionable_recommendations: existing.actionable_recommendations || ''
        });
        setRawTextResponse(existing.raw_text || existing.full_response || '');
      } else if (typeof existing === 'string') {
        setRawTextResponse(existing);
        setSelectedOption(existing);
      }
    } else {
      setSectionResponses({
        executive_summary: '',
        architecture_lineage: '',
        deep_dive_analysis: '',
        actionable_recommendations: ''
      });
      setRawTextResponse('');
      setSelectedOption(null);
    }
  }, [currentIndex, currentQ?.id]);

  // Auto-compose structured payload into formatted answer
  const combinedMarkdown = useMemo(() => {
    if (isMcq) return selectedOption || '';
    if (rawTextResponse && !sectionResponses.executive_summary && !sectionResponses.architecture_lineage) {
      return rawTextResponse;
    }
    return `### 1. Executive Summary & Problem Framing\n${sectionResponses.executive_summary || '_No content provided_'}\n\n### 2. Data Architecture, Lineage & Cleaning\n${sectionResponses.architecture_lineage || '_No content provided_'}\n\n### 3. Technical Deep-Dive & Root Cause\n${sectionResponses.deep_dive_analysis || '_No content provided_'}\n\n### 4. Actionable Business Recommendations\n${sectionResponses.actionable_recommendations || '_No content provided_'}`;
  }, [sectionResponses, rawTextResponse, isMcq, selectedOption]);

  // Total word count
  const totalWords = useMemo(() => {
    const text = isMcq ? '' : combinedMarkdown;
    return text.trim().split(/\s+/).filter(Boolean).length;
  }, [combinedMarkdown, isMcq]);

  const activeSectionWordCount = useMemo(() => {
    const text = sectionResponses[activeTab] || '';
    return text.trim().split(/\s+/).filter(Boolean).length;
  }, [sectionResponses, activeTab]);

  // Handle section text change
  const handleSectionChange = (tabId: string, val: string) => {
    setSectionResponses((prev) => ({
      ...prev,
      [tabId]: val
    }));
  };

  // Save answer to backend
  const saveCurrentAnswer = async () => {
    if (!currentQ) return;
    setIsSaving(true);
    try {
      const payloadAnswer = isMcq
        ? selectedOption
        : {
            ...sectionResponses,
            full_response: combinedMarkdown,
            word_count: totalWords
          };

      const updated = {
        ...savedAnswers,
        [currentQ.id]: payloadAnswer
      };
      setSavedAnswers(updated);

      await apiClient.post(`/assessment/attempts/${attemptData.attempt_id}/save-answer`, {
        question_id: currentQ.id,
        answer: payloadAnswer
      });

      setLastSavedTime(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Failed to autosave business case answer:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle bookmark
  const toggleBookmark = (qId: string) => {
    setReviewFlags((prev) => ({ ...prev, [qId]: !prev[qId] }));
  };

  // Navigate next/prev with autosave
  const handleNavigate = async (newIdx: number) => {
    if (newIdx < 0 || newIdx >= questions.length) return;
    await saveCurrentAnswer();
    setCurrentIndex(newIdx);
  };

  // Submit complete attempt
  const handleSubmitAttempt = async () => {
    if (!window.confirm('Are you ready to submit your Business Case & Project Interview responses for AI evaluation?')) {
      return;
    }
    setIsSubmitting(true);
    try {
      await saveCurrentAnswer();
      const res = await apiClient.post<CandidateResult>(
        `/assessment/attempts/${attemptData.attempt_id}/submit`
      );
      onSubmitComplete(res.data);
    } catch (err: any) {
      console.error('Submission failed:', err);
      alert(err?.response?.data?.detail || 'Submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const answeredCount = Object.keys(savedAnswers).length;

  return (
    <div className="h-screen max-h-screen bg-[#11110F] text-[#F8F5ED] flex flex-col font-sans overflow-hidden selection:bg-[#C9A227] selection:text-[#11110F]">
      {/* Top Header */}
      <TimerHeader
        attemptData={attemptData}
        onSubmit={handleSubmitAttempt}
        isSubmitting={isSubmitting}
      />

      {/* Subheader Toolbar */}
      <div className="border-b border-[#2A2824] bg-[#1C1B18] px-6 py-2.5 flex items-center justify-between text-xs shrink-0">
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 rounded bg-[#C9A227]/10 text-[#E3C766] font-semibold border border-[#C9A227]/30 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#C9A227]" />
            Project & Business Case Studio
          </span>
          <span className="text-[#9E988A] font-medium">
            Question {currentIndex + 1} of {questions.length}
          </span>
          <span className="text-[#6B665E]">|</span>
          <span className="text-[#9E988A]">
            {answeredCount} / {questions.length} Answered
          </span>
          {lastSavedTime && (
            <span className="text-[#4ADE80] flex items-center gap-1 font-mono text-[11px]">
              <CheckCircle2 className="w-3 h-3" /> Saved at {lastSavedTime}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => toggleBookmark(String(currentQ.id))}
            className={`px-3 py-1 rounded font-medium transition-all flex items-center gap-1.5 border cursor-pointer ${
              reviewFlags[currentQ.id]
                ? 'bg-[#EAB308]/20 border-[#EAB308]/40 text-[#EAB308]'
                : 'bg-[#141311] border-[#2A2824] text-[#9E988A] hover:text-[#F8F5ED]'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            {reviewFlags[currentQ.id] ? 'Bookmarked' : 'Bookmark'}
          </button>

          <button
            onClick={saveCurrentAnswer}
            disabled={isSaving}
            className="px-3 py-1 bg-[#141311] hover:bg-[#24231F] text-[#D8D2C5] rounded border border-[#2A2824] flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            {isSaving ? 'Saving...' : 'Save Draft'}
          </button>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="flex-1 grid grid-cols-12 overflow-hidden">
        {/* Left Pane: Question Prompt & AI Rubric (5 cols) */}
        <div className="col-span-5 border-r border-[#2A2824] bg-[#1C1B18] overflow-y-auto p-6 space-y-6 flex flex-col justify-between">
          <div className="space-y-5">
            {/* Title & Badge */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-[#C9A227]/15 text-[#E3C766] border border-[#C9A227]/30">
                  {currentQ?.question_type || 'BUSINESS_CASE'}
                </span>
                <h2 className="text-base sm:text-lg font-bold text-[#F8F5ED] mt-2 leading-snug">
                  {currentQ?.title || `Question ${currentIndex + 1}`}
                </h2>
              </div>
            </div>

            {/* Prompt Dossier */}
            <div className="p-4 bg-[#141311] rounded-xl border border-[#2A2824] text-xs text-[#D8D2C5] space-y-3 leading-relaxed whitespace-pre-wrap">
              {currentQ?.content || (currentQ as any)?.candidate_content || 'No prompt provided.'}
            </div>

            {/* AI Evaluation Rubric Overview */}
            <div className="p-4 bg-[#141311] rounded-xl border border-[#2A2824] space-y-3">
              <div className="flex items-center gap-2 text-[#C9A227] font-semibold text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-[#C9A227]" />
                Gemini LLM Scoring Dimensions
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-[#1C1B18] rounded-lg border border-[#2A2824] flex items-start gap-2">
                  <Lightbulb className="w-3.5 h-3.5 text-[#C9A227] mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-[#F8F5ED]">Root Cause Logic</p>
                    <p className="text-[11px] text-[#9E988A]">Clear causal links & diagnostic rigor</p>
                  </div>
                </div>
                <div className="p-2.5 bg-[#1C1B18] rounded-lg border border-[#2A2824] flex items-start gap-2">
                  <Database className="w-3.5 h-3.5 text-[#C9A227] mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-[#F8F5ED]">Data Architecture</p>
                    <p className="text-[11px] text-[#9E988A]">ETL lineage, skew & schema health</p>
                  </div>
                </div>
                <div className="p-2.5 bg-[#1C1B18] rounded-lg border border-[#2A2824] flex items-start gap-2">
                  <Cpu className="w-3.5 h-3.5 text-[#C9A227] mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-[#F8F5ED]">Analytical Depth</p>
                    <p className="text-[11px] text-[#9E988A]">Metrics, formulas & data accuracy</p>
                  </div>
                </div>
                <div className="p-2.5 bg-[#1C1B18] rounded-lg border border-[#2A2824] flex items-start gap-2">
                  <TrendingUp className="w-3.5 h-3.5 text-[#4ADE80] mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-[#F8F5ED]">Actionability</p>
                    <p className="text-[11px] text-[#9E988A]">ROI, prioritization & KPI impact</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Question Navigator */}
          <div className="pt-4 border-t border-[#2A2824]">
            <p className="text-xs font-semibold text-[#9E988A] mb-2 font-mono uppercase tracking-wider">Question Navigator</p>
            <div className="flex flex-wrap gap-2">
              {questions.map((q, idx) => {
                const isAns = !!savedAnswers[q.id];
                const isCur = idx === currentIndex;
                const isBmk = reviewFlags[q.id];

                return (
                  <button
                    key={q.id || idx}
                    onClick={() => handleNavigate(idx)}
                    className={`w-8 h-8 rounded-lg text-xs font-mono font-bold transition-all relative cursor-pointer border ${
                      isCur
                        ? 'bg-[#C9A227] text-[#11110F] border-[#C9A227] shadow-md ring-1 ring-[#C9A227]'
                        : isAns
                        ? 'bg-[#4ADE80]/15 text-[#4ADE80] border-[#4ADE80]/30'
                        : 'bg-[#141311] text-[#9E988A] border-[#2A2824] hover:bg-[#24231F]'
                    }`}
                  >
                    {idx + 1}
                    {isBmk && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#EAB308] ring-2 ring-[#1C1B18]" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Pane: Structured Studio & Multi-Tab Editor (7 cols) */}
        <div className="col-span-7 bg-[#141311] flex flex-col justify-between overflow-hidden">
          {/* Editor Header / Tabs */}
          {!isMcq ? (
            <div className="border-b border-[#2A2824] bg-[#1C1B18] px-6 pt-3 flex items-center justify-between">
              <div className="flex items-center gap-1 overflow-x-auto">
                {SECTIONS.map((sec) => {
                  const Icon = sec.icon;
                  const isActive = activeTab === sec.id && !previewMode;
                  const count = (sectionResponses[sec.id] || '').trim().split(/\s+/).filter(Boolean).length;
                  const meetsMin = count >= sec.minWords;

                  return (
                    <button
                      key={sec.id}
                      onClick={() => {
                        setActiveTab(sec.id);
                        setPreviewMode(false);
                      }}
                      className={`px-3 py-2 text-xs font-medium rounded-t-lg transition-all flex items-center gap-2 border-t border-x cursor-pointer ${
                        isActive
                          ? 'bg-[#141311] border-[#2A2824] text-[#C9A227] shadow-sm font-bold'
                          : 'border-transparent text-[#9E988A] hover:text-[#F8F5ED] hover:bg-[#24231F]'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{sec.label.split('.')[1] || sec.label}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                          meetsMin ? 'bg-[#4ADE80]/20 text-[#4ADE80]' : 'bg-[#141311] text-[#9E988A] border border-[#2A2824]'
                        }`}
                      >
                        {count}w
                      </span>
                    </button>
                  );
                })}

                <button
                  onClick={() => setPreviewMode(true)}
                  className={`px-3 py-2 text-xs font-medium rounded-t-lg transition-all flex items-center gap-1.5 border-t border-x cursor-pointer ${
                    previewMode
                      ? 'bg-[#141311] border-[#2A2824] text-[#E3C766] shadow-sm font-bold'
                      : 'border-transparent text-[#9E988A] hover:text-[#F8F5ED] hover:bg-[#24231F]'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  Full Preview
                </button>
              </div>

              {/* Total Word Count Pill */}
              <div className="flex items-center gap-2 pb-2 text-xs">
                <span className="text-[#9E988A]">Total Words:</span>
                <span
                  className={`font-mono font-bold px-2 py-0.5 rounded ${
                    totalWords >= 180
                      ? 'bg-[#4ADE80]/20 text-[#4ADE80] border border-[#4ADE80]/30'
                      : totalWords >= 80
                      ? 'bg-[#EAB308]/20 text-[#EAB308] border border-[#EAB308]/30'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}
                >
                  {totalWords} words
                </span>
              </div>
            </div>
          ) : (
            <div className="border-b border-[#2A2824] bg-[#1C1B18] px-6 py-3 flex items-center justify-between">
              <span className="text-xs font-semibold text-[#F8F5ED]">Select Multiple Choice Answer</span>
            </div>
          )}

          {/* Active Tab Content Area */}
          <div className="flex-1 p-6 overflow-y-auto">
            {isMcq ? (
              // MCQ Options Mode
              <div className="space-y-3 max-w-2xl">
                {((currentQ?.options || (currentQ as any)?.options_json || []) as string[]).map(
                  (opt: string, idx: number) => {
                    const optKey = String.fromCharCode(65 + idx); // A, B, C, D
                    const isSelected =
                      selectedOption === optKey ||
                      selectedOption === String(idx + 1) ||
                      selectedOption === opt;

                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          setSelectedOption(optKey);
                          saveCurrentAnswer();
                        }}
                        className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-3.5 cursor-pointer ${
                          isSelected
                            ? 'bg-[#C9A227]/15 border-[#C9A227] text-[#F8F5ED] shadow-md ring-1 ring-[#C9A227]'
                            : 'bg-[#1C1B18] border-[#2A2824] text-[#D8D2C5] hover:border-[#C9A227]/40 hover:bg-[#24231F]'
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-all ${
                            isSelected
                              ? 'bg-[#C9A227] text-[#11110F]'
                              : 'bg-[#141311] text-[#9E988A] border border-[#2A2824]'
                          }`}
                        >
                          {optKey}
                        </div>
                        <div className="text-xs pt-0.5 leading-relaxed font-medium">{opt}</div>
                      </button>
                    );
                  }
                )}
              </div>
            ) : previewMode ? (
              // Full Unified Markdown Preview
              <div className="space-y-6">
                <div className="p-4 bg-[#1C1B18] border border-[#2A2824] rounded-xl flex items-center justify-between text-xs text-[#E3C766]">
                  <span className="flex items-center gap-2 font-medium">
                    <Eye className="w-4 h-4 text-[#C9A227]" />
                    Structured Response Review (Ready for AI Evaluation)
                  </span>
                  <span className="font-mono text-[#9E988A]">{totalWords} total words</span>
                </div>

                <div className="p-6 bg-[#1C1B18] border border-[#2A2824] rounded-xl space-y-6 text-xs text-[#D8D2C5] whitespace-pre-wrap leading-relaxed">
                  {SECTIONS.map((sec) => (
                    <div key={sec.id} className="space-y-2 border-b border-[#2A2824] pb-4 last:border-0 last:pb-0">
                      <h4 className="font-bold text-[#C9A227] text-xs uppercase tracking-wider">
                        {sec.label}
                      </h4>
                      <div className="text-[#D8D2C5] pl-1 font-sans">
                        {sectionResponses[sec.id] || (
                          <span className="text-[#6B665E] italic">No response drafted for this section.</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              // Active Section Editor
              <div className="h-full flex flex-col space-y-4">
                {SECTIONS.filter((s) => s.id === activeTab).map((sec) => (
                  <div key={sec.id} className="flex-1 flex flex-col space-y-3">
                    <div className="p-3 bg-[#1C1B18] border border-[#2A2824] rounded-xl text-xs text-[#D8D2C5] flex items-start gap-2.5">
                      <HelpCircle className="w-4 h-4 text-[#C9A227] shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-[#F8F5ED]">{sec.label}</p>
                        <p className="text-[#9E988A] mt-0.5">{sec.hint}</p>
                      </div>
                    </div>

                    <textarea
                      value={sectionResponses[sec.id] || ''}
                      onChange={(e) => handleSectionChange(sec.id, e.target.value)}
                      placeholder={sec.placeholder}
                      className="flex-1 w-full bg-[#1C1B18] border border-[#2A2824] rounded-xl p-4 text-xs text-[#F8F5ED] placeholder-[#6B665E] focus:outline-none focus:border-[#C9A227] focus:ring-1 focus:ring-[#C9A227] resize-none font-mono leading-relaxed transition-all"
                    />

                    <div className="flex items-center justify-between text-xs text-[#9E988A] pt-1">
                      <span>
                        Recommended length: <strong className="text-[#F8F5ED]">{sec.minWords}+ words</strong>
                      </span>
                      <span className="font-mono">
                        Section Words: <strong className="text-[#C9A227]">{activeSectionWordCount}</strong>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bottom Action Footer */}
          <div className="border-t border-[#2A2824] bg-[#1C1B18] px-6 py-3.5 flex items-center justify-between">
            <button
              onClick={() => handleNavigate(currentIndex - 1)}
              disabled={currentIndex === 0}
              className="px-4 py-2 bg-[#141311] hover:bg-[#24231F] disabled:opacity-40 text-[#D8D2C5] rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-[#2A2824] transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-4 h-4" />
              Previous Question
            </button>

            <div className="flex items-center gap-3">
              {currentIndex < questions.length - 1 ? (
                <button
                  onClick={() => handleNavigate(currentIndex + 1)}
                  className="px-5 py-2 bg-[#C9A227] hover:bg-[#B89220] text-[#11110F] font-bold rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-md shadow-[#C9A227]/20 cursor-pointer"
                >
                  Next Question
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmitAttempt}
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-[#C9A227] hover:bg-[#B89220] text-[#11110F] rounded-lg text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-[#C9A227]/20 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isSubmitting ? 'Evaluating with Gemini...' : 'Submit Assessment'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
