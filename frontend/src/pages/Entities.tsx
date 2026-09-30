import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Building2, AlertTriangle, ChevronRight, Shield, Target, Activity } from 'lucide-react';
import { cn } from '../lib/utils';

const API_URL = 'http://localhost:8000/api';

interface EntityPriority {
  entity_id: string;
  score: number;
  critical_findings: number;
  high_findings: number;
  total_findings: number;
  findings_summary: any[];
}

export function Entities() {
  const [search, setSearch] = useState('');

  const { data: queue = [], isLoading } = useQuery<EntityPriority[]>({
    queryKey: ['entities-priority'],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/entities/priority-queue`);
      return res.data.queue || [];
    }
  });

  const filteredQueue = queue.filter(e => e.entity_id.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex items-center justify-between border-b border-slate-800 pb-6">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
            <Building2 className="text-blue-400 w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Entity Supervisory Priority</h1>
            <p className="text-sm text-slate-400 mt-1">Supervisory Priority Score (SPS) ranking based on verified gaps</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Activity className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search entity..."
              className="pl-9 pr-4 py-2 bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-slate-200 w-64"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-blue-400">
          <Activity className="w-8 h-8 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQueue.map((entity, i) => (
            <div key={entity.entity_id} className="bg-card rounded-2xl border border-slate-800 p-6 hover:border-blue-500/50 transition-colors group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Target className="w-24 h-24 text-blue-500" />
              </div>
              
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold bg-blue-500/20 text-blue-400 px-2 py-1 rounded">#{i + 1}</span>
                    <h3 className="font-bold text-lg text-white truncate max-w-[150px]" title={entity.entity_id}>{entity.entity_id}</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-white">{entity.score}</span>
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">SPS Score</p>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-center text-sm border-b border-slate-800/50 pb-2">
                    <span className="text-slate-400">Critical Findings</span>
                    <span className={cn("font-mono font-medium", entity.critical_findings > 0 ? "text-red-400" : "text-slate-500")}>{entity.critical_findings}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-b border-slate-800/50 pb-2">
                    <span className="text-slate-400">High Findings</span>
                    <span className={cn("font-mono font-medium", entity.high_findings > 0 ? "text-orange-400" : "text-slate-500")}>{entity.high_findings}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">Total Verified Gaps</span>
                    <span className="font-mono text-slate-200">{entity.total_findings}</span>
                  </div>
                </div>

                <button className="w-full py-2.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 group/btn">
                  View Entity Profile
                  <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
