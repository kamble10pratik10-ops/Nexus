import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
  ArrowRight,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { Finding } from '../../types';
import { SATSAApi } from '../../services/api';

interface ReviewQueuePageProps {
  onOpenFinding: (finding: Finding) => void;
  onOpenEntity: (entityId: string) => void;
}

export const ReviewQueuePage: React.FC<ReviewQueuePageProps> = ({ onOpenFinding, onOpenEntity }) => {
  const [queue, setQueue] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFinding, setActiveFinding] = useState<Finding | null>(null);
  const [decision, setDecision] = useState('CONFIRMED_GAP');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const data = await SATSAApi.getPriorityReviewQueue(50);
      setQueue(data);
      if (data.length > 0 && !activeFinding) {
        setActiveFinding(data[0]);
      }
    } catch (err) {
      console.error('Failed to load review queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleReviewAction = async (fndId: string, det: string) => {
    setSubmitting(true);
    setFeedback(null);
    try {
      await SATSAApi.reviewFinding(fndId, det, notes || 'Verified by supervisor via review queue action.');
      setFeedback(`Review decision recorded: ${det}`);
      // Remove reviewed item from queue
      setQueue((prev) => prev.filter((f) => f.id !== fndId));
      const remaining = queue.filter((f) => f.id !== fndId);
      setActiveFinding(remaining.length > 0 ? remaining[0] : null);
      setNotes('');
    } catch (err) {
      console.error('Failed to record review action:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1C2541] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">Supervisory Review Queue</h1>
            <span className="text-xs bg-red-950/60 border border-red-500/40 text-red-300 font-mono px-2 py-0.5 rounded font-bold">
              {queue.length} PENDING AUDITS
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Section 11: Prioritized supervisory queue for manual verification, statutory inquiry, and CISO notification.
          </p>
        </div>

        <button
          onClick={fetchQueue}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1C2541] hover:bg-[#2D3A5F] text-slate-300 text-xs rounded transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Queue</span>
        </button>
      </div>

      {feedback && (
        <div className="bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 p-3 rounded-lg text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{feedback}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* Two Column Layout: Left Queue List, Right Quick Action & Evidence Pane */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Priority Items List (7 Cols) */}
        <div className="lg:col-span-7 bg-[#0F172A] border border-[#1E293B] rounded-xl overflow-hidden flex flex-col">
          <div className="p-4 bg-[#0B132B] border-b border-[#1C2541] flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
              PRIORITY RANKED FINDINGS (P1 &rarr; P2 &rarr; P3)
            </span>
            <span className="text-[11px] font-mono text-cyan-400">Section 11 Format</span>
          </div>

          {loading ? (
            <div className="py-16 text-center text-cyan-400 font-mono text-xs flex flex-col items-center justify-center space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
              <div>Ranking evidence and queue items...</div>
            </div>
          ) : queue.length === 0 ? (
            <div className="py-16 text-center text-slate-400 font-mono text-xs space-y-2">
              <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto" />
              <div className="text-sm font-bold text-white">Supervisory Review Queue Cleared</div>
              <div className="text-[11px] text-slate-500">
                All P1/P2 operational execution gaps and negative space indicators have been processed.
              </div>
            </div>
          ) : (
            <div className="divide-y divide-[#1C2541]/60 overflow-y-auto max-h-[620px]">
              {queue.map((item) => {
                const isSelected = activeFinding?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setActiveFinding(item)}
                    className={`p-3.5 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-950/40 border-l-4 border-cyan-400'
                        : 'hover:bg-[#1C2541]/40 border-l-4 border-transparent'
                    }`}
                  >
                    {/* Section 11 Exact Queue Line: P1 | CSE-07 | Critical alerts closed unusually quickly */}
                    <div className="flex items-center gap-2 font-mono text-xs">
                      <span className="px-1.5 py-0.5 rounded font-bold text-[11px] bg-red-950/70 border border-red-500/40 text-red-300">
                        {item.priority}
                      </span>
                      <span className="text-slate-500">|</span>
                      <span className="font-bold text-cyan-400">{item.entity_id}</span>
                      <span className="text-slate-500">|</span>
                      <span className="text-white font-medium truncate flex-1 font-sans">{item.title}</span>
                    </div>

                    <div className="mt-1.5 text-[11px] text-slate-400 line-clamp-2 pl-1">
                      {item.explanation}
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-slate-500 pl-1">
                      <span className="text-cyan-400">
                        Confidence: {Math.round(item.confidence * 100)}%
                      </span>
                      <span>Type: {item.finding_type.replace(/_/g, ' ')}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Active Item Evidence & Supervisor Action Panel (5 Cols) */}
        <div className="lg:col-span-5 bg-[#0F172A] border border-[#1E293B] rounded-xl p-5 flex flex-col justify-between space-y-4">
          {activeFinding ? (
            <div className="space-y-4">
              <div className="pb-3 border-b border-[#1C2541]">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-red-950/60 border border-red-500/40 text-red-300">
                    {activeFinding.priority} &bull; {activeFinding.finding_type.replace(/_/g, ' ')}
                  </span>
                  <button
                    onClick={() => onOpenFinding(activeFinding)}
                    className="text-xs text-cyan-400 hover:underline font-mono"
                  >
                    Open Full Dossier &rarr;
                  </button>
                </div>
                <h2 className="text-sm font-bold text-white mt-2 leading-snug">{activeFinding.title}</h2>
                <div className="text-xs text-slate-400 mt-1 font-mono">
                  Entity: <strong className="text-cyan-400">{activeFinding.entity_id}</strong>
                </div>
              </div>

              {/* Why Flagged */}
              <div className="bg-[#131E3A] border border-[#2D3A5F] rounded-lg p-3">
                <div className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider mb-1">
                  WHY FLAGGED (SECTION 14):
                </div>
                <p className="text-xs text-slate-200">{activeFinding.explanation}</p>
              </div>

              {/* Supervisory Action Recommendation */}
              <div className="bg-[#18233C] border-l-2 border-cyan-400 p-3 rounded-r-lg">
                <div className="text-[10px] font-mono font-bold text-cyan-300 uppercase tracking-wider mb-1">
                  RECOMMENDED ACTION:
                </div>
                <p className="text-xs text-slate-300">
                  {activeFinding.supervisory_action || 'Inspect entity SOC shift logs and interview duty analyst.'}
                </p>
              </div>

              {/* Action Decision Form */}
              <div className="border-t border-[#1C2541] pt-3 space-y-3">
                <div className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                  SUPERVISORY REVIEW ACTION
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-1">
                    AUDIT DETERMINATION
                  </label>
                  <select
                    value={decision}
                    onChange={(e) => setDecision(e.target.value)}
                    className="w-full bg-[#0B132B] border border-[#2D3A5F] rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="CONFIRMED_GAP">Confirm Operational Execution Gap</option>
                    <option value="NEGATIVE_SPACE_VERIFIED">Verify Potential Negative Space</option>
                    <option value="STATUTORY_INQUIRY">Issue Statutory Notice (Section 70B)</option>
                    <option value="BENCHMARK_DEVIATION_NOTED">Note Peer Benchmark Deviation</option>
                    <option value="DISMISSED_EXPLAINED">Dismiss / Justified Deviation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-1">
                    SUPERVISOR AUDIT REMARKS
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter audit remarks or compliance requirement..."
                    className="w-full bg-[#0B132B] border border-[#2D3A5F] rounded p-2 text-xs text-white focus:outline-none focus:border-cyan-400 resize-none font-mono"
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => handleReviewAction(activeFinding.id, decision)}
                    disabled={submitting}
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded transition-colors disabled:opacity-50"
                  >
                    {submitting ? 'Recording...' : 'Submit Supervisor Review'}
                  </button>
                  <button
                    onClick={() => onOpenFinding(activeFinding)}
                    className="px-3 py-2 bg-[#1C2541] hover:bg-[#2D3A5F] text-slate-300 text-xs rounded transition-colors"
                  >
                    Evidence
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-24 text-center text-slate-500 font-mono text-xs">
              Select an item on the left to view evidence and record supervisory determination.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
