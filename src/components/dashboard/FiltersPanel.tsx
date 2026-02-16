'use client';

import { useState } from 'react';
import { WaterQualityFilters, WaterQualityRating } from '@/lib/types';

interface FiltersPanelProps {
  filters: WaterQualityFilters;
  onFiltersChange: (filters: WaterQualityFilters) => void;
}

export default function FiltersPanel({ filters, onFiltersChange }: FiltersPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleStateToggle = (state: string) => {
    const currentStates = filters.states || [];
    const newStates = currentStates.includes(state)
      ? currentStates.filter((s) => s !== state)
      : [...currentStates, state];

    onFiltersChange({ ...filters, states: newStates });
  };

  const toggleQualityFilter = (rating: string) => {
    const currentRatings = filters.qualityRatings || [];
    const typedRating = rating as WaterQualityRating;
    const newRatings = currentRatings.includes(typedRating)
      ? currentRatings.filter((r) => r !== typedRating)
      : [...currentRatings, typedRating];

    onFiltersChange({ ...filters, qualityRatings: newRatings });
  };

  const clearAllFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = 
    (filters.states && filters.states.length > 0) ||
    (filters.qualityRatings && filters.qualityRatings.length > 0);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Clear all
          </button>
        )}
      </div>

      {/* States */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-2">State</h4>
        <div className="space-y-2">
          {['NSW', 'VIC'].map((state) => (
            <label key={state} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.states?.includes(state) || false}
                onChange={() => handleStateToggle(state)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{state}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Quality Ratings */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Water Quality</h4>
        <div className="space-y-2">
          {[
            { value: 'good', label: 'Good', color: 'bg-blue-500' },
            { value: 'fair', label: 'Fair', color: 'bg-yellow-500' },
            { value: 'poor', label: 'Poor', color: 'bg-red-500' },
            { value: 'bad', label: 'Bad', color: 'bg-red-800' },
          ].map((rating) => (
            <label key={rating.value} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.qualityRatings?.includes(rating.value as WaterQualityRating) || false}
                onChange={() => toggleQualityFilter(rating.value)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div className={`w-3 h-3 rounded-full ${rating.color}`} />
              <span className="text-sm text-gray-700">{rating.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Expandable Advanced Filters */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-sm text-gray-600 hover:text-gray-900 font-medium"
      >
        {isExpanded ? '− ' : '+ '}Advanced Filters
      </button>

      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-500">Additional filters coming soon...</p>
        </div>
      )}
    </div>
  );
}
