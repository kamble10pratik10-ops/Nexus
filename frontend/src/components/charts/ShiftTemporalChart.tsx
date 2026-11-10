import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';

interface ShiftTemporalChartProps {
  morningMTTR?: number;
  eveningMTTR?: number;
  nightMTTR?: number;
}

export function ShiftTemporalChart({
  morningMTTR = 231.7,
  eveningMTTR = 233.4,
  nightMTTR = 245.1,
}: ShiftTemporalChartProps) {
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
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          crossStyle: {
            color: '#64748b',
          },
        },
        backgroundColor: isDark ? '#111827' : '#ffffff',
        borderColor: isDark ? '#334155' : '#e2e8f0',
        textStyle: {
          color: isDark ? '#f8fafc' : '#0f172a',
          fontSize: 12,
        },
      },
      legend: {
        top: 0,
        textStyle: {
          color: isDark ? '#94a3b8' : '#475569',
          fontSize: 11,
          fontFamily: 'Inter, sans-serif',
          fontWeight: 500,
        },
        data: ['Observed MTTR (Minutes)', 'Declared SLA Threshold (30m)'],
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '8%',
        top: '18%',
        containLabel: true,
      },
      xAxis: [
        {
          type: 'category',
          data: ['Morning (08:00 - 16:00)', 'Evening (16:00 - 00:00)', 'Night (00:00 - 08:00)'],
          axisPointer: {
            type: 'shadow',
          },
          axisLabel: {
            color: isDark ? '#cbd5e1' : '#334155',
            fontSize: 11,
            fontWeight: 500,
            fontFamily: 'Inter, sans-serif',
          },
          axisLine: {
            lineStyle: {
              color: isDark ? '#334155' : '#cbd5e1',
            },
          },
        },
      ],
      yAxis: [
        {
          type: 'value',
          name: 'Minutes',
          nameTextStyle: {
            color: isDark ? '#94a3b8' : '#64748b',
            fontSize: 11,
          },
          min: 0,
          max: 300,
          interval: 50,
          axisLabel: {
            color: isDark ? '#cbd5e1' : '#334155',
            fontSize: 11,
            formatter: '{value} m',
          },
          splitLine: {
            lineStyle: {
              color: isDark ? 'rgba(51, 65, 85, 0.4)' : '#e2e8f0',
            },
          },
        },
      ],
      series: [
        {
          name: 'Observed MTTR (Minutes)',
          type: 'bar',
          barWidth: '36%',
          data: [
            {
              value: morningMTTR,
              itemStyle: {
                color: isDark ? '#38bdf8' : '#0284c7',
                borderRadius: [6, 6, 0, 0],
              },
            },
            {
              value: eveningMTTR,
              itemStyle: {
                color: isDark ? '#818cf8' : '#4f46e5',
                borderRadius: [6, 6, 0, 0],
              },
            },
            {
              value: nightMTTR,
              itemStyle: {
                color: isDark ? '#f43f5e' : '#e11d48',
                borderRadius: [6, 6, 0, 0],
              },
            },
          ],
          markPoint: {
            data: [
              {
                name: 'Night Shift Peak',
                value: `${nightMTTR.toFixed(0)}m Peak`,
                xAxis: 2,
                yAxis: nightMTTR,
                itemStyle: { color: isDark ? '#f43f5e' : '#e11d48' },
              },
            ],
          },
        },
        {
          name: 'Declared SLA Threshold (30m)',
          type: 'line',
          data: [30, 30, 30],
          lineStyle: {
            color: isDark ? '#10b981' : '#059669',
            width: 2.5,
            type: 'dashed',
          },
          itemStyle: {
            color: isDark ? '#10b981' : '#059669',
          },
        },
      ],
    };
  }, [morningMTTR, eveningMTTR, nightMTTR, isDark]);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-rose-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            24×7 Shift Response Velocity vs Declared 30m SLA
          </span>
        </div>
        <span className="font-mono text-[11px] text-rose-600 dark:text-rose-400 font-bold">
          SLA Contradiction: ~8x Dwell Time Peak
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
