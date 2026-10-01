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
} from 'lucide-react';
import { cn } from '../../lib/utils';

const navGroups = [
  {
    label: 'Workspace',
    items: [
      { name: 'Overview', path: '/', icon: LayoutDashboard },
      { name: 'Claims Assurance', path: '/claims', icon: CheckSquare },
      { name: 'Findings', path: '/findings', icon: Search },
      { name: 'Review Queue', path: '/review', icon: ClipboardList },
      { name: 'Entities', path: '/entities', icon: Building2 },
    ],
  },
  {
    label: 'Outputs',
    items: [{ name: 'Reports & Validation', path: '/reports', icon: BarChart3 }],
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
          'fixed inset-0 z-30 bg-slate-950/70 backdrop-blur-sm transition-opacity lg:hidden',
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />

      <aside
        id="primary-navigation"
        aria-label="Primary navigation"
        aria-hidden={!isOpen}
        inert={!isOpen}
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-72 shrink-0 flex-col border-r border-slate-800 bg-[#0e1727] shadow-2xl transition-transform duration-200 ease-out lg:static lg:w-64 lg:shadow-none',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:hidden',
        )}
      >
        <div className="flex h-[72px] items-center gap-3 border-b border-slate-800 px-5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-blue-400/20 bg-blue-500/10 text-blue-400">
            <Shield className="size-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-semibold tracking-[0.14em] text-slate-50">NEXUS</p>
            <p className="mt-0.5 truncate text-xs text-slate-500">Supervisory analytics</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100 lg:hidden"
            aria-label="Close navigation"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-5">
          {navGroups.map((group, groupIndex) => (
            <div key={group.label} className={cn(groupIndex > 0 && 'mt-7')}>
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600">
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
                        'group flex min-h-11 items-center gap-3 rounded-lg border px-3 text-sm font-medium transition-colors',
                        isActive
                          ? 'border-blue-400/15 bg-blue-500/10 text-blue-300'
                          : 'border-transparent text-slate-400 hover:bg-slate-800/70 hover:text-slate-100',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon
                          className={cn(
                            'size-[18px] shrink-0 transition-colors',
                            isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300',
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

        <div className="border-t border-slate-800 px-5 py-4">
          <p className="text-xs font-medium text-slate-400">SAT-SA Supervisory Tool</p>
          <p className="mt-1 text-[11px] text-slate-600">Version 2.0.0</p>
        </div>
      </aside>
    </>
  );
}
