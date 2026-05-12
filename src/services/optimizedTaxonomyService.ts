/**
 * Optimized Taxonomy Service with Server-Side Aggregation & Client-Side Caching
 * 
 * Features:
 * - Server-side aggregation via RPC (reduces 20k rows to ~50 rows)
 * - Client-side caching (prevents redundant requests)
 * - Debouncing (reduces database request count)
 * - Chunked fetching fallback (for raw data if needed)
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
  sampleCount?: number;
}

export interface TaxonomyStats {
  totalSamples: number;
  totalTaxa: number;
  dominantTaxon: string;
  shannonIndex: number;
}

// ============================================================================
// CLIENT-SIDE CACHE
// ============================================================================
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  key: string;
}

class TaxonomyCache {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes

  generateKey(prefix: string, params: Record<string, unknown>): string {
    return `${prefix}:${JSON.stringify(params)}`;
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > this.TTL;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      key,
    });
  }

  clear(): void {
    this.cache.clear();
  }

  clearByPrefix(prefix: string): void {
    Array.from(this.cache.keys())
      .filter(key => key.startsWith(prefix))
      .forEach(key => this.cache.delete(key));
  }
}

const cache = new TaxonomyCache();

// ============================================================================
// DEBOUNCING UTILITY
// ============================================================================
const debounceTimers: Map<string, NodeJS.Timeout> = new Map();

function debounce<T>(
  key: string,
  fn: () => Promise<T>,
  delay: number = 500
): Promise<T> {
  return new Promise((resolve, reject) => {
    // Clear existing timer
    const existingTimer = debounceTimers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new timer
    const timer = setTimeout(async () => {
      try {
        const result = await fn();
        resolve(result);
      } catch (error) {
        reject(error);
      } finally {
        debounceTimers.delete(key);
      }
    }, delay);

    debounceTimers.set(key, timer);
  });
}

// ============================================================================
// RPC FUNCTIONS (Server-Side Aggregation)
// ============================================================================

/**
 * Fetch aggregated taxonomy data using RPC
 * Reduces 20,000 rows to ~50 rows on server-side
 */
export async function fetchTaxonomyAggregated(
  environment: string,
  level: 'domain' | 'phylum' | 'class' | 'order_tax' | 'family' | 'genus',
  filters?: TaxonomyFilters,
  useDebounce: boolean = true
): Promise<TaxonomyAggregation[]> {
  if (!isSupabaseAvailable() || !supabase) {
    console.warn('Supabase not configured');
    return [];
  }

  // Generate cache key
  const cacheKey = cache.generateKey('aggregated', { environment, level, filters });

  // Check cache first
  const cached = cache.get<TaxonomyAggregation[]>(cacheKey);
  if (cached) {
    console.log('✅ Cache hit:', cacheKey);
    return cached;
  }

  // Debounce function
  const fetchFn = async () => {
    console.log('🔄 Fetching aggregated data via RPC:', { environment, level, filters });

    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { data, error } = await supabase.rpc('get_taxonomy_aggregated', {
        env_name: environment,
        level_name: level,
        start_date: filters?.startDate || null,
        end_date: filters?.endDate || null,
        filter_domain: filters?.domain || null,
        filter_phylum: filters?.phylum || null,
        filter_class: filters?.class || null,
        filter_order: filters?.order || null,
        filter_family: filters?.family || null,
        filter_genus: filters?.genus || null,
      });

      if (error) {
        console.warn('RPC Error (falling back to pagination method):', error);
        // Fallback to old pagination method if RPC not available
        const rawData = await fetchTaxonomyDataPaginated(environment, level, filters);
        // Aggregate the raw data client-side
        return aggregateByLevel(rawData, level);
      }

      const result: TaxonomyAggregation[] = (data || []).map((row: {
        taxon_name: string;
        total_abundance: number;
        percentage: number;
        sample_count: number;
      }) => ({
        label: row.taxon_name,
        value: row.total_abundance,
        percentage: row.percentage,
        sampleCount: row.sample_count,
      }));

      // Cache result
      cache.set(cacheKey, result);
      console.log('✅ Cached result:', cacheKey, `(${result.length} rows)`);

      return result;
    } catch (error) {
      console.error('Error fetching aggregated taxonomy:', error);
      return [];
    }
  };

  // Use debouncing if enabled
  if (useDebounce) {
    return debounce(cacheKey, fetchFn);
  }

  return fetchFn();
}

