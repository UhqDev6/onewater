/**
 * TaxonomicView with Real Supabase Data Integration
 * Maintains existing layout and visual design
 */

'use client';

import { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useLocations } from '@/hooks/useLocations';
import { useDateRangeFilter } from '@/hooks/useDateRangeFilter';
import DateRangeFilter from '@/components/ui/DateRangeFilter';
import Spinner from '@/components/ui/Spinner';
import { useOptimizedTaxonomyData, useOptimizedTaxonomyUniqueValues } from '@/hooks/useOptimizedTaxonomyData';
import { aggregateByLevel, type TaxonomyFilters } from '@/services/optimizedTaxonomyService';

type TaxonomicLevel = 'domain' | 'phylum' | 'class' | 'order_tax' | 'family' | 'genus';
type SortOrder = 'asc' | 'desc';
type PaletteName = 'default' | 'colorblind-safe' | 'warm' | 'cool';

const LEVEL_LABELS: Record<TaxonomicLevel, string> = {
  domain: 'Domain (d)',
  phylum: 'Phylum (p)',
  class: 'Class (c)',
  order_tax: 'Order (o)',
  family: 'Family (f)',
  genus: 'Genus (g)',
};

const COLOR_PALETTES: Record<PaletteName, string[]> = {
  default: ['#2563eb', '#7c3aed', '#0ea5e9', '#14b8a6', '#f59e0b', '#ef4444', '#22c55e', '#8b5cf6', '#64748b'],
  'colorblind-safe': ['#0072B2', '#009E73', '#D55E00', '#CC79A7', '#F0E442', '#56B4E9', '#E69F00', '#999999', '#332288'],
  warm: ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#fb7185', '#f43f5e', '#dc2626', '#ea580c', '#b45309'],
  cool: ['#0ea5e9', '#06b6d4', '#14b8a6', '#22c55e', '#3b82f6', '#6366f1', '#8b5cf6', '#64748b', '#10b981'],
};

