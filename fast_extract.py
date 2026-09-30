import json
import pandas as pd

gt_data = json.load(open('backend/data/ground_truth.json'))
alerts_df = pd.read_csv('backend/data/mock_alerts.csv')
cases_df = pd.read_csv('backend/data/mock_cases.csv')

nlp_gt = [g for g in gt_data if g['type'] == 'Templated Investigation (Semantic)']
print('=== Injected NLP Cases ===')
for g in nlp_gt[:3]:
    cid = g.get('target_id') or g.get('case_id')
    row = cases_df[cases_df['case_id'] == cid]
    if not row.empty:
        print(f'Case: {cid}')
        print(f"Text: {row.iloc[0]['investigation_text']}")
        print('-'*40)

sev_gt = [g for g in gt_data if g['type'] == 'Severity Downgrade']
print('\n=== Missed Severity Downgrades ===')
for g in sev_gt[:3]:
    aid = g.get('alert_id') or g.get('target_id')
    row = alerts_df[alerts_df['alert_id'] == aid]
    if not row.empty:
        print(f'Alert ID: {aid}')
        for col in row.columns:
            print(f'  {col}: {row.iloc[0][col]}')
        print('-'*40)
