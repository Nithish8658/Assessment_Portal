import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

// In-page replacements for window.alert / window.confirm. Native dialogs take focus from the page,
// which the exam proctoring guard records as leaving the exam, and they can't be styled.

type Kind = 'info' | 'success' | 'error';
interface Toast { id: number; text: string; kind: Kind }
interface ConfirmRequest { id: number; text: string; confirmLabel: string; danger: boolean; resolve: (ok: boolean) => void }

let pushToast: ((t: Toast) => void) | null = null;
let pushConfirm: ((c: ConfirmRequest) => void) | null = null;
let nextId = 0;

const guessKind = (text: string): Kind =>
  /fail|error|unable|could not|cannot|can't|invalid|denied|not allowed|refused|required|missing/i.test(text) ? 'error'
    : /success|saved|created|updated|deleted|removed|approved|activated|granted|cancelled|submitted/i.test(text) ? 'success'
      : 'info';

/** Shows a short message at the top of the page. */
export const notify = (message: unknown, kind?: Kind) => {
  const text = typeof message === 'string' ? message : String(message ?? '');
  const toast = { id: ++nextId, text, kind: kind ?? guessKind(text) };
  if (pushToast) pushToast(toast);
  else console.warn(text);
};

/** Asks the user to confirm; resolves true on Confirm, false on Cancel / Escape. */
export const confirmDialog = (message: string, opts: { confirmLabel?: string; danger?: boolean } = {}): Promise<boolean> =>
  new Promise((resolve) => {
    if (!pushConfirm) {
      resolve(window.confirm(message));
      return;
    }
    const danger = opts.danger ?? /delete|remove|revoke|cancel|reset|clear/i.test(message);
    pushConfirm({ id: ++nextId, text: message, confirmLabel: opts.confirmLabel ?? 'Confirm', danger, resolve });
  });

const kindStyle: Record<Kind, { box: string; icon: React.ReactNode }> = {
  info: { box: 'border-[#FF5500]/40 text-[#0F172A]', icon: <Info className="w-4 h-4 text-[#FF5500] shrink-0 mt-0.5" /> },
  success: { box: 'border-[#22C55E]/40 text-[#0F172A]', icon: <CheckCircle2 className="w-4 h-4 text-[#22C55E] shrink-0 mt-0.5" /> },
  error: { box: 'border-[#EF4444]/50 text-[#0F172A]', icon: <AlertCircle className="w-4 h-4 text-[#EF4444] shrink-0 mt-0.5" /> },
};

/** Mounted once at the app root; renders toasts and the confirmation dialog above everything, exams included. */
export const DialogHost: React.FC = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [pending, setPending] = useState<ConfirmRequest[]>([]);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const current = pending[0];

  useEffect(() => {
    pushToast = (t) => {
      setToasts((prev) => [...prev.slice(-3), t]);
      setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== t.id)), t.kind === 'error' ? 8000 : 5000);
    };
    pushConfirm = (c) => setPending((prev) => [...prev, c]);
    return () => { pushToast = null; pushConfirm = null; };
  }, []);

  const answer = (ok: boolean) => {
    if (!current) return;
    current.resolve(ok);
    setPending((prev) => prev.slice(1));
  };

  useEffect(() => {
    if (!current) return;
    confirmRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); answer(false); }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id]);

  return createPortal(
    <>
      <div className="fixed top-4 right-4 left-4 sm:left-auto sm:w-96 z-[100003] space-y-2 pointer-events-none" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} role={t.kind === 'error' ? 'alert' : 'status'}
            className={`pointer-events-auto bg-[#FFFFFF] border rounded-xl shadow-xl px-4 py-3 text-xs flex items-start gap-2.5 ${kindStyle[t.kind].box}`}>
            {kindStyle[t.kind].icon}
            <span className="flex-1 min-w-0 whitespace-pre-line break-words leading-relaxed">{t.text}</span>
            <button onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))} aria-label="Dismiss"
              className="text-[#64748B] hover:text-[#0F172A] cursor-pointer shrink-0">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {current && (
        <div className="fixed inset-0 z-[100002] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <p className="text-sm text-[#0F172A] leading-relaxed whitespace-pre-line">{current.text}</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => answer(false)}
                className="px-4 py-2 rounded-lg bg-[#F0F3F6] border border-[#E2E8F0] text-xs font-semibold text-[#475569] hover:text-[#0F172A] cursor-pointer">
                Cancel
              </button>
              <button ref={confirmRef} onClick={() => answer(true)}
                className={`px-4 py-2 rounded-lg text-xs font-bold cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5500] ${
                  current.danger ? 'bg-[#EF4444] hover:bg-[#DC2626] text-white' : 'bg-[#FF5500] hover:bg-[#E64D00] text-white'}`}>
                {current.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>,
    document.body
  );
};
