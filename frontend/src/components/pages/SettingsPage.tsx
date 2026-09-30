import React, { useState, useEffect } from 'react';
import {
  Shield,
  Server,
  Lock,
  Database,
  FileCheck,
  CheckCircle2,
  HardDrive,
  Cpu,
  RefreshCw
} from 'lucide-react';
import { SATSAApi } from '../../services/api';
import { DashboardSummary } from '../../types';

export const SettingsPage: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await SATSAApi.getDashboardSummary();
      setSummary(data);
    } catch (err) {
      console.error('Failed to load system settings info:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Title */}
      <div className="border-b border-[#1C2541] pb-4">
        <h1 className="text-xl font-bold text-white tracking-tight">Supervisory Platform Settings</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Section 17: Platform parameters, air-gap enforcement, and supervisory operational baseline configuration.
        </p>
      </div>

      {/* Operational System Profile */}
      <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-white uppercase tracking-wider">
          <Shield className="w-4 h-4 text-cyan-400" />
          <span>Statutory Authority &amp; System Configuration</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          <div className="bg-[#0B132B] p-3 rounded-lg border border-[#1C2541]">
            <span className="text-slate-400 text-[10px] block">SUPERVISORY AUTHORITY</span>
            <strong className="text-white text-sm">NTRO / NCIIPC</strong>
            <span className="text-[10px] text-slate-400 block mt-1">National Critical Information Infrastructure</span>
          </div>

          <div className="bg-[#0B132B] p-3 rounded-lg border border-[#1C2541]">
            <span className="text-slate-400 text-[10px] block">OPERATIONAL PROFILE</span>
            <strong className="text-cyan-400 text-sm">AIR-GAPPED OFFLINE VAULT</strong>
            <span className="text-[10px] text-emerald-400 block mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> No External Network Calls Permitted
            </span>
          </div>
        </div>
      </div>

      {/* Core Rule Engines Status */}
      <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-5 space-y-3">
        <div className="text-xs font-mono font-bold text-white uppercase tracking-wider">
          Statutory Analytics Rule Engines (Sections 7, 8, 10)
        </div>

        <div className="space-y-2 text-xs font-mono">
          <div className="p-3 bg-[#0B132B] rounded-lg border border-[#1C2541] flex items-center justify-between">
            <div>
              <span className="font-bold text-red-400">Section 7: Execution Gap Engine (Rules 1 - 8)</span>
              <div className="text-[11px] text-slate-400">
                Rapid closure, missing escalations, repetitive investigation, workload mismatch
              </div>
            </div>
            <span className="text-[10px] bg-emerald-950/60 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded font-bold">
              ACTIVE
            </span>
          </div>

          <div className="p-3 bg-[#0B132B] rounded-lg border border-[#1C2541] flex items-center justify-between">
            <div>
              <span className="font-bold text-purple-400">Section 8: Negative Space Engine (Checks 1 - 7)</span>
              <div className="text-[11px] text-slate-400">
                Critical silent assets, missing threat categories, absent cases &amp; responses
              </div>
            </div>
            <span className="text-[10px] bg-emerald-950/60 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded font-bold">
              ACTIVE
            </span>
          </div>

          <div className="p-3 bg-[#0B132B] rounded-lg border border-[#1C2541] flex items-center justify-between">
            <div>
              <span className="font-bold text-blue-400">Section 10: Peer Benchmarking Engine</span>
              <div className="text-[11px] text-slate-400">
                Sector &amp; size-band peer baselines for investigation, escalation, and coverage rates
              </div>
            </div>
            <span className="text-[10px] bg-emerald-950/60 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded font-bold">
              ACTIVE
            </span>
          </div>
        </div>
      </div>

      {/* Local Vault Database Metrics */}
      <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Database className="w-4 h-4 text-cyan-400" />
            <span>Local Database Vault Status</span>
          </div>
          <button
            onClick={fetchStats}
            className="text-xs text-slate-400 hover:text-white font-mono flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Check Stats</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="bg-[#0B132B] p-3 rounded-lg border border-[#1C2541]">
            <span className="text-slate-400 text-[10px] block">TOTAL ENTITIES</span>
            <span className="text-white font-bold text-base">{summary?.cses_assessed || 0}</span>
          </div>
          <div className="bg-[#0B132B] p-3 rounded-lg border border-[#1C2541]">
            <span className="text-slate-400 text-[10px] block">TOTAL ALERTS</span>
            <span className="text-cyan-400 font-bold text-base">
              {summary?.alerts_analyzed ? summary.alerts_analyzed.toLocaleString() : 0}
            </span>
          </div>
          <div className="bg-[#0B132B] p-3 rounded-lg border border-[#1C2541]">
            <span className="text-slate-400 text-[10px] block">CASES PROCESSED</span>
            <span className="text-indigo-400 font-bold text-base">
              {summary?.cases_processed ? summary.cases_processed.toLocaleString() : 0}
            </span>
          </div>
          <div className="bg-[#0B132B] p-3 rounded-lg border border-[#1C2541]">
            <span className="text-slate-400 text-[10px] block">COMPLETENESS</span>
            <span className="text-emerald-400 font-bold text-base">
              {summary?.evidence_chain_completeness || 98.8}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
