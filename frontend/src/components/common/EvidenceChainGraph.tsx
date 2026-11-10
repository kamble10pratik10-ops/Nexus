import React from 'react';
import {
  AlertTriangle,
  FileSearch,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  ArrowRight,
} from 'lucide-react';

interface EvidenceChainGraphProps {
  findingType?: string;
  expectedWorkflow?: string[];
  observedWorkflow?: string[];
  missingEvidence?: string[];
  evidence?: Record<string, any>;
}

export function EvidenceChainGraph({
  findingType = 'EXECUTION_GAP',
  expectedWorkflow = ['ALERT', 'INVESTIGATION', 'ESCALATION', 'RESPONSE'],
  observedWorkflow = ['ALERT', 'RAPID_CLOSE'],
  missingEvidence = ['INVESTIGATION', 'ESCALATION'],
  evidence = {},
}: EvidenceChainGraphProps) {
  const missingLower = (missingEvidence || []).map((m) => m.toLowerCase());
  const observedLower = (observedWorkflow || []).map((o) => o.toLowerCase());

  const stages = [
    {
      key: 'ALERT',
      label: 'Telemetry Alert',
      icon: AlertTriangle,
      description: evidence?.sample_alerts?.[0] || evidence?.alert_count ? `${evidence.alert_count || 1} Alerts Registered` : 'SIEM Detection Fired',
      isMissing: missingLower.some((m) => m.includes('alert') || m.includes('telemetry')),
    },
    {
      key: 'INVESTIGATION',
      label: 'Triage Case',
      icon: FileSearch,
      description: evidence?.sample_cases?.[0] ? `Case ${evidence.sample_cases[0]}` : evidence?.shallow_case_count ? 'Shallow Notes (<8 words)' : 'Case Notes Logged',
      isMissing: missingLower.some((m) => m.includes('investigation') || m.includes('case') || m.includes('triage')),
    },
    {
      key: 'ESCALATION',
      label: 'Tier-2 Escalation',
      icon: ArrowUpRight,
      description: evidence?.unescalated_critical_count ? '0 Escalations Recorded' : evidence?.escalation_rate_pct !== undefined ? `${evidence.escalation_rate_pct}% Escalation Rate` : 'Senior Dispatch Log',
      isMissing: missingLower.some((m) => m.includes('escalation')),
    },
    {
      key: 'RESPONSE',
      label: 'Active Containment',
      icon: ShieldCheck,
      description: evidence?.unresponded_count ? `${evidence.unresponded_count} Unresponded` : 'Host Isolation / Block',
      isMissing: missingLower.some((m) => m.includes('response') || m.includes('containment') || m.includes('mitigation')),
    },
  ];

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0a101b] p-4.5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Chain-of-Custody Integrity Pipeline
          </span>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Supervisory lifecycle validation across telemetry artifacts
          </p>
        </div>
        <span
          className={`rounded-full border px-2.5 py-0.5 text-xs font-mono font-semibold ${
            missingEvidence.length > 0
              ? 'border-rose-200 dark:border-rose-500/40 bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300'
              : 'border-emerald-200 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300'
          }`}
        >
          {missingEvidence.length > 0 ? `${missingEvidence.length} Broken Link(s)` : 'Full Chain Verified'}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 relative">
        {stages.map((stage, idx) => {
          const Icon = stage.icon;
          const isBroken = stage.isMissing;

          return (
            <div
              key={stage.key}
              className={`relative flex flex-col justify-between rounded-xl border p-3.5 transition-all ${
                isBroken
                  ? 'border-rose-300 dark:border-rose-500/50 bg-rose-50 dark:bg-rose-950/20 shadow-xs'
                  : 'border-emerald-300 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/15'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Step {idx + 1}
                  </span>
                  {isBroken ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-rose-700 dark:text-rose-400">
                      <XCircle className="h-3.5 w-3.5" /> Deficient
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Observed
                    </span>
                  )}
                </div>

                <div className="mt-2.5 flex items-center gap-2.5">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
                      isBroken
                        ? 'border-rose-300 dark:border-rose-500/40 bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300'
                        : 'border-emerald-300 dark:border-emerald-500/40 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      {stage.label}
                    </h5>
                    <p className="font-mono text-[11px] text-slate-600 dark:text-slate-400 truncate max-w-[150px]">
                      {stage.description}
                    </p>
                  </div>
                </div>
              </div>

              {isBroken && (
                <div className="mt-2.5 rounded border border-rose-200 dark:border-rose-500/30 bg-rose-100/60 dark:bg-rose-500/10 px-2 py-1 text-[10px] font-mono text-rose-800 dark:text-rose-300">
                  Expected evidence not observed
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

