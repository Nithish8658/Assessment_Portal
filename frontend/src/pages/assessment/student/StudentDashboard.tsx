import React, { useState, useEffect } from 'react';
import { DomainDetail, RoundSummary } from '../../../types/assessment';
import apiClient from '../../../api/client';
import { ArrowLeft, Play, Lock, CheckCircle2, AlertCircle, Clock, Award, Shield, RefreshCw } from 'lucide-react';
import { formatDateTime } from '../../../utils/dateUtils';

interface StudentDashboardProps {
  domainSlug: string;
  allocationId?: number | null;
  onBack: () => void;
  onStartRound: (round: RoundSummary) => void;
  onViewResult: (roundId: number, attemptId?: number | null) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  domainSlug,
  allocationId,
  onBack,
  onStartRound,
  onViewResult
}) => {
  const [domain, setDomain] = useState<DomainDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDomainDetail();
  }, [domainSlug, allocationId]);

  const fetchDomainDetail = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const url = `/assessment/domains/${domainSlug}${allocationId ? `?allocation_id=${allocationId}` : ''}`;
      const res = await apiClient.get(url);
      setDomain(res.data);
    } catch (err: any) {
      console.error('Failed to load domain detail', err);
      setError(err.response?.data?.detail || 'Failed to load domain details.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center text-xs font-mono text-[#64748B] bg-white rounded-2xl border border-[#E2E8F0] shadow-sm">
        Loading track roadmap...
      </div>
    );
  }

  if (error || !domain) {
    return (
      <div className="p-6 text-center text-xs font-mono text-red-600 bg-red-50 rounded-2xl border border-red-200 space-y-3">
        <p>{error || 'Domain not found.'}</p>
        <button onClick={onBack} className="text-xs font-bold text-[#FF5500] hover:text-[#E64D00] underline">
          Return to Tracks Catalog
        </button>
      </div>
    );
  }

  const rounds = domain.rounds || [];
  const isUpcoming = domain.schedule_status === 'UPCOMING';
  const isExpired = domain.schedule_status === 'EXPIRED';

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 sm:p-6 font-sans">
      <button
        onClick={onBack}
        className="inline-flex items-center space-x-1.5 text-xs font-mono text-[#64748B] hover:text-[#0F172A] transition cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Assessment Tracks</span>
      </button>

      {/* Domain Roadmap Hero */}
      <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-[#64748B]">
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full bg-[#FF5500]/10 text-[#FF5500] border border-[#FF5500]/20 font-semibold">
              {rounds.length} Assessment Rounds
            </span>
            <span className="px-2.5 py-1 rounded-full bg-[#F0F3F6] border border-[#E2E8F0] text-[#475569]">
              Track ID #{domain.id}
            </span>
            {isUpcoming ? (
              <span className="px-2.5 py-1 rounded-full bg-[#F59E0B]/15 text-[#D97706] border border-[#F59E0B]/30 animate-pulse font-semibold">
                Starts in {domain.starts_in_minutes}m
              </span>
            ) : isExpired ? (
              <span className="px-2.5 py-1 rounded-full bg-red-50 text-red-600 border border-red-200 font-semibold">
                Session Expired
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                Live Session
              </span>
            )}
          </div>
          {domain.formatted_assigned_time && (
            <div className="flex items-center space-x-1.5 text-[#FF5500] font-medium">
              <Clock className="w-3.5 h-3.5" />
              <span>{domain.formatted_assigned_time}</span>
            </div>
          )}
        </div>

        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A]">
            {domain.title}
          </h1>
          <p className="text-xs text-[#64748B] mt-1.5 max-w-2xl leading-relaxed">
            {domain.description || 'Industry standard multi-round assessment track.'}
          </p>
        </div>
      </div>

      {/* Rounds Sequential Stepper */}
      <div className="space-y-4">
        <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#64748B]">
          Assessment Evaluation Roadmap ({rounds.length} Rounds)
        </h2>

        <div className="space-y-3">
          {rounds.map((r, index) => {
            const isFirst = index === 0;
            const prevRound = isFirst ? null : rounds[index - 1];
            const isPrereqMet = isFirst || (prevRound && prevRound.status === 'EVALUATED' && prevRound.passed);
            const isLocked = !isPrereqMet;

            const isPassed = r.status === 'EVALUATED' && r.passed;
            const isFailed = r.status === 'EVALUATED' && !r.passed;
            const isInProgress = r.status === 'IN_PROGRESS';
            // Submitted AI-graded rounds wait for evaluation; they are not resumable.
            const isEvaluating = ['SUBMITTED', 'EVALUATING'].includes(r.status);
            const isGraceAttemptGranted = isFailed && r.reattempt_status === 'APPROVED';

            const pctVal = r.percentage != null ? r.percentage : (r.score != null && r.max_score ? (r.score / r.max_score) * 100 : r.score);

            return (
              <div
                key={r.id}
                className={`bg-white border rounded-2xl p-5 shadow-sm space-y-4 transition ${
                  isPassed
                    ? 'border-emerald-300 bg-emerald-50/20'
                    : isInProgress
                    ? 'border-[#FF5500]/60 ring-1 ring-[#FF5500]/20'
                    : isFailed
                    ? 'border-red-200 bg-red-50/20'
                    : isLocked
                    ? 'border-[#E2E8F0] opacity-60 bg-[#F8FAFC]'
                    : 'border-[#E2E8F0]'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-mono font-bold text-[#FF5500] bg-[#FF5500]/10 px-2 py-0.5 rounded">
                        0{r.round_number}
                      </span>
                      <span className="text-[10px] font-mono text-[#64748B] uppercase">
                        {r.round_type?.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-[#0F172A]">
                      {r.title}
                    </h3>
                  </div>

                  <div className="flex items-center space-x-2">
                    {isLocked ? (
                      <span className="text-[10px] font-mono text-[#94A3B8] bg-[#F0F3F6] px-2.5 py-0.5 rounded border border-[#E2E8F0] flex items-center space-x-1">
                        <Lock className="w-3 h-3" />
                        <span>Prerequisite Locked</span>
                      </span>
                    ) : isPassed ? (
                      <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200 flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Cleared ({pctVal != null ? pctVal.toFixed(0) : ''}%)</span>
                      </span>
                    ) : isGraceAttemptGranted ? (
                      <span className="text-[10px] font-mono font-bold text-[#FF5500] bg-[#FF5500]/10 px-2.5 py-0.5 rounded border border-[#FF5500]/20 flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-[#FF5500]" />
                        <span>Tutor Grace Attempt Granted</span>
                      </span>
                    ) : isFailed ? (
                      <span className="text-[10px] font-mono font-bold text-red-600 bg-red-50 px-2.5 py-0.5 rounded border border-red-200 flex items-center space-x-1">
                        <AlertCircle className="w-3 h-3 text-red-500" />
                        <span>Not Cleared ({pctVal != null ? pctVal.toFixed(0) : ''}%)</span>
                      </span>
                    ) : isEvaluating ? (
                      <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200 flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-amber-600" />
                        <span>Submitted · Evaluating</span>
                      </span>
                    ) : isInProgress ? (
                      <span className="text-[10px] font-mono font-bold text-[#FF5500] bg-[#FF5500]/10 px-2.5 py-0.5 rounded border border-[#FF5500]/30">
                        In Progress
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-[#64748B]">Ready to Start</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-4 text-[11px] font-mono text-[#64748B] pt-1">
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3 h-3 text-[#FF5500]" />
                    <span>{r.duration_minutes} Mins</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Award className="w-3 h-3 text-[#FF5500]" />
                    <span>Passing: {r.passing_score}%</span>
                  </span>
                </div>

                <div className="pt-3 border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-2">
                  {isLocked ? (
                    <span className="text-xs font-mono text-[#94A3B8]">
                      {/* The server unlocks a round only after the previous one is passed */}
                      {prevRound && prevRound.status === 'EVALUATED' && !prevRound.passed
                        ? `Round ${prevRound.round_number} scored ${prevRound.percentage != null ? Math.round(prevRound.percentage) : 0}%, below its ${prevRound.passing_score}% pass mark. Ask your tutor for a reattempt to unlock this round.`
                        : `Pass Round ${prevRound?.round_number} (${prevRound?.passing_score}% or more) to unlock`}
                    </span>
                  ) : isEvaluating ? (
                    <button
                      onClick={() => onViewResult(r.id, r.attempt_id)}
                      className="ml-auto text-xs font-bold text-[#FF5500] hover:text-[#E64D00] hover:underline cursor-pointer"
                    >
                      View Evaluation Status
                    </button>
                  ) : isPassed ? (
                    <button
                      onClick={() => onViewResult(r.id, r.attempt_id)}
                      className="text-xs font-bold text-[#FF5500] hover:text-[#E64D00] hover:underline cursor-pointer"
                    >
                      View Detailed Performance & Radar
                    </button>
                  ) : isFailed && !isGraceAttemptGranted ? (
                    <>
                      <button
                        onClick={() => onViewResult(r.id, r.attempt_id)}
                        className="text-xs font-bold text-[#FF5500] hover:text-[#E64D00] hover:underline cursor-pointer"
                      >
                        View Detailed Performance & Radar
                      </button>
                      <span className="text-xs font-mono text-[#64748B] bg-[#F0F3F6] px-3 py-1.5 rounded-xl border border-[#E2E8F0] ml-auto">
                        Awaiting Tutor Grace Attempt
                      </span>
                    </>
                  ) : (
                    <div className="ml-auto flex items-center space-x-2">
                      {isFailed && (
                        <button
                          onClick={() => onViewResult(r.id, r.attempt_id)}
                          className="text-xs font-bold text-[#64748B] hover:text-[#0F172A] hover:underline cursor-pointer mr-2"
                        >
                          View Prior Result
                        </button>
                      )}
                      <button
                        onClick={() => onStartRound(r)}
                        disabled={isUpcoming || (isExpired && !isInProgress)}
                        className={`py-1.5 px-4 font-bold text-xs rounded-xl shadow-sm transition flex items-center space-x-1.5 cursor-pointer ${
                          isUpcoming || (isExpired && !isInProgress)
                            ? 'bg-[#E2E8F0] text-[#94A3B8] cursor-not-allowed'
                            : 'bg-[#FF5500] hover:bg-[#E64D00] text-white active:scale-95'
                        }`}
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>{isInProgress ? 'Resume Round' : 'Start Round'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
