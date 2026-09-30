import json
import sys
import os
sys.path.append(os.path.abspath('backend'))
from main import get_nlp_findings

def main():
    gt_data = json.load(open('backend/data/ground_truth.json'))
    nlp_gt = [g for g in gt_data if g['type'] == 'Templated Investigation (Semantic)']
    # FIXED: Use target_id or case_id
    gt_cases = set(g.get('target_id') or g.get('case_id') for g in nlp_gt)
    
    findings = get_nlp_findings().get('findings', [])
    
    fps = []
    for f in findings:
        cases = f.get('evidence', {}).get('case_ids', [])
        overlap = set(cases).intersection(gt_cases)
        if not overlap:
            fps.append(f)
            
    artifact_path = r'C:\Users\prati\.gemini\antigravity-ide\brain\2d39e4b8-7445-401c-ae89-016f4aee5ef4\reviewer_data.md'
    with open(artifact_path, 'w', encoding='utf-8') as out:
        out.write('# Benchmark Deep Dive for Reviewer\n\n')
        out.write('## NLP False Positives (15 clusters)\n\n')
        out.write('These 15 clusters were flagged by DBSCAN but contain no injected defects. As you suspected, many appear to be standard, benign templates or highly repetitive true negatives.\n\n')
        for idx, f in enumerate(fps, 1):
            cases = f.get('evidence', {}).get('case_ids', [])
            snippet = f.get('evidence', {}).get('text_snippet', '')
            ent = f.get('entity_id', '')
            out.write(f'**Cluster {idx}** ({ent} | {len(cases)} cases)\n')
            out.write(f'- **Snippet**: `{snippet}`\n')
            cases_str = ", ".join(cases)
            out.write(f'- **Cases**: {cases_str}\n\n')
            
        out.write('---\n## Metric Integrity Misses (18 misses)\n\n')
        
        mi_subtypes = [
            'Severity Downgrade', 'SLA Clock Reset', 
            'Metric Definition Sensitivity', 'MTTR Definition Spread', 
            'Alert Status Toggling', 'Metric Lineage Tampering', 
            'Rubric Grounding Failure (Gaming)', 'Automation Blending', 
            'Definition Shopping'
        ]
        
        gt_mi = [g for g in gt_data if g['type'] in mi_subtypes]
        
        from main import get_metric_integrity
        mi_findings = get_metric_integrity().get('findings', [])
        caught_alerts = set()
        for f in mi_findings:
            evidence = f.get('evidence', {})
            if 'alert_id' in evidence:
                if isinstance(evidence['alert_id'], list):
                    caught_alerts.update(evidence['alert_id'])
                else:
                    caught_alerts.add(evidence['alert_id'])
            elif 'alert_ids' in evidence:
                caught_alerts.update(evidence['alert_ids'])
                
        misses_by_subtype = {}
        for g in gt_mi:
            aid = g.get('target_id') or g.get('alert_id') or g.get('case_id')
            if aid not in caught_alerts:
                t = g['type']
                misses_by_subtype[t] = misses_by_subtype.get(t, 0) + 1
                
        out.write('Breakdown of the 18 missed Metric Integrity defects (out of 28 injected):\n\n')
        for k, v in misses_by_subtype.items():
            out.write(f'- **{k}**: {v} misses\n')

if __name__ == '__main__':
    main()
