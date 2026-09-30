import random
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.models import Entity, Asset, Alert, Case, Escalation, Response, ExpectedEvidence

# Set fixed seed for deterministic, reproducible SIH judging demo
random.seed(42)

def generate_synthetic_data(db: Session, scale_factor: float = 1.0, entities_count: int = 20, alerts_per_entity: int = 200, **kwargs):
    """
    Generates realistic Synthetic Demonstration Dataset for 20 CSEs with planted patterns:
    - CSE-03: Critical alerts closed unusually quickly (< 3 mins).
    - CSE-07: Critical assets with missing monitoring evidence (Negative space).
    - CSE-11: Highly repetitive investigations (Templating / rubber stamping).
    - CSE-14: Low escalation rate compared with peers.
    - CSE-18: Missing response evidence for high/critical threats.
    """
    print("Clearing existing demonstration dataset...")
    db.query(Response).delete()
    db.query(Escalation).delete()
    db.query(Case).delete()
    db.query(Alert).delete()
    db.query(Asset).delete()
    db.query(ExpectedEvidence).delete()
    db.query(Entity).delete()
    db.commit()

    now = datetime.now(timezone.utc)
    obs_start = now - timedelta(days=90)
    obs_end = now

    # 1. 20 Critical Sector Entities (CSEs)
    cse_definitions = [
        ("CSE-01", "Northern Power Grid Load Dispatch", "Energy", "LARGE", "CRITICAL"),
        ("CSE-02", "National Clearing & Settlement Bank", "Core Banking", "LARGE", "CRITICAL"),
        ("CSE-03", "Apex Telecom Gateway", "Telecom", "LARGE", "CRITICAL"),  # Planted: Sub-3 min closures
        ("CSE-04", "Strategic Petroleum & Gas Grid", "Energy", "LARGE", "CRITICAL"),
        ("CSE-05", "Federal Life Insurance Trust", "Finance", "MEDIUM", "HIGH"),
        ("CSE-06", "Nuclear Power Station Reactor Core", "Nuclear", "MEDIUM", "CRITICAL"),
        ("CSE-07", "National Railway Signaling Network", "Transport", "LARGE", "CRITICAL"), # Planted: Silent critical assets
        ("CSE-08", "Civil Aviation Radar Node", "Civil Aviation", "MEDIUM", "CRITICAL"),
        ("CSE-09", "Defence Strategic Missile Facility", "Defence", "LARGE", "CRITICAL"),
        ("CSE-10", "Container Logistics Maritime Terminal", "Transport", "MEDIUM", "HIGH"),
        ("CSE-11", "National Commercial Bank Core Branch", "Core Banking", "LARGE", "CRITICAL"), # Planted: Repetitive investigations
        ("CSE-12", "Hydroelectric Basin SCADA Network", "Energy", "MEDIUM", "HIGH"),
        ("CSE-13", "Central Medical Research Hospital", "Healthcare", "MEDIUM", "HIGH"),
        ("CSE-14", "Satellite Telemetry Downlink Station", "Space", "SMALL", "CRITICAL"), # Planted: Low escalation rate
        ("CSE-15", "Mega Thermal Power Generation", "Energy", "LARGE", "CRITICAL"),
        ("CSE-16", "Sovereign Pension Reserve Fund", "Finance", "MEDIUM", "CRITICAL"),
        ("CSE-17", "Inland Waterways Telemetry Core", "Transport", "SMALL", "MEDIUM"),
        ("CSE-18", "Metropolitan City Gas Grid", "Energy", "MEDIUM", "HIGH"), # Planted: Missing response evidence
        ("CSE-19", "Central Taxation Transaction Gateway", "Government", "LARGE", "CRITICAL"),
        ("CSE-20", "Coast Guard Radar Surveillance Node", "Defence", "MEDIUM", "CRITICAL")
    ]

    entities = []
    for cse_id, name, sector, size_band, crit in cse_definitions[:entities_count]:
        ent = Entity(
            id=cse_id,
            name=name,
            sector=sector,
            size_band=size_band,
            criticality=crit,
            observation_start=obs_start,
            observation_end=obs_end
        )
        db.add(ent)
        entities.append(ent)
    db.commit()

    # 2. Expected Evidence Baseline Catalog
    expected_evidence_rules = [
        ("Energy", "SCADA MTU", ["ALERT", "INVESTIGATION", "ESCALATION", "RESPONSE"], ["SCADA_TAMPERING", "RANSOMWARE", "BRUTE_FORCE", "C2"]),
        ("Energy", "OT Historian", ["ALERT", "INVESTIGATION", "ESCALATION", "RESPONSE"], ["UNAUTHORIZED_ACCESS", "EXFILTRATION", "MALWARE"]),
        ("Core Banking", "SWIFT Payment Switch", ["ALERT", "INVESTIGATION", "ESCALATION", "RESPONSE"], ["FINANCIAL_EXFILTRATION", "SQL_INJECTION", "PRIVILEGE_ESCALATION"]),
        ("Core Banking", "Core DB Cluster", ["ALERT", "INVESTIGATION", "ESCALATION", "RESPONSE"], ["SQL_INJECTION", "BRUTE_FORCE", "PRIVILEGE_ESCALATION"]),
        ("Telecom", "Core BGP Router", ["ALERT", "INVESTIGATION", "ESCALATION", "RESPONSE"], ["DDOS", "CONFIG_TAMPERING", "BRUTE_FORCE"]),
        ("Transport", "Interlocking Signaling Server", ["ALERT", "INVESTIGATION", "ESCALATION", "RESPONSE"], ["SCADA_TAMPERING", "MALWARE", "C2"]),
        ("Healthcare", "Patient EHR Database", ["ALERT", "INVESTIGATION", "RESPONSE"], ["EXFILTRATION", "RANSOMWARE", "UNAUTHORIZED_ACCESS"]),
        ("Defence", "Cryptographic Gateway", ["ALERT", "INVESTIGATION", "ESCALATION", "RESPONSE"], ["EXFILTRATION", "C2", "PRIVILEGE_ESCALATION"]),
        ("DEFAULT", "Enterprise Server", ["ALERT", "INVESTIGATION", "RESPONSE"], ["MALWARE", "BRUTE_FORCE", "AUTHENTICATION"])
    ]

    for idx, (sec, asset_t, wf, cats) in enumerate(expected_evidence_rules):
        ee = ExpectedEvidence(
            id=f"EE-{idx+1:03d}",
            sector=sec,
            asset_type=asset_t,
            expected_workflow=wf,
            expected_alert_categories=cats,
            expected_escalation=True,
            expected_response=True
        )
        db.add(ee)
    db.commit()

    # 3. 500 Assets across the 20 CSEs (~25 assets per entity)
    asset_types_pool = [
        "SCADA MTU", "OT Historian", "SWIFT Payment Switch", "Core DB Cluster",
        "Domain Controller", "Firewall Gateway", "Core BGP Router", "Interlocking Signaling Server",
        "Linux Production Node", "Windows Enterprise Host"
    ]

    all_assets = []
    asset_counter = 1
    for ent in entities:
        # Give ~25 assets per CSE
        for i in range(1, 26):
            atype = asset_types_pool[(i - 1) % len(asset_types_pool)]
            is_critical = (i <= 6)
            
            # Planted Pattern for CSE-07: Silent critical assets
            if ent.id == "CSE-07" and i in [1, 2, 3]:
                monitoring_status = "SILENT"  # Declared under monitoring, but will emit 0 alerts
            else:
                monitoring_status = "ACTIVE"

            asset = Asset(
                id=f"AST-{ent.id}-{i:02d}",
                entity_id=ent.id,
                asset_type=atype,
                criticality="CRITICAL" if is_critical else random.choice(["HIGH", "MEDIUM"]),
                monitoring_expected=True,
                monitoring_status=monitoring_status
            )
            db.add(asset)
            all_assets.append(asset)
            asset_counter += 1
    db.commit()

    # 4. Generate Alerts, Cases, Escalations, and Responses
    alert_categories = [
        "RANSOMWARE", "BRUTE_FORCE", "SQL_INJECTION", 
        "DATA_EXFILTRATION", "PRIVILEGE_ESCALATION", 
        "COMMAND_AND_CONTROL", "SCADA_TAMPERING"
    ]

    # Pre-defined repetitive templates for CSE-11 (Investigation templating)
    repetitive_investigation_note = "Analyst verified host logs and reputation score on internal Threat Intel feed. Activity judged benign administrator action. Ticket closed as false positive."

    detailed_investigation_notes = [
        "Inspected process tree via EDR sensor. Detected suspicious rundll32.exe spawning powershell with base64 encoded command. Isolated host from VLAN, extracted volatile memory dump for forensic analysis.",
        "WAF blocked automated union-based SQL injection payload targeting core account database. Reviewed database access logs and confirmed zero records exfiltrated. Added attacking IP block to edge firewall.",
        "Detected 85 consecutive failed authentication attempts against root Domain Controller. Correlated with Kerberos ticket-granting service anomalies. Temporarily locked user credentials and notified SOC Tier-2.",
        "Observed anomalous high-frequency outbound DNS TXT query volume consistent with DNS tunneling exfiltration. Firewall sinkhole rule applied. Threat mitigated successfully."
    ]

    response_actions_pool = [
        ("HOST_ISOLATION", "SUCCESS"),
        ("FIREWALL_IP_BLOCK", "SUCCESS"),
        ("CREDENTIAL_REVOCATION", "SUCCESS"),
        ("PROCESS_TERMINATION", "SUCCESS"),
        ("SECURITY_PATCH_APPLIED", "SUCCESS")
    ]

    alert_idx = 1
    case_idx = 1
    esc_idx = 1
    resp_idx = 1

    alerts_to_insert = []
    cases_to_insert = []
    escalations_to_insert = []
    responses_to_insert = []

    print("Generating alerts, investigations, escalations, and responses with planted supervisory patterns...")

    for ent in entities:
        ent_assets = [a for a in all_assets if a.entity_id == ent.id]
        
        # CSE-07 has silent critical assets (AST-CSE-07-01, 02, 03 emit NO alerts!)
        if ent.id == "CSE-07":
            active_ent_assets = [a for a in ent_assets if a.id not in ["AST-CSE-07-01", "AST-CSE-07-02", "AST-CSE-07-03"]]
        else:
            active_ent_assets = ent_assets

        # Scale alert count: based on alerts_per_entity
        alert_count = max(10, int(alerts_per_entity * random.uniform(0.8, 1.2)))
        
        # Planted Pattern for CSE-14: Low activity relative to peer entities
        if ent.id == "CSE-14":
            alert_count = max(15, int(alert_count * 0.22)) # Significantly below peer median

        for j in range(alert_count):
            ast = random.choice(active_ent_assets)
            cat = random.choice(alert_categories)
            
            # Severities
            sev = random.choices(["CRITICAL", "HIGH", "MEDIUM", "LOW"], weights=[25, 35, 25, 15])[0]
            
            # Planted Pattern for CSE-03: Critical alerts closed unusually quickly (< 3 min)
            is_cse03_rapid_close = (ent.id == "CSE-03" and sev == "CRITICAL" and random.random() < 0.65)
            
            alert_time = obs_start + timedelta(
                seconds=random.randint(0, int((obs_end - obs_start).total_seconds()))
            )
            ack_time = alert_time + timedelta(seconds=random.randint(20, 180))

            if is_cse03_rapid_close:
                # Sub-3 minute closure (e.g. 35 to 110 seconds)
                close_time = alert_time + timedelta(seconds=random.randint(35, 110))
                disp = "FALSE_POSITIVE"
                status = "CLOSED"
            else:
                close_duration_sec = random.randint(600, 28800) # 10 mins to 8 hours
                close_time = alert_time + timedelta(seconds=close_duration_sec)
                disp = random.choice(["TRUE_POSITIVE", "FALSE_POSITIVE", "BENIGN", "ACTION_TAKEN"])
                status = "CLOSED"

            alert_id = f"ALT-{alert_idx:05d}"
            alert = Alert(
                id=alert_id,
                entity_id=ent.id,
                asset_id=ast.id,
                severity=sev,
                category=cat,
                status=status,
                created_at=alert_time,
                acknowledged_at=ack_time,
                closed_at=close_time,
                disposition=disp
            )
            alerts_to_insert.append(alert)
            alert_idx += 1

            # -------------------------------------------------------------
            # Case Generation (Investigation Evidence)
            # -------------------------------------------------------------
            # Planted Pattern: Orphaned critical alerts (CSE-01, CSE-03 have some criticals without cases)
            has_case = True
            if sev == "CRITICAL" and random.random() < 0.12 and ent.id in ["CSE-01", "CSE-03", "CSE-07"]:
                has_case = False # Negative space: Critical alert without corresponding case!

            if has_case and (sev in ["CRITICAL", "HIGH"] or random.random() < 0.40):
                case_id = f"CAS-{case_idx:05d}"
                
                # Planted Pattern for CSE-11: Repetitive investigations (> 80% copy-paste)
                if ent.id == "CSE-11" and random.random() < 0.85:
                    inv_text = repetitive_investigation_note
                    actions = 1  # Rubber stamping
                elif is_cse03_rapid_close:
                    inv_text = "Quick check on VT. IP clean. Closed as FP."
                    actions = 1
                else:
                    inv_text = random.choice(detailed_investigation_notes)
                    actions = random.randint(3, 12)

                case_obj = Case(
                    id=case_id,
                    alert_id=alert_id,
                    entity_id=ent.id,
                    investigation_text=inv_text,
                    investigation_actions=actions,
                    created_at=ack_time,
                    updated_at=close_time - timedelta(minutes=5),
                    closed_at=close_time
                )
                cases_to_insert.append(case_obj)
                case_idx += 1

                # ---------------------------------------------------------
                # Escalation Generation
                # ---------------------------------------------------------
                # Planted Pattern for CSE-14: Low escalation rate (< 3% compared to peer median of 22%)
                should_escalate = False
                if ent.id == "CSE-14":
                    should_escalate = (random.random() < 0.03) # Exceptionally low escalation!
                elif sev == "CRITICAL" and not is_cse03_rapid_close:
                    should_escalate = (random.random() < 0.60)
                elif sev == "HIGH":
                    should_escalate = (random.random() < 0.25)

                if should_escalate:
                    esc_time = ack_time + timedelta(minutes=random.randint(15, 60))
                    esc_level = "CISO" if sev == "CRITICAL" and random.random() < 0.3 else "TIER_2"
                    esc_obj = Escalation(
                        id=f"ESC-{esc_idx:05d}",
                        case_id=case_id,
                        escalated=True,
                        escalation_level=esc_level,
                        escalated_at=esc_time
                    )
                    escalations_to_insert.append(esc_obj)
                    esc_idx += 1

                # ---------------------------------------------------------
                # Response Generation
                # ---------------------------------------------------------
                # Planted Pattern for CSE-18: Missing response evidence for high/critical threats!
                has_response = False
                if ent.id == "CSE-18":
                    has_response = (random.random() < 0.05) # Severe response vacuum
                elif sev in ["CRITICAL", "HIGH"] and disp in ["TRUE_POSITIVE", "ACTION_TAKEN"]:
                    has_response = (random.random() < 0.85)
                elif random.random() < 0.20:
                    has_response = True

                if has_response:
                    action_name, action_res = random.choice(response_actions_pool)
                    resp_time = close_time - timedelta(minutes=random.randint(5, 30))
                    resp_obj = Response(
                        id=f"RES-{resp_idx:05d}",
                        case_id=case_id,
                        response_action=action_name,
                        result=action_res,
                        created_at=resp_time
                    )
                    responses_to_insert.append(resp_obj)
                    resp_idx += 1

    # Bulk insert
    print(f"Committing {len(alerts_to_insert)} alerts...")
    db.bulk_save_objects(alerts_to_insert)
    db.commit()

    print(f"Committing {len(cases_to_insert)} cases...")
    db.bulk_save_objects(cases_to_insert)
    db.commit()

    print(f"Committing {len(escalations_to_insert)} escalations...")
    db.bulk_save_objects(escalations_to_insert)
    db.commit()

    print(f"Committing {len(responses_to_insert)} responses...")
    db.bulk_save_objects(responses_to_insert)
    db.commit()

    print("Synthetic Demonstration Dataset successfully seeded!")
    print(f"Entities: {len(entities)} | Assets: {len(all_assets)} | Alerts: {len(alerts_to_insert)} | Cases: {len(cases_to_insert)} | Escalations: {len(escalations_to_insert)} | Responses: {len(responses_to_insert)}")
