/**
 * Hook for fetching real pollution alert data
 * Identifies locations with poor water quality status
 * Uses landing page service to avoid affecting dashboard
 */

import { useState, useEffect } from 'react';
import { fetchLandingPageData } from '@/services/landingPageService';

export interface PollutionAlertLocation {
  id: string;
  name: string;
  status: string;
  indicator: string;
  lastUpdated: string;
  enterococci: number | null;
  threshold: number;
  severity: 'high' | 'critical';
  rating: number;
}

export interface PollutionAlertsData {
  alerts: PollutionAlertLocation[];
  totalPoorLocations: number;
  isLoading: boolean;
  error: string | null;
}

export function usePollutionAlerts(): PollutionAlertsData {
  const [alertsData, setAlertsData] = useState<PollutionAlertsData>({
    alerts: [],
    totalPoorLocations: 0,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setAlertsData(prev => ({ ...prev, isLoading: true, error: null }));

        // Fetch landing page data (separate from dashboard)
        const landingData = await fetchLandingPageData();
        
        // Separate internal and API features (internal comes first in array)
        const internalFeatures = landingData.features.slice(0, landingData.metadata.internalCount);
        const apiFeatures = landingData.features.slice(landingData.metadata.internalCount);
        
        // Filter locations with poor water quality
        // CRITICAL: Use latestResult string, NOT latestResultRating number
        // NSW API has inconsistent rating values (rating=4 but result="Good")
        const internalPoorQuality = internalFeatures.filter(feature => {
          const result = feature.properties.latestResult;
          if (!result || result.trim() === '') return false;
          const resultLower = result.toLowerCase();
          // Filter for NOT good (i.e., Fair, Poor, Bad)
          return !resultLower.includes('good');
        });
        
        const apiPoorQuality = apiFeatures.filter(feature => {
          const result = feature.properties.latestResult;
          if (!result || result.trim() === '') return false;
          const resultLower = result.toLowerCase();
          // Filter for NOT good (i.e., Fair, Poor, Bad)
          return !resultLower.includes('good');
        });

        // Prioritize internal data first (VIC), then API data (NSW)
        // Sort each group by severity (Bad > Poor > Fair), then combine
        const getSeverityScore = (result: string): number => {
          const resultLower = result.toLowerCase();
          if (resultLower.includes('bad')) return 3;
          if (resultLower.includes('poor')) return 2;
          if (resultLower.includes('fair')) return 1;
          return 0;
        };
        
        const sortedInternalPoor = internalPoorQuality.sort((a, b) => 
          getSeverityScore(b.properties.latestResult) - getSeverityScore(a.properties.latestResult)
        );
        const sortedApiPoor = apiPoorQuality.sort((a, b) => 
          getSeverityScore(b.properties.latestResult) - getSeverityScore(a.properties.latestResult)
        );
        
        // Combine with internal data first
        const allPoorQualityFeatures = [...sortedInternalPoor, ...sortedApiPoor];

        // Take top 3 from the prioritized list
        const sortedPoorFeatures = allPoorQualityFeatures.slice(0, 3);

        // Debug logging
        console.log('Pollution alerts filtering:', {
          internalPoorCount: internalPoorQuality.length,
          apiPoorCount: apiPoorQuality.length,
          totalPoorCount: allPoorQualityFeatures.length,
          top3: sortedPoorFeatures.map(f => ({
            name: f.properties.siteName,
            result: f.properties.latestResult,
            rating: f.properties.latestResultRating
          }))
        });

        // Convert to alert format
        const alerts: PollutionAlertLocation[] = sortedPoorFeatures.map((feature) => {
          const result = feature.properties.latestResult;
          const resultLower = result.toLowerCase();
          const rating = feature.properties.latestResultRating;
          
          // Determine if this is internal data based on its position in the original arrays
          const isInternalData = internalPoorQuality.some(f => f.properties.id === feature.properties.id);
          
          // Determine status and severity based on latestResult string
          let status: string;
          let severity: 'high' | 'critical';
          let indicator: string;
          
          if (resultLower.includes('bad')) {
            status = 'Bad';
            severity = 'critical';
            indicator = isInternalData 
              ? 'Severe contamination detected (VIC monitoring)'
              : 'Severe contamination detected (NSW monitoring)';
          } else if (resultLower.includes('poor')) {
            status = 'Poor';
            severity = 'critical';
            indicator = isInternalData 
              ? 'High bacterial contamination (VIC monitoring)'
              : 'High bacterial contamination (NSW monitoring)';
          } else {
            status = 'Fair';
            severity = 'high';
            indicator = isInternalData 
              ? 'Elevated contamination levels (VIC monitoring)'
              : 'Elevated contamination levels (NSW monitoring)';
          }

          // Calculate time since last update
          const lastUpdateDate = new Date(feature.properties.latestResultObservationDate);
          const now = new Date();
          const hoursDiff = Math.floor((now.getTime() - lastUpdateDate.getTime()) / (1000 * 60 * 60));
          
          let lastUpdated: string;
          if (hoursDiff < 1) {
            lastUpdated = 'Less than 1 hour ago';
          } else if (hoursDiff < 24) {
            lastUpdated = `${hoursDiff} hour${hoursDiff > 1 ? 's' : ''} ago`;
          } else {
            const daysDiff = Math.floor(hoursDiff / 24);
            lastUpdated = `${daysDiff} day${daysDiff > 1 ? 's' : ''} ago`;
          }

          return {
            id: feature.properties.id,
            name: feature.properties.siteName,
            status,
            indicator,
            lastUpdated,
            enterococci: null, // Not available in API
            threshold: 200,
            severity,
            rating,
          };
        });

        setAlertsData({
          alerts,
          totalPoorLocations: allPoorQualityFeatures.length,
          isLoading: false,
          error: null,
        });

      } catch (error) {
        console.error('Error fetching pollution alerts:', error);
        setAlertsData(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to fetch pollution alerts',
        }));
      }
    };

    fetchAlerts();
  }, []);

  return alertsData;
}