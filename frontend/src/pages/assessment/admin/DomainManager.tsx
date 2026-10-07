import React, { useState, useEffect } from 'react';
import { DomainDetail, RoundSummary } from '../../../types/assessment';
import apiClient from '../../../api/client';
import { Settings, Edit2, Save, FileText, CheckCircle2, Award } from 'lucide-react';

export const DomainManager: React.FC = () => {
  const [domains, setDomains] = useState<DomainDetail[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<DomainDetail | null>(null);
  const [selectedRound, setSelectedRound] = useState<RoundSummary | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editDuration, setEditDuration] = useState<number>(45);
  const [editPassingScore, setEditPassingScore] = useState<number>(60);
  const [editWeightage, setEditWeightage] = useState<number>(25);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    fetchDomains();
  }, []);

  const fetchDomains = async () => {
    try {
      const res = await apiClient.get('/assessment/domains');
      setDomains(res.data);
      if (res.data.length > 0) {
        setSelectedDomain(res.data[0]);
        if (res.data[0].rounds.length > 0) {
          selectRound(res.data[0].rounds[0]);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const selectRound = async (r: RoundSummary) => {
    setSelectedRound(r);
    setEditDuration(r.duration_minutes);
    setEditPassingScore(r.passing_score);
    setEditWeightage(r.weightage_percent);
    setIsEditing(false);

    try {
      const qRes = await apiClient.get(`/assessment/admin/rounds/${r.id}/questions`);
      setQuestions(qRes.data);
    } catch (e) {
      console.error('Failed to load questions for round', e);
      setQuestions([]);
    }
  };

  const handleSaveRoundConfig = async () => {
    if (!selectedRound) return;
    setIsSaving(true);
    try {
      await apiClient.put(`/assessment/admin/rounds/${selectedRound.id}`, {
        duration_minutes: editDuration,
        passing_score: editPassingScore,
        weightage_percent: editWeightage
      });
      alert('Round configuration saved successfully!');
      setIsEditing(false);
      fetchDomains();
    } catch (e) {
      console.error('Failed to update round config', e);
      alert('Failed to save changes.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 font-sans">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#F8F5ED]">
          Assessment Track & Round Configuration Manager
        </h1>
        <p className="text-xs text-[#9E988A] mt-1">
          Customize exam durations, passing benchmarks, grading policies, and inspect seeded question banks.
        </p>
      </div>

      {/* Domain Track Selector */}
      <div className="flex flex-wrap gap-2">
        {domains.map((d) => (
          <button
            key={d.id}
            onClick={() => {
              setSelectedDomain(d);
              if (d.rounds.length > 0) selectRound(d.rounds[0]);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition cursor-pointer border ${
              selectedDomain?.id === d.id
                ? 'bg-[#C9A227] text-[#11110F] border-[#C9A227]'
                : 'bg-[#1C1B18] text-[#9E988A] border-[#2A2824] hover:text-[#F8F5ED]'
            }`}
          >
            {d.title}
          </button>
        ))}
      </div>

      {/* Main Grid: Rounds & Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Rounds List */}
        <div className="lg:col-span-4 bg-[#1C1B18] border border-[#2A2824] rounded-2xl p-4 shadow-xl space-y-2">
          <h3 className="text-xs font-bold text-[#9E988A] uppercase font-mono px-1 pb-2 border-b border-[#2A2824]">
            Rounds in Track ({selectedDomain?.rounds.length || 0})
          </h3>
          <div className="space-y-1.5 max-h-[70vh] overflow-y-auto">
            {(selectedDomain?.rounds || []).map((r) => (
              <button
                key={r.id}
                onClick={() => selectRound(r)}
                className={`w-full text-left p-3 rounded-xl border text-xs font-mono transition flex items-center justify-between cursor-pointer ${
                  selectedRound?.id === r.id
                    ? 'bg-[#C9A227]/10 border-[#C9A227] text-[#F8F5ED]'
                    : 'bg-[#141311] border-[#2A2824] text-[#9E988A] hover:border-[#C9A227]/40'
                }`}
              >
                <div>
                  <div className="font-bold text-[#F8F5ED]">Round {r.round_number}: {r.title}</div>
                  <div className="text-[10px] text-[#9E988A]">{r.round_type}</div>
                </div>
                <span className="text-[10px] text-[#C9A227]">{r.duration_minutes}m</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right Round Config & Question Bank */}
        <div className="lg:col-span-8 flex flex-col space-y-4">
          {selectedRound && (
            <>
              {/* Round Policy Editor */}
              <div className="bg-[#1C1B18] border border-[#2A2824] rounded-2xl p-5 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-[#2A2824] pb-3">
                  <div>
                    <span className="text-[10px] font-mono text-[#E3C766] uppercase">Round {selectedRound.round_number} Parameters</span>
                    <h2 className="text-sm font-bold text-[#F8F5ED]">{selectedRound.title}</h2>
                  </div>

                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="py-1.5 px-3 rounded-xl bg-[#141311] text-xs font-bold text-[#C9A227] border border-[#2A2824] hover:bg-[#24231F] flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit Rules</span>
                    </button>
                  ) : (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setIsEditing(false)}
                        className="py-1.5 px-3 rounded-xl bg-[#141311] text-xs font-bold text-[#9E988A] border border-[#2A2824] cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveRoundConfig}
                        disabled={isSaving}
                        className="py-1.5 px-3.5 rounded-xl bg-[#C9A227] text-xs font-bold text-[#11110F] shadow flex items-center space-x-1.5 cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Config</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
                  <div className="p-3 bg-[#141311] rounded-xl border border-[#2A2824] space-y-1">
                    <span className="text-[10px] uppercase text-[#9E988A]">Duration (Minutes)</span>
                    {isEditing ? (
                      <input
                        type="number"
                        value={editDuration}
                        onChange={(e) => setEditDuration(Number(e.target.value))}
                        className="w-full bg-[#1C1B18] text-[#F8F5ED] border border-[#2A2824] rounded-lg px-2 py-1"
                      />
                    ) : (
                      <div className="font-bold text-[#F8F5ED]">{selectedRound.duration_minutes} Mins</div>
                    )}
                  </div>

                  <div className="p-3 bg-[#141311] rounded-xl border border-[#2A2824] space-y-1">
                    <span className="text-[10px] uppercase text-[#9E988A]">Passing Benchmark (%)</span>
                    {isEditing ? (
                      <input
                        type="number"
                        value={editPassingScore}
                        onChange={(e) => setEditPassingScore(Number(e.target.value))}
                        className="w-full bg-[#1C1B18] text-[#F8F5ED] border border-[#2A2824] rounded-lg px-2 py-1"
                      />
                    ) : (
                      <div className="font-bold text-[#4ADE80]">{selectedRound.passing_score}%</div>
                    )}
                  </div>

                  <div className="p-3 bg-[#141311] rounded-xl border border-[#2A2824] space-y-1">
                    <span className="text-[10px] uppercase text-[#9E988A]">Weightage (%)</span>
                    {isEditing ? (
                      <input
                        type="number"
                        value={editWeightage}
                        onChange={(e) => setEditWeightage(Number(e.target.value))}
                        className="w-full bg-[#1C1B18] text-[#F8F5ED] border border-[#2A2824] rounded-lg px-2 py-1"
                      />
                    ) : (
                      <div className="font-bold text-[#C9A227]">{selectedRound.weightage_percent}%</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Seeded Question Bank Inspection */}
              <div className="bg-[#1C1B18] border border-[#2A2824] rounded-2xl p-5 shadow-xl space-y-3 flex-1">
                <div className="flex items-center justify-between border-b border-[#2A2824] pb-2.5">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-[#C9A227]" />
                    <h3 className="text-xs font-bold text-[#F8F5ED]">
                      Question Bank ({questions.length} Items Seeded)
                    </h3>
                  </div>
                </div>

                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {questions.map((q, idx) => (
                    <div key={q.id} className="p-3 bg-[#141311] rounded-xl border border-[#2A2824] space-y-1 text-xs font-mono">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-[#F8F5ED]">Q{idx + 1}: {q.title}</span>
                        <span className="text-[10px] text-[#9E988A] bg-[#1C1B18] px-2 py-0.5 rounded border border-[#2A2824]">
                          {q.question_type} • {q.marks} Marks
                        </span>
                      </div>
                      <p className="text-[11px] text-[#9E988A] line-clamp-2">{q.candidate_content}</p>
                      {q.correct_answer && (
                        <div className="text-[10px] text-[#4ADE80] pt-1">
                          Correct Answer: <span className="font-bold">{q.correct_answer}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
