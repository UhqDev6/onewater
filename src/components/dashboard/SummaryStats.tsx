import { NormalizedWaterQualityData } from '@/lib/types';
import { getSummaryStatistics } from '@/lib/utils/dataHelpers';

interface SummaryStatsProps {
  data: NormalizedWaterQualityData[];
}

// Scientific icons for each stat type
const StatIcon = ({ type }: { type: 'total' | 'good' | 'fair' | 'poor' }) => {
  switch (type) {
    case 'total':
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
        </svg>
      );
    case 'good':
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'fair':
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
      );
    case 'poor':
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      );
  }
};

// Progress ring component for visual representation
const ProgressRing = ({ percentage, color, size = 48 }: { percentage: number; color: string; size?: number }) => {
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="currentColor"
        strokeWidth={strokeWidth}
        fill="none"
        className="text-gray-200"
      />
      {/* Progress circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="transition-all duration-700 ease-out"
      />
    </svg>
  );
};

export default function SummaryStats({ data }: SummaryStatsProps) {
  const stats = getSummaryStatistics(data);
  
  const goodCount = stats.qualityDistribution.good || 0;
  const fairCount = stats.qualityDistribution.fair || 0;
  const poorCount = (stats.qualityDistribution.poor || 0) + (stats.qualityDistribution.bad || 0);
  
  const goodPercentage = stats.totalLocations > 0 ? (goodCount / stats.totalLocations) * 100 : 0;
  const fairPercentage = stats.totalLocations > 0 ? (fairCount / stats.totalLocations) * 100 : 0;
  const poorPercentage = stats.totalLocations > 0 ? (poorCount / stats.totalLocations) * 100 : 0;

  const statCards = [
    {
      id: 'LOC',
      type: 'total' as const,
      label: 'Total Locations',
      value: stats.totalLocations.toString(),
      subValue: 'monitoring sites',
      color: '#6366f1', // indigo
      bgGradient: 'from-indigo-50 to-indigo-100',
      borderColor: 'border-indigo-200',
      textColor: 'text-indigo-600',
      hoverBorder: 'hover:border-indigo-400',
      percentage: 100,
    },
    {
      id: 'GQI',
      type: 'good' as const,
      label: 'Good Quality Index',
      value: `${goodPercentage.toFixed(0)}%`,
      subValue: `${goodCount} locations`,
      color: '#3b82f6', // blue
      bgGradient: 'from-blue-50 to-blue-100',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-600',
      hoverBorder: 'hover:border-blue-400',
      percentage: goodPercentage,
    },
    {
      id: 'FQI',
      type: 'fair' as const,
      label: 'Fair Quality Index',
      value: `${fairPercentage.toFixed(0)}%`,
      subValue: `${fairCount} locations`,
      color: '#eab308', // yellow
      bgGradient: 'from-yellow-50 to-amber-100',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-600',
      hoverBorder: 'hover:border-yellow-400',
      percentage: fairPercentage,
    },
    {
      id: 'PQI',
      type: 'poor' as const,
      label: 'Poor or Worse',
      value: `${poorPercentage.toFixed(0)}%`,
      subValue: `${poorCount} locations`,
      color: '#ef4444', // red
      bgGradient: 'from-red-50 to-red-100',
      borderColor: 'border-red-200',
      textColor: 'text-red-600',
      hoverBorder: 'hover:border-red-400',
      percentage: poorPercentage,
    },
  ];

  return (
    <div className="relative">
      {/* Section Label */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-xs font-mono text-gray-500 uppercase tracking-widest">
            Live Statistics
          </span>
        </div>
        <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <div 
            key={stat.id}
            className={`group relative bg-white rounded-xl ${stat.borderColor} p-5 
                       shadow-lg transition-all duration-300 overflow-hidden`}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:20px_20px] opacity-30" />
            
            {/* ID Badge */}
            {/* <div className="absolute top-3 right-3">
              <span className="text-[10px] font-mono text-gray-400 tracking-wider bg-gray-100 px-2 py-0.5 rounded">
                {stat.id}-{String(index + 1).padStart(2, '0')}
              </span>
            </div> */}

            {/* Content */}
            <div className="relative z-10">
              {/* Icon + Progress Ring */}
              <div className="flex items-start justify-between mb-4">
                <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br ${stat.bgGradient} ${stat.textColor} 
                               shadow-sm border ${stat.borderColor} scale-110 transition-transform duration-300`}>
                  <StatIcon type={stat.type} />
                </div>
                
                {/* Mini Progress Ring */}
                {stat.type !== 'total' && (
                  <div className="relative">
                    <ProgressRing percentage={stat.percentage} color={stat.color} size={40} />
                    <span className={`absolute inset-0 flex items-center justify-center text-[9px] font-bold ${stat.textColor}`}>
                      {stat.percentage.toFixed(0)}
                    </span>
                  </div>
                )}
              </div>

              {/* Label */}
              <div className="text-xs font-mono text-gray-500 uppercase tracking-wide mb-2">
                {stat.label}
              </div>

              {/* Value */}
              <div className={`text-3xl font-bold ${stat.textColor} tabular-nums tracking-tight mb-1`}>
                {stat.value}
              </div>

              {/* Sub Value */}
              <div className="text-[11px] text-gray-500 font-medium">
                {stat.subValue}
              </div>

              {/* Bottom Progress Bar */}
              <div className="mt-4 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{ 
                    width: `${stat.percentage}%`,
                    backgroundColor: stat.color 
                  }}
                />
              </div>
            </div>

            {/* Glow Effect */}
            <div className={`absolute inset-0 rounded-xl opacity-100 transition-opacity duration-300 pointer-events-none`}
                 style={{ boxShadow: `inset 0 0 20px ${stat.color}20` }} />
          </div>
        ))}
      </div>

      {/* Data Source Note */}
      <div className="mt-4 flex items-center justify-end gap-2">
        <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wide">
          Real-time data from NSW Beachwatch
        </span>
      </div>
    </div>
  );
}
