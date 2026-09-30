from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse, HTMLResponse
from sqlalchemy.orm import Session
from datetime import datetime
import os
from typing import List, Optional
from app.database import get_db
from app.models import Report, Entity, Finding, RiskScore
from app.schemas import ReportOut, ReportCreate
from app.auth import get_current_user, User
from app.reports.generator import SupervisoryReportGenerator
from app.config import settings

router = APIRouter(prefix="/reports", tags=["Reports & Supervisory Exports"])

@router.get("", response_model=List[ReportOut])
def list_reports(db: Session = Depends(get_db)):
    return db.query(Report).order_by(Report.created_at.desc()).all()

@router.post("/generate/{report_type}")
def generate_supervisory_report(
    report_type: str,
    entity_id: Optional[str] = None,
    sector: Optional[str] = None,
    format: str = "pdf",  # pdf, docx, html
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    now = datetime.utcnow()
    report_id = f"REP-{report_type[:3].upper()}-{int(now.timestamp())}"
    
    entity_name = "National CSE Portfolio"
    findings_list = []
    metrics = {}

    if entity_id:
        ent = db.query(Entity).filter(Entity.entity_id == entity_id).first()
        if ent:
            entity_name = ent.name
            sector = ent.sector
            fnds = db.query(Finding).filter(Finding.entity_id == entity_id).all()
            findings_list = [{
                "rule_id": f.rule_id,
                "module": f.module,
                "severity": f.severity,
                "explanation": f.explanation
            } for f in fnds]
            if ent.risk_score:
                metrics = {
                    "cyber_resilience_score": ent.risk_score.cyber_resilience_score,
                    "supervisory_attention_index": ent.risk_score.supervisory_attention_index,
                    "investigation_quality": ent.risk_score.investigation_quality_score,
                    "escalation_effectiveness": ent.risk_score.escalation_effectiveness_score,
                    "overall_risk_rating": ent.risk_score.overall_risk_rating
                }
    else:
        # Portfolio level
        fnds = db.query(Finding).filter(Finding.severity == "Critical").limit(20).all()
        findings_list = [{
            "rule_id": f.rule_id,
            "module": f.module,
            "severity": f.severity,
            "explanation": f.explanation
        } for f in fnds]
        metrics = {"evaluated_entities": db.query(Entity).count(), "critical_findings": len(findings_list)}

    title = f"NCIIPC {report_type.replace('_', ' ').title()} - {entity_name}"
    summary = (
        f"Supervisory audit evaluation conducted for {entity_name} ({sector or 'Multi-Sector'}). "
        f"Evaluated periodically uploaded SOC telemetry, alert dispositions, case-management records, and escalation chains. "
        f"Identified {len(findings_list)} priority non-compliance and execution gap signals requiring supervisory oversight."
    )

    content = {
        "findings": findings_list,
        "metrics": metrics,
        "classification": "CONFIDENTIAL // NCIIPC SUPERVISORY",
        "generated_by": current_user.full_name
    }

    download_url = None
    if format.lower() == "pdf":
        download_url = SupervisoryReportGenerator.generate_pdf(report_id, title, entity_name, summary, content)
    elif format.lower() == "docx":
        download_url = SupervisoryReportGenerator.generate_docx(report_id, title, entity_name, summary, content)
    else:
        download_url = f"/api/reports/preview/{report_id}"

    report_record = Report(
        report_id=report_id,
        entity_id=entity_id,
        sector=sector,
        report_type=report_type,
        title=title,
        summary=summary,
        content=content,
        created_by=current_user.username,
        created_at=now,
        download_url=download_url
    )
    db.add(report_record)
    db.commit()
    db.refresh(report_record)

    return report_record

@router.get("/download/{filename}")
def download_report_file(filename: str):
    filepath = os.path.join(settings.REPORT_DIR, filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Report file not found")
    return FileResponse(filepath, filename=filename)

@router.get("/preview/{report_id}", response_class=HTMLResponse)
def preview_report_html(report_id: str, db: Session = Depends(get_db)):
    rep = db.query(Report).filter(Report.report_id == report_id).first()
    if not rep:
        raise HTTPException(status_code=404, detail="Report not found")
    html = SupervisoryReportGenerator.generate_html_preview(
        rep.report_type,
        rep.title,
        rep.entity_id or "Portfolio",
        rep.summary,
        rep.content
    )
    return html
