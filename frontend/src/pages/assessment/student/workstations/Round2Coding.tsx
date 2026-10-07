import React, { useState, useEffect, useRef } from 'react';
import { StartAttemptResponse, CandidateResult } from '../../../../types/assessment';
import { TimerHeader } from '../../../../components/assessment/TimerHeader';
import { AssessmentCodeEditor } from '../../../../components/assessment/AssessmentCodeEditor';
import apiClient from '../../../../api/client';
import {
  Code2,
  Terminal,
  Send,
  RotateCcw,
  CheckCircle2,
  Cpu,
  Clock,
  Sparkles,
  Layers,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface WorkstationProps {
  attemptData: StartAttemptResponse;
  onSubmitComplete: (res: CandidateResult) => void;
}

export const Round2Coding: React.FC<WorkstationProps> = ({ attemptData, onSubmitComplete }) => {
  const questions = attemptData.questions || [];
  const [currentQIndex, setCurrentQIndex] = useState<number>(0);
  const currentQ = questions[currentQIndex];

  const [language, setLanguage] = useState<string>('c');
  const [codeMap, setCodeMap] = useState<Record<string, string>>({});
  const [saveStatus, setSaveStatus] = useState<string>('Saved');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const debounceTimerRef = useRef<any>(null);

  // Initialize questions and saved answers
  useEffect(() => {
    const initialMap: Record<string, string> = {};
    questions.forEach((q) => {
      const qKey = String(q.id);
      const saved = attemptData.saved_answers?.[qKey];
      if (saved) {
        if (typeof saved === 'string' && saved.startsWith('{')) {
          try {
            const p = jsonParseSafe(saved);
            initialMap[qKey] = p.code || saved;
          } catch {
            initialMap[qKey] = saved;
          }
        } else {
          initialMap[qKey] = String(saved);
        }
      } else {
        initialMap[qKey] = q.code_template || '#include <stdio.h>\n\nint main() {\n    // Write your solution here\n    return 0;\n}\n';
      }
    });
    setCodeMap(initialMap);
  }, [attemptData, questions]);

  const jsonParseSafe = (str: string) => {
    try {
      return JSON.parse(str);
    } catch {
      return {};
    }
  };

  const currentCode = currentQ ? (codeMap[String(currentQ.id)] || currentQ.code_template || '') : '';

  const handleCodeChange = (newCode: string) => {
    if (!currentQ) return;
    const qKey = String(currentQ.id);
    setCodeMap((prev) => ({ ...prev, [qKey]: newCode }));
    setSaveStatus('Saving...');

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(async () => {
      try {
        await apiClient.post('/assessment/attempts/save-response', {
          attempt_id: attemptData.attempt_id,
          question_id: currentQ.id,
          response_payload: JSON.stringify({ language, code: newCode })
        });
        setSaveStatus('Saved');
      } catch (err) {
        console.error('Failed to debounced autosave code', err);
        setSaveStatus('Offline');
      }
    }, 600);
  };

  const handleResetTemplate = () => {
    if (!currentQ) return;
    if (confirm('Are you sure you want to reset code to the initial starter boilerplate? Any current edits will be cleared.')) {
      const tmpl = currentQ.code_template || '#include <stdio.h>\n\nint main() {\n    return 0;\n}\n';
      handleCodeChange(tmpl);
    }
  };

  const performSubmit = async () => {
    setIsSubmitting(true);
    setShowSubmitModal(false);
    try {
      if (currentQ) {
        await apiClient.post('/assessment/attempts/save-response', {
          attempt_id: attemptData.attempt_id,
          question_id: currentQ.id,
          response_payload: JSON.stringify({ language, code: currentCode })
        });
      }

      const res = await apiClient.post('/assessment/attempts/submit', {
        attempt_id: attemptData.attempt_id
      });
      onSubmitComplete(res.data);
    } catch (err: any) {
      console.error('Failed to submit coding round', err);
      alert(err.response?.data?.detail || 'Failed to submit assessment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentQ) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0F0E0C] text-[#9E988A] font-mono text-sm">
        No coding questions available for this attempt.
      </div>
    );
  }

  // Count answered questions
  const answeredCount = questions.filter((q) => {
    const c = codeMap[String(q.id)];
    return c && c.trim().length > 30;
  }).length;

  return (
    <div className="flex-1 w-full min-h-screen flex flex-col bg-[#0F0E0C] text-[#F8F5ED] font-sans selection:bg-[#C9A227] selection:text-black">
      {/* Top Standard Timer Header */}
      <TimerHeader
        attemptData={attemptData}
        onSubmit={() => setShowSubmitModal(true)}
        isSubmitting={isSubmitting}
        saveStatus={saveStatus}
      />

      {/* Main Workspace Layout: 2 Columns */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-3 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* =========================================================================
            COMPONENT 1: QUESTION PANEL (Left Column - 5 Cols)
            ========================================================================= */}
        <div className="lg:col-span-5 bg-[#171613] border border-[#26241F] rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-2xl space-y-4 max-h-[84vh] overflow-y-auto">
          <div className="space-y-4">
            {/* Header: Problem index & difficulty */}
            <div className="flex items-center justify-between border-b border-[#26241F] pb-3">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono font-bold bg-[#C9A227]/10 text-[#E3C766] border border-[#C9A227]/25 px-2.5 py-1 rounded-md flex items-center space-x-1.5">
                  <Layers className="w-3 h-3 text-[#C9A227]" />
                  <span>Problem {currentQIndex + 1} of {questions.length}</span>
                </span>
                <span
                  className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                    currentQ.difficulty === 'Easy'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                      : currentQ.difficulty === 'Medium'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                  }`}
                >
                  {currentQ.difficulty}
                </span>
              </div>

              <span className="text-[11px] font-mono text-[#9E988A] bg-[#100F0D] px-2.5 py-1 rounded border border-[#26241F]">
                {currentQ.marks} Marks
              </span>
            </div>

            {/* Question Switcher Tabs */}
            {questions.length > 1 && (
              <div className="flex items-center space-x-1.5 bg-[#100F0D] p-1 rounded-xl border border-[#26241F]">
                {questions.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentQIndex(idx)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-mono transition font-bold ${
                      idx === currentQIndex
                        ? 'bg-[#C9A227] text-black shadow-md'
                        : 'text-[#9E988A] hover:text-[#F8F5ED] hover:bg-[#1D1C18]'
                    }`}
                  >
                    Q{idx + 1}
                  </button>
                ))}
              </div>
            )}

            {/* Problem Title */}
            <div>
              <h1 className="text-base sm:text-lg font-bold text-[#F8F5ED] tracking-tight leading-snug">
                {currentQ.title}
              </h1>
            </div>

            {/* Problem Statement & Reference Examples */}
            <div className="text-xs text-[#D8D2C5] whitespace-pre-wrap leading-relaxed bg-[#100F0D] p-4 rounded-xl border border-[#26241F] font-mono shadow-inner">
              {currentQ.content}
            </div>

            {/* Constraints & Notice */}
            <div className="bg-[#1C1A16] border border-[#2A2721] p-3.5 rounded-xl space-y-2">
              <div className="text-[11px] font-mono text-[#C9A227] flex items-center space-x-1.5 font-bold uppercase tracking-wider">
                <Cpu className="w-3.5 h-3.5" />
                <span>Runtime Specifications & Constraints</span>
              </div>
              <ul className="text-[11px] font-mono text-[#A8A295] space-y-1 list-disc list-inside">
                <li>Language Target: Standard C (C11 / GCC).</li>
                <li>Standard Input: Read inputs from <code className="text-[#E3C766]">stdin</code> (e.g. <code className="text-[#E3C766]">scanf</code>).</li>
                <li>Standard Output: Print exact output format to <code className="text-[#E3C766]">stdout</code> (e.g. <code className="text-[#E3C766]">printf</code>).</li>
                <li>Avoid prompt strings like <em>"Enter a number:"</em> to ensure test case matching.</li>
              </ul>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-2 border-t border-[#26241F]">
            <button
              onClick={() => setCurrentQIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentQIndex === 0}
              className="px-3 py-1.5 bg-[#1D1C18] hover:bg-[#25231E] disabled:opacity-40 text-xs font-mono rounded-lg border border-[#26241F] transition flex items-center space-x-1 cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            <span className="text-[11px] font-mono text-[#9E988A]">
              Attempted: {answeredCount} / {questions.length}
            </span>

            <button
              onClick={() => setCurrentQIndex((prev) => Math.min(questions.length - 1, prev + 1))}
              disabled={currentQIndex === questions.length - 1}
              className="px-3 py-1.5 bg-[#1D1C18] hover:bg-[#25231E] disabled:opacity-40 text-xs font-mono rounded-lg border border-[#26241F] transition flex items-center space-x-1 cursor-pointer disabled:cursor-not-allowed"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* =========================================================================
            RIGHT COLUMN: MONACO EDITOR + ACTION BAR + SUBMIT
            ========================================================================= */}
        <div className="lg:col-span-7 flex flex-col space-y-3">
          {/* Main Editor Card */}
          <div className="bg-[#171613] border border-[#26241F] rounded-2xl p-4 shadow-2xl flex flex-col space-y-3 flex-1">
            {/* Action Bar / Editor Header */}
            <div className="flex items-center justify-between border-b border-[#26241F] pb-3">
              <div className="flex items-center space-x-2">
                <Code2 className="w-4 h-4 text-[#C9A227]" />
                <span className="text-xs font-bold text-[#F8F5ED] tracking-wide">C Source Code Editor</span>
                <span className="text-[10px] font-mono text-[#9E988A] bg-[#100F0D] px-2 py-0.5 rounded border border-[#26241F]">
                  C (GCC C11)
                </span>
              </div>

              {/* Status and Action Buttons */}
              <div className="flex items-center space-x-2 sm:space-x-3">
                {/* Autosave Pill */}
                <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-[#100F0D] border border-[#26241F] rounded-lg text-[11px] font-mono text-[#9E988A]">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      saveStatus === 'Saved'
                        ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]'
                        : 'bg-amber-400 animate-pulse'
                    }`}
                  />
                  <span>{saveStatus}</span>
                </div>

                {/* Reset Template */}
                <button
                  onClick={handleResetTemplate}
                  title="Reset to starter boilerplate"
                  className="px-2.5 py-1 text-xs font-mono text-[#9E988A] hover:text-[#F8F5ED] bg-[#100F0D] hover:bg-[#201E1A] border border-[#26241F] rounded-lg transition flex items-center space-x-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Reset</span>
                </button>

                {/* Primary Submit Code Button */}
                <button
                  onClick={() => setShowSubmitModal(true)}
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-[#C9A227] hover:bg-[#D8B038] text-black font-bold text-xs rounded-xl shadow-lg transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5 fill-current" />
                  <span>Submit Code</span>
                </button>
              </div>
            </div>

            {/* COMPONENT 2: FULL-HEIGHT MONACO CODE EDITOR */}
            <div className="flex-1 min-h-[500px] border border-[#26241F] rounded-xl overflow-hidden shadow-inner">
              <AssessmentCodeEditor
                language="c"
                value={currentCode}
                onChange={handleCodeChange}
                isReadOnly={isSubmitting}
                height="510px"
              />
            </div>

            {/* COMPONENT 3: EVALUATION NOTICE FOOTER */}
            <div className="bg-[#12110E] border border-[#26241F] p-3 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs font-mono text-[#9E988A]">
              <div className="flex items-center space-x-2 text-[#C9A227]">
                <Sparkles className="w-4 h-4 shrink-0 text-[#C9A227]" />
                <span className="text-[11px] text-[#D8D2C5]">
                  AI Batch Evaluation: Your code will be compiled and evaluated across all test suites and memory safety rubrics after the round completes.
                </span>
              </div>

              <div className="shrink-0 flex items-center space-x-3 text-[11px]">
                <span>Lines: {currentCode.split('\n').length}</span>
                <span>Chars: {currentCode.length}</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* =========================================================================
          COMPONENT 4: SUBMIT CONFIRMATION MODAL
          ========================================================================= */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#171613] border border-[#302C26] max-w-md w-full rounded-2xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-full bg-[#C9A227]/10 border border-[#C9A227]/30 flex items-center justify-center text-[#C9A227]">
                <Send className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#F8F5ED]">Submit Coding Assessment?</h3>
              <p className="text-xs text-[#A8A295] leading-relaxed">
                You have written solutions for <span className="font-bold text-[#F8F5ED]">{answeredCount} of {questions.length}</span> problems.
                Once submitted, your source code will be queued for automated AI evaluation against standard test suites and algorithmic rubrics.
              </p>
            </div>

            <div className="bg-[#100F0D] p-3.5 rounded-xl border border-[#26241F] space-y-2">
              <div className="text-[11px] font-mono text-[#9E988A] uppercase font-bold tracking-wider">
                Submission Summary
              </div>
              <div className="space-y-1">
                {questions.map((q, idx) => {
                  const hasCode = codeMap[String(q.id)] && codeMap[String(q.id)].trim().length > 30;
                  return (
                    <div key={q.id} className="flex items-center justify-between text-xs font-mono">
                      <span className="text-[#D8D2C5]">Problem {idx + 1}: {q.title.slice(0, 24)}...</span>
                      <span className={hasCode ? "text-emerald-400 font-bold" : "text-amber-400"}>
                        {hasCode ? "Completed" : "Unattempted"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setShowSubmitModal(false)}
                disabled={isSubmitting}
                className="px-4 py-2 bg-[#1F1D19] hover:bg-[#282621] text-xs font-mono text-[#D8D2C5] rounded-xl border border-[#26241F] transition cursor-pointer"
              >
                Back to Code
              </button>

              <button
                onClick={performSubmit}
                disabled={isSubmitting}
                className="px-5 py-2 bg-[#C9A227] hover:bg-[#D8B038] text-black font-bold text-xs rounded-xl shadow-lg transition flex items-center space-x-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Submitting...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm & Submit</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
