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
 * Get water quality distribution per date for all beaches
 * Returns percentage distribution by date across all locations
 * 
 * PERFORMANCE OPTIMIZATION:
 * - For timeframes >90 days: Uses database function for aggregation (much faster)
 * - For timeframes ≤90 days: Uses client-side pagination
 */
export async function fetchAllBeachQualityByDate(
  daysBack: number = 90
): Promise<{
  data: Array<{
    date: string;
    good: number;
    fair: number; 
    poor: number;
    bad: number;
    total: number;
    goodPercentage: number;
    fairPercentage: number;
    poorPercentage: number;
    badPercentage: number;
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

    // Calculate date range
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - daysBack + 1);
    
    const startDateStr = startDate.toISOString().split('T')[0];
    const todayStr = today.toISOString().split('T')[0];

    console.log('fetchAllBeachQualityByDate - Date range:', { startDateStr, todayStr, daysBack });

    // Use database function for large timeframes (>90 days)
    // This is much faster as aggregation happens in the database
    if (daysBack > 90) {
      console.log('fetchAllBeachQualityByDate - Using database function for aggregation (efficient for large datasets)');
      
      const { data: functionData, error: functionError } = await supabase
        .rpc('get_daily_quality_distribution', {
          start_date: startDateStr,
          end_date: todayStr,
        });

      if (functionError) {
        console.error('fetchAllBeachQualityByDate - Database function error:', functionError);
        return {
          data: [],
          error: functionError.message ?? 'Database function error',
        };
      }

      if (!functionData || functionData.length === 0) {
        return {
          data: [],
          error: 'No data available',
        };
      }

      // Define type for database function result
      type DbFunctionResult = {
        date: string;
        good_count: number;
        fair_count: number;
        poor_count: number;
        bad_count: number;
        total_count: number;
      };

      // Transform function result to expected format
      const result = (functionData as DbFunctionResult[]).map((row) => {
        const total = Number(row.total_count);
        const good = Number(row.good_count);
        const fair = Number(row.fair_count);
        const poor = Number(row.poor_count);
        const bad = Number(row.bad_count);

        return {
          date: row.date,
          good,
          fair,
          poor,
          bad,
          total,
          goodPercentage: total > 0 ? Math.round((good / total) * 100) : 0,
          fairPercentage: total > 0 ? Math.round((fair / total) * 100) : 0,
          poorPercentage: total > 0 ? Math.round((poor / total) * 100) : 0,
          badPercentage: total > 0 ? Math.round((bad / total) * 100) : 0,
        };
      });

      console.log('fetchAllBeachQualityByDate - Database function returned:', result.length, 'dates');
      return {
        data: result,
        error: null,
      };
    }

    // For smaller timeframes (≤90 days), use client-side pagination
    // This is fine for <25,000 records
    console.log('fetchAllBeachQualityByDate - Using client-side pagination (suitable for small datasets)');

    // Fetch ALL snapshots within date range (not just latest per site)
    // Database has ~4900 records (20 dates × 245 sites)
    // Supabase has 1000 record limit per query, so we need pagination
    
    type SnapshotRecord = {
      site_id: string;
      snapshot_date: string;
      latest_result_rating: number | null;
      created_at: string;
    };
    
    let allSnapshots: SnapshotRecord[] = [];
    let hasMore = true;
    let page = 0;
    const pageSize = 1000;
    
    while (hasMore && page < 25) { // Max 25 pages = 25,000 records (enough for 3M timeframe)
      const start = page * pageSize;
      const end = start + pageSize - 1;
      
      const { data: pageData, error: pageError, count } = await supabase
        .from('beachwatch_snapshots')
        .select('site_id, snapshot_date, latest_result_rating, created_at', { count: 'exact' })
        .gte('snapshot_date', startDateStr)
        .lte('snapshot_date', todayStr)
        .order('snapshot_date', { ascending: true })
        .range(start, end);
      
      if (pageError) {
        console.error('fetchAllBeachQualityByDate - Supabase error:', pageError);
        return {
          data: [],
          error: pageError.message,
        };
      }
      
      if (pageData && pageData.length > 0) {
        allSnapshots = allSnapshots.concat(pageData);
        
        // Check if there are more records
        if (count && allSnapshots.length < count) {
          hasMore = pageData.length === pageSize; // Continue if we got a full page
        } else {
          hasMore = false;
        }
      } else {
        hasMore = false;
      }
      
      page++;
    }
    
    const snapshots = allSnapshots;
    
    // Warning if data might be truncated
    if (page >= 25) {
      console.warn(
        `fetchAllBeachQualityByDate - Reached pagination limit (${page} pages, ${snapshots.length} records). ` +
        `Data may be incomplete. Consider using a shorter timeframe or implementing database-side aggregation.`
      );
    }

    if (!snapshots || snapshots.length === 0) {
      return {
        data: [],
        error: 'No data available',
      };
    }

    // Create complete date range (including dates with no data)
    const completeDateRange: string[] = [];
    const currentDate = new Date(startDate);
    while (currentDate <= today) {
      completeDateRange.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Group by date and calculate distribution
    // Use created_at date if snapshot_date is not available (same logic as line chart)
    const dateGroups: { [date: string]: { good: number, fair: number, poor: number, bad: number, total: number } } = {};
    
    // Initialize all dates with zero counts
    completeDateRange.forEach(date => {
      dateGroups[date] = { good: 0, fair: 0, poor: 0, bad: 0, total: 0 };
    });
    
    snapshots.forEach((snapshot) => {
      // Use snapshot_date if available, otherwise fallback to created_at date (same as line chart)
      const dateKey = snapshot.snapshot_date || snapshot.created_at.split('T')[0];
      const rating = snapshot.latest_result_rating;
      
      // Only process if date is in our range (should be, but extra safety)
      if (dateGroups[dateKey]) {
        // Map rating to quality category (same as mapRatingToQuality function)
        if (rating === 4) dateGroups[dateKey].good++;
        else if (rating === 3) dateGroups[dateKey].fair++;
        else if (rating === 2) dateGroups[dateKey].poor++;
        else if (rating === 1) dateGroups[dateKey].bad++;
        
        dateGroups[dateKey].total++;
      }
    });

    // Convert to final format with percentages (including zero days)
    const result = completeDateRange.map((date) => {
      const counts = dateGroups[date];
      return {
        date,
        good: counts.good,
        fair: counts.fair,
        poor: counts.poor,
        bad: counts.bad,
        total: counts.total,
        goodPercentage: counts.total > 0 ? Math.round((counts.good / counts.total) * 100) : 0,
        fairPercentage: counts.total > 0 ? Math.round((counts.fair / counts.total) * 100) : 0,
        poorPercentage: counts.total > 0 ? Math.round((counts.poor / counts.total) * 100) : 0,
        badPercentage: counts.total > 0 ? Math.round((counts.bad / counts.total) * 100) : 0,
      };
    });

    // Filter out days with no data for cleaner visualization
    const resultWithData = result.filter(item => item.total > 0);

    return {
      data: resultWithData,
      error: null,
    };
  } catch (err) {
    console.error('Unexpected error in fetchAllBeachQualityByDate:', err);
    return {
      data: [],
      error: err instanceof Error ? err.message : 'Unknown error occurred',
    };
  }
}

