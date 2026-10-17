import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { KeyRound, AlertCircle, Building2 } from 'lucide-react';
import { notify } from '../components/ui/Dialogs';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please enter both username and password.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await login(username, password);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid login credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8FA] flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden">
      {/* Background Institutional Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#E2E8F0_1px,transparent_1px)] [background-size:24px_24px] opacity-70"></div>

      <div className="w-full max-w-md bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl shadow-xl overflow-hidden z-10">
        {/* Institutional Branding Header */}
        <div className="bg-[#FFFFFF] p-5 sm:p-8 border-b border-[#E2E8F0] text-center relative">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[#FFF5F0] border border-[#FF5500]/25 rounded-2xl mx-auto flex items-center justify-center text-[#FF5500] shadow-sm mb-3 sm:mb-4">
            <Building2 className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">MockRun</span>
            <span className="text-[10px] font-semibold text-[#FF5500] uppercase bg-[#FFF5F0] border border-[#FF5500]/25 px-2 py-0.5 rounded-full">
              by OpenLectern
            </span>
          </div>
          <h2 className="text-sm sm:text-base font-semibold text-[#334155] tracking-tight">Nehru Arts and Science College</h2>
          <p className="text-[11px] sm:text-xs font-semibold text-[#64748B] mt-0.5 uppercase tracking-wider">(Autonomous) — Coimbatore</p>
          <div className="mt-3 inline-block bg-[#F8FAFC] text-[#FF5500] text-[11px] sm:text-xs px-3 py-1 rounded-full border border-[#E2E8F0] font-semibold">
            Centralized Assessment & OBE Platform
          </div>
        </div>

        {/* Login Form Body */}
        <div className="p-5 sm:p-8 bg-[#FFFFFF]">
          {error && (
            <div className="mb-5 bg-[#FEF2F2] border border-[#EF4444]/40 text-[#EF4444] p-3 rounded-lg text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#EF4444]" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <div>
              <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                Username / Register No / Employee ID
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. 23UBCA001 or admin"
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] rounded-lg px-3.5 py-2.5 sm:py-2.5 text-sm sm:text-xs focus:outline-none focus:border-[#FF5500] focus:ring-1 focus:ring-[#FF5500]/30 transition placeholder:text-[#94A3B8]"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-[#475569]">Password</label>
                <a
                  href="#forgot"
                  onClick={(e) => { e.preventDefault(); notify('Please contact MockRun / NASC IT Helpdesk to reset password.'); }}
                  className="text-[11px] text-[#FF5500] hover:underline font-medium"
                >
                  Forgot password?
                </a>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] rounded-lg px-3.5 py-2.5 sm:py-2.5 text-sm sm:text-xs focus:outline-none focus:border-[#FF5500] focus:ring-1 focus:ring-[#FF5500]/30 transition placeholder:text-[#94A3B8]"
                required
              />
            </div>

            <div className="flex items-center justify-between text-xs text-[#64748B] pt-1">
              <label className="flex items-center space-x-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-[#CBD5E1] bg-[#FFFFFF] text-[#FF5500] accent-[#FF5500] w-4 h-4 cursor-pointer"
                />
                <span>Remember Me</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FF5500] hover:bg-[#E64D00] text-white font-bold text-sm sm:text-xs py-3 rounded-lg shadow-md hover:shadow-[#FF5500]/25 transition duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 touch-manipulation cursor-pointer"
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Log In to MockRun</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      <footer className="mt-6 text-center text-xs text-[#64748B] z-10 px-4 space-y-1">
        <div>
          &copy; 2026 <strong className="text-[#0F172A]">MockRun</strong> by <span className="text-[#FF5500]">OpenLectern</span>.
        </div>
        <div className="text-[11px] text-[#94A3B8]">
          Built for Nehru Arts and Science College (Autonomous). All rights reserved.
        </div>
      </footer>
    </div>
  );
};
