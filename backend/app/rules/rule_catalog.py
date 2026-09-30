"""
SAT-SA Cyber Supervisory Rules Catalog
50+ Standardized Supervisory Evaluation Rules for Critical Sector Entities (CSEs)
Under NCIIPC & National Cyber Security Guidelines
"""

SUPERVISORY_RULES = [
    # ==========================================
    # DOMAIN 1: EXECUTION GAPS (RULES 1 - 15)
    # ==========================================
    {
        "rule_id": "RULE-EG-001",
        "domain": "Execution Gap",
        "name": "Critical Alert Rapid Closure Without Escalation",
        "severity": "Critical",
        "default_risk_score": 95.0,
        "default_confidence": 98.0,
        "description": "Critical severity alerts closed in under 90 seconds without incident escalation.",
        "condition": "severity == 'Critical' and close_duration_seconds < 90 and not escalated",
        "rationale": "High-impact threats (e.g. ransomware, domain takeover) require deep forensic triage. Immediate closure indicates triage evasion or superficial check-listing.",
        "recommended_action": "Require supervisory audit of alert forensic logs and re-open investigation under Senior Incident Responder oversight."
    },
    {
        "rule_id": "RULE-EG-002",
        "domain": "Execution Gap",
        "name": "Critical Alert Sub-5-Minute Closure",
        "severity": "High",
        "default_risk_score": 85.0,
        "default_confidence": 92.0,
        "description": "Critical alerts closed in under 300 seconds without escalation or external threat check.",
        "condition": "severity == 'Critical' and close_duration_seconds < 300 and not escalated",
        "rationale": "Closing critical alerts in under 5 minutes without escalation violates standard tier-1 triage procedures.",
        "recommended_action": "Audit triage playbooks to verify minimum investigation checklist completion."
    },
    {
        "rule_id": "RULE-EG-003",
        "domain": "Execution Gap",
        "name": "High Severity Alert Closed Without Investigation Record",
        "severity": "High",
        "default_risk_score": 88.0,
        "default_confidence": 96.0,
        "description": "High or Critical alerts closed without an attached case or investigation note.",
        "condition": "severity in ['Critical', 'High'] and not investigated",
        "rationale": "Operating standard mandates documented analyst review for all elevated threats.",
        "recommended_action": "Enforce mandatory ticket creation before alert state transition to Closed."
    },
    {
        "rule_id": "RULE-EG-004",
        "domain": "Execution Gap",
        "name": "Alert Acknowledged but Never Investigated",
        "severity": "Medium",
        "default_risk_score": 70.0,
        "default_confidence": 90.0,
        "description": "Alert acknowledged by analyst to stop SLA timer but left uninvestigated upon closing.",
        "condition": "acknowledged == True and not investigated and status == 'Closed'",
        "rationale": "Common SLA gaming technique where analysts acknowledge alerts to reset SLA and subsequently silently close them.",
        "recommended_action": "Implement dual-analyst review for tickets closed without active investigation actions."
    },
    {
        "rule_id": "RULE-EG-005",
        "domain": "Execution Gap",
        "name": "True Positive Disposition Without Escalation",
        "severity": "High",
        "default_risk_score": 82.0,
        "default_confidence": 94.0,
        "description": "Alert flagged as 'True Positive' malicious activity yet closed without incident escalation.",
        "condition": "disposition == 'True Positive' and not escalated",
        "rationale": "Confirmed attacks must have an escalation record for containment, eradication, and notification.",
        "recommended_action": "Mandate escalation chain audit to ensure containment actions were taken."
    },
    {
        "rule_id": "RULE-EG-006",
        "domain": "Execution Gap",
        "name": "Critical Asset Ransomware Alert Marked Benign Rapidly",
        "severity": "Critical",
        "default_risk_score": 98.0,
        "default_confidence": 95.0,
        "description": "Ransomware or Exfiltration alert on a designated critical asset closed as Benign in under 10 minutes.",
        "condition": "category in ['Ransomware', 'Exfiltration'] and close_duration_seconds < 600 and disposition == 'Benign'",
        "rationale": "Ransomware detection on crown-jewel assets must have endpoint memory dumps and root-cause analysis.",
        "recommended_action": "Request full memory and host telemetry dump for supervisory re-evaluation."
    },
    {
        "rule_id": "RULE-EG-007",
        "domain": "Execution Gap",
        "name": "Exfiltration Alert Closed as False Positive Without Packet Analysis",
        "severity": "High",
        "default_risk_score": 80.0,
        "default_confidence": 88.0,
        "description": "Data exfiltration alert dismissed as false positive with fewer than 2 investigative actions.",
        "condition": "category == 'Exfiltration' and disposition == 'False Positive' and actions_count < 2",
        "rationale": "Data leakage requires validating destination IP, outbound payload size, and encrypted channel telemetry.",
        "recommended_action": "Validate PCAP or NetFlow flow record review by senior network analyst."
    },
    {
        "rule_id": "RULE-EG-008",
        "domain": "Execution Gap",
        "name": "Lateral Movement Alert Dismissed Without Credential Triage",
        "severity": "Critical",
        "default_risk_score": 92.0,
        "default_confidence": 91.0,
        "description": "Lateral movement alert closed without auditing Kerberos, SMB, or WMI credential usage.",
        "condition": "category == 'Lateral Movement' and close_duration_seconds < 300",
        "rationale": "Internal pivoting indicates perimeter breach; dismissal without host forensics poses catastrophic risk.",
        "recommended_action": "Immediate forensic audit of compromised host and associated active directory accounts."
    },
    {
        "rule_id": "RULE-EG-009",
        "domain": "Execution Gap",
        "name": "Command & Control Alert Closed Without Firewall Quarantine",
        "severity": "Critical",
        "default_risk_score": 94.0,
        "default_confidence": 90.0,
        "description": "C2 beaconing alert closed without recording firewall IP block or host isolation.",
        "condition": "category == 'Command & Control' and not escalated",
        "rationale": "Active C2 beaconing requires network containment; lack of escalation signals potential dwell-time expansion.",
        "recommended_action": "Verify automated or manual blocklist implementation at border firewall."
    },
    {
        "rule_id": "RULE-EG-010",
        "domain": "Execution Gap",
        "name": "Privilege Escalation on Domain Controller Unescalated",
        "severity": "Critical",
        "default_risk_score": 96.0,
        "default_confidence": 96.0,
        "description": "Privilege escalation detected on Identity Provider / Domain Controller with no Tier-3 escalation.",
        "condition": "category == 'Privilege Escalation' and not escalated",
        "rationale": "AD/Identity tier compromise represents total infrastructure risk requiring immediate CISO escalation.",
        "recommended_action": "Direct supervisory inquiry into Active Directory administrative group changes."
    },
    {
        "rule_id": "RULE-EG-011",
        "domain": "Execution Gap",
        "name": "Batch Closing of Heterogeneous Alert Categories",
        "severity": "High",
        "default_risk_score": 78.0,
        "default_confidence": 89.0,
        "description": "Multiple alerts of disparate categories closed at identical timestamps by a single analyst.",
        "condition": "simultaneous_closures > 5 and distinct_categories >= 3",
        "rationale": "Bulk closure of different threat vectors indicates rubber-stamping without individual triage.",
        "recommended_action": "Sample and audit individual alerts from the bulk closure batch."
    },
    {
        "rule_id": "RULE-EG-012",
        "domain": "Execution Gap",
        "name": "Zero Quarantine Actions Recorded for Confirmed Malware",
        "severity": "High",
        "default_risk_score": 75.0,
        "default_confidence": 87.0,
        "description": "Malware alerts marked 'True Positive' but with zero containment or quarantine actions.",
        "condition": "category == 'Malware' and disposition == 'True Positive' and actions_count == 0",
        "rationale": "Acknowledging confirmed malware without active containment exposes CSE to wiper/lateral spread.",
        "recommended_action": "Verify endpoint EDR policy enforcement status and remediation logs."
    },
    {
        "rule_id": "RULE-EG-013",
        "domain": "Execution Gap",
        "name": "Superficial Investigation of Multi-Host Alert",
        "severity": "High",
        "default_risk_score": 83.0,
        "default_confidence": 85.0,
        "description": "Alert impacting multiple critical endpoints closed in under 10 minutes total.",
        "condition": "severity in ['High', 'Critical'] and close_duration_seconds < 600",
        "rationale": "Multi-asset blast radius requires extensive asset inventory and lateral scope evaluation.",
        "recommended_action": "Conduct cross-host correlation to establish true extent of breach."
    },
    {
        "rule_id": "RULE-EG-014",
        "domain": "Execution Gap",
        "name": "Recurring Threat on Same Critical Asset Closed as Low Priority",
        "severity": "Medium",
        "default_risk_score": 68.0,
        "default_confidence": 84.0,
        "description": "Same critical asset triggering > 5 alerts within 48 hours repeatedly dismissed.",
        "condition": "repeat_asset_alerts > 5 and all_closed_without_escalation",
        "rationale": "Persistent triggers on critical infrastructure indicate chronic infection or persistent adversary dwell time.",
        "recommended_action": "Initiate comprehensive threat hunting on the specific host."
    },
    {
        "rule_id": "RULE-EG-015",
        "domain": "Execution Gap",
        "name": "High Severity Alert Left in Open State Beyond Operational SLA",
        "severity": "High",
        "default_risk_score": 76.0,
        "default_confidence": 92.0,
        "description": "High/Critical alert remaining unaddressed for > 24 hours without assignment or notes.",
        "condition": "severity in ['Critical', 'High'] and status == 'Open' and age_hours > 24",
        "rationale": "Breach containment window is measured in minutes; 24-hour dormancy represents total operational neglect.",
        "recommended_action": "Immediate escalation to operational supervisor for emergency assignment."
    },

    # =========================================================
    # DOMAIN 2: NEGATIVE SPACE & BLIND SPOTS (RULES 16 - 28)
    # =========================================================
    {
        "rule_id": "RULE-NS-016",
        "domain": "Negative Space",
        "name": "Critical Asset Telemetry Absence",
        "severity": "Critical",
        "default_risk_score": 96.0,
        "default_confidence": 97.0,
        "description": "Designated crown-jewel asset has not emitted telemetry or alerts for the entire observation period.",
        "condition": "asset_criticality == 'Critical' and telemetry_status == 'Missing'",
        "rationale": "Critical infrastructure assets must maintain unbroken telemetry. Silence indicates sensor failure, adversary evasion, or unmonitored blind spot.",
        "recommended_action": "Issue immediate supervisory directive for agent heartbeat and syslog relay inspection."
    },
    {
        "rule_id": "RULE-NS-017",
        "domain": "Negative Space",
        "name": "Zero Authentication Alerts in Sector Entity",
        "severity": "Critical",
        "default_risk_score": 92.0,
        "default_confidence": 95.0,
        "description": "Entity reports zero authentication failure or brute force alerts over 30+ days.",
        "condition": "count_category_authentication == 0 and total_alerts > 100",
        "rationale": "In any real enterprise environment with thousands of users, zero authentication alerts indicates identity logs are not ingested into the SOC.",
        "recommended_action": "Verify ingestion pipelines for Active Directory, Azure AD, and VPN authentication logs."
    },
    {
        "rule_id": "RULE-NS-018",
        "domain": "Negative Space",
        "name": "Zero External C2 or Egress Alerts",
        "severity": "High",
        "default_risk_score": 86.0,
        "default_confidence": 91.0,
        "description": "Entity records zero outbound perimeter or Command & Control alerts despite large endpoint footprint.",
        "condition": "count_category_c2 == 0 and entity_size == 'Large'",
        "rationale": "Perimeter proxy, DNS, and firewall egress logging is absent or improperly parsed in the analytics pipeline.",
        "recommended_action": "Audit proxy, DNS resolver, and perimeter firewall log forwarding health."
    },
    {
        "rule_id": "RULE-NS-019",
        "domain": "Negative Space",
        "name": "Weekend Telemetry Blackout",
        "severity": "High",
        "default_risk_score": 84.0,
        "default_confidence": 93.0,
        "description": "Alert volume drops by > 90% during weekends compared to weekday baseline in a 24x7 CSE.",
        "condition": "weekend_alert_ratio < 0.10 and expected_mode == '24x7'",
        "rationale": "Adversaries disproportionately attack during weekends. Severe alert drops indicate unmanned weekend monitoring or paused batch jobs.",
        "recommended_action": "Review shift rosters, automated detection rule schedules, and weekend ingestion continuity."
    },
    {
        "rule_id": "RULE-NS-020",
        "domain": "Negative Space",
        "name": "Missing Escalation Records for High Severity Period",
        "severity": "High",
        "default_risk_score": 82.0,
        "default_confidence": 94.0,
        "description": "Entity generated > 50 Critical/High alerts in period but logged 0 escalation records.",
        "condition": "critical_high_count > 50 and total_escalations == 0",
        "rationale": "Statistically implausible for 50 high-severity events to require zero secondary containment or tier escalation.",
        "recommended_action": "Audit escalation handoff protocol between Tier-1 MSSP and Tier-2 internal response."
    },
    {
        "rule_id": "RULE-NS-021",
        "domain": "Negative Space",
        "name": "SCADA / OT Zone Telemetry Vacuum",
        "severity": "Critical",
        "default_risk_score": 98.0,
        "default_confidence": 96.0,
        "description": "Energy or Transport entity has declared SCADA/ICS assets but emits zero industrial control telemetry.",
        "condition": "sector in ['Power', 'Transport', 'Nuclear'] and scada_assets_count > 0 and scada_alerts_count == 0",
        "rationale": "OT/IT convergence without deep industrial packet inspection leaves critical physical processes unmonitored.",
        "recommended_action": "Deploy dedicated OT intrusion detection sensors (e.g. Modbus, DNP3, IEC 60870) and verify ingestion."
    },
    {
        "rule_id": "RULE-NS-022",
        "domain": "Negative Space",
        "name": "Zero Phishing or Email Security Detections",
        "severity": "Medium",
        "default_risk_score": 72.0,
        "default_confidence": 88.0,
        "description": "Large CSE entity logs zero email gateway or phishing alerts over the submission cycle.",
        "condition": "count_category_phishing == 0 and size_band in ['Large', 'Medium']",
        "rationale": "Phishing is the primary initial access vector (MITRE ATT&CK T1566). Zero detections indicates unintegrated mail security telemetry.",
        "recommended_action": "Connect Secure Email Gateway (SEG) API logs to central supervisory logging."
    },
    {
        "rule_id": "RULE-NS-023",
        "domain": "Negative Space",
        "name": "Abnormally Low Alert Volume Relative to Peer Sector Median",
        "severity": "High",
        "default_risk_score": 80.0,
        "default_confidence": 86.0,
        "description": "Entity alert volume is > 3 standard deviations below sector peer median.",
        "condition": "alert_volume_zscore < -3.0",
        "rationale": "Sub-baseline alert generation suggests restrictive detection rules, disabled use-cases, or ingestion throttles.",
        "recommended_action": "Compare active SIEM use cases against Sector Baseline Threat Model."
    },
    {
        "rule_id": "RULE-NS-024",
        "domain": "Negative Space",
        "name": "Absence of Cloud Workload Telemetry",
        "severity": "High",
        "default_risk_score": 79.0,
        "default_confidence": 89.0,
        "description": "Entity operates hybrid cloud infrastructure but generates zero cloud control-plane alerts.",
        "condition": "cloud_assets_declared == True and cloud_alerts_count == 0",
        "rationale": "CloudTrail / Azure Activity / GCP Audit log blind spot exposes identity and bucket exfiltration.",
        "recommended_action": "Verify Cloud Security Posture Management (CSPM) and cloud audit log connectors."
    },
    {
        "rule_id": "RULE-NS-025",
        "domain": "Negative Space",
        "name": "Zero Privilege Escalation Detections",
        "severity": "Medium",
        "default_risk_score": 74.0,
        "default_confidence": 87.0,
        "description": "Zero privilege escalation alerts recorded across entire fleet over quarterly reporting window.",
        "condition": "count_category_privilege_escalation == 0 and total_alerts > 200",
        "rationale": "Absence of privilege escalation detections indicates lack of process execution / Sysmon / auditd telemetry.",
        "recommended_action": "Enable and verify Windows Event ID 4672/4688 logging or Linux auditd rules."
    },
    {
        "rule_id": "RULE-NS-026",
        "domain": "Negative Space",
        "name": "Under-monitored Core Banking Transaction Nodes",
        "severity": "Critical",
        "default_risk_score": 97.0,
        "default_confidence": 98.0,
        "description": "Banking sector entity has core switch / payment gateway assets lacking endpoint detection coverage.",
        "condition": "sector == 'Banking' and unmonitored_core_banking_assets > 0",
        "rationale": "Payment gateways, SWIFT nodes, and core banking switches must have 100% telemetry coverage by RBI mandate.",
        "recommended_action": "Mandatory compliance review under RBI Cybersecurity Framework for Banks."
    },
    {
        "rule_id": "RULE-NS-027",
        "domain": "Negative Space",
        "name": "Complete Absence of Network Flow Correlation",
        "severity": "Medium",
        "default_risk_score": 69.0,
        "default_confidence": 82.0,
        "description": "Alerts only originate from antivirus signatures with zero network flow or proxy context.",
        "condition": "network_telemetry_sources == 0 and endpoint_sources > 0",
        "rationale": "Endpoint-only visibility cannot detect network reconnaissance, lateral movement, or rogue assets.",
        "recommended_action": "Integrate NetFlow/IPFIX or network sensor feeds into the ingestion hub."
    },
    {
        "rule_id": "RULE-NS-028",
        "domain": "Negative Space",
        "name": "Zero NCIIPC Threat Feed Indicator Matches",
        "severity": "High",
        "default_risk_score": 85.0,
        "default_confidence": 92.0,
        "description": "Entity reports zero matches against NCIIPC advisory IOCs disseminated in reporting period.",
        "condition": "nciipc_feed_active == True and matches_count == 0 and peer_matches_median > 10",
        "rationale": "Peers have registered multiple matches against current national advisory feeds; zero matches indicates feed ingestion failure.",
        "recommended_action": "Verify threat intelligence platform (TIP) sync and automated rule matching status."
    },

    # ============================================================
    # DOMAIN 3: KPI GAMING & BEHAVIORAL ANOMALIES (RULES 29 - 38)
    # ============================================================
    {
        "rule_id": "RULE-GM-029",
        "domain": "KPI Gaming",
        "name": "Shift-End Mass Closure Spike",
        "severity": "High",
        "default_risk_score": 88.0,
        "default_confidence": 94.0,
        "description": "> 50% of shift alerts closed in the final 15 minutes of the operational shift.",
        "condition": "shift_end_closure_ratio > 0.50",
        "rationale": "Clear indicator of ticket backlog purging to meet shift handover SLAs without genuine investigation.",
        "recommended_action": "Perform retrospective supervisor audit on all tickets closed within final 30 minutes of shift."
    },
    {
        "rule_id": "RULE-GM-030",
        "domain": "KPI Gaming",
        "name": "Artificial MTTR Compression (SLA Threshold Clustering)",
        "severity": "High",
        "default_risk_score": 84.0,
        "default_confidence": 91.0,
        "description": "Investigation durations unnaturally cluster immediately before SLA expiry (e.g. 58-59 mins for 60 min SLA).",
        "condition": "duration_clustering_at_sla_bound == True",
        "rationale": "Distribution anomaly indicating automated script or rushed manual closures driven strictly by metric targets.",
        "recommended_action": "Evaluate empirical investigation quality vs MTTR metrics; decouple bonus KPIs from raw closure speed."
    },
    {
        "rule_id": "RULE-GM-031",
        "domain": "KPI Gaming",
        "name": "Uniform Closure Times (Robotic Investigation Pattern)",
        "severity": "High",
        "default_risk_score": 81.0,
        "default_confidence": 95.0,
        "description": "Standard deviation of closure times is < 5 seconds across 50+ independent incidents.",
        "condition": "std_closure_seconds < 5.0 and sample_size > 50",
        "rationale": "Human investigation durations exhibit natural log-normal variance. Flat uniformity indicates automated bot closing or rubber-stamping.",
        "recommended_action": "Investigate analyst automation scripts and verify individual case validity."
    },
    {
        "rule_id": "RULE-GM-032",
        "domain": "KPI Gaming",
        "name": "Severe Metric-Evidence Divergence",
        "severity": "Critical",
        "default_risk_score": 93.0,
        "default_confidence": 93.0,
        "description": "Reported MTTR is exemplary (< 5 mins) but investigation depth is zero (notes < 10 chars, actions = 0).",
        "condition": "reported_mttr < 300 and average_investigation_depth < 0.2",
        "rationale": "Supervisory gap where management dashboards display 'green' metrics while operational security is completely hollow.",
        "recommended_action": "Recalculate entity resilience using evidence-weighted supervisory scores."
    },
    {
        "rule_id": "RULE-GM-033",
        "domain": "KPI Gaming",
        "name": "100% False Positive Classification Bias",
        "severity": "High",
        "default_risk_score": 86.0,
        "default_confidence": 96.0,
        "description": "Entity classifies 100% of alerts as 'False Positive' across 1,000+ alerts.",
        "condition": "false_positive_ratio == 1.0 and total_alerts > 1000",
        "rationale": "Zero true positives in thousands of alerts demonstrates default-dismissal culture to avoid incident handling overhead.",
        "recommended_action": "Conduct blind re-analysis on random sample of 100 dismissed alerts."
    },
    {
        "rule_id": "RULE-GM-034",
        "domain": "KPI Gaming",
        "name": "Reassignment Carousel (Hot Potato Gaming)",
        "severity": "Medium",
        "default_risk_score": 67.0,
        "default_confidence": 85.0,
        "description": "Complex critical alerts reassigned between > 4 analysts before closure with minimal notes.",
        "condition": "reassignment_count > 4 and notes_length < 50",
        "rationale": "Analysts passing difficult tickets to reset individual dwell timers without progressing investigation.",
        "recommended_action": "Set hard limit of 2 reassignments before mandatory supervisory escalation."
    },
    {
        "rule_id": "RULE-GM-035",
        "domain": "KPI Gaming",
        "name": "Severity Downgrading to Bypass SLA Targets",
        "severity": "Critical",
        "default_risk_score": 91.0,
        "default_confidence": 90.0,
        "description": "Critical alerts systematically downgraded to Low/Info prior to closure.",
        "condition": "severity_downgraded == True and initial_severity == 'Critical'",
        "rationale": "Downgrading bypasses executive SLA breach reporting and suppresses NCIIPC reporting triggers.",
        "recommended_action": "Require supervisory approval before any severity reduction on crown jewel assets."
    },
    {
        "rule_id": "RULE-GM-036",
        "domain": "KPI Gaming",
        "name": "Off-Hours Alert Stalling",
        "severity": "Medium",
        "default_risk_score": 65.0,
        "default_confidence": 83.0,
        "description": "Night-shift alerts left unassigned and resolved in mass during morning shift start.",
        "condition": "night_shift_unassigned_ratio > 0.70",
        "rationale": "Indicates night-shift slumber or severe staffing deficiency in declared 24x7 SOC.",
        "recommended_action": "Audit physical access logs and keystroke activity during night operational shifts."
    },
    {
        "rule_id": "RULE-GM-037",
        "domain": "KPI Gaming",
        "name": "Disposition Churn (Toggling Dispositions)",
        "severity": "Medium",
        "default_risk_score": 64.0,
        "default_confidence": 81.0,
        "description": "Alert disposition changed multiple times between True Positive and False Positive before final close.",
        "condition": "disposition_changes > 2",
        "rationale": "Signals analyst indecisiveness or operational pressure to suppress incident counts.",
        "recommended_action": "Review ticket change history and require formal justification for disposition shifts."
    },
    {
        "rule_id": "RULE-GM-038",
        "domain": "KPI Gaming",
        "name": "Instant Acknowledge-Close Loop",
        "severity": "High",
        "default_risk_score": 83.0,
        "default_confidence": 92.0,
        "description": "Delta between acknowledge timestamp and close timestamp is under 5 seconds.",
        "condition": "close_after_ack_seconds < 5",
        "rationale": "Acknowledge and close executed in single click sequence, proving no triage occurred between states.",
        "recommended_action": "Introduce mandatory workflow gate between acknowledge and closure states."
    },

    # ==============================================================
    # DOMAIN 4: ESCALATION & WORKFLOW FAILURES (RULES 39 - 46)
    # ==============================================================
    {
        "rule_id": "RULE-ES-039",
        "domain": "Escalation Failure",
        "name": "Critical Infrastructure Breach Lacking NCIIPC Notification",
        "severity": "Critical",
        "default_risk_score": 99.0,
        "default_confidence": 99.0,
        "description": "Confirmed Critical breach on power grid, nuclear, or air traffic control lacking statutory notification.",
        "condition": "criticality == 'Critical' and disposition == 'True Positive' and escalation_level != 'NCIIPC'",
        "rationale": "Section 70B of IT Act & National Critical Information Infrastructure guidelines mandate immediate reporting of critical cyber incidents.",
        "recommended_action": "Issue formal statutory non-compliance notice to entity CISO."
    },
    {
        "rule_id": "RULE-ES-040",
        "domain": "Escalation Failure",
        "name": "Excessive L1 to L2 Escalation Dwell Time",
        "severity": "High",
        "default_risk_score": 79.0,
        "default_confidence": 89.0,
        "description": "Time to escalate Critical alert from L1 triage to L2 IR exceeds 4 hours.",
        "condition": "escalation_time_seconds > 14400 and severity == 'Critical'",
        "rationale": "Adversaries achieve active directory persistence in under 2 hours; delayed escalation allows lateral breakout.",
        "recommended_action": "Establish strict 15-minute SLA for Tier-1 escalation of critical IOCs."
    },
    {
        "rule_id": "RULE-ES-041",
        "domain": "Escalation Failure",
        "name": "Orphan Escalation Without Response Confirmation",
        "severity": "High",
        "default_risk_score": 82.0,
        "default_confidence": 91.0,
        "description": "Escalation ticket generated but no secondary responder accepted or acknowledged within 12 hours.",
        "condition": "escalated == True and escalation_acknowledged == False and age_hours > 12",
        "rationale": "Escalation into a void where responsibility drops between organizational silos.",
        "recommended_action": "Implement escalation acknowledgment auto-page to Incident Response On-Call Manager."
    },
    {
        "rule_id": "RULE-ES-042",
        "domain": "Escalation Failure",
        "name": "Repeated Escalation Rejection by Tier-2",
        "severity": "Medium",
        "default_risk_score": 71.0,
        "default_confidence": 88.0,
        "description": "> 40% of escalations rejected back to Tier-1 as 'Insufficient Evidence'.",
        "condition": "escalation_rejection_rate > 0.40",
        "rationale": "Indicates severe breakdown in Tier-1 triage quality and lack of standard evidence-packaging templates.",
        "recommended_action": "Conduct joint Tier-1 / Tier-2 case debrief and align evidence packaging criteria."
    },
    {
        "rule_id": "RULE-ES-043",
        "domain": "Escalation Failure",
        "name": "CISO Bypassed for Severe Exfiltration Event",
        "severity": "Critical",
        "default_risk_score": 93.0,
        "default_confidence": 95.0,
        "description": "Exfiltration event exceeding 10GB handled exclusively at L1/L2 without executive notification.",
        "condition": "category == 'Exfiltration' and volume_gb > 10 and escalation_level not in ['CISO', 'Executive']",
        "rationale": "High-volume data loss requires crisis management and legal/regulatory disclosure preparation.",
        "recommended_action": "Enforce automated CISO paging on high-volume exfiltration triggers."
    },
    {
        "rule_id": "RULE-ES-044",
        "domain": "Escalation Failure",
        "name": "SLA Failure on Ransomware Containment",
        "severity": "Critical",
        "default_risk_score": 95.0,
        "default_confidence": 94.0,
        "description": "Ransomware alert escalation failed SLA containment window of 30 minutes.",
        "condition": "category == 'Ransomware' and sla_met == False",
        "rationale": "Speed of encryption requires sub-30 minute isolation; SLA failure risks catastrophic operational outage.",
        "recommended_action": "Implement automated network isolation upon high-confidence ransomware alerts."
    },
    {
        "rule_id": "RULE-ES-045",
        "domain": "Escalation Failure",
        "name": "Unvalidated Escalation Closure by Third-Party MSSP",
        "severity": "High",
        "default_risk_score": 85.0,
        "default_confidence": 90.0,
        "description": "Escalated critical incident closed directly by external contractor without internal CSE sign-off.",
        "condition": "contractor_closure == True and internal_signoff == False and severity == 'Critical'",
        "rationale": "Critical sector entities cannot outsource ultimate security liability; internal verification is mandatory.",
        "recommended_action": "Require cryptographic internal sign-off on all MSSP incident resolutions."
    },
    {
        "rule_id": "RULE-ES-046",
        "domain": "Escalation Failure",
        "name": "Missing Chain of Custody for Forensic Escalations",
        "severity": "Medium",
        "default_risk_score": 68.0,
        "default_confidence": 85.0,
        "description": "Escalation involving disk/memory acquisition lacks evidence hash and chain of custody log.",
        "condition": "forensic_acquired == True and evidence_hash_present == False",
        "rationale": "Compromised chain of custody invalidates forensic evidence in judicial or national inquiry proceedings.",
        "recommended_action": "Implement automated SHA-256 evidence hashing in forensic acquisition scripts."
    },

    # ==============================================================
    # DOMAIN 5: INVESTIGATION QUALITY & TEMPLATING (RULES 47 - 55)
    # ==============================================================
    {
        "rule_id": "RULE-IQ-047",
        "domain": "Investigation Quality",
        "name": "High-Frequency Boilerplate Templated Notes",
        "severity": "High",
        "default_risk_score": 87.0,
        "default_confidence": 95.0,
        "description": "Identical investigation note string repeated across > 15 disparate incidents by multiple analysts.",
        "condition": "templated_similarity > 0.85 and repetition_count > 15",
        "rationale": "Copy-pasting boilerplate statements ('Reviewed IP, no threat, closed') demonstrates lack of actual telemetry inspection.",
        "recommended_action": "Flag all cases using identical text snippet for manual supervisory review."
    },
    {
        "rule_id": "RULE-IQ-048",
        "domain": "Investigation Quality",
        "name": "Single-Word or Sub-15-Character Investigation Note",
        "severity": "High",
        "default_risk_score": 80.0,
        "default_confidence": 98.0,
        "description": "Investigation note contains fewer than 15 characters (e.g. 'ok', 'fp', 'checked', 'resolved').",
        "condition": "len(notes) < 15 and status == 'Closed'",
        "rationale": "A single word provides zero supervisory auditability or proof of forensic due diligence.",
        "recommended_action": "Configure minimum note length enforcement in case management schema."
    },
    {
        "rule_id": "RULE-IQ-049",
        "domain": "Investigation Quality",
        "name": "Zero Correlated IOC Evidence in Critical Case",
        "severity": "High",
        "default_risk_score": 84.0,
        "default_confidence": 89.0,
        "description": "Investigation closed without recording any inspected IP, file hash, URL, or domain artifact.",
        "condition": "severity == 'Critical' and artifacts_recorded == 0",
        "rationale": "Validating threat absence requires corroborating specific indicators against local network logs.",
        "recommended_action": "Mandate at least one verified artifact record per critical investigation."
    },
    {
        "rule_id": "RULE-IQ-050",
        "domain": "Investigation Quality",
        "name": "Discrepancy Between Investigation Notes and Selected Disposition",
        "severity": "High",
        "default_risk_score": 83.0,
        "default_confidence": 87.0,
        "description": "Investigation text describes confirmed infection but ticket disposition is marked 'False Positive'.",
        "condition": "notes_contain_threat == True and disposition == 'False Positive'",
        "rationale": "Contradiction indicates confusion or deliberate misclassification to avoid escalation procedures.",
        "recommended_action": "Perform semantic consistency check and assign to Senior Supervisor for correction."
    },
    {
        "rule_id": "RULE-IQ-051",
        "domain": "Investigation Quality",
        "name": "Zero Host Memory or Process Inspection for C2 Infection",
        "severity": "High",
        "default_risk_score": 86.0,
        "default_confidence": 89.0,
        "description": "Command and control case closed without querying host process tree or active network sockets.",
        "condition": "category == 'Command & Control' and host_inspection_actions == 0",
        "rationale": "Network C2 alarms cannot be dismissed without proving the host process has ceased or was legitimate.",
        "recommended_action": "Require EDR telemetry cross-reference before closing C2 alerts."
    },
    {
        "rule_id": "RULE-IQ-052",
        "domain": "Investigation Quality",
        "name": "Cross-Entity Boilerplate Investigation Sharing",
        "severity": "Medium",
        "default_risk_score": 75.0,
        "default_confidence": 91.0,
        "description": "Identical custom investigation paragraphs appear across multiple unrelated entities served by same MSSP.",
        "condition": "cross_entity_identical_text == True",
        "rationale": "Indicates shared contractor applying indiscriminate macros across critical national sector clients.",
        "recommended_action": "Audit MSSP delivery quality across national supervisory portfolio."
    },
    {
        "rule_id": "RULE-IQ-053",
        "domain": "Investigation Quality",
        "name": "Investigation Duration Under 30 Seconds for High Severity",
        "severity": "High",
        "default_risk_score": 85.0,
        "default_confidence": 96.0,
        "description": "Recorded investigation duration is under 30 seconds for a High severity alert.",
        "condition": "duration_seconds < 30 and severity in ['High', 'Critical']",
        "rationale": "It is physically impossible for a human analyst to load, read, and cross-reference a high severity alert in 30 seconds.",
        "recommended_action": "Flag case for quality audit and analyst interview."
    },
    {
        "rule_id": "RULE-IQ-054",
        "domain": "Investigation Quality",
        "name": "Absence of Remediation Guidance in Closed Cases",
        "severity": "Medium",
        "default_risk_score": 66.0,
        "default_confidence": 84.0,
        "description": "Confirmed incident closed without documenting preventative patches, firewall changes, or user actions.",
        "condition": "disposition == 'True Positive' and remediation_documented == False",
        "rationale": "Incident closure without remediation leaves the original vulnerability open to re-exploitation.",
        "recommended_action": "Require documented remediation ticket reference before case resolution."
    },
    {
        "rule_id": "RULE-IQ-055",
        "domain": "Investigation Quality",
        "name": "Unverified Bulk Suppression Rule Creation",
        "severity": "Critical",
        "default_risk_score": 92.0,
        "default_confidence": 93.0,
        "description": "Analyst resolved alert by permanently whitelisting or suppressing the underlying detection rule.",
        "condition": "suppression_rule_created == True and peer_reviewed == False",
        "rationale": "Analyst silencing detection rules to reduce workload blinds the SOC to future attacks.",
        "recommended_action": "Audit all SIEM/EDR suppression rules added in the reporting window."
    }
]

def get_rules_catalog():
    return SUPERVISORY_RULES

def get_rule_by_id(rule_id: str):
    for r in SUPERVISORY_RULES:
        if r["rule_id"] == rule_id:
            return r
    return None
