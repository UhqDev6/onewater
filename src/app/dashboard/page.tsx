'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { NormalizedWaterQualityData, WaterQualityFilters } from '@/lib/types';
import SummaryStats from '@/components/dashboard/SummaryStats';
import FiltersPanel from '@/components/dashboard/FiltersPanel';
import LocationCard from '@/components/dashboard/LocationCard';
import { filterWaterQualityData } from '@/lib/utils/dataHelpers';
import { fetchNSWBeachwatchDataSafe } from '@/lib/api/beachwatch';

// Dynamic import for MapView to avoid SSR issues with Leaflet
const MapView = dynamic(() => import('@/components/dashboard/MapView'), {
  ssr: false,
  loading: () => (
    <div className="rounded-lg border border-gray-200 bg-gray-50 h-[600px] flex items-center justify-center">
      <div className="text-gray-500">Loading map...</div>
    </div>
  ),
});

export default function DashboardPage() {
  const [filters, setFilters] = useState<WaterQualityFilters>({});
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('map');
  const [selectedLocation, setSelectedLocation] = useState<string | undefined>();
  const [beachData, setBeachData] = useState<NormalizedWaterQualityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch beach data on mount
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const { data, error: fetchError } = await fetchNSWBeachwatchDataSafe();
      
      if (fetchError) {
        setError(fetchError);
      } else {
        setBeachData(data);
      }
      
      setLoading(false);
    }

    loadData();
  }, []);

  // Filter data based on current filters
  const filteredData = filterWaterQualityData(beachData, filters);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Water Quality Dashboard</h1>
        <p className="text-gray-600">
          Real-time monitoring of water quality across Australian beaches
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Loading beach data...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-8">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                Failed to load beach data: {error}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content - Only show when not loading */}
      {!loading && (
        <>
          {/* Summary Statistics */}
          <div className="mb-8">
            <SummaryStats data={filteredData} />
          </div>

          {/* View Toggle */}
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Locations ({filteredData.length})
            </h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Grid View
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === 'map'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Map View
              </button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
            {/* Filters Sidebar */}
            <div className="lg:col-span-1">
              <FiltersPanel filters={filters} onFiltersChange={setFilters} />
            </div>

            {/* Content Area */}
            <div className="lg:col-span-3">
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {filteredData.length > 0 ? (
                    filteredData.map((data) => (
                      <LocationCard
                        key={data.location.id}
                        data={data}
                        onSelect={() => setSelectedLocation(data.location.id)}
                      />
                    ))
                  ) : (
                    <div className="col-span-full text-center py-12">
                      <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-gray-500 font-medium mb-1">
                        No locations match your filters
                      </p>
                      <p className="text-sm text-gray-400">
                        Try adjusting or clearing your filter selections
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <MapView
                  locations={filteredData}
                  selectedLocation={selectedLocation}
                  onLocationSelect={setSelectedLocation}
                />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
