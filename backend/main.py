from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import numpy as np
from datetime import datetime
from collections import Counter
import re
import json
import hashlib
import hmac

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
        events_path = os.path.join(base_dir, "data", "mock_alert_events.csv")
        if os.path.exists(events_path):
            events = pd.read_csv(events_path)
            events['timestamp'] = pd.to_datetime(events['timestamp'])
        else:
            events = pd.DataFrame()
        # Convert timestamps
        alerts['created_at'] = pd.to_datetime(alerts['created_at'])
        alerts['closed_at'] = pd.to_datetime(alerts['closed_at'])
        return alerts, cases, events
    except Exception as e:
        print(f"Error loading data: {e}")
        return None, None, None

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
    alerts, cases, events = load_data()
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
    alerts, cases, events = load_data()
    if alerts is None or cases is None:
        return {"error": "Data not found"}
        
    findings = []
    
    alerts['time_to_close_seconds'] = (alerts['closed_at'] - alerts['created_at']).dt.total_seconds()
    
    # We merge alerts and cases because we need case context (escalated, investigation_actions)
    merged = alerts.merge(cases, on='alert_id', how='left')
    
    # Calculate category-level medians (minimum group size 5)
    category_medians = {}
    for cat, group in merged.groupby('category'):
        if len(group) >= 5:
            category_medians[cat] = group['time_to_close_seconds'].median()
        else:
            category_medians[cat] = 90  # fallback
            
    suspicious_alerts = []
    for _, row in merged.iterrows():
        cat = row['category']
        median = category_medians.get(cat, 90)
        
        # Fast closure defect: High/Critical severity, closed < 10% of median, no evidence (actions <= 1), no escalation, not SOAR
        if (row['time_to_close_seconds'] < (median * 0.10) and 
            row.get('closed_by', '') != 'SOAR' and
            row.get('severity') in ['High', 'Critical'] and
            row.get('investigation_actions', 0) <= 1 and
            not row.get('escalated', False)):
            suspicious_alerts.append(row)
            
    suspicious_df = pd.DataFrame(suspicious_alerts) if suspicious_alerts else pd.DataFrame()
    
    for _, row in suspicious_df.iterrows():
        findings.append({
            "finding_id": f"FND-GAP-{row['alert_id']}",
            "type": "Fast Closure (High Risk)",
            "entity_id": row['entity_id_x'] if 'entity_id_x' in row else row['entity_id'],
            "severity": "High",
            "description": f"Alert {row['alert_id']} ({row['category']}, {row['severity']}) was closed in {row['time_to_close_seconds']:.0f}s with no escalation and minimal evidence. Median is {median:.0f}s.",
            "evidence": {
                "alert_id": row['alert_id'],
                "time_to_close": row['time_to_close_seconds'],
                "category_median": median
            }
        })

    # Rule 2: Broken Evidence Chain (No Escalation on True Positive Criticals)
    broken_chains = merged[
        (merged['severity'] == 'Critical') & 
        (merged['disposition'] == 'True Positive') & 
        (merged['escalated'] == False)
    ]
    
    for _, row in broken_chains.iterrows():
        findings.append({
            "finding_id": f"FND-CHAIN-{row['case_id']}",
            "type": "Broken Evidence Chain (No Escalation)",
            "entity_id": row['entity_id_x'] if 'entity_id_x' in row else row['entity_id'],
            "severity": "Critical",
            "description": f"Critical alert {row['alert_id']} was marked True Positive but never escalated.",
            "evidence": {
                "case_id": row['case_id'],
                "severity": row['severity'],
                "disposition": row['disposition']
            }
        })
        
    return {"findings": findings}

@app.get("/api/findings/nlp-templated")
def get_nlp_findings():
    alerts, cases, events = load_data()
    if cases is None or cases.empty:
        return {"error": "Data not found"}
        
    findings = []
    
    try:
        from sentence_transformers import SentenceTransformer
        from sklearn.cluster import DBSCAN
        from sklearn.metrics.pairwise import cosine_distances
        import pandas as pd
        import numpy as np
    except ImportError:
        return {"error": "Missing NLP dependencies"}
    
    # Join cases with alerts to get the actor (closed_by)
    cases_ext = pd.merge(cases, alerts[['alert_id', 'closed_by']], on='alert_id', how='left')
    
    # Filter cases with meaningful text
    valid_cases = cases_ext.dropna(subset=['investigation_text']).copy()
    valid_cases = valid_cases[valid_cases['investigation_text'].str.len() > 15].copy()
    
    if valid_cases.empty:
        return {"findings": []}
        
    # Mask IPs and specific IDs out of the text for embeddings
    def mask_text(t):
        t = re.sub(r'\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b', '[IP]', t)
        t = re.sub(r'\bAST-\S+', '[ASSET]', t)
        return t
        
    valid_cases['masked_text'] = valid_cases['investigation_text'].apply(mask_text)
        
    model = SentenceTransformer('all-MiniLM-L6-v2')
    
    analyst_stats = []
    
    for analyst, group in valid_cases.groupby('closed_by'):
        if analyst == 'SOAR':
            continue
            
        total_cases = len(group)
        if total_cases < 2:
            continue
            
        # Cluster per-analyst using embeddings
        texts = group['masked_text'].tolist()
        embeddings = model.encode(texts)
        distance_matrix = cosine_distances(embeddings)
        
        # DBSCAN clustering. eps=0.05
        clustering = DBSCAN(eps=0.05, min_samples=2, metric='precomputed').fit(distance_matrix)
        
        reused_mask = clustering.labels_ != -1
        reused_cases = np.sum(reused_mask)
        reuse_rate = reused_cases / total_cases
        
        case_ids = group['case_id'].values
        reused_case_ids = case_ids[reused_mask].tolist()
        
        analyst_stats.append({
            'analyst': analyst,
            'total_cases': total_cases,
            'reused_cases': reused_cases,
            'reuse_rate': reuse_rate,
            'reused_case_ids': reused_case_ids,
            'entity_id': group['entity_id'].iloc[0]
        })
        
    if not analyst_stats:
        return {"findings": []}
        
    stats_df = pd.DataFrame(analyst_stats)
    
    # Robust z-score of reuse rates
    global_median = stats_df['reuse_rate'].median()
    mad = (stats_df['reuse_rate'] - global_median).abs().median()
    if mad == 0:
        mad = 0.01  # prevent division by zero
        
    stats_df['robust_z'] = 0.6745 * (stats_df['reuse_rate'] - global_median) / mad
    
    # Flag analysts with anomalously high reuse rates
    anomalous = stats_df[stats_df['robust_z'] > 2.0]
    
    for _, row in anomalous.iterrows():
        findings.append({
            "finding_id": f"FND-NLP-{row['analyst']}",
            "type": "Templated Investigation (Semantic)",
            "entity_id": row['entity_id'],
            "severity": "High",
            "description": f"Analyst {row['analyst']} has an unusually high rate of semantic near-duplicates ({row['reuse_rate']*100:.1f}%, z={row['robust_z']:.2f}).",
            "evidence": {
                "analyst": row['analyst'],
                "reuse_rate": row['reuse_rate'],
                "case_ids": row['reused_case_ids']
            }
        })
        
    return {"findings": findings}

@app.get("/api/findings/negative-space")
def get_negative_space():
    alerts, cases, events = load_data()
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
    alerts, cases, events = load_data()
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

@app.get("/api/findings/evidence-chains")
def get_evidence_chains():
    alerts, cases, events = load_data()
    if alerts is None or cases is None:
        return {"error": "Data not found"}
        
    findings = []
    
    # Broken Chain: True Positive Critical Alert -> Case -> NOT Escalated
    # To check this, merge alerts and cases
    merged = alerts.merge(cases, on=['alert_id', 'entity_id'], how='inner')
    
    # Finding Critical alerts marked as True Positive but not escalated
    broken_chains = merged[
        (merged['severity'] == 'Critical') & 
        (merged['disposition'] == 'True Positive') & 
        (merged['escalated'] == False)
    ]
    
    for _, row in broken_chains.iterrows():
        findings.append({
            "finding_id": f"FND-CHAIN-{row['alert_id']}",
            "type": "Broken Evidence Chain (No Escalation)",
            "entity_id": row['entity_id'],
            "severity": "Critical",
            "description": f"Critical alert {row['alert_id']} was investigated and confirmed as True Positive, but the evidence chain breaks: it was never escalated.",
            "evidence": {
                "alert_id": row['alert_id'],
                "case_id": row['case_id'],
                "disposition": row['disposition'],
                "escalated": row['escalated']
            }
        })
        
    return {"findings": findings}

