from typing import List, Dict, Any
from sqlalchemy.orm import Session
import numpy as np
import pandas as pd
from app.models import Entity, Asset, Alert, Case, Escalation, Response, Finding

class PeerBenchmarkingEngine:
    @classmethod
    def evaluate_all(cls, db: Session) -> List[Finding]:
        findings: List[Finding] = []
        entities = db.query(Entity).all()
        if len(entities) < 2:
            return findings

        # Collect entity operational metrics
        entity_stats = []
        for ent in entities:
            alerts = db.query(Alert).filter(Alert.entity_id == ent.id).all()
            cases = db.query(Case).filter(Case.entity_id == ent.id).all()
            assets = db.query(Asset).filter(Asset.entity_id == ent.id).all()
            
            case_ids = [c.id for c in cases]
            escalations = db.query(Escalation).filter(Escalation.case_id.in_(case_ids)).all() if case_ids else []
            responses = db.query(Response).filter(Response.case_id.in_(case_ids)).all() if case_ids else []

            total_alerts = len(alerts)
            crit_alerts = sum(1 for a in alerts if a.severity == "CRITICAL")
            crit_alert_pct = (crit_alerts / max(1, total_alerts)) * 100

            investigation_rate = (len(cases) / max(1, total_alerts)) * 100
            escalation_rate = (len(escalations) / max(1, len(cases))) * 100
            response_rate = (len(responses) / max(1, len(cases))) * 100
            
            monitored_assets = sum(1 for ast in assets if ast.monitoring_status == "ACTIVE")
            monitoring_coverage = (monitored_assets / max(1, len(assets))) * 100

            entity_stats.append({
                "entity_id": ent.id,
                "name": ent.name,
                "sector": ent.sector,
                "size_band": ent.size_band,
                "criticality": ent.criticality,
                "alert_volume": total_alerts,
                "critical_alert_pct": round(crit_alert_pct, 1),
                "investigation_rate": round(investigation_rate, 1),
                "escalation_rate": round(escalation_rate, 1),
                "response_rate": round(response_rate, 1),
                "monitoring_coverage": round(monitoring_coverage, 1)
            })

        df = pd.DataFrame(entity_stats)

        # Peer benchmarking by sector / size_band
        for _, row in df.iterrows():
            ent_id = row["entity_id"]
            sector = row["sector"]
            
            # Find peer group (same sector or fallback to same criticality)
            peers = df[df["sector"] == sector]
            if len(peers) < 2:
                peers = df[df["criticality"] == row["criticality"]]
            if len(peers) < 2:
                peers = df # Global peer fallback

            peer_avg_esc = peers["escalation_rate"].mean()
            peer_avg_resp = peers["response_rate"].mean()
            peer_avg_inv = peers["investigation_rate"].mean()
            peer_avg_mon = peers["monitoring_coverage"].mean()

            # Escalation rate deviation (e.g. CSE-14: Entity 2% vs Peer 18%)
            if peer_avg_esc >= 12.0 and row["escalation_rate"] <= 4.0:
                findings.append(Finding(
                    id=f"FND-PEER-ESC-{ent_id}",
                    entity_id=ent_id,
                    finding_type="PEER_DEVIATION",
                    rule_id="PEER_ESC_01",
                    title="Significantly low escalation rate compared to sector peers",
                    severity="HIGH",
                    priority="P2",
                    confidence=0.91,
                    explanation=f"Entity {ent_id} exhibits an Escalation Rate of {row['escalation_rate']}%, compared to the Peer Sector Average of {peer_avg_esc:.1f}%. Significant deviation from peer behavior; supervisory review recommended.",
                    evidence={
                        "entity_escalation_rate_pct": row["escalation_rate"],
                        "peer_average_escalation_rate_pct": round(peer_avg_esc, 1),
                        "peer_group": sector,
                        "deviation_magnitude": round(peer_avg_esc - row["escalation_rate"], 1)
                    },
                    expected_workflow=["PEER_ESCALATION_BASELINE", "INCIDENT_TIER2_HANDOFF"],
                    observed_workflow=["ISOLATED_L1_TICKET_HANDLING"],
                    missing_evidence=["EXPECTED_PEER_ESCALATIONS"],
                    supervisory_action="Significant deviation from peer behavior; supervisory review recommended. Request entity escalation escalation matrix."
                ))

            # Response rate deviation (e.g. CSE-18: Response rate <= 5% vs Peer 35%)
            if peer_avg_resp >= 18.0 and row["response_rate"] <= 5.0:
                findings.append(Finding(
                    id=f"FND-PEER-RESP-{ent_id}",
                    entity_id=ent_id,
                    finding_type="PEER_DEVIATION",
                    rule_id="PEER_RESP_02",
                    title="Significantly low response evidence rate compared to sector peers",
                    severity="HIGH",
                    priority="P2",
                    confidence=0.89,
                    explanation=f"Entity {ent_id} exhibits a Response Evidence Rate of {row['response_rate']}%, compared to the Peer Sector Average of {peer_avg_resp:.1f}%. Significant deviation from peer behavior; supervisory review recommended.",
                    evidence={
                        "entity_response_rate_pct": row["response_rate"],
                        "peer_average_response_rate_pct": round(peer_avg_resp, 1),
                        "peer_group": sector
                    },
                    expected_workflow=["PEER_RESPONSE_BASELINE", "ACTIVE_CONTAINMENT_ACTIONS"],
                    observed_workflow=["ZERO_RECORDED_ACTIONS"],
                    missing_evidence=["RESPONSE_ACTION_LOGS"],
                    supervisory_action="Significant deviation from peer behavior; supervisory review recommended. Request firewall block and endpoint containment logs."
                ))

            # Monitoring coverage deviation (e.g. CSE-07: Monitoring coverage 70% vs Peer 98%)
            if peer_avg_mon >= 85.0 and row["monitoring_coverage"] <= 75.0:
                findings.append(Finding(
                    id=f"FND-PEER-MON-{ent_id}",
                    entity_id=ent_id,
                    finding_type="PEER_DEVIATION",
                    rule_id="PEER_MON_03",
                    title="Significantly lower monitoring coverage compared to sector peers",
                    severity="HIGH",
                    priority="P1",
                    confidence=0.94,
                    explanation=f"Entity {ent_id} exhibits a Monitoring Coverage of {row['monitoring_coverage']}%, compared to the Peer Sector Average of {peer_avg_mon:.1f}%. Significant deviation from peer behavior; supervisory review recommended.",
                    evidence={
                        "entity_monitoring_coverage_pct": row["monitoring_coverage"],
                        "peer_average_monitoring_coverage_pct": round(peer_avg_mon, 1),
                        "peer_group": sector
                    },
                    expected_workflow=["FULL_SCOPE_TELEMETRY", "100_PERCENT_CROWN_JEWEL_COVERAGE"],
                    observed_workflow=["UNMONITORED_CROWN_JEWELS"],
                    missing_evidence=["CROWN_JEWEL_SENSOR_HEALTH"],
                    supervisory_action="Significant deviation from peer behavior; supervisory review recommended. Audit unmonitored critical assets."
                ))

        return findings

    @classmethod
    def get_metrics_table(cls, db: Session) -> List[Dict[str, Any]]:
        entities = db.query(Entity).all()
        table = []
        for ent in entities:
            alerts = db.query(Alert).filter(Alert.entity_id == ent.id).all()
            cases = db.query(Case).filter(Case.entity_id == ent.id).all()
            assets = db.query(Asset).filter(Asset.entity_id == ent.id).all()
            
            case_ids = [c.id for c in cases]
            escalations = db.query(Escalation).filter(Escalation.case_id.in_(case_ids)).all() if case_ids else []
            responses = db.query(Response).filter(Response.case_id.in_(case_ids)).all() if case_ids else []

            total_alerts = len(alerts)
            crit_alerts = sum(1 for a in alerts if a.severity == "CRITICAL")
            crit_pct = (crit_alerts / max(1, total_alerts)) * 100
            inv_rate = (len(cases) / max(1, total_alerts)) * 100
            esc_rate = (len(escalations) / max(1, len(cases))) * 100
            resp_rate = (len(responses) / max(1, len(cases))) * 100
            mon_cov = (sum(1 for ast in assets if ast.monitoring_status == "ACTIVE") / max(1, len(assets))) * 100

            table.append({
                "entity_id": ent.id,
                "name": ent.name,
                "sector": ent.sector,
                "size_band": ent.size_band,
                "criticality": ent.criticality,
                "alert_volume": total_alerts,
                "critical_alert_pct": round(crit_pct, 1),
                "investigation_rate": round(inv_rate, 1),
                "escalation_rate": round(esc_rate, 1),
                "response_rate": round(resp_rate, 1),
                "monitoring_coverage": round(mon_cov, 1)
            })
        return table
