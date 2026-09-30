from typing import List, Dict, Any
from sqlalchemy.orm import Session
from datetime import timedelta
import pandas as pd
from app.models import Entity, Alert, Case, Escalation, Response, Finding

class ExecutionGapEngine:
    @classmethod
    def evaluate(cls, db: Session, entity_id: str) -> List[Finding]:
        findings: List[Finding] = []
        
        alerts = db.query(Alert).filter(Alert.entity_id == entity_id).all()
        cases = db.query(Case).filter(Case.entity_id == entity_id).all()
        
        if not alerts:
            return findings

        # Indexing for fast joins
        case_by_alert = {c.alert_id: c for c in cases}
        case_ids = {c.id for c in cases}
        
        escalations = db.query(Escalation).filter(Escalation.case_id.in_(case_ids)).all() if case_ids else []
        responses = db.query(Response).filter(Response.case_id.in_(case_ids)).all() if case_ids else []
        
        escalation_by_case = {e.case_id: e for e in escalations}
        response_by_case = {r.case_id: r for r in responses}

        # -----------------------------------------------------------------
        # RULE 1: Critical alert closed unusually quickly (< 3 minutes)
        # -----------------------------------------------------------------
        rapid_critical_alerts = []
        for a in alerts:
            if a.severity == "CRITICAL" and a.created_at and a.closed_at:
                diff_sec = (a.closed_at - a.created_at).total_seconds()
                if 0 < diff_sec < 180: # Closed under 3 minutes (180s)
                    c = case_by_alert.get(a.id)
                    # Check if escalation exists
                    has_esc = c and (c.id in escalation_by_case)
                    if not has_esc:
                        rapid_critical_alerts.append((a, int(diff_sec)))

        if len(rapid_critical_alerts) >= 2:
            alert_ids = [a[0].id for a in rapid_critical_alerts]
            avg_sec = int(sum(a[1] for a in rapid_critical_alerts) / len(rapid_critical_alerts))
            findings.append(Finding(
                id=f"FND-EG-R1-{entity_id}",
                entity_id=entity_id,
                finding_type="EXECUTION_GAP",
                rule_id="RULE_1",
                title="Critical alerts closed unusually quickly",
                severity="CRITICAL",
                priority="P1",
                confidence=0.94,
                explanation=f"{len(rapid_critical_alerts)} critical alerts were closed within {avg_sec} seconds (< 3 minutes) without corresponding investigation or escalation evidence.",
                evidence={
                    "alert_count": len(rapid_critical_alerts),
                    "average_closure_seconds": avg_sec,
                    "sample_alerts": alert_ids[:8],
                    "categories": list({a[0].category for a in rapid_critical_alerts})
                },
                expected_workflow=["ALERT", "INVESTIGATION", "ESCALATION", "RESPONSE"],
                observed_workflow=["ALERT", "RAPID_CLOSE"],
                missing_evidence=["INVESTIGATION", "ESCALATION"],
                supervisory_action="Audit analyst activity logs and triage timestamps around closure window to identify SLA gaming."
            ))

        # -----------------------------------------------------------------
        # RULE 2: Critical alert closed without escalation
        # -----------------------------------------------------------------
        critical_alerts = [a for a in alerts if a.severity == "CRITICAL"]
        unescalated_criticals = []
        for a in critical_alerts:
            c = case_by_alert.get(a.id)
            has_esc = c and (c.id in escalation_by_case)
            if not has_esc and a.disposition in ["TRUE_POSITIVE", "ACTION_TAKEN"]:
                unescalated_criticals.append(a.id)

        if len(unescalated_criticals) >= 3:
            findings.append(Finding(
                id=f"FND-EG-R2-{entity_id}",
                entity_id=entity_id,
                finding_type="EXECUTION_GAP",
                rule_id="RULE_2",
                title="Critical alert closed without escalation",
                severity="HIGH",
                priority="P1",
                confidence=0.91,
                explanation=f"{len(unescalated_criticals)} confirmed critical alerts were closed as True Positive without any Tier-2 or CISO escalation recorded.",
                evidence={
                    "unescalated_critical_count": len(unescalated_criticals),
                    "sample_alert_ids": unescalated_criticals[:8]
                },
                expected_workflow=["ALERT", "INVESTIGATION", "ESCALATION", "RESPONSE"],
                observed_workflow=["ALERT", "INVESTIGATION", "CLOSED"],
                missing_evidence=["ESCALATION"],
                supervisory_action="Verify entity incident dispatch policy and check whether senior incident responders were bypassed."
            ))

        # -----------------------------------------------------------------
        # RULE 3: Alert acknowledged but no meaningful investigation exists
        # -----------------------------------------------------------------
        shallow_cases = []
        for c in cases:
            if c.investigation_actions <= 1 and len(c.investigation_text.split()) < 8:
                shallow_cases.append(c.id)

        if len(shallow_cases) >= 4:
            findings.append(Finding(
                id=f"FND-EG-R3-{entity_id}",
                entity_id=entity_id,
                finding_type="EXECUTION_GAP",
                rule_id="RULE_3",
                title="Alert acknowledged but no meaningful investigation exists",
                severity="MEDIUM",
                priority="P2",
                confidence=0.88,
                explanation=f"{len(shallow_cases)} alerts were acknowledged to stop the operational SLA timer, but closed with single-action superficial notes.",
                evidence={
                    "shallow_case_count": len(shallow_cases),
                    "sample_cases": shallow_cases[:6]
                },
                expected_workflow=["ALERT", "DETAILED_INVESTIGATION", "CONTAINMENT"],
                observed_workflow=["ALERT", "ACKNOWLEDGED", "SUB_15_CHAR_NOTE"],
                missing_evidence=["FORENSIC_TRIAGE_ACTIONS"],
                supervisory_action="Sample case notes for analyst rubber-stamping and minimum investigation criteria enforcement."
            ))

        # -----------------------------------------------------------------
        # RULE 4: Repeated alerts on same asset without evidence of remediation
        # -----------------------------------------------------------------
        asset_alert_counts = {}
        for a in alerts:
            if a.asset_id:
                asset_alert_counts[a.asset_id] = asset_alert_counts.get(a.asset_id, 0) + 1

        recurring_assets = [ast_id for ast_id, cnt in asset_alert_counts.items() if cnt >= 15]
        if recurring_assets:
            findings.append(Finding(
                id=f"FND-EG-R4-{entity_id}",
                entity_id=entity_id,
                finding_type="EXECUTION_GAP",
                rule_id="RULE_4",
                title="Repeated alerts on same asset without evidence of remediation",
                severity="HIGH",
                priority="P2",
                confidence=0.89,
                explanation=f"{len(recurring_assets)} crown-jewel assets suffered over 15 recurring threat detections with zero recorded permanent remediation.",
                evidence={
                    "recurring_asset_ids": recurring_assets[:5],
                    "total_recurring_assets": len(recurring_assets)
                },
                expected_workflow=["RECURRING_ALERT", "ROOT_CAUSE_ANALYSIS", "PERMANENT_REMEDIATION"],
                observed_workflow=["RECURRING_ALERT", "REPEATED_DISMISSAL"],
                missing_evidence=["ROOT_CAUSE_REMEDIATION"],
                supervisory_action="Demand asset vulnerability status and persistent malware remediation proof from entity CISO."
            ))

        # -----------------------------------------------------------------
        # RULE 5: Investigation text/actions are highly repetitive
        # -----------------------------------------------------------------
        if len(cases) >= 10:
            text_counts = {}
            for c in cases:
                norm_text = " ".join(c.investigation_text.lower().split()[:12])
                text_counts[norm_text] = text_counts.get(norm_text, 0) + 1

            max_repetition = max(text_counts.values()) if text_counts else 0
            repetition_pct = (max_repetition / len(cases)) * 100
            if repetition_pct >= 40.0:
                findings.append(Finding(
                    id=f"FND-EG-R5-{entity_id}",
                    entity_id=entity_id,
                    finding_type="EXECUTION_GAP",
                    rule_id="RULE_5",
                    title="Investigation text and actions are highly repetitive",
                    severity="HIGH",
                    priority="P2",
                    confidence=0.95,
                    explanation=f"{max_repetition} investigation records ({repetition_pct:.1f}% of total) share identical boilerplate text across disparate critical incidents.",
                    evidence={
                        "repetition_percentage": round(repetition_pct, 1),
                        "repeated_instances_count": max_repetition,
                        "sample_boilerplate": list(text_counts.keys())[0] if text_counts else ""
                    },
                    expected_workflow=["CASE", "INDEPENDENT_EVIDENCE_GATHERING", "UNIQUE_NOTES"],
                    observed_workflow=["CASE", "COPY_PASTE_BOILERPLATE"],
                    missing_evidence=["HOST_SPECIFIC_FINDINGS"],
                    supervisory_action="Conduct peer review of analyst ticket notes to eliminate copy-paste investigation fraud."
                ))

        # -----------------------------------------------------------------
        # RULE 6: High-severity alert has no response evidence
        # -----------------------------------------------------------------
        high_critical_alerts = [a for a in alerts if a.severity in ["CRITICAL", "HIGH"]]
        unresponded_highs = []
        for a in high_critical_alerts:
            c = case_by_alert.get(a.id)
            has_resp = c and (c.id in response_by_case)
            if not has_resp:
                unresponded_highs.append(a.id)

        unresp_pct = (len(unresponded_highs) / max(1, len(high_critical_alerts))) * 100
        if unresp_pct >= 60.0 and len(unresponded_highs) >= 8:
            findings.append(Finding(
                id=f"FND-EG-R6-{entity_id}",
                entity_id=entity_id,
                finding_type="EXECUTION_GAP",
                rule_id="RULE_6",
                title="High-severity alert has no response evidence",
                severity="HIGH",
                priority="P2",
                confidence=0.87,
                explanation=f"{len(unresponded_highs)} high or critical threats ({unresp_pct:.1f}%) were closed with zero quarantine, IP block, or host isolation recorded.",
                evidence={
                    "unresponded_count": len(unresponded_highs),
                    "percentage_unresponded": round(unresp_pct, 1),
                    "sample_alerts": unresponded_highs[:6]
                },
                expected_workflow=["HIGH_SEVERITY_ALERT", "CONTAINMENT", "RESPONSE_ACTION"],
                observed_workflow=["HIGH_SEVERITY_ALERT", "TICKET_CLOSED"],
                missing_evidence=["RESPONSE_ACTION"],
                supervisory_action="Request endpoint containment and firewall active mitigation logs for highlighted critical incidents."
            ))

        # -----------------------------------------------------------------
        # RULE 7: Investigation workload is inconsistent with alert workload
        # -----------------------------------------------------------------
        total_alerts_count = len(alerts)
        total_cases_count = len(cases)
        investigation_ratio = total_cases_count / max(1, total_alerts_count)
        if total_alerts_count >= 50 and investigation_ratio < 0.25:
            findings.append(Finding(
                id=f"FND-EG-R7-{entity_id}",
                entity_id=entity_id,
                finding_type="EXECUTION_GAP",
                rule_id="RULE_7",
                title="Investigation workload is inconsistent with alert workload",
                severity="MEDIUM",
                priority="P3",
                confidence=0.82,
                explanation=f"Entity received {total_alerts_count} alerts but opened only {total_cases_count} cases ({investigation_ratio*100:.1f}% investigation rate). Severe backlog suppression suspected.",
                evidence={
                    "total_alerts": total_alerts_count,
                    "cases_opened": total_cases_count,
                    "investigation_ratio": round(investigation_ratio, 2)
                },
                expected_workflow=["ALERT_GENERATION", "MANDATORY_CASE_CREATION"],
                observed_workflow=["ALERT_DROP_TABLE", "UNINVESTIGATED_PURGE"],
                missing_evidence=["CASE_INVESTIGATION_RECORDS"],
                supervisory_action="Inspect SIEM alert auto-suppression filters and analyst shift backlog purging routines."
            ))

        # -----------------------------------------------------------------
        # RULE 8: Escalation activity is unexpectedly low for critical alerts
        # -----------------------------------------------------------------
        critical_count = len(critical_alerts)
        critical_escalated_count = 0
        for a in critical_alerts:
            c = case_by_alert.get(a.id)
            if c and (c.id in escalation_by_case):
                critical_escalated_count += 1

        esc_rate = (critical_escalated_count / max(1, critical_count)) * 100
        if critical_count >= 15 and esc_rate < 8.0:
            findings.append(Finding(
                id=f"FND-EG-R8-{entity_id}",
                entity_id=entity_id,
                finding_type="EXECUTION_GAP",
                rule_id="RULE_8",
                title="Escalation activity is unexpectedly low for critical alerts",
                severity="CRITICAL",
                priority="P1",
                confidence=0.92,
                explanation=f"Out of {critical_count} critical incidents, only {critical_escalated_count} were escalated ({esc_rate:.1f}% escalation rate vs peer expected 20-35%).",
                evidence={
                    "critical_alerts_count": critical_count,
                    "escalated_count": critical_escalated_count,
                    "escalation_rate_pct": round(esc_rate, 1)
                },
                expected_workflow=["CRITICAL_ALERT", "TIER_2_ESCALATION", "INCIDENT_DISPATCH"],
                observed_workflow=["CRITICAL_ALERT", "L1_SILENT_DISPOSAL"],
                missing_evidence=["ESCALATION_RECORDS"],
                supervisory_action="Verify Tier-1 analyst triage boundaries and audit if Tier-2 notifications were disabled."
            ))

        return findings