/**
 * Fetch taxonomy data by sample (for stacked bar chart)
 * Uses RPC to get only top N taxa
 */
export async function fetchTaxonomyBySample(
  environment: string,
  level: 'domain' | 'phylum' | 'class' | 'order_tax' | 'family' | 'genus',
  filters?: TaxonomyFilters,
  topN: number = 50,
  useDebounce: boolean = true
): Promise<TaxonomyMeasurement[]> {
  if (!isSupabaseAvailable() || !supabase) {
    console.warn('Supabase not configured');
    return [];
  }

  // Generate cache key
  const cacheKey = cache.generateKey('by_sample', { environment, level, filters, topN });

  // Check cache first
  const cached = cache.get<TaxonomyMeasurement[]>(cacheKey);
  if (cached) {
    console.log('✅ Cache hit:', cacheKey);
    return cached;
  }

  // Debounce function
  const fetchFn = async () => {
    console.log('🔄 Fetching sample data via RPC:', { environment, level, filters, topN });

    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { data, error } = await supabase.rpc('get_taxonomy_by_sample', {
        env_name: environment,
        level_name: level,
        start_date: filters?.startDate || null,
        end_date: filters?.endDate || null,
        filter_domain: filters?.domain || null,
        filter_phylum: filters?.phylum || null,
        filter_class: filters?.class || null,
        filter_order: filters?.order || null,
        filter_family: filters?.family || null,
        filter_genus: filters?.genus || null,
        top_n: topN,
      });

      if (error) {
        console.warn('RPC Error (falling back to pagination method):', error);
        // Fallback to old pagination method if RPC not available
        const rawData = await fetchTaxonomyDataPaginated(environment, level, filters);
        // Filter to top N
        const aggregated = aggregateByLevel(rawData, level);
        const topTaxa = aggregated.slice(0, topN).map(a => a.label);
        return rawData.filter(item => topTaxa.includes(item[level] || 'Unknown'));
      }

      const result = data || [];

      // Cache result
      cache.set(cacheKey, result);
      console.log('✅ Cached result:', cacheKey, `(${result.length} rows)`);

      return result;
    } catch (error) {
      console.error('Error fetching taxonomy by sample:', error);
      return [];
    }
  };

  // Use debouncing if enabled
  if (useDebounce) {
    return debounce(cacheKey, fetchFn);
  }

  return fetchFn();
}

/**
 * Fetch unique values for cascading filters
 */
export async function fetchTaxonomyUniqueValues(
  environment: string,
  level: 'domain' | 'phylum' | 'class' | 'order_tax' | 'family' | 'genus',
  parentFilters?: TaxonomyFilters
): Promise<string[]> {
  if (!isSupabaseAvailable() || !supabase) {
    return [];
  }

  // Generate cache key
  const cacheKey = cache.generateKey('unique', { environment, level, parentFilters });

  // Check cache first
  const cached = cache.get<string[]>(cacheKey);
  if (cached) {
    console.log('✅ Cache hit:', cacheKey);
    return cached;
  }

  console.log('🔄 Fetching unique values via RPC:', { environment, level });

  try {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await supabase.rpc('get_taxonomy_unique_values', {
      env_name: environment,
      level_name: level,
      filter_domain: parentFilters?.domain || null,
      filter_phylum: parentFilters?.phylum || null,
      filter_class: parentFilters?.class || null,
      filter_order: parentFilters?.order || null,
      filter_family: parentFilters?.family || null,
    });

    if (error) {
      console.warn('RPC Error (falling back to direct query):', error);
      // Fallback to direct query if RPC not available
      return await fetchUniqueValuesDirectly(environment, level, parentFilters);
    }

    const result = (data || []).map((row: { value: string }) => row.value);

    // Cache result
    cache.set(cacheKey, result);
    console.log('✅ Cached result:', cacheKey, `(${result.length} values)`);

    return result;
  } catch (error) {
    console.error('Error fetching unique values, using fallback:', error);
    // Fallback to direct query
    return await fetchUniqueValuesDirectly(environment, level, parentFilters);
  }
}

