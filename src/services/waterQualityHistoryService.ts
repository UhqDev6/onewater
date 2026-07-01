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
      .order('created_at', { ascending: true }) // Use created_at for ordering (works for old and new data)
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
      // Use snapshot_date if available, otherwise fallback to created_at date
      const date = snapshot.snapshot_date || snapshot.created_at.split('T')[0];
      
      return {
        date,
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
  data: Array<{ 
    site_id: string; 
    site_name: string; 
    data_points: number;
    latest_snapshot_date: string; // Latest snapshot date for sorting
  }>;
  error: string | null;
}> {
  try {
    if (!supabase) {
      return {
        data: [],
        error: 'Supabase client not configured',
      };
    }

    // Get all snapshots ordered by snapshot_date descending (newest first)
    // This ensures we process the latest snapshots first
    const { data: snapshots, error } = await supabase
      .from('beachwatch_snapshots')
      .select('site_id, site_name, snapshot_date, created_at')
      .order('snapshot_date', { ascending: false }); // ← ORDER BY snapshot_date DESC

    if (error) {
      return {
        data: [],
        error: error.message,
      };
    }

    // Group by site and count UNIQUE dates + track latest snapshot
    const siteMap = new Map<string, { 
      site_name: string; 
      dates: Set<string>;
      latest_snapshot: string;
    }>();
    
    snapshots?.forEach((snapshot) => {
      // Use snapshot_date if available, otherwise fallback to created_at date
      const date = snapshot.snapshot_date || snapshot.created_at.split('T')[0];
      
      const existing = siteMap.get(snapshot.site_id);
      if (existing) {
        // Add date to set (automatically handles duplicates)
        existing.dates.add(date);
        
        // Update latest snapshot if this one is newer
        // Since data is ordered DESC, first occurrence is already the latest
        // But we keep this check for safety
        if (date > existing.latest_snapshot) {
          existing.latest_snapshot = date;
        }
      } else {
        // First time seeing this site_id
        // Since data is ordered DESC, this date is the latest for this site
        siteMap.set(snapshot.site_id, {
          site_name: snapshot.site_name,
          dates: new Set([date]),
          latest_snapshot: date, // ✅ This is guaranteed to be the latest
        });
      }
    });

    const sites = Array.from(siteMap.entries()).map(([site_id, info]) => ({
      site_id,
      site_name: info.site_name,
      data_points: info.dates.size, // Count unique dates
      latest_snapshot_date: info.latest_snapshot,
    }));

    // Sort by latest snapshot date (newest first)
    sites.sort((a, b) => {
      const dateCompare = b.latest_snapshot_date.localeCompare(a.latest_snapshot_date);
      // If same date, sort alphabetically by name
      return dateCompare !== 0 ? dateCompare : a.site_name.localeCompare(b.site_name);
    });

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
