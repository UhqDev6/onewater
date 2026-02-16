/**
 * API Route: Proxy for NSW Beachwatch API
 * Handles CORS, caching, retry logic, and validation
 */

import { NextResponse } from 'next/server';
import { config } from '@/lib/config';
import { fetchWithRetry } from '@/lib/utils/fetchWithRetry';
import { safeValidateBeachwatchResponse } from '@/lib/api/beachwatch.schema';

export async function GET() {
  const startTime = Date.now();

  try {
    // Fetch with retry and timeout
    const response = await fetchWithRetry(
      config.api.nswBeachwatch,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'OneWater Platform',
        },
        retries: config.request.retryCount,
        timeout: config.request.timeout,
        next: { revalidate: config.cache.duration },
      }
    );

    const rawData = await response.json();

    // Validate response with Zod
    const validationResult = safeValidateBeachwatchResponse(rawData);

    if (!validationResult.success) {
      console.error('API validation error:', validationResult.error);
      return NextResponse.json(
        { 
          error: 'Invalid data format from NSW Beachwatch API',
          details: config.isDevelopment ? validationResult.error : undefined
        },
        { status: 502 } // Bad Gateway
      );
    }

    const duration = Date.now() - startTime;
    console.log(`[API] NSW Beachwatch fetch successful in ${duration}ms`);

    return NextResponse.json(validationResult.data, {
      headers: {
        'Cache-Control': `public, s-maxage=${config.cache.duration}, stale-while-revalidate=${config.cache.staleWhileRevalidate}`,
        'X-Response-Time': `${duration}ms`,
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    console.error(`[API] NSW Beachwatch fetch failed after ${duration}ms:`, errorMessage);

    return NextResponse.json(
      { 
        error: 'Failed to fetch data from NSW Beachwatch',
        details: config.isDevelopment ? errorMessage : undefined
      },
      { status: 503 } // Service Unavailable
    );
  }
}
