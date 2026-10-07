import React, { useState, useEffect } from 'react';
import { StartAttemptResponse, CandidateResult, RoundSummary } from '../../../types/assessment';
import { WorkstationDispatcher } from './workstations/WorkstationDispatcher';
import { FullscreenGuard } from '../../../components/assessment/FullscreenGuard';
import { SecurityGuard } from '../../../components/assessment/SecurityGuard';
import apiClient from '../../../api/client';
import { AssessmentExpiryContext } from '../../../components/assessment/TimerHeader';

interface AssessmentRunnerProps {
  round: RoundSummary;
  allocationId?: number | null;
  onFinish: (result: CandidateResult) => void;
  onCancel: () => void;
}

export const AssessmentRunner: React.FC<AssessmentRunnerProps> = ({ round, allocationId, onFinish, onCancel }) => {
  const [attemptData, setAttemptData] = useState<StartAttemptResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hasExpired, setHasExpired] = useState(false);
  const [expiryError, setExpiryError] = useState<string | null>(null);
  const finalizingRef = React.useRef(false);
  const expiryRetriesRef = React.useRef(0);
  const retryTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = React.useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    };
  }, []);

  const finalizeExpiredAttempt = async () => {
    if (!attemptData || finalizingRef.current) return;
    finalizingRef.current = true;
    setHasExpired(true);
    setExpiryError(null);
    try {
      // At expiry, the server grades only answers already accepted before its deadline.
      const res = await apiClient.post('/assessment/attempts/submit', { attempt_id: attemptData.attempt_id });
      if (mountedRef.current) onFinish(res.data);
    } catch {
      if (!mountedRef.current) return;
      setExpiryError('Time has ended. Your saved answers are locked. Result processing has not completed yet.');
      if (expiryRetriesRef.current++ < 3) {
        retryTimerRef.current = setTimeout(() => void finalizeExpiredAttempt(), 5000);
      }
    } finally {
      finalizingRef.current = false;
    }
  };

  useEffect(() => {
    // 1. Reset scroll to top instantly to prevent header from jumping up
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    // 2. Lock body overflow so underlying page never drifts
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  useEffect(() => {
    setHasExpired(false);
    setExpiryError(null);
    finalizingRef.current = false;
    expiryRetriesRef.current = 0;
    startOrResumeAttempt();
  }, [round.id, allocationId]);

  const startOrResumeAttempt = async () => {
    setIsLoading(true);
    setError(null);
    setHasExpired(false);
    setExpiryError(null);
    finalizingRef.current = false;
    try {
      const res = await apiClient.post('/assessment/attempts/start', {
        round_id: round.id,
        allocation_id: allocationId || undefined
      });
      setAttemptData({ ...res.data, client_received_at: Date.now(), client_received_monotonic: performance.now() });
      // Guarantee scroll position stays at absolute top when questions load
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    } catch (err: any) {
      console.error('Failed to start assessment attempt', err);
      setError(err.response?.data?.detail || 'Failed to initialize assessment session.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-[#11110F] flex items-center justify-center p-6 text-center text-xs font-mono text-[#9E988A]">
        <div className="space-y-3">
          <div className="w-10 h-10 border-2 border-[#C9A227] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p>Securing isolated assessment environment...</p>
        </div>
      </div>
    );
  }

  if (error || !attemptData) {
    return (
      <div className="fixed inset-0 z-50 bg-[#11110F] flex items-center justify-center p-6 text-center font-sans">
        <div className="max-w-md w-full bg-[#1C1B18] border border-red-500/40 rounded-2xl p-6 shadow-2xl space-y-4">
          <h2 className="text-sm font-bold text-red-400">Failed to Start Assessment</h2>
          <p className="text-xs text-[#9E988A]">{error || 'Session could not be initialized.'}</p>
          <button
            onClick={onCancel}
            className="w-full py-2 px-4 bg-[#141311] hover:bg-[#24231F] text-xs font-bold text-[#F8F5ED] rounded-xl border border-[#2A2824] cursor-pointer"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#11110F] flex flex-col overflow-y-auto select-none font-sans">
      <FullscreenGuard isActive={true}>
        <SecurityGuard isActive={true}>
          <AssessmentExpiryContext.Provider value={() => void finalizeExpiredAttempt()}>
            <div inert={hasExpired}>
              <WorkstationDispatcher
                key={`${round.id}_${attemptData.attempt_id}`}
                attemptData={attemptData}
                onSubmitComplete={(res) => onFinish(res)}
              />
            </div>
            {hasExpired && (
              <div className="fixed inset-0 z-[100000] bg-[#11110F]/95 flex items-center justify-center p-6 text-center">
                <div className="max-w-md space-y-4 text-[#F8F5ED]">
                  <h2 className="font-bold">Round time has ended</h2>
                  <p className="text-sm text-[#9E988A]">{expiryError || 'Submitting your saved answers and preparing your result…'}</p>
                  {expiryError && <button onClick={() => void finalizeExpiredAttempt()} className="rounded-lg bg-[#C9A227] px-4 py-2 text-[#11110F]">Retry result processing</button>}
                </div>
              </div>
            )}
          </AssessmentExpiryContext.Provider>
        </SecurityGuard>
      </FullscreenGuard>
    </div>
  );
};
