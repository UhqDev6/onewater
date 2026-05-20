'use client';

import { useEffect, useState } from 'react';
import { NormalizedWaterQualityData } from '@/lib/types';
import { getQualityLabel, formatDate } from '@/lib/utils/dataHelpers';
import { fetchHybridBeachwatchDataSafe } from '@/lib/api/hybridBeachwatch';

export default function LivePreview() {
  const [previewData, setPreviewData] = useState<NormalizedWaterQualityData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPreviewData() {
      const { data } = await fetchHybridBeachwatchDataSafe();
      
      // Get one location for each rating type (good, fair, poor, bad)
      const goodSample = data.find(d => d.latestReading.qualityRating === 'good');
      const fairSample = data.find(d => d.latestReading.qualityRating === 'fair');
      const poorSample = data.find(d => d.latestReading.qualityRating === 'poor');
      const badSample = data.find(d => d.latestReading.qualityRating === 'bad');
      
      const samples = [goodSample, fairSample, poorSample, badSample].filter(Boolean) as NormalizedWaterQualityData[];
      
      setPreviewData(samples);
      setLoading(false);
    }

    loadPreviewData();
  }, []);

  return (
    <section className="py-24 bg-gradient-to-b from-gray-50 via-white to-gray-50 relative">
      {/* Scientific Grid Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:40px_40px] opacity-30" />
      
      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative">
        {/* Header - Research Paper Style */}
        <div className="text-center mb-16">
          <div className="inline-block mb-4">
            <span className="text-xs font-mono text-gray-500 tracking-widest uppercase border border-gray-300 px-3 py-1 rounded-full">
              Live Dataset • Updated
            </span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl mb-4">
            Real-Time Water Quality Observations
          </h2>
          <p className="text-base text-gray-600 max-w-xl mx-auto font-light leading-relaxed">
            Monitoring from Australian beaches. Check the latest water quality ratings before you swim.
          </p>
        </div>

        {/* Loading State - Scientific Spinner */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-12 w-12 rounded-full border-l-2 border-r-2 border-blue-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
              </div>
            </div>
            <p className="mt-4 text-sm font-mono text-gray-500 tracking-wide">Fetching observation data...</p>
          </div>
        )}

        {/* Preview Cards - Laboratory Glass Container Style */}
        {!loading && (
          <>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 mb-12">
              {previewData.map((data, index) => (
                <div
                  key={data.location.id}
                  className="group relative rounded-2xl border-2 border-gray-200 bg-white/80 backdrop-blur-sm p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] hover:border-gray-300 animate-fade-in"
                  style={{
                    animationDelay: `${index * 100}ms`,
                  }}
                >
                  {/* Specimen Label - Top Right */}
                  <div className="absolute top-3 right-3">
                    <span className="text-[10px] font-mono text-gray-400 tracking-widest">
                      #{String(index + 1).padStart(3, '0')}
                    </span>
                  </div>

                  {/* Location Header - Research Format */}
                  <div className="mb-5 pb-4 border-b border-gray-200">
                    <h3 className="text-base font-bold text-gray-900 mb-1 leading-tight">
                      {data.location.name}
                    </h3>
                    <p className="text-xs font-mono text-gray-500 tracking-wide">
                      {data.location.region} • {data.location.state}
                    </p>
                  </div>

                  {/* Quality Reading - Laboratory Result Style */}
                  <div className="mb-5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                        Quality Index
                      </span>
                      <span className="text-[10px] font-mono text-gray-400">
                        {formatDate(data.latestReading.sampleDate)}
                      </span>
                    </div>
                    <div className="relative">
                      <div
                        className={`px-4 py-2.5 rounded-lg text-sm font-bold text-center shadow-md  ${
                          data.latestReading.qualityRating === 'good' 
                            ? 'bg-linear-to-r from-blue-50 to-blue-100 border-blue-200 text-blue-900'
                            : data.latestReading.qualityRating === 'fair'
                            ? 'bg-linear-to-r from-yellow-50 to-yellow-100 border-yellow-200 text-yellow-900'
                            : data.latestReading.qualityRating === 'poor'
                            ? 'bg-linear-to-r from-orange-50 to-orange-100 border-orange-200 text-orange-900'
                            : 'bg-linear-to-r from-red-50 to-red-100 border-red-200 text-red-900'
                        }`}
                      >
                        {getQualityLabel(data.latestReading.qualityRating).toUpperCase()}
                      </div>
                    </div>
                  </div>

                  {/* Measurement Details - Table Format */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-xs font-mono text-gray-500 uppercase tracking-wide">Source</span>
                      <span className="text-xs font-semibold text-gray-700">
                        {data.latestReading.source === 'nsw_beachwatch' ? 'NSW' : data.latestReading.source}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-xs font-mono text-gray-500 uppercase tracking-wide">Coordinates</span>
                      <span className="text-[10px] font-mono text-gray-600 tabular-nums">
                        {data.location.latitude.toFixed(3)}°, {data.location.longitude.toFixed(3)}°
                      </span>
                    </div>
                  </div>

                  {/* Hover Effect Border Glow */}
                  <div className="absolute inset-0 rounded-2xl border-2 border-blue-400/0 group-hover:border-blue-400/30 transition-colors duration-300 pointer-events-none"></div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

    </section>
  );
}