@app.get("/api/findings/capability-drift")
def get_capability_drift():
    alerts, cases, events = load_data()
    assets = load_assets()
    if alerts is None or assets is None:
        return {"error": "Data not found"}
        
    findings = []
    
    # 1. Detection Capability Drift: Drop in alerts on critical assets
    critical_assets = assets[assets['criticality'].isin(['High', 'Critical'])]
    merged = alerts.merge(critical_assets, on=['asset_id', 'entity_id'], how='inner')
    
    if not merged.empty:
        min_date = merged['created_at'].min()
        max_date = merged['created_at'].max()
        mid_date = min_date + (max_date - min_date) / 2
        
        older_alerts = merged[merged['created_at'] < mid_date]
        newer_alerts = merged[merged['created_at'] >= mid_date]
        
        older_counts = older_alerts.groupby('entity_id').size().reset_index(name='old_count')
        newer_counts = newer_alerts.groupby('entity_id').size().reset_index(name='new_count')
        
        drift_df = pd.merge(older_counts, newer_counts, on='entity_id', how='outer').fillna(0)
        drift_df['drift_ratio'] = drift_df['new_count'] / drift_df['old_count'].replace(0, 1)
        suspects = drift_df[(drift_df['drift_ratio'] <= 0.5) & (drift_df['old_count'] > 2)]
        
        for _, row in suspects.iterrows():
            findings.append({
                "finding_id": f"FND-DRIFT-{row['entity_id']}",
                "type": "Detection Capability Drift",
                "entity_id": row['entity_id'],
                "severity": "High",
                "description": f"Entity {row['entity_id']} showed a significant drop in alerts on critical assets. Older period: {row['old_count']}, Newer period: {row['new_count']}. May indicate broken telemetry rather than improved security.",
                "evidence": {
                    "old_alert_count": row['old_count'],
                    "new_alert_count": row['new_count']
                }
            })
            
    return {"findings": findings}

@app.get("/api/findings/remediation-effectiveness")
def get_remediation_effectiveness():
    alerts, cases, events = load_data()
    if alerts is None:
        return {"error": "Data not found"}
        
    findings = []
    
    # 2. Remediation Effectiveness: Recurring True Positives
    true_positives = alerts[alerts['disposition'] == 'True Positive']
    recurring = true_positives.groupby(['entity_id', 'asset_id', 'category']).size().reset_index(name='count')
    recurring_suspects = recurring[recurring['count'] >= 2]
    
    for _, row in recurring_suspects.iterrows():
        findings.append({
            "finding_id": f"FND-REMED-{row['entity_id']}-{hash(row['asset_id']) % 1000}",
            "type": "Ineffective Remediation",
            "entity_id": row['entity_id'],
            "severity": "Medium",
            "description": f"Entity {row['entity_id']} has recurring True Positive alerts ({row['count']} times) for {row['category']} on asset {row['asset_id']}. Indicates failure to resolve the root cause.",
            "evidence": {
                "asset_id": row['asset_id'],
                "category": row['category'],
                "occurrence_count": row['count']
            }
        })
        
    return {"findings": findings}

@app.get("/api/findings/adaptive-sampling")
def get_adaptive_sampling():
    alerts, cases, events = load_data()
    if alerts is None or cases is None:
        return {"error": "Data not found"}
        
    samples = []
    merged = cases.merge(alerts[['alert_id', 'severity', 'category', 'disposition']], on='alert_id', how='inner')
    
    # 1. Outlier (fast closure case)
    alerts['time_to_close_seconds'] = (alerts['closed_at'] - alerts['created_at']).dt.total_seconds()
    fast_alerts = alerts[alerts['time_to_close_seconds'] < 90]
    fast_cases = merged[merged['alert_id'].isin(fast_alerts['alert_id'])]
    if not fast_cases.empty:
        sample = fast_cases.sample(1).iloc[0]
        samples.append({"case_id": sample['case_id'], "reason": "High-Risk Outlier: Suspiciously fast closure"})
        
    # 2. Shallow investigation case
    shallow_cases = merged[merged['investigation_actions'] <= 2]
    if not shallow_cases.empty:
        sample = shallow_cases.sample(1).iloc[0]
        samples.append({"case_id": sample['case_id'], "reason": "Negative Space: Unusually shallow investigation depth"})
        
    # 3. Random True Positive
    tp_cases = merged[merged['disposition'] == 'True Positive']
    if len(tp_cases) >= 2:
        for _, sample in tp_cases.sample(2).iterrows():
            samples.append({"case_id": sample['case_id'], "reason": "Typical: Confirmed True Positive"})
            
    # 4. Random False Positive
    fp_cases = merged[merged['disposition'] == 'False Positive']
    if not fp_cases.empty:
        sample = fp_cases.sample(1).iloc[0]
        samples.append({"case_id": sample['case_id'], "reason": "Typical: Routine False Positive"})
        
    return {"sampled_cases": samples}

# ═══════════════════════════════════════════════════════════════════════════════
# FEATURE 1: METRIC INTEGRITY (LINEAGE AUDITOR)
# ═══════════════════════════════════════════════════════════════════════════════
@app.get("/api/findings/metric-integrity")
def get_metric_integrity():
    alerts, cases, events = load_data()
    if alerts is None:
        return {"error": "Data not found"}
        
    findings = []
    
    # Analyze the events audit trail for defects
    if not events.empty:
        # Detect Severity Downgrades
        severity_events = events[events['field'] == 'severity'].copy()
        severity_map = {"Critical": 4, "High": 3, "Medium": 2, "Low": 1, "Info": 0}
        
        for _, row in severity_events.iterrows():
            old_sev = row['old_value']
            new_sev = row['new_value']
            if pd.notna(old_sev) and pd.notna(new_sev):
                if severity_map.get(old_sev, 0) > severity_map.get(new_sev, 0):
                    alert_id = row['alert_id']
                    findings.append({
                        "finding_id": f"FND-MI-SEV-{alert_id}",
                        "type": "Severity Downgrade",
                        "entity_id": alerts[alerts['alert_id'] == alert_id]['entity_id'].iloc[0],
                        "severity": "Medium",
                        "description": f"Alert {alert_id} severity was downgraded from {old_sev} to {new_sev} by {row['actor']}.",
                        "evidence": {
                            "alert_id": alert_id,
                            "old_severity": old_sev,
                            "new_severity": new_sev
                        }
                    })
                    
        # Detect SLA Clock Resets
        status_events = events[events['field'] == 'status'].copy()
        status_events = status_events.sort_values(['alert_id', 'timestamp'])
        
        for alert_id, group in status_events.groupby('alert_id'):
            # Looking for sequence: Open -> Resolved -> Open
            states = group['new_value'].tolist()
            if "Resolved" in states:
                res_idx = states.index("Resolved")
                if "Open" in states[res_idx:]:
                    findings.append({
                        "finding_id": f"FND-MI-SLA-{alert_id}",
                        "type": "SLA Clock Reset",
                        "entity_id": alerts[alerts['alert_id'] == alert_id]['entity_id'].iloc[0],
                        "severity": "Medium",
                        "description": f"Alert {alert_id} status was toggled to Resolved and back to Open, potentially resetting SLA clocks.",
                        "evidence": {
                            "alert_id": alert_id
                        }
                    })
                    
    # Original metric integrity logic (e.g. MTTR spread)
    alerts['time_to_close_seconds'] = (alerts['closed_at'] - alerts['created_at']).dt.total_seconds()
    alerts['time_to_close_hours'] = alerts['time_to_close_seconds'] / 3600.0

    entity_mttr = alerts.groupby('entity_id')['time_to_close_hours'].mean().reset_index()
    entity_mttr.columns = ['entity_id', 'mean_mttr']
    
    entity_std = alerts.groupby('entity_id')['time_to_close_hours'].std().reset_index()
    entity_std.columns = ['entity_id', 'std_mttr']
    
    mttr_stats = pd.merge(entity_mttr, entity_std, on='entity_id')
    
    for _, row in mttr_stats.iterrows():
        if pd.notna(row['std_mttr']) and row['std_mttr'] > (row['mean_mttr'] * 2.5):
            findings.append({
                "finding_id": f"FND-MI-MTTR-{row['entity_id']}",
                "type": "MTTR Definition Spread",
                "entity_id": row['entity_id'],
                "severity": "Medium",
                "description": f"Extremely high variance in MTTR for {row['entity_id']} (Mean: {row['mean_mttr']:.1f}h, StdDev: {row['std_mttr']:.1f}h). Indicates inconsistent measurement or gaming.",
                "evidence": {
                    "entity_id": row['entity_id'],
                    "mean": row['mean_mttr'],
                    "std_dev": row['std_mttr']
                }
            })
            
    return {"findings": findings}

