import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  AlertOctagon,
  FileText,
  Clock,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { Finding } from '../../types';
import { SATSAApi } from '../../services/api';

interface FindingDetailModalProps {
  finding: Finding | null;
  onClose: () => void;
  onReviewed?: (updated: Finding) => void;
  onNavigateToEntity?: (entityId: string) => void;
}

export const FindingDetailModal: React.FC<FindingDetailModalProps> = ({
  finding,
  onClose,
  onReviewed,
  onNavigateToEntity
}) => {
  const [decision, setDecision] = useState<string>('CONFIRMED_GAP');
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [reviewedSuccess, setReviewedSuccess] = useState<boolean>(false);

  if (!finding) return null;

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await SATSAApi.reviewFinding(finding.id, decision, notes || 'Verified by supervisor during assessment session.');
      setReviewedSuccess(true);
      if (onReviewed) {
        onReviewed({
          ...finding,
          reviewed: true,
          review_decision: decision,
          review_notes: notes || 'Verified by supervisor.'
        });
      }
    } catch (err) {
      console.error('Failed to submit review:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const isExecutionGap = finding.finding_type === 'EXECUTION_GAP';
  const isNegativeSpace = finding.finding_type === 'NEGATIVE_SPACE';
  const isPeerDeviation = finding.finding_type === 'PEER_DEVIATION';

  const expectedSteps = finding.expected_workflow || ['Critical alert', 'Investigation', 'Escalation', 'Response'];
  const observedSteps = finding.observed_workflow || ['Critical alert', 'Closed'];

  // Formatter for evidence objects
  const renderEvidence = () => {
    const ev = finding.evidence || finding.supporting_evidence || {};
    return (
      <div className="bg-[#0B132B] border border-[#1C2541] rounded-lg p-3 font-mono text-xs text-slate-300 max-h-48 overflow-y-auto space-y-1">
        {Object.entries(ev).map(([key, val]) => (
          <div key={key} className="flex flex-col sm:flex-row gap-1">
            <span className="text-cyan-400 font-semibold min-w-44">{key.replace(/_/g, ' ')}:</span>
            <span className="text-slate-200 break-all">
              {Array.isArray(val) ? val.join(', ') : typeof val === 'object' ? JSON.stringify(val) : String(val)}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-[#0F172A] border border-[#2D3A5F] w-full max-w-3xl rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-100">
        
        {/* Top Header */}
        <div className="bg-[#0B132B] border-b border-[#1C2541] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span
              className={`text-xs font-bold px-3 py-1 rounded font-mono uppercase tracking-wider ${
                isExecutionGap
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : isNegativeSpace
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : isPeerDeviation
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}
            >
              {finding.finding_type.replace(/_/g, ' ')}
            </span>
            <span className="text-xs bg-red-950/60 border border-red-500/40 text-red-300 font-mono px-2 py-0.5 rounded font-bold">
              {finding.priority}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              CONFIDENCE: <strong className="text-cyan-400">{finding.confidence_pct || Math.round(finding.confidence * 100)}%</strong>
            </span>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-[#1C2541] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Finding Title & Entity */}
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">{finding.title}</h2>
            <div className="flex items-center space-x-3 mt-1.5 text-xs text-slate-400">
              <span>Entity:</span>
              <button
                onClick={() => {
                  if (onNavigateToEntity) onNavigateToEntity(finding.entity_id);
                  onClose();
                }}
                className="font-mono text-cyan-400 font-bold hover:underline flex items-center gap-1"
              >
                {finding.entity_id} {finding.entity_name && `(${finding.entity_name})`}
                <ExternalLink className="w-3 h-3" />
              </button>
              <span>&bull;</span>
              <span>Severity: <strong className="text-amber-300">{finding.severity}</strong></span>
              {finding.rule_id && (
                <>
                  <span>&bull;</span>
                  <span className="font-mono text-slate-400">Rule: {finding.rule_id}</span>
                </>
              )}
            </div>
          </div>

          {/* Section 14: WHY FLAGGED */}
          <div className="bg-[#131E3A] border border-[#2D3A5F] rounded-lg p-4">
            <div className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-cyan-400" />
              WHY FLAGGED
            </div>
            <p className="text-sm text-slate-200 leading-relaxed font-sans">
              {finding.why_flagged || finding.explanation}
            </p>
          </div>

          {/* Section 14: SUPPORTING EVIDENCE */}
          <div>
            <div className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-blue-400" />
              SUPPORTING EVIDENCE
            </div>
            {renderEvidence()}
          </div>

          {/* Section 14: WORKFLOW COMPARISON (EXPECTED vs OBSERVED) */}
          <div className="bg-[#0B132B] border border-[#1C2541] rounded-lg p-4 space-y-3">
            <div className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
              OPERATIONAL EVIDENCE WORKFLOW COMPARISON
            </div>

            {/* Expected Workflow */}
            <div>
              <div className="text-[11px] font-mono text-emerald-400 font-semibold mb-1">EXPECTED WORKFLOW:</div>
              <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
                {expectedSteps.map((step, idx) => (
                  <React.Fragment key={idx}>
                    <span className="bg-emerald-950/60 border border-emerald-600/40 text-emerald-300 px-2.5 py-1 rounded">
                      {step}
                    </span>
                    {idx < expectedSteps.length - 1 && <ArrowRight className="w-3.5 h-3.5 text-emerald-500" />}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Observed Workflow */}
            <div>
              <div className="text-[11px] font-mono text-red-400 font-semibold mb-1">OBSERVED WORKFLOW:</div>
              <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
                {observedSteps.map((step, idx) => (
                  <React.Fragment key={idx}>
                    <span className="bg-red-950/60 border border-red-600/40 text-red-300 px-2.5 py-1 rounded">
                      {step}
                    </span>
                    {idx < observedSteps.length - 1 && <ArrowRight className="w-3.5 h-3.5 text-red-500" />}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Missing Evidence */}
            {finding.missing_evidence && finding.missing_evidence.length > 0 && (
              <div className="pt-1 text-xs">
                <span className="font-mono text-amber-400 font-semibold">Missing Evidence: </span>
                <span className="text-slate-300 font-mono">
                  {finding.missing_evidence.join(', ')}
                </span>
              </div>
            )}
          </div>

          {/* Section 14: SUPERVISORY ACTION */}
          <div className="bg-[#18233C] border-l-4 border-cyan-400 p-4 rounded-r-lg">
            <div className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              SUPERVISORY ACTION
            </div>
            <p className="text-xs text-slate-200">
              {finding.supervisory_action || 'Review selected alert and case records to verify operational compliance.'}
            </p>
          </div>

          {/* Supervisor Review Decision Recording Form */}
          <div className="border-t border-[#1C2541] pt-4">
            <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-3">
              SUPERVISOR REVIEW RECORD
            </h3>

            {finding.reviewed || reviewedSuccess ? (
              <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-lg p-3 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>
                  Finding reviewed by supervisor. Decision:{' '}
                  <strong>{finding.review_decision || decision}</strong>
                </span>
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 mb-1">
                      SUPERVISORY DETERMINATION
                    </label>
                    <select
                      value={decision}
                      onChange={(e) => setDecision(e.target.value)}
                      className="w-full bg-[#0B132B] border border-[#2D3A5F] rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                    >
                      <option value="CONFIRMED_GAP">Confirmed Execution Gap</option>
                      <option value="NEGATIVE_SPACE_VERIFIED">Negative Space Verified</option>
                      <option value="SUPERVISORY_NOTICE_ISSUED">Issue Supervisory Notice to CISO</option>
                      <option value="EXPLAINED_FALSE_POSITIVE">False Positive / Legitimate Exemption</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 mb-1">
                      AUDIT NOTES / JUSTIFICATION
                    </label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add supervisor justification notes..."
                      className="w-full bg-[#0B132B] border border-[#2D3A5F] rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3 py-1.5 bg-[#1C2541] hover:bg-[#2D3A5F] text-xs text-slate-300 rounded transition-colors"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white rounded transition-colors disabled:opacity-50"
                  >
                    {submitting ? 'Recording...' : 'Record Supervisor Determination'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
