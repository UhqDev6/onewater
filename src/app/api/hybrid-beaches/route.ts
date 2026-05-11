/**
 * API Route: Hybrid Beach Data (API + Internal)
 * Combines NSW Beachwatch API data with internal Supabase locations
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchHybridBeachData, fetchHybridAvailableLetters } from '@/services/hybridBeachService';

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
    const data = await fetchHybridBeachData({
      search,
      letter,
      region,
      sort,
      page,
      limit,
    });

    const duration = Date.now() - startTime;

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        'X-Response-Time': `${duration}ms`,
        'X-Data-Source': 'hybrid-api-internal',
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    console.error(`[API] Hybrid beaches fetch failed after ${duration}ms:`, errorMessage);

    return NextResponse.json(
      { 
        error: 'Failed to fetch hybrid beach data',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * Get available alphabet letters from hybrid data
 */
export async function POST() {
  try {
    const letters = await fetchHybridAvailableLetters();

    return NextResponse.json({
      letters,
      source: 'hybrid',
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch available letters',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}