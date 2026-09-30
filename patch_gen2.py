import re

with open('backend/generate_mock_data.py', 'r', encoding='utf-8') as f:
    content = f.read()

new_logic = '''
            if analyst == "Analyst-A":
                investigation_text = f"Triage complete for {cat} targeting {host}. Looked up IP {ip} in VirusTotal and found no recent reports. Host seems unaffected. No processes were quarantined. Marking as {disp}."
            elif analyst == "Analyst-B":
                investigation_text = f"[{alert['created_at'][:16]}] Triage: {cat} on {host}. IP {ip} checked via CrowdStrike. No malicious processes running. Host contained just in case. Resolving as {disp}."
            elif analyst == "Analyst-D":
                investigation_text = f"Reviewing {cat} event. Asset: {host}, Src: {ip}. EDR telemetry is clean. No indicators isolated. Closed as {disp}."
            else:
                investigation_text = f"Analyzed {cat} on {host}. Source IP {ip} was checked. CrowdStrike sensor logged process execution tree. Host contained. Closed as {disp}."
            
            investigation_actions = random.randint(3, 15)
'''

pattern = re.compile(r'if analyst == "Analyst-A":.*?investigation_actions = random\.randint\(1, 15\)', re.DOTALL)
content = pattern.sub(new_logic.strip(), content)

with open('backend/generate_mock_data.py', 'w', encoding='utf-8') as f:
    f.write(content)
