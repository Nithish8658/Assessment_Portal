import type { StartAttemptResponse } from '../types/assessment';

export type TimingData = Pick<StartAttemptResponse, 'expires_at' | 'server_time' | 'time_remaining_seconds' | 'duration_minutes'>;
export type DeadlineClock = { remainingMs: number; monotonicMs: number; wallMs: number };

export function serverTimestamp(value: string): number {
  if (!value) return Date.now();
  return Date.parse(/(?:Z|[+-]\d\d:\d\d)$/i.test(value) ? value : `${value}Z`);
}

export function createDeadlineClock(data: TimingData, monotonicMs: number, wallMs: number): DeadlineClock {
  if (!data?.expires_at) {
    throw new Error('Missing expires_at timing data');
  }

  let remainingMs: number;
  
  if (typeof data.time_remaining_seconds === 'number' && Number.isFinite(data.time_remaining_seconds)) {
    remainingMs = Math.max(0, data.time_remaining_seconds * 1000);
  } else if (data.expires_at && data.server_time) {
    const diff = serverTimestamp(data.expires_at) - serverTimestamp(data.server_time);
    remainingMs = Number.isFinite(diff) ? Math.max(0, diff) : (data.duration_minutes || 30) * 60000;
  } else {
    remainingMs = (data.duration_minutes || 30) * 60000;
  }

  const durationLimitMs = Math.max(1, data.duration_minutes || 60) * 60000;
  return { 
    remainingMs: Math.min(remainingMs, durationLimitMs), 
    monotonicMs, 
    wallMs 
  };
}

export function remainingSeconds(clock: DeadlineClock, monotonicMs: number, wallMs: number): number {
  // Elapsed time catches up after throttled tabs or sleep; ticks never define time.
  const elapsed = Math.max(0, monotonicMs - clock.monotonicMs, wallMs - clock.wallMs);
  return Math.max(0, Math.ceil((clock.remainingMs - elapsed) / 1000));
}

export function isLowTime(seconds: number, durationMinutes: number): boolean {
  return seconds <= Math.min(300, (durationMinutes || 30) * 60 * 0.1);
}
