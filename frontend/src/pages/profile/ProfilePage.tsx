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

  const pwdInput = 'w-full text-sm bg-[#141311] text-[#F8F5ED] placeholder-[#9E988A]/60 border border-[#2A2824] rounded-lg pl-9 pr-3 py-2 focus:border-[#C9A227] outline-none';

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
        <div className="w-11 h-11 bg-[#24231F] text-[#C9A227] rounded-xl flex items-center justify-center border border-[#2A2824]">
          <UserCircle className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-[#F8F5ED]">My Profile</h2>
          <p className="text-xs text-[#9E988A]">Your student account details</p>
        </div>
      </div>

      <div className="bg-[#1C1B18] rounded-2xl border border-[#2A2824] divide-y divide-[#2A2824]">
        {fields.map((f) => (
          <div key={f.label} className="px-5 py-4">
            <div className="text-[10px] uppercase font-bold tracking-wider text-[#9E988A]">{f.label}</div>
            <div className="text-sm font-semibold text-[#F8F5ED] mt-1 break-words">{f.value}</div>
          </div>
        ))}

        <div className="px-5 py-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="text-[10px] uppercase font-bold tracking-wider text-[#9E988A]">Email</div>
            {!editing && (
              <button
                onClick={startEdit}
                className="text-xs text-[#E3C766] hover:text-[#F8F5ED] bg-[#24231F] border border-[#2A2824] px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            )}
          </div>

          {!editing ? (
            <div className="space-y-1.5">
              <div className="text-sm font-semibold text-[#F8F5ED] break-all">{user.email}</div>
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
                <Mail className="w-4 h-4 text-[#9E988A] absolute left-3 top-2.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
                  placeholder="yourname@gmail.com"
                  autoFocus
                  className="w-full text-sm bg-[#141311] text-[#F8F5ED] placeholder-[#9E988A]/60 border border-[#2A2824] rounded-lg pl-9 pr-3 py-2 focus:border-[#C9A227] outline-none"
                />
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => { setEditing(false); setErrorMsg(null); }}
                  disabled={saving}
                  className="text-xs text-[#D8D2C5] hover:text-[#F8F5ED] bg-[#24231F] border border-[#2A2824] px-4 py-2 rounded-lg flex items-center space-x-1.5 transition cursor-pointer disabled:opacity-50"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="text-xs bg-[#C9A227] hover:bg-[#B89220] text-[#11110F] font-bold px-4 py-2 rounded-lg flex items-center space-x-1.5 transition cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{saving ? 'Saving...' : 'Save'}</span>
                </button>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="text-xs text-[#F87171] flex items-center space-x-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
          {savedMsg && !editing && (
            <div className="text-xs text-[#4ADE80] flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>{savedMsg}</span>
            </div>
          )}
        </div>
      </div>

      <div className="bg-[#1C1B18] rounded-2xl border border-[#2A2824] px-5 py-4 space-y-3">
        <div className="text-[10px] uppercase font-bold tracking-wider text-[#9E988A]">Change Password</div>
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
            <KeyRound className="w-4 h-4 text-[#9E988A] absolute left-3 top-2.5" />
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
        <div className="text-[11px] text-[#9E988A]">At least 8 characters, with letters and numbers.</div>
        <div className="flex justify-end">
          <button
            onClick={handlePasswordSave}
            disabled={pwdSaving}
            className="text-xs bg-[#C9A227] hover:bg-[#B89220] text-[#11110F] font-bold px-4 py-2 rounded-lg flex items-center space-x-1.5 transition cursor-pointer disabled:opacity-50"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{pwdSaving ? 'Saving...' : 'Change password'}</span>
          </button>
        </div>
        {pwdError && (
          <div className="text-xs text-[#F87171] flex items-center space-x-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{pwdError}</span>
          </div>
        )}
        {pwdSaved && (
          <div className="text-xs text-[#4ADE80] flex items-center space-x-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>{pwdSaved}</span>
          </div>
        )}
      </div>
    </div>
  );
};
