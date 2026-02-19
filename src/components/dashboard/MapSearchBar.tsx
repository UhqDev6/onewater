'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { NormalizedWaterQualityData } from '@/lib/types';
import { getQualityColor } from '@/lib/utils/dataHelpers';

interface MapSearchBarProps {
  locations: NormalizedWaterQualityData[];
  onLocationSelect: (location: NormalizedWaterQualityData) => void;
  placeholder?: string;
}

export default function MapSearchBar({ 
  locations, 
  onLocationSelect,
  placeholder = "Search location to fly to..."
}: MapSearchBarProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter locations based on search query
  const filteredLocations = useMemo(() => {
    if (!query.trim()) return [];
    return locations.filter(loc => 
      loc.location.name.toLowerCase().includes(query.toLowerCase()) ||
      (loc.location.region?.toLowerCase().includes(query.toLowerCase()) ?? false)
    ).slice(0, 8); // Limit to 8 results
  }, [query, locations]);

  // Handle selecting a location
  const handleSelectLocation = useCallback((location: NormalizedWaterQualityData) => {
    onLocationSelect(location);
    setQuery(location.location.name);
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.blur();
  }, [onLocationSelect]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen || filteredLocations.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredLocations.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredLocations.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredLocations.length) {
          handleSelectLocation(filteredLocations[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  }, [isOpen, filteredLocations, highlightedIndex, handleSelectLocation]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setIsOpen(true);
    setHighlightedIndex(-1);
  };

  const handleClear = () => {
    setQuery('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div className="relative">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg 
            className="h-5 w-5 text-gray-400" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
            />
          </svg>
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => query && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-lg 
                     text-sm text-gray-900 placeholder-gray-500
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     shadow-sm transition-all"
        />

        {/* Clear button */}
        {query && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Fly indicator icon */}
        {!query && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <svg 
              className="h-4 w-4 text-gray-300" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" 
              />
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" 
              />
            </svg>
          </div>
        )}
      </div>

      {/* Dropdown Results */}
      {isOpen && filteredLocations.length > 0 && (
        <div 
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg 
                     max-h-80 overflow-y-auto"
        >
          <div className="py-1">
            {filteredLocations.map((location, index) => (
              <button
                key={location.location.id}
                onClick={() => handleSelectLocation(location)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-colors
                  ${highlightedIndex === index ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
              >
                {/* Quality indicator dot */}
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: getQualityColor(location.latestReading.qualityRating) }}
                />
                
                {/* Location info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {location.location.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {location.location.region}, {location.location.state}
                  </p>
                </div>

                {/* Fly to icon */}
                <svg 
                  className={`w-4 h-4 flex-shrink-0 transition-colors
                    ${highlightedIndex === index ? 'text-blue-500' : 'text-gray-300'}`}
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" 
                  />
                </svg>
              </button>
            ))}
          </div>
          
          {/* Help text */}
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-[10px] font-mono">↑↓</kbd>
              <span>to navigate</span>
              <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-[10px] font-mono ml-1">Enter</kbd>
              <span>to fly</span>
            </p>
          </div>
        </div>
      )}

      {/* No results message */}
      {isOpen && query && filteredLocations.length === 0 && (
        <div 
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4"
        >
          <div className="text-center">
            <svg className="mx-auto h-8 w-8 text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-gray-500">No locations found</p>
            <p className="text-xs text-gray-400 mt-1">Try a different search term</p>
          </div>
        </div>
      )}
    </div>
  );
}
