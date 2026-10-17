import React, { useCallback, useEffect, useState } from 'react';
import apiClient from '../../api/client';
import { notify, confirmDialog } from '../../components/ui/Dialogs';
import { drainStudentEmails } from '../../utils/studentEmails';
import {
  Mail, CheckCircle2, XCircle, Clock, RefreshCw, AlertCircle, Trash2, Search, LogIn,
} from 'lucide-react';

interface Sender {
  gmail_address: string;
  verified_at: string | null;
  last_error: string | null;
}

interface StudentRow {
  user_id: number;
  register_number: string;
  full_name: string;
  email: string;
  sent_to: string | null;
  status: 'SENT' | 'PENDING' | 'BOUNCED' | 'FAILED' | 'SKIPPED' | 'NOT_QUEUED';
  error: string | null;
  sent_at: string | null;
  email_updated_at: string | null;
  can_retry: boolean;
}

interface Overview {
  sender: Sender | null;
  google_configured: boolean;
  default_password: string;
  counts: { received: number; not_received: number; pending: number; not_queued: number };
  notifications_30d: { sent: number; pending: number; not_delivered: number };
  pending_total: number;
  students: StudentRow[];
}

type Filter = 'all' | 'received' | 'not_received' | 'pending';

const groupOf = (s: StudentRow['status']): Filter | 'not_queued' =>
  s === 'SENT' ? 'received' : s === 'PENDING' ? 'pending' : s === 'NOT_QUEUED' ? 'not_queued' : 'not_received';

const STATUS_LABEL: Record<StudentRow['status'], string> = {
  SENT: 'Received',
  PENDING: 'Waiting to send',
  BOUNCED: 'Bounced',
  FAILED: 'Failed',
  SKIPPED: 'No email address',
  NOT_QUEUED: 'Loaded before email setup',
};

const fmt = (iso: string | null) =>
  iso ? new Date(iso + (iso.endsWith('Z') ? '' : 'Z')).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '';