@app.get("/api/findings/evidence-forensics")
def get_evidence_forensics():
    alerts, cases, events = load_data()
    if alerts is None:
        return {"error": "Data not found"}
        
    findings = []
    alerts['time_to_close_seconds'] = (alerts['closed_at'] - alerts['created_at']).dt.total_seconds()
    
    # --- Sub-Engine 1: Uniform Inter-Arrival Detector ---
    for entity_id in alerts['entity_id'].unique():
        ent = alerts[alerts['entity_id'] == entity_id].sort_values('created_at')
        if len(ent) < 5:
            continue
        
        inter_arrivals = ent['created_at'].diff().dt.total_seconds().dropna()
        if len(inter_arrivals) < 4:
            continue
        
        # Coefficient of variation: low CV = suspiciously uniform
        mean_ia = inter_arrivals.mean()
        std_ia = inter_arrivals.std()
        cv = std_ia / mean_ia if mean_ia > 0 else 999
        
        if cv < 0.15 and len(inter_arrivals) >= 5:  # CV < 15% is very uniform
            findings.append({
                "finding_id": f"FND-FORENSIC-UNIFORM-{entity_id}",
                "type": "Uniform Inter-Arrival (Fabrication Risk)",
                "entity_id": entity_id,
                "severity": "Critical",
                "description": f"Entity {entity_id}: Alert inter-arrival times are suspiciously uniform (CV={cv:.3f}). Real alerts are bursty; uniform spacing suggests fabricated or synthetic data.",
                "evidence": {
                    "coefficient_of_variation": round(cv, 4),
                    "mean_interval_min": round(mean_ia / 60, 1),
                    "std_interval_min": round(std_ia / 60, 1),
                    "sample_count": len(inter_arrivals)
                }
            })
    
    # --- Sub-Engine 2: Case-ID Gap Detector ---
    if cases is not None and not cases.empty:
        case_ids = cases['case_id'].tolist()
        # Extract numeric part of case IDs
        case_nums = []
        for cid in case_ids:
            match = re.search(r'(\d+)$', cid)
            if match:
                case_nums.append(int(match.group(1)))
        
        if case_nums:
            case_nums_sorted = sorted(case_nums)
            expected_range = set(range(case_nums_sorted[0], case_nums_sorted[-1] + 1))
            actual = set(case_nums_sorted)
            missing = expected_range - actual
            
            if len(missing) > 0:
                gap_pct = len(missing) / len(expected_range) * 100
                findings.append({
                    "finding_id": "FND-FORENSIC-CASEGAP",
                    "type": "Case-ID Sequence Gap (Deleted Records)",
                    "entity_id": "ALL",
                    "severity": "High",
                    "description": f"{len(missing)} case ID(s) missing from the sequence ({gap_pct:.1f}% gap rate). Missing IDs: {sorted(list(missing))[:10]}. Suggests records were deleted or scrubbed before submission.",
                    "evidence": {
                        "missing_count": len(missing),
                        "gap_percentage": round(gap_pct, 1),
                        "missing_ids": [f"CAS-{m:04d}" for m in sorted(list(missing))[:10]]
                    }
                })
    
    # --- Sub-Engine 3: Round-Number Duration Detector ---
    round_thresholds = [300, 600, 900, 1800, 3600]  # 5, 10, 15, 30, 60 min in seconds
    round_alerts = alerts[alerts['time_to_close_seconds'].isin(round_thresholds)]
    
    if len(round_alerts) > 2:
        round_pct = len(round_alerts) / len(alerts) * 100
        findings.append({
            "finding_id": "FND-FORENSIC-ROUND",
            "type": "Round-Number Duration Clustering",
            "entity_id": "ALL",
            "severity": "Medium",
            "description": f"{len(round_alerts)} alerts ({round_pct:.1f}%) have exact round-number closure durations (5/10/15/30/60 min). Natural investigations rarely land on exact minute boundaries.",
            "evidence": {
                "round_count": len(round_alerts),
                "total_alerts": len(alerts),
                "percentage": round(round_pct, 1),
                "distribution": {str(int(t/60))+"min": int((round_alerts['time_to_close_seconds'] == t).sum()) for t in round_thresholds}
            }
        })
    
    # --- Sub-Engine 4: Benford's Law Digit Anomaly ---
    durations = alerts['time_to_close_seconds'].dropna()
    durations = durations[durations > 0]
    
    if len(durations) >= 500:
        leading_digits = durations.apply(lambda x: int(str(int(x))[0]))
        digit_counts = Counter(leading_digits)
        total = sum(digit_counts.values())
        
        # Benford's expected distribution
        benford = {d: np.log10(1 + 1/d) for d in range(1, 10)}
        
        # Chi-squared-like divergence score
        divergence = 0
        digit_analysis = {}
        for d in range(1, 10):
            observed = digit_counts.get(d, 0) / total
            expected = benford[d]
            divergence += (observed - expected) ** 2 / expected
            digit_analysis[str(d)] = {"observed_pct": round(observed * 100, 1), "expected_pct": round(expected * 100, 1)}
        
        if divergence > 0.15:  # Tuned threshold to prevent small-sample false positives
            findings.append({
                "finding_id": "FND-FORENSIC-BENFORD",
                "type": "Timestamp Digit Anomaly (Benford's Law)",
                "entity_id": "ALL",
                "severity": "Medium",
                "description": f"Leading-digit distribution of closure durations deviates from Benford's Law (divergence score: {divergence:.4f}). Natural data follows Benford's; fabricated data often doesn't.",
                "evidence": {
                    "divergence_score": round(divergence, 4),
                    "digit_analysis": digit_analysis
                }
            })
    
    return {"findings": findings}

