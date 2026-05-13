/**
 * MST Data Hook
 * 
 * Features:
 * - Fetches microbial or faecal community contribution data
 * - Handles loading and error states
 * - Provides processed data for charts
 */

import { useState, useEffect, useCallback } from 'react';
import {
  fetchMicrobialData,
  fetchFaecalData,
  calculateAverageContributions,
  extractTrendData,
  getDominantSource,
  type MSTViewMode,
  type MSTMicrobialData,
  type MSTFaecalData,
  type MSTSourceContribution,
  type MSTTrendData,
} from '@/services/mstService';

interface UseMSTDataResult {
  // Raw data
  rawData: (MSTMicrobialData | MSTFaecalData)[];
  
  // Processed data
  averageContributions: MSTSourceContribution[];
  trendData: MSTTrendData[];
  dominantSource: string;
  
  // Loading states
  isLoading: boolean;
  
  // Error
  error: string | null;
  
  // Actions
  refetch: () => void;
}

export function useMSTData(
  site: string | null,
  viewMode: MSTViewMode
): UseMSTDataResult {
  const [rawData, setRawData] = useState<(MSTMicrobialData | MSTFaecalData)[]>([]);
  const [averageContributions, setAverageContributions] = useState<MSTSourceContribution[]>([]);
  const [trendData, setTrendData] = useState<MSTTrendData[]>([]);
  const [dominantSource, setDominantSource] = useState<string>('N/A');
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  // Fetch data
  useEffect(() => {
    if (!site) {
      setRawData([]);
      setAverageContributions([]);
      setTrendData([]);
      setDominantSource('N/A');
      return;
    }

    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        let result: (MSTMicrobialData | MSTFaecalData)[] = [];

        if (viewMode === 'microbial') {
          result = await fetchMicrobialData(site);
        } else {
          result = await fetchFaecalData(site);
        }
        
        setRawData(result);

        // Calculate processed data
        if (result.length > 0) {
          const avgContributions = calculateAverageContributions(result);
          setAverageContributions(avgContributions);
          
          const trends = extractTrendData(result, viewMode);
          setTrendData(trends);
          
          const dominant = getDominantSource(avgContributions);
          setDominantSource(dominant);
        } else {
          setAverageContributions([]);
          setTrendData([]);
          setDominantSource('N/A');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMessage);
        console.error('Error loading MST data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [site, viewMode, refetchTrigger]);

  // Refetch function
  const refetch = useCallback(() => {
    setRefetchTrigger(prev => prev + 1);
  }, []);

  return {
    rawData,
    averageContributions,
    trendData,
    dominantSource,
    isLoading,
    error,
    refetch,
  };
}
