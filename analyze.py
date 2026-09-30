import json
import sys
import os
sys.path.append(os.path.abspath('backend'))
from main import get_nlp_findings, get_metric_integrity, load_data

def main():
    with open('backend/data/ground_truth.json') as f:
        gt_data = json.load(f)

    # Normalize GT
    gt_set = set()
    for item in gt_data:
        ent = item.get('entity_id', 'ALL')
        gt_set.add((item['type'], ent))

    global_engines = [
        'Case-ID Sequence Gap (Deleted Records)', 
        'Round-Number Duration Clustering',
        'Timestamp Digit Anomaly (Benford\'s Law)',
        'Shift-End Quality Degradation',
        'Capacity Overload Risk'
    ]

    normalized_gt_set = set()
    for t, e in gt_set:
        if t in global_engines:
            normalized_gt_set.add((t, 'ALL'))
        else:
            normalized_gt_set.add((t, e))

    print('=== NLP Findings ===')
    nlp = get_nlp_findings().get('findings', [])
    for n in nlp:
        print(f"Entity: {n.get('entity_id', 'MISSING')}")
        print(f"Snippet: {n.get('evidence', {}).get('text_snippet', '')}")
        print(f"Case IDs: {n.get('evidence', {}).get('case_ids', [])}")
        print('---')

    print('=== Metric Integrity ===')
    mi = get_metric_integrity().get('findings', [])
    mi_pred = set((f['type'], f.get('entity_id', 'ALL')) for f in mi)
    
    mi_types = set([f['type'] for f in mi])
    print(f"Metric Integrity predicted types: {mi_types}")
    
    gt_mi_types = ['Severity Downgrade', 'SLA Clock Reset'] # Need to find out what types fall under MI
    for t in mi_types:
        gt_mi_types.append(t)
    gt_mi_types = set(gt_mi_types)
    
    print("\nMisses by subtype:")
    misses = {}
    for t, e in normalized_gt_set:
        if t in ['Severity Downgrade', 'SLA Clock Reset', 'Metric Definition Sensitivity', 'MTTR Definition Spread', 'Alert Status Toggling']:
            if (t, e) not in mi_pred:
                misses[t] = misses.get(t, 0) + 1
                
    for k, v in misses.items():
        print(f"  {k}: {v} misses")

if __name__ == '__main__':
    main()
