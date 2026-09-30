import re

with open('backend/generate_mock_data.py', 'r', encoding='utf-8') as f:
    content = f.read()

new_logic = '''
            import random
            diverse_sentences = [
                "The firewall successfully dropped the incoming malicious payload.",
                "I called the user on their cell phone and they confirmed they initiated the reset.",
                "Registry keys on the host machine were completely untouched.",
                "Checked the VPN logs and the login originated from a known corporate IP.",
                "The antivirus quarantined the file before it could execute.",
                "We monitored the network traffic for 30 minutes and saw no lateral movement.",
                "The alert was triggered by a known vulnerability scanner running a routine scan.",
                "I cross-referenced the hash with VirusTotal and it came back clean.",
                "The user's account was locked out after 5 failed attempts.",
                "No signs of data exfiltration were found in the proxy logs.",
                "The host was isolated from the network as a precaution.",
                "I escalated this to the tier 3 team for further malware analysis.",
                "The phishing email was deleted from all inboxes via PowerShell script.",
                "We found a scheduled task that was created by the attacker.",
                "The SIEM rule that fired this alert needs to be tuned to reduce noise."
            ]
            
            if analyst == "Analyst-A":
                # Very diverse, won't cluster
                investigation_text = f"Triage of {cat} on {host}. " + " ".join(random.sample(diverse_sentences, 3)) + f" Closed as {disp}."
                investigation_actions = random.randint(3, 15)
                
            elif analyst == "Analyst-B":
                # Boilerplate (honest but repetitive)
                investigation_text = f"Standard routine check completed for {cat} on {host}. IP {ip} checked. No anomalies detected in the current telemetry window. Closed as {disp}."
                investigation_actions = 7
                
            elif analyst == "Analyst-D":
                investigation_text = f"Reviewing {cat}. " + " ".join(random.sample(diverse_sentences, 2)) + f" Marked {disp}."
                investigation_actions = random.randint(3, 15)
            else:
                investigation_text = f"Analyzed {cat} on {host}. Source IP {ip} was checked. CrowdStrike sensor logged process execution tree. Host contained. Closed as {disp}."
                investigation_actions = random.randint(3, 15)
'''

pattern = re.compile(r'# Generate highly varied honest text so they don\'t cluster semantically.*?investigation_actions = random\.randint\(3, 15\)', re.DOTALL)
content = pattern.sub(new_logic.strip(), content)

with open('backend/generate_mock_data.py', 'w', encoding='utf-8') as f:
    f.write(content)