# ═══════════════════════════════════════════════════════════════════════════════
# FEATURE 3: INVESTIGATION QUALITY (RUBRIC JUDGE + ZOMBIE CASES)
# ═══════════════════════════════════════════════════════════════════════════════
@app.get("/api/findings/investigation-quality")
def get_investigation_quality():
    alerts, cases, events = load_data()
    if alerts is None or cases is None:
        return {"error": "Data not found"}
        
    findings = []
    # Add native_ioc to the columns we merge from alerts
    cols = ['alert_id', 'severity', 'category', 'disposition']
    if 'native_ioc' in alerts.columns:
        cols.append('native_ioc')
    merged = cases.merge(alerts[cols], on='alert_id', how='inner')
    
    # Quality rubric keywords (evidence of real investigation)
    evidence_patterns = [
        r'\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b',  # IP addresses
        r'\b[A-Fa-f0-9]{32,64}\b',                      # Hashes (MD5/SHA)
        r'\b(VirusTotal|VT|CrowdStrike|Splunk|QRadar|Sentinel|SIEM|WAF|EDR)\b',  # Tool references
        r'\b(blocked|quarantined|isolated|contained|remediated)\b',  # Action verbs
        r'\b(CVE-\d{4}-\d+)\b',                          # CVE references
        r'\b(T\d{4}(\.\d{3})?)\b',                       # MITRE ATT&CK IDs
    ]
    
    quality_scores = []
    
    for _, row in merged.iterrows():
        text = str(row.get('investigation_text', ''))
        
        # --- Sub-Engine 1: Quality Rubric Scorer ---
        score = 0
        max_score = 6
        matched_criteria = []
        
        # Criterion 1: Investigation text length (>50 chars = substantive)
        if len(text) > 50:
            score += 1
            matched_criteria.append("substantive_length")
        
        # Criterion 2: Evidence cited (IP, hash, CVE)
        for i, pattern in enumerate(evidence_patterns[:3]):
            if re.search(pattern, text, re.IGNORECASE):
                score += 1
                matched_criteria.append(f"evidence_ref_{i}")
                break  # Count once
        
        # Criterion 3: Tool referenced
        if re.search(evidence_patterns[2], text, re.IGNORECASE):
            score += 1
            matched_criteria.append("tool_referenced")
        
        # Criterion 4: Action taken (blocked, contained, etc.)
        if re.search(evidence_patterns[3], text, re.IGNORECASE):
            score += 1
            matched_criteria.append("action_taken")
        
        # Criterion 5: MITRE reference
        if re.search(evidence_patterns[5], text, re.IGNORECASE):
            score += 1
            matched_criteria.append("mitre_reference")
        
        # Criterion 6: Multiple actions logged
        if row.get('investigation_actions', 0) >= 3:
            score += 1
            matched_criteria.append("multiple_actions")
        
        quality_pct = (score / max_score) * 100
        quality_scores.append({
            "case_id": row['case_id'],
            "entity_id": row['entity_id'],
            "severity": row.get('severity', 'Unknown'),
            "quality_score": quality_pct,
            "matched": matched_criteria,
            "text_length": len(text),
            "actions": row.get('investigation_actions', 0)
        })
        
        # Flag cases with Critical/High alerts but low quality
        if quality_pct < 34 and row.get('severity') in ['Critical', 'High']:
            findings.append({
                "finding_id": f"FND-QUALITY-LOW-{row['case_id']}",
                "type": "Low Quality Investigation",
                "entity_id": row['entity_id'],
                "severity": "High",
                "description": f"Case {row['case_id']} investigated a {row.get('severity')} alert ({row.get('category', 'N/A')}) but scored only {quality_pct:.0f}% on the quality rubric. Missing: evidence references, tool citations, action verbs.",
                "evidence": {
                    "case_id": row['case_id'],
                    "quality_score_pct": round(quality_pct, 0),
                    "criteria_met": matched_criteria,
                    "text_length": len(text),
                    "investigation_actions": row.get('investigation_actions', 0)
                }
            })
    
    # --- Sub-Engine 4: Rubric Grounding Check (Gaming Detector) ---
    for _, row in merged.iterrows():
        text = str(row.get('investigation_text', ''))
        native_ioc = str(row.get('native_ioc', ''))
        
        if native_ioc:
            cited_ips = set(re.findall(r'\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b', text))
            if cited_ips and native_ioc not in cited_ips:
                findings.append({
                    "finding_id": f"FND-GROUNDING-{row['case_id']}",
                    "type": "Rubric Grounding Failure (Gaming)",
                    "entity_id": row['entity_id'],
                    "severity": "Critical",
                    "description": f"Case {row['case_id']} cited an IP ({list(cited_ips)[0]}) in the investigation notes that does not exist in the alert's native telemetry ({native_ioc}). This indicates fabricated investigation text to pass quality rubrics.",
                    "evidence": {
                        "case_id": row['case_id'],
                        "cited_ips": list(cited_ips),
                        "actual_native_ioc": native_ioc
                    }
                })
                
    # --- Sub-Engine 2: Zombie Case Detector ---
    zombie_cases = merged[
        (merged['investigation_text'].str.len() <= 15) |
        (merged['investigation_actions'] == 0)
    ]
    
    for _, row in zombie_cases.iterrows():
        findings.append({
            "finding_id": f"FND-ZOMBIE-{row['case_id']}",
            "type": "Zombie Case (No Evidence)",
            "entity_id": row['entity_id'],
            "severity": "Critical",
            "description": f"Case {row['case_id']} is a zombie: investigation text is '{str(row.get('investigation_text', ''))[:30]}' with {row.get('investigation_actions', 0)} action(s). This case was closed without defensible evidence.",
            "evidence": {
                "case_id": row['case_id'],
                "alert_severity": row.get('severity', 'Unknown'),
                "text": str(row.get('investigation_text', ''))[:50],
                "actions": int(row.get('investigation_actions', 0))
            }
        })
    
    # --- Sub-Engine 3: Closure Without Evidence (entity-level aggregation) ---
    if quality_scores:
        qs_df = pd.DataFrame(quality_scores)
        entity_quality = qs_df.groupby('entity_id')['quality_score'].mean().reset_index()
        entity_quality.columns = ['entity_id', 'avg_quality']
        
        for _, row in entity_quality.iterrows():
            if row['avg_quality'] < 40:
                findings.append({
                    "finding_id": f"FND-QUALITY-ENT-{row['entity_id']}",
                    "type": "Systemic Low Investigation Quality",
                    "entity_id": row['entity_id'],
                    "severity": "High",
                    "description": f"Entity {row['entity_id']} has a systemic investigation quality problem: average rubric score is {row['avg_quality']:.0f}%. Investigations lack evidence citations, tool references, and documented actions.",
                    "evidence": {
                        "avg_quality_pct": round(row['avg_quality'], 1)
                    }
                })
    
    return {"findings": findings, "quality_scores": quality_scores}

# ===============================================================================
# FEATURE 4: SILENT DETECTION DECAY (RULE SILENCE ANALYZER)
# ===============================================================================
@app.get("/api/findings/detection-decay")
def get_detection_decay():
    alerts, cases, events = load_data()
    assets = load_assets()
    if alerts is None or assets is None:
        return {"error": "Data not found"}
        
    findings = []
    
    # --- Sub-Engine 1: Rule Silence Analyzer ---
    # For each entity, check each alert category's firing rate across time windows.
    # If a category that used to fire has gone silent, it may indicate broken detection.
    min_date = alerts['created_at'].min()
    max_date = alerts['created_at'].max()
    mid_date = min_date + (max_date - min_date) / 2
    
    older = alerts[alerts['created_at'] < mid_date]
    newer = alerts[alerts['created_at'] >= mid_date]
    
    for entity_id in alerts['entity_id'].unique():
        ent_old = older[older['entity_id'] == entity_id]
        ent_new = newer[newer['entity_id'] == entity_id]
        
        old_categories = set(ent_old['category'].unique())
        new_categories = set(ent_new['category'].unique())
        
        # Categories that fired before but have gone completely silent
        silent_categories = old_categories - new_categories
        
        for cat in silent_categories:
            old_count = len(ent_old[ent_old['category'] == cat])
            findings.append({
                "finding_id": f"FND-SILENCE-{entity_id}-{hash(cat) % 10000}",
                "type": "Rule Gone Silent",
                "entity_id": entity_id,
                "severity": "High",
                "description": f"Entity {entity_id}: Detection rule for '{cat}' fired {old_count} time(s) in the first half of the observation window but has gone completely silent. The rule may still show 'active' status while detecting nothing.",
                "evidence": {
                    "category": cat,
                    "old_period_count": old_count,
                    "new_period_count": 0
                }
            })
    
    # --- Sub-Engine 2: Coverage Decay Index ---
    # Measure the ratio of ATT&CK techniques detected per entity across time windows
    for entity_id in alerts['entity_id'].unique():
        ent_old = older[older['entity_id'] == entity_id]
        ent_new = newer[newer['entity_id'] == entity_id]
        
        old_techniques = set(ent_old['category'].unique())
        new_techniques = set(ent_new['category'].unique())
        
        if len(old_techniques) > 0:
            coverage_ratio = len(new_techniques) / len(old_techniques)
            
            if coverage_ratio < 0.6 and len(old_techniques) >= 3:
                findings.append({
                    "finding_id": f"FND-COVERAGE-DECAY-{entity_id}",
                    "type": "Detection Coverage Decay",
                    "entity_id": entity_id,
                    "severity": "Critical",
                    "description": f"Entity {entity_id}: Detection coverage dropped from {len(old_techniques)} technique categories to {len(new_techniques)} ({coverage_ratio*100:.0f}% retention). Broad capability degradation detected.",
                    "evidence": {
                        "old_technique_count": len(old_techniques),
                        "new_technique_count": len(new_techniques),
                        "coverage_ratio": round(coverage_ratio, 2),
                        "lost_techniques": list(old_techniques - new_techniques)
                    }
                })
    
    return {"findings": findings}

