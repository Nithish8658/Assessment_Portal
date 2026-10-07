import React, { useEffect, useState } from 'react';
import { Clock, Send, Shield } from 'lucide-react';
import type { StartAttemptResponse } from '../../types/assessment';
import apiClient from '../../api/client';
import { createDeadlineClock, remainingSeconds, isLowTime as lowTime } from '../../utils/assessmentTiming';

export const AssessmentExpiryContext = React.createContext<(() => void) | null>(null);

interface TimerHeaderProps {
  attemptData: StartAttemptResponse;
  onSubmit: () => void;
  isSubmitting?: boolean;
  saveStatus?: string;
}

export const TimerHeader: React.FC<TimerHeaderProps> = ({
  attemptData,
  onSubmit,
  isSubmitting = false,
  saveStatus,
}) => {
  const { round_title: roundTitle, round_number: roundNumber } = attemptData;
  const onTimeExpired = React.useContext(AssessmentExpiryContext);

  const initClock = () => createDeadlineClock(
    attemptData,
    attemptData.client_received_monotonic ?? performance.now(),
    attemptData.client_received_at ?? Date.now()
  );

  const clockRef = React.useRef(initClock());
  const [secondsRemaining, setSecondsRemaining] = useState(() => remainingSeconds(clockRef.current, performance.now(), Date.now()));
  const onTimeExpiredRef = React.useRef(onTimeExpired);
  const hasExpiredRef = React.useRef(false);

  useEffect(() => {
    onTimeExpiredRef.current = onTimeExpired;
  }, [onTimeExpired]);

  // Synchronize clock whenever the attempt changes (e.g. progressing to the next round)
  useEffect(() => {
    clockRef.current = initClock();
    const currentRemaining = remainingSeconds(clockRef.current, performance.now(), Date.now());
    setSecondsRemaining(currentRemaining);
    hasExpiredRef.current = currentRemaining === 0;
  }, [attemptData.attempt_id, attemptData.expires_at, attemptData.time_remaining_seconds]);

  useEffect(() => {
    let disposed = false;
    let syncing = false;
    const tick = () => {
      const seconds = remainingSeconds(clockRef.current, performance.now(), Date.now());
      setSecondsRemaining(seconds);
      if (seconds === 0 && !hasExpiredRef.current) {
        hasExpiredRef.current = true;
        onTimeExpiredRef.current?.();
      }
    };
    const sync = async () => {
      if (syncing || hasExpiredRef.current) return;
      syncing = true;
      try {
        const res = await apiClient.get(`/assessment/attempts/${attemptData.attempt_id}/timing`);
        if (!disposed && res.data) {
          clockRef.current = createDeadlineClock(res.data, performance.now(), Date.now());
          tick();
        }
      } catch {
        // Keep enforcing the last server deadline during connection loss.
      } finally {
        syncing = false;
      }
    };
    const handleVisibility = () => { tick(); void sync(); };
    tick(); // A resumed attempt with zero time must also finalize.
    const interval = setInterval(tick, 250);
    const synchronization = setInterval(sync, 15000);
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleVisibility);
    return () => {
      disposed = true;
      clearInterval(interval);
      clearInterval(synchronization);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleVisibility);
    };
  }, [attemptData.attempt_id]);

  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isLowTime = lowTime(secondsRemaining, attemptData.duration_minutes);

  return (
    <header className="bg-[#1C1B18] border-b border-[#2A2824] px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-50 shadow-xl w-full shrink-0">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-xl bg-[#24231F] border border-[#2A2824] flex items-center justify-center text-[#C9A227]">
          <Shield className="w-4 h-4" />
        </div>
        <div>
          <span className="text-[10px] font-mono uppercase bg-[#C9A227]/10 text-[#E3C766] border border-[#C9A227]/25 px-2 py-0.5 rounded">
            Round {roundNumber}
          </span>
          <h1 className="text-sm font-bold text-[#F8F5ED] truncate max-w-xs sm:max-w-md mt-0.5">
            {roundTitle}
          </h1>
        </div>
      </div>

      <div className="flex items-center space-x-3 sm:space-x-4">
        {saveStatus && <span className="text-xs text-[#9E988A]">{saveStatus}</span>}
        <div
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border font-mono text-xs font-bold transition ${
            isLowTime
              ? 'bg-[#EF4444]/10 border-red-500/40 text-[#EF4444] animate-pulse'
              : 'bg-[#141311] border-[#2A2824] text-[#D8D2C5]'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>{formatTime(secondsRemaining)}</span>
        </div>

        <button
          onClick={onSubmit}
          disabled={isSubmitting || secondsRemaining === 0}
          className="py-1.5 px-3 sm:px-4 bg-[#C9A227] hover:bg-[#B89220] disabled:opacity-50 text-[#11110F] font-bold text-xs rounded-xl shadow-md transition flex items-center space-x-1.5 cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
          <span>{isSubmitting ? 'Submitting...' : 'Submit Round'}</span>
        </button>
      </div>
    </header>
  );
};
