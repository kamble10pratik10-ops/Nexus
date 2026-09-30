import sys

with open('backend/generate_mock_data.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
skip = False
for i, line in enumerate(lines):
    if "elif idx % 7 == 0:" in line and "lazy_templates" in lines[i+1]:
        skip = True
        new_lines.append('''        # Inject the lazy "templated" text for NLP to catch
        elif alert.get("closed_by") == "Analyst-C" and random.random() < 0.6:
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
''')
    elif "elif idx % 9 == 0:" in line and "SOAR PLAYBOOK" in lines[i+1]:
        skip = True
        new_lines.append('''        # Add Hard Negatives: Legitimate SOAR templates that shouldn't be flagged as lazy
        elif idx % 9 == 0:
            investigation_text = f"SOAR PLAYBOOK EXECUTION: Analyzed alert. Benign administrative behavior. IP {alert.get('native_ioc', '127.0.0.1')} verified against internal allowlist. Auto-closed."
            investigation_actions = 5
            # We DO NOT append to ground truth here because it's a hard negative (legit)
''')
    elif "if \"SQL\" in alert[\"category\"]:" in line and "good_templates_sql" in lines[i+1]:
        skip = True
        new_lines.append('''            analyst = alert.get("closed_by", "Unknown")
            cat = alert.get("category", "alert")
            host = alert.get("asset_id", "host")
            ip = cited_ip
            disp = alert.get("disposition", "Unknown")
            
            import random, string
            def get_rand(): return ''.join(random.choices(string.ascii_letters, k=15))
            
            if analyst == "Analyst-A":
                investigation_text = f"Triage of {cat} on {host}. {get_rand()} {get_rand()}. Closed as {disp}."
                investigation_actions = random.randint(3, 15)
            elif analyst == "Analyst-B":
                if random.random() < 0.25:
                    investigation_text = f"Standard routine check completed for {cat} on {host}. No anomalies detected in the current telemetry window. Closed as {disp}."
                else:
                    investigation_text = f"Check for {cat} on {host}. IP {ip} checked. {get_rand()} {get_rand()}. {disp}."
                investigation_actions = 7
            elif analyst == "Analyst-D":
                investigation_text = f"Reviewing {cat} on {host}. Event telemetry looks normal. {get_rand()} {get_rand()}. Marked {disp}."
                investigation_actions = random.randint(3, 15)
            else:
                investigation_text = f"Analyzed {cat} on {host}. Source IP {ip} was checked. Host contained. {get_rand()}. {disp}."
                investigation_actions = random.randint(3, 15)
''')
    elif skip:
        if "else:" in line and "Rubric Grounding Defect Injection" in lines[i+1]:
            skip = False
            new_lines.append(line)
        elif "escalated = random.choice([True, False, False])" in line:
            skip = False
            new_lines.append(line)
    else:
        new_lines.append(line)

with open('backend/generate_mock_data.py', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
