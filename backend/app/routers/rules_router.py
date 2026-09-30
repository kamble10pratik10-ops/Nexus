from fastapi import APIRouter, Query
from typing import List, Optional
from app.rules.rule_catalog import SUPERVISORY_RULES

router = APIRouter(prefix="/rules", tags=["Rule Engine (50+ Supervisory Rules)"])

@router.get("")
def get_supervisory_rules(
    domain: Optional[str] = Query(None),
    severity: Optional[str] = Query(None)
):
    rules = SUPERVISORY_RULES
    if domain:
        rules = [r for r in rules if r["domain"].lower() == domain.lower()]
    if severity:
        rules = [r for r in rules if r["severity"].lower() == severity.lower()]
    return {
        "total_rules": len(SUPERVISORY_RULES),
        "filtered_rules_count": len(rules),
        "rules": rules
    }

@router.get("/{rule_id}")
def get_rule_details(rule_id: str):
    for r in SUPERVISORY_RULES:
        if r["rule_id"] == rule_id:
            return r
    return {"error": f"Rule {rule_id} not found in supervisory catalog"}
