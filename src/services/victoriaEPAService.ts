/**
 * Service layer for Victoria EPA API integration
 * Handles data fetching and error handling for Victoria water quality data
 */

import {
  BeachLocation,
  EnterococciRecord,
  VictoriaEPARawData,
  WaterQualityRating,
} from '@/lib/types';

const VIC_EPA_API_BASE_URL = process.env.VIC_EPA_API_URL || 'https://api.epa.vic.gov.au';

/**
 * Fetch beach locations from Victoria EPA API
 */
export async function fetchVictoriaBeachLocations(): Promise<BeachLocation[]> {
  try {
    const response = await fetch(`${VIC_EPA_API_BASE_URL}/sites`, {
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`Victoria EPA API error: ${response.status}`);
    }

    const rawData: VictoriaEPARawData[] = await response.json();
    return rawData.map(normalizeVictoriaLocation);
  } catch (error) {
    console.error('Error fetching Victoria beach locations:', error);
    throw error;
  }
}

/**
 * Fetch water quality records for a specific Victoria beach
 */
export async function fetchVictoriaBeachData(
  siteId: string,
  startDate?: string,
  endDate?: string
): Promise<EnterococciRecord[]> {
  try {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    const url = `${VIC_EPA_API_BASE_URL}/sites/${siteId}/readings?${params.toString()}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 1800 }, // Cache for 30 minutes
    });

    if (!response.ok) {
      throw new Error(`Victoria EPA API error: ${response.status}`);
    }

    const rawData: VictoriaEPARawData[] = await response.json();
    return rawData.map((record) => normalizeVictoriaRecord(record, siteId));
  } catch (error) {
    console.error(`Error fetching Victoria beach data for site ${siteId}:`, error);
    throw error;
  }
}

// ========================================
// Normalization Functions
// ========================================

/**
 * Normalize Victoria EPA location data to our standard format
 */
function normalizeVictoriaLocation(raw: VictoriaEPARawData): BeachLocation {
  return {
    id: `vic-${raw.site_id}`,
    name: raw.site_name,
    state: 'VIC',
    latitude: raw.latitude,
    longitude: raw.longitude,
    beachType: 'ocean', // Default, could be enhanced
  };
}

/**
 * Normalize Victoria EPA water quality record
 */
function normalizeVictoriaRecord(raw: VictoriaEPARawData, locationId: string): EnterococciRecord {
  return {
    id: `${locationId}-${raw.sample_date}`,
    locationId,
    sampleDate: raw.sample_date,
    enterococciValue: raw.enterococci_cfu_100ml,
    unit: 'cfu/100ml',
    qualityRating: determineWaterQualityRating(raw.enterococci_cfu_100ml),
    source: 'vic_epa',
  };
}

/**
 * Determine water quality rating based on enterococci value
 */
function determineWaterQualityRating(value: number): WaterQualityRating {
  if (value <= 40) return 'excellent';
  if (value <= 100) return 'good';
  if (value <= 200) return 'fair';
  if (value <= 500) return 'poor';
  return 'very_poor';
}
