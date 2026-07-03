/**
 * Water Quality View Component
 * Displays historical water quality trends with smart adaptive line coloring
 * Features: Data caching, loading states, mobile responsive
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  fetchWaterQualityHistory,
  fetchAvailableSites,
  fetchQualityDistributionWithTrend,
  type WaterQualityHistoryDataPoint,
} from '@/services/waterQualityHistoryService';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';

// Cache utilities
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes (more responsive than 10 min)
const CACHE_KEYS = {
  SITES: 'wq_sites',
  DISTRIBUTION: 'wq_distribution',
  HISTORY: 'wq_history',
};

interface CachedData<T> {
  data: T;
  timestamp: number;
}

function getCachedData<T>(key: string): T | null {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const { data, timestamp }: CachedData<T> = JSON.parse(cached);
    const now = Date.now();

    // Check if cache is still valid
    if (now - timestamp < CACHE_DURATION) {
      return data;
    }

    // Cache expired, remove it
    localStorage.removeItem(key);
    return null;
  } catch (error) {
    console.error('Error reading cache:', error);
    return null;
  }
}

function setCachedData<T>(key: string, data: T): void {
  try {
    const cacheData: CachedData<T> = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Error writing cache:', error);
  }
}

function clearAllCache(): void {
  try {
    // Clear all Water Quality related cache
    Object.values(CACHE_KEYS).forEach((key) => {
      // Remove exact matches
      localStorage.removeItem(key);
      
      // Remove all keys that start with the cache key (for parameterized caches)
      Object.keys(localStorage).forEach((storageKey) => {
        if (storageKey.startsWith(key)) {
          localStorage.removeItem(storageKey);
        }
      });
    });
    console.log('Cache cleared successfully');
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
}

interface WaterQualityViewProps {
  initialSiteId?: string;
}

interface DotProps {
  cx?: number;
  cy?: number;
  payload?: WaterQualityHistoryDataPoint;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: WaterQualityHistoryDataPoint;
  }>;
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
        <p className="font-semibold text-gray-900 mb-1">
          {new Date(data.date).toLocaleDateString('en-AU', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </p>
        <p className="text-sm text-gray-700 mb-1">
          <span className="font-medium">Quality:</span>{' '}
          <span className={`font-semibold ${
            data.quality === 'good' ? 'text-blue-600' :
            data.quality === 'fair' ? 'text-yellow-600' :
            data.quality === 'poor' ? 'text-orange-600' :
            data.quality === 'bad' ? 'text-red-600' :
            'text-gray-600'
          }`}>
            {data.quality.charAt(0).toUpperCase() + data.quality.slice(1)}
          </span>
        </p>
        <p className="text-xs text-gray-600">
          {data.result}
        </p>
      </div>
    );
  }
  return null;
};

export default function WaterQualityView({ initialSiteId }: WaterQualityViewProps) {
  const [sites, setSites] = useState<Array<{ 
    site_id: string; 
    site_name: string; 
    data_points: number;
    latest_snapshot_date: string;
    latest_updated_at: string;
    quality_changed: boolean;
    quality_trend: 'improved' | 'declined' | 'stable';
  }>>([]);
  const [selectedSite, setSelectedSite] = useState<string | null>(initialSiteId || null);
  const [historyData, setHistoryData] = useState<WaterQualityHistoryDataPoint[]>([]);
  const [siteName, setSiteName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingDistribution, setLoadingDistribution] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [timeFrame, setTimeFrame] = useState<'7D' | '1M' | '3M' | 'ALL'>('1M'); // Default: 1 month
  const [chartType, setChartType] = useState<'line' | 'bar'>('line'); // Default: line chart
  const [distribution, setDistribution] = useState<{
    good: number;
    fair: number;
    poor: number;
    bad: number;
    total: number;
  }>({ good: 0, fair: 0, poor: 0, bad: 0, total: 0 });
  const [previousDistribution, setPreviousDistribution] = useState<{
    good: number;
    fair: number;
    poor: number;
    bad: number;
    total: number;
  }>({ good: 0, fair: 0, poor: 0, bad: 0, total: 0 });
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Helper: Check if date is within 24 hours (use updated_at timestamp)
  // REMOVED - Badge "New" tidak informatif karena semua beach update bersamaan

  // Helper: Format relative time (use updated_at timestamp for accuracy)
  const formatRelativeTime = (timestampString: string) => {
    const date = new Date(timestampString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' });
  };

  // Helper: Calculate trend (difference and percentage)
  const calculateTrend = (current: number, previous: number) => {
    const diff = current - previous;
    const percentChange = previous > 0 ? Math.round((diff / previous) * 100) : 0;
    return { diff, percentChange, isPositive: diff > 0, isNeutral: diff === 0 };
  };

  // Handler: Refresh all data (clear cache and re-fetch)
  const handleRefreshData = async () => {
    setIsRefreshing(true);
    
    // Clear all cache
    clearAllCache();
    
    // Re-fetch all data
    try {
      // Refetch sites
      const { data: sitesData, error: sitesError } = await fetchAvailableSites();
      if (!sitesError) {
        setSites(sitesData);
        setCachedData(CACHE_KEYS.SITES, sitesData);
      }

      // Refetch history if a site is selected
      if (selectedSite) {
        const daysLimit = timeFrame === '7D' ? 7 : timeFrame === '1M' ? 30 : timeFrame === '3M' ? 90 : 365;
        const { data: historyDataResult, siteName: name, error: historyError } = await fetchWaterQualityHistory(selectedSite, daysLimit);
        
        if (!historyError) {
          setHistoryData(historyDataResult);
          setSiteName(name);
          const cacheKey = `${CACHE_KEYS.HISTORY}_${selectedSite}_${timeFrame}`;
          setCachedData(cacheKey, { data: historyDataResult, siteName: name });
        }
      }

      // Refetch distribution
      const daysLimit = timeFrame === '7D' ? 7 : timeFrame === '1M' ? 30 : timeFrame === '3M' ? 90 : 365;
      const { current, previous, error: distError } = await fetchQualityDistributionWithTrend(daysLimit);
      
      if (!distError) {
        setDistribution(current);
        setPreviousDistribution(previous);
        const cacheKey = `${CACHE_KEYS.DISTRIBUTION}_${timeFrame}_trend`;
        setCachedData(cacheKey, { current, previous });
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Fetch available sites on mount
  useEffect(() => {
    async function loadSites() {
      setLoading(true);
      
      // Try to get from cache first
      const cachedSites = getCachedData<typeof sites>(CACHE_KEYS.SITES);
      if (cachedSites) {
        setSites(cachedSites);
        if (!initialSiteId && cachedSites.length > 0) {
          setSelectedSite(cachedSites[0].site_id);
        }
        setLoading(false);
        return;
      }

      // Fetch from API if cache miss
      const { data, error: fetchError } = await fetchAvailableSites();
      
      if (fetchError) {
        setError(fetchError);
      } else {
        setSites(data);
        setCachedData(CACHE_KEYS.SITES, data); // Cache the result
        if (!initialSiteId && data.length > 0) {
          setSelectedSite(data[0].site_id);
        }
      }
      
      setLoading(false);
    }
    loadSites();
  }, [initialSiteId]);

  // Fetch history when site is selected
  useEffect(() => {
    if (!selectedSite) return;

    async function loadHistory() {
      setLoadingHistory(true);
      setError(null);
      
      // Calculate days limit based on timeframe
      const daysLimit = timeFrame === '7D' ? 7 : timeFrame === '1M' ? 30 : timeFrame === '3M' ? 90 : 365;
      
      // Create cache key with site and timeframe
      const cacheKey = `${CACHE_KEYS.HISTORY}_${selectedSite}_${timeFrame}`;
      
      // Try to get from cache first
      const cachedHistory = getCachedData<{ data: WaterQualityHistoryDataPoint[]; siteName: string }>(cacheKey);
      if (cachedHistory) {
        setHistoryData(cachedHistory.data);
        setSiteName(cachedHistory.siteName);
        setLoadingHistory(false);
        return;
      }

      // Fetch from API if cache miss
      const { data, siteName: name, error: fetchError } = await fetchWaterQualityHistory(selectedSite!, daysLimit);
      
      if (fetchError) {
        setError(fetchError);
        setHistoryData([]);
        setSiteName(null);
      } else {
        setHistoryData(data);
        setSiteName(name);
        // Cache the result
        setCachedData(cacheKey, { data, siteName: name });
      }
      
      setLoadingHistory(false);
    }
    loadHistory();
  }, [selectedSite, timeFrame]); // Re-fetch when timeframe changes

  // Fetch distribution data when timeframe changes
  useEffect(() => {
    async function loadDistribution() {
      setLoadingDistribution(true);
      const daysLimit = timeFrame === '7D' ? 7 : timeFrame === '1M' ? 30 : timeFrame === '3M' ? 90 : 365;
      
      // Create cache key with timeframe
      const cacheKey = `${CACHE_KEYS.DISTRIBUTION}_${timeFrame}_trend`;
      
      // Try to get from cache first
      const cachedData = getCachedData<{ current: typeof distribution; previous: typeof previousDistribution }>(cacheKey);
      if (cachedData) {
        setDistribution(cachedData.current);
        setPreviousDistribution(cachedData.previous);
        setLoadingDistribution(false);
        return;
      }

      // Fetch from API with trend data if cache miss
      const { current, previous, error: fetchError } = await fetchQualityDistributionWithTrend(daysLimit);
      
      if (!fetchError) {
        setDistribution(current);
        setPreviousDistribution(previous);
        // Cache the result
        setCachedData(cacheKey, { current, previous });
      }
      setLoadingDistribution(false);
    }
    loadDistribution();
  }, [timeFrame]); // Re-fetch when timeframe changes

  // Jitter mikro agar area chart tetap render mulus di segala kondisi browser
  const processedChartData = useMemo(() => {
    return historyData.map((item, index) => ({
      ...item,
      qualityValue: item.qualityValue + (index % 2 === 0 ? 0.0001 : 0),
    }));
  }, [historyData]);

  // 🔥 LOGIKA BARU: Deteksi apakah data kualitas air flat (sama semua)
  const isFlatLine = useMemo(() => {
    if (historyData.length <= 1) return true;
    const firstQuality = historyData[0]?.quality;
    return historyData.every((item) => item.quality === firstQuality);
  }, [historyData]);

  // 🔥 LOGIKA BARU: Tentukan warna stroke garis secara pintar
  const adaptiveStrokeColor = useMemo(() => {
    if (!isFlatLine || historyData.length === 0) {
      // Jika datanya naik turun (melengkung), gunakan gradien vertikal bawaan
      return 'url(#waterQualityLineGradient)';
    }
    
    // Jika datanya FLAT, gunakan warna solid sesuai dengan status kualitas airnya
    const currentQuality = historyData[0].quality;
    switch (currentQuality) {
      case 'good': return '#3b82f6';  // Solid Blue
      case 'fair': return '#eab308';  // Solid Yellow
      case 'poor': return '#f97316';  // Solid Orange
      case 'bad': return '#ef4444';   // Solid Red
      default: return '#6b7280';
    }
  }, [isFlatLine, historyData]);

  // 🔥 LOGIKA BARU: Tentukan warna area fill secara pintar (match dengan line)
  const adaptiveAreaFill = useMemo(() => {
    if (!isFlatLine || historyData.length === 0) {
      // Jika datanya naik turun (melengkung), gunakan gradien multi-color
      return 'url(#waterQualityAreaGradient)';
    }
    
    // Jika datanya FLAT, gunakan gradient single-color sesuai quality level
    const currentQuality = historyData[0].quality;
    switch (currentQuality) {
      case 'good': return 'url(#areaGradientGood)';   // Blue gradient
      case 'fair': return 'url(#areaGradientFair)';   // Yellow gradient
      case 'poor': return 'url(#areaGradientPoor)';   // Orange gradient
      case 'bad': return 'url(#areaGradientBad)';     // Red gradient
      default: return 'url(#waterQualityAreaGradient)';
    }
  }, [isFlatLine, historyData]);

  const filteredSites = sites.filter((site) =>
    site?.site_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const qualityLabels = useMemo(() => ['', 'Bad', 'Poor', 'Fair', 'Good'], []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Water Quality History</h2>
          <p className="text-gray-600">View historical water quality trends over time</p>
        </div>
        
        {/* Refresh Button */}
        <button
          onClick={handleRefreshData}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Refresh data (clear cache)"
        >
          <svg 
            className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Panel - Only show for Line Chart */}
        {chartType === 'line' && (
          <div className="lg:col-span-1 animate-fadeIn">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Select Location</h3>
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search beaches..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                  <p className="text-sm text-gray-600">Loading locations...</p>
                </div>
              ) : (
                <div className="space-y-1 max-h-[600px] overflow-y-auto">
                  {filteredSites.length > 0 ? (
                    filteredSites.map((site) => {
                      return (
                        <button
                          key={site.site_id}
                          onClick={() => setSelectedSite(site.site_id)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                            selectedSite === site.site_id
                              ? 'bg-blue-100 text-blue-900 font-medium'
                              : 'hover:bg-gray-100 text-gray-700'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="font-medium truncate flex-1">{site.site_name}</div>
                            {site.quality_changed && (
                              <span className={`flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                site.quality_trend === 'improved' 
                                  ? 'bg-green-100 text-green-800' 
                                  : site.quality_trend === 'declined'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {site.quality_trend === 'improved' ? '↑ Improved' : site.quality_trend === 'declined' ? '↓ Declined' : 'Changed'}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {formatRelativeTime(site.latest_updated_at)}
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-sm text-gray-500">No locations found</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Right Panel (Chart) - Adjust column span based on chart type */}
        <div className={`${chartType === 'line' ? 'lg:col-span-3' : 'lg:col-span-4'} transition-all duration-500 ease-in-out`}>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            {loadingHistory && chartType === 'line' ? (
              // LOADING STATE for Line Chart
              <div className="space-y-6">
                <div className="animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-4 bg-gray-100 rounded w-2/3"></div>
                </div>
                <div className="h-[400px] bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                    <p className="text-gray-600 font-medium">Loading chart data...</p>
                  </div>
                </div>
              </div>
            ) : loadingDistribution && chartType === 'bar' ? (
              // LOADING STATE for Bar Chart
              <div className="space-y-6">
                <div className="animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-4 bg-gray-100 rounded w-2/3"></div>
                </div>
                <div className="h-[400px] bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                    <p className="text-gray-600 font-medium">Loading distribution data...</p>
                  </div>
                </div>
              </div>
            ) : error ? (
              // ERROR STATE
              <div className="flex items-center justify-center py-32">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-900 font-semibold mb-1">Error Loading Data</p>
                  <p className="text-sm text-gray-500">{error}</p>
                </div>
              </div>
            ) : historyData.length === 0 && chartType === 'line' ? (
              // EMPTY STATE for Line Chart
              <div className="flex items-center justify-center py-32">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <p className="text-gray-900 font-semibold mb-1">No Historical Data</p>
                  <p className="text-sm text-gray-500">No water quality data available for this location</p>
                </div>
              </div>
            ) : distribution.total === 0 && chartType === 'bar' ? (
              // EMPTY STATE for Bar Chart
              <div className="flex items-center justify-center py-32">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <p className="text-gray-900 font-semibold mb-1">No Distribution Data</p>
                  <p className="text-sm text-gray-500">No beach quality data available for the selected timeframe</p>
                </div>
              </div>
            ) : (
              // MAIN CONTENT (Charts)
              <>
                {/* Chart Header with Chart Type Toggle & Timeframe Selector */}
                <div className="mb-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
                    {/* Chart Title - Show beach name only for Line Chart */}
                    {chartType === 'line' ? (
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{siteName}</h3>
                        <p className="text-sm text-gray-600">
                          Showing {historyData.length} data points from{' '}
                          {new Date(historyData[0].date).toLocaleDateString('en-AU', { month: 'short', day: 'numeric', year: 'numeric' })} to{' '}
                          {new Date(historyData[historyData.length - 1].date).toLocaleDateString('en-AU', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    ) : (
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">Overall Beach Quality Distribution</h3>
                        <p className="text-sm text-gray-600">
                          {timeFrame === '7D' ? 'Last 7 days' : timeFrame === '1M' ? 'Last 30 days' : timeFrame === '3M' ? 'Last 90 days' : 'All available data'} • {distribution.total} beaches
                        </p>
                      </div>
                    )}
                    
                    {/* Controls: Chart Type + Timeframe - Responsive Layout */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                      {/* Chart Type Toggle */}
                      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                        <button
                          onClick={() => setChartType('line')}
                          className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                            chartType === 'line'
                              ? 'bg-white text-blue-600 shadow-sm'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                          title="Line chart view"
                        >
                          Line
                        </button>
                        <button
                          onClick={() => setChartType('bar')}
                          className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                            chartType === 'bar'
                              ? 'bg-white text-blue-600 shadow-sm'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                          title="Bar chart view"
                        >
                          Bar
                        </button>
                      </div>

                      {/* Time Frame Selector */}
                      <div className="grid grid-cols-4 sm:flex sm:items-center gap-1 bg-gray-100 rounded-lg p-1">
                        {[
                          { value: '7D', label: '7D', tooltip: 'Last 7 days' },
                          { value: '1M', label: '1M', tooltip: 'Last 30 days' },
                          { value: '3M', label: '3M', tooltip: 'Last 90 days' },
                          { value: 'ALL', label: 'ALL', tooltip: 'All available data' },
                        ].map((option) => (
                          <button
                            key={option.value}
                            onClick={() => setTimeFrame(option.value as '7D' | '1M' | '3M' | 'ALL')}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                              timeFrame === option.value
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                            title={option.tooltip}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Conditional Chart Rendering */}
                {chartType === 'line' ? (
                  // LINE CHART VIEW (existing implementation)
                  <div className="animate-fadeIn">
                    <ResponsiveContainer width="100%" height={400} className="min-h-[300px]">
                  <AreaChart
                    data={processedChartData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <defs>
                      {/* Multi-color gradient for fluctuating data */}
                      <linearGradient id="waterQualityLineGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" />
                        <stop offset="35%" stopColor="#eab308" />
                        <stop offset="65%" stopColor="#f97316" />
                        <stop offset="95%" stopColor="#ef4444" />
                      </linearGradient>

                      <linearGradient id="waterQualityAreaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                        <stop offset="35%" stopColor="#eab308" stopOpacity={0.2} />
                        <stop offset="65%" stopColor="#f97316" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05} />
                      </linearGradient>

                      {/* Single-color gradients for flat line (Good level) */}
                      <linearGradient id="areaGradientGood" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
                      </linearGradient>

                      {/* Single-color gradients for flat line (Fair level) */}
                      <linearGradient id="areaGradientFair" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#eab308" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#eab308" stopOpacity={0.02} />
                      </linearGradient>

                      {/* Single-color gradients for flat line (Poor level) */}
                      <linearGradient id="areaGradientPoor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f97316" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#f97316" stopOpacity={0.02} />
                      </linearGradient>

                      {/* Single-color gradients for flat line (Bad level) */}
                      <linearGradient id="areaGradientBad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#ef4444" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>

                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(date) => {
                        const d = new Date(date);
                        return d.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' });
                      }}
                      stroke="#6b7280"
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis
                      domain={[0, 5]}
                      ticks={[1, 2, 3, 4]}
                      tickFormatter={(value) => qualityLabels[value] || ''}
                      stroke="#6b7280"
                      style={{ fontSize: '12px' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      wrapperStyle={{ paddingTop: '20px' }}
                      content={() => (
                        <div className="flex justify-center gap-4 mt-4">
                          {[
                            { color: '#3b82f6', label: 'Good' },
                            { color: '#eab308', label: 'Fair' },
                            { color: '#f97316', label: 'Poor' },
                            { color: '#ef4444', label: 'Bad' },
                          ].map((item) => (
                            <div key={item.label} className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                              <span className="text-sm text-gray-600">{item.label}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    />
                    
                    <ReferenceLine y={1.5} stroke="#e5e7eb" strokeDasharray="3 3" />
                    <ReferenceLine y={2.5} stroke="#e5e7eb" strokeDasharray="3 3" />
                    <ReferenceLine y={3.5} stroke="#e5e7eb" strokeDasharray="3 3" />
                    
                    <Area
                      type="monotone"
                      dataKey="qualityValue"
                      stroke={adaptiveStrokeColor} // 💡 Line color: solid untuk flat, gradient untuk fluktuatif
                      fill={adaptiveAreaFill} // 💡 Area fill: match dengan line color
                      strokeWidth={2}
                      dot={(props: DotProps) => {
                        const { cx, cy, payload } = props;
                        if (!cx || !cy || !payload) return null;
                        
                        const color = 
                          payload.quality === 'good' ? '#3b82f6' :
                          payload.quality === 'fair' ? '#eab308' :
                          payload.quality === 'poor' ? '#f97316' :
                          payload.quality === 'bad' ? '#ef4444' :
                          '#6b7280';
                        
                        return (
                          <circle cx={cx} cy={cy} r={4} fill={color} stroke="#fff" strokeWidth={1.5} />
                        );
                      }}
                      activeDot={{ r: 6 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
                  </div>
                ) : (
                  // BAR CHART VIEW (vertical bars for quality distribution)
                  <div className="animate-fadeIn">
                    <ResponsiveContainer width="100%" height={400} className="min-h-[300px]">
                    <BarChart
                      data={[
                        { quality: 'Good', count: distribution.good, fill: 'url(#barGradientGood)' },
                        { quality: 'Fair', count: distribution.fair, fill: 'url(#barGradientFair)' },
                        { quality: 'Poor', count: distribution.poor, fill: 'url(#barGradientPoor)' },
                        { quality: 'Bad', count: distribution.bad, fill: 'url(#barGradientBad)' },
                      ]}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <defs>
                        {/* Gradient untuk bar Good (Blue) */}
                        <linearGradient id="barGradientGood" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.7} />
                        </linearGradient>
                        
                        {/* Gradient untuk bar Fair (Yellow) */}
                        <linearGradient id="barGradientFair" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#eab308" stopOpacity={1} />
                          <stop offset="100%" stopColor="#eab308" stopOpacity={0.7} />
                        </linearGradient>
                        
                        {/* Gradient untuk bar Poor (Orange) */}
                        <linearGradient id="barGradientPoor" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f97316" stopOpacity={1} />
                          <stop offset="100%" stopColor="#f97316" stopOpacity={0.7} />
                        </linearGradient>
                        
                        {/* Gradient untuk bar Bad (Red) */}
                        <linearGradient id="barGradientBad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#ef4444" stopOpacity={1} />
                          <stop offset="100%" stopColor="#ef4444" stopOpacity={0.7} />
                        </linearGradient>
                      </defs>
                      
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="quality" 
                        stroke="#6b7280"
                        style={{ fontSize: '13px', fontWeight: 500 }}
                      />
                      <YAxis 
                        stroke="#6b7280"
                        style={{ fontSize: '12px' }}
                        label={{ 
                          value: 'Number of Beaches', 
                          angle: -90, 
                          position: 'insideLeft', 
                          style: { fontSize: '12px', fill: '#6b7280', textAnchor: 'middle' } 
                        }}
                      />
                      <Tooltip 
                        cursor={{ fill: 'rgba(59, 130, 246, 0.08)' }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            const percentage = distribution.total > 0 
                              ? Math.round((data.count / distribution.total) * 100) 
                              : 0;
                            const colorMap: Record<string, string> = {
                              'Good': 'text-blue-600',
                              'Fair': 'text-yellow-600',
                              'Poor': 'text-orange-600',
                              'Bad': 'text-red-600',
                            };
                            
                            // Calculate trend
                            const previousCount = data.quality === 'Good' ? previousDistribution.good :
                                                 data.quality === 'Fair' ? previousDistribution.fair :
                                                 data.quality === 'Poor' ? previousDistribution.poor :
                                                 data.quality === 'Bad' ? previousDistribution.bad : 0;
                            const trend = calculateTrend(data.count, previousCount);
                            
                            return (
                              <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-[180px]">
                                <p className={`font-semibold ${colorMap[data.quality]} mb-2`}>{data.quality}</p>
                                <p className="text-sm text-gray-700 mb-1">
                                  <span className="font-medium">Beaches:</span> {data.count} ({percentage}%)
                                </p>
                                {previousCount > 0 && !trend.isNeutral && (
                                  <div className="mt-2 pt-2 border-t border-gray-100">
                                    <p className={`text-xs font-medium flex items-center gap-1 ${
                                      trend.isPositive ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                      {trend.isPositive ? (
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                        </svg>
                                      ) : (
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                      )}
                                      <span>
                                        {Math.abs(trend.diff)} from last period
                                        {trend.percentChange !== 0 && ` (${trend.isPositive ? '+' : ''}${trend.percentChange}%)`}
                                      </span>
                                    </p>
                                  </div>
                                )}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar 
                        dataKey="count" 
                        radius={[8, 8, 0, 0]}
                        maxBarSize={80}
                      >
                        {[
                          { quality: 'Good', count: distribution.good, fill: 'url(#barGradientGood)' },
                          { quality: 'Fair', count: distribution.fair, fill: 'url(#barGradientFair)' },
                          { quality: 'Poor', count: distribution.poor, fill: 'url(#barGradientPoor)' },
                          { quality: 'Bad', count: distribution.bad, fill: 'url(#barGradientBad)' },
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  </div>
                )}

                {/* Summary (only for line chart) */}
                {chartType === 'line' && (
                  <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 animate-fadeIn">
                    {[
                      { label: 'Good', count: historyData.filter(d => d.quality === 'good').length, color: 'bg-blue-100 text-blue-700' },
                      { label: 'Fair', count: historyData.filter(d => d.quality === 'fair').length, color: 'bg-yellow-100 text-yellow-700' },
                      { label: 'Poor', count: historyData.filter(d => d.quality === 'poor').length, color: 'bg-orange-100 text-orange-700' },
                      { label: 'Bad', count: historyData.filter(d => d.quality === 'bad').length, color: 'bg-red-100 text-red-700' },
                    ].map((stat) => (
                      <div key={stat.label} className="text-center">
                        <div className={`inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full ${stat.color} font-bold text-base sm:text-lg mb-2 transition-transform hover:scale-110`}>
                          {stat.count}
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600">{stat.label} Days</p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}