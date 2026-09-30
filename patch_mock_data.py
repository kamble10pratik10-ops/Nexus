with open('backend/generate_mock_data.py', 'r') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    if line.strip() == 'alerts.to_csv("data/mock_alerts.csv", index=False)':
        new_lines.append(line)
        new_lines.append('\n')
        new_lines.append('# Generate mock alert events (Audit Trail)\n')
        new_lines.append('alert_events = []\n')
        new_lines.append('event_id = 1\n')
        new_lines.append('for a in alerts_data:\n')
        new_lines.append('    # Created event\n')
        new_lines.append('    alert_events.append({"event_id": f"EVT-{event_id:05d}", "alert_id": a["alert_id"], "field": "status", "old_value": None, "new_value": "Open", "timestamp": a["created_at"], "actor": "System"})\n')
        new_lines.append('    event_id += 1\n')
        new_lines.append('    \n')
        new_lines.append('    # Severity downgrade event\n')
        new_lines.append('    if a["original_severity"] != a["severity"]:\n')
        new_lines.append('        from datetime import datetime\n')
        new_lines.append('        ts = (datetime.fromisoformat(a["created_at"]) + (datetime.fromisoformat(a["closed_at"]) - datetime.fromisoformat(a["created_at"])) / 2).isoformat()\n')
        new_lines.append('        alert_events.append({"event_id": f"EVT-{event_id:05d}", "alert_id": a["alert_id"], "field": "severity", "old_value": a["original_severity"], "new_value": a["severity"], "timestamp": ts, "actor": a["closed_by"]})\n')
        new_lines.append('        event_id += 1\n')
        new_lines.append('        \n')
        new_lines.append('    # SLA Reset event\n')
        new_lines.append('    if a.get("sla_reset", False):\n')
        new_lines.append('        from datetime import datetime\n')
        new_lines.append('        ts = (datetime.fromisoformat(a["created_at"]) + (datetime.fromisoformat(a["closed_at"]) - datetime.fromisoformat(a["created_at"])) / 3).isoformat()\n')
        new_lines.append('        ts2 = (datetime.fromisoformat(a["created_at"]) + 2 * (datetime.fromisoformat(a["closed_at"]) - datetime.fromisoformat(a["created_at"])) / 3).isoformat()\n')
        new_lines.append('        alert_events.append({"event_id": f"EVT-{event_id:05d}", "alert_id": a["alert_id"], "field": "status", "old_value": "Open", "new_value": "Resolved", "timestamp": ts, "actor": a["closed_by"]})\n')
        new_lines.append('        event_id += 1\n')
        new_lines.append('        alert_events.append({"event_id": f"EVT-{event_id:05d}", "alert_id": a["alert_id"], "field": "status", "old_value": "Resolved", "new_value": "Open", "timestamp": ts2, "actor": a["closed_by"]})\n')
        new_lines.append('        event_id += 1\n')
        new_lines.append('        \n')
        new_lines.append('    # Closed event\n')
        new_lines.append('    alert_events.append({"event_id": f"EVT-{event_id:05d}", "alert_id": a["alert_id"], "field": "status", "old_value": "Open", "new_value": a["status"], "timestamp": a["closed_at"], "actor": a["closed_by"]})\n')
        new_lines.append('    event_id += 1\n')
        new_lines.append('\n')
        new_lines.append('pd.DataFrame(alert_events).to_csv("data/mock_alert_events.csv", index=False)\n')
    else:
        new_lines.append(line)

with open('backend/generate_mock_data.py', 'w') as f:
    f.writelines(new_lines)
