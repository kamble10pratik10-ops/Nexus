import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Building2,
  AlertTriangle,
  FileText,
  Shield,
  CheckSquare,
  BarChart3,
  Database,
  ArrowRight,
  X,
} from "lucide-react";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { name: "Overview Dashboard", path: "/", icon: Shield, category: "Navigation" },
  { name: "Claims Assurance Matrix", path: "/claims", icon: CheckSquare, category: "Navigation" },
  { name: "Findings Register", path: "/findings", icon: Search, category: "Navigation" },
  { name: "Priority Review Queue", path: "/review", icon: AlertTriangle, category: "Navigation" },
  { name: "Entity Priority Ranking", path: "/entities", icon: Building2, category: "Navigation" },
  { name: "Reports & Validation", path: "/reports", icon: BarChart3, category: "Navigation" },
  { name: "Benchmark Evaluation", path: "/benchmark", icon: FileText, category: "Navigation" },
  { name: "Data Ingestion & SIEM Sync", path: "/integrations", icon: Database, category: "Navigation" },
];

const sampleEntities = [
  { id: "CSE-01", name: "Northern Power Grid SCADA", sector: "Energy", status: "CRITICAL" },
  { id: "CSE-02", name: "Reserve Bank Clearing Gateway", sector: "Core Banking", status: "CRITICAL" },
  { id: "CSE-03", name: "National Telecom Backbone", sector: "Telecom", status: "HIGH" },
  { id: "CSE-04", name: "Defence Strategic Comms Hub", sector: "Defence", status: "CRITICAL" },
  { id: "CSE-05", name: "Petroleum Pipeline SCADA", sector: "Energy", status: "HIGH" },
];

const findingTypes = [
  { id: "EXECUTION_GAP", name: "Execution Gaps (Rapid Closures / Unescalated TP)", category: "Engines" },
  { id: "NLP_TEMPLATED", name: "Templated Investigations (Boilerplate Copy-Paste)", category: "Engines" },
  { id: "NEGATIVE_SPACE", name: "Missing Evidence (Crown Jewels Telemetry Vacuum)", category: "Engines" },
  { id: "EVIDENCE_CHAIN", name: "Broken Evidence Chains (Dropped Case Linkages)", category: "Engines" },
  { id: "METRIC_INTEGRITY", name: "Metric Integrity (SLA Clock Tampering)", category: "Engines" },
  { id: "EVIDENCE_FORENSICS", name: "Evidence Forensics (Unverified Containment)", category: "Engines" },
  { id: "PEER_DEVIATION", name: "Peer Benchmarking (Sector Statistical Deviations)", category: "Engines" },
  { id: "REMEDIATION_EFFECTIVENESS", name: "Remediation Ineffectiveness (Recurrent Attacks)", category: "Engines" },
];

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onClose();
      } else if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();

  const filteredNav = navItems.filter((i) =>
    i.name.toLowerCase().includes(q)
  );

  const filteredEntities = sampleEntities.filter(
    (e) =>
      e.id.toLowerCase().includes(q) ||
      e.name.toLowerCase().includes(q) ||
      e.sector.toLowerCase().includes(q)
  );

  const filteredEngines = findingTypes.filter(
    (f) =>
      f.id.toLowerCase().includes(q) ||
      f.name.toLowerCase().includes(q)
  );

  const handleSelect = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/75 p-4 pt-20 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-[#0e1726] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 px-4 py-3">
          <Search className="h-5 w-5 text-sky-600 dark:text-sky-400" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search entities, findings, control engines, or views... (Type 'CSE-01', 'NLP', 'Reports')"
            className="w-full bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-4">
          {/* Nav Links */}
          {filteredNav.length > 0 && (
            <div>
              <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Navigation
              </p>
              <div className="space-y-1">
                {filteredNav.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.path}
                      onClick={() => handleSelect(item.path)}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-sky-500/10 hover:text-sky-700 dark:hover:text-sky-300 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                        <span>{item.name}</span>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-400 dark:text-slate-600" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Entities */}
          {filteredEntities.length > 0 && (
            <div>
              <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Critical Sector Entities (CSEs)
              </p>
              <div className="space-y-1">
                {filteredEntities.map((ent) => (
                  <button
                    key={ent.id}
                    onClick={() => handleSelect(`/entities`)}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-sky-500/10 hover:text-sky-700 dark:hover:text-sky-300 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800/60 px-1.5 py-0.5 rounded">
                        {ent.id}
                      </span>
                      <span className="font-medium text-slate-900 dark:text-slate-200">{ent.name}</span>
                      <span className="text-xs text-slate-500">({ent.sector})</span>
                    </div>
                    <span className="text-[11px] text-rose-700 dark:text-rose-400 font-semibold uppercase tracking-wide">
                      {ent.status}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Engines */}
          {filteredEngines.length > 0 && (
            <div>
              <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Detection Engines
              </p>
              <div className="space-y-1">
                {filteredEngines.map((eng) => (
                  <button
                    key={eng.id}
                    onClick={() => handleSelect(`/findings`)}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-sky-500/10 hover:text-sky-700 dark:hover:text-sky-300 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/60 px-1.5 py-0.5 rounded">
                        {eng.id}
                      </span>
                      <span className="text-slate-700 dark:text-slate-300 text-xs">{eng.name}</span>
                    </div>
                    <ArrowRight className="h-3 w-3 text-slate-400 dark:text-slate-600" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0a101b] px-4 py-2.5 text-xs text-slate-500">
          <span>Navigate with <kbd className="rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-700 dark:text-slate-300">↑</kbd> <kbd className="rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-700 dark:text-slate-300">↓</kbd></span>
          <span>Press <kbd className="rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-700 dark:text-slate-300">ESC</kbd> to close</span>
        </div>
      </div>
    </div>
  );
}

