/**
 * MST (Microbial Source Tracking) Service
 * Handles fetching and processing MST data from Supabase
 */

import { supabase, isSupabaseAvailable } from '@/lib/supabase';

export type MSTViewMode = 'microbial' | 'faecal';

export interface MSTMicrobialData {
  sample_id: string;
  site: string;
  sampling_date: string;
  rainfall_48h_mm: number;
  enterococci_mpn_100ml: number;
  bat_pct: number;
  bird_pct: number;
  cow_pct: number;
  deer_pct: number;
  dog_pct: number;
  duck_pct: number;
  goose_pct: number;
  gull_pct: number;
  horse_pct: number;
  human_pct: number;
  pig_pct: number;
  possum_pct: number;
  rabbit_pct: number;
  rat_pct: number;
  ruminant_pct: number;
  sewage_pct: number;
  sheep_pct: number;
  wallaby_pct: number;
  wombat_pct: number;
}

export interface MSTFaecalData {
  sample_id: string;
  site: string;
  sampling_date: string;
  rainfall_48h_mm: number;
  enterococci_value: number;
  bat_pct: number;
  bird_pct: number;
  cow_pct: number;
  deer_pct: number;
  dog_pct: number;
  duck_pct: number;
  goose_pct: number;
  gull_pct: number;
  horse_pct: number;
  human_pct: number;
  pig_pct: number;
  possum_pct: number;
  rabbit_pct: number;
  rat_pct: number;
  sheep_pct: number;
  wallaby_pct: number;
  wombat_pct: number;
  non_significant_contribution_pct: number;
}

export interface MSTSourceContribution {
  name: string;
  value: number;
}

export interface MSTTrendData {
  date: string;
  enterococci: number;
  rainfall: number;
}

/**
 * Fetch microbial community contribution data
 */
export async function fetchMicrobialData(site: string): Promise<MSTMicrobialData[]> {
  if (!isSupabaseAvailable() || !supabase) {
    console.warn('Supabase not configured');
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('microbial_community_contribution')
      .select('*')
      .eq('site', site)
      .order('sampling_date', { ascending: true });

    if (error) {
      console.error('Error fetching microbial data:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Microbial service error:', error);
    return [];
  }
}

/**
 * Fetch faecal community contribution data
 */
export async function fetchFaecalData(site: string): Promise<MSTFaecalData[]> {
  if (!isSupabaseAvailable() || !supabase) {
    console.warn('Supabase not configured');
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('faecal_community_contribution')
      .select('*')
      .eq('site', site)
      .order('sampling_date', { ascending: true });

    if (error) {
      console.error('Error fetching faecal data:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Faecal service error:', error);
    return [];
  }
}

/**
 * Extract source contributions from data row
 * Dynamically extracts all columns ending with _pct
 */
export function extractSourceContributions(
  data: MSTMicrobialData | MSTFaecalData
): MSTSourceContribution[] {
  const contributions: MSTSourceContribution[] = [];

  // Get all keys that end with _pct
  Object.keys(data).forEach(key => {
    if (key.endsWith('_pct')) {
      const value = (data as unknown as Record<string, number>)[key] || 0;
      
      // Only include non-zero values
      if (value > 0) {
        // Convert key to readable name (e.g., human_pct -> Human)
        const name = key
          .replace('_pct', '')
          .split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        
        contributions.push({ name, value });
      }
    }
  });

  // Sort by value descending
  return contributions.sort((a, b) => b.value - a.value);
}

/**
 * Calculate average source contributions across all samples
 */
export function calculateAverageContributions(
  data: (MSTMicrobialData | MSTFaecalData)[]
): MSTSourceContribution[] {
  if (data.length === 0) return [];

  // Aggregate all contributions
  const aggregated: Record<string, number> = {};
  const counts: Record<string, number> = {};

  data.forEach(row => {
    Object.keys(row).forEach(key => {
      if (key.endsWith('_pct')) {
        const value = (row as unknown as Record<string, number>)[key] || 0;
        if (!aggregated[key]) {
          aggregated[key] = 0;
          counts[key] = 0;
        }
        aggregated[key] += value;
        counts[key] += 1;
      }
    });
  });

  // Calculate averages
  const contributions: MSTSourceContribution[] = [];
  Object.keys(aggregated).forEach(key => {
    const average = aggregated[key] / counts[key];
    if (average > 0) {
      const name = key
        .replace('_pct', '')
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      contributions.push({ name, value: Math.round(average * 100) / 100 });
    }
  });

  // Sort by value descending
  return contributions.sort((a, b) => b.value - a.value);
}

/**
 * Extract trend data for charts
 */
export function extractTrendData(
  data: (MSTMicrobialData | MSTFaecalData)[],
  viewMode: MSTViewMode
): MSTTrendData[] {
  return data.map(row => ({
    date: row.sampling_date,
    enterococci: viewMode === 'microbial' 
      ? (row as MSTMicrobialData).enterococci_mpn_100ml || 0
      : (row as MSTFaecalData).enterococci_value || 0,
    rainfall: row.rainfall_48h_mm || 0,
  }));
}

/**
 * Get dominant source from contributions
 */
export function getDominantSource(contributions: MSTSourceContribution[]): string {
  if (contributions.length === 0) return 'N/A';
  return contributions[0].name;
}
