import { NormalizedWaterQualityData } from '@/lib/types';
import { getSummaryStatistics } from '@/lib/utils/dataHelpers';

interface SummaryStatsProps {
  data: NormalizedWaterQualityData[];
}

export default function SummaryStats({ data }: SummaryStatsProps) {
  const stats = getSummaryStatistics(data);
  
  const goodCount = stats.qualityDistribution.good || 0;
  const fairCount = stats.qualityDistribution.fair || 0;
  const poorCount = (stats.qualityDistribution.poor || 0) + (stats.qualityDistribution.bad || 0);
  
  const goodPercentage = stats.totalLocations > 0 ? (goodCount / stats.totalLocations) * 100 : 0;
  const fairPercentage = stats.totalLocations > 0 ? (fairCount / stats.totalLocations) * 100 : 0;
  const poorPercentage = stats.totalLocations > 0 ? (poorCount / stats.totalLocations) * 100 : 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="text-sm font-medium text-gray-600">Total Locations</div>
        <div className="mt-2 text-3xl font-bold text-gray-900">{stats.totalLocations}</div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="text-sm font-medium text-gray-600">Good Rating</div>
        <div className="mt-2 text-3xl font-bold text-blue-600">
          {goodPercentage.toFixed(0)}%
        </div>
        <div className="mt-1 text-xs text-gray-500">
          {goodCount} locations
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="text-sm font-medium text-gray-600">Fair Rating</div>
        <div className="mt-2 text-3xl font-bold text-yellow-600">
          {fairPercentage.toFixed(0)}%
        </div>
        <div className="mt-1 text-xs text-gray-500">
          {fairCount} locations
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="text-sm font-medium text-gray-600">Poor or Worse</div>
        <div className="mt-2 text-3xl font-bold text-red-600">
          {poorPercentage.toFixed(0)}%
        </div>
        <div className="mt-1 text-xs text-gray-500">
          {poorCount} locations
        </div>
      </div>
    </div>
  );
}
