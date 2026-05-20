/**
 * NSW Beachwatch API Proxy
 * Handles CORS and rate limiting for NSW Beachwatch API
 */

import { NextResponse } from 'next/server';

// Cache for API responses (simple in-memory cache)
let apiCache: {
  data: unknown;
  timestamp: number;
} | null = null;

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const NSW_API_URL = process.env.NSW_BEACHWATCH_API_URL || 'https://api.beachwatch.nsw.gov.au/public/sites/geojson';

export async function GET() {
  try {
    // Check cache first
    const now = Date.now();
    if (apiCache && (now - apiCache.timestamp) < CACHE_DURATION) {
      console.log('Returning cached NSW API data');
      return NextResponse.json(apiCache.data);
    }

    console.log('Fetching fresh NSW API data from:', NSW_API_URL);

    // Fetch from NSW API with proper headers
    const response = await fetch(NSW_API_URL, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'OneWater Platform/1.0',
        'Cache-Control': 'no-cache',
      },
      // Add timeout
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      console.error('NSW API response not OK:', response.status, response.statusText);
      
      // Return cached data if available, even if expired
      if (apiCache) {
        console.log('Returning expired cached data due to API error');
        return NextResponse.json(apiCache.data);
      }
      
      throw new Error(`NSW API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('NSW API data fetched successfully:', data.features?.length || 0, 'features');

    // Update cache
    apiCache = {
      data,
      timestamp: now,
    };

    return NextResponse.json(data);

  } catch (error) {
    console.error('NSW API proxy error:', error);

    // Return cached data if available
    if (apiCache) {
      console.log('Returning cached data due to fetch error');
      return NextResponse.json(apiCache.data);
    }

    // Return empty GeoJSON if no cache available
    return NextResponse.json({
      type: 'FeatureCollection',
      features: [],
    }, { status: 200 }); // Return 200 with empty data instead of error
  }
}