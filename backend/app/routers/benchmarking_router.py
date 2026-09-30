from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.database import get_db
from app.analytics.benchmarking import PeerBenchmarkingEngine

router = APIRouter(prefix="/benchmarking", tags=["Peer Benchmarking"])

@router.get("/metrics")
def get_benchmarking_metrics(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Section 10: Empirical Peer Benchmarking metrics table across all CSEs."""
    table = PeerBenchmarkingEngine.get_metrics_table(db)
    
    # Calculate overall peer sector averages
    sectors = {}
    for r in table:
        sec = r["sector"]
        if sec not in sectors:
            sectors[sec] = []
        sectors[sec].append(r)

    sector_averages = {}
    for sec, rows in sectors.items():
        sector_averages[sec] = {
            "avg_alert_volume": round(sum(r["alert_volume"] for r in rows) / len(rows), 1),
            "avg_critical_alert_pct": round(sum(r["critical_alert_pct"] for r in rows) / len(rows), 1),
            "avg_investigation_rate": round(sum(r["investigation_rate"] for r in rows) / len(rows), 1),
            "avg_escalation_rate": round(sum(r["escalation_rate"] for r in rows) / len(rows), 1),
            "avg_response_rate": round(sum(r["response_rate"] for r in rows) / len(rows), 1),
            "avg_monitoring_coverage": round(sum(r["monitoring_coverage"] for r in rows) / len(rows), 1),
            "entities_count": len(rows)
        }

    return {
        "entity_metrics": table,
        "sector_averages": sector_averages
    }
