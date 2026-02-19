'use client';

import { useCallback } from 'react';
import SearchBar from './SearchBar';
import AlphabetNavigation from './AlphabetNavigation';
import SortToggle from './SortToggle';

export interface GridFilterState {
  search: string;
  letter: string | null;
  sort: 'asc' | 'desc';
  region: string | null; // Future: region filter
}

interface GridFilterBarProps {
  filters: GridFilterState;
  onFiltersChange: (filters: GridFilterState) => void;
  resultCount: number;
  totalCount: number;
  loading?: boolean;
}

export default function GridFilterBar({
  filters,
  onFiltersChange,
  resultCount,
  totalCount,
  loading = false,
}: GridFilterBarProps) {
  const handleSearchChange = useCallback((search: string) => {
    onFiltersChange({
      ...filters,
      search,
      letter: null, // Clear letter filter when searching
    });
  }, [filters, onFiltersChange]);

  const handleLetterSelect = useCallback((letter: string | null) => {
    onFiltersChange({
      ...filters,
      letter,
      search: '', // Clear search when using alphabet
    });
  }, [filters, onFiltersChange]);

  const handleSortChange = useCallback((sort: 'asc' | 'desc') => {
    onFiltersChange({
      ...filters,
      sort,
    });
  }, [filters, onFiltersChange]);

  const handleClearAll = () => {
    onFiltersChange({
      search: '',
      letter: null,
      sort: 'asc',
      region: null,
    });
  };

  const hasActiveFilters = filters.search || filters.letter || filters.region;

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-4">
      {/* Header Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h3 className="text-sm font-semibold text-slate-700">Filter Locations</h3>
          {loading && (
            <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
          )}
        </div>
        <div className="flex items-center space-x-3">
          {/* Result Counter */}
          <span className="text-xs text-slate-600">
            {loading ? (
              'Loading...'
            ) : (
              <>
                <span className="font-semibold text-slate-800">{resultCount}</span>
                {' of '}
                <span className="font-semibold text-slate-800">{totalCount}</span>
                {' locations'}
              </>
            )}
          </span>
          
          {/* Clear All Button */}
          {hasActiveFilters && (
            <button
              onClick={handleClearAll}
              disabled={loading}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Search & Sort Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <SearchBar
            onSearch={handleSearchChange}
            placeholder="Search beach name..."
            disabled={loading}
            initialValue={filters.search}
          />
        </div>
        <SortToggle
          sortOrder={filters.sort}
          onSortChange={handleSortChange}
          disabled={loading}
        />
      </div>

      {/* Alphabet Navigation */}
      <AlphabetNavigation
        selectedLetter={filters.letter}
        onLetterSelect={handleLetterSelect}
        disabled={loading}
      />

      {/* Future: Region Filter Placeholder */}
      {/* 
      <div className="border-t border-slate-200 pt-3">
        <RegionFilter
          selectedRegion={filters.region}
          onRegionSelect={(region) => onFiltersChange({ ...filters, region })}
          disabled={loading}
        />
      </div>
      */}
    </div>
  );
}
