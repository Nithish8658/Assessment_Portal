import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, UserCheck, KeyRound, AlertCircle, Sparkles, Building2 } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, demoLogin } = useAuth();
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

  const handleDemoClick = async (demoUsername: string) => {
    setLoading(true);
    setError(null);
    try {
      await demoLogin(demoUsername);
    } catch (err: any) {
      setError('Failed to log in with demo account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background Institutional Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40"></div>

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-10">
        {/* Institutional Branding Header */}
        <div className="bg-slate-900 p-8 border-b border-slate-800 text-center relative">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center text-white shadow-lg mb-4">
            <Building2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Nehru Arts and Science College</h2>
          <p className="text-xs font-semibold text-blue-400 mt-1 uppercase tracking-wider">(Autonomous) — Coimbatore</p>
          <div className="mt-3 inline-block bg-slate-800 text-slate-300 text-xs px-3 py-1 rounded-full border border-slate-700 font-medium">
            Centralized Assessment & OBE Portal
          </div>
        </div>

        {/* Login Form Body */}
        <div className="p-8">
          {error && (
            <div className="mb-6 bg-rose-950/60 border border-rose-800/80 text-rose-300 p-3 rounded-lg text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Username / Register Number / Employee ID
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. admin, hod.cs, 23UBCA001"
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">Password</label>
                <a href="#forgot" onClick={(e) => { e.preventDefault(); alert('Please contact NASC IT Helpdesk to reset password.'); }} className="text-[11px] text-blue-400 hover:underline">Forgot password?</a>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                required
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500"
                />
                <span>Remember Me</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-3 rounded-lg shadow-lg hover:shadow-blue-600/30 transition duration-200 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Log In to Portal</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Switcher Section */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <div className="flex items-center space-x-2 mb-3 text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>One-Click Prototype Demo Accounts</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleDemoClick('admin')}
                className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 p-2 rounded-lg text-left transition"
              >
                <div className="font-semibold text-blue-400 text-[11px]">Administrator</div>
                <div className="text-[10px] text-slate-400">admin</div>
              </button>
              <button
                type="button"
                onClick={() => handleDemoClick('hod.cs')}
                className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 p-2 rounded-lg text-left transition"
              >
                <div className="font-semibold text-purple-400 text-[11px]">HoD (CS)</div>
                <div className="text-[10px] text-slate-400">hod.cs</div>
              </button>
              <button
                type="button"
                onClick={() => handleDemoClick('faculty.smith')}
                className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 p-2 rounded-lg text-left transition"
              >
                <div className="font-semibold text-emerald-400 text-[11px]">Faculty Member</div>
                <div className="text-[10px] text-slate-400">faculty.smith</div>
              </button>
              <button
                type="button"
                onClick={() => handleDemoClick('23UBCA001')}
                className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 p-2 rounded-lg text-left transition"
              >
                <div className="font-semibold text-amber-400 text-[11px]">Student</div>
                <div className="text-[10px] text-slate-400">23UBCA001</div>
              </button>
              <button
                type="button"
                onClick={() => handleDemoClick('coord.eval')}
                className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 p-2 rounded-lg text-left transition"
              >
                <div className="font-semibold text-cyan-400 text-[11px]">Coordinator</div>
                <div className="text-[10px] text-slate-400">coord.eval</div>
              </button>
              <button
                type="button"
                onClick={() => handleDemoClick('tutor.cs')}
                className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 p-2 rounded-lg text-left transition"
              >
                <div className="font-semibold text-rose-400 text-[11px]">Class Tutor</div>
                <div className="text-[10px] text-slate-400">tutor.cs</div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <footer className="mt-8 text-center text-xs text-slate-500 z-10">
        &copy; 2026 Nehru Arts and Science College (Autonomous). All rights reserved.
      </footer>
    </div>
  );
};
