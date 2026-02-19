'use client';

interface SortToggleProps {
  sortOrder: 'asc' | 'desc';
  onSortChange: (order: 'asc' | 'desc') => void;
  disabled?: boolean;
}

export default function SortToggle({
  sortOrder,
  onSortChange,
  disabled = false,
}: SortToggleProps) {
  const handleToggle = () => {
    if (disabled) return;
    onSortChange(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  return (
    <button
      onClick={handleToggle}
      disabled={disabled}
      className={`
        inline-flex items-center space-x-1.5 px-3 py-2 
        bg-white border border-gray-200 rounded-lg
        text-sm font-medium text-gray-700
        hover:bg-gray-50 hover:border-gray-300
        transition-colors duration-150
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
      title={`Sort ${sortOrder === 'asc' ? 'A–Z' : 'Z–A'} (click to toggle)`}
    >
      <span className="text-gray-600">Sort:</span>
      <span className="font-semibold text-slate-800">
        {sortOrder === 'asc' ? 'A–Z' : 'Z–A'}
      </span>
      <svg 
        className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
          sortOrder === 'desc' ? 'rotate-180' : ''
        }`}
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" 
        />
      </svg>
    </button>
  );
}
