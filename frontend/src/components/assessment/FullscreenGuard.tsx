import React, { useEffect, useState } from 'react';
import { Maximize2, ShieldAlert } from 'lucide-react';

interface FullscreenGuardProps {
  children: React.ReactNode;
  isActive: boolean;
  onViolation?: (type: string) => void;
}

// Chrome/Edge Keyboard Lock: in fullscreen, browser shortcuts (Esc, Ctrl/Cmd+W/T/N...) go to
// the page instead, and leaving fullscreen needs Esc to be held. OS screenshot keys stay with the OS.
const lockKeyboard = () => {
  try { (navigator as any).keyboard?.lock?.()?.catch?.(() => {}); } catch {}
};
const unlockKeyboard = () => {
  try { (navigator as any).keyboard?.unlock?.(); } catch {}
};

export const FullscreenGuard: React.FC<FullscreenGuardProps> = ({ children, isActive, onViolation }) => {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(true);

  useEffect(() => {
    if (!isActive) return;
    if (document.fullscreenElement) lockKeyboard();

    const handleFullscreenChange = () => {
      const isFull = !!document.fullscreenElement;
      setIsFullscreen(isFull);
      if (isFull) {
        lockKeyboard();
      } else {
        unlockKeyboard();
        onViolation?.('FULLSCREEN_EXIT');
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      unlockKeyboard();
    };
  }, [isActive, onViolation]);

  const enterFullscreen = () => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  };

  if (!isActive) {
    return <>{children}</>;
  }

  // The exam stays mounted (hidden) so answers and position survive leaving fullscreen
  return (
    <>
      {!isFullscreen && (
      <div className="fixed inset-0 z-50 bg-[#11110F]/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center select-none font-sans">
        <div className="max-w-md w-full bg-[#1C1B18] border border-[#C9A227]/40 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-[#C9A227]/10 border border-[#C9A227]/30 flex items-center justify-center mx-auto text-[#C9A227]">
            <ShieldAlert className="w-8 h-8 animate-pulse" />
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-bold text-[#F8F5ED]">
              Proctored Fullscreen Required
            </h2>
            <p className="text-xs text-[#9E988A] leading-relaxed">
              This assessment round requires active fullscreen lockdown to preserve examination integrity. Exiting fullscreen triggers audit logs.
            </p>
          </div>

          <button
            onClick={enterFullscreen}
            className="w-full py-2.5 px-4 bg-[#C9A227] hover:bg-[#B89220] text-[#11110F] font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Maximize2 className="w-4 h-4" />
            <span>Enter Fullscreen Assessment</span>
          </button>
        </div>
      </div>
      )}
      <div style={isFullscreen ? undefined : { display: 'none' }}>{children}</div>
    </>
  );
};
