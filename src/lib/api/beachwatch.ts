/**
 * NSW Beachwatch API Integration
 * Fetches water quality data from NSW Government's public API
 */

import { BeachLocation, EnterococciRecord, NormalizedWaterQualityData } from '@/lib/types';
import type { BeachwatchGeoJSON, BeachwatchFeature } from './beachwatch.schema';

/**
 * Map NSW rating (1-5) to our quality categories
 * NSW uses: Good (4-5), Fair (3), Poor (2), Bad (1)
 */
function mapRatingToQuality(rating: number): 'good' | 'fair' | 'poor' | 'bad' {
  if (rating === 4) return 'good';
  if (rating === 3) return 'fair';
  if (rating === 2) return 'poor';
  return 'bad'; // Rating 1 or unknown
}

/**
 * Normalize NSW Beachwatch data to our internal format
 */
function normalizeBeachwatchData(feature: BeachwatchFeature): NormalizedWaterQualityData {
  const { geometry, properties } = feature;
  const [longitude, latitude] = geometry.coordinates;

  const location: BeachLocation = {
    id: properties.id,
    name: properties.siteName,
    state: 'NSW',
    latitude,
    longitude,
    region: 'New South Wales',
  };

  const latestReading: EnterococciRecord = {
    id: `${properties.id}-${properties.latestResultObservationDate}`,
    locationId: properties.id,
    sampleDate: properties.latestResultObservationDate,
    enterococciValue: 0, // NSW Beachwatch API does not provide actual enterococci values
    unit: 'cfu/100ml',
    qualityRating: mapRatingToQuality(properties.latestResultRating),
    source: 'nsw_beachwatch',
    // NSW Beachwatch specific fields
    pollutionForecast: properties.pollutionForecast,
    pollutionForecastTimeStamp: properties.pollutionForecastTimeStamp,
    latestResultObservationDate: properties.latestResultObservationDate,
  };

  return {
    location,
    latestReading,
    historicalReadings: [latestReading],
    statistics: {
      average: latestReading.enterococciValue,
      median: latestReading.enterococciValue,
      min: latestReading.enterococciValue,
      max: latestReading.enterococciValue,
      sampleCount: 1,
    },
  };
}

/**
 * Fetch NSW Beachwatch data via Next.js API route (avoids CORS)
 */
export async function fetchNSWBeachwatchData(): Promise<NormalizedWaterQualityData[]> {
  try {
    const response = await fetch('/api/nsw-beachwatch', {
      cache: 'force-cache',
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data: BeachwatchGeoJSON = await response.json();
    
    return data.features.map(normalizeBeachwatchData);
  } catch (error) {
    console.error('Error fetching NSW Beachwatch data:', error);
    throw error;
  }
}

/**
 * Fetch NSW Beachwatch data with error handling and fallback
 */
export async function fetchNSWBeachwatchDataSafe(): Promise<{
  data: NormalizedWaterQualityData[];
  error?: string;
}> {
  try {
    const data = await fetchNSWBeachwatchData();
    return { data };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to fetch NSW Beachwatch data:', errorMessage);
    return { 
      data: [], 
      error: errorMessage 
    };
  }
}