export const StudentEmails: React.FC = () => {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [senderError, setSenderError] = useState<string | null>(null);
  const [sending, setSending] = useState<string | null>(null);
  const [retrying, setRetrying] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await apiClient.get<Overview>('/student-emails/overview');
      setData(res.data);
      return res.data;
    } catch (err: any) {
      notify(err.response?.data?.detail || 'Could not load student emails.', 'error');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const sendQueued = useCallback(async () => {
    setSending('Sending queued emails...');
    try {
      const r = await drainStudentEmails((p) =>
        setSending(p.remaining ? `Sending queued emails... ${p.sent} sent, ${p.remaining} left` : null));
      if (r.error) notify(r.error, 'error');
    } catch (err: any) {
      notify(err.response?.data?.detail || 'Sending stopped. It will continue on your next visit.', 'error');
    } finally {
      setSending(null);
      load();
    }
  }, [load]);

  useEffect(() => {
    // Google sign-in returns here with ?student_emails=connected|error&reason=...
    const params = new URLSearchParams(window.location.search);
    const outcome = params.get('student_emails');
    if (outcome) {
      const reason = params.get('reason') || '';
      if (outcome === 'connected') notify(`Connected ${reason}. A test email was sent to it.`, 'success');
      else setSenderError(reason || 'Google sign-in did not finish. Try again.');
      params.delete('student_emails');
      params.delete('reason');
      const rest = params.toString();
      window.history.replaceState(null, '', window.location.pathname + (rest ? `?${rest}` : '') + window.location.hash);
    }
    load().then((d) => {
      if (d?.sender && !d.sender.last_error && d.pending_total > 0) sendQueued();
    });
  }, [load, sendQueued]);

  const connectGoogle = async () => {
    setSenderError(null);
    setConnecting(true);
    try {
      const res = await apiClient.post('/student-emails/google/start', { portal_url: window.location.origin });
      window.location.assign(res.data.url);  // Google's sign-in page; it returns to this page
    } catch (err: any) {
      setSenderError(err.response?.data?.detail || 'Could not start Google sign-in.');
      setConnecting(false);
    }
  };

  const removeSender = async () => {
    if (!(await confirmDialog('Disconnect this Gmail account? Student emails will wait until you connect a Gmail account again.', { confirmLabel: 'Disconnect', danger: true }))) return;
    try {
      await apiClient.delete('/student-emails/sender');
      load();
    } catch (err: any) {
      notify(err.response?.data?.detail || 'Could not remove the sender.', 'error');
    }
  };

  const retry = async (row: StudentRow) => {
    setRetrying(row.user_id);
    try {
      const res = await apiClient.post(`/student-emails/${row.user_id}/retry`);
      if (res.data.error) notify(res.data.error, 'error');
      else notify(`Welcome email sent again to ${row.email}.`, 'success');
    } catch (err: any) {
      notify(err.response?.data?.detail || 'Retry failed.', 'error');
    } finally {
      setRetrying(null);
      load();
    }
  };

  if (loading && !data) {
    return <div className="text-sm text-[#64748B] py-10 text-center">Loading student emails...</div>;
  }
  if (!data) return null;

  const { sender, counts } = data;
  const q = search.trim().toLowerCase();
  const rows = data.students.filter((r) => {
    const g = groupOf(r.status);
    if (filter !== 'all' && g !== filter) return false;
    return !q || `${r.register_number} ${r.full_name} ${r.email}`.toLowerCase().includes(q);
  });

  const tiles: { id: Filter; label: string; value: number; icon: React.ElementType; color: string }[] = [
    { id: 'received', label: 'Received', value: counts.received, icon: CheckCircle2, color: '#22C55E' },
    { id: 'not_received', label: 'Not received', value: counts.not_received, icon: XCircle, color: '#EF4444' },
    { id: 'pending', label: 'Waiting to send', value: counts.pending, icon: Clock, color: '#F59E0B' },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center space-x-3">
        <div className="w-11 h-11 bg-[#FFF5F0] text-[#FF5500] rounded-xl flex items-center justify-center border border-[#FF5500]/25">
          <Mail className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-[#0F172A]">Student Emails</h2>
          <p className="text-xs text-[#64748B]">A welcome email goes out automatically when you upload a roster; notifications and password-change notices follow from the same address.</p>
        </div>
      </div>

      {/* Sender */}
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#E2E8F0] p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-[10px] uppercase font-bold tracking-wider text-[#64748B]">Sender email</div>
          {sender && (
            <div className="flex gap-2">
              <button
                onClick={connectGoogle}
                disabled={connecting || !data.google_configured}
                className="text-xs text-[#FF5500] hover:text-[#E64D00] bg-[#FFF5F0] border border-[#FF5500]/25 px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className="w-3.5 h-3.5" /><span>{connecting ? 'Opening Google...' : 'Reconnect'}</span>
              </button>
              <button
                onClick={removeSender}
                className="text-xs text-[#EF4444] hover:text-white hover:bg-[#EF4444] bg-[#FEF2F2] border border-[#EF4444]/30 px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /><span>Disconnect</span>
              </button>
            </div>
          )}
        </div>

        {sender ? (
          <div className="space-y-1.5">
            <div className="text-sm font-semibold text-[#0F172A] break-all">{sender.gmail_address}</div>
            {sender.last_error ? (
              <div className="text-xs text-[#EF4444] flex items-start space-x-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" /><span>{sender.last_error}</span>
              </div>
            ) : (
              <div className="text-xs text-[#22C55E] flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /><span>Connected with Google{sender.verified_at ? ` on ${fmt(sender.verified_at)}` : ''}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-xs text-[#F59E0B] flex items-start space-x-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>No sender yet. Welcome emails for uploaded students wait here and go out as soon as you connect your Gmail.</span>
            </div>
            <div className="text-xs text-[#334155] bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 space-y-1">
              <div>Sign in with your college Google account, as you normally do, and allow {`"Send email on your behalf"`}.</div>
              <div className="text-[#64748B]">Student emails then go out from your address. A test email is sent to you to confirm it works. You can disconnect at any time.</div>
            </div>
            {!data.google_configured && (
              <div className="text-xs text-[#64748B] flex items-start space-x-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>Google sign-in is not set up on the server yet. Ask the administrator to add the Google OAuth client.</span>
              </div>
            )}
            <div className="flex justify-end">
              <button
                onClick={connectGoogle}
                disabled={connecting || !data.google_configured}
                className="text-xs bg-[#FF5500] hover:bg-[#E64D00] text-white font-bold px-4 py-2 rounded-lg flex items-center space-x-1.5 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <LogIn className="w-3.5 h-3.5" /><span>{connecting ? 'Opening Google...' : 'Connect with Google'}</span>
              </button>
            </div>
          </div>
        )}
        {senderError && (
          <div className="text-xs text-[#EF4444] flex items-start space-x-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" /><span>{senderError}</span>
          </div>
        )}

        <div className="text-xs text-[#64748B] border-t border-[#E2E8F0] pt-3">
          Students start with the password <span className="font-mono font-bold text-[#FF5500]">{data.default_password}</span> and
          are asked to change it after they sign in.
        </div>
      </div>

      {/* Welcome email delivery */}
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#E2E8F0] p-5 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="text-[10px] uppercase font-bold tracking-wider text-[#64748B]">Welcome email delivery</div>
          <button
            onClick={() => (sender && data.pending_total > 0 ? sendQueued() : load())}
            disabled={!!sending}
            className="text-xs text-[#475569] hover:text-[#0F172A] bg-[#F1F5F9] border border-[#E2E8F0] px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${sending ? 'animate-spin' : ''}`} />
            <span>{sending || 'Refresh'}</span>
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {tiles.map((t) => (
            <button
              key={t.id}
              onClick={() => setFilter(filter === t.id ? 'all' : t.id)}
              className={`text-left bg-[#F8FAFC] border rounded-xl p-3 transition cursor-pointer ${filter === t.id ? 'border-[#FF5500] ring-1 ring-[#FF5500]' : 'border-[#E2E8F0] hover:border-[#CBD5E1]'}`}
            >
              <div className="flex items-center space-x-1.5 text-[11px] text-[#64748B]">
                <t.icon className="w-3.5 h-3.5 shrink-0" style={{ color: t.color }} />
                <span className="truncate">{t.label}</span>
              </div>
              <div className="text-2xl font-bold text-[#0F172A] mt-1 tabular-nums">{t.value}</div>
            </button>
          ))}
        </div>
        {counts.not_queued > 0 && (
          <div className="text-[11px] text-[#64748B]">
            {counts.not_queued} student{counts.not_queued === 1 ? ' was' : 's were'} loaded before student emails were set up and have not been sent a welcome email.
          </div>
        )}
        <div className="text-[11px] text-[#64748B]">
          Bounces from wrong addresses can take a few minutes to show. Retry opens for a student once they save a new email in My Profile.
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-2.5" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, register number or email"
            className="w-full text-sm bg-[#FFFFFF] text-[#0F172A] placeholder-[#94A3B8] border border-[#E2E8F0] rounded-lg pl-9 pr-3 py-2 focus:border-[#FF5500] outline-none"
          />
        </div>

        <div className="border border-[#E2E8F0] rounded-xl overflow-x-auto max-h-[28rem] overflow-y-auto">
          <table className="w-full text-left text-xs min-w-[640px]">
            <thead className="bg-[#F8FAFC] text-[#475569] font-semibold sticky top-0 border-b border-[#E2E8F0]">
              <tr>
                <th className="py-2.5 px-4">Reg No</th>
                <th className="py-2.5 px-4">Student</th>
                <th className="py-2.5 px-4">Email</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {rows.length === 0 && (
                <tr><td colSpan={5} className="py-8 text-center text-[#64748B]">No students to show.</td></tr>
              )}
              {rows.map((r) => {
                const g = groupOf(r.status);
                const color = g === 'received' ? '#22C55E' : g === 'not_received' ? '#EF4444' : g === 'pending' ? '#F59E0B' : '#64748B';
                return (
                  <tr key={r.user_id} className="hover:bg-[#F8FAFC] transition-colors align-top">
                    <td className="py-2.5 px-4 font-mono text-[#334155]">{r.register_number}</td>
                    <td className="py-2.5 px-4 text-[#0F172A] font-semibold">{r.full_name}</td>
                    <td className="py-2.5 px-4 text-[#334155] break-all">
                      {r.email}
                      {r.sent_to && r.sent_to !== r.email && (
                        <div className="text-[10px] text-[#64748B]">Sent to {r.sent_to}</div>
                      )}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="font-semibold" style={{ color }}>{STATUS_LABEL[r.status]}</span>
                      {(r.error || r.sent_at) && (
                        <div className="text-[10px] text-[#64748B] mt-0.5">{r.status === 'SENT' ? fmt(r.sent_at) : r.error}</div>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      {(g === 'not_received' || g === 'not_queued') && (
                        <button
                          onClick={() => retry(r)}
                          disabled={!r.can_retry || retrying === r.user_id}
                          title={r.can_retry ? 'Send the welcome email to the new address' : 'Available after the student saves a new email in My Profile'}
                          className="text-xs bg-[#FFF5F0] border border-[#FF5500]/25 text-[#FF5500] hover:bg-[#FF5500] hover:text-white px-3 py-1.5 rounded-lg inline-flex items-center space-x-1.5 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${retrying === r.user_id ? 'animate-spin' : ''}`} />
                          <span>Retry</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-xs text-[#64748B] px-1">
        Notification emails in the last 30 days: {data.notifications_30d.sent} sent, {data.notifications_30d.pending} waiting,{' '}
        {data.notifications_30d.not_delivered} not delivered.
      </div>
    </div>
  );
};
