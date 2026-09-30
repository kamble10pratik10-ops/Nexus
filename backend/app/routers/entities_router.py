from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.database import get_db
from app.models import Entity, Asset, Alert, Case, Escalation, Response, Finding
from app.schemas import EntityOut

router = APIRouter(prefix="/entities", tags=["Entity Assessment"])

@router.get("", response_model=List[EntityOut])
def get_entities(db: Session = Depends(get_db)):
    """Lists all Critical Sector Entities with high-level supervisory metrics."""
    entities = db.query(Entity).all()
    result = []
    for ent in entities:
        findings = db.query(Finding).filter(Finding.entity_id == ent.id).all()
        f_count = len(findings)
        p1_count = sum(1 for f in findings if f.priority == "P1")
        
        if p1_count >= 2 or (ent.criticality == "CRITICAL" and f_count >= 3):
            attention = "CRITICAL"
        elif p1_count == 1 or f_count >= 2:
            attention = "ELEVATED"
        else:
            attention = "ROUTINE"

        result.append(EntityOut(
            id=ent.id,
            name=ent.name,
            sector=ent.sector,
            size_band=ent.size_band,
            criticality=ent.criticality,
            observation_start=ent.observation_start,
            observation_end=ent.observation_end,
            finding_count=f_count,
            p1_count=p1_count,
            attention_level=attention
        ))
    return result

@router.get("/{entity_id}")
def get_entity_detail(entity_id: str, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Section 13: Entity Detail Overview, Evidence Counts & 4-Question Findings List"""
    ent = db.query(Entity).filter(Entity.id == entity_id).first()
    if not ent:
        raise HTTPException(status_code=404, detail="Entity not found")

    # Counts
    alerts_count = db.query(Alert).filter(Alert.entity_id == ent.id).count()
    cases = db.query(Case).filter(Case.entity_id == ent.id).all()
    case_ids = [c.id for c in cases]
    
    escalations_count = db.query(Escalation).filter(Escalation.case_id.in_(case_ids)).count() if case_ids else 0
    responses_count = db.query(Response).filter(Response.case_id.in_(case_ids)).count() if case_ids else 0
    
    assets = db.query(Asset).filter(Asset.entity_id == ent.id).all()
    total_assets = len(assets)
    active_monitored = sum(1 for a in assets if a.monitoring_status == "ACTIVE")
    monitoring_coverage = round((active_monitored / max(1, total_assets)) * 100, 1)

    # Findings with 4 explainability questions
    findings = db.query(Finding).filter(Finding.entity_id == ent.id).all()
    findings_dossiers = []
    for f in findings:
        findings_dossiers.append({
            "id": f.id,
            "title": f.title,
            "finding_type": f.finding_type,
            "severity": f.severity,
            "priority": f.priority,
            "confidence": f.confidence,
            
            # The 4 Mandated Explainability Questions:
            "q1_what_detected": f.title,
            "q2_why_detected": f.explanation,
            "q3_what_evidence": f.evidence,
            "q4_what_to_review": f.supervisory_action,

            # Workflows
            "expected_workflow": f.expected_workflow or ["ALERT", "INVESTIGATION", "ESCALATION", "RESPONSE"],
            "observed_workflow": f.observed_workflow or ["ALERT", "INCOMPLETE_CHAIN"],
            "missing_evidence": f.missing_evidence or [],
            "reviewed": f.reviewed,
            "review_decision": f.review_decision
        })

    # Sort P1 first
    findings_dossiers.sort(key=lambda x: (0 if x["priority"] == "P1" else (1 if x["priority"] == "P2" else 2)))

    return {
        "entity": {
            "id": ent.id,
            "name": ent.name,
            "sector": ent.sector,
            "size_band": ent.size_band,
            "criticality": ent.criticality,
            "observation_start": ent.observation_start.isoformat() if ent.observation_start else None,
            "observation_end": ent.observation_end.isoformat() if ent.observation_end else None
        },
        "evidence_counts": {
            "alerts": alerts_count,
            "cases": len(cases),
            "escalations": escalations_count,
            "responses": responses_count,
            "total_assets": total_assets,
            "monitoring_coverage_pct": monitoring_coverage
        },
        "findings": findings_dossiers
    }
