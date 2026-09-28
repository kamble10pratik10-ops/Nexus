from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np
from datetime import datetime
import json

# Setup FastAPI
app = FastAPI(title="SAT-SA Nexus API", description="Supervisory Analytics for SOCs")

# Allow CORS for the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def load_data():
    try:
        alerts = pd.read_csv("data/mock_alerts.csv")
        cases = pd.read_csv("data/mock_cases.csv")
        # Convert timestamps
        alerts['created_at'] = pd.to_datetime(alerts['created_at'])
        alerts['closed_at'] = pd.to_datetime(alerts['closed_at'])
        return alerts, cases
    except Exception as e:
        print(f"Error loading data: {e}")
        return None, None

@app.get("/")
def read_root():
    return {"status": "SAT-SA Nexus Backend Running"}

@app.get("/api/dashboard/summary")
def get_dashboard_summary():
    alerts, cases = load_data()
    if alerts is None:
        return {"error": "Data not found"}
        
    total_alerts = len(alerts)
    total_cases = len(cases)
    
    return {
        "total_alerts": total_alerts,
        "total_cases": total_cases,
        "analytics_confidence_score": 85,
    }

@app.get("/api/findings/execution-gaps")
def get_execution_gaps():
    alerts, cases = load_data()
    if alerts is None:
        return {"error": "Data not found"}
        
    findings = []
    
    # Rule 1: Critical Alerts Closed in < 90 Seconds without Escalation
    alerts['time_to_close_seconds'] = (alerts['closed_at'] - alerts['created_at']).dt.total_seconds()
    suspicious_alerts = alerts[(alerts['severity'] == 'Critical') & (alerts['time_to_close_seconds'] < 90)]
    
    for _, row in suspicious_alerts.iterrows():
        findings.append({
            "finding_id": f"FND-GAP-{row['alert_id']}",
            "type": "Execution Gap",
            "entity_id": row['entity_id'],
            "severity": "High",
            "description": f"Critical alert {row['alert_id']} was closed in {row['time_to_close_seconds']}s. Too fast for a genuine investigation.",
            "evidence": {
                "alert_id": row['alert_id'],
                "time_to_close": row['time_to_close_seconds']
            }
        })
        
    return {"findings": findings}

@app.get("/api/findings/nlp-templated")
def get_nlp_findings():
    # In a full implementation, we'd use SentenceTransformers here.
    # For MVP, we simulate the NLP catching identical strings.
    _, cases = load_data()
    if cases is None:
        return {"error": "Data not found"}
        
    findings = []
    
    # Simulate NLP duplicate detection by finding exact value counts for simplicity in MVP
    text_counts = cases['investigation_text'].value_counts()
    templated_texts = text_counts[text_counts > 1].index.tolist()
    
    suspicious_cases = cases[cases['investigation_text'].isin(templated_texts)]
    
    for text in templated_texts:
        cases_with_text = suspicious_cases[suspicious_cases['investigation_text'] == text]
        findings.append({
            "finding_id": f"FND-NLP-{hash(text) % 10000}",
            "type": "Templated Investigation",
            "severity": "Medium",
            "description": f"Found {len(cases_with_text)} cases using identical investigation text. Indicates copy-paste behavior.",
            "evidence": {
                "text_snippet": text[:100] + "...",
                "case_ids": cases_with_text['case_id'].tolist()
            }
        })

    return {"findings": findings}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
