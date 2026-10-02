from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from app.database import get_db
from app.models import Finding, Entity
from app.schemas import FindingOut, ReviewActionRequest

router = APIRouter(prefix="/findings", tags=["Findings & Supervisory Evidence"])

@router.get("", response_model=List[FindingOut])
def get_findings(
    entity_id: Optional[str] = None,
    finding_type: Optional[str] = None,
    priority: Optional[str] = None,
    severity: Optional[str] = None,
    reviewed: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Finding)
    if entity_id:
        query = query.filter(Finding.entity_id == entity_id)
    if finding_type:
        query = query.filter(Finding.finding_type == finding_type)
    if priority:
        query = query.filter(Finding.priority == priority)
    if severity:
        query = query.filter(Finding.severity == severity)
    if reviewed is not None:
        query = query.filter(Finding.reviewed == reviewed)

    # Sort P1 first, then P2, then P3, then confidence descending
    findings = query.all()
    priority_order = {"P1": 0, "P2": 1, "P3": 2}
    findings.sort(key=lambda f: (priority_order.get(f.priority, 3), -f.confidence))
    return findings

@router.get("/adaptive-sampling")
def get_adaptive_sampling(db: Session = Depends(get_db)) -> Dict[str, Any]:
    return {"sampled_cases": []}

@router.get("/{finding_id}")
def get_finding_detail(finding_id: str, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Section 14: Explainable Finding Detail Panel"""
    finding = db.query(Finding).filter(Finding.id == finding_id).first()
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")

    entity = db.query(Entity).filter(Entity.id == finding.entity_id).first()

    return {
        "id": finding.id,
        "title": finding.title,
        "entity_id": finding.entity_id,
        "entity_name": entity.name if entity else finding.entity_id,
        "sector": entity.sector if entity else "Critical Infrastructure",
        "finding_type": finding.finding_type,
        "rule_id": finding.rule_id,
        "severity": finding.severity,
        "priority": finding.priority,
        "confidence": finding.confidence,
        "confidence_pct": int(finding.confidence * 100),
        
        # Section 14 Explainability Elements
        "why_flagged": finding.explanation,
        "supporting_evidence": finding.evidence,
        "expected_workflow": finding.expected_workflow or ["ALERT", "INVESTIGATION", "ESCALATION", "RESPONSE"],
        "observed_workflow": finding.observed_workflow or ["ALERT", "INCOMPLETE_CHAIN"],
        "missing_evidence": finding.missing_evidence or ["EXPECTED_SUPERVISORY_ARTIFACTS"],
        "supervisory_action": finding.supervisory_action or "Conduct manual audit on highlighted records.",

        # Review Status
        "reviewed": finding.reviewed,
        "review_decision": finding.review_decision,
        "review_notes": finding.review_notes,
        "created_at": finding.created_at.isoformat() if finding.created_at else None
    }

@router.post("/{finding_id}/review")
def record_finding_review(
    finding_id: str,
    review: ReviewActionRequest,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Records supervisor manual review decision on finding."""
    finding = db.query(Finding).filter(Finding.id == finding_id).first()
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")

    finding.reviewed = True
    finding.review_decision = review.decision
    finding.review_notes = review.notes
    db.commit()

    return {
        "status": "Review recorded successfully",
        "finding_id": finding.id,
        "decision": finding.review_decision,
        "notes": finding.review_notes
    }
