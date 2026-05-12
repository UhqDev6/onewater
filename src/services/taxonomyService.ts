/**
 * Taxonomy Service
 * Handles fetching and processing taxonomy measurement data from Supabase
 */

import { supabase, isSupabaseAvailable, type TaxonomyMeasurement } from '@/lib/supabase';

export interface TaxonomyFilters {
  domain?: string;
  phylum?: string;
  class?: string;
  order?: string;
  family?: string;
  genus?: string;
  startDate?: string;
  endDate?: string;
}

export interface TaxonomyAggregation {
  label: string;
  value: number;
  percentage: number;
}

/**
 * Fetch taxonomy measurements for a specific environment (site)
 * Uses pagination to fetch all data if more than 1000 records
 */
export async function fetchTaxonomyData(
  environment: string,
  filters?: TaxonomyFilters
): Promise<TaxonomyMeasurement[]> {
  // Return empty array if Supabase not configured
  if (!isSupabaseAvailable() || !supabase) {
    console.warn('Supabase not configured, returning empty taxonomy data');
    return [];
  }

  console.log('fetchTaxonomyData called with:', { environment, filters });

  try {
    const allData: TaxonomyMeasurement[] = [];
    let hasMore = true;
    let page = 0;
    const pageSize = 1000; // Supabase default limit

    while (hasMore) {
      let query = supabase
        .from('taxonomy_measurements')
        .select('*', { count: 'exact' })
        .eq('environment', environment);

      // Apply filters
      if (filters?.domain) query = query.eq('domain', filters.domain);
      if (filters?.phylum) query = query.eq('phylum', filters.phylum);
      if (filters?.class) query = query.eq('class', filters.class);
      if (filters?.order) query = query.eq('order_tax', filters.order);
      if (filters?.family) query = query.eq('family', filters.family);
      if (filters?.genus) query = query.eq('genus', filters.genus);

      // Apply date range filter
      if (filters?.startDate) {
        query = query.gte('observation_date', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('observation_date', filters.endDate);
      }

      // Order by sample_id first for better distribution
      query = query.order('sample_id', { ascending: true });
      query = query.order('observation_date', { ascending: false });

      // Apply pagination
      query = query.range(page * pageSize, (page + 1) * pageSize - 1);

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching taxonomy data:', error);
        throw new Error(`Failed to fetch taxonomy data: ${error.message}`);
      }

      if (data && data.length > 0) {
        allData.push(...data);
        
        // Check if there's more data
        if (count && allData.length < count) {
          page++;
        } else {
          hasMore = false;
        }
      } else {
        hasMore = false;
      }

      // Safety check: prevent infinite loop
      if (page > 50) {
        console.warn('Reached maximum pagination limit (50 pages)');
        hasMore = false;
      }
    }

    console.log('fetchTaxonomyData result:', { 
      count: allData.length, 
      uniqueSamples: [...new Set(allData.map(d => d.sample_id))].length,
      sampleIds: [...new Set(allData.map(d => d.sample_id))].slice(0, 20)
    });
    
    return allData;
  } catch (error) {
    console.error('Taxonomy service error:', error);
    return [];
  }
}

/**
 * Get unique values for a specific taxonomic level
 */
export async function getUniqueTaxonomicValues(
  environment: string,
  level: 'domain' | 'phylum' | 'class' | 'order_tax' | 'family' | 'genus',
  parentFilters?: TaxonomyFilters
): Promise<string[]> {
  if (!isSupabaseAvailable() || !supabase) {
    return [];
  }

  try {
    let query = supabase
      .from('taxonomy_measurements')
      .select(level)
      .eq('environment', environment);

    // Apply parent filters for cascading
    if (parentFilters?.domain) query = query.eq('domain', parentFilters.domain);
    if (parentFilters?.phylum) query = query.eq('phylum', parentFilters.phylum);
    if (parentFilters?.class) query = query.eq('class', parentFilters.class);
    if (parentFilters?.order) query = query.eq('order_tax', parentFilters.order);
    if (parentFilters?.family) query = query.eq('family', parentFilters.family);

    const { data, error } = await query;

    if (error) {
      console.error(`Error fetching unique ${level} values:`, error);
      return [];
    }

    // Extract unique non-null values
    const uniqueValues = [...new Set(
      data
        .map(item => {
          // Type-safe access to the level property
          const value = item[level as keyof typeof item];
          return value;
        })
        .filter(value => value !== null && value !== undefined && value !== '')
    )].sort();

    return uniqueValues as string[];
  } catch (error) {
    console.error(`Get unique ${level} values error:`, error);
    return [];
  }
}

/**
 * Aggregate taxonomy data by a specific level
 */
export function aggregateByLevel(
  data: TaxonomyMeasurement[],
  level: 'domain' | 'phylum' | 'class' | 'order_tax' | 'family' | 'genus'
): TaxonomyAggregation[] {
  if (!data || data.length === 0) {
    return [];
  }

  // Group by level and sum abundance
  const grouped = data.reduce((acc, item) => {
    // Type-safe access to the level property
    const levelValue = item[level as keyof typeof item];
    const key = (typeof levelValue === 'string' ? levelValue : null) || 'Unknown';
    if (!acc[key]) {
      acc[key] = 0;
    }
    acc[key] += item.abundance_value;
    return acc;
  }, {} as Record<string, number>);

  // Calculate total for percentage
  const total = Object.values(grouped).reduce((sum, val) => sum + val, 0);

  // Convert to array and calculate percentages
  const aggregated = Object.entries(grouped).map(([label, value]) => ({
    label,
    value: Math.round(value * 100) / 100, // Round to 2 decimals
    percentage: total > 0 ? Math.round((value / total) * 10000) / 100 : 0, // Round to 2 decimals
  }));

  // Sort by value descending
  return aggregated.sort((a, b) => b.value - a.value);
}

/**
 * Get date range from taxonomy data
 */
export function getDateRange(data: TaxonomyMeasurement[]): { min: string; max: string } | null {
  if (!data || data.length === 0) {
    return null;
  }

  const dates = data.map(item => new Date(item.observation_date).getTime());
  const minDate = new Date(Math.min(...dates));
  const maxDate = new Date(Math.max(...dates));

  return {
    min: minDate.toISOString().split('T')[0],
    max: maxDate.toISOString().split('T')[0],
  };
}
