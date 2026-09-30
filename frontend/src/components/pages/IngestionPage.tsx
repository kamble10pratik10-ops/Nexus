import React, { useState, useEffect } from 'react';
import {
  UploadCloud,
  FileCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Play,
  Database,
  RefreshCw,
  FileText,
  Sparkles,
  Info
} from 'lucide-react';
import { SATSAApi } from '../../services/api';
import { IngestionJob } from '../../types';

interface IngestionPageProps {
  onAnalysisCompleted?: () => void;
}

export const IngestionPage: React.FC<IngestionPageProps> = ({ onAnalysisCompleted }) => {
  const [jobs, setJobs] = useState<IngestionJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState('CSE-01');
  const [uploadFeedback, setUploadFeedback] = useState<any | null>(null);
  const [analysisSummary, setAnalysisSummary] = useState<any | null>(null);

  const fetchJobs = async () => {
    try {
      const data = await SATSAApi.getIngestionJobs();
      setJobs(data);
    } catch (err) {
      console.error('Failed to load ingestion history:', err);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    setLoading(true);
    setUploadFeedback(null);
    try {
      const res = await SATSAApi.uploadDataset(file, selectedEntity);
      setUploadFeedback(res);
      await fetchJobs();
    } catch (err: any) {
      setUploadFeedback({
        validation_status: 'ERROR',
        file: file.name,
        errors: [err?.response?.data?.detail || 'File schema validation or upload failure.'],
        warnings: []
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRunAnalysis = async () => {
    setAnalyzing(true);
    setAnalysisSummary(null);
    try {
      const res = await SATSAApi.runAnalysis();
      setAnalysisSummary(res);
      if (onAnalysisCompleted) {
        onAnalysisCompleted();
      }
    } catch (err) {
      console.error('Failed to run supervisory analysis:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleLoadDemoDataset = async () => {
    setDemoLoading(true);
    setAnalysisSummary(null);
    try {
      const res = await SATSAApi.loadDemoDataset();
      setAnalysisSummary(res?.analysis_result);
      await fetchJobs();
      if (onAnalysisCompleted) {
        onAnalysisCompleted();
      }
    } catch (err) {
      console.error('Failed to load synthetic demonstration dataset:', err);
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1C2541] pb-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Data Ingestion & Schema Normalization</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Section 4 & 5: Upload periodic CSV/JSON telemetry, enforce strict schema validation, and normalize data.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Load Demo Dataset Button (Section 4 & 15) */}
          <button
            onClick={handleLoadDemoDataset}
            disabled={demoLoading || analyzing}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 text-white text-xs font-semibold rounded-lg shadow-md transition-all disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-cyan-300" />
            <span>{demoLoading ? 'Seeding Synthetic Demo...' : 'Load Demo Dataset'}</span>
          </button>

          {/* Run Analysis Button (Section 4) */}
          <button
            onClick={handleRunAnalysis}
            disabled={analyzing || demoLoading}
            className="flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-black text-xs font-bold rounded-lg shadow-md transition-all disabled:opacity-50"
          >
            <Play className="w-4 h-4 fill-black" />
            <span>{analyzing ? 'Evaluating Engines...' : 'Run Analysis'}</span>
          </button>
        </div>
      </div>

      {/* Analysis Result Banner */}
      {analysisSummary && (
        <div className="bg-emerald-950/40 border border-emerald-500/50 rounded-xl p-4 text-emerald-300 space-y-2">
          <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Supervisory Analytics Engine Run Complete</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono pt-1 text-slate-200">
            <div>
              <span className="text-slate-400">Total Findings: </span>
              <strong className="text-white">{analysisSummary.total_findings || 0}</strong>
            </div>
            <div>
              <span className="text-slate-400">Execution Gaps: </span>
              <strong className="text-red-400">{analysisSummary.execution_gaps || 0}</strong>
            </div>
            <div>
              <span className="text-slate-400">Negative Space: </span>
              <strong className="text-purple-400">{analysisSummary.negative_space || 0}</strong>
            </div>
            <div>
              <span className="text-slate-400">P1 Reviews: </span>
              <strong className="text-amber-400">{analysisSummary.p1_findings || 0}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Section 4 & 5: Upload Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Upload Drop Zone (1 Col) */}
        <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-white uppercase tracking-wider">
            <UploadCloud className="w-4 h-4 text-cyan-400" />
            <span>Batch Upload Ingest</span>
          </div>

          <div>
            <label className="block text-[11px] font-mono text-slate-400 mb-1">
              TARGET CRITICAL SECTOR ENTITY (CSE)
            </label>
            <select
              value={selectedEntity}
              onChange={(e) => setSelectedEntity(e.target.value)}
              className="w-full bg-[#0B132B] border border-[#2D3A5F] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
            >
              {Array.from({ length: 20 }, (_, i) => {
                const id = `CSE-${String(i + 1).padStart(2, '0')}`;
                return (
                  <option key={id} value={id}>
                    {id} (Critical Infrastructure)
                  </option>
                );
              })}
            </select>
          </div>

          <div className="relative border-2 border-dashed border-[#2D3A5F] hover:border-cyan-400/60 rounded-xl p-6 text-center transition-colors bg-[#0B132B]/60">
            <input
              type="file"
              accept=".csv,.json"
              onChange={handleFileUpload}
              disabled={loading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
              <UploadCloud className="w-8 h-8 text-cyan-400" />
              <div className="text-xs font-semibold text-white">Drop CSV or JSON file here</div>
              <div className="text-[10px] text-slate-400 font-mono">
                ALERT, CASE, ASSET, ESCALATION, or RESPONSE batch files
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 space-y-1 bg-[#131E3A] p-3 rounded-lg border border-[#1C2541]">
            <div className="text-slate-300 font-semibold flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-cyan-400" />
              Automatic Ingestion Flow:
            </div>
            <div>1. File type detection (.csv / .json)</div>
            <div>2. Strict schema and field validation</div>
            <div>3. Value & timestamp normalization</div>
            <div>4. Direct storage into supervisory analytics models</div>
          </div>
        </div>

        {/* Real-time Validation Feedback Card (2 Cols) */}
        <div className="lg:col-span-2 bg-[#0F172A] border border-[#1E293B] rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#1C2541]">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-400" />
                <h2 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                  Schema Validation Real-Time Result
                </h2>
              </div>
              {uploadFeedback && (
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                    uploadFeedback.validation_status === 'ERROR'
                      ? 'bg-red-950/60 border border-red-500/40 text-red-300'
                      : uploadFeedback.validation_status === 'WARNING'
                      ? 'bg-amber-950/60 border border-amber-500/40 text-amber-300'
                      : 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
                  }`}
                >
                  {uploadFeedback.validation_status}
                </span>
              )}
            </div>

            {uploadFeedback ? (
              <div className="mt-4 space-y-4 font-mono text-xs">
                {/* Metric Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#0B132B] p-3 rounded-lg border border-[#1C2541]">
                  <div>
                    <span className="text-[10px] text-slate-400 block">FILE</span>
                    <strong className="text-white truncate block">{uploadFeedback.file}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">ENTITY</span>
                    <strong className="text-cyan-400 block">{uploadFeedback.entity}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">TOTAL RECORDS</span>
                    <strong className="text-white block">{uploadFeedback.records || 0}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">VALID / INVALID</span>
                    <span className="text-emerald-400 font-bold">{uploadFeedback.valid_records || 0}</span>
                    <span className="text-slate-400"> / </span>
                    <span className="text-red-400 font-bold">{uploadFeedback.invalid_records || 0}</span>
                  </div>
                </div>

                {/* Section 5 Validation Messages */}
                <div className="space-y-2">
                  <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                    Validation Diagnostics:
                  </div>

                  {uploadFeedback.errors && uploadFeedback.errors.length > 0 && (
                    <div className="bg-red-950/50 border border-red-500/40 rounded-lg p-3 text-red-300 space-y-1">
                      <div className="font-bold flex items-center gap-1.5 text-xs">
                        <XCircle className="w-4 h-4 text-red-400" />
                        ERROR
                      </div>
                      {uploadFeedback.errors.map((err: string, i: number) => (
                        <div key={i} className="text-[11px] pl-5">
                          {err}
                        </div>
                      ))}
                    </div>
                  )}

                  {uploadFeedback.warnings && uploadFeedback.warnings.length > 0 && (
                    <div className="bg-amber-950/40 border border-amber-500/40 rounded-lg p-3 text-amber-200 space-y-1">
                      <div className="font-bold flex items-center gap-1.5 text-xs">
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                        WARNING
                      </div>
                      {uploadFeedback.warnings.map((warn: string, i: number) => (
                        <div key={i} className="text-[11px] pl-5">
                          {warn}
                        </div>
                      ))}
                    </div>
                  )}

                  {uploadFeedback.validation_status === 'SUCCESS' && (
                    <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-lg p-3 text-emerald-300 space-y-1">
                      <div className="font-bold flex items-center gap-1.5 text-xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        SUCCESS
                      </div>
                      <div className="text-[11px] pl-5">
                        Schema validation completed successfully. All records normalized and inserted into database.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 font-mono text-xs space-y-2">
                <FileText className="w-8 h-8 text-slate-600 mx-auto" />
                <div>No file uploaded in this session yet.</div>
                <div className="text-[11px] text-slate-500">
                  Select a CSV or JSON file on the left or click &quot;Load Demo Dataset&quot;.
                </div>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-[#1C2541] flex items-center justify-between text-[11px] text-slate-400">
            <span>Section 6 Normalization: Severity (CRITICAL), Timestamps (ISO UTC), Case Encodings</span>
            <span className="font-mono text-cyan-400">Engine Ready</span>
          </div>
        </div>
      </div>

      {/* Section 4 Display Table: File, Entity, Records, Valid Records, Invalid Records, Status */}
      <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#1C2541]">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
            Ingested Datasets Log
          </h2>
          <span className="text-xs text-slate-400 font-mono">{jobs.length} jobs recorded</span>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[#1C2541] text-slate-400 uppercase text-[10px]">
                <th className="py-2.5 px-3">File</th>
                <th className="py-2.5 px-3">Entity</th>
                <th className="py-2.5 px-3 text-center">Records</th>
                <th className="py-2.5 px-3 text-center">Valid Records</th>
                <th className="py-2.5 px-3 text-center">Invalid Records</th>
                <th className="py-2.5 px-3">Validation Result</th>
                <th className="py-2.5 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1C2541]/60">
              {jobs.map((j) => (
                <tr key={j.id} className="hover:bg-[#1C2541]/40 transition-colors">
                  <td className="py-3 px-3">
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{j.file_name}</span>
                    </div>
                    <div className="text-[10px] text-slate-400">{j.file_type} format &bull; {j.id}</div>
                  </td>
                  <td className="py-3 px-3 text-cyan-400 font-semibold">{j.entity_id}</td>
                  <td className="py-3 px-3 text-center text-slate-200">{j.total_records.toLocaleString()}</td>
                  <td className="py-3 px-3 text-center text-emerald-400 font-semibold">
                    {j.valid_records.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-center text-red-400">
                    {j.invalid_records.toLocaleString()}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        j.validation_status === 'ERROR'
                          ? 'bg-red-950/60 text-red-300 border border-red-500/40'
                          : j.validation_status === 'WARNING'
                          ? 'bg-amber-950/60 text-amber-300 border border-amber-500/40'
                          : 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40'
                      }`}
                    >
                      {j.validation_status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span className="text-[10px] bg-[#1C2541] text-slate-300 px-2 py-0.5 rounded">
                      {j.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
