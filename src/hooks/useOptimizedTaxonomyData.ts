/**
 * Optimized Taxonomy Data Hook
 * 
 * Features:
 * - Uses RPC for server-side aggregation
 * - Client-side caching
 * - Automatic debouncing
 * - Reduced database requests
 */

import { useState, useEffect, useCallback } from 'react';
import {
  fetchTaxonomyBySample,
  fetchTaxonomyAggregated,
  fetchTaxonomyUniqueValues,
  fetchTaxonomyStats,
  clearTaxonomyCacheForEnvironment,
  type TaxonomyFilters,
  type TaxonomyAggregation,
  type TaxonomyStats,
} from '@/services/optimizedTaxonomyService';
import type { TaxonomyMeasurement } from '@/lib/supabase';

type TaxonomicLevel = 'domain' | 'phylum' | 'class' | 'order_tax' | 'family' | 'genus';

interface UseOptimizedTaxonomyDataResult {
  // Sample data (for stacked bar chart)
  sampleData: TaxonomyMeasurement[];
  
  // Aggregated data (for summary table)
  aggregatedData: TaxonomyAggregation[];
  
  // Statistics
  stats: TaxonomyStats | null;
  
  // Loading states
  isLoading: boolean;
  isLoadingSamples: boolean;
  isLoadingAggregated: boolean;
  isLoadingStats: boolean;
  
  // Error
  error: string | null;
  
  // Actions
  refetch: () => void;
  clearCache: () => void;
}

export function useOptimizedTaxonomyData(
  environment: string | null,
  level: TaxonomicLevel,
  filters?: TaxonomyFilters,
  options?: {
    topN?: number;
    fetchSamples?: boolean;
    fetchAggregated?: boolean;
    fetchStats?: boolean;
    enableDebounce?: boolean;
  }
): UseOptimizedTaxonomyDataResult {
  const {
    topN = 50,
    fetchSamples = true,
    fetchAggregated = true,
    fetchStats = true,
    enableDebounce = true,
  } = options || {};

  const [sampleData, setSampleData] = useState<TaxonomyMeasurement[]>([]);
  const [aggregatedData, setAggregatedData] = useState<TaxonomyAggregation[]>([]);
  const [stats, setStats] = useState<TaxonomyStats | null>(null);
  
  const [isLoadingSamples, setIsLoadingSamples] = useState<boolean>(false);
  const [isLoadingAggregated, setIsLoadingAggregated] = useState<boolean>(false);
  const [isLoadingStats, setIsLoadingStats] = useState<boolean>(false);
  
  const [error, setError] = useState<string | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  // Serialize filters to avoid infinite loop
  const filtersKey = filters ? JSON.stringify(filters) : '';

  // Fetch sample data
  useEffect(() => {
    if (!environment || !fetchSamples) {
      setSampleData([]);
      return;
    }

    const loadSampleData = async () => {
      try {
        setIsLoadingSamples(true);
        setError(null);

        const result = await fetchTaxonomyBySample(
          environment,
          level,
          filters,
          topN,
          enableDebounce
        );
        
        setSampleData(result);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMessage);
        console.error('Error loading sample data:', err);
      } finally {
        setIsLoadingSamples(false);
      }
    };

    loadSampleData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [environment, level, filtersKey, topN, refetchTrigger, fetchSamples, enableDebounce]);

  // Fetch aggregated data
  useEffect(() => {
    if (!environment || !fetchAggregated) {
      setAggregatedData([]);
      return;
    }

    const loadAggregatedData = async () => {
      try {
        setIsLoadingAggregated(true);
        setError(null);

        const result = await fetchTaxonomyAggregated(
          environment,
          level,
          filters,
          enableDebounce
        );
        
        setAggregatedData(result);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMessage);
        console.error('Error loading aggregated data:', err);
      } finally {
        setIsLoadingAggregated(false);
      }
    };

    loadAggregatedData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [environment, level, filtersKey, refetchTrigger, fetchAggregated, enableDebounce]);

  // Fetch stats
  useEffect(() => {
    if (!environment || !fetchStats) {
      setStats(null);
      return;
    }

    const loadStats = async () => {
      try {
        setIsLoadingStats(true);
        setError(null);

        const result = await fetchTaxonomyStats(
          environment,
          level,
          filters
        );
        
        setStats(result);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMessage);
        console.error('Error loading stats:', err);
      } finally {
        setIsLoadingStats(false);
      }
    };

    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [environment, level, filtersKey, refetchTrigger, fetchStats]);

  // Refetch function
  const refetch = useCallback(() => {
    setRefetchTrigger(prev => prev + 1);
  }, []);

  // Clear cache function
  const clearCache = useCallback(() => {
    if (environment) {
      clearTaxonomyCacheForEnvironment(environment);
      refetch();
    }
  }, [environment, refetch]);

  // Combined loading state
  const isLoading = isLoadingSamples || isLoadingAggregated || isLoadingStats;

  return {
    sampleData,
    aggregatedData,
    stats,
    isLoading,
    isLoadingSamples,
    isLoadingAggregated,
    isLoadingStats,
    error,
    refetch,
    clearCache,
  };
}

/**
 * Hook for fetching unique values (for cascading filters)
 */
export function useOptimizedTaxonomyUniqueValues(
  environment: string | null,
  level: TaxonomicLevel,
  parentFilters?: TaxonomyFilters
): {
  values: string[];
  isLoading: boolean;
  error: string | null;
} {
  const [values, setValues] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const filtersKey = parentFilters ? JSON.stringify(parentFilters) : '';

  useEffect(() => {
    if (!environment) {
      setValues([]);
      return;
    }

    const loadValues = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const result = await fetchTaxonomyUniqueValues(
          environment,
          level,
          parentFilters
        );
        
        setValues(result);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMessage);
        console.error('Error loading unique values:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadValues();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [environment, level, filtersKey]);

  return { values, isLoading, error };
}
