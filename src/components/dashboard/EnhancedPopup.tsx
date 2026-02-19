'use client';

import { NormalizedWaterQualityData, WaterQualityRating } from '@/lib/types';
import { getQualityLabel, formatDate } from '@/lib/utils/dataHelpers';

interface EnhancedPopupProps {
  data: NormalizedWaterQualityData;
  onViewDetails?: (locationId: string) => void;
}

// Get pollution forecast color based on likelihood
const getForecastColor = (forecast: string): string => {
  const forecastLower = forecast.toLowerCase();
  if (forecastLower === 'unlikely') return 'text-blue-600 bg-blue-50 border-blue-200';
  if (forecastLower === 'possible') return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  if (forecastLower === 'likely') return 'text-red-600 bg-red-50 border-red-200';
  return 'text-gray-600 bg-gray-50 border-gray-200';
};

// Get pollution forecast icon based on likelihood
const getForecastIcon = (forecast: string): string => {
  const forecastLower = forecast.toLowerCase();
  if (forecastLower === 'unlikely') return '✓';
  if (forecastLower === 'possible') return '⚠';
  if (forecastLower === 'likely') return '⚠';
  return '•';
};

// Get trend indicator based on historical data
const getTrendIndicator = (data: NormalizedWaterQualityData): { icon: string; label: string; color: string } => {
  const { historicalReadings } = data;
  
  if (!historicalReadings || historicalReadings.length < 2) {
    return { icon: '→', label: 'Stable', color: 'text-gray-500' };
  }

  // Compare latest with average of last 3 readings
  const latest = data.latestReading.enterococciValue;
  const recentAvg = historicalReadings
    .slice(0, Math.min(3, historicalReadings.length))
    .reduce((sum, r) => sum + r.enterococciValue, 0) / Math.min(3, historicalReadings.length);

  const change = ((latest - recentAvg) / recentAvg) * 100;

  if (change < -20) return { icon: '↓', label: 'Improving', color: 'text-green-600' };
  if (change < -5) return { icon: '↘', label: 'Slight improvement', color: 'text-green-500' };
  if (change > 20) return { icon: '↑', label: 'Degrading', color: 'text-red-600' };
  if (change > 5) return { icon: '↗', label: 'Slight decline', color: 'text-orange-500' };
  return { icon: '→', label: 'Stable', color: 'text-gray-500' };
};

