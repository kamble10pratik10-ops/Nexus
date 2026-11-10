import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';

interface EvidenceSankeyChartProps {
  totalAlerts?: number;
  totalCases?: number;
  totalEscalations?: number;
  totalResponses?: number;
}

export function EvidenceSankeyChart({
  totalAlerts = 4087,
  totalCases = 3113,
  totalEscalations = 533,
  totalResponses = 492,
}: EvidenceSankeyChartProps) {
  const uninvestigated = Math.max(0, totalAlerts - totalCases);
  const unescalated = Math.max(0, totalCases - totalEscalations);
  const unresponded = Math.max(0, totalEscalations - totalResponses);

  const [themeMode, setThemeMode] = React.useState(() =>
    typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : true
  );

  React.useEffect(() => {
    const updateTheme = () => {
      setThemeMode(document.documentElement.classList.contains('dark'));
    };
    window.addEventListener('theme-changed', updateTheme);
    return () => window.removeEventListener('theme-changed', updateTheme);
  }, []);

  const isDark = themeMode;

  const option = useMemo(() => {
    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        triggerOn: 'mousemove',
        backgroundColor: isDark ? '#111827' : '#ffffff',
        borderColor: isDark ? '#334155' : '#e2e8f0',
        textStyle: {
          color: isDark ? '#f8fafc' : '#0f172a',
          fontSize: 12,
        },
        formatter: (params: any) => {
          if (params.dataType === 'edge') {
            return `
              <div class="p-1">
                <div class="font-bold ${isDark ? 'text-sky-400' : 'text-sky-600'}">${params.data.source} → ${params.data.target}</div>
                <div class="mt-1 font-mono font-bold ${isDark ? 'text-white' : 'text-slate-900'} text-sm">${params.data.value.toLocaleString()} records</div>
                <div class="mt-1 text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}">${params.data.description || 'Evidence transition verified'}</div>
              </div>
            `;
          }
          return `
            <div class="p-1">
              <div class="font-bold ${isDark ? 'text-white' : 'text-slate-900'}">${params.name}</div>
              <div class="mt-1 font-mono font-bold ${isDark ? 'text-sky-300' : 'text-sky-700'} text-sm">${params.value?.toLocaleString() || ''} total items</div>
            </div>
          `;
        },
      },
      series: [
        {
          type: 'sankey',
          layout: 'none',
          emphasis: {
            focus: 'adjacency',
          },
          nodeWidth: 20,
          nodeGap: 16,
          draggable: false,
          orient: 'horizontal',
          label: {
            color: isDark ? '#f1f5f9' : '#0f172a',
            fontFamily: 'Inter, sans-serif',
            fontSize: 11.5,
            fontWeight: 600,
          },
          lineStyle: {
            color: 'gradient',
            curveness: 0.5,
            opacity: 0.45,
          },
          data: [
            { name: '1. Ingested Alerts', itemStyle: { color: isDark ? '#38bdf8' : '#0284c7' } },
            { name: '2. Triage Cases', itemStyle: { color: isDark ? '#818cf8' : '#4f46e5' } },
            { name: 'Uninvestigated / Dropped', itemStyle: { color: isDark ? '#f43f5e' : '#e11d48' } },
            { name: '3. Tier-2 Escalations', itemStyle: { color: isDark ? '#10b981' : '#059669' } },
            { name: 'L1 Local Closures', itemStyle: { color: isDark ? '#f59e0b' : '#d97706' } },
            { name: '4. Verified Responses', itemStyle: { color: isDark ? '#06b6d4' : '#0891b2' } },
            { name: 'Missing Containment', itemStyle: { color: isDark ? '#e11d48' : '#be123c' } },
          ],
          links: [
            {
              source: '1. Ingested Alerts',
              target: '2. Triage Cases',
              value: totalCases,
              description: 'Alerts formally investigated with documented case files.',
            },
            {
              source: '1. Ingested Alerts',
              target: 'Uninvestigated / Dropped',
              value: uninvestigated,
              lineStyle: { color: isDark ? '#f43f5e' : '#e11d48', opacity: 0.6 },
              description: 'Negative space: Alerts dropped or closed without formal case record.',
            },
            {
              source: '2. Triage Cases',
              target: '3. Tier-2 Escalations',
              value: totalEscalations,
              description: 'Confirmed incidents escalated to Senior Tier-2 / CISO oversight.',
            },
            {
              source: '2. Triage Cases',
              target: 'L1 Local Closures',
              value: unescalated,
              lineStyle: { color: isDark ? '#f59e0b' : '#d97706', opacity: 0.5 },
              description: 'Cases closed at Tier-1 triage level without escalation artifact.',
            },
            {
              source: '3. Tier-2 Escalations',
              target: '4. Verified Responses',
              value: totalResponses,
              description: 'Host isolation, IP blocking, or credential revocation verified in telemetry.',
            },
            {
              source: '3. Tier-2 Escalations',
              target: 'Missing Containment',
              value: unresponded,
              lineStyle: { color: isDark ? '#e11d48' : '#be123c', opacity: 0.7 },
              description: 'Execution gap: Critical escalated incidents missing active containment proof.',
            },
          ],
        },
      ],
    };
  }, [totalAlerts, totalCases, totalEscalations, totalResponses, uninvestigated, unescalated, unresponded, isDark]);

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-sky-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            Supervisory Evidence Pipeline (End-to-End Flow)
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
            <span className="size-2 rounded-full bg-sky-500" /> Verified Links
          </span>
          <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-semibold">
            <span className="size-2 rounded-full bg-rose-500" /> Evidentiary Drops
          </span>
        </div>
      </div>
      <div className="h-[280px] w-full">
        <ReactECharts
          option={option}
          style={{ height: '100%', width: '100%' }}
          opts={{ renderer: 'svg' }}
        />
      </div>
    </div>
  );
}