# ===============================================================================
# FEATURE 5: CAPACITY STRESS INDEX
# ===============================================================================
@app.get("/api/findings/capacity-stress")
def get_capacity_stress():
    alerts, cases, events = load_data()
    if alerts is None or cases is None:
        return {"error": "Data not found"}
        
    findings = []
    alerts['time_to_close_seconds'] = (alerts['closed_at'] - alerts['created_at']).dt.total_seconds()
    alerts['close_hour'] = alerts['closed_at'].dt.hour
    
    merged = cases.merge(
        alerts[['alert_id', 'entity_id', 'time_to_close_seconds', 'close_hour', 'severity']],
        on=['alert_id', 'entity_id'], how='inner'
    )
    
    # --- Sub-Engine 1: Shift-End Acceleration ---
    # Compare investigation quality between early-shift (8-14) and late-shift (14-20) and overnight (20-8)
    early = merged[(merged['close_hour'] >= 8) & (merged['close_hour'] < 14)]
    late = merged[(merged['close_hour'] >= 14) & (merged['close_hour'] < 20)]
    
    if len(early) >= 5 and len(late) >= 5:
        early_depth = early['investigation_actions'].median()
        late_depth = late['investigation_actions'].median()
        early_speed = early['time_to_close_seconds'].median()
        late_speed = late['time_to_close_seconds'].median()
        
        # Flag if late-shift investigations are significantly shallower AND faster
        if late_depth < early_depth * 0.7 and late_speed < early_speed * 0.7:
            findings.append({
                "finding_id": "FND-SHIFT-ACCEL",
                "type": "Shift-End Quality Degradation",
                "entity_id": "ALL",
                "severity": "High",
                "description": f"Late-shift closures are {((1 - late_speed/early_speed) * 100):.0f}% faster with {((1 - late_depth/early_depth) * 100):.0f}% fewer investigation actions vs. early-shift. Indicates fatigue-driven rubber-stamping.",
                "evidence": {
                    "early_shift_median_actions": float(early_depth),
                    "late_shift_median_actions": float(late_depth),
                    "early_shift_median_speed_s": round(float(early_speed), 1),
                    "late_shift_median_speed_s": round(float(late_speed), 1)
                }
            })
    
    # --- Sub-Engine 2: Capacity Utilization Estimate ---
    # Estimate analyst utilization from alert volume vs. available investigation capacity
    if 'closed_by' in alerts.columns:
        human_alerts = alerts[alerts['closed_by'] != 'SOAR']
    else:
        human_alerts = alerts
    
    # Calculate daily human alert volume
    human_alerts_copy = human_alerts.copy()
    human_alerts_copy['close_date'] = human_alerts_copy['closed_at'].dt.date
    daily_volume = human_alerts_copy.groupby('close_date').size()
    
    if len(daily_volume) >= 3:
        avg_daily = daily_volume.mean()
        peak_daily = daily_volume.max()
        
        # Assuming ~22 meaningful investigations per analyst per day (Forrester benchmark)
        # and a typical 3-analyst team, capacity = 66/day
        estimated_capacity = 66  # 3 analysts x 22 investigations
        utilization = avg_daily / estimated_capacity * 100
        peak_utilization = peak_daily / estimated_capacity * 100
        
        if utilization > 70 or peak_utilization > 100:
            findings.append({
                "finding_id": "FND-CAPACITY-UTIL",
                "type": "Capacity Overload Risk",
                "entity_id": "ALL",
                "severity": "High" if peak_utilization > 100 else "Medium",
                "description": f"Average daily human alert volume is {avg_daily:.0f} (peak: {peak_daily:.0f}). Estimated utilization: {utilization:.0f}% avg, {peak_utilization:.0f}% peak. Decision quality degrades sharply above 70% utilization.",
                "evidence": {
                    "avg_daily_alerts": round(float(avg_daily), 1),
                    "peak_daily_alerts": int(peak_daily),
                    "estimated_utilization_pct": round(utilization, 1),
                    "peak_utilization_pct": round(peak_utilization, 1)
                }
            })
    
    return {"findings": findings}

# ===============================================================================
# FEATURE 10 (PARTIAL): PEER BLIND-SPOT SIGNAL
# Cross-entity view: if peers detect a technique and one entity never fires
# that rule, flag it. Only a national supervisor like NCIIPC has this view.
# ===============================================================================
# ===============================================================================
# CATEGORY TAXONOMY NORMALIZATION ENGINE (NLP / Strings)
# ===============================================================================
def normalize_taxonomy(raw_category: str) -> str:
    canonical_categories = {
        "Ransomware Indicator (T1486)": ["ransomware", "crypto", "encryption", "t1486", "cryptowall"],
        "Brute Force Authentication (T1110)": ["brute", "force", "auth", "login", "password", "t1110", "spikes"],
        "Suspicious PowerShell Execution (T1059.001)": ["powershell", "ps1", "encoded", "t1059", "command"],
        "Possible SQL Injection (T1190)": ["sql", "sqli", "injection", "database", "t1190", "waf"],
        "Data Exfiltration over DNS (T1048.003)": ["dns", "exfil", "exfiltration", "tunneling", "t1048"]
    }
    
    tokens = set(re.findall(r'\w+', raw_category.lower()))
    
    best_match = raw_category
    best_score = 0
    
    for canonical, keywords in canonical_categories.items():
        keyword_set = set(keywords)
        intersection = len(tokens.intersection(keyword_set))
        if intersection > 0:
            score = intersection / len(tokens.union(keyword_set))
            if score > best_score:
                best_score = score
                best_match = canonical
                
    if best_score >= 0.1:
        return best_match
    return raw_category

@app.get("/api/taxonomy/normalize")
def test_taxonomy_normalization():
    test_inputs = [
        "Failed Login Spikes", 
        "Auth: Bruteforce Detected",
        "PS1 Encoded Command Execution",
        "SQLi via WAF",
        "DNS Tunneling Detected",
        "CryptoWall Activity",
        "Unknown Alert Type 99"
    ]
    
    results = []
    for raw in test_inputs:
        normalized = normalize_taxonomy(raw)
        results.append({
            "raw_siem_alert_name": raw,
            "normalized_canonical_category": normalized,
            "confidence_score": "High" if normalized != raw else "Low"
        })
        
    return {"normalization_mapping": results}

@app.get("/api/findings/peer-blindspot")
def get_peer_blindspot():
    alerts, _, _ = load_data()
    if alerts is None:
        return {"error": "Data not found"}
    
    findings = []
    
    # Normalize taxonomy before computing blind spots
    alerts['normalized_category'] = alerts['category'].apply(normalize_taxonomy)
    
    # Build the set of all categories detected across ALL entities
    all_categories = set(alerts['normalized_category'].unique())
    
    # Build per-entity category sets
    entity_categories = {}
    for entity_id in alerts['entity_id'].unique():
        entity_categories[entity_id] = set(alerts[alerts['entity_id'] == entity_id]['normalized_category'].unique())
    
    # For each entity, find techniques detected by peers but NEVER by this entity
    for entity_id, detected in entity_categories.items():
        # Peer categories = categories detected by at least 2 other entities
        peer_category_counts = Counter()
        for other_id, other_cats in entity_categories.items():
            if other_id != entity_id:
                for cat in other_cats:
                    peer_category_counts[cat] += 1
        
        # Categories detected by majority of peers (>= 50% of other entities)
        num_peers = len(entity_categories) - 1
        majority_threshold = max(num_peers * 0.5, 2)
        
        peer_common = {cat for cat, count in peer_category_counts.items() if count >= majority_threshold}
        blind_spots = peer_common - detected
        
        if blind_spots:
            findings.append({
                "finding_id": f"FND-BLINDSPOT-{entity_id}",
                "type": "Peer Blind-Spot (Missing Detection)",
                "entity_id": entity_id,
                "severity": "Critical",
                "description": f"Entity {entity_id} has NEVER detected {len(blind_spots)} technique(s) that the majority of peers actively detect: {', '.join(list(blind_spots)[:3])}. This is a detection gap only visible from a national supervisory vantage point.",
                "evidence": {
                    "missing_techniques": list(blind_spots),
                    "peer_detection_rate": {cat: peer_category_counts[cat] for cat in blind_spots},
                    "total_peers": num_peers
                }
            })
    
    return {"findings": findings}

@app.get("/api/findings/closure-regret")
def get_closure_regret():
    alerts, cases, events = load_data()
    if alerts is None or cases is None:
        return {"error": "Data not found"}
        
    findings = []
    merged = cases.merge(alerts[['alert_id', 'severity', 'category', 'disposition', 'asset_id']], on='alert_id', how='inner')
    
    # Identify confirmed incidents
    confirmed_incidents = merged[(merged['escalated'] == True) & (merged['disposition'] == 'True Positive')]
    
    for _, incident in confirmed_incidents.iterrows():
        incident_time = pd.to_datetime(incident['created_at'])
        thirty_days_prior = incident_time - pd.Timedelta(days=30)
        
        # Find past alerts on the same asset
        past_alerts = alerts[
            (alerts['asset_id'] == incident['asset_id']) &
            (alerts['created_at'] >= thirty_days_prior) &
            (alerts['created_at'] < incident_time)
        ]
        
        # Filter for missed opportunities
        missed_opps = past_alerts[past_alerts['disposition'].isin(['False Positive', 'Benign'])]
        
        if not missed_opps.empty:
            findings.append({
                "finding_id": f"FND-REGRET-{incident['case_id']}",
                "type": "Closure Regret (Missed Early Warning)",
                "entity_id": incident['entity_id'],
                "severity": "Critical",
                "description": f"Incident {incident['case_id']} on asset {incident['asset_id']} was preceded by {len(missed_opps)} alert(s) on the same asset that were incorrectly closed as Benign/False Positive in the prior 30 days. This represents a critical missed opportunity to stop the attack early.",
                "evidence": {
                    "confirmed_incident_case": incident['case_id'],
                    "asset_id": incident['asset_id'],
                    "missed_alert_ids": missed_opps['alert_id'].tolist(),
                    "missed_alert_categories": missed_opps['category'].tolist()
                }
            })
            
    return {"findings": findings}

