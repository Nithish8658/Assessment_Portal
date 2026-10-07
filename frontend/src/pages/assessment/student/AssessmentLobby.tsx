import React, { useState } from 'react';
import { RoundSummary } from '../../../types/assessment';
import { ShieldCheck, ArrowLeft, Play, CheckSquare, AlertTriangle, Monitor, Clock, FileText } from 'lucide-react';

interface AssessmentLobbyProps {
  round: RoundSummary;
  onBack: () => void;
  onBeginAttempt: () => void;
  isStarting: boolean;
}

export const AssessmentLobby: React.FC<AssessmentLobbyProps> = ({
  round,
  onBack,
  onBeginAttempt,
  isStarting
}) => {
  const [agreed, setAgreed] = useState<boolean>(false);

  const handleStartWithFullscreen = () => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
    onBeginAttempt();
  };

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6 font-sans">
      <button
        onClick={onBack}
        className="inline-flex items-center space-x-1.5 text-xs font-mono text-[#9E988A] hover:text-[#F8F5ED] transition cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Return to Dashboard</span>
      </button>

      <div className="bg-[#1C1B18] border border-[#2A2824] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="space-y-2 border-b border-[#2A2824] pb-4">
          <span className="text-[11px] font-mono font-bold bg-[#C9A227]/10 text-[#E3C766] border border-[#C9A227]/25 px-2.5 py-0.5 rounded">
            Round {round.round_number} Examination Lobby
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-[#F8F5ED]">{round.title}</h1>
          <p className="text-xs text-[#9E988A]">{round.description || 'Pre-examination instructions and compliance verification.'}</p>
        </div>

        {/* Exam Specifications Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="p-3.5 bg-[#141311] rounded-xl border border-[#2A2824] space-y-1">
            <span className="text-[10px] font-mono uppercase text-[#9E988A]">Duration</span>
            <div className="text-sm font-bold text-[#F8F5ED] flex items-center space-x-1.5">
              <Clock className="w-4 h-4 text-[#C9A227]" />
              <span>{round.duration_minutes} Minutes</span>
            </div>
          </div>

          <div className="p-3.5 bg-[#141311] rounded-xl border border-[#2A2824] space-y-1">
            <span className="text-[10px] font-mono uppercase text-[#9E988A]">Total Questions</span>
            <div className="text-sm font-bold text-[#F8F5ED] flex items-center space-x-1.5">
              <FileText className="w-4 h-4 text-[#C9A227]" />
              <span>{round.questions_per_attempt} Items</span>
            </div>
          </div>

          <div className="p-3.5 bg-[#141311] rounded-xl border border-[#2A2824] space-y-1">
            <span className="text-[10px] font-mono uppercase text-[#9E988A]">Passing Benchmark</span>
            <div className="text-sm font-bold text-[#4ADE80] flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>{round.passing_score}%</span>
            </div>
          </div>
        </div>

        {/* Mandatory Rules Checklist */}
        <div className="space-y-3 bg-[#141311] p-4 sm:p-5 rounded-2xl border border-[#2A2824]">
          <h3 className="text-xs font-bold text-[#F8F5ED] flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-[#C9A227]" />
            <span>Examination Protocol & Security Requirements</span>
          </h3>

          <ul className="space-y-2 text-xs text-[#9E988A] list-disc list-inside leading-relaxed">
            <li>You must enter Fullscreen mode before starting; exiting fullscreen triggers a lock screen.</li>
            <li>Copying, pasting, right-clicking, screenshots, and developer tools are strictly blocked.</li>
            <li>Tab switching, window blur, desktop switching, and third-party AI extensions are logged to audit trail.</li>
            <li>Voice typing and Web Speech recognition APIs are disabled in the examination environment.</li>
          </ul>
        </div>

        {/* Candidate Declaration */}
        <div className="pt-2">
          <label className="flex items-start space-x-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 rounded border-[#2A2824] text-[#C9A227] focus:ring-[#C9A227]"
            />
            <span className="text-xs text-[#D8D2C5] leading-relaxed">
              I have reviewed the rules and agree to enter proctored fullscreen mode for this assessment.
            </span>
          </label>
        </div>

        {/* Start Button */}
        <div className="pt-2 border-t border-[#2A2824] flex items-center justify-end space-x-3">
          <button
            onClick={onBack}
            className="px-4 py-2 bg-[#141311] hover:bg-[#24231F] text-xs font-bold text-[#9E988A] rounded-xl border border-[#2A2824] cursor-pointer"
          >
            Cancel
          </button>

          <button
            onClick={handleStartWithFullscreen}
            disabled={!agreed || isStarting}
            className="py-2.5 px-6 bg-[#C9A227] hover:bg-[#B89220] disabled:opacity-40 text-[#11110F] font-bold text-xs rounded-xl shadow-xl transition flex items-center space-x-2 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{isStarting ? 'Initializing Environment...' : 'Enter Fullscreen & Begin Assessment'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
