# SAT-SA (Supervisory Analytics Tool for SOC Assessment)
### National Critical Information Infrastructure Protection Centre (NCIIPC) & NTRO Evaluation Platform

---

## 1. Executive Summary & Problem Statement

National regulatory and intelligence authorities such as **NCIIPC** and **CERT-In** periodically receive voluminous SOC alerts and case-management audit logs from **Critical Sector Entities (CSEs)** across Energy, Power Grids, Core Banking, Telecommunications, Civil Aviation, Defence, and Nuclear infrastructure. 

Manually reviewing hundreds of thousands of incident records is humanly impossible, allowing systemic weaknesses to remain concealed:
- **Execution Gaps:** Critical alerts closed in seconds under the guise of false positives without forensic escalation.
- **Negative Space Blind Spots:** Declared crown-jewel assets that emit zero telemetry, unintegrated authentication streams, or silent weekend periods.
- **KPI Gaming:** Artificial MTTR suppression, shift-end mass ticket purges, and automated bot closures.
- **Investigation Templating:** Copy-pasted boilerplate investigation notes across disparate critical incidents.

### Fundamental Distinction
- **SAT-SA is NOT a SIEM.**
- **SAT-SA is NOT a SOC.**
- **SAT-SA is NOT real-time monitoring.**
- **SAT-SA is an offline, air-gapped Supervisory Analytics Platform** that evaluates periodically submitted operational evidence to verify whether an entity's SOC actually functions effectively.

---

## 2. High-Level Architecture Diagram

```mermaid
graph TD
    subgraph Data Sources ["CSE Periodic Batch Submissions (CSV / JSON)"]
        D1["Alert Logs"]
        D2["Investigation Cases"]
        D3["Escalation Chains"]
        D4["Asset Scope"]
    end

    subgraph Module1 ["Module 1: Data Ingestion Hub"]
        ING1["Auto Schema Detection"]
        ING2["Pre-Ingestion Validator"]
        ING3["Quality Scoring Engine (0-100)"]
    end

    subgraph AnalyticsEngines ["Analytical & Supervisory Engines"]
        M2["Module 2: Execution Gap Detector<br/>(Sub-90s closures, KPI gaming)"]
        M3["Module 3: Negative Space Detector<br/>(Missing telemetry, silent assets)"]
        M4["Module 4: Peer Benchmarking<br/>(Sector averages and baselines)"]
        M5["Module 5: Anomaly Detector<br/>(Isolation Forest 8D Outliers)"]
        M6["Module 6: Risk Engine<br/>(Cyber Resilience & Attention Index)"]
        M10["Module 10: Audit Ledger<br/>(Finding Provenance)"]
    end

    subgraph LocalAI ["Module 7: Local Offline AI Supervisory Assistant"]
        AI1["Zero Cloud Dependencies"]
        AI2["Deterministic Evidence Grounding"]
        AI3["Statutory Observation Memo Drafting"]
    end

    subgraph UserInterface ["National Cyber Command Center UI"]
        DASH["Module 8: Supervisory Dashboard & Sector Heatmap"]
        WORK["Module 9: Investigation Workspace & Timeline"]
        REP["Reports Generator (PDF / DOCX / HTML)"]
        RULES["Supervisory Rules Catalog"]
    end

    Data Sources --> Module1
    Module1 --> AnalyticsEngines
    AnalyticsEngines --> LocalAI
    AnalyticsEngines --> UserInterface
    LocalAI --> UserInterface
```

---

## 3. The 10 Core Supervisory Modules

| Module # | Module Name | Primary Operational Function |
|---|---|---|
| **Module 1** | **Data Ingestion Hub** | Multi-format (CSV/JSON) parser, auto-schema detection, missing field warnings, record preview, and Data Quality Scoring. |
| **Module 2** | **Execution Gap Detector** | Flags triage evasion, sub-90s rapid closures of Critical threats, unescalated True Positives, and shift-end ticket purging. |
| **Module 3** | **Negative Space Detector** | Answers *"What expected evidence is missing?"* Identifies silent critical assets, zero-authentication anomalies, and weekend blackouts. |
| **Module 4** | **Peer Benchmarking** | Compares entities against sector peers using sector averages and baselines. |
| **Module 5** | **Anomaly Detection** | Multi-dimensional **Isolation Forest** behavioral model detecting outlier entities across 8 operational feature dimensions. |
| **Module 6** | **Risk Engine** | Computes **Cyber Resilience Score (0-100)**, **Supervisory Attention Index (SAI)**, Investigation Quality, and Escalation Effectiveness. |
| **Module 7** | **AI Supervisory Assistant** | 100% offline, local intelligence that drafts regulatory memorandums, explains findings, and cites empirical source evidence. |
| **Module 8** | **Supervisory Dashboard** | Command Center executive overview with national sector risk heatmaps, prioritized review queues, and capability radar charts. |
| **Module 9** | **Investigation Workspace** | Entity deep-dive console with chronological operational timelines, asset inventories, and evidence dossiers. |
| **Module 10** | **Audit Ledger** | Links Finding provenance and Dataset metadata for evidentiary admissibility. |

