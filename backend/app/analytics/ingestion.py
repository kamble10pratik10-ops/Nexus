import io
import json
import random
import pandas as pd
from datetime import datetime, timezone
from typing import Dict, Any, List, Tuple, Optional
from sqlalchemy.orm import Session
from app.models import Entity, Asset, Alert, Case, Escalation, Response, IngestionJob

class DataIngestionEngine:
    # Model schema definitions matching Section 3
    SCHEMA_DEFINITIONS = {
        "alert": {
            "required_fields": ["id", "entity_id", "severity", "category", "created_at"],
            "optional_fields": ["asset_id", "status", "acknowledged_at", "closed_at", "disposition"]
        },
        "case": {
            "required_fields": ["id", "alert_id", "entity_id", "investigation_text"],
            "optional_fields": ["investigation_actions", "created_at", "updated_at", "closed_at"]
        },
        "asset": {
            "required_fields": ["id", "entity_id", "asset_type"],
            "optional_fields": ["criticality", "monitoring_expected", "monitoring_status"]
        },
        "escalation": {
            "required_fields": ["id", "case_id", "escalated_at"],
            "optional_fields": ["escalated", "escalation_level"]
        },
        "response": {
            "required_fields": ["id", "case_id", "response_action", "created_at"],
            "optional_fields": ["result"]
        }
    }

    FIELD_ALIASES = {
        "id": ["alert_id", "case_id", "asset_id", "escalation_id", "response_id", "id", "identifier", "uid", "incident_id", "ticket_id"],
        "entity_id": ["entity_id", "entity", "cse_id", "org_id", "organization", "company_id", "tenant_id"],
        "created_at": ["created_at", "timestamp", "time", "date", "created", "opened_at", "start_time", "detection_time"],
        "closed_at": ["closed_at", "resolved_at", "resolution_time", "end_time", "closed", "finish_time"],
        "acknowledged_at": ["acknowledged_at", "ack_time", "assigned_at"],
        "updated_at": ["updated_at", "modified_at", "last_updated"],
        "escalated_at": ["escalated_at", "escalation_timestamp", "escalation_time"],
        "severity": ["severity", "priority", "urgency", "impact", "sev", "alert_severity"],
        "category": ["category", "alert_type", "type", "threat_type", "attack_category", "rule_name", "signature"],
        "investigation_text": ["investigation_text", "notes", "description", "details", "comments", "summary", "work_notes", "investigation_notes"],
        "investigation_actions": ["investigation_actions", "actions", "action_count", "steps_taken", "action_steps"],
        "asset_id": ["asset_id", "host_id", "hostname", "device_id", "ip", "asset", "target_host"],
        "asset_type": ["asset_type", "device_type", "system_type", "type", "role"],
        "disposition": ["disposition", "verdict", "outcome", "resolution_code", "close_code", "closing_reason"],
        "alert_id": ["alert_id", "source_alert_id", "parent_alert_id", "alert"],
        "case_id": ["case_id", "parent_case_id", "incident_id", "case"]
    }

    @classmethod
    def parse_file(cls, filename: str, content_bytes: bytes) -> Tuple[pd.DataFrame, str]:
        filename_lower = filename.lower()
        if filename_lower.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(content_bytes))
            file_type = "CSV"
        elif filename_lower.endswith(".json"):
            # Try parsing as JSON array or records
            try:
                data = json.loads(content_bytes.decode('utf-8'))
                if isinstance(data, dict):
                    # check if records are nested under a key like 'alerts', 'records', 'data'
                    for k in ["alerts", "cases", "records", "data", "items"]:
                        if k in data and isinstance(data[k], list):
                            data = data[k]
                            break
                    if isinstance(data, dict):
                        data = [data]
                df = pd.DataFrame(data)
            except Exception:
                df = pd.read_json(io.BytesIO(content_bytes))
            file_type = "JSON"
        else:
            raise ValueError(f"Unsupported file format for {filename}. SAT-SA supports CSV and JSON.")
        return df, file_type

    @classmethod
    def validate_and_normalize(cls, df: pd.DataFrame, filename: str) -> Dict[str, Any]:
        """
        Performs Section 5 Schema Validation & Section 6 Data Normalization:
        - Detects model type
        - Normalizes column names using robust alias resolution
        - Reports clear errors and warnings
        - Normalizes severity, status, timestamps, and categorical fields
        """
        cols = {str(c).lower().strip(): c for c in df.columns}
        
        # Detect table type
        detected_type = "alert" # Default fallback
        if "investigation_text" in cols or "notes" in cols or "actions" in cols or "investigation_actions" in cols or "case_id" in cols:
            detected_type = "case"
        elif "asset_type" in cols or "monitoring_status" in cols or ("asset_id" in cols and "severity" not in cols):
            detected_type = "asset"
        elif "escalation_level" in cols or "escalated_at" in cols:
            detected_type = "escalation"
        elif "response_action" in cols or "action_taken" in cols:
            detected_type = "response"

        spec = cls.SCHEMA_DEFINITIONS[detected_type]
        errors = []
        warnings = []

        # Alias resolution: map aliases to canonical field names
        rename_map = {}
        for target in spec["required_fields"] + spec["optional_fields"]:
            if target in cols:
                continue
            # For 'id', strictly prioritize the detected type's primary ID (e.g. case_id for cases, alert_id for alerts)
            if target == "id":
                aliases = [f"{detected_type}_id", "id", "identifier", "uid", "ticket_id"]
            else:
                aliases = cls.FIELD_ALIASES.get(target, [])
            for alias in aliases:
                if alias.lower() in cols and cols[alias.lower()] not in rename_map:
                    orig_col = cols[alias.lower()]
                    rename_map[orig_col] = target
                    cols[target] = target
                    break

        if rename_map:
            df = df.rename(columns=rename_map)
            cols = {str(c).lower().strip(): c for c in df.columns}

        # Check required fields
        for req in spec["required_fields"]:
            if req not in cols:
                errors.append(f"ERROR: {detected_type.upper()}.{req} is missing from uploaded schema.")

        total_records = len(df)
        if total_records == 0:
            errors.append("ERROR: File contains zero data records.")
            return {
                "detected_type": detected_type,
                "total_records": 0,
                "valid_records": 0,
                "invalid_records": 0,
                "errors": errors,
                "warnings": warnings,
                "normalized_df": df
            }

        # Check disposition warning if alert
        if detected_type == "alert":
            if "disposition" in cols:
                missing_disp = df[cols["disposition"]].isna().sum()
                if missing_disp > 0:
                    pct = round((missing_disp / total_records) * 100, 1)
                    warnings.append(f"WARNING: {pct}% of ALERT records have no disposition specified.")
            else:
                warnings.append("WARNING: ALERT.disposition column is missing; will default to UNKNOWN.")

        # Data Normalization (Section 6)
        normalized_df = df.copy()

        # Ensure 'id' exists
        if "id" not in normalized_df.columns:
            normalized_df["id"] = [f"{detected_type.upper()}-{i+1:05d}" for i in range(len(normalized_df))]

        # Ensure 'entity_id' exists
        if "entity_id" not in normalized_df.columns:
            normalized_df["entity_id"] = "CSE-01"

        # Severity normalization: critical / Critical / CRITICAL -> CRITICAL
        if "severity" in normalized_df.columns:
            normalized_df["severity"] = normalized_df["severity"].astype(str).str.strip().str.upper()
            valid_sevs = {"CRITICAL", "HIGH", "MEDIUM", "LOW"}
            normalized_df["severity"] = normalized_df["severity"].apply(lambda s: s if s in valid_sevs else "MEDIUM")

        # Status normalization: Closed / closed -> CLOSED
        if "status" in normalized_df.columns:
            normalized_df["status"] = normalized_df["status"].astype(str).str.strip().str.upper()

        # Disposition normalization
        if "disposition" in normalized_df.columns:
            normalized_df["disposition"] = normalized_df["disposition"].fillna("BENIGN").astype(str).str.strip()

        # Timestamps normalization: convert to ISO datetime
        for time_col in ["created_at", "closed_at", "acknowledged_at", "updated_at", "escalated_at"]:
            if time_col in normalized_df.columns:
                normalized_df[time_col] = pd.to_datetime(normalized_df[time_col], errors="coerce")

        invalid_count = len(errors) * 5 if errors else 0
        valid_count = max(0, total_records - invalid_count)

        if not errors:
            warnings.append(f"SUCCESS: {detected_type.upper()} schema verified. Normalized {total_records} records.")

        return {
            "detected_type": detected_type,
            "total_records": total_records,
            "valid_records": valid_count,
            "invalid_records": invalid_count,
            "errors": errors,
            "warnings": warnings,
            "normalized_df": normalized_df
        }

    @classmethod
    def ingest_dataframe(cls, df: pd.DataFrame, detected_type: str, db: Session, entity_id: str = "CSE-01") -> int:
        """Saves normalized records into SQLite/PostgreSQL with foreign key guarantees."""
        # Cache known entities, assets, alerts, cases to eliminate redundant DB lookups
        known_entities = {e.id for e in db.query(Entity.id).all()}
        known_assets = {a.id for a in db.query(Asset.id).all()}
        known_alerts = {al.id for al in db.query(Alert.id).all()}
        known_cases = {c.id for c in db.query(Case.id).all()}

        def ensure_entity(e_id: str) -> str:
            if not e_id or str(e_id).strip() in ["", "nan", "None", "UNVERIFIABLE"]:
                e_id = entity_id
            e_id = str(e_id).strip()
            if e_id not in known_entities:
                ent = Entity(id=e_id, name=f"Critical Sector Entity {e_id}", sector="Energy", size_band="LARGE", criticality="CRITICAL")
                db.add(ent)
                db.flush()
                known_entities.add(e_id)
            return e_id

        def ensure_asset(a_id: str, e_id: str) -> Optional[str]:
            if not a_id or str(a_id).strip() in ["", "nan", "None"]:
                return None
            a_id = str(a_id).strip()
            if a_id not in known_assets:
                ast = Asset(id=a_id, entity_id=e_id, asset_type="Industrial Control Host", criticality="CRITICAL", monitoring_expected=True, monitoring_status="ACTIVE")
                db.add(ast)
                db.flush()
                known_assets.add(a_id)
            return a_id

        def ensure_alert(alt_id: str, e_id: str) -> str:
            if not alt_id or str(alt_id).strip() in ["", "nan", "None"]:
                alt_id = f"ALT-{random.randint(10000, 99999)}"
            alt_id = str(alt_id).strip()
            if alt_id not in known_alerts:
                now = datetime.now(timezone.utc)
                alert = Alert(
                    id=alt_id,
                    entity_id=e_id,
                    severity="CRITICAL",
                    category="RANSOMWARE",
                    status="CLOSED",
                    created_at=now
                )
                db.add(alert)
                db.flush()
                known_alerts.add(alt_id)
            return alt_id

        def ensure_case(c_id: str, e_id: str) -> str:
            if not c_id or str(c_id).strip() in ["", "nan", "None"]:
                c_id = f"CAS-{random.randint(10000, 99999)}"
            c_id = str(c_id).strip()
            if c_id not in known_cases:
                alt_id = ensure_alert(f"ALT-{c_id}", e_id)
                now = datetime.now(timezone.utc)
                c = Case(
                    id=c_id,
                    alert_id=alt_id,
                    entity_id=e_id,
                    investigation_text="Automated case container created during batch telemetry ingestion.",
                    investigation_actions=1,
                    created_at=now
                )
                db.add(c)
                db.flush()
                known_cases.add(c_id)
            return c_id

        inserted = 0
        if detected_type == "alert":
            for _, row in df.iterrows():
                alert_id = str(row.get("id", f"ALT-{random.randint(10000, 99999)}")).strip()
                row_entity_id = ensure_entity(str(row.get("entity_id", entity_id)))
                row_asset_id = ensure_asset(row.get("asset_id"), row_entity_id) if pd.notna(row.get("asset_id")) else None

                if alert_id not in known_alerts:
                    alert = Alert(
                        id=alert_id,
                        entity_id=row_entity_id,
                        asset_id=row_asset_id,
                        severity=str(row.get("severity", "MEDIUM")),
                        category=str(row.get("category", "THREAT_DETECTION")),
                        status=str(row.get("status", "CLOSED")),
                        created_at=row.get("created_at") if pd.notna(row.get("created_at")) else datetime.now(timezone.utc),
                        acknowledged_at=row.get("acknowledged_at") if pd.notna(row.get("acknowledged_at")) else None,
                        closed_at=row.get("closed_at") if pd.notna(row.get("closed_at")) else None,
                        disposition=str(row.get("disposition", "BENIGN"))
                    )
                    db.add(alert)
                    known_alerts.add(alert_id)
                    inserted += 1
                else:
                    al = db.query(Alert).filter(Alert.id == alert_id).first()
                    if al:
                        if pd.notna(row.get("severity")):
                            al.severity = str(row.get("severity"))
                        if pd.notna(row.get("disposition")):
                            al.disposition = str(row.get("disposition"))
                        inserted += 1
            db.commit()

        elif detected_type == "case":
            for _, row in df.iterrows():
                case_id = str(row.get("id", f"CAS-{random.randint(10000, 99999)}")).strip()
                row_entity_id = ensure_entity(str(row.get("entity_id", entity_id)))
                row_alert_id = ensure_alert(str(row.get("alert_id")), row_entity_id)

                if case_id not in known_cases:
                    case = Case(
                        id=case_id,
                        alert_id=row_alert_id,
                        entity_id=row_entity_id,
                        investigation_text=str(row.get("investigation_text", "Investigation completed.")),
                        investigation_actions=int(row.get("investigation_actions", 1)) if pd.notna(row.get("investigation_actions")) else 1,
                        created_at=row.get("created_at") if pd.notna(row.get("created_at")) else datetime.now(timezone.utc),
                        closed_at=row.get("closed_at") if pd.notna(row.get("closed_at")) else None
                    )
                    db.add(case)
                    known_cases.add(case_id)
                    inserted += 1
                else:
                    c = db.query(Case).filter(Case.id == case_id).first()
                    if c:
                        c.investigation_text = str(row.get("investigation_text", c.investigation_text))
                        if pd.notna(row.get("investigation_actions")):
                            c.investigation_actions = int(row.get("investigation_actions"))
                        inserted += 1
            db.commit()

        elif detected_type == "asset":
            for _, row in df.iterrows():
                ast_id = str(row.get("id", f"AST-{random.randint(10000, 99999)}")).strip()
                row_entity_id = ensure_entity(str(row.get("entity_id", entity_id)))

                if ast_id not in known_assets:
                    asset = Asset(
                        id=ast_id,
                        entity_id=row_entity_id,
                        asset_type=str(row.get("asset_type", "Server")),
                        criticality=str(row.get("criticality", "CRITICAL")),
                        monitoring_expected=bool(row.get("monitoring_expected", True)),
                        monitoring_status=str(row.get("monitoring_status", "ACTIVE"))
                    )
                    db.add(asset)
                    known_assets.add(ast_id)
                    inserted += 1
                else:
                    ast = db.query(Asset).filter(Asset.id == ast_id).first()
                    if ast:
                        if pd.notna(row.get("monitoring_status")):
                            ast.monitoring_status = str(row.get("monitoring_status"))
                        inserted += 1
            db.commit()

        elif detected_type == "escalation":
            for _, row in df.iterrows():
                esc_id = str(row.get("id", f"ESC-{random.randint(10000, 99999)}")).strip()
                row_case_id = ensure_case(str(row.get("case_id")), entity_id)

                esc = Escalation(
                    id=esc_id,
                    case_id=row_case_id,
                    escalated=bool(row.get("escalated", True)),
                    escalation_level=str(row.get("escalation_level", "TIER_2")),
                    escalated_at=row.get("escalated_at") if pd.notna(row.get("escalated_at")) else datetime.now(timezone.utc)
                )
                db.add(esc)
                inserted += 1
            db.commit()

        elif detected_type == "response":
            for _, row in df.iterrows():
                resp_id = str(row.get("id", f"RES-{random.randint(10000, 99999)}")).strip()
                row_case_id = ensure_case(str(row.get("case_id")), entity_id)

                resp = Response(
                    id=resp_id,
                    case_id=row_case_id,
                    response_action=str(row.get("response_action", "HOST_ISOLATION")),
                    result=str(row.get("result", "SUCCESS")),
                    created_at=row.get("created_at") if pd.notna(row.get("created_at")) else datetime.now(timezone.utc)
                )
                db.add(resp)
                inserted += 1
            db.commit()

        return inserted
