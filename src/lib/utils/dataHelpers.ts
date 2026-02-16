/**
 * Utility functions for data normalization and transformation
 */

import {
  BeachLocation,
  EnterococciRecord,
  NormalizedWaterQualityData,
  WaterQualityFilters,
  TimeSeriesDataPoint,
} from '@/lib/types';

/**
 * Merge data from multiple sources into a unified dataset
 */
export function mergeMultiSourceData(
  datasets: NormalizedWaterQualityData[][]
): NormalizedWaterQualityData[] {
  return datasets.flat().sort((a, b) => a.location.name.localeCompare(b.location.name));
}

/**
 * Filter water quality data based on provided filters
 */
export function filterWaterQualityData(
  data: NormalizedWaterQualityData[],
  filters: WaterQualityFilters
): NormalizedWaterQualityData[] {
  return data.filter((item) => {
    // State filter
    if (filters.states && filters.states.length > 0) {
      if (!filters.states.includes(item.location.state)) {
        return false;
      }
    }

    // Region filter
    if (filters.regions && filters.regions.length > 0) {
      if (!item.location.region || !filters.regions.includes(item.location.region)) {
        return false;
      }
    }

    // Beach type filter
    if (filters.beachTypes && filters.beachTypes.length > 0) {
      if (!item.location.beachType || !filters.beachTypes.includes(item.location.beachType)) {
        return false;
      }
    }

    // Quality rating filter
    if (filters.qualityRatings && filters.qualityRatings.length > 0) {
      if (!filters.qualityRatings.includes(item.latestReading.qualityRating)) {
        return false;
      }
    }

    // Date range filter
    if (filters.dateRange) {
      const readingDate = new Date(item.latestReading.sampleDate);
      const startDate = new Date(filters.dateRange.start);
      const endDate = new Date(filters.dateRange.end);

      if (readingDate < startDate || readingDate > endDate) {
        return false;
      }
    }

    // Source filter
    if (filters.sources && filters.sources.length > 0) {
      if (!filters.sources.includes(item.latestReading.source)) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Transform records into time series data for charts
 */
export function transformToTimeSeriesData(
  records: EnterococciRecord[],
  location: BeachLocation
): TimeSeriesDataPoint[] {
  return records
    .sort((a, b) => new Date(a.sampleDate).getTime() - new Date(b.sampleDate).getTime())
    .map((record) => ({
      date: record.sampleDate,
      value: record.enterococciValue,
      locationId: location.id,
      locationName: location.name,
    }));
}

/**
 * Calculate trend direction (improving, stable, declining)
 */
export function calculateTrend(records: EnterococciRecord[]): 'improving' | 'stable' | 'declining' {
  if (records.length < 2) return 'stable';

  const sortedRecords = [...records].sort(
    (a, b) => new Date(a.sampleDate).getTime() - new Date(b.sampleDate).getTime()
  );

  const recentHalf = sortedRecords.slice(Math.floor(sortedRecords.length / 2));
  const olderHalf = sortedRecords.slice(0, Math.floor(sortedRecords.length / 2));

  const recentAvg =
    recentHalf.reduce((sum, r) => sum + r.enterococciValue, 0) / recentHalf.length;
  const olderAvg = olderHalf.reduce((sum, r) => sum + r.enterococciValue, 0) / olderHalf.length;

  const percentageChange = ((recentAvg - olderAvg) / olderAvg) * 100;

  if (percentageChange < -10) return 'improving'; // Values decreasing = improving water quality
  if (percentageChange > 10) return 'declining';
  return 'stable';
}

/**
 * Format date to readable string
 */
export function formatDate(dateString: string, format: 'short' | 'long' = 'short'): string {
  const date = new Date(dateString);

  if (format === 'long') {
    return date.toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  return date.toLocaleDateString('en-AU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Get color for water quality rating
 */
export function getQualityColor(rating: EnterococciRecord['qualityRating']): string {
  const colors = {
    excellent: '#10b981', // green-500 (legacy, not used by NSW)
    good: '#3b82f6', // blue-500
    fair: '#eab308', // yellow-500
    poor: '#ef4444', // red-500
    bad: '#991b1b', // red-800
    very_poor: '#dc2626', // red-600 (legacy)
    unknown: '#6b7280', // gray-500
  };

  return colors[rating] || colors.unknown;
}

/**
 * Get label for water quality rating
 */
export function getQualityLabel(rating: EnterococciRecord['qualityRating']): string {
  const labels = {
    excellent: 'Excellent',
    good: 'Good',
    fair: 'Fair',
    poor: 'Poor',
    bad: 'Bad',
    very_poor: 'Very Poor',
    unknown: 'Unknown',
  };

  return labels[rating] || labels.unknown;
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Group data by state
 */
export function groupByState(
  data: NormalizedWaterQualityData[]
): Record<string, NormalizedWaterQualityData[]> {
  return data.reduce((acc, item) => {
    const state = item.location.state;
    if (!acc[state]) {
      acc[state] = [];
    }
    acc[state].push(item);
    return acc;
  }, {} as Record<string, NormalizedWaterQualityData[]>);
}

/**
 * Get summary statistics across all locations
 */
export function getSummaryStatistics(data: NormalizedWaterQualityData[]) {
  const totalLocations = data.length;
  const qualityDistribution = data.reduce((acc, item) => {
    const rating = item.latestReading.qualityRating;
    acc[rating] = (acc[rating] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const averageEnterococcus =
    data.reduce((sum, item) => sum + item.latestReading.enterococciValue, 0) / totalLocations;

  return {
    totalLocations,
    qualityDistribution,
    averageEnterococcus,
    excellentPercentage: ((qualityDistribution.excellent || 0) / totalLocations) * 100,
    goodOrBetterPercentage:
      (((qualityDistribution.excellent || 0) + (qualityDistribution.good || 0)) /
        totalLocations) *
      100,
  };
}