export default function TaxonomicViewReal() {
  const searchParams = useSearchParams();
  const locationParam = searchParams.get('location');
  
  const [taxonomicLevel, setTaxonomicLevel] = useState<TaxonomicLevel>('domain');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [palette, setPalette] = useState<PaletteName>('default');
  const [barWidth, setBarWidth] = useState<number>(25);
  const [topN, setTopN] = useState<number>(10); // Top N taxa to display
  const [hoverInfo, setHoverInfo] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [clickedSample, setClickedSample] = useState<string | null>(null); // For pinned tooltip
  const [pinnedTooltipData, setPinnedTooltipData] = useState<{
    sampleId: string;
    data: Array<{ name: string; value: number; color: string }>;
    position: { x: number; y: number };
  } | null>(null);

  // Cascading filters
  const [filters, setFilters] = useState<TaxonomyFilters>({});

  // Fetch locations from API
  const { locations, isLoading: isLoadingLocations } = useLocations();

  // Calculate initial selected location
  const initialSelectedLocation = useMemo(() => {
    if (locationParam && locations.length > 0) {
      const location = locations.find(loc => loc.id === locationParam);
      if (location) {
        // Special mapping for known locations
        let environmentName = location.name.replace(/\s+/g, '_');
        
        // Map "Frankston Life Saving Club" to "Frankston_Beach"
        if (location.name.toLowerCase().includes('frankston')) {
          environmentName = 'Frankston_Beach';
        }
        
        console.log('TaxonomicView - Location found:', {
          locationId: location.id,
          locationName: location.name,
          environmentName,
        });
        return environmentName;
      }
    }
    console.log('TaxonomicView - No location selected');
    return null;
  }, [locationParam, locations]);

  const [selectedEnvironment, setSelectedEnvironment] = useState<string | null>(initialSelectedLocation);

  // Update selected environment when initial value changes
  useEffect(() => {
    console.log('Setting selectedEnvironment to:', initialSelectedLocation);
    setSelectedEnvironment(initialSelectedLocation);
  }, [initialSelectedLocation]);

  // Date range filter - declare before using in taxonomyFilters
  const {
    dateRange,
    setDateRange,
    resetDateRange,
  } = useDateRangeFilter({
    defaultStartDate: '2010-01-01', // Extended to cover all historical data
    defaultEndDate: '2030-12-31',   // Extended to cover future data
  });

  // Fetch taxonomy data with memoized filters using optimized hook
  const taxonomyFilters = useMemo(() => {
    const combinedFilters = {
      ...filters,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    };
    console.log('taxonomyFilters updated:', combinedFilters);
    return combinedFilters;
  }, [filters, dateRange.startDate, dateRange.endDate]);

  // Use optimized hook with server-side aggregation and caching
  const {
    sampleData: taxonomyData,
    aggregatedData: preAggregatedData,
    stats: taxonomyStats,
    isLoading,
    error,
    clearCache,
  } = useOptimizedTaxonomyData(
    selectedEnvironment,
    taxonomicLevel,
    taxonomyFilters,
    {
      topN: topN >= 9999 ? 200 : 50, // Limit based on user preference (use topN state)
      enableDebounce: true,          // Auto debounce 500ms
      fetchSamples: true,            // For stacked bar chart
      fetchAggregated: true,         // For summary table
      fetchStats: true,              // For statistics cards
    }
  );

  // Log taxonomy data changes
  useEffect(() => {
    console.log('taxonomyData updated:', {
      selectedEnvironment,
      dataCount: taxonomyData.length,
      isLoading,
      error,
      sampleData: taxonomyData.slice(0, 2),
    });
  }, [taxonomyData, selectedEnvironment, isLoading, error]);

  // Load available options for cascading filters using optimized hook
  const domainOptions = useOptimizedTaxonomyUniqueValues(selectedEnvironment, 'domain', {});
  const phylumOptions = useOptimizedTaxonomyUniqueValues(selectedEnvironment, 'phylum', { domain: filters.domain });
  const classOptions = useOptimizedTaxonomyUniqueValues(selectedEnvironment, 'class', { domain: filters.domain, phylum: filters.phylum });
  const orderOptions = useOptimizedTaxonomyUniqueValues(selectedEnvironment, 'order_tax', { domain: filters.domain, phylum: filters.phylum, class: filters.class });
  const familyOptions = useOptimizedTaxonomyUniqueValues(selectedEnvironment, 'family', { domain: filters.domain, phylum: filters.phylum, class: filters.class, order: filters.order });
  const genusOptions = useOptimizedTaxonomyUniqueValues(selectedEnvironment, 'genus', { domain: filters.domain, phylum: filters.phylum, class: filters.class, order: filters.order, family: filters.family });

  // Combine into availableOptions for backward compatibility
  const availableOptions = useMemo(() => ({
    domain: domainOptions.values,
    phylum: phylumOptions.values,
    class: classOptions.values,
    order_tax: orderOptions.values,
    family: familyOptions.values,
    genus: genusOptions.values,
  }), [domainOptions.values, phylumOptions.values, classOptions.values, orderOptions.values, familyOptions.values, genusOptions.values]);

  // Prepare chart data - grouped by sample with stacked bars
  const chartData = useMemo(() => {
    if (taxonomyData.length === 0) return [];

    // Step 1: Group by sample_id and sum abundance per taxon
    const sampleGroups: Record<string, {
      sample_id: string;
      observation_date: string;
      taxa: Record<string, number>;
      total: number;
    }> = {};
    
    taxonomyData.forEach(item => {
      if (!sampleGroups[item.sample_id]) {
        sampleGroups[item.sample_id] = {
          sample_id: item.sample_id,
          observation_date: item.observation_date,
          taxa: {},
          total: 0,
        };
      }
      
      // Get taxon name for current level
      const taxonName = item[taxonomicLevel] || 'Unknown';
      
      // Sum abundance for this taxon
      if (!sampleGroups[item.sample_id].taxa[taxonName]) {
        sampleGroups[item.sample_id].taxa[taxonName] = 0;
      }
      sampleGroups[item.sample_id].taxa[taxonName] += item.abundance_value;
      sampleGroups[item.sample_id].total += item.abundance_value;
    });

    // Step 2: Calculate total abundance per taxon across all samples
    const taxonTotals: Record<string, number> = {};
    Object.values(sampleGroups).forEach(sample => {
      Object.entries(sample.taxa).forEach(([taxonName, abundance]) => {
        if (!taxonTotals[taxonName]) {
          taxonTotals[taxonName] = 0;
        }
        taxonTotals[taxonName] += abundance;
      });
    });

    // Step 3: Get top N taxa by total abundance
    const sortedTaxa = Object.entries(taxonTotals)
      .sort(([, a], [, b]) => b - a)
      .map(([name]) => name);
    
    const topTaxa = new Set(sortedTaxa.slice(0, topN));
    const hasOthers = sortedTaxa.length > topN;

    // Step 4: Convert abundance to percentage and group non-top taxa as "Others"
    const samples = Object.values(sampleGroups).map(sample => {
      const result: Record<string, string | number> = {
        sample_id: sample.sample_id,
        observation_date: sample.observation_date,
      };
      
      let othersSum = 0;
      
      // Convert each taxon to percentage
      Object.entries(sample.taxa).forEach(([taxonName, abundance]) => {
        const percentage = sample.total > 0 ? (abundance / sample.total) * 100 : 0;
        
        if (topTaxa.has(taxonName)) {
          result[taxonName] = percentage;
        } else {
          othersSum += percentage;
        }
      });
      
      // Add "Others" if there are taxa outside top N
      if (hasOthers && othersSum > 0) {
        result['Others'] = othersSum;
      }
      
      return result;
    });
    
    // DEBUG: Log first sample to see what's happening
    if (samples[0]) {
      console.log('🔍 DEBUG - First Sample (with Top N):', samples[0]);
      const percentageSum = Object.entries(samples[0])
        .filter(([key]) => key !== 'sample_id' && key !== 'observation_date')
        .reduce((sum, [, value]) => sum + (value as number), 0);
      console.log('🔍 DEBUG - Percentage Sum:', percentageSum);
      console.log('🔍 DEBUG - Top Taxa:', Array.from(topTaxa));
      console.log('🔍 DEBUG - Has Others:', hasOthers);
      
      // VALIDATION: Check if total is still 100%
      if (Math.abs(percentageSum - 100) > 0.01) {
        console.warn('⚠️ WARNING: Percentage sum is not 100%!', percentageSum);
      } else {
        console.log('✅ VALIDATION: Percentage sum is correct (100%)');
      }
    }
    
    // Step 5: Sort
    if (sortOrder === 'asc') {
      return samples.sort((a, b) => String(a.sample_id).localeCompare(String(b.sample_id)));
    } else {
      return samples.sort((a, b) => String(b.sample_id).localeCompare(String(a.sample_id)));
    }
  }, [taxonomyData, taxonomicLevel, sortOrder, topN]);

  // Show loading indicator when taxonomic level or sort order changes
  useEffect(() => {
    if (taxonomyData.length > 0) {
      setIsProcessing(true);
      const timer = setTimeout(() => {
        setIsProcessing(false);
      }, 300); // Short delay to show processing state
      
      return () => clearTimeout(timer);
    }
  }, [taxonomicLevel, sortOrder, taxonomyData.length]);

  // Close pinned tooltip on ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && pinnedTooltipData) {
        setClickedSample(null);
        setPinnedTooltipData(null);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [pinnedTooltipData]);

  // Get unique taxa for current level (for stacked bars)
  // Get unique taxa for current level (for stacked bars)
  // Use Top N logic to match chartData
  const uniqueTaxa = useMemo(() => {
    const taxaAbundance: Record<string, number> = {};
    
    // Calculate total abundance per taxon
    taxonomyData.forEach(item => {
      const taxonName = item[taxonomicLevel] || 'Unknown';
      if (!taxaAbundance[taxonName]) {
        taxaAbundance[taxonName] = 0;
      }
      taxaAbundance[taxonName] += item.abundance_value;
    });
    
    // Sort by abundance (descending)
    const sortedTaxa = Object.entries(taxaAbundance)
      .sort(([, a], [, b]) => b - a)
      .map(([name]) => name);
    
    // Get top N taxa
    const topTaxa = sortedTaxa.slice(0, topN);
    
    // Add "Others" if there are more taxa than topN
    if (sortedTaxa.length > topN) {
      return [...topTaxa, 'Others'];
    }
    
    return topTaxa;
  }, [taxonomyData, taxonomicLevel, topN]);

  // Color mapping for taxa
  const colorByTaxon = useMemo(() => {
    const activePalette = COLOR_PALETTES[palette];
    const colors: Record<string, string> = {};
    
    uniqueTaxa.forEach((taxon, index) => {
      // Use gray color for "Others"
      if (taxon === 'Others') {
        colors[taxon] = '#9ca3af'; // gray-400
      } else {
        colors[taxon] = activePalette[index % activePalette.length];
      }
    });
    
    return colors;
  }, [palette, uniqueTaxa]);

  // Pre-compute taxonomic paths for fast lookup during hover
  // This prevents expensive filtering on every mouse move
  const taxonomicPathCache = useMemo(() => {
    const cache: Record<string, Record<string, string>> = {};
    
    // Group by sample_id first
    const bySample: Record<string, typeof taxonomyData> = {};
    taxonomyData.forEach(item => {
      if (!bySample[item.sample_id]) {
        bySample[item.sample_id] = [];
      }
      bySample[item.sample_id].push(item);
    });
    
    // Build paths for each sample and taxon combination
    Object.entries(bySample).forEach(([sampleId, records]) => {
      cache[sampleId] = {};
      
      // For each unique taxon at current level in this sample
      const taxaInSample = new Set(records.map(r => r[taxonomicLevel]));
      
      taxaInSample.forEach(taxon => {
        if (!taxon) return;
        
        // Find a record with this taxon
        const matchingRecord = records.find(r => r[taxonomicLevel] === taxon);
        if (!matchingRecord) return;
        
        // Build path from domain to current level
        const levels: TaxonomicLevel[] = ['domain', 'phylum', 'class', 'order_tax', 'family', 'genus'];
        const currentLevelIndex = levels.indexOf(taxonomicLevel);
        
        const path: string[] = [];
        for (let i = 0; i <= currentLevelIndex; i++) {
          const level = levels[i];
          const value = matchingRecord[level];
          
          // Add prefix based on level
          const prefix = level === 'domain' ? 'd__' :
                         level === 'phylum' ? 'p__' :
                         level === 'class' ? 'c__' :
                         level === 'order_tax' ? 'o__' :
                         level === 'family' ? 'f__' :
                         'g__';
          
          path.push(`${prefix}${value || 'Unknown'}`);
        }
        
        cache[sampleId][taxon] = path.join(';');
      });
    });
    
    return cache;
  }, [taxonomyData, taxonomicLevel]);

  // Pre-compute sample totals for fast percentage calculation
  const sampleTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    
    chartData.forEach(sample => {
      const sampleId = String(sample.sample_id);
      let total = 0;
      
      uniqueTaxa.forEach(taxon => {
        const val = sample[taxon];
        if (typeof val === 'number') {
          total += val;
        }
      });
      
      totals[sampleId] = total;
    });
    
    return totals;
  }, [chartData, uniqueTaxa]);

  // Handle bar mouse enter for hover info - now uses pre-computed cache
  const handleBarMouseEnter = (barData: unknown, taxon: string): void => {
    const payload =
      barData && typeof barData === 'object' && 'payload' in barData
        ? (barData as { payload?: Record<string, unknown> }).payload
        : undefined;

    const sampleId = typeof payload?.sample_id === 'string' ? payload.sample_id : null;
    if (!sampleId) {
      setHoverInfo(null);
      return;
    }

    const rawValue = payload?.[taxon];
    const numericValue = typeof rawValue === 'number' ? rawValue : Number(rawValue ?? 0);
    
    // Use pre-computed total (instant lookup!)
    const total = sampleTotals[sampleId] || 0;
    const percentValue = total > 0 ? ((numericValue / total) * 100) : 0;
    
    // Use pre-computed path from cache (instant lookup!)
    const taxonomicPath = taxonomicPathCache[sampleId]?.[taxon] || taxon;

    setHoverInfo(`${sampleId} | ${taxonomicPath} | ${percentValue.toFixed(3)}%`);
  };

  // Calculate dominant taxon from pre-aggregated data or stats
  const dominantTaxon = useMemo(() => {
    if (taxonomyStats?.dominantTaxon) {
      return taxonomyStats.dominantTaxon;
    }
    if (preAggregatedData.length === 0) return 'N/A';
    return preAggregatedData[0].label;
  }, [preAggregatedData, taxonomyStats]);

  // Calculate Shannon diversity index from stats or pre-aggregated data
  const shannonIndex = useMemo(() => {
    if (taxonomyStats?.shannonIndex !== undefined) {
      return taxonomyStats.shannonIndex;
    }
    
    // Fallback calculation from pre-aggregated data
    if (preAggregatedData.length === 0) return 0;
    
    const total = preAggregatedData.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) return 0;

    const shannon = -preAggregatedData.reduce((sum, item) => {
      const p = item.value / total;
      return p > 0 ? sum + p * Math.log(p) : sum;
    }, 0);

    return Math.round(shannon * 1000) / 1000;
  }, [preAggregatedData, taxonomyStats]);

  // Handle filter changes
  const handleFilterChange = (level: TaxonomicLevel, value: string) => {
    const newFilters = { ...filters };
    
    // Map level to filter key
    const filterKey = level === 'order_tax' ? 'order' : level;
    
    if (value === 'all') {
      // Remove filter
      if (filterKey === 'domain') delete newFilters.domain;
      else if (filterKey === 'phylum') delete newFilters.phylum;
      else if (filterKey === 'class') delete newFilters.class;
      else if (filterKey === 'order') delete newFilters.order;
      else if (filterKey === 'family') delete newFilters.family;
      else if (filterKey === 'genus') delete newFilters.genus;
      
      // Reset child filters
      const levels: TaxonomicLevel[] = ['domain', 'phylum', 'class', 'order_tax', 'family', 'genus'];
      const currentIndex = levels.indexOf(level);
      for (let i = currentIndex + 1; i < levels.length; i++) {
        const childKey = levels[i] === 'order_tax' ? 'order' : levels[i];
        if (childKey === 'domain') delete newFilters.domain;
        else if (childKey === 'phylum') delete newFilters.phylum;
        else if (childKey === 'class') delete newFilters.class;
        else if (childKey === 'order') delete newFilters.order;
        else if (childKey === 'family') delete newFilters.family;
        else if (childKey === 'genus') delete newFilters.genus;
      }
    } else {
      // Set filter
      if (filterKey === 'domain') newFilters.domain = value;
      else if (filterKey === 'phylum') newFilters.phylum = value;
      else if (filterKey === 'class') newFilters.class = value;
      else if (filterKey === 'order') newFilters.order = value;
      else if (filterKey === 'family') newFilters.family = value;
      else if (filterKey === 'genus') newFilters.genus = value;
      
      // Reset child filters
      const levels: TaxonomicLevel[] = ['domain', 'phylum', 'class', 'order_tax', 'family', 'genus'];
      const currentIndex = levels.indexOf(level);
      for (let i = currentIndex + 1; i < levels.length; i++) {
        const childKey = levels[i] === 'order_tax' ? 'order' : levels[i];
        if (childKey === 'domain') delete newFilters.domain;
        else if (childKey === 'phylum') delete newFilters.phylum;
        else if (childKey === 'class') delete newFilters.class;
        else if (childKey === 'order') delete newFilters.order;
        else if (childKey === 'family') delete newFilters.family;
        else if (childKey === 'genus') delete newFilters.genus;
      }
    }

    setFilters(newFilters);
  };

  // Handle location change
  const handleLocationChange = (locationId: string) => {
    if (locationId === 'all') {
      setSelectedEnvironment(null);
    } else {
      const location = locations.find(loc => loc.id === locationId);
      if (location) {
        // Special mapping for known locations
        let environmentName = location.name.replace(/\s+/g, '_');
        
        // Map "Frankston Life Saving Club" to "Frankston_Beach"
        if (location.name.toLowerCase().includes('frankston')) {
          environmentName = 'Frankston_Beach';
        }
        
        console.log('Location changed to:', { locationName: location.name, environmentName });
        setSelectedEnvironment(environmentName);
      }
    }
    // Reset filters when location changes
    setFilters({});
  };

  // Determine environment type
  const environmentType = useMemo(() => {
    if (!selectedEnvironment) return 'Mixed';
    if (selectedEnvironment.toLowerCase().includes('beach')) return 'Marine';
    return 'Freshwater';
  }, [selectedEnvironment]);

  if (isLoadingLocations) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Loading locations...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section - 2 Rows */}
      <div className="space-y-4">
        {/* Row 1: Location and Date Range */}
        <div className="grid grid-cols-2 gap-4">
          {/* Location Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <select
              value={locations.find(loc => loc.name.replace(/\s+/g, '_') === selectedEnvironment)?.id || 'all'}
              onChange={(e) => handleLocationChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Locations</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Filter */}
          <DateRangeFilter
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            onReset={resetDateRange}
          />
        </div>

        {/* Row 2: Environment Type and Summary Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-500">Environment Type</div>
            <div className="text-lg font-semibold text-gray-900">{environmentType}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-500">Dominant Taxon</div>
            <div className="text-lg font-semibold text-gray-900">{dominantTaxon}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-500">Shannon Index</div>
            <div className="text-lg font-semibold text-gray-900">{shannonIndex}</div>
          </div>
        </div>
      </div>

      {/* Taxonomic Filters - 6 Dropdowns */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Taxonomic Filters</h3>
        <div className="grid grid-cols-3 gap-4">
          {(['domain', 'phylum', 'class', 'order_tax', 'family', 'genus'] as TaxonomicLevel[]).map((level) => {
            const filterKey = level === 'order_tax' ? 'order' : level;
            return (
              <div key={level}>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {LEVEL_LABELS[level]}
                </label>
                <select
                  value={filters[filterKey as keyof TaxonomyFilters] || 'all'}
                  onChange={(e) => handleFilterChange(level, e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={!selectedEnvironment}
                >
                  <option value="all">All</option>
                  {availableOptions[level].map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
      </div>

      {/* Visualization Controls */}
      <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Taxonomic Level
            </label>
            <select
              value={taxonomicLevel}
              onChange={(e) => setTaxonomicLevel(e.target.value as TaxonomicLevel)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(LEVEL_LABELS).map(([level, label]) => (
                <option key={level} value={level}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Sort Order
            </label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as SortOrder)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Show Top Taxa
            </label>
            <select
              value={topN}
              onChange={(e) => setTopN(Number(e.target.value))}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value={5}>Top 5 + Others</option>
              <option value={10}>Top 10 + Others</option>
              <option value={15}>Top 15 + Others</option>
              <option value={20}>Top 20 + Others</option>
              <option value={9999}>Show All</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Color Palette
            </label>
            <select
              value={palette}
              onChange={(e) => setPalette(e.target.value as PaletteName)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="default">Default</option>
              <option value="colorblind-safe">Colorblind Safe</option>
              <option value="warm">Warm</option>
              <option value="cool">Cool</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Bar Width: {barWidth}px
            </label>
            <input
              type="range"
              min="20"
              max="80"
              value={barWidth}
              onChange={(e) => setBarWidth(Number(e.target.value))}
              className="w-32"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="showAllTaxa"
              checked={topN >= 9999}
              onChange={(e) => {
                if (e.target.checked) {
                  setTopN(9999); // Show all
                } else {
                  setTopN(10); // Back to default Top 10
                }
              }}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="showAllTaxa" className="text-xs font-medium text-gray-600 cursor-pointer">
              Show All Taxa
              <span className="block text-[10px] text-gray-400 font-normal">
                (may be slow)
              </span>
            </label>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => {/* Download CSV */}}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Download CSV
          </button>
          <button
            onClick={() => {/* Download SVG */}}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Download SVG
          </button>
          <button
            onClick={clearCache}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            title="Clear cache and refresh data"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Hover Info Display */}
      <div style={{ minHeight: '28px', marginTop: '12px' }}>
        {hoverInfo ? (
          <p
            className="inline-flex font-mono text-[13px] text-slate-600 bg-slate-50 px-3 py-1.5 rounded-md border border-slate-200 transition-opacity duration-150 ease-in-out"
            style={{ borderWidth: '0.5px' }}
          >
            {hoverInfo}
          </p>
        ) : null}
      </div>

      {/* Chart Section */}
      {isLoading ? (
        <div className="flex items-center justify-center h-96 bg-white rounded-lg border border-gray-200">
          <Spinner size="lg" message="Loading taxonomy data..." />
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-96 bg-white rounded-lg border border-gray-200">
          <div className="text-red-500">Error: {error}</div>
        </div>
      ) : chartData.length === 0 ? (
        <div className="flex items-center justify-center h-96 bg-white rounded-lg border border-gray-200">
          <div className="text-gray-500">No data available for selected filters</div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-6 relative">
          {/* Processing Overlay */}
          {isProcessing && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
              <Spinner size="md" message="Processing data..." />
            </div>
          )}
          
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Composition by {LEVEL_LABELS[taxonomicLevel]} (Stacked by Sample)
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart 
              data={chartData}
              onMouseLeave={() => setHoverInfo(null)}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="sample_id" 
                angle={-45}
                textAnchor="end"
                height={100}
                interval={0}
              />
              <YAxis 
                domain={[0, 100]}
                tickFormatter={(value) => `${Math.round(value)}%`}
                label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }} 
              />
              <Tooltip 
                content={({ active, payload, label }) => {
                  // Don't show if pinned tooltip is active
                  if (pinnedTooltipData) return null;
                  if (!active || !payload || payload.length === 0) return null;
                  
                  // Sort by value descending and take top 10
                  const sortedPayload = [...payload]
                    .filter(item => typeof item.value === 'number' && item.value > 0)
                    .sort((a, b) => (Number(b.value) || 0) - (Number(a.value) || 0));
                  
                  const topN = 10;
                  const displayItems = sortedPayload.slice(0, topN);
                  const hiddenCount = sortedPayload.length - topN;
                  
                  // Calculate total for percentages
                  const total = sortedPayload.reduce((sum, item) => sum + (Number(item.value) || 0), 0);
                  
                  return (
                    <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-3 max-w-xs">
                      <p className="font-semibold text-sm mb-2 text-gray-900">Sample: {label}</p>
                      
                      <p className="text-xs text-gray-500 mb-2">
                        Top {displayItems.length} of {sortedPayload.length} taxa
                      </p>
                      
                      <div className="space-y-1 max-h-64">
                        {displayItems.map((item, index) => {
                          const value = Number(item.value) || 0;
                          const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                          return (
                            <div key={index} className="flex items-center justify-between gap-3 text-xs">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <div 
                                  className="w-2 h-2 rounded-sm flex-shrink-0"
                                  style={{ backgroundColor: item.color }}
                                />
                                <span className="text-gray-700 truncate">{item.name}</span>
                              </div>
                              <span className="text-gray-900 font-medium whitespace-nowrap">
                                {value.toFixed(2)} ({percentage}%)
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      
                      {hiddenCount > 0 && (
                        <p className="text-xs text-blue-600 mt-2 pt-2 border-t border-gray-200">
                          Click bar to see all {sortedPayload.length} taxa
                        </p>
                      )}
                    </div>
                  );
                }}
              />
              {uniqueTaxa.map((taxon) => (
                <Bar 
                  key={taxon}
                  dataKey={taxon}
                  stackId="a"
                  fill={colorByTaxon[taxon]}
                  barSize={barWidth}
                  onMouseEnter={(data) => {
                    handleBarMouseEnter(data, taxon);
                  }}
                  onClick={(data, _index, event) => {
                    // Get sample data and position for pinned tooltip
                    const sampleId = data?.payload?.sample_id;
                    if (sampleId) {
                      // Toggle: if clicking same sample, close it
                      if (clickedSample === sampleId) {
                        setClickedSample(null);
                        setPinnedTooltipData(null);
                        return;
                      }

                      // Prepare data for pinned tooltip
                      const sampleData = chartData.find(d => d.sample_id === sampleId);
                      if (sampleData) {
                        const tooltipData = uniqueTaxa
                          .map(t => ({
                            name: t,
                            value: typeof sampleData[t] === 'number' ? sampleData[t] as number : 0,
                            color: colorByTaxon[t],
                          }))
                          .filter(item => item.value > 0)
                          .sort((a, b) => b.value - a.value);

                        // Get click position
                        const rect = (event?.target as SVGElement)?.getBoundingClientRect();
                        const position = rect ? {
                          x: rect.left + rect.width / 2,
                          y: rect.top,
                        } : { x: 0, y: 0 };

                        setClickedSample(sampleId);
                        setPinnedTooltipData({
                          sampleId,
                          data: tooltipData,
                          position,
                        });
                      }
                    }
                  }}
                  style={{ cursor: 'pointer' }}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Custom Pinned Tooltip (outside Recharts) */}
      {pinnedTooltipData && (
        <div
          className="fixed bg-white border-2 border-blue-500 rounded-lg shadow-2xl p-3 max-w-xs z-50"
          style={{
            left: `${pinnedTooltipData.position.x}px`,
            top: `${pinnedTooltipData.position.y - 20}px`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          {/* Header with close button */}
          <div className="flex items-center justify-between mb-2">
            <p className="font-semibold text-sm text-gray-900">
              Sample: {pinnedTooltipData.sampleId}
              <span className="ml-1 text-xs text-blue-600">(pinned)</span>
            </p>
            <button
              onClick={() => {
                setClickedSample(null);
                setPinnedTooltipData(null);
              }}
              className="text-gray-400 hover:text-gray-600 text-xl leading-none font-bold"
              title="Close"
            >
              ×
            </button>
          </div>

          <p className="text-xs text-gray-500 mb-2">
            All {pinnedTooltipData.data.length} taxa
          </p>

          {/* Scrollable content */}
          <div className="space-y-1 max-h-80 overflow-y-auto pr-2">
            {pinnedTooltipData.data.map((item, index) => {
              const total = pinnedTooltipData.data.reduce((sum, d) => sum + d.value, 0);
              const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0.0';
              return (
                <div key={index} className="flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div
                      className="w-2 h-2 rounded-sm flex-shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-gray-700 truncate">{item.name}</span>
                  </div>
                  <span className="text-gray-900 font-medium whitespace-nowrap">
                    {item.value.toFixed(2)} ({percentage}%)
                  </span>
                </div>
              );
            })}
          </div>

          {/* Hint */}
          <p className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-200">
            Scroll to see all taxa • Click × or ESC to close
          </p>
        </div>
      )}

      {/* Data Table - Show aggregated summary */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Aggregated Summary by {LEVEL_LABELS[taxonomicLevel]}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              {topN >= 9999
                ? `Showing all ${uniqueTaxa.length} taxa (complete dataset)`
                : `Showing top ${topN} most abundant taxa${uniqueTaxa.length > topN ? ' + Others' : ''}`
              }
            </p>
          </div>
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {LEVEL_LABELS[taxonomicLevel]}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Abundance
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Percentage
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(() => {
                  // Use pre-aggregated data from RPC (already aggregated on server)
                  const aggregated = preAggregatedData.length > 0 
                    ? preAggregatedData 
                    : aggregateByLevel(taxonomyData, taxonomicLevel); // Fallback to client-side
                  
                  console.log('Aggregated table data:', { 
                    preAggregatedCount: preAggregatedData.length,
                    aggregatedCount: aggregated.length,
                    uniqueTaxaCount: uniqueTaxa.length 
                  });
                  
                  // Filter based on topN setting
                  const filteredAggregated = topN >= 9999
                    ? aggregated // Show all if topN is set to show all
                    : aggregated.filter(item => item.percentage > 0.1);
                  
                  return filteredAggregated.length > 0 ? (
                    filteredAggregated.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded"
                              style={{ backgroundColor: colorByTaxon[item.label] || '#64748b' }}
                            />
                            {item.label}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                          {item.value.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                          {item.percentage.toFixed(1)}%
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">
                        No significant data to display
                      </td>
                    </tr>
                  );
                })()}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
