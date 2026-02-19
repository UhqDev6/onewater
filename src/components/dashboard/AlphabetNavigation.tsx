'use client';

import { useEffect, useState, useMemo } from 'react';

interface AlphabetNavigationProps {
  selectedLetter: string | null;
  onLetterSelect: (letter: string | null) => void;
  availableLetters?: string[];
  disabled?: boolean;
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export default function AlphabetNavigation({
  selectedLetter,
  onLetterSelect,
  availableLetters,
  disabled = false,
}: AlphabetNavigationProps) {
  const [fetchedLetters, setFetchedLetters] = useState<string[]>([]);

  // Use provided letters or fetched letters
  const letters = useMemo(() => {
    return availableLetters ?? fetchedLetters;
  }, [availableLetters, fetchedLetters]);

  // Fetch available letters from API on mount if not provided
  useEffect(() => {
    if (availableLetters) {
      return; // Skip fetch if letters are provided as props
    }

    async function fetchAvailableLetters() {
      try {
        const response = await fetch('/api/beaches', {
          method: 'POST',
        });
        if (response.ok) {
          const data = await response.json();
          setFetchedLetters(data.letters || []);
        }
      } catch (error) {
        console.error('Failed to fetch available letters:', error);
        setFetchedLetters(ALPHABET); // Fallback to full alphabet
      }
    }

    fetchAvailableLetters();
  }, [availableLetters]);

  const handleLetterClick = (letter: string) => {
    if (disabled) return;
    
    if (selectedLetter === letter) {
      onLetterSelect(null); // Deselect if clicking same letter
    } else {
      onLetterSelect(letter);
    }
  };

  const handleClearFilter = () => {
    if (disabled) return;
    onLetterSelect(null);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
          Browse A–Z
        </span>
        {selectedLetter && (
          <button
            onClick={handleClearFilter}
            disabled={disabled}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
          >
            Clear
          </button>
        )}
      </div>
      
      <div className="flex flex-wrap gap-1">
        {ALPHABET.map((letter) => {
          const isAvailable = letters.length === 0 || letters.includes(letter);
          const isSelected = selectedLetter === letter;
          
          return (
            <button
              key={letter}
              onClick={() => handleLetterClick(letter)}
              disabled={disabled || !isAvailable}
              className={`
                w-7 h-7 flex items-center justify-center text-xs font-medium rounded
                transition-colors duration-150
                ${isSelected
                  ? 'bg-slate-700 text-white'
                  : isAvailable
                    ? 'bg-gray-100 text-gray-700 hover:bg-slate-200 hover:text-slate-800'
                    : 'bg-gray-50 text-gray-300 cursor-not-allowed'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              title={isAvailable ? `Filter by "${letter}"` : `No beaches starting with "${letter}"`}
            >
              {letter}
            </button>
          );
        })}
      </div>
    </div>
  );
}
