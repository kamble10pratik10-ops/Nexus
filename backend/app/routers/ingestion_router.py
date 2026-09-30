import os
import random
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from app.database import get_db
from app.models import IngestionJob, Entity
from app.analytics.ingestion import DataIngestionEngine
from app.analytics.engine import MasterSupervisoryAnalytics
from app.data_generator import generate_synthetic_data

router = APIRouter(prefix="/ingestion", tags=["Data Ingestion Hub"])

@router.get("/jobs")
def get_ingestion_jobs(db: Session = Depends(get_db)) -> List[Dict[str, Any]]:
    """Returns the list of processed upload ingestion jobs."""
    jobs = db.query(IngestionJob).order_by(IngestionJob.created_at.desc()).all()
    return [{
        "id": j.id,
        "file_name": j.file_name,
        "entity_id": j.entity_id,
        "file_type": j.file_type,
        "total_records": j.total_records,
        "valid_records": j.valid_records,
        "invalid_records": j.invalid_records,
        "validation_status": j.validation_status,
        "validation_errors": j.validation_errors,
        "validation_warnings": j.validation_warnings,
        "status": j.status,
        "created_at": j.created_at.isoformat() if j.created_at else None
    } for j in jobs]

@router.post("/upload")
async def upload_dataset(
    file: UploadFile = File(...),
    entity_id: str = Form("CSE-01"),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Section 4 & 5: Upload CSV/JSON, detect file type, validate schema, normalize, and store.
    """
    try:
        content = await file.read()
        df, file_type = DataIngestionEngine.parse_file(file.filename, content)
        
        # Schema Validation & Normalization
        val_res = DataIngestionEngine.validate_and_normalize(df, file.filename)
        
        # Save records if valid records exist
        inserted = 0
        if val_res["valid_records"] > 0:
            inserted = DataIngestionEngine.ingest_dataframe(
                val_res["normalized_df"],
                val_res["detected_type"],
                db,
                entity_id=entity_id
            )

        val_status = "ERROR" if val_res["errors"] else ("WARNING" if val_res["warnings"] and len(val_res["warnings"]) > 1 else "SUCCESS")

        job = IngestionJob(
            id=f"JOB-{random.randint(10000, 99999)}",
            file_name=file.filename,
            entity_id=entity_id,
            file_type=file_type,
            total_records=val_res["total_records"],
            valid_records=val_res["valid_records"],
            invalid_records=val_res["invalid_records"],
            validation_status=val_status,
            validation_errors=val_res["errors"],
            validation_warnings=val_res["warnings"],
            normalized=True,
            status="COMPLETED"
        )
        db.add(job)
        db.commit()

        return {
            "job_id": job.id,
            "file": file.filename,
            "entity": entity_id,
            "detected_type": val_res["detected_type"],
            "records": val_res["total_records"],
            "valid_records": val_res["valid_records"],
            "invalid_records": val_res["invalid_records"],
            "validation_status": val_status,
            "errors": val_res["errors"],
            "warnings": val_res["warnings"],
            "inserted_records": inserted,
            "status": "COMPLETED"
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"File processing error: {str(e)}")

@router.post("/run-analysis")
def run_supervisory_analysis(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Section 4: 'Run Analysis' button trigger."""
    result = MasterSupervisoryAnalytics.run_full_assessment(db)
    return result

@router.post("/load-demo")
def load_demo_dataset(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Section 4 & 15: 'Load Demo Dataset' button for SIH demonstration."""
    # 1. Generate the 20 CSE synthetic dataset with planted patterns
    generate_synthetic_data(db)
    
    # 2. Record simulated demo ingestion jobs
    demo_jobs = [
        IngestionJob(
            id="JOB-DEMO-01",
            file_name="nciipc_cse_batch_q3_alerts.csv",
            entity_id="CSE-01",
            file_type="CSV",
            total_records=4500,
            valid_records=4500,
            invalid_records=0,
            validation_status="SUCCESS",
            validation_warnings=["SUCCESS: Schema validation completed. All critical fields verified."],
            normalized=True,
            status="COMPLETED"
        ),
        IngestionJob(
            id="JOB-DEMO-02",
            file_name="telecom_core_investigation_cases.json",
            entity_id="CSE-03",
            file_type="JSON",
            total_records=1800,
            valid_records=1800,
            invalid_records=0,
            validation_status="WARNING",
            validation_warnings=["WARNING: 12% of records lack secondary escalation timestamps."],
            normalized=True,
            status="COMPLETED"
        ),
        IngestionJob(
            id="JOB-DEMO-03",
            file_name="railway_signaling_telemetry_scope.csv",
            entity_id="CSE-07",
            file_type="CSV",
            total_records=500,
            valid_records=500,
            invalid_records=0,
            validation_status="SUCCESS",
            validation_warnings=["SUCCESS: Asset scope parsed and validated against expected evidence schema."],
            normalized=True,
            status="COMPLETED"
        )
    ]
    for j in demo_jobs:
        existing = db.query(IngestionJob).filter(IngestionJob.id == j.id).first()
        if not existing:
            db.add(j)
    db.commit()

    # 3. Automatically run full analysis
    analysis_res = MasterSupervisoryAnalytics.run_full_assessment(db)
    return {
        "status": "Synthetic Demonstration Dataset Loaded Successfully",
        "label": "Synthetic Demonstration Dataset (20 CSEs / SIH Evaluation)",
        "analysis_result": analysis_res
    }
