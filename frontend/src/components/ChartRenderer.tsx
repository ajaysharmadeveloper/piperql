'use client';

import { useRef, useCallback, useState, useMemo } from 'react';
import { toPng } from 'html-to-image';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, AreaChart, Area,
  ScatterChart, Scatter, RadarChart, Radar, RadialBarChart, RadialBar,
  ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import type { ChartConfig } from '@/lib/types';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#84cc16', '#f43f5e'];

const tooltipStyle = {
  backgroundColor: 'var(--bg-card)',
  border: '1px solid var(--border-primary)',
  borderRadius: '10px',
  color: 'var(--text-primary)',
};

const TIME_RANGES = [
  { label: '1D', days: 1 },
  { label: '7D', days: 7 },
  { label: '1M', days: 30 },
  { label: '3M', days: 90 },
  { label: '6M', days: 180 },
  { label: '1Y', days: 365 },
  { label: 'All', days: 0 },
];

function isDateValue(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  return /^\d{4}-\d{2}-\d{2}/.test(value) || !isNaN(Date.parse(value));
}

function hasDateXAxis(data: Record<string, unknown>[], xKey: string): boolean {
  if (!data.length) return false;
  const sample = data[0][xKey];
  return isDateValue(sample);
}

function filterByTimeRange(data: Record<string, unknown>[], xKey: string, days: number): Record<string, unknown>[] {
  if (days === 0) return data;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return data.filter((row) => {
    const val = row[xKey];
    if (typeof val !== 'string') return true;
    const date = new Date(val);
    return !isNaN(date.getTime()) && date >= cutoff;
  });
}

