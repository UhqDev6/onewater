/**
 * Reusable Date Range Filter Component
 * Can be used across different views that need date filtering
 */

import { DateRange } from '@/hooks/useDateRangeFilter';

interface DateRangeFilterProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  onReset?: () => void;
  label?: string;
  className?: string;
  disabled?: boolean;
}

export default function DateRangeFilter({
  dateRange,
  onDateRangeChange,
  onReset,
  // label = 'Date Range',
  className = '',
  disabled = false,
}: DateRangeFilterProps) {
  const handleStartDateChange = (date: string) => {
    onDateRangeChange({
      ...dateRange,
      startDate: date,
    });
  };

  const handleEndDateChange = (date: string) => {
    onDateRangeChange({
      ...dateRange,
      endDate: date,
    });
  };

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {/* <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
        {label}
      </span> */}
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <label className="block text-xs text-slate-500 mb-1">From</label>
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => handleStartDateChange(e.target.value)}
            disabled={disabled}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 
                       focus:border-slate-400 focus:outline-none disabled:bg-slate-100 disabled:cursor-not-allowed"
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs text-slate-500 mb-1">To</label>
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => handleEndDateChange(e.target.value)}
            disabled={disabled}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 
                       focus:border-slate-400 focus:outline-none disabled:bg-slate-100 disabled:cursor-not-allowed"
          />
        </div>
        {onReset && (
          <div className="shrink-0">
            <button
              type="button"
              onClick={onReset}
              disabled={disabled}
              className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-700 hover:bg-slate-100 
                         rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed h-[42px] flex items-center justify-center"
              title="Reset date range"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}