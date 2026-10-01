# SIH26157_Blockers.pdf

pages: 6
sha256: 0e2d5b652de09be082cf3546da51c0434a86a74d2024fed3e8a0c69d13f5125b

--- page 1 ---
TITLE PAGE
SMART INDIA HACKATHON 2026
Problem Statement ID – SIH26157
Theme - Blockchain & Cybersecurity
PS Category - Software
Team ID - 137529
Team Name - Blockers
_
1
Problem Statement Title - Supervisory
Analytics Tool for SOC Assessment
(SAT-SA)

--- page 2 ---
Nexus (Evidence-Driven Supervisory Analytics)
2
THE PROBLEM
Currently, oversight bodies like NCIIPC
struggle to independently verify SOC
capabilities at scale. The process relies heavily
on manual review and self-reported KPI
dashboards that fail to highlight actual
operational gaps.
CORE ISSUES
Dependence on Self-Reporting: Prevents
independent verification; hides structural
flaws.
Manual Review Bottlenecks: Periodic data
oversight is unscalable; true anomalies are
missed.
SILENT & LAZY GAPS
Silent Critical Assets: Blind spots where
important infrastructure generates zero
telemetry.
Analyst Inefficiency: Missed "lazy"
behavior like <90s closures or copied
investigation text.
TECHNICAL APPROACH & WORKFLOW (OFFLINE BATCH-FIRST) :
1 STEP 1: Input
Securely ingests
periodic, offline SOC
data (CSV, JSON, DB
formats).
2 STEP 2: Evidence
Graph Mapping
Maps "Expected Evidence
Graph" (Alert → Case →
Escalation) for
independent verification.
3 STEP 3: Execution
Gaps Detection
Automatically flags lazy
analysis and investigation
anomalies.
4 STEP 4: Negative
Space Analysis
Identifies CII components
with zero telemetry or
logging activity.
5 STEP 5: Action
Calculates Supervisory
Priority Score to queue
only the most suspicious
cases.
Our Solution An offline, batch-first analytics platform enabling automated filtering
without relying on self-reported KPI metrics. Ultimate Outcome Radically scales NCIIPC's oversight by empowering human
examiners to focus purely on true, high-priority security anomalies.
Blockers_1

--- page 3 ---
System Architecture
Tech Stack
TECHNICAL APPROACH
3
Blockers_1
FRONTENT
Backend & API
Data Analytics & Processing
AI / ML / NLP
Database
Flow Diagram

--- page 4 ---
FEASIBILITY AND VIABILITY
@SIH Idea submission- Template 4
Your Team
Name
Strict Scope Compliance Built strictly as a supervisory analytics tool,
not an operational SIEM. Ingests periodic
metadata and workflows (CSV/JSON/DB),
avoiding raw log/PCAP storage bottlenecks.
Hardware & Compute Feasibility Lightweight open-source models (FAISS, scikit-learn)
run on standard NCIIPC on-premise hardware.
On-premise
hardware
No GPU clusters
Lightweight
models
Explainability & Auditability Every finding details:
1
WHAT happened
2
WHY it is suspicious
3
WHAT evidence supports it
4
WHAT benchmark was used HYBRID AI & ANALYTICS PIPELINE (LOCAL PROCESSING) Deterministic
Python / Polars
Rules engine · rapid closures · broken
chains
Statistical
Robust Z-score, MAD, IQR
Peer benchmarking · metric-evidence
divergence
Machine Learning
Isolation Forest, DBSCAN
Entity & case clustering · anomaly
detection
NLP
Local sentence-transformers
Text similarity · templated, low-effort
flags
Tamper-Evident Audit Ledger Cryptographic hash chain, no heavy blockchain network:
Dataset Hash Rule Version Finding Hash
Continuous Validation Loop Outputs cross-validated against historical expert manual review samples.
System Output Expert Review Samples Validation & Model
Tuning

--- page 5 ---
IMPACT AND BENEFITS
BENEFITS OF THE SOLUTION :
POTENTIAL IMPACT ON THE TARGET AUDIENCE :
Critical Sector
Entities
NEXUS-SOC ranked
queue
Supervisors (e.g.
NCIIPC) SOC teams
Banks, power and telecom:
many entities, limited
reviewer time
Review time goes to the
highest- priority cases first
Review many entities without
inspecting every SOC manually
Clear, evidence-based feedback
on weak investigation and
response records
Social Economic
Security and
trust
Fairness
Stronger oversight of critical
infrastructure such as banks,
power and telecom, and faster
spotting of weak SOC practice
Less manual audit effort and
better use of limited supervisory
capacity; no cloud or licensing
dependency
Data never leaves the controlled
environment; tamper-evident
audit trail supports accountability
Fair peer-based comparison and
explainable findings build
confidence with entities
Critical infrastructure oversight No cloud or licence cost Tamper-evident audit trail Peer-based and explainable
5
Blockers_1

--- page 6 ---
RESEARCH AND REFERENCES
Standards, Frameworks &
Government Guidelines
6
Blockers_1
Production Link : https://nexus-peach-three-19.vercel.app YT Demo + Github : https://github.com/kamble10pratik10-ops/Nexus
NCIIPC Guidelines for Protection of Critical
Information Infrastructure: The primary
regulatory baseline establishing the
mandatory cyber resilience and auditing
requirements for Critical Sector Entities
(CSEs) in India.
NIST SP 800-61 Rev. 2 (Computer Security
Incident Handling Guide): Serves as the
foundational blueprint for mapping the
Expected Evidence Graph (Alert → Case →
Escalation → Response).
MITRE ATT&CK Framework: Utilized to map
alert categories and verify detection
coverage, enabling the Negative Space
Engine to identify missing telemetry for
critical systems.
SOC-CMM (SOC Capability Maturity Model):
Provides the peer-benchmarking criteria to
assess whether a SOC's documented claims
align with its actual operational maturity and
evidence.
Technical USP References:
Models & Algorithms
Isolation-Based Anomaly Detection (Liu, Ting & Zhou,
2008 - IEEE ICDM): Research on the Isolation Forest
algorithm, utilized for unsupervised anomaly
detection of unusual operational patterns and rapid
case closures without relying on pre-labeled data.
Sentence-BERT: Sentence Embeddings using
Siamese BERT-Networks (Reimers & Gurevych, 2019 -
EMNLP): The core NLP architecture deployed locally
in the air-gapped environment to generate dense
vector embeddings for SOC investigation text.
A Density-Based Algorithm for Discovering Clusters
(DBSCAN) (Ester et al., 1996 - KDD): The clustering
algorithm used in tandem with Sentence-BERT to
detect densely packed, highly similar investigation
texts, flagging "Lazy Analysts" using copy-pasted
templates.
Billion-scale similarity search with GPUs (FAISS)
(Johnson et al., 2017 - Meta AI): The vector similarity
search library utilized to efficiently index and query
text embeddings entirely offline.
Analytics & Statistical
Methodologies
Detecting outliers: Do not use standard deviation
around the mean, use absolute deviation around the
median (Leys et al., 2013): Academic justification for
utilizing Median Absolute Deviation (MAD) and
robust Z-scores instead of naive averages to prevent
outlier CSEs from skewing peer-benchmarked KPIs.
Polars: Blazingly Fast DataFrames: The high￾performance, multithreaded Rust-based engine used
for executing deterministic Evidence-Linkage checks
on massive CSV and JSON batch datasets.
