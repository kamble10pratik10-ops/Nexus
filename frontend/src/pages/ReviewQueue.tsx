import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { AlertCircle, ArrowRight, CheckCircle2 } from "lucide-react";
import { cn } from "../lib/utils";
import type { Finding } from "../components/types";
import EvidenceReviewModal from "../components/EvidenceReviewModal";

const API_URL = "http://localhost:8000/api";

export function ReviewQueue() {
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
  const [filter, setFilter] = useState("All");
  const {
    data: findings = [],
    isLoading,
    error,
  } = useQuery<Finding[]>({
    queryKey: ["all-findings"],
    queryFn: async () => {
      const data = (await axios.get(`${API_URL}/findings`)).data;
      const arr = Array.isArray(data) ? data : (data.findings || []);
      return arr.map((item: any) => ({
        finding_id: item.id || item.finding_id,
        type: item.finding_type || item.type || "Unknown",
        entity_id: item.entity_id || "Unknown",
        severity: item.severity === "CRITICAL" ? "Critical" : item.severity === "HIGH" ? "High" : item.severity === "MEDIUM" ? "Medium" : "Low",
        description: item.title || item.explanation || item.description || "",
        outcome: item.reviewed ? (item.review_decision === "CONFIRMED_GAP" ? "SUPPORTED" : "CONTRADICTED") : undefined,
        evidence: item.evidence
      }));
    }
  });
  const queue = useMemo(
    () =>
      findings
        .filter((f) => f.severity === "Critical" || f.severity === "High")
        .sort((a, b) =>
          a.severity === b.severity ? 0 : a.severity === "Critical" ? -1 : 1,
        ),
    [findings],
  );
  const filteredQueue =
    filter === "All" ? queue : queue.filter((f) => f.severity === filter);
  const criticalCount = queue.filter((f) => f.severity === "Critical").length;

  return (
    <div className="page-shell space-y-8">
      <header className="page-header">
        <p className="page-eyebrow">Supervisory workflow</p>
        <h1 className="page-title">Review queue</h1>
        <p className="page-description">
          Critical and high-priority findings requiring evidence validation and
          a documented supervisory decision.
        </p>
      </header>
      {!isLoading && !error && (
        <section
          aria-label="Queue summary"
          className="grid gap-4 sm:grid-cols-3"
        >
          <div className="metric-card">
            <p className="metric-label">Awaiting review</p>
            <p className="metric-value">{queue.length}</p>
          </div>
          <div className="metric-card">
            <p className="metric-label">Critical</p>
            <p className="metric-value">{criticalCount}</p>
          </div>
          <div className="metric-card">
            <p className="metric-label">High</p>
            <p className="metric-value">{queue.length - criticalCount}</p>
          </div>
        </section>
      )}
      <section className="panel overflow-hidden">
        <div className="panel-header flex-col items-start gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-semibold text-white">
              Evidence review register
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Ordered with critical findings first.
            </p>
          </div>
          <div
            className="flex gap-2"
            role="group"
            aria-label="Filter review queue"
          >
            {["All", "Critical", "High"].map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={filter === value}
                onClick={() => setFilter(value)}
                className={cn(
                  "rounded-lg border px-3 py-2 text-sm font-medium",
                  filter === value
                    ? "border-blue-500/50 bg-blue-500/15 text-blue-200"
                    : "border-slate-700 text-slate-400 hover:bg-slate-800",
                )}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
        {error ? (
          <div
            role="alert"
            className="flex items-center gap-2 p-5 text-red-300"
          >
            <AlertCircle className="h-5 w-5" />
            Review queue could not be loaded.
          </div>
        ) : isLoading ? (
          <p className="p-10 text-center text-slate-500">
            Loading review queue…
          </p>
        ) : filteredQueue.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle2 className="mx-auto h-8 w-8 text-slate-600" />
            <h3 className="mt-3 font-semibold text-slate-200">
              No matching reviews
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              No pending items match the selected priority.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-800">
            {filteredQueue.map((finding) => (
              <li
                key={finding.finding_id}
                className="grid gap-5 p-5 hover:bg-slate-800/20 lg:grid-cols-[minmax(0,1fr)_14rem_auto] lg:items-center"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-xs font-semibold",
                        finding.severity === "Critical"
                          ? "border-red-500/30 bg-red-500/10 text-red-300"
                          : "border-orange-500/30 bg-orange-500/10 text-orange-300",
                      )}
                    >
                      {finding.severity}
                    </span>
                    <span className="font-mono text-xs text-slate-500">
                      {finding.finding_id}
                    </span>
                  </div>
                  <h3 className="mt-3 text-sm font-medium leading-6 text-slate-100">
                    {finding.description}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {finding.type || "Finding"} · Entity{" "}
                    <span className="font-mono">
                      {finding.entity_id || "Not specified"}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="metric-label">Current assessment</p>
                  <p className="mt-1 text-sm text-slate-300">
                    {finding.outcome || "Review required"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedFinding(finding)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                >
                  Review evidence
                  <ArrowRight className="h-4 w-4" />
                </button>
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
