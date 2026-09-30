import re

with open('backend/main.py', 'r', encoding='utf-8') as f:
    content = f.read()

new_nlp = '''@app.get("/api/findings/nlp-templated")
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
        t = re.sub(r'\\b\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\b', '[IP]', t)
        t = re.sub(r'\\bAST-\\S+', '[ASSET]', t)
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
        
        # DBSCAN clustering. eps=0.20 to catch lazy paraphrases
        clustering = DBSCAN(eps=0.20, min_samples=2, metric='precomputed').fit(distance_matrix)
        
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
        
    return {"findings": findings}'''

pattern = re.compile(r'@app\.get\("/api/findings/nlp-templated"\)\ndef get_nlp_findings\(\):.*?(?=@app\.get|\Z)', re.DOTALL)
content = pattern.sub(lambda m: new_nlp + '\n\n', content)

with open('backend/main.py', 'w', encoding='utf-8') as f:
    f.write(content)
