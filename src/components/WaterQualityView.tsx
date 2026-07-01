/**
 * Water Quality View Component
 * Displays historical water quality trends with smart adaptive line coloring
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  fetchWaterQualityHistory,
  fetchAvailableSites,
  type WaterQualityHistoryDataPoint,
} from '@/services/waterQualityHistoryService';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

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
  }>>([]);
  const [selectedSite, setSelectedSite] = useState<string | null>(initialSiteId || null);
  const [historyData, setHistoryData] = useState<WaterQualityHistoryDataPoint[]>([]);
  const [siteName, setSiteName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Helper: Check if date is within 24 hours
  const isWithin24Hours = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    return diffHours <= 24;
  };

  // Helper: Format relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' });
  };

  // Fetch available sites on mount
  useEffect(() => {
    async function loadSites() {
      setLoading(true);
      const { data, error: fetchError } = await fetchAvailableSites();
      
      if (fetchError) {
        setError(fetchError);
      } else {
        setSites(data);
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
      
      const { data, siteName: name, error: fetchError } = await fetchWaterQualityHistory(selectedSite!, 90);
      
      if (fetchError) {
        setError(fetchError);
        setHistoryData([]);
        setSiteName(null);
      } else {
        setHistoryData(data);
        setSiteName(name);
      }
      
      setLoadingHistory(false);
    }
    loadHistory();
  }, [selectedSite]);

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
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Water Quality History</h2>
        <p className="text-gray-600">View historical water quality trends over time</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Panel */}
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
              <div className="space-y-1 max-h-[600px] overflow-y-auto">
                {filteredSites.length > 0 ? (
                  filteredSites.map((site) => {
                    const isNew = isWithin24Hours(site.latest_snapshot_date);
                    
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
                          {isNew && (
                            <span className="flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              New
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {formatRelativeTime(site.latest_snapshot_date)}
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

        {/* Right Panel (Chart) */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            {loadingHistory ? (
              <div className="flex items-center justify-center py-32">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                  <p className="text-gray-600">Loading historical data...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-32">
                <div className="text-center">
                  <p className="text-gray-600 font-medium mb-1">Error Loading Data</p>
                  <p className="text-sm text-gray-500">{error}</p>
                </div>
              </div>
            ) : historyData.length === 0 ? (
              <div className="flex items-center justify-center py-32">
                <p className="text-gray-600 font-medium">No Data Available</p>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{siteName}</h3>
                  <p className="text-sm text-gray-600">
                    Showing {historyData.length} data points from{' '}
                    {new Date(historyData[0].date).toLocaleDateString('en-AU', { month: 'short', day: 'numeric', year: 'numeric' })} to{' '}
                    {new Date(historyData[historyData.length - 1].date).toLocaleDateString('en-AU', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>

                <ResponsiveContainer width="100%" height={400}>
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

                {/* Summary */}
                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Good', count: historyData.filter(d => d.quality === 'good').length, color: 'bg-blue-100 text-blue-700' },
                    { label: 'Fair', count: historyData.filter(d => d.quality === 'fair').length, color: 'bg-yellow-100 text-yellow-700' },
                    { label: 'Poor', count: historyData.filter(d => d.quality === 'poor').length, color: 'bg-orange-100 text-orange-700' },
                    { label: 'Bad', count: historyData.filter(d => d.quality === 'bad').length, color: 'bg-red-100 text-red-700' },
                  ].map((stat) => (
                    <div key={stat.label} className="text-center">
                      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${stat.color} font-bold text-lg mb-2`}>
                        {stat.count}
                      </div>
                      <p className="text-sm text-gray-600">{stat.label} Days</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}