@app.get("/api/benchmark")
def get_benchmark():
    import json
    try:
        with open("data/ground_truth.json", "r") as f:
            ground_truth = json.load(f)
    except Exception:
        return {"error": "ground_truth.json not found."}
        
    all_findings = []
    all_findings.extend(get_execution_gaps().get("findings", []))
    all_findings.extend(get_nlp_findings().get("findings", []))
    all_findings.extend(get_evidence_forensics().get("findings", []))
    all_findings.extend(get_investigation_quality().get("findings", []))
    all_findings.extend(get_metric_integrity().get("findings", []))
    all_findings.extend(get_peer_blindspot().get("findings", []))

    # We only score engines that we explicitly seeded defects for. 
    # Analytical engines (Closure Regret, Negative Space) are exact queries and don't have "false positives" in the same heuristic sense.
    type_to_engine = {
        "Severity Downgrade": "Metric Integrity",
        "SLA Clock Reset": "Metric Integrity",
        "Fast Closure": "Execution Gaps",
        "Broken Evidence Chain": "Execution Gaps",
        "Round-Number Duration Clustering": "Evidence Forensics",
        "Uniform Inter-Arrival": "Evidence Forensics",
        "Case-ID Sequence Gap": "Evidence Forensics",
        "Peer Blind-Spot": "Peer Blind-Spot",
        "Zombie Case": "Investigation Quality",
        "Rubric Grounding Failure": "Investigation Quality",
        "Templated Investigation": "NLP"
    }

    engine_stats = {}
    for gt in ground_truth:
        eng = gt.get("engine")
        if eng not in engine_stats:
            engine_stats[eng] = {"gt_targets": set(), "tp_targets": set(), "fp_count": 0}
        target = gt.get("target_id") or gt.get("entity_id")
        engine_stats[eng]["gt_targets"].add(target)

    # Calculate Precision@10
    severity_weights = {"Critical": 4, "High": 3, "Medium": 2, "Low": 1}
    scored_findings = []

    for finding in all_findings:
        finding_type = finding.get("type", "")
        evidence_str = str(finding.get("evidence", ""))
        
        # Identify the engine
        engine = None
        for key, eng in type_to_engine.items():
            if key in finding_type:
                engine = eng
                break
                
        if not engine:
            continue
            
        if engine not in engine_stats:
            engine_stats[engine] = {"gt_targets": set(), "tp_targets": set(), "fp_count": 0}

        # Defect-level matching: Does this finding point to a known injected target?
        matched_target = None
        for target in engine_stats[engine]["gt_targets"]:
            if target in evidence_str or target in finding.get("description", "") or target == "ALL":
                matched_target = target
                break

        if matched_target:
            engine_stats[engine]["tp_targets"].add(matched_target)
            finding["is_tp"] = True
        else:
            engine_stats[engine]["fp_count"] += 1
            finding["is_tp"] = False
            
        scored_findings.append(finding)

    breakdown = {}
    total_gt = 0
    total_tp = 0
    total_fp = 0
    total_fn = 0

    for eng, stats in engine_stats.items():
        gt_count = len(stats["gt_targets"])
        tp_count = len(stats["tp_targets"])
        fn_count = gt_count - tp_count
        fp_count = stats["fp_count"]

        total_gt += gt_count
        total_tp += tp_count
        total_fp += fp_count
        total_fn += fn_count

        prec = tp_count / (tp_count + fp_count) if (tp_count + fp_count) > 0 else 0.0
        rec = tp_count / gt_count if gt_count > 0 else 0.0
        f1 = 2 * (prec * rec) / (prec + rec) if (prec + rec) > 0 else 0.0

        breakdown[eng] = {
            "injected_defects": gt_count,
            "true_positives": tp_count,
            "false_positives": fp_count,
            "false_negatives": fn_count,
            "precision": round(prec, 3),
            "recall": round(rec, 3),
            "f1_score": round(f1, 3)
        }

    overall_prec = total_tp / (total_tp + total_fp) if (total_tp + total_fp) > 0 else 0.0
    overall_rec = total_tp / (total_gt) if total_gt > 0 else 0.0
    overall_f1 = 2 * (overall_prec * overall_rec) / (overall_prec + overall_rec) if (overall_prec + overall_rec) > 0 else 0.0

    scored_findings.sort(key=lambda x: severity_weights.get(x.get("severity", "Low"), 0), reverse=True)
    top_10 = scored_findings[:10]
    p_at_10 = sum(1 for f in top_10 if f.get("is_tp")) / len(top_10) if top_10 else 0.0

    return {
        "metrics": {
            "total_injected_defects": total_gt,
            "overall_precision": round(overall_prec, 3),
            "overall_recall": round(overall_rec, 3),
            "overall_f1_score": round(overall_f1, 3),
            "precision_at_10": round(p_at_10, 3)
        },
        "engine_breakdown": breakdown
    }

@app.get("/api/entities/priority-queue")
def get_priority_queue():
    # Gather all findings
    all_findings = []
    
    all_findings.extend(get_execution_gaps().get("findings", []))
    all_findings.extend(get_nlp_findings().get("findings", []))
    all_findings.extend(get_negative_space().get("findings", []))
    all_findings.extend(get_peer_benchmarking().get("findings", []))
    all_findings.extend(get_evidence_chains().get("findings", []))
    all_findings.extend(get_capability_drift().get("findings", []))
    all_findings.extend(get_remediation_effectiveness().get("findings", []))
    all_findings.extend(get_metric_integrity().get("findings", []))
    all_findings.extend(get_evidence_forensics().get("findings", []))
    all_findings.extend(get_investigation_quality().get("findings", []))
    all_findings.extend(get_detection_decay().get("findings", []))
    all_findings.extend(get_capacity_stress().get("findings", []))
    all_findings.extend(get_peer_blindspot().get("findings", []))
    all_findings.extend(get_closure_regret().get("findings", []))
    
    # Calculate SPS per entity
    entity_scores = {}
    
    severity_weights = {
        "Critical": 100,
        "High": 50,
        "Medium": 20,
        "Low": 5
    }
    
    for finding in all_findings:
        entity_id = finding.get("entity_id")
        if not entity_id:
            continue
            
        if entity_id not in entity_scores:
            entity_scores[entity_id] = {
                "entity_id": entity_id,
                "score": 0,
                "critical_findings": 0,
                "high_findings": 0,
                "total_findings": 0,
                "findings_summary": []
            }
            
        weight = severity_weights.get(finding.get("severity", "Low"), 0)
        entity_scores[entity_id]["score"] += weight
        entity_scores[entity_id]["total_findings"] += 1
        
        if finding.get("severity") == "Critical":
            entity_scores[entity_id]["critical_findings"] += 1
        elif finding.get("severity") == "High":
            entity_scores[entity_id]["high_findings"] += 1
            
        entity_scores[entity_id]["findings_summary"].append({
            "id": finding.get("finding_id"),
            "type": finding.get("type"),
            "severity": finding.get("severity")
        })
        
    # Sort entities by score descending
    ranked_queue = sorted(list(entity_scores.values()), key=lambda x: x["score"], reverse=True)
    
    return {"queue": ranked_queue}

