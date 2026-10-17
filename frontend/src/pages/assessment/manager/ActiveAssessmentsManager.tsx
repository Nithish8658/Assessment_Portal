import React, { useState, useEffect } from 'react';
import apiClient from '../../../api/client';
import { useAuth } from '../../../context/AuthContext';
import {
  Briefcase, Clock, Calendar, Users, Edit3, XCircle, CheckCircle2,
  AlertCircle, Sparkles, Filter, ChevronRight, X, Plus, RefreshCw,
  BarChart3, CheckSquare, Square, Zap, Award, Play
} from 'lucide-react';
import {
  ActivationRoundsPerformance,
  DynamicRoundPerformance,
  RoundCandidateSummaryItem
} from '../../../types/assessment';
import { parseIsoDate, formatDateTime } from '../../../utils/dateUtils';
import { notify, confirmDialog } from '../../../components/ui/Dialogs';

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
  const [view, setView] = useState<'CURRENT' | 'ARCHIVE'>('CURRENT');
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
      notify(err.response?.data?.detail || 'Failed to load round performance data.');
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
      notify(err.response?.data?.detail || 'Failed to grant attempt.');
    } finally {
      setIsGranting(false);
    }
  };

  const handleGrantAllFailed = async (round: DynamicRoundPerformance) => {
    const allFailedIds = round.failed_students.map((s) => s.student_id);
    if (allFailedIds.length === 0) {
      notify('No failed candidates in this round to grant attempts.');
      return;
    }
    if (await confirmDialog(`Grant a fresh round attempt to ALL ${allFailedIds.length} failed candidate(s) in "${round.title}"?`)) {
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
      notify(err.response?.data?.detail || 'Failed to update assessment.');
    } finally {
      setIsSaving(false);
    }
  };

  // Cancelling keeps every record; the server refuses once any student has started the assessment
  const handleCancel = async (id: number) => {
    if (!(await confirmDialog(`Cancel assessment #${id}? Its students lose access. This is only possible while nobody has started it; it is recorded in the audit log.`, { confirmLabel: 'Cancel assessment', danger: true }))) {
      return;
    }
    try {
      const res = await apiClient.post(`/assessment/activation-requests/${id}/cancel`);
      setActionMsg({ type: 'success', text: res.data?.message || `Assessment #${id} was cancelled.` });
      fetchSessions();
    } catch (err: any) {
      const detail = err.response?.data?.detail || 'Could not cancel this assessment.';
      if (err.response?.status === 409 && /started/i.test(detail)) {
        if (await confirmDialog(`${detail}\n\nEnd the access window now instead? It moves to the Archive with every result kept. Students already in a round can still finish it.`, { confirmLabel: 'End now', danger: true })) {
          handleEndNow(id);
        }
      } else {
        notify(detail, 'error');
      }
    }
  };

  // Closing the window ends new attempts; the assessment then shows under Archive
  const handleEndNow = async (id: number) => {
    const session = sessions.find((s) => s.id === id);
    const now = new Date();
    const start = session ? parseIsoDate(session.valid_from) : null;
    try {
      await apiClient.put(`/assessment/activation-requests/${id}`, {
        ...(start && start > now ? { valid_from: now.toISOString() } : {}),
        valid_until: now.toISOString(),
      });
      setActionMsg({ type: 'success', text: `Assessment #${id} has ended and moved to the Archive. All results are kept.` });
      fetchSessions();
    } catch (err: any) {
      notify(err.response?.data?.detail || 'Could not end this assessment.', 'error');
    }
  };

  // Closed windows, cancelled and rejected assessments are kept read-only under Archive
  const isArchived = (s: ActivationSessionItem) => {
    if (s.status === 'CANCELLED' || s.status === 'REJECTED') return true;
    const end = parseIsoDate(s.valid_until);
    return s.status === 'APPROVED' && !!end && new Date() > end;
  };

  const getScheduleStatus = (validFrom: string, validUntil: string, reqStatus: string) => {
    if (reqStatus === 'PENDING') return { label: 'Pending HoD Approval', color: 'bg-amber-50 text-amber-600 border-amber-200' };
    if (reqStatus === 'REJECTED') return { label: 'Rejected', color: 'bg-rose-50 text-rose-600 border-rose-200' };
    if (reqStatus === 'CANCELLED') return { label: 'Cancelled', color: 'bg-slate-100 text-slate-600 border-slate-200' };
    const now = new Date();
    const start = parseIsoDate(validFrom);
    const end = parseIsoDate(validUntil);
    if (!start || !end) return { label: 'Active', color: 'bg-[#22C55E]/15 text-[#22C55E] border-[#22C55E]/30' };
    if (now < start) {
      const diffMins = Math.max(1, Math.floor((start.getTime() - now.getTime()) / (60 * 1000)));
      return { label: `Scheduled (Starts in ${diffMins}m)`, color: 'bg-[#FF5500]/10 text-[#FF5500] border-[#FF5500]/30' };
    }
    if (now > end) {
      return { label: 'Closed', color: 'bg-slate-100 text-slate-600 border-slate-200' };
    }
    return { label: 'Live Now (Active)', color: 'bg-[#22C55E]/15 text-[#22C55E] border-[#22C55E]/30' };
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

  const archivedCount = sessions.filter(isArchived).length;
  const currentCount = sessions.length - archivedCount;

  const filteredSessions = sessions.filter((s) => {
    if (isArchived(s) !== (view === 'ARCHIVE')) return false;
    const sched = getScheduleStatus(s.valid_from, s.valid_until, s.status);
    if (view === 'CURRENT') {
      if (statusFilter === 'ACTIVE' && !sched.label.includes('Live')) return false;
      if (statusFilter === 'UPCOMING' && !sched.label.includes('Scheduled')) return false;
      if (statusFilter === 'PENDING' && s.status !== 'PENDING') return false;
    }

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
      <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#FF5500]/10 border border-[#FF5500]/30 text-[#FF5500] text-xs font-mono font-semibold">
            <Briefcase className="w-3.5 h-3.5" />
            <span>
              {activeRole === 'HoD'
                ? 'Department Assessment Governance Console'
                : activeRole === 'Class Tutor'
                ? 'Class Tutor Assessment Management Desk'
                : 'Institutional Assessment Management Console'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A]">
            {activeRole === 'HoD' ? 'Department Active Assessments' : 'Active Class Assessments & Allocations'}
          </h1>
          <p className="text-xs text-[#64748B] leading-relaxed max-w-2xl">
            {activeRole === 'HoD'
              ? 'Oversee active tracks across department classes, inspect dynamic round performance, and grant grace attempts.'
              : 'Govern active assessment sessions for your assigned class, monitor round-by-round candidate clearing, and grant grace attempts to failed candidates.'}
          </p>
        </div>

        {activeRole === 'Class Tutor' && onNavigate && (
          <button
            onClick={() => onNavigate('assessment-activation')}
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-[#FF5500] hover:bg-[#E64D00] text-white text-xs font-bold rounded-xl shadow-sm transition cursor-pointer"
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
              ? 'bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/30'
              : 'bg-rose-50 text-rose-600 border-rose-200'
          }`}
        >
          <span>{actionMsg.text}</span>
          <button onClick={() => setActionMsg(null)} className="text-xs opacity-75 hover:opacity-100 cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-0.5 mr-1">
            {([['CURRENT', `Current (${currentCount})`], ['ARCHIVE', `Archive (${archivedCount})`]] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setView(key)}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  view === key ? 'bg-[#FFFFFF] text-[#0F172A] font-bold shadow-xs border border-[#E2E8F0]' : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {view === 'CURRENT' && ['ALL', 'ACTIVE', 'UPCOMING', 'PENDING'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl border transition cursor-pointer ${
                statusFilter === st
                  ? 'bg-[#FF5500] text-white font-bold border-[#FF5500] shadow-xs'
                  : 'bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0] hover:text-[#0F172A]'
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
            className="bg-[#FFFFFF] text-[#0F172A] border border-[#E2E8F0] rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-[#FF5500] w-full sm:w-64 shadow-xs"
          />
          <button
            onClick={fetchSessions}
            className="p-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] transition cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Assessment Session Cards */}
      {isLoading ? (
        <div className="p-12 text-center text-xs font-mono text-[#64748B] bg-[#FFFFFF] rounded-2xl border border-[#E2E8F0] shadow-sm">
          Loading active assessment sessions...
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="p-12 text-center bg-[#FFFFFF] rounded-2xl border border-[#E2E8F0] space-y-3 shadow-sm">
          <Briefcase className="w-10 h-10 text-[#94A3B8] mx-auto" />
          <h3 className="text-sm font-bold text-[#0F172A]">No Assessment Sessions Found</h3>
          <p className="text-xs text-[#64748B] max-w-md mx-auto">
            {view === 'ARCHIVE'
              ? 'Assessments appear here once their access window closes or they are cancelled.'
              : statusFilter === 'ALL'
              ? 'No active or scheduled assessment allocations found for this scope.'
              : `No assessment sessions matching status "${statusFilter}".`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSessions.map((session) => {
            const sched = getScheduleStatus(session.valid_from, session.valid_until, session.status);
            const archived = isArchived(session);

            return (
              <div
                key={session.id}
                className="bg-[#FFFFFF] border border-[#E2E8F0] hover:border-[#FF5500]/50 rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-4 transition"
              >
                <div className="space-y-3">
                  {/* Top Status & ID */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-[#64748B]">
                      Session #{session.id}
                    </span>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${sched.color}`}>
                      {sched.label}
                    </span>
                  </div>

                  {/* Title & Class */}
                  <div>
                    <h3 className="text-sm font-bold text-[#0F172A] hover:text-[#FF5500] transition">
                      {session.domain_title}
                    </h3>
                    <p className="text-xs text-[#FF5500] font-medium mt-0.5">
                      {formatClassLabel(session.class_name, session.batch_name, session.section_name)}
                    </p>
                  </div>

                  {/* Schedule Details */}
                  <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-1.5 text-[11px] font-mono">
                    <div className="flex items-center justify-between text-[#64748B]">
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-[#FF5500]" />
                        <span>Start Time:</span>
                      </span>
                      <span className="text-[#0F172A]">
                        {formatDateTime(session.valid_from)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[#64748B]">
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3 text-[#FF5500]" />
                        <span>End Window:</span>
                      </span>
                      <span className="text-[#0F172A]">
                        {formatDateTime(session.valid_until)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[#64748B] pt-1 border-t border-[#E2E8F0]">
                      <span className="flex items-center space-x-1">
                        <Users className="w-3 h-3 text-[#FF5500]" />
                        <span>Candidates:</span>
                      </span>
                      <span className="text-[#FF5500] font-bold">
                        {session.candidate_count} Students
                      </span>
                    </div>
                  </div>

                  {session.notes && (
                    <p className="text-[11px] text-[#64748B] italic line-clamp-1">
                      Note: {session.notes}
                    </p>
                  )}
                </div>

                {/* Actions Toolbar */}
                <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleOpenPerformance(session)}
                    className="flex-1 py-2 px-3 bg-[#FF5500]/10 hover:bg-[#FF5500]/20 border border-[#FF5500]/30 text-[#FF5500] text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs"
                    title={archived ? 'View round results' : 'View Round Performance & Grant Attempts'}
                  >
                    <BarChart3 className="w-3.5 h-3.5 text-[#FF5500]" />
                    <span>{archived ? 'View Results' : 'Round Performance & Attempts'}</span>
                  </button>

                  {session.status !== 'CANCELLED' && session.status !== 'REJECTED' && (
                    <button
                      onClick={() => handleOpenEdit(session)}
                      className="py-2 px-2.5 bg-[#F8FAFC] hover:bg-[#F0F3F6] border border-[#E2E8F0] hover:border-[#FF5500]/50 text-[#0F172A] text-xs font-bold rounded-xl transition flex items-center justify-center cursor-pointer"
                      title={archived ? 'Reopen: set a new end time' : 'Edit / Reschedule Window'}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {!archived && (
                    <button
                      onClick={() => handleCancel(session.id)}
                      className="py-2 px-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 text-xs font-bold rounded-xl transition flex items-center justify-center cursor-pointer"
                      title="Cancel assessment (only before any student starts)"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dynamic Round Performance & Attempts Modal */}
      {isPerformanceModalOpen && selectedPerformance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/40 backdrop-blur-md p-3 sm:p-6 animate-in fade-in duration-150 font-sans">
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-3xl w-full max-w-6xl max-h-[92vh] shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
              <div className="space-y-1">
                <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-[#FF5500]/10 text-[#FF5500] border border-[#FF5500]/30 text-[10px] font-mono font-semibold">
                  <span>Session #{selectedPerformance.activation_id}</span>
                  <span>•</span>
                  <span>{selectedPerformance.total_candidates} Candidates Total</span>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-[#0F172A]">
                  {selectedPerformance.domain_title}
                </h2>
                <p className="text-xs text-[#FF5500] font-medium">
                  {formatClassLabel(selectedPerformance.class_name, selectedPerformance.batch_name, selectedPerformance.section_name)}
                </p>
              </div>

              <button
                onClick={() => setIsPerformanceModalOpen(false)}
                className="p-2 rounded-xl text-[#64748B] hover:text-[#0F172A] hover:bg-[#F0F3F6] transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Dynamic Round Tabs Header (Round 1 | Round 2 | ... | Round N) */}
            <div className="px-5 pt-3 border-b border-[#E2E8F0] bg-[#F1F5F9] flex items-center space-x-2 overflow-x-auto">
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
                        ? 'bg-[#FFFFFF] text-[#FF5500] border-[#E2E8F0] border-b-transparent -mb-px shadow-xs'
                        : 'bg-transparent text-[#64748B] border-transparent hover:text-[#0F172A]'
                    }`}
                  >
                    <span className="w-5 h-5 rounded-md bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-[10px]">
                      0{round.round_number}
                    </span>
                    <span>{round.title}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#F8FAFC] border border-[#E2E8F0]">
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
              const perfSession = sessions.find((s) => s.id === selectedPerformance.activation_id);
              const readOnly = !!perfSession && isArchived(perfSession);

              return (
                <div className="p-5 sm:p-6 overflow-y-auto flex-1 bg-[#F6F8FA]">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
                    
                    {/* Card 1: Passed Candidates Card with List */}
                    <div className="bg-[#FFFFFF] border border-[#22C55E]/30 rounded-2xl p-4 flex flex-col space-y-3 h-[450px] shadow-sm">
                      <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
                        <div>
                          <span className="text-[10px] font-mono text-[#64748B] uppercase tracking-wider">Passed Candidates</span>
                          <p className="text-xl font-bold text-[#22C55E] mt-0.5">{passedStudents.length}</p>
                        </div>
                        <div className="w-8 h-8 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/30 flex items-center justify-center text-[#22C55E]">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      </div>

                      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                        {passedStudents.length === 0 ? (
                          <div className="h-full flex items-center justify-center text-xs font-mono text-[#64748B] text-center p-4">
                            No candidates have cleared this round yet.
                          </div>
                        ) : (
                          passedStudents.map((s) => (
                            <div
                              key={s.student_id}
                              className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#22C55E]/40 rounded-xl flex items-center justify-between gap-2 transition"
                            >
                              <div className="overflow-hidden">
                                <p className="text-xs font-bold text-[#0F172A] truncate">{s.full_name}</p>
                                <p className="text-[10px] font-mono text-[#64748B] truncate">{s.register_number}</p>
                              </div>
                              <span className="text-[11px] font-mono font-bold text-[#22C55E] bg-[#22C55E]/10 px-2 py-0.5 rounded border border-[#22C55E]/30 ml-2 whitespace-nowrap">
                                {s.score != null ? `${s.score.toFixed(0)}%` : 'Passed'}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Card 2: Failed Candidates Card with List & Grace Attempt Controls */}
                    <div className="bg-[#FFFFFF] border border-rose-200 rounded-2xl p-4 flex flex-col space-y-3 h-[450px] shadow-sm">
                      <div className="flex flex-col space-y-2 pb-2 border-b border-[#E2E8F0]">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-mono text-[#64748B] uppercase tracking-wider">Failed Candidates</span>
                            <p className="text-xl font-bold text-rose-500 mt-0.5">{failedStudents.length}</p>
                          </div>
                          <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-500">
                            <AlertCircle className="w-4 h-4" />
                          </div>
                        </div>

                        {failedStudents.length > 0 && readOnly && (
                          <p className="text-[10px] text-[#64748B] leading-snug pt-1">
                            This assessment is archived. Reopen its window (Edit) to grant reattempts.
                          </p>
                        )}

                        {failedStudents.length > 0 && !readOnly && (
                          <div className="flex items-center space-x-1.5 pt-1">
                            {selectedFailedIds.length > 0 && (
                              <button
                                onClick={() => handleGrantAttempt(currentRound.round_id, selectedFailedIds)}
                                disabled={isGranting}
                                className="flex-1 py-1 px-2 bg-[#FF5500] hover:bg-[#E64D00] text-white font-bold text-[10px] rounded-lg shadow-sm transition flex items-center justify-center space-x-1 cursor-pointer"
                              >
                                <Zap className="w-3 h-3" />
                                <span>Selected ({selectedFailedIds.length})</span>
                              </button>
                            )}

                            <button
                              onClick={() => handleGrantAllFailed(currentRound)}
                              disabled={isGranting}
                              className="flex-1 py-1 px-2 bg-[#FF5500] hover:bg-[#E64D00] text-white font-bold text-[10px] rounded-lg shadow-sm transition flex items-center justify-center space-x-1 cursor-pointer"
                            >
                              <Zap className="w-3 h-3 fill-current" />
                              <span>Provide All ({failedStudents.length})</span>
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                        {failedStudents.length === 0 ? (
                          <div className="h-full flex items-center justify-center text-xs font-mono text-[#64748B] text-center p-4">
                            No failed candidates in this round.
                          </div>
                        ) : (
                          failedStudents.map((s) => {
                            const isSelected = selectedFailedIds.includes(s.student_id);

                            return (
                              <div
                                key={s.student_id}
                                className={`p-2.5 bg-[#F8FAFC] border rounded-xl flex items-center justify-between gap-1.5 transition ${
                                  isSelected ? 'border-[#FF5500] bg-[#FF5500]/5' : 'border-[#E2E8F0] hover:border-slate-300'
                                }`}
                              >
                                <div className="flex items-center space-x-2 overflow-hidden">
                                  {!readOnly && <button
                                    onClick={() => toggleSelectFailedStudent(s.student_id)}
                                    className="text-[#64748B] hover:text-[#FF5500] cursor-pointer flex-shrink-0"
                                  >
                                    {isSelected ? (
                                      <CheckSquare className="w-3.5 h-3.5 text-[#FF5500]" />
                                    ) : (
                                      <Square className="w-3.5 h-3.5" />
                                    )}
                                  </button>}

                                  <div className="overflow-hidden">
                                    <p className="text-xs font-bold text-[#0F172A] truncate">{s.full_name}</p>
                                    <p className="text-[10px] font-mono text-[#64748B] truncate">
                                      {s.register_number} • {s.score != null ? `${s.score.toFixed(0)}%` : 'Failed'}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex-shrink-0">
                                  {s.has_active_grant ? (
                                    <span className="text-[9px] font-mono font-bold text-[#FF5500] bg-[#FF5500]/10 px-1.5 py-0.5 rounded border border-[#FF5500]/30 whitespace-nowrap">
                                      Granted
                                    </span>
                                  ) : !readOnly && (
                                    <button
                                      onClick={() => handleGrantAttempt(currentRound.round_id, [s.student_id])}
                                      disabled={isGranting}
                                      className="px-2 py-1 bg-[#FF5500] hover:bg-[#E64D00] text-white font-bold text-[10px] rounded-lg transition whitespace-nowrap cursor-pointer shadow-xs"
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
                    <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-4 flex flex-col space-y-3 h-[450px] shadow-sm">
                      <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
                        <div>
                          <span className="text-[10px] font-mono text-[#64748B] uppercase tracking-wider">Not Started / In Progress</span>
                          <p className="text-xl font-bold text-[#0F172A] mt-0.5">{pendingStudents.length}</p>
                        </div>
                        <div className="w-8 h-8 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-[#FF5500]">
                          <Clock className="w-4 h-4" />
                        </div>
                      </div>

                      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                        {pendingStudents.length === 0 ? (
                          <div className="h-full flex items-center justify-center text-xs font-mono text-[#64748B] text-center p-4">
                            All allocated candidates evaluated this round.
                          </div>
                        ) : (
                          pendingStudents.map((s) => (
                            <div
                              key={s.student_id}
                              className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-center justify-between gap-2"
                            >
                              <div className="overflow-hidden">
                                <p className="text-xs font-bold text-[#0F172A] truncate">{s.full_name}</p>
                                <p className="text-[10px] font-mono text-[#64748B] truncate">{s.register_number}</p>
                              </div>
                              <span className="text-[9px] font-mono text-[#64748B] bg-[#FFFFFF] px-1.5 py-0.5 rounded border border-[#E2E8F0] ml-2 whitespace-nowrap">
                                {s.status === 'IN_PROGRESS' ? 'In Progress' : 'Ready'}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Card 4: Passing Benchmark & Round Policy Card */}
                    <div className="bg-[#FFFFFF] border border-[#FF5500]/30 rounded-2xl p-4 flex flex-col justify-between space-y-3 h-[450px] shadow-sm">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
                          <div>
                            <span className="text-[10px] font-mono text-[#64748B] uppercase tracking-wider">Passing Benchmark</span>
                            <p className="text-xl font-bold text-[#FF5500] mt-0.5">{currentRound.passing_score}%</p>
                          </div>
                          <div className="w-8 h-8 rounded-xl bg-[#FF5500]/10 border border-[#FF5500]/30 flex items-center justify-center text-[#FF5500]">
                            <Award className="w-4 h-4" />
                          </div>
                        </div>

                        <div className="space-y-2.5 text-xs font-mono">
                          <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-1.5 text-[11px]">
                            <div className="flex items-center justify-between text-[#64748B]">
                              <span>Round:</span>
                              <span className="text-[#0F172A] font-bold">Round {currentRound.round_number}</span>
                            </div>
                            <div className="flex items-center justify-between text-[#64748B]">
                              <span>Total Candidates:</span>
                              <span className="text-[#FF5500] font-bold">
                                {passedStudents.length + failedStudents.length + pendingStudents.length}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[#64748B]">
                              <span>Pass Rate:</span>
                              <span className="text-[#22C55E] font-bold">
                                {passedStudents.length + failedStudents.length > 0
                                  ? `${((passedStudents.length / (passedStudents.length + failedStudents.length)) * 100).toFixed(0)}%`
                                  : '0%'}
                              </span>
                            </div>
                          </div>

                          <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-1 text-[11px] text-[#64748B]">
                            <p className="font-bold text-[#0F172A] flex items-center space-x-1">
                              <Sparkles className="w-3 h-3 text-[#FF5500]" />
                              <span>Grace Attempt Policy</span>
                            </p>
                            <p className="text-[10px] leading-relaxed">
                              Clicking "Provide Attempt" on any unpassed candidate unlocks a fresh attempt on the student's workstation.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-[#E2E8F0]">
                        <span className="text-[10px] font-mono text-[#94A3B8] block text-center">
                          Automated Sandboxed Evaluation
                        </span>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })()}

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#E2E8F0] bg-[#F8FAFC] flex justify-end">
              <button
                onClick={() => setIsPerformanceModalOpen(false)}
                className="px-4 py-2 bg-[#FFFFFF] hover:bg-[#F0F3F6] border border-[#E2E8F0] text-xs font-bold text-[#0F172A] rounded-xl cursor-pointer shadow-xs"
              >
                Close Console
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit / Reschedule Modal */}
      {isEditModalOpen && selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="p-5 border-b border-[#E2E8F0] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#0F172A]">
                  Edit / Reschedule Session #{selectedSession.id}
                </h3>
                <p className="text-xs text-[#FF5500] font-medium mt-0.5">{selectedSession.domain_title}</p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#F0F3F6] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-4 text-xs font-mono">
              <div className="space-y-1.5">
                <label className="text-[#64748B] uppercase text-[10px] font-bold">Start Time (Valid From)</label>
                <input
                  type="datetime-local"
                  value={editValidFrom}
                  onChange={(e) => setEditValidFrom(e.target.value)}
                  required
                  className="w-full bg-[#F8FAFC] text-[#0F172A] border border-[#E2E8F0] rounded-xl px-3 py-2 focus:outline-none focus:border-[#FF5500]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[#64748B] uppercase text-[10px] font-bold">End Time (Valid Until / Window)</label>
                <input
                  type="datetime-local"
                  value={editValidUntil}
                  onChange={(e) => setEditValidUntil(e.target.value)}
                  required
                  className="w-full bg-[#F8FAFC] text-[#0F172A] border border-[#E2E8F0] rounded-xl px-3 py-2 focus:outline-none focus:border-[#FF5500]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[#64748B] uppercase text-[10px] font-bold">Notes / Instructions</label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={3}
                  className="w-full bg-[#F8FAFC] text-[#0F172A] border border-[#E2E8F0] rounded-xl p-3 focus:outline-none focus:border-[#FF5500] font-sans"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-[#FFFFFF] hover:bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-bold text-[#64748B] rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-[#FF5500] hover:bg-[#E64D00] text-white text-xs font-bold rounded-xl shadow-sm transition cursor-pointer"
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
