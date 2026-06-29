/**
 * Water Quality View Component
 * Displays historical water quality trends with line chart
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  fetchWaterQualityHistory,
  fetchAvailableSites,
  type WaterQualityHistoryDataPoint,
} from '@/services/waterQualityHistoryService';
import {
  LineChart,
  Line,
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

// Custom tooltip component - defined outside of render
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
  const [sites, setSites] = useState<Array<{ site_id: string; site_name: string; data_points: number }>>([]);
  const [selectedSite, setSelectedSite] = useState<string | null>(initialSiteId || null);
  const [historyData, setHistoryData] = useState<WaterQualityHistoryDataPoint[]>([]);
  const [siteName, setSiteName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch available sites on mount
  useEffect(() => {
    async function loadSites() {
      setLoading(true);
      const { data, error: fetchError } = await fetchAvailableSites();
      
      if (fetchError) {
        setError(fetchError);
      } else {
        setSites(data);
        
        // Auto-select first site if no initial site
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

  // Filter sites based on search
  const filteredSites = sites.filter((site) =>
    site.site_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Quality level labels for Y-axis (highest = best)
  const qualityLabels = useMemo(() => ['', 'Bad', 'Poor', 'Fair', 'Good'], []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Water Quality History
        </h2>
        <p className="text-gray-600">
          View historical water quality trends over time
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Panel: Site Selection */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Select Location</h3>
            
            {/* Search */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search beaches..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Sites List */}
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                <p className="text-sm text-gray-600">Loading locations...</p>
              </div>
            ) : (
              <div className="space-y-1 max-h-[600px] overflow-y-auto">
                {filteredSites.length > 0 ? (
                  filteredSites.map((site) => (
                    <button
                      key={site.site_id}
                      onClick={() => setSelectedSite(site.site_id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        selectedSite === site.site_id
                          ? 'bg-blue-100 text-blue-900 font-medium'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <div className="font-medium truncate">{site.site_name}</div>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-500">No locations found</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Chart */}
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
                  <svg className="mx-auto h-12 w-12 text-red-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-gray-600 font-medium mb-1">Error Loading Data</p>
                  <p className="text-sm text-gray-500">{error}</p>
                </div>
              </div>
            ) : historyData.length === 0 ? (
              <div className="flex items-center justify-center py-32">
                <div className="text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <p className="text-gray-600 font-medium mb-1">No Data Available</p>
                  <p className="text-sm text-gray-500">
                    {selectedSite ? 'No historical data for this location yet' : 'Select a location to view history'}
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Chart Header */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {siteName}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Showing {historyData.length} data points from{' '}
                    {new Date(historyData[0].date).toLocaleDateString('en-AU', { month: 'short', day: 'numeric', year: 'numeric' })} to{' '}
                    {new Date(historyData[historyData.length - 1].date).toLocaleDateString('en-AU', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>

                {/* Line Chart */}
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart
                    data={historyData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
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
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: item.color }}
                              />
                              <span className="text-sm text-gray-600">{item.label}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    />
                    
                    {/* Reference lines for quality levels */}
                    <ReferenceLine y={1.5} stroke="#e5e7eb" strokeDasharray="3 3" />
                    <ReferenceLine y={2.5} stroke="#e5e7eb" strokeDasharray="3 3" />
                    <ReferenceLine y={3.5} stroke="#e5e7eb" strokeDasharray="3 3" />
                    
                    {/* Main line */}
                    <Line
                      type="monotone"
                      dataKey="qualityValue"
                      stroke="#3b82f6"
                      strokeWidth={3}
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
                          <circle
                            cx={cx}
                            cy={cy}
                            r={5}
                            fill={color}
                            stroke="#fff"
                            strokeWidth={2}
                          />
                        );
                      }}
                      activeDot={{ r: 7 }}
                    />
                  </LineChart>
                </ResponsiveContainer>

                {/* Data Summary */}
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
