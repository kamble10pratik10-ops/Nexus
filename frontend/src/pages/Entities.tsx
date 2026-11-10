import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { AlertCircle, Search, Building2, ChevronRight, Activity, ShieldAlert } from "lucide-react";
import { EntityDigitalTwinDrawer } from "../components/entities/EntityDigitalTwinDrawer";

const API_URL = "http://localhost:8000/api";

interface EntityPriority {
  entity_id: string;
  score: number;
  critical_findings: number;
  high_findings: number;
  total_findings: number;
  findings_summary: unknown[];
}

export function Entities() {
  const [search, setSearch] = useState("");
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);

  const {
    data: queue = [],
    isLoading,
    error,
  } = useQuery<EntityPriority[]>({
    queryKey: ["entities-priority"],
    queryFn: async () =>
      (await axios.get(`${API_URL}/entities/priority-queue`)).data.queue || [],
  });

  const filteredQueue = useMemo(
    () =>
      queue.filter((entity) =>
        entity.entity_id.toLowerCase().includes(search.trim().toLowerCase()),
      ),
    [queue, search],
  );

  const totals = useMemo(
    () =>
      queue.reduce(
        (result, entity) => ({
          critical: result.critical + entity.critical_findings,
          high: result.high + entity.high_findings,
          findings: result.findings + entity.total_findings,
        }),
        { critical: 0, high: 0, findings: 0 },
      ),
    [queue],
  );

  const maxScore = useMemo(
    () => Math.max(...queue.map((e) => e.score), 1),
    [queue]
  );

  return (
    <div className="page-shell space-y-8">
      <header className="page-header">
        <p className="page-eyebrow">Risk concentration &amp; Digital Twins</p>
        <h1 className="page-title">Entity supervisory priority</h1>
        <p className="page-description">
          Supervisory Priority Score (SPS) ranking based on verified gaps and severity
          concentration by entity. Click any row to inspect its live operational Digital Twin.
        </p>
      </header>

      {!isLoading && !error && (
        <section
          aria-label="Entity summary"
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          <div className="metric-card">
            <p className="metric-label flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" /> Monitored CSEs
            </p>
            <p className="metric-value">{queue.length}</p>
            <p className="mt-1 text-xs text-slate-500">Critical Sector Entities</p>
          </div>
          <div className="metric-card border-rose-200 dark:border-rose-900/40 bg-rose-50/40 dark:bg-rose-950/10">
            <p className="metric-label flex items-center gap-1.5 text-rose-700 dark:text-rose-300">
              <ShieldAlert className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" /> Critical Findings
            </p>
            <p className="metric-value text-rose-700 dark:text-rose-400">{totals.critical}</p>
            <p className="mt-1 text-xs text-slate-500">Immediate supervisory action</p>
          </div>
          <div className="metric-card border-amber-200 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/10">
            <p className="metric-label flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
              <Activity className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" /> High-Severity Deficiencies
            </p>
            <p className="metric-value text-amber-800 dark:text-amber-400">{totals.high}</p>
            <p className="mt-1 text-xs text-slate-500">Elevated concern</p>
          </div>
          <div className="metric-card">
            <p className="metric-label">Total Verified Gaps</p>
            <p className="metric-value text-sky-700 dark:text-sky-300">{totals.findings}</p>
            <p className="mt-1 text-xs text-slate-500">Across all 13 control domains</p>
          </div>
        </section>
      )}

      <section className="panel overflow-hidden">
        <div className="panel-header flex-col items-stretch gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-semibold text-slate-900 dark:text-white">Priority register</h2>
            <p className="mt-1 text-sm text-slate-500">
              Ranked by supervisory attention priority. Click an entity to open its Digital Twin dossier.
            </p>
          </div>
          <label className="relative block sm:w-72">
            <span className="sr-only">Search entities</span>
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="search"
              placeholder="Search entity ID (e.g. CSE-01)..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/50 py-2 pl-9 pr-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </label>
        </div>

        {error ? (
          <div
            role="alert"
            className="flex items-center gap-2 p-5 text-rose-700 dark:text-red-300"
          >
            <AlertCircle className="h-5 w-5" />
            Entity priorities could not be loaded.
          </div>
        ) : isLoading ? (
          <p className="p-12 text-center text-slate-500">
            Loading entity priorities and operational postures…
          </p>
        ) : filteredQueue.length === 0 ? (
          <div className="p-12 text-center">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200">
              {queue.length === 0
                ? "No prioritised entities"
                : "No entities found"}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {queue.length === 0
                ? "No entity priority data was returned."
                : `No entity ID matches “${search}”.`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0a101b] text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-3">Rank</th>
                  <th className="px-5 py-3">Entity ID</th>
                  <th className="px-5 py-3">SPS score</th>
                  <th className="px-5 py-3">Severity Concentration</th>
                  <th className="px-5 py-3">Critical</th>
                  <th className="px-5 py-3">High</th>
                  <th className="px-5 py-3">Total Gaps</th>
                  <th className="px-5 py-3 text-right">Dossier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredQueue.map((entity) => {
                  const rank =
                    queue.findIndex(
                      (item) => item.entity_id === entity.entity_id,
                    ) + 1;
                  const scorePct = Math.min(100, (entity.score / maxScore) * 100);

                  return (
                    <tr
                      key={entity.entity_id}
                      onClick={() => setSelectedEntityId(entity.entity_id)}
                      className="cursor-pointer transition-colors hover:bg-sky-500/5 group"
                    >
                      <td className="px-5 py-4 text-slate-500 font-mono">#{rank}</td>
                      <td className="px-5 py-4">
                        <span className="font-mono font-bold text-sky-700 dark:text-sky-400 group-hover:text-sky-600 dark:group-hover:text-sky-300">
                          {entity.entity_id}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-mono text-base font-bold text-slate-900 dark:text-white">
                        {entity.score}
                      </td>
                      <td className="px-5 py-4 min-w-[140px]">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-rose-500"
                              style={{ width: `${scorePct}%` }}
                            />
                          </div>
                          <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                            {scorePct.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-mono font-semibold text-rose-700 dark:text-rose-400">
                        {entity.critical_findings}
                      </td>
                      <td className="px-5 py-4 font-mono text-amber-800 dark:text-amber-400">
                        {entity.high_findings}
                      </td>
                      <td className="px-5 py-4 font-mono text-slate-700 dark:text-slate-300">
                        {entity.total_findings}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className="inline-flex items-center gap-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 group-hover:border-sky-500 group-hover:bg-sky-50 dark:group-hover:bg-sky-500/10 group-hover:text-sky-700 dark:group-hover:text-sky-300 transition-colors shadow-xs">
                          Inspect Twin <ChevronRight className="h-3.5 w-3.5" />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="border-t border-slate-200 dark:border-slate-800 px-5 py-3 text-xs text-slate-500 flex items-center justify-between">
          <span>Click any row to open the full Supervisory Digital Twin and Asset Topology.</span>
          <span className="font-mono">NCIIPC-SPS v2.4</span>
        </div>
      </section>

      {/* Digital Twin Drawer */}
      <EntityDigitalTwinDrawer
        entityId={selectedEntityId}
        onClose={() => setSelectedEntityId(null)}
      />
    </div>
  );
}
