import { NormalizedWaterQualityData } from '@/lib/types';
import { getQualityColor, getQualityLabel, formatDate } from '@/lib/utils/dataHelpers';

interface LocationCardProps {
  data: NormalizedWaterQualityData;
  onSelect?: () => void;
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

      {/* Latest Reading */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Latest Update</span>
          <span className="text-sm font-medium text-gray-900">
            {formatDate(latestReading.sampleDate)}
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
