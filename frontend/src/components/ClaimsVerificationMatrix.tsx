import { useCallback, useEffect, useState } from "react";
import axios from "axios";

interface Claim {
  claim: string;
  declared: unknown;
  demonstrated: unknown;
  status: string;
  evidence: unknown;
  reason?: string;
  benchmark?: unknown;
  missing_evidence?: string[];
  next_review_action?: string;
  scope?: unknown;
}

const display = (value: unknown) => {
  if (value === undefined || value === null || value === "")
    return "Not provided";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

const statusStyle = (status: string) => {
  const normalized = status.toLowerCase().replaceAll("_", "-");
  if (
    normalized.includes("not-") ||
    normalized.includes("unverified") ||
    normalized.includes("unsupported")
  )
    return "border-rose-200 dark:border-red-500/40 bg-rose-50 dark:bg-red-500/15 text-rose-700 dark:text-red-300";
  if (normalized.includes("partial"))
    return "border-amber-200 dark:border-yellow-500/40 bg-amber-50 dark:bg-yellow-500/15 text-amber-800 dark:text-yellow-300";
  if (
    normalized.includes("verified") ||
    normalized.includes("demonstrated") ||
    normalized.includes("supported")
  )
    return "border-emerald-200 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300";
  return "border-rose-200 dark:border-red-500/40 bg-rose-50 dark:bg-red-500/15 text-rose-700 dark:text-red-300";
};

export default function ClaimsVerificationMatrix({
  apiUrl,
}: {
  apiUrl: string;
}) {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get(`${apiUrl}/claims-matrix`);
      setClaims(response.data.claims_matrix || []);
    } catch {
      setError("The claims verification matrix could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    let active = true;
    axios
      .get(`${apiUrl}/claims-matrix`)
      .then((response) => {
        if (active) setClaims(response.data.claims_matrix || []);
      })
      .catch(() => {
        if (active)
          setError("The claims verification matrix could not be loaded.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [apiUrl]);

  return (
    <section
      className="panel overflow-hidden"
      aria-labelledby="claims-matrix-heading"
    >
      <div className="border-b border-slate-200 dark:border-slate-800 p-5">
        <p className="page-eyebrow">Capability evidence</p>
        <h2
          id="claims-matrix-heading"
          className="mt-1 text-lg font-semibold text-slate-900 dark:text-white"
        >
          Claims verification matrix
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Declared capability versus evidence demonstrated by the predefined
          demo dataset. Aggregate results apply only to the stated scope.
        </p>
        <div
          className="mt-3 flex flex-wrap gap-2 text-xs"
          aria-label="Verification status key"
        >
          <span className="rounded border border-emerald-200 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-500/15 px-2 py-1 font-semibold text-emerald-800 dark:text-emerald-300">
            Demonstrated
          </span>
          <span className="rounded border border-amber-200 dark:border-yellow-500/40 bg-amber-50 dark:bg-yellow-500/15 px-2 py-1 font-semibold text-amber-800 dark:text-yellow-300">
            Partially demonstrated
          </span>
          <span className="rounded border border-rose-200 dark:border-red-500/40 bg-rose-50 dark:bg-red-500/15 px-2 py-1 font-semibold text-rose-700 dark:text-red-300">
            Not demonstrated
          </span>
        </div>
      </div>
      {loading ? (
        <p className="p-6 text-slate-500 dark:text-slate-400" role="status">
          Loading claims verification evidence…
        </p>
      ) : error ? (
        <div className="p-6" role="alert">
          <p className="text-rose-700 dark:text-red-300">{error}</p>
          <button
            type="button"
            onClick={() => void load()}
            className="mt-3 rounded bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
          >
            Retry
          </button>
        </div>
      ) : claims.length === 0 ? (
        <p className="p-6 text-slate-500 dark:text-slate-400">
          No predefined claims were returned for verification.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 p-4 xl:grid-cols-2">
          {claims.map((claim, index) => (
            <article
              key={`${claim.claim}-${index}`}
              className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/25 p-4 shadow-xs"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h3 className="font-semibold text-slate-900 dark:text-white">{claim.claim}</h3>
                <span
                  className={`rounded border px-2 py-1 text-xs font-bold uppercase tracking-wide ${statusStyle(claim.status)}`}
                >
                  {claim.status}
                </span>
              </div>
              <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                    Declared
                  </dt>
                  <dd className="mt-1 text-slate-800 dark:text-slate-200">
                    {display(claim.declared)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                    Demonstrated
                  </dt>
                  <dd className="mt-1 text-slate-800 dark:text-slate-200">
                    {display(claim.demonstrated)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                    Evidence metrics
                  </dt>
                  <dd className="mt-1 break-words font-mono text-xs text-sky-700 dark:text-blue-200">
                    {display(claim.evidence)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                    Benchmark
                  </dt>
                  <dd className="mt-1 text-slate-800 dark:text-slate-200">
                    {display(claim.benchmark)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                    Reason
                  </dt>
                  <dd className="mt-1 text-slate-800 dark:text-slate-200">
                    {display(claim.reason)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                    Scope
                  </dt>
                  <dd className="mt-1 text-slate-800 dark:text-slate-200">
                    {display(claim.scope)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                    Missing evidence
                  </dt>
                  <dd className="mt-1 text-slate-800 dark:text-slate-200">
                    {claim.missing_evidence?.length
                      ? claim.missing_evidence.join("; ")
                      : "None identified"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                    Next review action
                  </dt>
                  <dd className="mt-1 text-slate-800 dark:text-slate-200">
                    {display(claim.next_review_action)}
                  </dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
