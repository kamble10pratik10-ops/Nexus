import json
import pandas as pd
import sys
import os

sys.path.append(os.path.abspath('backend'))
from main import get_nlp_findings, get_metric_integrity

def main():
    gt_data = json.load(open('backend/data/ground_truth.json'))
    alerts_df = pd.read_csv('backend/data/mock_alerts.csv')
    cases_df = pd.read_csv('backend/data/mock_cases.csv')
    
    # 1. NLP Misses
    nlp_gt = [g for g in gt_data if g['type'] == 'Templated Investigation (Semantic)']
    # Find which ones were missed
    nlp_findings = get_nlp_findings().get('findings', [])
    flagged_nlp_cases = set()
    for f in nlp_findings:
        flagged_nlp_cases.update(f.get('evidence', {}).get('case_ids', []))
        
    missed_nlp = []
    for g in nlp_gt:
        cid = g.get('target_id') or g.get('case_id')
        if cid not in flagged_nlp_cases:
            missed_nlp.append(cid)
            
    print(f"=== Missed NLP Cases ({len(missed_nlp)}) ===")
    for cid in missed_nlp[:3]:
        row = cases_df[cases_df['case_id'] == cid]
        if not row.empty:
            print(f"Case ID: {cid}")
            print(f"Text: {row.iloc[0]['investigation_text']}")
            print("-" * 40)
            
    # 2. Metric Integrity Misses (Severity Downgrade)
    mi_findings = get_metric_integrity().get('findings', [])
    flagged_mi_alerts = set()
    for f in mi_findings:
        ev = f.get('evidence', {})
        if 'alert_ids' in ev:
            flagged_mi_alerts.update(ev['alert_ids'])
        elif 'alert_id' in ev:
            flagged_mi_alerts.update(ev['alert_id'] if isinstance(ev['alert_id'], list) else [ev['alert_id']])
            
    sev_gt = [g for g in gt_data if g['type'] == 'Severity Downgrade']
    missed_sev = []
    for g in sev_gt:
        aid = g.get('alert_id') or g.get('target_id')
        if aid not in flagged_mi_alerts:
            missed_sev.append(aid)
            
    print(f"\n=== Missed Severity Downgrades ({len(missed_sev)}) ===")
    for aid in missed_sev[:3]:
        row = alerts_df[alerts_df['alert_id'] == aid]
        if not row.empty:
            print(f"Alert ID: {aid}")
            for col in row.columns:
                print(f"  {col}: {row.iloc[0][col]}")
            print("-" * 40)
            
if __name__ == '__main__':
    main()
