from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import AuditLog
from app.schemas import AuditLogOut

router = APIRouter(prefix="/audit", tags=["Module 10: Cryptographic Audit Ledger"])

@router.get("/logs", response_model=List[AuditLogOut])
def get_audit_trail(limit: int = 50, db: Session = Depends(get_db)):
    return db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(limit).all()

@router.get("/verify")
def verify_audit_chain_integrity(db: Session = Depends(get_db)):
    """
    Verifies unbroken cryptographic SHA-256 hash linkage of the audit ledger
    """
    logs = db.query(AuditLog).order_by(AuditLog.id.asc()).all()
    if not logs:
        return {"status": "VALID", "verified_blocks": 0, "ledger_intact": True}

    is_intact = True
    errors = []

    for i in range(1, len(logs)):
        if logs[i].prev_hash != logs[i-1].current_hash:
            is_intact = False
            errors.append(f"Broken hash link between log block {logs[i-1].log_id} and {logs[i].log_id}")

    return {
        "status": "VALID" if is_intact else "CORRUPTED",
        "verified_blocks": len(logs),
        "ledger_intact": is_intact,
        "genesis_hash": logs[0].prev_hash if logs else None,
        "latest_block_hash": logs[-1].current_hash if logs else None,
        "integrity_errors": errors
    }
