import React, { useState, useEffect, useRef, useMemo } from 'react';
import { StartAttemptResponse, CandidateResult } from '../../../../../types/assessment';
import { TimerHeader } from '../../../../../components/assessment/TimerHeader';
import apiClient from '../../../../../api/client';
import {
  Keyboard,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Bookmark,
  Sparkles,
  Timer,
  Gauge,
  Target,
  AlertTriangle,
  FileText,
  MessageSquare,
  Zap,
  RotateCcw
} from 'lucide-react';

interface WorkstationProps {
  attemptData: StartAttemptResponse;
  onSubmitComplete: (res: CandidateResult) => void;
}

export const ChatRound1Communication: React.FC<WorkstationProps> = ({ attemptData, onSubmitComplete }) => {
  const questions = attemptData.questions || [];
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const currentQ = questions[currentIndex];

  const [savedAnswers, setSavedAnswers] = useState<Record<string, any>>(attemptData.saved_answers || {});
  const [reviewFlags, setReviewFlags] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // --- Real-Time Typing State for Typing Test Question ---
  const [typedText, setTypedText] = useState<string>('');
  const [typingStartTime, setTypingStartTime] = useState<number | null>(null);
  const [elapsedTypingSeconds, setElapsedTypingSeconds] = useState<number>(0);
  const [isTypingActive, setIsTypingActive] = useState<boolean>(false);
  const typingInputRef = useRef<HTMLTextAreaElement | null>(null);

  // Determine if current question is a Typing Test vs MCQ
  const isTypingTest = useMemo(() => {
    if (!currentQ) return false;
    const qType = (currentQ.question_type || '').toLowerCase();
    if (qType.includes('typing')) return true;
    const rawOpts = currentQ.options || (currentQ as any).options_json || [];
    return Array.isArray(rawOpts) && rawOpts.length === 0;
  }, [currentQ]);

  // Retrieve passage for typing test
  const samplePassage = useMemo(() => {
    if (!currentQ) return '';
    return (currentQ.content || (currentQ as any).candidate_content || '').trim();
  }, [currentQ]);

  // Load saved answer when switching questions
  useEffect(() => {
    if (!currentQ) return;
    const saved = savedAnswers[currentQ.id];

    if (isTypingTest) {
      if (saved) {
        if (typeof saved === 'string' && saved.startsWith('{')) {
          try {
            const parsed = JSON.parse(saved);
            setTypedText(parsed.text || '');
          } catch {
            setTypedText(saved);
          }
        } else {
          setTypedText(String(saved));
        }
      } else {
        setTypedText('');
      }
      setTypingStartTime(null);
      setElapsedTypingSeconds(0);
      setIsTypingActive(false);
    }
  }, [currentIndex, isTypingTest]);

  // Typing timer loop
  useEffect(() => {
    let interval: any = null;
    if (isTypingActive && typingStartTime) {
      interval = setInterval(() => {
        const secs = Math.max(1, Math.floor((Date.now() - typingStartTime) / 1000));
        setElapsedTypingSeconds(secs);
      }, 500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTypingActive, typingStartTime]);

  // Calculate live typing metrics
  const typingMetrics = useMemo(() => {
    if (!isTypingTest || !samplePassage) {
      return { wpm: 0, grossWpm: 0, accuracy: 100, correctChars: 0, errorChars: 0, progressPct: 0 };
    }

    let correctChars = 0;
    let errorChars = 0;

    for (let i = 0; i < typedText.length; i++) {
      if (i < samplePassage.length) {
        if (typedText[i] === samplePassage[i]) {
          correctChars++;
        } else {
          errorChars++;
        }
      } else {
        errorChars++;
      }
    }

    const effectiveMinutes = Math.max(0.016, elapsedTypingSeconds / 60);
    const netWords = correctChars / 5;
    const grossWords = typedText.length / 5;

    const wpm = Math.max(0, Math.round(netWords / effectiveMinutes));
    const grossWpm = Math.max(0, Math.round(grossWords / effectiveMinutes));
    const accuracy = typedText.length > 0
      ? Math.max(0, Math.min(100, Math.round((correctChars / typedText.length) * 100)))
      : 100;

    const progressPct = Math.min(100, Math.round((typedText.length / Math.max(1, samplePassage.length)) * 100));

    return { wpm, grossWpm, accuracy, correctChars, errorChars, progressPct };
  }, [isTypingTest, samplePassage, typedText, elapsedTypingSeconds]);

  // Handle typing input change
  const handleTypingChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    if (typingStartTime === null && val.length > 0) {
      setTypingStartTime(Date.now());
      setIsTypingActive(true);
    }

    // Cap typed length to passage length + 20
    if (val.length <= samplePassage.length + 20) {
      setTypedText(val);
    }

    if (val.length >= samplePassage.length) {
      setIsTypingActive(false);
    }
  };

  // Reset typing test
  const handleResetTyping = () => {
    setTypedText('');
    setTypingStartTime(null);
    setElapsedTypingSeconds(0);
    setIsTypingActive(false);
    if (typingInputRef.current) {
      typingInputRef.current.focus();
    }
  };

  // Option selection handler for MCQs
  const handleSelectOption = async (optionValue: string) => {
    if (!currentQ) return;
    const newAnswers = { ...savedAnswers, [currentQ.id]: optionValue };
    setSavedAnswers(newAnswers);

    try {
      await apiClient.post('/assessment/attempts/save-response', {
        attempt_id: attemptData.attempt_id,
        question_id: currentQ.id,
        response_payload: optionValue,
        is_marked_for_review: !!reviewFlags[currentQ.id]
      });
    } catch (err) {
      console.error('Failed to autosave option selection', err);
    }
  };

  // Save typing payload when navigating away or clicking Next
  const handleSaveTypingResponse = async () => {
    if (!currentQ || !isTypingTest) return;
    const payload = JSON.stringify({
      text: typedText,
      wpm: typingMetrics.wpm,
      accuracy: typingMetrics.accuracy,
      elapsed_seconds: elapsedTypingSeconds
    });

    const newAnswers = { ...savedAnswers, [currentQ.id]: payload };
    setSavedAnswers(newAnswers);

    try {
      await apiClient.post('/assessment/attempts/save-response', {
        attempt_id: attemptData.attempt_id,
        question_id: currentQ.id,
        response_payload: payload,
        is_marked_for_review: !!reviewFlags[currentQ.id]
      });
    } catch (err) {
      console.error('Failed to autosave typing response', err);
    }
  };

  const handleNext = async () => {
    if (isTypingTest) {
      await handleSaveTypingResponse();
    }
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = async () => {
    if (isTypingTest) {
      await handleSaveTypingResponse();
    }
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSelectQuestionFromPalette = async (idx: number) => {
    if (isTypingTest) {
      await handleSaveTypingResponse();
    }
    setCurrentIndex(idx);
  };

  const toggleReviewFlag = () => {
    if (!currentQ) return;
    setReviewFlags((prev) => ({ ...prev, [currentQ.id]: !prev[currentQ.id] }));
  };

  // Submit assessment handler
  const performSubmit = async (isManual = false) => {
    if (isManual) {
      if (!confirm('Are you sure you want to submit Round 1: Written Communication & Typing? Answers cannot be modified once submitted.')) {
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (isTypingTest && currentQ) {
        await handleSaveTypingResponse();
      }

      const res = await apiClient.post('/assessment/attempts/submit', {
        attempt_id: attemptData.attempt_id
      });
      onSubmitComplete(res.data);
    } catch (err: any) {
      console.error('Failed to submit attempt', err);
      if (isManual) {
        alert(err.response?.data?.detail || 'Failed to submit assessment.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Normalized options for MCQ mode
  const normalizedOptions = useMemo(() => {
    if (!currentQ || isTypingTest) return [];
    const rawOpts = currentQ.options || (currentQ as any).options_json || [];

    if (!Array.isArray(rawOpts)) return [];

    return rawOpts.map((opt: any, idx: number) => {
      const letterKey = String.fromCharCode(65 + idx); // 'A', 'B', 'C', 'D'
      if (typeof opt === 'string' || typeof opt === 'number') {
        const strVal = String(opt);
        return {
          key: letterKey,
          value: strVal,
          text: strVal,
          id: idx + 1
        };
      } else if (typeof opt === 'object' && opt !== null) {
        const idVal = opt.id !== undefined ? String(opt.id) : String(idx + 1);
        const textVal = opt.text !== undefined ? String(opt.text) : (opt.value !== undefined ? String(opt.value) : (opt.label || ''));
        const keyVal = opt.key || letterKey;
        return {
          key: keyVal,
          value: idVal,
          text: textVal,
          id: opt.id || (idx + 1)
        };
      }
      return { key: letterKey, value: String(opt), text: String(opt), id: idx + 1 };
    });
  }, [currentQ, isTypingTest]);

  // Section categorization
  const sectionLabel = useMemo(() => {
    if (isTypingTest) {
      return { title: 'Part C: Real-Time Typing Speed Benchmark', badge: 'Typing Test', color: 'text-[#4ADE80] bg-[#4ADE80]/10 border-[#4ADE80]/30' };
    }
    if (currentIndex >= 20) {
      return { title: 'Part B: Support Tone & Conflict Rewriting', badge: 'Tone Correction', color: 'text-[#38BDF8] bg-[#38BDF8]/10 border-[#38BDF8]/30' };
    }
    return { title: 'Part A: Grammar, Vocabulary & Business Syntax', badge: 'Communication MCQ', color: 'text-[#E3C766] bg-[#C9A227]/10 border-[#C9A227]/30' };
  }, [currentIndex, isTypingTest]);

  if (!currentQ) {
    return <div className="p-8 text-center text-xs font-mono text-[#9E988A]">No questions available.</div>;
  }

  return (
    <div className="flex-1 w-full flex flex-col bg-[#11110F] text-[#F8F5ED] font-sans min-h-screen">
      {/* Header Bar */}
      <TimerHeader
        attemptData={attemptData}
        onSubmit={() => performSubmit(true)}
        isSubmitting={isSubmitting}
      />

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Area: Question / Workstation Area */}
        <div className="lg:col-span-8 flex flex-col space-y-4">
          <div className="bg-[#1C1B18] border border-[#2A2824] rounded-3xl p-5 sm:p-7 shadow-2xl flex flex-col justify-between space-y-6">
            
            {/* Top Row: Section Badge & Review Toggle */}
            <div className="flex items-center justify-between border-b border-[#2A2824] pb-4">
              <div className="flex items-center space-x-2.5">
                <span className={`text-xs font-mono font-bold px-3 py-1 rounded-xl border ${sectionLabel.color}`}>
                  Task {currentIndex + 1} of {questions.length} • {sectionLabel.badge}
                </span>
                {currentQ.competency_name && (
                  <span className="text-[11px] font-mono text-[#9E988A] bg-[#141311] px-2.5 py-1 rounded-xl border border-[#2A2824]">
                    {currentQ.competency_name}
                  </span>
                )}
              </div>

              <button
                onClick={toggleReviewFlag}
                className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-mono border transition cursor-pointer ${
                  reviewFlags[currentQ.id]
                    ? 'bg-[#EAB308]/15 border-[#EAB308] text-[#EAB308]'
                    : 'bg-[#141311] border-[#2A2824] text-[#9E988A] hover:text-[#F8F5ED]'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>{reviewFlags[currentQ.id] ? 'Flagged for Review' : 'Mark for Review'}</span>
              </button>
            </div>

            {/* --- MODE A: MCQ / TONE REWRITING --- */}
            {!isTypingTest && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#C9A227] font-semibold">
                    {sectionLabel.title}
                  </span>
                  <h2 className="text-base sm:text-lg font-bold text-[#F8F5ED] leading-snug">
                    {currentQ.title}
                  </h2>
                </div>

                <div className="text-xs sm:text-sm text-[#D8D2C5] whitespace-pre-wrap leading-relaxed bg-[#141311] p-4 sm:p-5 rounded-2xl border border-[#2A2824]">
                  {currentQ.content || (currentQ as any).candidate_content}
                </div>

                {/* Options List */}
                <div className="space-y-3 pt-2">
                  {normalizedOptions.map((opt) => {
                    const currentAnswer = savedAnswers[currentQ.id];
                    const isSelected =
                      currentAnswer === opt.value ||
                      currentAnswer === opt.key ||
                      currentAnswer === opt.text ||
                      currentAnswer === String(opt.id);

                    return (
                      <button
                        key={opt.key}
                        onClick={() => handleSelectOption(String(opt.id || opt.value))}
                        className={`w-full text-left p-4 rounded-2xl border text-xs sm:text-sm font-medium transition flex items-start space-x-3.5 cursor-pointer ${
                          isSelected
                            ? 'bg-[#C9A227]/10 border-[#C9A227] text-[#F8F5ED] shadow-lg ring-1 ring-[#C9A227]'
                            : 'bg-[#141311] border-[#2A2824] text-[#D8D2C5] hover:border-[#C9A227]/40 hover:bg-[#24231F]'
                        }`}
                      >
                        <span
                          className={`w-7 h-7 rounded-xl flex items-center justify-center font-mono text-xs font-bold shrink-0 border ${
                            isSelected
                              ? 'bg-[#C9A227] text-[#11110F] border-[#C9A227]'
                              : 'bg-[#1C1B18] text-[#9E988A] border-[#2A2824]'
                          }`}
                        >
                          {opt.key}
                        </span>
                        <span className="leading-relaxed text-xs sm:text-sm text-[#F8F5ED] font-medium pt-0.5">
                          {opt.text}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* --- MODE B: REAL-TIME TYPING SPEED BENCHMARK --- */}
            {isTypingTest && (
              <div className="space-y-5">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 text-[#4ADE80]">
                    <Keyboard className="w-4 h-4" />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider">
                      Part C: Real-Time Typing Speed Benchmark (Target: ≥35 WPM / ≥90% Accuracy)
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-[#F8F5ED]">
                    {currentQ.title || 'Post-Sales Customer Support Typing Benchmark'}
                  </h2>
                </div>

                {/* Live Telemetry Scoreboard */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#141311] p-3.5 rounded-2xl border border-[#2A2824]">
                  <div className="p-3 bg-[#1C1B18] rounded-xl border border-[#2A2824] flex items-center space-x-3">
                    <Gauge className="w-5 h-5 text-[#4ADE80]" />
                    <div>
                      <div className="text-[10px] font-mono text-[#9E988A] uppercase">Net Speed</div>
                      <div className="text-sm font-mono font-bold text-[#4ADE80]">
                        {typingMetrics.wpm} <span className="text-[10px] text-[#9E988A]">WPM</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-[#1C1B18] rounded-xl border border-[#2A2824] flex items-center space-x-3">
                    <Target className="w-5 h-5 text-[#C9A227]" />
                    <div>
                      <div className="text-[10px] font-mono text-[#9E988A] uppercase">Accuracy</div>
                      <div className="text-sm font-mono font-bold text-[#E3C766]">
                        {typingMetrics.accuracy}%
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-[#1C1B18] rounded-xl border border-[#2A2824] flex items-center space-x-3">
                    <Timer className="w-5 h-5 text-[#38BDF8]" />
                    <div>
                      <div className="text-[10px] font-mono text-[#9E988A] uppercase">Time Elapsed</div>
                      <div className="text-sm font-mono font-bold text-[#38BDF8]">
                        {elapsedTypingSeconds}s
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-[#1C1B18] rounded-xl border border-[#2A2824] flex items-center space-x-3">
                    <AlertTriangle className={`w-5 h-5 ${typingMetrics.errorChars > 0 ? 'text-red-400' : 'text-[#9E988A]'}`} />
                    <div>
                      <div className="text-[10px] font-mono text-[#9E988A] uppercase">Errors</div>
                      <div className={`text-sm font-mono font-bold ${typingMetrics.errorChars > 0 ? 'text-red-400' : 'text-[#F8F5ED]'}`}>
                        {typingMetrics.errorChars}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-mono text-[#9E988A]">
                    <span>Passage Completion</span>
                    <span>{typingMetrics.progressPct}%</span>
                  </div>
                  <div className="w-full h-2 bg-[#141311] rounded-full overflow-hidden border border-[#2A2824]">
                    <div
                      className="h-full bg-gradient-to-r from-[#C9A227] to-[#4ADE80] transition-all duration-200"
                      style={{ width: `${typingMetrics.progressPct}%` }}
                    />
                  </div>
                </div>

                {/* Character-by-Character Highlight Passage Box */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#9E988A] flex items-center justify-between">
                    <span>Reference Passage:</span>
                    <button
                      onClick={handleResetTyping}
                      className="text-[11px] font-mono text-[#C9A227] hover:underline flex items-center space-x-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Restart Test</span>
                    </button>
                  </label>

                  <div className="p-4 sm:p-5 rounded-2xl bg-[#141311] border border-[#2A2824] font-mono text-xs sm:text-sm leading-relaxed tracking-wide select-none max-h-48 overflow-y-auto">
                    {samplePassage.split('').map((char: string, index: number) => {
                      let colorClass = 'text-[#6B685F]'; // Upcoming untyped

                      if (index < typedText.length) {
                        if (typedText[index] === char) {
                          colorClass = 'text-[#4ADE80] font-semibold'; // Correct
                        } else {
                          colorClass = 'text-red-400 bg-red-500/20 underline font-bold'; // Error
                        }
                      } else if (index === typedText.length) {
                        colorClass = 'bg-[#C9A227] text-[#11110F] font-bold animate-pulse px-0.5 rounded'; // Active cursor
                      }

                      return (
                        <span key={index} className={colorClass}>
                          {char}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Typing Input Textarea */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#9E988A]">
                    Type the passage above (Paste is disabled for test integrity):
                  </label>
                  <textarea
                    ref={typingInputRef}
                    value={typedText}
                    onChange={handleTypingChange}
                    onPaste={(e) => {
                      e.preventDefault();
                      alert('Pasting text is disabled in typing benchmark mode.');
                    }}
                    placeholder="Click here and start typing to automatically start the timer..."
                    rows={4}
                    className="w-full bg-[#141311] text-[#F8F5ED] font-mono text-xs sm:text-sm p-4 rounded-2xl border border-[#2A2824] focus:outline-none focus:border-[#C9A227] focus:ring-1 focus:ring-[#C9A227] leading-relaxed transition resize-none"
                  />
                </div>
              </div>
            )}

            {/* Bottom Navigation Row */}
            <div className="flex items-center justify-between border-t border-[#2A2824] pt-5">
              <button
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                className="px-4 py-2.5 rounded-xl bg-[#141311] disabled:opacity-30 text-xs font-bold text-[#9E988A] hover:text-[#F8F5ED] border border-[#2A2824] flex items-center space-x-2 transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Previous Task</span>
              </button>

              <div className="flex items-center space-x-3">
                {currentIndex === questions.length - 1 ? (
                  <button
                    onClick={() => performSubmit(true)}
                    disabled={isSubmitting}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#C9A227] to-[#E3C766] text-[#11110F] text-xs font-bold shadow-lg flex items-center space-x-2 hover:opacity-90 transition cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isSubmitting ? 'Submitting...' : 'Submit Round 1'}</span>
                  </button>
                ) : (
                  <button
                    onClick={handleNext}
                    className="px-5 py-2.5 rounded-xl bg-[#C9A227] hover:bg-[#B89220] text-xs font-bold text-[#11110F] shadow-md flex items-center space-x-2 transition cursor-pointer"
                  >
                    <span>Next Task</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Right Area: Categorized Question Palette */}
        <div className="lg:col-span-4 flex flex-col space-y-4">
          <div className="bg-[#1C1B18] border border-[#2A2824] rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#2A2824] pb-3">
              <h3 className="text-xs font-bold text-[#F8F5ED] uppercase tracking-wider flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#C9A227]" />
                <span>Question Palette</span>
              </h3>
              <span className="text-[11px] font-mono text-[#9E988A]">
                {Object.keys(savedAnswers).length}/{questions.length} Answered
              </span>
            </div>

            {/* Part A: Grammar & Phrasing (Q1–Q20) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono text-[#E3C766] font-semibold">
                <span>Part A: Grammar & Phrasing</span>
                <span>Q1–Q20</span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {questions.slice(0, 20).map((q, idx) => {
                  const isCurrent = currentIndex === idx;
                  const isSaved = !!savedAnswers[q.id];
                  const isFlagged = !!reviewFlags[q.id];

                  let btnStyle = 'bg-[#141311] text-[#9E988A] border-[#2A2824]';
                  if (isCurrent) {
                    btnStyle = 'bg-[#C9A227] text-[#11110F] font-bold border-[#C9A227] ring-2 ring-[#C9A227]/40';
                  } else if (isFlagged) {
                    btnStyle = 'bg-[#EAB308]/20 text-[#EAB308] border-[#EAB308]';
                  } else if (isSaved) {
                    btnStyle = 'bg-[#4ADE80]/15 text-[#4ADE80] border-[#4ADE80]/40 font-semibold';
                  }

                  return (
                    <button
                      key={q.id}
                      onClick={() => handleSelectQuestionFromPalette(idx)}
                      className={`h-8 rounded-lg border text-xs font-mono flex items-center justify-center transition hover:scale-105 cursor-pointer ${btnStyle}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Part B: Tone Rewriting (Q21–Q25) */}
            <div className="space-y-2 pt-2 border-t border-[#2A2824]">
              <div className="flex items-center justify-between text-[11px] font-mono text-[#38BDF8] font-semibold">
                <span>Part B: Tone Rewriting</span>
                <span>Q21–Q25</span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {questions.slice(20, 25).map((q, i) => {
                  const idx = 20 + i;
                  const isCurrent = currentIndex === idx;
                  const isSaved = !!savedAnswers[q.id];
                  const isFlagged = !!reviewFlags[q.id];

                  let btnStyle = 'bg-[#141311] text-[#9E988A] border-[#2A2824]';
                  if (isCurrent) {
                    btnStyle = 'bg-[#C9A227] text-[#11110F] font-bold border-[#C9A227] ring-2 ring-[#C9A227]/40';
                  } else if (isFlagged) {
                    btnStyle = 'bg-[#EAB308]/20 text-[#EAB308] border-[#EAB308]';
                  } else if (isSaved) {
                    btnStyle = 'bg-[#4ADE80]/15 text-[#4ADE80] border-[#4ADE80]/40 font-semibold';
                  }

                  return (
                    <button
                      key={q.id}
                      onClick={() => handleSelectQuestionFromPalette(idx)}
                      className={`h-8 rounded-lg border text-xs font-mono flex items-center justify-center transition hover:scale-105 cursor-pointer ${btnStyle}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Part C: Typing Speed Benchmark (Q26) */}
            {questions.length >= 26 && (
              <div className="space-y-2 pt-2 border-t border-[#2A2824]">
                <div className="flex items-center justify-between text-[11px] font-mono text-[#4ADE80] font-semibold">
                  <span>Part C: Typing Benchmark</span>
                  <span>Q26</span>
                </div>
                <button
                  onClick={() => handleSelectQuestionFromPalette(25)}
                  className={`w-full p-2.5 rounded-xl border text-xs font-mono flex items-center justify-between transition cursor-pointer ${
                    currentIndex === 25
                      ? 'bg-[#C9A227] text-[#11110F] font-bold border-[#C9A227] ring-2 ring-[#C9A227]/40'
                      : savedAnswers[questions[25]?.id]
                      ? 'bg-[#4ADE80]/15 text-[#4ADE80] border-[#4ADE80]/40 font-semibold'
                      : 'bg-[#141311] text-[#D8D2C5] border-[#2A2824] hover:border-[#4ADE80]/40'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Keyboard className="w-3.5 h-3.5" />
                    <span>Q26: Typing Speed Test</span>
                  </div>
                  {savedAnswers[questions[25]?.id] && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#4ADE80]" />
                  )}
                </button>
              </div>
            )}

            {/* Legend */}
            <div className="border-t border-[#2A2824] pt-3 text-[11px] font-mono grid grid-cols-2 gap-2 text-[#9E988A]">
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#4ADE80]" />
                <span>Answered</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#EAB308]" />
                <span>Flagged</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#C9A227]" />
                <span>Current</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2A2824]" />
                <span>Unanswered</span>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};
