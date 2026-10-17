import React from 'react';
import { CheckCircle2, Bookmark, HelpCircle } from 'lucide-react';
import { CandidateQuestion } from '../../types/assessment';

interface QuestionPaletteProps {
  questions: CandidateQuestion[];
  currentIndex: number;
  onSelectIndex: (index: number) => void;
  savedAnswers: Record<string, any>;
  reviewFlags?: Record<string, boolean>;
}

export const QuestionPalette: React.FC<QuestionPaletteProps> = ({
  questions,
  currentIndex,
  onSelectIndex,
  savedAnswers,
  reviewFlags = {}
}) => {
  return (
    <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-3.5 space-y-3 shadow-sm">
      <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
        <h3 className="text-xs font-bold text-[#0F172A]">Question Palette</h3>
        <span className="text-[11px] font-mono text-[#64748B]">
          {Object.keys(savedAnswers).length}/{questions.length} Answered
        </span>
      </div>

      <div className="grid grid-cols-5 gap-1.5 max-h-60 overflow-y-auto pr-1">
        {questions.map((q, idx) => {
          const isCurrent = idx === currentIndex;
          const isAnswered = !!savedAnswers[q.id] || !!savedAnswers[String(q.id)];
          const isFlagged = !!reviewFlags[q.id] || !!reviewFlags[String(q.id)];

          let btnClass = 'bg-[#F0F3F6] border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] hover:border-[#FF5500]/50';

          if (isCurrent) {
            btnClass = 'bg-[#FF5500] text-white font-bold border-[#FF5500] ring-2 ring-[#FF5500]/30 shadow-sm';
          } else if (isFlagged) {
            btnClass = 'bg-[#F59E0B]/10 text-[#D97706] border-[#F59E0B]/40';
          } else if (isAnswered) {
            btnClass = 'bg-[#22C55E]/10 text-[#16A34A] border-[#22C55E]/40 font-semibold';
          }

          return (
            <button
              key={q.id}
              onClick={() => onSelectIndex(idx)}
              className={`h-8 rounded-lg border text-xs font-mono transition flex items-center justify-center relative cursor-pointer ${btnClass}`}
            >
              <span>{idx + 1}</span>
              {isFlagged && !isCurrent && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] absolute top-1 right-1"></span>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="pt-2 border-t border-[#E2E8F0] grid grid-cols-3 gap-1 text-[10px] font-mono text-[#64748B]">
        <div className="flex items-center space-x-1">
          <span className="w-2 h-2 rounded-full bg-[#22C55E]"></span>
          <span>Answered</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="w-2 h-2 rounded-full bg-[#F59E0B]"></span>
          <span>Review</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="w-2 h-2 rounded-full bg-[#CBD5E1]"></span>
          <span>Unvisited</span>
        </div>
      </div>
    </div>
  );
};
