import React from 'react';
<<<<<<< HEAD
import { NavLink } from 'react-router-dom';
import { 
  Shield, 
  LayoutDashboard, 
  CheckSquare, 
  Search, 
  ClipboardList, 
  Building2, 
  BarChart3 
} from 'lucide-react';
import { cn } from '../../lib/utils';

const navItems = [
  { name: 'Overview', path: '/', icon: LayoutDashboard },
  { name: 'Claims Assurance', path: '/claims', icon: CheckSquare },
  { name: 'Findings', path: '/findings', icon: Search },
  { name: 'Review Queue', path: '/review', icon: ClipboardList },
  { name: 'Entities', path: '/entities', icon: Building2 },
  { name: 'Reports & Validation', path: '/reports', icon: BarChart3 },
];

export function Sidebar({ isOpen }: { isOpen: boolean }) {
  return (
    <div className={cn(
      "bg-slate-900/80 backdrop-blur-md border-r border-slate-800 flex flex-col h-full shrink-0 transition-all duration-300 overflow-hidden shadow-[4px_0_24px_-4px_rgba(0,0,0,0.3)]",
      isOpen ? "w-64 opacity-100" : "w-0 opacity-0 border-r-0"
    )}>
      <div className="p-6 flex items-center space-x-3 border-b border-slate-800 w-64">
        <Shield className="text-primary w-8 h-8 shrink-0" />
        <div>
          <h1 className="text-xl font-bold tracking-wider text-white">NEXUS</h1>
          <p className="text-xs text-slate-500 uppercase tracking-widest whitespace-nowrap">Command Centre</p>
        </div>
      </div>
      
      <nav className="flex-1 px-4 py-6 space-y-2 w-64">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive 
                  ? "bg-primary/10 text-primary" 
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              )
            }
          >
            <item.icon className="w-5 h-5 shrink-0" />
            <span className="whitespace-nowrap">{item.name}</span>
          </NavLink>
        ))}
      </nav>
      
      <div className="p-4 border-t border-slate-800 w-64">
        <div className="text-xs text-slate-500 text-center whitespace-nowrap">
          SAT-SA Supervisory Tool<br/>
          v2.0.0
        </div>
      </div>
    </div>
  );
}
=======
import {
  LayoutDashboard,
  UploadCloud,
  AlertOctagon,
  ClipboardList,
  Building2,
  Settings as SettingsIcon,
  Shield
} from 'lucide-react';

export type ActivePage = 'dashboard' | 'ingestion' | 'findings' | 'review_queue' | 'entities' | 'settings';

interface SidebarProps {
  activePage: ActivePage;
  onNavigate: (page: ActivePage) => void;
  p1Count?: number;
  unreviewedCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  onNavigate,
  p1Count = 0,
  unreviewedCount = 0
}) => {
  const navItems = [
    {
      id: 'dashboard' as ActivePage,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'ingestion' as ActivePage,
      label: 'Data Ingestion',
      icon: UploadCloud,
      badge: null
    },
    {
      id: 'findings' as ActivePage,
      label: 'Findings',
      icon: AlertOctagon,
      badge: p1Count > 0 ? `${p1Count} P1` : null,
      badgeColor: 'bg-red-500/20 text-red-400 border border-red-500/30'
    },
    {
      id: 'review_queue' as ActivePage,
      label: 'Review Queue',
      icon: ClipboardList,
      badge: unreviewedCount > 0 ? `${unreviewedCount}` : null,
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
    },
    {
      id: 'entities' as ActivePage,
      label: 'Entities',
      icon: Building2,
      badge: null
    },
    {
      id: 'settings' as ActivePage,
      label: 'Settings',
      icon: SettingsIcon,
      badge: null
    }
  ];

  return (
    <aside className="w-64 bg-[#0B132B] border-r border-[#1C2541] flex flex-col justify-between select-none">
      <div>
        {/* Brand Header */}
        <div className="p-4 border-b border-[#1C2541] flex items-center space-x-3">
          <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-bold text-white text-base tracking-wider">SAT-SA</div>
            <div className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">SOC Assessment</div>
          </div>
        </div>

        {/* Minimal Navigation List */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600/20 text-cyan-400 border border-blue-500/40'
                    : 'text-slate-300 hover:bg-[#1C2541]/70 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info Box */}
      <div className="p-4 border-t border-[#1C2541] text-xs text-slate-400">
        <div className="font-semibold text-slate-300 mb-1">NTRO / NCIIPC</div>
        <div className="text-[11px] leading-tight">National Critical Information Infrastructure Protection Centre</div>
        <div className="mt-2 text-[10px] font-mono text-cyan-400 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          Air-Gapped Assessment Active
        </div>
      </div>
    </aside>
  );
};
>>>>>>> 9681317deb1662e66a1a0b724f238e91d2a2cc62
