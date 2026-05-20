'use client';

import { StatData, StatColorClasses } from '@/lib/types/landing';
import { useHybridStats } from '@/hooks/useHybridStats';

export default function StatsOverview() {
  const hybridStats = useHybridStats();

  // Create stats array with real data
  const stats: StatData[] = [
    {
      label: 'Locations Monitored',
      value: hybridStats.isLoading ? '...' : `${hybridStats.totalLocations}`,
      subtext: hybridStats.isLoading ? 'Loading...' : 
        hybridStats.internalLocations > 0 && hybridStats.apiLocations > 0 
          ? `${hybridStats.internalLocations} VIC + ${hybridStats.apiLocations} NSW`
          : hybridStats.internalLocations > 0 
            ? `${hybridStats.internalLocations} VIC locations`
            : hybridStats.apiLocations > 0 
              ? `${hybridStats.apiLocations} NSW locations`
              : 'No data available',
      trend: hybridStats.isLoading ? '...' : 'Real-time monitoring',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
        </svg>
      ),
      color: 'blue',
    },
    {
      label: 'Current Water Safety',
      value: hybridStats.isLoading ? '...' : `${hybridStats.goodStatusPercentage}%`,
      subtext: hybridStats.isLoading ? 'Loading...' : `${hybridStats.goodStatusCount} locations safe`,
      trend: hybridStats.isLoading ? '...' : 'Safe for swimming',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'green',
    },
    {
      label: 'Latest Sample Date',
      value: hybridStats.isLoading ? '...' : hybridStats.latestSampleDate.split(' ')[0] || 'N/A',
      subtext: hybridStats.isLoading ? 'Loading...' : hybridStats.latestSampleDate.split(' ')[1] || '',
      trend: hybridStats.isLoading ? '...' : 'Updated daily',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
      ),
      color: 'cyan',
    },
    {
      label: 'Data Points Collected',
      value: hybridStats.isLoading ? '...' : `${Math.round(hybridStats.totalDataPoints / 1000)}K+`,
      subtext: hybridStats.isLoading ? 'Loading...' : 'Total samples',
      trend: hybridStats.isLoading ? '...' : 'Since 2018',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
      ),
      color: 'purple',
    },
  ];

  // Show error state if there's an error
  if (hybridStats.error) {
    return (
      <section className="py-24 sm:py-32 bg-gradient-to-b from-white via-gray-50 to-white relative">
        <div className="container mx-auto px-4 relative">
          <div className="mx-auto max-w-2xl text-center">
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <p className="text-red-700 font-semibold">Unable to load statistics</p>
              <p className="text-red-600 text-sm mt-1">{hybridStats.error}</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const colorClasses: Record<string, StatColorClasses> = {
    blue: {
      bg: 'from-blue-50 to-blue-100',
      border: 'border-blue-200',
      icon: 'from-blue-500 to-blue-600',
      iconHover: 'group-hover:from-blue-600 group-hover:to-blue-700',
      text: 'text-blue-700',
      trend: 'text-blue-600',
    },
    green: {
      bg: 'from-green-50 to-green-100',
      border: 'border-green-200',
      icon: 'from-green-500 to-green-600',
      iconHover: 'group-hover:from-green-600 group-hover:to-green-700',
      text: 'text-green-700',
      trend: 'text-green-600',
    },
    cyan: {
      bg: 'from-cyan-50 to-cyan-100',
      border: 'border-cyan-200',
      icon: 'from-cyan-500 to-cyan-600',
      iconHover: 'group-hover:from-cyan-600 group-hover:to-cyan-700',
      text: 'text-cyan-700',
      trend: 'text-cyan-600',
    },
    purple: {
      bg: 'from-purple-50 to-purple-100',
      border: 'border-purple-200',
      icon: 'from-purple-500 to-purple-600',
      iconHover: 'group-hover:from-purple-600 group-hover:to-purple-700',
      text: 'text-purple-700',
      trend: 'text-purple-600',
    },
  };

  return (
    <section className="py-24 sm:py-32 bg-gradient-to-b from-white via-gray-50 to-white relative">
      {/* Scientific Grid Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" />

      <div className="container mx-auto px-4 relative">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center mb-16">
          <div className="inline-block mb-4">
            <span className="text-xs font-mono text-gray-500 tracking-widest uppercase border border-gray-300 px-3 py-1 rounded-full">
              Real-Time Insights
            </span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl mb-4">
            Water Quality at a Glance
          </h2>
          <p className="text-base text-gray-600 font-light leading-relaxed">
            Live statistics from our comprehensive monitoring network
          </p>
        </div>

        {/* Stats Grid */}
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => {
              const colors = colorClasses[stat.color as keyof typeof colorClasses];
              
              return (
                <div
                  key={stat.label}
                  className={`group relative bg-gradient-to-br ${colors.bg} backdrop-blur-sm border-2 ${colors.border} rounded-2xl p-6 hover:shadow-xl hover:scale-[1.03] transition-all duration-300 animate-fade-in`}
                  style={{
                    animationDelay: `${index * 100}ms`,
                  }}
                >
                  {/* Stat Number - Top Right */}
                  <div className="absolute top-4 right-4">
                    <span className="text-[10px] font-mono text-gray-400 tracking-widest">
                      S{String(index + 1).padStart(2, '0')}
                    </span>
                  </div>

                  {/* Icon */}
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${colors.icon} ${colors.iconHover} text-white mb-4 shadow-md transition-all duration-300`}>
                    {stat.icon}
                  </div>

                  {/* Value */}
                  <div className={`text-4xl font-bold ${colors.text} mb-2 tabular-nums tracking-tight`}>
                    {stat.value}
                  </div>

                  {/* Label */}
                  <div className="text-sm font-semibold text-gray-900 mb-1">
                    {stat.label}
                  </div>

                  {/* Subtext */}
                  <div className="text-xs text-gray-600 mb-3">
                    {stat.subtext}
                  </div>

                  {/* Trend */}
                  <div className={`inline-flex items-center gap-1 text-xs font-semibold ${colors.trend} bg-white/50 px-2 py-1 rounded-full`}>
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
                    </svg>
                    {stat.trend}
                  </div>

                  {/* Hover Glow Effect */}
                  <div className={`absolute inset-0 rounded-2xl border-2 ${colors.border} opacity-0 group-hover:opacity-50 transition-opacity duration-300 pointer-events-none`}></div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Data Attribution */}
        <div className="mt-16 text-center">
          <div className="inline-block bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl px-6 py-3 shadow-sm">
            <p className="text-xs font-mono text-gray-600 tracking-wide">
              {hybridStats.isLoading ? (
                'Loading data sources...'
              ) : (
                <>
                  Data aggregated from{' '}
                  {hybridStats.internalLocations > 0 && (
                    <span className="text-blue-600 font-semibold">EPA Victoria ({hybridStats.internalLocations} sites)</span>
                  )}
                  {hybridStats.internalLocations > 0 && hybridStats.apiLocations > 0 && ' • '}
                  {hybridStats.apiLocations > 0 && (
                    <span className="text-blue-600 font-semibold">NSW Beachwatch ({hybridStats.apiLocations} sites)</span>
                  )}
                  {hybridStats.apiLocations === 0 && hybridStats.internalLocations === 0 && (
                    <span className="text-gray-500">No data sources available</span>
                  )}
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
