import React, { useState, useEffect } from 'react';
import { ActivationRequestItem } from '../../../types/assessment';
import apiClient from '../../../api/client';
import { CheckCircle2, XCircle, Users, Clock, ShieldCheck, AlertCircle } from 'lucide-react';
import { formatDateTime, formatDateOnly } from '../../../utils/dateUtils';
import { notify, confirmDialog } from '../../../components/ui/Dialogs';

export const AssessmentApprovals: React.FC = () => {
  const [requests, setRequests] = useState<ActivationRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [reviewingId, setReviewingId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [isRejectModalOpen, setIsRejectModalOpen] = useState<boolean>(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/assessment/activation-requests');
      setRequests(res.data);
    } catch (e) {
      console.error('Failed to load activation requests', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    if (!(await confirmDialog('Approve this assessment activation request? All candidate students will receive immediate access.'))) {
      return;
    }
    try {
      await apiClient.post(`/assessment/activation-requests/${id}/review`, {
        action: 'APPROVE',
        round_durations: requests.find((request) => request.id === id)?.round_durations,
      });
      notify('Activation request approved successfully!');
      fetchRequests();
    } catch (err: any) {
      console.error('Failed to approve request', err);
      notify(err.response?.data?.detail || 'Failed to approve request.');
    }
  };

  const handleReject = async () => {
    if (!reviewingId) return;
    try {
      await apiClient.post(`/assessment/activation-requests/${reviewingId}/review`, {
        action: 'REJECT',
        rejection_reason: rejectionReason || 'Rejected by HoD'
      });
      notify('Activation request rejected.');
      setIsRejectModalOpen(false);
      setRejectionReason('');
      setReviewingId(null);
      fetchRequests();
    } catch (err: any) {
      console.error('Failed to reject request', err);
      notify(err.response?.data?.detail || 'Failed to reject request.');
    }
  };

  const pendingRequests = requests.filter((r) => r.status === 'PENDING');
  const pastRequests = requests.filter((r) => r.status !== 'PENDING');

  return (
    <div className="space-y-8 max-w-6xl mx-auto p-4 sm:p-6 font-sans">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A]">
          Department Assessment Track Approvals
        </h1>
        <p className="text-xs text-[#64748B] mt-1">
          Review Class Tutor activation submissions and authorize student candidate cohorts.
        </p>
      </div>

      {/* Pending Requests */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-[#0F172A] flex items-center space-x-2">
          <Clock className="w-4 h-4 text-amber-500" />
          <span>Pending Approvals ({pendingRequests.length})</span>
        </h2>

        {isLoading ? (
          <div className="p-12 text-center text-xs font-mono text-[#64748B] bg-[#FFFFFF] rounded-2xl border border-[#E2E8F0] shadow-sm">
            Loading pending activation requests...
          </div>
        ) : pendingRequests.length === 0 ? (
          <div className="p-8 text-center text-xs font-mono text-[#64748B] bg-[#FFFFFF] rounded-2xl border border-[#E2E8F0] shadow-sm">
            No pending assessment activation requests requiring review.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {pendingRequests.map((req) => (
              <div
                key={req.id}
                className="bg-[#FFFFFF] border border-[#E2E8F0] hover:border-[#FF5500]/50 rounded-2xl p-5 shadow-sm space-y-4 transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-mono font-bold bg-[#FF5500]/10 text-[#FF5500] px-2 py-0.5 rounded border border-[#FF5500]/25">
                        REQ-{req.id}
                      </span>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${
                        req.complexity_level === 'Easy'
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                          : req.complexity_level === 'Hard'
                          ? 'bg-rose-50 text-rose-600 border-rose-200'
                          : req.complexity_level === 'Medium'
                          ? 'bg-amber-50 text-amber-600 border-amber-200'
                          : 'bg-indigo-50 text-indigo-600 border-indigo-200'
                      }`}>
                        {req.complexity_level || 'Balanced'}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-[#0F172A] mt-1">{req.domain_title}</h3>
                  </div>

                  <div className="text-xs font-mono text-[#64748B]">
                    Requested by <strong className="text-[#0F172A]">{req.requested_by_name}</strong> on {formatDateTime(req.requested_at)}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                  <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                    <span className="text-[10px] text-[#64748B] uppercase">Class</span>
                    <div className="font-bold text-[#0F172A]">{req.class_name}</div>
                  </div>
                  <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                    <span className="text-[10px] text-[#64748B] uppercase">Section</span>
                    <div className="font-bold text-[#0F172A]">{req.batch_name} ({req.section_name})</div>
                  </div>
                  <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                    <span className="text-[10px] text-[#64748B] uppercase">Roster Size</span>
                    <div className="font-bold text-[#FF5500]">{req.candidate_count} Students</div>
                  </div>
                  <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                    <span className="text-[10px] text-[#64748B] uppercase">Validity</span>
                    <div className="font-bold text-[#22C55E]">Until {formatDateTime(req.valid_until)}</div>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-[#475569]">
                  <p className="font-bold text-[#0F172A]">Round durations to approve</p>
                  {req.round_timings?.map((round) => (
                    <div key={round.round_id} className="flex justify-between gap-4">
                      <span>{round.title}</span><strong>{round.duration_minutes} minutes</strong>
                    </div>
                  ))}
                  <p className="text-[#64748B]">Each round starts its timer when the student begins. These durations are fixed when approved.</p>
                </div>
                <div className="flex items-center justify-end space-x-3 pt-2">
                  <button
                    onClick={() => {
                      setReviewingId(req.id);
                      setIsRejectModalOpen(true);
                    }}
                    className="py-1.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    Reject
                  </button>

                  <button
                    onClick={() => handleApprove(req.id)}
                    className="py-1.5 px-5 bg-[#FF5500] hover:bg-[#E64D00] text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center space-x-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve & Allocate Roster</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past / Completed Requests */}
      {pastRequests.length > 0 && (
        <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-[#0F172A]">Audit History: Past Reviewed Requests</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#F8FAFC] text-[#64748B] border-b border-[#E2E8F0]">
                <tr>
                  <th className="p-3 font-bold">Request ID</th>
                  <th className="p-3 font-bold">Domain</th>
                  <th className="p-3 font-bold">Class & Section</th>
                  <th className="p-3 font-bold">Complexity</th>
                  <th className="p-3 font-bold">Candidates</th>
                  <th className="p-3 font-bold">Reviewed By</th>
                  <th className="p-3 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-[#475569]">
                {pastRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-[#F8FAFC]">
                    <td className="p-3 font-bold text-[#0F172A]">REQ-{req.id}</td>
                    <td className="p-3">{req.domain_title}</td>
                    <td className="p-3">{req.batch_name} ({req.section_name})</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                        req.complexity_level === 'Easy'
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                          : req.complexity_level === 'Hard'
                          ? 'bg-rose-50 text-rose-600 border-rose-200'
                          : req.complexity_level === 'Medium'
                          ? 'bg-amber-50 text-amber-600 border-amber-200'
                          : 'bg-indigo-50 text-indigo-600 border-indigo-200'
                      }`}>
                        {req.complexity_level || 'Balanced'}
                      </span>
                    </td>
                    <td className="p-3">{req.candidate_count} Students</td>
                    <td className="p-3 text-[#64748B]">{req.reviewed_by_name || 'HoD'}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          req.status === 'APPROVED'
                            ? 'bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30'
                            : 'bg-rose-50 text-rose-600 border border-rose-200'
                        }`}
                      >
                        {req.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] border border-rose-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-[#0F172A]">Reject Activation Request</h3>
            <p className="text-xs text-[#64748B]">
              Please state the reason for rejecting this candidate roster:
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g., Scheduling conflict, wrong cohort selected..."
              rows={3}
              className="w-full bg-[#F8FAFC] text-[#0F172A] border border-[#E2E8F0] rounded-xl p-3 text-xs focus:outline-none focus:border-rose-500 shadow-inner"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsRejectModalOpen(false)}
                className="px-3 py-1.5 bg-[#FFFFFF] text-xs font-bold text-[#64748B] rounded-xl border border-[#E2E8F0] hover:bg-[#F8FAFC]"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