// SVG Icons for each quality status
const QualityIcon = ({ rating, className = "" }: { rating: WaterQualityRating; className?: string }) => {
  switch (rating) {
    case 'excellent':
      // Sparkle/Star icon
      return (
        <svg className={`w-5 h-5 animate-sparkle ${className}`} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L14.09 8.26L21 9.27L16 14.14L17.18 21.02L12 17.77L6.82 21.02L8 14.14L3 9.27L9.91 8.26L12 2Z" />
        </svg>
      );
    case 'good':
      // Water drop icon
      return (
        <svg className={`w-5 h-5 animate-wave-ripple ${className}`} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C12 2 5.5 9 5.5 14.5C5.5 18.09 8.41 21 12 21C15.59 21 18.5 18.09 18.5 14.5C18.5 9 12 2 12 2ZM12 19C9.51 19 7.5 16.99 7.5 14.5C7.5 11.83 9.89 8.11 12 5.41C14.11 8.11 16.5 11.83 16.5 14.5C16.5 16.99 14.49 19 12 19Z"/>
          <circle cx="12" cy="14.5" r="3" opacity="0.6"/>
        </svg>
      );
    case 'fair':
      // Warning triangle icon
      return (
        <svg className={`w-5 h-5 animate-icon-pulse ${className}`} viewBox="0 0 24 24" fill="currentColor">
          <path d="M1 21H23L12 2L1 21ZM13 18H11V16H13V18ZM13 14H11V10H13V14Z"/>
        </svg>
      );
    case 'poor':
      // Alert/Exclamation icon
      return (
        <svg className={`w-5 h-5 animate-icon-shake ${className}`} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z"/>
        </svg>
      );
    case 'bad':
    case 'very_poor':
      // Danger/Skull icon
      return (
        <svg className={`w-5 h-5 animate-icon-shake ${className}`} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z"/>
          <path d="M15 9L9 15M9 9L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      );
    default:
      // Question mark icon
      return (
        <svg className={`w-5 h-5 animate-icon-pulse ${className}`} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 19H11V17H13V19ZM15.07 11.25L14.17 12.17C13.45 12.9 13 13.5 13 15H11V14.5C11 13.4 11.45 12.4 12.17 11.67L13.41 10.41C13.78 10.05 14 9.55 14 9C14 7.9 13.1 7 12 7C10.9 7 10 7.9 10 9H8C8 6.79 9.79 5 12 5C14.21 5 16 6.79 16 9C16 9.88 15.64 10.68 15.07 11.25Z"/>
        </svg>
      );
  }
};

// Get quality status info - using standard colors
const getQualityInfo = (rating: WaterQualityRating): { 
  gradient: string; 
  textColor: string;
  message: string;
  cardAnimation: string;
  glowColor: string;
} => {
  switch (rating) {
    case 'excellent':
      return {
        gradient: 'from-emerald-500 to-green-600',
        textColor: 'text-white',
        message: 'Safe for swimming',
        cardAnimation: 'animate-status-pulse',
        glowColor: 'shadow-emerald-500/30'
      };
    case 'good':
      return {
        gradient: 'from-blue-500 to-blue-600',
        textColor: 'text-white',
        message: 'Safe for swimming',
        cardAnimation: 'animate-status-pulse',
        glowColor: 'shadow-blue-500/30'
      };
    case 'fair':
      return {
        gradient: 'from-yellow-400 to-yellow-500',
        textColor: 'text-gray-900',
        message: 'Generally safe',
        cardAnimation: '',
        glowColor: 'shadow-yellow-400/30'
      };
    case 'poor':
      return {
        gradient: 'from-red-500 to-red-600',
        textColor: 'text-white',
        message: 'Exercise caution',
        cardAnimation: '',
        glowColor: 'shadow-red-500/30'
      };
    case 'bad':
    case 'very_poor':
      return {
        gradient: 'from-red-700 to-red-800',
        textColor: 'text-white',
        message: 'Not recommended',
        cardAnimation: '',
        glowColor: 'shadow-red-700/30'
      };
    default:
      return {
        gradient: 'from-gray-400 to-gray-500',
        textColor: 'text-white',
        message: 'Status unknown',
        cardAnimation: '',
        glowColor: 'shadow-gray-400/30'
      };
  }
};

// Mini sparkline component for historical trend
const MiniSparkline = ({ readings }: { readings: { enterococciValue: number }[] }) => {
  if (!readings || readings.length < 2) return null;

  const values = readings.slice(0, 7).reverse().map(r => r.enterococciValue);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;

  return (
    <div className="flex items-end gap-0.5 h-6">
      {values.map((value, i) => {
        const height = ((value - min) / range) * 100;
        const normalizedHeight = Math.max(15, Math.min(100, height));
        const isLatest = i === values.length - 1;
        
        return (
          <div
            key={i}
            className={`w-2 rounded-sm transition-all ${
              isLatest ? 'bg-blue-500' : 'bg-gray-300'
            }`}
            style={{ height: `${normalizedHeight}%` }}
          />
        );
      })}
    </div>
  );
};

// Format enterococci value with unit
// const formatEnterococci = (value: number): string => {
//   if (value >= 1000) {
//     return `${(value / 1000).toFixed(1)}K`;
//   }
//   return value.toString();
// };

// Copy coordinates to clipboard
const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    console.error('Failed to copy:', err);
  }
};