/**
 * Get overall water quality distribution for all beaches
 * Returns count of beaches per quality level for the specified timeframe
 */
export async function fetchQualityDistribution(
  daysBack: number = 30
): Promise<{
  data: {
    good: number;
    fair: number;
    poor: number;
    bad: number;
    total: number;
  };
  error: string | null;
}> {
  try {
    if (!supabase) {
      return {
        data: { good: 0, fair: 0, poor: 0, bad: 0, total: 0 },
        error: 'Supabase client not configured',
      };
    }

    // Calculate date range
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - daysBack + 1);
    
    const startDateStr = startDate.toISOString().split('T')[0];
    const todayStr = today.toISOString().split('T')[0];

    // Get latest snapshot per beach within timeframe
    const { data: snapshots, error } = await supabase
      .from('beachwatch_snapshots')
      .select('site_id, latest_result_rating, snapshot_date')
      .gte('snapshot_date', startDateStr)
      .lte('snapshot_date', todayStr)
      .order('snapshot_date', { ascending: false });

    if (error) {
      return {
        data: { good: 0, fair: 0, poor: 0, bad: 0, total: 0 },
        error: error.message,
      };
    }

    // Get latest snapshot per beach (most recent)
    const latestPerBeach = new Map<string, number | null>();
    snapshots?.forEach((snapshot) => {
      if (!latestPerBeach.has(snapshot.site_id)) {
        latestPerBeach.set(snapshot.site_id, snapshot.latest_result_rating);
      }
    });

    // Count by quality level
    let good = 0;
    let fair = 0;
    let poor = 0;
    let bad = 0;

    latestPerBeach.forEach((rating) => {
      if (rating === 4) good++;
      else if (rating === 3) fair++;
      else if (rating === 2) poor++;
      else if (rating === 1) bad++;
    });

    const total = good + fair + poor + bad;

    return {
      data: { good, fair, poor, bad, total },
      error: null,
    };
  } catch (err) {
    console.error('Unexpected error in fetchQualityDistribution:', err);
    return {
      data: { good: 0, fair: 0, poor: 0, bad: 0, total: 0 },
      error: err instanceof Error ? err.message : 'Unknown error occurred',
    };
  }
}

/**
 * Get quality distribution comparison with previous period
 * Returns current and previous period data for trend analysis
 */
