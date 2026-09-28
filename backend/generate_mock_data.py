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
            "asset_type": random.choice(["Database", "Endpoint", "Server", "Firewall"]),
            "criticality": random.choice(["High", "Medium", "Low"]),
            "monitoring_expected": True
        })
assets = pd.DataFrame(assets_data)
assets.to_csv("data/mock_assets.csv", index=False)

# 3. Generate Mock Alerts
alerts_data = []
current_time = datetime.now()

# Create standard alerts
for i in range(1, 51):
    asset = random.choice(assets_data)
    created_at = current_time - timedelta(days=random.randint(0, 30), hours=random.randint(0, 24))
    
    severity = random.choice(["Critical", "High", "Medium", "Low"])
    
    # Introduce some execution gaps: "Critical" alerts closed in < 90 seconds
    if i % 10 == 0 and severity == "Critical":
        closed_at = created_at + timedelta(seconds=random.randint(10, 80)) # Suspiciously fast
        disposition = "False Positive"
    else:
        closed_at = created_at + timedelta(minutes=random.randint(30, 300))
        disposition = random.choice(["True Positive", "False Positive", "Benign"])

    alerts_data.append({
        "alert_id": f"ALT-{i:04d}",
        "entity_id": asset["entity_id"],
        "asset_id": asset["asset_id"],
        "severity": severity,
        "category": random.choice(["Malware", "Phishing", "DDoS", "Authentication"]),
        "status": "Closed",
        "created_at": created_at.isoformat(),
        "closed_at": closed_at.isoformat(),
        "disposition": disposition
    })
alerts = pd.DataFrame(alerts_data)
alerts.to_csv("data/mock_alerts.csv", index=False)

# 4. Generate Mock Cases (Investigations)
cases_data = []
# Create a templated investigation text for the NLP engine to catch
templated_text = "Analyst reviewed the alert. No malicious activity found. Verified IP address in Threat Intelligence. Closed alert as false positive."

for idx, alert in enumerate(alerts_data):
    # Not all alerts become cases, let's say 70% do
    if random.random() > 0.3:
        # Inject the exact templated text for some cases to trigger the NLP engine
        if idx % 5 == 0:
            investigation_text = templated_text
        else:
            investigation_text = f"Custom review conducted for {alert['category']}. Checked logs and correlated with other events. Conclusion: {alert['disposition']}."
            
        cases_data.append({
            "case_id": f"CAS-{idx:04d}",
            "alert_id": alert["alert_id"],
            "entity_id": alert["entity_id"],
            "investigation_text": investigation_text,
            "investigation_actions": random.randint(1, 10),
            "escalated": random.choice([True, False]),
            "created_at": alert["created_at"]
        })
cases = pd.DataFrame(cases_data)
cases.to_csv("data/mock_cases.csv", index=False)

print("Mock data generated successfully in the 'data' directory.")
