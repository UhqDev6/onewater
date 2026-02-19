'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { NormalizedWaterQualityData, WaterQualityFilters } from '@/lib/types';
import SummaryStats from '@/components/dashboard/SummaryStats';
import FiltersPanel from '@/components/dashboard/FiltersPanel';
import LocationCard from '@/components/dashboard/LocationCard';
import GridFilterBar, { GridFilterState } from '@/components/dashboard/GridFilterBar';
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
  
  // Grid view filtering states
  const [gridFilters, setGridFilters] = useState<GridFilterState>({
    search: '',
    letter: null,
    sort: 'asc',
    region: null,
  });
  
  // Infinite scroll states
  const [displayedItems, setDisplayedItems] = useState(20);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Create a stable filter key for resetting
  const filterKey = useMemo(() => JSON.stringify(filters), [filters]);
  const gridFilterKey = useMemo(() => JSON.stringify(gridFilters), [gridFilters]);

  // Fetch all beach data on mount (for map view and initial stats)
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

  // Filter data based on FiltersPanel filters (state & quality)
  const filteredData = filterWaterQualityData(beachData, filters);

  // Apply GridFilterBar filters (search, letter, sort) on top of FiltersPanel filters
  const gridFilteredData = useMemo(() => {
    let result = [...filteredData];

    // Apply search filter
    if (gridFilters.search) {
      const searchTerm = gridFilters.search.toLowerCase();
      result = result.filter(d => 
        d.location.name.toLowerCase().includes(searchTerm)
      );
    }

    // Apply letter filter
    if (gridFilters.letter) {
      result = result.filter(d => 
        d.location.name.toUpperCase().startsWith(gridFilters.letter!)
      );
    }

    // Apply sort
    result.sort((a, b) => {
      const nameA = a.location.name.toLowerCase();
      const nameB = b.location.name.toLowerCase();
      return gridFilters.sort === 'asc' 
        ? nameA.localeCompare(nameB)
        : nameB.localeCompare(nameA);
    });

    return result;
  }, [filteredData, gridFilters]);

  // Reset pagination when filters change
  useEffect(() => {
    setDisplayedItems(20);
  }, [filterKey, gridFilterKey]);

  // For grid view, use combined filtered data with infinite scroll
  // For map view, use FiltersPanel filtered data only
  const visibleData = viewMode === 'grid' 
    ? gridFilteredData.slice(0, displayedItems)
    : filteredData;
  
  const hasMore = viewMode === 'grid' 
    ? gridFilteredData.length > displayedItems
    : filteredData.length > displayedItems;

  // Reset displayed items when filters change
  useEffect(() => {
    if (displayedItems > 20) {
      setDisplayedItems(20);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (viewMode !== 'grid' || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore && !loading) {
          setIsLoadingMore(true);
          
          // Simulate loading delay for smooth UX
          setTimeout(() => {
            setDisplayedItems((prev) => Math.min(prev + 20, gridFilteredData.length));
            setIsLoadingMore(false);
          }, 500);
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [viewMode, hasMore, isLoadingMore, loading, gridFilteredData.length]);

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
              Locations ({viewMode === 'grid' ? gridFilteredData.length : filteredData.length})
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
            {/* Filters Sidebar - Show for both views */}
            <div className="lg:col-span-1">
              <FiltersPanel filters={filters} onFiltersChange={setFilters} />
            </div>

            {/* Content Area */}
            <div className="lg:col-span-3">
              {viewMode === 'grid' ? (
                <>
                  {/* Grid Filter Bar - Additional filters for Grid View */}
                  <div className="mb-6">
                    <GridFilterBar
                      filters={gridFilters}
                      onFiltersChange={setGridFilters}
                      resultCount={gridFilteredData.length}
                      totalCount={filteredData.length}
                      loading={loading}
                    />
                  </div>

                  {/* Grid Content */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {visibleData.length > 0 ? (
                      visibleData.map((data) => (
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
                          No locations match your search
                        </p>
                        <p className="text-sm text-gray-400">
                          Try a different search term or clear filters
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Loading More Indicator */}
                  {isLoadingMore && !loading && (
                    <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="animate-pulse">
                          <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2 mb-3"></div>
                            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
                            <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Intersection Observer Trigger */}
                  {hasMore && !loading && <div ref={loadMoreRef} className="h-10" />}

                  {/* Progress Counter */}
                  {gridFilteredData.length > 0 && !loading && (
                    <div className="mt-8 text-center">
                      <p className="text-sm text-gray-600 mb-3">
                        Showing <span className="font-semibold text-gray-900">{Math.min(displayedItems, gridFilteredData.length)}</span> of{' '}
                        <span className="font-semibold text-gray-900">{gridFilteredData.length}</span> locations
                      </p>
                      {/* Progress Bar */}
                      <div className="max-w-md mx-auto">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-slate-600 h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${(Math.min(displayedItems, gridFilteredData.length) / gridFilteredData.length) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                      {/* Load All Button (Optional) */}
                      {hasMore && !isLoadingMore && (
                        <button
                          onClick={() => setDisplayedItems(gridFilteredData.length)}
                          className="mt-4 px-6 py-2 text-sm font-medium text-slate-600 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          Load All Remaining ({gridFilteredData.length - displayedItems})
                        </button>
                      )}
                    </div>
                  )}
                </>
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