---

## 4. Rule Engine (55 Active Cyber Supervisory Rules)

SAT-SA includes a catalog of **cyber supervisory rules** organized into five operational domains:

### Domain 1: Execution Gaps (Rules 1 - 15)
- `RULE-EG-001`: Critical Alert Rapid Closure Without Escalation (< 90 seconds).
- `RULE-EG-002`: Critical Alert Sub-5-Minute Closure without secondary triage.
- `RULE-EG-003`: High Severity Alert Closed Without Investigation Record.
- `RULE-EG-004`: Alert Acknowledged to stop SLA timer, then silently closed.
- `RULE-EG-005`: True Positive Disposition Closed Without Escalation.
- `RULE-EG-006`: Ransomware / Exfiltration on Crown-Jewel Asset Marked Benign Rapidly.
- `RULE-EG-007`: Exfiltration Alert Closed as False Positive Without Packet Analysis.
- `RULE-EG-008`: Lateral Movement Dismissed Without Credential Triage.
- `RULE-EG-009`: Command & Control Alert Closed Without Firewall Quarantine.
- `RULE-EG-010`: Privilege Escalation on Domain Controller Unescalated.
- `RULE-EG-011`: Batch Closing of Heterogeneous Alert Categories.
- `RULE-EG-012`: Zero Quarantine Actions Recorded for Confirmed Malware.
- `RULE-EG-013`: Superficial Investigation of Multi-Host Blast Radius.
- `RULE-EG-014`: Recurring Threat on Same Critical Asset Closed as Low Priority.
- `RULE-EG-015`: High Severity Alert Left in Open State Beyond Operational SLA (> 24h).

### Domain 2: Negative Space & Blind Spots (Rules 16 - 28)
- `RULE-NS-016`: Critical Asset Telemetry Absence (Declared crown jewel with 0 logs).
- `RULE-NS-017`: Zero Authentication Alerts in Sector Entity over 30+ days.
- `RULE-NS-018`: Zero External C2 or Egress Alerts despite large endpoint footprint.
- `RULE-NS-019`: Weekend Telemetry Blackout (> 90% drop in 24x7 facility).
- `RULE-NS-020`: Missing Escalation Records for High Severity Period (> 50 criticals, 0 escalations).
- `RULE-NS-021`: SCADA / OT Zone Telemetry Vacuum in Energy or Transport CSE.
- `RULE-NS-022`: Zero Phishing or Email Security Detections.
- `RULE-NS-023`: Abnormally Low Alert Volume Relative to Peer Sector Median (> 3σ below median).
- `RULE-NS-024`: Absence of Cloud Control-Plane Telemetry.
- `RULE-NS-025`: Zero Privilege Escalation Detections across enterprise fleet.
- `RULE-NS-026`: Under-monitored Core Banking / SWIFT Switch Nodes.
- `RULE-NS-027`: Complete Absence of Network Flow / IPFIX Correlation.
- `RULE-NS-028`: Zero Matches Against Disseminated NCIIPC Threat Intelligence Advisories.

### Domain 3: KPI Gaming & Behavioral Anomalies (Rules 29 - 38)
- `RULE-GM-029`: Shift-End Mass Closure Spike (> 50% closed in final 15 minutes).
- `RULE-GM-030`: Artificial MTTR Compression (Clustering immediately before SLA limit).
- `RULE-GM-031`: Uniform Closure Times (Std dev < 5s indicates automated bot closing).
- `RULE-GM-032`: Severe Metric-Evidence Divergence (MTTR looks green, notes length = 0).
- `RULE-GM-033`: 100% False Positive Classification Bias across 1,000+ alerts.
- `RULE-GM-034`: Reassignment Carousel (> 4 analyst passes without progress).
- `RULE-GM-035`: Severity Downgrading to Bypass SLA and Regulatory Triggers.
- `RULE-GM-036`: Off-Hours Alert Stalling (Night shift backlog purged at morning start).
- `RULE-GM-037`: Disposition Churn (Toggling dispositions > 2 times before close).
- `RULE-GM-038`: Instant Acknowledge-Close Loop (< 5 seconds between states).

