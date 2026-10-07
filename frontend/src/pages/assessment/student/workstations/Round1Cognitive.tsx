import React, { useState, useEffect, useMemo } from 'react';
import { StartAttemptResponse, CandidateResult } from '../../../../types/assessment';
import { TimerHeader } from '../../../../components/assessment/TimerHeader';
import { QuestionPalette } from '../../../../components/assessment/QuestionPalette';
import apiClient from '../../../../api/client';
import { ArrowLeft, ArrowRight, Bookmark, CheckCircle2, FileText, Sparkles } from 'lucide-react';

interface WorkstationProps {
  attemptData: StartAttemptResponse;
  onSubmitComplete: (res: CandidateResult) => void;
}

export const Round1Cognitive: React.FC<WorkstationProps> = ({ attemptData, onSubmitComplete }) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [savedAnswers, setSavedAnswers] = useState<Record<string, any>>(attemptData.saved_answers || {});
  const [reviewFlags, setReviewFlags] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const debounceTimerRef = React.useRef<any>(null);

  const questions = attemptData.questions || [];
  const currentQ = questions[currentIndex];

  // Sync state whenever attemptData reloads
  useEffect(() => {
    if (attemptData?.saved_answers) {
      setSavedAnswers(attemptData.saved_answers);
    }
  }, [attemptData]);

  // Normalized options for MCQ mode
  const normalizedOptions = useMemo(() => {
    if (!currentQ) return [];
    const rawOpts = currentQ.options || (currentQ as any).options_json || [];
    if (!Array.isArray(rawOpts) || rawOpts.length === 0) return [];

    return rawOpts.map((opt: any, idx: number) => {
      const letterKey = String.fromCharCode(65 + idx); // 'A', 'B', 'C', 'D'
      if (typeof opt === 'string' || typeof opt === 'number') {
        const strVal = String(opt);
        return {
          key: letterKey,
          value: strVal,
          text: strVal
        };
      } else if (typeof opt === 'object' && opt !== null) {
        const key = opt.key || (opt.id ? (typeof opt.id === 'number' ? String.fromCharCode(64 + opt.id) : String(opt.id)) : letterKey);
        const text = opt.text !== undefined ? String(opt.text) : (opt.value !== undefined ? String(opt.value) : (opt.label !== undefined ? String(opt.label) : ''));
        const value = opt.value !== undefined ? String(opt.value) : (opt.text !== undefined ? String(opt.text) : key);
        return {
          key: key || letterKey,
          value: value,
          text: text
        };
      }
      return { key: letterKey, value: String(opt), text: String(opt) };
    });
  }, [currentQ]);

  // Is this question a subjective / descriptive text response?
  const isSubjective = useMemo(() => {
    if (!currentQ) return false;
    const qType = (currentQ.question_type || '').toLowerCase();
    const subjectiveTypes = ['text_response', 'descriptive', 'business_case', 'project_discussion', 'essay'];
    return subjectiveTypes.includes(qType) || normalizedOptions.length === 0;
  }, [currentQ, normalizedOptions]);

  // Word count for subjective responses
  const currentTextAnswer = (currentQ && (savedAnswers[currentQ.id] !== undefined ? savedAnswers[currentQ.id] : savedAnswers[String(currentQ.id)])) ? String(savedAnswers[currentQ.id] || savedAnswers[String(currentQ.id)]) : '';
  const currentWordCount = useMemo(() => {
    if (!currentTextAnswer.trim()) return 0;
    return currentTextAnswer.trim().split(/\s+/).filter(Boolean).length;
  }, [currentTextAnswer]);

  const handleSelectOption = async (optionKey: string) => {
    if (!currentQ) return;
    const newAnswers = { ...savedAnswers, [currentQ.id]: optionKey, [String(currentQ.id)]: optionKey };
    setSavedAnswers(newAnswers);

    try {
      await apiClient.post('/assessment/attempts/save-response', {
        attempt_id: attemptData.attempt_id,
        question_id: currentQ.id,
        response_payload: optionKey,
        is_marked_for_review: !!reviewFlags[currentQ.id]
      });
    } catch (err) {
      console.error('Failed to autosave option response', err);
    }
  };

  const handleTextChange = (text: string) => {
    if (!currentQ) return;
    const newAnswers = { ...savedAnswers, [currentQ.id]: text, [String(currentQ.id)]: text };
    setSavedAnswers(newAnswers);

    // Debounced autosave after 600ms of user idle
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(async () => {
      try {
        await apiClient.post('/assessment/attempts/save-response', {
          attempt_id: attemptData.attempt_id,
          question_id: currentQ.id,
          response_payload: text,
          is_marked_for_review: !!reviewFlags[currentQ.id]
        });
      } catch (err) {
        console.error('Failed to debounced autosave text response', err);
      }
    }, 600);
  };

  const handleSaveTextOnBlur = async () => {
    if (!currentQ) return;
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    const val = savedAnswers[currentQ.id] || savedAnswers[String(currentQ.id)] || '';
    try {
      await apiClient.post('/assessment/attempts/save-response', {
        attempt_id: attemptData.attempt_id,
        question_id: currentQ.id,
        response_payload: val,
        is_marked_for_review: !!reviewFlags[currentQ.id]
      });
    } catch (err) {
      console.error('Failed to autosave text response on blur', err);
    }
  };

  const toggleReviewFlag = () => {
    if (!currentQ) return;
    setReviewFlags((prev) => ({ ...prev, [currentQ.id]: !prev[currentQ.id] }));
  };

  const performSubmit = async (isManual = false) => {
    if (isManual) {
      if (!confirm('Are you sure you want to submit your assessment round? Answers cannot be modified after submission.')) {
        return;
      }
    }
    setIsSubmitting(true);
    try {
      // Save current answer if subjective
      if (currentQ && isSubjective) {
        await handleSaveTextOnBlur();
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

  if (!currentQ) {
    return <div className="p-8 text-center text-xs font-mono text-[#9E988A]">No questions available.</div>;
  }

  return (
    <div className="flex-1 w-full flex flex-col bg-[#11110F] text-[#F8F5ED] font-sans min-h-screen">
      <TimerHeader
        attemptData={attemptData}
        onSubmit={() => performSubmit(true)}
        isSubmitting={isSubmitting}
      />

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Question Solver Area */}
        <div className="lg:col-span-3 bg-[#1C1B18] border border-[#2A2824] rounded-2xl p-5 sm:p-6 flex flex-col justify-between shadow-xl space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#2A2824] pb-3">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono font-bold bg-[#C9A227]/10 text-[#E3C766] border border-[#C9A227]/25 px-2.5 py-0.5 rounded-md">
                  Q{currentIndex + 1} of {questions.length} • {isSubjective ? 'Written Subjective' : 'Multiple Choice'}
                </span>
                {currentQ.competency_name && (
                  <span className="text-[11px] font-mono text-[#9E988A] bg-[#141311] px-2 py-0.5 rounded border border-[#2A2824]">
                    {currentQ.competency_name}
                  </span>
                )}
              </div>

              <button
                onClick={toggleReviewFlag}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded-xl text-xs font-mono border transition cursor-pointer ${
                  reviewFlags[currentQ.id]
                    ? 'bg-[#EAB308]/15 border-[#EAB308] text-[#EAB308]'
                    : 'bg-[#141311] border-[#2A2824] text-[#9E988A] hover:text-[#F8F5ED]'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>{reviewFlags[currentQ.id] ? 'Flagged for Review' : 'Mark for Review'}</span>
              </button>
            </div>

            <div className="space-y-3">
              <h2 className="text-base font-bold text-[#F8F5ED] leading-snug">
                {currentQ.title}
              </h2>
              <div className="text-xs sm:text-sm text-[#D8D2C5] whitespace-pre-wrap leading-relaxed bg-[#141311] p-4 rounded-xl border border-[#2A2824]">
                {currentQ.content}
              </div>
            </div>

            {/* --- MODE A: MCQ OPTIONS LIST --- */}
            {!isSubjective && normalizedOptions.length > 0 && (
              <div className="space-y-2.5 pt-2">
                {normalizedOptions.map((opt) => {
                  const currentAnswer = savedAnswers[currentQ.id];
                  const isSelected =
                    currentAnswer === opt.value ||
                    currentAnswer === opt.key ||
                    currentAnswer === opt.text;

                  return (
                    <button
                      key={opt.key}
                      onClick={() => handleSelectOption(opt.value)}
                      className={`w-full text-left p-3.5 rounded-xl border text-xs sm:text-sm font-medium transition flex items-start space-x-3 cursor-pointer ${
                        isSelected
                          ? 'bg-[#C9A227]/10 border-[#C9A227] text-[#F8F5ED] shadow-md ring-1 ring-[#C9A227]'
                          : 'bg-[#141311] border-[#2A2824] text-[#D8D2C5] hover:border-[#C9A227]/40 hover:bg-[#24231F]'
                      }`}
                    >
                      <span
                        className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono text-[11px] font-bold shrink-0 border ${
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
            )}

            {/* --- MODE B: WRITTEN / DESCRIPTIVE SOLVER AREA --- */}
            {isSubjective && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs font-mono text-[#9E988A]">
                  <span className="flex items-center space-x-1.5 text-[#C9A227] font-semibold">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Candidate Solution / Analytical Email Draft</span>
                  </span>
                  <span className="bg-[#141311] px-2.5 py-1 rounded-md border border-[#2A2824] text-[#F8F5ED]">
                    {currentWordCount} Words
                  </span>
                </div>

                <textarea
                  value={currentTextAnswer}
                  onChange={(e) => handleTextChange(e.target.value)}
                  onBlur={handleSaveTextOnBlur}
                  placeholder="Draft your structured analytical response, email reply, or business recommendation here..."
                  rows={8}
                  className="w-full bg-[#141311] text-[#F8F5ED] font-mono text-xs sm:text-sm p-4 rounded-xl border border-[#2A2824] focus:outline-none focus:border-[#C9A227] focus:ring-1 focus:ring-[#C9A227] leading-relaxed transition resize-y"
                />

                <div className="text-[11px] text-[#9E988A] font-mono flex items-center justify-between">
                  <span>* Response is automatically saved upon typing and moving between questions</span>
                  <span className="text-[#E3C766]">Target: 150–200 Words</span>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between border-t border-[#2A2824] pt-4">
            <button
              onClick={() => {
                if (isSubjective) handleSaveTextOnBlur();
                setCurrentIndex((prev) => Math.max(0, prev - 1));
              }}
              disabled={currentIndex === 0}
              className="px-4 py-2 rounded-xl bg-[#141311] hover:bg-[#24231F] disabled:opacity-30 text-xs font-bold text-[#9E988A] hover:text-[#F8F5ED] border border-[#2A2824] transition flex items-center space-x-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            <button
              onClick={() => {
                if (isSubjective) handleSaveTextOnBlur();
                setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1));
              }}
              disabled={currentIndex === questions.length - 1}
              className="px-4 py-2 rounded-xl bg-[#C9A227] hover:bg-[#B89220] disabled:opacity-30 text-xs font-bold text-[#11110F] shadow-md transition flex items-center space-x-1.5 cursor-pointer"
            >
              <span>Next Question</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Sidebar Palette */}
        <div className="lg:col-span-1">
          <QuestionPalette
            questions={questions}
            currentIndex={currentIndex}
            onSelectIndex={(idx) => {
              if (isSubjective) handleSaveTextOnBlur();
              setCurrentIndex(idx);
            }}
            savedAnswers={savedAnswers}
            reviewFlags={reviewFlags}
          />
        </div>
      </main>
    </div>
  );
};