/**
 * Fallback: Fetch unique values directly (without RPC)
 */
async function fetchUniqueValuesDirectly(
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
 * Fetch taxonomy statistics
 */
export async function fetchTaxonomyStats(
  environment: string,
  level: 'domain' | 'phylum' | 'class' | 'order_tax' | 'family' | 'genus',
  filters?: TaxonomyFilters
): Promise<TaxonomyStats | null> {
  if (!isSupabaseAvailable() || !supabase) {
    return null;
  }

  // Generate cache key
  const cacheKey = cache.generateKey('stats', { environment, level, filters });

  // Check cache first
  const cached = cache.get<TaxonomyStats>(cacheKey);
  if (cached) {
    console.log('✅ Cache hit:', cacheKey);
    return cached;
  }

  console.log('🔄 Fetching stats via RPC:', { environment, level });

  try {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await supabase.rpc('get_taxonomy_stats', {
      env_name: environment,
      level_name: level,
      start_date: filters?.startDate || null,
      end_date: filters?.endDate || null,
    });

    if (error) {
      console.warn('RPC Error (stats not available, will calculate client-side):', error);
      return null; // Will be calculated from aggregated data in component
    }

    if (!data || data.length === 0) return null;

    const result: TaxonomyStats = {
      totalSamples: data[0].total_samples,
      totalTaxa: data[0].total_taxa,
      dominantTaxon: data[0].dominant_taxon,
      shannonIndex: data[0].shannon_index,
    };

    // Cache result
    cache.set(cacheKey, result);
    console.log('✅ Cached result:', cacheKey);

    return result;
  } catch (error) {
    console.error('Error fetching taxonomy stats:', error);
    return null;
  }
}

// ============================================================================
// CACHE MANAGEMENT
// ============================================================================

/**
 * Clear all cache
 */
export function clearTaxonomyCache(): void {
  cache.clear();
  console.log('🗑️ Cache cleared');
}

/**
 * Clear cache for specific environment
 */
export function clearTaxonomyCacheForEnvironment(environment: string): void {
  cache.clearByPrefix(`aggregated:{"environment":"${environment}"`);
  cache.clearByPrefix(`by_sample:{"environment":"${environment}"`);
  cache.clearByPrefix(`unique:{"environment":"${environment}"`);
  cache.clearByPrefix(`stats:{"environment":"${environment}"`);
  console.log('🗑️ Cache cleared for environment:', environment);
}

// ============================================================================
// FALLBACK: Pagination Method (if RPC not available)
// ============================================================================

/**
 * Fallback: Fetch taxonomy data with pagination (old method)
 */
async function fetchTaxonomyDataPaginated(
  environment: string,
  _level: 'domain' | 'phylum' | 'class' | 'order_tax' | 'family' | 'genus',
  filters?: TaxonomyFilters
): Promise<TaxonomyMeasurement[]> {
  if (!isSupabaseAvailable() || !supabase) {
    return [];
  }

  console.log('⚠️ Using fallback pagination method');

  try {
    const allData: TaxonomyMeasurement[] = [];
    let hasMore = true;
    let page = 0;
    const pageSize = 1000;

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

    console.log('✅ Fallback pagination complete:', { count: allData.length });
    return allData;
  } catch (error) {
    console.error('Taxonomy service error:', error);
    return [];
  }
}

// ============================================================================
// LEGACY COMPATIBILITY (Fallback to old method if RPC not available)
// ============================================================================

/**
 * Aggregate taxonomy data client-side (fallback)
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
    value: Math.round(value * 100) / 100,
    percentage: total > 0 ? Math.round((value / total) * 10000) / 100 : 0,
  }));

  // Sort by value descending
  return aggregated.sort((a, b) => b.value - a.value);
}
