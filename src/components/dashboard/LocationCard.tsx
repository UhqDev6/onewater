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
      <div className="space-y-3">
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
    </div>
  );
}
