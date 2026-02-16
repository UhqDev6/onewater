'use client';

import { useEffect, useState } from 'react';
import { NormalizedWaterQualityData } from '@/lib/types';
import { getQualityColor, getQualityLabel, formatDate } from '@/lib/utils/dataHelpers';
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
    <section className="py-24 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl mb-4">
            Live Water Quality Data
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Real-time monitoring from Australian beaches. Check the latest water quality ratings before you swim.
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Preview Cards */}
        {!loading && (
          <>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 mb-12">
              {previewData.map((data) => (
                <div
                  key={data.location.id}
                  className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Header */}
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {data.location.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {data.location.region}, {data.location.state}
                    </p>
                  </div>

                  {/* Quality Badge */}
                  <div className="mb-4">
                    <div
                      className="inline-block px-3 py-1 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: getQualityColor(data.latestReading.qualityRating) }}
                    >
                      {getQualityLabel(data.latestReading.qualityRating)}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Latest Update</span>
                      <span className="font-medium text-gray-900">
                        {formatDate(data.latestReading.sampleDate)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Data Source</span>
                      <span className="font-medium text-gray-900">
                        {data.latestReading.source === 'nsw_beachwatch' ? 'NSW Beachwatch' : data.latestReading.source}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="text-center">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
              >
                View All {previewData.length > 0 ? '245+' : ''} Locations
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
              <p className="mt-4 text-sm text-gray-500">
                Updated in real-time from official government sources
              </p>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
