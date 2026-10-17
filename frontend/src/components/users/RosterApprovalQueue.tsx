import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { CheckCircle, XCircle, Edit3, Eye, Clock, Check, ShieldCheck, Save, AlertCircle, Trash2, X, AlertTriangle } from 'lucide-react';
import { confirmDialog } from '../../components/ui/Dialogs';

interface RosterBatch {
  id: number;
  tutor_id: number;
  tutor_name: string;
  programme_id: number;
  programme_name: string;
  programme_code: string;
  section_name: string;
  batch_name: string;
  semester_num: number;
  file_name: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  staged_data: any[];
  rejection_notes?: string;
  created_at: string;
  approved_at?: string;
  approved_by_name?: string;
}

export const RosterApprovalQueue: React.FC = () => {
  const { user } = useAuth();
  const [batches, setBatches] = useState<RosterBatch[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Batch Selected for Inspection/Editing
  const [selectedBatch, setSelectedBatch] = useState<RosterBatch | null>(null);
  const [editableRows, setEditableRows] = useState<any[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Rejection Dialog State
  const [rejectingBatch, setRejectingBatch] = useState<RosterBatch | null>(null);
  const [rejectReason, setRejectReason] = useState('Column formatting issues / invalid register numbers');

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/users/roster-batches');
      setBatches(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleInspectBatch = (batch: RosterBatch) => {
    setSelectedBatch(batch);
    setEditableRows(JSON.parse(JSON.stringify(batch.staged_data)));
    setMsg(null);
  };

  const handleCellChange = (index: number, field: string, value: any) => {
    const updated = [...editableRows];
    updated[index][field] = value;
    setEditableRows(updated);
  };

  const handleSaveDraftChanges = async () => {
    if (!selectedBatch) return;
    setActionLoading(true);
    try {
      await apiClient.put(`/users/roster-batches/${selectedBatch.id}`, {
        staged_data: editableRows
      });
      setMsg({ type: 'success', text: 'Saved staged record modifications successfully.' });
      setActionLoading(false);
      fetchBatches();
    } catch {
      setMsg({ type: 'error', text: 'Failed to save modifications.' });
      setActionLoading(false);
    }
  };

  const handleApproveBatch = async (batchId: number) => {
    if (!(await confirmDialog("Are you sure you want to approve this roster and load student records into the database?"))) return;

    setActionLoading(true);
    try {
      // Save any edits first
      if (selectedBatch && selectedBatch.id === batchId) {
        await apiClient.put(`/users/roster-batches/${batchId}`, { staged_data: editableRows });
      }

      const res = await apiClient.post(`/users/roster-batches/${batchId}/approve?approver_id=${user?.id || 1}`);
      setMsg({ type: 'success', text: res.data.message || 'Batch approved and loaded into DB!' });
      setActionLoading(false);
      setSelectedBatch(null);
      fetchBatches();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.detail || 'Approval failed.' });
      setActionLoading(false);
    }
  };

  const handleOpenRejectModal = (batch: RosterBatch) => {
    setRejectingBatch(batch);
    setRejectReason('Column formatting issues / invalid register numbers');
  };

  const handleConfirmReject = async () => {
    if (!rejectingBatch) return;
    setActionLoading(true);
    try {
      await apiClient.post(`/users/roster-batches/${rejectingBatch.id}/reject?notes=${encodeURIComponent(rejectReason)}`);
      setMsg({ type: 'success', text: `Roster batch #${rejectingBatch.id} rejected.` });
      setActionLoading(false);
      setRejectingBatch(null);
      if (selectedBatch?.id === rejectingBatch.id) {
        setSelectedBatch(null);
      }
      fetchBatches();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.detail || 'Rejection failed.' });
      setActionLoading(false);
    }
  };

  const handleDeleteBatch = async (batchId: number, batchName: string) => {
    if (!(await confirmDialog(`Are you sure you want to remove and delete "${batchName}" from the roster queue?`))) return;

    setActionLoading(true);
    try {
      await apiClient.delete(`/users/roster-batches/${batchId}`);
      setMsg({ type: 'success', text: 'Roster batch removed successfully.' });
      setActionLoading(false);
      if (selectedBatch?.id === batchId) {
        setSelectedBatch(null);
      }
      fetchBatches();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.detail || 'Failed to delete roster batch.' });
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Banner */}
      <div className="bg-[#FFFFFF] p-5 rounded-2xl border border-[#E2E8F0] text-[#0F172A] flex items-center justify-between shadow-sm">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-[#FF5500] uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-[#FF5500]" />
            <span>Head of Department (HoD) Control Panel</span>
          </div>
          <h3 className="text-xl font-bold mt-1 text-[#0F172A]">Student Roster Approval & Verification Queue</h3>
        </div>
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] px-4 py-2 rounded-xl text-center">
          <div className="text-2xl font-extrabold text-[#0F172A]">
            {batches.filter(b => b.status === 'Pending').length}
          </div>
          <div className="text-[10px] uppercase tracking-wider font-semibold text-[#FF5500]">Pending Approvals</div>
        </div>
      </div>

      {msg && (
        <div className={`p-4 rounded-xl text-sm font-semibold flex items-center justify-between space-x-2 ${
          msg.type === 'success' ? 'bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/30' : 'bg-rose-50 text-rose-600 border border-rose-200'
        }`}>
          <div className="flex items-center space-x-2">
            {msg.type === 'success' ? <CheckCircle className="w-5 h-5 text-[#22C55E] shrink-0" /> : <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />}
            <span>{msg.text}</span>
          </div>
          <button onClick={() => setMsg(null)} className="text-xs opacity-60 hover:opacity-100 p-1 cursor-pointer">✕</button>
        </div>
      )}

      {/* Batch Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {batches.map((b) => (
          <div
            key={b.id}
            className={`p-5 rounded-2xl border transition shadow-sm bg-[#FFFFFF] hover:border-[#FF5500]/40 relative flex flex-col justify-between ${
              selectedBatch?.id === b.id ? 'border-[#FF5500] ring-1 ring-[#FF5500]/30' : 'border-[#E2E8F0]'
            }`}
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-[#F8FAFC] text-[#FF5500] border border-[#E2E8F0] px-2.5 py-0.5 rounded-full">
                    {b.programme_code} — Sec {b.section_name}
                  </span>
                  <h4 className="text-base font-bold text-[#0F172A] mt-2 line-clamp-2" title={b.file_name}>{b.file_name}</h4>
                  <p className="text-xs text-[#64748B]">Submitted by <span className="font-semibold text-[#475569]">{b.tutor_name}</span></p>
                </div>

                <div className="flex items-center space-x-1.5 shrink-0">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center space-x-1 ${
                    b.status === 'Pending' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                    b.status === 'Approved' ? 'bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30' :
                    'bg-rose-50 text-rose-600 border border-rose-200'
                  }`}>
                    {b.status === 'Pending' && <Clock className="w-3.5 h-3.5 text-amber-500" />}
                    {b.status === 'Approved' && <CheckCircle className="w-3.5 h-3.5 text-[#22C55E]" />}
                    {b.status === 'Rejected' && <XCircle className="w-3.5 h-3.5 text-rose-500" />}
                    <span>{b.status}</span>
                  </span>

                  <button
                    onClick={() => handleDeleteBatch(b.id, b.file_name)}
                    title="Remove / Delete Roster Request"
                    className="p-1 text-[#64748B] hover:text-rose-600 hover:bg-[#F8FAFC] rounded-lg transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {b.status === 'Rejected' && b.rejection_notes && (
                <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Reason: </span>
                    <span>{b.rejection_notes}</span>
                  </div>
                </div>
              )}

              <div className="mt-4 pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-xs text-[#64748B]">
                <div>
                  <span className="font-bold text-[#0F172A]">{b.staged_data?.length || 0}</span> Students
                </div>
                <div>Batch: <span className="font-semibold text-[#475569]">{b.batch_name}</span></div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <button
                onClick={() => handleInspectBatch(b)}
                className="flex-1 bg-[#F8FAFC] hover:bg-[#F0F3F6] text-[#0F172A] border border-[#E2E8F0] text-xs font-semibold py-2 px-3 rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs"
              >
                <Eye className="w-4 h-4 text-[#FF5500]" />
                <span>View & Edit</span>
              </button>

              {b.status === 'Pending' && (
                <>
                  <button
                    onClick={() => handleApproveBatch(b.id)}
                    title="Approve Roster"
                    className="bg-[#FF5500] hover:bg-[#E64D00] text-white text-xs font-bold py-2 px-3 rounded-xl transition flex items-center justify-center space-x-1 shadow-sm cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Approve</span>
                  </button>
                  <button
                    onClick={() => handleOpenRejectModal(b)}
                    title="Reject Roster"
                    className="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 text-xs font-bold py-2 px-3 rounded-xl transition flex items-center justify-center space-x-1 shadow-xs cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject</span>
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* REJECT MODAL */}
      {rejectingBatch && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-[#0F172A]">Reject Roster Batch #{rejectingBatch.id}</h3>
            <p className="text-xs text-[#64748B]">
              Please state the reason for rejecting this candidate roster:
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g., Column formatting issues, invalid register numbers..."
              rows={3}
              className="w-full bg-[#F8FAFC] text-[#0F172A] border border-[#E2E8F0] rounded-xl p-3 text-xs focus:outline-none focus:border-rose-500 shadow-inner"
            />
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setRejectingBatch(null)}
                className="px-3 py-1.5 bg-[#FFFFFF] text-xs font-bold text-[#64748B] rounded-xl border border-[#E2E8F0] hover:bg-[#F8FAFC]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={actionLoading || !rejectReason.trim()}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition flex items-center space-x-1.5 shadow-sm cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
                <span>Confirm Rejection</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INSPECT & EDIT MODAL / PANEL */}
      {selectedBatch && (
        <div className="bg-[#FFFFFF] rounded-2xl border border-[#E2E8F0] shadow-xl overflow-hidden">
          <div className="bg-[#F8FAFC] p-5 text-[#0F172A] border-b border-[#E2E8F0] flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2 text-xs text-[#FF5500] font-semibold">
                <Edit3 className="w-4 h-4 text-[#FF5500]" />
                <span>HoD Roster Inspection & Data Editor</span>
              </div>
              <h3 className="text-lg font-bold mt-1 text-[#0F172A]">
                Staged Roster Batch #{selectedBatch.id} — {selectedBatch.programme_name} (Section {selectedBatch.section_name})
              </h3>
              <p className="text-xs text-[#64748B] mt-0.5">
                Target Batch: {selectedBatch.batch_name} | Uploaded by: {selectedBatch.tutor_name}
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleSaveDraftChanges}
                disabled={actionLoading}
                className="bg-[#FF5500] hover:bg-[#E64D00] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>Save Edits</span>
              </button>

              {selectedBatch.status === 'Pending' && (
                <>
                  <button
                    onClick={() => handleApproveBatch(selectedBatch.id)}
                    disabled={actionLoading}
                    className="bg-[#22C55E] hover:bg-emerald-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition shadow-sm cursor-pointer"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Approve & Load to DB</span>
                  </button>

                  <button
                    onClick={() => handleOpenRejectModal(selectedBatch)}
                    disabled={actionLoading}
                    className="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer shadow-xs"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject</span>
                  </button>
                </>
              )}

              {selectedBatch.status === 'Rejected' && (
                <button
                  onClick={() => handleDeleteBatch(selectedBatch.id, selectedBatch.file_name)}
                  disabled={actionLoading}
                  className="bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer shadow-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Remove Roster</span>
                </button>
              )}

              <button
                onClick={() => setSelectedBatch(null)}
                className="text-[#64748B] hover:text-[#0F172A] px-3 py-1 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Editable Student Table */}
          <div className="p-6 space-y-4">
            <div className="text-xs font-bold text-[#475569] uppercase tracking-wider flex items-center justify-between">
              <span>Editable Student Data Grid ({editableRows.length} Records)</span>
              <span className="text-[11px] text-[#64748B] font-normal">Click any cell to edit Name, UnivregNo, Batch, or Email before approving.</span>
            </div>

            <div className="max-h-96 overflow-y-auto border border-[#E2E8F0] rounded-xl bg-[#FFFFFF] shadow-inner">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] text-[#64748B] font-semibold sticky top-0 border-b border-[#E2E8F0]">
                  <tr>
                    <th className="py-2.5 px-4">#</th>
                    <th className="py-2.5 px-4">Student Name</th>
                    <th className="py-2.5 px-4">UnivregNo (Reg No)</th>
                    <th className="py-2.5 px-4">Batch</th>
                    <th className="py-2.5 px-4">Current Sem</th>
                    <th className="py-2.5 px-4">Email</th>
                    <th className="py-2.5 px-4">Allocated Password (Login)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {editableRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-[#F8FAFC] transition">
                      <td className="py-2 px-4 text-[#64748B] font-mono">{idx + 1}</td>
                      <td className="py-1 px-2">
                        <input
                          type="text"
                          value={row.full_name || row.name || ''}
                          onChange={(e) => handleCellChange(idx, 'full_name', e.target.value)}
                          className="w-full bg-[#FFFFFF] border border-[#E2E8F0] focus:border-[#FF5500] rounded px-2 py-1 text-[#0F172A] font-semibold outline-none"
                        />
                      </td>
                      <td className="py-1 px-2">
                        <input
                          type="text"
                          value={row.register_number || row.UnivregNo || ''}
                          onChange={(e) => handleCellChange(idx, 'register_number', e.target.value)}
                          className="w-full bg-[#FFFFFF] border border-[#E2E8F0] focus:border-[#FF5500] rounded px-2 py-1 text-[#FF5500] font-mono font-medium outline-none"
                        />
                      </td>
                      <td className="py-1 px-2">
                        <input
                          type="text"
                          value={row.batch_name || row.batch || ''}
                          onChange={(e) => handleCellChange(idx, 'batch_name', e.target.value)}
                          className="w-full bg-[#FFFFFF] border border-[#E2E8F0] focus:border-[#FF5500] rounded px-2 py-1 text-[#475569] outline-none"
                        />
                      </td>
                      <td className="py-1 px-2">
                        <input
                          type="number"
                          value={row.semester_num || ''}
                          onChange={(e) => handleCellChange(idx, 'semester_num', parseInt(e.target.value, 10))}
                          className="w-full bg-[#FFFFFF] border border-[#E2E8F0] focus:border-[#FF5500] rounded px-2 py-1 text-[#0F172A] font-bold outline-none"
                        />
                      </td>
                      <td className="py-1 px-2">
                        <input
                          type="text"
                          value={row.email || ''}
                          onChange={(e) => handleCellChange(idx, 'email', e.target.value)}
                          className="w-full bg-[#FFFFFF] border border-[#E2E8F0] focus:border-[#FF5500] rounded px-2 py-1 text-[#475569] outline-none"
                        />
                      </td>
                      <td className="py-1 px-2">
                        <input
                          type="text"
                          value={row.allocated_password || row.password || ''}
                          onChange={(e) => handleCellChange(idx, 'allocated_password', e.target.value)}
                          placeholder="Auto-generated on Approval"
                          className="w-full bg-[#FFFFFF] border border-[#E2E8F0] focus:border-[#FF5500] rounded px-2 py-1 text-[#FF5500] font-mono font-bold outline-none"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
