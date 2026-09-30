from typing import Dict, List, Any
from app.models import RiskScore, Finding
from datetime import datetime

class RiskEngine:
    @staticmethod
    def calculate_entity_risk(
        entity_id: str,
        findings: List[Finding],
        metrics: Dict[str, Any]
    ) -> RiskScore:
        """
        Calculates:
        1. Cyber Resilience Score (0-100): True operational health (higher is better).
        2. Supervisory Attention Index (0-100): Priority for regulator review (higher requires more scrutiny).
        3. Investigation Quality Score (0-100).
        4. Escalation Effectiveness Score (0-100).
        5. Monitoring Coverage Score (0-100).
        6. Overall Risk Rating: Low, Medium, High, Critical.
        """
        # Component 1: Investigation Quality Score (IQS)
        templated_penalty = metrics.get("templated_ratio", 0.0) * 45.0
        short_notes_penalty = metrics.get("short_notes_ratio", 0.0) * 35.0
        actions_credit = min(20.0, metrics.get("avg_actions_per_case", 1.0) * 5.0)
        iqs = max(10.0, min(100.0, 85.0 - templated_penalty - short_notes_penalty + actions_credit))

        # Component 2: Escalation Effectiveness Score (EES)
        critical_unescalated_penalty = metrics.get("unescalated_critical_ratio", 0.0) * 60.0
        sla_met_credit = metrics.get("escalation_sla_rate", 0.8) * 30.0
        ees = max(10.0, min(100.0, 75.0 - critical_unescalated_penalty + sla_met_credit))

        # Component 3: Monitoring Coverage Score (MCS)
        telemetry_ratio = metrics.get("telemetry_coverage_ratio", 0.85)
        silent_critical_penalty = metrics.get("silent_critical_ratio", 0.0) * 50.0
        weekend_penalty = 25.0 if metrics.get("weekend_blackout", False) else 0.0
        mcs = max(10.0, min(100.0, (telemetry_ratio * 100.0) - silent_critical_penalty - weekend_penalty))

        # Component 4: Execution Gaps Penalty
        critical_findings_count = sum(1 for f in findings if f.severity == "Critical")
        high_findings_count = sum(1 for f in findings if f.severity == "High")
        findings_penalty = min(60.0, (critical_findings_count * 15.0) + (high_findings_count * 7.0))

        # 5. Cyber Resilience Score (CRS)
        crs = max(5.0, min(100.0, (0.35 * iqs) + (0.35 * ees) + (0.30 * mcs) - (findings_penalty * 0.4)))

        # 6. Supervisory Attention Index (SAI)
        # SAI is high when resilience is low, findings are critical, or KPI gaming is detected
        kpi_gaming_boost = 25.0 if metrics.get("kpi_gaming_detected", False) else 0.0
        anomaly_boost = (metrics.get("anomaly_score", 50.0) / 100.0) * 20.0
        sai = max(5.0, min(100.0, (100.0 - crs) * 0.65 + (critical_findings_count * 12.0) + kpi_gaming_boost + anomaly_boost))

        # Overall Risk Rating
        if sai >= 75.0 or crs < 40.0:
            rating = "Critical"
        elif sai >= 55.0 or crs < 60.0:
            rating = "High"
        elif sai >= 35.0:
            rating = "Medium"
        else:
            rating = "Low"

        risk_factors = {
            "critical_findings_count": critical_findings_count,
            "high_findings_count": high_findings_count,
            "investigation_quality_score": round(iqs, 1),
            "escalation_effectiveness_score": round(ees, 1),
            "monitoring_coverage_score": round(mcs, 1),
            "kpi_gaming_penalty": kpi_gaming_boost,
            "silent_critical_penalty": silent_critical_penalty
        }

        return RiskScore(
            entity_id=entity_id,
            cyber_resilience_score=round(crs, 1),
            supervisory_attention_index=round(sai, 1),
            investigation_quality_score=round(iqs, 1),
            escalation_effectiveness_score=round(ees, 1),
            monitoring_coverage_score=round(mcs, 1),
            overall_risk_rating=rating,
            risk_factors=risk_factors,
            calculated_at=datetime.utcnow()
        )
