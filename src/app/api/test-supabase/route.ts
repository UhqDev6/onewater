/**
 * Test Supabase Connection
 * Simple endpoint to test if Supabase is working
 */

import { NextResponse } from 'next/server';
import { isSupabaseAvailable } from '@/lib/supabase';
import { fetchInternalLocations } from '@/services/internalLocationService';

export async function GET() {
  try {
    // Check if Supabase is configured
    if (!isSupabaseAvailable()) {
      return NextResponse.json({
        status: 'warning',
        message: 'Supabase not configured - using API data only',
        supabaseConfigured: false,
        internalLocations: [],
      });
    }

    // Try to fetch internal locations
    const internalLocations = await fetchInternalLocations();

    return NextResponse.json({
      status: 'success',
      message: 'Supabase connection working',
      supabaseConfigured: true,
      internalLocations,
      count: internalLocations.length,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json({
      status: 'error',
      message: 'Supabase connection failed',
      error: errorMessage,
      supabaseConfigured: isSupabaseAvailable(),
    }, { status: 500 });
  }
}