import React, { useState } from 'react';
import { UploadCloud, Link as LinkIcon, CheckCircle2, Play, FileText, Settings, ShieldCheck } from 'lucide-react';
import { cn } from '../lib/utils';

export function Integrations() {
  const [activeTab, setActiveTab] = useState<'api' | 'export'>('api');
  const [apiStatus, setApiStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success'>('idle');

  const handleTestConnection = () => {
    setApiStatus('testing');
    setTimeout(() => {
      setApiStatus('success');
    }, 1500);
  };

  const handleUpload = () => {
    setUploadStatus('uploading');
    setTimeout(() => {
      setUploadStatus('success');
    }, 2000);
  };

  return (
    <div className="page-shell space-y-8">
      <header className="page-header">
        <p className="page-eyebrow">Data Ingestion</p>
        <h1 className="page-title">Integrations & Pipelines</h1>
        <p className="page-description">
          Connect NEXUS to existing SOC infrastructure. Configure read-only API integrations or securely upload batch data exports for analysis.
        </p>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-px">
        <button
          type="button"
          onClick={() => setActiveTab('api')}
          className={cn(
            "flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
            activeTab === 'api'
              ? "border-blue-500 text-blue-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          )}
        >
          <LinkIcon className="h-4 w-4" />
          API Pull (Automated)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('export')}
          className={cn(
            "flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
            activeTab === 'export'
              ? "border-blue-500 text-blue-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          )}
        >
          <UploadCloud className="h-4 w-4" />
          Batch Export (Secure Drop)
        </button>
      </div>

      {activeTab === 'api' && (
        <section className="panel p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <LinkIcon className="h-5 w-5 text-blue-400" />
                Read-Only API Integration
              </h2>
              <p className="mt-1 text-sm text-slate-400 max-w-2xl">
                Configure direct connections to SIEM or ITSM platforms. NEXUS requires a read-only service account token to periodically pull closed cases and alert telemetry for supervisory validation.
              </p>
            </div>
            <div className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-slate-400 border border-slate-800">
              Zero-Trust Architecture
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-300">Platform Provider</span>
                <select className="w-full rounded-lg border border-slate-700 bg-slate-900/50 py-2.5 px-3 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none">
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
                  placeholder="https://company.service-now.com/api/now/table/incident"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/50 py-2.5 px-3 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-300">Read-Only API Key / Bearer Token</span>
                <input
                  type="password"
                  placeholder="••••••••••••••••••••••••"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/50 py-2.5 px-3 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <p className="mt-1.5 text-xs text-slate-500">Ensure the token only has read access to the specified table/index.</p>
              </label>

              <div className="pt-4 flex gap-3">
                <button
                  onClick={handleTestConnection}
                  disabled={apiStatus === 'testing'}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:opacity-50"
                >
                  {apiStatus === 'testing' ? 'Connecting...' : 'Test Connection'}
                </button>
                <button className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/50 px-5 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400">
                  Save Configuration
                </button>
              </div>

              {apiStatus === 'success' && (
                <div className="mt-4 flex items-start gap-3 rounded-lg border border-green-500/20 bg-green-500/10 p-4 text-green-300">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                  <div>
                    <h3 className="text-sm font-medium">Connection Successful</h3>
                    <p className="mt-1 text-xs opacity-80">Successfully authenticated. Found 12,450 records available for supervisory analysis.</p>
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
                  <p><strong className="text-slate-300 block">Query Restrictions</strong> Queries are hardcoded to limit time ranges (e.g., -24h) and only target necessary metadata.</p>
                </li>
              </ul>
            </div>
          </div>
        </section>
      )}

      {activeTab === 'export' && (
        <section className="panel p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="mb-6 flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <UploadCloud className="h-5 w-5 text-blue-400" />
                Secure Data Drop
              </h2>
              <p className="mt-1 text-sm text-slate-400 max-w-2xl">
                For highly-secure or air-gapped environments. Export alert and case logs from your SIEM as CSV/JSON and drop them here for automated validation.
              </p>
            </div>
            <div className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-slate-400 border border-slate-800">
              Tamper-Evident Parsing
            </div>
          </div>

          <div className="mt-8 rounded-xl border-2 border-dashed border-slate-700 bg-slate-900/20 hover:bg-slate-800/30 transition-colors">
            <div className="px-6 py-14 text-center">
              <UploadCloud className="mx-auto h-12 w-12 text-slate-500 mb-4" />
              <h3 className="text-base font-semibold text-slate-200">Drag & drop your export files here</h3>
              <p className="mt-2 text-sm text-slate-500">Supports CSV, JSON, and Parquet up to 500MB</p>
              
              <div className="mt-6 flex justify-center">
                <button 
                  onClick={handleUpload}
                  disabled={uploadStatus === 'uploading'}
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 border border-slate-700 focus:outline-none"
                >
                  {uploadStatus === 'uploading' ? 'Analyzing file integrity...' : 'Select Files'}
                </button>
              </div>
            </div>
          </div>

          {uploadStatus === 'success' && (
            <div className="mt-6 space-y-4">
              <div className="flex items-start gap-3 rounded-lg border border-blue-500/20 bg-blue-500/10 p-4 text-blue-300">
                <FileText className="mt-0.5 h-5 w-5 shrink-0" />
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-semibold">SOC_Alerts_Oct2023_Final.csv</h3>
                    <span className="text-xs font-mono bg-blue-500/20 px-2 py-1 rounded">24.1 MB</span>
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Tamper checks passed</span>
                    <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> 14,209 rows processed</span>
                    <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Schema validated</span>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                 <button className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400">
                  <Play className="h-4 w-4" />
                  Run Supervisory Engine
                </button>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
