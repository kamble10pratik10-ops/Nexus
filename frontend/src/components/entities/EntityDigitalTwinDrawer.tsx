import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  X,
  Building2,
  Shield,
  Activity,
  Server,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
import { SupervisoryRadarChart } from '../charts/SupervisoryRadarChart';

const API_URL = 'http://localhost:8000/api';

interface EntityDigitalTwinDrawerProps {
  entityId: string | null;
  onClose: () => void;
  onInspectFinding?: (findingId: string) => void;
}

interface EntityDetail {
  id: string;
  name: string;
  sector: string;
  size_band: string;
  criticality: string;
  alerts_count: number;
  cases_count: number;
  escalations_count: number;
  responses_count: number;
  monitoring_coverage: number;
  findings: Array<{
    id: string;
    title: string;
    finding_type: string;
    severity: string;
    priority: string;
    confidence: number;
  }>;
}

export function EntityDigitalTwinDrawer({
  entityId,
  onClose,
  onInspectFinding,
}: EntityDigitalTwinDrawerProps) {
  const [detail, setDetail] = useState<EntityDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!entityId) return;
    setLoading(true);
    axios
      .get(`${API_URL}/entities/${entityId}`)
      .then((res) => {
        setDetail(res.data);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => setLoading(false));
  }, [entityId]);

  if (!entityId) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/65 backdrop-blur-xs transition-opacity"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white dark:bg-[#0c1422] border-l border-slate-200 dark:border-slate-800 shadow-2xl h-full overflow-y-auto p-6 space-y-6 text-slate-900 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-sky-500/30 bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/80 border border-sky-200 dark:border-sky-800 px-2 py-0.5 rounded">
                  {entityId}
                </span>
                <span className="rounded-full border border-rose-200 dark:border-rose-500/40 bg-rose-50 dark:bg-rose-500/10 px-2 py-0.5 text-[10px] font-semibold text-rose-700 dark:text-rose-300">
                  {detail?.criticality || 'CRITICAL'} SECTOR
                </span>
              </div>
              <h3 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                {detail?.name || `Entity ${entityId}`}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sector: <span className="text-slate-800 dark:text-slate-200 font-medium">{detail?.sector || 'Critical Infrastructure'}</span> · Size: {detail?.size_band || 'Large'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <div className="py-20 text-center text-sm text-slate-500 dark:text-slate-400">
            Querying Digital Operational Twin for {entityId}…
          </div>
        ) : (
          <>
            {/* Operational Metrics Bar */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-[#101b2d] p-3 text-center">
                <span className="text-[10px] font-medium uppercase text-slate-500 dark:text-slate-400">Alerts</span>
                <p className="text-lg font-bold text-sky-700 dark:text-sky-300">{detail?.alerts_count || 0}</p>
              </div>
              <div className="rounded-lg border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-[#101b2d] p-3 text-center">
                <span className="text-[10px] font-medium uppercase text-slate-500 dark:text-slate-400">Cases</span>
                <p className="text-lg font-bold text-indigo-700 dark:text-indigo-300">{detail?.cases_count || 0}</p>
              </div>
              <div className="rounded-lg border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-[#101b2d] p-3 text-center">
                <span className="text-[10px] font-medium uppercase text-slate-500 dark:text-slate-400">Escalated</span>
                <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{detail?.escalations_count || 0}</p>
              </div>
              <div className="rounded-lg border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-[#101b2d] p-3 text-center">
                <span className="text-[10px] font-medium uppercase text-slate-500 dark:text-slate-400">Responses</span>
                <p className="text-lg font-bold text-cyan-700 dark:text-cyan-300">{detail?.responses_count || 0}</p>
              </div>
            </div>

            {/* Radar Posture Analysis */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0e1726] p-4 shadow-xs">
              <SupervisoryRadarChart
                entityName={`${entityId} Posture`}
                observedScores={[72, 38, 44, detail?.monitoring_coverage || 92, 55, 34]}
              />
            </div>

            {/* Crown Jewel Asset Monitoring Telemetry */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0e1726] p-4 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Server className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-slate-200">
                    Crown-Jewel Assets &amp; Sensors
                  </span>
                </div>
                <span className="font-mono text-xs text-emerald-700 dark:text-emerald-400 font-bold">
                  {detail?.monitoring_coverage || 100}% Active
                </span>
              </div>
              <div className="space-y-2">
                {[
                  { name: 'SCADA MTU Gateway', type: 'OT Controller', status: 'ACTIVE' },
                  { name: 'Core DB Transaction Cluster', type: 'Database', status: 'ACTIVE' },
                  { name: 'Domain Controller (AD-01)', type: 'Identity', status: 'ACTIVE' },
                  { name: 'Perimeter Firewall Gateway', type: 'Network', status: 'ACTIVE' },
                ].map((asset, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800/60 bg-slate-50 dark:bg-[#111a2a] px-3 py-2 text-xs"
                  >
                    <div>
                      <span className="font-medium text-slate-800 dark:text-slate-200">{asset.name}</span>
                      <span className="ml-2 text-[10px] text-slate-500">({asset.type})</span>
                    </div>
                    <span className="flex items-center gap-1 font-mono text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">
                      <CheckCircle2 className="h-3 w-3" /> STREAMING
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Findings for this Entity */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0e1726] p-4 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-slate-200">
                    Active Supervisory Findings ({detail?.findings?.length || 0})
                  </span>
                </div>
              </div>
              <div className="space-y-2 max-h-[220px] overflow-y-auto">
                {(!detail?.findings || detail.findings.length === 0) ? (
                  <p className="text-xs text-slate-500 py-4 text-center">No active findings on record.</p>
                ) : (
                  detail.findings.map((f) => (
                    <div
                      key={f.id}
                      className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-[#111a2a] p-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-sky-700 dark:text-sky-400 font-bold">{f.id}</span>
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                              f.priority === 'P1'
                                ? 'bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30'
                                : 'bg-amber-50 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30'
                            }`}
                          >
                            {f.priority}
                          </span>
                        </div>
                        <p className="mt-1 text-slate-800 dark:text-slate-200 font-medium">{f.title}</p>
                      </div>
                      <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                        {Math.round(f.confidence * 100)}% conf
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

