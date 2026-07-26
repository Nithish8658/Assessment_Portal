import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import { Assessment } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { CheckSquare, Clock, Play, AlertTriangle, ShieldAlert, ShieldCheck, Lock, ArrowLeft, ArrowRight, EyeOff, Video, Info } from 'lucide-react';
import { WebcamProctor } from '../../components/proctoring/WebcamProctor';

export const AssessmentManager: React.FC = () => {
  const { activeRole } = useAuth();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [activeAttempt, setActiveAttempt] = useState<any | null>(null);
  const [honorCodeAccepted, setHonorCodeAccepted] = useState(false);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, any>>({});
  const [timeLeft, setTimeLeft] = useState(3600); // 60 mins in seconds
  
  // Security State
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [lastViolationReason, setLastViolationReason] = useState<string>('');
  const [showViolationHistoryModal, setShowViolationHistoryModal] = useState(false);
  const [violationHistory, setViolationHistory] = useState<Array<{ timestamp: string; reason: string; type: string }>>([]);
  const [showTabWarning, setShowTabWarning] = useState(false);
  const [showFullscreenOverlay, setShowFullscreenOverlay] = useState(false);
  const [showSubmitWarning, setShowSubmitWarning] = useState(false);
  const [malpracticeTerminated, setMalpracticeTerminated] = useState(false);

  useEffect(() => {
    fetchAssessments();
  }, []);

  // Timer Effect
  useEffect(() => {
    let timer: any;
    if (activeAttempt && honorCodeAccepted && timeLeft > 0 && !malpracticeTerminated) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (activeAttempt && timeLeft === 0 && !malpracticeTerminated) {
      submitAttempt();
    }
    return () => clearInterval(timer);
  }, [activeAttempt, honorCodeAccepted, timeLeft, malpracticeTerminated]);

  // Malpractice Monitoring Listeners
  useEffect(() => {
    if (!activeAttempt || !honorCodeAccepted || malpracticeTerminated) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        logViolation('TAB_SWITCH', 'Student switched tabs or minimized browser window.');
      }
    };

    const handleBlur = () => {
      logViolation('WINDOW_BLUR', 'Student unfocused examination window.');
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setShowFullscreenOverlay(true);
        logViolation('FULLSCREEN_EXIT', 'Student exited enforced full-screen mode.');
      } else {
        setShowFullscreenOverlay(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Block DevTools & Copy Shortcuts (F12, Ctrl+C, Ctrl+V, Ctrl+Shift+I, Ctrl+U)
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
        (e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'x' || e.key === 'u'))
      ) {
        e.preventDefault();
        logViolation('KEYBOARD_LOCKDOWN', `Attempted blocked shortcut: ${e.key}`);
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [activeAttempt, honorCodeAccepted, malpracticeTerminated, tabSwitchCount]);

  const logViolation = (type: string, details: string, snapshotBase64?: string) => {
    if (!activeAttempt) return;

    let readableReason = details || type;
    if (type === 'TAB_SWITCH') readableReason = 'Tab Switch / Browser Window Unfocused';
    else if (type === 'WINDOW_BLUR') readableReason = 'Examination Window Unfocused';
    else if (type === 'FULLSCREEN_EXIT') readableReason = 'Exited Full-Screen Lockdown Mode';
    else if (type === 'KEYBOARD_LOCKDOWN') readableReason = 'Blocked Keyboard Shortcut / Copy Action';
    else if (type === 'PHONE_DETECTED' || type === 'AI_PHONE_DETECTED') readableReason = 'YOLO AI: Mobile Phone Detected in Camera View';
    else if (type === 'MULTIPLE_PERSONS_DETECTED' || type === 'AI_MULTIPLE_PERSONS_DETECTED') readableReason = 'YOLO AI: Multiple Persons Detected in Camera View';
    else if (type === 'CAMERA_DISABLED') readableReason = 'Proctoring Camera Feed Disconnected';

    setLastViolationReason(readableReason);
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setViolationHistory(prev => [
      ...prev,
      { timestamp: timeStr, reason: readableReason, type: type }
    ]);

    apiClient.post('/assessments/log-violation', {
      attempt_id: activeAttempt.attempt_id,
      violation_type: type,
      details: details,
      snapshot_data: snapshotBase64 || null
    }).then(res => {
      const newCount = res.data.tab_switch_count;
      setTabSwitchCount(newCount);

      if (newCount >= 3) {
        setMalpracticeTerminated(true);
        submitAttempt(true); // auto-submit on 3rd violation
      } else {
        setShowTabWarning(true);
      }
    });
  };

  const fetchAssessments = () => {
    apiClient.get('/assessments').then(res => setAssessments(res.data));
  };

  const startTest = async (id: number) => {
    const res = await apiClient.post(`/assessments/${id}/start`);
    setActiveAttempt(res.data);
    setTimeLeft(res.data.duration_minutes * 60);
    setTabSwitchCount(res.data.tab_switch_count || 0);
    setLastViolationReason('');
    setViolationHistory([]);
    setCurrentQIndex(0);
    setHonorCodeAccepted(false);
    setMalpracticeTerminated(false);
    
    // Load pre-existing answers
    const initAns: Record<number, any> = {};
    res.data.questions.forEach((q: any) => {
      initAns[q.question_id] = {
        selected_option_id: q.selected_option_id,
        descriptive_text: q.descriptive_text || '',
        is_marked_for_review: q.is_marked_for_review || false
      };
    });
    setSelectedAnswers(initAns);
  };

  const enterExamMode = () => {
    setHonorCodeAccepted(true);
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  };

  const handleOptionSelect = (qId: number, optId: number) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [qId]: { ...prev[qId], selected_option_id: optId }
    }));
  };

  const toggleReview = (qId: number) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [qId]: { ...prev[qId], is_marked_for_review: !prev[qId]?.is_marked_for_review }
    }));
  };

  const submitAttempt = async (dueToMalpractice = false) => {
    if (!activeAttempt) return;
    const payload = {
      attempt_id: activeAttempt.attempt_id,
      answers: Object.entries(selectedAnswers).map(([qid, val]) => ({
        question_id: Number(qid),
        selected_option_id: val.selected_option_id || null,
        descriptive_text: val.descriptive_text || null,
        is_marked_for_review: val.is_marked_for_review || false
      }))
    };
    await apiClient.post('/assessments/submit', payload);
    
    if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }

    if (dueToMalpractice) {
      alert('Examination Auto-Submitted: Malpractice warning limit (3 tab switches) was exceeded.');
    }

    setActiveAttempt(null);
    setShowSubmitWarning(false);
    setShowTabWarning(false);
    setShowFullscreenOverlay(false);
    setShowViolationHistoryModal(false);
    setTabSwitchCount(0);
    setLastViolationReason('');
    setViolationHistory([]);
    fetchAssessments();
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (activeAttempt) {
    // Honor Code Confirmation Step
    if (!honorCodeAccepted) {
      return (
        <div className="fixed inset-0 bg-slate-950 text-slate-100 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-8 space-y-6 shadow-2xl">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto text-white">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div className="text-center space-y-1">
              <h2 className="text-xl font-bold text-white">Academic Integrity Honor Code</h2>
              <p className="text-xs text-blue-400 font-semibold uppercase">Nehru Arts and Science College (Autonomous)</p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-2 leading-relaxed">
              <p className="font-bold text-white">Proctored Security Notice:</p>
              <ul className="list-disc pl-4 space-y-1 text-slate-400">
                <li>Real-time **Live Video Webcam Proctoring** and face monitoring are active.</li>
                <li>This online assessment enforces **Full-Screen Mode** and **Tab-Switch Proctoring**.</li>
                <li>Leaving the window or turning off the camera will generate a **Malpractice Warning**.</li>
                <li><strong>3 Violation Warnings</strong> will auto-terminate and flag your exam attempt.</li>
                <li>Copy/Paste, Right-Click, and Developer Tools shortcuts are disabled.</li>
              </ul>
            </div>

            <button
              onClick={enterExamMode}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-3.5 rounded-xl shadow-lg transition flex items-center justify-center space-x-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>I Agree & Begin Proctored Assessment</span>
            </button>
          </div>
        </div>
      );
    }

    const currentQ = activeAttempt.questions[currentQIndex];
    const totalQ = activeAttempt.questions.length;
    const unansweredCount = Object.values(selectedAnswers).filter(a => !a.selected_option_id && !a.descriptive_text).length;

    return (
      <div className="fixed inset-0 bg-slate-950 text-slate-100 z-50 overflow-y-auto flex flex-col justify-between select-none">
        {/* Exam Header */}
        <div className="bg-slate-900 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <h2 className="text-base font-bold text-white">{activeAttempt.title}</h2>
            </div>
            <p className="text-xs text-slate-400">Nehru Arts and Science College — Proctored Malpractice Security Engine Active</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-amber-950/80 border border-amber-800 text-amber-300 px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-sm">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              {tabSwitchCount > 0 ? (
                <span>
                  Proctoring Warnings: <strong className="text-white font-mono">{Math.min(tabSwitchCount, 3)}/3</strong>
                </span>
              ) : (
                <span>Proctoring Security: <strong className="text-emerald-400 font-bold ml-1">Clean (0/3 Warnings)</strong></span>
              )}
              <button
                onClick={() => setShowViolationHistoryModal(true)}
                title="Click (i) to view detailed proctoring violation logs"
                className="ml-2 w-5 h-5 rounded-full bg-amber-800/90 hover:bg-amber-600 text-white font-bold text-[11px] flex items-center justify-center border border-amber-500/60 shadow transition hover:scale-105 active:scale-95 cursor-pointer"
              >
                i
              </button>
            </div>
            <div className="flex items-center space-x-2 bg-rose-950/80 border border-rose-800 text-rose-300 px-4 py-1.5 rounded-lg text-sm font-mono font-bold animate-pulse">
              <Clock className="w-4 h-4" />
              <span>Time Left: {formatTime(timeLeft)}</span>
            </div>
            <button
              onClick={() => setShowSubmitWarning(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-4 py-2 rounded-lg shadow-sm"
            >
              Finish & Submit Test
            </button>
          </div>
        </div>

        {/* Main Examination Workspace */}
        <div className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Question Viewer */}
          <div className="lg:col-span-3 bg-slate-900 p-6 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs text-slate-400 border-b border-slate-800 pb-3">
                <span className="font-bold text-blue-400 text-sm">Question {currentQIndex + 1} of {totalQ}</span>
                <span className="bg-slate-800 text-slate-300 px-2.5 py-1 rounded">
                  Marks: {currentQ.marks} | Bloom: {currentQ.bloom_level} | {currentQ.co_code}
                </span>
              </div>
              <h3 className="text-base font-semibold text-slate-100 leading-relaxed">{currentQ.question_text}</h3>

              {/* MCQ Options (Shuffled Order per Student) */}
              {currentQ.options && currentQ.options.length > 0 && (
                <div className="space-y-3 pt-2">
                  {currentQ.options.map((opt: any) => {
                    const isSelected = selectedAnswers[currentQ.question_id]?.selected_option_id === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => handleOptionSelect(currentQ.question_id, opt.id)}
                        className={`w-full text-left p-4 rounded-xl border text-xs font-medium transition flex items-center space-x-3 ${
                          isSelected
                            ? 'bg-blue-600/20 border-blue-500 text-white font-bold'
                            : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'border-blue-400 bg-blue-500' : 'border-slate-500'}`}>
                          {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                        </div>
                        <span>{opt.option_text}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bottom Nav Bar */}
            <div className="flex items-center justify-between border-t border-slate-800 pt-4 text-xs">
              <button
                onClick={() => toggleReview(currentQ.question_id)}
                className={`px-4 py-2 rounded-lg border font-semibold ${
                  selectedAnswers[currentQ.question_id]?.is_marked_for_review
                    ? 'bg-amber-950/80 border-amber-700 text-amber-300'
                    : 'bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                {selectedAnswers[currentQ.question_id]?.is_marked_for_review ? '★ Marked for Review' : 'Mark for Review'}
              </button>

              <div className="flex space-x-3">
                <button
                  disabled={currentQIndex === 0}
                  onClick={() => setCurrentQIndex(prev => prev - 1)}
                  className="px-4 py-2 bg-slate-800 disabled:opacity-40 rounded-lg flex items-center space-x-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>
                <button
                  disabled={currentQIndex === totalQ - 1}
                  onClick={() => setCurrentQIndex(prev => prev + 1)}
                  className="px-4 py-2 bg-blue-600 disabled:opacity-40 rounded-lg flex items-center space-x-1 font-semibold text-white"
                >
                  <span>Save & Next</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Status Palette Sidebar */}
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-6">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Question Status Palette</h3>
            <div className="grid grid-cols-4 gap-2 text-xs font-bold">
              {activeAttempt.questions.map((q: any, idx: number) => {
                const ans = selectedAnswers[q.question_id];
                const isAnswered = !!ans?.selected_option_id || !!ans?.descriptive_text;
                const isReview = !!ans?.is_marked_for_review;

                let btnStyle = 'bg-slate-800 border-slate-700 text-slate-400';
                if (isReview) btnStyle = 'bg-amber-600 text-white font-bold';
                else if (isAnswered) btnStyle = 'bg-emerald-600 text-white font-bold';
                if (currentQIndex === idx) btnStyle += ' ring-2 ring-blue-400';

                return (
                  <button
                    key={q.question_id}
                    onClick={() => setCurrentQIndex(idx)}
                    className={`h-10 rounded-lg border flex items-center justify-center transition ${btnStyle}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Malpractice Proctoring Warning Modal */}
        {showTabWarning && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-amber-700/80 rounded-2xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl">
              <ShieldAlert className="w-12 h-12 text-amber-400 mx-auto" />
              <h3 className="text-base font-bold text-white">Malpractice Proctoring Warning</h3>
              <p className="text-xs text-slate-300">
                A proctoring security violation was detected during your examination session. This incident has been logged into the Controller of Examinations audit trail.
              </p>
              
              <div className="bg-amber-950/80 border border-amber-800 p-3.5 rounded-xl text-amber-300 text-xs font-semibold space-y-2 text-left">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Violation Reason:</span>
                  <strong className="text-white text-right font-bold">{lastViolationReason || 'Proctoring Security Restriction'}</strong>
                </div>
                <div className="flex justify-between items-center border-t border-amber-800/60 pt-2">
                  <span className="text-slate-400">Allowed Limit:</span>
                  <strong className="text-amber-400">Warning {tabSwitchCount} of 3 Allowed</strong>
                </div>
              </div>

              <button
                onClick={() => setShowTabWarning(false)}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg shadow-md transition"
              >
                I Understand & Return to Exam
              </button>
            </div>
          </div>
        )}

        {/* Fullscreen Exit Lockdown Overlay */}
        {showFullscreenOverlay && (
          <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-50 text-center">
            <div className="max-w-md space-y-4">
              <Lock className="w-14 h-14 text-rose-500 mx-auto" />
              <h2 className="text-xl font-bold text-white">Examination Screen Locked</h2>
              <p className="text-xs text-slate-300">
                You exited full-screen examination mode. Re-enter full-screen mode to unlock your questions.
              </p>
              <button
                onClick={() => {
                  if (document.documentElement.requestFullscreen) {
                    document.documentElement.requestFullscreen().catch(() => {});
                  }
                  setShowFullscreenOverlay(false);
                }}
                className="px-6 py-3 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-lg"
              >
                Re-Enter Full-Screen Mode
              </button>
            </div>
          </div>
        )}

        {/* Submit Confirmation Modal */}
        {showSubmitWarning && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 text-center space-y-4">
              <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" />
              <h3 className="text-base font-bold text-white">Confirm Test Submission</h3>
              <p className="text-xs text-slate-300">
                You have <strong className="text-amber-400">{unansweredCount}</strong> unanswered questions remaining. Are you sure you want to finalize and submit?
              </p>
              <div className="flex justify-center space-x-3 pt-2">
                <button onClick={() => setShowSubmitWarning(false)} className="px-4 py-2 bg-slate-800 text-slate-300 text-xs rounded-lg">Resume Test</button>
                <button onClick={() => submitAttempt(false)} className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg">Confirm & Submit</button>
              </div>
            </div>
          </div>
        )}

        {/* Candidate Violation History Modal (i Info Button Click) */}
        {showViolationHistoryModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-left">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <Info className="w-5 h-5 text-blue-400" />
                  <h3 className="text-base font-bold text-white">Proctoring Security Incident Log</h3>
                </div>
                <button
                  onClick={() => setShowViolationHistoryModal(false)}
                  className="text-slate-400 hover:text-white font-bold text-sm px-2"
                >
                  ✕
                </button>
              </div>

              <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
                <span className="text-slate-400">Total Recorded Warnings:</span>
                <span className={`font-bold font-mono text-sm ${tabSwitchCount >= 3 ? 'text-rose-400' : (tabSwitchCount > 0 ? 'text-amber-400' : 'text-emerald-400')}`}>
                  {Math.min(tabSwitchCount, 3)} / 3 Allowed Limits
                </span>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {violationHistory.length > 0 ? (
                  violationHistory.map((item, idx) => (
                    <div key={idx} className="bg-slate-950/90 p-3 rounded-xl border border-slate-800/80 text-xs flex items-start justify-between space-x-3">
                      <div className="space-y-0.5">
                        <span className="font-bold text-amber-300 block">{item.reason}</span>
                        <span className="text-[10px] text-slate-500 font-mono">Event Type: {item.type}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap bg-slate-900 px-2 py-1 rounded border border-slate-800">
                        {item.timestamp}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="bg-slate-950/60 p-6 rounded-xl border border-slate-800 text-center text-xs text-slate-400">
                    No proctoring violations recorded for this examination session. Security status clean.
                  </div>
                )}
              </div>

              <button
                onClick={() => setShowViolationHistoryModal(false)}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md transition"
              >
                Close & Return to Exam
              </button>
            </div>
          </div>
        )}

        {/* Live Floating Video Proctoring Widget */}
        <WebcamProctor
          attemptId={activeAttempt.attempt_id}
          isActive={!!activeAttempt && honorCodeAccepted}
          onViolation={logViolation}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-xl font-bold text-slate-900">Institutional Assessment & Examination Engine</h2>
        <p className="text-xs text-slate-500">Scheduled Examinations with Proctored Anti-Cheating Malpractice Security</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {assessments.map((a) => (
          <div key={a.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <span className="bg-blue-100 text-blue-800 text-[11px] font-bold px-2.5 py-0.5 rounded border border-blue-200">
                  {a.assessment_type}
                </span>
                <span className="text-xs text-slate-500 font-semibold">{a.duration_minutes} mins</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-2">{a.title}</h3>
              <p className="text-xs text-slate-500 mt-1">{a.course_code} — {a.course_title}</p>
            </div>

            <div className="border-t pt-4 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-500">Max Marks:</span>
                <strong className="text-slate-900 ml-1">{a.max_marks} Marks</strong>
              </div>

              {activeRole === 'Student' && (
                a.student_attempt_status === 'Submitted' ? (
                  <span className="bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-lg">
                    Completed (Score: {a.student_score})
                  </span>
                ) : (
                  <button
                    onClick={() => startTest(a.id)}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2 rounded-lg flex items-center space-x-1.5 shadow-sm"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Start Test</span>
                  </button>
                )
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
