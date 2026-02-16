/**
 * API Route: Beach Water Quality Data
 * GET /api/beach-data
 * 
 * Returns normalized water quality data from multiple sources
 * Query params:
 * - state: Filter by state (NSW, VIC)
 * - quality: Filter by quality rating
 * - limit: Number of results to return
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchNSWComprehensiveData } from '@/services/nswBeachwatchService';
import { filterWaterQualityData, mergeMultiSourceData } from '@/lib/utils/dataHelpers';
import { WaterQualityFilters } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Parse query parameters
    const stateParam = searchParams.get('state');
    const qualityParam = searchParams.get('quality');
    const limitParam = searchParams.get('limit');

    // Build filters
    const filters: WaterQualityFilters = {};
    
    if (stateParam) {
      filters.states = stateParam.split(',');
    }
    
    if (qualityParam) {
      filters.qualityRatings = qualityParam.split(',') as Array<'excellent' | 'good' | 'fair' | 'poor'>;
    }

    // Fetch data from all sources
    const nswData = await fetchNSWComprehensiveData();
    
    // TODO: Add Victoria EPA when ready
    // const vicData = await fetchVictoriaComprehensiveData();
    
    // Merge all data sources
    const allData = mergeMultiSourceData([nswData /*, vicData */]);

    // Apply filters
    const filteredData = filterWaterQualityData(allData, filters);

    // Apply limit
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;
    const limitedData = limit ? filteredData.slice(0, limit) : filteredData;

    // Prepare response
    const response = {
      success: true,
      data: limitedData,
      metadata: {
        total: limitedData.length,
        filtered: filteredData.length,
        unfiltered: allData.length,
        timestamp: new Date().toISOString(),
        sources: ['nsw_beachwatch'], // Add 'vic_epa' when implemented
      },
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
      },
    });
  } catch (error) {
    console.error('API Error in /api/beach-data:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch beach data',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Optional: Add POST method for more complex queries
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const filters: WaterQualityFilters = body.filters || {};

    // Fetch data
    const nswData = await fetchNSWComprehensiveData();
    const allData = mergeMultiSourceData([nswData]);

    // Apply filters
    const filteredData = filterWaterQualityData(allData, filters);

    const response = {
      success: true,
      data: filteredData,
      metadata: {
        total: filteredData.length,
        timestamp: new Date().toISOString(),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('API Error in POST /api/beach-data:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process request',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
