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
  Line,
  ComposedChart,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useLocations } from '@/hooks/useLocations';
import { useDateRangeFilter } from '@/hooks/useDateRangeFilter';
import { useMSTData } from '@/hooks/useMSTData';
import { extractSourceContributions, type MSTViewMode } from '@/services/mstService';
import DateRangeFilter from '@/components/ui/DateRangeFilter';
import Spinner from '@/components/ui/Spinner';

type ChartViewMode = 'percentage' | 'absolute';
type ChartType = 'bar' | 'pie';
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
  
  const [viewMode, setViewMode] = useState<MSTViewMode>('faecal');
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [palette, setPalette] = useState<PaletteName>('colorblind-safe');
  const [barWidth, setBarWidth] = useState<number>(25);
  const [activePieIndex, setActivePieIndex] = useState<number | null>(null);
  
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
        sums: {}, // Add sums for pie chart
        medians: {}, // Add medians for analytics table
        grandTotal: 0,
        grandSum: 0, // Add grand sum for pie chart
        sampleCount: 0,
        dominantSource: 'N/A',
        dominantPercentage: '0',
        avgEnterococci: 0,
        avgRainfall: 0,
      };
    }

    // Calculate both average percentages AND sums AND medians
    const averages: Record<string, number> = {};
    const sums: Record<string, number> = {}; // For pie chart
    const allValues: Record<string, number[]> = {}; // For median calculation
    const counts: Record<string, number> = {};
    let totalEnterococci = 0;
    let totalRainfall = 0;

    filteredByDate.forEach((item) => {
      const row = rawData.find(d => d.sampling_date === item.date);
      if (!row) return;

      const contributions = extractSourceContributions(row);
      contributions.forEach(contrib => {
        const key = contrib.name.toLowerCase().replace(/\s+/g, '_');
        if (!averages[key]) {
          averages[key] = 0;
          sums[key] = 0;
          allValues[key] = [];
          counts[key] = 0;
        }
        averages[key] += contrib.value;
        sums[key] += contrib.value; // Sum for pie chart
        allValues[key].push(contrib.value); // Store for median
        counts[key] += 1;
      });

      // Accumulate enterococci and rainfall
      totalEnterococci += item.enterococci;
      totalRainfall += item.rainfall;
    });

    // Calculate average for each source
    const totals: Record<string, number> = {};
    Object.keys(averages).forEach(key => {
      totals[key] = averages[key] / counts[key];
    });

    // Calculate median for each source
    const medians: Record<string, number> = {};
    Object.keys(allValues).forEach(key => {
      const sorted = [...allValues[key]].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      medians[key] = sorted.length % 2 === 0
        ? (sorted[mid - 1] + sorted[mid]) / 2
        : sorted[mid];
    });

    const grandTotal = Object.values(totals).reduce((sum, val) => sum + val, 0);
    const grandSum = Object.values(sums).reduce((sum, val) => sum + val, 0);

    // Smart Dominant Source Logic using MEDIAN
    // 1. Filter out "non_significant_contribution"
    // 2. Handle ties (multiple sources with same value)
    // 3. Use median values
    const medianEntries = Object.entries(medians)
      .filter(([key]) => !key.includes('non_significant'))
      .sort(([, a], [, b]) => b - a);

    let dominantLabel = 'N/A';
    let dominantPercentageValue = '0';

    if (medianEntries.length > 0) {
      const maxValue = medianEntries[0][1];
      
      // Find all sources with the same max value (ties)
      const dominantSources = medianEntries
        .filter(([, value]) => Math.abs(value - maxValue) < 0.01) // Handle floating point comparison
        .map(([key]) => sourceCategories.find((s) => s.key === key)?.label || key);

      dominantLabel = dominantSources.join(', ');
      dominantPercentageValue = maxValue.toFixed(1);
    }

    return {
      totals,
      sums, // Add sums for pie chart
      medians, // Add medians for analytics table
      grandTotal,
      grandSum, // Add grand sum for pie chart
      sampleCount: filteredByDate.length,
      dominantSource: dominantLabel,
      dominantPercentage: dominantPercentageValue,
      avgEnterococci: filteredByDate.length > 0 ? Math.round(totalEnterococci / filteredByDate.length) : 0,
      avgRainfall: filteredByDate.length > 0 ? Math.round((totalRainfall / filteredByDate.length) * 10) / 10 : 0,
    };
  }, [sourceCategories, filterDataByDateRange, trendData, rawData]);

  // Prepare data for Pie Chart Time-Series (one pie per sample)
  const pieChartTimeSeries = useMemo(() => {
    return sortedData.map(item => {
      const row = rawData.find(d => d.sampling_date === item.date);
      if (!row) return null;

      const contributions = extractSourceContributions(row);
      
      // Map contributions to pie data with colors
      const pieData = contributions
        .filter(contrib => contrib.value > 0)
        .map(contrib => {
          const key = contrib.name.toLowerCase().replace(/\s+/g, '_');
          const sourceCategory = sourceCategories.find(s => s.key === key);
          return {
            name: contrib.name,
            value: Math.round(contrib.value * 100) / 100, // Round to 2 decimals
            color: sourceCategory?.color || '#9ca3af',
          };
        })
        .sort((a, b) => b.value - a.value);

      return {
        sample_id: row.sample_id,
        date: item.date,
        data: pieData,
      };
    }).filter(Boolean);
  }, [sortedData, rawData, sourceCategories]);

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
      <div className="flex items-center justify-center h-96 bg-white rounded-lg border border-gray-200">
        <Spinner size="lg" message="Loading MST data..." />
      </div>
    );
  }

  // Error state
  if (mstError) {
    return (
      <div className="flex items-center justify-center h-96 bg-white rounded-lg border border-gray-200">
        <div className="text-center max-w-md">
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
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
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:p-6">
      {/* Summary Statistics */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
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
            Avg Enterococci
          </p>
          <p className="mt-2 text-lg font-semibold text-slate-900">
            {summaryStats.avgEnterococci}
          </p>
          <p className="text-xs text-slate-500">
            MPN/100 mL
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
            Avg Rainfall (48h)
          </p>
          <p className="mt-2 text-lg font-semibold text-slate-900">
            {summaryStats.avgRainfall}
          </p>
          <p className="text-xs text-slate-500">mm</p>
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">Chart Type</span>
              <select
                value={chartType}
                onChange={(event) => setChartType(event.target.value as ChartType)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
              >
                <option value="bar">Bar Chart (Time series)</option>
                <option value="pie">Pie Chart (Time series)</option>
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">Sort Order</span>
              <select
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value as SortOrder)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
                disabled={chartType === 'pie'}
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
            {chartType === 'bar' && (
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
            )}

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
          <>
            <h3 className="text-sm font-semibold text-slate-700 mb-3">
              Source Contribution Analysis
              <span className="ml-2 text-xs font-normal text-slate-500">
                ({chartType === 'bar' ? 'Time Series View - Per Sample' : 'Aggregate View - Sum of all samples'})
              </span>
            </h3>
            
            {chartType === 'bar' ? (
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
                    height={90}
                    tick={{ fontSize: 10, fill: '#475569' }}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#475569' }}
                    label={{
                      value: chartViewMode === 'percentage' ? 'Percentage (%)' : 'Count',
                      angle: -90,
                      position: 'insideLeft',
                      style: { fontSize: 12, fill: '#475569' },
                    }}
                    domain={[0, 100]}
                    ticks={[0, 20, 40, 60, 80, 100]}
                    tickFormatter={(value) => Math.round(value).toString()}
                  />
                  <Tooltip content={<CustomTooltip chartViewMode={chartViewMode} />} />
                  <Legend
                    verticalAlign="bottom"
                    align="center"
                    height={30}
                    wrapperStyle={{ 
                      paddingTop: '40px',
                      marginTop: '20px'
                    }}
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
            ) : (
              <div className="space-y-4">
                <div className="text-xs text-slate-600 bg-blue-50 border border-blue-200 rounded p-2">
                  💡 <span className="font-semibold">Time-Series View:</span> Each pie chart represents the source composition for a single sample over time. Scroll horizontally to see all samples.
                </div>
                
                {/* Scrollable container for multiple pie charts */}
                <div className="overflow-x-auto pb-4">
                  <div className="flex gap-6" style={{ minWidth: `${pieChartTimeSeries.length * 280}px` }}>
                    {pieChartTimeSeries.map((sample, sampleIndex) => {
                      if (!sample) return null;
                      
                      return (
                        <div key={sample.sample_id} className="flex-shrink-0" style={{ width: '260px' }}>
                          {/* Sample Header */}
                          <div className="text-center mb-2">
                            <p className="text-xs font-semibold text-slate-900">{sample.sample_id}</p>
                            <p className="text-xs text-slate-500">{new Date(sample.date).toLocaleDateString()}</p>
                          </div>
                          
                          {/* Pie Chart */}
                          <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                              <Pie
                                data={sample.data}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, value, percent, cx, cy, midAngle, outerRadius }) => {
                                  const percentValue = (percent ?? 0) * 100;
                                  if (percentValue < 5) return null;
                                  
                                  if (midAngle === undefined) return null;
                                  
                                  const RADIAN = Math.PI / 180;
                                  const radius = outerRadius + 20;
                                  const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                  const y = cy + radius * Math.sin(-midAngle * RADIAN);
                                  
                                  return (
                                    <text 
                                      x={x} 
                                      y={y} 
                                      fill={sample.data.find(d => d.name === name)?.color || '#000'}
                                      textAnchor={x > cx ? 'start' : 'end'} 
                                      dominantBaseline="central"
                                      className="text-xs font-semibold"
                                    >
                                      {`${value.toFixed(1)}%`}
                                    </text>
                                  );
                                }}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                                onClick={(_data, index) => {
                                  const globalIndex = sampleIndex * 1000 + index;
                                  setActivePieIndex(activePieIndex === globalIndex ? null : globalIndex);
                                }}
                                paddingAngle={1}
                                animationBegin={0}
                                animationDuration={600}
                                animationEasing="ease-out"
                              >
                                {sample.data.map((entry, index) => {
                                  const globalIndex = sampleIndex * 1000 + index;
                                  const isActive = activePieIndex === globalIndex;
                                  return (
                                    <Cell 
                                      key={`cell-${sampleIndex}-${index}`} 
                                      fill={entry.color}
                                      stroke="#ffffff"
                                      strokeWidth={1}
                                      style={{ 
                                        cursor: 'pointer',
                                        opacity: activePieIndex === null || isActive ? 1 : 0.5,
                                        filter: isActive 
                                          ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.2)) brightness(1.1)' 
                                          : 'none',
                                        transition: 'all 0.2s ease',
                                      }}
                                    />
                                  );
                                })}
                              </Pie>
                              <Tooltip
                                content={({ active, payload }) => {
                                  if (!active || !payload || !payload.length) return null;
                                  const data = payload[0].payload;
                                  return (
                                    <div className="rounded-lg border border-slate-200 bg-white p-2 shadow-lg text-xs">
                                      <div className="flex items-center gap-2 mb-1">
                                        <div
                                          className="h-3 w-3 rounded"
                                          style={{ backgroundColor: data.color }}
                                        />
                                        <span className="font-semibold text-slate-900">{data.name}</span>
                                      </div>
                                      <div className="text-slate-600">
                                        <span className="font-medium text-slate-900">{data.value.toFixed(2)}%</span>
                                      </div>
                                    </div>
                                  );
                                }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                          
                          {/* Legend for this sample */}
                          <div className="mt-2 space-y-1">
                            {sample.data.slice(0, 3).map((entry) => (
                              <div key={entry.name} className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-1">
                                  <div
                                    className="h-2 w-2 rounded-full"
                                    style={{ backgroundColor: entry.color }}
                                  />
                                  <span className="text-slate-700 truncate" style={{ maxWidth: '120px' }}>
                                    {entry.name}
                                  </span>
                                </div>
                                <span className="font-medium text-slate-900">{entry.value.toFixed(1)}%</span>
                              </div>
                            ))}
                            {sample.data.length > 3 && (
                              <div className="text-xs text-slate-500 text-center pt-1">
                                +{sample.data.length - 3} more
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Environmental Context Chart (Enterococci + Rainfall) */}
      {rawData.length > 0 && (
        <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Environmental Context (Enterococci & Rainfall)</h3>
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart
              data={sortedData.map(item => {
                const row = rawData.find(d => d.sampling_date === item.date);
                // For log scale: convert 0 to null (won't be plotted) or use minimum value
                const enterococciValue = item.enterococci > 0 ? item.enterococci : null;
                
                // DEBUG: Log first few samples to check data
                if (sortedData.indexOf(item) < 3) {
                  console.log('🔍 Enterococci Data:', {
                    sample: row?.sample_id,
                    enterococci: item.enterococci,
                    enterococciValue,
                    rainfall: item.rainfall,
                  });
                }
                
                return {
                  label: row?.sample_id || item.date,
                  enterococci: enterococciValue,
                  rainfall: item.rainfall,
                  date: item.date,
                };
              })}
              margin={{ top: 20, right: 110, left: 70, bottom: 60 }}
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
                yAxisId="left"
                scale="log"
                domain={[1, 'dataMax']}
                width={80}
                tick={{ fontSize: 12, fill: '#475569' }}
                tickFormatter={(value) => {
                  // Format as clean integers for log scale
                  if (value >= 1000) return `${(value / 1000)}k`;
                  if (value >= 100) return value.toString();
                  if (value >= 10) return value.toString();
                  return value.toString();
                }}
                label={{
                  value: 'Enterococci (MPN/100 mL)',
                  angle: -90,
                  position: 'insideLeft',
                  style: { fontSize: 12, fill: '#0ea5e9', textAnchor: 'middle' },
                }}
                allowDataOverflow={false}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                width={100}
                tick={{ fontSize: 12, fill: '#475569' }}
                label={{
                  value: '48 hrs antecedent rainfall (mm)',
                  angle: 90,
                  position: 'insideRight',
                  style: { fontSize: 11, fill: '#64748b', textAnchor: 'middle' },
                }}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload || !payload.length) return null;
                  return (
                    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
                      <p className="mb-2 font-semibold text-slate-900">{label}</p>
                      <div className="space-y-1">
                        {payload.map((entry, index) => (
                          <div key={`${entry.dataKey}-${index}`} className="flex items-center justify-between gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <div
                                className="h-3 w-3 rounded-sm"
                                style={{ backgroundColor: entry.color }}
                              />
                              <span className="text-slate-700">{entry.name}</span>
                            </div>
                            <span className="font-medium text-slate-900">
                              {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
                              {entry.dataKey === 'rainfall' ? ' mm' : ' MPN/100 mL'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }}
              />
              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="line"
              />
              <Bar
                yAxisId="right"
                dataKey="rainfall"
                fill="#94a3b8"
                name="Rainfall (48h)"
                opacity={0.6}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="enterococci"
                stroke="#0ea5e9"
                strokeWidth={2}
                dot={{ fill: '#0ea5e9', r: 4 }}
                connectNulls={false}
                name="Enterococci"
              />
            </ComposedChart>
          </ResponsiveContainer>
          <div className="mt-3 text-xs text-slate-600 bg-blue-50 border border-blue-200 rounded p-3">
            <p className="font-semibold text-blue-900 mb-1">💡 Interpretation Guide:</p>
            <p className="text-blue-800">
              This chart shows the relationship between rainfall and enterococci levels. 
              Higher rainfall (bars) often correlates with increased enterococci (line), 
              indicating runoff-related contamination from land-based sources.
            </p>
          </div>
        </div>
      )}

      {/* Source Legend with Details */}
      {rawData.length > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {sourceCategories.map((source) => {
            const median = summaryStats.medians[source.key] || 0;

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
                    <span>Median %:</span>
                    <span className="font-medium text-slate-900">{median.toFixed(1)}%</span>
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
