/**
 * Custom hook for fetching and managing location data
 * Used for location dropdown filters across the application
 * Now supports hybrid data (API + Internal locations)
 */

import { useEffect, useState } from 'react';
import type { BeachwatchFeature } from '@/lib/api/beachwatch.schema';

export interface LocationOption {
  id: string;
  name: string;
  state: string;
  region?: string;
  source?: 'api' | 'internal';
}

interface UseLocationsResult {
  locations: LocationOption[];
  isLoading: boolean;
  error: string | null;
  metadata?: {
    total: number;
    apiCount: number;
    internalCount: number;
  };
}

/**
 * Determine state from feature properties
 */
function determineStateFromFeature(feature: BeachwatchFeature): { state: string; region: string; source: 'api' | 'internal' } {
  const siteName = feature.properties.siteName.toLowerCase();
  
  // Check if it's internal data (might have region info)
  if (siteName.includes('victoria') || siteName.includes('melbourne') || siteName.includes('frankston')) {
    return {
      state: 'VIC',
      region: 'Victoria',
      source: 'internal'
    };
  }
  
  // Default to NSW for API data
  return {
    state: 'NSW',
    region: 'New South Wales',
    source: 'api'
  };
}

/**
 * Fetch all locations from the hybrid beaches API
 * Returns a list of unique locations for use in dropdowns
 */
export function useLocations(): UseLocationsResult {
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<{ total: number; apiCount: number; internalCount: number }>();

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Try hybrid API first, fallback to original API
        let response;
        let isHybrid = true;
        
        try {
          // Fetch all beaches from hybrid endpoint without pagination (limit=9999)
          response = await fetch('/api/hybrid-beaches?limit=9999');
        } catch (hybridError) {
          console.warn('Hybrid API failed, falling back to original API:', hybridError);
          isHybrid = false;
          response = await fetch('/api/beaches?limit=9999');
        }
        
        if (!response.ok) {
          throw new Error(`Failed to fetch locations: ${response.status}`);
        }

        const data = await response.json();
        
        // Set metadata if available (from hybrid API)
        if (isHybrid && data.metadata) {
          setMetadata({
            total: data.metadata.total,
            apiCount: data.metadata.apiCount,
            internalCount: data.metadata.internalCount,
          });
        }
        
        // Extract unique locations from features
        const locationMap = new Map<string, LocationOption>();
        
        data.features.forEach((feature: BeachwatchFeature) => {
          const { id, siteName } = feature.properties;
          
          if (!locationMap.has(id)) {
            const stateInfo = determineStateFromFeature(feature);
            
            locationMap.set(id, {
              id,
              name: siteName,
              state: stateInfo.state,
              region: stateInfo.region,
              source: stateInfo.source,
            });
          }
        });

        // Convert to array and sort by name
        const sortedLocations = Array.from(locationMap.values()).sort((a, b) =>
          a.name.localeCompare(b.name)
        );

        setLocations(sortedLocations);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMessage);
        console.error('Error fetching locations:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLocations();
  }, []);

  return { locations, isLoading, error, metadata };
}
