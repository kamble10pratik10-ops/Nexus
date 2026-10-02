import io
import json
import random
import pandas as pd
from datetime import datetime, timezone
from typing import Dict, Any, List, Tuple
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
        - Reports clear errors and warnings
        - Normalizes severity, status, timestamps, and categorical fields
        """
        # Lowercase column names for flexible detection
        cols = {c.lower(): c for c in df.columns}
        
        # Detect table type
        detected_type = "alert" # Default fallback
        if "investigation_text" in cols or "actions" in str(cols):
            detected_type = "case"
        elif "asset_type" in cols or "monitoring_status" in cols:
            detected_type = "asset"
        elif "escalation_level" in cols or "escalated_at" in cols:
            detected_type = "escalation"
        elif "response_action" in cols or "result" in cols:
            detected_type = "response"

        spec = cls.SCHEMA_DEFINITIONS[detected_type]
        errors = []
        warnings = []

        # Check required fields
        for req in spec["required_fields"]:
            if req not in cols:
                # Check for aliases (e.g. alert_id -> id)
                alias = f"{detected_type}_id"
                if alias in cols:
                    df.rename(columns={cols[alias]: req}, inplace=True)
                    cols[req] = req
                else:
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

        # Rename standard columns to exact model field names
        rename_map = {}
        for target in spec["required_fields"] + spec["optional_fields"]:
            if target in cols and cols[target] != target:
                rename_map[cols[target]] = target
            elif f"{detected_type}_id" in cols:
                rename_map[cols[f"{detected_type}_id"]] = "id"
        if rename_map:
            normalized_df.rename(columns=rename_map, inplace=True)

        # Ensure 'id' exists
        if "id" not in normalized_df.columns:
            normalized_df["id"] = [f"{detected_type.upper()}-{i+1:05d}" for i in range(len(normalized_df))]

        # Ensure 'entity_id' exists
        if "entity_id" not in normalized_df.columns:
            normalized_df["entity_id"] = "UNVERIFIABLE"

        # Severity normalization: critical / Critical / CRITICAL -> CRITICAL
        if "severity" in normalized_df.columns:
            normalized_df["severity"] = normalized_df["severity"].astype(str).str.strip().str.upper()
            valid_sevs = {"CRITICAL", "HIGH", "MEDIUM", "LOW"}
            normalized_df["severity"] = normalized_df["severity"].apply(lambda s: s if s in valid_sevs else "UNVERIFIABLE")

        # Status normalization: Closed / closed -> CLOSED
        if "status" in normalized_df.columns:
            normalized_df["status"] = normalized_df["status"].astype(str).str.strip().str.upper()

        # Disposition normalization
        if "disposition" in normalized_df.columns:
            normalized_df["disposition"] = normalized_df["disposition"].fillna("UNVERIFIABLE").astype(str).str.strip().str.upper()

        # Timestamps normalization: convert to ISO datetime
        for time_col in ["created_at", "closed_at", "acknowledged_at", "updated_at", "escalated_at"]:
            if time_col in normalized_df.columns:
                normalized_df[time_col] = pd.to_datetime(normalized_df[time_col], errors="coerce")

        invalid_count = len(errors) * 5 if errors else 0
        valid_count = max(0, total_records - invalid_count)

        if not errors:
            warnings.append("SUCCESS: Schema validation and data normalization completed.")

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
        """Saves normalized records into SQLite/PostgreSQL."""
        # Ensure entity exists
        ent = db.query(Entity).filter(Entity.id == entity_id).first()
        if not ent:
            ent = Entity(id=entity_id, name=f"Critical Sector Entity {entity_id}", sector="Energy", size_band="LARGE", criticality="CRITICAL")
            db.add(ent)
            db.commit()

        inserted = 0
        if detected_type == "alert":
            for _, row in df.iterrows():
                alert_id = str(row.get("id", f"ALT-{random.randint(10000, 99999)}"))
                if not db.query(Alert).filter(Alert.id == alert_id).first():
                    alert = Alert(
                        id=alert_id,
                        entity_id=str(row.get("entity_id", "UNVERIFIABLE")),
                        asset_id=str(row.get("asset_id")) if pd.notna(row.get("asset_id")) else None,
                        severity=str(row.get("severity", "UNVERIFIABLE")),
                        category=str(row.get("category", "UNVERIFIABLE")),
                        status=str(row.get("status", "UNVERIFIABLE")),
                        created_at=row.get("created_at") if pd.notna(row.get("created_at")) else None,
                        acknowledged_at=row.get("acknowledged_at") if pd.notna(row.get("acknowledged_at")) else None,
                        closed_at=row.get("closed_at") if pd.notna(row.get("closed_at")) else None,
                        disposition=str(row.get("disposition", "UNVERIFIABLE"))
                    )
                    db.add(alert)
                    inserted += 1
            db.commit()

        elif detected_type == "case":
            for _, row in df.iterrows():
                case_id = str(row.get("id", f"CAS-{random.randint(10000, 99999)}"))
                if not db.query(Case).filter(Case.id == case_id).first():
                    case = Case(
                        id=case_id,
                        alert_id=str(row.get("alert_id", "UNVERIFIABLE")),
                        entity_id=str(row.get("entity_id", "UNVERIFIABLE")),
                        investigation_text=str(row.get("investigation_text", "UNVERIFIABLE")),
                        investigation_actions=int(row.get("investigation_actions", 0)) if pd.notna(row.get("investigation_actions")) else 0,
                        created_at=row.get("created_at") if pd.notna(row.get("created_at")) else None,
                        closed_at=row.get("closed_at") if pd.notna(row.get("closed_at")) else None
                    )
                    db.add(case)
                    inserted += 1
            db.commit()

        elif detected_type == "asset":
            for _, row in df.iterrows():
                ast_id = str(row.get("id", f"AST-{random.randint(10000, 99999)}"))
                if not db.query(Asset).filter(Asset.id == ast_id).first():
                    asset = Asset(
                        id=ast_id,
                        entity_id=str(row.get("entity_id", "UNVERIFIABLE")),
                        asset_type=str(row.get("asset_type", "UNVERIFIABLE")),
                        criticality=str(row.get("criticality", "UNVERIFIABLE")),
                        monitoring_expected=bool(row.get("monitoring_expected", False)),
                        monitoring_status=str(row.get("monitoring_status", "UNVERIFIABLE"))
                    )
                    db.add(asset)
                    inserted += 1
            db.commit()

        elif detected_type == "escalation":
            for _, row in df.iterrows():
                esc_id = str(row.get("id", f"ESC-{random.randint(10000, 99999)}"))
                if not db.query(Escalation).filter(Escalation.id == esc_id).first():
                    esc = Escalation(
                        id=esc_id,
                        case_id=str(row.get("case_id", "UNVERIFIABLE")),
                        escalated=bool(row.get("escalated", False)),
                        escalation_level=str(row.get("escalation_level", "UNVERIFIABLE")),
                        escalated_at=row.get("escalated_at") if pd.notna(row.get("escalated_at")) else None
                    )
                    db.add(esc)
                    inserted += 1
            db.commit()

        elif detected_type == "response":
            for _, row in df.iterrows():
                resp_id = str(row.get("id", f"RES-{random.randint(10000, 99999)}"))
                if not db.query(Response).filter(Response.id == resp_id).first():
                    resp = Response(
                        id=resp_id,
                        case_id=str(row.get("case_id", "UNVERIFIABLE")),
                        response_action=str(row.get("response_action", "UNVERIFIABLE")),
                        result=str(row.get("result", "UNVERIFIABLE")),
                        created_at=row.get("created_at") if pd.notna(row.get("created_at")) else None
                    )
                    db.add(resp)
                    inserted += 1
            db.commit()

        return inserted
