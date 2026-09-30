import time
import requests
import random
import uuid
from datetime import datetime, timedelta


INGEST_URL = "http://localhost:8000/api/ingest/simulation"
REQUEST_TIMEOUT = (3.05, 10)  # connect timeout, read timeout
BASE_INTERVAL_SECONDS = 5
MAX_503_BACKOFF_SECONDS = 60


def create_http_session():
    """Create one bounded connection pool with automatic retries disabled."""
    session = requests.Session()
    adapter = requests.adapters.HTTPAdapter(
        pool_connections=1,
        pool_maxsize=1,
        max_retries=0,
        pool_block=True,
    )
    session.mount("http://", adapter)
    session.mount("https://", adapter)
    return session

def generate_payload():
    sim_id = str(random.randint(10000, 99999))
    alert_id = f"ALT-SIM-{sim_id}"
    case_id = f"CAS-SIM-{sim_id}"
    
    # Pick random attributes
    entities = ["ENT-001", "ENT-002", "ENT-003", "ENT-004"]
    assets = ["AST-ENT-001-01", "AST-ENT-002-02", "AST-ENT-003-01"]
    severities = ["Medium", "High", "Critical"]
    categories = ["Malware (T1059)", "Brute Force Authentication (T1110)", "Data Exfiltration"]
    
    entity = random.choice(entities)
    asset = random.choice(assets)
    severity = random.choice(severities)
    category = random.choice(categories)
    
    # Sometimes trigger a fast closure anomaly
    is_anomaly = random.random() < 0.3
    
    created_at = datetime.utcnow()
    
    if is_anomaly and severity in ["High", "Critical"]:
        # Close in 15 seconds with no escalation
        closed_at = created_at + timedelta(seconds=15)
        actions = 1
        escalated = False
        notes = "Closed as benign. No issues found."
        disposition = "False Positive"
        analyst = "Analyst_A"
        print(f"[*] Generating FAST CLOSURE anomaly for {alert_id}")
    else:
        # Normal closure
        closed_at = created_at + timedelta(minutes=random.randint(15, 120))
        actions = random.randint(3, 8)
        escalated = True if severity == "Critical" and random.random() > 0.5 else False
        notes = f"Investigated {category}. Checked logs. Verified with user. Resolution applied."
        disposition = "True Positive" if escalated else "False Positive"
        analyst = f"Analyst_{random.choice(['B', 'C', 'D'])}"
        print(f"[+] Generating normal closure for {alert_id}")

    return {
        "alert_id": alert_id,
        "entity_id": entity,
        "asset_id": asset,
        "severity": severity,
        "category": category,
        "created_at": created_at.isoformat(),
        "closed_at": closed_at.isoformat(),
        "disposition": disposition,
        "closed_by": analyst,
        "case_id": case_id,
        "investigation_text": notes,
        "investigation_actions": actions,
        "escalated": escalated
    }

if __name__ == "__main__":
    print("Starting NEXUS Live Simulator...")
    print("Sending a new mock event every 5 seconds. Press Ctrl+C to stop.")

    consecutive_503s = 0
    with create_http_session() as session:
        while False:
            payload = generate_payload()
            delay = BASE_INTERVAL_SECONDS
            try:
                res = session.post(
                    INGEST_URL,
                    json=payload,
                    timeout=REQUEST_TIMEOUT,
                )
                if res.status_code == 200:
                    consecutive_503s = 0
                    print(f" -> Successfully ingested {payload['alert_id']}")
                elif res.status_code == 503:
                    consecutive_503s += 1
                    delay = min(
                        BASE_INTERVAL_SECONDS * (2 ** consecutive_503s),
                        MAX_503_BACKOFF_SECONDS,
                    )
                    print(
                        f" -> Service unavailable for {payload['alert_id']}; "
                        f"not retrying this event. Backing off {delay}s."
                    )
                else:
                    consecutive_503s = 0
                    print(f" -> Error: {res.status_code} {res.text}")
            except requests.Timeout as exc:
                consecutive_503s = 0
                print(
                    f" -> Request timed out for {payload['alert_id']}; the POST may "
                    f"already have committed, so it will not be retried: {exc}"
                )
            except requests.RequestException as exc:
                consecutive_503s = 0
                print(f" -> Connection failed; event will not be retried: {exc}")

            time.sleep(delay)