export default function EnhancedPopup({ data, onViewDetails }: EnhancedPopupProps) {
  const { location, latestReading, historicalReadings } = data;
  const qualityInfo = getQualityInfo(latestReading.qualityRating);
  const trend = getTrendIndicator(data);
  const coordinates = `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;

  // Check if there's an advisory (poor or worse quality)
  const hasAdvisory = ['poor', 'bad', 'very_poor'].includes(latestReading.qualityRating);

  return (
    <div className="w-64 animate-fadeIn">
      {/* Header */}
      <div className="border-b border-gray-100">
        <h3 className="font-semibold text-gray-900 text-sm leading-tight">
          {location.name}
        </h3>
        <p className="text-[11px] text-gray-500 mt-0.5">
          {location.region && `${location.region}, `}{location.state}
        </p>
      </div>

      {/* Quality Status Card */}
      <div className={`mt-2 p-2.5 rounded-lg bg-gradient-to-r ${qualityInfo.gradient} ${qualityInfo.cardAnimation} shadow-lg ${qualityInfo.glowColor}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={qualityInfo.textColor}>
              <QualityIcon rating={latestReading.qualityRating} />
            </div>
            <div>
              <p className={`text-sm font-semibold ${qualityInfo.textColor}`}>
                {getQualityLabel(latestReading.qualityRating)}
              </p>
              <p className={`text-[10px] ${qualityInfo.textColor} opacity-90`}>
                {qualityInfo.message}
              </p>
            </div>
          </div>
          
          {/* Trend Indicator */}
          <div className="text-right">
            <span className={`text-lg font-bold ${trend.color} animate-icon-bounce`} style={{ 
              textShadow: qualityInfo.textColor === 'text-white' ? '0 1px 2px rgba(0,0,0,0.3)' : 'none' 
            }}>
              {trend.icon}
            </span>
            <p className={`text-[9px] ${qualityInfo.textColor} opacity-75`}>
              {trend.label}
            </p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      {/* <div className="mt-2 grid grid-cols-2 gap-1.5">
        <div className="bg-gray-50 rounded p-2 text-center">
          <p className="text-[9px] text-gray-500 uppercase tracking-wide">Enterococci</p>
          <p className="text-base font-bold text-gray-900">
            {formatEnterococci(latestReading.enterococciValue)}
          </p>
          <p className="text-[8px] text-gray-400">CFU/100ml</p>
        </div>
        <div className="bg-gray-50 rounded p-2 text-center">
          <p className="text-[9px] text-gray-500 uppercase tracking-wide">Avg (30d)</p>
          <p className="text-base font-bold text-gray-900">
            {formatEnterococci(Math.round(statistics.average))}
          </p>
          <p className="text-[8px] text-gray-400">CFU/100ml</p>
        </div>
      </div> */}

      {/* Pollution Forecast */}
      {latestReading.pollutionForecast && (
        <div className={`mt-2 p-2 rounded border ${getForecastColor(latestReading.pollutionForecast)}`}>
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-medium uppercase tracking-wide opacity-75">Pollution Forecast</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold">
              <span>{getForecastIcon(latestReading.pollutionForecast)}</span>
              {latestReading.pollutionForecast}
            </span>
          </div>
          {latestReading.pollutionForecastTimeStamp && (
            <p className="mt-0.5 text-[9px] opacity-60">
              Updated: {formatDate(latestReading.pollutionForecastTimeStamp)}
            </p>
          )}
        </div>
      )}

      {/* Historical Trend */}
      {historicalReadings && historicalReadings.length >= 2 && (
        <div className="mt-2 p-2 bg-gray-50 rounded">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[9px] text-gray-500 uppercase tracking-wide">
              Trend ({Math.min(7, historicalReadings.length)} samples)
            </p>
          </div>
          <MiniSparkline readings={historicalReadings} />
        </div>
      )}

      {/* Advisory Warning */}
      {hasAdvisory && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded flex items-start gap-1.5">
          <div>
            <p className="text-[11px] font-medium text-red-800">Health Advisory</p>
            <p className="text-[9px] text-red-600">
              Swimming not recommended.
            </p>
          </div>
        </div>
      )}

      {/* Meta Info */}
      <div className="mt-2 pt-2 border-t border-gray-100 space-y-1">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-gray-500 flex items-center gap-1">
            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Observation
          </span>
          <span className="font-medium text-gray-900">
            {formatDate(latestReading.latestResultObservationDate || latestReading.sampleDate)}
          </span>
        </div>
        
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-gray-500 flex items-center gap-1">
            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            Coords
          </span>
          <button 
            onClick={() => copyToClipboard(coordinates)}
            className="font-mono text-[10px] text-gray-700 hover:text-blue-600 hover:underline transition-colors"
            title="Click to copy"
          >
            {coordinates}
          </button>
        </div>

        {/* <div className="flex items-center justify-between text-[11px]">
          <span className="text-gray-500 flex items-center gap-1">
            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Samples
          </span>
          <span className="font-medium text-gray-900">
            {statistics.sampleCount} total
          </span>
        </div> */}
      </div>

      {/* Action Button */}
      {onViewDetails && (
        <button
          onClick={() => onViewDetails(location.id)}
          className="mt-2 w-full py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded 
                     transition-colors flex items-center justify-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          View Details
        </button>
      )}
    </div>
  );
}
