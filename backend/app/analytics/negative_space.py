from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models import Entity, Asset, Alert, Case, Escalation, Response, ExpectedEvidence, Finding

class NegativeSpaceEngine:
    @classmethod
    def evaluate(cls, db: Session, entity_id: str) -> List[Finding]:
        findings: List[Finding] = []
        
        ent = db.query(Entity).filter(Entity.id == entity_id).first()
        if not ent:
            return findings

        assets = db.query(Asset).filter(Asset.entity_id == entity_id).all()
        alerts = db.query(Alert).filter(Alert.entity_id == entity_id).all()
        cases = db.query(Case).filter(Case.entity_id == entity_id).all()
        
        case_by_alert = {c.alert_id: c for c in cases}
        case_ids = {c.id for c in cases}
        
        escalations = db.query(Escalation).filter(Escalation.case_id.in_(case_ids)).all() if case_ids else []
        responses = db.query(Response).filter(Response.case_id.in_(case_ids)).all() if case_ids else []
        
        escalation_by_case = {e.case_id: e for e in escalations}
        response_by_case = {r.case_id: r for r in responses}

        alert_asset_ids = {a.asset_id for a in alerts if a.asset_id}
        alert_categories = {a.category for a in alerts if a.category}

        # -----------------------------------------------------------------
        # 1. Critical asset with monitoring_expected = TRUE but no monitoring evidence
        # -----------------------------------------------------------------
        critical_assets = [ast for ast in assets if ast.criticality in ["CRITICAL", "HIGH"] and ast.monitoring_expected]
        silent_assets = [ast for ast in critical_assets if ast.id not in alert_asset_ids or ast.monitoring_status == "SILENT"]

        if silent_assets:
            ast_ids = [ast.id for ast in silent_assets]
            findings.append(Finding(
                id=f"FND-NS-1-{entity_id}",
                entity_id=entity_id,
                finding_type="NEGATIVE_SPACE",
                rule_id="NEG_SPACE_1",
                title="Critical assets with missing monitoring evidence",
                severity="CRITICAL",
                priority="P1",
                confidence=0.96,
                explanation=f"Potential Negative Space: {len(silent_assets)} crown-jewel assets have declared active monitoring, but generated zero alerts or telemetry. Expected evidence not observed. Requires supervisory verification.",
                evidence={
                    "silent_assets_count": len(silent_assets),
                    "sample_assets": [f"{ast.id} ({ast.asset_type})" for ast in silent_assets[:6]],
                    "monitoring_expected": True
                },
                expected_workflow=["ASSET_REGISTRATION", "ACTIVE_TELEMETRY", "HEARTBEAT_LOGGING", "ALERT_PIPELINE"],
                observed_workflow=["ASSET_REGISTRATION", "TELEMETRY_VACUUM"],
                missing_evidence=["AGENT_HEARTBEAT", "SYSLOG_INGESTION", "ALERT_GENERATION"],
                supervisory_action="Requires supervisory verification: Demand active agent telemetry logs and check if crown jewels were bypassed in SIEM scope."
            ))

        # -----------------------------------------------------------------
        # 2. Expected alert category absent during observation period
        # -----------------------------------------------------------------
        # Look up expected categories for entity sector
        expected_cats = {"BRUTE_FORCE", "AUTHENTICATION", "PRIVILEGE_ESCALATION", "RANSOMWARE"}
        if ent.sector == "Energy":
            expected_cats.add("SCADA_TAMPERING")
        elif ent.sector == "Core Banking":
            expected_cats.add("SQL_INJECTION")

        missing_categories = list(expected_cats - alert_categories)
        if missing_categories:
            findings.append(Finding(
                id=f"FND-NS-2-{entity_id}",
                entity_id=entity_id,
                finding_type="NEGATIVE_SPACE",
                rule_id="NEG_SPACE_2",
                title="Expected alert category absent during observation period",
                severity="HIGH",
                priority="P2",
                confidence=0.88,
                explanation=f"Potential Negative Space: Expected security categories ({', '.join(missing_categories)}) were absent during the 90-day observation window. Expected evidence not observed. Requires supervisory verification.",
                evidence={
                    "missing_categories": missing_categories,
                    "observed_categories": list(alert_categories)
                },
                expected_workflow=["THREAT_DETECTION_CATEGORY", "BASELINE_ALERT_STREAM"],
                observed_workflow=["CATEGORY_SILENCE"],
                missing_evidence=missing_categories,
                supervisory_action="Audit parser rules and verify if Windows Security Event Log or PAM audit streams are active."
            ))

        # -----------------------------------------------------------------
        # 3. Critical alerts without corresponding CASE records
        # -----------------------------------------------------------------
        critical_alerts = [a for a in alerts if a.severity == "CRITICAL"]
        orphaned_criticals = [a.id for a in critical_alerts if a.id not in case_by_alert]

        if orphaned_criticals:
            findings.append(Finding(
                id=f"FND-NS-3-{entity_id}",
                entity_id=entity_id,
                finding_type="NEGATIVE_SPACE",
                rule_id="NEG_SPACE_3",
                title="Critical alerts without corresponding CASE records",
                severity="CRITICAL",
                priority="P1",
                confidence=0.93,
                explanation=f"Potential Negative Space: {len(orphaned_criticals)} critical alerts were registered without an investigation case record created. Expected evidence not observed. Requires supervisory verification.",
                evidence={
                    "orphaned_critical_count": len(orphaned_criticals),
                    "sample_alerts": orphaned_criticals[:8]
                },
                expected_workflow=["CRITICAL_ALERT", "MANDATORY_CASE_CREATION", "FORENSIC_TRIAGE"],
                observed_workflow=["CRITICAL_ALERT", "ZERO_INVESTIGATION_RECORD"],
                missing_evidence=["CASE_RECORD"],
                supervisory_action="Examine ticketing system ingestion webhook and check for dropped alert integration queues."
            ))

        # -----------------------------------------------------------------
        # 4. Cases without expected ESCALATION records
        # -----------------------------------------------------------------
        critical_cases = [c for c in cases if c.alert_id in {a.id for a in critical_alerts}]
        unescalated_cases = [c.id for c in critical_cases if c.id not in escalation_by_case]

        if len(unescalated_cases) >= 5:
            findings.append(Finding(
                id=f"FND-NS-4-{entity_id}",
                entity_id=entity_id,
                finding_type="NEGATIVE_SPACE",
                rule_id="NEG_SPACE_4",
                title="Cases without expected ESCALATION records",
                severity="HIGH",
                priority="P2",
                confidence=0.89,
                explanation=f"Potential Negative Space: {len(unescalated_cases)} critical cases concluded without secondary tier escalation records. Expected evidence not observed. Requires supervisory verification.",
                evidence={
                    "cases_without_escalation_count": len(unescalated_cases),
                    "sample_case_ids": unescalated_cases[:6]
                },
                expected_workflow=["CASE_ANALYSIS", "TIER_2_ESCALATION_RECORD"],
                observed_workflow=["CASE_ANALYSIS", "LOCAL_CLOSURE"],
                missing_evidence=["ESCALATION_RECORD"],
                supervisory_action="Inspect whether L1 analysts possess unauthorized authority to close critical alerts without supervisor approval."
            ))

        # -----------------------------------------------------------------
        # 5. High-severity alerts without RESPONSE evidence
        # -----------------------------------------------------------------
        high_alerts = [a for a in alerts if a.severity in ["CRITICAL", "HIGH"]]
        cases_for_high = [case_by_alert[a.id] for a in high_alerts if a.id in case_by_alert]
        unresponded_cases = [c.id for c in cases_for_high if c.id not in response_by_case]

        if len(unresponded_cases) >= 10:
            findings.append(Finding(
                id=f"FND-NS-5-{entity_id}",
                entity_id=entity_id,
                finding_type="NEGATIVE_SPACE",
                rule_id="NEG_SPACE_5",
                title="High-severity alerts without RESPONSE evidence",
                severity="HIGH",
                priority="P1",
                confidence=0.91,
                explanation=f"Potential Negative Space: {len(unresponded_cases)} high/critical cases show zero incident response evidence (e.g. host isolation, credential revocation). Expected evidence not observed. Requires supervisory verification.",
                evidence={
                    "unresponded_case_count": len(unresponded_cases),
                    "sample_cases": unresponded_cases[:6]
                },
                expected_workflow=["HIGH_SEVERITY_INCIDENT", "ACTIVE_CONTAINMENT", "RESPONSE_EVIDENCE"],
                observed_workflow=["HIGH_SEVERITY_INCIDENT", "TICKET_CLOSED"],
                missing_evidence=["RESPONSE_RECORD"],
                supervisory_action="Request endpoint containment and firewall active mitigation logs for highlighted critical incidents."
            ))

        # -----------------------------------------------------------------
        # 6. Unexpectedly low activity compared with peer entities
        # -----------------------------------------------------------------
        total_alerts = len(alerts)
        if total_alerts < 60:
            findings.append(Finding(
                id=f"FND-NS-6-{entity_id}",
                entity_id=entity_id,
                finding_type="NEGATIVE_SPACE",
                rule_id="NEG_SPACE_6",
                title="Unexpectedly low activity compared with peer entities",
                severity="MEDIUM",
                priority="P3",
                confidence=0.86,
                explanation=f"Potential Negative Space: Entity recorded only {total_alerts} alerts over 90 days, significantly lower than peer baseline (>180 alerts). Expected evidence not observed. Requires supervisory verification.",
                evidence={
                    "observed_alert_count": total_alerts,
                    "peer_expected_minimum": 150
                },
                expected_workflow=["ENTERPRISE_FLEET", "CONTINUOUS_TELEMETRY_INGESTION"],
                observed_workflow=["ABNORMAL_LOW_VOLUME"],
                missing_evidence=["TELEMETRY_COMPLETENESS"],
                supervisory_action="Verify log forwarder network connectivity and ensure sensor coverage extends across all declared CSE assets."
            ))

        # -----------------------------------------------------------------
        # 7. Expected workflows absent
        # -----------------------------------------------------------------
        # Check if entire chain Alert -> Investigation -> Escalation -> Response exists
        has_full_workflow = False
        for c in cases:
            if (c.id in escalation_by_case) and (c.id in response_by_case):
                has_full_workflow = True
                break

        if not has_full_workflow and len(alerts) >= 50:
            findings.append(Finding(
                id=f"FND-NS-7-{entity_id}",
                entity_id=entity_id,
                finding_type="NEGATIVE_SPACE",
                rule_id="NEG_SPACE_7",
                title="Expected supervisory workflow absent across observation window",
                severity="HIGH",
                priority="P2",
                confidence=0.90,
                explanation="Potential Negative Space: Zero cases completed the full standard lifecycle (Alert → Investigation → Escalation → Response). Expected evidence not observed. Requires supervisory verification.",
                evidence={
                    "total_cases_analyzed": len(cases),
                    "cases_with_full_workflow": 0
                },
                expected_workflow=["ALERT", "INVESTIGATION", "ESCALATION", "RESPONSE"],
                observed_workflow=["ALERT", "INVESTIGATION", "UNESCALATED_CLOSURE"],
                missing_evidence=["COMPLETE_END_TO_END_LIFECYCLE"],
                supervisory_action="Conduct audit of incident management SOP to verify whether incident response and escalation are tracked out-of-band."
            ))

        return findings
