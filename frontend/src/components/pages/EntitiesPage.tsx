import React, { useState, useEffect } from 'react';
import {
  Building2,
  ChevronRight,
  ArrowLeft,
  AlertTriangle,
  Shield,
  Layers,
  Activity,
  CheckCircle2,
  Clock,
  RefreshCw,
  Search,
  ExternalLink,
  HelpCircle,
  FileText
} from 'lucide-react';
import { Entity, EntityDetail, Finding } from '../../types';
import { SATSAApi } from '../../services/api';

interface EntitiesPageProps {
  initialEntityId?: string | null;
  onOpenFinding: (finding: Finding) => void;
}

export const EntitiesPage: React.FC<EntitiesPageProps> = ({ initialEntityId, onOpenFinding }) => {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(initialEntityId || null);
  const [entityDetail, setEntityDetail] = useState<EntityDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [sectorFilter, setSectorFilter] = useState('ALL');

  const fetchEntities = async () => {
    setLoading(true);
    try {
      const data = await SATSAApi.getEntities();
      setEntities(data);
    } catch (err) {
      console.error('Failed to load entities:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDetail = async (id: string) => {
    setDetailLoading(true);
    try {
      const data = await SATSAApi.getEntityDetail(id);
      setEntityDetail(data);
    } catch (err) {
      console.error(`Failed to load detail for entity ${id}:`, err);
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    fetchEntities();
  }, []);

  useEffect(() => {
    if (selectedEntityId) {
      fetchDetail(selectedEntityId);
    } else {
      setEntityDetail(null);
    }
  }, [selectedEntityId]);

  // Keep synced if parent changes initialEntityId
  useEffect(() => {
    if (initialEntityId) {
      setSelectedEntityId(initialEntityId);
    }
  }, [initialEntityId]);

  const filteredEntities = entities.filter((e) => {
    const matchesSearch =
      e.id.toLowerCase().includes(search.toLowerCase()) ||
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.sector.toLowerCase().includes(search.toLowerCase());
    const matchesSector = sectorFilter === 'ALL' || e.sector === sectorFilter;
    return matchesSearch && matchesSector;
  });

  const sectors = Array.from(new Set(entities.map((e) => e.sector)));

  // If an entity is selected, render Section 13 Entity Detail Page!
  if (selectedEntityId && entityDetail) {
    const { entity, evidence_counts, findings } = entityDetail;

    return (
      <div className="space-y-6">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between border-b border-[#1C2541] pb-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSelectedEntityId(null)}
              className="p-1.5 rounded-lg bg-[#1C2541] hover:bg-[#2D3A5F] text-slate-300 hover:text-white transition-colors flex items-center gap-1 text-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Entities</span>
            </button>
            <div className="h-5 w-px bg-[#2D3A5F]"></div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-tight">{entity.id}</h1>
                <span className="text-xs text-slate-400 font-sans">({entity.name})</span>
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                    entity.criticality === 'CRITICAL'
                      ? 'bg-red-950/60 text-red-300 border border-red-500/40'
                      : 'bg-amber-950/60 text-amber-300 border border-amber-500/40'
                  }`}
                >
                  {entity.criticality}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => fetchDetail(selectedEntityId)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1C2541] hover:bg-[#2D3A5F] text-slate-300 text-xs rounded transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Audit</span>
          </button>
        </div>

        {/* Section 13: Entity Overview */}
        <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-5">
          <h2 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider mb-3">
            Section 13: Entity Overview
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs">
            <div className="bg-[#0B132B] p-3 rounded-lg border border-[#1C2541]">
              <span className="text-slate-400 text-[10px] block">SECTOR</span>
              <strong className="text-white text-sm">{entity.sector}</strong>
            </div>
            <div className="bg-[#0B132B] p-3 rounded-lg border border-[#1C2541]">
              <span className="text-slate-400 text-[10px] block">SIZE BAND</span>
              <strong className="text-white text-sm">{entity.size_band}</strong>
            </div>
            <div className="bg-[#0B132B] p-3 rounded-lg border border-[#1C2541]">
              <span className="text-slate-400 text-[10px] block">CRITICALITY LEVEL</span>
              <strong className="text-amber-300 text-sm">{entity.criticality}</strong>
            </div>
            <div className="bg-[#0B132B] p-3 rounded-lg border border-[#1C2541]">
              <span className="text-slate-400 text-[10px] block">OBSERVATION WINDOW</span>
              <strong className="text-white text-[11px] block truncate">
                {entity.observation_start ? entity.observation_start.slice(0, 10) : '2026-07-01'} to{' '}
                {entity.observation_end ? entity.observation_end.slice(0, 10) : '2026-09-29'}
              </strong>
            </div>
          </div>
        </div>

        {/* Section 13: Operational Evidence Metrics (Alerts, Cases, Escalations, Responses, Monitoring Coverage) */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-4">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">Alerts Submitted</span>
            <div className="text-xl font-bold font-mono text-cyan-400 mt-1">
              {evidence_counts.alerts.toLocaleString()}
            </div>
          </div>
          <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-4">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">Cases Investigated</span>
            <div className="text-xl font-bold font-mono text-white mt-1">
              {evidence_counts.cases.toLocaleString()}
            </div>
          </div>
          <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-4">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">Escalations Recorded</span>
            <div className="text-xl font-bold font-mono text-indigo-400 mt-1">
              {evidence_counts.escalations.toLocaleString()}
            </div>
          </div>
          <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-4">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">Responses Documented</span>
            <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
              {evidence_counts.responses.toLocaleString()}
            </div>
          </div>
          <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-4">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">Monitoring Coverage</span>
            <div
              className={`text-xl font-bold font-mono mt-1 ${
                evidence_counts.monitoring_coverage_pct < 80 ? 'text-red-400' : 'text-emerald-400'
              }`}
            >
              {evidence_counts.monitoring_coverage_pct}%
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
              {evidence_counts.total_assets} critical assets
            </div>
          </div>
        </div>

        {/* Section 13: Findings - The 4 Mandated Supervisory Questions */}
        <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#1C2541]">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Supervisory Findings &amp; Mandated Explainability
              </h2>
              <p className="text-[11px] text-slate-400">
                Detailed assessment answering the 4 statutory questions for every identified operational gap.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-red-400 bg-red-950/60 px-2.5 py-1 rounded border border-red-500/40">
              {findings.length} Findings Total
            </span>
          </div>

          <div className="space-y-4">
            {findings.map((f, idx) => (
              <div
                key={f.id}
                className="bg-[#0B132B] border border-[#1C2541] hover:border-[#2D3A5F] rounded-xl p-5 space-y-4 transition-all"
              >
                {/* Finding Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#1C2541]">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-red-950/60 border border-red-500/40 text-red-300">
                      {f.priority}
                    </span>
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                        f.finding_type === 'EXECUTION_GAP'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : f.finding_type === 'NEGATIVE_SPACE'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      }`}
                    >
                      {f.finding_type.replace(/_/g, ' ')}
                    </span>
                    <h3 className="text-sm font-bold text-white">{f.title}</h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-mono">
                      Confidence: <strong className="text-cyan-400">{Math.round(f.confidence * 100)}%</strong>
                    </span>
                    <button
                      onClick={() =>
                        onOpenFinding({
                          id: f.id,
                          title: f.title,
                          entity_id: entity.id,
                          entity_name: entity.name,
                          sector: entity.sector,
                          finding_type: f.finding_type,
                          severity: f.severity,
                          priority: f.priority,
                          confidence: f.confidence,
                          confidence_pct: Math.round(f.confidence * 100),
                          explanation: f.q2_why_detected,
                          evidence: f.q3_what_evidence,
                          expected_workflow: f.expected_workflow,
                          observed_workflow: f.observed_workflow,
                          missing_evidence: f.missing_evidence,
                          supervisory_action: f.q4_what_to_review,
                          reviewed: f.reviewed,
                          review_decision: f.review_decision,
                          created_at: new Date().toISOString()
                        })
                      }
                      className="px-2.5 py-1 bg-[#1C2541] hover:bg-blue-600 text-slate-300 hover:text-white rounded text-xs font-mono transition-colors flex items-center gap-1"
                    >
                      <span>Evidence Modal</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* The 4 Questions Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                  
                  {/* Question 1: What was detected? */}
                  <div className="bg-[#131E3A] p-3 rounded-lg border border-[#2D3A5F]">
                    <div className="text-cyan-400 font-bold uppercase tracking-wider text-[10px] mb-1">
                      1. WHAT WAS DETECTED?
                    </div>
                    <div className="text-slate-100 font-sans text-xs">{f.q1_what_detected}</div>
                  </div>

                  {/* Question 2: Why was it detected? */}
                  <div className="bg-[#131E3A] p-3 rounded-lg border border-[#2D3A5F]">
                    <div className="text-cyan-400 font-bold uppercase tracking-wider text-[10px] mb-1">
                      2. WHY WAS IT DETECTED?
                    </div>
                    <div className="text-slate-100 font-sans text-xs">{f.q2_why_detected}</div>
                  </div>

                  {/* Question 3: What evidence supports it? */}
                  <div className="bg-[#131E3A] p-3 rounded-lg border border-[#2D3A5F]">
                    <div className="text-cyan-400 font-bold uppercase tracking-wider text-[10px] mb-1">
                      3. WHAT EVIDENCE SUPPORTS IT?
                    </div>
                    <div className="text-slate-300 text-[11px] overflow-x-auto max-h-24 font-mono">
                      {Object.entries(f.q3_what_evidence || {}).map(([k, v]) => (
                        <div key={k} className="truncate">
                          <span className="text-cyan-300 font-semibold">{k}: </span>
                          <span>{Array.isArray(v) ? v.slice(0, 5).join(', ') : String(v)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Question 4: What should the supervisor review? */}
                  <div className="bg-[#18233C] border-l-2 border-cyan-400 p-3 rounded-r-lg">
                    <div className="text-cyan-300 font-bold uppercase tracking-wider text-[10px] mb-1">
                      4. WHAT SHOULD THE SUPERVISOR REVIEW?
                    </div>
                    <div className="text-slate-100 font-sans text-xs">{f.q4_what_to_review}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Otherwise, render Section 13 Entity List!
  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1C2541] pb-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Critical Sector Entities Assessment</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Select a Critical Sector Entity (CSE) to inspect operational evidence, telemetry coverage, and explainable findings.
          </p>
        </div>

        <button
          onClick={fetchEntities}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1C2541] hover:bg-[#2D3A5F] text-slate-300 text-xs rounded transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh List</span>
        </button>
      </div>

      {/* Filter Row */}
      <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search CSEs by code, name, or sector..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#0B132B] border border-[#2D3A5F] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs font-mono">
          <span className="text-slate-400">SECTOR:</span>
          <select
            value={sectorFilter}
            onChange={(e) => setSectorFilter(e.target.value)}
            className="bg-[#0B132B] border border-[#2D3A5F] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
          >
            <option value="ALL">All Sectors ({sectors.length})</option>
            {sectors.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Entity Table */}
      <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl overflow-hidden shadow-md">
        {loading ? (
          <div className="py-16 text-center text-cyan-400 font-mono text-xs flex flex-col items-center justify-center space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
            <div>Loading entities registry...</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="bg-[#0B132B] border-b border-[#1C2541] text-slate-400 uppercase text-[10px]">
                  <th className="py-3 px-4">Entity ID</th>
                  <th className="py-3 px-4">Organization Name</th>
                  <th className="py-3 px-4">Sector</th>
                  <th className="py-3 px-4">Size Band</th>
                  <th className="py-3 px-4">Criticality</th>
                  <th className="py-3 px-4 text-center">Finding Count</th>
                  <th className="py-3 px-4 text-center">P1 Findings</th>
                  <th className="py-3 px-4 text-right">Attention</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1C2541]/60">
                {filteredEntities.map((ent) => (
                  <tr
                    key={ent.id}
                    onClick={() => setSelectedEntityId(ent.id)}
                    className="hover:bg-[#1C2541]/50 cursor-pointer transition-colors group"
                  >
                    <td className="py-3 px-4 font-bold text-cyan-400 flex items-center gap-1.5">
                      <span>{ent.id}</span>
                      <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </td>
                    <td className="py-3 px-4 text-white font-sans font-medium">{ent.name}</td>
                    <td className="py-3 px-4 text-slate-300">{ent.sector}</td>
                    <td className="py-3 px-4 text-slate-400">{ent.size_band}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          ent.criticality === 'CRITICAL'
                            ? 'bg-red-950/60 text-red-300 border border-red-500/40'
                            : 'bg-amber-950/60 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        {ent.criticality}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-200">
                      {ent.finding_count || 0}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-red-400">
                      {ent.p1_count || 0}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                          ent.attention_level === 'CRITICAL'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse'
                            : ent.attention_level === 'ELEVATED'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {ent.attention_level || 'ROUTINE'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
