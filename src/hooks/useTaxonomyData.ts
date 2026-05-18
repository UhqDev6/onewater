/**
 * Custom hook for fetching and managing taxonomy data
 */

import { useState, useEffect } from 'react';
import { fetchTaxonomyData, type TaxonomyFilters } from '@/services/taxonomyService';
import type { TaxonomyMeasurement } from '@/lib/supabase';

interface UseTaxonomyDataResult {
  data: TaxonomyMeasurement[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useTaxonomyData(
  environment: string | null,
  filters?: TaxonomyFilters
): UseTaxonomyDataResult {
  const [data, setData] = useState<TaxonomyMeasurement[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  // Serialize filters to avoid infinite loop
  const filtersKey = filters ? JSON.stringify(filters) : '';

  useEffect(() => {
    const loadData = async () => {
      if (!environment) {
        setData([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const result = await fetchTaxonomyData(environment, filters);
        setData(result);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMessage);
        console.error('Error loading taxonomy data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [environment, filtersKey, refetchTrigger]);

  const refetch = () => {
    setRefetchTrigger(prev => prev + 1);
  };

  return { data, isLoading, error, refetch };
}
