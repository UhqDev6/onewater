'use client';

import { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
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
import { useLocations } from '@/hooks/useLocations';
import { useDateRangeFilter } from '@/hooks/useDateRangeFilter';
import { useMSTData } from '@/hooks/useMSTData';
import { extractSourceContributions, type MSTViewMode } from '@/services/mstService';
import DateRangeFilter from '@/components/ui/DateRangeFilter';
import Spinner from '@/components/ui/Spinner';

type ChartViewMode = 'percentage' | 'absolute';
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
  chartViewMode: ChartViewMode;
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
const CustomTooltip = ({ active, payload, label, chartViewMode }: CustomTooltipProps) => {
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
                {chartViewMode === 'percentage' ? `${percentage}%` : entry.value}
              </span>
            </div>
          );
        })}
        {chartViewMode === 'absolute' && (
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
  const searchParams = useSearchParams();
  const locationParam = searchParams.get('location');
  const siteParam = searchParams.get('site');
  
  // Use either 'site' or 'location' parameter
  const urlSiteParam = siteParam || locationParam;
  
  const [viewMode, setViewMode] = useState<MSTViewMode>('microbial');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [palette, setPalette] = useState<PaletteName>('colorblind-safe');
  const [barWidth, setBarWidth] = useState<number>(40);
  
  // MST data is always in percentage format from Supabase
  const chartViewMode: ChartViewMode = 'percentage';

  // Fetch locations from API
  const { locations, isLoading: isLoadingLocations } = useLocations();

  // Calculate initial selected location based on URL parameter and available locations
  const initialSelectedLocation = useMemo(() => {
    if (urlSiteParam && locations.length > 0) {
      // First, try to find exact match by ID
      const locationById = locations.find(loc => loc.id === urlSiteParam);
      if (locationById) return locationById.id;
      
      // If not found by ID, try to find by name (case insensitive)
      const locationByName = locations.find(
        loc => loc.name.toLowerCase() === urlSiteParam.toLowerCase()
      );
      if (locationByName) return locationByName.id;
      
      // If still not found, return first location
      return locations[0]?.id || null;
    }
    return locations[0]?.id || null;
  }, [urlSiteParam, locations]);

  const [selectedLocation, setSelectedLocation] = useState<string | null>(initialSelectedLocation);

  // Update selected location when initial value changes
  useEffect(() => {
    setSelectedLocation(initialSelectedLocation);
  }, [initialSelectedLocation]);

  // Get the site name for Supabase query (use location name, not ID)
  // Transform name to match Supabase format (replace spaces with underscores)
  const siteName = useMemo(() => {
    if (!selectedLocation) return null;
    const location = locations.find(loc => loc.id === selectedLocation);
    if (!location) return null;
    
    // Transform "Frankston Beach" to "Frankston_Beach" to match Supabase format
    // This matches the format used in taxonomy tables
    return location.name.replace(/\s+/g, '_');
  }, [selectedLocation, locations]);

  // Fetch MST data using site name
  const {
    rawData,
    averageContributions,
    trendData,
    dominantSource,
    isLoading: isLoadingMST,
    error: mstError,
  } = useMSTData(siteName, viewMode);

  // Date range filter hook
  const {
    dateRange,
    setDateRange,
    resetDateRange,
    filterDataByDateRange,
  } = useDateRangeFilter({
    defaultStartDate: '2010-01-01',
    defaultEndDate: '2030-12-31',
  });

  // Get current color palette - dynamically generate colors based on actual sources
  const sourceCategories = useMemo(() => {
    const colors = COLOR_PALETTES[palette];
    const colorKeys = Object.keys(colors);
    
    // Get unique sources from average contributions
    return averageContributions.map((contrib, index) => ({
      key: contrib.name.toLowerCase().replace(/\s+/g, '_'),
      label: contrib.name,
      color: colors[colorKeys[index % colorKeys.length] as keyof typeof colors],
    }));
  }, [palette, averageContributions]);

  // Filter and sort trend data by date range
  const sortedData = useMemo(() => {
    // Filter data by date range first
    const filteredByDate = filterDataByDateRange(trendData, (entry) => entry.date);
    
    if (sortOrder === 'desc') {
      return [...filteredByDate].reverse();
    }
    return filteredByDate;
  }, [sortOrder, filterDataByDateRange, trendData]);

  // Transform data for chart - convert to format expected by Recharts
  const chartData = useMemo(() => {
    return sortedData.map(item => {
      const row = rawData.find(d => d.sampling_date === item.date);
      if (!row) return null;

      const contributions = extractSourceContributions(row);
      const chartRow: Record<string, string | number> = {
        label: row.sample_id, // Use sample_id as label
        date: item.date,
      };

      contributions.forEach(contrib => {
        const key = contrib.name.toLowerCase().replace(/\s+/g, '_');
        chartRow[key] = contrib.value;
      });

      return chartRow;
    }).filter(Boolean);
  }, [sortedData, rawData]);

  // Calculate summary statistics from filtered data
  const summaryStats = useMemo(() => {
    const filteredByDate = filterDataByDateRange(trendData, (entry) => entry.date);
    
    if (filteredByDate.length === 0) {
      return {
        totals: {},
        grandTotal: 0,
        sampleCount: 0,
        dominantSource: 'N/A',
        dominantPercentage: '0',
      };
    }

    // Calculate average percentages (not sum) since data is already in percentage format
    const averages: Record<string, number> = {};
    const counts: Record<string, number> = {};

    filteredByDate.forEach((item) => {
      const row = rawData.find(d => d.sampling_date === item.date);
      if (!row) return;

      const contributions = extractSourceContributions(row);
      contributions.forEach(contrib => {
        const key = contrib.name.toLowerCase().replace(/\s+/g, '_');
        if (!averages[key]) {
          averages[key] = 0;
          counts[key] = 0;
        }
        averages[key] += contrib.value;
        counts[key] += 1;
      });
    });

    // Calculate average for each source
    const totals: Record<string, number> = {};
    Object.keys(averages).forEach(key => {
      totals[key] = averages[key] / counts[key];
    });

    const grandTotal = Object.values(totals).reduce((sum, val) => sum + val, 0);

    const dominantSourceEntry = Object.entries(totals).reduce((max, [key, value]) =>
      value > max.value ? { key, value } : max
    , { key: '', value: 0 });

    const dominantLabel = sourceCategories.find((s) => s.key === dominantSourceEntry.key)?.label || dominantSource;

    return {
      totals,
      grandTotal,
      sampleCount: filteredByDate.length,
      dominantSource: dominantLabel,
      dominantPercentage: grandTotal > 0 ? ((dominantSourceEntry.value / grandTotal) * 100).toFixed(1) : '0',
    };
  }, [sourceCategories, filterDataByDateRange, trendData, rawData, dominantSource]);

  // Calculate environment type based on selected location
  const environmentType = useMemo(() => {
    if (!selectedLocation) {
      return 'Unknown';
    }
    
    const location = locations.find(loc => loc.id === selectedLocation);
    if (!location) {
      return 'Unknown';
    }
    
    // Check if location name contains "beach" (case insensitive)
    const isBeach = location.name.toLowerCase().includes('beach');
    return isBeach ? 'Marine' : 'Freshwater';
  }, [selectedLocation, locations]);

  // Download functions
  const handleDownloadCsv = () => {
    if (chartData.length === 0) return;

    const headers = ['sample_id', 'date', ...sourceCategories.map(s => s.key)];
    const csvLines = [
      headers.join(','),
      ...chartData
        .filter((row): row is Record<string, string | number> => row !== null)
        .map((row) =>
          headers
            .map((header) => {
              // Map 'sample_id' to 'label' in the row data
              const key = header === 'sample_id' ? 'label' : header;
              const value = row[key] ?? '';
              return `"${String(value).replace(/"/g, '""')}"`;
            })
            .join(',')
        ),
    ];

    const csvContent = csvLines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.setAttribute('download', `mst-data-${viewMode}-${dateRange.startDate}-to-${dateRange.endDate}.csv`);
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const handleDownloadSvg = () => {
    const svgElement = document.querySelector('#mst-chart svg');
    if (!svgElement) {
      return;
    }

    const serializer = new XMLSerializer();
    const svgText = serializer.serializeToString(svgElement);
    const blob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.setAttribute('download', `mst-chart-${viewMode}.svg`);
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  // Loading state
  if (isLoadingLocations || isLoadingMST) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:p-6">
        <div className="flex items-center justify-center py-12">
          <Spinner />
        </div>
      </div>
    );
  }

  // Error state
  if (mstError) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:p-6">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                Failed to load MST data: {mstError}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:p-6">
      {/* Summary Statistics */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
            Total Samples
          </p>
          <p className="mt-2 text-lg font-semibold text-slate-900">
            {summaryStats.sampleCount}
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
            Environment Type
          </p>
          <p className="mt-2 text-lg font-semibold text-slate-900">
            {environmentType}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-5 space-y-4">
        {/* First Row: Location and Date Range */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 items-end">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">Location</span>
            <select
              value={selectedLocation || ''}
              onChange={(event) => setSelectedLocation(event.target.value || null)}
              disabled={isLoadingLocations}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none disabled:bg-slate-100 disabled:cursor-not-allowed"
            >
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </label>

          <DateRangeFilter
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            onReset={resetDateRange}
            className="lg:col-span-2"
          />
        </div>

        {/* Second Row: Analysis Controls */}
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">Data Source</span>
              <select
                value={viewMode}
                onChange={(event) => setViewMode(event.target.value as MSTViewMode)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
              >
                <option value="microbial">Microbial Community</option>
                <option value="faecal">Faecal Community</option>
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">Sort Order</span>
              <select
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value as SortOrder)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
              >
                <option value="asc">Ascending (Oldest → Newest)</option>
                <option value="desc">Descending (Newest → Oldest)</option>
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

            <button
              type="button"
              onClick={handleDownloadCsv}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
            >
              Download CSV
            </button>
            <button
              type="button"
              onClick={handleDownloadSvg}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
            >
              Download SVG
            </button>
          </div>
        </div>
      </div>

      {/* Stacked Bar Chart */}
      <div id="mst-chart" className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
        {rawData.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500 font-medium mb-1">
                No MST data available
              </p>
              <p className="text-sm text-gray-400">
                {selectedLocation ? 'No data found for the selected location' : 'Please select a location'}
              </p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={450}>
            <BarChart
              data={chartData}
              barSize={barWidth}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="label"
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fontSize: 12, fill: '#475569' }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#475569' }}
                label={{
                  value: chartViewMode === 'percentage' ? 'Percentage (%)' : 'Count',
                  angle: -90,
                  position: 'insideLeft',
                  style: { fontSize: 12, fill: '#475569' },
                }}
                domain={chartViewMode === 'percentage' ? [0, 100] : [0, 'auto']}
              />
              <Tooltip content={<CustomTooltip chartViewMode={chartViewMode} />} />
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
        )}
      </div>

      {/* Source Legend with Details */}
      {rawData.length > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {sourceCategories.map((source) => {
            const average = summaryStats.totals[source.key] || 0;
            const percentage = summaryStats.grandTotal > 0 
              ? ((average / summaryStats.grandTotal) * 100).toFixed(1) 
              : '0.0';

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
                    <span>Avg %:</span>
                    <span className="font-medium text-slate-900">{average.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span>Of Total:</span>
                    <span className="font-medium text-slate-900">{percentage}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

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
              other sources, enabling targeted remediation strategies. Currently viewing{' '}
              <span className="font-semibold">{viewMode === 'microbial' ? 'Microbial' : 'Faecal'} Community</span> data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
