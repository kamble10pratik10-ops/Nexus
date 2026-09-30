from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any
from app.database import get_db
from app.models import Entity, Finding, RiskScore
from app.schemas import AIChatRequest, AIChatResponse
from app.local_ai.assistant import LocalSupervisoryAI

router = APIRouter(prefix="/ai", tags=["Module 7: AI Supervisory Assistant"])

@router.post("/chat", response_model=AIChatResponse)
def chat_with_supervisory_ai(
    req: AIChatRequest,
    db: Session = Depends(get_db)
):
    if req.finding_id:
        f = db.query(Finding).filter(Finding.finding_id == req.finding_id).first()
        if f:
            ent = db.query(Entity).filter(Entity.entity_id == f.entity_id).first()
            return LocalSupervisoryAI.explain_finding(f, ent)

    if req.entity_id:
        ent = db.query(Entity).filter(Entity.entity_id == req.entity_id).first()
        if ent:
            findings = db.query(Finding).filter(Finding.entity_id == ent.entity_id).all()
            if "draft" in req.prompt.lower() or "observation" in req.prompt.lower() or "memo" in req.prompt.lower():
                return LocalSupervisoryAI.draft_supervisory_observation(ent, ent.risk_score, findings)
            return LocalSupervisoryAI.explain_risk_score(ent.risk_score, ent, findings)

    # General supervisory query
    entities = db.query(Entity).all()
    findings = db.query(Finding).all()
    return LocalSupervisoryAI.general_query(req.prompt, entities, findings)

@router.post("/draft-observation/{entity_id}")
def draft_observation_memo(
    entity_id: str,
    db: Session = Depends(get_db)
):
    ent = db.query(Entity).filter(Entity.entity_id == entity_id).first()
    if not ent:
        raise HTTPException(status_code=404, detail="Entity not found")
    findings = db.query(Finding).filter(Finding.entity_id == entity_id).all()
    return LocalSupervisoryAI.draft_supervisory_observation(ent, ent.risk_score, findings)
