from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# --- Auth Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    username: str

class UserLogin(BaseModel):
    username: str
    password: str

# --- Entity Schemas ---
class EntityOut(BaseModel):
    id: str
    name: str
    sector: str
    size_band: str
    criticality: str
    observation_start: Optional[datetime] = None
    observation_end: Optional[datetime] = None
    finding_count: Optional[int] = 0
    p1_count: Optional[int] = 0
    attention_level: Optional[str] = "NORMAL"

    class Config:
        from_attributes = True

# --- Asset Schemas ---
class AssetOut(BaseModel):
    id: str
    entity_id: str
    asset_type: str
    criticality: str
    monitoring_expected: bool
    monitoring_status: str

    class Config:
        from_attributes = True

# --- Alert Schemas ---
class AlertOut(BaseModel):
    id: str
    entity_id: str
    asset_id: Optional[str] = None
    severity: str
    category: str
    status: str
    created_at: datetime
    acknowledged_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    disposition: Optional[str] = None

    class Config:
        from_attributes = True

# --- Case Schemas ---
class CaseOut(BaseModel):
    id: str
    alert_id: str
    entity_id: str
    investigation_text: str
    investigation_actions: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# --- Escalation Schemas ---
class EscalationOut(BaseModel):
    id: str
    case_id: str
    escalated: bool
    escalation_level: str
    escalated_at: datetime

    class Config:
        from_attributes = True

# --- Response Schemas ---
class ResponseOut(BaseModel):
    id: str
    case_id: str
    response_action: str
    result: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- Expected Evidence Schemas ---
class ExpectedEvidenceOut(BaseModel):
    id: str
    sector: str
    asset_type: str
    expected_workflow: List[str]
    expected_alert_categories: List[str]
    expected_escalation: bool
    expected_response: bool

    class Config:
        from_attributes = True

# --- Finding Schemas ---
class FindingOut(BaseModel):
    id: str
    entity_id: str
    finding_type: str  # EXECUTION_GAP, NEGATIVE_SPACE, ANOMALY, PEER_DEVIATION
    rule_id: Optional[str] = None
    title: str
    severity: str
    priority: str      # P1, P2, P3
    confidence: float
    explanation: str
    evidence: Dict[str, Any]
    expected_workflow: Optional[List[str]] = None
    observed_workflow: Optional[List[str]] = None
    missing_evidence: Optional[List[str]] = None
    supervisory_action: Optional[str] = None
    reviewed: bool = False
    review_decision: Optional[str] = None
    review_notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ReviewActionRequest(BaseModel):
    finding_id: Optional[str] = None
    decision: str  # CONFIRMED_GAP, NEGATIVE_SPACE_VERIFIED, STATUTORY_INQUIRY, DISMISSED
    notes: Optional[str] = None
    supervisor_badge: Optional[str] = "NCIIPC-SUPV-01"

# --- Ingestion Job Schemas ---
class IngestionJobOut(BaseModel):
    id: str
    file_name: str
    entity_id: Optional[str] = None
    file_type: str
    total_records: int
    valid_records: int
    invalid_records: int
    validation_status: str
    validation_errors: Optional[List[str]] = None
    validation_warnings: Optional[List[str]] = None
    normalized: bool
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- Dashboard Summary Schemas ---
class DashboardSummaryOut(BaseModel):
    cses_assessed: int
    alerts_analyzed: int
    cases_processed: int
    execution_gaps_count: int
    negative_space_count: int
    peer_deviations_count: int
    priority_reviews_count: int
    p1_findings_count: int
    evidence_chain_completeness: float
    analytics_confidence: float