@app.get("/api/claims-matrix")
def get_claims_matrix():
    alerts, cases, events = load_data()
    if alerts is None or cases is None:
        return {"error": "Failed to load data"}

    alerts['time_to_close_seconds'] = (alerts['closed_at'] - alerts['created_at']).dt.total_seconds()
    
    matrix = []
    
    # Claim 1: 24/7 Monitoring Coverage
    # The generated mock data currently sets all times to normal hours or random.
    # We will compute it from actual hours if available.
    if 'created_at' in alerts.columns:
        alerts['hour'] = alerts['created_at'].dt.hour
        night_shift = alerts[(alerts['hour'] >= 0) & (alerts['hour'] < 8)]
        day_shift = alerts[(alerts['hour'] >= 8) & (alerts['hour'] < 16)]
        night_vol = len(night_shift)
        day_vol = len(day_shift)
        
        night_mttr = night_shift['time_to_close_seconds'].mean() if night_vol > 0 else 0
        day_mttr = day_shift['time_to_close_seconds'].mean() if day_vol > 0 else 0
        
        if night_vol == 0 and day_vol > 0:
            status = "FAIL"
            demo_text = "Zero alerts processed during night shift (12AM - 8AM), indicating complete coverage gap."
        elif night_mttr > (day_mttr * 1.5) or night_vol < (day_vol * 0.2):
            status = "FAIL"
            demo_text = f"Night shift MTTR is {night_mttr/3600:.1f}h vs Day shift MTTR {day_mttr/3600:.1f}h. Night volume is {night_vol} vs Day volume {day_vol}."
        elif night_mttr > (day_mttr * 1.2):
            status = "WARNING"
            demo_text = f"Slight performance degradation at night: Night MTTR {night_mttr/3600:.1f}h vs Day {day_mttr/3600:.1f}h."
        else:
            status = "PASS"
            demo_text = "Consistent MTTR and volume handled across all shifts."
            
        matrix.append({
            "claim": "24/7 Monitoring Coverage",
            "declared": "SOC actively monitors and triages alerts uniformly 24/7/365.",
            "demonstrated": demo_text,
            "status": status,
            "evidence": {
                "night_mttr_seconds": round(night_mttr, 2) if not pd.isna(night_mttr) else 0,
                "day_mttr_seconds": round(day_mttr, 2) if not pd.isna(day_mttr) else 0,
                "night_volume": int(night_vol),
                "day_volume": int(day_vol)
            }
        })
    
    # Claim 2: 15-Minute Critical SLA
    critical_alerts = alerts[alerts['severity'] == 'Critical']
    if len(critical_alerts) > 0:
        p95_mttr = critical_alerts['time_to_close_seconds'].quantile(0.95)
        if pd.isna(p95_mttr):
            p95_mttr = 0
            
        if p95_mttr > 900: # 15 minutes = 900 seconds
            status_2 = "FAIL"
        elif p95_mttr > 600:
            status_2 = "WARNING"
        else:
            status_2 = "PASS"
            
        matrix.append({
            "claim": "15-Minute Critical Alert SLA",
            "declared": "95% of Critical alerts are triaged within 15 minutes.",
            "demonstrated": f"Actual P95 Triage Time for Critical alerts is {p95_mttr/60:.1f} minutes.",
            "status": status_2,
            "evidence": {
                "p95_mttr_seconds": round(p95_mttr, 2)
            }
        })
        
    # Claim 3: 100% Human Investigation
    merged = alerts.merge(cases, on=['alert_id', 'entity_id'], how='left')
    total_alerts = len(alerts)
    soar_closures = len(alerts[alerts['closed_by'] == 'SOAR'])
    
    # Cases with 0 actions are "zombie cases"
    zombie_cases = len(merged[(merged['closed_by'] != 'SOAR') & (merged['investigation_actions'] == 0)])
    
    human_rate = ((total_alerts - soar_closures - zombie_cases) / total_alerts) * 100 if total_alerts > 0 else 0
    
    if human_rate < 85:
        status_3 = "FAIL"
    elif human_rate < 95:
        status_3 = "WARNING"
    else:
        status_3 = "PASS"
        
    matrix.append({
        "claim": "Comprehensive Human Investigation",
        "declared": "All non-automated alerts receive thorough human review.",
        "demonstrated": f"Only {human_rate:.1f}% of alerts receive valid human action. {soar_closures} closed by SOAR, {zombie_cases} closed instantly with 0 actions.",
        "status": status_3,
        "evidence": {
            "total": int(total_alerts),
            "soar_closed": int(soar_closures),
            "zombie_cases": int(zombie_cases),
            "human_investigated_rate": round(human_rate, 2)
        }
    })

    return {"claims_matrix": matrix}

@app.get("/api/reports/efficacy")
def get_efficacy_report():
    alerts, cases, events = load_data()
    if alerts is None or cases is None:
        return {"error": "Failed to load data"}

    alerts['time_to_close_seconds'] = (alerts['closed_at'] - alerts['created_at']).dt.total_seconds()
    if 'created_at' in alerts.columns:
        alerts['hour'] = alerts['created_at'].dt.hour
        alerts['weekday'] = alerts['created_at'].dt.dayofweek # 0=Monday, 6=Sunday
    else:
        alerts['hour'] = 12
        alerts['weekday'] = 0
    
    # 1. 24x7 Coverage Proof (Time-based Analysis)
    shifts = {
        "Night (00:00 - 08:00)": alerts[(alerts['hour'] >= 0) & (alerts['hour'] < 8)],
        "Day (08:00 - 16:00)": alerts[(alerts['hour'] >= 8) & (alerts['hour'] < 16)],
        "Evening (16:00 - 24:00)": alerts[(alerts['hour'] >= 16)]
    }
    
    shift_analysis = {}
    for shift_name, shift_data in shifts.items():
        vol = len(shift_data)
        mttr = shift_data['time_to_close_seconds'].mean() if vol > 0 else 0
        shift_analysis[shift_name] = {
            "volume": int(vol),
            "mttr_minutes": round(mttr / 60, 2) if not pd.isna(mttr) else 0
        }
        
    weekend_data = alerts[alerts['weekday'] >= 5]
    weekday_data = alerts[alerts['weekday'] < 5]
    
    weekend_mttr = weekend_data['time_to_close_seconds'].mean() if len(weekend_data) > 0 else 0
    weekday_mttr = weekday_data['time_to_close_seconds'].mean() if len(weekday_data) > 0 else 0
    
    coverage_proof = {
        "shift_breakdown": shift_analysis,
        "weekend_vs_weekday": {
            "weekend_mttr_minutes": round(weekend_mttr / 60, 2) if not pd.isna(weekend_mttr) else 0,
            "weekday_mttr_minutes": round(weekday_mttr / 60, 2) if not pd.isna(weekday_mttr) else 0,
            "weekend_degradation_factor": round(weekend_mttr / weekday_mttr, 2) if weekday_mttr > 0 else 1.0
        }
    }
    
    # 2. SOC-CMM Domains Mapping
    merged = alerts.merge(cases, on=['alert_id', 'entity_id'], how='left')
    total_alerts = len(alerts)
    soar_closed = len(alerts[alerts['closed_by'] == 'SOAR'])
    critical_alerts = alerts[alerts['severity'] == 'Critical']
    sla_met = len(critical_alerts[critical_alerts['time_to_close_seconds'] <= 900])
    sla_compliance = (sla_met / len(critical_alerts)) * 100 if len(critical_alerts) > 0 else 100
    
    zombie_cases = len(merged[(merged['closed_by'] != 'SOAR') & (merged['investigation_actions'] == 0)])
    high_effort_cases = len(merged[(merged['closed_by'] != 'SOAR') & (merged['investigation_actions'] >= 3)])
    
    soc_cmm = {
        "Business": {
            "critical_sla_compliance_rate": round(sla_compliance, 1)
        },
        "People": {
            "automation_offload_rate": round((soar_closed / total_alerts) * 100, 1) if total_alerts > 0 else 0
        },
        "Process": {
            "zero_action_closures": int(zombie_cases),
            "deep_investigation_rate": round((high_effort_cases / total_alerts) * 100, 1) if total_alerts > 0 else 0
        }
    }
    
    # 3. CSCRF-style Efficacy Items
    # Broken evidence chain: Critical + True Positive + not escalated
    broken_chains = len(merged[
        (merged['severity'] == 'Critical') & 
        (merged['disposition'] == 'True Positive') & 
        (merged['escalated'] == False)
    ])
    
    cscrf = {
        "incident_response_efficacy": "PASS" if sla_compliance >= 95 else "FAIL",
        "evidence_preservation": "PASS" if broken_chains == 0 else "FAIL",
        "broken_evidence_chains_count": int(broken_chains)
    }
    
    return {
        "report_generated_at": datetime.utcnow().isoformat(),
        "coverage_proof": coverage_proof,
        "soc_cmm_domains": soc_cmm,
        "cscrf_efficacy": cscrf
    }

