import re

with open('backend/main.py', 'r', encoding='utf-8') as f:
    content = f.read()

new_func = '''@app.get("/api/findings/execution-gaps")
def get_execution_gaps():
    alerts, cases, events = load_data()
    if alerts is None or cases is None:
        return {"error": "Data not found"}
        
    findings = []
    
    alerts['time_to_close_seconds'] = (alerts['closed_at'] - alerts['created_at']).dt.total_seconds()
    
    # We merge alerts and cases because we need case context (escalated, investigation_actions)
    merged = alerts.merge(cases, on='alert_id', how='left')
    
    # Calculate category-level medians (minimum group size 5)
    category_medians = {}
    for cat, group in merged.groupby('category_x'):
        if len(group) >= 5:
            category_medians[cat] = group['time_to_close_seconds'].median()
        else:
            category_medians[cat] = 90  # fallback
            
    suspicious_alerts = []
    for _, row in merged.iterrows():
        cat = row['category_x']
        median = category_medians.get(cat, 90)
        
        # Fast closure defect: High/Critical severity, closed < 10% of median, no evidence (actions <= 1), no escalation, not SOAR
        if (row['time_to_close_seconds'] < (median * 0.10) and 
            row.get('closed_by', '') != 'SOAR' and
            row.get('severity') in ['High', 'Critical'] and
            row.get('investigation_actions', 0) <= 1 and
            not row.get('escalated', False)):
            suspicious_alerts.append(row)
            
    suspicious_df = pd.DataFrame(suspicious_alerts) if suspicious_alerts else pd.DataFrame()
    
    for _, row in suspicious_df.iterrows():
        findings.append({
            "finding_id": f"FND-GAP-{row['alert_id']}",
            "type": "Fast Closure (High Risk)",
            "entity_id": row['entity_id_x'],
            "severity": "High",
            "description": f"Alert {row['alert_id']} ({row['category_x']}, {row['severity']}) was closed in {row['time_to_close_seconds']:.0f}s with no escalation and minimal evidence. Median is {median:.0f}s.",
            "evidence": {
                "alert_id": row['alert_id'],
                "time_to_close": row['time_to_close_seconds'],
                "category_median": median
            }
        })

    # Rule 2: Broken Evidence Chain (No Escalation on True Positive Criticals)
    broken_chains = merged[
        (merged['severity'] == 'Critical') & 
        (merged['disposition_x'] == 'True Positive') & 
        (merged['escalated'] == False)
    ]
    
    for _, row in broken_chains.iterrows():
        findings.append({
            "finding_id": f"FND-CHAIN-{row['case_id']}",
            "type": "Broken Evidence Chain (No Escalation)",
            "entity_id": row['entity_id_x'],
            "severity": "Critical",
            "description": f"Critical alert {row['alert_id']} was marked True Positive but never escalated.",
            "evidence": {
                "case_id": row['case_id'],
                "severity": row['severity'],
                "disposition": row['disposition_x']
            }
        })
        
    return {"findings": findings}'''

pattern = re.compile(r'@app\.get\("/api/findings/execution-gaps"\)\ndef get_execution_gaps\(\):.*?(?=@app\.get|\Z)', re.DOTALL)
content = pattern.sub(new_func + '\n\n', content)

with open('backend/main.py', 'w', encoding='utf-8') as f:
    f.write(content)
