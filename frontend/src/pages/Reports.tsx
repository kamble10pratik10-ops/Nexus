import { useEffect, useState } from "react";
import axios from "axios";
import { AlertCircle, CheckCircle2 } from "lucide-react";

const API_URL = "http://localhost:8000/api";

export function Reports() {
  const [efficacy, setEfficacy] = useState<any>(null);
  const [coverage, setCoverage] = useState<any>(null);
  const [failed, setFailed] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    Promise.allSettled([
      axios.get(`${API_URL}/reports/efficacy`),
      axios.get(`${API_URL}/reports/coverage-index`),
    ])
      .then(([effRes, covRes]) => {
        if (effRes.status === "fulfilled") setEfficacy(effRes.value.data);
        else setFailed((current) => [...current, "efficacy"]);
        if (covRes.status === "fulfilled") setCoverage(covRes.value.data);
        else setFailed((current) => [...current, "coverage"]);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="page-shell flex min-h-[60vh] items-center justify-center text-slate-400">
        Loading validation reports…
      </div>
    );
  const efficacyMetrics = efficacy
    ? [
        [
          "Critical SLA compliance",
          `${efficacy.soc_cmm_domains.Business.critical_sla_compliance_rate.toFixed(1)}%`,
        ],
        [
          "Automation offload",
          `${efficacy.soc_cmm_domains.People.automation_offload_rate.toFixed(1)}%`,
        ],
        [
          "Deep investigation rate",
          `${efficacy.soc_cmm_domains.Process.deep_investigation_rate.toFixed(1)}%`,
        ],
        [
          "Zero-action closures",
          efficacy.soc_cmm_domains.Process.zero_action_closures,
        ],
      ]
    : [];
  const generatedAt = efficacy?.report_generated_at
    ? new Date(efficacy.report_generated_at)
    : null;

  return (
    <div className="page-shell space-y-8">
      <header className="page-header">
        <p className="page-eyebrow">Independent validation</p>
        <h1 className="page-title">Reports and validation</h1>
        <p className="page-description">
          Operational efficacy, coverage proof, and source-utilisation measures
          derived from submitted telemetry.
        </p>
      </header>
      {failed.length > 0 && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200"
        >
          <AlertCircle className="h-5 w-5" />
          {failed.length === 2
            ? "Report data could not be loaded."
            : `${failed[0] === "efficacy" ? "Operational efficacy" : "Coverage index"} data could not be loaded.`}
        </div>
      )}
      {efficacy && (
        <section className="panel">
          <div className="panel-header flex-col items-start gap-2 sm:flex-row sm:items-center">
            <div>
              <p className="page-eyebrow">SOC capability maturity</p>
              <h2 className="text-lg font-semibold text-white">
                Operational efficacy
              </h2>
            </div>
            {generatedAt && !Number.isNaN(generatedAt.getTime()) && (
              <time
                className="text-xs text-slate-500"
                dateTime={generatedAt.toISOString()}
              >
                Generated {generatedAt.toLocaleString()}
              </time>
            )}
          </div>
          <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-4">
            {efficacyMetrics.map(([label, value]) => (
              <div
                key={String(label)}
                className="rounded-xl border border-slate-800 bg-slate-950/25 p-4"
              >
                <p className="metric-label">{label}</p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {value}
                </p>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-800 p-5">
            <h3 className="text-sm font-semibold text-slate-200">
              24×7 coverage proof · MTTR by shift
            </h3>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[460px] text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="pb-3">Shift</th>
                    <th className="pb-3 text-right">Mean time to respond</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {Object.entries(efficacy.coverage_proof.shift_breakdown).map(
                    ([shift, data]: any) => (
                      <tr key={shift}>
                        <td className="py-3 text-slate-300">{shift}</td>
                        <td className="py-3 text-right font-mono text-blue-300">
                          {data.mttr_minutes.toFixed(0)} min
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
      {coverage && (
        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="page-eyebrow">Detection landscape</p>
              <h2 className="text-lg font-semibold text-white">
                Coverage index
              </h2>
            </div>
          </div>
          <div className="grid gap-8 p-5 lg:grid-cols-[18rem_1fr]">
            <div>
              <p className="metric-label">Validated technique coverage</p>
              <p className="mt-2 text-4xl font-semibold text-white">
                {coverage.validated_technique_coverage.coverage_percentage}%
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                {coverage.validated_technique_coverage.techniques_firing} of{" "}
                {
                  coverage.validated_technique_coverage
                    .total_expected_techniques
                }{" "}
                expected techniques are firing.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-200">
                Log source utilisation
              </h3>
              <div className="mt-4 space-y-4">
                {Object.entries(
                  coverage.log_source_utilization_percentages,
                ).map(([source, raw]: any) => {
                  const pct = Number(raw);
                  return (
                    <div key={source}>
                      <div className="mb-1.5 flex justify-between text-sm">
                        <span className="text-slate-300">{source}</span>
                        <span className="font-mono text-slate-400">
                          {pct.toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                        <div
                          className="h-full rounded-full bg-blue-500"
                          style={{
                            width: `${Math.min(Math.max(pct, 0), 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3 border-t border-slate-800 px-5 py-4 text-sm text-slate-300">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-300" />
            <span>{coverage.rule_level_silence.coverage_decay_status}</span>
          </div>
        </section>
      )}
      {!efficacy && !coverage && failed.length === 2 && (
        <div className="panel p-12 text-center text-slate-500">
          No report content is currently available.
        </div>
      )}
    </div>
  );
}
