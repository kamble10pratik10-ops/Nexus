import { useState, useEffect } from 'react';
import axios from 'axios';
import { Shield, AlertTriangle, FileText, Clock } from 'lucide-react';
import ClaimsVerificationMatrix from '../components/ClaimsVerificationMatrix';
import EvidenceReviewModal from '../components/EvidenceReviewModal';
import ReviewFindingButton from '../components/ReviewFindingButton';
import type { Finding } from '../components/types';

const API_URL = 'http://localhost:8000/api';

export function Overview() {
  const [summary, setSummary] = useState({ total_alerts: 0, total_cases: 0, data_quality: { case_coverage_pct: 0, field_completeness_pct: 0, linkage_integrity_pct: 0, asset_coverage_pct: 0, audit_trail_present: false, audit_event_count: 0 } });
  const [executionGaps, setExecutionGaps] = useState<Finding[]>([]);
  const [nlpFindings, setNlpFindings] = useState<Finding[]>([]);
  const [negativeSpace, setNegativeSpace] = useState<Finding[]>([]);
  const [peerBenchmarks, setPeerBenchmarks] = useState<Finding[]>([]);
  const [evidenceChains, setEvidenceChains] = useState<Finding[]>([]);
  const [capabilityDrift, setCapabilityDrift] = useState<Finding[]>([]);
  const [remediationEffectiveness, setRemediationEffectiveness] = useState<Finding[]>([]);
  const [adaptiveSampling, setAdaptiveSampling] = useState<Array<{ case_id: string; reason: string }>>([]);
  const [metricIntegrity, setMetricIntegrity] = useState<Finding[]>([]);
  const [evidenceForensics, setEvidenceForensics] = useState<Finding[]>([]);
  const [investigationQuality, setInvestigationQuality] = useState<Finding[]>([]);
  const [detectionDecay, setDetectionDecay] = useState<Finding[]>([]);
  const [capacityStress, setCapacityStress] = useState<Finding[]>([]);
  const [peerBlindspot, setPeerBlindspot] = useState<Finding[]>([]);
  const [priorityQueue, setPriorityQueue] = useState<Array<{ entity_id: string; score: number; critical_findings: number; high_findings: number; total_findings: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await axios.get(`${API_URL}/dashboard/summary`);
        setSummary(res.data);
      } catch (error) {
        console.error("Error fetching summary:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchGaps = async () => {
      try {
        const res = await axios.get(`${API_URL}/findings/execution-gaps`);
        setExecutionGaps(res.data.findings || []);
      } catch (error) {
        console.error("Error fetching gaps:", error);
      }
    };

    const fetchNlp = async () => {
      try {
        const res = await axios.get(`${API_URL}/findings/nlp-templated`);
        setNlpFindings(res.data.findings || []);
      } catch (error) {
        console.error("Error fetching NLP findings:", error);
      }
    };

    const fetchNegativeSpace = async () => {
      try {
        const res = await axios.get(`${API_URL}/findings/negative-space`);
        setNegativeSpace(res.data.findings || []);
      } catch (error) {
        console.error("Error fetching negative space findings:", error);
      }
    };

    const fetchPeerBenchmarks = async () => {
      try {
        const res = await axios.get(`${API_URL}/findings/peer-benchmarking`);
        setPeerBenchmarks(res.data.findings || []);
      } catch (error) {
        console.error("Error fetching peer benchmarks:", error);
      }
    };

    const fetchEvidenceChains = async () => {
      try {
        const res = await axios.get(`${API_URL}/findings/evidence-chains`);
        setEvidenceChains(res.data.findings || []);
      } catch (error) {
        console.error("Error fetching evidence chains:", error);
      }
    };

    const fetchPriorityQueue = async () => {
      try {
        const res = await axios.get(`${API_URL}/entities/priority-queue`);
        setPriorityQueue(res.data.queue || []);
      } catch (error) {
        console.error("Error fetching priority queue:", error);
      }
    };

    const fetchDrift = async () => {
      try {
        const res = await axios.get(`${API_URL}/findings/capability-drift`);
        setCapabilityDrift(res.data.findings || []);
      } catch (error) {
        console.error("Error fetching drift:", error);
      }
    };

    const fetchRemediation = async () => {
      try {
        const res = await axios.get(`${API_URL}/findings/remediation-effectiveness`);
        setRemediationEffectiveness(res.data.findings || []);
      } catch (error) {
        console.error("Error fetching remediation:", error);
      }
    };

    const fetchAdaptiveSampling = async () => {
      try {
        const res = await axios.get(`${API_URL}/findings/adaptive-sampling`);
        setAdaptiveSampling(res.data.sampled_cases || []);
      } catch (error) {
        console.error("Error fetching adaptive sampling:", error);
      }
    };

    const fetchMetricIntegrity = async () => {
      try {
        const res = await axios.get(`${API_URL}/findings/metric-integrity`);
        setMetricIntegrity(res.data.findings || []);
      } catch (error) {
        console.error("Error fetching metric integrity:", error);
      }
    };

    const fetchEvidenceForensics = async () => {
      try {
        const res = await axios.get(`${API_URL}/findings/evidence-forensics`);
        setEvidenceForensics(res.data.findings || []);
      } catch (error) {
        console.error("Error fetching evidence forensics:", error);
      }
    };

    const fetchInvestigationQuality = async () => {
      try {
        const res = await axios.get(`${API_URL}/findings/investigation-quality`);
        setInvestigationQuality(res.data.findings || []);
      } catch (error) {
        console.error("Error fetching investigation quality:", error);
      }
    };

    fetchSummary();
    fetchGaps();
    fetchNlp();
    fetchNegativeSpace();
    fetchPeerBenchmarks();
    fetchEvidenceChains();
    fetchDrift();
    fetchRemediation();
    fetchAdaptiveSampling();
    fetchMetricIntegrity();
    fetchEvidenceForensics();
    fetchInvestigationQuality();

    const fetchDetectionDecay = async () => {
      try {
        const res = await axios.get(`${API_URL}/findings/detection-decay`);
        setDetectionDecay(res.data.findings || []);
      } catch (error) {
        console.error("Error fetching detection decay:", error);
      }
    };

    const fetchCapacityStress = async () => {
      try {
        const res = await axios.get(`${API_URL}/findings/capacity-stress`);
        setCapacityStress(res.data.findings || []);
      } catch (error) {
        console.error("Error fetching capacity stress:", error);
      }
    };

    const fetchPeerBlindspot = async () => {
      try {
        const res = await axios.get(`${API_URL}/findings/peer-blindspot`);
        setPeerBlindspot(res.data.findings || []);
      } catch (error) {
        console.error("Error fetching peer blindspot:", error);
      }
    };

    fetchDetectionDecay();
    fetchCapacityStress();
    fetchPeerBlindspot();
    fetchPriorityQueue();
  }, []);

  const dq = summary.data_quality;

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background text-white">Loading Command Centre...</div>;
  }

  return (
    <div className="min-h-screen bg-background text-white p-8">
      <header className="flex items-center justify-between mb-8 border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <Shield className="text-primary w-8 h-8" />
          <h1 className="text-2xl font-bold tracking-wider">SAT-SA NEXUS <span className="text-slate-500 text-sm font-normal">Supervisory Command Centre</span></h1>
        </div>
        <div className="text-sm text-slate-400">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-card rounded-xl p-6 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-sm uppercase tracking-wider mb-1">Total Alerts Ingested</p>
            <h2 className="text-3xl font-bold">{summary.total_alerts}</h2>
          </div>
          <AlertTriangle className="text-yellow-500 w-10 h-10 opacity-50" />
        </div>
        
        <div className="bg-card rounded-xl p-6 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-sm uppercase tracking-wider mb-1">Cases Processed</p>
            <h2 className="text-3xl font-bold">{summary.total_cases}</h2>
          </div>
          <FileText className="text-blue-500 w-10 h-10 opacity-50" />
        </div>
        
        <div className="bg-card rounded-xl p-6 border border-slate-800 relative overflow-hidden">
          <div className="z-10">
            <p className="text-slate-400 text-sm uppercase tracking-wider mb-3">Submission Data Quality</p>
            <div className="space-y-2">
              {[
                { label: 'Case Coverage', value: dq.case_coverage_pct },
                { label: 'Field Completeness', value: dq.field_completeness_pct },
                { label: 'Linkage Integrity', value: dq.linkage_integrity_pct },
                { label: 'Asset Coverage', value: dq.asset_coverage_pct },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 w-[110px] shrink-0">{item.label}</span>
                  <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${item.value >= 90 ? 'bg-emerald-500' : item.value >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${Math.min(item.value, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono w-[40px] text-right">{item.value}%</span>
                </div>
              ))}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs text-slate-400 w-[110px] shrink-0">Audit Trail</span>
                <span className={`text-xs font-semibold ${dq.audit_trail_present ? 'text-emerald-400' : 'text-red-400'}`}>
                  {dq.audit_trail_present ? `✓ Present (${dq.audit_event_count} events)` : '✗ Missing'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ClaimsVerificationMatrix apiUrl={API_URL} />

      {/* Supervisory Priority Queue */}
      <div className="mb-8 bg-card rounded-xl border border-slate-800 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="text-primary w-5 h-5" />
            <h3 className="font-semibold text-lg">Supervisory Priority Queue</h3>
          </div>
          <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-xs font-bold">Top {priorityQueue.length} Entities</span>
        </div>
        <div className="p-4 overflow-x-auto">
          {priorityQueue.length === 0 ? (
            <p className="text-slate-500 italic">No entities to prioritize.</p>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-sm">
                  <th className="pb-3 pr-4">Rank</th>
                  <th className="pb-3 pr-4">Entity ID</th>
                  <th className="pb-3 pr-4">SPS Score</th>
                  <th className="pb-3 pr-4">Critical Findings</th>
                  <th className="pb-3 pr-4">High Findings</th>
                  <th className="pb-3">Total Findings</th>
                </tr>
              </thead>
              <tbody>
                {priorityQueue.map((entity, idx) => (
                  <tr key={idx} className="border-b border-slate-800/50 hover:bg-white/5 transition-colors">
                    <td className="py-3 pr-4 font-bold text-slate-300">#{idx + 1}</td>
                    <td className="py-3 pr-4 font-mono text-blue-400">{entity.entity_id}</td>
                    <td className="py-3 pr-4">
                      <span className="bg-red-500/20 text-red-400 px-2 py-1 rounded font-bold">{entity.score}</span>
                    </td>
                    <td className="py-3 pr-4 text-red-400 font-bold">{entity.critical_findings}</td>
                    <td className="py-3 pr-4 text-orange-400 font-bold">{entity.high_findings}</td>
                    <td className="py-3 text-slate-300">{entity.total_findings}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Execution Gaps Panel */}
        <div className="bg-card rounded-xl border border-slate-800 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="text-danger w-5 h-5" />
              <h3 className="font-semibold text-lg">Execution Gap Engine</h3>
            </div>
            <span className="bg-danger/20 text-danger px-3 py-1 rounded-full text-xs font-bold">{executionGaps.length} Findings</span>
          </div>
          <div className="p-4 flex-1 overflow-y-auto max-h-[400px]">
            {executionGaps.length === 0 ? (
              <p className="text-slate-500 italic">No execution gaps detected.</p>
            ) : (
              <div className="space-y-4">
                {executionGaps.map((gap, idx) => (
                  <div key={idx} className="bg-slate-800/40 backdrop-blur-sm p-4 rounded-lg border border-red-900/30">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-mono text-xs text-blue-400">{gap.finding_id}</span>
                      <span className={`text-xs px-2 py-0.5 rounded border ${
                        gap.severity === 'High' 
                          ? 'bg-red-500/20 text-red-400 border-red-500/30' 
                          : 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                      }`}>
                        {gap.severity} Priority
                      </span>
                    </div>
                    <p className="text-sm text-slate-300 mb-3">{gap.description}</p>
                    <div className="bg-black/40 rounded p-2 text-xs font-mono text-slate-400">
                      Entity: {gap.entity_id} | Alert: {gap.evidence.alert_id} 
                      {gap.type === 'Fast Closure' && ` | Closed In: ${gap.evidence.time_to_close}s`}
                      {gap.type === 'Shallow Investigation' && ` | Actions: ${gap.evidence.actions_logged}`}
                    </div>
                    <ReviewFindingButton finding={gap} onInspect={setSelectedFinding} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* NLP Templated Investigations Panel */}
        <div className="bg-card rounded-xl border border-slate-800 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="text-orange-400 w-5 h-5" />
              <h3 className="font-semibold text-lg">NLP Anomalies (Copy-Paste)</h3>
            </div>
            <span className="bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-xs font-bold">{nlpFindings.length} Findings</span>
          </div>
          <div className="p-4 flex-1 overflow-y-auto max-h-[400px]">
            {nlpFindings.length === 0 ? (
              <p className="text-slate-500 italic">No templated investigations detected.</p>
            ) : (
              <div className="space-y-4">
                {nlpFindings.map((finding, idx) => (
                  <div key={idx} className="bg-slate-800/40 backdrop-blur-sm p-4 rounded-lg border border-orange-900/30">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-mono text-xs text-blue-400">{finding.finding_id}</span>
                      <span className="bg-orange-500/20 text-orange-400 text-xs px-2 py-0.5 rounded border border-orange-500/30">Medium Priority</span>
                    </div>
                    <p className="text-sm text-slate-300 mb-3">{finding.description}</p>
                    <div className="bg-black/40 rounded p-2 text-xs text-slate-400 italic border-l-2 border-orange-500/50">
                      "{finding.evidence.text_snippet}"
                    </div>
                    <div className="mt-2 text-xs text-slate-500 font-mono">
                      Cases: {finding.evidence.case_ids.join(', ')}
                    </div>
                    <ReviewFindingButton finding={finding} onInspect={setSelectedFinding} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Bottom Grid for Negative Space & Peer Benchmarking & Evidence Chains */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        
        {/* Negative Space Engine Panel */}
        <div className="bg-card rounded-xl border border-slate-800 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
            <div className="flex items-center space-x-2">
            <AlertTriangle className="text-purple-400 w-5 h-5" />
            <h3 className="font-semibold text-lg">Negative Space Engine (Missing Evidence)</h3>
          </div>
          <span className="bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full text-xs font-bold">{negativeSpace.length} Findings</span>
        </div>
        <div className="p-4 flex-1 overflow-y-auto max-h-[400px]">
          {negativeSpace.length === 0 ? (
            <p className="text-slate-500 italic">No missing evidence detected.</p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {negativeSpace.map((finding, idx) => (
                <div key={idx} className="bg-slate-800/40 backdrop-blur-sm p-4 rounded-lg border border-purple-900/30">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-mono text-xs text-blue-400">{finding.finding_id}</span>
                    <span className={`text-xs px-2 py-0.5 rounded border ${
                      finding.severity === 'Critical' 
                        ? 'bg-red-500/20 text-red-400 border-red-500/30' 
                        : 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                    }`}>
                      {finding.severity} Priority
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 mb-3">{finding.description}</p>
                  <div className="bg-black/40 rounded p-2 text-xs font-mono text-slate-400">
                    Entity: {finding.entity_id} | Type: {finding.type}
                  </div>
                  <ReviewFindingButton finding={finding} onInspect={setSelectedFinding} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
        
      {/* Peer Benchmarking Panel */}
        <div className="bg-card rounded-xl border border-slate-800 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path>
              </svg>
              <h3 className="font-semibold text-lg">Peer Benchmarking</h3>
            </div>
            <span className="bg-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full text-xs font-bold">{peerBenchmarks.length} Findings</span>
          </div>
          <div className="p-4 flex-1 overflow-y-auto max-h-[400px]">
            {peerBenchmarks.length === 0 ? (
              <p className="text-slate-500 italic">No peer anomalies detected.</p>
            ) : (
              <div className="space-y-4">
                {peerBenchmarks.map((finding, idx) => (
                  <div key={idx} className="bg-slate-800/40 backdrop-blur-sm p-4 rounded-lg border border-indigo-900/30">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-mono text-xs text-blue-400">{finding.finding_id}</span>
                      <span className="bg-red-500/20 text-red-400 text-xs px-2 py-0.5 rounded border border-red-500/30">High Priority</span>
                    </div>
                    <p className="text-sm text-slate-300 mb-3">{finding.description}</p>
                    <div className="bg-black/40 rounded p-2 text-xs font-mono text-slate-400">
                      Entity: {finding.entity_id} | Entity Median: {finding.evidence.entity_median_s}s | Peer Median: {finding.evidence.peer_median_s}s
                    </div>
                    <ReviewFindingButton finding={finding} onInspect={setSelectedFinding} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Evidence Chains Panel */}
        <div className="bg-card rounded-xl border border-slate-800 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
              </svg>
              <h3 className="font-semibold text-lg">Broken Evidence Chains</h3>
            </div>
            <span className="bg-pink-500/20 text-pink-400 px-3 py-1 rounded-full text-xs font-bold">{evidenceChains.length} Findings</span>
          </div>
          <div className="p-4 flex-1 overflow-y-auto max-h-[400px]">
            {evidenceChains.length === 0 ? (
              <p className="text-slate-500 italic">No broken evidence chains detected.</p>
            ) : (
              <div className="space-y-4">
                {evidenceChains.map((finding, idx) => (
                  <div key={idx} className="bg-slate-800/40 backdrop-blur-sm p-4 rounded-lg border border-pink-900/30">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-mono text-xs text-blue-400">{finding.finding_id}</span>
                      <span className="bg-red-500/20 text-red-400 text-xs px-2 py-0.5 rounded border border-red-500/30">Critical Priority</span>
                    </div>
                    <p className="text-sm text-slate-300 mb-3">{finding.description}</p>
                    <div className="bg-black/40 rounded p-2 text-xs font-mono text-slate-400">
                      Entity: {finding.entity_id} | Alert: {finding.evidence.alert_id} | Case: {finding.evidence.case_id}
                    </div>
                    <ReviewFindingButton finding={finding} onInspect={setSelectedFinding} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        
        {/* Capability Drift & Remediation */}
        <div className="bg-card rounded-xl border border-slate-800 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
              </svg>
              <h3 className="font-semibold text-lg">Capability Drift & Remediation</h3>
            </div>
            <span className="bg-teal-500/20 text-teal-400 px-3 py-1 rounded-full text-xs font-bold">{capabilityDrift.length + remediationEffectiveness.length} Findings</span>
          </div>
          <div className="p-4 flex-1 overflow-y-auto max-h-[400px]">
            {capabilityDrift.length === 0 && remediationEffectiveness.length === 0 ? (
              <p className="text-slate-500 italic">No capability drift or ineffective remediation detected.</p>
            ) : (
              <div className="space-y-4">
                {capabilityDrift.map((finding, idx) => (
                  <div key={`drift-${idx}`} className="bg-slate-800/40 backdrop-blur-sm p-4 rounded-lg border border-teal-900/30">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-mono text-xs text-blue-400">{finding.finding_id}</span>
                      <span className="bg-red-500/20 text-red-400 text-xs px-2 py-0.5 rounded border border-red-500/30">High Priority</span>
                    </div>
                    <p className="text-sm text-slate-300 mb-3">{finding.description}</p>
                    <ReviewFindingButton finding={finding} onInspect={setSelectedFinding} />
                  </div>
                ))}
                {remediationEffectiveness.map((finding, idx) => (
                  <div key={`remed-${idx}`} className="bg-slate-800/40 backdrop-blur-sm p-4 rounded-lg border border-teal-900/30">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-mono text-xs text-blue-400">{finding.finding_id}</span>
                      <span className="bg-orange-500/20 text-orange-400 text-xs px-2 py-0.5 rounded border border-orange-500/30">Medium Priority</span>
                    </div>
                    <p className="text-sm text-slate-300 mb-3">{finding.description}</p>
                    <ReviewFindingButton finding={finding} onInspect={setSelectedFinding} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Adaptive Sampling Queue */}
        <div className="bg-card rounded-xl border border-slate-800 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path>
              </svg>
              <h3 className="font-semibold text-lg">Adaptive Sampling Queue</h3>
            </div>
            <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-bold">{adaptiveSampling.length} Cases</span>
          </div>
          <div className="p-4 flex-1 overflow-y-auto max-h-[400px]">
            {adaptiveSampling.length === 0 ? (
              <p className="text-slate-500 italic">No cases sampled.</p>
            ) : (
              <div className="space-y-4">
                {adaptiveSampling.map((sample, idx) => (
                  <div key={idx} className="bg-slate-800/40 backdrop-blur-sm p-4 rounded-lg border border-green-900/30">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-mono text-xs text-blue-400">{sample.case_id}</span>
                    </div>
                    <p className="text-sm text-slate-300"><span className="text-green-400 font-semibold">Reason:</span> {sample.reason}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ═══ NEW ENGINES: Metric Integrity, Evidence Forensics, Investigation Quality ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">

        {/* Metric Integrity Panel */}
        <div className="bg-card rounded-xl border border-slate-800 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
              </svg>
              <h3 className="font-semibold text-lg">Metric Integrity Auditor</h3>
            </div>
            <span className="bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full text-xs font-bold">{metricIntegrity.length} Findings</span>
          </div>
          <div className="p-4 flex-1 overflow-y-auto max-h-[400px]">
            {metricIntegrity.length === 0 ? (
              <p className="text-slate-500 italic">No metric integrity issues detected.</p>
            ) : (
              <div className="space-y-4">
                {metricIntegrity.map((finding, idx) => (
                  <div key={idx} className="bg-slate-800/40 backdrop-blur-sm p-4 rounded-lg border border-amber-900/30">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-mono text-xs text-blue-400">{finding.finding_id}</span>
                      <span className={`text-xs px-2 py-0.5 rounded border ${
                        finding.severity === 'High'
                          ? 'bg-red-500/20 text-red-400 border-red-500/30'
                          : 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                      }`}>
                        {finding.severity}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-amber-400 mb-1">{finding.type}</p>
                    <p className="text-sm text-slate-300">{finding.description}</p>
                    <ReviewFindingButton finding={finding} onInspect={setSelectedFinding} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Evidence Forensics Panel */}
        <div className="bg-card rounded-xl border border-slate-800 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"></path>
              </svg>
              <h3 className="font-semibold text-lg">Evidence Forensics</h3>
            </div>
            <span className="bg-rose-500/20 text-rose-400 px-3 py-1 rounded-full text-xs font-bold">{evidenceForensics.length} Findings</span>
          </div>
          <div className="p-4 flex-1 overflow-y-auto max-h-[400px]">
            {evidenceForensics.length === 0 ? (
              <p className="text-slate-500 italic">No evidence fabrication signals detected.</p>
            ) : (
              <div className="space-y-4">
                {evidenceForensics.map((finding, idx) => (
                  <div key={idx} className="bg-slate-800/40 backdrop-blur-sm p-4 rounded-lg border border-rose-900/30">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-mono text-xs text-blue-400">{finding.finding_id}</span>
                      <span className={`text-xs px-2 py-0.5 rounded border ${
                        finding.severity === 'Critical'
                          ? 'bg-red-500/20 text-red-400 border-red-500/30'
                          : finding.severity === 'High'
                            ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                            : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                      }`}>
                        {finding.severity}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-rose-400 mb-1">{finding.type}</p>
                    <p className="text-sm text-slate-300">{finding.description}</p>
                    <ReviewFindingButton finding={finding} onInspect={setSelectedFinding} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Investigation Quality Panel */}
        <div className="bg-card rounded-xl border border-slate-800 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
              </svg>
              <h3 className="font-semibold text-lg">Investigation Quality</h3>
            </div>
            <span className="bg-cyan-500/20 text-cyan-400 px-3 py-1 rounded-full text-xs font-bold">{investigationQuality.length} Findings</span>
          </div>
          <div className="p-4 flex-1 overflow-y-auto max-h-[400px]">
            {investigationQuality.length === 0 ? (
              <p className="text-slate-500 italic">No investigation quality issues detected.</p>
            ) : (
              <div className="space-y-4">
                {investigationQuality.map((finding, idx) => (
                  <div key={idx} className="bg-slate-800/40 backdrop-blur-sm p-4 rounded-lg border border-cyan-900/30">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-mono text-xs text-blue-400">{finding.finding_id}</span>
                      <span className={`text-xs px-2 py-0.5 rounded border ${
                        finding.severity === 'Critical'
                          ? 'bg-red-500/20 text-red-400 border-red-500/30'
                          : 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                      }`}>
                        {finding.severity}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-cyan-400 mb-1">{finding.type}</p>
                    <p className="text-sm text-slate-300">{finding.description}</p>
                    <ReviewFindingButton finding={finding} onInspect={setSelectedFinding} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* === Detection Decay, Capacity Stress, Peer Blind-Spot === */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">

        {/* Detection Decay Panel */}
        <div className="bg-card rounded-xl border border-slate-800 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"></path>
              </svg>
              <h3 className="font-semibold text-lg">Silent Detection Decay</h3>
            </div>
            <span className="bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-xs font-bold">{detectionDecay.length} Findings</span>
          </div>
          <div className="p-4 flex-1 overflow-y-auto max-h-[400px]">
            {detectionDecay.length === 0 ? (
              <p className="text-slate-500 italic">No silent detection rules found.</p>
            ) : (
              <div className="space-y-4">
                {detectionDecay.map((finding, idx) => (
                  <div key={idx} className="bg-slate-800/40 backdrop-blur-sm p-4 rounded-lg border border-orange-900/30">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-mono text-xs text-blue-400">{finding.finding_id}</span>
                      <span className={`text-xs px-2 py-0.5 rounded border ${
                        finding.severity === 'Critical'
                          ? 'bg-red-500/20 text-red-400 border-red-500/30'
                          : 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                      }`}>
                        {finding.severity}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-orange-400 mb-1">{finding.type}</p>
                    <p className="text-sm text-slate-300">{finding.description}</p>
                    <ReviewFindingButton finding={finding} onInspect={setSelectedFinding} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Capacity Stress Panel */}
        <div className="bg-card rounded-xl border border-slate-800 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <h3 className="font-semibold text-lg">Capacity Stress Index</h3>
            </div>
            <span className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-xs font-bold">{capacityStress.length} Findings</span>
          </div>
          <div className="p-4 flex-1 overflow-y-auto max-h-[400px]">
            {capacityStress.length === 0 ? (
              <p className="text-slate-500 italic">No capacity stress signals detected.</p>
            ) : (
              <div className="space-y-4">
                {capacityStress.map((finding, idx) => (
                  <div key={idx} className="bg-slate-800/40 backdrop-blur-sm p-4 rounded-lg border border-yellow-900/30">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-mono text-xs text-blue-400">{finding.finding_id}</span>
                      <span className={`text-xs px-2 py-0.5 rounded border ${
                        finding.severity === 'High'
                          ? 'bg-red-500/20 text-red-400 border-red-500/30'
                          : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                      }`}>
                        {finding.severity}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-yellow-400 mb-1">{finding.type}</p>
                    <p className="text-sm text-slate-300">{finding.description}</p>
                    <ReviewFindingButton finding={finding} onInspect={setSelectedFinding} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Peer Blind-Spot Signal Panel */}
        <div className="bg-card rounded-xl border border-slate-800 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
              </svg>
              <h3 className="font-semibold text-lg">Peer Blind-Spot Signal</h3>
            </div>
            <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs font-bold">{peerBlindspot.length} Findings</span>
          </div>
          <div className="p-4 flex-1 overflow-y-auto max-h-[400px]">
            {peerBlindspot.length === 0 ? (
              <p className="text-slate-500 italic">No peer blind-spots detected.</p>
            ) : (
              <div className="space-y-4">
                {peerBlindspot.map((finding, idx) => (
                  <div key={idx} className="bg-slate-800/40 backdrop-blur-sm p-4 rounded-lg border border-red-900/30">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-mono text-xs text-blue-400">{finding.finding_id}</span>
                      <span className="bg-red-500/20 text-red-400 text-xs px-2 py-0.5 rounded border border-red-500/30">Critical</span>
                    </div>
                    <p className="text-xs font-semibold text-red-400 mb-1">{finding.type}</p>
                    <p className="text-sm text-slate-300">{finding.description}</p>
                    <ReviewFindingButton finding={finding} onInspect={setSelectedFinding} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
      {selectedFinding && <EvidenceReviewModal key={selectedFinding.finding_id} finding={selectedFinding} apiUrl={API_URL} onClose={() => setSelectedFinding(null)} />}
    </div>
  );
}
