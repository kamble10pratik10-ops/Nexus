from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, JSON, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base

def utc_now():
    return datetime.now(timezone.utc)

class Entity(Base):
    __tablename__ = "entities"

    # Fields as specified in Section 3:
    # id, name, sector, size_band, criticality, observation_start, observation_end
    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    sector = Column(String(64), index=True, nullable=False)  # Energy, Power Grid, Core Banking, Telecom, Defence, Healthcare, etc.
    size_band = Column(String(32), default="LARGE")          # LARGE, MEDIUM, SMALL
    criticality = Column(String(32), default="CRITICAL")     # CRITICAL, HIGH, MEDIUM, LOW
    observation_start = Column(DateTime, nullable=True)
    observation_end = Column(DateTime, nullable=True)

    # Relationships
    assets = relationship("Asset", back_populates="entity", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="entity", cascade="all, delete-orphan")
    cases = relationship("Case", back_populates="entity", cascade="all, delete-orphan")
    findings = relationship("Finding", back_populates="entity", cascade="all, delete-orphan")


class Asset(Base):
    __tablename__ = "assets"

    # Fields as specified in Section 3:
    # id, entity_id, asset_type, criticality, monitoring_expected, monitoring_status
    id = Column(String(64), primary_key=True, index=True)
    entity_id = Column(String(64), ForeignKey("entities.id"), index=True, nullable=False)
    asset_type = Column(String(64), nullable=False)          # SCADA MTU, SWIFT Gateway, Domain Controller, Database Cluster, Firewall, etc.
    criticality = Column(String(32), default="CRITICAL")     # CRITICAL, HIGH, MEDIUM, LOW
    monitoring_expected = Column(Boolean, default=True)
    monitoring_status = Column(String(32), default="ACTIVE") # ACTIVE, SILENT, MISSING_TELEMETRY, UNCONFIGURED

    entity = relationship("Entity", back_populates="assets")
    alerts = relationship("Alert", back_populates="asset")


class Alert(Base):
    __tablename__ = "alerts"

    # Fields as specified in Section 3:
    # id, entity_id, asset_id, severity, category, status, created_at, acknowledged_at, closed_at, disposition
    id = Column(String(64), primary_key=True, index=True)
    entity_id = Column(String(64), ForeignKey("entities.id"), index=True, nullable=False)
    asset_id = Column(String(64), ForeignKey("assets.id"), index=True, nullable=True)
    severity = Column(String(32), index=True, nullable=False)  # CRITICAL, HIGH, MEDIUM, LOW
    category = Column(String(64), index=True, nullable=False)  # RANSOMWARE, BRUTE_FORCE, SQL_INJECTION, EXFILTRATION, PRIVILEGE_ESCALATION, C2
    status = Column(String(32), default="CLOSED")              # OPEN, ACKNOWLEDGED, INVESTIGATING, CLOSED
    created_at = Column(DateTime, index=True, nullable=False)
    acknowledged_at = Column(DateTime, nullable=True)
    closed_at = Column(DateTime, nullable=True)
    disposition = Column(String(64), nullable=True)            # TRUE_POSITIVE, FALSE_POSITIVE, BENIGN, ACTION_TAKEN

    entity = relationship("Entity", back_populates="alerts")
    asset = relationship("Asset", back_populates="alerts")
    cases = relationship("Case", back_populates="alert", cascade="all, delete-orphan")


class Case(Base):
    __tablename__ = "cases"

    # Fields as specified in Section 3:
    # id, alert_id, entity_id, investigation_text, investigation_actions, created_at, updated_at, closed_at
    id = Column(String(64), primary_key=True, index=True)
    alert_id = Column(String(64), ForeignKey("alerts.id"), index=True, nullable=False)
    entity_id = Column(String(64), ForeignKey("entities.id"), index=True, nullable=False)
    investigation_text = Column(Text, nullable=False)
    investigation_actions = Column(Integer, default=1)
    created_at = Column(DateTime, index=True, nullable=False)
    updated_at = Column(DateTime, nullable=True)
    closed_at = Column(DateTime, nullable=True)

    entity = relationship("Entity", back_populates="cases")
    alert = relationship("Alert", back_populates="cases")
    escalations = relationship("Escalation", back_populates="case_ref", cascade="all, delete-orphan")
    responses = relationship("Response", back_populates="case_ref", cascade="all, delete-orphan")


class Escalation(Base):
    __tablename__ = "escalations"

    # Fields as specified in Section 3:
    # id, case_id, escalated, escalation_level, escalated_at
    id = Column(String(64), primary_key=True, index=True)
    case_id = Column(String(64), ForeignKey("cases.id"), index=True, nullable=False)
    escalated = Column(Boolean, default=True)
    escalation_level = Column(String(32), default="TIER_2")   # TIER_1, TIER_2, CISO, NCIIPC_STATUTORY
    escalated_at = Column(DateTime, nullable=False)

    case_ref = relationship("Case", back_populates="escalations")


