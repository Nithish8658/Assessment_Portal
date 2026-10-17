import React, { useState } from 'react';
import apiClient from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { UserCircle, Mail, Edit3, Check, X, AlertCircle, CheckCircle2, KeyRound } from 'lucide-react';

// Same rule as the backend: any deliverable-looking address, local@domain.tld
const EMAIL_PATTERN = /^[^@\s]+@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/;
const isValidEmail = (email: string) => EMAIL_PATTERN.test(email.trim().toLowerCase());

export const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [pwdSaved, setPwdSaved] = useState<string | null>(null);

  if (!user) return null;

  const handlePasswordSave = async () => {
    setPwdSaved(null);
    if (!currentPwd || !newPwd || !confirmPwd) {
      setPwdError('Fill in all three password fields.');
      return;
    }
    if (newPwd !== confirmPwd) {
      setPwdError('The new password and its confirmation do not match.');
      return;
    }
    if (newPwd.length < 8 || !/[A-Za-z]/.test(newPwd) || !/\d/.test(newPwd)) {
      setPwdError('Use at least 8 characters with both letters and numbers.');
      return;
    }
    setPwdSaving(true);
    setPwdError(null);
    try {
      const res = await apiClient.put('/auth/me/password', {
        current_password: currentPwd, new_password: newPwd, confirm_password: confirmPwd,
      });
      updateUser({ ...user, ...res.data });
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
      setPwdSaved('Your password has been changed. Use it the next time you sign in.');
    } catch (err: any) {
      setPwdError(err.response?.data?.detail || 'Failed to change your password. Please try again.');
    } finally {
      setPwdSaving(false);
    }
  };

  const pwdInput = 'w-full text-sm bg-[#F8FAFC] text-[#0F172A] placeholder-[#94A3B8] border border-[#E2E8F0] rounded-lg pl-9 pr-3 py-2 focus:border-[#FF5500] outline-none';

  const startEdit = () => {
    setEmail(user.email);
    setErrorMsg(null);
    setSavedMsg(null);
    setEditing(true);
  };

  const handleSave = async () => {
    const value = email.trim().toLowerCase();
    if (!isValidEmail(value)) {
      setErrorMsg('Enter a valid email address (example: yourname@gmail.com).');
      return;
    }
    setSaving(true);
    setErrorMsg(null);
    try {
      const res = await apiClient.put('/auth/me/email', { email: value });
      updateUser({ ...user, ...res.data });
      setEditing(false);
      setSavedMsg('Your email address has been saved.');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to save your email. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const fields = [
    { label: 'Name', value: user.full_name },
    { label: 'Register Number', value: user.username },
  ];

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <div className="flex items-center space-x-3">
        <div className="w-11 h-11 bg-[#FFF5F0] text-[#FF5500] rounded-xl flex items-center justify-center border border-[#FF5500]/25">
          <UserCircle className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-[#0F172A]">My Profile</h2>
          <p className="text-xs text-[#64748B]">Your student account details</p>
        </div>
      </div>

      <div className="bg-[#FFFFFF] rounded-2xl border border-[#E2E8F0] divide-y divide-[#E2E8F0] shadow-sm">
        {fields.map((f) => (
          <div key={f.label} className="px-5 py-4">
            <div className="text-[10px] uppercase font-bold tracking-wider text-[#64748B]">{f.label}</div>
            <div className="text-sm font-semibold text-[#0F172A] mt-1 break-words">{f.value}</div>
          </div>
        ))}

        <div className="px-5 py-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="text-[10px] uppercase font-bold tracking-wider text-[#64748B]">Email</div>
            {!editing && (
              <button
                onClick={startEdit}
                className="text-xs text-[#FF5500] hover:text-[#E64D00] bg-[#FFF5F0] border border-[#FF5500]/25 px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            )}
          </div>

          {!editing ? (
            <div className="space-y-1.5">
              <div className="text-sm font-semibold text-[#0F172A] break-all">{user.email}</div>
              {user.email_confirmed === false && (
                <div className="text-[11px] text-[#F59E0B] flex items-center space-x-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Please confirm this is an address you check. Click Edit to change it, or Edit and Save to confirm it as it is.</span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative">
                <Mail className="w-4 h-4 text-[#94A3B8] absolute left-3 top-2.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
                  placeholder="yourname@gmail.com"
                  autoFocus
                  className="w-full text-sm bg-[#F8FAFC] text-[#0F172A] placeholder-[#94A3B8] border border-[#E2E8F0] rounded-lg pl-9 pr-3 py-2 focus:border-[#FF5500] outline-none"
                />
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => { setEditing(false); setErrorMsg(null); }}
                  disabled={saving}
                  className="text-xs text-[#64748B] hover:text-[#0F172A] bg-[#F1F5F9] border border-[#E2E8F0] px-4 py-2 rounded-lg flex items-center space-x-1.5 transition cursor-pointer disabled:opacity-50"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="text-xs bg-[#FF5500] hover:bg-[#E64D00] text-white font-bold px-4 py-2 rounded-lg flex items-center space-x-1.5 transition cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{saving ? 'Saving...' : 'Save'}</span>
                </button>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="text-xs text-[#EF4444] flex items-center space-x-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
          {savedMsg && !editing && (
            <div className="text-xs text-[#22C55E] flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>{savedMsg}</span>
            </div>
          )}
        </div>
      </div>

      <div className="bg-[#FFFFFF] rounded-2xl border border-[#E2E8F0] px-5 py-4 space-y-3 shadow-sm">
        <div className="text-[10px] uppercase font-bold tracking-wider text-[#64748B]">Change Password</div>
        {user.password_changed === false && (
          <div className="text-[11px] text-[#F59E0B] flex items-center space-x-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>You are still using the common starting password. Set your own so only you can sign in.</span>
          </div>
        )}
        {[
          { label: 'Current password', value: currentPwd, set: setCurrentPwd, auto: 'current-password' },
          { label: 'New password', value: newPwd, set: setNewPwd, auto: 'new-password' },
          { label: 'Confirm new password', value: confirmPwd, set: setConfirmPwd, auto: 'new-password' },
        ].map((f) => (
          <div key={f.label} className="relative">
            <KeyRound className="w-4 h-4 text-[#94A3B8] absolute left-3 top-2.5" />
            <input
              type="password"
              value={f.value}
              onChange={(e) => { f.set(e.target.value); setPwdError(null); }}
              onKeyDown={(e) => { if (e.key === 'Enter') handlePasswordSave(); }}
              placeholder={f.label}
              aria-label={f.label}
              autoComplete={f.auto}
              className={pwdInput}
            />
          </div>
        ))}
        <div className="text-[11px] text-[#64748B]">At least 8 characters, with letters and numbers.</div>
        <div className="flex justify-end">
          <button
            onClick={handlePasswordSave}
            disabled={pwdSaving}
            className="text-xs bg-[#FF5500] hover:bg-[#E64D00] text-white font-bold px-4 py-2 rounded-lg flex items-center space-x-1.5 transition cursor-pointer disabled:opacity-50"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{pwdSaving ? 'Saving...' : 'Change password'}</span>
          </button>
        </div>
        {pwdError && (
          <div className="text-xs text-[#EF4444] flex items-center space-x-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{pwdError}</span>
          </div>
        )}
        {pwdSaved && (
          <div className="text-xs text-[#22C55E] flex items-center space-x-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>{pwdSaved}</span>
          </div>
        )}
      </div>
    </div>
  );
};
