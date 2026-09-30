export interface Finding {
  finding_id: string;
  entity_id?: string;
  type?: string;
  outcome?: string;
  severity?: string;
  description?: string;
  // Detector payloads have engine-specific evidence shapes.
  evidence: Record<string, any>;
  [key: string]: any;
}
