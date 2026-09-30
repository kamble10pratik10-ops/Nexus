from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Dict, Any, List
from app.database import get_db
from app.models import Entity, Finding, RiskScore, Alert, Investigation, Escalation, Asset
from app.auth import get_current_user, User
from app.analytics.engine import MasterSupervisoryAnalytics

router = APIRouter(prefix="", tags=["Module 6 & 8: Risk Engine & Supervisory Dashboard"])

@router.get("/dashboard/summary")
def get_supervisory_summary(db: Session = Depends(get_db)):
    total_entities = db.query(Entity).count()
    critical_findings = db.query(Finding).filter(Finding.severity == "Critical").count()
    high_findings = db.query(Finding).filter(Finding.severity == "High").count()
    total_findings = db.query(Finding).count()

    eg_findings = db.query(Finding).filter(Finding.module.in_(["Execution Gap", "KPI Gaming"])).count()
    ns_findings = db.query(Finding).filter(Finding.module == "Negative Space").count()

    high_risk_entities = db.query(RiskScore).filter(RiskScore.overall_risk_rating.in_(["Critical", "High"])).count()
    
    avg_resilience = db.query(func.avg(RiskScore.cyber_resilience_score)).scalar() or 70.0
    avg_attention = db.query(func.avg(RiskScore.supervisory_attention_index)).scalar() or 30.0

    total_alerts = db.query(Alert).count()
    total_cases = db.query(Investigation).count()
    total_escalations = db.query(Escalation).count()
    total_assets = db.query(Asset).count()

    return {
        "total_entities": total_entities,
        "high_risk_entities": high_risk_entities,
        "critical_findings": critical_findings,
        "high_findings": high_findings,
        "total_findings": total_findings,
        "execution_gap_findings": eg_findings,
        "negative_space_findings": ns_findings,
        "average_resilience_score": round(float(avg_resilience), 1),
        "average_attention_index": round(float(avg_attention), 1),
        "analytics_confidence_score": 92.5,
        "stats": {
            "total_alerts": total_alerts,
            "total_cases": total_cases,
            "total_escalations": total_escalations,
            "total_assets": total_assets
        }
    }

@router.get("/dashboard/heatmap")
def get_risk_heatmap(db: Session = Depends(get_db)):
    """
    Returns Sector vs Risk Dimension matrix for national command center heatmap
    """
    sectors = ["Power", "Banking", "Telecom", "Civil Aviation", "Defence", "Nuclear", "Transport"]
    heatmap_data = []

    for sec in sectors:
        entities = db.query(Entity).filter(Entity.sector == sec).all()
        if not entities:
            continue

        ent_ids = [e.entity_id for e in entities]
        avg_res = db.query(func.avg(RiskScore.cyber_resilience_score)).filter(RiskScore.entity_id.in_(ent_ids)).scalar() or 70.0
        avg_att = db.query(func.avg(RiskScore.supervisory_attention_index)).filter(RiskScore.entity_id.in_(ent_ids)).scalar() or 30.0
        crit_count = db.query(Finding).filter(Finding.entity_id.in_(ent_ids), Finding.severity == "Critical").count()
        eg_count = db.query(Finding).filter(Finding.entity_id.in_(ent_ids), Finding.module.in_(["Execution Gap", "KPI Gaming"])).count()
        ns_count = db.query(Finding).filter(Finding.entity_id.in_(ent_ids), Finding.module == "Negative Space").count()

        heatmap_data.append({
            "sector": sec,
            "entities_count": len(entities),
            "cyber_resilience": round(float(avg_res), 1),
            "supervisory_attention": round(float(avg_att), 1),
            "critical_findings": crit_count,
            "execution_gaps": eg_count,
            "negative_space_blindspots": ns_count
        })

    return heatmap_data

@router.post("/analytics/re-run")
def trigger_rerun_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = MasterSupervisoryAnalytics.run_full_assessment(db, trigger_user=current_user.username)
    return result
