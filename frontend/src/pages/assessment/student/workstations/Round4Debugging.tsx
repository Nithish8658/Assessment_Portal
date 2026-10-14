import React, { useState, useEffect, useRef } from 'react';
import { StartAttemptResponse, CandidateResult, CandidateQuestion } from '../../../../types/assessment';
import { TimerHeader } from '../../../../components/assessment/TimerHeader';
import { AssessmentCodeEditor } from '../../../../components/assessment/AssessmentCodeEditor';
import apiClient from '../../../../api/client';
import {
  Bug,
  RotateCcw,
  AlertTriangle,
  Send,
  ChevronLeft,
  ChevronRight,
  FileCode2,
  Clock,
  Sparkles,
  FileQuestion,
  CheckCircle2,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { notify, confirmDialog } from '../../../../components/ui/Dialogs';

interface WorkstationProps {
  attemptData: StartAttemptResponse;
  onSubmitComplete: (res: CandidateResult) => void;
}

export const Round4Debugging: React.FC<WorkstationProps> = ({
  attemptData,
  onSubmitComplete
}) => {
  const questions: CandidateQuestion[] = attemptData.questions || [];
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const currentQ = questions[currentIndex];

  const [codeMap, setCodeMap] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<string>('Saved');
  // One debounce timer per question, so switching defects never drops a pending save.
  const debounceTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Detect language from question template (supports C and Python debugging)
  const isCLanguage = currentQ
    ? (currentQ.code_template?.includes('#include') ||
       currentQ.code_template?.includes('int main') ||
       currentQ.code_template?.includes('stdio.h') ||
       currentQ.content?.includes('C program') ||
       currentQ.title?.includes('C ') ||
       false)
    : false;
  const currentLanguage = isCLanguage ? 'c' : 'python';

  const getProblem = (q?: CandidateQuestion) => {
    if (!q) return '';
    const raw = (q.problem || q.options_json?.problem || q.content || '').split('Debug Hint:')[0];
    return raw.replace(/Problem Statement:\s*/i, '').trim() ||
      'Identify and fix the bug in the provided source code so the program behaves correctly.';
  };

  const problem = getProblem(currentQ);
  // Initialize code templates or saved answers
  useEffect(() => {
    const initialCode: Record<string, string> = {};
    questions.forEach((q) => {
      const qKey = String(q.id);
      const saved = attemptData.saved_answers?.[qKey];
      if (saved) {
        if (typeof saved === 'string' && saved.startsWith('{')) {
          try {
            const p = JSON.parse(saved);
            initialCode[qKey] = p.code || saved;
          } catch {
            initialCode[qKey] = saved;
          }
        } else {
          initialCode[qKey] = String(saved);
        }
      } else {
        initialCode[qKey] = q.code_template || (q.code_template?.includes('#include') ? '// Write your C bugfix here\n' : '# Write your Python bugfix here\n');
      }
    });
    setCodeMap(initialCode);
  }, [attemptData, questions]);

  const currentCode = currentQ ? (codeMap[String(currentQ.id)] || currentQ.code_template || '') : '';

  const handleCodeChange = (newCode: string) => {
    if (!currentQ) return;
    const qKey = String(currentQ.id);
    const questionId = currentQ.id;
    setCodeMap((prev) => ({ ...prev, [qKey]: newCode }));
    setSaveStatus('Saving...');

    if (debounceTimersRef.current[qKey]) clearTimeout(debounceTimersRef.current[qKey]);
    debounceTimersRef.current[qKey] = setTimeout(async () => {
      delete debounceTimersRef.current[qKey];
      try {
        await apiClient.post('/assessment/attempts/save-response', {
          attempt_id: attemptData.attempt_id,
          question_id: questionId,
          response_payload: JSON.stringify({
            code: newCode,
            language: currentLanguage
          })
        });
        setSaveStatus('Saved');
      } catch (err) {
        console.error('Failed to autosave code', err);
        setSaveStatus('Offline (will retry)');
      }
    }, 600);
  };

  const handleResetToBuggyTemplate = async () => {
    if (!currentQ) return;
    if (await confirmDialog('Are you sure you want to reset your code to the original starting template?')) {
      const original = currentQ.code_template || '';
      handleCodeChange(original);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Last question reached -> trigger review & submission modal
      setShowSubmitModal(true);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Flush every defect's latest code, not just the visible one.
      Object.values(debounceTimersRef.current).forEach(clearTimeout);
      debounceTimersRef.current = {};
      try {
        await apiClient.post('/assessment/attempts/save-answers', {
          attempt_id: attemptData.attempt_id,
          answers: questions.map((q) => ({
            question_id: q.id,
            code: JSON.stringify({
              code: codeMap[String(q.id)] ?? q.code_template ?? '',
              language: currentLanguage
            })
          }))
        });
      } catch (err) {
        // e.g. the deadline passed: the server keeps the last answers it accepted.
        console.error('Final save before submit failed', err);
      }

      const res = await apiClient.post('/assessment/attempts/submit', {
        attempt_id: attemptData.attempt_id
      });
      onSubmitComplete(res.data);
    } catch (err: any) {
      console.error('Submit failed', err);
      notify(err.response?.data?.detail || 'Submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
      setShowSubmitModal(false);
    }
  };

  // Tally attempted vs unattempted
  const attemptedCount = questions.filter((q) => {
    const code = codeMap[String(q.id)] || '';
    const template = q.code_template || '';
    return code.trim().length > 0 && code.trim() !== template.trim();
  }).length;

  const isCurrentAttempted = currentCode.trim().length > 0 && currentCode.trim() !== (currentQ?.code_template || '').trim();

  // Difficulty badge styling
  const getDifficultyBadge = (diff?: string) => {
    const d = (diff || 'Medium').toLowerCase();
    if (d === 'easy') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          Easy
        </span>
      );
    }
    if (d === 'hard') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
          Hard
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
        Medium
      </span>
    );
  };

  return (
    <div className="h-screen max-h-screen bg-[#11110F] text-[#F8F5ED] flex flex-col overflow-hidden selection:bg-[#C9A227] selection:text-[#11110F]">
      {/* Top Header with Assessment Timer and Auto-save */}
      <TimerHeader
        attemptData={attemptData}
        onSubmit={() => setShowSubmitModal(true)}
        isSubmitting={isSubmitting}
        saveStatus={saveStatus}
      />

      {/* Top Utility & Status Action Bar */}
      <div className="shrink-0 bg-[#1C1B18] border-b border-[#2A2824] px-6 py-2 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="bg-[#C9A227]/10 text-[#E3C766] border border-[#C9A227]/25 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Bug className="w-3.5 h-3.5 text-[#C9A227]" /> Defect {currentIndex + 1} of {questions.length}
          </span>
          <span className="text-xs text-[#9E988A] font-medium hidden sm:inline">
            Language: <strong className="text-[#F8F5ED] uppercase font-mono">{currentLanguage}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetToBuggyTemplate}
            className="px-3 py-1.5 rounded-xl bg-[#141311] hover:bg-[#24231F] text-[#D8D2C5] hover:text-[#F8F5ED] border border-[#2A2824] text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer"
            title="Reset code to initial template"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset Template
          </button>
        </div>
      </div>

      {/* Main Split Pane: Problem Panel (Left) vs Editor Panel (Right) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden min-h-0">
        {/* LEFT COLUMN: Problem Panel and Navigation */}
        <div className="lg:col-span-5 bg-[#181714] flex flex-col h-full overflow-hidden min-h-0 border-r border-[#2A2824]">
          {/* Scrollable problem content */}
          <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-4">
            {currentQ ? (
              <div className="space-y-4">
                {/* Question Header */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#C9A227] flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" /> {isCLanguage ? 'C Systems' : 'Software'} Defect #{currentIndex + 1}
                    </span>
                    <div className="flex items-center gap-2">
                      {getDifficultyBadge(currentQ.difficulty)}
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono text-[#9E988A] bg-[#141311] border border-[#2A2824]">
                        {currentQ.marks || 10} Marks
                      </span>
                    </div>
                  </div>
                  <h2 className="text-base md:text-lg font-bold text-[#F8F5ED] tracking-tight">
                    {currentQ.title}
                  </h2>
                </div>

                {/* 1. QUESTION: Problem Statement Card */}
                <div id="question-panel" className="bg-[#141311] border border-[#2A2824] rounded-xl p-4 shadow-inner space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#C9A227]">
                    <FileQuestion className="w-3.5 h-3.5" /> Problem Statement
                  </div>
                  <p className="text-xs md:text-sm text-[#D8D2C5] leading-relaxed font-sans whitespace-pre-line">
                    {problem}
                  </p>
                </div>

                {/* Debugging guidance */}
                <div className="bg-[#141311] border border-[#2A2824] rounded-xl p-3.5 text-xs text-[#9E988A] space-y-1.5">
                  <div className="flex items-center gap-1.5 font-semibold text-[#E3C766]">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#C9A227]" /> Evaluation Directive:
                  </div>
                  <p className="text-[11px] text-[#9E988A] leading-relaxed">
                    Find and fix the defect in the editor so the program solves the stated problem. Your fix is evaluated after you submit the round. Submitting the original code unchanged scores zero.
                  </p>
                </div>

                {/* Problem Switcher Grid */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#9E988A]">
                      Question Palette:
                    </span>
                    <span className="text-[11px] font-mono text-[#9E988A]">
                      {attemptedCount} of {questions.length} Attempted
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {questions.map((q, idx) => {
                      const code = codeMap[String(q.id)] || '';
                      const hasEdits = code.trim().length > 0 && code.trim() !== (q.code_template || '').trim();
                      const isSelected = currentIndex === idx;
                      return (
                        <button
                          key={q.id}
                          onClick={() => setCurrentIndex(idx)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-medium border transition-all relative cursor-pointer ${
                            isSelected
                              ? 'bg-[#C9A227] text-[#11110F] font-bold border-[#C9A227] shadow-md shadow-[#C9A227]/20 ring-2 ring-[#C9A227]/30'
                              : hasEdits
                              ? 'bg-[#141311] text-[#10B981] border-[#10B981]/40 hover:bg-[#24231F]'
                              : 'bg-[#141311] text-[#9E988A] border-[#2A2824] hover:bg-[#24231F] hover:text-[#F8F5ED]'
                          }`}
                        >
                          Q{idx + 1}
                          {hasEdits && (
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#10B981] ml-1.5 align-middle" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* Pinned Bottom Navigation Bar */}
          <div className="shrink-0 bg-[#1C1B18] border-t border-[#2A2824] px-6 py-3 flex items-center justify-between">
            <button
              id="btn-prev"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="px-4 py-2 rounded-xl bg-[#141311] hover:bg-[#24231F] text-[#D8D2C5] hover:text-[#F8F5ED] border border-[#2A2824] text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>

            <div className="text-center hidden sm:block">
              <span className="text-xs font-mono text-[#9E988A]">
                Question <strong className="text-[#F8F5ED]">{currentIndex + 1}</strong> of <strong className="text-[#F8F5ED]">{questions.length}</strong>
              </span>
              {isCurrentAttempted && (
                <div className="text-[10px] text-[#10B981] font-mono flex items-center justify-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-3 h-3" /> Solution Modified
                </div>
              )}
            </div>

            <button
              id="btn-next"
              onClick={handleNext}
              className="px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md bg-[#C9A227] hover:bg-[#B89220] text-[#11110F] shadow-[#C9A227]/20 cursor-pointer"
            >
              {/* On the last question this opens the submit review */}
              <span>{currentIndex < questions.length - 1 ? 'Next' : 'Submit Round'}</span>
              {currentIndex < questions.length - 1 ? <ChevronRight className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: EDITOR PANEL & BATCH EVALUATION STATUS */}
        <div id="editor-panel" className="lg:col-span-7 flex flex-col h-full bg-[#11110F] min-h-0">
          {/* Editor Header */}
          <div className="px-4 py-2.5 bg-[#1C1B18] border-b border-[#2A2824] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCode2 className="w-4 h-4 text-[#C9A227]" />
              <span className="text-xs font-mono text-[#D8D2C5] font-semibold">
                Editor Panel — <span className="text-[#F8F5ED] font-bold">solution.{currentLanguage === 'c' ? 'c' : 'py'}</span>
              </span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#141311] text-[#E3C766] border border-[#C9A227]/30">
                {currentLanguage.toUpperCase()}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-mono text-[#9E988A]">
                Autosave: <strong className={saveStatus === 'Saved' ? 'text-[#10B981]' : 'text-[#EAB308]'}>{saveStatus}</strong>
              </span>
            </div>
          </div>

          {/* Monaco Code Editor */}
          <div className="flex-1 relative">
            <AssessmentCodeEditor
              value={currentCode}
              onChange={handleCodeChange}
              language={currentLanguage}
            />
          </div>

          {/* Editor Footer */}
          <div className="px-5 py-3 bg-[#1C1B18] border-t border-[#2A2824] flex items-center justify-end text-xs font-mono">
            <span className="text-[#9E988A]">
              Attempted: <strong className="text-[#10B981]">{attemptedCount}</strong> / {questions.length}
            </span>
          </div>
        </div>
      </div>

      {/* Confirmation & Submission Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-[#11110F]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1C1B18] border border-[#2A2824] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#C9A227]/10 border border-[#C9A227]/30 text-[#C9A227]">
                <Bug className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#F8F5ED]">Submit C Debugging Assessment?</h3>
                <p className="text-xs text-[#9E988A]">Your fixes are locked once you submit</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#141311] border border-[#2A2824] space-y-2 text-xs">
              <div className="flex justify-between text-[#D8D2C5]">
                <span>Total Assigned Defects:</span>
                <span className="font-bold text-[#F8F5ED]">{questions.length}</span>
              </div>
              <div className="flex justify-between text-[#D8D2C5]">
                <span>Attempted Bug Fixes:</span>
                <span className="font-bold text-[#10B981]">{attemptedCount}</span>
              </div>
              <div className="flex justify-between text-[#D8D2C5]">
                <span>Unattempted / Original Code:</span>
                <span className="font-bold text-[#EAB308]">{questions.length - attemptedCount}</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#C9A227]/10 border border-[#C9A227]/25 text-[11px] text-[#D8D2C5] leading-relaxed flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-[#C9A227] shrink-0 mt-0.5" />
              <span>
                Your fixes are locked and evaluated after submission. Defects left unchanged score zero.
              </span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#9E988A] hover:text-[#F8F5ED] bg-[#141311] hover:bg-[#24231F] border border-[#2A2824] transition cursor-pointer"
              >
                Continue Debugging
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl text-xs font-bold text-[#11110F] bg-[#C9A227] hover:bg-[#B89220] shadow-lg shadow-[#C9A227]/20 transition disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? 'Submitting...' : 'Confirm Final Submission'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
