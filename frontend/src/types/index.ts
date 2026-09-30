// SAT-SA Data Model Definitions - Section 3 & Schemas

export type FindingType = 'EXECUTION_GAP' | 'NEGATIVE_SPACE' | 'PEER_DEVIATION' | 'ANOMALY';
export type FindingPriority = 'P1' | 'P2' | 'P3';
export type SeverityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type CriticalityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM';
export type AttentionLevel = 'CRITICAL' | 'ELEVATED' | 'ROUTINE';

export interface User {
  username: string;
  role: 'Supervisor' | 'Analyst' | 'Administrator';
  access_token?: string;
  token_type?: string;
}

export interface Entity {
  id: string;
  name: string;
  sector: string;
  size_band: string;
  criticality: CriticalityLevel;
  observation_start?: string;
  observation_end?: string;
  finding_count?: number;
  p1_count?: number;
  attention_level?: AttentionLevel;
}

export interface Asset {
  id: string;
  entity_id: string;
  asset_type: string;
  criticality: CriticalityLevel;
  monitoring_expected: boolean;
  monitoring_status: 'ACTIVE' | 'SILENT' | 'DEGRADED';
}

export interface Alert {
  id: string;
  entity_id: string;
  asset_id: string;
  severity: SeverityLevel;
  category: string;
  status: string;
  created_at: string;
  acknowledged_at?: string;
  closed_at?: string;
  disposition?: string;
}

export interface Case {
  id: string;
  alert_id: string;
  entity_id: string;
  investigation_text: string;
  investigation_actions: string[];
  created_at: string;
  updated_at?: string;
  closed_at?: string;
}

export interface Escalation {
  id: string;
  case_id: string;
  escalated: boolean;
  escalation_level: string;
  escalated_at: string;
}

export interface Response {
  id: string;
  case_id: string;
  response_action: string;
  result: string;
  created_at: string;
}

export interface ExpectedEvidence {
  id: string;
  sector: string;
  asset_type: string;
  expected_workflow: string[];
  expected_alert_categories: string[];
  expected_escalation: boolean;
  expected_response: boolean;
}

export interface Finding {
  id: string;
  title: string;
  entity_id: string;
  entity_name?: string;
  sector?: string;
  finding_type: FindingType;
  rule_id?: string;
  severity: SeverityLevel;
  priority: FindingPriority;
  confidence: number;
  confidence_pct?: number;
  explanation: string;
  evidence: Record<string, any>;
  why_flagged?: string;
  supporting_evidence?: Record<string, any>;
  expected_workflow?: string[];
  observed_workflow?: string[];
  missing_evidence?: string[];
  supervisory_action?: string;
  reviewed: boolean;
  review_decision?: string;
  review_notes?: string;
  created_at: string;
}

export interface DashboardSummary {
  cses_assessed: number;
  alerts_analyzed: number;
  cases_processed: number;
  execution_gaps_count: number;
  negative_space_count: number;
  peer_deviations_count: number;
  priority_reviews_count: number;
  p1_findings_count: number;
  evidence_chain_completeness: number;
  analytics_confidence: number;
}

export interface AttentionMatrixItem {
  entity: string;
  name: string;
  sector: string;
  criticality: CriticalityLevel;
  finding_count: number;
  p1_findings: number;
  attention_level: AttentionLevel;
}

export interface FindingDistributionItem {
  name: string;
  type: FindingType;
  count: number;
  color: string;
}

export interface IngestionJob {
  id: string;
  file_name: string;
  entity_id: string;
  file_type: string;
  total_records: number;
  valid_records: number;
  invalid_records: number;
  validation_status: 'SUCCESS' | 'WARNING' | 'ERROR';
  validation_errors: string[];
  validation_warnings: string[];
  status: string;
  created_at: string;
}

export interface EntityDetail {
  entity: Entity;
  evidence_counts: {
    alerts: number;
    cases: number;
    escalations: number;
    responses: number;
    total_assets: number;
    monitoring_coverage_pct: number;
  };
  findings: Array<{
    id: string;
    title: string;
    finding_type: FindingType;
    severity: SeverityLevel;
    priority: FindingPriority;
    confidence: number;
    q1_what_detected: string;
    q2_why_detected: string;
    q3_what_evidence: Record<string, any>;
    q4_what_to_review: string;
    expected_workflow: string[];
    observed_workflow: string[];
    missing_evidence: string[];
    reviewed: boolean;
    review_decision?: string;
  }>;
}

export interface PeerBenchmarkingData {
  sector_benchmarks: Array<{
    sector: string;
    peer_count: number;
    avg_alert_volume: number;
    avg_critical_alert_pct: number;
    avg_investigation_rate: number;
    avg_escalation_rate: number;
    avg_response_rate: number;
    avg_monitoring_coverage: number;
  }>;
  entity_metrics: Array<{
    entity_id: string;
    sector: string;
    size_band: string;
    criticality: string;
    alert_volume: number;
    critical_alert_pct: number;
    investigation_rate: number;
    escalation_rate: number;
    response_evidence_rate: number;
    monitoring_coverage: number;
    deviations: string[];
  }>;
}
