/**
 * Hybrid Beach Data Service
 * Client-side service for fetching combined API + internal beach data
 */

import { NormalizedWaterQualityData, BeachLocation, EnterococciRecord } from '@/lib/types';
import type { BeachwatchFeature } from '@/lib/api/beachwatch.schema';
import type { HybridBeachDataResponse } from '@/services/hybridBeachService';

export interface HybridBeachFilterParams {
  search?: string;
  letter?: string;
  region?: string;
  sort?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface HybridBeachDataClientResponse {
  data: NormalizedWaterQualityData[];
  metadata: {
    total: number;
    apiCount: number;
    internalCount: number;
    page: number;
    limit: number;
    totalPages: number;
    filters: {
      search: string | null;
      letter: string | null;
      region: string | null;
      sort: 'asc' | 'desc';
    };
  };
}

/**
 * Map NSW rating (1-5) to our quality categories
 */
function mapRatingToQuality(rating: number): 'good' | 'fair' | 'poor' | 'bad' {
  if (rating >= 4) return 'good';
  if (rating === 3) return 'fair';
  if (rating === 2) return 'poor';
  return 'bad';
}

/**
 * Determine state from feature properties or coordinates
 */
function determineState(feature: BeachwatchFeature): string {
  // Check if it's internal data (might have region info)
  const siteName = feature.properties.siteName.toLowerCase();
  
  // Simple heuristics for state detection
  if (siteName.includes('victoria') || siteName.includes('melbourne') || siteName.includes('frankston')) {
    return 'VIC';
  }
  
  // Default to NSW for API data
  return 'NSW';
}

/**
 * Normalize a single beach feature to our internal format
 */
function normalizeHybridBeachFeature(feature: BeachwatchFeature): NormalizedWaterQualityData {
  const { geometry, properties } = feature;
  const [longitude, latitude] = geometry.coordinates;

  const location: BeachLocation = {
    id: properties.id,
    name: properties.siteName,
    state: determineState(feature),
    latitude,
    longitude,
    region: determineState(feature) === 'VIC' ? 'Victoria' : 'New South Wales',
    // Updated field names and types with proper handling for API vs Internal data
    expectedPopulation: properties.expectedPopulation || null,
    beachCameraUrl: properties.beachCameraUrl || null,
  };

  const latestReading: EnterococciRecord = {
    id: `${properties.id}-${properties.latestResultObservationDate}`,
    locationId: properties.id,
    sampleDate: properties.latestResultObservationDate,
    enterococciValue: 0,
    unit: 'cfu/100ml',
    qualityRating: mapRatingToQuality(properties.latestResultRating),
    source: determineState(feature) === 'VIC' ? 'manual' : 'nsw_beachwatch',
    // Preserve pollution forecast data from API/internal
    pollutionForecast: properties.pollutionForecast,
    pollutionForecastTimeStamp: properties.pollutionForecastTimeStamp,
    latestResultObservationDate: properties.latestResultObservationDate,
  };

  return {
    location,
    latestReading,
    historicalReadings: [latestReading],
    statistics: {
      average: 0,
      median: 0,
      min: 0,
      max: 0,
      sampleCount: 1,
    },
  };
}

/**
 * Fetch hybrid beach data with server-side filtering
 */
export async function fetchHybridBeachesWithFilters(
  params: HybridBeachFilterParams = {}
): Promise<HybridBeachDataClientResponse> {
  const searchParams = new URLSearchParams();

  if (params.search) searchParams.set('search', params.search);
  if (params.letter) searchParams.set('letter', params.letter);
  if (params.region) searchParams.set('region', params.region);
  if (params.sort) searchParams.set('sort', params.sort);
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.limit) searchParams.set('limit', params.limit.toString());

  const response = await fetch(`/api/hybrid-beaches?${searchParams.toString()}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch hybrid beaches: ${response.status}`);
  }

  const result: HybridBeachDataResponse = await response.json();

  // Normalize features to our internal format
  const data: NormalizedWaterQualityData[] = result.features.map(normalizeHybridBeachFeature);

  return {
    data,
    metadata: {
      total: result.metadata.total,
      apiCount: result.metadata.apiCount,
      internalCount: result.metadata.internalCount,
      page: result.metadata.page,
      limit: result.metadata.limit,
      totalPages: result.metadata.totalPages,
      filters: result.metadata.filters,
    },
  };
}

/**
 * Get available alphabet letters from hybrid data
 */
export async function fetchHybridAvailableLetters(): Promise<string[]> {
  try {
    const response = await fetch('/api/hybrid-beaches', {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch available letters');
    }

    const data = await response.json();
    return data.letters || [];
  } catch (error) {
    console.error('Error fetching hybrid available letters:', error);
    return [];
  }
}

/**
 * Fallback to original beach service if hybrid fails
 */
export async function fetchBeachesWithFallback(
  params: HybridBeachFilterParams = {}
): Promise<HybridBeachDataClientResponse> {
  try {
    // Try hybrid first
    return await fetchHybridBeachesWithFilters(params);
  } catch (error) {
    console.warn('Hybrid service failed, falling back to API only:', error);
    
    // Fallback to original service
    const { fetchBeachesWithFilters } = await import('./beachService');
    const result = await fetchBeachesWithFilters(params);
    
    // Convert to hybrid format
    return {
      data: result.data,
      metadata: {
        ...result.metadata,
        apiCount: result.data.length,
        internalCount: 0,
      },
    };
  }
}