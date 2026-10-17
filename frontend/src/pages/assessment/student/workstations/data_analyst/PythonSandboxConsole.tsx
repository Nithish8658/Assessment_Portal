import React, { useState, useEffect, useRef } from 'react';
import { StartAttemptResponse, CandidateResult, CandidateQuestion } from '../../../../../types/assessment';
import { TimerHeader } from '../../../../../components/assessment/TimerHeader';
import { AssessmentCodeEditor } from '../../../../../components/assessment/AssessmentCodeEditor';
import apiClient from '../../../../../api/client';
import {
  Table,
  Code2,
  Database,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Sparkles,
  Clock,
  FileSpreadsheet,
  CheckCircle2
} from 'lucide-react';
import { notify, confirmDialog } from '../../../../../components/ui/Dialogs';

interface WorkstationProps {
  attemptData: StartAttemptResponse;
  onSubmitComplete: (res: CandidateResult) => void;
}

export const PythonSandboxConsole: React.FC<WorkstationProps> = ({
  attemptData,
  onSubmitComplete
}) => {
  const questions: CandidateQuestion[] = attemptData.questions || [];
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const currentQ = questions[currentIndex];

  const [codeMap, setCodeMap] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [showDatasetDrawer, setShowDatasetDrawer] = useState<boolean>(true);
  const [saveStatus, setSaveStatus] = useState<string>('Saved');
  const debounceRef = useRef<any>(null);

  // Sample Data Analyst Dataset Schema Mock
  const mockDataset = [
    { order_id: 101, customer_id: 'C-801', region: 'North', category: 'Tech', sales: 450.0, discount: 0.1, profit: 120.0 },
    { order_id: 102, customer_id: 'C-802', region: 'South', category: 'Furniture', sales: 820.0, discount: 0.15, profit: -45.0 },
    { order_id: 103, customer_id: 'C-803', region: 'East', category: 'Office', sales: 150.0, discount: 0.0, profit: 35.0 },
    { order_id: 104, customer_id: 'C-804', region: 'West', category: 'Tech', sales: 1200.0, discount: 0.2, profit: 340.0 },
    { order_id: 105, customer_id: 'C-805', region: 'North', category: 'Furniture', sales: 610.0, discount: 0.05, profit: 95.0 }
  ];

  const isMCQ = currentQ?.question_type?.toLowerCase() === 'mcq' || Boolean(currentQ?.options && currentQ.options.length > 0);

  useEffect(() => {
    const initial: Record<string, string> = {};
    questions.forEach((q) => {
      const qKey = String(q.id);
      const saved = attemptData.saved_answers?.[qKey];
      if (saved) {
        if (typeof saved === 'string' && saved.startsWith('{')) {
          try {
            const p = JSON.parse(saved);
            initial[qKey] = p.code || saved;
          } catch {
            initial[qKey] = saved;
          }
        } else {
          initial[qKey] = String(saved);
        }
      } else {
        initial[qKey] = q.code_template || (isMCQ ? '' : `import pandas as pd\nimport numpy as np\n\ndef analyze_data(sales_df: pd.DataFrame):\n    # Write your Pandas transformation here\n    pass\n`);
      }
    });
    setCodeMap(initial);
  }, [attemptData, questions]);

  const currentCode = currentQ ? (codeMap[String(currentQ.id)] || '') : '';

  const handleResponseChange = (newAnswer: string) => {
    if (!currentQ) return;
    const qKey = String(currentQ.id);
    setCodeMap((prev) => ({ ...prev, [qKey]: newAnswer }));
    setSaveStatus('Saving...');

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        await apiClient.post('/assessment/attempts/save-response', {
          attempt_id: attemptData.attempt_id,
          question_id: currentQ.id,
          response_payload: isMCQ ? newAnswer : JSON.stringify({
            code: newAnswer,
            language: 'python'
          })
        });
        setSaveStatus('Saved');
      } catch (err) {
        console.error('Failed to autosave response', err);
        setSaveStatus('Offline (will retry)');
      }
    }, 600);
  };

  const handleResetToTemplate = async () => {
    if (!currentQ) return;
    if (await confirmDialog('Are you sure you want to reset your code to the original starting template?')) {
      const original = currentQ.code_template || `import pandas as pd\nimport numpy as np\n\ndef analyze_data(sales_df: pd.DataFrame):\n    pass\n`;
      handleResponseChange(original);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (currentQ) {
        await apiClient.post('/assessment/attempts/save-response', {
          attempt_id: attemptData.attempt_id,
          question_id: currentQ.id,
          response_payload: isMCQ ? currentCode : JSON.stringify({
            code: currentCode,
            language: 'python'
          })
        });
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

  const attemptedCount = questions.filter((q) => {
    const ans = codeMap[String(q.id)] || '';
    const tmpl = q.code_template || '';
    return ans.trim().length > 0 && ans.trim() !== tmpl.trim();
  }).length;

  return (
    <div className="h-screen max-h-screen bg-[#F6F8FA] text-[#0F172A] flex flex-col font-sans overflow-hidden selection:bg-[#FF5500] selection:text-white">
      {/* Top Header */}
      <TimerHeader
        attemptData={attemptData}
        onSubmit={() => setShowSubmitModal(true)}
        isSubmitting={isSubmitting}
        saveStatus={saveStatus}
      />

      {/* Action Bar */}
      <div className="bg-white border-b border-[#E2E8F0] px-6 py-2.5 flex items-center justify-between gap-4 shrink-0 shadow-xs">
        <div className="flex items-center gap-3">
          <span className="bg-[#FF5500]/10 text-[#FF5500] border border-[#FF5500]/20 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#FF5500]" /> Task {currentIndex + 1} of {questions.length}
          </span>
          <span className="text-xs text-[#64748B] font-medium hidden sm:inline">
            Environment: <strong className="text-[#0F172A]">Python 3 (Pandas / NumPy)</strong>
          </span>
          <span className="text-[11px] text-[#FF5500] bg-[#FFF8F5] border border-[#FF5500]/20 px-2.5 py-0.5 rounded-full hidden md:inline-flex items-center gap-1">
            <Clock className="w-3 h-3 text-[#FF5500]" /> AI Batch Evaluation Post-Round
          </span>
        </div>

        <div className="flex items-center gap-2">
          {!isMCQ && (
            <button
              onClick={handleResetToTemplate}
              className="px-3 py-1.5 rounded-lg bg-[#F0F3F6] hover:bg-[#E2E8F0] text-[#475569] text-xs font-medium flex items-center gap-1.5 border border-[#E2E8F0] transition-all cursor-pointer"
              title="Reset code to starting template"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset Template
            </button>
          )}
          <button
            onClick={() => setShowDatasetDrawer(!showDatasetDrawer)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              showDatasetDrawer
                ? 'bg-[#FF5500]/10 text-[#FF5500] border border-[#FF5500]/30 font-semibold'
                : 'bg-[#F0F3F6] text-[#64748B] border border-[#E2E8F0] hover:bg-[#E2E8F0]'
            }`}
          >
            <Table className="w-3.5 h-3.5" /> Schema Table
          </button>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
        {/* Left Side: Problem Statement & Dataset Schema (4 cols) */}
        <div className="lg:col-span-4 bg-white p-6 flex flex-col justify-between overflow-y-auto border-r border-[#E2E8F0]">
          {currentQ ? (
            <div className="space-y-5">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#FF5500] flex items-center gap-1.5">
                  <FileSpreadsheet className="w-3.5 h-3.5" /> Data Transformation Brief
                </span>
                <h2 className="text-base sm:text-lg font-bold text-[#0F172A] mt-1">
                  {currentQ.title}
                </h2>
                <div className="flex items-center gap-2 mt-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#F0F3F6] text-[#64748B] border border-[#E2E8F0] uppercase">
                    {currentQ.difficulty || 'Medium'}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#FF5500]/10 text-[#FF5500] border border-[#FF5500]/20">
                    {currentQ.marks || 10} Marks
                  </span>
                </div>
              </div>

              {/* Problem Content */}
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 text-xs text-[#475569] space-y-3 leading-relaxed">
                <div className="whitespace-pre-line font-sans text-xs text-[#475569]">
                  {currentQ.content}
                </div>
              </div>

              {/* Available DataFrames Pill */}
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 space-y-2">
                <h4 className="text-xs font-bold text-[#FF5500] uppercase tracking-wider flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5" /> Environment DataFrame Context
                </h4>
                <div className="text-[11px] font-mono text-[#64748B] space-y-1">
                  <p>• <strong className="text-[#0F172A]">sales_df</strong>: [order_id, customer_id, region, category, sales, discount, profit]</p>
                  <p>• Apply vectorized operations; avoid inefficient iterative loops.</p>
                </div>
              </div>

              {/* Question Navigation */}
              <div className="pt-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B] block mb-2">
                  Navigate Tasks:
                </span>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5">
                  {questions.map((q, idx) => {
                    const ans = codeMap[String(q.id)] || '';
                    const hasEdits = ans.trim().length > 0 && ans.trim() !== (q.code_template || '').trim();
                    return (
                      <button
                        key={q.id}
                        onClick={() => setCurrentIndex(idx)}
                        className={`py-1.5 rounded-lg text-xs font-mono border transition-all relative cursor-pointer ${
                          currentIndex === idx
                            ? 'bg-[#FF5500] text-white font-bold border-[#FF5500] shadow-sm ring-2 ring-[#FF5500]/30'
                            : 'bg-[#F0F3F6] text-[#64748B] border-[#E2E8F0] hover:bg-[#E2E8F0]'
                        }`}
                      >
                        Q{idx + 1}
                        {hasEdits && (
                          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}

          {/* Bottom Pagination Buttons */}
          <div className="pt-4 flex items-center justify-between border-t border-[#E2E8F0] mt-6">
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="px-3 py-1.5 rounded-lg bg-[#F0F3F6] hover:bg-[#E2E8F0] text-[#475569] text-xs font-mono flex items-center gap-1.5 border border-[#E2E8F0] transition-all disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <span className="text-xs text-[#64748B] font-mono">
              Task {currentIndex + 1} of {questions.length}
            </span>
            {currentIndex < questions.length - 1 ? (
              <button
                onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                className="px-3 py-1.5 rounded-lg bg-[#F0F3F6] hover:bg-[#E2E8F0] text-[#475569] text-xs font-mono flex items-center gap-1.5 border border-[#E2E8F0] transition-all disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => setShowSubmitModal(true)}
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-[#FF5500] hover:bg-[#E64D00] text-white text-xs font-bold shadow-sm flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmitting ? 'Submitting...' : 'Submit Round'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Side: Monaco Code Editor or MCQ Option Selector (8 cols) */}
        <div className="lg:col-span-8 flex flex-col h-full bg-[#F6F8FA]">
          <div className="px-4 py-2 bg-white border-b border-[#E2E8F0] flex items-center justify-between">
            <span className="text-xs font-mono text-[#64748B] flex items-center gap-1.5">
              <Code2 className="w-3.5 h-3.5 text-[#FF5500]" />
              {isMCQ ? 'Conceptual Objective Question' : 'Source Buffer: script.py'}
            </span>
            <span className="text-[11px] font-mono text-[#64748B]">
              Autosave: <span className="text-[#0F172A] font-medium">{saveStatus}</span>
            </span>
          </div>

          <div className="flex-1 relative flex flex-col overflow-hidden">
            {isMCQ ? (
              <div className="flex-1 p-8 overflow-y-auto space-y-4 bg-white">
                <h3 className="text-sm font-semibold text-[#0F172A]">Select the correct concept answer:</h3>
                <div className="space-y-3 max-w-xl">
                  {currentQ?.options?.map((opt) => {
                    const isSelected = currentCode.trim().toUpperCase() === opt.key.trim().toUpperCase();
                    return (
                      <button
                        key={opt.key}
                        onClick={() => handleResponseChange(opt.key)}
                        className={`w-full p-4 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#FF5500]/10 border-[#FF5500] text-[#0F172A] ring-1 ring-[#FF5500] shadow-xs'
                            : 'bg-white border-[#E2E8F0] text-[#475569] hover:bg-[#FFF8F5]'
                        }`}
                      >
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold uppercase font-mono ${
                          isSelected ? 'bg-[#FF5500] text-white' : 'bg-[#F0F3F6] text-[#64748B] border border-[#E2E8F0]'
                        }`}>
                          {opt.key}
                        </span>
                        <span className="text-xs pt-0.5 leading-relaxed">{opt.text}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <AssessmentCodeEditor
                value={currentCode}
                onChange={handleResponseChange}
                language="python"
              />
            )}

            {/* Optional DataFrame Schema Drawer */}
            {showDatasetDrawer && (
              <div className="h-44 border-t border-[#E2E8F0] bg-white flex flex-col">
                <div className="px-4 py-1.5 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between">
                  <span className="text-[11px] font-mono text-[#FF5500] font-bold flex items-center gap-1.5 uppercase">
                    <Table className="w-3 h-3" /> sales_df Sample Rows (First 5 records)
                  </span>
                  <button
                    onClick={() => setShowDatasetDrawer(false)}
                    className="text-[10px] text-[#64748B] hover:text-[#0F172A] cursor-pointer"
                  >
                    Hide Table
                  </button>
                </div>
                <div className="flex-1 overflow-x-auto p-2">
                  <table className="w-full text-left text-xs border border-[#E2E8F0]">
                    <thead className="bg-[#F8FAFC] text-[#475569] font-semibold uppercase text-[10px]">
                      <tr>
                        <th className="p-1.5 border border-[#E2E8F0]">order_id</th>
                        <th className="p-1.5 border border-[#E2E8F0]">customer_id</th>
                        <th className="p-1.5 border border-[#E2E8F0]">region</th>
                        <th className="p-1.5 border border-[#E2E8F0]">category</th>
                        <th className="p-1.5 border border-[#E2E8F0]">sales</th>
                        <th className="p-1.5 border border-[#E2E8F0]">discount</th>
                        <th className="p-1.5 border border-[#E2E8F0]">profit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0] text-[#475569]">
                      {mockDataset.map((row, idx) => (
                        <tr key={idx} className="hover:bg-[#F8FAFC] font-mono text-[11px]">
                          <td className="p-1.5 border border-[#E2E8F0] text-[#64748B]">{row.order_id}</td>
                          <td className="p-1.5 border border-[#E2E8F0]">{row.customer_id}</td>
                          <td className="p-1.5 border border-[#E2E8F0]">{row.region}</td>
                          <td className="p-1.5 border border-[#E2E8F0]">{row.category}</td>
                          <td className="p-1.5 border border-[#E2E8F0] text-emerald-600 font-semibold">${row.sales.toFixed(2)}</td>
                          <td className="p-1.5 border border-[#E2E8F0]">{(row.discount * 100).toFixed(0)}%</td>
                          <td className={`p-1.5 border border-[#E2E8F0] font-semibold ${row.profit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                            ${row.profit.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Status Bar */}
          <div className="px-5 py-3 bg-white border-t border-[#E2E8F0] flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2 text-[#64748B]">
              <Sparkles className="w-4 h-4 text-[#FF5500]" />
              <span>Automated Gemini Batch Grader: Vectorized Transformations & Data Aggregation</span>
            </div>
            <span className="text-[#64748B]">
              Attempted: <strong className="text-[#0F172A]">{attemptedCount}</strong> / {questions.length}
            </span>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/40 backdrop-blur-xs flex items-center justify-center p-4 font-sans">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#FF5500]/10 border border-[#FF5500]/20 text-[#FF5500]">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#0F172A]">Submit Python Analytics Round?</h3>
                <p className="text-xs text-[#64748B]">Ready to lock your scripts for AI batch grading?</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2 text-xs">
              <div className="flex justify-between text-[#475569]">
                <span>Total Tasks:</span>
                <span className="font-bold text-[#0F172A]">{questions.length}</span>
              </div>
              <div className="flex justify-between text-[#475569]">
                <span>Attempted Answers:</span>
                <span className="font-bold text-emerald-600">{attemptedCount}</span>
              </div>
              <div className="flex justify-between text-[#475569]">
                <span>Unattempted Tasks:</span>
                <span className="font-bold text-[#FF5500]">{questions.length - attemptedCount}</span>
              </div>
            </div>

            <p className="text-[11px] text-[#64748B] leading-relaxed">
              Once submitted, your responses will be locked. In accordance with zero-overhead execution policy, Python transformations are graded in scheduled batch cycles via Google Gemini AI.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#64748B] hover:text-[#0F172A] bg-[#F0F3F6] hover:bg-[#E2E8F0] border border-[#E2E8F0] transition cursor-pointer"
              >
                Continue Working
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#FF5500] hover:bg-[#E64D00] shadow-sm transition disabled:opacity-50 cursor-pointer"
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
