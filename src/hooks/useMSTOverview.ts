/**
 * Hook for fetching MST overview data for landing page
 * Aggregates MST data across all locations to show global pollution source distribution
 * Supports both faecal and microbial community data
 */

import { useState, useEffect } from 'react';
import { supabase, isSupabaseAvailable } from '@/lib/supabase';

export type MSTDataSource = 'faecal' | 'microbial';

export interface MSTSourceData {
  name: string;
  median: number;
  color: string;
}

export interface MSTCategoryData {
  category: string;
  sources: MSTSourceData[];
}

export interface MSTOverviewData {
  pollutionSources: MSTCategoryData[];
  totalSamples: number;
  dataSource: MSTDataSource;
  isLoading: boolean;
  error: string | null;
}

export function useMSTOverview(dataSource: MSTDataSource = 'faecal'): MSTOverviewData {
  const [mstData, setMstData] = useState<MSTOverviewData>({
    pollutionSources: [],
    totalSamples: 0,
    dataSource,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const fetchMSTOverview = async () => {
      if (!isSupabaseAvailable() || !supabase) {
        // Fallback to mock data if Supabase not available
        setMstData({
          pollutionSources: getMockMSTData(),
          totalSamples: 0,
          dataSource,
          isLoading: false,
          error: null,
        });
        return;
      }

      try {
        setMstData(prev => ({ ...prev, isLoading: true, error: null }));

        // Select table based on data source
        const tableName = dataSource === 'faecal' 
          ? 'faecal_community_contribution' 
          : 'microbial_community_contribution';

        console.log(`Fetching from table: ${tableName}`);

        // For now, filter by Frankston Beach (the site with complete data)
        // TODO: When all sites have data, remove this filter to show global overview
        const { data: mstTableData, error } = await supabase
          .from(tableName)
          .select('*')
          .eq('site', 'Frankston_Beach')
          .order('sampling_date', { ascending: true }); // Add order to match dashboard

        console.log(`Fetched ${mstTableData?.length || 0} rows from ${tableName} for Frankston Beach`);
        
        // Debug: Log first sample to see actual data structure
        if (mstTableData && mstTableData.length > 0) {
          console.log('First sample from database:', mstTableData[0]);
          console.log('human_pct in first sample:', mstTableData[0].human_pct);
        }

        if (error) {
          console.error(`Error fetching from ${tableName}:`, error);
          throw error;
        }

        if (!mstTableData || mstTableData.length === 0) {
          // Use mock data if no real data available
          setMstData({
            pollutionSources: getMockMSTData(),
            totalSamples: 0,
            dataSource,
            isLoading: false,
            error: null,
          });
          return;
        }

        // Calculate median values for each source
        const sourceMedians = calculateSourceMedians(mstTableData);
        
        console.log(`MST Overview (${dataSource}):`, {
          tableName,
          sampleCount: mstTableData.length,
          medians: sourceMedians,
          firstSample: mstTableData[0],
        });
        
        // Organize into categories
        const pollutionSources = organizeMSTSources(sourceMedians);
        
        console.log(`MST Overview organized (${dataSource}):`, {
          categories: pollutionSources.map(cat => ({
            category: cat.category,
            sourceCount: cat.sources.length,
            sources: cat.sources.map(s => ({ name: s.name, median: s.median }))
          }))
        });

        setMstData({
          pollutionSources,
          totalSamples: mstTableData.length,
          dataSource,
          isLoading: false,
          error: null,
        });

      } catch (error) {
        console.error('Error fetching MST overview:', error);
        
        // Fallback to mock data on error
        setMstData({
          pollutionSources: getMockMSTData(),
          totalSamples: 0,
          dataSource,
          isLoading: false,
          error: null, // Don't show error, just use mock data
        });
      }
    };

    fetchMSTOverview();
  }, [dataSource]); // Re-fetch when data source changes

  return mstData;
}

/**
 * Calculate median values for each MST source across all samples
 * Dynamically finds all columns ending with _pct
 */
