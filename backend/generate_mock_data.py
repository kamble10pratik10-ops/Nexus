import pandas as pd
import numpy as np
import random
from datetime import datetime, timedelta
import os

# Create data directory if it doesn't exist
os.makedirs("data", exist_ok=True)

# 1. Generate Mock Entities
entities = pd.DataFrame({
    "entity_id": [f"ENT-{i:03d}" for i in range(1, 6)],
    "sector": ["Finance", "Healthcare", "Energy", "Retail", "Technology"],
    "size_band": ["Large", "Medium", "Large", "Small", "Medium"],
    "criticality": ["High", "High", "Critical", "Low", "Medium"]
})
entities.to_csv("data/mock_entities.csv", index=False)

# 2. Generate Mock Assets
assets_data = []
for ent_id in entities["entity_id"]:
    for i in range(1, 6):
        assets_data.append({
            "asset_id": f"AST-{ent_id}-{i:02d}",
            "entity_id": ent_id,
            "asset_type": random.choice(["Windows Server 2019", "Linux Ubuntu 22.04", "AWS EC2 Instance", "Palo Alto Firewall", "Employee Laptop"]),
            "criticality": random.choice(["High", "Medium", "Low"]),
            "monitoring_expected": True
        })
assets = pd.DataFrame(assets_data)
assets.to_csv("data/mock_assets.csv", index=False)

# 3. Generate Mock Alerts
alerts_data = []
current_time = datetime.now()

categories = [
    "Ransomware Indicator (T1486)", 
    "Brute Force Authentication (T1110)", 
    "Suspicious PowerShell Execution (T1059.001)", 
    "Possible SQL Injection (T1190)",
    "Data Exfiltration over DNS (T1048.003)"
]

for i in range(1, 150): # Generated 150 alerts for a better demo
    asset = random.choice(assets_data)
    created_at = current_time - timedelta(days=random.randint(0, 30), hours=random.randint(0, 24), minutes=random.randint(0, 60))
    
    severity = random.choice(["Critical", "High", "Medium", "Low"])
    
    # Introduce execution gaps: "Critical" alerts closed in < 90 seconds
    if i % 15 == 0 and severity == "Critical":
        closed_at = created_at + timedelta(seconds=random.randint(15, 85)) # Suspiciously fast
        disposition = "False Positive"
    else:
        closed_at = created_at + timedelta(minutes=random.randint(15, 240))
        disposition = random.choice(["True Positive", "False Positive", "Benign"])

    alerts_data.append({
        "alert_id": f"ALT-{i:04d}",
        "entity_id": asset["entity_id"],
        "asset_id": asset["asset_id"],
        "severity": severity,
        "category": random.choice(categories),
        "status": "Closed",
        "created_at": created_at.isoformat(),
        "closed_at": closed_at.isoformat(),
        "disposition": disposition
    })
alerts = pd.DataFrame(alerts_data)
alerts.to_csv("data/mock_alerts.csv", index=False)

# 4. Generate Mock Cases (Investigations)
cases_data = []

# Templates for the "lazy analyst" copy-paste behavior (with slight variations to test NLP!)
lazy_templates = [
    "Reviewed the alert. No malicious activity detected. Verified IP on VirusTotal and closed as false positive.",
    "Analyst reviewed this alert. No malicious activity was detected. Verified IP on VT and closed as false positive.",
    "Reviewed alert. No malicious activity found. Checked IP address on VirusTotal. Closed as a false positive.",
]

# Genuine, detailed investigation templates
good_templates_sql = [
    "Investigated SQLi alert originating from 192.168.1.{x}. WAF blocked the payload (SELECT * FROM users). Verified no data exfiltration occurred.",
    "Reviewed WAF logs for SQLi attempt. The request contained a basic union-based injection string. Payload was successfully dropped by the edge router."
]

good_templates_auth = [
    "Detected 50+ failed login attempts for user account. Verified with the user that they forgot their password. Reset AD credentials.",
    "Investigated brute force alert on the VPN portal. The source IP 45.33.{x}.{y} is a known exit node. IP has been added to the blocklist."
]

for idx, alert in enumerate(alerts_data):
    if random.random() > 0.2: # 80% of alerts become cases
        
        # Inject the lazy "templated" text for NLP to catch
        if idx % 7 == 0:
            investigation_text = random.choice(lazy_templates)
        else:
            x = random.randint(10, 250)
            y = random.randint(10, 250)
            if "SQL" in alert["category"]:
                investigation_text = random.choice(good_templates_sql).replace("{x}", str(x))
            elif "Authentication" in alert["category"]:
                investigation_text = random.choice(good_templates_auth).replace("{x}", str(x)).replace("{y}", str(y))
            else:
                investigation_text = f"Analyzed {alert['category']} on {alert['asset_id']}. CrowdStrike sensor logged process execution tree. Determined to be a scheduled IT script running out of band. Closed as {alert['disposition']}."
            
        cases_data.append({
            "case_id": f"CAS-{idx:04d}",
            "alert_id": alert["alert_id"],
            "entity_id": alert["entity_id"],
            "investigation_text": investigation_text,
            "investigation_actions": random.randint(1, 15),
            "escalated": random.choice([True, False, False]), # Less likely to be escalated
            "created_at": alert["created_at"]
        })
cases = pd.DataFrame(cases_data)
cases.to_csv("data/mock_cases.csv", index=False)

print("Highly realistic Hackathon mock data generated successfully in the 'data' directory.")
