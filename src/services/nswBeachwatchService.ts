/**
 * Service layer for NSW Beachwatch API integration
 * Handles data fetching and error handling for NSW water quality data
 */

import {
  BeachLocation,
  EnterococciRecord,
  NSWBeachwatchRawData,
  WaterQualityRating,
  NormalizedWaterQualityData,
} from '@/lib/types';

const NSW_API_BASE_URL = process.env.NSW_BEACHWATCH_API_URL || 'https://api.nsw.gov.au/beachwatch';

/**
 * Fetch beach locations from NSW Beachwatch API
 */
export async function fetchNSWBeachLocations(): Promise<BeachLocation[]> {
  try {
    const response = await fetch(`${NSW_API_BASE_URL}/sites`, {
      headers: {
        'Content-Type': 'application/json',
        // Add API key if required
        // 'Authorization': `Bearer ${process.env.NSW_API_KEY}`,
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`NSW Beachwatch API error: ${response.status}`);
    }

    const rawData: NSWBeachwatchRawData[] = await response.json();
    return rawData.map(normalizeNSWLocation);
  } catch (error) {
    console.error('Error fetching NSW beach locations:', error);
    throw error;
  }
}

/**
 * Fetch water quality records for a specific beach
 */
export async function fetchNSWBeachData(
  siteId: string,
  startDate?: string,
  endDate?: string
): Promise<EnterococciRecord[]> {
  try {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    const url = `${NSW_API_BASE_URL}/sites/${siteId}/data?${params.toString()}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 1800 }, // Cache for 30 minutes
    });

    if (!response.ok) {
      throw new Error(`NSW Beachwatch API error: ${response.status}`);
    }

    const rawData: NSWBeachwatchRawData[] = await response.json();
    return rawData.map((record) => normalizeNSWRecord(record, siteId));
  } catch (error) {
    console.error(`Error fetching NSW beach data for site ${siteId}:`, error);
    throw error;
  }
}

/**
 * Fetch comprehensive data for all NSW beaches (locations + latest readings)
 */
export async function fetchNSWComprehensiveData(): Promise<NormalizedWaterQualityData[]> {
  try {
    const locations = await fetchNSWBeachLocations();
    
    // Fetch latest data for each location
    const dataPromises = locations.map(async (location) => {
      try {
        const records = await fetchNSWBeachData(location.id);
        const sortedRecords = records.sort(
          (a, b) => new Date(b.sampleDate).getTime() - new Date(a.sampleDate).getTime()
        );

        return {
          location,
          latestReading: sortedRecords[0] || createEmptyRecord(location.id),
          historicalReadings: sortedRecords.slice(1, 30), // Last 30 readings
          statistics: calculateStatistics(sortedRecords),
        };
      } catch (error) {
        console.warn(`Failed to fetch data for location ${location.id}:`, error);
        return null;
      }
    });

    const results = await Promise.all(dataPromises);
    return results.filter((result): result is NormalizedWaterQualityData => result !== null);
  } catch (error) {
    console.error('Error fetching NSW comprehensive data:', error);
    throw error;
  }
}

// ========================================
// Normalization Functions
// ========================================

/**
 * Normalize NSW Beachwatch location data to our standard format
 */
function normalizeNSWLocation(raw: NSWBeachwatchRawData): BeachLocation {
  return {
    id: `nsw-${raw.SiteID}`,
    name: raw.SiteName,
    state: 'NSW',
    latitude: raw.Latitude,
    longitude: raw.Longitude,
    region: raw.Region,
    localGovernmentArea: raw.Council,
    beachType: 'ocean', // Default, could be enhanced with additional logic
  };
}

/**
 * Normalize NSW Beachwatch water quality record
 */
function normalizeNSWRecord(raw: NSWBeachwatchRawData, locationId: string): EnterococciRecord {
  return {
    id: `${locationId}-${raw.SampleDate}`,
    locationId,
    sampleDate: raw.SampleDate,
    enterococciValue: raw.EnterococciResult,
    unit: 'cfu/100ml',
    qualityRating: determineWaterQualityRating(raw.EnterococciResult),
    source: 'nsw_beachwatch',
  };
}

/**
 * Determine water quality rating based on enterococci value
 * Based on NHMRC guidelines for recreational water quality
 */
function determineWaterQualityRating(value: number): WaterQualityRating {
  if (value <= 40) return 'excellent';
  if (value <= 100) return 'good';
  if (value <= 200) return 'fair';
  if (value <= 500) return 'poor';
  return 'very_poor';
}

/**
 * Calculate statistics for a set of records
 */
function calculateStatistics(records: EnterococciRecord[]) {
  if (records.length === 0) {
    return {
      average: 0,
      median: 0,
      min: 0,
      max: 0,
      sampleCount: 0,
    };
  }

  const values = records.map((r) => r.enterococciValue).sort((a, b) => a - b);
  const sum = values.reduce((acc, val) => acc + val, 0);

  return {
    average: sum / values.length,
    median: values[Math.floor(values.length / 2)],
    min: values[0],
    max: values[values.length - 1],
    sampleCount: values.length,
  };
}

/**
 * Create an empty record when no data is available
 */
function createEmptyRecord(locationId: string): EnterococciRecord {
  return {
    id: `${locationId}-empty`,
    locationId,
    sampleDate: new Date().toISOString(),
    enterococciValue: 0,
    unit: 'cfu/100ml',
    qualityRating: 'unknown',
    source: 'nsw_beachwatch',
    notes: 'No data available',
  };
}
