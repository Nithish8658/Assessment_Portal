import apiClient from '../api/client';

export interface SendPassResult {
  sent: number;
  failed: number;
  remaining: number;
  error: string | null;
}

let running: Promise<SendPassResult> | null = null;

// The backend sends queued emails in short passes so each request stays within the
// serverless time limit; keep calling until the queue is empty or a pass makes no progress.
export const drainStudentEmails = (onProgress?: (r: SendPassResult) => void): Promise<SendPassResult> => {
  if (running) return running;
  running = (async () => {
    const total: SendPassResult = { sent: 0, failed: 0, remaining: 0, error: null };
    for (let i = 0; i < 40; i++) {
      const { data } = await apiClient.post<SendPassResult>('/student-emails/send-pending');
      total.sent += data.sent;
      total.failed += data.failed;
      total.remaining = data.remaining;
      total.error = data.error;
      onProgress?.({ ...total });
      if (!data.remaining || data.error || data.sent + data.failed === 0) break;
    }
    return total;
  })().finally(() => { running = null; });
  return running;
};
