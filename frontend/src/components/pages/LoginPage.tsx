import React, { useState } from 'react';
import { Shield, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';
import { SATSAApi } from '../../services/api';
import { User } from '../../types';

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('supervisor');
  const [password, setPassword] = useState('Supervisor@2026');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await SATSAApi.login(username, password);
      onLoginSuccess(user);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Authentication failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (roleUser: string, rolePass: string) => {
    setUsername(roleUser);
    setPassword(rolePass);
  };

  return (
    <div className="min-h-screen bg-[#070B14] flex flex-col justify-center items-center p-4">
      {/* Platform Branding Card */}
      <div className="w-full max-w-md bg-[#0F172A] border border-[#1E293B] rounded-xl shadow-2xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-tr from-blue-700 to-cyan-500 shadow-lg mb-2">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">SAT-SA</h1>
          <p className="text-xs font-mono uppercase tracking-widest text-cyan-400">
            Supervisory Analytics Tool for SOC Assessment
          </p>
          <p className="text-xs text-slate-400">
            National Critical Information Infrastructure Protection Centre (NTRO / NCIIPC)
          </p>
        </div>

        {error && (
          <div className="bg-red-950/60 border border-red-500/40 text-red-300 p-3 rounded-lg text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1.5 uppercase">
              Supervisory Identity (Username)
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full bg-[#0B132B] border border-[#2D3A5F] rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400 font-mono transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1.5 uppercase">
              Access Credentials (Password)
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-[#0B132B] border border-[#2D3A5F] rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400 font-mono transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm rounded-lg transition-colors shadow-lg disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            <KeyRound className="w-4 h-4" />
            <span>{loading ? 'Authenticating...' : 'Sign In to Supervisory Console'}</span>
          </button>
        </form>

        {/* Quick Demo Logins for Hackathon Evaluators */}
        <div className="pt-4 border-t border-[#1E293B]">
          <div className="text-[11px] font-mono text-slate-400 mb-2 uppercase tracking-wider text-center">
            Demo Evaluation Roles (Click to autofill)
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleQuickLogin('supervisor', 'Supervisor@2026')}
              className="px-2 py-1.5 bg-[#1C2541] hover:bg-blue-900/40 border border-[#2D3A5F] text-slate-200 rounded text-center transition-colors font-mono"
            >
              Supervisor
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('analyst', 'Analyst@2026')}
              className="px-2 py-1.5 bg-[#1C2541] hover:bg-blue-900/40 border border-[#2D3A5F] text-slate-200 rounded text-center transition-colors font-mono"
            >
              Analyst
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('admin', 'AdminPassword@2026')}
              className="px-2 py-1.5 bg-[#1C2541] hover:bg-blue-900/40 border border-[#2D3A5F] text-slate-200 rounded text-center transition-colors font-mono"
            >
              Admin
            </button>
          </div>
        </div>

        <div className="text-center text-[10px] text-slate-500 font-mono flex items-center justify-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          Air-Gapped Operation &bull; No External Telemetry
        </div>
      </div>
    </div>
  );
};
