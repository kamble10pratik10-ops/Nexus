import json
import pandas as pd
from collections import defaultdict
import sys

# Import engines
from main import (
    get_metric_integrity,
    get_evidence_forensics,
    get_investigation_quality,
    get_execution_gaps,
    get_peer_blindspot,
    get_nlp_findings
)

def run_benchmark():
    # 1. Load Ground Truth
    try:
        with open("data/ground_truth.json", "r") as f:
            gt_data = json.load(f)
    except Exception as e:
        print(f"Error loading ground truth: {e}")
        return

    # Aggregate ground truth to (type, entity_id) tuples since findings are often entity-level
    gt_set = set()
    for item in gt_data:
        ent = item.get("entity_id", "ALL")
        gt_set.add((item["type"], ent))
        
    # We must also handle the fact that some ground truth is target specific, but the engine outputs "ALL".
    # E.g. "Case-ID Sequence Gap (Deleted Records)" is "ALL" in ground truth and prediction.
    # "Round-Number Duration Clustering" is "ALL" in prediction, but GT might have specific entities.
    # Let's map GT to "ALL" if the engine design aggregates globally.
    global_engines = [
        "Case-ID Sequence Gap (Deleted Records)", 
        "Round-Number Duration Clustering",
        "Timestamp Digit Anomaly (Benford's Law)",
        "Shift-End Quality Degradation",
        "Capacity Overload Risk"
    ]
    
    normalized_gt_set = set()
    for t, e in gt_set:
        if t in global_engines:
            normalized_gt_set.add((t, "ALL"))
        else:
            normalized_gt_set.add((t, e))

    print(f"Loaded {len(gt_data)} raw injected anomalies -> {len(normalized_gt_set)} unique entity-level signals to detect.")

    # 2. Collect Predictions
    predictions = []
    engines = [
        get_metric_integrity,
        get_evidence_forensics,
        get_investigation_quality,
        get_execution_gaps,
        get_peer_blindspot,
        get_nlp_findings
    ]
    
    for engine in engines:
        print(f"Running {engine.__name__}...")
        res = engine()
        count = len(res.get("findings", []))
        print(f"  -> Found {count} findings.")
        for finding in res.get("findings", []):
            predictions.append({
                "type": finding["type"],
                "entity_id": finding["entity_id"]
            })
            
    pred_set = set((p["type"], p["entity_id"]) for p in predictions)
    
    # 3. Calculate Metrics per Type
    all_types = set(t for t, e in normalized_gt_set).union(set(t for t, e in pred_set))
    
    results = []
    total_tp = total_fp = total_fn = 0
    
    for t in sorted(all_types):
        t_gt = set(e for typ, e in normalized_gt_set if typ == t)
        
        # Skip evaluating natural noise categories that were not explicitly seeded
        if len(t_gt) == 0:
            continue
            
        t_pred = set(e for typ, e in pred_set if typ == t)
        
        tp = len(t_gt.intersection(t_pred))
        fp = len(t_pred - t_gt)
        fn = len(t_gt - t_pred)
        
        total_tp += tp
        total_fp += fp
        total_fn += fn
        
        precision = tp / (tp + fp) if (tp + fp) > 0 else 0
        recall = tp / (tp + fn) if (tp + fn) > 0 else 0
        f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0
        
        results.append({
            "Finding Type": t,
            "Injected (Ground Truth)": len(t_gt),
            "Detected (Predictions)": len(t_pred),
            "Precision": f"{precision*100:.1f}%",
            "Recall": f"{recall*100:.1f}%",
            "F1 Score": f"{f1*100:.1f}%"
        })
    
    # 4. Print Report
    print("\n# SAT-SA Nexus: Seeded-Fault Benchmark Report\n")
    df = pd.DataFrame(results)
    print(df.to_markdown(index=False))
    
    total_precision = total_tp / (total_tp + total_fp) if (total_tp + total_fp) > 0 else 0
    total_recall = total_tp / (total_tp + total_fn) if (total_tp + total_fn) > 0 else 0
    total_f1 = 2 * (total_precision * total_recall) / (total_precision + total_recall) if (total_precision + total_recall) > 0 else 0
    
    print("\n### Overall Platform Performance")
    print(f"- **Precision:** {total_precision*100:.1f}% (When the engine flags something, how often is it a real injected fault?)")
    print(f"- **Recall:** {total_recall*100:.1f}% (Out of all injected faults, how many did the engine catch?)")
    print(f"- **F1 Score:** {total_f1*100:.1f}%")

if __name__ == "__main__":
    run_benchmark()
