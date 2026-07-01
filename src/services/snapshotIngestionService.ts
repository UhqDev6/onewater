/**
 * Snapshot Ingestion Service
 * 
 * This service is responsible for periodically fetching NSW Beachwatch data
 * and storing historical snapshots in Supabase for time-series analysis.
 * 
 * IMPORTANT: This service is completely isolated from the real-time dashboard fetching logic.
 * It does NOT interfere with existing services like hybridBeachService or nswBeachwatchService.
 */

import { supabaseAdmin } from '@/lib/supabase';

/**
 * Interface for the beachwatch_snapshots table structure
 */
export interface BeachwatchSnapshot {
  site_id: string;
  site_name: string;
  longitude: number;
  latitude: number;
  latest_result: string | null;
  latest_result_rating: number | null;
  pollution_forecast: string | null;
  pollution_forecast_timestamp: string | null;
  latest_result_observation_date: string | null;
  snapshot_date: string; // YYYY-MM-DD format - the date we pulled this snapshot
}

/**
 * Interface for NSW Beachwatch GeoJSON Feature
 */
interface BeachwatchGeoJSONFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  properties: {
    id: string;
    siteName: string;
    latestResult: string | null;
    latestResultRating: number | null;
    pollutionForecast: string | null;
    pollutionForecastTimeStamp: string | null;
    latestResultObservationDate: string | null;
  };
}

/**
 * Interface for NSW Beachwatch GeoJSON Response
 */
interface BeachwatchGeoJSONResponse {
  type: 'FeatureCollection';
  features: BeachwatchGeoJSONFeature[];
}

/**
 * Main ingestion function
 * Fetches data from NSW Beachwatch API and stores it in beachwatch_snapshots table
 * 
 * @returns Object containing success status and details about the ingestion
 */
export async function ingestBeachwatchSnapshots(): Promise<{
  success: boolean;
  message: string;
  recordsProcessed: number;
  timestamp: string;
}> {
  const timestamp = new Date().toISOString();
  
  try {
    // Validate Supabase configuration
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client is not configured. Please check environment variables.');
    }

    // Step 1: Fetch data from NSW Beachwatch API
    const apiUrl = process.env.NSW_BEACHWATCH_API_URL || 'https://api.beachwatch.nsw.gov.au/public/sites/geojson';
    
    console.log(`[Snapshot Ingestion] Starting data fetch from: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'OneWater Platform - Snapshot Ingestion Service',
      },
      // Disable caching for cron jobs to ensure fresh data
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch NSW Beachwatch data: HTTP ${response.status} - ${response.statusText}`);
    }

    const geoJsonData: BeachwatchGeoJSONResponse = await response.json();

    // Validate response structure
    if (!geoJsonData.features || !Array.isArray(geoJsonData.features)) {
      throw new Error('Invalid GeoJSON response structure: missing or invalid features array');
    }

    console.log(`[Snapshot Ingestion] Fetched ${geoJsonData.features.length} features from API`);

    // Step 2: Map GeoJSON features to database schema
    const snapshots: BeachwatchSnapshot[] = geoJsonData.features.map((feature) => {
      // Get current date in YYYY-MM-DD format for snapshot_date
      const today = new Date().toISOString().split('T')[0];
      
      return {
        site_id: feature.properties.id,
        site_name: feature.properties.siteName,
        longitude: feature.geometry.coordinates[0],
        latitude: feature.geometry.coordinates[1],
        latest_result: feature.properties.latestResult,
        latest_result_rating: feature.properties.latestResultRating,
        pollution_forecast: feature.properties.pollutionForecast,
        pollution_forecast_timestamp: feature.properties.pollutionForecastTimeStamp,
        latest_result_observation_date: feature.properties.latestResultObservationDate,
        snapshot_date: today, // Set to today's date
      };
    });

    // Step 3: Upsert data to Supabase
    // Using upsert with onConflict on (site_id, snapshot_date)
    // This ensures one snapshot per site per day
    // If we pull multiple times in same day, it will UPDATE the existing record
    console.log(`[Snapshot Ingestion] Upserting ${snapshots.length} records to database`);

    const { error } = await supabaseAdmin
      .from('beachwatch_snapshots')
      .upsert(snapshots, {
        onConflict: 'site_id,snapshot_date',
      });

    if (error) {
      throw new Error(`Supabase upsert failed: ${error.message}`);
    }

    console.log(`[Snapshot Ingestion] Successfully processed ${snapshots.length} records`);

    return {
      success: true,
      message: `Successfully ingested ${snapshots.length} beachwatch snapshots`,
      recordsProcessed: snapshots.length,
      timestamp,
    };

  } catch (error) {
    console.error('[Snapshot Ingestion] Error:', error);
    
    // Return detailed error information
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred during ingestion',
      recordsProcessed: 0,
      timestamp,
    };
  }
}

/**
 * Get ingestion statistics from the database
 * Useful for monitoring and debugging
 * 
 * @returns Statistics about stored snapshots
 */
export async function getIngestionStats(): Promise<{
  totalSnapshots: number;
  uniqueSites: number;
  dateRange: { earliest: string | null; latest: string | null };
} | null> {
  try {
    if (!supabaseAdmin) {
      console.warn('Supabase admin client not configured');
      return null;
    }

    // Get total count
    const { count: totalCount } = await supabaseAdmin
      .from('beachwatch_snapshots')
      .select('*', { count: 'exact', head: true });

    // Get unique sites count
    const { data: sites } = await supabaseAdmin
      .from('beachwatch_snapshots')
      .select('site_id');

    const uniqueSites = new Set(sites?.map(s => s.site_id) || []).size;

    // Get snapshot date range (when we pulled the data, not when lab tested it)
    const { data: dateData } = await supabaseAdmin
      .from('beachwatch_snapshots')
      .select('snapshot_date')
      .order('snapshot_date', { ascending: true })
      .limit(1);

    const { data: dateDataLatest } = await supabaseAdmin
      .from('beachwatch_snapshots')
      .select('snapshot_date')
      .order('snapshot_date', { ascending: false })
      .limit(1);

    return {
      totalSnapshots: totalCount || 0,
      uniqueSites,
      dateRange: {
        earliest: dateData?.[0]?.snapshot_date || null,
        latest: dateDataLatest?.[0]?.snapshot_date || null,
      },
    };
  } catch (error) {
    console.error('Error getting ingestion stats:', error);
    return null;
  }
}
