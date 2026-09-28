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

def load_assets():
    try:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        assets = pd.read_csv(os.path.join(base_dir, "data", "mock_assets.csv"))
        return assets
    except Exception as e:
        print(f"Error loading assets: {e}")
        return None

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
            "type": "Fast Closure",
            "entity_id": row['entity_id'],
            "severity": "High",
            "description": f"Critical alert {row['alert_id']} was closed in {row['time_to_close_seconds']}s. Too fast for a genuine investigation.",
            "evidence": {
                "alert_id": row['alert_id'],
                "time_to_close": row['time_to_close_seconds']
            }
        })

    # Rule 2: "Lazy Analyst" - Shallow Investigation Depth
    # Merge cases with alerts to get severity and category
    merged_data = cases.merge(alerts[['alert_id', 'severity', 'category']], on='alert_id', how='inner')
    
    lazy_cases = merged_data[
        ((merged_data['severity'] == 'Critical') & (merged_data['investigation_actions'] <= 3)) |
        ((merged_data['severity'] == 'High') & (merged_data['investigation_actions'] <= 2))
    ]
    
    for _, row in lazy_cases.iterrows():
        findings.append({
            "finding_id": f"FND-LAZY-{row['case_id']}",
            "type": "Shallow Investigation",
            "entity_id": row['entity_id'],
            "severity": "Medium",
            "description": f"Analyst closed a {row['severity']} alert ({row['category']}) with only {row['investigation_actions']} investigation action(s). Indicates potential rubber-stamping.",
            "evidence": {
                "alert_id": row['alert_id'],
                "actions_logged": row['investigation_actions']
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

@app.get("/api/findings/negative-space")
def get_negative_space():
    alerts, cases = load_data()
    assets = load_assets()
    
    if alerts is None or cases is None or assets is None:
        return {"error": "Data not found"}
        
    findings = []
    
    # 1. Silent Critical Assets
    critical_assets = assets[assets['criticality'].isin(['High', 'Critical'])]
    alert_asset_ids = set(alerts['asset_id'].dropna().unique())
    silent_assets = critical_assets[~critical_assets['asset_id'].isin(alert_asset_ids)]
    
    for _, row in silent_assets.iterrows():
        findings.append({
            "finding_id": f"FND-NEG-AST-{row['asset_id']}",
            "type": "Silent Critical Asset",
            "entity_id": row['entity_id'],
            "severity": "Critical",
            "description": f"Critical asset {row['asset_id']} ({row['asset_type']}) generated zero alerts. Verify monitoring is active.",
            "evidence": {
                "asset_id": row['asset_id'],
                "asset_type": row['asset_type'],
                "criticality": row['criticality']
            }
        })

    # 2. Orphaned Critical Alerts
    critical_alerts = alerts[alerts['severity'].isin(['High', 'Critical'])]
    case_alert_ids = set(cases['alert_id'].dropna().unique())
    orphaned_alerts = critical_alerts[~critical_alerts['alert_id'].isin(case_alert_ids)]
    
    for _, row in orphaned_alerts.iterrows():
        findings.append({
            "finding_id": f"FND-NEG-ALT-{row['alert_id']}",
            "type": "Orphaned Critical Alert",
            "entity_id": row['entity_id'],
            "severity": "High",
            "description": f"{row['severity']} alert {row['alert_id']} ({row['category']}) was never investigated (no case created).",
            "evidence": {
                "alert_id": row['alert_id'],
                "category": row['category']
            }
        })
        
    return {"findings": findings}

@app.get("/api/findings/peer-benchmarking")
def get_peer_benchmarking():
    alerts, cases = load_data()
    if alerts is None:
        return {"error": "Data not found"}
        
    findings = []
    
    # Calculate Time to Close
    alerts['time_to_close_seconds'] = (alerts['closed_at'] - alerts['created_at']).dt.total_seconds()
    
    # Entity-level metrics (Median Time to Close)
    entity_metrics = alerts.groupby('entity_id')['time_to_close_seconds'].median().reset_index()
    entity_metrics.columns = ['entity_id', 'median_time_to_close']
    
    # Calculate global robust stats
    global_median = entity_metrics['median_time_to_close'].median()
    mad = (entity_metrics['median_time_to_close'] - global_median).abs().median()
    
    # Prevent division by zero
    if mad == 0:
        mad = 1
        
    # Calculate robust z-score: 0.6745 * (x - median) / MAD
    entity_metrics['robust_z_score'] = 0.6745 * (entity_metrics['median_time_to_close'] - global_median) / mad
    
    # Identify anomalies: significantly faster than peers (Z-score < -2)
    fast_anomalies = entity_metrics[entity_metrics['robust_z_score'] < -2]
    
    for _, row in fast_anomalies.iterrows():
        findings.append({
            "finding_id": f"FND-PEER-{row['entity_id']}",
            "type": "Peer Anomaly (Fast Closure)",
            "entity_id": row['entity_id'],
            "severity": "High",
            "description": f"Entity {row['entity_id']} closes alerts significantly faster (Median: {row['median_time_to_close']:.0f}s) than the peer group median ({global_median:.0f}s). Robust Z-Score: {row['robust_z_score']:.2f}.",
            "evidence": {
                "entity_median_s": round(row['median_time_to_close'], 1),
                "peer_median_s": round(global_median, 1),
                "z_score": round(row['robust_z_score'], 2)
            }
        })
        
    return {"findings": findings}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
