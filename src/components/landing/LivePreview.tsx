'use client';

import { useEffect, useState } from 'react';
import { NormalizedWaterQualityData } from '@/lib/types';
import { getQualityLabel, formatDate } from '@/lib/utils/dataHelpers';
import { fetchNSWBeachwatchDataSafe } from '@/lib/api/beachwatch';
import Link from 'next/link';

export default function LivePreview() {
  const [previewData, setPreviewData] = useState<NormalizedWaterQualityData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPreviewData() {
      const { data } = await fetchNSWBeachwatchDataSafe();
      
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

            {/* CTA - Research Paper Citation Style */}
            <div className="text-center bg-white/60 backdrop-blur-sm rounded-2xl border-2 border-gray-200 p-8 shadow-lg">
              <div className="mb-4">
                <p className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-2">
                  Complete Dataset Available
                </p>
                <p className="text-2xl font-bold text-gray-900 mb-1">
                  245+ Active Monitoring Stations
                </p>
                <p className="text-sm text-gray-600 font-light">
                  Comprehensive coverage across New South Wales coastal regions
                </p>
              </div>
              
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-4 text-base font-bold text-white shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 border-2 border-blue-500/20"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
                </svg>
                Access Full Dashboard
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
              
              <div className="mt-6 flex items-center justify-center gap-6 text-xs text-gray-500 font-mono">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Live Data</span>
                </div>
                <span className="text-gray-300">•</span>
                <div className="flex items-center gap-2">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Validated Sources</span>
                </div>
                <span className="text-gray-300">•</span>
                <div className="flex items-center gap-2">
                  <span>Updated</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

    </section>
  );
}
