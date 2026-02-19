/**
 * API Route: Beach Sites with Server-Side Filtering
 * Provides search, alphabet filter, sort, and region filter capabilities
 * All filtering is done server-side for scalability
 */

import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';
import { fetchWithRetry } from '@/lib/utils/fetchWithRetry';
import { safeValidateBeachwatchResponse } from '@/lib/api/beachwatch.schema';
import type { BeachwatchGeoJSON, BeachwatchFeature } from '@/lib/api/beachwatch.schema';

// Cache the raw data to avoid repeated API calls
let cachedData: BeachwatchGeoJSON | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

/**
 * Fetch and cache the raw beachwatch data
 */
async function fetchBeachwatchData(): Promise<BeachwatchGeoJSON> {
  const now = Date.now();
  
  // Return cached data if still valid
  if (cachedData && (now - cacheTimestamp) < CACHE_TTL) {
    return cachedData;
  }

  const response = await fetchWithRetry(
    config.api.nswBeachwatch,
    {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'OneWater Platform',
      },
      retries: config.request.retryCount,
      timeout: config.request.timeout,
    }
  );

  const rawData = await response.json();
  const validationResult = safeValidateBeachwatchResponse(rawData);

  if (!validationResult.success) {
    throw new Error('Invalid data format from NSW Beachwatch API');
  }

  cachedData = validationResult.data;
  cacheTimestamp = now;
  
  return cachedData;
}

/**
 * Filter features by search query (site name)
 */
function filterBySearch(features: BeachwatchFeature[], query: string): BeachwatchFeature[] {
  if (!query || query.trim() === '') return features;
  
  const searchTerm = query.toLowerCase().trim();
  return features.filter(feature => 
    feature.properties.siteName.toLowerCase().includes(searchTerm)
  );
}

/**
 * Filter features by alphabet letter
 */
function filterByAlphabet(features: BeachwatchFeature[], letter: string): BeachwatchFeature[] {
  if (!letter || letter.trim() === '') return features;
  
  const letterUpper = letter.toUpperCase().trim();
  if (letterUpper.length !== 1 || !/[A-Z]/.test(letterUpper)) return features;
  
  return features.filter(feature => 
    feature.properties.siteName.toUpperCase().startsWith(letterUpper)
  );
}

/**
 * Filter features by region (future implementation)
 */
function filterByRegion(features: BeachwatchFeature[], region: string): BeachwatchFeature[] {
  if (!region || region.trim() === '') return features;
  
  // Currently all data is from NSW
  // This is a placeholder for future multi-region support
  const regionLower = region.toLowerCase().trim();
  
  // For now, return all if region is 'nsw' or 'all'
  if (regionLower === 'nsw' || regionLower === 'all') {
    return features;
  }
  
  // Future: implement actual region filtering when data supports it
  return features;
}

/**
 * Sort features by name
 */
function sortByName(features: BeachwatchFeature[], order: 'asc' | 'desc' = 'asc'): BeachwatchFeature[] {
  return [...features].sort((a, b) => {
    const nameA = a.properties.siteName.toLowerCase();
    const nameB = b.properties.siteName.toLowerCase();
    
    if (order === 'asc') {
      return nameA.localeCompare(nameB);
    }
    return nameB.localeCompare(nameA);
  });
}

/**
 * Paginate results
 */
function paginate(features: BeachwatchFeature[], page: number, limit: number): BeachwatchFeature[] {
  const start = (page - 1) * limit;
  const end = start + limit;
  return features.slice(start, end);
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const { searchParams } = new URL(request.url);

  // Extract query parameters
  const search = searchParams.get('search') || '';
  const letter = searchParams.get('letter') || '';
  const region = searchParams.get('region') || '';
  const sort = (searchParams.get('sort') || 'asc') as 'asc' | 'desc';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '100', 10);

  try {
    // Fetch data from cache or API
    const data = await fetchBeachwatchData();
    let filteredFeatures = [...data.features];

    // Apply filters in order
    filteredFeatures = filterBySearch(filteredFeatures, search);
    filteredFeatures = filterByAlphabet(filteredFeatures, letter);
    filteredFeatures = filterByRegion(filteredFeatures, region);
    
    // Sort results
    filteredFeatures = sortByName(filteredFeatures, sort);

    // Get total before pagination
    const total = filteredFeatures.length;

    // Apply pagination
    const paginatedFeatures = paginate(filteredFeatures, page, limit);

    const duration = Date.now() - startTime;

    // Return filtered GeoJSON with metadata
    return NextResponse.json({
      type: 'FeatureCollection',
      features: paginatedFeatures,
      metadata: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        filters: {
          search: search || null,
          letter: letter || null,
          region: region || null,
          sort,
        },
      },
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        'X-Response-Time': `${duration}ms`,
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    console.error(`[API] Beaches fetch failed after ${duration}ms:`, errorMessage);

    return NextResponse.json(
      { 
        error: 'Failed to fetch beach data',
        details: config.isDevelopment ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * Get available alphabet letters that have results
 */
export async function POST() {
  try {
    const data = await fetchBeachwatchData();
    
    // Get unique first letters from all site names
    const availableLetters = new Set<string>();
    data.features.forEach(feature => {
      const firstLetter = feature.properties.siteName.charAt(0).toUpperCase();
      if (/[A-Z]/.test(firstLetter)) {
        availableLetters.add(firstLetter);
      }
    });

    return NextResponse.json({
      letters: Array.from(availableLetters).sort(),
      total: data.features.length,
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch available letters' },
      { status: 500 }
    );
  }
}
