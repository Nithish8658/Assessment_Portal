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
    <div className="bg-[#1C1B18] border border-[#2A2824] rounded-2xl p-3.5 space-y-3 shadow-md">
      <div className="flex items-center justify-between border-b border-[#2A2824] pb-2">
        <h3 className="text-xs font-bold text-[#F8F5ED]">Question Palette</h3>
        <span className="text-[11px] font-mono text-[#9E988A]">
          {Object.keys(savedAnswers).length}/{questions.length} Answered
        </span>
      </div>

      <div className="grid grid-cols-5 gap-1.5 max-h-60 overflow-y-auto pr-1">
        {questions.map((q, idx) => {
          const isCurrent = idx === currentIndex;
          const isAnswered = !!savedAnswers[q.id] || !!savedAnswers[String(q.id)];
          const isFlagged = !!reviewFlags[q.id] || !!reviewFlags[String(q.id)];

          let btnClass = 'bg-[#141311] border-[#2A2824] text-[#9E988A] hover:text-[#F8F5ED] hover:border-[#C9A227]/40';

          if (isCurrent) {
            btnClass = 'bg-[#C9A227] text-[#11110F] font-bold border-[#C9A227] ring-2 ring-[#C9A227]/30';
          } else if (isFlagged) {
            btnClass = 'bg-[#EAB308]/10 text-[#EAB308] border-[#EAB308]/40';
          } else if (isAnswered) {
            btnClass = 'bg-[#4ADE80]/10 text-[#4ADE80] border-[#4ADE80]/40 font-semibold';
          }

          return (
            <button
              key={q.id}
              onClick={() => onSelectIndex(idx)}
              className={`h-8 rounded-lg border text-xs font-mono transition flex items-center justify-center relative cursor-pointer ${btnClass}`}
            >
              <span>{idx + 1}</span>
              {isFlagged && !isCurrent && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#EAB308] absolute top-1 right-1"></span>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="pt-2 border-t border-[#2A2824] grid grid-cols-3 gap-1 text-[10px] font-mono text-[#9E988A]">
        <div className="flex items-center space-x-1">
          <span className="w-2 h-2 rounded-full bg-[#4ADE80]"></span>
          <span>Answered</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="w-2 h-2 rounded-full bg-[#EAB308]"></span>
          <span>Review</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="w-2 h-2 rounded-full bg-[#6B665E]"></span>
          <span>Unvisited</span>
        </div>
      </div>
    </div>
  );
};
