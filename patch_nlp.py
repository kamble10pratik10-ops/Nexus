import re

with open('backend/main.py', 'r', encoding='utf-8') as f:
    content = f.read()

new_nlp = '''@app.get("/api/findings/nlp")
def get_nlp_findings():
    alerts, cases, events = load_data()
    if cases is None or cases.empty:
        return {"error": "Data not found"}
        
    findings = []
    
    # We will use sentence-transformers to find clusters of near-identical text
    try:
        from sentence_transformers import SentenceTransformer
        from sklearn.cluster import DBSCAN
        from sklearn.metrics.pairwise import cosine_distances
        import numpy as np
        import pandas as pd
    except ImportError:
        return {"error": "Missing NLP dependencies"}
        
    # Join cases with alerts to get the actor (closed_by) and entity_id
    cases_ext = pd.merge(cases, alerts[['alert_id', 'entity_id', 'closed_by']], on='alert_id', how='left')
    
    # Filter cases with meaningful text
    valid_cases = cases_ext.dropna(subset=['investigation_text']).copy()
    valid_cases = valid_cases[valid_cases['investigation_text'].str.len() > 15].copy()
    
    if valid_cases.empty:
        return {"findings": []}
        
    model = SentenceTransformer('all-MiniLM-L6-v2')
    texts = valid_cases['investigation_text'].tolist()
    embeddings = model.encode(texts)
    
    # DBSCAN clustering with a tight threshold (cosine distance < 0.05 means highly similar)
    distance_matrix = cosine_distances(embeddings)
    clustering = DBSCAN(eps=0.05, min_samples=2, metric='precomputed').fit(distance_matrix)
    
    valid_cases['cluster_id'] = clustering.labels_
    
    # Compute reuse rate per analyst (closed_by)
    # A case is "reused" if it belongs to any cluster (cluster_id != -1)
    analyst_stats = []
    for analyst, group in valid_cases.groupby('closed_by'):
        if analyst == 'SOAR':
            continue
        total_cases = len(group)
        reused_cases = len(group[group['cluster_id'] != -1])
        reuse_rate = reused_cases / total_cases if total_cases > 0 else 0
        analyst_stats.append({
            'analyst': analyst,
            'total_cases': total_cases,
            'reused_cases': reused_cases,
            'reuse_rate': reuse_rate,
            'reused_case_ids': group[group['cluster_id'] != -1]['case_id'].tolist(),
            'entity_id': group['entity_id'].iloc[0] if not group.empty else 'Unknown'
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
            "description": f"Analyst {row['analyst']} has an unusually high rate of copy-pasted investigations ({row['reuse_rate']*100:.1f}%, z={row['robust_z']:.2f}).",
            "evidence": {
                "analyst": row['analyst'],
                "reuse_rate": row['reuse_rate'],
                "case_ids": row['reused_case_ids']
            }
        })
        
    return {"findings": findings}'''

pattern = re.compile(r'@app\.get\("/api/findings/nlp"\)\ndef get_nlp_findings\(\):.*?(?=@app\.get|\Z)', re.DOTALL)
content = pattern.sub(new_nlp + '\n\n', content)

with open('backend/main.py', 'w', encoding='utf-8') as f:
    f.write(content)
