import React, { useState, useEffect } from 'react';
import { DomainDetail, ActivationRequestItem } from '../../../types/assessment';
import apiClient from '../../../api/client';
import { Send, CheckSquare, Square, Users, Sparkles, CheckCircle2, Clock, AlertCircle, Layers, Check, Sliders } from 'lucide-react';
import { formatDateTime } from '../../../utils/dateUtils';
import { notify } from '../../../components/ui/Dialogs';

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
        full_name: s.full_name || s.user?.full_name || s.register_number
      }));
      setStudents(mapped);
      setSelectedStudentIds([]);
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
      notify('Please select a domain, an academic class, and at least one student.');
      return;
    }

    if (selectedRoundIds.length === 0) {
      notify('Please select at least one assessment round.');
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

      notify('Assessment track activated successfully! Candidates can now directly access their allocated rounds.');
      setNotes('');
      const reqRes = await apiClient.get('/assessment/activation-requests');
      setMyRequests(reqRes.data);
    } catch (err: any) {
      console.error('Failed to submit activation request', err);
      notify(err.response?.data?.detail || 'Failed to submit request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto p-4 sm:p-6 font-sans">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A]">
          Assessment Track Activation & Cohort Roster
        </h1>
        <p className="text-xs text-[#64748B] mt-1">
          Select target assessment track, configure included rounds, schedule timing, and activate directly for candidate students.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Configuration */}
        <div className="lg:col-span-6 bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-[#0F172A] flex items-center space-x-2 border-b border-[#E2E8F0] pb-2.5">
            <Sparkles className="w-4 h-4 text-[#FF5500]" />
            <span>Activate Assessment Track</span>
          </h2>

          <form onSubmit={handleSubmitRequest} className="space-y-4 text-xs font-mono">
            {/* Target Assessment Domain */}
            <div className="space-y-1.5">
              <label className="text-[#64748B] uppercase text-[10px] font-bold">Target Assessment Domain</label>
              <select
                value={selectedDomainId || ''}
                onChange={(e) => setSelectedDomainId(Number(e.target.value))}
                className="w-full bg-[#F8FAFC] text-[#0F172A] border border-[#E2E8F0] rounded-xl px-3 py-2 focus:outline-none focus:border-[#FF5500]"
              >
                {domains.map((d) => (
                  <option key={d.id} value={d.id}>{d.title}</option>
                ))}
              </select>
            </div>

            {/* Dynamic Assessment Rounds Selection */}
            {selectedDomain && selectedDomain.rounds && selectedDomain.rounds.length > 0 && (
              <div className="space-y-2 bg-[#F8FAFC] p-3.5 rounded-xl border border-[#E2E8F0]">
                <div className="flex items-center justify-between">
                  <label className="text-[#FF5500] uppercase text-[10px] font-bold flex items-center space-x-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#FF5500]" />
                    <span>Included Rounds ({selectedRoundIds.length}/{selectedDomain.rounds.length} Selected)</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleToggleAllRounds}
                    className="text-[10px] text-[#FF5500] hover:text-[#E64D00] hover:underline cursor-pointer font-bold"
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
                            ? 'bg-[#FFF8F5] border-[#FF5500]/50 text-[#0F172A]'
                            : 'bg-white border-[#E2E8F0] text-[#64748B] opacity-70 hover:opacity-100'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <div className={`w-4 h-4 rounded flex items-center justify-center border transition shrink-0 ${
                            isChecked ? 'bg-[#FF5500] border-[#FF5500] text-white' : 'border-[#CBD5E1] bg-white'
                          }`}>
                            {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold truncate">Round {r.round_number}: {cleanTitle || r.title}</p>
                            <p className="text-[10px] text-[#64748B] truncate font-mono capitalize">
                              {r.round_type.replace(/_/g, ' ')} • {r.duration_minutes}m • Pass: {r.passing_score}%
                            </p>
                          </div>
                        </div>
                        <span className={`text-[9px] font-mono px-2 py-0.5 rounded border shrink-0 ${
                          isChecked ? 'bg-[#FF5500]/10 text-[#FF5500] border-[#FF5500]/25 font-bold' : 'bg-white text-[#64748B] border-[#E2E8F0]'
                        }`}>
                          {isChecked ? 'Included' : 'Excluded'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Assessment Complexity Level */}
            <div className="space-y-2 bg-[#F8FAFC] p-3.5 rounded-xl border border-[#E2E8F0]">
              <div className="flex items-center justify-between">
                <label className="text-[#FF5500] uppercase text-[10px] font-bold flex items-center space-x-1.5">
                  <Sliders className="w-3.5 h-3.5 text-[#FF5500]" />
                  <span>Question Complexity (Max 7 Questions / Round)</span>
                </label>
                <span className="text-[9px] font-mono text-[#64748B]">Randomized Sampling</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                {[
                  {
                    id: 'Balanced',
                    label: 'Balanced',
                    desc: 'Mix of Easy, Medium & Hard',
                    tag: 'Recommended',
                    activeClass: 'bg-[#FF5500]/10 border-[#FF5500] text-[#FF5500] ring-1 ring-[#FF5500]/30'
                  },
                  {
                    id: 'Easy',
                    label: 'Easy',
                    desc: 'Foundational Focus',
                    tag: 'Beginner',
                    activeClass: 'bg-emerald-50 border-emerald-300 text-emerald-800 ring-1 ring-emerald-300'
                  },
                  {
                    id: 'Medium',
                    label: 'Medium',
                    desc: 'Standard Rigor',
                    tag: 'Core',
                    activeClass: 'bg-amber-50 border-amber-300 text-amber-800 ring-1 ring-amber-300'
                  },
                  {
                    id: 'Hard',
                    label: 'Hard',
                    desc: 'Advanced, incl. Expert problems',
                    tag: 'Expert',
                    activeClass: 'bg-rose-50 border-rose-300 text-rose-800 ring-1 ring-rose-300'
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
                          : 'bg-white border-[#E2E8F0] text-[#64748B] hover:border-[#CBD5E1] hover:text-[#0F172A]'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-1 mb-1 min-w-0">
                        <span className="font-bold text-xs">{tier.label}</span>
                        <span className={`text-[8px] font-mono px-1 py-0.2 rounded uppercase whitespace-nowrap ${
                          isSelected ? 'bg-white/80 font-bold' : 'text-[#94A3B8]'
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
              <label className="text-[#64748B] uppercase text-[10px] font-bold">Academic Class & Section</label>
              <select
                value={selectedClassId || ''}
                onChange={(e) => setSelectedClassId(Number(e.target.value))}
                className="w-full bg-[#F8FAFC] text-[#0F172A] border border-[#E2E8F0] rounded-xl px-3 py-2 focus:outline-none focus:border-[#FF5500]"
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
              <label className="text-[#64748B] uppercase text-[10px] font-bold">Assessment Start Schedule</label>
              <select
                value={startPreset}
                onChange={(e) => setStartPreset(e.target.value as any)}
                className="w-full bg-[#F8FAFC] text-[#0F172A] border border-[#E2E8F0] rounded-xl px-3 py-2 focus:outline-none focus:border-[#FF5500]"
              >
                <option value="IMMEDIATE">⚡ Start Immediately (Now)</option>
                <option value="1_HOUR">⏳ Schedule in 1 Hour</option>
                <option value="2_HOURS">⏳ Schedule in 2 Hours</option>
                <option value="CUSTOM">📅 Custom Start Date & Time</option>
              </select>
            </div>

            {startPreset === 'CUSTOM' && (
              <div className="space-y-1.5">
                <label className="text-[#64748B] uppercase text-[10px] font-bold">Custom Start Time</label>
                <input
                  type="datetime-local"
                  value={customStartTime}
                  onChange={(e) => setCustomStartTime(e.target.value)}
                  className="w-full bg-[#F8FAFC] text-[#0F172A] border border-[#E2E8F0] rounded-xl px-3 py-2 focus:outline-none focus:border-[#FF5500]"
                />
              </div>
            )}

            {/* Assessment Window Duration */}
            <div className="space-y-1.5">
              <label className="text-[#64748B] uppercase text-[10px] font-bold">Access Window Duration</label>
              <select
                value={windowDuration}
                onChange={(e) => setWindowDuration(e.target.value as any)}
                className="w-full bg-[#F8FAFC] text-[#0F172A] border border-[#E2E8F0] rounded-xl px-3 py-2 focus:outline-none focus:border-[#FF5500]"
              >
                <option value="2_HOURS">⏱️ 2 Hours Window</option>
                <option value="4_HOURS">⏱️ 4 Hours Window</option>
                <option value="24_HOURS">📆 24 Hours (1 Day)</option>
                <option value="7_DAYS">📆 7 Days</option>
                <option value="30_DAYS">📆 30 Days</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[#64748B] uppercase text-[10px] font-bold">Tutor Notes / Remarks (Optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional remarks or cohort instructions..."
                rows={2}
                className="w-full bg-[#F8FAFC] text-[#0F172A] border border-[#E2E8F0] rounded-xl p-3 focus:outline-none focus:border-[#FF5500] font-sans"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || selectedStudentIds.length === 0 || selectedRoundIds.length === 0}
              className="w-full py-2.5 px-4 bg-[#FF5500] hover:bg-[#E64D00] disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center space-x-2 cursor-pointer font-sans"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isSubmitting ? 'Activating Assessment...' : `Activate Assessment (${selectedStudentIds.length} Students, ${selectedRoundIds.length} Rounds)`}</span>
            </button>
          </form>
        </div>

        {/* Right Area: Student Roster Checklist */}
        <div className="lg:col-span-6 bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2.5">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-[#FF5500]" />
                <h3 className="text-xs font-bold text-[#0F172A]">Select Candidate Students</h3>
              </div>

              <button
                type="button"
                onClick={handleToggleSelectAll}
                className="text-xs font-mono text-[#FF5500] hover:text-[#E64D00] hover:underline cursor-pointer font-bold"
              >
                {selectedStudentIds.length === students.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            {students.length === 0 ? (
              <div className="p-8 text-center text-xs font-mono text-[#64748B]">
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
                          ? 'bg-[#FFF8F5] border-[#FF5500]/60 text-[#0F172A]'
                          : 'bg-white border-[#E2E8F0] text-[#64748B] hover:border-[#FF5500]/30'
                      }`}
                    >
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-[#FF5500] shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-[#CBD5E1] shrink-0" />
                      )}
                      <div className="truncate">
                        <div className="font-bold text-[#0F172A] truncate">{s.full_name}</div>
                        <div className="text-[10px] text-[#64748B]">{s.register_number}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="text-[11px] font-mono text-[#64748B] pt-2 border-t border-[#E2E8F0] flex items-center justify-between">
            <span>Selected Candidates: <strong className="text-[#0F172A]">{selectedStudentIds.length}</strong> / {students.length}</span>
            <span className="text-emerald-600 font-bold">Direct Activation Enabled</span>
          </div>
        </div>
      </div>

      {/* Recent Activation Requests Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-[#0F172A]">Track Activations History</h3>

        {myRequests.length === 0 ? (
          <div className="p-6 text-center text-xs font-mono text-[#64748B]">
            No previous track activations recorded.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#F8FAFC] text-[#64748B] border-b border-[#E2E8F0]">
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
              <tbody className="divide-y divide-[#E2E8F0] text-[#475569]">
                {myRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-[#F8FAFC]">
                    <td className="p-3 font-bold text-[#0F172A]">REQ-{req.id}</td>
                    <td className="p-3">{req.domain_title}</td>
                    <td className="p-3">{req.batch_name} ({req.section_name})</td>
                    <td className="p-3">
                      {req.selected_round_ids && req.selected_round_ids.length > 0 ? (
                        <span className="text-[#FF5500] font-medium">{req.selected_round_ids.length} Rounds</span>
                      ) : (
                        <span className="text-[#64748B]">All Rounds</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                        req.complexity_level === 'Easy'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : req.complexity_level === 'Hard'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : req.complexity_level === 'Medium'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      }`}>
                        {req.complexity_level || 'Balanced'}
                      </span>
                    </td>
                    <td className="p-3">{req.candidate_count} Students</td>
                    <td className="p-3 text-[#64748B]">{formatDateTime(req.requested_at)}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          req.status === 'APPROVED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : req.status === 'REJECTED'
                            ? 'bg-red-50 text-red-600 border border-red-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {req.status}
                      </span>
                    </td>
                    <td className="p-3 text-[#64748B]">{req.reviewed_by_name || '-'}</td>
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