### Domain 4: Escalation & Workflow Failures (Rules 39 - 46)
- `RULE-ES-039`: Critical Infrastructure Breach Lacking Statutory NCIIPC Notification.
- `RULE-ES-040`: Excessive L1 to L2 Escalation Dwell Time (> 4 hours on critical IOC).
- `RULE-ES-041`: Orphan Escalation Without Secondary Responder Acceptance (> 12 hours).
- `RULE-ES-042`: Repeated Escalation Rejection by Tier-2 (> 40% rejected).
- `RULE-ES-043`: CISO Bypassed for Severe Exfiltration Event (> 10 GB).
- `RULE-ES-044`: SLA Failure on Ransomware Containment Window.
- `RULE-ES-045`: Unvalidated Escalation Closure by Third-Party MSSP Contractor.
- `RULE-ES-046`: Missing Chain of Custody for Forensic Escalations.

### Domain 5: Investigation Quality & Templating (Rules 47 - 55)
- `RULE-IQ-047`: High-Frequency Boilerplate Templated Notes (> 85% similarity).
- `RULE-IQ-048`: Single-Word or Sub-15-Character Investigation Notes ("ok", "fp").
- `RULE-IQ-049`: Zero Correlated IOC Evidence in Critical Case.
- `RULE-IQ-050`: Discrepancy Between Investigation Notes and Selected Disposition.
- `RULE-IQ-051`: Zero Host Memory or Process Inspection for C2 Infection.
- `RULE-IQ-052`: Cross-Entity Boilerplate Investigation Sharing across MSSP clients.
- `RULE-IQ-053`: Investigation Duration Under 30 Seconds for High Severity.
- `RULE-IQ-054`: Absence of Remediation Guidance in Closed True Positive Cases.
- `RULE-IQ-055`: Unverified Bulk Suppression Rule Creation.

---

## 5. Technology Stack & Offline Guarantee

- **Frontend:** Next.js / React 19, TypeScript, Tailwind CSS, Lucide Icons, Recharts, ECharts.
- **Backend:** FastAPI, SQLAlchemy, SQLite (Standalone zero-config) / PostgreSQL (Dockerized).
- **Analytics:** NumPy, Pandas, Pure Isolation Forest, SciPy, NetworkX.
- **Security:** JWT Authentication (Demo Mode), Role-Based Access Control (RBAC).
- **Offline / Air-Gapped:** Zero external calls, zero telemetry egress, 100% self-contained.

---

## 6. Default User Accounts (RBAC)

| Role | Username | Password | Operational Access |
|---|---|---|---|
| **Supervisor** | `supervisor` | `Supervisor@2026` | Review entities, compare organizations, generate reports, investigate evidence. |
| **Analyst** | `analyst` | `Analyst@2026` | Upload datasets, review findings, validate anomalies. |
| **Administrator** | `admin` | `AdminPassword@2026` | Manage users, configure rules, full system access. |

---

## 7. Quick Start & Deployment Guide

### Option A: Local Standalone Execution (Windows / Linux / macOS)
1. **Start Backend:**
   ```bash
   cd backend
   uvicorn app.main:app --host 0.0.0.0 --port 8000
   # Backend listens at http://localhost:8000
   ```
2. **Start Frontend:**
   ```bash
   cd frontend
   npm run dev
   # Frontend runs at http://localhost:5173
   ```
3. Open your browser at `http://localhost:5173`.

### Option B: Docker Compose (Air-Gapped Container Setup)
```bash
docker-compose up --build
```
- Frontend: `http://localhost:80`
- Backend API & OpenAPI Docs: `http://localhost:8000/docs`
- PostgreSQL: `localhost:5432`

---

## 8. Compliance & Evaluation Criteria (SIH / NTRO / NCIIPC)

1. **Air-Gapped Security:** Operates completely disconnected from the Internet; does not leak sensitive critical sector telemetry.
2. **Explainability & Evidentiary Integrity:** Every finding is linked to a cryptographic SHA-256 hash and provides explicit reasons why it was flagged.
3. **Evidence Over Metrics:** Distinguishes between artificial "green" KPI dashboards and authentic operational defense.
