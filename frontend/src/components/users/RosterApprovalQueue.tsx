import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { CheckCircle, XCircle, Edit3, Eye, Clock, Check, ShieldCheck, Save, AlertCircle, Trash2, X, AlertTriangle } from 'lucide-react';

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
    if (!window.confirm("Are you sure you want to approve this roster and load student records into the database?")) return;

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
    if (!window.confirm(`Are you sure you want to remove and delete "${batchName}" from the roster queue?`)) return;

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
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#141311] p-5 rounded-2xl border border-[#2A2824] text-[#F8F5ED] flex items-center justify-between shadow-lg">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-[#C9A227] uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-[#C9A227]" />
            <span>Head of Department (HoD) Control Panel</span>
          </div>
          <h3 className="text-xl font-bold mt-1 text-[#F8F5ED]">Student Roster Approval & Verification Queue</h3>
        </div>
        <div className="bg-[#1C1B18] border border-[#2A2824] px-4 py-2 rounded-xl text-center">
          <div className="text-2xl font-extrabold text-[#F8F5ED]">
            {batches.filter(b => b.status === 'Pending').length}
          </div>
          <div className="text-[10px] uppercase tracking-wider font-semibold text-[#C9A227]">Pending Approvals</div>
        </div>
      </div>

      {msg && (
        <div className={`p-4 rounded-xl text-sm font-semibold flex items-center justify-between space-x-2 ${
          msg.type === 'success' ? 'bg-[#141311] text-[#4ADE80] border border-[#4ADE80]/30' : 'bg-[#141311] text-[#EF4444] border border-[#EF4444]/30'
        }`}>
          <div className="flex items-center space-x-2">
            {msg.type === 'success' ? <CheckCircle className="w-5 h-5 text-[#4ADE80] shrink-0" /> : <AlertCircle className="w-5 h-5 text-[#EF4444] shrink-0" />}
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
            className={`p-5 rounded-2xl border transition shadow-sm bg-[#1C1B18] hover:border-[#C9A227]/40 relative flex flex-col justify-between ${
              selectedBatch?.id === b.id ? 'border-[#C9A227] ring-1 ring-[#C9A227]/30' : 'border-[#2A2824]'
            }`}
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-[#141311] text-[#E3C766] border border-[#2A2824] px-2.5 py-0.5 rounded-full">
                    {b.programme_code} — Sec {b.section_name}
                  </span>
                  <h4 className="text-base font-bold text-[#F8F5ED] mt-2 line-clamp-2" title={b.file_name}>{b.file_name}</h4>
                  <p className="text-xs text-[#9E988A]">Submitted by <span className="font-semibold text-[#D8D2C5]">{b.tutor_name}</span></p>
                </div>

                <div className="flex items-center space-x-1.5 shrink-0">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center space-x-1 ${
                    b.status === 'Pending' ? 'bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30' :
                    b.status === 'Approved' ? 'bg-[#4ADE80]/15 text-[#4ADE80] border border-[#4ADE80]/30' :
                    'bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30'
                  }`}>
                    {b.status === 'Pending' && <Clock className="w-3.5 h-3.5 text-[#F59E0B]" />}
                    {b.status === 'Approved' && <CheckCircle className="w-3.5 h-3.5 text-[#4ADE80]" />}
                    {b.status === 'Rejected' && <XCircle className="w-3.5 h-3.5 text-[#EF4444]" />}
                    <span>{b.status}</span>
                  </span>

                  <button
                    onClick={() => handleDeleteBatch(b.id, b.file_name)}
                    title="Remove / Delete Roster Request"
                    className="p-1 text-[#9E988A] hover:text-[#EF4444] hover:bg-[#141311] rounded-lg transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {b.status === 'Rejected' && b.rejection_notes && (
                <div className="mt-3 p-2.5 bg-[#141311] border border-[#EF4444]/30 rounded-xl text-xs text-[#EF4444] flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-[#EF4444] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Reason: </span>
                    <span>{b.rejection_notes}</span>
                  </div>
                </div>
              )}

              <div className="mt-4 pt-3 border-t border-[#2A2824] flex items-center justify-between text-xs text-[#9E988A]">
                <div>
                  <span className="font-bold text-[#F8F5ED]">{b.staged_data?.length || 0}</span> Students
                </div>
                <div>Batch: <span className="font-semibold text-[#D8D2C5]">{b.batch_name}</span></div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <button
                onClick={() => handleInspectBatch(b)}
                className="flex-1 bg-[#24231F] hover:bg-[#2E2C27] text-[#F8F5ED] border border-[#2A2824] text-xs font-semibold py-2 px-3 rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <Eye className="w-4 h-4 text-[#C9A227]" />
                <span>View & Edit</span>
              </button>

              {b.status === 'Pending' && (
                <>
                  <button
                    onClick={() => handleApproveBatch(b.id)}
                    title="Approve Roster"
                    className="bg-[#4ADE80] hover:bg-[#22C55E] text-[#11110F] text-xs font-bold py-2 px-3 rounded-xl transition flex items-center justify-center space-x-1 shadow-sm cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Approve</span>
                  </button>
                  <button
                    onClick={() => handleOpenRejectModal(b)}
                    title="Reject Roster"
                    className="bg-[#EF4444] hover:bg-[#DC2626] text-white text-xs font-bold py-2 px-3 rounded-xl transition flex items-center justify-center space-x-1 shadow-sm cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject</span>
                  </button>
                </>
              )}

              {b.status === 'Rejected' && (
                <button
                  onClick={() => handleDeleteBatch(b.id, b.file_name)}
                  title="Remove Rejected Request"
                  className="bg-[#141311] hover:bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/30 text-xs font-semibold py-2 px-3 rounded-xl transition flex items-center justify-center space-x-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-[#EF4444]" />
                  <span>Remove</span>
                </button>
              )}
            </div>
          </div>
        ))}

        {batches.length === 0 && !loading && (
          <div className="col-span-full bg-[#1C1B18] p-8 rounded-2xl border border-[#2A2824] text-center text-[#9E988A] text-xs">
            No roster approval requests found. When Class Tutors upload Excel sheets, they will appear here for HoD review.
          </div>
        )}
      </div>

      {/* REJECTION REASON DIALOG MODAL */}
      {rejectingBatch && (
        <div className="fixed inset-0 bg-[#11110F]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1C1B18] rounded-2xl border border-[#2A2824] shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#2A2824]">
              <div className="flex items-center space-x-2 text-[#EF4444]">
                <AlertCircle className="w-5 h-5" />
                <h3 className="text-base font-bold text-[#F8F5ED]">Reject Student Roster</h3>
              </div>
              <button
                onClick={() => setRejectingBatch(null)}
                className="text-[#9E988A] hover:text-[#F8F5ED] p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#D8D2C5] leading-relaxed">
              Rejecting <strong className="text-[#F8F5ED]">"{rejectingBatch.file_name}"</strong> ({rejectingBatch.programme_code} Sec {rejectingBatch.section_name}). Please state the feedback or correction reason for the tutor:
            </p>

            {/* Quick Reason Preset Buttons */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-semibold text-[#9E988A] uppercase tracking-wider">Quick Suggestions:</div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "Column formatting error",
                  "Invalid Register Numbers",
                  "Incorrect Batch/Semester",
                  "Duplicate student records"
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setRejectReason(preset)}
                    className="text-[11px] bg-[#141311] hover:bg-[#24231F] text-[#D8D2C5] px-2.5 py-1 rounded-lg border border-[#2A2824] transition cursor-pointer"
                  >
                    + {preset}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#D8D2C5] mb-1">Rejection Reason / Notes:</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                className="w-full bg-[#141311] border border-[#2A2824] rounded-xl p-3 text-xs text-[#F8F5ED] focus:border-[#EF4444] outline-none transition"
                placeholder="Explain the changes required..."
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingBatch(null)}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#9E988A] hover:bg-[#24231F] transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={actionLoading || !rejectReason.trim()}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#EF4444] hover:bg-[#DC2626] text-white transition flex items-center space-x-1.5 shadow-sm cursor-pointer"
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
        <div className="bg-[#1C1B18] rounded-2xl border border-[#2A2824] shadow-xl overflow-hidden">
          <div className="bg-[#141311] p-5 text-[#F8F5ED] border-b border-[#2A2824] flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2 text-xs text-[#C9A227] font-semibold">
                <Edit3 className="w-4 h-4 text-[#C9A227]" />
                <span>HoD Roster Inspection & Data Editor</span>
              </div>
              <h3 className="text-lg font-bold mt-1 text-[#F8F5ED]">
                Staged Roster Batch #{selectedBatch.id} — {selectedBatch.programme_name} (Section {selectedBatch.section_name})
              </h3>
              <p className="text-xs text-[#9E988A] mt-0.5">
                Target Batch: {selectedBatch.batch_name} | Uploaded by: {selectedBatch.tutor_name}
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleSaveDraftChanges}
                disabled={actionLoading}
                className="bg-[#C9A227] hover:bg-[#B89220] text-[#11110F] px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Edits</span>
              </button>

              {selectedBatch.status === 'Pending' && (
                <>
                  <button
                    onClick={() => handleApproveBatch(selectedBatch.id)}
                    disabled={actionLoading}
                    className="bg-[#4ADE80] hover:bg-[#22C55E] text-[#11110F] px-4 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition shadow-sm cursor-pointer"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Approve & Load to DB</span>
                  </button>

                  <button
                    onClick={() => handleOpenRejectModal(selectedBatch)}
                    disabled={actionLoading}
                    className="bg-[#EF4444] hover:bg-[#DC2626] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer"
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
                  className="bg-[#EF4444] hover:bg-[#DC2626] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Remove Roster</span>
                </button>
              )}

              <button
                onClick={() => setSelectedBatch(null)}
                className="text-[#9E988A] hover:text-[#F8F5ED] px-3 py-1 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Editable Student Table */}
          <div className="p-6 space-y-4">
            <div className="text-xs font-bold text-[#D8D2C5] uppercase tracking-wider flex items-center justify-between">
              <span>Editable Student Data Grid ({editableRows.length} Records)</span>
              <span className="text-[11px] text-[#9E988A] font-normal">Click any cell to edit Name, UnivregNo, Batch, or Email before approving.</span>
            </div>

            <div className="max-h-96 overflow-y-auto border border-[#2A2824] rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#141311] text-[#9E988A] font-semibold sticky top-0 border-b border-[#2A2824]">
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
                <tbody className="divide-y divide-[#2A2824]">
                  {editableRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-[#24231F]">
                      <td className="py-2 px-4 text-[#9E988A] font-mono">{idx + 1}</td>
                      <td className="py-1 px-2">
                        <input
                          type="text"
                          value={row.full_name || row.name || ''}
                          onChange={(e) => handleCellChange(idx, 'full_name', e.target.value)}
                          className="w-full bg-[#141311] border border-[#2A2824] focus:border-[#C9A227] rounded px-2 py-1 text-[#F8F5ED] font-semibold outline-none"
                        />
                      </td>
                      <td className="py-1 px-2">
                        <input
                          type="text"
                          value={row.register_number || row.UnivregNo || ''}
                          onChange={(e) => handleCellChange(idx, 'register_number', e.target.value)}
                          className="w-full bg-[#141311] border border-[#2A2824] focus:border-[#C9A227] rounded px-2 py-1 text-[#C9A227] font-mono font-medium outline-none"
                        />
                      </td>
                      <td className="py-1 px-2">
                        <input
                          type="text"
                          value={row.batch_name || row.batch || ''}
                          onChange={(e) => handleCellChange(idx, 'batch_name', e.target.value)}
                          className="w-full bg-[#141311] border border-[#2A2824] focus:border-[#C9A227] rounded px-2 py-1 text-[#D8D2C5] outline-none"
                        />
                      </td>
                      <td className="py-1 px-2">
                        <input
                          type="number"
                          value={row.semester_num || ''}
                          onChange={(e) => handleCellChange(idx, 'semester_num', parseInt(e.target.value, 10))}
                          className="w-full bg-[#141311] border border-[#2A2824] focus:border-[#C9A227] rounded px-2 py-1 text-[#F8F5ED] font-bold outline-none"
                        />
                      </td>
                      <td className="py-1 px-2">
                        <input
                          type="text"
                          value={row.email || ''}
                          onChange={(e) => handleCellChange(idx, 'email', e.target.value)}
                          className="w-full bg-[#141311] border border-[#2A2824] focus:border-[#C9A227] rounded px-2 py-1 text-[#D8D2C5] outline-none"
                        />
                      </td>
                      <td className="py-1 px-2">
                        <input
                          type="text"
                          value={row.allocated_password || row.password || ''}
                          onChange={(e) => handleCellChange(idx, 'allocated_password', e.target.value)}
                          placeholder="Auto-generated on Approval"
                          className="w-full bg-[#141311] border border-[#2A2824] focus:border-[#C9A227] rounded px-2 py-1 text-[#E3C766] font-mono font-bold outline-none"
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
