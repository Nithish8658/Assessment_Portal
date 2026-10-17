import React, { useState, useEffect, useMemo } from 'react';
import { StartAttemptResponse, CandidateResult } from '../../../../../types/assessment';
import { TimerHeader } from '../../../../../components/assessment/TimerHeader';
import apiClient from '../../../../../api/client';
import {
  User,
  HeartHandshake,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Bookmark,
  Sparkles,
  MessageSquare,
  Flame,
  Frown,
  CheckCircle,
  Compass
} from 'lucide-react';
import { notify, confirmDialog } from '../../../../../components/ui/Dialogs';

interface WorkstationProps {
  attemptData: StartAttemptResponse;
  onSubmitComplete: (res: CandidateResult) => void;
}

export const ChatRound2CustomerJudgment: React.FC<WorkstationProps> = ({
  attemptData,
  onSubmitComplete
}) => {
  const questions = attemptData.questions || [];
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const currentQ = questions[currentIndex];

  const [savedAnswers, setSavedAnswers] = useState<Record<string, any>>(
    attemptData.saved_answers || {}
  );
  const [reviewFlags, setReviewFlags] = useState<Record<string, boolean>>({});
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Load saved answer on index change
  useEffect(() => {
    if (!currentQ) return;
    const existing = savedAnswers[currentQ.id];
    if (existing !== undefined && existing !== null) {
      setSelectedOption(String(existing));
    } else {
      setSelectedOption(null);
    }
  }, [currentIndex, currentQ?.id]);

  // Parse scenario prompt metadata if present (Customer name, order ID, issue)
  const scenarioDetails = useMemo(() => {
    if (!currentQ) return { text: '', customerName: 'Customer', orderId: '#US-XXXX', market: 'North America', sentiment: 'Frustrated' };
    const content = currentQ.content || (currentQ as any).candidate_content || '';
    
    // Extract customer info if matched
    const nameMatch = content.match(/Customer:\s*([^\n\(\,]+)/i);
    const orderMatch = content.match(/Order:\s*([^\n\(\,]+)/i);
    const statusMatch = content.match(/Status:\s*([^\n\(\,]+)/i);

    return {
      text: content,
      customerName: nameMatch ? nameMatch[1].trim() : 'Customer Contact',
      orderId: orderMatch ? orderMatch[1].trim() : '#INC-' + (currentIndex + 101),
      status: statusMatch ? statusMatch[1].trim() : 'Pending Response',
      market: content.includes('Canada') ? 'Canada (CA)' : content.includes('UK') ? 'United Kingdom (UK)' : 'United States (US)',
      sentiment: content.toLowerCase().includes('angry') || content.toLowerCase().includes('f***') || content.toLowerCase().includes('threat')
        ? 'High Escalation Risk'
        : 'Frustrated / High Priority'
    };
  }, [currentQ, currentIndex]);

  // Options list
  const options = useMemo(() => {
    if (!currentQ) return [];
    return (currentQ.options || (currentQ as any).options_json || []) as string[];
  }, [currentQ]);

  // Handle option selection
  const handleSelectOption = async (optKey: string) => {
    setSelectedOption(optKey);
    if (!currentQ) return;

    setIsSaving(true);
    try {
      const updated = {
        ...savedAnswers,
        [currentQ.id]: optKey
      };
      setSavedAnswers(updated);

      await apiClient.post(`/assessment/attempts/${attemptData.attempt_id}/save-answer`, {
        question_id: currentQ.id,
        answer: optKey
      });
    } catch (err) {
      console.error('Failed to save answer:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleBookmark = (qId: string) => {
    setReviewFlags((prev) => ({ ...prev, [qId]: !prev[qId] }));
  };

  const handleNavigate = (idx: number) => {
    if (idx >= 0 && idx < questions.length) {
      setCurrentIndex(idx);
    }
  };

  const handleSubmitAttempt = async () => {
    if (!(await confirmDialog('Are you ready to submit your Customer Judgment & De-escalation responses?'))) {
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await apiClient.post<CandidateResult>(
        `/assessment/attempts/${attemptData.attempt_id}/submit`
      );
      onSubmitComplete(res.data);
    } catch (err: any) {
      console.error('Submission failed:', err);
      notify(err?.response?.data?.detail || 'Submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const answeredCount = Object.keys(savedAnswers).length;

  return (
    <div className="h-screen max-h-screen bg-[#F6F8FA] text-[#0F172A] flex flex-col font-sans overflow-hidden selection:bg-[#FF5500] selection:text-white">
      {/* Top Timer Bar */}
      <TimerHeader
        attemptData={attemptData}
        onSubmit={handleSubmitAttempt}
        isSubmitting={isSubmitting}
      />

      {/* Subheader Toolbar */}
      <div className="border-b border-[#E2E8F0] bg-white px-6 py-2.5 flex items-center justify-between text-xs shrink-0 shadow-xs">
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 rounded bg-[#FF5500]/10 text-[#FF5500] font-semibold border border-[#FF5500]/20 flex items-center gap-1.5">
            <HeartHandshake className="w-3.5 h-3.5 text-[#FF5500]" />
            Customer Judgment & De-escalation Suite
          </span>
          <span className="text-[#64748B] font-medium">
            Case {currentIndex + 1} of {questions.length}
          </span>
          <span className="text-[#CBD5E1]">|</span>
          <span className="text-[#64748B]">
            {answeredCount} / {questions.length} Resolved
          </span>
          {isSaving && <span className="text-[#FF5500] font-mono text-[11px] animate-pulse">Saving...</span>}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => toggleBookmark(String(currentQ.id))}
            className={`px-3 py-1 rounded font-medium transition-all flex items-center gap-1.5 border cursor-pointer ${
              reviewFlags[currentQ.id]
                ? 'bg-amber-50 border-amber-300 text-amber-700 font-bold'
                : 'bg-[#F0F3F6] border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            {reviewFlags[currentQ.id] ? 'Flagged for Review' : 'Flag Case'}
          </button>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="flex-1 grid grid-cols-12 overflow-hidden">
        {/* Left Pane: Customer Incident Dossier (5 cols) */}
        <div className="col-span-5 border-r border-[#E2E8F0] bg-white p-6 overflow-y-auto space-y-6 flex flex-col justify-between">
          <div className="space-y-5">
            {/* Customer Case Badge */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-[#FF5500]/10 text-[#FF5500] border border-[#FF5500]/20">
                  CRITICAL INCIDENT CASE
                </span>
                <h2 className="text-base sm:text-lg font-bold text-[#0F172A] mt-2 leading-snug">
                  {currentQ?.title || `Scenario ${currentIndex + 1}`}
                </h2>
              </div>
            </div>

            {/* Customer Profile Dossier Card */}
            <div className="p-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#FF5500]/10 text-[#FF5500] border border-[#FF5500]/20 flex items-center justify-center font-bold text-xs">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#0F172A]">{scenarioDetails.customerName}</h4>
                    <p className="text-[11px] text-[#64748B]">{scenarioDetails.market}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white text-[#475569] border border-[#E2E8F0]">
                    {scenarioDetails.orderId}
                  </span>
                </div>
              </div>

              {/* Sentiment & Escalation Gauge */}
              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div className="p-2.5 bg-white rounded-lg border border-[#E2E8F0]">
                  <span className="text-[10px] uppercase font-bold text-[#64748B] flex items-center gap-1">
                    <Frown className="w-3 h-3 text-amber-500" /> Customer Mood
                  </span>
                  <p className="text-xs font-bold text-[#0F172A] mt-0.5">{scenarioDetails.sentiment}</p>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-[#E2E8F0]">
                  <span className="text-[10px] uppercase font-bold text-[#64748B] flex items-center gap-1">
                    <Flame className="w-3 h-3 text-[#FF5500]" /> Escalation Tier
                  </span>
                  <p className="text-xs font-bold text-[#FF5500] mt-0.5">Tier 1 De-escalation</p>
                </div>
              </div>
            </div>

            {/* Customer Dialogue / Situation Prompt */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-[#FF5500]" /> Incident Context & Customer Transmission
              </span>
              <div className="p-4 bg-[#F0F3F6] rounded-xl border border-[#E2E8F0] text-xs text-[#475569] leading-relaxed whitespace-pre-wrap font-sans border-l-4 border-l-[#FF5500]">
                {scenarioDetails.text}
              </div>
            </div>

            {/* De-escalation Quality Rubric */}
            <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-2 text-xs">
              <div className="flex items-center gap-2 text-[#FF5500] font-semibold uppercase tracking-wider text-[11px]">
                <Sparkles className="w-3.5 h-3.5 text-[#FF5500]" />
                Assessment Evaluation Criteria
              </div>
              <ul className="space-y-1.5 text-[#64748B] text-[11px] list-disc list-inside">
                <li><strong className="text-[#0F172A]">Empathetic Ownership:</strong> Acknowledges customer pain without defensive excuses.</li>
                <li><strong className="text-[#0F172A]">Actionable Resolution:</strong> Immediate corrective action (refund/reship/re-route/investigate).</li>
                <li><strong className="text-[#0F172A]">Compliance & Security:</strong> Never violates security policies (passwords, PII, unauthorized promises).</li>
              </ul>
            </div>
          </div>

          {/* Case Navigation Matrix */}
          <div className="pt-4 border-t border-[#E2E8F0]">
            <p className="text-xs font-semibold text-[#64748B] mb-2 font-mono uppercase tracking-wider">Case Navigator</p>
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
                        ? 'bg-[#FF5500] text-white border-[#FF5500] shadow-sm ring-2 ring-[#FF5500]/30'
                        : isAns
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : 'bg-[#F0F3F6] text-[#64748B] border-[#E2E8F0] hover:bg-[#E2E8F0]'
                    }`}
                  >
                    {idx + 1}
                    {isBmk && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Pane: Action & Response Strategy Selection (7 cols) */}
        <div className="col-span-7 bg-[#F6F8FA] p-6 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <h3 className="text-xs sm:text-sm font-bold text-[#0F172A] flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#FF5500]" />
                Select Optimal Post-Sales Support Response & Action
              </h3>
              <span className="text-xs text-[#64748B] font-mono">
                {selectedOption ? '1 Option Selected' : 'Pending Selection'}
              </span>
            </div>

            {/* Options List */}
            <div className="space-y-3 pt-2">
              {options.map((opt: string, idx: number) => {
                const optNumber = String(idx + 1);
                const optAlpha = String.fromCharCode(65 + idx);
                const isSelected =
                  selectedOption === optNumber ||
                  selectedOption === optAlpha ||
                  selectedOption === opt;

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(optNumber)}
                    className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-4 cursor-pointer ${
                      isSelected
                        ? 'bg-[#FF5500]/10 border-[#FF5500] text-[#0F172A] shadow-sm ring-1 ring-[#FF5500]'
                        : 'bg-white border-[#E2E8F0] text-[#475569] hover:border-[#FF5500]/40 hover:bg-[#FFF8F5]'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-all ${
                        isSelected
                          ? 'bg-[#FF5500] text-white shadow'
                          : 'bg-[#F0F3F6] text-[#64748B] border border-[#E2E8F0]'
                      }`}
                    >
                      {optNumber}
                    </div>

                    <div className="space-y-1.5 flex-1 pt-0.5">
                      <p className="text-xs sm:text-sm leading-relaxed text-[#0F172A] font-sans font-medium">{opt}</p>
                      {isSelected && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <CheckCircle className="w-3 h-3 text-emerald-600" /> Selected Strategic Action
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Action Bar */}
          <div className="pt-6 border-t border-[#E2E8F0] flex items-center justify-between">
            <button
              onClick={() => handleNavigate(currentIndex - 1)}
              disabled={currentIndex === 0}
              className="px-4 py-2 bg-white hover:bg-[#F0F3F6] disabled:opacity-40 text-[#475569] rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-[#E2E8F0] transition-all cursor-pointer disabled:cursor-not-allowed shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              Previous Case
            </button>

            <div className="flex items-center gap-3">
              {currentIndex < questions.length - 1 ? (
                <button
                  onClick={() => handleNavigate(currentIndex + 1)}
                  className="px-5 py-2 bg-[#FF5500] hover:bg-[#E64D00] text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                >
                  Next Case
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmitAttempt}
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-[#FF5500] hover:bg-[#E64D00] text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-all shadow-md cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isSubmitting ? 'Evaluating Submission...' : 'Submit Round'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
