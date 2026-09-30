import json
import pandas as pd
from main import (
    get_metric_integrity,
    get_evidence_forensics,
    get_investigation_quality,
    get_execution_gaps,
    get_peer_blindspot,
    get_nlp_findings
)

ENGINE_TARGETS = {
    'get_metric_integrity': ['Severity Downgrade', 'SLA Clock Reset', 'Metric Lineage Tampering', 'Alert Status Toggling', 'MTTR Definition Spread', 'Metric Definition Sensitivity'],
    'get_investigation_quality': ['Rubric Grounding Failure (Gaming)', 'Zombie Case (No Evidence)', 'Broken Evidence Chain (No Escalation)'],
    'get_nlp_findings': ['Templated Investigation (Semantic)'],
    'get_evidence_forensics': ['Round-Number Duration Clustering', 'Case-ID Sequence Gap (Deleted Records)', 'Timestamp Digit Anomaly (Benford\'s Law)'],
    'get_execution_gaps': ['Fast Closure', 'Uniform Inter-Arrival (Fabrication Risk)', 'Capacity Overload Risk'],
    'get_peer_blindspot': ['Peer Blind-Spot (Missing Detection)']
}

def get_cases_for_finding(finding):
    ev = finding.get('evidence', {})
    cases = set()
    for key in ['case_id', 'case_ids', 'alert_id', 'alert_ids', 'entity_id']:
        val = ev.get(key)
        if val is not None:
            if isinstance(val, list):
                cases.update(val)
            else:
                cases.add(val)
    if not cases and finding.get('entity_id'):
        cases.add(finding.get('entity_id'))
    return cases

def run_benchmark():
    import os
    try:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        with open(os.path.join(base_dir, 'data', 'ground_truth.json'), 'r') as f:
            gt_data = json.load(f)
    except Exception as e:
        print(f"Error loading ground truth: {e}")
        return

    print(f"Loaded {len(gt_data)} raw injected anomalies.")

    engines = [
        get_metric_integrity,
        get_evidence_forensics,
        get_investigation_quality,
        get_execution_gaps,
        get_peer_blindspot,
        get_nlp_findings
    ]

    results = []
    total_tp = total_fp = total_fn = 0

    for engine in engines:
        engine_name = engine.__name__
        targets = ENGINE_TARGETS.get(engine_name, [])
        print(f"Running {engine_name}...")
        res = engine()
        findings = res.get('findings', [])
        
        # Filter GT to only this engine's targets
        engine_gt = [g for g in gt_data if g['type'] in targets]
        
        # Build GT case set
        gt_cases = set()
        for g in engine_gt:
            gt_cases.add(g.get('target_id') or g.get('case_id') or g.get('alert_id') or g.get('entity_id', 'ALL'))
            
        pred_cases = set()
        for f in findings:
            pred_cases.update(get_cases_for_finding(f))
            
        tp = len(gt_cases.intersection(pred_cases))
        fp = len(pred_cases - gt_cases)
        fn = len(gt_cases - pred_cases)
        
        if len(gt_cases) == 0 and len(pred_cases) == 0:
            continue
            
        total_tp += tp
        total_fp += fp
        total_fn += fn
        
        precision = tp / (tp + fp) if (tp + fp) > 0 else 0
        recall = tp / (tp + fn) if (tp + fn) > 0 else 0
        f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0
        
        results.append({
            "Engine": engine_name,
            "Injected (GT)": len(gt_cases),
            "Detected (Preds)": len(pred_cases),
            "TP": tp,
            "FP": fp,
            "FN": fn,
            "Precision": f"{precision*100:.1f}%",
            "Recall": f"{recall*100:.1f}%",
            "F1 Score": f"{f1*100:.1f}%"
        })

    print("\n# SAT-SA Nexus: Engine-Level Benchmark Report\n")
    df = pd.DataFrame(results)
    print(df.to_markdown(index=False))

    total_precision = total_tp / (total_tp + total_fp) if (total_tp + total_fp) > 0 else 0
    total_recall = total_tp / (total_tp + total_fn) if (total_tp + total_fn) > 0 else 0
    total_f1 = 2 * (total_precision * total_recall) / (total_precision + total_recall) if (total_precision + total_recall) > 0 else 0

    print("\n### Overall Platform Performance (Case-Level)")
    print(f"- **Precision:** {total_precision*100:.1f}%")
    print(f"- **Recall:** {total_recall*100:.1f}%")
    print(f"- **F1 Score:** {total_f1*100:.1f}%")

if __name__ == '__main__':
    run_benchmark()
