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
      <div className="p-12 text-center text-xs font-mono text-[#9E988A] bg-[#1C1B18] rounded-2xl border border-[#2A2824]">
        Loading track roadmap...
      </div>
    );
  }

  if (error || !domain) {
    return (
      <div className="p-6 text-center text-xs font-mono text-red-400 bg-red-500/10 rounded-2xl border border-red-500/30 space-y-3">
        <p>{error || 'Domain not found.'}</p>
        <button onClick={onBack} className="text-xs font-bold text-[#C9A227] underline">
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
        className="inline-flex items-center space-x-1.5 text-xs font-mono text-[#9E988A] hover:text-[#F8F5ED] transition cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Assessment Tracks</span>
      </button>

      {/* Domain Roadmap Hero */}
      <div className="bg-[#1C1B18] border border-[#2A2824] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-[#9E988A]">
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full bg-[#C9A227]/10 text-[#E3C766] border border-[#C9A227]/30">
              {rounds.length} Assessment Rounds
            </span>
            <span className="px-2.5 py-1 rounded-full bg-[#141311] border border-[#2A2824]">
              Track ID #{domain.id}
            </span>
            {isUpcoming ? (
              <span className="px-2.5 py-1 rounded-full bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30 animate-pulse">
                Starts in {domain.starts_in_minutes}m
              </span>
            ) : isExpired ? (
              <span className="px-2.5 py-1 rounded-full bg-red-500/15 text-red-400 border border-red-500/30">
                Session Expired
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full bg-[#4ADE80]/15 text-[#4ADE80] border border-[#4ADE80]/30">
                Live Session
              </span>
            )}
          </div>
          {domain.formatted_assigned_time && (
            <div className="flex items-center space-x-1.5 text-[#E3C766]">
              <Clock className="w-3.5 h-3.5" />
              <span>{domain.formatted_assigned_time}</span>
            </div>
          )}
        </div>

        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#F8F5ED]">
            {domain.title}
          </h1>
          <p className="text-xs text-[#9E988A] mt-1.5 max-w-2xl leading-relaxed">
            {domain.description || 'Industry standard multi-round assessment track.'}
          </p>
        </div>
      </div>

      {/* Rounds Sequential Stepper */}
      <div className="space-y-4">
        <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#9E988A]">
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
            const isInProgress = ['IN_PROGRESS', 'SUBMITTED', 'EVALUATING'].includes(r.status);
            const isGraceAttemptGranted = isFailed && r.reattempt_status === 'APPROVED';

            const pctVal = r.percentage != null ? r.percentage : (r.score != null && r.max_score ? (r.score / r.max_score) * 100 : r.score);

            return (
              <div
                key={r.id}
                className={`bg-[#1C1B18] border rounded-2xl p-5 shadow-lg space-y-4 transition ${
                  isPassed
                    ? 'border-[#4ADE80]/40 bg-[#1C1B18]'
                    : isInProgress
                    ? 'border-[#C9A227]/60 bg-[#1C1B18]'
                    : isFailed
                    ? 'border-red-500/30'
                    : isLocked
                    ? 'border-[#2A2824] opacity-60'
                    : 'border-[#2A2824]'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-mono font-bold text-[#C9A227] bg-[#C9A227]/10 px-2 py-0.5 rounded">
                        0{r.round_number}
                      </span>
                      <span className="text-[10px] font-mono text-[#9E988A] uppercase">
                        {r.round_type?.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-[#F8F5ED]">
                      {r.title}
                    </h3>
                  </div>

                  <div className="flex items-center space-x-2">
                    {isLocked ? (
                      <span className="text-[10px] font-mono text-[#6B665E] bg-[#141311] px-2.5 py-0.5 rounded border border-[#2A2824] flex items-center space-x-1">
                        <Lock className="w-3 h-3" />
                        <span>Prerequisite Locked</span>
                      </span>
                    ) : isPassed ? (
                      <span className="text-[10px] font-mono font-bold text-[#4ADE80] bg-[#4ADE80]/15 px-2.5 py-0.5 rounded border border-[#4ADE80]/30 flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Cleared ({pctVal != null ? pctVal.toFixed(0) : ''}%)</span>
                      </span>
                    ) : isGraceAttemptGranted ? (
                      <span className="text-[10px] font-mono font-bold text-[#E3C766] bg-[#E3C766]/15 px-2.5 py-0.5 rounded border border-[#E3C766]/30 flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-[#E3C766]" />
                        <span>Tutor Grace Attempt Granted</span>
                      </span>
                    ) : isFailed ? (
                      <span className="text-[10px] font-mono font-bold text-red-400 bg-red-500/15 px-2.5 py-0.5 rounded border border-red-500/30 flex items-center space-x-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>Not Cleared ({pctVal != null ? pctVal.toFixed(0) : ''}%)</span>
                      </span>
                    ) : isInProgress ? (
                      <span className="text-[10px] font-mono font-bold text-[#C9A227] bg-[#C9A227]/15 px-2.5 py-0.5 rounded border border-[#C9A227]/30">
                        In Progress
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-[#9E988A]">Ready to Start</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-4 text-[11px] font-mono text-[#9E988A] pt-1">
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3 h-3 text-[#C9A227]" />
                    <span>{r.duration_minutes} Mins</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Award className="w-3 h-3 text-[#C9A227]" />
                    <span>Passing: {r.passing_score}%</span>
                  </span>
                </div>

                <div className="pt-3 border-t border-[#2A2824] flex flex-wrap items-center justify-between gap-2">
                  {isLocked ? (
                    <span className="text-xs font-mono text-[#6B665E]">Complete previous round to unlock</span>
                  ) : isPassed ? (
                    <button
                      onClick={() => onViewResult(r.id, r.attempt_id)}
                      className="text-xs font-bold text-[#C9A227] hover:underline cursor-pointer"
                    >
                      View Detailed Performance & Radar
                    </button>
                  ) : isFailed && !isGraceAttemptGranted ? (
                    <>
                      <button
                        onClick={() => onViewResult(r.id, r.attempt_id)}
                        className="text-xs font-bold text-[#C9A227] hover:underline cursor-pointer"
                      >
                        View Detailed Performance & Radar
                      </button>
                      <span className="text-xs font-mono text-[#9E988A] bg-[#141311] px-3 py-1.5 rounded-xl border border-[#2A2824] ml-auto">
                        Awaiting Tutor Grace Attempt
                      </span>
                    </>
                  ) : (
                    <div className="ml-auto flex items-center space-x-2">
                      {isFailed && (
                        <button
                          onClick={() => onViewResult(r.id, r.attempt_id)}
                          className="text-xs font-bold text-[#9E988A] hover:text-[#F8F5ED] hover:underline cursor-pointer mr-2"
                        >
                          View Prior Result
                        </button>
                      )}
                      <button
                        onClick={() => onStartRound(r)}
                        disabled={isUpcoming || (isExpired && !isInProgress)}
                        className={`py-1.5 px-4 font-bold text-xs rounded-xl shadow-md transition flex items-center space-x-1.5 cursor-pointer ${
                          isUpcoming || (isExpired && !isInProgress)
                            ? 'bg-[#2A2824] text-[#6B665E] cursor-not-allowed'
                            : isInProgress
                            ? 'bg-[#C9A227] hover:bg-[#B89220] text-[#11110F]'
                            : 'bg-[#4ADE80] hover:bg-[#38C172] text-[#11110F]'
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
