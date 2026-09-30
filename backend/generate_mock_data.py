import pandas as pd
import numpy as np
import random
from datetime import datetime, timedelta
import os
import json

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
            "asset_type": random.choice(["Windows Server 2019", "Linux Ubuntu 22.04", "AWS EC2 Instance", "Palo Alto Firewall", "Employee Laptop"]),
            "criticality": random.choice(["High", "Medium", "Low"]),
            "monitoring_expected": True
        })
assets = pd.DataFrame(assets_data)
assets.to_csv(os.path.join(data_dir, "mock_assets.csv"), index=False)

# 3. Generate Mock Alerts
# --- New fields for Feature 1 (Metric Integrity): closed_by, original_severity, sla_reset ---
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
    alert_id = f"ALT-{i:04d}"
    
    severity = random.choice(["Critical", "High", "Medium", "Low"])
    original_severity = severity  # Default: no change
    
    # === Feature 1: Severity Downgrade Injection ===
    # ~8% of alerts have severity downgraded (Critical->Medium or High->Low)
    if random.random() < 0.08:
        if severity == "Critical":
            severity = "Medium"
        elif severity == "High":
            severity = "Low"
        ground_truth.append({
            "engine": "Metric Integrity", "type": "Severity Downgrade",
            "entity_id": asset["entity_id"], "target_id": alert_id
        })
    
    # === Feature 1: Automation Blending ===
    # ~30% of alerts are closed by SOAR/automation, rest by human analysts
    if random.random() < 0.30:
        closed_by = "SOAR"
    else:
        closed_by = random.choice(["Analyst-A", "Analyst-B", "Analyst-C", "Analyst-D"])
    
    # === Feature 1: SLA Reset Injection ===
    sla_reset = False
    
    # Introduce execution gaps: "Critical" alerts closed in < 90 seconds
    if i % 15 == 0 and severity == "Critical":
        closed_at = created_at + timedelta(seconds=random.randint(15, 85)) # Suspiciously fast
        disposition = "False Positive"
        ground_truth.append({
            "engine": "Execution Gaps", "type": "Fast Closure",
            "entity_id": asset["entity_id"], "target_id": alert_id
        })
    # === Feature 2: Round-Number Duration Injection ===
    elif i % 12 == 0:
        # Exactly 5, 10, 15, 30, or 60 minutes — suspiciously round
        round_minutes = random.choice([5, 10, 15, 30, 60])
        closed_at = created_at + timedelta(minutes=round_minutes)
        disposition = random.choice(["True Positive", "False Positive", "Benign"])
        if not any(gt["type"] == "Round-Number Duration Clustering" for gt in ground_truth):
            ground_truth.append({
                "engine": "Evidence Forensics", "type": "Round-Number Duration Clustering",
                "entity_id": "ALL"
            })
    # === Feature 2: Uniform Inter-Arrival Injection for ENT-004 ===
    elif asset["entity_id"] == "ENT-004" and i % 5 == 0:
        # Force uniform 120-minute spacing from a base time for this entity
        base = current_time - timedelta(days=15)
        created_at = base + timedelta(minutes=120 * (i // 5))
        closed_at = created_at + timedelta(minutes=random.randint(15, 240))
        disposition = random.choice(["True Positive", "False Positive", "Benign"])
        # We flag the entity, not individual alerts, for this engine
        if not any(gt["type"] == "Uniform Inter-Arrival (Fabrication Risk)" and gt["entity_id"] == "ENT-004" for gt in ground_truth):
            ground_truth.append({
                "engine": "Evidence Forensics", "type": "Uniform Inter-Arrival (Fabrication Risk)",
                "entity_id": "ENT-004"
            })
    else:
        # === Feature 1: SLA Reset Injection (~5% of alerts) ===
        if random.random() < 0.05:
            sla_reset = True
            # Close just inside SLA after a reset (looks like clock was restarted)
            closed_at = created_at + timedelta(minutes=random.randint(200, 260))
            ground_truth.append({
                "engine": "Metric Integrity", "type": "SLA Clock Reset",
                "entity_id": asset["entity_id"], "target_id": alert_id
            })
        else:
            closed_at = created_at + timedelta(minutes=random.randint(15, 240))
        disposition = random.choice(["True Positive", "False Positive", "Benign"])

    # === Feature 10: Peer Blind-Spot Injection ===
    # ENT-004 never sees PowerShell or DNS Exfil -- blind spot only visible cross-entity
    if asset["entity_id"] == "ENT-004":
        alert_category = random.choice([
            "Ransomware Indicator (T1486)",
            "Brute Force Authentication (T1110)",
            "Possible SQL Injection (T1190)"
        ])
        if not any(gt["type"] == "Peer Blind-Spot (Missing Detection)" and gt["entity_id"] == "ENT-004" for gt in ground_truth):
            ground_truth.append({
                "engine": "Peer Blind-Spot", "type": "Peer Blind-Spot (Missing Detection)",
                "entity_id": "ENT-004"
            })
    else:
        alert_category = random.choice(categories)

    import re
    match = re.search(r'\((T\d+(?:\.\d+)?)\)', alert_category)
    technique_id = match.group(1) if match else "Unknown"
    rule_id = f"RULE-{abs(hash(alert_category)) % 1000:03d}"
    log_source = random.choice(["Windows Event Logs", "Palo Alto Networks", "CrowdStrike Falcon", "AWS CloudTrail"])
    native_ioc = f"{random.randint(10, 200)}.{random.randint(10, 200)}.{random.randint(10, 200)}.{random.randint(1, 255)}"

    alerts_data.append({
        "alert_id": alert_id,
        "entity_id": asset["entity_id"],
        "asset_id": asset["asset_id"],
        "severity": severity,
        "original_severity": original_severity,
        "category": alert_category,
        "rule_id": rule_id,
        "technique_id": technique_id,
        "log_source": log_source,
        "native_ioc": native_ioc,
        "status": "Closed",
        "created_at": created_at.isoformat(),
        "closed_at": closed_at.isoformat(),
        "disposition": disposition,
        "closed_by": closed_by,
        "sla_reset": sla_reset
    })
alerts = pd.DataFrame(alerts_data)
alerts.to_csv(os.path.join(data_dir, "mock_alerts.csv"), index=False)

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
    "Investigated SQLi alert originating from {ip}. WAF blocked the payload (SELECT * FROM users). Verified no data exfiltration occurred.",
    "Reviewed WAF logs for SQLi attempt from {ip}. The request contained a basic union-based injection string. Payload was successfully dropped by the edge router."
]

good_templates_auth = [
    "Detected 50+ failed login attempts for user account from {ip}. Verified with the user that they forgot their password. Reset AD credentials.",
    "Investigated brute force alert on the VPN portal. The source IP {ip} is a known exit node. IP has been added to the blocklist."
]

# === Feature 3: Empty / minimal investigation templates (zombie-like) ===
empty_templates = [
    "",
    "Closed.",
    "N/A",
    "See previous case.",
    "Duplicate.",
]

case_index = 0
deleted_case_ids = set()  # Track which IDs are "deleted" for Feature 2

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
            "case_id": case_id,
            "alert_id": alert["alert_id"],
            "entity_id": alert["entity_id"],
            "investigation_text": investigation_text,
            "investigation_actions": investigation_actions,
            "escalated": escalated, # Use the fixed variable
            "created_at": alert["created_at"]
        })
        case_index += 1
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

