import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  BarChart3,
  Building2,
  CheckSquare,
  ClipboardList,
  LayoutDashboard,
  Search,
  Shield,
  X,
  Database,
  FileCheck2,
} from 'lucide-react';
import { cn } from '../../lib/utils';

const navGroups = [
  {
    label: 'Workspace',
    items: [
      { name: 'Overview', path: '/', icon: LayoutDashboard },
      { name: 'Claims Assurance', path: '/claims', icon: CheckSquare },
      { name: 'Findings Hub', path: '/findings', icon: Search },
      { name: 'Review Queue', path: '/review', icon: ClipboardList },
      { name: 'Entity Registry', path: '/entities', icon: Building2 },
    ],
  },
  {
    label: 'Validation & Proof',
    items: [
      { name: 'Reports & Efficacy', path: '/reports', icon: BarChart3 },
      { name: 'Benchmark Evaluation', path: '/benchmark', icon: FileCheck2 },
    ],
  },
  {
    label: 'Data Pipeline',
    items: [{ name: 'Data Ingestion', path: '/integrations', icon: Database }],
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      <button
        type="button"
        aria-label="Close navigation"
        aria-hidden={!isOpen}
        disabled={!isOpen}
        onClick={onClose}
        className={cn(
          'fixed inset-0 z-30 bg-slate-950/60 backdrop-blur-sm transition-opacity lg:hidden',
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />

      <aside
        id="primary-navigation"
        aria-label="Primary navigation"
        aria-hidden={!isOpen}
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-72 shrink-0 flex-col border-r border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-[#0c1322] shadow-xl transition-all duration-200 ease-out lg:static lg:w-64 lg:shadow-none',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:hidden',
        )}
      >
        {/* Brand Header */}
        <div className="flex h-[70px] items-center gap-3 border-b border-slate-200/90 dark:border-slate-800/90 px-5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-sky-300/80 dark:border-sky-500/30 bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 shadow-sm">
            <Shield className="size-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-base font-black tracking-tight text-slate-900 dark:text-white">
              NEXUS
            </p>
            <p className="truncate text-xs font-medium text-slate-500 dark:text-slate-400">
              Supervisory Analytics
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white lg:hidden"
            aria-label="Close navigation"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-3.5 py-5 space-y-6">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="mb-2 px-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {group.label}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    end={item.path === '/'}
                    onClick={() => {
                      if (window.matchMedia('(max-width: 1023px)').matches) onClose();
                    }}
                    className={({ isActive }) =>
                      cn(
                        'group flex min-h-10 items-center gap-3 rounded-lg border px-3 text-xs font-semibold transition-all',
                        isActive
                          ? 'border-sky-300 dark:border-sky-500/40 bg-sky-50 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300 shadow-xs'
                          : 'border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon
                          className={cn(
                            'size-4 shrink-0 transition-colors',
                            isActive ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300',
                          )}
                          aria-hidden="true"
                        />
                        <span>{item.name}</span>
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-slate-200/90 dark:border-slate-800/90 px-5 py-3.5 bg-slate-50/50 dark:bg-[#090f1a]/50">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300">SAT-SA v2.4</span>
            <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">ONLINE</span>
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">NCIIPC-NTRO Architecture</p>
        </div>
      </aside>
    </>
  );
}
