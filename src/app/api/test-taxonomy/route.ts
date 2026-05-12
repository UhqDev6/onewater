/**
 * Test Taxonomy Data Endpoint
 * Simple endpoint to test if taxonomy data can be fetched from Supabase
 */

import { NextResponse } from 'next/server';
import { fetchTaxonomyData } from '@/services/taxonomyService';

export async function GET() {
  try {
    // Test fetch for Frankston_Beach
    const data = await fetchTaxonomyData('Frankston_Beach');

    return NextResponse.json({
      status: 'success',
      message: 'Taxonomy data fetched successfully',
      environment: 'Frankston_Beach',
      count: data.length,
      sampleData: data.slice(0, 5), // First 5 records
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json({
      status: 'error',
      message: 'Failed to fetch taxonomy data',
      error: errorMessage,
    }, { status: 500 });
  }
}
