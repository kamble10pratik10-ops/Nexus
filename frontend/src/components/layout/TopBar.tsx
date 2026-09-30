import React from 'react';
import { Database, WifiOff, Calendar, Menu } from 'lucide-react';

export function TopBar({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md flex items-center justify-between px-6 shrink-0 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.3)] z-10">
      <div className="flex items-center space-x-6 text-sm text-slate-400">
        <button 
          onClick={onToggleSidebar}
          className="p-1.5 hover:bg-slate-800/50 rounded-lg text-slate-400 hover:text-white transition-colors border border-transparent hover:border-slate-700"
          title="Toggle Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        <div className="flex items-center space-x-2">
          <BuildingIcon />
          <span className="font-semibold text-white">Entity: FIN-CORP-01 (Demo)</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4" />
          <span>Obs Window: Oct 2023</span>
        </div>
      </div>
      
      <div className="flex items-center space-x-4 text-xs">
        <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800/50 rounded-full border border-slate-700 text-slate-300 backdrop-blur-sm">
          <Database className="w-3.5 h-3.5" />
          <span>Dataset: Q4 Export (Offline)</span>
        </div>
        
        <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-500/10 text-amber-500 rounded-full border border-amber-500/20">
          <WifiOff className="w-3.5 h-3.5" />
          <span>Air-Gapped Mode</span>
        </div>
      </div>
    </header>
  );
}

function BuildingIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" ry="2"/>
      <path d="M9 22v-4h6v4"/>
      <path d="M8 6h.01"/>
      <path d="M16 6h.01"/>
      <path d="M12 6h.01"/>
      <path d="M12 10h.01"/>
      <path d="M12 14h.01"/>
      <path d="M16 10h.01"/>
      <path d="M16 14h.01"/>
      <path d="M8 10h.01"/>
      <path d="M8 14h.01"/>
    </svg>
  );
}
