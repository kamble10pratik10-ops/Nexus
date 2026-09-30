import pandas as pd
import numpy as np

alerts = pd.read_csv('backend/data/mock_alerts.csv')
cases = pd.read_csv('backend/data/mock_cases.csv')
cases_ext = pd.merge(cases, alerts[['alert_id', 'closed_by']], on='alert_id', how='left')

lazy_templates = [
    'I looked at the logs and saw nothing bad. The system is fine. Closing this.',
    'No malware found after scanning the host. Everything is clean.',
    'Checked VT, checked crowdstrike, no issues found. Resolving alert now.'
]

cases_ext['is_lazy'] = cases_ext['investigation_text'].isin(lazy_templates)

stats = []
for analyst, group in cases_ext.groupby('closed_by'):
    if analyst != 'SOAR':
        lazy_count = group['is_lazy'].sum()
        total = len(group)
        print(f'{analyst}: {lazy_count} / {total} ({lazy_count/total*100:.1f}%)')
        stats.append(lazy_count/total if total > 0 else 0)

if stats:
    median = np.median(stats)
    mad = np.median(np.abs(stats - median)) or 0.01
    z_scores = 0.6745 * (stats - median) / mad
    print(f'Median: {median:.3f}, MAD: {mad:.3f}')
    print(f'Z-scores: {z_scores}')