class Response(Base):
    __tablename__ = "responses"

    # Fields as specified in Section 3:
    # id, case_id, response_action, result, created_at
    id = Column(String(64), primary_key=True, index=True)
    case_id = Column(String(64), ForeignKey("cases.id"), index=True, nullable=False)
    response_action = Column(String(255), nullable=False)     # HOST_ISOLATION, IP_BLOCK, PROCESS_TERMINATION, CREDENTIAL_REVOCATION
    result = Column(String(64), default="SUCCESS")            # SUCCESS, FAILED, PARTIAL, PENDING_APPROVAL
    created_at = Column(DateTime, nullable=False)

    case_ref = relationship("Case", back_populates="responses")


class ExpectedEvidence(Base):
    __tablename__ = "expected_evidence"

    # Fields as specified in Section 3:
    # id, sector, asset_type, expected_workflow, expected_alert_categories, expected_escalation, expected_response
    id = Column(String(64), primary_key=True, index=True)
    sector = Column(String(64), index=True, nullable=False)
    asset_type = Column(String(64), index=True, nullable=False)
    expected_workflow = Column(JSON, nullable=False)          # ["ALERT", "INVESTIGATION", "ESCALATION", "RESPONSE"]
    expected_alert_categories = Column(JSON, nullable=False)  # ["RANSOMWARE", "BRUTE_FORCE", "AUTHENTICATION", ...]
    expected_escalation = Column(Boolean, default=True)
    expected_response = Column(Boolean, default=True)


class Finding(Base):
    __tablename__ = "findings"

    # Fields as specified in Section 3:
    # id, entity_id, finding_type, severity, priority, confidence, explanation, evidence, created_at
    # Finding types: EXECUTION_GAP, NEGATIVE_SPACE, ANOMALY, PEER_DEVIATION
    id = Column(String(64), primary_key=True, index=True)
    entity_id = Column(String(64), ForeignKey("entities.id"), index=True, nullable=False)
    finding_type = Column(String(64), index=True, nullable=False) # EXECUTION_GAP, NEGATIVE_SPACE, ANOMALY, PEER_DEVIATION
    rule_id = Column(String(32), nullable=True)                   # RULE_1 to RULE_8, NEG_1 to NEG_7, PEER_1, etc.
    title = Column(String(255), nullable=False)
    severity = Column(String(32), index=True, nullable=False)     # CRITICAL, HIGH, MEDIUM, LOW
    priority = Column(String(32), index=True, nullable=False)     # P1, P2, P3
    confidence = Column(Float, default=0.90)                      # 0.0 to 1.0 (e.g. 0.91)
    explanation = Column(Text, nullable=False)
    evidence = Column(JSON, nullable=False)                       # Detailed supporting alert/case IDs, metrics, timestamps
    expected_workflow = Column(JSON, nullable=True)               # e.g. ["ALERT", "INVESTIGATION", "ESCALATION", "RESPONSE"]
    observed_workflow = Column(JSON, nullable=True)               # e.g. ["ALERT", "CLOSED"]
    missing_evidence = Column(JSON, nullable=True)                # e.g. ["ESCALATION", "RESPONSE"]
    supervisory_action = Column(Text, nullable=True)              # Recommended supervisor action
    reviewed = Column(Boolean, default=False)
    review_decision = Column(String(64), nullable=True)           # APPROVED, FLAGGED_FOR_AUDIT, STATUTORY_NOTICE, DISMISSED
    review_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)

    entity = relationship("Entity", back_populates="findings")


class IngestionJob(Base):
    __tablename__ = "ingestion_jobs"

    id = Column(String(64), primary_key=True, index=True)
    file_name = Column(String(255), nullable=False)
    entity_id = Column(String(64), nullable=True)
    file_type = Column(String(16), nullable=False)               # CSV, JSON
    total_records = Column(Integer, default=0)
    valid_records = Column(Integer, default=0)
    invalid_records = Column(Integer, default=0)
    validation_status = Column(String(32), default="SUCCESS")     # SUCCESS, WARNING, ERROR
    validation_errors = Column(JSON, nullable=True)              # list of error strings
    validation_warnings = Column(JSON, nullable=True)            # list of warning strings
    normalized = Column(Boolean, default=True)
    status = Column(String(32), default="COMPLETED")
    created_at = Column(DateTime, default=utc_now)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(64), unique=True, index=True, nullable=False)
    username = Column(String(64), unique=True, index=True, nullable=False)
    role = Column(String(32), default="Supervisor")              # Supervisor, Analyst, Administrator
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utc_now)
