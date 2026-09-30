import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { ClipboardList, AlertCircle, Clock, CheckCircle2, XCircle, ArrowRight, Activity, Filter } from 'lucide-react';
import { cn } from '../lib/utils';
import type { Finding } from '../components/types';
import EvidenceReviewModal from '../components/EvidenceReviewModal';

const API_URL = 'http://localhost:8000/api';

export function ReviewQueue() {
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
  const [filter, setFilter] = useState('All');

  const { data: findings = [], isLoading } = useQuery<Finding[]>({
    queryKey: ['all-findings'],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/findings`);
      return res.data.findings || [];
    }
  });

  const queue = findings
    .filter(f => f.severity === 'Critical' || f.severity === 'High')
    .sort((a, b) => {
      if (a.severity === 'Critical' && b.severity !== 'Critical') return -1;
      if (a.severity !== 'Critical' && b.severity === 'Critical') return 1;
      return 0;
    });

  const filteredQueue = filter === 'All' ? queue : queue.filter(f => f.severity === filter);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex items-center justify-between border-b border-slate-800 pb-6">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20">
            <ClipboardList className="text-purple-400 w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Review Queue</h1>
            <p className="text-sm text-slate-400 mt-1">Critical and High severity gaps requiring supervisory validation</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {['All', 'Critical', 'High'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-4 py-2 text-sm font-semibold rounded-lg transition-colors border",
                filter === f 
                  ? "bg-purple-500/20 border-purple-500/50 text-purple-300" 
                  : "bg-slate-900/50 backdrop-blur-sm border-slate-800 text-slate-400 hover:border-slate-700"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-purple-400">
          <Activity className="w-8 h-8 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredQueue.map((finding) => (
            <div key={finding.finding_id} className="bg-card rounded-xl border border-slate-800 p-5 hover:border-slate-700 transition-colors flex flex-col md:flex-row gap-6">
              <div className="flex-1 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className={cn(
                        "px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded border",
                        finding.severity === 'Critical' ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-orange-500/10 text-orange-500 border-orange-500/20"
                      )}>
                        {finding.severity}
                      </span>
                      <span className="text-xs font-mono text-slate-500">ID: {finding.finding_id}</span>
                      <span className="text-xs text-slate-400 bg-slate-800/50 px-2 py-1 rounded">{finding.entity_id}</span>
                    </div>
                    <h3 className="text-base font-medium text-slate-200">{finding.description}</h3>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4 md:border-l md:border-slate-800 md:pl-6">
                <div className="text-sm text-slate-400 min-w-[120px]">
                  <p className="text-xs uppercase tracking-wider mb-1 font-semibold text-slate-500">Suggested Action</p>
                  <p>{finding.outcome || 'Review Required'}</p>
                </div>
                <button
                  onClick={() => setSelectedFinding(finding)}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                  Review Evidence
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {filteredQueue.length === 0 && (
            <div className="text-center py-20 border border-dashed border-slate-800 rounded-xl bg-card/50">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold text-slate-300">Queue is empty</h3>
              <p className="text-slate-500 mt-1">No pending items match the current filter.</p>
            </div>
          )}
        </div>
      )}

      {selectedFinding && (
        <EvidenceReviewModal
          key={selectedFinding.finding_id}
          finding={selectedFinding}
          apiUrl={API_URL}
          onClose={() => setSelectedFinding(null)}
        />
      )}
    </div>
  );
}
