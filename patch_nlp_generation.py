with open('backend/generate_mock_data.py', 'r') as f:
    lines = f.readlines()

new_lines = []
in_else = False
skip = False
for line in lines:
    if "else:" in line and "Feature 8" in lines[lines.index(line) + 1]:
        in_else = True
        new_lines.append(line)
        continue
        
    if in_else:
        if line.strip() == "investigation_actions = random.randint(2, 6)":
            skip = False
            in_else = False
            
# Wait, let's just do a string replacement on the whole file.

with open('backend/generate_mock_data.py', 'r') as f:
    content = f.read()

import re

# 1. Update lazy templates to be specific defect text
old_lazy = '''lazy_templates = [
    "Reviewed the alert. No malicious activity detected. Verified IP on VirusTotal and closed as false positive.",
    "Analyst reviewed this alert. No malicious activity was detected. Verified IP on VT and closed as false positive.",
    "Reviewed alert. No malicious activity found. Checked IP address on VirusTotal. Closed as a false positive.",
]'''
new_lazy = '''lazy_templates = [
    # Injected specific copy-paste template reused across cases
    "I looked at the logs and saw nothing bad. The system is fine. Closing this.",
    "No malware found after scanning the host. Everything is clean.",
    "Checked VT, checked crowdstrike, no issues found. Resolving alert now."
]'''
content = content.replace(old_lazy, new_lazy)

# 2. Update the fallback generic template generator for good cases
old_good = '''            if "SQL" in alert["category"]:
                investigation_text = random.choice(good_templates_sql).replace("{ip}", cited_ip)
            elif "Brute" in alert["category"]:
                investigation_text = random.choice(good_templates_auth).replace("{ip}", cited_ip)
            else:
                investigation_text = f"Analyzed {alert['category']} on {alert['asset_id']}. Source IP {cited_ip} was checked. {alert['log_source']} logs were reviewed. Closed as {alert['disposition']} by {alert['closed_by']}."'''
new_good = '''            if "SQL" in alert["category"]:
                investigation_text = random.choice(good_templates_sql).replace("{ip}", cited_ip)
            elif "Brute" in alert["category"]:
                investigation_text = random.choice(good_templates_auth).replace("{ip}", cited_ip)
            else:
                variations = [
                    f"After receiving the {alert['category']} alert for {alert['asset_id']}, I checked {cited_ip} against our threat intelligence. The {alert['log_source']} telemetry confirmed it was {alert['disposition']}.",
                    f"Upon investigation of {alert['asset_id']}, the activity from {cited_ip} appeared benign. {alert['log_source']} showed normal traffic patterns. Marked as {alert['disposition']}.",
                    f"Alert {alert['category']} triggered. I reviewed {cited_ip} in {alert['log_source']}. The behavior is expected for this asset ({alert['asset_id']}). Closing as {alert['disposition']}."
                ]
                investigation_text = random.choice(variations)'''
content = content.replace(old_good, new_good)

with open('backend/generate_mock_data.py', 'w') as f:
    f.write(content)

