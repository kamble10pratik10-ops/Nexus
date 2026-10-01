import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { AlertCircle, Search } from "lucide-react";

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

  return (
    <div className="page-shell space-y-8">
      <header className="page-header">
        <p className="page-eyebrow">Risk concentration</p>
        <h1 className="page-title">Entity supervisory priority</h1>
        <p className="page-description">
          Supervisory Priority Score ranking based on verified gaps and severity
          concentration by entity.
        </p>
      </header>
      {!isLoading && !error && (
        <section
          aria-label="Entity summary"
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          <div className="metric-card">
            <p className="metric-label">Ranked entities</p>
            <p className="metric-value">{queue.length}</p>
          </div>
          <div className="metric-card">
            <p className="metric-label">Critical findings</p>
            <p className="metric-value">{totals.critical}</p>
          </div>
          <div className="metric-card">
            <p className="metric-label">High findings</p>
            <p className="metric-value">{totals.high}</p>
          </div>
          <div className="metric-card">
            <p className="metric-label">Verified gaps</p>
            <p className="metric-value">{totals.findings}</p>
          </div>
        </section>
      )}
      <section className="panel overflow-hidden">
        <div className="panel-header flex-col items-stretch gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-semibold text-white">Priority ranking</h2>
            <p className="mt-1 text-sm text-slate-500">
              Higher SPS scores indicate greater supervisory attention.
            </p>
          </div>
          <label className="relative block sm:w-72">
            <span className="sr-only">Search entities</span>
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="search"
              placeholder="Search entity ID"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950/50 py-2 pl-9 pr-3 text-sm text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </label>
        </div>
        {error ? (
          <div
            role="alert"
            className="flex items-center gap-2 p-5 text-red-300"
          >
            <AlertCircle className="h-5 w-5" />
            Entity priorities could not be loaded.
          </div>
        ) : isLoading ? (
          <p className="p-12 text-center text-slate-500">
            Loading entity priorities…
          </p>
        ) : filteredQueue.length === 0 ? (
          <div className="p-12 text-center">
            <h3 className="font-semibold text-slate-200">
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
              <thead className="border-b border-slate-800 bg-slate-950/30 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Rank</th>
                  <th className="px-5 py-3">Entity ID</th>
                  <th className="px-5 py-3">SPS score</th>
                  <th className="px-5 py-3">Critical</th>
                  <th className="px-5 py-3">High</th>
                  <th className="px-5 py-3">Total verified gaps</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredQueue.map((entity) => {
                  const rank =
                    queue.findIndex(
                      (item) => item.entity_id === entity.entity_id,
                    ) + 1;
                  return (
                    <tr
                      key={entity.entity_id}
                      className="hover:bg-slate-800/25"
                    >
                      <td className="px-5 py-4 text-slate-500">#{rank}</td>
                      <td className="px-5 py-4 font-mono font-medium text-blue-300">
                        {entity.entity_id}
                      </td>
                      <td className="px-5 py-4 text-lg font-semibold text-white">
                        {entity.score}
                      </td>
                      <td className="px-5 py-4 text-red-300">
                        {entity.critical_findings}
                      </td>
                      <td className="px-5 py-4 text-orange-300">
                        {entity.high_findings}
                      </td>
                      <td className="px-5 py-4 text-slate-300">
                        {entity.total_findings}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="border-t border-slate-800 px-5 py-3 text-xs text-slate-500">
          Entity profiles are read-only in this release; use the Findings Hub to
          inspect underlying evidence.
        </p>
      </section>
    </div>
  );
}
