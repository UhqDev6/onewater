/**
 * Hybrid Beachwatch API Integration
 * Fetches water quality data from both NSW API and internal Supabase data
 */

import { NormalizedWaterQualityData } from '@/lib/types';
import { fetchHybridBeachesWithFilters } from '@/lib/services/hybridBeachService';

/**
 * Fetch hybrid beach data (API + Internal) via service layer
 */
export async function fetchHybridBeachwatchData(): Promise<NormalizedWaterQualityData[]> {
  try {
    const result = await fetchHybridBeachesWithFilters({
      limit: 9999, // Get all data
    });

    return result.data;
  } catch (error) {
    console.error('Error fetching hybrid beachwatch data:', error);
    throw error;
  }
}

/**
 * Fetch hybrid beach data with error handling and fallback
 */
export async function fetchHybridBeachwatchDataSafe(): Promise<{
  data: NormalizedWaterQualityData[];
  error?: string;
  metadata?: {
    total: number;
    apiCount: number;
    internalCount: number;
  };
}> {
  try {
    const result = await fetchHybridBeachesWithFilters({
      limit: 9999, // Get all data
    });

    return { 
      data: result.data,
      metadata: {
        total: result.metadata.total,
        apiCount: result.metadata.apiCount,
        internalCount: result.metadata.internalCount,
      }
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to fetch hybrid beachwatch data, falling back to original API:', errorMessage);
    
    // Fallback to original API
    try {
      const { fetchNSWBeachwatchDataSafe } = await import('./beachwatch');
      const fallbackResult = await fetchNSWBeachwatchDataSafe();
      
      return {
        data: fallbackResult.data,
        error: fallbackResult.error,
        metadata: {
          total: fallbackResult.data.length,
          apiCount: fallbackResult.data.length,
          internalCount: 0,
        }
      };
    } catch (fallbackError) {
      const fallbackErrorMessage = fallbackError instanceof Error ? fallbackError.message : 'Unknown fallback error';
      return { 
        data: [], 
        error: `Hybrid and fallback failed: ${errorMessage}, ${fallbackErrorMessage}`,
        metadata: {
          total: 0,
          apiCount: 0,
          internalCount: 0,
        }
      };
    }
  }
}