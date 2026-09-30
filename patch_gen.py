import re
import random

with open('backend/generate_mock_data.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the lazy templates logic
new_logic = '''
        # Inject the lazy "templated" text for NLP to catch
        elif alert.get("closed_by") == "Analyst-C" and random.random() < 0.6:
            # Randomly paraphrase the lazy template
            base = "I looked at the logs and saw nothing bad. The system is fine. Closing this."
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
            investigation_text = f"SOAR PLAYBOOK EXECUTION: Analyzed alert. Benign administrative behavior. IP {cited_ip} verified against internal allowlist. Auto-closed."
            investigation_actions = 5
            # We DO NOT append to ground truth here because it's a hard negative (legit)
        # Add Hard Negatives: Honest human repetition
        elif alert.get("closed_by") == "Analyst-B" and random.random() < 0.2:
            investigation_text = "Standard routine check completed for this asset class. No anomalies detected in the current telemetry window."
            investigation_actions = 7
            # DO NOT append to ground truth - this is a legit boilerplate used by a careful analyst
'''

# Find the block from Feature 3 injection up to the else statement
pattern = re.compile(r'# Inject the lazy.*?else:', re.DOTALL)
content = pattern.sub(new_logic.strip() + '\n        else:', content)

with open('backend/generate_mock_data.py', 'w', encoding='utf-8') as f:
    f.write(content)
