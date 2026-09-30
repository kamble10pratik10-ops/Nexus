import json
import sys
import os
sys.path.append(os.path.abspath('backend'))
from main import get_nlp_findings, get_metric_integrity

def main():
    gt_data = json.load(open('backend/data/ground_truth.json'))

    print("=== Metric Integrity Misses Breakdown ===")
    mi_findings = get_metric_integrity().get('findings', [])
    # get_metric_integrity returns findings like:
    # {"type": "Severity Downgrade", "entity_id": "ENT-001", "evidence": {"alert_ids": [...]}}
    # Ground truth has: {"type": "Severity Downgrade", "entity_id": "ENT-001", "case_id": "..." or "alert_id": "..."}
    
    mi_subtypes = [
        "Severity Downgrade", "SLA Clock Reset", 
        "Metric Definition Sensitivity", "MTTR Definition Spread", 
        "Alert Status Toggling", "Metric Lineage Tampering", 
        "Rubric Grounding Failure (Gaming)", "Automation Blending", 
        "Definition Shopping"
    ]
    
    gt_mi = [g for g in gt_data if g['type'] in mi_subtypes]
    
    # We need to see which ones are missed. 
    # If the engine groups by entity, how did the reviewer count 10 caught, 18 missed?
    # By counting the individual alerts/cases caught in the evidence!
    caught_alerts = set()
    for f in mi_findings:
        evidence = f.get("evidence", {})
        if "alert_id" in evidence:
            if isinstance(evidence["alert_id"], list):
                caught_alerts.update(evidence["alert_id"])
            else:
                caught_alerts.add(evidence["alert_id"])
        elif "alert_ids" in evidence:
            caught_alerts.update(evidence["alert_ids"])
            
    misses_by_subtype = {}
    total_injected = 0
    total_missed = 0
    for g in gt_mi:
        total_injected += 1
        aid = g.get("alert_id") or g.get("case_id")
        if aid not in caught_alerts:
            t = g['type']
            misses_by_subtype[t] = misses_by_subtype.get(t, 0) + 1
            total_missed += 1
            
    for k, v in misses_by_subtype.items():
        print(f"{k}: {v} misses")
        
    print(f"\nTotal MI injected: {total_injected}, Total missed: {total_missed}, Caught: {total_injected - total_missed}")

    print("\n=== NLP False Positives ===")
    nlp_findings = get_nlp_findings().get('findings', [])
    nlp_gt = [g for g in gt_data if g['type'] == 'Templated Investigation (Semantic)']
    
    gt_nlp_cases = set(g.get('case_id') for g in nlp_gt if g.get('case_id'))
    
    nlp_fps = []
    for f in nlp_findings:
        cases = f.get('evidence', {}).get('case_ids', [])
        # The reviewer says: "DBSCAN flags every member of a cluster, including the original case"
        # So inside 'cases', some are GT, some are FPs.
        # Let's extract the FPs.
        for c in cases:
            if c not in gt_nlp_cases:
                # This is a False Positive case
                nlp_fps.append((c, f.get('evidence', {}).get('text_snippet', '')))
                
    for c, text in nlp_fps:
        print(f"FP Case {c}: {text}")
        
    print(f"Total NLP FPs: {len(nlp_fps)}")

if __name__ == "__main__":
    main()
