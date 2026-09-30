import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { CheckSquare, AlertCircle, HelpCircle, CheckCircle2, XCircle, FileSearch, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';

const API_URL = 'http://localhost:8000/api';

type ClaimStatus = 'SUPPORTED' | 'CONTRADICTED' | 'UNVERIFIABLE';

interface Claim {
  claim: string;
  status: ClaimStatus;
  demo_text: string;
}

const statusConfig = {
  SUPPORTED: {
    icon: CheckCircle2,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    label: 'Supported by Evidence'
  },
  CONTRADICTED: {
    icon: XCircle,
    color: 'text-red-500',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    label: 'Contradicted by Evidence'
  },
  UNVERIFIABLE: {
    icon: HelpCircle,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    label: 'Evidence Unverifiable'
  }
};

export function ClaimsAssurance() {
  const [selectedClaim, setSelectedClaim] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['claims-matrix'],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/claims-matrix`);
      return res.data.claims_matrix as Claim[];
    }
  });

  if (isLoading) {
    return <div className="p-8 text-slate-400">Evaluating capability claims...</div>;
  }

  if (error || !data) {
    return (
      <div className="p-8 text-red-400 flex items-center space-x-2">
        <AlertCircle className="w-5 h-5" />
        <span>Failed to load claims matrix.</span>
      </div>
    );
  }

  const selectedData = data.find(c => c.claim === selectedClaim);

  return (
    <div className="flex h-full gap-6">
      {/* Left Side: Claims Matrix Table */}
      <div className={cn("flex-1 transition-all duration-300", selectedClaim ? "w-2/3" : "w-full")}>
        <div className="mb-6">
          <h2 className="text-2xl font-bold flex items-center space-x-3 mb-2">
            <CheckSquare className="text-primary w-6 h-6" />
            <span>Claims Assurance</span>
          </h2>
          <p className="text-slate-400 text-sm">
            Comparison of declared organizational capabilities against demonstrated evidentiary artifacts.
          </p>
        </div>

        <div className="bg-card rounded-xl border border-slate-800 overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-900/50 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-xs">
              <tr>
                <th className="px-6 py-4 font-medium">Declared Capability</th>
                <th className="px-6 py-4 font-medium">Assessment</th>
                <th className="px-6 py-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {data.map((item) => {
                const StatusIcon = statusConfig[item.status].icon;
                const isSelected = selectedClaim === item.claim;

                return (
                  <tr 
                    key={item.claim} 
                    onClick={() => setSelectedClaim(isSelected ? null : item.claim)}
                    className={cn(
                      "hover:bg-slate-800/50 cursor-pointer transition-colors",
                      isSelected && "bg-slate-800/80"
                    )}
                  >
                    <td className="px-6 py-5">
                      <div className="font-medium text-slate-200">{item.claim}</div>
                      <div className="text-slate-500 text-xs mt-1 truncate max-w-md">
                        {item.demo_text}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border",
                        statusConfig[item.status].bg,
                        statusConfig[item.status].color,
                        statusConfig[item.status].border
                      )}>
                        <StatusIcon className="w-3.5 h-3.5 mr-1.5" />
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button className="text-slate-400 hover:text-white transition-colors">
                        <ArrowRight className="w-5 h-5 inline-block" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right Side: Detail Panel */}
      {selectedClaim && selectedData && (
        <div className="w-1/3 bg-card border border-slate-800 rounded-xl flex flex-col shrink-0 animate-in slide-in-from-right-8 duration-300">
          <div className="p-6 border-b border-slate-800 flex items-start justify-between bg-slate-900/30">
            <div>
              <h3 className="text-lg font-semibold mb-2">{selectedData.claim}</h3>
              <span className={cn(
                "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border",
                statusConfig[selectedData.status].bg,
                statusConfig[selectedData.status].color,
                statusConfig[selectedData.status].border
              )}>
              {(() => {
                const StatusIcon = statusConfig[selectedData.status].icon;
                return <StatusIcon className="w-3.5 h-3.5 mr-1.5" />;
              })()}
                {statusConfig[selectedData.status].label}
              </span>
            </div>
            <button 
              onClick={() => setSelectedClaim(null)}
              className="text-slate-500 hover:text-slate-300"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
          
          <div className="p-6 flex-1 overflow-y-auto space-y-6">
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center">
                <FileSearch className="w-4 h-4 mr-2" />
                Evidentiary Basis
              </h4>
              <p className="text-slate-300 text-sm leading-relaxed bg-slate-900/50 p-4 rounded-lg border border-slate-800">
                {selectedData.demo_text}
              </p>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Recommended Supervisory Action</h4>
              {selectedData.status === 'SUPPORTED' && (
                <div className="text-sm text-slate-300">
                  <p>No immediate supervisory intervention required. Capability appears functional based on provided telemetry.</p>
                </div>
              )}
              {selectedData.status === 'CONTRADICTED' && (
                <div className="text-sm text-red-200 bg-red-900/20 p-4 rounded-lg border border-red-900/50">
                  <p className="font-semibold mb-1">Mandatory Review Required</p>
                  <p>The declared capability is demonstrably false based on the submitted artifacts. Initiate a targeted audit of the associated procedures.</p>
                </div>
              )}
              {selectedData.status === 'UNVERIFIABLE' && (
                <div className="text-sm text-amber-200 bg-amber-900/20 p-4 rounded-lg border border-amber-900/50">
                  <p className="font-semibold mb-1">Request Additional Evidence</p>
                  <p>Current datasets lack sufficient detail to validate this claim. Issue an RFI (Request For Information) for raw logs or uncensored case notes.</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="p-4 border-t border-slate-800 bg-slate-900/30">
            <button className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-lg transition-colors">
              Add to Formal Review Report
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
