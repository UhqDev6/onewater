/**
 * Hybrid Beach Service
 * Combines NSW Beachwatch API data with internal Supabase data
 * Provides unified interface for all beach locations
 */

import type { BeachwatchFeature, BeachwatchGeoJSON } from '@/lib/api/beachwatch.schema';
import { fetchInternalLocationsAsFeatures } from './internalLocationService';

export interface HybridBeachDataResponse {
  type: 'FeatureCollection';
  features: BeachwatchFeature[];
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
 * Fetch combined data from API and internal database
 */
export async function fetchHybridBeachData(params: {
  search?: string;
  letter?: string;
  region?: string;
  sort?: 'asc' | 'desc';
  page?: number;
  limit?: number;
} = {}): Promise<HybridBeachDataResponse> {
  try {
    // 1. Fetch API data using server-side fetch with full URL
    let apiFeatures: BeachwatchFeature[] = [];
    
    try {
      // Use the NSW Beachwatch API directly
      const nswApiUrl = process.env.NSW_BEACHWATCH_API_URL || 'https://api.beachwatch.nsw.gov.au/public/sites/geojson';
      const apiResponse = await fetch(nswApiUrl, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'OneWater Platform',
        },
      });

      if (apiResponse.ok) {
        const apiData: BeachwatchGeoJSON = await apiResponse.json();
        // Add default null values for new fields to NSW API data
        apiFeatures = (apiData.features || []).map(feature => ({
          ...feature,
          properties: {
            ...feature.properties,
            // NSW API doesn't provide these fields, so set to null
            expectedPopulation: null,
            beachCameraUrl: null,
          }
        }));
      }
    } catch (apiError) {
      console.warn('Failed to fetch API data:', apiError);
      // Continue with empty API data
    }

    // 2. Fetch internal data
    const internalFeatures = await fetchInternalLocationsAsFeatures();

    // 3. Combine features
    let allFeatures = [...apiFeatures, ...internalFeatures];

    // 4. Apply filters to combined data
    allFeatures = applyFilters(allFeatures, params);

    // 5. Apply sorting
    allFeatures = applySorting(allFeatures, params.sort || 'asc');

    // 6. Apply pagination
    const page = params.page || 1;
    const limit = params.limit || 100;
    const total = allFeatures.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const paginatedFeatures = allFeatures.slice(start, start + limit);

    return {
      type: 'FeatureCollection',
      features: paginatedFeatures,
      metadata: {
        total,
        apiCount: apiFeatures.length,
        internalCount: internalFeatures.length,
        page,
        limit,
        totalPages,
        filters: {
          search: params.search || null,
          letter: params.letter || null,
          region: params.region || null,
          sort: params.sort || 'asc',
        },
      },
    };
  } catch (error) {
    console.error('Hybrid beach service error:', error);
    throw error;
  }
}

/**
 * Apply search, letter, and region filters to features
 */
function applyFilters(
  features: BeachwatchFeature[],
  params: { search?: string; letter?: string; region?: string }
): BeachwatchFeature[] {
  let filtered = [...features];

  // Search filter
  if (params.search && params.search.trim()) {
    const searchTerm = params.search.toLowerCase().trim();
    filtered = filtered.filter(feature =>
      feature.properties.siteName.toLowerCase().includes(searchTerm)
    );
  }

  // Letter filter
  if (params.letter && params.letter.trim()) {
    const letter = params.letter.toUpperCase().trim();
    if (letter.length === 1 && /[A-Z]/.test(letter)) {
      filtered = filtered.filter(feature =>
        feature.properties.siteName.toUpperCase().startsWith(letter)
      );
    }
  }

  // Region filter (basic implementation)
  if (params.region && params.region.trim()) {
    const region = params.region.toLowerCase().trim();
    // For now, simple region filtering
    // Can be enhanced based on actual region data
    if (region !== 'all') {
      filtered = filtered.filter(() => {
        // Internal locations might have region info
        // API locations are all NSW
        return true; // Keep all for now
      });
    }
  }

  return filtered;
}

/**
 * Apply sorting to features
 */
function applySorting(features: BeachwatchFeature[], sort: 'asc' | 'desc'): BeachwatchFeature[] {
  return [...features].sort((a, b) => {
    const nameA = a.properties.siteName.toLowerCase();
    const nameB = b.properties.siteName.toLowerCase();

    if (sort === 'asc') {
      return nameA.localeCompare(nameB);
    }
    return nameB.localeCompare(nameA);
  });
}

/**
 * Get available alphabet letters from hybrid data
 */
export async function fetchHybridAvailableLetters(): Promise<string[]> {
  try {
    // Get all features without pagination
    const data = await fetchHybridBeachData({ limit: 10000 });
    
    const availableLetters = new Set<string>();
    data.features.forEach(feature => {
      const firstLetter = feature.properties.siteName.charAt(0).toUpperCase();
      if (/[A-Z]/.test(firstLetter)) {
        availableLetters.add(firstLetter);
      }
    });

    return Array.from(availableLetters).sort();
  } catch (error) {
    console.error('Error fetching hybrid available letters:', error);
    return [];
  }
}