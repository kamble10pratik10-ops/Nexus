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

import os

def load_data():
    try:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        alerts = pd.read_csv(os.path.join(base_dir, "data", "mock_alerts.csv"))
        cases = pd.read_csv(os.path.join(base_dir, "data", "mock_cases.csv"))
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
    _, cases = load_data()
    if cases is None or cases.empty:
        return {"error": "Data not found"}
        
    # Lazy load the model to save startup time
    try:
        from sentence_transformers import SentenceTransformer
        from sklearn.cluster import DBSCAN
        from sklearn.metrics.pairwise import cosine_distances
        # Using a small, fast model suitable for sentence similarity
        model = SentenceTransformer('all-MiniLM-L6-v2')
    except ImportError:
        return {"error": "Required libraries (sentence-transformers, scikit-learn) not installed"}
        
    findings = []
    
    texts = cases['investigation_text'].tolist()
    
    # Generate embeddings
    embeddings = model.encode(texts)
    
    # Compute cosine distances and cluster using DBSCAN
    # eps=0.15 means vectors with a cosine distance <= 0.15 (i.e., similarity >= 0.85) will be clustered
    distances = cosine_distances(embeddings)
    db = DBSCAN(eps=0.15, min_samples=2, metric='precomputed')
    labels = db.fit_predict(distances)
    
    cases['cluster'] = labels
    unique_labels = set(labels)
    
    for label in unique_labels:
        if label == -1:
            continue # -1 represents noise (unique texts)
            
        cluster_cases = cases[cases['cluster'] == label]
        sample_text = cluster_cases.iloc[0]['investigation_text']
        
        findings.append({
            "finding_id": f"FND-NLP-{hash(sample_text) % 10000}",
            "type": "Templated Investigation (Semantic)",
            "severity": "Medium",
            "description": f"Found {len(cluster_cases)} cases with highly similar investigation text. Indicates copy-paste or templated behavior.",
            "evidence": {
                "text_snippet": sample_text[:100] + "...",
                "case_ids": cluster_cases['case_id'].tolist()
            }
        })

    return {"findings": findings}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
