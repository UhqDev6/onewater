/**
 * Water Quality History Service
 * Fetches historical water quality data from beachwatch_snapshots table
 */

import { supabase } from '@/lib/supabase';

export interface WaterQualitySnapshot {
  id: number;
  site_id: string;
  site_name: string;
  longitude: number;
  latitude: number;
  latest_result: string | null;
  latest_result_rating: number | null;
  pollution_forecast: string | null;
  pollution_forecast_timestamp: string | null;
  latest_result_observation_date: string | null;
  snapshot_date: string; // YYYY-MM-DD - the date we pulled this snapshot
  created_at: string;
  updated_at: string;
}

export interface WaterQualityHistoryDataPoint {
  date: string; // The date we pulled the snapshot (created_at)
  quality: 'good' | 'fair' | 'poor' | 'bad' | 'unknown';
  qualityValue: number; // For chart Y-axis: 4=good, 3=fair, 2=poor, 1=bad (higher is better)
  result: string;
  rating: number | null;
  observationDate: string | null; // The actual lab test date
}

/**
 * Map NSW Beachwatch rating to quality level
 * Based on NSW Beachwatch rating system (CORRECT MAPPING):
 * 4 = Good (Blue) - Best
 * 3 = Fair (Yellow)
 * 2 = Poor (Orange)
 * 1 = Bad (Red) - Worst
 */
function mapRatingToQuality(rating: number | null): 'good' | 'fair' | 'poor' | 'bad' | 'unknown' {
  if (rating === null || rating === undefined) return 'unknown';
  
  if (rating === 4) return 'good';
  if (rating === 3) return 'fair';
  if (rating === 2) return 'poor';
  if (rating === 1) return 'bad';
  
  return 'unknown';
}

/**
 * Fetch historical water quality data for a specific site
 */
export async function fetchWaterQualityHistory(
  siteId: string,
  limit: number = 90 // Default 90 days
): Promise<{
  data: WaterQualityHistoryDataPoint[];
  siteName: string | null;
  error: string | null;
}> {
  try {
    if (!supabase) {
      return {
        data: [],
        siteName: null,
        error: 'Supabase client not configured',
      };
    }

    // Fetch snapshots for the specific site, ordered by snapshot date
    const { data: snapshots, error } = await supabase
      .from('beachwatch_snapshots')
      .select('*')
      .eq('site_id', siteId)
      .order('snapshot_date', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Error fetching water quality history:', error);
      return {
        data: [],
        siteName: null,
        error: error.message,
      };
    }

    if (!snapshots || snapshots.length === 0) {
      return {
        data: [],
        siteName: null,
        error: 'No historical data available for this location',
      };
    }

    // Transform snapshots to data points
    const dataPoints: WaterQualityHistoryDataPoint[] = snapshots.map((snapshot) => {
      const quality = mapRatingToQuality(snapshot.latest_result_rating);
      
      return {
        date: snapshot.snapshot_date, // Use snapshot_date (already YYYY-MM-DD format)
        quality,
        qualityValue: snapshot.latest_result_rating || 0,
        result: snapshot.latest_result || 'Unknown',
        rating: snapshot.latest_result_rating,
        observationDate: snapshot.latest_result_observation_date,
      };
    });

    // Remove duplicates by date (should not happen with unique constraint, but just in case)
    const uniqueDataPoints = dataPoints.reduce((acc, current) => {
      const existing = acc.find(item => item.date === current.date);
      if (!existing) {
        acc.push(current);
      }
      return acc;
    }, [] as WaterQualityHistoryDataPoint[]);

    return {
      data: uniqueDataPoints,
      siteName: snapshots[0].site_name,
      error: null,
    };
  } catch (err) {
    console.error('Unexpected error in fetchWaterQualityHistory:', err);
    return {
      data: [],
      siteName: null,
      error: err instanceof Error ? err.message : 'Unknown error occurred',
    };
  }
}

/**
 * Get list of all sites with historical data
 */
export async function fetchAvailableSites(): Promise<{
  data: Array<{ site_id: string; site_name: string; data_points: number }>;
  error: string | null;
}> {
  try {
    if (!supabase) {
      return {
        data: [],
        error: 'Supabase client not configured',
      };
    }

    // Get unique sites with count of data points
    const { data: snapshots, error } = await supabase
      .from('beachwatch_snapshots')
      .select('site_id, site_name');

    if (error) {
      return {
        data: [],
        error: error.message,
      };
    }

    // Group by site and count
    const siteMap = new Map<string, { site_name: string; count: number }>();
    
    snapshots?.forEach((snapshot) => {
      const existing = siteMap.get(snapshot.site_id);
      if (existing) {
        existing.count++;
      } else {
        siteMap.set(snapshot.site_id, {
          site_name: snapshot.site_name,
          count: 1,
        });
      }
    });

    const sites = Array.from(siteMap.entries()).map(([site_id, info]) => ({
      site_id,
      site_name: info.site_name,
      data_points: info.count,
    }));

    // Sort by name
    sites.sort((a, b) => a.site_name.localeCompare(b.site_name));

    return {
      data: sites,
      error: null,
    };
  } catch (err) {
    console.error('Unexpected error in fetchAvailableSites:', err);
    return {
      data: [],
      error: err instanceof Error ? err.message : 'Unknown error occurred',
    };
  }
}
