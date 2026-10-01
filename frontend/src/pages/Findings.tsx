import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type { ColumnDef } from "@tanstack/react-table";
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileText,
  HelpCircle,
  Search,
  X,
  XCircle,
} from "lucide-react";
import { cn } from "../lib/utils";

const API_URL = "http://localhost:8000/api";
interface Finding {
  finding_id: string;
  type: string;
  entity_id: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  description: string;
  outcome?: "SUPPORTED" | "CONTRADICTED" | "UNVERIFIABLE";
  evidence?: unknown;
}
const severityColors = {
  Critical: "border-red-500/25 bg-red-500/10 text-red-300",
  High: "border-orange-500/25 bg-orange-500/10 text-orange-300",
  Medium: "border-amber-500/25 bg-amber-500/10 text-amber-300",
  Low: "border-blue-500/25 bg-blue-500/10 text-blue-300",
};
const outcomeConfig = {
  SUPPORTED: { icon: CheckCircle2, color: "text-emerald-300" },
  CONTRADICTED: { icon: XCircle, color: "text-red-300" },
  UNVERIFIABLE: { icon: HelpCircle, color: "text-amber-300" },
};

export function Findings() {
  const [globalFilter, setGlobalFilter] = useState("");
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
  const {
    data: findings = [],
    isLoading,
    error,
  } = useQuery<Finding[]>({
    queryKey: ["findings"],
    queryFn: async () => (await axios.get(`${API_URL}/findings`)).data.findings,
  });
  const columns = useMemo<ColumnDef<Finding>[]>(
    () => [
      {
        accessorKey: "finding_id",
        header: "ID",
        cell: (info) => (
          <span className="font-mono text-xs text-blue-300">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: "type",
        header: "Finding type",
        cell: (info) => (
          <span className="font-medium text-slate-100">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: "entity_id",
        header: "Entity",
        cell: (info) => (
          <span className="font-mono text-xs text-slate-300">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: "severity",
        header: "Priority",
        cell: (info) => {
          const value = info.getValue() as Finding["severity"];
          return (
            <span
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs font-medium",
                severityColors[value],
              )}
            >
              {value}
            </span>
          );
        },
      },
      {
        accessorKey: "outcome",
        header: "Assessment",
        cell: (info) => {
          const value = info.getValue() as Finding["outcome"];
          if (!value)
            return <span className="text-slate-600">Not assessed</span>;
          const Icon = outcomeConfig[value].icon;
          return (
            <span className="inline-flex items-center gap-1.5 text-xs text-slate-300">
              <Icon className={cn("h-4 w-4", outcomeConfig[value].color)} />
              {value}
            </span>
          );
        },
      },
    ],
    [],
  );
  const table = useReactTable({
    data: findings,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 15 } },
  });
  const critical = findings.filter(
    (item) => item.severity === "Critical",
  ).length;
  const high = findings.filter((item) => item.severity === "High").length;

  return (
    <div className="page-shell space-y-8">
      <header className="page-header">
        <p className="page-eyebrow">Cross-engine register</p>
        <h1 className="page-title">Findings hub</h1>
        <p className="page-description">
          Search, sort, and inspect anomalies, execution gaps, and validation
          results from every detection engine.
        </p>
      </header>
      {!isLoading && !error && (
        <section
          aria-label="Findings summary"
          className="grid gap-4 sm:grid-cols-3"
        >
          <div className="metric-card">
            <p className="metric-label">Total findings</p>
            <p className="metric-value">{findings.length}</p>
          </div>
          <div className="metric-card">
            <p className="metric-label">Critical</p>
            <p className="metric-value">{critical}</p>
          </div>
          <div className="metric-card">
            <p className="metric-label">High</p>
            <p className="metric-value">{high}</p>
          </div>
        </section>
      )}
      {error ? (
        <div
          role="alert"
          className="panel flex items-center gap-2 p-5 text-red-300"
        >
          <AlertCircle className="h-5 w-5" />
          Findings data could not be loaded.
        </div>
      ) : (
        <div
          className={cn(
            "grid min-h-0 gap-5",
            selectedFinding && "xl:grid-cols-[minmax(0,1fr)_24rem]",
          )}
        >
          <section className="panel min-w-0 overflow-hidden">
            <div className="panel-header flex-col items-stretch gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="font-semibold text-white">Finding register</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Select any row to inspect structured evidence.
                </p>
              </div>
              <label className="relative block sm:w-80">
                <span className="sr-only">Search findings</span>
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="search"
                  placeholder="Search findings, entities, IDs"
                  value={globalFilter}
                  onChange={(event) => setGlobalFilter(event.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/50 py-2 pl-9 pr-3 text-sm text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </label>
            </div>
            <div className="overflow-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="sticky top-0 z-10 border-b border-slate-800 bg-[#131d2e] text-xs uppercase tracking-wide text-slate-500">
                  {table.getHeaderGroups().map((group) => (
                    <tr key={group.id}>
                      {group.headers.map((header) => (
                        <th key={header.id} className="px-4 py-3">
                          <button
                            type="button"
                            onClick={header.column.getToggleSortingHandler()}
                            className="flex items-center gap-1 text-left hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                            <span aria-hidden="true">
                              {{ asc: "↑", desc: "↓" }[
                                header.column.getIsSorted() as string
                              ] || ""}
                            </span>
                          </button>
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {isLoading ? (
                    <tr>
                      <td
                        colSpan={columns.length}
                        className="px-4 py-12 text-center text-slate-500"
                      >
                        Loading findings…
                      </td>
                    </tr>
                  ) : table.getRowModel().rows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={columns.length}
                        className="px-4 py-12 text-center text-slate-500"
                      >
                        {findings.length === 0
                          ? "No findings were returned."
                          : "No findings match your search."}
                      </td>
                    </tr>
                  ) : (
                    table.getRowModel().rows.map((row) => {
                      const selected =
                        selectedFinding?.finding_id === row.original.finding_id;
                      return (
                        <tr
                          key={row.id}
                          tabIndex={0}
                          aria-label={`Inspect finding ${row.original.finding_id}`}
                          onClick={() =>
                            setSelectedFinding(selected ? null : row.original)
                          }
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              setSelectedFinding(
                                selected ? null : row.original,
                              );
                            }
                          }}
                          className={cn(
                            "cursor-pointer hover:bg-slate-800/30 focus:outline-none focus-visible:bg-blue-500/10",
                            selected && "bg-blue-500/10",
                          )}
                        >
                          {row.getVisibleCells().map((cell) => (
                            <td
                              key={cell.id}
                              className="whitespace-nowrap px-4 py-3"
                            >
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext(),
                              )}
                            </td>
                          ))}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex flex-col gap-3 border-t border-slate-800 px-4 py-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
              <span>
                Showing {table.getRowModel().rows.length} of{" "}
                {table.getFilteredRowModel().rows.length} matching findings
              </span>
              <div className="flex items-center gap-2">
                <span className="mr-2 text-xs">
                  Page {table.getState().pagination.pageIndex + 1} of{" "}
                  {Math.max(table.getPageCount(), 1)}
                </span>
                <button
                  type="button"
                  aria-label="Previous findings page"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="rounded-md border border-slate-700 p-1.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label="Next findings page"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="rounded-md border border-slate-700 p-1.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </section>
          {selectedFinding && (
            <aside
              className="panel h-fit xl:sticky xl:top-6"
              aria-label="Finding details"
            >
              <div className="panel-header items-start">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-xs font-semibold",
                        severityColors[selectedFinding.severity],
                      )}
                    >
                      {selectedFinding.severity}
                    </span>
                    <span className="font-mono text-xs text-slate-500">
                      {selectedFinding.finding_id}
                    </span>
                  </div>
                  <h2 className="mt-3 font-semibold text-white">
                    {selectedFinding.type}
                  </h2>
                </div>
                <button
                  type="button"
                  aria-label="Close finding details"
                  onClick={() => setSelectedFinding(null)}
                  className="rounded-md p-1.5 text-slate-500 hover:bg-slate-800 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-5 p-5">
                <div>
                  <p className="metric-label">Entity</p>
                  <p className="mt-1 font-mono text-sm text-slate-200">
                    {selectedFinding.entity_id}
                  </p>
                </div>
                <div>
                  <p className="metric-label">Description</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {selectedFinding.description}
                  </p>
                </div>
                {selectedFinding.evidence != null && (
                  <div>
                    <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <FileText className="h-4 w-4" />
                      Structured evidence
                    </h3>
                    <pre className="mt-2 max-h-96 overflow-auto rounded-lg border border-slate-800 bg-slate-950/40 p-4 text-xs leading-5 text-slate-300">
                      {JSON.stringify(selectedFinding.evidence, null, 2)}
                    </pre>
                  </div>
                )}
                <p className="border-t border-slate-800 pt-4 text-xs text-slate-500">
                  Review-queue and disposition changes are available only
                  through configured evidence-review workflows.
                </p>
              </div>
            </aside>
          )}
        </div>
      )}
    </div>
  );
}
