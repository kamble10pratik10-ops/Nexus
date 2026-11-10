import React, { useEffect, useState } from 'react';
import { ChevronRight, Menu, PanelLeftClose, Search, Activity, Sun, Moon } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { CommandPalette } from '../common/CommandPalette';

const routeLabels: Record<string, string> = {
  '/': 'Overview',
  '/claims': 'Claims Assurance',
  '/findings': 'Findings Hub',
  '/review': 'Review Queue',
  '/entities': 'Entity Registry',
  '/reports': 'Reports & Validation',
  '/benchmark': 'Benchmark Evaluation',
  '/integrations': 'Data Ingestion',
};

interface TopBarProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function TopBar({ sidebarOpen, onToggleSidebar }: TopBarProps) {
  const { pathname } = useLocation();
  const sectionName = routeLabels[pathname] ?? 'Workspace';
  const [paletteOpen, setPaletteOpen] = useState(false);

  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nexus-theme');
      if (saved) return saved === 'dark';
    }
    return true;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      localStorage.setItem('nexus-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      localStorage.setItem('nexus-theme', 'light');
    }
    window.dispatchEvent(new Event('theme-changed'));
  }, [isDark]);

  return (
    <>
      <header className="z-20 flex h-[70px] shrink-0 items-center justify-between gap-4 border-b border-slate-200/90 dark:border-slate-800/90 bg-white/95 dark:bg-[#0c1322]/95 px-4 backdrop-blur-md sm:px-6 xl:px-8 transition-colors">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-controls="primary-navigation"
            aria-expanded={sidebarOpen}
            aria-label={sidebarOpen ? 'Collapse navigation' : 'Open navigation'}
            className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-400 transition-colors hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
          >
            {sidebarOpen ? (
              <PanelLeftClose className="hidden size-[18px] lg:block" aria-hidden="true" />
            ) : null}
            <Menu className={sidebarOpen ? 'size-[18px] lg:hidden' : 'size-[18px]'} aria-hidden="true" />
          </button>

          <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2 text-sm">
            <span className="hidden font-mono text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 sm:inline">
              SAT-SA NEXUS
            </span>
            <ChevronRight className="hidden size-4 text-slate-300 dark:text-slate-700 sm:block" aria-hidden="true" />
            <span className="truncate font-bold text-slate-900 dark:text-slate-100" aria-current="page">
              {sectionName}
            </span>
          </nav>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Quick Search Palette Trigger */}
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#111827] px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:border-sky-500/60 transition-all shadow-sm"
          >
            <Search className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
            <span className="hidden sm:inline font-medium">Quick search</span>
            <kbd className="hidden rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-500 dark:text-slate-400 sm:inline">
              Ctrl K
            </kbd>
          </button>

          {/* Defense Telemetry Beacon */}
          <div className="hidden items-center gap-2 rounded-full border border-emerald-300/60 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/20 px-3 py-1 text-xs font-mono text-emerald-800 dark:text-emerald-300 md:flex">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600 dark:bg-emerald-500" />
            </span>
            <span className="font-bold tracking-wide">STREAM: AIR-GAPPED // NCIIPC</span>
          </div>

          {/* Theme Switcher Button */}
          <button
            type="button"
            onClick={() => setIsDark((d) => !d)}
            className="flex size-9 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] text-slate-700 dark:text-slate-300 hover:border-sky-500 hover:text-sky-600 dark:hover:text-sky-400 transition-colors shadow-sm"
            title={isDark ? 'Switch to Executive Boardroom (Light Mode)' : 'Switch to Precision Titanium (Dark Mode)'}
          >
            {isDark ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 text-slate-700" />
            )}
          </button>

          <div className="hidden items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#111827] px-2.5 py-1.5 text-xs text-slate-600 dark:text-slate-400 xl:flex">
            <Activity className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
            <span className="font-mono text-slate-900 dark:text-slate-100 font-bold">25</span>
            <span className="text-slate-500">CSEs</span>
          </div>
        </div>
      </header>

      <CommandPalette isOpen={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </>
  );
}
