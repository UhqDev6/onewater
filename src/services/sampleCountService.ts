/**
 * Sample Count Service
 * Calculates real total data points from database
 */

import { supabase, isSupabaseAvailable } from '@/lib/supabase';

export interface SampleCountData {
  totalSamples: number;
  faecalSamples: number;
  microbialSamples: number;
  taxonomicSamples: number;
}

/**
 * Get total count of samples from all tables
 */
export async function getTotalSampleCount(): Promise<SampleCountData> {
  if (!isSupabaseAvailable() || !supabase) {
    console.warn('Supabase not configured, returning zero counts');
    return {
      totalSamples: 0,
      faecalSamples: 0,
      microbialSamples: 0,
      taxonomicSamples: 0,
    };
  }

  try {
    // Count faecal community samples
    const { count: faecalCount, error: faecalError } = await supabase
      .from('faecal_community_contribution')
      .select('sample_id', { count: 'exact', head: true });

    if (faecalError) {
      console.error('Error counting faecal samples:', faecalError);
    }

    // Count microbial community samples
    const { count: microbialCount, error: microbialError } = await supabase
      .from('microbial_community_contribution')
      .select('sample_id', { count: 'exact', head: true });

    if (microbialError) {
      console.error('Error counting microbial samples:', microbialError);
    }

    // Count taxonomic samples
    const { count: taxonomicCount, error: taxonomicError } = await supabase
      .from('taxonomy_measurements')
      .select('sample_id', { count: 'exact', head: true });

    if (taxonomicError) {
      console.error('Error counting taxonomic samples:', taxonomicError);
    }

    const faecalSamples = faecalCount || 0;
    const microbialSamples = microbialCount || 0;
    const taxonomicSamples = taxonomicCount || 0;

    // Total unique samples (use the maximum as they should represent same samples)
    const totalSamples = Math.max(faecalSamples, microbialSamples, taxonomicSamples);

    console.log('Sample counts from database:', {
      faecalSamples,
      microbialSamples,
      taxonomicSamples,
      totalSamples,
    });

    return {
      totalSamples,
      faecalSamples,
      microbialSamples,
      taxonomicSamples,
    };

  } catch (error) {
    console.error('Error getting sample counts:', error);
    return {
      totalSamples: 0,
      faecalSamples: 0,
      microbialSamples: 0,
      taxonomicSamples: 0,
    };
  }
}

/**
 * Get unique sample count (distinct sample_id across all tables)
 */
export async function getUniqueSampleCount(): Promise<number> {
  if (!isSupabaseAvailable() || !supabase) {
    return 0;
  }

  try {
    // Get unique sample IDs from faecal table
    const { data: faecalData, error: faecalError } = await supabase
      .from('faecal_community_contribution')
      .select('sample_id');

    if (faecalError) {
      console.error('Error fetching faecal sample IDs:', faecalError);
      return 0;
    }

    // Get unique sample IDs
    const uniqueSampleIds = new Set(faecalData?.map(row => row.sample_id) || []);
    
    return uniqueSampleIds.size;

  } catch (error) {
    console.error('Error getting unique sample count:', error);
    return 0;
  }
}