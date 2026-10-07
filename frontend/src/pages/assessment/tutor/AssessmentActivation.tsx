import React, { useState, useEffect } from 'react';
import { DomainDetail, ActivationRequestItem } from '../../../types/assessment';
import apiClient from '../../../api/client';
import { Send, CheckSquare, Square, Users, Sparkles, CheckCircle2, Clock, AlertCircle, Layers, Check, Sliders } from 'lucide-react';
import { formatDateTime } from '../../../utils/dateUtils';

interface AcademicClassOption {
  id: number;
  name: string;
  programme_id: number;
  programme_name?: string;
  batch_name: string;
  section_name: string;
}

interface StudentOption {
  id: number;
  register_number: string;
  full_name: string;
}

export const AssessmentActivation: React.FC = () => {
  const [domains, setDomains] = useState<DomainDetail[]>([]);
  const [classes, setClasses] = useState<AcademicClassOption[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [selectedDomainId, setSelectedDomainId] = useState<number | null>(null);
  const [selectedRoundIds, setSelectedRoundIds] = useState<number[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [notes, setNotes] = useState<string>('');
  const [complexityLevel, setComplexityLevel] = useState<'Balanced' | 'Easy' | 'Medium' | 'Hard'>('Balanced');
  const [startPreset, setStartPreset] = useState<'IMMEDIATE' | '1_HOUR' | '2_HOURS' | 'CUSTOM'>('IMMEDIATE');
  const [customStartTime, setCustomStartTime] = useState<string>('');
  const [windowDuration, setWindowDuration] = useState<'2_HOURS' | '4_HOURS' | '24_HOURS' | '7_DAYS' | '30_DAYS'>('30_DAYS');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [myRequests, setMyRequests] = useState<ActivationRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      fetchClassStudents(selectedClassId);
    } else {
      setStudents([]);
      setSelectedStudentIds([]);
    }
  }, [selectedClassId]);

  // When selected domain changes, select all its rounds by default
  useEffect(() => {
    if (selectedDomainId) {
      const currentDom = domains.find((d) => d.id === selectedDomainId);
      if (currentDom && currentDom.rounds && currentDom.rounds.length > 0) {
        setSelectedRoundIds(currentDom.rounds.map((r) => r.id));
      } else {
        setSelectedRoundIds([]);
      }
    }
  }, [selectedDomainId, domains]);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [domRes, classRes, reqRes] = await Promise.all([
        apiClient.get('/assessment/domains'),
        apiClient.get('/master/classes'),
        apiClient.get('/assessment/activation-requests')
      ]);
      setDomains(domRes.data);
      setClasses(classRes.data);
      setMyRequests(reqRes.data);
      if (domRes.data.length > 0) {
        setSelectedDomainId(domRes.data[0].id);
        if (domRes.data[0].rounds) {
          setSelectedRoundIds(domRes.data[0].rounds.map((r: any) => r.id));
        }
      }
      if (classRes.data.length > 0) setSelectedClassId(classRes.data[0].id);
    } catch (e) {
      console.error('Failed to load initial activation data', e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClassStudents = async (classId: number) => {
    try {
      const res = await apiClient.get(`/users/students?academic_class_id=${classId}`);
      const mapped = (res.data || []).map((s: any) => ({
        id: s.id,
        register_number: s.register_number,
        full_name: s.user?.full_name || s.register_number
      }));
      setStudents(mapped);
      setSelectedStudentIds(mapped.map((s: any) => s.id)); // Default select all
    } catch (e) {
      console.error('Failed to load class students', e);
    }
  };

  const selectedDomain = domains.find((d) => d.id === selectedDomainId);

  const handleToggleAllRounds = () => {
    if (!selectedDomain || !selectedDomain.rounds) return;
    if (selectedRoundIds.length === selectedDomain.rounds.length) {
      setSelectedRoundIds([]);
    } else {
      setSelectedRoundIds(selectedDomain.rounds.map((r) => r.id));
    }
  };

  const handleToggleRound = (roundId: number) => {
    if (selectedRoundIds.includes(roundId)) {
      setSelectedRoundIds(selectedRoundIds.filter((id) => id !== roundId));
    } else {
      setSelectedRoundIds([...selectedRoundIds, roundId]);
    }
  };

  const handleToggleSelectAll = () => {
    if (selectedStudentIds.length === students.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(students.map((s) => s.id));
    }
  };

  const handleToggleStudent = (id: number) => {
    if (selectedStudentIds.includes(id)) {
      setSelectedStudentIds(selectedStudentIds.filter((sid) => sid !== id));
    } else {
      setSelectedStudentIds([...selectedStudentIds, id]);
    }
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDomainId || !selectedClassId || selectedStudentIds.length === 0) {
      alert('Please select a domain, an academic class, and at least one student.');
      return;
    }

    if (selectedRoundIds.length === 0) {
      alert('Please select at least one assessment round.');
      return;
    }

    setIsSubmitting(true);
    try {
      let validFrom = new Date();
      if (startPreset === '1_HOUR') {
        validFrom = new Date(Date.now() + 60 * 60 * 1000);
      } else if (startPreset === '2_HOURS') {
        validFrom = new Date(Date.now() + 2 * 60 * 60 * 1000);
      } else if (startPreset === 'CUSTOM' && customStartTime) {
        validFrom = new Date(customStartTime);
      }

      let durationMs = 30 * 24 * 60 * 60 * 1000;
      if (windowDuration === '2_HOURS') durationMs = 2 * 60 * 60 * 1000;
      else if (windowDuration === '4_HOURS') durationMs = 4 * 60 * 60 * 1000;
      else if (windowDuration === '24_HOURS') durationMs = 24 * 60 * 60 * 1000;
      else if (windowDuration === '7_DAYS') durationMs = 7 * 24 * 60 * 60 * 1000;

      const validUntil = new Date(validFrom.getTime() + durationMs);

      await apiClient.post('/assessment/activation-requests', {
        domain_id: selectedDomainId,
        academic_class_id: selectedClassId,
        candidate_student_ids: selectedStudentIds,
        selected_round_ids: selectedRoundIds,
        complexity_level: complexityLevel,
        valid_from: validFrom.toISOString(),
        valid_until: validUntil.toISOString(),
        notes: notes || undefined
      });

      alert('Assessment track activated successfully! Candidates can now directly access their allocated rounds.');
      setNotes('');
      // Refresh requests
      const reqRes = await apiClient.get('/assessment/activation-requests');
      setMyRequests(reqRes.data);
    } catch (err: any) {
      console.error('Failed to submit activation request', err);
      alert(err.response?.data?.detail || 'Failed to submit request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto p-4 sm:p-6 font-sans">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#F8F5ED]">
          Assessment Track Activation & Cohort Roster
        </h1>
        <p className="text-xs text-[#9E988A] mt-1">
          Select target assessment track, configure included rounds, schedule timing, and activate directly for candidate students.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Configuration */}
        <div className="lg:col-span-6 bg-[#1C1B18] border border-[#2A2824] rounded-2xl p-5 shadow-xl space-y-4">
          <h2 className="text-sm font-bold text-[#F8F5ED] flex items-center space-x-2 border-b border-[#2A2824] pb-2.5">
            <Sparkles className="w-4 h-4 text-[#C9A227]" />
            <span>Activate Assessment Track</span>
          </h2>

          <form onSubmit={handleSubmitRequest} className="space-y-4 text-xs font-mono">
            {/* Target Assessment Domain */}
            <div className="space-y-1.5">
              <label className="text-[#9E988A] uppercase text-[10px] font-bold">Target Assessment Domain</label>
              <select
                value={selectedDomainId || ''}
                onChange={(e) => setSelectedDomainId(Number(e.target.value))}
                className="w-full bg-[#141311] text-[#F8F5ED] border border-[#2A2824] rounded-xl px-3 py-2 focus:outline-none focus:border-[#C9A227]"
              >
                {domains.map((d) => (
                  <option key={d.id} value={d.id}>{d.title}</option>
                ))}
              </select>
            </div>

            {/* Dynamic Assessment Rounds Selection */}
            {selectedDomain && selectedDomain.rounds && selectedDomain.rounds.length > 0 && (
              <div className="space-y-2 bg-[#141311] p-3.5 rounded-xl border border-[#2A2824]">
                <div className="flex items-center justify-between">
                  <label className="text-[#E3C766] uppercase text-[10px] font-bold flex items-center space-x-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#C9A227]" />
                    <span>Included Rounds ({selectedRoundIds.length}/{selectedDomain.rounds.length} Selected)</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleToggleAllRounds}
                    className="text-[10px] text-[#C9A227] hover:underline cursor-pointer font-bold"
                  >
                    {selectedRoundIds.length === selectedDomain.rounds.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

                <div className="space-y-2 pt-1 max-h-52 overflow-y-auto pr-1">
                  {selectedDomain.rounds.map((r) => {
                    const isChecked = selectedRoundIds.includes(r.id);
                    const cleanTitle = r.title.replace(/^Round\s*\d+[\s:–-]+/i, '').trim();
                    return (
                      <div
                        key={r.id}
                        onClick={() => handleToggleRound(r.id)}
                        className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                          isChecked
                            ? 'bg-[#C9A227]/10 border-[#C9A227]/50 text-[#F8F5ED]'
                            : 'bg-[#1C1B18]/60 border-[#2A2824] text-[#9E988A] opacity-60 hover:opacity-100'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <div className={`w-4 h-4 rounded flex items-center justify-center border transition shrink-0 ${
                            isChecked ? 'bg-[#C9A227] border-[#C9A227] text-[#11110F]' : 'border-[#4A4740] bg-[#141311]'
                          }`}>
                            {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold truncate">Round {r.round_number}: {cleanTitle || r.title}</p>
                            <p className="text-[10px] text-[#9E988A] truncate font-mono capitalize">
                              {r.round_type.replace(/_/g, ' ')} • {r.duration_minutes}m • Pass: {r.passing_score}%
                            </p>
                          </div>
                        </div>
                        <span className={`text-[9px] font-mono px-2 py-0.5 rounded border shrink-0 ${
                          isChecked ? 'bg-[#C9A227]/20 text-[#E3C766] border-[#C9A227]/30 font-bold' : 'bg-[#141311] text-[#9E988A] border-[#2A2824]'
                        }`}>
                          {isChecked ? 'Included' : 'Excluded'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Assessment Complexity Level (Max 7 Questions Per Round) */}
            <div className="space-y-2 bg-[#141311] p-3.5 rounded-xl border border-[#2A2824]">
              <div className="flex items-center justify-between">
                <label className="text-[#E3C766] uppercase text-[10px] font-bold flex items-center space-x-1.5">
                  <Sliders className="w-3.5 h-3.5 text-[#C9A227]" />
                  <span>Question Complexity (Max 7 Questions / Round)</span>
                </label>
                <span className="text-[9px] font-mono text-[#9E988A]">Randomized Sampling</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                {[
                  {
                    id: 'Balanced',
                    label: 'Balanced',
                    desc: '2 Easy • 3 Med • 2 Hard',
                    tag: 'Recommended',
                    activeClass: 'bg-indigo-500/15 border-indigo-500/50 text-indigo-300 ring-1 ring-indigo-500/40'
                  },
                  {
                    id: 'Easy',
                    label: 'Easy',
                    desc: 'Foundational Focus',
                    tag: 'Beginner',
                    activeClass: 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 ring-1 ring-emerald-500/40'
                  },
                  {
                    id: 'Medium',
                    label: 'Medium',
                    desc: 'Standard Rigor',
                    tag: 'Core',
                    activeClass: 'bg-amber-500/15 border-amber-500/50 text-amber-300 ring-1 ring-amber-500/40'
                  },
                  {
                    id: 'Hard',
                    label: 'Hard',
                    desc: 'Advanced Challenge',
                    tag: 'Expert',
                    activeClass: 'bg-rose-500/15 border-rose-500/50 text-rose-300 ring-1 ring-rose-500/40'
                  },
                ].map((tier) => {
                  const isSelected = complexityLevel === tier.id;
                  return (
                    <button
                      key={tier.id}
                      type="button"
                      onClick={() => setComplexityLevel(tier.id as any)}
                      className={`p-2.5 rounded-xl border text-left transition relative cursor-pointer ${
                        isSelected
                          ? tier.activeClass
                          : 'bg-[#1C1B18]/60 border-[#2A2824] text-[#9E988A] hover:border-[#3E3B34] hover:text-[#D8D2C5]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs">{tier.label}</span>
                        <span className={`text-[8px] font-mono px-1 py-0.2 rounded uppercase ${
                          isSelected ? 'bg-white/10 text-white font-bold' : 'text-[#6B665E]'
                        }`}>
                          {tier.tag}
                        </span>
                      </div>
                      <p className="text-[9px] font-mono opacity-80 leading-tight">{tier.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Academic Class & Section */}
            <div className="space-y-1.5">
              <label className="text-[#9E988A] uppercase text-[10px] font-bold">Academic Class & Section</label>
              <select
                value={selectedClassId || ''}
                onChange={(e) => setSelectedClassId(Number(e.target.value))}
                className="w-full bg-[#141311] text-[#F8F5ED] border border-[#2A2824] rounded-xl px-3 py-2 focus:outline-none focus:border-[#C9A227]"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.batch_name} - {c.section_name})
                  </option>
                ))}
              </select>
            </div>

            {/* Assessment Start Timing Preset */}
            <div className="space-y-1.5">
              <label className="text-[#9E988A] uppercase text-[10px] font-bold">Assessment Start Schedule</label>
              <select
                value={startPreset}
                onChange={(e) => setStartPreset(e.target.value as any)}
                className="w-full bg-[#141311] text-[#F8F5ED] border border-[#2A2824] rounded-xl px-3 py-2 focus:outline-none focus:border-[#C9A227]"
              >
                <option value="IMMEDIATE">⚡ Start Immediately (Now)</option>
                <option value="1_HOUR">⏳ Schedule in 1 Hour</option>
                <option value="2_HOURS">⏳ Schedule in 2 Hours</option>
                <option value="CUSTOM">📅 Custom Start Date & Time</option>
              </select>
            </div>

            {startPreset === 'CUSTOM' && (
              <div className="space-y-1.5">
                <label className="text-[#9E988A] uppercase text-[10px] font-bold">Custom Start Time</label>
                <input
                  type="datetime-local"
                  value={customStartTime}
                  onChange={(e) => setCustomStartTime(e.target.value)}
                  className="w-full bg-[#141311] text-[#F8F5ED] border border-[#2A2824] rounded-xl px-3 py-2 focus:outline-none focus:border-[#C9A227]"
                />
              </div>
            )}

            {/* Assessment Window Duration */}
            <div className="space-y-1.5">
              <label className="text-[#9E988A] uppercase text-[10px] font-bold">Access Window Duration</label>
              <select
                value={windowDuration}
                onChange={(e) => setWindowDuration(e.target.value as any)}
                className="w-full bg-[#141311] text-[#F8F5ED] border border-[#2A2824] rounded-xl px-3 py-2 focus:outline-none focus:border-[#C9A227]"
              >
                <option value="2_HOURS">⏱️ 2 Hours Window</option>
                <option value="4_HOURS">⏱️ 4 Hours Window</option>
                <option value="24_HOURS">📆 24 Hours (1 Day)</option>
                <option value="7_DAYS">📆 7 Days</option>
                <option value="30_DAYS">📆 30 Days</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[#9E988A] uppercase text-[10px] font-bold">Tutor Notes / Remarks (Optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional remarks or cohort instructions..."
                rows={2}
                className="w-full bg-[#141311] text-[#F8F5ED] border border-[#2A2824] rounded-xl p-3 focus:outline-none focus:border-[#C9A227] font-sans"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || selectedStudentIds.length === 0 || selectedRoundIds.length === 0}
              className="w-full py-2.5 px-4 bg-[#C9A227] hover:bg-[#B89220] disabled:opacity-40 text-[#11110F] font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center space-x-2 cursor-pointer font-sans"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isSubmitting ? 'Activating Assessment...' : `Activate Assessment (${selectedStudentIds.length} Students, ${selectedRoundIds.length} Rounds)`}</span>
            </button>
          </form>
        </div>

        {/* Right Area: Student Roster Checklist */}
        <div className="lg:col-span-6 bg-[#1C1B18] border border-[#2A2824] rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#2A2824] pb-2.5">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-[#C9A227]" />
                <h3 className="text-xs font-bold text-[#F8F5ED]">Select Candidate Students</h3>
              </div>

              <button
                type="button"
                onClick={handleToggleSelectAll}
                className="text-xs font-mono text-[#C9A227] hover:underline cursor-pointer"
              >
                {selectedStudentIds.length === students.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            {students.length === 0 ? (
              <div className="p-8 text-center text-xs font-mono text-[#9E988A]">
                No students found in designated academic class.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[32rem] overflow-y-auto pr-1">
                {students.map((s) => {
                  const isChecked = selectedStudentIds.includes(s.id);
                  return (
                    <div
                      key={s.id}
                      onClick={() => handleToggleStudent(s.id)}
                      className={`p-2.5 rounded-xl border text-xs font-mono transition flex items-center space-x-2.5 cursor-pointer ${
                        isChecked
                          ? 'bg-[#C9A227]/10 border-[#C9A227]/60 text-[#F8F5ED]'
                          : 'bg-[#141311] border-[#2A2824] text-[#9E988A] hover:border-[#C9A227]/30'
                      }`}
                    >
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-[#C9A227] shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-[#6B665E] shrink-0" />
                      )}
                      <div className="truncate">
                        <div className="font-bold text-[#F8F5ED] truncate">{s.full_name}</div>
                        <div className="text-[10px] text-[#9E988A]">{s.register_number}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="text-[11px] font-mono text-[#9E988A] pt-2 border-t border-[#2A2824] flex items-center justify-between">
            <span>Selected Candidates: <strong className="text-[#F8F5ED]">{selectedStudentIds.length}</strong> / {students.length}</span>
            <span className="text-[#4ADE80] font-bold">Direct Activation Enabled</span>
          </div>
        </div>
      </div>

      {/* Recent Activation Requests Table */}
      <div className="bg-[#1C1B18] border border-[#2A2824] rounded-2xl p-5 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-[#F8F5ED]">Track Activations History</h3>

        {myRequests.length === 0 ? (
          <div className="p-6 text-center text-xs font-mono text-[#9E988A]">
            No previous track activations recorded.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#141311] text-[#9E988A] border-b border-[#2A2824]">
                <tr>
                  <th className="p-3 font-bold">Activation ID</th>
                  <th className="p-3 font-bold">Domain Track</th>
                  <th className="p-3 font-bold">Class & Section</th>
                  <th className="p-3 font-bold">Rounds</th>
                  <th className="p-3 font-bold">Complexity</th>
                  <th className="p-3 font-bold">Candidates</th>
                  <th className="p-3 font-bold">Activated At</th>
                  <th className="p-3 font-bold">Status</th>
                  <th className="p-3 font-bold">Activated By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2824] text-[#D8D2C5]">
                {myRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-[#24231F]">
                    <td className="p-3 font-bold text-[#F8F5ED]">REQ-{req.id}</td>
                    <td className="p-3">{req.domain_title}</td>
                    <td className="p-3">{req.batch_name} ({req.section_name})</td>
                    <td className="p-3">
                      {req.selected_round_ids && req.selected_round_ids.length > 0 ? (
                        <span className="text-[#E3C766]">{req.selected_round_ids.length} Rounds</span>
                      ) : (
                        <span className="text-[#9E988A]">All Rounds</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                        req.complexity_level === 'Easy'
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : req.complexity_level === 'Hard'
                          ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                          : req.complexity_level === 'Medium'
                          ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                          : 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30'
                      }`}>
                        {req.complexity_level || 'Balanced'}
                      </span>
                    </td>
                    <td className="p-3">{req.candidate_count} Students</td>
                    <td className="p-3 text-[#9E988A]">{formatDateTime(req.requested_at)}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          req.status === 'APPROVED'
                            ? 'bg-[#4ADE80]/15 text-[#4ADE80] border border-[#4ADE80]/30'
                            : req.status === 'REJECTED'
                            ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                            : 'bg-[#EAB308]/15 text-[#EAB308] border border-[#EAB308]/30'
                        }`}
                      >
                        {req.status}
                      </span>
                    </td>
                    <td className="p-3 text-[#9E988A]">{req.reviewed_by_name || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
