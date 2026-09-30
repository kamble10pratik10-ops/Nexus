import re

with open('backend/generate_mock_data.py', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Patch lazy paraphrasing and SOAR (Lines 228-243 in original, but I'll use regex to match the inject lazy block)
lazy_logic = '''
        # Inject the lazy "templated" text for NLP to catch
        elif alert.get("closed_by") == "Analyst-C" and random.random() < 0.6:
            # Randomly paraphrase the lazy template
            paraphrases = [
                "I looked at the logs and saw nothing bad. The system is fine. Closing this.",
                "Checked the logs and saw nothing bad. System looks fine. Closing this.",
                "Looked at logs, saw nothing bad. The system is fine, closing.",
                "I reviewed the logs, nothing bad seen. System fine. Closing this out."
            ]
            investigation_text = random.choice(paraphrases)
            investigation_actions = random.randint(1, 3)
            ground_truth.append({
                "engine": "NLP", "type": "Templated Investigation (Semantic)",
                "entity_id": alert["entity_id"], "target_id": case_id
            })
        # Add Hard Negatives: Legitimate SOAR templates that shouldn't be flagged as lazy
        elif idx % 9 == 0:
            investigation_text = f"SOAR PLAYBOOK EXECUTION: Analyzed alert. Benign administrative behavior. IP {alert.get('native_ioc', '127.0.0.1')} verified against internal allowlist. Auto-closed."
            investigation_actions = 5
'''
pattern1 = re.compile(r'# Inject the lazy "templated" text.*?investigation_actions = random\.randint\(1, 3\)', re.DOTALL)
content = pattern1.sub(lazy_logic.strip(), content)

# 2. Patch the honest block
honest_logic = '''
            import uuid
            if analyst == "Analyst-A":
                investigation_text = f"Triage of {cat} on {host}. IP {ip} checked. Unique trace: {uuid.uuid4()}. Safe."
                investigation_actions = random.randint(3, 15)
            elif analyst == "Analyst-B":
                if random.random() < 0.25:
                    investigation_text = f"Standard routine check completed for {cat}. No anomalies detected in the current telemetry window."
                else:
                    investigation_text = f"Check for {cat} on {host}. IP {ip} checked. Unique trace: {uuid.uuid4()}. Clean."
                investigation_actions = 7
            elif analyst == "Analyst-D":
                investigation_text = f"Reviewing {cat}. IP {ip} checked. Trace: {uuid.uuid4()}. Marked {disp}."
                investigation_actions = random.randint(3, 15)
            else:
                investigation_text = f"Analyzed {cat} on {host}. Source IP {ip} was checked. Trace: {uuid.uuid4()}."
                investigation_actions = random.randint(3, 15)
'''
pattern2 = re.compile(r'if analyst == "Analyst-A":.*?investigation_actions = random\.randint\(1, 15\)', re.DOTALL)
content = pattern2.sub(honest_logic.strip(), content)

with open('backend/generate_mock_data.py', 'w', encoding='utf-8') as f:
    f.write(content)
