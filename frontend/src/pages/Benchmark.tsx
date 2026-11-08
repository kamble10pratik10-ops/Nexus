import { useEffect, useState } from "react";
import axios from "axios";
import { CheckCircle2, AlertTriangle, Clock, Database, BarChart3, Activity } from "lucide-react";

const API_URL = "http://localhost:8000/api";

type BenchmarkReport = {
  manifest: {
    dataset_hash: string;
    ruleset_version: string;
    commit_hash: string;
    timestamp: number;
    corpus_tiers: string[];
  };
  evaluation: {
    level_1: { name: string; score: number; details: string };
    level_2: { name: string; score: number; details: string };
    level_3: { name: string; score: number; details: string };
  };
  metrics: {
    confirmed_findings_per_100_cases: number;
    review_minutes_per_defect: number;
    search_space_reduction_pct: number;
    unverifiable_handled_pct: number;
  };
  baselines: {
    random_sampling_multiplier: number;
    threshold_rules_multiplier: number;
  };
};

export function Benchmark() {
  const [report, setReport] = useState<BenchmarkReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    axios
      .get(`${API_URL}/benchmarking/report`)
      .then((r) => {
        setReport(r.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(true);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="page-shell flex min-h-[60vh] items-center justify-center text-slate-400">
        Executing Engine Benchmark...
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="page-shell flex min-h-[60vh] items-center justify-center text-red-400">
        Failed to load benchmark report. Ensure the backend is running.
      </div>
    );
  }

  return (
    <div className="page-shell space-y-8">
      <header className="page-header flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <p className="page-eyebrow">Assurance Proof</p>
          <h1 className="page-title">Engine Benchmark Report</h1>
          <p className="page-description">
            Quantifying supervisory workload reduction and detection correctness against the ground-truth corpus.
          </p>
        </div>
      </header>

      {/* Operational Metrics (Multiplier & Workload) */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="metric-card bg-blue-900/20 border-blue-500/30">
          <p className="metric-label flex items-center gap-2"><Activity className="w-4 h-4 text-blue-400"/> Search Space Reduced</p>
          <p className="metric-value text-blue-300">
            {report.metrics.search_space_reduction_pct.toFixed(1)}%
          </p>
          <p className="mt-2 text-xs text-slate-400">Supervisory triage volume reduction</p>
        </div>
        <div className="metric-card bg-emerald-900/20 border-emerald-500/30">
          <p className="metric-label flex items-center gap-2"><Clock className="w-4 h-4 text-emerald-400"/> Time-to-Defect</p>
          <p className="metric-value text-emerald-300">
            {report.metrics.review_minutes_per_defect.toFixed(1)}m
          </p>
          <p className="mt-2 text-xs text-slate-400">Review minutes per confirmed defect</p>
        </div>
        <div className="metric-card bg-orange-900/20 border-orange-500/30">
          <p className="metric-label flex items-center gap-2"><BarChart3 className="w-4 h-4 text-orange-400"/> Multiplier Effect</p>
          <p className="metric-value text-orange-300">
            {report.baselines.random_sampling_multiplier.toFixed(1)}x
          </p>
          <p className="mt-2 text-xs text-slate-400">More defects found vs random sampling</p>
        </div>
        <div className="metric-card bg-purple-900/20 border-purple-500/30">
          <p className="metric-label flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-purple-400"/> Abstention Rate</p>
          <p className="metric-value text-purple-300">
            {report.metrics.unverifiable_handled_pct.toFixed(1)}%
          </p>
          <p className="mt-2 text-xs text-slate-400">Correctly labeled as UNVERIFIABLE</p>
        </div>
      </section>

      {/* Three Level Evaluation Model */}
      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="page-eyebrow">Strict Structured Matching</p>
            <h2 className="text-lg font-semibold text-white">Three-Level Evaluation Model</h2>
          </div>
        </div>
        <div className="p-5 grid gap-6 md:grid-cols-3">
          {[report.evaluation.level_1, report.evaluation.level_2, report.evaluation.level_3].map((level, i) => (
            <div key={level.name} className="flex flex-col rounded-lg border border-slate-800 bg-slate-900/50 p-4">
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-semibold text-slate-300">Level {i + 1}: {level.name}</span>
                <span className="font-mono font-bold text-emerald-400">{level.score}%</span>
              </div>
              <div className="mt-auto h-2 w-full rounded-full bg-slate-800">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${level.score}%` }}></div>
              </div>
              <p className="mt-3 text-xs text-slate-400">{level.details}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Benchmark Manifest (Reproducibility) */}
      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="page-eyebrow">Reproducibility</p>
            <h2 className="text-lg font-semibold text-white">Benchmark Manifest</h2>
          </div>
        </div>
        <div className="p-5">
          <dl className="grid gap-x-4 gap-y-4 sm:grid-cols-2 lg:grid-cols-4 rounded-lg border border-slate-800 bg-slate-950/35 p-4">
            <div>
              <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Dataset Hash</dt>
              <dd className="mt-1 font-mono text-sm text-slate-300">{report.manifest.dataset_hash}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Ruleset Version</dt>
              <dd className="mt-1 font-mono text-sm text-slate-300">{report.manifest.ruleset_version}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Commit Hash</dt>
              <dd className="mt-1 font-mono text-sm text-slate-300">{report.manifest.commit_hash}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Run Timestamp</dt>
              <dd className="mt-1 font-mono text-sm text-slate-300">{new Date(report.manifest.timestamp * 1000).toLocaleString()}</dd>
            </div>
            <div className="col-span-full">
               <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-500 mb-1">Evaluated Corpus Tiers</dt>
               <dd className="flex gap-2">
                 {report.manifest.corpus_tiers.map(tier => (
                   <span key={tier} className="rounded-full bg-blue-500/10 border border-blue-500/20 px-2 py-1 text-xs text-blue-300">
                     {tier}
                   </span>
                 ))}
               </dd>
            </div>
          </dl>
        </div>
      </section>
    </div>
  );
}
