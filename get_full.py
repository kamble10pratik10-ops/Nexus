import json
import pandas as pd
import sys
import os
sys.path.append(os.path.abspath('backend'))
from main import get_nlp_findings

def get_full():
    df = pd.read_csv('backend/data/mock_cases.csv')
    case_to_notes = dict(zip(df.case_id, df.investigation_notes))
    
    gt_data = json.load(open('backend/data/ground_truth.json'))
    nlp_gt = [g for g in gt_data if g['type'] == 'Templated Investigation (Semantic)']
    gt_nlp_cases = set(g.get('case_id') for g in nlp_gt if g.get('case_id'))
    
    nlp_findings = get_nlp_findings().get('findings', [])
    
    nlp_fps = []
    for f in nlp_findings:
        cases = f.get('evidence', {}).get('case_ids', [])
        for c in cases:
            if c not in gt_nlp_cases:
                nlp_fps.append((c, case_to_notes.get(c, '')))
                
    for c, text in nlp_fps:
        print(f"FP Case {c}:\n{text}\n")
        
    print(f"Total NLP FPs: {len(nlp_fps)}")
    
if __name__ == "__main__":
    get_full()
