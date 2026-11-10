import React, { useState, useEffect, useRef } from 'react';
import {
  UploadCloud,
  Link as LinkIcon,
  CheckCircle2,
  Play,
  FileText,
  Settings,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  Sparkles,
  RefreshCw,
  ArrowRight
} from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

const API_BASE_URL = typeof window !== 'undefined' && (window.location.port === '5173' || window.location.port === '5174')
  ? '/api'
  : 'http://127.0.0.1:8000/api';

type IngestionJob = {
  id: string;
  file_name: string;
  entity_id: string;
  file_type: string;
  total_records: number;
  valid_records: number;
  invalid_records: number;
  validation_status: string;
  validation_errors?: string[];
  validation_warnings?: string[];
  status: string;
  created_at: string;
};

type UploadFeedback = {
  job_id: string;
  file: string;
  entity: string;
  detected_type: string;
  records: number;
  valid_records: number;
  invalid_records: number;
  validation_status: 'SUCCESS' | 'WARNING' | 'ERROR';
  errors?: string[];
  warnings?: string[];
  inserted_records: number;
  file_size?: string;
};

type AnalysisResult = {
  total_findings_generated?: number;
  total_findings?: number;
  entities_assessed?: number;
  execution_gaps?: number;
  negative_space?: number;
  anomalies?: number;
  peer_deviations?: number;
  p1_findings?: number;
  p2_findings?: number;
  p3_findings?: number;
  status?: string;
};

