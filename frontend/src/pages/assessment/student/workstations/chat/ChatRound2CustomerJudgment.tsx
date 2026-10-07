import React, { useState, useEffect, useMemo } from 'react';
import { StartAttemptResponse, CandidateResult } from '../../../../../types/assessment';
import { TimerHeader } from '../../../../../components/assessment/TimerHeader';
import apiClient from '../../../../../api/client';
import {
  User,
  AlertTriangle,
  HeartHandshake,
  ShieldAlert,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Bookmark,
  Sparkles,
  MessageSquare,
  Flame,
  Frown,
  Meh,
  Smile,
  Zap,
  CheckCircle,
  HelpCircle,
  Clock,
  Compass,
  FileCheck
} from 'lucide-react';

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
    if (!window.confirm('Are you ready to submit your Customer Judgment & De-escalation responses?')) {
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
      alert(err?.response?.data?.detail || 'Submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const answeredCount = Object.keys(savedAnswers).length;

  return (
    <div className="h-screen max-h-screen bg-[#11110F] text-[#F8F5ED] flex flex-col font-sans overflow-hidden selection:bg-[#C9A227] selection:text-[#11110F]">
      {/* Top Timer Bar */}
      <TimerHeader
        attemptData={attemptData}
        onSubmit={handleSubmitAttempt}
        isSubmitting={isSubmitting}
      />

      {/* Subheader Toolbar */}
      <div className="border-b border-[#2A2824] bg-[#1C1B18] px-6 py-2.5 flex items-center justify-between text-xs shrink-0">
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 rounded bg-[#C9A227]/10 text-[#E3C766] font-semibold border border-[#C9A227]/30 flex items-center gap-1.5">
            <HeartHandshake className="w-3.5 h-3.5 text-[#C9A227]" />
            Customer Judgment & De-escalation Suite
          </span>
          <span className="text-[#9E988A] font-medium">
            Case {currentIndex + 1} of {questions.length}
          </span>
          <span className="text-[#6B665E]">|</span>
          <span className="text-[#9E988A]">
            {answeredCount} / {questions.length} Resolved
          </span>
          {isSaving && <span className="text-[#C9A227] font-mono text-[11px] animate-pulse">Saving...</span>}
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
            {reviewFlags[currentQ.id] ? 'Flagged for Review' : 'Flag Case'}
          </button>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="flex-1 grid grid-cols-12 overflow-hidden">
        {/* Left Pane: Customer Incident Dossier (5 cols) */}
        <div className="col-span-5 border-r border-[#2A2824] bg-[#1C1B18] p-6 overflow-y-auto space-y-6 flex flex-col justify-between">
          <div className="space-y-5">
            {/* Customer Case Badge */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-[#C9A227]/15 text-[#E3C766] border border-[#C9A227]/30">
                  CRITICAL INCIDENT CASE
                </span>
                <h2 className="text-base sm:text-lg font-bold text-[#F8F5ED] mt-2 leading-snug">
                  {currentQ?.title || `Scenario ${currentIndex + 1}`}
                </h2>
              </div>
            </div>

            {/* Customer Profile Dossier Card */}
            <div className="p-4 bg-[#141311] rounded-xl border border-[#2A2824] space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-[#2A2824]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#C9A227]/20 text-[#E3C766] border border-[#C9A227]/30 flex items-center justify-center font-bold text-xs">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#F8F5ED]">{scenarioDetails.customerName}</h4>
                    <p className="text-[11px] text-[#9E988A]">{scenarioDetails.market}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1C1B18] text-[#9E988A] border border-[#2A2824]">
                    {scenarioDetails.orderId}
                  </span>
                </div>
              </div>

              {/* Sentiment & Escalation Gauge */}
              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div className="p-2.5 bg-[#1C1B18] rounded-lg border border-[#2A2824]">
                  <span className="text-[10px] uppercase font-bold text-[#9E988A] flex items-center gap-1">
                    <Frown className="w-3 h-3 text-[#E3C766]" /> Customer Mood
                  </span>
                  <p className="text-xs font-bold text-[#F8F5ED] mt-0.5">{scenarioDetails.sentiment}</p>
                </div>
                <div className="p-2.5 bg-[#1C1B18] rounded-lg border border-[#2A2824]">
                  <span className="text-[10px] uppercase font-bold text-[#9E988A] flex items-center gap-1">
                    <Flame className="w-3 h-3 text-[#C9A227]" /> Escalation Tier
                  </span>
                  <p className="text-xs font-bold text-[#E3C766] mt-0.5">Tier 1 De-escalation</p>
                </div>
              </div>
            </div>

            {/* Customer Dialogue / Situation Prompt */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-[#9E988A] uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-[#C9A227]" /> Incident Context & Customer Transmission
              </span>
              <div className="p-4 bg-[#141311] rounded-xl border border-[#2A2824] text-xs text-[#D8D2C5] leading-relaxed whitespace-pre-wrap font-sans border-l-4 border-l-[#C9A227]">
                {scenarioDetails.text}
              </div>
            </div>

            {/* De-escalation Quality Rubric */}
            <div className="p-4 bg-[#141311] border border-[#2A2824] rounded-xl space-y-2 text-xs">
              <div className="flex items-center gap-2 text-[#C9A227] font-semibold uppercase tracking-wider text-[11px]">
                <Sparkles className="w-3.5 h-3.5 text-[#C9A227]" />
                Assessment Evaluation Criteria
              </div>
              <ul className="space-y-1.5 text-[#9E988A] text-[11px] list-disc list-inside">
                <li><strong className="text-[#F8F5ED]">Empathetic Ownership:</strong> Acknowledges customer pain without defensive excuses.</li>
                <li><strong className="text-[#F8F5ED]">Actionable Resolution:</strong> Immediate corrective action (refund/reship/re-route/investigate).</li>
                <li><strong className="text-[#F8F5ED]">Compliance & Security:</strong> Never violates security policies (passwords, PII, unauthorized promises).</li>
              </ul>
            </div>
          </div>

          {/* Case Navigation Matrix */}
          <div className="pt-4 border-t border-[#2A2824]">
            <p className="text-xs font-semibold text-[#9E988A] mb-2 font-mono uppercase tracking-wider">Case Navigator</p>
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

        {/* Right Pane: Action & Response Strategy Selection (7 cols) */}
        <div className="col-span-7 bg-[#141311] p-6 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#2A2824]">
              <h3 className="text-xs sm:text-sm font-bold text-[#F8F5ED] flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#C9A227]" />
                Select Optimal Post-Sales Support Response & Action
              </h3>
              <span className="text-xs text-[#9E988A] font-mono">
                {selectedOption ? '1 Option Selected' : 'Pending Selection'}
              </span>
            </div>

            {/* Options List */}
            <div className="space-y-3 pt-2">
              {options.map((opt: string, idx: number) => {
                const optNumber = String(idx + 1); // 1, 2, 3, 4
                const optAlpha = String.fromCharCode(65 + idx); // A, B, C, D
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
                        ? 'bg-[#C9A227]/15 border-[#C9A227] text-[#F8F5ED] shadow-lg ring-1 ring-[#C9A227]'
                        : 'bg-[#1C1B18] border-[#2A2824] text-[#D8D2C5] hover:border-[#C9A227]/40 hover:bg-[#24231F]'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-all ${
                        isSelected
                          ? 'bg-[#C9A227] text-[#11110F] shadow'
                          : 'bg-[#141311] text-[#9E988A] border border-[#2A2824]'
                      }`}
                    >
                      {optNumber}
                    </div>

                    <div className="space-y-1.5 flex-1 pt-0.5">
                      <p className="text-xs sm:text-sm leading-relaxed text-[#D8D2C5] font-sans font-medium">{opt}</p>
                      {isSelected && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#4ADE80] bg-[#4ADE80]/10 px-2 py-0.5 rounded border border-[#4ADE80]/20">
                          <CheckCircle className="w-3 h-3" /> Selected Strategic Action
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Action Bar */}
          <div className="pt-6 border-t border-[#2A2824] flex items-center justify-between">
            <button
              onClick={() => handleNavigate(currentIndex - 1)}
              disabled={currentIndex === 0}
              className="px-4 py-2 bg-[#141311] hover:bg-[#24231F] disabled:opacity-40 text-[#D8D2C5] rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-[#2A2824] transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-4 h-4" />
              Previous Case
            </button>

            <div className="flex items-center gap-3">
              {currentIndex < questions.length - 1 ? (
                <button
                  onClick={() => handleNavigate(currentIndex + 1)}
                  className="px-5 py-2 bg-[#C9A227] hover:bg-[#B89220] text-[#11110F] font-bold rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-md shadow-[#C9A227]/20 cursor-pointer"
                >
                  Next Case
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmitAttempt}
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-[#C9A227] hover:bg-[#B89220] text-[#11110F] rounded-lg text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-[#C9A227]/20 cursor-pointer"
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
