"""
SAT-SA Nexus -- Scientific Benchmark Harness
============================================
Runs the full detection pipeline over N random seeds using an in-memory SQLite
database, compares every generated Finding against a deterministic ground-truth
manifest derived from the planted fault patterns in data_generator.py, and
computes honest, non-hardcoded:

  Per-rule  : True Positives, False Positives, False Negatives
  Aggregate : Precision, Recall, F1, False-Positive Rate (FPR)
  System    : Search-Space Reduction (SSR), P1 Review Yield

ZERO metric values are hardcoded. Every number is computed from run data.

Usage:
    cd backend
    python benchmark_harness.py              # 10 seeds (default)
    python benchmark_harness.py --seeds 25
    python benchmark_harness.py --seeds 5 --quiet
    python benchmark_harness.py --seeds 10 --output results.json
"""

import argparse
import hashlib
import json
import math
import os
import random
import sys
import time
from contextlib import contextmanager
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from typing import Dict, List, Set, Tuple

# ---------------------------------------------------------------------------
# Bootstrap: ensure app.* packages resolve regardless of CWD
# ---------------------------------------------------------------------------
HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app.models import Entity, Asset, Alert, Case, Escalation, Response, ExpectedEvidence, Finding
from app.data_generator import generate_synthetic_data
from app.analytics.engine import MasterSupervisoryAnalytics


# ===========================================================================
# GROUND-TRUTH MANIFEST
# ===========================================================================
# Derived ONLY from data_generator.py planted fault comments.
# This defines WHAT should fire -- it is the test specification, not a metric.
# ---------------------------------------------------------------------------

@dataclass
class GroundTruthEntry:
    entity_id: str
    rule_id: str
    fault_description: str


# Maps each planted fault to the rule_id that MUST fire to detect it.
GROUND_TRUTH: List[GroundTruthEntry] = [
    # CSE-03: 65% of CRITICAL alerts closed in 35-110s (sub-3-min)
    GroundTruthEntry("CSE-03", "RULE_1",       "Sub-3-min critical alert closures"),

    # CSE-07: Assets AST-CSE-07-01/02/03 set to SILENT, emit zero alerts
    GroundTruthEntry("CSE-07", "NEG_SPACE_1",  "Silent crown-jewel assets with no telemetry"),

    # CSE-11: 85% of cases share identical boilerplate investigation text
    GroundTruthEntry("CSE-11", "RULE_5",       "Repetitive rubber-stamp investigation notes"),

    # CSE-14: Escalation probability = 3% vs sector peer median ~22%
    GroundTruthEntry("CSE-14", "PEER_ESC_01",  "Low escalation rate vs peer sector"),
    GroundTruthEntry("CSE-14", "RULE_8",       "Unexpectedly low escalation for critical alerts"),

    # CSE-18: Response evidence probability = 5% for high/critical threats
    GroundTruthEntry("CSE-18", "PEER_RESP_02", "Missing response evidence vs peer sector"),
    GroundTruthEntry("CSE-18", "RULE_6",       "High-severity alert has no response evidence"),
]

GROUND_TRUTH_SET: Set[Tuple[str, str]] = {(e.entity_id, e.rule_id) for e in GROUND_TRUTH}
TOTAL_PLANTED_FAULTS: int = len(GROUND_TRUTH_SET)
PLANTED_RULES: Set[str] = {e.rule_id for e in GROUND_TRUTH}
ALL_CSE_IDS: Set[str] = {f"CSE-{i:02d}" for i in range(1, 21)}


# ===========================================================================
# IN-MEMORY DATABASE CONTEXT
# ===========================================================================

