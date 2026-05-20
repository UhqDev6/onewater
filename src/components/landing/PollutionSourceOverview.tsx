'use client';

import { useState } from 'react';
import { useMSTOverview, type MSTDataSource } from '@/hooks/useMSTOverview';

export default function PollutionSourceOverview() {
  const [dataSource, setDataSource] = useState<MSTDataSource>('faecal');
  const { pollutionSources, totalSamples, isLoading } = useMSTOverview(dataSource);

  // Show loading state
  if (isLoading) {
    return (
      <section className="py-24 sm:py-32 bg-gradient-to-b from-gray-50 via-white to-gray-50 relative">
        <div className="container mx-auto px-4 relative">
          <div className="mx-auto max-w-3xl text-center">
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading pollution source data...</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-24 sm:py-32 bg-gradient-to-b from-gray-50 via-white to-gray-50 relative">
      {/* Microscope Pattern Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" />

      <div className="container mx-auto px-4 relative">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center mb-16">
          <div className="inline-block mb-4">
            <span className="text-xs font-mono text-orange-600 tracking-widest uppercase border border-orange-300 px-3 py-1 rounded-full bg-orange-50">
              Microbial Source Tracking
            </span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl mb-4">
            Source Identification
          </h2>
          <p className="text-base text-gray-600 font-light leading-relaxed mb-2">
            Tracking the footprints of contamination
          </p>
          <p className="text-sm text-gray-500 font-light mb-2">
            Median values across all monitored locations
          </p>
          <p className="text-xs text-blue-600 font-medium bg-blue-50 border border-blue-200 rounded-full px-3 py-1 inline-block">
            Example Site: Frankston Beach
          </p>
          <p className="text-xs text-gray-400 mt-2 mb-6">
            Currently showing data from Frankston Beach as reference
          </p>

          {/* Data Source Toggle */}
          <div className="inline-flex items-center gap-2 bg-white border-2 border-gray-200 rounded-xl p-1 shadow-sm">
            <button
              onClick={() => setDataSource('faecal')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                dataSource === 'faecal'
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Faecal Community
            </button>
            <button
              onClick={() => setDataSource('microbial')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                dataSource === 'microbial'
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Microbial Community
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="mx-auto max-w-5xl">
          {/* Top 2 Dominant Sources */}
          <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {(() => {
              // Get all sources sorted by median (descending)
              const allSources = pollutionSources.flatMap(cat => cat.sources)
                .sort((a, b) => b.median - a.median);
              
              console.log('All sources before filtering:', allSources.map(s => ({ name: s.name, median: s.median })));
              
              // Simply take top 2 sources (no smart filtering)
              const topSources = allSources.slice(0, 2);
              
              console.log('Top sources to display:', topSources.map(s => ({ name: s.name, median: s.median })));
              
              if (topSources.length === 0) {
                return (
                  <div className="col-span-2 text-center py-8 text-gray-500">
                    No data available
                  </div>
                );
              }
              
              return topSources.map((source, index) => (
                <div
                  key={source.name}
                  className="bg-white/80 backdrop-blur-sm border-2 border-gray-200 rounded-xl p-8 shadow-md hover:shadow-xl transition-all animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-6 h-6 rounded-full shadow-md"
                        style={{ backgroundColor: source.color }}
                      />
                      <span className="text-xs font-mono text-gray-500">#{index + 1} Dominant</span>
                    </div>
                  </div>
                  
                  <div className="text-5xl font-bold text-gray-900 mb-2 tabular-nums">
                    {source.median.toFixed(1)}%
                  </div>
                  
                  <div className="text-lg font-semibold text-gray-700 mb-1">
                    {source.name}
                  </div>
                  
                  <div className="text-sm text-gray-500">
                    Median contribution across all samples
                  </div>
                  
                  {/* Progress indicator */}
                  <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${Math.min(source.median, 100)}%`,
                        backgroundColor: source.color,
                      }}
                    />
                  </div>
                </div>
              ));
            })()}
          </div>

          <div className="bg-white/80 backdrop-blur-sm border-2 border-gray-200 rounded-2xl p-8 shadow-lg">
            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-blue-900 mb-1">
                    What is Microbial Source Tracking (MST)?
                  </p>
                  <p className="text-xs text-blue-700 leading-relaxed">
                    MST uses DNA analysis to identify the origin of fecal contamination in water. 
                    By detecting host-specific genetic markers, we can determine whether pollution 
                    comes from humans, animals, or natural sources. The values shown represent median 
                    contributions across all monitored locations.
                  </p>
                </div>
              </div>
            </div>

            {/* Methodology Note */}
            <div className="mt-6 text-center">
              <p className="text-xs font-mono text-gray-500">
                Data based on <span className="text-blue-600 font-semibold">median values</span> from {dataSource === 'faecal' ? 'faecal' : 'microbial'} community analysis
                {totalSamples > 0 && (
                  <span> • {totalSamples.toLocaleString()} samples analyzed</span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
