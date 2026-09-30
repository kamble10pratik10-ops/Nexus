from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import AnomalyScore, Entity

router = APIRouter(prefix="/anomalies", tags=["Module 5: Anomaly Detection"])

@router.get("")
def list_anomaly_scores(
    outliers_only: bool = Query(False),
    db: Session = Depends(get_db)
):
    query = db.query(AnomalyScore, Entity).join(Entity, AnomalyScore.entity_id == Entity.entity_id)
    if outliers_only:
        query = query.filter(AnomalyScore.is_outlier == True)

    results = []
    for score, entity in query.order_by(AnomalyScore.score.desc()).all():
        results.append({
            "entity_id": score.entity_id,
            "entity_name": entity.name,
            "sector": entity.sector,
            "criticality": entity.criticality,
            "anomaly_score": score.score,
            "is_outlier": score.is_outlier,
            "contamination_threshold": score.contamination,
            "outlier_dimensions": score.outlier_dimensions or [],
            "feature_vector": score.feature_vector or {},
            "detected_at": score.detected_at
        })

    return results
