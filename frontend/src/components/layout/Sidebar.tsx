import React from 'react';
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
