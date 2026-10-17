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
    <div className="h-screen max-h-screen bg-[#F6F8FA] text-[#0F172A] flex flex-col overflow-hidden selection:bg-[#FF5500] selection:text-white">
      {/* Top Header with Assessment Timer and Auto-save */}
      <TimerHeader
        attemptData={attemptData}
        onSubmit={() => setShowSubmitModal(true)}
        isSubmitting={isSubmitting}
        saveStatus={saveStatus}
      />

      {/* Top Utility & Status Action Bar */}
      <div className="shrink-0 bg-[#FFFFFF] border-b border-[#E2E8F0] px-6 py-2 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="bg-[#FF5500]/10 text-[#FF5500] border border-[#FF5500]/25 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Bug className="w-3.5 h-3.5 text-[#FF5500]" /> Defect {currentIndex + 1} of {questions.length}
          </span>
          <span className="text-xs text-[#64748B] font-medium hidden sm:inline">
            Language: <strong className="text-[#0F172A] uppercase font-mono">{currentLanguage}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetToBuggyTemplate}
            className="px-3 py-1.5 rounded-xl bg-[#F0F3F6] hover:bg-[#E2E8F0] text-[#475569] hover:text-[#0F172A] border border-[#E2E8F0] text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer"
            title="Reset code to initial template"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset Template
          </button>
        </div>
      </div>

      {/* Main Split Pane: Problem Panel (Left) vs Editor Panel (Right) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden min-h-0">
        {/* LEFT COLUMN: Problem Panel and Navigation */}
        <div className="lg:col-span-5 bg-[#FFFFFF] flex flex-col h-full overflow-hidden min-h-0 border-r border-[#E2E8F0]">
          {/* Scrollable problem content */}
          <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-4">
            {currentQ ? (
              <div className="space-y-4">
                {/* Question Header */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#FF5500] flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" /> {isCLanguage ? 'C Systems' : 'Software'} Defect #{currentIndex + 1}
                    </span>
                    <div className="flex items-center gap-2">
                      {getDifficultyBadge(currentQ.difficulty)}
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono text-[#64748B] bg-[#F0F3F6] border border-[#E2E8F0]">
                        {currentQ.marks || 10} Marks
                      </span>
                    </div>
                  </div>
                  <h2 className="text-base md:text-lg font-bold text-[#0F172A] tracking-tight">
                    {currentQ.title}
                  </h2>
                </div>

                {/* 1. QUESTION: Problem Statement Card */}
                <div id="question-panel" className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 shadow-2xs space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#FF5500]">
                    <FileQuestion className="w-3.5 h-3.5" /> Problem Statement
                  </div>
                  <p className="text-xs md:text-sm text-[#334155] leading-relaxed font-sans whitespace-pre-line">
                    {problem}
                  </p>
                </div>

                {/* Debugging guidance */}
                <div className="bg-[#FFF7ED] border border-[#FFEDD5] rounded-xl p-3.5 text-xs text-[#9A3412] space-y-1.5">
                  <div className="flex items-center gap-1.5 font-semibold text-[#C2410C]">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#C2410C]" /> Evaluation Directive:
                  </div>
                  <p className="text-[11px] text-[#9A3412] leading-relaxed">
                    Find and fix the defect in the editor so the program solves the stated problem. Your fix is evaluated after you submit the round. Submitting the original code unchanged scores zero.
                  </p>
                </div>

                {/* Problem Switcher Grid */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                      Question Palette:
                    </span>
                    <span className="text-[11px] font-mono text-[#64748B]">
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
                              ? 'bg-[#FF5500] text-white font-bold border-[#FF5500] shadow-sm ring-2 ring-[#FF5500]/30'
                              : hasEdits
                              ? 'bg-[#F0FDF4] text-[#16A34A] border-emerald-300 hover:bg-emerald-100'
                              : 'bg-[#F0F3F6] text-[#64748B] border-[#E2E8F0] hover:bg-[#E2E8F0] hover:text-[#0F172A]'
                          }`}
                        >
                          Q{idx + 1}
                          {hasEdits && (
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#16A34A] ml-1.5 align-middle" />
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
          <div className="shrink-0 bg-[#FFFFFF] border-t border-[#E2E8F0] px-6 py-3 flex items-center justify-between">
            <button
              id="btn-prev"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="px-4 py-2 rounded-xl bg-[#F0F3F6] hover:bg-[#E2E8F0] text-[#475569] hover:text-[#0F172A] border border-[#E2E8F0] text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>

            <div className="text-center hidden sm:block">
              <span className="text-xs font-mono text-[#64748B]">
                Question <strong className="text-[#0F172A]">{currentIndex + 1}</strong> of <strong className="text-[#0F172A]">{questions.length}</strong>
              </span>
              {isCurrentAttempted && (
                <div className="text-[10px] text-[#16A34A] font-mono flex items-center justify-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-3 h-3" /> Solution Modified
                </div>
              )}
            </div>

            <button
              id="btn-next"
              onClick={handleNext}
              className="px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md bg-[#FF5500] hover:bg-[#E64D00] text-white shadow-[#FF5500]/20 cursor-pointer"
            >
              {/* On the last question this opens the submit review */}
              <span>{currentIndex < questions.length - 1 ? 'Next' : 'Submit Round'}</span>
              {currentIndex < questions.length - 1 ? <ChevronRight className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: EDITOR PANEL & BATCH EVALUATION STATUS */}
        <div id="editor-panel" className="lg:col-span-7 flex flex-col h-full bg-[#FFFFFF] min-h-0">
          {/* Editor Header */}
          <div className="px-4 py-2.5 bg-[#FFFFFF] border-b border-[#E2E8F0] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCode2 className="w-4 h-4 text-[#FF5500]" />
              <span className="text-xs font-mono text-[#475569] font-semibold">
                Editor Panel — <span className="text-[#0F172A] font-bold">solution.{currentLanguage === 'c' ? 'c' : 'py'}</span>
              </span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#F0F3F6] text-[#FF5500] border border-[#FF5500]/30 font-semibold">
                {currentLanguage.toUpperCase()}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-mono text-[#64748B]">
                Autosave: <strong className={saveStatus === 'Saved' ? 'text-emerald-600' : 'text-amber-600'}>{saveStatus}</strong>
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
          <div className="px-5 py-3 bg-[#FFFFFF] border-t border-[#E2E8F0] flex items-center justify-end text-xs font-mono">
            <span className="text-[#64748B]">
              Attempted: <strong className="text-emerald-600">{attemptedCount}</strong> / {questions.length}
            </span>
          </div>
        </div>
      </div>

      {/* Confirmation & Submission Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#FF5500]/10 border border-[#FF5500]/30 text-[#FF5500]">
                <Bug className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#0F172A]">Submit C Debugging Assessment?</h3>
                <p className="text-xs text-[#64748B]">Your fixes are locked once you submit</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2 text-xs">
              <div className="flex justify-between text-[#334155]">
                <span>Total Assigned Defects:</span>
                <span className="font-bold text-[#0F172A]">{questions.length}</span>
              </div>
              <div className="flex justify-between text-[#334155]">
                <span>Attempted Bug Fixes:</span>
                <span className="font-bold text-emerald-600">{attemptedCount}</span>
              </div>
              <div className="flex justify-between text-[#334155]">
                <span>Unattempted / Original Code:</span>
                <span className="font-bold text-amber-600">{questions.length - attemptedCount}</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#FFF7ED] border border-[#FFEDD5] text-[11px] text-[#9A3412] leading-relaxed flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-[#C2410C] shrink-0 mt-0.5" />
              <span>
                Your fixes are locked and evaluated after submission. Defects left unchanged score zero.
              </span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#64748B] hover:text-[#0F172A] bg-[#F0F3F6] hover:bg-[#E2E8F0] border border-[#E2E8F0] transition cursor-pointer"
              >
                Continue Debugging
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#FF5500] hover:bg-[#E64D00] shadow-lg shadow-[#FF5500]/20 transition disabled:opacity-50 cursor-pointer"
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
