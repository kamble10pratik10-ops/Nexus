import React, { useState, useEffect } from 'react';
import {
  Building2,
  AlertTriangle,
  Zap,
  EyeOff,
  ClipboardList,
  ArrowRight,
  TrendingUp,
  ShieldAlert,
  ChevronRight,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import {
  DashboardSummary,
  AttentionMatrixItem,
  FindingDistributionItem,
  Finding
} from '../../types';
import { SATSAApi } from '../../services/api';

interface DashboardPageProps {
  onOpenEntity: (entityId: string) => void;
  onOpenFinding: (finding: Finding) => void;
  onNavigateToReviewQueue: () => void;
  onNavigateToIngestion: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onOpenEntity,
  onOpenFinding,
  onNavigateToReviewQueue,
  onNavigateToIngestion
}) => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [matrix, setMatrix] = useState<AttentionMatrixItem[]>([]);
  const [distribution, setDistribution] = useState<FindingDistributionItem[]>([]);
  const [reviewQueue, setReviewQueue] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [sumRes, matRes, distRes, qRes] = await Promise.all([
        SATSAApi.getDashboardSummary(),
        SATSAApi.getAttentionMatrix(),
        SATSAApi.getFindingDistribution(),
        SATSAApi.getPriorityReviewQueue(10)
      ]);
      setSummary(sumRes);
      setMatrix(matRes);
      setDistribution(distRes);
      setReviewQueue(qRes);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-cyan-400 space-y-3 font-mono">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
        <div className="text-sm">Synthesizing Supervisory Attention Metrics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Title & Mission Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1C2541] pb-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Supervisory Assessment Overview</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Periodic SOC evidence audit, negative-space detection, and peer benchmarking across Critical Sector Entities.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchDashboardData}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1C2541] hover:bg-[#2D3A5F] text-slate-300 text-xs rounded transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Analytics</span>
          </button>
          <button
            onClick={onNavigateToIngestion}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded transition-colors"
          >
            <span>Upload Batch Data</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Section 12: Top 5 Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: CSEs Assessed */}
        <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>CSES ASSESSED</span>
            <Building2 className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white font-mono">{summary?.cses_assessed || 0}</div>
          <div className="mt-1 text-[11px] text-slate-400">Critical Sector Entities under periodic oversight</div>
        </div>

        {/* Card 2: Alerts Analyzed */}
        <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>ALERTS ANALYZED</span>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-cyan-400 font-mono">
            {summary?.alerts_analyzed ? summary.alerts_analyzed.toLocaleString() : 0}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Normalized SOC telemetry events evaluated</div>
        </div>

        {/* Card 3: Execution Gaps */}
        <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>EXECUTION GAPS</span>
            <Zap className="w-4 h-4 text-red-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-red-400 font-mono">{summary?.execution_gaps_count || 0}</div>
          <div className="mt-1 text-[11px] text-slate-400">Operational triage & closure anomalies flagged</div>
        </div>

        {/* Card 4: Negative Space Findings */}
        <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>NEGATIVE SPACE</span>
            <EyeOff className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-purple-400 font-mono">{summary?.negative_space_count || 0}</div>
          <div className="mt-1 text-[11px] text-slate-400">Expected security evidence absent from records</div>
        </div>

        {/* Card 5: Priority Reviews */}
        <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>PRIORITY REVIEWS</span>
            <ClipboardList className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-300 font-mono">{summary?.priority_reviews_count || 0}</div>
          <div className="mt-1 text-[11px] text-slate-400">Unreviewed P1/P2 supervisory findings in queue</div>
        </div>
      </div>

      {/* Grid: Main Visualization 1 (Supervisory Attention by Entity) & Main Visualization 2 (Finding Distribution) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Visualization 1: Supervisory Attention by Entity (2 Cols) */}
        <div className="lg:col-span-2 bg-[#0F172A] border border-[#1E293B] rounded-xl p-5 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-[#1C2541]">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Supervisory Attention by Entity
              </h2>
              <p className="text-[11px] text-slate-400">
                Prioritized ranking based on critical findings, negative-space indicators, and statutory criticality.
              </p>
            </div>
            <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
              Sorted by Attention Level
            </span>
          </div>

          <div className="mt-4 overflow-x-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#1C2541] text-slate-400 font-mono uppercase text-[10px]">
                  <th className="py-2.5 px-3">Entity</th>
                  <th className="py-2.5 px-3">Sector</th>
                  <th className="py-2.5 px-3">Criticality</th>
                  <th className="py-2.5 px-3 text-center">Finding Count</th>
                  <th className="py-2.5 px-3 text-center">P1 Findings</th>
                  <th className="py-2.5 px-3 text-right">Attention Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1C2541]/60">
                {matrix.slice(0, 7).map((item) => (
                  <tr
                    key={item.entity}
                    onClick={() => onOpenEntity(item.entity)}
                    className="hover:bg-[#1C2541]/50 cursor-pointer transition-colors group"
                  >
                    <td className="py-3 px-3">
                      <div className="font-mono font-bold text-cyan-400 group-hover:text-cyan-300 flex items-center gap-1.5">
                        <span>{item.entity}</span>
                        <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="text-[11px] text-slate-300 truncate max-w-[180px]">{item.name}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-300 font-mono">{item.sector}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                          item.criticality === 'CRITICAL'
                            ? 'bg-red-950/60 text-red-300 border border-red-800/40'
                            : item.criticality === 'HIGH'
                            ? 'bg-amber-950/60 text-amber-300 border border-amber-800/40'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {item.criticality}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-semibold text-slate-200">
                      {item.finding_count}
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-red-400">
                      {item.p1_findings}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-1 rounded-full uppercase tracking-wider ${
                          item.attention_level === 'CRITICAL'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse'
                            : item.attention_level === 'ELEVATED'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {item.attention_level}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Main Visualization 2: Finding Distribution (1 Col) */}
        <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-5 flex flex-col justify-between">
          <div className="pb-3 border-b border-[#1C2541]">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Finding Distribution
            </h2>
            <p className="text-[11px] text-slate-400">
              Breakdown across execution gaps, negative space, and peer deviations.
            </p>
          </div>

          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={distribution}
                margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#64748B"
                  fontSize={10}
                  tickLine={false}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis stroke="#64748B" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0B132B',
                    borderColor: '#2D3A5F',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#FFF'
                  }}
                  itemStyle={{ color: '#06B6D4' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#1C2541] text-[11px] font-mono">
            {distribution.map((d) => (
              <div key={d.type} className="flex items-center justify-between p-1.5 rounded bg-[#131E3A]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }}></span>
                  <span className="text-slate-300">{d.name}</span>
                </div>
                <span className="font-bold text-white">{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Section 12 Third Section: Priority Review Queue Preview */}
      <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#1C2541]">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Priority Review Queue
              </h2>
              <span className="text-xs bg-red-950/60 border border-red-500/40 text-red-300 px-2 py-0.5 rounded font-mono font-bold">
                P1 / P2 Findings
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              High-confidence indicators requiring manual supervisor verification and action.
            </p>
          </div>

          <button
            onClick={onNavigateToReviewQueue}
            className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-mono font-semibold"
          >
            <span>Open Full Queue ({summary?.priority_reviews_count || 0})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="mt-4 divide-y divide-[#1C2541]/60">
          {reviewQueue.slice(0, 5).map((item) => (
            <div
              key={item.id}
              onClick={() => onOpenFinding(item)}
              className="py-3 px-3 hover:bg-[#1C2541]/40 rounded-lg cursor-pointer transition-colors flex items-center justify-between gap-4 group"
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-red-950/60 border border-red-500/40 text-red-300 shrink-0">
                  {item.priority}
                </span>
                <span className="font-mono text-xs font-bold text-cyan-400 shrink-0">
                  {item.entity_id}
                </span>
                <span className="text-xs text-slate-400 shrink-0">&bull;</span>
                <span className="text-xs font-medium text-slate-200 group-hover:text-white truncate">
                  {item.title}
                </span>
              </div>

              <div className="flex items-center space-x-4 shrink-0 text-xs">
                <span className="text-[11px] font-mono text-slate-400">
                  Confidence: <strong className="text-cyan-400">{Math.round(item.confidence * 100)}%</strong>
                </span>
                <span className="px-2 py-1 bg-blue-600/20 hover:bg-blue-600 text-cyan-300 hover:text-white rounded text-[11px] font-mono transition-colors flex items-center gap-1">
                  Inspect Evidence
                  <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
