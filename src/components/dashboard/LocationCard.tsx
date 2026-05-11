import { NormalizedWaterQualityData } from '@/lib/types';
import { getQualityColor, getQualityLabel, formatDate } from '@/lib/utils/dataHelpers';

interface LocationCardProps {
  data: NormalizedWaterQualityData;
  onSelect?: () => void;
}

// Get pollution forecast color based on likelihood
function getForecastColor(forecast: string): string {
  const forecastLower = forecast.toLowerCase();
  if (forecastLower === 'unlikely') return 'text-blue-600 bg-blue-50';
  if (forecastLower === 'possible') return 'text-yellow-600 bg-yellow-50';
  if (forecastLower === 'likely') return 'text-red-600 bg-red-50';
  return 'text-gray-600 bg-gray-50';
}

// Get pollution forecast icon based on likelihood
function getForecastIcon(forecast: string): string {
  const forecastLower = forecast.toLowerCase();
  if (forecastLower === 'unlikely') return '✓';
  if (forecastLower === 'possible') return '⚠';
  if (forecastLower === 'likely') return '⚠';
  return '•';
}

export default function LocationCard({ data, onSelect }: LocationCardProps) {
  const { location, latestReading } = data;
  const qualityColor = getQualityColor(latestReading.qualityRating);
  const qualityLabel = getQualityLabel(latestReading.qualityRating);

  return (
    <div
      onClick={onSelect}
      className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{location.name}</h3>
          <p className="text-sm text-gray-500">
            {location.localGovernmentArea || location.region}, {location.state}
          </p>
        </div>
        <div
          className="px-3 py-1 rounded-full text-xs font-medium text-white"
          style={{ backgroundColor: qualityColor }}
        >{qualityLabel}
        </div>
      </div>

      {/* Pollution Forecast */}
      {latestReading.pollutionForecast && (
        <div className="mb-4 p-3 rounded-lg bg-gray-50 border border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Pollution Forecast</span>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getForecastColor(latestReading.pollutionForecast)}`}>
              <span>{getForecastIcon(latestReading.pollutionForecast)}</span>
              {latestReading.pollutionForecast}
            </span>
          </div>
          {latestReading.pollutionForecastTimeStamp && (
            <p className="mt-1 text-xs text-gray-400">
              Forecast updated: {formatDate(latestReading.pollutionForecastTimeStamp)}
            </p>
          )}
        </div>
      )}

      {/* Latest Reading */}
      <div className="space-y-3 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Observation Date</span>
          <span className="text-sm font-medium text-gray-900">
            {latestReading.latestResultObservationDate 
              ? formatDate(latestReading.latestResultObservationDate)
              : formatDate(latestReading.sampleDate)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Data Source</span>
          <span className="text-sm font-medium text-gray-900">
            {latestReading.source === 'nsw_beachwatch' ? 'NSW Beachwatch' : latestReading.source}
          </span>
        </div>
      </div>

      {/* Real-time Population & Beach Camera - Grid Layout */}
      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
        {/* Population */}
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.196-2.121M9 20H4v-2a3 3 0 015.196-2.121m0 0a5.002 5.002 0 019.608 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">Population</span>
          </div>
          <p className="text-sm font-semibold text-gray-900">
            {location.expectedPopulation ? `${location.expectedPopulation} people` : 'N/A'}
          </p>
        </div>

        {/* Beach Camera */}
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">Camera</span>
          </div>
          {location.beachCameraUrl ? (
            <a
              href={location.beachCameraUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()} // Prevent card click when clicking camera link
              className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              View Live
            </a>
          ) : (
            <button
              disabled
              className="inline-flex items-center gap-1 text-sm font-medium text-gray-400 cursor-not-allowed"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
              </svg>
              Unavailable
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
