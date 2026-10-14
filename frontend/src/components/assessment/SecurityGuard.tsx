import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, ShieldAlert } from 'lucide-react';

interface SecurityGuardProps {
  children: React.ReactNode;
  isActive: boolean;
  onViolation?: (type: string) => void;
}

// A web page cannot stop the OS from taking a screenshot, so the exam content is hidden
// (display:none keeps answers and position; hidden text is also unreadable to browser AI
// side panels) whenever a capture may happen or the exam is not the focused, full-width view.
const isModifierKey = (key: string) => ['Meta', 'OS', 'Shift', 'Control', 'Alt'].includes(key);

export const SecurityGuard: React.FC<SecurityGuardProps> = ({ children, isActive, onViolation }) => {
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  // Why the exam window is not in front: tab switch, focus lost, or narrowed by a side panel
  const [awayReason, setAwayReason] = useState<string | null>(null);
  // Cmd/Win+Shift is held: a screenshot shortcut may be next, so hide before it lands
  const [chordHeld, setChordHeld] = useState<boolean>(false);
  // A screenshot attempt was detected; stays hidden until the student clicks Return to exam
  const [captureLock, setCaptureLock] = useState<boolean>(false);
  const awayRef = useRef<string | null>(null);
  const chordRef = useRef<boolean>(false);
  // Widest fullscreen viewport seen, in physical pixels (unchanged by browser zoom)
  const fullWidthRef = useRef<number>(0);

  const lockForCapture = (msg: string) => {
    chordRef.current = false;
    setChordHeld(false);
    setCaptureLock(true);
    setWarningMessage(msg);
    onViolation?.('SCREENSHOT_ATTEMPT');
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText('');
      }
    } catch {}
  };

  useEffect(() => {
    if (!isActive) return;

    // 1. Disable Web Speech / Voice Typing APIs during assessment
    try {
      (window as any).SpeechRecognition = undefined;
      (window as any).webkitSpeechRecognition = undefined;
    } catch (e) {}

    // 2. Tab switch, focus loss and side panels (e.g. Ask Gemini narrows the fullscreen page)
    const checkPresence = () => {
      let reason: string | null = null;
      const physicalWidth = window.innerWidth * window.devicePixelRatio;
      if (!document.fullscreenElement) fullWidthRef.current = 0;
      else fullWidthRef.current = Math.max(fullWidthRef.current, physicalWidth);
      if (document.hidden) reason = 'TAB_SWITCH';
      else if (!document.hasFocus()) reason = 'WINDOW_BLUR';
      else if (document.fullscreenElement && physicalWidth < fullWidthRef.current - 40 * window.devicePixelRatio) reason = 'SIDE_PANEL_OPEN';
      if (reason && reason !== awayRef.current) onViolation?.(reason);
      awayRef.current = reason;
      setAwayReason(reason);
      // Focus came back while a screenshot chord was in progress (e.g. Win+Shift+S overlay)
      if (!reason && chordRef.current) {
        lockForCapture('SECURITY ALERT: Screenshot shortcut detected. Exam content was hidden.');
      }
    };

    // 3. Right-Click Context Menu Blocking
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      setWarningMessage('PROCTORING CONTROL: Right-click context menu is restricted.');
      onViolation?.('CONTEXT_MENU');
    };

    // 4. Copy, Cut & Paste Blocking
    const handleCopyPaste = (e: ClipboardEvent) => {
      e.preventDefault();
      setWarningMessage('PROCTORING CONTROL: Copying and pasting is strictly prohibited.');
      onViolation?.('CLIPBOARD_ACCESS');
    };

    // 5. Text Selection & Drag Blocking (permit intentional draggable UI elements)
    const handleSelectStart = (e: Event) => {
      const target = e.target as HTMLElement | null;
      if (target && target.closest('[draggable="true"]')) {
        return;
      }
      e.preventDefault();
    };

    const handleDragStart = (e: DragEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && target.closest('[draggable="true"]')) {
        return; // Permit intentional hardware/UI drag-and-drop
      }
      e.preventDefault();
    };

    // 6. Screenshot & Key Combination Interception
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;

      // PrintScreen Key
      if (key === 'PrintScreen' || e.keyCode === 44) {
        e.preventDefault();
        lockForCapture('SECURITY ALERT: Screen capture / PrintScreen detected and logged.');
        return;
      }

      // Cmd+Shift (macOS 3/4/5) or Win+Shift (Windows S): the OS swallows the final key, so
      // hide the exam as soon as the chord starts. A key the browser does receive means it was
      // an ordinary shortcut (e.g. Cmd+Shift+Z), so the exam is shown again.
      if ((e.metaKey || key === 'Meta' || key === 'OS') && e.shiftKey) {
        e.preventDefault();
        if (isModifierKey(key)) {
          chordRef.current = true;
          setChordHeld(true);
        } else if (chordRef.current) {
          chordRef.current = false;
          setChordHeld(false);
        }
        return;
      }

      // Ctrl + P (Print / Save as PDF)
      if ((e.ctrlKey || e.metaKey) && (key === 'p' || key === 'P')) {
        e.preventDefault();
        setWarningMessage('SECURITY ALERT: Printing / PDF export is strictly restricted.');
        onViolation?.('PRINT_ATTEMPT');
        return;
      }

      // Windows + H (Voice Typing)
      if ((e.metaKey || e.key === 'Meta' || e.key === 'OS') && (key === 'h' || key === 'H')) {
        e.preventDefault();
        setWarningMessage('PROCTORING CONTROL: Voice Typing shortcut blocked.');
        onViolation?.('VOICE_TYPING');
        return;
      }

      // DevTools & Source View (F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U)
      if (
        key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (key === 'I' || key === 'i' || key === 'J' || key === 'j' || key === 'C' || key === 'c')) ||
        (e.ctrlKey && (key === 'U' || key === 'u'))
      ) {
        e.preventDefault();
        setWarningMessage('SECURITY ALERT: Developer tools inspection blocked.');
        onViolation?.('DEVTOOLS_ATTEMPT');
        return;
      }

      // Alt + Tab / Windows + Tab
      if (e.altKey && key === 'Tab') {
        e.preventDefault();
        setWarningMessage('SECURITY ALERT: Task switcher blocked.');
        onViolation?.('ALT_TAB');
        return;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen' || e.keyCode === 44) {
        lockForCapture('SECURITY ALERT: Screen capture attempt detected and logged.');
        return;
      }
      // The chord ended without the browser seeing its last key: the OS took it (screenshot)
      if (chordRef.current) {
        lockForCapture('SECURITY ALERT: Screenshot shortcut detected. Exam content was hidden.');
      }
    };

    // 7. Inject Anti-Extension, Print Protection & Selection Blocking CSS
    const styleEl = document.createElement('style');
    styleEl.id = 'proctoring-security-styles';
    styleEl.innerHTML = `
      [class*="gemini"], [id*="gemini"],
      [class*="copilot"], [id*="copilot"],
      [class*="chatgpt"], [id*="chatgpt"],
      [class*="ai-assistant"], [id*="ai-assistant"],
      iframe[src*="chrome-extension"] {
        display: none !important;
        visibility: hidden !important;
        pointer-events: none !important;
        opacity: 0 !important;
      }
      body {
        user-select: none !important;
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
      }
      @media print {
        body {
          display: none !important;
          visibility: hidden !important;
        }
      }
    `;
    document.head.appendChild(styleEl);

    // 8. MutationObserver to strip injected third-party AI popups
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as HTMLElement;
            const tagStr = (el.tagName || '').toLowerCase();
            const idStr = (el.id || '').toLowerCase();
            const classStr = (el.className || '').toString().toLowerCase();

            if (
              idStr.includes('gemini') || classStr.includes('gemini') ||
              idStr.includes('copilot') || classStr.includes('copilot') ||
              idStr.includes('ai-assistant') || tagStr === 'iframe'
            ) {
              try {
                el.remove();
                setWarningMessage('SECURITY CONTROL: Third-party AI extension popup removed.');
                onViolation?.('AI_EXTENSION_DETECTED');
              } catch (e) {}
            }
          }
        });
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });

    document.addEventListener('visibilitychange', checkPresence);
    window.addEventListener('blur', checkPresence);
    window.addEventListener('focus', checkPresence);
    window.addEventListener('resize', checkPresence);
    document.addEventListener('fullscreenchange', checkPresence);
    checkPresence();
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopyPaste);
    document.addEventListener('cut', handleCopyPaste);
    document.addEventListener('paste', handleCopyPaste);
    document.addEventListener('selectstart', handleSelectStart);
    document.addEventListener('dragstart', handleDragStart);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      observer.disconnect();
      const injectedStyle = document.getElementById('proctoring-security-styles');
      if (injectedStyle) injectedStyle.remove();

      document.removeEventListener('visibilitychange', checkPresence);
      window.removeEventListener('blur', checkPresence);
      window.removeEventListener('focus', checkPresence);
      window.removeEventListener('resize', checkPresence);
      document.removeEventListener('fullscreenchange', checkPresence);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopyPaste);
      document.removeEventListener('cut', handleCopyPaste);
      document.removeEventListener('paste', handleCopyPaste);
      document.removeEventListener('selectstart', handleSelectStart);
      document.removeEventListener('dragstart', handleDragStart);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [isActive, onViolation]);

  useEffect(() => {
    if (warningMessage) {
      const timer = setTimeout(() => setWarningMessage(null), 4500);
      return () => clearTimeout(timer);
    }
  }, [warningMessage]);

  const isHidden = isActive && (!!awayReason || chordHeld || captureLock);
  const hiddenText = captureLock
    ? 'A screenshot attempt was detected and logged. Screenshots of this exam only capture this screen.'
    : awayReason === 'SIDE_PANEL_OPEN'
      ? 'A browser side panel (such as Ask Gemini) is open. Close it to continue your exam.'
      : chordHeld
        ? 'Screenshot shortcuts are not allowed during the exam.'
        : 'The exam window is not in focus. Click here to continue your exam. This has been logged.';

  return (
    <div className="relative">
      {/* Shown instead of the exam whenever it could be captured or read by another window */}
      {isHidden && (
        <div className="fixed inset-0 z-[99999] bg-[#11110F] flex flex-col items-center justify-center text-center p-8 select-none">
          <ShieldAlert className="w-16 h-16 text-[#EF4444] mb-4 animate-pulse" />
          <h2 className="text-xl font-bold text-white font-mono tracking-wider uppercase">
            Examination Content Protected
          </h2>
          <p className="text-xs text-[#9E988A] mt-2 font-mono max-w-md">{hiddenText}</p>
          {captureLock && !awayReason && !chordHeld && (
            <button
              onClick={() => setCaptureLock(false)}
              className="mt-5 bg-[#C9A227] hover:bg-[#B89220] text-[#11110F] font-bold text-xs px-5 py-2 rounded-lg transition cursor-pointer"
            >
              Return to exam
            </button>
          )}
        </div>
      )}

      {warningMessage && (
        <div className="fixed top-4 right-4 z-50 bg-[#EF4444] text-white px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-2.5 text-xs font-mono border border-red-400 animate-bounce">
          <ShieldAlert className="w-5 h-5 text-white shrink-0" />
          <span className="font-bold">{warningMessage}</span>
        </div>
      )}
      <div style={isHidden ? { display: 'none' } : undefined}>{children}</div>
    </div>
  );
};
