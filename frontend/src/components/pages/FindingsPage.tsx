import React, { useState, useEffect } from 'react';
import {
  AlertOctagon,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { Finding, FindingType, FindingPriority } from '../../types';
import { SATSAApi } from '../../services/api';

interface FindingsPageProps {
  onOpenFinding: (finding: Finding) => void;
  onOpenEntity: (entityId: string) => void;
}

export const FindingsPage: React.FC<FindingsPageProps> = ({ onOpenFinding, onOpenEntity }) => {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [selectedReviewed, setSelectedReviewed] = useState<string>('ALL');

  const fetchFindings = async () => {
    setLoading(true);
    try {
      const data = await SATSAApi.getFindings({
        finding_type: selectedType !== 'ALL' ? selectedType : undefined,
        priority: selectedPriority !== 'ALL' ? selectedPriority : undefined,
        reviewed: selectedReviewed === 'REVIEWED' ? true : selectedReviewed === 'UNREVIEWED' ? false : undefined
      });
      setFindings(data);
    } catch (err) {
      console.error('Failed to load findings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFindings();
  }, [selectedType, selectedPriority, selectedReviewed]);

  const filteredFindings = findings.filter((f) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      f.title.toLowerCase().includes(term) ||
      f.entity_id.toLowerCase().includes(term) ||
      (f.entity_name && f.entity_name.toLowerCase().includes(term)) ||
      (f.rule_id && f.rule_id.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6">
      {/* Title & Filter Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1C2541] pb-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Supervisory Findings Dossier</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Explainable findings generated from execution gaps, negative-space detection, and peer deviation baselines.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchFindings}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1C2541] hover:bg-[#2D3A5F] text-slate-300 text-xs rounded transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter Controls Row */}
      <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-4 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search findings by title, CSE ID, or rule..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#0B132B] border border-[#2D3A5F] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
          />
        </div>

        {/* Type Filter */}
        <div className="flex items-center gap-1.5 text-xs font-mono">
          <span className="text-slate-400">TYPE:</span>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-[#0B132B] border border-[#2D3A5F] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
          >
            <option value="ALL">All Types</option>
            <option value="EXECUTION_GAP">Execution Gap</option>
            <option value="NEGATIVE_SPACE">Negative Space</option>
            <option value="PEER_DEVIATION">Peer Deviation</option>
            <option value="ANOMALY">Anomaly</option>
          </select>
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-1.5 text-xs font-mono">
          <span className="text-slate-400">PRIORITY:</span>
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="bg-[#0B132B] border border-[#2D3A5F] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
          >
            <option value="ALL">All Priorities</option>
            <option value="P1">P1 (Immediate)</option>
            <option value="P2">P2 (Elevated)</option>
            <option value="P3">P3 (Routine)</option>
          </select>
        </div>

        {/* Review Status */}
        <div className="flex items-center gap-1.5 text-xs font-mono">
          <span className="text-slate-400">STATUS:</span>
          <select
            value={selectedReviewed}
            onChange={(e) => setSelectedReviewed(e.target.value)}
            className="bg-[#0B132B] border border-[#2D3A5F] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
          >
            <option value="ALL">All Status</option>
            <option value="UNREVIEWED">Unreviewed (Pending)</option>
            <option value="REVIEWED">Reviewed by Supervisor</option>
          </select>
        </div>
      </div>

      {/* Findings Table */}
      <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl overflow-hidden shadow-md">
        {loading ? (
          <div className="py-16 text-center text-cyan-400 font-mono text-xs flex flex-col items-center justify-center space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
            <div>Loading findings catalog...</div>
          </div>
        ) : filteredFindings.length === 0 ? (
          <div className="py-16 text-center text-slate-400 font-mono text-xs">
            No findings match the selected filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#0B132B] border-b border-[#1C2541] text-slate-400 font-mono uppercase text-[10px]">
                  <th className="py-3 px-4">Priority / Type</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Finding & Core Reason</th>
                  <th className="py-3 px-4 text-center">Confidence</th>
                  <th className="py-3 px-4 text-center">Review Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1C2541]/60">
                {filteredFindings.map((f) => {
                  const isGap = f.finding_type === 'EXECUTION_GAP';
                  const isNeg = f.finding_type === 'NEGATIVE_SPACE';
                  const isPeer = f.finding_type === 'PEER_DEVIATION';

                  return (
                    <tr
                      key={f.id}
                      onClick={() => onOpenFinding(f)}
                      className="hover:bg-[#1C2541]/50 cursor-pointer transition-colors group"
                    >
                      {/* Priority & Type */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 font-mono">
                          <span className="px-2 py-0.5 rounded font-bold text-xs bg-red-950/60 border border-red-500/40 text-red-300">
                            {f.priority}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              isGap
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : isNeg
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                : isPeer
                                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {f.finding_type.replace(/_/g, ' ')}
                          </span>
                        </div>
                        {f.rule_id && (
                          <div className="text-[10px] font-mono text-slate-500 mt-1">{f.rule_id}</div>
                        )}
                      </td>

                      {/* Entity */}
                      <td className="py-3 px-4 font-mono">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenEntity(f.entity_id);
                          }}
                          className="font-bold text-cyan-400 hover:underline flex items-center gap-1"
                        >
                          <span>{f.entity_id}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </button>
                        <div className="text-[10px] text-slate-400 truncate max-w-[130px] font-sans">
                          {f.entity_name || 'Critical Sector'}
                        </div>
                      </td>

                      {/* Finding Title & Explanation */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white group-hover:text-cyan-300 transition-colors">
                          {f.title}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                          {f.explanation}
                        </div>
                      </td>

                      {/* Confidence */}
                      <td className="py-3 px-4 text-center font-mono">
                        <span className="font-bold text-cyan-400">
                          {f.confidence_pct || Math.round(f.confidence * 100)}%
                        </span>
                      </td>

                      {/* Review Status */}
                      <td className="py-3 px-4 text-center">
                        {f.reviewed ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-300 bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            REVIEWED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-amber-300 bg-amber-950/60 border border-amber-500/40 px-2 py-0.5 rounded">
                            <Clock className="w-3 h-3 text-amber-400" />
                            PENDING
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right">
                        <span className="inline-flex items-center gap-1 text-xs font-mono text-slate-300 group-hover:text-cyan-300">
                          <span>Evidence</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
