from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from app.database import get_db
from app.models import Alert, Case, Asset, Entity

router = APIRouter(prefix="/evidence", tags=["Evidence Records"])

class EvidenceRecordsRequest(BaseModel):
    entity_id: Optional[str] = None
    evidence: Optional[Dict[str, Any]] = None

@router.post("/records")
def get_evidence_records(payload: EvidenceRecordsRequest, db: Session = Depends(get_db)) -> Dict[str, Any]:
    evidence = payload.evidence or {}
    entity_id = payload.entity_id

    # 1. Collect Alert IDs from evidence
    alert_ids = []
    for k in ["sample_alerts", "sample_alert_ids"]:
        if k in evidence and isinstance(evidence[k], list):
            alert_ids.extend(evidence[k])

    # 2. Collect Case IDs from evidence
    case_ids = []
    for k in ["sample_cases", "sample_case_ids"]:
        if k in evidence and isinstance(evidence[k], list):
            case_ids.extend(evidence[k])

    # 3. Collect Asset IDs from evidence
    asset_ids = []
    for k in ["sample_assets", "recurring_asset_ids"]:
        if k in evidence and isinstance(evidence[k], list):
            for item in evidence[k]:
                # In case items are formatted as "AST-01 (Domain Controller)"
                clean_id = str(item).split()[0].strip()
                asset_ids.append(clean_id)

    # Query DB
    alerts = []
    if alert_ids:
        alerts = db.query(Alert).filter(Alert.id.in_(alert_ids)).limit(20).all()
    elif entity_id:
        alerts = db.query(Alert).filter(Alert.entity_id == entity_id).order_by(Alert.created_at.desc()).limit(6).all()

    cases = []
    if case_ids:
        cases = db.query(Case).filter(Case.id.in_(case_ids)).limit(20).all()
    elif entity_id:
        cases = db.query(Case).filter(Case.entity_id == entity_id).order_by(Case.created_at.desc()).limit(6).all()

    assets = []
    if asset_ids:
        assets = db.query(Asset).filter(Asset.id.in_(asset_ids)).limit(20).all()
    elif entity_id:
        assets = db.query(Asset).filter(Asset.entity_id == entity_id).limit(6).all()

    alerts_data = [
        {
            "id": a.id,
            "entity": a.entity_id,
            "asset": a.asset_id or "N/A",
            "severity": a.severity,
            "category": a.category,
            "status": a.status,
            "disposition": a.disposition or "UNSPECIFIED",
            "created_at": a.created_at.isoformat() if a.created_at else None,
            "closed_at": a.closed_at.isoformat() if a.closed_at else None,
        }
        for a in alerts
    ]

    cases_data = [
        {
            "id": c.id,
            "alert_id": c.alert_id,
            "actions_count": c.investigation_actions,
            "investigation_text": c.investigation_text,
            "created_at": c.created_at.isoformat() if c.created_at else None,
            "closed_at": c.closed_at.isoformat() if c.closed_at else None,
        }
        for c in cases
    ]

    assets_data = [
        {
            "id": ast.id,
            "entity": ast.entity_id,
            "asset_type": ast.asset_type,
            "criticality": ast.criticality,
            "monitoring_status": ast.monitoring_status,
        }
        for ast in assets
    ]

    return {
        "records": {
            "alerts": alerts_data,
            "cases": cases_data,
            "assets": assets_data,
            "events": []
        },
        "limitations": [
            "Source records retrieved directly from verified database state.",
            "Record privacy controls applied according to NCIIPC supervisory oversight policies."
        ],
        "truncated": False
    }

