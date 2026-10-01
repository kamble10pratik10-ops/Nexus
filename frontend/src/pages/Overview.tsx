import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { ChevronDown } from "lucide-react";
import ClaimsVerificationMatrix from "../components/ClaimsVerificationMatrix";
import EvidenceReviewModal from "../components/EvidenceReviewModal";
import ReviewFindingButton from "../components/ReviewFindingButton";
import type { Finding } from "../components/types";

const API_URL = "http://localhost:8000/api";

type Summary = {
  total_alerts: number;
  total_cases: number;
  data_quality: {
    case_coverage_pct: number;
    field_completeness_pct: number;
    linkage_integrity_pct: number;
    asset_coverage_pct: number;
    audit_trail_present: boolean;
    audit_event_count: number;
  };
};

type QueueEntity = {
  entity_id: string;
  score: number;
  critical_findings: number;
  high_findings: number;
  total_findings: number;
};

type EngineKey =
  | "executionGaps"
  | "nlpFindings"
  | "negativeSpace"
  | "peerBenchmarks"
  | "evidenceChains"
  | "capabilityDrift"
  | "remediationEffectiveness"
  | "metricIntegrity"
  | "evidenceForensics"
  | "investigationQuality"
  | "detectionDecay"
  | "capacityStress"
  | "peerBlindspot";

const EMPTY_SUMMARY: Summary = {
  total_alerts: 0,
  total_cases: 0,
  data_quality: {
    case_coverage_pct: 0,
    field_completeness_pct: 0,
    linkage_integrity_pct: 0,
    asset_coverage_pct: 0,
    audit_trail_present: false,
    audit_event_count: 0,
  },
};

const engineMeta: Array<{
  key: EngineKey;
  title: string;
  description: string;
  empty: string;
  category:
    | "Evidence integrity"
    | "Investigation quality"
    | "Operational resilience";
}> = [
  {
    key: "executionGaps",
    title: "Execution gaps",
    description: "Closure speed and investigation-depth anomalies.",
    empty: "No execution gaps detected.",
    category: "Investigation quality",
  },
  {
    key: "nlpFindings",
    title: "Templated investigations",
    description: "Narrative similarity and copy-paste signals.",
    empty: "No templated investigations detected.",
    category: "Investigation quality",
  },
  {
    key: "investigationQuality",
    title: "Investigation quality",
    description: "Signals that case handling lacks sufficient depth.",
    empty: "No investigation quality issues detected.",
    category: "Investigation quality",
  },
  {
    key: "negativeSpace",
    title: "Missing evidence",
    description: "Expected artifacts absent from the submitted record.",
    empty: "No missing evidence detected.",
    category: "Evidence integrity",
  },
  {
    key: "evidenceChains",
    title: "Broken evidence chains",
    description: "Alert-to-case linkage integrity exceptions.",
    empty: "No broken evidence chains detected.",
    category: "Evidence integrity",
  },
  {
    key: "metricIntegrity",
    title: "Metric integrity",
    description: "Reported metrics compared with underlying telemetry.",
    empty: "No metric integrity issues detected.",
    category: "Evidence integrity",
  },
  {
    key: "evidenceForensics",
    title: "Evidence forensics",
    description: "Potential fabrication or evidence-quality signals.",
    empty: "No evidence fabrication signals detected.",
    category: "Evidence integrity",
  },
  {
    key: "peerBenchmarks",
    title: "Peer benchmarking",
    description: "Material deviations from comparable entities.",
    empty: "No peer anomalies detected.",
    category: "Operational resilience",
  },
  {
    key: "capabilityDrift",
    title: "Capability drift",
    description: "Degradation in demonstrated operating capability.",
    empty: "No capability drift detected.",
    category: "Operational resilience",
  },
  {
    key: "remediationEffectiveness",
    title: "Remediation effectiveness",
    description: "Recurrence after prior remediation activity.",
    empty: "No ineffective remediation detected.",
    category: "Operational resilience",
  },
  {
    key: "detectionDecay",
    title: "Silent detection decay",
    description: "Rules with declining or absent detection activity.",
    empty: "No silent detection rules found.",
    category: "Operational resilience",
  },
  {
    key: "capacityStress",
    title: "Capacity stress",
    description: "Workload and handling-pressure indicators.",
    empty: "No capacity stress signals detected.",
    category: "Operational resilience",
  },
  {
    key: "peerBlindspot",
    title: "Peer blind-spot",
    description: "Coverage gaps visible through peer comparison.",
    empty: "No peer blind-spots detected.",
    category: "Operational resilience",
  },
];

