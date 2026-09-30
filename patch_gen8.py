import re

with open('backend/generate_mock_data.py', 'r', encoding='utf-8') as f:
    content = f.read()

honest_logic = '''
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
'''

pattern = re.compile(r'import random\s+analyst_a_templates.*?investigation_actions = random\.randint\(3, 15\)', re.DOTALL)
content = pattern.sub(honest_logic.strip(), content)

with open('backend/generate_mock_data.py', 'w', encoding='utf-8') as f:
    f.write(content)