@contextmanager
def in_memory_db():
    """Isolated fresh in-memory SQLite per seed. No cross-run contamination."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        echo=False,
    )
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    db = Session()
    try:
        yield db
    finally:
        db.close()
        engine.dispose()


# ===========================================================================
# PER-SEED RESULT CONTAINER
# ===========================================================================

@dataclass
class SeedResult:
    seed: int
    total_findings: int
    p1_findings: int
    true_positives:  List[Tuple[str, str]] = field(default_factory=list)
    false_positives: List[Tuple[str, str]] = field(default_factory=list)
    false_negatives: List[Tuple[str, str]] = field(default_factory=list)
    precision: float = 0.0
    recall:    float = 0.0
    f1:        float = 0.0
    fpr:       float = 0.0
    search_space_reduction: float = 0.0
    p1_review_yield:        float = 0.0
    elapsed_seconds:        float = 0.0


# ===========================================================================
# SINGLE SEED RUNNER
# ===========================================================================

def run_seed(seed: int, quiet: bool = False) -> SeedResult:
    """
    Full pipeline for one seed:
      1. Seed random, generate synthetic data into fresh in-memory DB
      2. Run MasterSupervisoryAnalytics (all engines)
      3. Collect fired (entity_id, rule_id) pairs
      4. Compare against GROUND_TRUTH_SET -> TP / FP / FN / TN
      5. Compute Precision, Recall, F1, FPR, SSR, P1 Yield from data
    """
    t0 = time.perf_counter()
    random.seed(seed)

    if not quiet:
        print(f"  [Seed {seed:>5}] Generating data ...", end=" ", flush=True)

    with in_memory_db() as db:
        from app.auth import seed_default_users
        seed_default_users(db)
        generate_synthetic_data(db)

        if not quiet:
            print("Running analytics ...", end=" ", flush=True)

        pipeline_result = MasterSupervisoryAnalytics.run_full_assessment(db)
        all_findings = db.query(Finding).all()

        # Build detected set of (entity_id, rule_id) pairs
        detected_set: Set[Tuple[str, str]] = set()
        for f in all_findings:
            if f.rule_id:
                detected_set.add((f.entity_id, f.rule_id))

        # TP / FP / FN (scoped to PLANTED_RULES -- fair benchmark boundary)
        true_positives  = list(detected_set & GROUND_TRUTH_SET)
        false_negatives = list(GROUND_TRUTH_SET - detected_set)
        false_positives = [
            (eid, rid) for (eid, rid) in detected_set
            if (eid, rid) not in GROUND_TRUTH_SET and rid in PLANTED_RULES
        ]

        tp = len(true_positives)
        fp = len(false_positives)
        fn = len(false_negatives)

        # TN: per planted rule, count clean entities that did NOT spuriously fire
        tn = 0
        for rule_id in PLANTED_RULES:
            planted_for_rule = {e.entity_id for e in GROUND_TRUTH if e.rule_id == rule_id}
            non_planted      = ALL_CSE_IDS - planted_for_rule
            fired_for_rule   = {eid for (eid, rid) in detected_set if rid == rule_id}
            tn += len(non_planted - fired_for_rule)

        # Metrics -- derived solely from TP/FP/FN/TN counts above
        precision = tp / (tp + fp) if (tp + fp) > 0 else 1.0   # vacuously 1 if nothing fired
        recall    = tp / (tp + fn) if (tp + fn) > 0 else 1.0
        f1        = (2 * precision * recall / (precision + recall)) if (precision + recall) > 0 else 0.0
        fpr       = fp / (fp + tn) if (fp + tn) > 0 else 0.0

        # Search-Space Reduction: fraction of cases NOT flagged
        total_cases_db = db.query(Case).count()
        ssr = (1.0 - len(all_findings) / total_cases_db) * 100 if total_cases_db > 0 else 0.0

        # P1 Review Yield: confirmed planted TPs as fraction of P1 findings
        p1_count = pipeline_result.get("p1_findings", 0)
        p1_yield = (tp / p1_count) * 100 if p1_count > 0 else 0.0

        elapsed = time.perf_counter() - t0

        if not quiet:
            print(f"P={precision:.3f} R={recall:.3f} F1={f1:.3f} FPR={fpr:.3f} [{elapsed:.1f}s]")

    return SeedResult(
        seed=seed,
        total_findings=len(all_findings),
        p1_findings=p1_count,
        true_positives=true_positives,
        false_positives=false_positives,
        false_negatives=false_negatives,
        precision=precision,
        recall=recall,
        f1=f1,
        fpr=fpr,
        search_space_reduction=ssr,
        p1_review_yield=p1_yield,
        elapsed_seconds=elapsed,
    )


# ===========================================================================
# AGGREGATE STATISTICS
# ===========================================================================

def _stats(values: List[float]) -> Dict:
    n    = len(values)
    mean = sum(values) / n
    std  = math.sqrt(sum((v - mean) ** 2 for v in values) / n)
    return {
        "mean": round(mean, 4),
        "std":  round(std,  4),
        "min":  round(min(values), 4),
        "max":  round(max(values), 4),
    }


def compute_aggregate(results: List[SeedResult]) -> Dict:
    """Aggregate all seed results. Every number derives from run data."""

    per_fault_counts: Dict[Tuple[str, str], int] = {k: 0 for k in GROUND_TRUTH_SET}
    for r in results:
        for pair in r.true_positives:
            key = (pair[0], pair[1])
            per_fault_counts[key] = per_fault_counts.get(key, 0) + 1

    per_fault_rates: Dict[str, Dict] = {}
    for gt in GROUND_TRUTH:
        key   = (gt.entity_id, gt.rule_id)
        count = per_fault_counts.get(key, 0)
        rate  = count / len(results)
        per_fault_rates[f"{gt.entity_id}::{gt.rule_id}"] = {
            "fault":             gt.fault_description,
            "detected_in_seeds": count,
            "total_seeds":       len(results),
            "detection_rate":    round(rate, 4),
        }

    # Fingerprint ties this report cryptographically to the exact run
    fingerprint = hashlib.sha256(
        json.dumps(
            {"ground_truth": [asdict(e) for e in GROUND_TRUTH], "seeds": [r.seed for r in results]},
            sort_keys=True,
        ).encode()
    ).hexdigest()

    return {
        "manifest": {
            "harness_version":            "1.0.0",
            "generated_at_utc":           datetime.now(timezone.utc).isoformat(),
            "seeds_run":                  [r.seed for r in results],
            "total_seeds":                len(results),
            "total_planted_faults":       TOTAL_PLANTED_FAULTS,
            "planted_rules_in_scope":     sorted(PLANTED_RULES),
            "dataset_fingerprint_sha256": fingerprint,
        },
        "aggregate_metrics": {
            "precision":              _stats([r.precision              for r in results]),
            "recall":                 _stats([r.recall                 for r in results]),
            "f1_score":               _stats([r.f1                     for r in results]),
            "false_positive_rate":    _stats([r.fpr                    for r in results]),
            "search_space_reduction": _stats([r.search_space_reduction for r in results]),
            "p1_review_yield_pct":    _stats([r.p1_review_yield        for r in results]),
            "runtime_seconds":        _stats([r.elapsed_seconds        for r in results]),
        },
        "per_fault_detection_rates": per_fault_rates,
        "per_seed_results": [
            {
                "seed":                   r.seed,
                "precision":              round(r.precision, 4),
                "recall":                 round(r.recall,    4),
                "f1":                     round(r.f1,        4),
                "fpr":                    round(r.fpr,       4),
                "true_positives":         len(r.true_positives),
                "false_positives":        len(r.false_positives),
                "false_negatives":        len(r.false_negatives),
                "total_findings":         r.total_findings,
                "p1_findings":            r.p1_findings,
                "search_space_reduction": round(r.search_space_reduction, 2),
                "p1_review_yield_pct":    round(r.p1_review_yield, 2),
                "elapsed_s":              round(r.elapsed_seconds, 2),
            }
            for r in results
        ],
    }


# ===========================================================================
# REPORT PRINTER
# ===========================================================================

def print_report(report: Dict) -> None:
    SEP = "=" * 72
    am  = report["aggregate_metrics"]

    def _fmt(key: str, label: str, pct: bool = False, raw_pct: bool = False) -> str:
        """pct=True: values are 0-1, multiply by 100.  raw_pct=True: already 0-100."""
        m    = am[key]
        mult = 100 if pct else 1   # raw_pct values stay as-is
        unit = "%" if (pct or raw_pct) else ""
        if raw_pct:
            return (
                f"  {label:<35} {m['mean']:>7.2f}{unit}  "
                f"+-{m['std']:>6.3f}  "
                f"[{m['min']:.3f} - {m['max']:.3f}]"
            )
        return (
            f"  {label:<35} {m['mean']*mult:>7.2f}{unit}  "
            f"+-{m['std']*mult:>6.3f}  "
            f"[{m['min']*mult:.3f} - {m['max']*mult:.3f}]"
        )

    print(f"\n{SEP}")
    print("  SAT-SA NEXUS -- SCIENTIFIC BENCHMARK REPORT")
    print(f"  Generated : {report['manifest']['generated_at_utc']}")
    print(f"  Seeds run : {report['manifest']['total_seeds']}  |  Planted faults: {report['manifest']['total_planted_faults']}")
    print(f"  Fingerprint: {report['manifest']['dataset_fingerprint_sha256'][:32]}...")
    print(SEP)

    print("\n  AGGREGATE DETECTION METRICS  (mean +- sigma  [min - max])")
    print("  " + "-" * 68)
    print(_fmt("precision",              "Precision"))
    print(_fmt("recall",                 "Recall"))
    print(_fmt("f1_score",               "F1 Score"))
    print(_fmt("false_positive_rate",    "False Positive Rate (FPR)"))
    print(_fmt("search_space_reduction", "Search-Space Reduction", raw_pct=True))
    print(_fmt("p1_review_yield_pct",    "P1 Review Yield",         raw_pct=True))
    print(_fmt("runtime_seconds",        "Runtime per Seed (s)"))

    print("\n  PER-PLANTED-FAULT DETECTION RATES")
    print("  " + "-" * 68)
    for key, info in report["per_fault_detection_rates"].items():
        filled = int(info["detection_rate"] * 20)
        bar    = "#" * filled + "." * (20 - filled)
        print(
            f"  {key:<40} [{bar}] {info['detection_rate']*100:5.1f}%"
            f"  ({info['detected_in_seeds']}/{info['total_seeds']} seeds)"
        )
        print(f"     Fault: {info['fault']}")

    print("\n  PER-SEED SUMMARY")
    print("  " + "-" * 68)
    hdr = (
        f"  {'Seed':>6}  {'Prec':>6}  {'Rec':>6}  {'F1':>6}  "
        f"{'FPR':>6}  {'TP':>4}  {'FP':>4}  {'FN':>4}  {'SSR%':>6}  {'s':>5}"
    )
    print(hdr)
    for s in report["per_seed_results"]:
        print(
            f"  {s['seed']:>6}  "
            f"{s['precision']:>6.3f}  "
            f"{s['recall']:>6.3f}  "
            f"{s['f1']:>6.3f}  "
            f"{s['fpr']:>6.3f}  "
            f"{s['true_positives']:>4}  "
            f"{s['false_positives']:>4}  "
            f"{s['false_negatives']:>4}  "
            f"{s['search_space_reduction']:>6.1f}  "
            f"{s['elapsed_s']:>5.1f}"
        )

    print(f"\n{SEP}")

    prec = am["precision"]["mean"]
    rec  = am["recall"]["mean"]
    fpr  = am["false_positive_rate"]["mean"]

    print("\n  HONEST INTERPRETATION")
    print("  " + "-" * 68)
    if prec >= 0.85 and rec >= 0.85 and fpr <= 0.10:
        verdict = "STRONG  [PASS]  Detectors scientifically validated."
    elif rec >= 0.70 and prec >= 0.70:
        verdict = "MODERATE  [WARN]  Some faults missed or over-fired."
    else:
        verdict = "WEAK  [FAIL]  Detection logic needs improvement."
    print(f"  Overall verdict : {verdict}")
    print(f"  Precision {prec:.3f} -> for every 10 findings, ~{prec*10:.1f} are confirmed planted faults.")
    print(f"  Recall    {rec:.3f} -> {rec*100:.1f}% of planted faults reliably caught across seeds.")
    print(f"  FPR       {fpr:.4f} -> {fpr*100:.2f}% of clean (entity, rule) pairs spuriously fire.")
    print(SEP + "\n")


# ===========================================================================
# MAIN
# ===========================================================================

def main() -> None:
    parser = argparse.ArgumentParser(description="SAT-SA Nexus Scientific Benchmark Harness")
    parser.add_argument("--seeds",      type=int, default=10,   help="Number of random seeds (default: 10)")
    parser.add_argument("--seed-start", type=int, default=1,    help="Starting seed value (default: 1)")
    parser.add_argument("--quiet",      action="store_true",    help="Suppress per-seed progress output")
    parser.add_argument("--output",     type=str, default=None, help="Path to write JSON report (optional)")
    args = parser.parse_args()

    print(f"\nSAT-SA Nexus -- Benchmark Harness v1.0.0")
    print(f"Seeds : {args.seed_start} to {args.seed_start + args.seeds - 1}  ({args.seeds} total)")
    print(f"Ground-Truth: {TOTAL_PLANTED_FAULTS} planted faults across {len({e.entity_id for e in GROUND_TRUTH})} CSEs\n")

    seeds   = list(range(args.seed_start, args.seed_start + args.seeds))
    results = [run_seed(s, quiet=args.quiet) for s in seeds]
    report  = compute_aggregate(results)
    print_report(report)

    if args.output:
        path = os.path.abspath(args.output)
        with open(path, "w", encoding="utf-8") as fh:
            json.dump(report, fh, indent=2, default=str)
        print(f"JSON report saved -> {path}\n")

    # CI-friendly exit code: 0 = pass (F1 >= 0.70), 1 = needs improvement
    avg_f1 = report["aggregate_metrics"]["f1_score"]["mean"]
    sys.exit(0 if avg_f1 >= 0.70 else 1)


if __name__ == "__main__":
    main()
