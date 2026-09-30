import hashlib
import json
from datetime import datetime
from typing import Dict, Any

class ExplainabilityLedger:
    @staticmethod
    def compute_sha256(data: Any) -> str:
        if isinstance(data, dict) or isinstance(data, list):
            serialized = json.dumps(data, sort_keys=True, default=str)
        else:
            serialized = str(data)
        return hashlib.sha256(serialized.encode("utf-8")).hexdigest()

    @staticmethod
    def generate_finding_hash(entity_id: str, rule_id: str, evidence: Dict[str, Any], timestamp: datetime) -> str:
        payload = {
            "entity_id": entity_id,
            "rule_id": rule_id,
            "evidence": evidence,
            "timestamp": timestamp.isoformat() if isinstance(timestamp, datetime) else str(timestamp)
        }
        return ExplainabilityLedger.compute_sha256(payload)

    @staticmethod
    def format_explainability(
        rule_meta: Dict[str, Any],
        entity_name: str,
        evidence: Dict[str, Any]
    ) -> Dict[str, Any]:
        return {
            "why_flagged": f"Entity '{entity_name}' triggered rule {rule_meta.get('rule_id')} ({rule_meta.get('name')}).",
            "rule_triggered": rule_meta.get("rule_id"),
            "rule_name": rule_meta.get("name"),
            "domain": rule_meta.get("domain"),
            "supervisory_rationale": rule_meta.get("rationale"),
            "supporting_evidence": evidence,
            "recommended_supervisory_action": rule_meta.get("recommended_action")
        }
