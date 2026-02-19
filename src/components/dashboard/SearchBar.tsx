'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  disabled?: boolean;
  initialValue?: string;
  debounceMs?: number;
}

export default function SearchBar({
  onSearch,
  placeholder = 'Search beach name...',
  disabled = false,
  initialValue = '',
  debounceMs = 400,
}: SearchBarProps) {
  const [inputValue, setInputValue] = useState(initialValue);
  const debouncedValue = useDebounce(inputValue, debounceMs);
  const isFirstRender = useRef(true);
  const previousValue = useRef(debouncedValue);

  // Trigger search when debounced value changes (skip initial render)
  useEffect(() => {
    // Skip initial render to prevent infinite loop
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
    // Only call onSearch if value actually changed
    if (previousValue.current !== debouncedValue) {
      previousValue.current = debouncedValue;
      onSearch(debouncedValue);
    }
  }, [debouncedValue, onSearch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleClear = useCallback(() => {
    setInputValue('');
    onSearch('');
  }, [onSearch]);

  return (
    <div className="relative">
      {/* Search Icon */}
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg 
          className="h-4 w-4 text-gray-400" 
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

      {/* Input Field */}
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        disabled={disabled}
        placeholder={placeholder}
        className={`
          w-full pl-10 pr-10 py-2.5
          bg-white border border-gray-200 rounded-lg
          text-sm text-gray-900 placeholder-gray-500
          focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent
          transition-all duration-150
          ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}
        `}
      />

      {/* Clear Button */}
      {inputValue && !disabled && (
        <button
          onClick={handleClear}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          title="Clear search"
        >
          <svg 
            className="h-4 w-4" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M6 18L18 6M6 6l12 12" 
            />
          </svg>
        </button>
      )}

      {/* Loading Indicator (visible when typing) */}
      {inputValue !== debouncedValue && !disabled && (
        <div className="absolute inset-y-0 right-8 flex items-center">
          <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
}
