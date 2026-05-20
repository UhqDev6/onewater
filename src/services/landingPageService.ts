/**
 * Landing Page Service
 * Separate service for landing page data to avoid affecting dashboard
 * Uses API proxy to avoid CORS issues
 */

import type { BeachwatchFeature, BeachwatchGeoJSON } from '@/lib/api/beachwatch.schema';
import { fetchInternalLocationsAsFeatures } from './internalLocationService';

export interface LandingPageDataResponse {
  type: 'FeatureCollection';
  features: BeachwatchFeature[];
  metadata: {
    total: number;
    apiCount: number;
    internalCount: number;
  };
}

/**
 * Fetch combined data for landing page only
 * Uses internal API proxy to avoid CORS
 */
export async function fetchLandingPageData(): Promise<LandingPageDataResponse> {
  try {
    let apiFeatures: BeachwatchFeature[] = [];
    
    try {
      // Use internal API proxy to avoid CORS issues
      const nswApiUrl = '/api/nsw-beachwatch';
      
      const apiResponse = await fetch(nswApiUrl, {
        headers: {
          'Accept': 'application/json',
        },
        cache: 'no-store',
      });

      if (apiResponse.ok) {
        const apiData: BeachwatchGeoJSON = await apiResponse.json();
        
        // Add default null values for new fields to NSW API data
        apiFeatures = (apiData.features || []).map(feature => ({
          ...feature,
          properties: {
            ...feature.properties,
            expectedPopulation: null,
            beachCameraUrl: null,
          }
        }));
      }
    } catch (apiError) {
      console.warn('Failed to fetch NSW API data for landing page:', apiError);
    }

    // Fetch internal data
    const internalFeatures = await fetchInternalLocationsAsFeatures();

    // Combine features with internal data first (priority)
    const allFeatures = [...internalFeatures, ...apiFeatures];

    return {
      type: 'FeatureCollection',
      features: allFeatures,
      metadata: {
        total: allFeatures.length,
        apiCount: apiFeatures.length,
        internalCount: internalFeatures.length,
      },
    };
  } catch (error) {
    console.error('Landing page service error:', error);
    throw error;
  }
}