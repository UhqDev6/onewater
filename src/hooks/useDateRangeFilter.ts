/**
 * Custom hook for date range filtering
 * Reusable across different components that need date filtering
 */

import { useState, useMemo } from 'react';

export interface DateRange {
  startDate: string; // ISO date string (YYYY-MM-DD)
  endDate: string;   // ISO date string (YYYY-MM-DD)
}

export interface UseDateRangeFilterOptions {
  defaultStartDate?: string;
  defaultEndDate?: string;
}

export interface UseDateRangeFilterResult {
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  setStartDate: (date: string) => void;
  setEndDate: (date: string) => void;
  resetDateRange: () => void;
  isDateInRange: (date: string) => boolean;
  filterDataByDateRange: <T>(
    data: T[],
    getDateFromItem: (item: T) => string
  ) => T[];
}

/**
 * Hook for managing date range filtering
 */
export function useDateRangeFilter(
  options: UseDateRangeFilterOptions = {}
): UseDateRangeFilterResult {
  const {
    defaultStartDate = '2024-01-01',
    defaultEndDate = '2024-12-31',
  } = options;

  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: defaultStartDate,
    endDate: defaultEndDate,
  });

  const setStartDate = (date: string) => {
    setDateRange(prev => ({ ...prev, startDate: date }));
  };

  const setEndDate = (date: string) => {
    setDateRange(prev => ({ ...prev, endDate: date }));
  };

  const resetDateRange = () => {
    setDateRange({
      startDate: defaultStartDate,
      endDate: defaultEndDate,
    });
  };

  const isDateInRange = useMemo(() => {
    return (date: string): boolean => {
      const checkDate = new Date(date);
      const start = new Date(dateRange.startDate);
      const end = new Date(dateRange.endDate);
      
      return checkDate >= start && checkDate <= end;
    };
  }, [dateRange]);

  const filterDataByDateRange = useMemo(() => {
    return <T>(data: T[], getDateFromItem: (item: T) => string): T[] => {
      return data.filter(item => {
        const itemDate = getDateFromItem(item);
        return isDateInRange(itemDate);
      });
    };
  }, [isDateInRange]);

  return {
    dateRange,
    setDateRange,
    setStartDate,
    setEndDate,
    resetDateRange,
    isDateInRange,
    filterDataByDateRange,
  };
}