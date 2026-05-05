'use client';

import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

// Mock data for MST (Microbial Source Tracking)
// Represents contamination sources over time
const mstMockData = [
  {
    month: 'Jan 2024',
    human: 45,
    bovine: 25,
    avian: 15,
    canine: 10,
    other: 5,
  },
  {
    month: 'Feb 2024',
    human: 40,
    bovine: 30,
    avian: 18,
    canine: 8,
    other: 4,
  },
  {
    month: 'Mar 2024',
    human: 38,
    bovine: 28,
    avian: 20,
    canine: 10,
    other: 4,
  },
  {
    month: 'Apr 2024',
    human: 42,
    bovine: 26,
    avian: 17,
    canine: 11,
    other: 4,
  },
  {
    month: 'May 2024',
    human: 50,
    bovine: 22,
    avian: 15,
    canine: 9,
    other: 4,
  },
  {
    month: 'Jun 2024',
    human: 48,
    bovine: 24,
    avian: 16,
    canine: 8,
    other: 4,
  },
  {
    month: 'Jul 2024',
    human: 44,
    bovine: 27,
    avian: 18,
    canine: 7,
    other: 4,
  },
  {
    month: 'Aug 2024',
    human: 46,
    bovine: 25,
    avian: 17,
    canine: 8,
    other: 4,
  },
  {
    month: 'Sep 2024',
    human: 43,
    bovine: 28,
    avian: 19,
    canine: 6,
    other: 4,
  },
  {
    month: 'Oct 2024',
    human: 47,
    bovine: 26,
    avian: 16,
    canine: 7,
    other: 4,
  },
  {
    month: 'Nov 2024',
    human: 49,
    bovine: 23,
    avian: 17,
    canine: 7,
    other: 4,
  },
  {
    month: 'Dec 2024',
    human: 51,
    bovine: 22,
    avian: 15,
    canine: 8,
    other: 4,
  },
];

type ViewMode = 'percentage' | 'absolute';
type SortOrder = 'asc' | 'desc';
type PaletteName = 'default' | 'colorblind-safe' | 'warm' | 'cool';

// Tooltip payload type
interface TooltipPayloadEntry {
  dataKey: string;
  name: string;
  value: number;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
  viewMode: ViewMode;
}

// Color palettes for different accessibility needs
const COLOR_PALETTES: Record<PaletteName, { human: string; bovine: string; avian: string; canine: string; other: string }> = {
  default: {
    human: '#ef4444',
    bovine: '#f97316',
    avian: '#eab308',
    canine: '#3b82f6',
    other: '#6b7280',
  },
  'colorblind-safe': {
    human: '#0072B2',
    bovine: '#009E73',
    avian: '#D55E00',
    canine: '#CC79A7',
    other: '#999999',
  },
  warm: {
    human: '#dc2626',
    bovine: '#ea580c',
    avian: '#f59e0b',
    canine: '#fb7185',
    other: '#b45309',
  },
  cool: {
    human: '#0ea5e9',
    bovine: '#06b6d4',
    avian: '#14b8a6',
    canine: '#3b82f6',
    other: '#64748b',
  },
};

