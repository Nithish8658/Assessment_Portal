import React from 'react';
import { CandidateQuestion, MotherboardConfig } from '../../../../../types/assessment';
import { AlertTriangle, ListChecks } from 'lucide-react';

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
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'medium':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'hard':
        return 'bg-red-50 text-red-600 border-red-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="w-80 lg:w-[380px] flex flex-col h-full bg-white border-r border-[#E2E8F0] shadow-sm z-20">
      {/* Top Question Tabs (if multi-question attempt) */}
      {totalQuestions > 1 && (
        <div className="p-3 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {Array.from({ length: totalQuestions }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => onSelectQuestion(idx)}
              className={`px-3 py-1.5 text-xs font-mono font-medium rounded-lg transition-all cursor-pointer ${
                currentQIndex === idx
                  ? 'bg-[#FF5500] text-white font-bold shadow-xs'
                  : 'bg-white text-[#64748B] hover:text-[#0F172A] hover:bg-[#F0F3F6] border border-[#E2E8F0]'
              }`}
            >
              Task {idx + 1}
            </button>
          ))}
        </div>
      )}

      {/* Task Header */}
      <div className="p-5 border-b border-[#E2E8F0] bg-white">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className={`text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded border ${getDifficultyColor(question.difficulty)}`}>
            {question.difficulty?.toUpperCase()} TIER
          </span>
          <div className="flex items-center gap-2 text-xs font-mono text-[#64748B]">
            <span>Marks: <strong className="text-[#0F172A]">{question.marks}</strong></span>
          </div>
        </div>

        <h2 className="text-base font-bold text-[#0F172A] leading-snug">
          {question.title}
        </h2>
      </div>

      {/* Content & Specifications Scroll Area */}
      <div className="flex-1 p-5 overflow-y-auto space-y-5 text-[#475569]">
        
        {/* Scenario and Requirements Render */}
        <div className="prose prose-xs max-w-none space-y-3 text-xs leading-relaxed text-[#475569]">
          {question.content.split('\n\n').map((block, idx) => {
            if (block.startsWith('### ')) {
              return (
                <h4 key={idx} className="text-xs font-bold text-[#FF5500] uppercase tracking-wider mt-4 mb-1">
                  {block.replace('### ', '')}
                </h4>
              );
            }
            if (block.startsWith('- ')) {
              return (
                <ul key={idx} className="list-disc pl-4 space-y-1 text-[#64748B]">
                  {block.split('\n').map((line, lidx) => (
                    <li key={lidx}>{line.replace('- ', '')}</li>
                  ))}
                </ul>
              );
            }
            return <p key={idx} className="text-[#64748B]">{block}</p>;
          })}
        </div>

        {/* Board Slot Completion Checklist */}
        <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#0F172A]">
              <ListChecks className="w-4 h-4 text-[#FF5500]" />
              <span>Motherboard Slots</span>
            </div>
            <span className="text-[11px] font-mono text-[#FF5500] font-bold">
              {occupiedSlotsCount} / {totalSlots} Set
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-1.5 rounded-full bg-[#E2E8F0] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#FF5500] to-[#FF7020] transition-all duration-300"
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
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-white text-[#64748B] border border-[#E2E8F0]'
                  }`}
                >
                  <span className="truncate">{slot.label}</span>
                  <span className={`text-[10px] font-bold ${isFilled ? 'text-emerald-600' : 'text-[#94A3B8]'}`}>
                    {isFilled ? 'MOUNTED ✓' : 'EMPTY'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Electrical Tip Box */}
        <div className="p-3.5 rounded-xl bg-[#FFF8F5] border border-[#FF5500]/25 text-[#FF5500] text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 shrink-0 text-[#FF5500] mt-0.5" />
          <div className="space-y-1 text-[11px] leading-relaxed">
            <div className="font-semibold text-[#FF5500]">Engineering Rule</div>
            <div className="text-[#475569]">
              Ensure power domains (3.3V vs 5V vs 24V) and bus protocols match physical pin headers.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
