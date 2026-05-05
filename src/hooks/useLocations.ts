/**
 * Custom hook for fetching and managing location data
 * Used for location dropdown filters across the application
 */

import { useEffect, useState } from 'react';
import type { BeachwatchFeature } from '@/lib/api/beachwatch.schema';

export interface LocationOption {
  id: string;
  name: string;
  state: string;
  region?: string;
}

interface UseLocationsResult {
  locations: LocationOption[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Fetch all locations from the beaches API
 * Returns a list of unique locations for use in dropdowns
 */
export function useLocations(): UseLocationsResult {
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch all beaches without pagination (limit=9999)
        const response = await fetch('/api/beaches?limit=9999');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch locations: ${response.status}`);
        }

        const data = await response.json();
        
        // Extract unique locations from features
        const locationMap = new Map<string, LocationOption>();
        
        data.features.forEach((feature: BeachwatchFeature) => {
          const { id, siteName } = feature.properties;
          
          if (!locationMap.has(id)) {
            locationMap.set(id, {
              id,
              name: siteName,
              state: 'NSW',
              region: 'New South Wales',
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

  return { locations, isLoading, error };
}