export default function ChartRenderer({ config }: { config: ChartConfig }) {
  const { type, data, xKey, yKeys, title } = config;
  const chartRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [selectedRange, setSelectedRange] = useState('All');

  const showTimeFilter = useMemo(() => hasDateXAxis(data, xKey), [data, xKey]);

  const filteredData = useMemo(() => {
    if (!showTimeFilter || selectedRange === 'All') return data;
    const range = TIME_RANGES.find((r) => r.label === selectedRange);
    return range ? filterByTimeRange(data, xKey, range.days) : data;
  }, [data, xKey, showTimeFilter, selectedRange]);

  const handleDownload = useCallback(async () => {
    if (!chartRef.current || downloading) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(chartRef.current, { pixelRatio: 2, backgroundColor: '#ffffff' });
      const link = document.createElement('a');
      link.download = `${(title || 'chart').replace(/\s+/g, '_').toLowerCase()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Chart download failed:', err);
    } finally {
      setDownloading(false);
    }
  }, [title, downloading]);

  return (
    <div className="mt-3 bg-bg-secondary rounded-xl border border-border-primary shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        {title ? <h4 className="text-sm font-semibold text-text-primary">{title}</h4> : <span />}
        <button
          onClick={handleDownload}
          className="flex items-center gap-1.5 text-[11px] text-text-muted hover:text-text-primary px-2.5 py-1 rounded-lg hover:bg-bg-hover transition-all font-medium"
          title="Download as PNG"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          {downloading ? 'Saving...' : 'Download'}
        </button>
      </div>

      {showTimeFilter && (
        <div className="flex items-center gap-1 px-4 pb-2">
          {TIME_RANGES.map((range) => (
            <button
              key={range.label}
              onClick={() => setSelectedRange(range.label)}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition-all ${
                selectedRange === range.label
                  ? 'bg-blue-600 text-white'
                  : 'text-text-muted hover:text-text-primary hover:bg-bg-hover'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      )}

      <div ref={chartRef} className="px-1 sm:px-2 pb-3">
        {filteredData.length > 0 ? (
          <ResponsiveContainer width="100%" height={typeof window !== 'undefined' && window.innerWidth < 640 ? 250 : 320}>
            {renderChart(type, filteredData, xKey, yKeys)}
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-40 text-text-muted text-sm">
            No data in this time range
          </div>
        )}
      </div>
    </div>
  );
}

function renderChart(type: string, data: Record<string, unknown>[], xKey: string, yKeys: string[]) {
  switch (type) {
    case 'bar':
      return (
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border-primary" />
          <XAxis dataKey={xKey} tick={{ fontSize: 11 }} className="text-text-muted" />
          <YAxis tick={{ fontSize: 11 }} className="text-text-muted" />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend />
          {yKeys.map((key, i) => (
            <Bar key={key} dataKey={key} fill={COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} />
          ))}
        </BarChart>
      );

    case 'stacked_bar':
      return (
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border-primary" />
          <XAxis dataKey={xKey} tick={{ fontSize: 11 }} className="text-text-muted" />
          <YAxis tick={{ fontSize: 11 }} className="text-text-muted" />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend />
          {yKeys.map((key, i) => (
            <Bar key={key} dataKey={key} stackId="stack" fill={COLORS[i % COLORS.length]} radius={i === yKeys.length - 1 ? [4, 4, 0, 0] : undefined} />
          ))}
        </BarChart>
      );

    case 'line':
      return (
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border-primary" />
          <XAxis dataKey={xKey} tick={{ fontSize: 11 }} className="text-text-muted" />
          <YAxis tick={{ fontSize: 11 }} className="text-text-muted" />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend />
          {yKeys.map((key, i) => (
            <Line key={key} type="monotone" dataKey={key} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
          ))}
        </LineChart>
      );

    case 'area':
      return (
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border-primary" />
          <XAxis dataKey={xKey} tick={{ fontSize: 11 }} className="text-text-muted" />
          <YAxis tick={{ fontSize: 11 }} className="text-text-muted" />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend />
          {yKeys.map((key, i) => (
            <Area key={key} type="monotone" dataKey={key} fill={COLORS[i % COLORS.length]} fillOpacity={0.15} stroke={COLORS[i % COLORS.length]} strokeWidth={2} />
          ))}
        </AreaChart>
      );

    case 'scatter':
      return (
        <ScatterChart>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border-primary" />
          <XAxis dataKey={xKey} name={xKey} tick={{ fontSize: 11 }} className="text-text-muted" />
          <YAxis dataKey={yKeys[0]} name={yKeys[0]} tick={{ fontSize: 11 }} className="text-text-muted" />
          <Tooltip contentStyle={tooltipStyle} cursor={{ strokeDasharray: '3 3' }} />
          <Legend />
          <Scatter name={yKeys[0]} data={data} fill={COLORS[0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Scatter>
        </ScatterChart>
      );

    case 'radar':
      return (
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
          <PolarGrid className="stroke-border-primary" />
          <PolarAngleAxis dataKey={xKey} tick={{ fontSize: 11 }} className="text-text-muted" />
          <PolarRadiusAxis tick={{ fontSize: 10 }} className="text-text-muted" />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend />
          {yKeys.map((key, i) => (
            <Radar key={key} name={key} dataKey={key} stroke={COLORS[i % COLORS.length]} fill={COLORS[i % COLORS.length]} fillOpacity={0.2} strokeWidth={2} />
          ))}
        </RadarChart>
      );

    case 'radial_bar':
      return (
        <RadialBarChart data={data} cx="50%" cy="50%" innerRadius="20%" outerRadius="90%" startAngle={180} endAngle={0}>
          <RadialBar dataKey={yKeys[0]} label={{ position: 'insideStart', fill: '#fff', fontSize: 11 }}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </RadialBar>
          <Tooltip contentStyle={tooltipStyle} />
          <Legend iconSize={10} layout="horizontal" verticalAlign="bottom" />
        </RadialBarChart>
      );

    case 'donut':
      return (
        <PieChart>
          <Pie data={data} dataKey={yKeys[0]} nameKey={xKey} cx="50%" cy="50%" outerRadius={110} innerRadius={60} paddingAngle={3} label={{ fontSize: 11 }}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
          <Legend />
        </PieChart>
      );

    case 'composed':
      return (
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border-primary" />
          <XAxis dataKey={xKey} tick={{ fontSize: 11 }} className="text-text-muted" />
          <YAxis tick={{ fontSize: 11 }} className="text-text-muted" />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend />
          {yKeys.map((key, i) => {
            if (i === 0) return <Bar key={key} dataKey={key} fill={COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} />;
            return <Line key={key} type="monotone" dataKey={key} stroke={COLORS[i % COLORS.length]} strokeWidth={2} />;
          })}
        </ComposedChart>
      );

    case 'pie':
    default:
      return (
        <PieChart>
          <Pie data={data} dataKey={yKeys[0]} nameKey={xKey} cx="50%" cy="50%" outerRadius={110} label={{ fontSize: 11 }}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
          <Legend />
        </PieChart>
      );
  }
}