const severityClass = (severity?: string) => {
  if (severity === "Critical")
    return "border-red-500/30 bg-red-500/10 text-red-300";
  if (severity === "High")
    return "border-orange-500/30 bg-orange-500/10 text-orange-300";
  if (severity === "Medium")
    return "border-amber-500/30 bg-amber-500/10 text-amber-300";
  return "border-slate-700 bg-slate-800 text-slate-300";
};

function EvidenceSummary({ evidence }: { evidence?: Record<string, unknown> }) {
  if (!evidence || Object.keys(evidence).length === 0) return null;
  return (
    <dl className="mt-3 grid gap-x-4 gap-y-2 rounded-lg border border-slate-800 bg-slate-950/35 p-3 sm:grid-cols-2">
      {Object.entries(evidence).map(([key, value]) => (
        <div key={key} className="min-w-0">
          <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
            {key.replaceAll("_", " ")}
          </dt>
          <dd className="mt-0.5 break-words font-mono text-xs text-slate-300">
            {typeof value === "string" ? value : JSON.stringify(value)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function FindingCard({
  finding,
  onInspect,
}: {
  finding: Finding;
  onInspect: (finding: Finding) => void;
}) {
  return (
    <article className="rounded-xl border border-slate-800 bg-slate-950/25 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <span className="font-mono text-xs text-blue-300">
          {finding.finding_id}
        </span>
        <span
          className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${severityClass(finding.severity)}`}
        >
          {finding.severity || "Review"}
        </span>
      </div>
      {finding.type && (
        <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
          {finding.type}
        </p>
      )}
      <p className="mt-1 text-sm leading-6 text-slate-200">
        {finding.description || "No description provided."}
      </p>
      {finding.entity_id && (
        <p className="mt-2 text-xs text-slate-500">
          Entity{" "}
          <span className="font-mono text-slate-300">{finding.entity_id}</span>
        </p>
      )}
      <EvidenceSummary evidence={finding.evidence} />
      <ReviewFindingButton finding={finding} onInspect={onInspect} />
    </article>
  );
}

export function Overview() {
  const [summary, setSummary] = useState<Summary>(EMPTY_SUMMARY);
  const [summaryFailed, setSummaryFailed] = useState(false);
  const [engines, setEngines] = useState<Record<EngineKey, Finding[]>>(() => ({
    executionGaps: [],
    nlpFindings: [],
    negativeSpace: [],
    peerBenchmarks: [],
    evidenceChains: [],
    capabilityDrift: [],
    remediationEffectiveness: [],
    metricIntegrity: [],
    evidenceForensics: [],
    investigationQuality: [],
    detectionDecay: [],
    capacityStress: [],
    peerBlindspot: [],
  }));
  const [failedEngines, setFailedEngines] = useState<Set<EngineKey>>(new Set());
  const [adaptiveSampling, setAdaptiveSampling] = useState<
    Array<{ case_id: string; reason: string }>
  >([]);
  const [samplingFailed, setSamplingFailed] = useState(false);
  const [priorityQueue, setPriorityQueue] = useState<QueueEntity[]>([]);
  const [queueFailed, setQueueFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
  const [activeCategory, setActiveCategory] = useState(engineMeta[0].category);

  useEffect(() => {
    const endpointByKey: Record<EngineKey, string> = {
      executionGaps: "execution-gaps",
      nlpFindings: "nlp-templated",
      negativeSpace: "negative-space",
      peerBenchmarks: "peer-benchmarking",
      evidenceChains: "evidence-chains",
      capabilityDrift: "capability-drift",
      remediationEffectiveness: "remediation-effectiveness",
      metricIntegrity: "metric-integrity",
      evidenceForensics: "evidence-forensics",
      investigationQuality: "investigation-quality",
      detectionDecay: "detection-decay",
      capacityStress: "capacity-stress",
      peerBlindspot: "peer-blindspot",
    };

    const controller = new AbortController();
    const options = { signal: controller.signal };
    const requests = [
      axios
        .get(`${API_URL}/dashboard/summary`, options)
        .then((r) => setSummary(r.data))
        .catch(() => {
          if (!controller.signal.aborted) setSummaryFailed(true);
        }),
      axios
        .get(`${API_URL}/entities/priority-queue`, options)
        .then((r) => setPriorityQueue(r.data.queue || []))
        .catch(() => {
          if (!controller.signal.aborted) setQueueFailed(true);
        }),
      axios
        .get(`${API_URL}/findings/adaptive-sampling`, options)
        .then((r) => setAdaptiveSampling(r.data.sampled_cases || []))
        .catch(() => {
          if (!controller.signal.aborted) setSamplingFailed(true);
        }),
      ...engineMeta.map(({ key }) =>
        axios
          .get(`${API_URL}/findings/${endpointByKey[key]}`, options)
          .then((r) =>
            setEngines((current) => ({
              ...current,
              [key]: r.data.findings || [],
            })),
          )
          .catch(() => {
            if (!controller.signal.aborted)
              setFailedEngines((current) => new Set(current).add(key));
          }),
      ),
    ];
    Promise.allSettled(requests).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, []);

  const categories = useMemo(
    () => Array.from(new Set(engineMeta.map((item) => item.category))),
    [],
  );
  const activeEngines = engineMeta.filter(
    (item) => item.category === activeCategory,
  );
  const totalEngineFindings = Object.values(engines).reduce(
    (total, list) => total + list.length,
    0,
  );
  const dq = summary.data_quality;

  if (loading)
    return (
      <div className="page-shell flex min-h-[60vh] items-center justify-center text-slate-400">
        Loading supervisory overview…
      </div>
    );

  return (
    <div className="page-shell space-y-8">
      <header className="page-header">
        <p className="page-eyebrow">Supervisory command centre</p>
        <h1 className="page-title">Operational assurance overview</h1>
        <p className="page-description">
          Prioritised evidence, data-quality signals, and engine findings across
          the submitted control environment.
        </p>
      </header>

      {summaryFailed && (
        <div
          role="alert"
          className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200"
        >
          Summary metrics could not be loaded. Values below are unavailable, not
          confirmed zeroes.
        </div>
      )}

      <section
        aria-label="Overview metrics"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <div className="metric-card">
          <p className="metric-label">Alerts ingested</p>
          <p className="metric-value">
            {summaryFailed ? "—" : summary.total_alerts}
          </p>
        </div>
        <div className="metric-card">
          <p className="metric-label">Cases processed</p>
          <p className="metric-value">
            {summaryFailed ? "—" : summary.total_cases}
          </p>
        </div>
        <div className="metric-card">
          <p className="metric-label">Engine findings</p>
          <p className="metric-value">
            {failedEngines.size === engineMeta.length
              ? "—"
              : totalEngineFindings}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Across {engineMeta.length - failedEngines.size} available engines
          </p>
        </div>
        <div className="metric-card">
          <p className="metric-label">Priority entities</p>
          <p className="metric-value">
            {queueFailed ? "—" : priorityQueue.length}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Ranked by supervisory priority score
          </p>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="page-eyebrow">Submission health</p>
            <h2 className="text-lg font-semibold text-white">
              Data quality and auditability
            </h2>
          </div>
        </div>
        <div className="grid gap-5 p-5 md:grid-cols-2 xl:grid-cols-4">
          {[
            ["Case coverage", dq.case_coverage_pct],
            ["Field completeness", dq.field_completeness_pct],
            ["Linkage integrity", dq.linkage_integrity_pct],
            ["Asset coverage", dq.asset_coverage_pct],
          ].map(([label, raw]) => {
            const value = Number(raw);
            return (
              <div key={String(label)}>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">{label}</span>
                  <span className="font-mono text-slate-200">
                    {summaryFailed ? "—" : `${value}%`}
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-blue-500"
                    style={{
                      width: summaryFailed ? "0%" : `${Math.min(value, 100)}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div className="border-t border-slate-800 px-5 py-3 text-sm text-slate-400">
          Audit trail:{" "}
          <span
            className={
              dq.audit_trail_present ? "text-emerald-300" : "text-red-300"
            }
          >
            {summaryFailed
              ? "Unavailable"
              : dq.audit_trail_present
                ? `Present · ${dq.audit_event_count} events`
                : "Missing"}
          </span>
        </div>
      </section>

      <ClaimsVerificationMatrix apiUrl={API_URL} />

      <section className="panel overflow-hidden">
        <div className="panel-header">
          <div>
            <p className="page-eyebrow">Priority register</p>
            <h2 className="text-lg font-semibold text-white">
              Entities requiring attention
            </h2>
          </div>
          <span className="text-sm text-slate-400">
            {queueFailed ? "Unavailable" : `${priorityQueue.length} ranked`}
          </span>
        </div>
        {queueFailed ? (
          <p className="p-5 text-sm text-red-300">
            Priority data could not be loaded.
          </p>
        ) : priorityQueue.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">
            No entities currently require prioritisation.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="border-b border-slate-800 bg-slate-950/30 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Rank</th>
                  <th className="px-5 py-3">Entity</th>
                  <th className="px-5 py-3">SPS</th>
                  <th className="px-5 py-3">Critical</th>
                  <th className="px-5 py-3">High</th>
                  <th className="px-5 py-3">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {priorityQueue.map((entity, index) => (
                  <tr key={entity.entity_id} className="hover:bg-slate-800/30">
                    <td className="px-5 py-3 text-slate-500">{index + 1}</td>
                    <td className="px-5 py-3 font-mono text-blue-300">
                      {entity.entity_id}
                    </td>
                    <td className="px-5 py-3 font-semibold text-white">
                      {entity.score}
                    </td>
                    <td className="px-5 py-3 text-red-300">
                      {entity.critical_findings}
                    </td>
                    <td className="px-5 py-3 text-orange-300">
                      {entity.high_findings}
                    </td>
                    <td className="px-5 py-3 text-slate-300">
                      {entity.total_findings}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section aria-labelledby="engine-browser-title">
        <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="page-eyebrow">Detection engines</p>
            <h2
              id="engine-browser-title"
              className="text-xl font-semibold text-white"
            >
              Browse findings by control domain
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Expand an engine to inspect every finding and its submitted
              evidence.
            </p>
          </div>
        </div>
        <div
          role="tablist"
          aria-label="Engine categories"
          className="mb-4 flex gap-2 overflow-x-auto border-b border-slate-800"
        >
          {categories.map((category, index) => (
            <button
              key={category}
              role="tab"
              id={`engine-tab-${index}`}
              aria-controls="engine-panel"
              tabIndex={activeCategory === category ? 0 : -1}
              aria-selected={activeCategory === category}
              onClick={() => setActiveCategory(category)}
              onKeyDown={(event) => {
                if (
                  !["ArrowLeft", "ArrowRight", "Home", "End"].includes(
                    event.key,
                  )
                )
                  return;
                event.preventDefault();
                const next =
                  event.key === "Home"
                    ? 0
                    : event.key === "End"
                      ? categories.length - 1
                      : (index +
                          (event.key === "ArrowRight" ? 1 : -1) +
                          categories.length) %
                        categories.length;
                setActiveCategory(categories[next]);
                document.getElementById(`engine-tab-${next}`)?.focus();
              }}
              className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium ${activeCategory === category ? "border-blue-500 text-blue-300" : "border-transparent text-slate-400 hover:text-slate-200"}`}
            >
              {category}
              <span className="ml-2 rounded-full bg-slate-800 px-2 py-0.5 text-xs">
                {engineMeta
                  .filter((item) => item.category === category)
                  .reduce((sum, item) => sum + engines[item.key].length, 0)}
              </span>
            </button>
          ))}
        </div>
        <div
          role="tabpanel"
          id="engine-panel"
          aria-labelledby={`engine-tab-${categories.indexOf(activeCategory)}`}
          className="space-y-3"
        >
          {activeEngines.map((meta) => (
            <details
              key={meta.key}
              className="panel group"
              open={activeEngines.indexOf(meta) === 0}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                <div>
                  <h3 className="font-semibold text-slate-100">{meta.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {meta.description}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs text-slate-300">
                    {failedEngines.has(meta.key)
                      ? "Unavailable"
                      : `${engines[meta.key].length} findings`}
                  </span>
                  <ChevronDown className="h-4 w-4 text-slate-500 transition-transform group-open:rotate-180" />
                </div>
              </summary>
              <div className="border-t border-slate-800 p-4">
                {failedEngines.has(meta.key) ? (
                  <p className="text-sm text-red-300">
                    This engine could not be loaded.
                  </p>
                ) : engines[meta.key].length === 0 ? (
                  <p className="text-sm text-slate-500">{meta.empty}</p>
                ) : (
                  <div className="grid gap-4 xl:grid-cols-2">
                    {engines[meta.key].map((finding) => (
                      <FindingCard
                        key={finding.finding_id}
                        finding={finding}
                        onInspect={setSelectedFinding}
                      />
                    ))}
                  </div>
                )}
              </div>
            </details>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="page-eyebrow">Quality assurance</p>
            <h2 className="text-lg font-semibold text-white">
              Adaptive sampling queue
            </h2>
          </div>
          <span className="text-sm text-slate-400">
            {samplingFailed
              ? "Unavailable"
              : `${adaptiveSampling.length} cases`}
          </span>
        </div>
        {samplingFailed ? (
          <p className="p-5 text-sm text-red-300">
            Sampling data could not be loaded.
          </p>
        ) : adaptiveSampling.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">
            No cases selected for adaptive sampling.
          </p>
        ) : (
          <ul className="divide-y divide-slate-800">
            {adaptiveSampling.map((sample) => (
              <li
                key={sample.case_id}
                className="grid gap-1 px-5 py-4 sm:grid-cols-[12rem_1fr]"
              >
                <span className="font-mono text-sm text-blue-300">
                  {sample.case_id}
                </span>
                <span className="text-sm text-slate-300">{sample.reason}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

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