// Custom tooltip component (defined outside render to avoid recreation)
const CustomTooltip = ({ active, payload, label, viewMode }: CustomTooltipProps) => {
  if (!active || !payload || !payload.length) return null;

  const total = payload.reduce((sum: number, entry: TooltipPayloadEntry) => sum + entry.value, 0);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
      <p className="mb-2 font-semibold text-slate-900">{label}</p>
      <div className="space-y-1">
        {payload.slice().reverse().map((entry: TooltipPayloadEntry) => {
          const percentage = ((entry.value / total) * 100).toFixed(1);
          return (
            <div key={entry.dataKey} className="flex items-center justify-between gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-sm"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-slate-700">{entry.name}</span>
              </div>
              <span className="font-medium text-slate-900">
                {viewMode === 'percentage' ? `${percentage}%` : entry.value}
              </span>
            </div>
          );
        })}
        {viewMode === 'absolute' && (
          <div className="mt-2 border-t border-slate-200 pt-2">
            <div className="flex justify-between text-sm font-semibold">
              <span className="text-slate-700">Total</span>
              <span className="text-slate-900">{total}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function MSTView() {
  const [viewMode, setViewMode] = useState<ViewMode>('percentage');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [palette, setPalette] = useState<PaletteName>('default');
  const [barWidth, setBarWidth] = useState<number>(40);

  // Get current color palette
  const sourceCategories = useMemo(() => {
    const colors = COLOR_PALETTES[palette];
    return [
      { key: 'human', label: 'Human', color: colors.human },
      { key: 'bovine', label: 'Bovine', color: colors.bovine },
      { key: 'avian', label: 'Avian', color: colors.avian },
      { key: 'canine', label: 'Canine', color: colors.canine },
      { key: 'other', label: 'Other', color: colors.other },
    ];
  }, [palette]);

  // Sort data based on sort order
  const sortedData = useMemo(() => {
    const data = [...mstMockData];
    if (sortOrder === 'desc') {
      return data.reverse();
    }
    return data;
  }, [sortOrder]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totals = {
      human: 0,
      bovine: 0,
      avian: 0,
      canine: 0,
      other: 0,
    };

    mstMockData.forEach((entry) => {
      totals.human += entry.human;
      totals.bovine += entry.bovine;
      totals.avian += entry.avian;
      totals.canine += entry.canine;
      totals.other += entry.other;
    });

    const grandTotal = Object.values(totals).reduce((sum, val) => sum + val, 0);

    const dominantSource = Object.entries(totals).reduce((max, [key, value]) =>
      value > max.value ? { key, value } : max
    , { key: 'human', value: 0 });

    return {
      totals,
      grandTotal,
      dominantSource: sourceCategories.find((s) => s.key === dominantSource.key)?.label || 'Unknown',
      dominantPercentage: ((dominantSource.value / grandTotal) * 100).toFixed(1),
    };
  }, [sourceCategories]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:p-6">
      {/* Summary Statistics */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
            Total Samples
          </p>
          <p className="mt-2 text-lg font-semibold text-slate-900">
            {mstMockData.length}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
            Dominant Source
          </p>
          <p className="mt-2 text-lg font-semibold text-slate-900">
            {summaryStats.dominantSource}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
            Dominant %
          </p>
          <p className="mt-2 text-lg font-semibold text-slate-900">
            {summaryStats.dominantPercentage}%
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
            Total Detections
          </p>
          <p className="mt-2 text-lg font-semibold text-slate-900">
            {summaryStats.grandTotal}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-5 flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">View Mode</span>
            <select
              value={viewMode}
              onChange={(event) => setViewMode(event.target.value as ViewMode)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
            >
              <option value="percentage">Percentage</option>
              <option value="absolute">Absolute</option>
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">Sort Order</span>
            <select
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value as SortOrder)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
            >
              <option value="asc">Ascending (Jan → Dec)</option>
              <option value="desc">Descending (Dec → Jan)</option>
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">Color Palette</span>
            <select
              value={palette}
              onChange={(event) => setPalette(event.target.value as PaletteName)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
            >
              <option value="default">Default</option>
              <option value="colorblind-safe">Colorblind-safe</option>
              <option value="warm">Warm</option>
              <option value="cool">Cool</option>
            </select>
          </label>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex min-w-56 flex-col gap-1">
            <span className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-600">
              <span>Bar Width</span>
              <span className="text-slate-700">{barWidth}px</span>
            </span>
            <input
              type="range"
              min={20}
              max={80}
              step={5}
              value={barWidth}
              onChange={(event) => setBarWidth(Number(event.target.value))}
              className="h-10"
            />
          </label>
        </div>
      </div>

      {/* Stacked Bar Chart */}
      <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <ResponsiveContainer width="100%" height={450}>
          <BarChart
            data={sortedData}
            barSize={barWidth}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="month"
              angle={-45}
              textAnchor="end"
              height={80}
              tick={{ fontSize: 12, fill: '#475569' }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#475569' }}
              label={{
                value: viewMode === 'percentage' ? 'Percentage (%)' : 'Count',
                angle: -90,
                position: 'insideLeft',
                style: { fontSize: 12, fill: '#475569' },
              }}
              domain={viewMode === 'percentage' ? [0, 100] : [0, 'auto']}
            />
            <Tooltip content={<CustomTooltip viewMode={viewMode} />} />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="square"
              formatter={(value) =>
                sourceCategories.find((s) => s.key === value)?.label || value
              }
            />
            {sourceCategories.map((source) => (
              <Bar
                key={source.key}
                dataKey={source.key}
                stackId="sources"
                fill={source.color}
                name={source.label}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Source Legend with Details */}
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {sourceCategories.map((source) => {
          const total = summaryStats.totals[source.key as keyof typeof summaryStats.totals];
          const percentage = ((total / summaryStats.grandTotal) * 100).toFixed(1);

          return (
            <div
              key={source.key}
              className="rounded-lg border border-slate-200 bg-white p-3"
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="h-4 w-4 rounded"
                  style={{ backgroundColor: source.color }}
                />
                <span className="text-sm font-semibold text-slate-900">
                  {source.label}
                </span>
              </div>
              <div className="text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Total:</span>
                  <span className="font-medium text-slate-900">{total}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span>Percentage:</span>
                  <span className="font-medium text-slate-900">{percentage}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Note */}
      <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex gap-3">
          <svg
            className="h-5 w-5 shrink-0 text-blue-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="text-sm text-blue-900">
            <p className="font-semibold mb-1">About MST Analysis</p>
            <p className="text-blue-800">
              Microbial Source Tracking (MST) identifies the sources of fecal contamination in water.
              This analysis helps determine whether contamination originates from human, animal, or
              other sources, enabling targeted remediation strategies.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