function calculateSourceMedians(data: Record<string, unknown>[]): Record<string, number> {
  if (data.length === 0) return {};

  // Get all column names from first row
  const firstRow = data[0];
  const sourceColumns = Object.keys(firstRow).filter(key => key.endsWith('_pct'));

  console.log('Found _pct columns:', sourceColumns);
  console.log('Total samples:', data.length);

  const medians: Record<string, number> = {};

  sourceColumns.forEach(column => {
    const values = data
      .map(row => row[column])
      .filter((val): val is number => {
        return typeof val === 'number' && !isNaN(val);
      })
      .sort((a, b) => a - b);

    // Debug: Show actual values for human_pct
    if (column === 'human_pct') {
      console.log(`[human_pct] ALL VALUES (${values.length}):`, values);
      const nonZeroValues = values.filter(v => v > 0);
      console.log(`[human_pct] NON-ZERO VALUES (${nonZeroValues.length}):`, nonZeroValues);
    }

    if (values.length > 0) {
      // IMPORTANT: Calculate median from NON-ZERO values only
      // This matches the dashboard behavior where we ignore zero contributions
      const nonZeroValues = values.filter(v => v > 0);
      
      if (nonZeroValues.length > 0) {
        const mid = Math.floor(nonZeroValues.length / 2);
        const median = nonZeroValues.length % 2 === 0 
          ? (nonZeroValues[mid - 1] + nonZeroValues[mid]) / 2 
          : nonZeroValues[mid];
        
        medians[column] = Math.round(median * 100) / 100; // Round to 2 decimal places
        
        // Debug key columns
        if (column === 'human_pct' || column === 'non_significant_contribution_pct') {
          console.log(`[${column}] Median from NON-ZERO: ${medians[column]}% (from ${nonZeroValues.length} non-zero values, mid index: ${mid})`);
        }
      } else {
        // All values are 0
        medians[column] = 0;
      }
    }
  });

  return medians;
}

/**
 * Organize MST sources into categories with colors
 * Dynamically handles all sources found in data
 * Includes sources with median > 0
 */
function organizeMSTSources(sourceMedians: Record<string, number>): MSTCategoryData[] {
  // Define color palette for sources
  const colorPalette = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
    '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
    '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
    '#ec4899', '#f43f5e'
  ];

  const categories: MSTCategoryData[] = [
    {
      category: 'Human Sources',
      sources: [],
    },
    {
      category: 'Animal Sources', 
      sources: [],
    },
    {
      category: 'Natural & Other',
      sources: [],
    },
  ];

  let colorIndex = 0;

  // Get all entries sorted by median (descending) to assign colors properly
  const sortedEntries = Object.entries(sourceMedians)
    .filter(([, median]) => median > 0)
    .sort(([, a], [, b]) => b - a);

  console.log('Sources with median > 0:', sortedEntries.map(([key, median]) => `${key}: ${median}%`));

  // Process all sources with median > 0
  sortedEntries.forEach(([key, median]) => {
    // Convert key to readable name (e.g., human_pct -> Human)
    const name = key
      .replace('_pct', '')
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    const sourceData: MSTSourceData = {
      name,
      median,
      color: colorPalette[colorIndex % colorPalette.length],
    };

    colorIndex++;

    // Categorize sources
    if (key === 'human_pct' || key === 'sewage_pct') {
      categories[0].sources.push(sourceData);
    } else if (key === 'non_significant_contribution_pct') {
      categories[2].sources.push(sourceData);
    } else {
      // All other animal sources
      categories[1].sources.push(sourceData);
    }
  });

  // Sort sources within each category by median value (descending)
  categories.forEach(category => {
    category.sources.sort((a, b) => b.median - a.median);
  });

  console.log('Organized categories:', categories.map(cat => ({
    category: cat.category,
    sourceCount: cat.sources.length,
    sources: cat.sources.map(s => ({ name: s.name, median: s.median }))
  })));

  return categories;
}

/**
 * Fallback mock data when real data is not available
 */
function getMockMSTData(): MSTCategoryData[] {
  return [
    {
      category: 'Human Sources',
      sources: [
        { name: 'Human', median: 15.2, color: '#ef4444' },
      ],
    },
    {
      category: 'Animal Sources',
      sources: [
        { name: 'Bird', median: 18.3, color: '#f97316' },
        { name: 'Ruminant', median: 12.4, color: '#f59e0b' },
        { name: 'Dog', median: 9.1, color: '#eab308' },
        { name: 'Cow', median: 7.8, color: '#84cc16' },
        { name: 'Duck', median: 4.2, color: '#22c55e' },
        { name: 'Gull', median: 3.9, color: '#10b981' },
        { name: 'Sheep', median: 2.1, color: '#14b8a6' },
        { name: 'Horse', median: 1.8, color: '#06b6d4' },
      ],
    },
    {
      category: 'Natural & Other',
      sources: [
        { name: 'Non Significant Contribution', median: 16.5, color: '#6b7280' },
      ],
    },
  ];
}