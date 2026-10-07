import React, { useState, useEffect } from 'react';
import apiClient from '../../../api/client';
import { useAuth } from '../../../context/AuthContext';
import {
  Briefcase, Clock, Calendar, Users, Edit3, Trash2, CheckCircle2,
  AlertCircle, Sparkles, Filter, ChevronRight, X, Plus, RefreshCw,
  BarChart3, CheckSquare, Square, Zap, Award, Play
} from 'lucide-react';
import {
  ActivationRoundsPerformance,
  DynamicRoundPerformance,
  RoundCandidateSummaryItem
} from '../../../types/assessment';
import { parseIsoDate, formatDateTime } from '../../../utils/dateUtils';

interface CandidateStudent {
  student_id: number;
  user_id: number;
  register_number: string;
  full_name: string;
  email: string;
}

interface ActivationSessionItem {
  id: number;
  domain_id: number;
  domain_title: string;
  academic_class_id: number;
  class_name: string;
  department_id?: number | null;
  department_name?: string | null;
  programme_name?: string | null;
  batch_name: string;
  section_name: string;
  requested_by_name: string;
  reviewed_by_name?: string | null;
  status: string; // PENDING, APPROVED, REJECTED, CANCELLED
  candidate_count: number;
  valid_from: string;
  valid_until: string;
  requested_at: string;
  reviewed_at?: string | null;
  rejection_reason?: string | null;
  notes?: string | null;
  candidate_students?: CandidateStudent[];
}

