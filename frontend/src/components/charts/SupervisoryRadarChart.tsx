import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';

interface SupervisoryRadarChartProps {
  entityName?: string;
  observedScores?: number[];
  baselineScores?: number[];
}

export function SupervisoryRadarChart({
  entityName = 'Observed Sector Profile',
  observedScores = [74, 42, 48, 96, 52, 38],
  baselineScores = [85, 82, 78, 92, 80, 84],
}: SupervisoryRadarChartProps) {
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
        backgroundColor: isDark ? '#111827' : '#ffffff',
        borderColor: isDark ? '#334155' : '#e2e8f0',
        textStyle: {
          color: isDark ? '#f8fafc' : '#0f172a',
          fontSize: 12,
        },
      },
      legend: {
        bottom: 0,
        textStyle: {
          color: isDark ? '#94a3b8' : '#475569',
          fontSize: 11,
          fontFamily: 'Inter, sans-serif',
          fontWeight: 500,
        },
        itemWidth: 14,
        itemHeight: 8,
        data: ['National CSE Baseline', entityName],
      },
      radar: {
        indicator: [
          { name: 'Investigation Depth', max: 100 },
          { name: 'SLA Integrity', max: 100 },
          { name: 'Escalation Compliance', max: 100 },
          { name: 'Crown-Jewel Coverage', max: 100 },
          { name: 'Active Containment', max: 100 },
          { name: 'Shift Uniformity (24x7)', max: 100 },
        ],
        shape: 'polygon',
        splitNumber: 4,
        axisName: {
          color: isDark ? '#f1f5f9' : '#0f172a',
          fontSize: 11,
          fontFamily: 'Inter, sans-serif',
          fontWeight: 600,
        },
        splitLine: {
          lineStyle: {
            color: isDark ? 'rgba(51, 65, 85, 0.45)' : '#e2e8f0',
          },
        },
        splitArea: {
          show: true,
          areaStyle: {
            color: isDark
              ? ['rgba(17, 24, 39, 0.8)', 'rgba(15, 23, 42, 0.4)']
              : ['#ffffff', '#f8fafc'],
          },
        },
        axisLine: {
          lineStyle: {
            color: isDark ? 'rgba(51, 65, 85, 0.6)' : '#cbd5e1',
          },
        },
      },
      series: [
        {
          name: 'Supervisory Posture Assessment',
          type: 'radar',
          data: [
            {
              value: baselineScores,
              name: 'National CSE Baseline',
              symbol: 'circle',
              symbolSize: 4,
              lineStyle: {
                color: isDark ? '#38bdf8' : '#0284c7',
                width: 2,
                type: 'dashed',
              },
              itemStyle: {
                color: isDark ? '#38bdf8' : '#0284c7',
              },
              areaStyle: {
                color: isDark ? 'rgba(56, 189, 248, 0.12)' : 'rgba(2, 132, 199, 0.08)',
              },
            },
            {
              value: observedScores,
              name: entityName,
              symbol: 'circle',
              symbolSize: 6,
              lineStyle: {
                color: isDark ? '#f59e0b' : '#d97706',
                width: 2.5,
              },
              itemStyle: {
                color: isDark ? '#f59e0b' : '#d97706',
                borderColor: isDark ? '#fbbf24' : '#b45309',
                borderWidth: 2,
              },
              areaStyle: {
                color: isDark ? 'rgba(245, 158, 11, 0.22)' : 'rgba(217, 119, 6, 0.16)',
              },
            },
          ],
        },
      ],
    };
  }, [entityName, observedScores, baselineScores, isDark]);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-amber-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            Control Posture vs National Baseline
          </span>
        </div>
        <span className="font-mono text-[11px] text-amber-600 dark:text-amber-400 font-bold">
          Multi-Axis Deviation Analysis
        </span>
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
