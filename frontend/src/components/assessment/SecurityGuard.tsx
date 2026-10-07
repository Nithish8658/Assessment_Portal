import React, { useEffect, useState } from 'react';
import { AlertTriangle, ShieldAlert } from 'lucide-react';

interface SecurityGuardProps {
  children: React.ReactNode;
  isActive: boolean;
  onViolation?: (type: string) => void;
}

export const SecurityGuard: React.FC<SecurityGuardProps> = ({ children, isActive, onViolation }) => {
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [isBlackedOut, setIsBlackedOut] = useState<boolean>(false);

  const triggerBlackout = (msg: string, violationType: string) => {
    setIsBlackedOut(true);
    setWarningMessage(msg);
    onViolation?.(violationType);
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText('');
      }
    } catch {}
    setTimeout(() => {
      setIsBlackedOut(false);
    }, 1500);
  };

  useEffect(() => {
    if (!isActive) return;

    // 1. Disable Web Speech / Voice Typing APIs during assessment
    try {
      (window as any).SpeechRecognition = undefined;
      (window as any).webkitSpeechRecognition = undefined;
    } catch (e) {}

    // 2. Tab Switch & Desktop Blur Detection
    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerBlackout('SECURITY ALERT: Tab switch or Desktop switch detected! Screen obfuscated.', 'TAB_SWITCH');
      }
    };

    const handleWindowBlur = () => {
      triggerBlackout('SECURITY ALERT: Window focus lost! Focus on examination window.', 'WINDOW_BLUR');
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
        triggerBlackout('SECURITY ALERT: Screen capture / PrintScreen blocked and logged.', 'SCREENSHOT_ATTEMPT');
        return;
      }

      // Windows + Shift + S (Snipping Tool) or Cmd + Shift + 4 / 3
      if ((e.metaKey || e.key === 'Meta' || e.key === 'OS') && e.shiftKey) {
        e.preventDefault();
        triggerBlackout('SECURITY ALERT: Snipping tool / Screenshot shortcut blocked.', 'SCREENSHOT_ATTEMPT');
        return;
      }

      // Ctrl + P (Print / Save as PDF)
      if ((e.ctrlKey || e.metaKey) && (key === 'p' || key === 'P')) {
        e.preventDefault();
        triggerBlackout('SECURITY ALERT: Printing / PDF export is strictly restricted.', 'PRINT_ATTEMPT');
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
        triggerBlackout('SECURITY ALERT: Screen capture attempt blocked.', 'SCREENSHOT_ATTEMPT');
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

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
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

      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
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

  return (
    <div className="relative">
      {/* Obfuscation Blackout Curtain on Screenshot / Blur Attempts */}
      {isBlackedOut && (
        <div className="fixed inset-0 z-[99999] bg-[#11110F] flex flex-col items-center justify-center text-center p-8 select-none pointer-events-none">
          <ShieldAlert className="w-16 h-16 text-[#EF4444] mb-4 animate-pulse" />
          <h2 className="text-xl font-bold text-white font-mono tracking-wider uppercase">
            Examination Content Protected
          </h2>
          <p className="text-xs text-[#9E988A] mt-2 font-mono max-w-md">
            Screen capture, Snipping tool, or Window switch detected. Screen content was obfuscated and a proctoring violation has been logged.
          </p>
        </div>
      )}

      {warningMessage && (
        <div className="fixed top-4 right-4 z-50 bg-[#EF4444] text-white px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-2.5 text-xs font-mono border border-red-400 animate-bounce">
          <ShieldAlert className="w-5 h-5 text-white shrink-0" />
          <span className="font-bold">{warningMessage}</span>
        </div>
      )}
      {children}
    </div>
  );
};
