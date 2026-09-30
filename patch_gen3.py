import re

with open('backend/generate_mock_data.py', 'r', encoding='utf-8') as f:
    content = f.read()

new_logic = '''
            # Generate highly varied honest text so they don't cluster semantically
            import random
            actions = ["Checked", "Verified", "Analyzed", "Reviewed", "Investigated", "Scanned"]
            targets = ["logs", "system telemetry", "network traffic", "EDR alerts", "user activity"]
            findings = ["no anomalies", "nothing suspicious", "clean results", "normal baseline", "benign behavior"]
            conclusions = ["Host seems unaffected", "No malicious processes running", "System is safe", "False alarm"]
            
            p1 = f"{random.choice(actions)} {random.choice(targets)} for {cat} targeting {host}. "
            p2 = f"Looked up IP {ip} in threat intel and found {random.choice(findings)}. "
            p3 = f"{random.choice(conclusions)}. "
            
            investigation_text = p1 + p2 + p3 + f"Closed as {disp}."
            investigation_actions = random.randint(3, 15)
'''

pattern = re.compile(r'if analyst == "Analyst-A":.*?investigation_actions = random\.randint\(3, 15\)', re.DOTALL)
content = pattern.sub(new_logic.strip(), content)

with open('backend/generate_mock_data.py', 'w', encoding='utf-8') as f:
    f.write(content)