export const ActiveAssessmentsManager: React.FC<{ onNavigate?: (tab: string) => void }> = ({ onNavigate }) => {
  const { activeRole } = useAuth();
  const [sessions, setSessions] = useState<ActivationSessionItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Performance & Attempts Modal States
  const [selectedPerformance, setSelectedPerformance] = useState<ActivationRoundsPerformance | null>(null);
  const [activeRoundIndex, setActiveRoundIndex] = useState<number>(0);
  const [isPerformanceModalOpen, setIsPerformanceModalOpen] = useState<boolean>(false);
  const [selectedFailedIds, setSelectedFailedIds] = useState<number[]>([]);
  const [isGranting, setIsGranting] = useState<boolean>(false);

  // Edit / Reschedule Modal States
  const [selectedSession, setSelectedSession] = useState<ActivationSessionItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editValidFrom, setEditValidFrom] = useState<string>('');
  const [editValidUntil, setEditValidUntil] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/assessment/activation-requests');
      setSessions(res.data);
    } catch (err: any) {
      console.error('Failed to load active assessments', err);
      setActionMsg({ type: 'error', text: err.response?.data?.detail || 'Failed to load assessments.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenPerformance = async (session: ActivationSessionItem) => {
    try {
      const res = await apiClient.get(`/assessment/activation-requests/${session.id}/rounds-roster`);
      setSelectedPerformance(res.data);
      setActiveRoundIndex(0);
      setSelectedFailedIds([]);
      setIsPerformanceModalOpen(true);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to load round performance data.');
    }
  };

  const refreshPerformance = async (activationId: number) => {
    try {
      const res = await apiClient.get(`/assessment/activation-requests/${activationId}/rounds-roster`);
      setSelectedPerformance(res.data);
      setSelectedFailedIds([]);
    } catch (err) {
      console.error('Failed to refresh performance', err);
    }
  };

  const handleGrantAttempt = async (roundId: number, studentIds: number[]) => {
    if (!selectedPerformance || studentIds.length === 0) return;
    setIsGranting(true);
    try {
      await apiClient.post('/assessment/activation-requests/grant-attempt', {
        allocation_id: selectedPerformance.activation_id,
        round_id: roundId,
        student_ids: studentIds,
        reason: 'Granted by Class Tutor / HoD'
      });
      setActionMsg({
        type: 'success',
        text: `Successfully granted fresh attempt to ${studentIds.length} candidate(s)! The student panel now displays "Start Round".`
      });
      await refreshPerformance(selectedPerformance.activation_id);
    } catch (err: any) {
      console.error('Failed to grant attempt', err);
      alert(err.response?.data?.detail || 'Failed to grant attempt.');
    } finally {
      setIsGranting(false);
    }
  };

  const handleGrantAllFailed = (round: DynamicRoundPerformance) => {
    const allFailedIds = round.failed_students.map((s) => s.student_id);
    if (allFailedIds.length === 0) {
      alert('No failed candidates in this round to grant attempts.');
      return;
    }
    if (confirm(`Grant a fresh round attempt to ALL ${allFailedIds.length} failed candidate(s) in "${round.title}"?`)) {
      handleGrantAttempt(round.round_id, allFailedIds);
    }
  };

  const toggleSelectFailedStudent = (studentId: number) => {
    setSelectedFailedIds((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    );
  };

  const handleOpenEdit = (session: ActivationSessionItem) => {
    setSelectedSession(session);
    const fromDate = parseIsoDate(session.valid_from) || new Date();
    const untilDate = parseIsoDate(session.valid_until) || new Date();
    const formatLocal = (d: Date) => {
      const pad = (n: number) => (n < 10 ? '0' + n : n);
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };
    setEditValidFrom(formatLocal(fromDate));
    setEditValidUntil(formatLocal(untilDate));
    setEditNotes(session.notes || '');
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSession) return;
    setIsSaving(true);
    try {
      await apiClient.put(`/assessment/activation-requests/${selectedSession.id}`, {
        valid_from: new Date(editValidFrom).toISOString(),
        valid_until: new Date(editValidUntil).toISOString(),
        notes: editNotes
      });
      setActionMsg({ type: 'success', text: `Assessment #${selectedSession.id} updated successfully!` });
      setIsEditModalOpen(false);
      fetchSessions();
    } catch (err: any) {
      console.error('Failed to update assessment', err);
      alert(err.response?.data?.detail || 'Failed to update assessment.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete / revoke this assessment activation? All associated candidate allocations will be removed.')) {
      return;
    }
    try {
      await apiClient.delete(`/assessment/activation-requests/${id}`);
      setActionMsg({ type: 'success', text: `Assessment #${id} deleted successfully.` });
      fetchSessions();
    } catch (err: any) {
      console.error('Failed to delete assessment', err);
      alert(err.response?.data?.detail || 'Failed to delete assessment.');
    }
  };

  const getScheduleStatus = (validFrom: string, validUntil: string, reqStatus: string) => {
    if (reqStatus === 'PENDING') return { label: 'Pending HoD Approval', color: 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30' };
    if (reqStatus === 'REJECTED') return { label: 'Rejected', color: 'bg-red-500/15 text-red-400 border-red-500/30' };
    const now = new Date();
    const start = parseIsoDate(validFrom);
    const end = parseIsoDate(validUntil);
    if (!start || !end) return { label: 'Active', color: 'bg-[#4ADE80]/15 text-[#4ADE80] border-[#4ADE80]/30' };
    if (now < start) {
      const diffMins = Math.max(1, Math.floor((start.getTime() - now.getTime()) / (60 * 1000)));
      return { label: `Scheduled (Starts in ${diffMins}m)`, color: 'bg-[#E3C766]/15 text-[#E3C766] border-[#E3C766]/30' };
    }
    if (now > end) {
      return { label: 'Window Expired', color: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30' };
    }
    return { label: 'Live Now (Active)', color: 'bg-[#4ADE80]/15 text-[#4ADE80] border-[#4ADE80]/30' };
  };

  const formatClassLabel = (className?: string, batch?: string, sec?: string) => {
    if (!className) return batch ? `${batch} - Sec ${sec || 'A'}` : 'Assigned Class';
    const lowerClass = className.toLowerCase();
    const hasBatch = Boolean(batch && lowerClass.includes(batch.toLowerCase()));
    const hasSec = Boolean(
      sec && (
        lowerClass.includes(`sec ${sec.toLowerCase()}`) || 
        lowerClass.includes(`section ${sec.toLowerCase()}`) ||
        lowerClass.includes(`- ${sec.toLowerCase()}`)
      )
    );

    if (hasBatch && hasSec) {
      return className;
    }
    if (hasBatch) {
      return sec ? `${className} (Sec ${sec})` : className;
    }
    const details = [batch, sec ? `Sec ${sec}` : null].filter(Boolean).join(' - ');
    return details ? `${className} (${details})` : className;
  };

  const filteredSessions = sessions.filter((s) => {
    const sched = getScheduleStatus(s.valid_from, s.valid_until, s.status);
    if (statusFilter === 'ACTIVE' && !sched.label.includes('Live')) return false;
    if (statusFilter === 'UPCOMING' && !sched.label.includes('Scheduled')) return false;
    if (statusFilter === 'EXPIRED' && !sched.label.includes('Expired')) return false;
    if (statusFilter === 'PENDING' && s.status !== 'PENDING') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        s.domain_title.toLowerCase().includes(q) ||
        s.class_name.toLowerCase().includes(q) ||
        s.requested_by_name.toLowerCase().includes(q) ||
        (s.programme_name && s.programme_name.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 font-sans">
      {/* Header Banner */}
      <div className="bg-[#1C1B18] border border-[#2A2824] rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#C9A227]/10 border border-[#C9A227]/30 text-[#E3C766] text-xs font-mono">
            <Briefcase className="w-3.5 h-3.5" />
            <span>
              {activeRole === 'HoD'
                ? 'Department Assessment Governance Console'
                : activeRole === 'Class Tutor'
                ? 'Class Tutor Assessment Management Desk'
                : 'Institutional Assessment Management Console'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#F8F5ED]">
            {activeRole === 'HoD' ? 'Department Active Assessments' : 'Active Class Assessments & Allocations'}
          </h1>
          <p className="text-xs text-[#9E988A] leading-relaxed max-w-2xl">
            {activeRole === 'HoD'
              ? 'Oversee active tracks across department classes, inspect dynamic round performance, and grant grace attempts.'
              : 'Govern active assessment sessions for your assigned class, monitor round-by-round candidate clearing, and grant grace attempts to failed candidates.'}
          </p>
        </div>

        {activeRole === 'Class Tutor' && onNavigate && (
          <button
            onClick={() => onNavigate('assessment-activation')}
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-[#C9A227] hover:bg-[#B89220] text-[#11110F] text-xs font-bold rounded-xl shadow-lg transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Assign New Assessment</span>
          </button>
        )}
      </div>

      {actionMsg && (
        <div
          className={`p-3.5 rounded-xl text-xs font-medium border flex items-center justify-between ${
            actionMsg.type === 'success'
              ? 'bg-[#4ADE80]/10 text-[#4ADE80] border-[#4ADE80]/30'
              : 'bg-red-500/10 text-red-400 border-red-500/30'
          }`}
        >
          <span>{actionMsg.text}</span>
          <button onClick={() => setActionMsg(null)} className="text-xs opacity-75 hover:opacity-100 cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-[#1C1B18] border border-[#2A2824] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
        <div className="flex flex-wrap items-center gap-2">
          {['ALL', 'ACTIVE', 'UPCOMING', 'EXPIRED', 'PENDING'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl border transition cursor-pointer ${
                statusFilter === st
                  ? 'bg-[#C9A227] text-[#11110F] font-bold border-[#C9A227]'
                  : 'bg-[#141311] text-[#9E988A] border-[#2A2824] hover:text-[#F8F5ED]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="text"
            placeholder="Search by track, class, or tutor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-[#141311] text-[#F8F5ED] border border-[#2A2824] rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-[#C9A227] w-full sm:w-64"
          />
          <button
            onClick={fetchSessions}
            className="p-2 rounded-xl bg-[#141311] border border-[#2A2824] text-[#9E988A] hover:text-[#F8F5ED] transition cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Assessment Session Cards */}
      {isLoading ? (
        <div className="p-12 text-center text-xs font-mono text-[#9E988A] bg-[#1C1B18] rounded-2xl border border-[#2A2824]">
          Loading active assessment sessions...
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="p-12 text-center bg-[#1C1B18] rounded-2xl border border-[#2A2824] space-y-3">
          <Briefcase className="w-10 h-10 text-[#6B665E] mx-auto" />
          <h3 className="text-sm font-bold text-[#F8F5ED]">No Assessment Sessions Found</h3>
          <p className="text-xs text-[#9E988A] max-w-md mx-auto">
            {statusFilter === 'ALL'
              ? 'No active or scheduled assessment allocations found for this scope.'
              : `No assessment sessions matching status "${statusFilter}".`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSessions.map((session) => {
            const sched = getScheduleStatus(session.valid_from, session.valid_until, session.status);

            return (
              <div
                key={session.id}
                className="bg-[#1C1B18] border border-[#2A2824] hover:border-[#C9A227]/50 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4 transition"
              >
                <div className="space-y-3">
                  {/* Top Status & ID */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-[#9E988A]">
                      Session #{session.id}
                    </span>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${sched.color}`}>
                      {sched.label}
                    </span>
                  </div>

                  {/* Title & Class */}
                  <div>
                    <h3 className="text-sm font-bold text-[#F8F5ED] hover:text-[#C9A227] transition">
                      {session.domain_title}
                    </h3>
                    <p className="text-xs text-[#C9A227] font-medium mt-0.5">
                      {formatClassLabel(session.class_name, session.batch_name, session.section_name)}
                    </p>
                  </div>

                  {/* Schedule Details */}
                  <div className="p-3 bg-[#141311] rounded-xl border border-[#2A2824] space-y-1.5 text-[11px] font-mono">
                    <div className="flex items-center justify-between text-[#9E988A]">
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-[#C9A227]" />
                        <span>Start Time:</span>
                      </span>
                      <span className="text-[#F8F5ED]">
                        {formatDateTime(session.valid_from)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[#9E988A]">
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3 text-[#C9A227]" />
                        <span>End Window:</span>
                      </span>
                      <span className="text-[#F8F5ED]">
                        {formatDateTime(session.valid_until)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[#9E988A] pt-1 border-t border-[#2A2824]">
                      <span className="flex items-center space-x-1">
                        <Users className="w-3 h-3 text-[#C9A227]" />
                        <span>Candidates:</span>
                      </span>
                      <span className="text-[#E3C766] font-bold">
                        {session.candidate_count} Students
                      </span>
                    </div>
                  </div>

                  {session.notes && (
                    <p className="text-[11px] text-[#9E988A] italic line-clamp-1">
                      Note: {session.notes}
                    </p>
                  )}
                </div>

                {/* Actions Toolbar */}
                <div className="pt-3 border-t border-[#2A2824] flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleOpenPerformance(session)}
                    className="flex-1 py-2 px-3 bg-[#C9A227]/10 hover:bg-[#C9A227]/20 border border-[#C9A227]/30 text-[#E3C766] text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer shadow"
                    title="View Round Performance & Grant Attempts"
                  >
                    <BarChart3 className="w-3.5 h-3.5 text-[#C9A227]" />
                    <span>Round Performance & Attempts</span>
                  </button>

                  <button
                    onClick={() => handleOpenEdit(session)}
                    className="py-2 px-2.5 bg-[#141311] hover:bg-[#24231F] border border-[#2A2824] hover:border-[#C9A227]/50 text-[#F8F5ED] text-xs font-bold rounded-xl transition flex items-center justify-center cursor-pointer"
                    title="Edit / Reschedule Window"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDelete(session.id)}
                    className="py-2 px-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold rounded-xl transition flex items-center justify-center cursor-pointer"
                    title="Delete / Revoke Session"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dynamic Round Performance & Attempts Modal */}
      {isPerformanceModalOpen && selectedPerformance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-6 animate-in fade-in duration-150 font-sans">
          <div className="bg-[#1C1B18] border border-[#2A2824] rounded-3xl w-full max-w-6xl max-h-[92vh] shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-[#2A2824] flex items-center justify-between bg-[#141311]">
              <div className="space-y-1">
                <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-[#C9A227]/10 text-[#E3C766] border border-[#C9A227]/30 text-[10px] font-mono">
                  <span>Session #{selectedPerformance.activation_id}</span>
                  <span>•</span>
                  <span>{selectedPerformance.total_candidates} Candidates Total</span>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-[#F8F5ED]">
                  {selectedPerformance.domain_title}
                </h2>
                <p className="text-xs text-[#C9A227]">
                  {formatClassLabel(selectedPerformance.class_name, selectedPerformance.batch_name, selectedPerformance.section_name)}
                </p>
              </div>

              <button
                onClick={() => setIsPerformanceModalOpen(false)}
                className="p-2 rounded-xl text-[#9E988A] hover:text-[#F8F5ED] hover:bg-[#1C1B18] transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Dynamic Round Tabs Header (Round 1 | Round 2 | ... | Round N) */}
            <div className="px-5 pt-3 border-b border-[#2A2824] bg-[#171613] flex items-center space-x-2 overflow-x-auto">
              {selectedPerformance.rounds.map((round, idx) => {
                const isActive = activeRoundIndex === idx;
                return (
                  <button
                    key={round.round_id}
                    onClick={() => {
                      setActiveRoundIndex(idx);
                      setSelectedFailedIds([]);
                    }}
                    className={`px-4 py-2.5 text-xs font-mono font-bold rounded-t-xl border-t border-x transition flex items-center space-x-2 whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'bg-[#1C1B18] text-[#E3C766] border-[#2A2824] border-b-transparent -mb-px'
                        : 'bg-transparent text-[#9E988A] border-transparent hover:text-[#F8F5ED]'
                    }`}
                  >
                    <span className="w-5 h-5 rounded-md bg-[#141311] border border-[#2A2824] flex items-center justify-center text-[10px]">
                      0{round.round_number}
                    </span>
                    <span>{round.title}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#141311] border border-[#2A2824]">
                      {round.passed_count}/{round.passed_count + round.failed_count + round.not_started_count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Tab Body: Unified 4-Card Grid Directly Holding the Lists */}
            {selectedPerformance.rounds[activeRoundIndex] && (() => {
              const currentRound = selectedPerformance.rounds[activeRoundIndex];
              const failedStudents = currentRound.failed_students || [];
              const passedStudents = currentRound.passed_students || [];
              const pendingStudents = currentRound.pending_students || [];

              return (
                <div className="p-5 sm:p-6 overflow-y-auto flex-1 bg-[#1C1B18]">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
                    
                    {/* Card 1: Passed Candidates Card with List */}
                    <div className="bg-[#141311] border border-[#4ADE80]/30 rounded-2xl p-4 flex flex-col space-y-3 h-[450px]">
                      <div className="flex items-center justify-between pb-2 border-b border-[#2A2824]">
                        <div>
                          <span className="text-[10px] font-mono text-[#9E988A] uppercase tracking-wider">Passed Candidates</span>
                          <p className="text-xl font-bold text-[#4ADE80] mt-0.5">{passedStudents.length}</p>
                        </div>
                        <div className="w-8 h-8 rounded-xl bg-[#4ADE80]/10 border border-[#4ADE80]/30 flex items-center justify-center text-[#4ADE80]">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      </div>

                      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                        {passedStudents.length === 0 ? (
                          <div className="h-full flex items-center justify-center text-xs font-mono text-[#9E988A] text-center p-4">
                            No candidates have cleared this round yet.
                          </div>
                        ) : (
                          passedStudents.map((s) => (
                            <div
                              key={s.student_id}
                              className="p-2.5 bg-[#1C1B18] border border-[#2A2824] hover:border-[#4ADE80]/40 rounded-xl flex items-center justify-between gap-2 transition"
                            >
                              <div className="overflow-hidden">
                                <p className="text-xs font-bold text-[#F8F5ED] truncate">{s.full_name}</p>
                                <p className="text-[10px] font-mono text-[#9E988A] truncate">{s.register_number}</p>
                              </div>
                              <span className="text-[11px] font-mono font-bold text-[#4ADE80] bg-[#4ADE80]/10 px-2 py-0.5 rounded border border-[#4ADE80]/30 ml-2 whitespace-nowrap">
                                {s.score != null ? `${s.score.toFixed(0)}%` : 'Passed'}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Card 2: Failed Candidates Card with List & Grace Attempt Controls */}
                    <div className="bg-[#141311] border border-red-500/30 rounded-2xl p-4 flex flex-col space-y-3 h-[450px]">
                      <div className="flex flex-col space-y-2 pb-2 border-b border-[#2A2824]">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-mono text-[#9E988A] uppercase tracking-wider">Failed Candidates</span>
                            <p className="text-xl font-bold text-red-400 mt-0.5">{failedStudents.length}</p>
                          </div>
                          <div className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
                            <AlertCircle className="w-4 h-4" />
                          </div>
                        </div>

                        {failedStudents.length > 0 && (
                          <div className="flex items-center space-x-1.5 pt-1">
                            {selectedFailedIds.length > 0 && (
                              <button
                                onClick={() => handleGrantAttempt(currentRound.round_id, selectedFailedIds)}
                                disabled={isGranting}
                                className="flex-1 py-1 px-2 bg-[#C9A227] hover:bg-[#B89220] text-[#11110F] font-bold text-[10px] rounded-lg shadow transition flex items-center justify-center space-x-1 cursor-pointer"
                              >
                                <Zap className="w-3 h-3" />
                                <span>Selected ({selectedFailedIds.length})</span>
                              </button>
                            )}

                            <button
                              onClick={() => handleGrantAllFailed(currentRound)}
                              disabled={isGranting}
                              className="flex-1 py-1 px-2 bg-[#C9A227] hover:bg-[#B89220] text-[#11110F] font-bold text-[10px] rounded-lg shadow transition flex items-center justify-center space-x-1 cursor-pointer"
                            >
                              <Zap className="w-3 h-3 fill-current" />
                              <span>Provide All ({failedStudents.length})</span>
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                        {failedStudents.length === 0 ? (
                          <div className="h-full flex items-center justify-center text-xs font-mono text-[#9E988A] text-center p-4">
                            No failed candidates in this round.
                          </div>
                        ) : (
                          failedStudents.map((s) => {
                            const isSelected = selectedFailedIds.includes(s.student_id);

                            return (
                              <div
                                key={s.student_id}
                                className={`p-2.5 bg-[#1C1B18] border rounded-xl flex items-center justify-between gap-1.5 transition ${
                                  isSelected ? 'border-[#C9A227] bg-[#C9A227]/5' : 'border-[#2A2824] hover:border-[#3A3834]'
                                }`}
                              >
                                <div className="flex items-center space-x-2 overflow-hidden">
                                  <button
                                    onClick={() => toggleSelectFailedStudent(s.student_id)}
                                    className="text-[#9E988A] hover:text-[#C9A227] cursor-pointer flex-shrink-0"
                                  >
                                    {isSelected ? (
                                      <CheckSquare className="w-3.5 h-3.5 text-[#C9A227]" />
                                    ) : (
                                      <Square className="w-3.5 h-3.5" />
                                    )}
                                  </button>

                                  <div className="overflow-hidden">
                                    <p className="text-xs font-bold text-[#F8F5ED] truncate">{s.full_name}</p>
                                    <p className="text-[10px] font-mono text-[#9E988A] truncate">
                                      {s.register_number} • {s.score != null ? `${s.score.toFixed(0)}%` : 'Failed'}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex-shrink-0">
                                  {s.has_active_grant ? (
                                    <span className="text-[9px] font-mono font-bold text-[#E3C766] bg-[#E3C766]/10 px-1.5 py-0.5 rounded border border-[#E3C766]/30 whitespace-nowrap">
                                      Granted
                                    </span>
                                  ) : (
                                    <button
                                      onClick={() => handleGrantAttempt(currentRound.round_id, [s.student_id])}
                                      disabled={isGranting}
                                      className="px-2 py-1 bg-[#C9A227] hover:bg-[#B89220] text-[#11110F] font-bold text-[10px] rounded-lg transition whitespace-nowrap cursor-pointer"
                                    >
                                      Provide
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* Card 3: Not Started / In Progress Card with List */}
                    <div className="bg-[#141311] border border-[#2A2824] rounded-2xl p-4 flex flex-col space-y-3 h-[450px]">
                      <div className="flex items-center justify-between pb-2 border-b border-[#2A2824]">
                        <div>
                          <span className="text-[10px] font-mono text-[#9E988A] uppercase tracking-wider">Not Started / In Progress</span>
                          <p className="text-xl font-bold text-[#F8F5ED] mt-0.5">{pendingStudents.length}</p>
                        </div>
                        <div className="w-8 h-8 rounded-xl bg-[#1C1B18] border border-[#2A2824] flex items-center justify-center text-[#C9A227]">
                          <Clock className="w-4 h-4" />
                        </div>
                      </div>

                      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                        {pendingStudents.length === 0 ? (
                          <div className="h-full flex items-center justify-center text-xs font-mono text-[#9E988A] text-center p-4">
                            All allocated candidates evaluated this round.
                          </div>
                        ) : (
                          pendingStudents.map((s) => (
                            <div
                              key={s.student_id}
                              className="p-2.5 bg-[#1C1B18] border border-[#2A2824] rounded-xl flex items-center justify-between gap-2"
                            >
                              <div className="overflow-hidden">
                                <p className="text-xs font-bold text-[#F8F5ED] truncate">{s.full_name}</p>
                                <p className="text-[10px] font-mono text-[#9E988A] truncate">{s.register_number}</p>
                              </div>
                              <span className="text-[9px] font-mono text-[#9E988A] bg-[#141311] px-1.5 py-0.5 rounded border border-[#2A2824] ml-2 whitespace-nowrap">
                                {s.status === 'IN_PROGRESS' ? 'In Progress' : 'Ready'}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Card 4: Passing Benchmark & Round Policy Card */}
                    <div className="bg-[#141311] border border-[#C9A227]/30 rounded-2xl p-4 flex flex-col justify-between space-y-3 h-[450px]">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-[#2A2824]">
                          <div>
                            <span className="text-[10px] font-mono text-[#9E988A] uppercase tracking-wider">Passing Benchmark</span>
                            <p className="text-xl font-bold text-[#E3C766] mt-0.5">{currentRound.passing_score}%</p>
                          </div>
                          <div className="w-8 h-8 rounded-xl bg-[#C9A227]/10 border border-[#C9A227]/30 flex items-center justify-center text-[#E3C766]">
                            <Award className="w-4 h-4" />
                          </div>
                        </div>

                        <div className="space-y-2.5 text-xs font-mono">
                          <div className="p-3 bg-[#1C1B18] rounded-xl border border-[#2A2824] space-y-1.5 text-[11px]">
                            <div className="flex items-center justify-between text-[#9E988A]">
                              <span>Round:</span>
                              <span className="text-[#F8F5ED] font-bold">Round {currentRound.round_number}</span>
                            </div>
                            <div className="flex items-center justify-between text-[#9E988A]">
                              <span>Total Candidates:</span>
                              <span className="text-[#E3C766] font-bold">
                                {passedStudents.length + failedStudents.length + pendingStudents.length}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[#9E988A]">
                              <span>Pass Rate:</span>
                              <span className="text-[#4ADE80] font-bold">
                                {passedStudents.length + failedStudents.length > 0
                                  ? `${((passedStudents.length / (passedStudents.length + failedStudents.length)) * 100).toFixed(0)}%`
                                  : '0%'}
                              </span>
                            </div>
                          </div>

                          <div className="p-3 bg-[#1C1B18] rounded-xl border border-[#2A2824] space-y-1 text-[11px] text-[#9E988A]">
                            <p className="font-bold text-[#F8F5ED] flex items-center space-x-1">
                              <Sparkles className="w-3 h-3 text-[#C9A227]" />
                              <span>Grace Attempt Policy</span>
                            </p>
                            <p className="text-[10px] leading-relaxed">
                              Clicking "Provide Attempt" on any unpassed candidate unlocks a fresh attempt on the student's workstation.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-[#2A2824]">
                        <span className="text-[10px] font-mono text-[#6B665E] block text-center">
                          Automated Sandboxed Evaluation
                        </span>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })()}

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#2A2824] bg-[#141311] flex justify-end">
              <button
                onClick={() => setIsPerformanceModalOpen(false)}
                className="px-4 py-2 bg-[#1C1B18] hover:bg-[#24231F] border border-[#2A2824] text-xs font-bold text-[#F8F5ED] rounded-xl cursor-pointer"
              >
                Close Console
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit / Reschedule Modal */}
      {isEditModalOpen && selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-[#1C1B18] border border-[#2A2824] rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="p-5 border-b border-[#2A2824] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#F8F5ED]">
                  Edit / Reschedule Session #{selectedSession.id}
                </h3>
                <p className="text-xs text-[#C9A227] mt-0.5">{selectedSession.domain_title}</p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 rounded-lg text-[#9E988A] hover:text-[#F8F5ED] hover:bg-[#141311] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-4 text-xs font-mono">
              <div className="space-y-1.5">
                <label className="text-[#9E988A] uppercase text-[10px] font-bold">Start Time (Valid From)</label>
                <input
                  type="datetime-local"
                  value={editValidFrom}
                  onChange={(e) => setEditValidFrom(e.target.value)}
                  required
                  className="w-full bg-[#141311] text-[#F8F5ED] border border-[#2A2824] rounded-xl px-3 py-2 focus:outline-none focus:border-[#C9A227]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[#9E988A] uppercase text-[10px] font-bold">End Time (Valid Until / Window)</label>
                <input
                  type="datetime-local"
                  value={editValidUntil}
                  onChange={(e) => setEditValidUntil(e.target.value)}
                  required
                  className="w-full bg-[#141311] text-[#F8F5ED] border border-[#2A2824] rounded-xl px-3 py-2 focus:outline-none focus:border-[#C9A227]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[#9E988A] uppercase text-[10px] font-bold">Notes / Instructions</label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={3}
                  className="w-full bg-[#141311] text-[#F8F5ED] border border-[#2A2824] rounded-xl p-3 focus:outline-none focus:border-[#C9A227] font-sans"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-[#141311] hover:bg-[#24231F] border border-[#2A2824] text-xs font-bold text-[#9E988A] rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-[#C9A227] hover:bg-[#B89220] text-[#11110F] text-xs font-bold rounded-xl shadow-lg transition cursor-pointer"
                >
                  {isSaving ? 'Saving Changes...' : 'Save & Update Window'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
