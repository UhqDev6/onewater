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
 * 
 * @param siteId - The site ID to fetch data for
 * @param daysBack - Number of days to look back from today (e.g., 7 for last 7 days)
 */
export async function fetchWaterQualityHistory(
  siteId: string,
  daysBack: number = 90 // Default 90 days
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

    // Calculate date range: from X days ago to today (inclusive)
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - daysBack + 1); // +1 to include today in the count
    
    // Format dates as YYYY-MM-DD for Supabase query
    const startDateStr = startDate.toISOString().split('T')[0];
    const todayStr = today.toISOString().split('T')[0];

    // Fetch snapshots for the specific site within date range
    const { data: snapshots, error } = await supabase
      .from('beachwatch_snapshots')
      .select('*')
      .eq('site_id', siteId)
      .gte('snapshot_date', startDateStr) // >= start date
      .lte('snapshot_date', todayStr) // <= today
      .order('snapshot_date', { ascending: true }); // Order oldest to newest for chart (left to right)

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
    latest_updated_at: string; // Latest update timestamp for "X ago" display
    quality_changed: boolean; // Whether quality rating changed from previous snapshot
    quality_trend: 'improved' | 'declined' | 'stable'; // Trend direction
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
    const { data: snapshots, error } = await supabase
      .from('beachwatch_snapshots')
      .select('site_id, site_name, snapshot_date, created_at, updated_at, latest_result_rating')
      .order('snapshot_date', { ascending: false }); // ← ORDER BY snapshot_date DESC

    if (error) {
      return {
        data: [],
        error: error.message,
      };
    }

    // Group by site and track quality changes
    const siteMap = new Map<string, { 
      site_name: string; 
      dates: Set<string>;
      latest_snapshot: string;
      latest_updated: string;
      snapshots: Array<{ date: string; rating: number | null }>;
    }>();
    
    snapshots?.forEach((snapshot) => {
      const date = snapshot.snapshot_date || snapshot.created_at.split('T')[0];
      const updatedAt = snapshot.updated_at || snapshot.created_at;
      
      const existing = siteMap.get(snapshot.site_id);
      if (existing) {
        existing.dates.add(date);
        existing.snapshots.push({ date, rating: snapshot.latest_result_rating });
        
        if (date > existing.latest_snapshot) {
          existing.latest_snapshot = date;
        }
        
        if (updatedAt > existing.latest_updated) {
          existing.latest_updated = updatedAt;
        }
      } else {
        siteMap.set(snapshot.site_id, {
          site_name: snapshot.site_name,
          dates: new Set([date]),
          latest_snapshot: date,
          latest_updated: updatedAt,
          snapshots: [{ date, rating: snapshot.latest_result_rating }],
        });
      }
    });

    const sites = Array.from(siteMap.entries()).map(([site_id, info]) => {
      // Detect quality change by comparing latest 2 snapshots
      let quality_changed = false;
      let quality_trend: 'improved' | 'declined' | 'stable' = 'stable';
      
      if (info.snapshots.length >= 2) {
        // Sort by date descending to get latest 2
        const sorted = info.snapshots.sort((a, b) => b.date.localeCompare(a.date));
        const latest = sorted[0].rating;
        const previous = sorted[1].rating;
        
        if (latest !== null && previous !== null && latest !== previous) {
          quality_changed = true;
          quality_trend = latest > previous ? 'improved' : 'declined';
        }
      }
      
      return {
        site_id,
        site_name: info.site_name,
        data_points: info.dates.size,
        latest_snapshot_date: info.latest_snapshot,
        latest_updated_at: info.latest_updated,
        quality_changed,
        quality_trend,
      };
    });

    // Sort by latest updated timestamp (newest first)
    sites.sort((a, b) => {
      const dateCompare = b.latest_updated_at.localeCompare(a.latest_updated_at);
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
