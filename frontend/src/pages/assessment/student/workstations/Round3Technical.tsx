import React, { useState, useEffect, useMemo, useRef } from 'react';
import { StartAttemptResponse, CandidateResult, CandidateQuestion } from '../../../../types/assessment';
import { TimerHeader } from '../../../../components/assessment/TimerHeader';
import apiClient from '../../../../api/client';
import {
  Layers,
  Database,
  Cpu,
  Globe,
  ShieldCheck,
  GitBranch,
  Code2,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Send,
  HelpCircle,
  AlertCircle,
  Filter
} from 'lucide-react';

interface WorkstationProps {
  attemptData: StartAttemptResponse;
  onSubmitComplete: (res: CandidateResult) => void;
}

export const Round3Technical: React.FC<WorkstationProps> = ({
  attemptData,
  onSubmitComplete
}) => {
  const questions: CandidateQuestion[] = attemptData.questions || [];
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [bookmarked, setBookmarked] = useState<Record<string, boolean>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<string>('Saved');
  const debounceRef = useRef<any>(null);

  // Initialize saved answers
  useEffect(() => {
    if (attemptData.saved_answers) {
      const initial: Record<string, string> = {};
      Object.entries(attemptData.saved_answers).forEach(([k, v]) => {
        initial[String(k)] = typeof v === 'object' ? JSON.stringify(v) : String(v);
      });
      setAnswers(initial);
    }
  }, [attemptData]);

  const currentQ = questions[currentIndex];

  // Helper to categorize questions based on title / content / competency
  const getCategory = (q: CandidateQuestion): string => {
    const text = `${q.title} ${q.content} ${q.competency_name || ''} ${q.competency_code || ''}`.toLowerCase();
    if (text.includes('dbms') || text.includes('index') || text.includes('wal') || text.includes('isolation') || text.includes('sql') || text.includes('database') || text.includes('pool')) {
      return 'DBMS';
    }
    if (text.includes('os') || text.includes('thread') || text.includes('mutex') || text.includes('semaphore') || text.includes('tlb') || text.includes('context switch') || text.includes('deadlock') || text.includes('cas')) {
      return 'OS';
    }
    if (text.includes('tls') || text.includes('tcp') || text.includes('cors') || text.includes('dns') || text.includes('http') || text.includes('network') || text.includes('udp') || text.includes('quic')) {
      return 'NETWORKS';
    }
    if (text.includes('solid') || text.includes('liskov') || text.includes('factory') || text.includes('observer') || text.includes('dependency injection') || text.includes('circuit breaker') || text.includes('oop') || text.includes('cache-aside')) {
      return 'OOP_ARCH';
    }
    if (text.includes('jwt') || text.includes('injection') || text.includes('csrf') || text.includes('rate limit') || text.includes('security') || text.includes('idempotent')) {
      return 'SECURITY';
    }
    if (text.includes('git') || text.includes('merge') || text.includes('branch')) {
      return 'GIT';
    }
    return 'CORE_CS';
  };

  const filteredQuestionIndices = useMemo(() => {
    if (selectedCategory === 'ALL') {
      return questions.map((_, i) => i);
    }
    return questions
      .map((q, i) => (getCategory(q) === selectedCategory ? i : -1))
      .filter((i) => i !== -1);
  }, [questions, selectedCategory]);

  const handleSelectOption = (optionId: string | number) => {
    if (!currentQ) return;
    const strVal = String(optionId);
    setAnswers((prev) => ({ ...prev, [String(currentQ.id)]: strVal }));
    setSaveStatus('Saving...');

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        await apiClient.post('/assessment/attempts/save-response', {
          attempt_id: attemptData.attempt_id,
          question_id: currentQ.id,
          response_payload: strVal,
          is_marked_for_review: Boolean(bookmarked[String(currentQ.id)])
        });
        setSaveStatus('Saved');
      } catch (err) {
        console.error('Failed to save answer:', err);
        setSaveStatus('Offline (will retry)');
      }
    }, 400);
  };

  const toggleBookmark = (qId: number) => {
    setBookmarked((prev) => ({ ...prev, [String(qId)]: !prev[String(qId)] }));
  };

  const handleSubmit = async (isManual = false) => {
    if (isManual) {
      const answeredCount = Object.keys(answers).length;
      if (!confirm(`You have answered ${answeredCount} of ${questions.length} questions. Are you sure you want to submit your Technical Knowledge assessment?`)) {
        return;
      }
    }
    setIsSubmitting(true);
    try {
      const res = await apiClient.post('/assessment/attempts/submit', {
        attempt_id: attemptData.attempt_id
      });
      onSubmitComplete(res.data);
    } catch (err: any) {
      console.error('Submit failed', err);
      alert(err.response?.data?.detail || 'Submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const parsedOptions = useMemo(() => {
    if (!currentQ?.options) return [];
    let opts = currentQ.options;
    if (typeof opts === 'string') {
      try {
        opts = JSON.parse(opts);
      } catch {
        opts = [];
      }
    }
    if (!Array.isArray(opts)) return [];
    return opts.map((opt: any, idx: number) => {
      if (typeof opt === 'object' && opt !== null) {
        return {
          id: opt.id !== undefined ? String(opt.id) : String(idx + 1),
          text: opt.text || opt.label || opt.content || String(opt)
        };
      }
      return { id: String(idx + 1), text: String(opt) };
    });
  }, [currentQ]);

  const answeredCount = Object.keys(answers).length;
  const currentAnswer = currentQ ? answers[String(currentQ.id)] : undefined;
  const isCurrentBookmarked = currentQ ? Boolean(bookmarked[String(currentQ.id)]) : false;

  return (
    <div className="h-screen max-h-screen bg-[#11110F] text-[#F8F5ED] flex flex-col overflow-hidden selection:bg-[#C9A227] selection:text-[#11110F]">
      {/* Top Header */}
      <TimerHeader
        attemptData={attemptData}
        onSubmit={() => handleSubmit(true)}
        isSubmitting={isSubmitting}
        saveStatus={saveStatus}
      />

      {/* Secondary Bar: Category Filter Chips & Progress */}
      <div className="shrink-0 bg-[#1C1B18] border-b border-[#2A2824] px-6 py-2 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 scrollbar-thin">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#9E988A] mr-2 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-[#C9A227]" /> Domains:
          </span>
          {[
            { id: 'ALL', label: 'All Topics', icon: Layers },
            { id: 'DBMS', label: 'DBMS & Storage', icon: Database },
            { id: 'OS', label: 'OS & Concurrency', icon: Cpu },
            { id: 'NETWORKS', label: 'Networks & Web', icon: Globe },
            { id: 'OOP_ARCH', label: 'OOP & Architecture', icon: Code2 },
            { id: 'SECURITY', label: 'Security & REST', icon: ShieldCheck },
            { id: 'GIT', label: 'Git & Devops', icon: GitBranch }
          ].map((cat) => {
            const Icon = cat.icon;
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#C9A227] text-[#11110F] font-bold shadow-md shadow-[#C9A227]/20'
                    : 'bg-[#141311] border border-[#2A2824] text-[#D8D2C5] hover:bg-[#24231F] hover:text-[#F8F5ED]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#11110F]' : 'text-[#C9A227]'}`} />
                {cat.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 text-xs text-[#D8D2C5]">
          <div className="flex items-center gap-1.5 bg-[#141311] px-3 py-1 rounded-full border border-[#2A2824] font-mono">
            <span className="text-[#C9A227] font-bold">{answeredCount}</span> / {questions.length} Answered
          </div>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden min-h-0">
        {/* Left Side: Question Pane (Flex with pinned bottom navigation) */}
        <div className="lg:col-span-8 xl:col-span-9 flex flex-col h-full overflow-hidden min-h-0 border-r border-[#2A2824]">
          {/* Scrollable Question Content */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
            {currentQ ? (
              <div className="max-w-4xl mx-auto w-full space-y-4">
                {/* Question Meta Badge */}
                <div className="flex items-center justify-between gap-4 pb-3 border-b border-[#2A2824]">
                  <div className="flex items-center gap-2">
                    <span className="bg-[#C9A227]/10 text-[#E3C766] border border-[#C9A227]/25 px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider">
                      Question {currentIndex + 1} of {questions.length}
                    </span>
                    <span className="bg-[#141311] text-[#D8D2C5] border border-[#2A2824] px-2 py-0.5 rounded-md text-xs font-medium">
                      {getCategory(currentQ)}
                    </span>
                    <span className="bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20 px-2 py-0.5 rounded-md text-xs font-medium">
                      +{currentQ.marks || 2} Marks
                    </span>
                  </div>

                  <button
                    onClick={() => toggleBookmark(currentQ.id)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
                      isCurrentBookmarked
                        ? 'bg-[#EAB308]/15 text-[#EAB308] border-[#EAB308]/40'
                        : 'bg-[#141311] text-[#9E988A] border-[#2A2824] hover:text-[#F8F5ED]'
                    }`}
                  >
                    {isCurrentBookmarked ? (
                      <>
                        <BookmarkCheck className="w-3.5 h-3.5 text-[#EAB308]" /> Flagged for Review
                      </>
                    ) : (
                      <>
                        <Bookmark className="w-3.5 h-3.5" /> Flag for Review
                      </>
                    )}
                  </button>
                </div>

                {/* Title & Prompt */}
                <div className="space-y-2">
                  <h2 className="text-base md:text-lg font-bold text-[#F8F5ED] tracking-tight">
                    {currentQ.title}
                  </h2>
                  <div className="text-[#D8D2C5] text-xs md:text-sm leading-relaxed bg-[#141311] border border-[#2A2824] p-3.5 md:p-4 rounded-xl shadow-inner font-normal">
                    <p className="whitespace-pre-line">{currentQ.content}</p>
                  </div>
                </div>

                {/* Options Grid — Compact 2-column on desktop, 1-column on mobile */}
                <div className="space-y-2 pt-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9E988A]">
                    Select the correct option:
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {parsedOptions.map((opt, idx) => {
                      const isSelected = currentAnswer === opt.id;
                      const letterKey = String.fromCharCode(65 + idx);
                      return (
                        <button
                          key={opt.id}
                          onClick={() => handleSelectOption(opt.id)}
                          className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3 group cursor-pointer ${
                            isSelected
                              ? 'bg-[#C9A227]/15 border-[#C9A227] text-[#F8F5ED] shadow-md shadow-[#C9A227]/10 ring-1 ring-[#C9A227]'
                              : 'bg-[#141311] border-[#2A2824] hover:border-[#C9A227]/40 hover:bg-[#1C1B18] text-[#D8D2C5]'
                          }`}
                        >
                          <div
                            className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 transition-all border ${
                              isSelected
                                ? 'bg-[#C9A227] text-[#11110F] border-[#C9A227]'
                                : 'bg-[#1C1B18] text-[#9E988A] border-[#2A2824] group-hover:text-[#F8F5ED] group-hover:border-[#C9A227]/40'
                            }`}
                          >
                            {letterKey}
                          </div>
                          <div className="flex-1 text-xs sm:text-sm font-mono leading-relaxed pt-0.5 break-words text-[#F8F5ED]">
                            {opt.text}
                          </div>
                          {isSelected && (
                            <CheckCircle2 className="w-4 h-4 text-[#C9A227] flex-shrink-0 mt-0.5" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-20 text-[#9E988A]">No question selected.</div>
            )}
          </div>

          {/* Pinned Bottom Nav Bar — Always visible within the window */}
          <div className="shrink-0 bg-[#1C1B18] border-t border-[#2A2824] px-6 py-3 flex items-center justify-between">
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="px-4 py-2 rounded-xl bg-[#141311] hover:bg-[#24231F] text-[#D8D2C5] hover:text-[#F8F5ED] border border-[#2A2824] text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>

            <span className="text-xs text-[#9E988A] font-mono">
              Question {currentIndex + 1} of {questions.length}
            </span>

            <button
              onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
              disabled={currentIndex === questions.length - 1}
              className="px-5 py-2 rounded-xl bg-[#C9A227] hover:bg-[#B89220] text-[#11110F] text-xs font-bold shadow-md shadow-[#C9A227]/15 flex items-center gap-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Side: Question Navigator Grid */}
        <div className="lg:col-span-4 xl:col-span-3 bg-[#181714] p-4 md:p-5 flex flex-col justify-between overflow-y-auto min-h-0 border-l border-[#2A2824]">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-[#F8F5ED] tracking-wide uppercase flex items-center gap-2">
                <Code2 className="w-4 h-4 text-[#C9A227]" /> Question Navigator
              </h3>
              <p className="text-xs text-[#9E988A] mt-1 font-mono">
                {selectedCategory === 'ALL'
                  ? `Showing all ${questions.length} questions`
                  : `Filtered by: ${selectedCategory}`}
              </p>
            </div>

            {/* Quick Status Legend */}
            <div className="grid grid-cols-3 gap-2 text-[11px] text-[#9E988A] pb-2 border-b border-[#2A2824]">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-[#10B981]" /> Answered
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-[#EAB308]" /> Flagged
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-[#141311] border border-[#2A2824]" /> Unread
              </div>
            </div>

            {/* Questions Grid */}
            <div className="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const isAnswered = answers[String(q.id)] !== undefined;
                const isFlagged = Boolean(bookmarked[String(q.id)]);
                const isCurrent = currentIndex === idx;
                const isFilteredOut =
                  selectedCategory !== 'ALL' && getCategory(q) !== selectedCategory;

                let btnBg = 'bg-[#141311] text-[#9E988A] border-[#2A2824] hover:bg-[#24231F] hover:text-[#F8F5ED]';
                if (isAnswered) {
                  btnBg = 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/40 font-bold';
                }
                if (isFlagged) {
                  btnBg = 'bg-[#EAB308]/15 text-[#EAB308] border-[#EAB308]/50 font-bold';
                }
                if (isCurrent) {
                  btnBg += ' ring-2 ring-[#C9A227] ring-offset-2 ring-offset-[#11110F] scale-105';
                }
                if (isFilteredOut) {
                  btnBg += ' opacity-25';
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-10 rounded-xl text-xs font-mono border flex items-center justify-center relative transition-all cursor-pointer ${btnBg}`}
                  >
                    {idx + 1}
                    {isFlagged && (
                      <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#EAB308] rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Summary Card */}
          <div className="mt-6 bg-[#1C1B18] border border-[#2A2824] p-4 rounded-xl space-y-3">
            <div className="flex justify-between text-xs text-[#9E988A]">
              <span>Overall Progress:</span>
              <span className="font-bold text-[#F8F5ED]">
                {Math.round((answeredCount / questions.length) * 100)}%
              </span>
            </div>
            <div className="w-full bg-[#141311] h-2 rounded-full overflow-hidden border border-[#2A2824]">
              <div
                className="bg-gradient-to-r from-[#C9A227] to-[#E3C766] h-full transition-all duration-300"
                style={{ width: `${(answeredCount / questions.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
