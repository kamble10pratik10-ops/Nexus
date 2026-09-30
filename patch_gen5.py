import re

with open('backend/generate_mock_data.py', 'r', encoding='utf-8') as f:
    content = f.read()

new_logic = '''
            import random
            
            if analyst == "Analyst-A":
                # completely unique text so they never cluster
                import uuid
                investigation_text = f"Triage of {cat} on {host}. Unique trace: {uuid.uuid4()}. Safe."
                investigation_actions = random.randint(3, 15)
                
            elif analyst == "Analyst-B":
                # Honest repetition: 25% of cases use the exact same template
                if random.random() < 0.25:
                    investigation_text = f"Standard routine check completed for {cat}. No anomalies detected in the current telemetry window."
                else:
                    import uuid
                    investigation_text = f"Check for {cat} on {host}. Unique trace: {uuid.uuid4()}. Clean."
                investigation_actions = 7
                
            elif analyst == "Analyst-D":
                import uuid
                investigation_text = f"Reviewing {cat}. Trace: {uuid.uuid4()}. Marked {disp}."
                investigation_actions = random.randint(3, 15)
            else:
                import uuid
                investigation_text = f"Analyzed {cat} on {host}. Source IP {ip} was checked. Trace: {uuid.uuid4()}."
                investigation_actions = random.randint(3, 15)
'''

pattern = re.compile(r'import random.*?investigation_actions = random\.randint\(3, 15\)', re.DOTALL)
content = pattern.sub(new_logic.strip(), content)

with open('backend/generate_mock_data.py', 'w', encoding='utf-8') as f:
    f.write(content)
