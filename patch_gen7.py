import re

with open('backend/generate_mock_data.py', 'r', encoding='utf-8') as f:
    content = f.read()

# 2. Patch the honest block
honest_logic = '''
            import random
            analyst_a_templates = [
                f"Triage of {cat} on {host}. The firewall successfully dropped the incoming malicious payload. Closed as {disp}.",
                f"I called the user about {cat} on {host} and they confirmed they initiated the action. {disp}.",
                f"Checking {cat}: Registry keys on {host} were completely untouched. Safe to close as {disp}.",
                f"Reviewed {cat}. VPN logs show the login to {host} originated from a known corporate IP. Marking {disp}.",
                f"The antivirus on {host} quarantined the file related to {cat} before it could execute. {disp}.",
                f"We monitored the network traffic for {host} after {cat} for 30 minutes and saw no lateral movement. {disp}.",
                f"The {cat} alert was triggered by a known vulnerability scanner running a routine scan on {host}. {disp}.",
                f"I cross-referenced the {cat} hash for {host} with VirusTotal and it came back clean. {disp}.",
                f"The user's account on {host} was locked out after 5 failed attempts during {cat}. Handled as {disp}.",
                f"No signs of data exfiltration were found in the proxy logs for {host} regarding {cat}. {disp}.",
                f"The {host} was isolated from the network as a precaution for {cat}. {disp}.",
                f"I escalated {cat} on {host} to the tier 3 team for further malware analysis. {disp}.",
                f"The phishing email ({cat}) was deleted from all inboxes on {host} via PowerShell script. {disp}.",
                f"We found a scheduled task on {host} that was created by the attacker during {cat}. {disp}.",
                f"The SIEM rule that fired {cat} on {host} needs to be tuned to reduce noise. {disp}."
            ]
            
            analyst_d_templates = [
                f"Reviewing {cat} on {host}. Event telemetry looks normal. Marked {disp}.",
                f"Investigated {cat}. The asset {host} is functioning as expected. Closed as {disp}.",
                f"Scanned {host} for {cat} indicators. No matching signatures found. {disp}.",
                f"Analyzed {cat} alert. Traffic to {host} was blocked by IPS. {disp}.",
                f"Checked {host} after {cat}. System logs show standard administrative activity. {disp}.",
                f"Verified {cat} on {host}. The process was spawned by a legitimate software update. {disp}.",
                f"Monitored {host} for {cat}. CPU and memory usage are within normal bounds. {disp}.",
                f"The {cat} on {host} is a known false positive from our internal scanning tool. {disp}.",
                f"Reviewed EDR alerts for {host} regarding {cat}. Nothing actionable. {disp}.",
                f"The {cat} incident on {host} was resolved by the automated remediation script. {disp}."
            ]
            
            if analyst == "Analyst-A":
                investigation_text = random.choice(analyst_a_templates)
                investigation_actions = random.randint(3, 15)
            elif analyst == "Analyst-B":
                if random.random() < 0.25:
                    investigation_text = f"Standard routine check completed for {cat} on {host}. No anomalies detected in the current telemetry window. Closed as {disp}."
                else:
                    investigation_text = f"Check for {cat} on {host}. IP {ip} checked. Clean. {disp}."
                investigation_actions = 7
            elif analyst == "Analyst-D":
                investigation_text = random.choice(analyst_d_templates)
                investigation_actions = random.randint(3, 15)
            else:
                investigation_text = f"Analyzed {cat} on {host}. Source IP {ip} was checked. Host contained. {disp}."
                investigation_actions = random.randint(3, 15)
'''
pattern2 = re.compile(r'import uuid.*?investigation_actions = random\.randint\(3, 15\)', re.DOTALL)
content = pattern2.sub(honest_logic.strip(), content)

with open('backend/generate_mock_data.py', 'w', encoding='utf-8') as f:
    f.write(content)
