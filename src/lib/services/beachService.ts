/**
 * Beach Data Service
 * Client-side service for fetching beach data with server-side filtering
 */

import { NormalizedWaterQualityData, BeachLocation, EnterococciRecord } from '@/lib/types';
import type { BeachwatchFeature } from '@/lib/api/beachwatch.schema';

export interface BeachFilterParams {
  search?: string;
  letter?: string;
  region?: string;
  sort?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface BeachDataResponse {
  data: NormalizedWaterQualityData[];
  metadata: {
    total: number;
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
  if (rating === 4) return 'good';
  if (rating === 3) return 'fair';
  if (rating === 2) return 'poor';
  return 'bad';
}

/**
 * Normalize a single beach feature to our internal format
 */
function normalizeBeachFeature(feature: BeachwatchFeature): NormalizedWaterQualityData {
  const { geometry, properties } = feature;
  const [longitude, latitude] = geometry.coordinates;

  const location: BeachLocation = {
    id: properties.id,
    name: properties.siteName,
    state: 'NSW',
    latitude,
    longitude,
    region: 'New South Wales',
  };

  const latestReading: EnterococciRecord = {
    id: `${properties.id}-${properties.latestResultObservationDate}`,
    locationId: properties.id,
    sampleDate: properties.latestResultObservationDate,
    enterococciValue: 0,
    unit: 'cfu/100ml',
    qualityRating: mapRatingToQuality(properties.latestResultRating),
    source: 'nsw_beachwatch',
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
 * Fetch beach data with server-side filtering
 */
export async function fetchBeachesWithFilters(
  params: BeachFilterParams = {}
): Promise<BeachDataResponse> {
  const searchParams = new URLSearchParams();

  if (params.search) searchParams.set('search', params.search);
  if (params.letter) searchParams.set('letter', params.letter);
  if (params.region) searchParams.set('region', params.region);
  if (params.sort) searchParams.set('sort', params.sort);
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.limit) searchParams.set('limit', params.limit.toString());

  const response = await fetch(`/api/beaches?${searchParams.toString()}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch beaches: ${response.status}`);
  }

  const result = await response.json();

  // Normalize features to our internal format
  const data: NormalizedWaterQualityData[] = result.features.map(normalizeBeachFeature);

  return {
    data,
    metadata: result.metadata,
  };
}

/**
 * Get available alphabet letters that have beaches
 */
export async function fetchAvailableLetters(): Promise<string[]> {
  try {
    const response = await fetch('/api/beaches', {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch available letters');
    }

    const data = await response.json();
    return data.letters || [];
  } catch (error) {
    console.error('Error fetching available letters:', error);
    return [];
  }
}
