/**
 * Water Quality View Component
 * Displays historical water quality trends with smart adaptive line coloring and stacked threshold bars
 * Features: Data caching, loading states, mobile responsive
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  fetchWaterQualityHistory,
  fetchAvailableSites,
  fetchAllBeachQualityByDate,
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
} from 'recharts';

// Cache utilities
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const CACHE_VERSION = 'v2'; // Increment this to bust all caches after code changes
const CACHE_KEYS = {
  SITES: `wq_sites_${CACHE_VERSION}`,
  HISTORY: `wq_history_${CACHE_VERSION}`,
  ALL_BEACH_DATA: `wq_all_beach_data_${CACHE_VERSION}`,
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

    if (now - timestamp < CACHE_DURATION) {
      return data;
    }

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
    Object.values(CACHE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
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
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 animate-fadeIn">
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
  const [allBeachData, setAllBeachData] = useState<Array<{
    date: string;
    good: number;
    fair: number; 
    poor: number;
    bad: number;
    total: number;
    goodPercentage: number;
    fairPercentage: number;
    poorPercentage: number;
    badPercentage: number;
  }>>([]);
  const [siteName, setSiteName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingAllBeachData, setLoadingAllBeachData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [timeFrame, setTimeFrame] = useState<'7D' | '1M' | '3M' | 'ALL'>('1M');
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  const handleRefreshData = async () => {
    setIsRefreshing(true);
    clearAllCache();
    
    try {
      const { data: sitesData, error: sitesError } = await fetchAvailableSites();
      if (!sitesError) {
        setSites(sitesData);
        setCachedData(CACHE_KEYS.SITES, sitesData);
      }

      if (selectedSite) {
        const daysLimit = timeFrame === '7D' ? 7 : timeFrame === '1M' ? 30 : timeFrame === '3M' ? 90 : 365;
        
        const { data: historyDataResult, siteName: name, error: historyError } = await fetchWaterQualityHistory(selectedSite, daysLimit);
        
        if (!historyError) {
          setHistoryData(historyDataResult);
          setSiteName(name);
          const cacheKey = `${CACHE_KEYS.HISTORY}_${selectedSite}_${timeFrame}`;
          setCachedData(cacheKey, { data: historyDataResult, siteName: name });
        }
        
        // Also reload all beach data for bar chart
        const { data: allBeachResult, error: allBeachError } = await fetchAllBeachQualityByDate(daysLimit);
        if (!allBeachError) {
          setAllBeachData(allBeachResult);
          const allBeachCacheKey = `${CACHE_KEYS.ALL_BEACH_DATA}_${timeFrame}`;
          setCachedData(allBeachCacheKey, allBeachResult);
        }
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    async function loadSites() {
      setLoading(true);
      const cachedSites = getCachedData<typeof sites>(CACHE_KEYS.SITES);
      if (cachedSites) {
        setSites(cachedSites);
        if (!initialSiteId && cachedSites.length > 0) {
          setSelectedSite(cachedSites[0].site_id);
        }
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await fetchAvailableSites();
      if (fetchError) {
        setError(fetchError);
      } else {
        setSites(data);
        setCachedData(CACHE_KEYS.SITES, data);
        if (!initialSiteId && data.length > 0) {
          setSelectedSite(data[0].site_id);
        }
      }
      setLoading(false);
    }
    loadSites();
  }, [initialSiteId]);

  useEffect(() => {
    if (!selectedSite) return;

    async function loadHistory() {
      setLoadingHistory(true);
      setError(null);
      
      const daysLimit = timeFrame === '7D' ? 7 : timeFrame === '1M' ? 30 : timeFrame === '3M' ? 90 : 365;
      const cacheKey = `${CACHE_KEYS.HISTORY}_${selectedSite}_${timeFrame}`;
      
      const cachedHistory = getCachedData<{ data: WaterQualityHistoryDataPoint[]; siteName: string }>(cacheKey);
      if (cachedHistory) {
        setHistoryData(cachedHistory.data);
        setSiteName(cachedHistory.siteName);
        setLoadingHistory(false);
        return;
      }

      const { data, siteName: name, error: fetchError } = await fetchWaterQualityHistory(selectedSite!, daysLimit);
      if (fetchError) {
        setError(fetchError);
        setHistoryData([]);
        setSiteName(null);
      } else {
        setHistoryData(data);
        setSiteName(name);
        setCachedData(cacheKey, { data, siteName: name });
      }
      setLoadingHistory(false);
    }
    loadHistory();
  }, [selectedSite, timeFrame]);

  // Fetch all beach data for bar chart (independent of selected site)
  useEffect(() => {
    async function loadAllBeachData() {
      setLoadingAllBeachData(true);
      
      const daysLimit = timeFrame === '7D' ? 7 : timeFrame === '1M' ? 30 : timeFrame === '3M' ? 90 : 365;
      const cacheKey = `${CACHE_KEYS.ALL_BEACH_DATA}_${timeFrame}`;
      
      const cachedAllBeachData = getCachedData<Array<{
        date: string;
        good: number;
        fair: number; 
        poor: number;
        bad: number;
        total: number;
        goodPercentage: number;
        fairPercentage: number;
        poorPercentage: number;
        badPercentage: number;
      }>>(cacheKey);
      
      if (cachedAllBeachData) {
        setAllBeachData(cachedAllBeachData);
        setLoadingAllBeachData(false);
        return;
      }

      const { data, error: fetchError } = await fetchAllBeachQualityByDate(daysLimit);
      if (fetchError) {
        console.error('Error fetching all beach data:', fetchError);
        setAllBeachData([]);
      } else {
        setAllBeachData(data);
        setCachedData(cacheKey, data);
      }
      setLoadingAllBeachData(false);
    }
    loadAllBeachData();
  }, [timeFrame]); // Only depends on timeFrame, not selectedSite

  // 🔥 UPDATE LOGIKA: Mempersiapkan data koordinat X, Y serta segmentasi balok untuk Stacked Bar
  const processedChartData = useMemo(() => {
    return historyData.map((item, index) => {
      const baseValue = Math.round(item.qualityValue); // Mengambil nilai integer murni (1-4)
      return {
        ...item,
        // Jitter mikro khusus line chart agar anti-collapse
        qualityValue: item.qualityValue + (index % 2 === 0 ? 0.0001 : 0),
        // Penghitungan tinggi balok pembentuk tumpukan kustom pada Bar Chart
        barBad: baseValue >= 1 ? 1 : 0,
        barPoor: baseValue >= 2 ? 1 : 0,
        barFair: baseValue >= 3 ? 1 : 0,
        barGood: baseValue >= 4 ? 1 : 0,
      };
    });
  }, [historyData]);

  const isFlatLine = useMemo(() => {
    if (historyData.length <= 1) return true;
    const firstQuality = historyData[0]?.quality;
    return historyData.every((item) => item.quality === firstQuality);
  }, [historyData]);

  const adaptiveStrokeColor = useMemo(() => {
    if (!isFlatLine || historyData.length === 0) return 'url(#waterQualityLineGradient)';
    const currentQuality = historyData[0].quality;
    switch (currentQuality) {
      case 'good': return '#3b82f6';
      case 'fair': return '#eab308';
      case 'poor': return '#f97316';
      case 'bad': return '#ef4444';
      default: return '#6b7280';
    }
  }, [isFlatLine, historyData]);

  const adaptiveAreaFill = useMemo(() => {
    if (!isFlatLine || historyData.length === 0) return 'url(#waterQualityAreaGradient)';
    const currentQuality = historyData[0].quality;
    switch (currentQuality) {
      case 'good': return 'url(#areaGradientGood)';
      case 'fair': return 'url(#areaGradientFair)';
      case 'poor': return 'url(#areaGradientPoor)';
      case 'bad': return 'url(#areaGradientBad)';
      default: return 'url(#waterQualityAreaGradient)';
    }
  }, [isFlatLine, historyData]);

  const filteredSites = sites.filter((site) =>
    site?.site_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const changedSites = filteredSites.filter(site => site.quality_changed);
  const stableSites = filteredSites.filter(site => !site.quality_changed);
  const hasChangedSites = changedSites.length > 0;
  const hasStableSites = stableSites.length > 0;

  const qualityLabels = useMemo(() => ['', 'Bad', 'Poor', 'Fair', 'Good'], []);

  // 📊 Hitung persentase distribusi kualitas air
  const qualityDistribution = useMemo(() => {
    if (historyData.length === 0) return { good: 0, fair: 0, poor: 0, bad: 0 };
    
    const counts = {
      good: historyData.filter(d => d.quality === 'good').length,
      fair: historyData.filter(d => d.quality === 'fair').length,
      poor: historyData.filter(d => d.quality === 'poor').length,
      bad: historyData.filter(d => d.quality === 'bad').length,
    };

    const total = historyData.length;
    
    return {
      good: Math.round((counts.good / total) * 100),
      fair: Math.round((counts.fair / total) * 100),
      poor: Math.round((counts.poor / total) * 100),
      bad: Math.round((counts.bad / total) * 100),
    };
  }, [historyData]);

  // 📊 Data untuk Bar Chart (Distribution per Date) - Using ALL beach data
  const barChartDataByDate = useMemo(() => {
    if (!allBeachData || allBeachData.length === 0) {
      return [];
    }

    // Transform allBeachData to format expected by recharts
    const result = allBeachData.map((item) => ({
      date: item.date,
      label: item.date, // For X-axis display
      good: item.goodPercentage,
      fair: item.fairPercentage,
      poor: item.poorPercentage,
      bad: item.badPercentage,
      totalSamples: item.total,
      // Keep raw counts for tooltip display
      goodCount: item.good,
      fairCount: item.fair,
      poorCount: item.poor,
      badCount: item.bad,
    }));

    return result;
  }, [allBeachData]);



  // Tooltip interfaces
  interface TooltipPayload {
    payload: {
      date: string;
      good: number;
      fair: number;
      poor: number;
      bad: number;
      totalSamples: number;
      goodCount?: number;
      fairCount?: number;
      poorCount?: number;
      badCount?: number;
    };
  }

  interface TooltipProps {
    active?: boolean;
    payload?: TooltipPayload[];
    label?: string;
  }

  // Custom tooltip untuk Bar Chart (Date-based percentages)
  const BarChartTooltip = ({ active, payload, label }: TooltipProps) => {
    if (active && payload && payload.length > 0) {
      const data = payload[0].payload;
      const date = new Date(label || '');
      const formattedDate = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getFullYear()).slice(-2)}`;
      
      return (
        <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="font-semibold text-gray-900 mb-2">{formattedDate}</p>
          <p className="text-sm text-gray-600 mb-2">Total Samples: {data.totalSamples}</p>
          <div className="space-y-1">
            {data.good > 0 && (
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-sm">Good:</span>
                </div>
                <span className="text-sm font-medium">{data.good}% ({data.goodCount || 0})</span>
              </div>
            )}
            {data.fair > 0 && (
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span className="text-sm">Fair:</span>
                </div>
                <span className="text-sm font-medium">{data.fair}% ({data.fairCount || 0})</span>
              </div>
            )}
            {data.poor > 0 && (
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  <span className="text-sm">Poor:</span>
                </div>
                <span className="text-sm font-medium">{data.poor}% ({data.poorCount || 0})</span>
              </div>
            )}
            {data.bad > 0 && (
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-sm">Bad:</span>
                </div>
                <span className="text-sm font-medium">{data.bad}% ({data.badCount || 0})</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };



  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Water Quality History</h2>
          <p className="text-gray-600">View historical water quality trends over time</p>
        </div>
        
        <button
          onClick={handleRefreshData}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>

      <div className={`grid grid-cols-1 ${chartType === 'line' ? 'lg:grid-cols-4' : 'lg:grid-cols-1'} gap-6`}>
        {/* Left Panel - Hanya muncul untuk Line Chart */}
        {chartType === 'line' && (
          <div className="lg:col-span-1">
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
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {filteredSites.length > 0 ? (
                  <>
                    {hasChangedSites && (
                      <div>
                        <div className="flex items-center gap-2 px-2 py-1.5 mb-1">
                          <div className="flex-1 h-px bg-gradient-to-r from-red-200 via-yellow-200 to-green-200"></div>
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Recent Changes</span>
                          <div className="flex-1 h-px bg-gradient-to-r from-green-200 via-yellow-200 to-red-200"></div>
                        </div>
                        <div className="space-y-1">
                          {changedSites.map((site) => (
                            <button
                              key={site.site_id}
                              onClick={() => setSelectedSite(site.site_id)}
                              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                                selectedSite === site.site_id ? 'bg-blue-100 text-blue-900 font-medium' : 'hover:bg-gray-100 text-gray-700'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="font-medium truncate flex-1">{site.site_name}</div>
                                <span className={`flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                  site.quality_trend === 'improved' ? 'bg-green-100 text-green-800' : site.quality_trend === 'declined' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {site.quality_trend === 'improved' ? '↑ Improved' : site.quality_trend === 'declined' ? '↓ Declined' : 'Changed'}
                                </span>
                              </div>
                              <div className="text-xs text-gray-500 mt-0.5">{formatRelativeTime(site.latest_updated_at)}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {hasStableSites && (
                      <div className={hasChangedSites ? 'mt-4' : ''}>
                        {hasChangedSites && (
                          <div className="flex items-center gap-2 px-2 py-1.5 mb-1">
                            <div className="flex-1 h-px bg-gray-200"></div>
                            <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Stable</span>
                            <div className="flex-1 h-px bg-gray-200"></div>
                          </div>
                        )}
                        <div className="space-y-1">
                          {stableSites.map((site) => (
                            <button
                              key={site.site_id}
                              onClick={() => setSelectedSite(site.site_id)}
                              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                                selectedSite === site.site_id ? 'bg-blue-100 text-blue-900 font-medium' : 'hover:bg-gray-100 text-gray-700'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="font-medium truncate flex-1">{site.site_name}</div>
                              </div>
                              <div className="text-xs text-gray-500 mt-0.5">{formatRelativeTime(site.latest_updated_at)}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
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

        {/* Main Chart Panel */}
        <div className={chartType === 'line' ? 'lg:col-span-3' : 'lg:col-span-1'}>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            {(chartType === 'line' && loadingHistory) || (chartType === 'bar' && loadingAllBeachData) ? (
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
            ) : error ? (
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
            ) : (chartType === 'line' && historyData.length === 0) || (chartType === 'bar' && barChartDataByDate.length === 0) ? (
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
            ) : (
              <>
                {/* Chart Header */}
                <div className="mb-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
                    <div className="flex-1">
                      {chartType === 'line' ? (
                        <>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">{siteName}</h3>
                          <p className="text-sm text-gray-600">
                            Showing {historyData.length} data points from{' '}
                            {new Date(historyData[0].date).toLocaleDateString('en-AU', { month: 'short', day: 'numeric', year: 'numeric' })} to{' '}
                            {new Date(historyData[historyData.length - 1].date).toLocaleDateString('en-AU', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </>
                      ) : (
                        <>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">Water Quality Distribution</h3>
                          <p className="text-sm text-gray-600">
                            Percentage distribution of water quality categories across all beaches per date ({barChartDataByDate.length} dates available)
                          </p>
                        </>
                      )}
                    </div>
                    
                    {/* Controls */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                      {/* Chart Type Toggle */}
                      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                        <button
                          onClick={() => setChartType('line')}
                          className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                            chartType === 'line' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          Individual
                        </button>
                        <button
                          onClick={() => setChartType('bar')}
                          className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                            chartType === 'bar' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          Overall
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
                              timeFrame === option.value ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
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
                  /* LINE CHART VIEW */
                  <div className="animate-fadeIn">
                    <ResponsiveContainer width="100%" height={400} className="min-h-[300px]">
                      <AreaChart data={processedChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <defs>
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

                          <linearGradient id="areaGradientGood" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
                          </linearGradient>
                          <linearGradient id="areaGradientFair" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#eab308" stopOpacity={0.4} />
                            <stop offset="100%" stopColor="#eab308" stopOpacity={0.02} />
                          </linearGradient>
                          <linearGradient id="areaGradientPoor" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f97316" stopOpacity={0.4} />
                            <stop offset="100%" stopColor="#f97316" stopOpacity={0.02} />
                          </linearGradient>
                          <linearGradient id="areaGradientBad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#ef4444" stopOpacity={0.4} />
                            <stop offset="100%" stopColor="#ef4444" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>

                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                          dataKey="date"
                          angle={-45}
                          textAnchor="end"
                          height={90}
                          tick={{ fontSize: 10, fill: '#6b7280' }}
                          tickFormatter={(date) => {
                            const d = new Date(date);
                            return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getFullYear()).slice(-2)}`;
                          }}
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
                          stroke={adaptiveStrokeColor}
                          fill={adaptiveAreaFill}
                          strokeWidth={2}
                          dot={(props: DotProps) => {
                            const { cx, cy, payload } = props;
                            if (!cx || !cy || !payload) return null;
                            const color = 
                              payload.quality === 'good' ? '#3b82f6' :
                              payload.quality === 'fair' ? '#eab308' :
                              payload.quality === 'poor' ? '#f97316' :
                              payload.quality === 'bad' ? '#ef4444' : '#6b7280';
                            return <circle cx={cx} cy={cy} r={4} fill={color} stroke="#fff" strokeWidth={1.5} />;
                          }}
                          activeDot={{ r: 6 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  /* 🔥 BAR CHART: Distribusi Persentase per Tanggal (mengikuti pola MST) */
                  <div className="animate-fadeIn">
                    <ResponsiveContainer width="100%" height={400} className="min-h-[300px]">
                      <BarChart 
                        data={barChartDataByDate} 
                        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                        barSize={30}
                      >
                        <defs>
                          {/* Seamless smooth gradient dari Bad (bottom) ke Good (top) */}
                          <linearGradient id="seamlessQualityGradient" x1="0" y1="1" x2="0" y2="0">
                            {/* Bad - Bottom */}
                            <stop offset="0%" stopColor="#ef4444" stopOpacity={0.92} />
                            <stop offset="12.5%" stopColor="#f87171" stopOpacity={0.92} />
                            
                            {/* Transition Bad → Poor */}
                            <stop offset="25%" stopColor="#fb6b45" stopOpacity={0.92} />
                            
                            {/* Poor */}
                            <stop offset="37.5%" stopColor="#fb923c" stopOpacity={0.92} />
                            <stop offset="50%" stopColor="#f97316" stopOpacity={0.92} />
                            
                            {/* Transition Poor → Fair */}
                            <stop offset="62.5%" stopColor="#f59e0b" stopOpacity={0.92} />
                            
                            {/* Fair */}
                            <stop offset="75%" stopColor="#fbbf24" stopOpacity={0.92} />
                            
                            {/* Transition Fair → Good */}
                            <stop offset="87.5%" stopColor="#60a5fa" stopOpacity={0.92} />
                            
                            {/* Good - Top */}
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.92} />
                          </linearGradient>

                          {/* Individual gradients untuk legend colors */}
                          <linearGradient id="gradientGood" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.92} />
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.88} />
                          </linearGradient>
                          
                          <linearGradient id="gradientFair" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.92} />
                            <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.88} />
                          </linearGradient>
                          
                          <linearGradient id="gradientPoor" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#fb923c" stopOpacity={0.92} />
                            <stop offset="100%" stopColor="#f97316" stopOpacity={0.88} />
                          </linearGradient>
                          
                          <linearGradient id="gradientBad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f87171" stopOpacity={0.92} />
                            <stop offset="100%" stopColor="#ef4444" stopOpacity={0.88} />
                          </linearGradient>
                        </defs>

                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                        {/* X-axis: Tanggal dalam format dd/mm/yy */}
                        <XAxis 
                          dataKey="date" 
                          angle={-45}
                          textAnchor="end"
                          height={90}
                          tick={{ fontSize: 10, fill: '#6b7280' }}
                          tickFormatter={(date) => {
                            const d = new Date(date);
                            return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getFullYear()).slice(-2)}`;
                          }}
                        />
                        {/* Y-axis: Persentase 0-100% */}
                        <YAxis 
                          domain={[0, 100]}
                          ticks={[0, 20, 40, 60, 80, 100]}
                          tickFormatter={(value) => `${Math.round(value)}%`}
                          tick={{ fontSize: 12, fill: '#6b7280' }}
                          label={{
                            value: 'Percentage (%)',
                            angle: -90,
                            position: 'insideLeft',
                            style: { fontSize: 12, fill: '#6b7280' },
                          }}
                        />
                        {/* Custom Tooltip untuk Bar Chart */}
                        <Tooltip content={<BarChartTooltip />} />
                        <Legend
                          verticalAlign="bottom"
                          align="center"
                          height={30}
                          wrapperStyle={{ 
                            paddingTop: '40px',
                            marginTop: '20px'
                          }}
                          iconType="square"
                          content={() => (
                            <div className="flex justify-center gap-6 mt-4">
                              {[
                                { color: '#3b82f6', label: 'Good' },
                                { color: '#eab308', label: 'Fair' },
                                { color: '#f97316', label: 'Poor' },
                                { color: '#ef4444', label: 'Bad' },
                              ].map((item) => (
                                <div key={item.label} className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }} />
                                  <span className="text-sm text-gray-600">{item.label}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        />
                        
                        {/* Stacked bars dengan seamless smooth gradient - tanpa border */}
                        <Bar
                          dataKey="bad"
                          stackId="quality"
                          fill="url(#gradientBad)"
                          radius={[0, 0, 4, 4]}
                          animationDuration={800}
                          animationEasing="ease-out"
                        />
                        <Bar
                          dataKey="poor"
                          stackId="quality"
                          fill="url(#gradientPoor)"
                          animationDuration={800}
                          animationEasing="ease-out"
                        />
                        <Bar
                          dataKey="fair"
                          stackId="quality"
                          fill="url(#gradientFair)"
                          animationDuration={800}
                          animationEasing="ease-out"
                        />
                        <Bar
                          dataKey="good"
                          stackId="quality"
                          fill="url(#gradientGood)"
                          radius={[4, 4, 0, 0]}
                          animationDuration={800}
                          animationEasing="ease-out"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Summary Section - Only show for line chart */}
                {chartType === 'line' && (
                  <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 animate-fadeIn">
                    {[
                      { label: 'Good', count: historyData.filter(d => d.quality === 'good').length, percentage: qualityDistribution.good, color: 'bg-blue-100 text-blue-700' },
                      { label: 'Fair', count: historyData.filter(d => d.quality === 'fair').length, percentage: qualityDistribution.fair, color: 'bg-yellow-100 text-yellow-700' },
                      { label: 'Poor', count: historyData.filter(d => d.quality === 'poor').length, percentage: qualityDistribution.poor, color: 'bg-orange-100 text-orange-700' },
                      { label: 'Bad', count: historyData.filter(d => d.quality === 'bad').length, percentage: qualityDistribution.bad, color: 'bg-red-100 text-red-700' },
                    ].map((stat) => (
                      <div key={stat.label} className="text-center">
                        <div className={`inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full ${stat.color} font-bold text-base sm:text-lg mb-2 transition-transform hover:scale-110`}>
                          {stat.count}
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600 font-medium">{stat.label} Days</p>
                        <p className="text-xs sm:text-sm text-gray-500 font-semibold mt-0.5">{stat.percentage}%</p>
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