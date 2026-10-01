import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  FileSearch,
  HelpCircle,
  X,
  XCircle,
} from "lucide-react";
import { cn } from "../lib/utils";

const API_URL = "http://localhost:8000/api";
type ClaimStatus = "SUPPORTED" | "CONTRADICTED" | "UNVERIFIABLE";
interface Claim {
  claim: string;
  status: ClaimStatus;
  demo_text: string;
}

const statusConfig = {
  SUPPORTED: {
    icon: CheckCircle2,
    style: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
    label: "Supported by evidence",
  },
  CONTRADICTED: {
    icon: XCircle,
    style: "border-red-500/25 bg-red-500/10 text-red-300",
    label: "Contradicted by evidence",
  },
  UNVERIFIABLE: {
    icon: HelpCircle,
    style: "border-amber-500/25 bg-amber-500/10 text-amber-300",
    label: "Evidence unverifiable",
  },
};

export function ClaimsAssurance() {
  const [selectedClaim, setSelectedClaim] = useState<string | null>(null);
  const {
    data = [],
    isLoading,
    error,
  } = useQuery<Claim[]>({
    queryKey: ["claims-matrix"],
    queryFn: async () =>
      (await axios.get(`${API_URL}/claims-matrix`)).data.claims_matrix,
  });
  const selectedData = data.find((item) => item.claim === selectedClaim);
  const counts = (status: ClaimStatus) =>
    data.filter((item) => item.status === status).length;

  return (
    <div className="page-shell space-y-8">
      <header className="page-header">
        <p className="page-eyebrow">Capability validation</p>
        <h1 className="page-title">Claims assurance</h1>
        <p className="page-description">
          Compare declared organisational capabilities with the evidence
          demonstrated in submitted artifacts.
        </p>
      </header>

      {!isLoading && !error && (
        <section
          aria-label="Claims summary"
          className="grid gap-4 sm:grid-cols-3"
        >
          <div className="metric-card">
            <p className="metric-label">Supported</p>
            <p className="metric-value">{counts("SUPPORTED")}</p>
          </div>
          <div className="metric-card">
            <p className="metric-label">Contradicted</p>
            <p className="metric-value">{counts("CONTRADICTED")}</p>
          </div>
          <div className="metric-card">
            <p className="metric-label">Unverifiable</p>
            <p className="metric-value">{counts("UNVERIFIABLE")}</p>
          </div>
        </section>
      )}

      {error ? (
        <div
          role="alert"
          className="panel flex items-center gap-3 p-5 text-red-300"
        >
          <AlertCircle className="h-5 w-5" />
          <span>Claims matrix could not be loaded.</span>
        </div>
      ) : (
        <div
          className={cn(
            "grid min-h-0 gap-5",
            selectedData && "xl:grid-cols-[minmax(0,1fr)_24rem]",
          )}
        >
          <section
            className="panel overflow-hidden"
            aria-label="Declared capabilities"
          >
            <div className="panel-header">
              <div>
                <h2 className="font-semibold text-white">
                  Declared capability register
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Select a row to inspect its evidentiary basis.
                </p>
              </div>
              <span className="text-sm text-slate-400">
                {isLoading ? "Loading…" : `${data.length} claims`}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-left text-sm">
                <thead className="border-b border-slate-800 bg-slate-950/30 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Declared capability</th>
                    <th className="px-5 py-3">Assessment</th>
                    <th className="px-5 py-3 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {isLoading ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-5 py-12 text-center text-slate-500"
                      >
                        Evaluating capability claims…
                      </td>
                    </tr>
                  ) : data.length === 0 ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-5 py-12 text-center text-slate-500"
                      >
                        No capability claims were returned.
                      </td>
                    </tr>
                  ) : (
                    data.map((item) => {
                      const config = statusConfig[item.status];
                      const Icon = config.icon;
                      const selected = selectedClaim === item.claim;
                      return (
                        <tr
                          key={item.claim}
                          className={cn(
                            "hover:bg-slate-800/30",
                            selected && "bg-blue-500/10",
                          )}
                        >
                          <td className="px-5 py-4">
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedClaim(selected ? null : item.claim)
                              }
                              className="w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                            >
                              <span className="block font-medium text-slate-100">
                                {item.claim}
                              </span>
                              <span className="mt-1 block max-w-2xl truncate text-xs text-slate-500">
                                {item.demo_text}
                              </span>
                            </button>
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
                                config.style,
                              )}
                            >
                              <Icon className="h-3.5 w-3.5" />
                              {item.status}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <button
                              type="button"
                              aria-label={`Inspect ${item.claim}`}
                              onClick={() =>
                                setSelectedClaim(selected ? null : item.claim)
                              }
                              className="rounded-md p-2 text-slate-400 hover:bg-slate-800 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                            >
                              <ChevronRight className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {selectedData && (
            <aside
              className="panel h-fit xl:sticky xl:top-6"
              aria-label="Claim details"
            >
              <div className="panel-header items-start">
                <div>
                  <p className="page-eyebrow">Claim detail</p>
                  <h2 className="mt-1 font-semibold text-white">
                    {selectedData.claim}
                  </h2>
                </div>
                <button
                  type="button"
                  aria-label="Close claim details"
                  onClick={() => setSelectedClaim(null)}
                  className="rounded-md p-1.5 text-slate-500 hover:bg-slate-800 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-6 p-5">
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
                    statusConfig[selectedData.status].style,
                  )}
                >
                  {statusConfig[selectedData.status].label}
                </span>
                <div>
                  <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <FileSearch className="h-4 w-4" />
                    Evidentiary basis
                  </h3>
                  <p className="mt-2 rounded-lg border border-slate-800 bg-slate-950/30 p-4 text-sm leading-6 text-slate-300">
                    {selectedData.demo_text}
                  </p>
                </div>
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Supervisory interpretation
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {selectedData.status === "SUPPORTED"
                      ? "No immediate intervention is indicated by the submitted evidence."
                      : selectedData.status === "CONTRADICTED"
                        ? "The submitted artifacts conflict with the declared capability and warrant targeted review."
                        : "The current dataset is insufficient to validate the claim; additional source evidence may be required."}
                  </p>
                </div>
                <p className="border-t border-slate-800 pt-4 text-xs text-slate-500">
                  This view is read-only. Formal report workflow is not
                  available from this screen.
                </p>
              </div>
            </aside>
          )}
        </div>
      )}
    </div>
  );
}
