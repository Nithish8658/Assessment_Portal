import React, { useState, useEffect } from 'react';
import { CandidateResult } from '../../../types/assessment';
import { CompetencyRadar } from '../../../components/assessment/CompetencyRadar';
import { CheckCircle2, XCircle, Award, ArrowLeft, TrendingUp, AlertCircle, RefreshCw, Clock, Play } from 'lucide-react';
import apiClient from '../../../api/client';
import { formatDateTime } from '../../../utils/dateUtils';

interface CandidateResultsProps {
  result: CandidateResult;
  onBackToDashboard: () => void;
  onBeginAttempt2?: () => void;
}

const PENDING_POLL_INTERVAL_MS = 8000;
const PENDING_MAX_POLLS = 30; // ~4 minutes, then the student can retry manually

const isPendingResult = (r: CandidateResult) =>
  ['PENDING_BATCH', 'EVALUATING', 'FAILED'].includes(r.evaluation_status || '') ||
  ((r.status === 'SUBMITTED' || r.status === 'EVALUATING') && !r.evaluated_at);

export const CandidateResults: React.FC<CandidateResultsProps> = ({ result: initialResult, onBackToDashboard, onBeginAttempt2 }) => {
  const [result, setResult] = useState<CandidateResult>(initialResult);
  const [pollCount, setPollCount] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  const isPendingBatch = isPendingResult(result);
  const isPassed = result.passed;

  useEffect(() => {
    setResult(initialResult);
    setPollCount(0);
  }, [initialResult]);

  // AI-graded rounds: ask the server to evaluate now, then poll until the score is ready.
  useEffect(() => {
    if (!isPendingBatch || pollCount >= PENDING_MAX_POLLS) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setIsChecking(true);
      try {
        const res = await apiClient.post(`/assessment/attempts/${result.attempt_id}/evaluate`);
        if (!cancelled && res.data) setResult(res.data);
      } catch (err) {
        console.error('Evaluation status check failed', err);
      } finally {
        if (!cancelled) {
          setIsChecking(false);
          setPollCount((c) => c + 1);
        }
      }
    }, pollCount === 0 ? 0 : PENDING_POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [isPendingBatch, pollCount, result.attempt_id]);

  const pollingExhausted = isPendingBatch && pollCount >= PENDING_MAX_POLLS;

  if (isPendingBatch) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 font-sans">
        <button
          onClick={onBackToDashboard}
          className="inline-flex items-center space-x-1.5 text-xs font-mono text-[#9E988A] hover:text-[#F8F5ED] transition cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Track Dashboard</span>
        </button>

        <div className="bg-[#1C1B18] border border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-400">
                Round {result.round_number} Submission Confirmation
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-[#F8F5ED]">
                {result.round_title}
              </h1>
            </div>

            <div className="px-4 py-2 rounded-2xl border flex items-center space-x-2 font-mono text-xs font-bold bg-amber-500/15 text-amber-300 border-amber-500/30">
              <Clock className={`w-4 h-4 text-amber-400 ${pollingExhausted ? '' : 'animate-spin'}`} />
              <span>{pollingExhausted ? 'EVALUATION QUEUED' : 'AI EVALUATION IN PROGRESS'}</span>
            </div>
          </div>

          <div className="bg-[#141311] border border-[#2A2824] rounded-2xl p-5 space-y-3">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-[#C9A227]" />
              Submission Successfully Logged
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Your code for <strong className="text-white">{result.round_title}</strong> has been submitted and locked.
              It is being reviewed by an AI grader against the problem's test cases and rubric. This page updates automatically when your score is ready.
            </p>
            {pollingExhausted && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
                <p className="text-xs text-amber-300">
                  Evaluation is taking longer than usual. Your submission is safe and will be graded automatically; you can also check again now.
                </p>
                <button
                  onClick={() => setPollCount(0)}
                  disabled={isChecking}
                  className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#C9A227] text-[#11110F] text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
                  Check again
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-[#141311] rounded-2xl border border-[#2A2824] space-y-1">
              <span className="text-[10px] font-mono uppercase text-[#9E988A]">Evaluation Engine</span>
              <div className="text-sm font-bold text-[#F8F5ED]">Gemini AI Automated Grader</div>
              <p className="text-[11px] text-slate-400">Pointers, Memory, Edge Cases & Correctness</p>
            </div>

            <div className="p-4 bg-[#141311] rounded-2xl border border-[#2A2824] space-y-1">
              <span className="text-[10px] font-mono uppercase text-[#9E988A]">Typical Turnaround</span>
              <div className="text-sm font-bold text-amber-300">Under a minute</div>
              <p className="text-[11px] text-slate-400">Retried automatically if the grader is busy</p>
            </div>

            <div className="p-4 bg-[#141311] rounded-2xl border border-[#2A2824] space-y-1">
              <span className="text-[10px] font-mono uppercase text-[#9E988A]">Candidate Notice</span>
              <div className="text-sm font-bold text-emerald-400">No Action Required</div>
              <p className="text-[11px] text-slate-400">Scores auto-reflect upon completion</p>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={onBackToDashboard}
              className="w-full py-3 px-6 bg-[#C9A227] hover:bg-[#B89220] text-[#11110F] font-bold text-xs rounded-xl shadow-xl transition flex items-center justify-center space-x-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Assessment Dashboard</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6 font-sans">
      <button
        onClick={onBackToDashboard}
        className="inline-flex items-center space-x-1.5 text-xs font-mono text-[#9E988A] hover:text-[#F8F5ED] transition cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Return to Track Dashboard</span>
      </button>

      {/* Hero Performance Card */}
      <div
        className={`bg-[#1C1B18] border rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 ${
          isPassed ? 'border-[#4ADE80]/40' : 'border-red-500/40'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#9E988A]">
              Round {result.round_number} Performance Summary
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-[#F8F5ED]">
              {result.round_title}
            </h1>
          </div>

          <div className="flex items-center space-x-3">
            <div
              className={`px-4 py-2 rounded-2xl border flex items-center space-x-2 font-mono text-xs font-bold ${
                isPassed
                  ? 'bg-[#4ADE80]/15 text-[#4ADE80] border-[#4ADE80]/30'
                  : 'bg-red-500/15 text-red-400 border-red-500/30'
              }`}
            >
              {isPassed ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              <span>{isPassed ? 'ROUND PASSED' : 'BENCHMARK NOT MET'}</span>
            </div>

            <div className="px-3.5 py-2 rounded-2xl bg-[#141311] border border-[#2A2824] text-xs font-mono text-[#E3C766]">
              Readiness: <span className="font-bold text-[#F8F5ED]">{result.readiness_index}</span>
            </div>
          </div>
        </div>

        {/* Score Numbers Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-4 bg-[#141311] rounded-2xl border border-[#2A2824] space-y-1">
            <span className="text-[10px] font-mono uppercase text-[#9E988A]">Total Score</span>
            <div className="text-lg font-bold text-[#F8F5ED]">
              {result.total_score.toFixed(1)} / {result.max_score.toFixed(1)}
            </div>
          </div>

          <div className="p-4 bg-[#141311] rounded-2xl border border-[#2A2824] space-y-1">
            <span className="text-[10px] font-mono uppercase text-[#9E988A]">Percentage</span>
            <div className={`text-lg font-bold ${isPassed ? 'text-[#4ADE80]' : 'text-red-400'}`}>
              {result.percentage.toFixed(1)}%
            </div>
          </div>

          <div className="p-4 bg-[#141311] rounded-2xl border border-[#2A2824] space-y-1">
            <span className="text-[10px] font-mono uppercase text-[#9E988A]">Evaluated Date</span>
            <div className="text-xs font-mono font-semibold text-[#D8D2C5]">
              {result.evaluated_at ? formatDateTime(result.evaluated_at) : 'Just now'}
            </div>
          </div>

          <div className="p-4 bg-[#141311] rounded-2xl border border-[#2A2824] space-y-1">
            <span className="text-[10px] font-mono uppercase text-[#9E988A]">Status</span>
            <div className={`text-xs font-bold ${isPassed ? 'text-[#4ADE80]' : 'text-red-400'}`}>
              {isPassed ? 'Official Pass Record' : 'Re-Attempt Required'}
            </div>
          </div>
        </div>
      </div>

      {/* Status Diagnostic Banner */}
      {!isPassed && (
        <div className="bg-[#1C1B18] border border-amber-500/30 rounded-2xl p-4 flex items-center gap-3.5 shadow-lg">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-white">Assessment Benchmark Not Met ({result.percentage}% / 60% Passing Threshold)</h4>
            <p className="text-[11px] text-[#9E988A] mt-0.5 leading-relaxed">
              Review your competency radar profile below to identify hardware knowledge gaps. If a grace attempt is granted by your Class Tutor, you can retake this round from your dashboard.
            </p>
          </div>
        </div>
      )}

      {/* Competency Radar & Skill Spread */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-6 bg-[#1C1B18] border border-[#2A2824] rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center space-x-2 border-b border-[#2A2824] pb-2.5">
            <Award className="w-4 h-4 text-[#C9A227]" />
            <h3 className="text-xs font-bold text-[#F8F5ED]">Competency Radar & Skill Spread</h3>
          </div>
          <CompetencyRadar data={result.competencies} accentColor={result.domain_slug?.includes('iot') ? '#34D399' : '#C9A227'} />
        </div>

        <div className="lg:col-span-6 flex flex-col space-y-4">
          <div className="bg-[#1C1B18] border border-[#2A2824] rounded-2xl p-5 shadow-xl space-y-3 flex-1">
            <div className="flex items-center space-x-2 text-[#4ADE80]">
              <TrendingUp className="w-4 h-4" />
              <h3 className="text-xs font-bold text-[#F8F5ED]">Verified Candidate Strengths</h3>
            </div>
            {result.strengths && result.strengths.length > 0 ? (
              <ul className="space-y-1.5 text-xs text-[#D8D2C5] list-disc list-inside">
                {result.strengths.map((s, idx) => (
                  <li key={idx} className="leading-relaxed">{s}</li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-[#9E988A] italic">Demonstrated baseline hardware placement skills.</p>
            )}
          </div>

          <div className="bg-[#1C1B18] border border-[#2A2824] rounded-2xl p-5 shadow-xl space-y-3 flex-1">
            <div className="flex items-center space-x-2 text-[#EAB308]">
              <AlertCircle className="w-4 h-4" />
              <h3 className="text-xs font-bold text-[#F8F5ED]">Growth & Improvement Areas</h3>
            </div>
            {result.gaps && result.gaps.length > 0 ? (
              <ul className="space-y-1.5 text-xs text-[#9E988A] list-disc list-inside">
                {result.gaps.map((g, idx) => (
                  <li key={idx} className="leading-relaxed">{g}</li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-[#4ADE80] italic">No major competency gaps detected.</p>
            )}
          </div>
        </div>
      </div>

      <div className="pt-2">
        <button
          onClick={onBackToDashboard}
          className="w-full py-3 px-6 bg-[#C9A227] hover:bg-[#B89220] text-[#11110F] font-bold text-xs rounded-xl shadow-xl transition flex items-center justify-center space-x-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Assessment Dashboard</span>
        </button>
      </div>
    </div>
  );
};
