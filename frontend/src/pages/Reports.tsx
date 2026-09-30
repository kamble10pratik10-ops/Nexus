import { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart3, Activity, ShieldCheck, Clock, Zap, Target, CheckCircle2 } from 'lucide-react';

const API_URL = 'http://localhost:8000/api';

export function Reports() {
  const [efficacy, setEfficacy] = useState<any>(null);
  const [coverage, setCoverage] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      axios.get(`${API_URL}/reports/efficacy`),
      axios.get(`${API_URL}/reports/coverage-index`)
    ]).then(([effRes, covRes]) => {
      if (effRes.status === 'fulfilled') setEfficacy(effRes.value.data);
      if (covRes.status === 'fulfilled') setCoverage(covRes.value.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-indigo-400">
        <Activity className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex items-center justify-between border-b border-slate-800 pb-6">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
            <BarChart3 className="text-indigo-400 w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Reports & Validation</h1>
            <p className="text-sm text-slate-400 mt-1">Independent validation reports and operational efficacy benchmarks</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SOC CMM & Efficacy Report */}
        {efficacy && (
          <div className="bg-card rounded-2xl border border-slate-800 p-6 flex flex-col gap-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800/50">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                Operational Efficacy
              </h2>
              <span className="text-xs text-slate-500">As of {new Date(efficacy.report_generated_at).toLocaleString()}</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-800/50">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2 font-semibold">Critical SLA Compliance</p>
                <div className="text-3xl font-bold text-white">{efficacy.soc_cmm_domains.Business.critical_sla_compliance_rate.toFixed(1)}%</div>
              </div>
              <div className="p-4 bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-800/50">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2 font-semibold">Automation Offload</p>
                <div className="text-3xl font-bold text-white">{efficacy.soc_cmm_domains.People.automation_offload_rate.toFixed(1)}%</div>
              </div>
              <div className="p-4 bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-800/50">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2 font-semibold">Deep Investigation Rate</p>
                <div className="text-3xl font-bold text-white">{efficacy.soc_cmm_domains.Process.deep_investigation_rate.toFixed(1)}%</div>
              </div>
              <div className="p-4 bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-800/50">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2 font-semibold">Zero-Action Closures</p>
                <div className="text-3xl font-bold text-white">{efficacy.soc_cmm_domains.Process.zero_action_closures}</div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" /> 24x7 Coverage Proof (MTTR)
              </h3>
              <div className="space-y-3">
                {Object.entries(efficacy.coverage_proof.shift_breakdown).map(([shift, data]: any) => (
                  <div key={shift} className="flex justify-between items-center text-sm p-3 bg-slate-900/50 backdrop-blur-sm rounded-lg border border-slate-800/30">
                    <span className="text-slate-300 font-medium">{shift}</span>
                    <span className="font-mono text-indigo-300">{data.mttr_minutes.toFixed(0)} min</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Coverage Index Report */}
        {coverage && (
          <div className="bg-card rounded-2xl border border-slate-800 p-6 flex flex-col gap-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800/50">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-400" />
                Coverage Index
              </h2>
            </div>

            <div className="p-6 bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-800/50 relative overflow-hidden">
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1 font-semibold">Validated Technique Coverage</p>
                  <div className="text-4xl font-bold text-white mb-2">
                    {coverage.validated_technique_coverage.coverage_percentage}%
                  </div>
                  <p className="text-sm text-slate-400">
                    {coverage.validated_technique_coverage.techniques_firing} of {coverage.validated_technique_coverage.total_expected_techniques} expected techniques firing
                  </p>
                </div>
                <div className="w-24 h-24 rounded-full border-8 border-slate-800 flex items-center justify-center relative">
                  <div 
                    className="absolute inset-0 rounded-full border-8 border-emerald-500 border-l-transparent border-b-transparent transform rotate-45"
                    style={{ clipPath: `polygon(0 0, 100% 0, 100% ${coverage.validated_technique_coverage.coverage_percentage}%, 0 ${coverage.validated_technique_coverage.coverage_percentage}%)` }}
                  />
                  <Zap className="w-8 h-8 text-emerald-500" />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Log Source Utilization</h3>
              <div className="space-y-4">
                {Object.entries(coverage.log_source_utilization_percentages).map(([source, pct]: any) => (
                  <div key={source}>
                    <div className="flex justify-between items-center text-sm mb-1">
                      <span className="text-slate-300">{source}</span>
                      <span className="font-mono text-xs">{pct.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500/80 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mt-auto pt-4 border-t border-slate-800/50">
              <div className="flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-sm text-emerald-400">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <p>{coverage.rule_level_silence.coverage_decay_status}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
