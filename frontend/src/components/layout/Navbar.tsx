import React from 'react';
import { Shield, Radio, UserCheck, LogOut, CheckCircle2 } from 'lucide-react';
import { User } from '../../types';

interface NavbarProps {
  currentUser: User | null;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentUser, onLogout }) => {
  return (
    <header className="bg-[#0B132B] border-b border-[#1C2541] px-6 py-3 flex items-center justify-between text-white select-none">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center font-bold text-white shadow-md">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-wider text-white">SAT-SA</span>
              <span className="text-xs bg-blue-900/60 border border-blue-600/40 text-blue-300 px-2 py-0.5 rounded font-mono">
                v2.0 MVP
              </span>
              <span className="text-xs bg-emerald-950/60 border border-emerald-600/40 text-emerald-300 px-2 py-0.5 rounded font-mono flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> AIR-GAPPED // OFFLINE
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              Supervisory Analytics Tool for SOC Assessment &bull; NTRO / NCIIPC Cybersecurity Platform
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-2 text-xs text-slate-300 bg-[#1C2541]/70 px-3 py-1.5 rounded border border-[#2D3A5F]">
          <UserCheck className="w-4 h-4 text-cyan-400" />
          <span>
            Logged in as: <strong className="text-white">{currentUser?.username || 'Supervisor'}</strong> ({currentUser?.role || 'Supervisor'})
          </span>
        </div>

        <button
          onClick={onLogout}
          className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-red-400 transition-colors px-2 py-1 rounded hover:bg-red-950/30"
          title="Sign out of SAT-SA platform"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};