export async function fetchQualityDistributionWithTrend(
  daysBack: number = 30
): Promise<{
  current: {
    good: number;
    fair: number;
    poor: number;
    bad: number;
    total: number;
  };
  previous: {
    good: number;
    fair: number;
    poor: number;
    bad: number;
    total: number;
  };
  error: string | null;
}> {
  try {
    if (!supabase) {
      return {
        current: { good: 0, fair: 0, poor: 0, bad: 0, total: 0 },
        previous: { good: 0, fair: 0, poor: 0, bad: 0, total: 0 },
        error: 'Supabase client not configured',
      };
    }

    const today = new Date();
    
    // Current period: last X days
    const currentStartDate = new Date(today);
    currentStartDate.setDate(today.getDate() - daysBack + 1);
    const currentStartDateStr = currentStartDate.toISOString().split('T')[0];
    const todayStr = today.toISOString().split('T')[0];

    // Previous period: X days before current period
    const previousStartDate = new Date(currentStartDate);
    previousStartDate.setDate(currentStartDate.getDate() - daysBack);
    const previousEndDate = new Date(currentStartDate);
    previousEndDate.setDate(currentStartDate.getDate() - 1);
    const previousStartDateStr = previousStartDate.toISOString().split('T')[0];
    const previousEndDateStr = previousEndDate.toISOString().split('T')[0];

    // Fetch current period
    const { data: currentSnapshots, error: currentError } = await supabase
      .from('beachwatch_snapshots')
      .select('site_id, latest_result_rating, snapshot_date')
      .gte('snapshot_date', currentStartDateStr)
      .lte('snapshot_date', todayStr)
      .order('snapshot_date', { ascending: false });

    if (currentError) {
      return {
        current: { good: 0, fair: 0, poor: 0, bad: 0, total: 0 },
        previous: { good: 0, fair: 0, poor: 0, bad: 0, total: 0 },
        error: currentError.message,
      };
    }

    // Fetch previous period
    const { data: previousSnapshots, error: previousError } = await supabase
      .from('beachwatch_snapshots')
      .select('site_id, latest_result_rating, snapshot_date')
      .gte('snapshot_date', previousStartDateStr)
      .lte('snapshot_date', previousEndDateStr)
      .order('snapshot_date', { ascending: false });

    if (previousError) {
      return {
        current: { good: 0, fair: 0, poor: 0, bad: 0, total: 0 },
        previous: { good: 0, fair: 0, poor: 0, bad: 0, total: 0 },
        error: previousError.message,
      };
    }

    // Process current period
    const currentLatestPerBeach = new Map<string, number | null>();
    currentSnapshots?.forEach((snapshot) => {
      if (!currentLatestPerBeach.has(snapshot.site_id)) {
        currentLatestPerBeach.set(snapshot.site_id, snapshot.latest_result_rating);
      }
    });

    let currentGood = 0, currentFair = 0, currentPoor = 0, currentBad = 0;
    currentLatestPerBeach.forEach((rating) => {
      if (rating === 4) currentGood++;
      else if (rating === 3) currentFair++;
      else if (rating === 2) currentPoor++;
      else if (rating === 1) currentBad++;
    });

    // Process previous period
    const previousLatestPerBeach = new Map<string, number | null>();
    previousSnapshots?.forEach((snapshot) => {
      if (!previousLatestPerBeach.has(snapshot.site_id)) {
        previousLatestPerBeach.set(snapshot.site_id, snapshot.latest_result_rating);
      }
    });

    let previousGood = 0, previousFair = 0, previousPoor = 0, previousBad = 0;
    previousLatestPerBeach.forEach((rating) => {
      if (rating === 4) previousGood++;
      else if (rating === 3) previousFair++;
      else if (rating === 2) previousPoor++;
      else if (rating === 1) previousBad++;
    });

    return {
      current: {
        good: currentGood,
        fair: currentFair,
        poor: currentPoor,
        bad: currentBad,
        total: currentGood + currentFair + currentPoor + currentBad,
      },
      previous: {
        good: previousGood,
        fair: previousFair,
        poor: previousPoor,
        bad: previousBad,
        total: previousGood + previousFair + previousPoor + previousBad,
      },
      error: null,
    };
  } catch (err) {
    console.error('Unexpected error in fetchQualityDistributionWithTrend:', err);
    return {
      current: { good: 0, fair: 0, poor: 0, bad: 0, total: 0 },
      previous: { good: 0, fair: 0, poor: 0, bad: 0, total: 0 },
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

    // PRIORITY SORTING: Changed beaches (Declined/Improved) should appear at top
    // Priority 1: Declined (safety-critical - show first)
    // Priority 2: Improved (positive change - show second)
    // Priority 3: Stable (no change - show last)
    sites.sort((a, b) => {
      // Assign priority scores (lower = higher priority)
      const getPriority = (site: typeof a) => {
        if (site.quality_changed) {
          if (site.quality_trend === 'declined') return 1; // HIGHEST priority (safety)
          if (site.quality_trend === 'improved') return 2; // HIGH priority
        }
        return 3; // NORMAL priority (stable)
      };

      const priorityA = getPriority(a);
      const priorityB = getPriority(b);

      // Sort by priority first
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      // Within same priority, sort by latest update (newest first)
      const dateCompare = b.latest_updated_at.localeCompare(a.latest_updated_at);
      if (dateCompare !== 0) return dateCompare;

      // If timestamps are same, sort alphabetically
      return a.site_name.localeCompare(b.site_name);
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