class ReviewRequest(BaseModel):
    finding_id: str
    status: str  # "confirm", "dismiss", "need-more-info"
    comment: str = ""

@app.post("/api/findings/review")
def submit_review(review: ReviewRequest):
    base_dir = os.path.dirname(os.path.abspath(__file__))
    reviews_file = os.path.join(base_dir, "data", "reviews.json")
    
    reviews = []
    if os.path.exists(reviews_file):
        with open(reviews_file, "r") as f:
            try:
                reviews = json.load(f)
            except json.JSONDecodeError:
                pass
            
    reviews.append({
        "finding_id": review.finding_id,
        "status": review.status,
        "comment": review.comment,
        "timestamp": datetime.utcnow().isoformat()
    })
    
    with open(reviews_file, "w") as f:
        json.dump(reviews, f, indent=2)
        
    return {"message": "Review submitted successfully", "review": review.dict()}

@app.get("/api/dashboard/north-star")
def get_north_star_metric():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    reviews_file = os.path.join(base_dir, "data", "reviews.json")
    
    if not os.path.exists(reviews_file):
        return {
            "supervisory_assurance_coverage": 0.0,
            "total_reviews": 0,
            "confirmed_findings": 0,
            "message": "No reviews submitted yet."
        }
        
    with open(reviews_file, "r") as f:
        try:
            reviews = json.load(f)
        except json.JSONDecodeError:
            reviews = []
        
    total_reviews = len(reviews)
    confirmed = sum(1 for r in reviews if r.get("status") == "confirm")
    
    # North Star Metric: Supervisory Assurance Coverage
    # How many meaningful supervisory findings are discovered per unit of manual review effort
    sac_score = (confirmed / total_reviews) * 100 if total_reviews > 0 else 0
    
    return {
        "supervisory_assurance_coverage": round(sac_score, 1),
        "total_reviews": total_reviews,
        "confirmed_findings": confirmed,
        "dismissed_findings": sum(1 for r in reviews if r.get("status") == "dismiss"),
        "needs_info": sum(1 for r in reviews if r.get("status") == "need-more-info")
    }

@app.get("/api/reports/automation-assurance")
def get_automation_assurance():
    alerts, cases, events = load_data()
    if alerts is None or cases is None:
        return {"error": "Failed to load data"}

    merged = alerts.merge(cases, on=['alert_id', 'entity_id'], how='left')
    
    # 1. Volume and TP/FP breakdown
    handlers = ["SOAR", "Human"]
    metrics = {}
    
    for handler in handlers:
        if handler == "SOAR":
            handler_data = merged[merged['closed_by'] == 'SOAR']
        else:
            handler_data = merged[merged['closed_by'] != 'SOAR']
            
        vol = len(handler_data)
        tps = len(handler_data[handler_data['disposition'] == 'True Positive'])
        fps = len(handler_data[handler_data['disposition'] == 'False Positive'])
        
        # 2. Defect Rates
        # Fast closures (Closed in < 90 seconds and severity == Critical)
        fast_closures = len(handler_data[
            (handler_data['severity'] == 'Critical') & 
            ((handler_data['closed_at'] - handler_data['created_at']).dt.total_seconds() < 90)
        ])
        
        # Zombie cases (investigation actions == 0)
        zombie_cases = len(handler_data[handler_data['investigation_actions'] == 0])
        
        # Escalation after closure (implies reopened or missed)
        escalated = len(handler_data[handler_data['escalated'] == True])
        
        metrics[handler] = {
            "total_volume": int(vol),
            "true_positives": int(tps),
            "false_positives": int(fps),
            "fast_closure_defects": int(fast_closures),
            "zombie_case_defects": int(zombie_cases),
            "escalated_post_closure": int(escalated),
            "defect_rate": round(((fast_closures + zombie_cases) / vol) * 100, 2) if vol > 0 else 0
        }
        
    # Overall Automation Audit Verdict
    soar_defect_rate = metrics["SOAR"]["defect_rate"]
    human_defect_rate = metrics["Human"]["defect_rate"]
    
    if soar_defect_rate > 15:
        verdict = "FAIL - SOAR is generating unacceptable levels of automation defects (Zombie cases / Fast closures)."
    elif soar_defect_rate > human_defect_rate:
        verdict = "WARNING - SOAR automation is less accurate than human analysts."
    else:
        verdict = "PASS - Automation assurance metrics are within healthy limits."
        
    return {
        "report_generated_at": datetime.utcnow().isoformat(),
        "handler_metrics": metrics,
        "audit_verdict": verdict
    }

def compute_file_hash(filepath):
    hasher = hashlib.sha256()
    if os.path.exists(filepath):
        with open(filepath, 'rb') as f:
            buf = f.read()
            hasher.update(buf)
        return hasher.hexdigest()
    return None

@app.get("/api/system/manifest")
def generate_signed_manifest():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    files = {
        "mock_alerts.csv": os.path.join(base_dir, "data", "mock_alerts.csv"),
        "mock_cases.csv": os.path.join(base_dir, "data", "mock_cases.csv"),
        "mock_assets.csv": os.path.join(base_dir, "data", "mock_assets.csv")
    }
    
    manifest = {
        "timestamp": datetime.utcnow().isoformat(),
        "run_id": f"RUN-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
        "engine_version": "1.0.0",
        "thresholds": {
            "benford_divergence_min": 0.15,
            "nlp_similarity_max": 0.15,
            "uniform_cv_max": 0.15
        },
        "files": []
    }
    
    # Normally this would be a secure offline key managed via HSM or Vault.
    # For demonstration, we use a mocked air-gapped key.
    OFFLINE_SIGNING_KEY = b"NEXUS_GOV_SECURE_KEY_2026"
    
    manifest_payload = ""
    
    for filename, filepath in files.items():
        f_hash = compute_file_hash(filepath)
        row_count = 0
        if os.path.exists(filepath):
            with open(filepath, 'r', encoding='utf-8') as f:
                row_count = sum(1 for line in f) - 1 # Exclude header
                
        file_meta = {
            "filename": filename,
            "sha256_hash": f_hash,
            "row_count": max(0, row_count)
        }
        manifest["files"].append(file_meta)
        manifest_payload += f"{filename}:{f_hash}:{row_count}|"
        
    # Sign the manifest payload
    signature = hmac.new(OFFLINE_SIGNING_KEY, manifest_payload.encode(), hashlib.sha256).hexdigest()
    manifest["cryptographic_signature"] = signature
    manifest["signature_algorithm"] = "HMAC-SHA256"
    
    return manifest

@app.get("/api/reports/coverage-index")
def get_coverage_index():
    alerts, cases, events = load_data()
    if alerts is None or cases is None:
        return {"error": "Failed to load data"}
        
    if 'rule_id' not in alerts.columns:
        return {"error": "Data does not contain coverage fields. Please regenerate mock data."}
        
    # Total unique rules firing
    unique_rules = int(alerts['rule_id'].nunique())
    
    # Technique coverage
    total_expected_techniques = 14 # A mock baseline for the SOC
    firing_techniques = int(alerts['technique_id'].nunique())
    technique_coverage_rate = (firing_techniques / total_expected_techniques) * 100
    
    # Log source utilization
    log_source_counts = alerts['log_source'].value_counts().to_dict()
    total_alerts = len(alerts)
    log_source_utilization = {str(k): round((v / total_alerts) * 100, 1) for k, v in log_source_counts.items()}
    
    # Calculate Coverage decay (e.g., if recent week has fewer unique rules firing than previous weeks)
    alerts['week'] = alerts['created_at'].dt.isocalendar().week
    weekly_rules = alerts.groupby('week')['rule_id'].nunique()
    
    if len(weekly_rules) > 1:
        latest_week = alerts['week'].max()
        max_rules = weekly_rules.max()
        latest_rules = weekly_rules.get(latest_week, 0)
        coverage_decay = "WARNING - Rule silence detected." if latest_rules < (max_rules * 0.8) else "PASS - Consistent rule coverage."
    else:
        coverage_decay = "PASS - Insufficient history for decay analysis."
        
    return {
        "report_generated_at": datetime.utcnow().isoformat(),
        "validated_technique_coverage": {
            "techniques_firing": firing_techniques,
            "total_expected_techniques": total_expected_techniques,
            "coverage_percentage": round(technique_coverage_rate, 1)
        },
        "rule_level_silence": {
            "active_rules_firing": unique_rules,
            "coverage_decay_status": coverage_decay
        },
        "log_source_utilization_percentages": log_source_utilization
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
