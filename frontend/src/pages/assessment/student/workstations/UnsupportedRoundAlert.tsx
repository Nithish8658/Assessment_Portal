import React from 'react';
import { AlertOctagon } from 'lucide-react';

interface UnsupportedRoundAlertProps {
  roundType: string;
}

export const UnsupportedRoundAlert: React.FC<UnsupportedRoundAlertProps> = ({ roundType }) => {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6 text-center font-sans">
      <div className="max-w-md w-full bg-[#FFFFFF] border border-red-500/40 rounded-2xl p-6 sm:p-8 shadow-xl space-y-4">
        <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-500">
          <AlertOctagon className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-[#0F172A]">Unsupported Assessment Round Type</h2>
        <p className="text-xs text-[#64748B] leading-relaxed">
          The workstation dispatcher encountered an unmapped semantic round type: <code className="font-mono text-[#FF5500] bg-[#F0F3F6] px-1.5 py-0.5 rounded">{roundType}</code>.
        </p>
        <p className="text-[11px] text-[#94A3B8]">
          Please contact your assessment administrator or system coordinator.
        </p>
      </div>
    </div>
  );
};
