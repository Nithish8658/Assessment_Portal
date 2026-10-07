import React from 'react';
import { CandidateQuestion, MotherboardConfig } from '../../../../../types/assessment';
import { FileText, CheckCircle, Clock, AlertTriangle, ShieldCheck, ListChecks, HelpCircle } from 'lucide-react';

interface TaskSpecDrawerProps {
  question: CandidateQuestion;
  motherboardConfig: MotherboardConfig;
  placements: Record<string, string>;
  totalQuestions: number;
  currentQIndex: number;
  onSelectQuestion: (index: number) => void;
}

export const TaskSpecDrawer: React.FC<TaskSpecDrawerProps> = ({
  question,
  motherboardConfig,
  placements,
  totalQuestions,
  currentQIndex,
  onSelectQuestion
}) => {
  const occupiedSlotsCount = Object.keys(placements).filter((k) => Boolean(placements[k])).length;
  const totalSlots = motherboardConfig.slots.length;
  const progressPercent = Math.round((occupiedSlotsCount / totalSlots) * 100);

  const getDifficultyColor = (diff: string) => {
    switch (diff?.toLowerCase()) {
      case 'easy':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'medium':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'hard':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="w-80 lg:w-[380px] flex flex-col h-full bg-[#1C1B18] border-r border-[#2A2824] shadow-2xl z-20">
      {/* Top Question Tabs (if multi-question attempt) */}
      {totalQuestions > 1 && (
        <div className="p-3 border-b border-[#2A2824] bg-[#141311] flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {Array.from({ length: totalQuestions }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => onSelectQuestion(idx)}
              className={`px-3 py-1.5 text-xs font-mono font-medium rounded-lg transition-all cursor-pointer ${
                currentQIndex === idx
                  ? 'bg-[#C9A227] text-[#11110F] font-bold shadow-md shadow-[#C9A227]/20 ring-1 ring-[#C9A227]'
                  : 'bg-[#1C1B18] text-[#9E988A] hover:text-[#F8F5ED] hover:bg-[#24231F] border border-[#2A2824]'
              }`}
            >
              Task {idx + 1}
            </button>
          ))}
        </div>
      )}

      {/* Task Header */}
      <div className="p-5 border-b border-[#2A2824] bg-[#141311]">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className={`text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded border ${getDifficultyColor(question.difficulty)}`}>
            {question.difficulty?.toUpperCase()} TIER
          </span>
          <div className="flex items-center gap-2 text-xs font-mono text-[#9E988A]">
            <span>Marks: <strong className="text-[#F8F5ED]">{question.marks}</strong></span>
          </div>
        </div>

        <h2 className="text-base font-bold text-[#F8F5ED] leading-snug">
          {question.title}
        </h2>
      </div>

      {/* Content & Specifications Scroll Area */}
      <div className="flex-1 p-5 overflow-y-auto space-y-5 text-[#D8D2C5]">
        
        {/* Scenario and Requirements Render */}
        <div className="prose prose-invert prose-xs max-w-none space-y-3 text-xs leading-relaxed text-[#D8D2C5]">
          {question.content.split('\n\n').map((block, idx) => {
            if (block.startsWith('### ')) {
              return (
                <h4 key={idx} className="text-xs font-bold text-[#C9A227] uppercase tracking-wider mt-4 mb-1">
                  {block.replace('### ', '')}
                </h4>
              );
            }
            if (block.startsWith('- ')) {
              return (
                <ul key={idx} className="list-disc pl-4 space-y-1 text-[#9E988A]">
                  {block.split('\n').map((line, lidx) => (
                    <li key={lidx}>{line.replace('- ', '')}</li>
                  ))}
                </ul>
              );
            }
            return <p key={idx} className="text-[#9E988A]">{block}</p>;
          })}
        </div>

        {/* Board Slot Completion Checklist */}
        <div className="p-4 rounded-xl bg-[#141311] border border-[#2A2824] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#F8F5ED]">
              <ListChecks className="w-4 h-4 text-[#C9A227]" />
              <span>Motherboard Slots</span>
            </div>
            <span className="text-[11px] font-mono text-[#C9A227] font-bold">
              {occupiedSlotsCount} / {totalSlots} Set
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-1.5 rounded-full bg-[#1C1B18] overflow-hidden border border-[#2A2824]">
            <div
              className="h-full bg-gradient-to-r from-[#C9A227] to-[#E3C766] transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="space-y-1.5 pt-1">
            {motherboardConfig.slots.map((slot) => {
              const isFilled = Boolean(placements[slot.slot_id]);
              return (
                <div
                  key={slot.slot_id}
                  className={`flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg font-mono transition-colors ${
                    isFilled
                      ? 'bg-[#4ADE80]/15 text-[#4ADE80] border border-[#4ADE80]/30'
                      : 'bg-[#1C1B18] text-[#9E988A] border border-[#2A2824]'
                  }`}
                >
                  <span className="truncate">{slot.label}</span>
                  <span className={`text-[10px] font-bold ${isFilled ? 'text-[#4ADE80]' : 'text-[#6B665E]'}`}>
                    {isFilled ? 'MOUNTED ✓' : 'EMPTY'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Electrical Tip Box */}
        <div className="p-3.5 rounded-xl bg-[#C9A227]/10 border border-[#C9A227]/25 text-[#E3C766] text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 shrink-0 text-[#C9A227] mt-0.5" />
          <div className="space-y-1 text-[11px] leading-relaxed">
            <div className="font-semibold text-[#E3C766]">Engineering Rule</div>
            <div className="text-[#D8D2C5]">
              Ensure power domains (3.3V vs 5V vs 24V) and bus protocols match physical pin headers.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
