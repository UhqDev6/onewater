/**
 * Hook for fetching real hybrid beach statistics
 * Combines NSW Beachwatch API + Internal Database data
 * Uses landing page service to avoid affecting dashboard
 */

import { useState, useEffect, useRef } from 'react';
import { fetchLandingPageData } from '@/services/landingPageService';
import { getTotalSampleCount } from '@/services/sampleCountService';

export interface HybridStatsData {
  totalLocations: number;
  apiLocations: number;
  internalLocations: number;
  goodStatusCount: number;
  goodStatusPercentage: number;
  latestSampleDate: string;
  totalDataPoints: number;
  isLoading: boolean;
  error: string | null;
}

export function useHybridStats(): HybridStatsData {
  const [stats, setStats] = useState<HybridStatsData>({
    totalLocations: 0,
    apiLocations: 0,
    internalLocations: 0,
    goodStatusCount: 0,
    goodStatusPercentage: 0,
    latestSampleDate: '',
    totalDataPoints: 0,
    isLoading: true,
    error: null,
  });

  // Use ref to prevent multiple simultaneous calls
  const fetchingRef = useRef(false);

  useEffect(() => {
    const fetchStats = async () => {
      // Prevent multiple simultaneous calls
      if (fetchingRef.current) {
        console.log('Fetch already in progress, skipping...');
        return;
      }

      try {
        fetchingRef.current = true;
        setStats(prev => ({ ...prev, isLoading: true, error: null }));

        // Fetch landing page data (separate from dashboard)
        const landingData = await fetchLandingPageData();
        
        console.log('Landing page data received in useHybridStats:', {
          total: landingData.metadata.total,
          apiCount: landingData.metadata.apiCount,
          internalCount: landingData.metadata.internalCount,
          featuresLength: landingData.features.length
        });
        
        // Calculate statistics
        const totalLocations = landingData.metadata.total;
        const apiLocations = landingData.metadata.apiCount;
        const internalLocations = landingData.metadata.internalCount;

        // Calculate water quality statistics
        // Use latestResult string instead of latestResultRating number
        // because NSW API has inconsistent rating values
        const validFeatures = landingData.features.filter(feature => {
          const result = feature.properties.latestResult;
          return result !== null && result !== undefined && result.trim() !== '';
        });

        const goodStatusFeatures = validFeatures.filter(feature => {
          const result = feature.properties.latestResult.toLowerCase();
          // Consider "good" status as safe for swimming
          return result.includes('good');
        });

        const goodStatusCount = goodStatusFeatures.length;
        const goodStatusPercentage = validFeatures.length > 0 
          ? Math.round((goodStatusCount / validFeatures.length) * 100) 
          : 0;

        // Debug: Log result distribution
        const resultDistribution = landingData.features.reduce((acc, feature) => {
          const result = feature.properties.latestResult || 'null/undefined';
          const rating = feature.properties.latestResultRating;
          const key = `${result} (rating: ${rating})`;
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        console.log('Water Quality Result Distribution:', resultDistribution);
        console.log('Valid features:', validFeatures.length, 'out of', totalLocations);
        console.log('Good Status:', goodStatusCount, 'out of', validFeatures.length, '=', goodStatusPercentage + '%');

        // Find latest sample date
        const latestDate = landingData.features
          .map(feature => feature.properties.latestResultObservationDate)
          .filter(date => date && date.trim())
          .sort()
          .pop() || '';

        // Format latest date
        const formattedLatestDate = latestDate 
          ? new Date(latestDate).toLocaleDateString('en-AU', { 
              day: 'numeric', 
              month: 'short',
              year: 'numeric'
            })
          : 'N/A';

        // Get real sample count from database
        let totalDataPoints = 0;
        
        try {
          const sampleCounts = await getTotalSampleCount();
          totalDataPoints = sampleCounts.totalSamples;
          console.log('Real sample counts:', sampleCounts);
          
          // If no samples found in database, use estimation as fallback
          if (totalDataPoints === 0) {
            console.warn('No samples found in database, using estimation');
            totalDataPoints = totalLocations * 50; // Fallback estimation
          }
        } catch (error) {
          console.error('Error getting sample counts, using estimation:', error);
          totalDataPoints = totalLocations * 50; // Fallback estimation
        }

        setStats({
          totalLocations,
          apiLocations,
          internalLocations,
          goodStatusCount,
          goodStatusPercentage,
          latestSampleDate: formattedLatestDate,
          totalDataPoints,
          isLoading: false,
          error: null,
        });

      } catch (error) {
        console.error('Error fetching hybrid stats:', error);
        setStats(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to fetch statistics',
        }));
      } finally {
        fetchingRef.current = false;
      }
    };

    // Add small delay to prevent rapid successive calls
    const timeoutId = setTimeout(fetchStats, 100);
    
    return () => {
      clearTimeout(timeoutId);
      fetchingRef.current = false;
    };
  }, []);

  return stats;
}