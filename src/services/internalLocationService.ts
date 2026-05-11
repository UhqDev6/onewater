/**
 * Internal Locations Service
 * Handles CRUD operations for internal locations stored in Supabase
 */

import { supabase, supabaseAdmin, isSupabaseAvailable, type InternalLocation } from '@/lib/supabase';
import type { BeachwatchFeature } from '@/lib/api/beachwatch.schema';

/**
 * Fetch all active internal locations
 */
export async function fetchInternalLocations(): Promise<InternalLocation[]> {
  // Return empty array if Supabase not configured
  if (!isSupabaseAvailable() || !supabase) {
    console.warn('Supabase not configured, returning empty internal locations');
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('internal_locations')
      .select('*')
      .eq('is_active', true)
      .order('site_name');

    if (error) {
      console.error('Error fetching internal locations:', error);
      throw new Error(`Failed to fetch internal locations: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Internal locations service error:', error);
    // Return empty array instead of throwing in fallback mode
    return [];
  }
}

/**
 * Convert internal location to BeachwatchFeature format (for consistency with API)
 */
export function convertToBeachwatchFeature(location: InternalLocation): BeachwatchFeature {
  return {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [location.longitude, location.latitude],
    },
    properties: {
      id: location.site_id,
      siteName: location.site_name,
      pollutionForecast: location.pollution_forecast || 'Unknown',
      pollutionForecastTimeStamp: location.pollution_forecast_timestamp || new Date().toISOString(),
      latestResult: location.latest_result || 'Unknown',
      latestResultRating: location.latest_result_rating || 1,
      latestResultObservationDate: location.latest_result_observation_date || new Date().toISOString(),
      // Updated field names and types
      expectedPopulation: location.expected_population || null,
      beachCameraUrl: location.beach_camera_url || null,
    },
  };
}

/**
 * Fetch internal locations in BeachwatchFeature format
 */
export async function fetchInternalLocationsAsFeatures(): Promise<BeachwatchFeature[]> {
  // Return empty array if Supabase not configured
  if (!isSupabaseAvailable()) {
    return [];
  }
  
  const locations = await fetchInternalLocations();
  return locations.map(convertToBeachwatchFeature);
}

/**
 * Create a new internal location
 */
export async function createInternalLocation(locationData: Partial<InternalLocation>): Promise<InternalLocation> {
  // Check if Supabase admin is available
  if (!isSupabaseAvailable() || !supabaseAdmin) {
    throw new Error('Supabase admin client not available');
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('internal_locations')
      .insert([locationData])
      .select()
      .single();

    if (error) {
      console.error('Error creating internal location:', error);
      throw new Error(`Failed to create internal location: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Create internal location error:', error);
    throw error;
  }
}

/**
 * Update an internal location
 */
export async function updateInternalLocation(
  siteId: string, 
  updates: Partial<InternalLocation>
): Promise<InternalLocation> {
  // Check if Supabase admin is available
  if (!isSupabaseAvailable() || !supabaseAdmin) {
    throw new Error('Supabase admin client not available');
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('internal_locations')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('site_id', siteId)
      .select()
      .single();

    if (error) {
      console.error('Error updating internal location:', error);
      throw new Error(`Failed to update internal location: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Update internal location error:', error);
    throw error;
  }
}

/**
 * Delete an internal location (soft delete)
 */
export async function deleteInternalLocation(siteId: string): Promise<void> {
  // Check if Supabase admin is available
  if (!isSupabaseAvailable() || !supabaseAdmin) {
    throw new Error('Supabase admin client not available');
  }

  try {
    const { error } = await supabaseAdmin
      .from('internal_locations')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('site_id', siteId);

    if (error) {
      console.error('Error deleting internal location:', error);
      throw new Error(`Failed to delete internal location: ${error.message}`);
    }
  } catch (error) {
    console.error('Delete internal location error:', error);
    throw error;
  }
}

/**
 * Get internal location by site ID
 */
export async function getInternalLocationBySiteId(siteId: string): Promise<InternalLocation | null> {
  // Return null if Supabase not configured
  if (!isSupabaseAvailable() || !supabase) {
    console.warn('Supabase not configured, returning null for internal location');
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('internal_locations')
      .select('*')
      .eq('site_id', siteId)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      console.error('Error fetching internal location:', error);
      throw new Error(`Failed to fetch internal location: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Get internal location error:', error);
    // Return null instead of throwing in fallback mode
    return null;
  }
}