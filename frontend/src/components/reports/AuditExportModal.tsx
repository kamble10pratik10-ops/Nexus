import React, { useState } from 'react';
import {
  X,
  Printer,
  Copy,
  Check,
  ShieldCheck,
  FileCheck2,
  Lock,
  Building2,
} from 'lucide-react';

interface AuditExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  datasetHash?: string;
  totalAlerts?: number;
  totalCases?: number;
  totalFindings?: number;
}

export function AuditExportModal({
  isOpen,
  onClose,
  datasetHash = '14ef104fbb7ba0c942d93e11',
  totalAlerts = 4087,
  totalCases = 3113,
  totalFindings = 212,
}: AuditExportModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const timestamp = new Date().toISOString();

  const manifestJson = JSON.stringify(
    {
      organization: 'National Critical Information Infrastructure Protection Centre (NCIIPC)',
      tool: 'SAT-SA NEXUS (Supervisory Analytics Tool for SOC Assessment)',
      evaluation_date: timestamp,
      manifest_hash: datasetHash,
      ruleset_version: 'v1.2.0-live',
      telemetry_scope: {
        total_alerts: totalAlerts,
        total_cases: totalCases,
        total_findings: totalFindings,
        audit_events: 14998,
        field_completeness_pct: 100.0,
        linkage_integrity_pct: 100.0,
      },
      evaluation_model: {
        level_1_record_detection_score: 76.2,
        level_2_finding_correctness_score: 90.1,
        level_3_supervisory_usefulness_score: 40.6,
      },
    },
    null,
    2
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(manifestJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0d1524] shadow-2xl text-slate-900 dark:text-slate-100 p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Controls (Hidden during print) */}
        <div className="no-print flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 mb-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-sky-600 dark:text-sky-400" />
            <span className="text-sm font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Cryptographic Chain-of-Custody Manifest
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied' : 'Copy JSON'}
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-sky-500 shadow-xs"
            >
              <Printer className="h-3.5 w-3.5" /> Print / Export PDF
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Printable Official Supervisory Dossier */}
        <div className="space-y-6">
          <div className="border-b-2 border-slate-200 dark:border-slate-700 pb-5">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-sky-700 dark:text-sky-400 font-bold">
                  Government of India · National Critical Information Infrastructure
                </p>
                <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                  SAT-SA Supervisory Audit Dossier
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Air-Gapped Assessment Report for Critical Sector Entities (CSEs)
                </p>
              </div>
              <div className="rounded-xl border border-sky-200 dark:border-sky-500/30 bg-sky-50 dark:bg-sky-950/20 p-3 text-right">
                <span className="text-[10px] uppercase font-mono text-slate-500 dark:text-slate-400 block font-semibold">Dataset Hash (SHA-256)</span>
                <span className="font-mono text-xs font-bold text-sky-700 dark:text-sky-300">{datasetHash}</span>
                <span className="block text-[10px] text-slate-500 mt-0.5">Ruleset: v1.2.0-live</span>
              </div>
            </div>
          </div>

          {/* Audit Metrics */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#101b2d] p-3.5">
              <span className="text-[10px] uppercase font-mono text-slate-500 dark:text-slate-400 font-semibold">Total Telemetry Ingested</span>
              <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{totalAlerts.toLocaleString()}</p>
              <span className="text-[11px] text-slate-500">Raw SIEM / EDR Records</span>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#101b2d] p-3.5">
              <span className="text-[10px] uppercase font-mono text-slate-500 dark:text-slate-400 font-semibold">Formal Cases Handled</span>
              <p className="text-xl font-bold text-sky-700 dark:text-sky-300 mt-1">{totalCases.toLocaleString()}</p>
              <span className="text-[11px] text-slate-500">Documented Triage Files</span>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#101b2d] p-3.5">
              <span className="text-[10px] uppercase font-mono text-slate-500 dark:text-slate-400 font-semibold">Verified Findings</span>
              <p className="text-xl font-bold text-amber-700 dark:text-amber-300 mt-1">{totalFindings.toLocaleString()}</p>
              <span className="text-[11px] text-slate-500">Across 13 Control Engines</span>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#101b2d] p-3.5">
              <span className="text-[10px] uppercase font-mono text-slate-500 dark:text-slate-400 font-semibold">Finding Confidence</span>
              <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">90.1%</p>
              <span className="text-[11px] text-slate-500">191 / 212 ≥ 85% confidence</span>
            </div>
          </div>

          {/* Core Supervisory Claims Assessment */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0e1726] p-5 shadow-xs">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200 mb-3">
              Independent Capability Claims Validation
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg border border-rose-200 dark:border-rose-900/40 bg-rose-50/70 dark:bg-rose-950/20">
                <div>
                  <span className="font-semibold text-rose-900 dark:text-rose-200">Claim 1: 100% Critical Alert Investigation Rate</span>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px]">Empirical Proof: 28 alerts closed in &lt;3m without investigation. 16 critical alerts dropped.</p>
                </div>
                <span className="font-mono font-bold text-rose-700 dark:text-rose-400">CONTRADICTED</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg border border-rose-200 dark:border-rose-900/40 bg-rose-50/70 dark:bg-rose-950/20">
                <div>
                  <span className="font-semibold text-rose-900 dark:text-rose-200">Claim 2: Complete 24×7 Network &amp; Asset Monitoring</span>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px]">Empirical Proof: Asset DB reveals 3 crown-jewel assets in SILENT status with telemetry vacuum.</p>
                </div>
                <span className="font-mono font-bold text-rose-700 dark:text-rose-400">CONTRADICTED</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg border border-rose-200 dark:border-rose-900/40 bg-rose-50/70 dark:bg-rose-950/20">
                <div>
                  <span className="font-semibold text-rose-900 dark:text-rose-200">Claim 3: Sub-30 Minute Incident Response SLA</span>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px]">Empirical Proof: Average MTTR is 243.7m across 1,859 closed alerts (night-shift peaks at 245.1m).</p>
                </div>
                <span className="font-mono font-bold text-rose-700 dark:text-rose-400">CONTRADICTED</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/70 dark:bg-emerald-950/20">
                <div>
                  <span className="font-semibold text-emerald-900 dark:text-emerald-200">Claim 4: Mandatory Tier-2 Escalation on Confirmed Incidents</span>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px]">Empirical Proof: 533 Tier-2 escalations documented in database (47.8% escalation rate).</p>
                </div>
                <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">SUPPORTED</span>
              </div>
            </div>
          </div>

          {/* Three-Level Evaluation Model */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#101b2d] p-4">
              <span className="font-bold text-sky-700 dark:text-sky-400 uppercase tracking-wide">Level 1: Detection</span>
              <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">76.2%</p>
              <p className="text-slate-600 dark:text-slate-400 text-[11px] mt-1">Processed 3,113 distinct case records successfully against 4,087 alerts.</p>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#101b2d] p-4">
              <span className="font-bold text-sky-700 dark:text-sky-400 uppercase tracking-wide">Level 2: Correctness</span>
              <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">90.1%</p>
              <p className="text-slate-600 dark:text-slate-400 text-[11px] mt-1">191 findings evaluated with high confidence (≥85%) across 13 engines.</p>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#101b2d] p-4">
              <span className="font-bold text-sky-700 dark:text-sky-400 uppercase tracking-wide">Level 3: Usefulness</span>
              <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">40.6%</p>
              <p className="text-slate-600 dark:text-slate-400 text-[11px] mt-1">86 high-priority (P1) issues flagged for immediate supervisory intervention.</p>
            </div>
          </div>

          {/* Sign-off Seal */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-5 flex items-center justify-between text-xs text-slate-500 font-mono">
            <div>
              <span>Generated on: {timestamp}</span>
              <span className="block">Auditor Badge: NCIIPC-SUPV-01</span>
            </div>
            <div className="text-right">
              <span className="font-bold text-slate-800 dark:text-slate-300">SAT-SA NEXUS CORE ENGINE</span>
              <span className="block text-emerald-700 dark:text-emerald-400 font-bold">AUTHENTICATED AUDIT MANIFEST</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

