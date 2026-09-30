from typing import List, Dict, Any
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from app.models import Entity, Alert, Case, Escalation, Response, Asset, Finding
from app.analytics.execution_gaps import ExecutionGapEngine
from app.analytics.negative_space import NegativeSpaceEngine
from app.analytics.benchmarking import PeerBenchmarkingEngine

def prioritize_finding(severity: str, confidence: float, criticality: str, finding_type: str) -> str:
    """
    Section 11: Finding Prioritization (P1, P2, P3) based on:
    severity, confidence, evidence strength, criticality, peer deviation.
    """
    if severity == "CRITICAL":
        return "P1"
    if criticality == "CRITICAL" and severity == "HIGH" and confidence >= 0.90:
        return "P1"
    if finding_type in ["EXECUTION_GAP", "NEGATIVE_SPACE"] and severity == "HIGH" and confidence >= 0.90:
        return "P1"
    if severity == "HIGH" or confidence >= 0.88:
        return "P2"
    return "P3"

class MasterSupervisoryAnalytics:
    @classmethod
    def run_full_assessment(cls, db: Session) -> Dict[str, Any]:
        """
        Executes complete supervisory analytics pipeline according to MVP workflow:
        1. Execution Gap Detection (Rules 1 - 8)
        2. Negative Space Detection (Items 1 - 7)
        3. Expected Evidence Engine
        4. Peer Benchmarking Engine
        5. Finding Prioritization (P1, P2, P3) & Review Queue Generation
        """
        entities = db.query(Entity).all()
        if not entities:
            return {"status": "No entities registered. Please ingest data or load demo dataset."}

        # Clear existing unreviewed findings before fresh analysis run
        db.query(Finding).filter(Finding.reviewed == False).delete()
        db.commit()

        total_findings = 0
        p1_count = 0
        p2_count = 0
        p3_count = 0

        # Step 1 & 2: Entity-specific Execution Gaps & Negative Space
        for ent in entities:
            # Execution Gaps
            eg_findings = ExecutionGapEngine.evaluate(db, ent.id)
            for f in eg_findings:
                f.priority = prioritize_finding(f.severity, f.confidence, ent.criticality, f.finding_type)
                if f.priority == "P1": p1_count += 1
                elif f.priority == "P2": p2_count += 1
                else: p3_count += 1
                db.add(f)
                total_findings += 1

            # Negative Space
            ns_findings = NegativeSpaceEngine.evaluate(db, ent.id)
            for f in ns_findings:
                f.priority = prioritize_finding(f.severity, f.confidence, ent.criticality, f.finding_type)
                if f.priority == "P1": p1_count += 1
                elif f.priority == "P2": p2_count += 1
                else: p3_count += 1
                db.add(f)
                total_findings += 1

        db.commit()

        # Step 3: Peer Benchmarking (cross-entity comparison)
        peer_findings = PeerBenchmarkingEngine.evaluate_all(db)
        for f in peer_findings:
            ent = db.query(Entity).filter(Entity.id == f.entity_id).first()
            crit = ent.criticality if ent else "HIGH"
            f.priority = prioritize_finding(f.severity, f.confidence, crit, f.finding_type)
            if f.priority == "P1": p1_count += 1
            elif f.priority == "P2": p2_count += 1
            else: p3_count += 1
            db.add(f)
            total_findings += 1

        db.commit()

        return {
            "status": "Analysis completed successfully",
            "entities_assessed": len(entities),
            "total_findings_generated": total_findings,
            "p1_findings": p1_count,
            "p2_findings": p2_count,
            "p3_findings": p3_count,
            "completed_at": datetime.now(timezone.utc).isoformat()
        }
