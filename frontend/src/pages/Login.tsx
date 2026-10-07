import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { KeyRound, AlertCircle, Building2 } from 'lucide-react';

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
    <div className="min-h-screen bg-[#11110F] flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden">
      {/* Background Institutional Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#2A2824_1px,transparent_1px)] [background-size:24px_24px] opacity-40"></div>

      <div className="w-full max-w-md bg-[#1C1B18] border border-[#2A2824] rounded-2xl shadow-2xl overflow-hidden z-10">
        {/* Institutional Branding Header */}
        <div className="bg-[#1C1B18] p-5 sm:p-8 border-b border-[#2A2824] text-center relative">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[#C9A227]/15 border border-[#C9A227]/30 rounded-2xl mx-auto flex items-center justify-center text-[#C9A227] shadow-lg mb-3 sm:mb-4">
            <Building2 className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#F8F5ED] tracking-tight">MockRun</span>
            <span className="text-[10px] font-semibold text-[#E3C766] uppercase bg-[#C9A227]/15 border border-[#C9A227]/30 px-2 py-0.5 rounded-full">
              by OpenLectern
            </span>
          </div>
          <h2 className="text-sm sm:text-base font-semibold text-[#D8D2C5] tracking-tight">Nehru Arts and Science College</h2>
          <p className="text-[11px] sm:text-xs font-semibold text-[#9E988A] mt-0.5 uppercase tracking-wider">(Autonomous) — Coimbatore</p>
          <div className="mt-3 inline-block bg-[#141311] text-[#E3C766] text-[11px] sm:text-xs px-3 py-1 rounded-full border border-[#2A2824] font-medium">
            Centralized Assessment & OBE Platform
          </div>
        </div>

        {/* Login Form Body */}
        <div className="p-5 sm:p-8">
          {error && (
            <div className="mb-5 bg-[#141311] border border-[#EF4444]/40 text-[#EF4444] p-3 rounded-lg text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#EF4444]" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <div>
              <label className="block text-xs font-semibold text-[#D8D2C5] mb-1.5">
                Username / Register No / Employee ID
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. 23UBCA001 or admin"
                  className="w-full bg-[#141311] border border-[#2A2824] text-[#F8F5ED] rounded-lg px-3.5 py-2.5 sm:py-2.5 text-sm sm:text-xs focus:outline-none focus:border-[#C9A227] focus:ring-1 focus:ring-[#C9A227]/40 transition placeholder:text-[#9E988A]/60"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-[#D8D2C5]">Password</label>
                <a
                  href="#forgot"
                  onClick={(e) => { e.preventDefault(); alert('Please contact MockRun / NASC IT Helpdesk to reset password.'); }}
                  className="text-[11px] text-[#E3C766] hover:underline"
                >
                  Forgot password?
                </a>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#141311] border border-[#2A2824] text-[#F8F5ED] rounded-lg px-3.5 py-2.5 sm:py-2.5 text-sm sm:text-xs focus:outline-none focus:border-[#C9A227] focus:ring-1 focus:ring-[#C9A227]/40 transition placeholder:text-[#9E988A]/60"
                required
              />
            </div>

            <div className="flex items-center justify-between text-xs text-[#9E988A] pt-1">
              <label className="flex items-center space-x-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-[#2A2824] bg-[#141311] text-[#C9A227] accent-[#C9A227] w-4 h-4"
                />
                <span>Remember Me</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#C9A227] hover:bg-[#B89220] text-[#11110F] font-bold text-sm sm:text-xs py-3 rounded-lg shadow-lg hover:shadow-[#C9A227]/20 transition duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 touch-manipulation cursor-pointer"
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

      <footer className="mt-6 text-center text-xs text-[#9E988A] z-10 px-4 space-y-1">
        <div>
          &copy; 2026 <strong className="text-[#D8D2C5]">MockRun</strong> by <span className="text-[#E3C766]">OpenLectern</span>.
        </div>
        <div className="text-[11px] text-[#7A756B]">
          Built for Nehru Arts and Science College (Autonomous). All rights reserved.
        </div>
      </footer>
    </div>
  );
};