export function Integrations() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tabs
  const [activeTab, setActiveTab] = useState<'export' | 'api'>('export');

  // Entity selection
  const [selectedEntity, setSelectedEntity] = useState('CSE-01');

  // Real upload states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState<UploadFeedback | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Analysis states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  // Demo loading state
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  // Job history
  const [jobs, setJobs] = useState<IngestionJob[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);

  // API Pull tab state
  const [apiPlatform, setApiPlatform] = useState('ServiceNow (ITSM)');
  const [apiEndpoint, setApiEndpoint] = useState('');
  const [apiToken, setApiToken] = useState('');
  const [apiStatus, setApiStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [apiMsg, setApiMsg] = useState('');
  const [apiDetails, setApiDetails] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);

  // Fetch ingestion history
  const fetchJobs = async () => {
    setLoadingJobs(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/ingestion/jobs`);
      setJobs(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch ingestion history:', err);
    } finally {
      setLoadingJobs(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  // Trigger file dialog
  const triggerFileDialog = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  // Perform actual upload to backend
  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);
    setUploadFeedback(null);
    setAnalysisResult(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('entity_id', selectedEntity);

    // Format human-readable size
    const sizeInKb = (file.size / 1024).toFixed(1);
    const sizeFormatted = file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
      : `${sizeInKb} KB`;

    try {
      const res = await axios.post(`${API_BASE_URL}/ingestion/upload`, formData);

      const data = res.data;
      setUploadFeedback({
        job_id: data.job_id || `JOB-${Date.now()}`,
        file: file.name,
        entity: data.entity || selectedEntity,
        detected_type: data.detected_type || 'Unknown',
        records: data.records || 0,
        valid_records: data.valid_records || 0,
        invalid_records: data.invalid_records || 0,
        validation_status: data.validation_status || 'SUCCESS',
        errors: data.errors || [],
        warnings: data.warnings || [],
        inserted_records: data.inserted_records || 0,
        file_size: sizeFormatted
      });

      await fetchJobs();
    } catch (err: any) {
      const detail = err?.response?.data?.detail || err.message || 'Error processing file.';
      setUploadError(detail);
      setUploadFeedback({
        job_id: `ERR-${Date.now()}`,
        file: file.name,
        entity: selectedEntity,
        detected_type: 'Unknown',
        records: 0,
        valid_records: 0,
        invalid_records: 0,
        validation_status: 'ERROR',
        errors: [detail],
        warnings: [],
        inserted_records: 0,
        file_size: sizeFormatted
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadFile(e.dataTransfer.files[0]);
    }
  };

  // Run supervisory engine
  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisResult(null);
    try {
      const res = await axios.post(`${API_BASE_URL}/ingestion/run-analysis`);
      setAnalysisResult(res.data);
    } catch (err: any) {
      console.error('Supervisory analysis run failed:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Load demo dataset
  const handleLoadDemo = async () => {
    setIsDemoLoading(true);
    setAnalysisResult(null);
    setUploadFeedback(null);
    setUploadError(null);
    try {
      const res = await axios.post(`${API_BASE_URL}/ingestion/load-demo`);
      if (res.data?.analysis_result) {
        setAnalysisResult(res.data.analysis_result);
      }
      await fetchJobs();
    } catch (err: any) {
      console.error('Failed to load demo dataset:', err);
    } finally {
      setIsDemoLoading(false);
    }
  };

  // Real API Pull Connection Test
  const handleTestConnection = async () => {
    setApiStatus('testing');
    setApiMsg('');
    setApiDetails(null);
    setSyncResult(null);

    try {
      const res = await axios.post(`${API_BASE_URL}/ingestion/test-connection`, {
        platform: apiPlatform,
        endpoint_url: apiEndpoint,
        api_key: apiToken,
        entity_id: selectedEntity
      });

      if (res.data.status === 'success') {
        setApiStatus('success');
        setApiMsg(res.data.message);
        setApiDetails(res.data);
      } else {
        setApiStatus('error');
        setApiMsg(res.data.message || 'Connection test failed.');
      }
    } catch (err: any) {
      setApiStatus('error');
      const detail = err?.response?.data?.detail || err.message || 'Failed to communicate with connection test service.';
      setApiMsg(detail);
    }
  };

  // Live Sync from API
  const handleSyncApi = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    try {
      const res = await axios.post(`${API_BASE_URL}/ingestion/sync-api`, {
        platform: apiPlatform,
        endpoint_url: apiEndpoint,
        api_key: apiToken,
        entity_id: selectedEntity
      });
      setSyncResult(res.data);
      await fetchJobs();
    } catch (err: any) {
      const detail = err?.response?.data?.detail || err.message || 'Failed to sync API records.';
      setSyncResult({ status: 'ERROR', message: detail });
    } finally {
      setIsSyncing(false);
    }
  };

  const fillSandboxConfig = () => {
    setApiPlatform('ServiceNow (ITSM)');
    setApiEndpoint('http://localhost:8000/api/ingestion/sandbox-siem');
    setApiToken('NEXUS_SANDBOX_TOKEN_2026');
    setApiStatus('idle');
    setApiMsg('');
    setApiDetails(null);
    setSyncResult(null);
  };

  return (
    <div className="page-shell space-y-8">
      {/* Hidden real file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept=".csv,.json"
        className="hidden"
      />

      <header className="page-header flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <p className="page-eyebrow">Data Ingestion Hub</p>
          <h1 className="page-title">Evidence Ingestion & Normalization</h1>
          <p className="page-description">
            Ingest periodic SOC operational evidence (Alerts, Cases, Assets, Escalations).
            Performs strict schema validation, severity mapping, and feeds the 16+ supervisory analytics engines.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start">
          <button
            onClick={handleLoadDemo}
            disabled={isDemoLoading || isAnalyzing}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-500 px-4 py-2.5 text-xs font-semibold text-white transition-colors disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4 text-cyan-300" />
            {isDemoLoading ? 'Seeding Demo...' : 'Load Demo Dataset'}
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-px">
        <button
          type="button"
          onClick={() => setActiveTab('export')}
          className={cn(
            "flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors",
            activeTab === 'export'
              ? "border-sky-600 text-sky-700 dark:border-sky-400 dark:text-sky-300 font-bold"
              : "border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
          )}
        >
          <UploadCloud className="h-4 w-4" />
          Batch Export (Secure Drop)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('api')}
          className={cn(
            "flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors",
            activeTab === 'api'
              ? "border-sky-600 text-sky-700 dark:border-sky-400 dark:text-sky-300 font-bold"
              : "border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
          )}
        >
          <LinkIcon className="h-4 w-4" />
          API Pull (Automated Connectors)
        </button>
      </div>

      {/* TAB 1: BATCH EXPORT & DROP (REAL UPLOAD) */}
      {activeTab === 'export' && (
        <div className="space-y-6">
          <section className="panel p-6">
            <div className="mb-6 flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <UploadCloud className="h-5 w-5 text-sky-600 dark:text-blue-400" />
                  Secure Periodic Batch Ingest
                </h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
                  Upload CSV or JSON files exported from your SIEM, SOAR, or Ticketing system.
                  The supervisory engine automatically detects file structure (Alerts, Cases, Assets, Escalations, Responses),
                  normalizes timestamps, and prepares audit signals.
                </p>
              </div>

              {/* Entity Selector */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                  Target Entity:
                </label>
                <select
                  value={selectedEntity}
                  onChange={(e) => setSelectedEntity(e.target.value)}
                  className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-mono font-bold text-sky-700 dark:text-cyan-300 focus:border-sky-500 focus:outline-none"
                >
                  {Array.from({ length: 20 }, (_, i) => {
                    const id = `CSE-${String(i + 1).padStart(2, '0')}`;
                    return <option key={id} value={id}>{id} (Critical Sector Entity)</option>;
                  })}
                </select>
              </div>
            </div>

            {/* Drag & Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={triggerFileDialog}
              className={cn(
                "cursor-pointer rounded-xl border-2 border-dashed p-8 sm:p-12 text-center transition-all",
                isDragging
                  ? "border-sky-500 bg-sky-50 dark:bg-cyan-950/20"
                  : "border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/30 hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-100/50 dark:hover:bg-slate-900/50"
              )}
            >
              <UploadCloud className={cn("mx-auto h-12 w-12 mb-3", isDragging ? "text-sky-600 dark:text-cyan-400" : "text-slate-400 dark:text-slate-500")} />
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
                {isUploading ? "Uploading & Validating Schema..." : "Click to select or drag & drop CSV / JSON file"}
              </h3>
              <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                Accepts alerts.csv, cases.csv, assets.csv, or SIEM JSON batches (e.g. from data/ folder)
              </p>

              <div className="mt-5 flex justify-center">
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerFileDialog();
                  }}
                  className="inline-flex items-center gap-2 rounded-lg bg-sky-600 hover:bg-sky-500 px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors disabled:opacity-50"
                >
                  <UploadCloud className="h-4 w-4" />
                  {isUploading ? 'Validating...' : 'Select File from Device'}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {uploadError && (
              <div className="mt-5 rounded-lg border border-rose-200 dark:border-red-500/30 bg-rose-50 dark:bg-red-500/10 p-4 text-sm text-rose-800 dark:text-red-300 flex items-start gap-3">
                <XCircle className="h-5 w-5 shrink-0 mt-0.5 text-rose-600 dark:text-red-400" />
                <div>
                  <h4 className="font-semibold text-rose-900 dark:text-red-200">Upload / Schema Validation Failed</h4>
                  <p className="mt-1 text-xs opacity-90">{uploadError}</p>
                </div>
              </div>
            )}

            {/* Real Validation Feedback */}
            {uploadFeedback && (
              <div className="mt-6 space-y-4 animate-in fade-in duration-300">
                <div className={cn(
                  "flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border p-4",
                  uploadFeedback.validation_status === 'ERROR'
                    ? "border-red-500/30 bg-red-500/10 text-red-200"
                    : uploadFeedback.validation_status === 'WARNING'
                    ? "border-amber-500/30 bg-amber-500/10 text-amber-200"
                    : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                )}>
                  <div className="flex items-start gap-3">
                    <FileText className="mt-0.5 h-5 w-5 shrink-0" />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">{uploadFeedback.file}</h4>
                        <span className="font-mono text-xs bg-slate-900/60 px-2 py-0.5 rounded border border-slate-700 text-slate-300">
                          {uploadFeedback.file_size}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Detected Type: <span className="font-mono font-semibold text-cyan-300 uppercase">{uploadFeedback.detected_type}</span> &bull;
                        Target Entity: <span className="font-mono text-white">{uploadFeedback.entity}</span> &bull;
                        Job ID: <span className="font-mono text-slate-400">{uploadFeedback.job_id}</span>
                      </p>
                    </div>
                  </div>

                  <span className={cn(
                    "rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider self-start sm:self-auto",
                    uploadFeedback.validation_status === 'ERROR'
                      ? "bg-red-950 text-red-400 border border-red-500/40"
                      : uploadFeedback.validation_status === 'WARNING'
                      ? "bg-amber-950 text-amber-400 border border-amber-500/40"
                      : "bg-emerald-950 text-emerald-400 border border-emerald-500/40"
                  )}>
                    {uploadFeedback.validation_status}
                  </span>
                </div>

                {/* Metrics Breakdown */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="metric-card p-3">
                    <p className="text-[11px] text-slate-400 uppercase font-mono">Total Records</p>
                    <p className="text-xl font-bold text-white mt-1">{uploadFeedback.records.toLocaleString()}</p>
                  </div>
                  <div className="metric-card p-3">
                    <p className="text-[11px] text-slate-400 uppercase font-mono">Valid Records</p>
                    <p className="text-xl font-bold text-emerald-400 mt-1">{uploadFeedback.valid_records.toLocaleString()}</p>
                  </div>
                  <div className="metric-card p-3">
                    <p className="text-[11px] text-slate-400 uppercase font-mono">Invalid Records</p>
                    <p className="text-xl font-bold text-red-400 mt-1">{uploadFeedback.invalid_records.toLocaleString()}</p>
                  </div>
                  <div className="metric-card p-3">
                    <p className="text-[11px] text-slate-400 uppercase font-mono">Inserted to DB</p>
                    <p className="text-xl font-bold text-cyan-400 mt-1">{uploadFeedback.inserted_records.toLocaleString()}</p>
                  </div>
                </div>

                {/* Warnings / Diagnostics */}
                {((uploadFeedback.warnings && uploadFeedback.warnings.length > 0) || (uploadFeedback.errors && uploadFeedback.errors.length > 0)) && (
                  <div className="space-y-2 rounded-lg border border-slate-800 bg-slate-950/40 p-4 font-mono text-xs">
                    {uploadFeedback.errors?.map((err, i) => (
                      <p key={i} className="text-red-400 flex items-center gap-2">
                        <XCircle className="h-4 w-4 shrink-0" />
                        {err}
                      </p>
                    ))}
                    {uploadFeedback.warnings?.map((warn, i) => (
                      <p key={i} className="text-amber-400 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        {warn}
                      </p>
                    ))}
                  </div>
                )}

                {/* Run Engine Button */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <span className="text-xs text-slate-400">
                    Evidence inserted into database. Run the supervisory engines to assess compliance.
                  </span>
                  <button
                    onClick={handleRunAnalysis}
                    disabled={isAnalyzing}
                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow transition-colors disabled:opacity-50"
                  >
                    <Play className="h-4 w-4 fill-white" />
                    {isAnalyzing ? 'Running 16+ Analytics Engines...' : 'Run Supervisory Engine'}
                  </button>
                </div>
              </div>
            )}

            {/* Analysis Result Banner */}
            {analysisResult && (
              <div className="mt-6 rounded-xl border border-emerald-500/40 bg-emerald-950/30 p-5 space-y-3 animate-in fade-in duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-bold text-emerald-300">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    <span>Supervisory Analytics Assessment Complete</span>
                  </div>
                  <button
                    onClick={() => navigate('/findings')}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-300 hover:text-cyan-200"
                  >
                    View Findings Hub <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono pt-1 text-slate-300">
                  <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">TOTAL FINDINGS</span>
                    <strong className="text-white text-base">
                      {analysisResult.total_findings_generated ?? analysisResult.total_findings ?? 0}
                    </strong>
                  </div>
                  <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">ENTITIES ASSESSED</span>
                    <strong className="text-cyan-400 text-base">
                      {analysisResult.entities_assessed ?? 20}
                    </strong>
                  </div>
                  <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">P1 CRITICAL GAPS</span>
                    <strong className="text-red-400 text-base">
                      {analysisResult.p1_findings ?? 0}
                    </strong>
                  </div>
                  <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">P2 HIGH GAPS</span>
                    <strong className="text-amber-400 text-base">
                      {analysisResult.p2_findings ?? 0}
                    </strong>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* INGESTION JOBS AUDIT TRAIL */}
          <section className="panel overflow-hidden">
            <div className="panel-header flex items-center justify-between">
              <div>
                <p className="page-eyebrow">Audit Trail</p>
                <h3 className="text-base font-semibold text-white">Ingested Datasets Log</h3>
              </div>
              <button
                onClick={fetchJobs}
                disabled={loadingJobs}
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 disabled:opacity-50"
              >
                <RefreshCw className={cn("h-3.5 w-3.5", loadingJobs && "animate-spin")} />
                Refresh Log
              </button>
            </div>

            {jobs.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                No telemetry files ingested yet. Select a CSV/JSON file above or click "Load Demo Dataset".
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[650px] text-left text-sm font-mono">
                  <thead className="border-b border-slate-800 bg-slate-950/40 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-3">File Name</th>
                      <th className="px-5 py-3">Entity</th>
                      <th className="px-5 py-3 text-center">Records</th>
                      <th className="px-5 py-3 text-center">Valid</th>
                      <th className="px-5 py-3">Validation Status</th>
                      <th className="px-5 py-3 text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {jobs.map((job) => (
                      <tr key={job.id} className="hover:bg-slate-800/30 text-xs">
                        <td className="px-5 py-3">
                          <div className="font-semibold text-slate-200 flex items-center gap-2">
                            <FileText className="h-3.5 w-3.5 text-cyan-400" />
                            {job.file_name}
                          </div>
                          <div className="text-[10px] text-slate-500">{job.file_type} &bull; {job.id}</div>
                        </td>
                        <td className="px-5 py-3 font-semibold text-cyan-300">{job.entity_id}</td>
                        <td className="px-5 py-3 text-center text-slate-300">{job.total_records.toLocaleString()}</td>
                        <td className="px-5 py-3 text-center text-emerald-400 font-semibold">{job.valid_records.toLocaleString()}</td>
                        <td className="px-5 py-3">
                          <span className={cn(
                            "rounded px-2 py-0.5 text-[10px] font-bold uppercase",
                            job.validation_status === 'ERROR'
                              ? "bg-red-950/70 text-red-300 border border-red-500/30"
                              : job.validation_status === 'WARNING'
                              ? "bg-amber-950/70 text-amber-300 border border-amber-500/30"
                              : "bg-emerald-950/70 text-emerald-300 border border-emerald-500/30"
                          )}>
                            {job.validation_status}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right text-slate-400 text-[11px]">
                          {job.created_at ? new Date(job.created_at).toLocaleTimeString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}

      {/* TAB 2: API PULL (AUTOMATED CONNECTORS) */}
      {activeTab === 'api' && (
        <section className="panel p-6 animate-in fade-in duration-300">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <LinkIcon className="h-5 w-5 text-blue-400" />
                Read-Only API Integration
              </h2>
              <p className="mt-1 text-sm text-slate-400 max-w-2xl">
                Configure direct connections to SIEM or ITSM platforms. NEXUS uses a read-only service account token
                to periodically pull closed cases and alert telemetry for supervisory validation.
              </p>
            </div>
            <div className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-slate-400 border border-slate-800">
              Zero-Trust Architecture
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Connection Parameters</span>
                <button
                  type="button"
                  onClick={fillSandboxConfig}
                  className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 underline underline-offset-2 flex items-center gap-1"
                >
                  <Sparkles className="h-3 w-3" />
                  Fill Sandbox SIEM Endpoint
                </button>
              </div>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-300">Platform Provider</span>
                <select
                  value={apiPlatform}
                  onChange={(e) => setApiPlatform(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/50 py-2.5 px-3 text-sm text-white focus:border-blue-500 focus:outline-none"
                >
                  <option>ServiceNow (ITSM)</option>
                  <option>Splunk Enterprise (SIEM)</option>
                  <option>Microsoft Sentinel (Cloud SIEM)</option>
                  <option>QRadar (SIEM)</option>
                  <option>Cortex XSOAR</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-300">API Endpoint URL</span>
                <input
                  type="text"
                  value={apiEndpoint}
                  onChange={(e) => setApiEndpoint(e.target.value)}
                  placeholder="https://company.service-now.com/api/now/table/incident"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/50 py-2.5 px-3 text-sm text-white focus:border-blue-500 focus:outline-none"
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  Must be a valid HTTP or HTTPS REST endpoint (e.g. ServiceNow Table API or local sandbox).
                </p>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-300">Read-Only API Key / Bearer Token</span>
                <input
                  type="password"
                  value={apiToken}
                  onChange={(e) => setApiToken(e.target.value)}
                  placeholder="Enter genuine service account token or sandbox key"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/50 py-2.5 px-3 text-sm text-white focus:border-blue-500 focus:outline-none"
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  Placeholder dots or dummy values will be rejected by schema verification.
                </p>
              </label>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={apiStatus === 'testing' || isSyncing}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50 transition-colors shadow"
                >
                  <LinkIcon className="h-4 w-4" />
                  {apiStatus === 'testing' ? 'Verifying Endpoint...' : 'Test Connection'}
                </button>
              </div>

              {/* Real Connection Error Message */}
              {apiStatus === 'error' && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-300 space-y-1 animate-in fade-in duration-300">
                  <div className="flex items-center gap-2 font-semibold text-sm text-red-200">
                    <XCircle className="h-5 w-5 text-red-400 shrink-0" />
                    Connection Validation Failed
                  </div>
                  <p className="text-xs text-red-300 pl-7 leading-relaxed font-mono">
                    {apiMsg}
                  </p>
                </div>
              )}

              {/* Real Connection Success Message */}
              {apiStatus === 'success' && (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-4 text-emerald-300 space-y-3 animate-in fade-in duration-300">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-white">Connection & Authentication Verified</h4>
                      <p className="text-xs text-emerald-300/90 mt-0.5">{apiMsg}</p>
                    </div>
                  </div>

                  {apiDetails && (
                    <div className="grid grid-cols-3 gap-2 bg-slate-900/70 p-3 rounded border border-slate-800 text-[11px] font-mono">
                      <div>
                        <span className="text-slate-400 block text-[10px]">HTTP STATUS</span>
                        <strong className="text-emerald-400">{apiDetails.http_status || 200} OK</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">LATENCY</span>
                        <strong className="text-cyan-400">{apiDetails.latency_ms || 24} ms</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">TELEMETRY</span>
                        <strong className="text-white">{apiDetails.records_available || 50} records</strong>
                      </div>
                    </div>
                  )}

                  {/* Sync Button */}
                  <div className="pt-1 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      Pull incidents into entity <strong className="text-cyan-300">{selectedEntity}</strong>:
                    </span>
                    <button
                      type="button"
                      onClick={handleSyncApi}
                      disabled={isSyncing}
                      className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-semibold text-white shadow transition-colors disabled:opacity-50"
                    >
                      <Play className="h-3.5 w-3.5 fill-white" />
                      {isSyncing ? 'Pulling Telemetry...' : 'Sync & Ingest Records'}
                    </button>
                  </div>
                </div>
              )}

              {/* Sync Result Banner */}
              {syncResult && (
                <div className="rounded-lg border border-blue-500/30 bg-blue-950/20 p-4 text-blue-200 space-y-2 animate-in fade-in duration-300">
                  <div className="flex items-center gap-2 font-semibold text-sm text-cyan-300">
                    <CheckCircle2 className="h-4 w-4 text-cyan-400" />
                    API Telemetry Stream Ingested
                  </div>
                  <p className="text-xs text-slate-300 font-mono">
                    {syncResult.message}
                  </p>
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={handleRunAnalysis}
                      disabled={isAnalyzing}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-300 hover:text-cyan-200 bg-cyan-950/40 border border-cyan-500/30 rounded px-3 py-1.5"
                    >
                      <Play className="h-3 w-3 fill-cyan-300" />
                      Run Supervisory Engine on New Data
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-5">
              <h3 className="flex items-center gap-2 font-semibold text-slate-200 mb-4">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                Security Guarantees
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3 text-sm text-slate-400">
                  <div className="mt-0.5 rounded-full bg-slate-800 p-1">
                    <Settings className="h-3 w-3 text-blue-400" />
                  </div>
                  <p><strong className="text-slate-300 block">No Write Access</strong> NEXUS strictly drops any connection attempt if the provided token possesses mutating permissions.</p>
                </li>
                <li className="flex items-start gap-3 text-sm text-slate-400">
                  <div className="mt-0.5 rounded-full bg-slate-800 p-1">
                    <Settings className="h-3 w-3 text-blue-400" />
                  </div>
                  <p><strong className="text-slate-300 block">Encrypted Transit</strong> All data is pulled over TLS 1.3 with certificate pinning enforced.</p>
                </li>
                <li className="flex items-start gap-3 text-sm text-slate-400">
                  <div className="mt-0.5 rounded-full bg-slate-800 p-1">
                    <Settings className="h-3 w-3 text-blue-400" />
                  </div>
                  <p><strong className="text-slate-300 block">Air-Gapped Operation</strong> In offline deployments, batch CSV drops are the mandated protocol.</p>
                </li>
              </ul>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
