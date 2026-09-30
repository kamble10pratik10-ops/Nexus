import pandas as pd
import numpy as np
import random
from datetime import datetime, timedelta
import os
import json
import sys

seed = int(sys.argv[1]) if len(sys.argv) > 1 else 42
random.seed(seed)
np.random.seed(seed)

base_dir = os.path.dirname(os.path.abspath(__file__))
data_dir = os.path.join(base_dir, "data")
os.makedirs(data_dir, exist_ok=True)

# 0. Initialize Ground Truth labels
ground_truth = []

# 1. Generate Mock Entities
entities = pd.DataFrame({
    "entity_id": [f"ENT-{i:03d}" for i in range(1, 6)],
    "sector": ["Finance", "Healthcare", "Energy", "Retail", "Technology"],
    "size_band": ["Large", "Medium", "Large", "Small", "Medium"],
    "criticality": ["High", "High", "Critical", "Low", "Medium"]
})
entities.to_csv(os.path.join(data_dir, "mock_entities.csv"), index=False)

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
assets.to_csv(os.path.join(data_dir, "mock_assets.csv"), index=False)

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
alerts.to_csv(os.path.join(data_dir, "mock_alerts.csv"), index=False)

# 4. Generate Mock Cases (Investigations)
cases_data = []
# Create a templated investigation text for the NLP engine to catch
templated_text = "Analyst reviewed the alert. No malicious activity found. Verified IP address in Threat Intelligence. Closed alert as false positive."

for idx, alert in enumerate(alerts_data):
    if random.random() > 0.2: # 80% of alerts become cases
        
        # === Feature 2: Case-ID Gap Injection ===
        # Skip some case IDs to simulate deleted records (~5% chance)
        if random.random() < 0.05:
            deleted_case_ids.add(case_index)
            if not any(gt["type"] == "Case-ID Sequence Gap (Deleted Records)" for gt in ground_truth):
                ground_truth.append({
                    "engine": "Evidence Forensics", "type": "Case-ID Sequence Gap (Deleted Records)",
                    "entity_id": "ALL"
                })
            case_index += 1  # Skip this ID
            
        case_id = f"CAS-{case_index:04d}"
        
        # === Feature 3: Empty/zombie investigation injection (~10%) ===
        if random.random() < 0.10:
            investigation_text = random.choice(empty_templates)
            investigation_actions = 0
            ground_truth.append({
                "engine": "Investigation Quality", "type": "Zombie Case (No Evidence)",
                "entity_id": alert["entity_id"], "target_id": case_id
            })
        # Inject the lazy "templated" text for NLP to catch
        # Inject the lazy "templated" text for NLP to catch
        elif alert.get("closed_by") == "Analyst-C" and random.random() < 0.6:
            paraphrases = [
                "I looked at the logs and saw nothing bad. The system is fine. Closing this.",
                "Checked the logs and saw nothing bad. System looks fine. Closing this.",
                "Looked at logs, saw nothing bad. The system is fine, closing.",
                "I reviewed the logs, nothing bad seen. System fine. Closing this out."
            ]
            investigation_text = random.choice(paraphrases)
            investigation_actions = random.randint(1, 3)
            ground_truth.append({
                "engine": "NLP", "type": "Templated Investigation (Semantic)",
                "entity_id": alert["entity_id"], "target_id": case_id
            })
        # Add Hard Negatives: Legitimate SOAR templates that shouldn't be flagged as lazy
        elif idx % 9 == 0:
            investigation_text = f"SOAR PLAYBOOK EXECUTION: Analyzed alert. Benign administrative behavior. IP {alert.get('native_ioc', '127.0.0.1')} verified against internal allowlist. Auto-closed."
            investigation_actions = 5
            # We DO NOT append to ground truth here because it's a hard negative (legit)
        else:
            # === Feature 8: Rubric Grounding Defect Injection ===
            # Analyst cites a generic/fake IP instead of the actual native_ioc
            if random.random() < 0.15: # 15% of cases have grounded defects
                cited_ip = "8.8.8.8"
                ground_truth.append({
                    "engine": "Investigation Quality", "type": "Rubric Grounding Failure (Gaming)",
                    "entity_id": alert["entity_id"], "target_id": case_id
                })
            else:
                cited_ip = alert["native_ioc"]
                
            analyst = alert.get("closed_by", "Unknown")
            cat = alert.get("category", "alert")
            host = alert.get("asset_id", "host")
            ip = cited_ip
            disp = alert.get("disposition", "Unknown")
            
            import random, string
            def get_rand(): return ''.join(random.choices(string.ascii_letters, k=15))
            
            if analyst == "Analyst-A":
                investigation_text = f"Triage of {cat} on {host}. {get_rand()} {get_rand()}. Closed as {disp}."
                investigation_actions = random.randint(3, 15)
            elif analyst == "Analyst-B":
                if random.random() < 0.25:
                    investigation_text = f"Standard routine check completed for {cat} on {host}. No anomalies detected in the current telemetry window. Closed as {disp}."
                else:
                    investigation_text = f"Check for {cat} on {host}. IP {ip} checked. {get_rand()} {get_rand()}. {disp}."
                investigation_actions = 7
            elif analyst == "Analyst-D":
                investigation_text = f"Reviewing {cat} on {host}. Event telemetry looks normal. {get_rand()} {get_rand()}. Marked {disp}."
                investigation_actions = random.randint(3, 15)
            else:
                investigation_text = f"Analyzed {cat} on {host}. Source IP {ip} was checked. Host contained. {get_rand()}. {disp}."
                investigation_actions = random.randint(3, 15)
        escalated = random.choice([True, False, False])
        if alert["severity"] == "Critical" and not escalated and alert.get("disposition") == "True Positive":
            ground_truth.append({
                "engine": "Execution Gaps", "type": "Broken Evidence Chain (No Escalation)",
                "entity_id": alert["entity_id"], "target_id": case_id
            })
            
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
cases.to_csv(os.path.join(data_dir, "mock_cases.csv"), index=False)

print(f"Enhanced mock data generated. {len(alerts_data)} alerts, {len(cases_data)} cases.")
print(f"  Injected: {sum(1 for a in alerts_data if a['severity'] != a['original_severity'])} severity downgrades")
print(f"  Injected: {sum(1 for a in alerts_data if a['closed_by'] == 'SOAR')} SOAR closures")
print(f"  Injected: {sum(1 for a in alerts_data if a['sla_reset'])} SLA resets")
print(f"  Injected: {len(deleted_case_ids)} case-ID gaps (deleted records)")
print(f"  Injected: {sum(1 for c in cases_data if c['investigation_actions'] == 0)} zombie cases")

# Save ground truth labels
with open(os.path.join(data_dir, "ground_truth.json"), "w") as f:
    json.dump(ground_truth, f, indent=2)
print(f"Ground truth labels saved: {len(ground_truth)} anomalies injected.")

