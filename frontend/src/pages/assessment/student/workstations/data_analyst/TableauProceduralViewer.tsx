import React, { useState, useEffect, useMemo, useRef } from 'react';
import { StartAttemptResponse, CandidateResult, CandidateQuestion } from '../../../../../types/assessment';
import { TimerHeader } from '../../../../../components/assessment/TimerHeader';
import apiClient from '../../../../../api/client';
import {
  BarChart3,
  Layers,
  Filter,
  Eye,
  CheckCircle2,
  Send,
  ChevronLeft,
  ChevronRight,
  Database,
  Sliders,
  Palette,
  Sparkles,
  HelpCircle
} from 'lucide-react';

interface WorkstationProps {
  attemptData: StartAttemptResponse;
  onSubmitComplete: (res: CandidateResult) => void;
}

export const TableauProceduralViewer: React.FC<WorkstationProps> = ({
  attemptData,
  onSubmitComplete
}) => {
  const questions: CandidateQuestion[] = attemptData.questions || [];
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const currentQ = questions[currentIndex];

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [activeChartType, setActiveChartType] = useState<'BAR' | 'DIVERGING' | 'HEATMAP' | 'SCATTER'>('DIVERGING');
  const [selectedColumnField, setSelectedColumnField] = useState<string>('Region');
  const [selectedRowField, setSelectedRowField] = useState<string>('SUM(Sales)');
  const [lodFormula, setLodFormula] = useState<string>('{FIXED [Region] : SUM([Sales])}');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<string>('Saved');
  const debounceRef = useRef<any>(null);

  // Initialize saved answers
  useEffect(() => {
    if (attemptData.saved_answers) {
      const initial: Record<string, string> = {};
      Object.entries(attemptData.saved_answers).forEach(([k, v]) => {
        initial[String(k)] = typeof v === 'object' ? JSON.stringify(v) : String(v);
      });
      setAnswers(initial);
    }
  }, [attemptData]);

  const handleSelectOption = (optionId: string | number) => {
    if (!currentQ) return;
    const strVal = String(optionId);
    setAnswers((prev) => ({ ...prev, [String(currentQ.id)]: strVal }));
    setSaveStatus('Saving...');

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        await apiClient.post('/assessment/attempts/save-response', {
          attempt_id: attemptData.attempt_id,
          question_id: currentQ.id,
          response_payload: strVal
        });
        setSaveStatus('Saved');
      } catch (err) {
        console.error('Autosave failed:', err);
        setSaveStatus('Offline');
      }
    }, 400);
  };

  const handleSubmit = async (isManual = false) => {
    if (isManual) {
      const count = Object.keys(answers).length;
      if (!confirm(`You have answered ${count} of ${questions.length} questions. Submit your Tableau & Visualization assessment?`)) {
        return;
      }
    }
    setIsSubmitting(true);
    try {
      const res = await apiClient.post('/assessment/attempts/submit', {
        attempt_id: attemptData.attempt_id
      });
      onSubmitComplete(res.data);
    } catch (err: any) {
      console.error('Submission failed', err);
      alert(err.response?.data?.detail || 'Submission failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const parsedOptions = useMemo(() => {
    if (!currentQ?.options) return [];
    let opts = currentQ.options;
    if (typeof opts === 'string') {
      try {
        opts = JSON.parse(opts);
      } catch {
        opts = [];
      }
    }
    if (!Array.isArray(opts)) return [];
    return opts.map((opt: any, idx: number) => {
      if (typeof opt === 'object' && opt !== null) {
        return {
          id: opt.id !== undefined ? String(opt.id) : String(idx + 1),
          text: opt.text || opt.label || opt.content || String(opt)
        };
      }
      return { id: String(idx + 1), text: String(opt) };
    });
  }, [currentQ]);

  const currentAnswer = currentQ ? answers[String(currentQ.id)] : undefined;

  return (
    <div className="h-screen max-h-screen bg-[#11110F] text-[#F8F5ED] flex flex-col font-sans overflow-hidden selection:bg-[#C9A227] selection:text-[#11110F]">
      {/* Top Standard Assessment Timer Header */}
      <TimerHeader
        attemptData={attemptData}
        onSubmit={() => handleSubmit(true)}
        isSubmitting={isSubmitting}
        saveStatus={saveStatus}
      />

      {/* Action Sub Header */}
      <div className="bg-[#1C1B18] border-b border-[#2A2824] px-6 py-2.5 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <span className="bg-[#C9A227]/10 text-[#E3C766] border border-[#C9A227]/30 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5 text-[#C9A227]" /> Tableau Studio Task {currentIndex + 1} of {questions.length}
          </span>
          <span className="text-xs text-[#9E988A] font-mono hidden sm:inline">
            Environment: <strong className="text-[#F8F5ED]">Tableau 2024.1 + Visual Analytics</strong>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono text-[#9E988A] bg-[#141311] px-2.5 py-1 rounded-lg border border-[#2A2824]">
            Autosave Active
          </span>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
        {/* Left Side: Question Brief & Options (5 cols) */}
        <div className="lg:col-span-5 bg-[#1C1B18] p-6 flex flex-col justify-between overflow-y-auto border-r border-[#2A2824]">
          {currentQ ? (
            <div className="space-y-5">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#C9A227] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Visualization Task Brief
                </span>
                <h2 className="text-base sm:text-lg font-bold text-[#F8F5ED] mt-1">
                  {currentQ.title}
                </h2>
              </div>

              {/* Content Description */}
              <div className="bg-[#141311] border border-[#2A2824] rounded-xl p-4 text-xs font-sans text-[#D8D2C5] space-y-3 leading-relaxed">
                <p className="whitespace-pre-line text-xs font-sans text-[#D8D2C5]">
                  {currentQ.content}
                </p>
              </div>

              {/* Options */}
              <div className="space-y-2.5 pt-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#9E988A] block">
                  Select the correct architectural / calculation choice:
                </span>
                <div className="grid grid-cols-1 gap-2.5">
                  {parsedOptions.map((opt, idx) => {
                    const isSelected = currentAnswer === opt.id;
                    const letterKey = String.fromCharCode(65 + idx);
                    return (
                      <button
                        key={opt.id}
                        onClick={() => handleSelectOption(opt.id)}
                        className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3.5 cursor-pointer ${
                          isSelected
                            ? 'bg-[#C9A227]/15 border-[#C9A227] text-[#F8F5ED] shadow-lg ring-1 ring-[#C9A227]'
                            : 'bg-[#141311] border-[#2A2824] hover:bg-[#24231F] hover:border-[#C9A227]/40 text-[#D8D2C5]'
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs flex-shrink-0 transition-all ${
                            isSelected
                              ? 'bg-[#C9A227] text-[#11110F] shadow'
                              : 'bg-[#1C1B18] text-[#9E988A] border border-[#2A2824]'
                          }`}
                        >
                          {letterKey}
                        </div>
                        <div className="flex-1 text-xs leading-relaxed pt-0.5 font-medium">
                          {opt.text}
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-[#C9A227] flex-shrink-0 mt-0.5" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Question Navigation */}
              <div className="pt-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#9E988A] block mb-2">
                  Navigate Tasks:
                </span>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                  {questions.map((q, idx) => (
                    <button
                      key={q.id}
                      onClick={() => setCurrentIndex(idx)}
                      className={`py-1.5 rounded-lg text-xs font-mono border transition-all cursor-pointer ${
                        currentIndex === idx
                          ? 'bg-[#C9A227] text-[#11110F] font-bold border-[#C9A227] shadow-md ring-1 ring-[#C9A227]'
                          : answers[String(q.id)]
                          ? 'bg-[#4ADE80]/15 text-[#4ADE80] border-[#4ADE80]/30 font-semibold'
                          : 'bg-[#141311] text-[#9E988A] border-[#2A2824] hover:bg-[#24231F]'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {/* Bottom Pagination */}
          <div className="pt-4 flex items-center justify-between border-t border-[#2A2824] mt-6">
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="px-3 py-1.5 rounded-lg bg-[#141311] hover:bg-[#24231F] text-[#D8D2C5] text-xs font-mono flex items-center gap-1.5 border border-[#2A2824] transition-all disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <span className="text-xs text-[#9E988A] font-mono">
              Task {currentIndex + 1} of {questions.length}
            </span>
            <button
              onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
              disabled={currentIndex === questions.length - 1}
              className="px-3 py-1.5 rounded-lg bg-[#141311] hover:bg-[#24231F] text-[#D8D2C5] text-xs font-mono flex items-center gap-1.5 border border-[#2A2824] transition-all disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Side: Interactive Tableau Desktop Canvas Simulator (7 cols) */}
        <div className="lg:col-span-7 bg-[#141311] p-6 flex flex-col justify-between overflow-y-auto space-y-6">
          <div className="space-y-4">
            {/* Tableau Shelf Controls */}
            <div className="bg-[#1C1B18] border border-[#2A2824] rounded-xl p-4 shadow-lg space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#2A2824]">
                <span className="text-xs font-bold text-[#F8F5ED] uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-[#C9A227]" /> Tableau Shelves & Pill Placement
                </span>
                <div className="flex items-center gap-1.5">
                  {(['DIVERGING', 'BAR', 'HEATMAP', 'SCATTER'] as const).map((ct) => (
                    <button
                      key={ct}
                      onClick={() => setActiveChartType(ct)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold transition-all cursor-pointer ${
                        activeChartType === ct
                          ? 'bg-[#C9A227] text-[#11110F] shadow'
                          : 'bg-[#141311] text-[#9E988A] border border-[#2A2824] hover:bg-[#24231F]'
                      }`}
                    >
                      {ct}
                    </button>
                  ))}
                </div>
              </div>

              {/* Columns & Rows Dropzones */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-2 bg-[#141311] p-2 rounded-lg border border-[#2A2824]">
                  <span className="text-[#9E988A] font-semibold w-16">Columns:</span>
                  <span className="bg-[#C9A227]/20 text-[#E3C766] border border-[#C9A227]/40 px-2 py-0.5 rounded text-[11px] font-mono">
                    [{selectedColumnField}]
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-[#141311] p-2 rounded-lg border border-[#2A2824]">
                  <span className="text-[#9E988A] font-semibold w-16">Rows:</span>
                  <span className="bg-[#4ADE80]/15 text-[#4ADE80] border border-[#4ADE80]/30 px-2 py-0.5 rounded text-[11px] font-mono">
                    [{selectedRowField}]
                  </span>
                </div>
              </div>

              {/* LOD Expression Bar */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#9E988A] uppercase tracking-wider block">
                  Calculated Field / LOD Expression Formula:
                </label>
                <input
                  type="text"
                  value={lodFormula}
                  onChange={(e) => setLodFormula(e.target.value)}
                  className="w-full bg-[#141311] border border-[#2A2824] text-[#E3C766] font-mono text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-[#C9A227]"
                />
              </div>
            </div>

            {/* Dynamic Chart Preview Canvas */}
            <div className="bg-[#1C1B18] border border-[#2A2824] rounded-xl p-6 shadow-inner space-y-4">
              <div className="flex items-center justify-between text-xs text-[#9E988A] border-b border-[#2A2824] pb-2">
                <span className="font-semibold text-[#F8F5ED]">Interactive Visualization Render</span>
                <span className="text-[11px] font-mono text-[#C9A227]">Preview Engine Active</span>
              </div>

              {/* Render Chart SVG */}
              <div className="h-64 flex items-center justify-center p-4 bg-[#141311] rounded-xl border border-[#2A2824]">
                {activeChartType === 'DIVERGING' && (
                  <div className="w-full space-y-3">
                    <div className="text-[11px] text-center text-[#9E988A] pb-1">Diverging Horizontal Sentiment / Profit by Region</div>
                    {[
                      { label: 'Technology', val: 78, pos: true },
                      { label: 'Furniture', val: -34, pos: false },
                      { label: 'Office Supplies', val: 52, pos: true },
                      { label: 'Services', val: -18, pos: false }
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center text-xs font-mono">
                        <span className="w-28 text-[#9E988A] truncate text-right pr-3">{item.label}</span>
                        <div className="flex-1 flex items-center h-5 bg-[#1C1B18] rounded relative border border-[#2A2824]">
                          <div className="w-1/2 flex justify-end border-r border-[#2A2824] pr-0.5">
                            {!item.pos && (
                              <div
                                className="bg-red-500 h-3 rounded-l"
                                style={{ width: `${Math.abs(item.val)}%` }}
                              />
                            )}
                          </div>
                          <div className="w-1/2 flex justify-start pl-0.5">
                            {item.pos && (
                              <div
                                className="bg-[#4ADE80] h-3 rounded-r"
                                style={{ width: `${item.val}%` }}
                              />
                            )}
                          </div>
                        </div>
                        <span className={`w-12 pl-3 font-bold ${item.pos ? 'text-[#4ADE80]' : 'text-red-400'}`}>
                          {item.val > 0 ? `+${item.val}%` : `${item.val}%`}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {activeChartType === 'BAR' && (
                  <div className="w-full h-full flex items-end justify-around gap-4 pt-6">
                    {[
                      { name: 'North', val: 65 },
                      { name: 'South', val: 42 },
                      { name: 'East', val: 88 },
                      { name: 'West', val: 95 }
                    ].map((bar, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                        <span className="text-[10px] font-mono text-[#C9A227] font-bold">${bar.val}k</span>
                        <div
                          className="w-full bg-gradient-to-t from-[#C9A227] to-[#E3C766] rounded-t-lg transition-all duration-300 shadow-md shadow-[#C9A227]/20"
                          style={{ height: `${bar.val}%` }}
                        />
                        <span className="text-[11px] font-mono text-[#9E988A]">{bar.name}</span>
                      </div>
                    ))}
                  </div>
                )}

                {(activeChartType === 'HEATMAP' || activeChartType === 'SCATTER') && (
                  <div className="grid grid-cols-4 gap-2 w-full max-w-sm">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-10 rounded-lg flex items-center justify-center text-[10px] font-mono font-bold text-[#11110F]"
                        style={{
                          backgroundColor: `hsl(${43 + (i * 4)}, 75%, ${40 + (i % 3) * 12}%)`
                        }}
                      >
                        Q{(i % 4) + 1}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
