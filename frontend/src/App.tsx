import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Shield, AlertTriangle, FileText, CheckCircle, Clock } from 'lucide-react';
import ReactECharts from 'echarts-for-react';

const API_URL = 'http://localhost:8000/api';

function App() {
  const [summary, setSummary] = useState({ total_alerts: 0, total_cases: 0, analytics_confidence_score: 0 });
  const [executionGaps, setExecutionGaps] = useState([]);
  const [nlpFindings, setNlpFindings] = useState([]);
  const [negativeSpace, setNegativeSpace] = useState([]);
  const [peerBenchmarks, setPeerBenchmarks] = useState([]);
  const [loading, setLoading] = useState(true);

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

    fetchSummary();
    fetchGaps();
    fetchNlp();
    fetchNegativeSpace();
    fetchPeerBenchmarks();
  }, []);

  const gaugeOption = {
    series: [
      {
        type: 'gauge',
        startAngle: 180,
        endAngle: 0,
        min: 0,
        max: 100,
        splitNumber: 10,
        itemStyle: {
          color: summary.analytics_confidence_score > 80 ? '#10B981' : '#F59E0B'
        },
        progress: {
          show: true,
          width: 18
        },
        pointer: {
          show: false
        },
        axisLine: {
          lineStyle: {
            width: 18
          }
        },
        axisTick: {
          show: false
        },
        splitLine: {
          show: false
        },
        axisLabel: {
          show: false
        },
        title: {
          show: false
        },
        detail: {
          valueAnimation: true,
          formatter: '{value}%',
          color: '#fff',
          fontSize: 30,
          offsetCenter: [0, '20%']
        },
        data: [
          {
            value: summary.analytics_confidence_score,
            name: 'Confidence'
          }
        ]
      }
    ]
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background text-white">Loading Command Centre...</div>;
  }

  return (
    <div className="min-h-screen bg-background text-white p-8">
      <header className="flex items-center justify-between mb-8 border-b border-gray-800 pb-4">
        <div className="flex items-center space-x-3">
          <Shield className="text-primary w-8 h-8" />
          <h1 className="text-2xl font-bold tracking-wider">SAT-SA NEXUS <span className="text-gray-500 text-sm font-normal">Supervisory Command Centre</span></h1>
        </div>
        <div className="text-sm text-gray-400">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-card rounded-xl p-6 border border-gray-800 flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm uppercase tracking-wider mb-1">Total Alerts Ingested</p>
            <h2 className="text-3xl font-bold">{summary.total_alerts}</h2>
          </div>
          <AlertTriangle className="text-yellow-500 w-10 h-10 opacity-50" />
        </div>
        
        <div className="bg-card rounded-xl p-6 border border-gray-800 flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm uppercase tracking-wider mb-1">Cases Processed</p>
            <h2 className="text-3xl font-bold">{summary.total_cases}</h2>
          </div>
          <FileText className="text-blue-500 w-10 h-10 opacity-50" />
        </div>
        
        <div className="bg-card rounded-xl p-6 border border-gray-800 flex items-center justify-between relative overflow-hidden">
          <div className="z-10">
            <p className="text-gray-400 text-sm uppercase tracking-wider mb-1">Analytics Confidence</p>
            <div className="mt-[-20px] ml-[-20px] w-[200px] h-[120px]">
              <ReactECharts option={gaugeOption} style={{ height: '100%', width: '100%' }} />
            </div>
          </div>
          <CheckCircle className="text-accent w-10 h-10 opacity-20 absolute right-6 top-6" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Execution Gaps Panel */}
        <div className="bg-card rounded-xl border border-gray-800 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-800 bg-gray-900/50 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="text-danger w-5 h-5" />
              <h3 className="font-semibold text-lg">Execution Gap Engine</h3>
            </div>
            <span className="bg-danger/20 text-danger px-3 py-1 rounded-full text-xs font-bold">{executionGaps.length} Findings</span>
          </div>
          <div className="p-4 flex-1 overflow-y-auto max-h-[400px]">
            {executionGaps.length === 0 ? (
              <p className="text-gray-500 italic">No execution gaps detected.</p>
            ) : (
              <div className="space-y-4">
                {executionGaps.map((gap, idx) => (
                  <div key={idx} className="bg-[#1C2331] p-4 rounded-lg border border-red-900/30">
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
                    <p className="text-sm text-gray-300 mb-3">{gap.description}</p>
                    <div className="bg-black/40 rounded p-2 text-xs font-mono text-gray-400">
                      Entity: {gap.entity_id} | Alert: {gap.evidence.alert_id} 
                      {gap.type === 'Fast Closure' && ` | Closed In: ${gap.evidence.time_to_close}s`}
                      {gap.type === 'Shallow Investigation' && ` | Actions: ${gap.evidence.actions_logged}`}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* NLP Templated Investigations Panel */}
        <div className="bg-card rounded-xl border border-gray-800 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-800 bg-gray-900/50 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="text-orange-400 w-5 h-5" />
              <h3 className="font-semibold text-lg">NLP Anomalies (Copy-Paste)</h3>
            </div>
            <span className="bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-xs font-bold">{nlpFindings.length} Findings</span>
          </div>
          <div className="p-4 flex-1 overflow-y-auto max-h-[400px]">
            {nlpFindings.length === 0 ? (
              <p className="text-gray-500 italic">No templated investigations detected.</p>
            ) : (
              <div className="space-y-4">
                {nlpFindings.map((finding, idx) => (
                  <div key={idx} className="bg-[#1C2331] p-4 rounded-lg border border-orange-900/30">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-mono text-xs text-blue-400">{finding.finding_id}</span>
                      <span className="bg-orange-500/20 text-orange-400 text-xs px-2 py-0.5 rounded border border-orange-500/30">Medium Priority</span>
                    </div>
                    <p className="text-sm text-gray-300 mb-3">{finding.description}</p>
                    <div className="bg-black/40 rounded p-2 text-xs text-gray-400 italic border-l-2 border-orange-500/50">
                      "{finding.evidence.text_snippet}"
                    </div>
                    <div className="mt-2 text-xs text-gray-500 font-mono">
                      Cases: {finding.evidence.case_ids.join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Bottom Grid for Negative Space & Peer Benchmarking */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        
        {/* Negative Space Engine Panel */}
        <div className="bg-card rounded-xl border border-gray-800 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-800 bg-gray-900/50 flex items-center justify-between">
            <div className="flex items-center space-x-2">
            <AlertTriangle className="text-purple-400 w-5 h-5" />
            <h3 className="font-semibold text-lg">Negative Space Engine (Missing Evidence)</h3>
          </div>
          <span className="bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full text-xs font-bold">{negativeSpace.length} Findings</span>
        </div>
        <div className="p-4 flex-1 overflow-y-auto max-h-[400px]">
          {negativeSpace.length === 0 ? (
            <p className="text-gray-500 italic">No missing evidence detected.</p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {negativeSpace.map((finding, idx) => (
                <div key={idx} className="bg-[#1C2331] p-4 rounded-lg border border-purple-900/30">
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
                  <p className="text-sm text-gray-300 mb-3">{finding.description}</p>
                  <div className="bg-black/40 rounded p-2 text-xs font-mono text-gray-400">
                    Entity: {finding.entity_id} | Type: {finding.type}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
        
      {/* Peer Benchmarking Panel */}
        <div className="bg-card rounded-xl border border-gray-800 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-800 bg-gray-900/50 flex items-center justify-between">
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
              <p className="text-gray-500 italic">No peer anomalies detected.</p>
            ) : (
              <div className="space-y-4">
                {peerBenchmarks.map((finding, idx) => (
                  <div key={idx} className="bg-[#1C2331] p-4 rounded-lg border border-indigo-900/30">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-mono text-xs text-blue-400">{finding.finding_id}</span>
                      <span className="bg-red-500/20 text-red-400 text-xs px-2 py-0.5 rounded border border-red-500/30">High Priority</span>
                    </div>
                    <p className="text-sm text-gray-300 mb-3">{finding.description}</p>
                    <div className="bg-black/40 rounded p-2 text-xs font-mono text-gray-400">
                      Entity: {finding.entity_id} | Entity Median: {finding.evidence.entity_median_s}s | Peer Median: {finding.evidence.peer_median_s}s
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;
