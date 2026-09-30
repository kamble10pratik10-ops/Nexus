import os
import re

with open('backend/main.py', 'r', encoding='utf-8') as f:
    content = f.read()

# I need to extract the get_metric_integrity function and replace it.
# The function is somewhat long. It calculates severity downgrade using the alerts dataframe.
# Let's replace the whole get_metric_integrity function.

new_metric_integrity = '''@app.get("/api/findings/metric-integrity")
def get_metric_integrity():
    alerts, cases, events = load_data()
    if alerts is None:
        return {"error": "Data not found"}
        
    findings = []
    
    # Analyze the events audit trail for defects
    if not events.empty:
        # Detect Severity Downgrades
        severity_events = events[events['field'] == 'severity'].copy()
        severity_map = {"Critical": 4, "High": 3, "Medium": 2, "Low": 1, "Info": 0}
        
        for _, row in severity_events.iterrows():
            old_sev = row['old_value']
            new_sev = row['new_value']
            if pd.notna(old_sev) and pd.notna(new_sev):
                if severity_map.get(old_sev, 0) > severity_map.get(new_sev, 0):
                    alert_id = row['alert_id']
                    findings.append({
                        "finding_id": f"FND-MI-SEV-{alert_id}",
                        "type": "Severity Downgrade",
                        "entity_id": alerts[alerts['alert_id'] == alert_id]['entity_id'].iloc[0],
                        "severity": "Medium",
                        "description": f"Alert {alert_id} severity was downgraded from {old_sev} to {new_sev} by {row['actor']}.",
                        "evidence": {
                            "alert_id": alert_id,
                            "old_severity": old_sev,
                            "new_severity": new_sev
                        }
                    })
                    
        # Detect SLA Clock Resets
        status_events = events[events['field'] == 'status'].copy()
        status_events = status_events.sort_values(['alert_id', 'timestamp'])
        
        for alert_id, group in status_events.groupby('alert_id'):
            # Looking for sequence: Open -> Resolved -> Open
            states = group['new_value'].tolist()
            if "Resolved" in states:
                res_idx = states.index("Resolved")
                if "Open" in states[res_idx:]:
                    findings.append({
                        "finding_id": f"FND-MI-SLA-{alert_id}",
                        "type": "SLA Clock Reset",
                        "entity_id": alerts[alerts['alert_id'] == alert_id]['entity_id'].iloc[0],
                        "severity": "Medium",
                        "description": f"Alert {alert_id} status was toggled to Resolved and back to Open, potentially resetting SLA clocks.",
                        "evidence": {
                            "alert_id": alert_id
                        }
                    })
                    
    # Original metric integrity logic (e.g. MTTR spread)
    alerts['time_to_close_seconds'] = (alerts['closed_at'] - alerts['created_at']).dt.total_seconds()
    alerts['time_to_close_hours'] = alerts['time_to_close_seconds'] / 3600.0

    entity_mttr = alerts.groupby('entity_id')['time_to_close_hours'].mean().reset_index()
    entity_mttr.columns = ['entity_id', 'mean_mttr']
    
    entity_std = alerts.groupby('entity_id')['time_to_close_hours'].std().reset_index()
    entity_std.columns = ['entity_id', 'std_mttr']
    
    mttr_stats = pd.merge(entity_mttr, entity_std, on='entity_id')
    
    for _, row in mttr_stats.iterrows():
        if pd.notna(row['std_mttr']) and row['std_mttr'] > (row['mean_mttr'] * 2.5):
            findings.append({
                "finding_id": f"FND-MI-MTTR-{row['entity_id']}",
                "type": "MTTR Definition Spread",
                "entity_id": row['entity_id'],
                "severity": "Medium",
                "description": f"Extremely high variance in MTTR for {row['entity_id']} (Mean: {row['mean_mttr']:.1f}h, StdDev: {row['std_mttr']:.1f}h). Indicates inconsistent measurement or gaming.",
                "evidence": {
                    "entity_id": row['entity_id'],
                    "mean": row['mean_mttr'],
                    "std_dev": row['std_mttr']
                }
            })
            
    return {"findings": findings}'''

# Find the get_metric_integrity block
pattern = re.compile(r'@app\.get\("/api/findings/metric-integrity"\)\ndef get_metric_integrity\(\):.*?(?=@app\.get|\Z)', re.DOTALL)
content = pattern.sub(new_metric_integrity + '\n\n', content)

with open('backend/main.py', 'w', encoding='utf-8') as f:
    f.write(content)
