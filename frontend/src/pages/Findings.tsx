import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
} from '@tanstack/react-table';
import type { ColumnDef } from '@tanstack/react-table';
import { Search, AlertCircle, FileText, Filter, CheckCircle2, XCircle, HelpCircle, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '../lib/utils';

const API_URL = 'http://localhost:8000/api';

interface Finding {
  finding_id: string;
  type: string;
  entity_id: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  description: string;
  outcome?: 'SUPPORTED' | 'CONTRADICTED' | 'UNVERIFIABLE';
  evidence?: any;
}

const severityColors = {
  Critical: 'bg-red-500/10 text-red-500 border-red-500/20',
  High: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  Medium: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  Low: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
};

const outcomeConfig = {
  SUPPORTED: { icon: CheckCircle2, color: 'text-emerald-500' },
  CONTRADICTED: { icon: XCircle, color: 'text-red-500' },
  UNVERIFIABLE: { icon: HelpCircle, color: 'text-amber-500' }
};

export function Findings() {
  const [globalFilter, setGlobalFilter] = useState('');
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);

  const { data: findings = [], isLoading, error } = useQuery({
    queryKey: ['findings'],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/findings`);
      return res.data.findings as Finding[];
    }
  });

  const columns = useMemo<ColumnDef<Finding>[]>(() => [
    {
      accessorKey: 'finding_id',
      header: 'ID',
      cell: info => <span className="font-mono text-xs text-slate-500">{info.getValue() as string}</span>,
    },
    {
      accessorKey: 'type',
      header: 'Finding Type',
      cell: info => <span className="font-medium text-slate-200">{info.getValue() as string}</span>,
    },
    {
      accessorKey: 'entity_id',
      header: 'Entity',
      cell: info => <span className="text-slate-300">{info.getValue() as string}</span>,
    },
    {
      accessorKey: 'severity',
      header: 'Priority',
      cell: info => {
        const sev = info.getValue() as Finding['severity'];
        return (
          <span className={cn("px-2 py-1 rounded text-xs font-medium border", severityColors[sev])}>
            {sev}
          </span>
        );
      }
    },
    {
      accessorKey: 'outcome',
      header: 'Assessment',
      cell: info => {
        const outcome = info.getValue() as Finding['outcome'];
        if (!outcome) return <span className="text-slate-500">-</span>;
        const Icon = outcomeConfig[outcome].icon;
        return (
          <div className="flex items-center space-x-1.5">
            <Icon className={cn("w-4 h-4", outcomeConfig[outcome].color)} />
            <span className="text-sm text-slate-300">{outcome}</span>
          </div>
        );
      }
    }
  ], []);

  const table = useReactTable({
    data: findings,
    columns,
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 15 }
    }
  });

  if (error) {
    return (
      <div className="p-8 text-red-400 flex items-center space-x-2">
        <AlertCircle className="w-5 h-5" />
        <span>Failed to load findings data.</span>
      </div>
    );
  }

  return (
    <div className="flex h-full gap-6">
      {/* Main Table Area */}
      <div className={cn("flex flex-col flex-1 h-full min-h-0 transition-all duration-300", selectedFinding ? "w-2/3" : "w-full")}>
        <div className="mb-6 shrink-0">
          <h2 className="text-2xl font-bold flex items-center space-x-3 mb-2">
            <Search className="text-primary w-6 h-6" />
            <span>Findings Hub</span>
          </h2>
          <p className="text-slate-400 text-sm">
            Unified, filterable datagrid of all anomalies, gaps, and validation results across all engines.
          </p>
        </div>

        <div className="bg-card rounded-xl border border-slate-800 flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Toolbar */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50 shrink-0">
            <div className="relative w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input 
                type="text"
                placeholder="Search findings, entities, IDs..."
                value={globalFilter ?? ''}
                onChange={e => setGlobalFilter(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="flex space-x-2">
              <button className="flex items-center space-x-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-colors text-slate-300">
                <Filter className="w-4 h-4" />
                <span>Filters</span>
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="flex-1 overflow-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider text-xs sticky top-0 z-10 shadow-sm border-b border-slate-800">
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <th 
                        key={header.id} 
                        className="px-4 py-3 font-medium cursor-pointer hover:text-white transition-colors"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <div className="flex items-center space-x-1">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {{
                            asc: ' ↑',
                            desc: ' ↓',
                          }[header.column.getIsSorted() as string] ?? null}
                        </div>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-gray-800">
                {isLoading ? (
                  <tr><td colSpan={columns.length} className="px-4 py-8 text-center text-slate-500">Loading findings...</td></tr>
                ) : table.getRowModel().rows.length === 0 ? (
                  <tr><td colSpan={columns.length} className="px-4 py-8 text-center text-slate-500">No findings match your search.</td></tr>
                ) : (
                  table.getRowModel().rows.map(row => (
                    <tr 
                      key={row.id}
                      onClick={() => setSelectedFinding(selectedFinding?.finding_id === row.original.finding_id ? null : row.original)}
                      className={cn(
                        "hover:bg-slate-800/50 cursor-pointer transition-colors",
                        selectedFinding?.finding_id === row.original.finding_id && "bg-slate-800/80"
                      )}
                    >
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id} className="px-4 py-3 whitespace-nowrap">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-3 border-t border-slate-800 bg-slate-900/50 flex items-center justify-between shrink-0 text-sm text-slate-400">
            <div>
              Showing {table.getRowModel().rows.length} of {findings.length} findings
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex space-x-1">
                <button 
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="p-1 rounded hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="p-1 rounded hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side Detail Panel */}
      {selectedFinding && (
        <div className="w-1/3 bg-card border border-slate-800 rounded-xl flex flex-col h-[calc(100vh-8rem)] shrink-0 animate-in slide-in-from-right-8 duration-300">
          <div className="p-5 border-b border-slate-800 flex items-start justify-between bg-slate-900/30">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border", severityColors[selectedFinding.severity])}>
                  {selectedFinding.severity}
                </span>
                <span className="font-mono text-xs text-slate-500">{selectedFinding.finding_id}</span>
              </div>
              <h3 className="text-lg font-semibold leading-tight">{selectedFinding.type}</h3>
            </div>
            <button 
              onClick={() => setSelectedFinding(null)}
              className="text-slate-500 hover:text-slate-300 ml-2 shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="p-5 flex-1 overflow-y-auto space-y-6">
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Entity</h4>
              <p className="text-slate-200 font-medium">{selectedFinding.entity_id}</p>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Description</h4>
              <p className="text-slate-300 text-sm leading-relaxed">
                {selectedFinding.description}
              </p>
            </div>

            {selectedFinding.evidence && (
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  Structured Evidence
                </h4>
                <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800 overflow-x-auto">
                  <pre className="text-xs text-slate-400 font-mono">
                    {JSON.stringify(selectedFinding.evidence, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
          
          <div className="p-4 border-t border-slate-800 bg-slate-900/30 space-y-2">
            <button className="w-full py-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-lg transition-colors">
              Move to Review Queue
            </button>
            <button className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-lg transition-colors">
              Dismiss as False Positive
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
