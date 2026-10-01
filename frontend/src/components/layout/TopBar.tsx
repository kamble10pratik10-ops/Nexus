import React, { useEffect, useState } from 'react';
import { ChevronRight, Menu, PanelLeftClose, Sun, Moon } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const routeLabels: Record<string, string> = {
  '/': 'Overview',
  '/claims': 'Claims Assurance',
  '/findings': 'Findings',
  '/review': 'Review Queue',
  '/entities': 'Entities',
  '/reports': 'Reports & Validation',
};

interface TopBarProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function TopBar({ sidebarOpen, onToggleSidebar }: TopBarProps) {
  const { pathname } = useLocation();
  const sectionName = routeLabels[pathname] ?? 'Workspace';

  const [isLight, setIsLight] = useState(() => {
    return document.documentElement.classList.contains('theme-light') || 
           localStorage.getItem('theme') === 'light';
  });

  useEffect(() => {
    if (isLight) {
      document.documentElement.classList.add('theme-light');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.remove('theme-light');
      localStorage.setItem('theme', 'dark');
    }
  }, [isLight]);

  const toggleTheme = () => setIsLight((prev) => !prev);

  return (
    <header className="z-20 flex h-[72px] shrink-0 items-center justify-between gap-4 border-b border-slate-800 bg-background/95 px-4 backdrop-blur-md sm:px-6 xl:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-controls="primary-navigation"
          aria-expanded={sidebarOpen}
          aria-label={sidebarOpen ? 'Collapse navigation' : 'Open navigation'}
          className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-slate-700/80 text-slate-400 transition-colors hover:border-slate-600 hover:bg-slate-800 hover:text-slate-100"
        >
          {sidebarOpen ? (
            <PanelLeftClose className="hidden size-[18px] lg:block" aria-hidden="true" />
          ) : null}
          <Menu className={sidebarOpen ? 'size-[18px] lg:hidden' : 'size-[18px]'} aria-hidden="true" />
        </button>

        <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2 text-sm">
          <span className="hidden text-slate-500 sm:inline">NEXUS</span>
          <ChevronRight className="hidden size-4 text-slate-700 sm:block" aria-hidden="true" />
          <span className="truncate font-medium text-slate-200" aria-current="page">
            {sectionName}
          </span>
        </nav>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
          className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-slate-700/80 text-slate-400 transition-colors hover:border-slate-600 hover:bg-slate-800 hover:text-slate-100"
        >
          {isLight ? <Moon className="size-[18px]" /> : <Sun className="size-[18px]" />}
        </button>
        <div className="hidden items-center gap-2 rounded-full border border-slate-800 bg-card/70 px-3 py-1.5 text-xs font-medium text-slate-400 sm:flex">
          <span className="size-1.5 rounded-full bg-blue-400" aria-hidden="true" />
          Analytics workspace
        </div>
      </div>
    </header>
  );
}
