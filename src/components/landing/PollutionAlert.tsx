'use client';

import Link from 'next/link';
import { ColorConfig } from '@/lib/types/landing';
import { usePollutionAlerts } from '@/hooks/usePollutionAlerts';

export default function PollutionAlert() {
  const { alerts, totalPoorLocations, isLoading, error } = usePollutionAlerts();

  const severityConfig: Record<string, ColorConfig> = {
    critical: {
      bg: 'from-red-50 to-red-100',
      border: 'border-red-300',
      badge: 'bg-red-600',
      text: 'text-red-700',
      icon: 'text-red-600',
      pulse: 'animate-pulse',
    },
    high: {
      bg: 'from-orange-50 to-orange-100',
      border: 'border-orange-300',
      badge: 'bg-orange-600',
      text: 'text-orange-700',
      icon: 'text-orange-600',
      pulse: '',
    },
  };

  // Show loading state
  if (isLoading) {
    return (
      <section className="py-24 sm:py-32 bg-gradient-to-b from-gray-50 via-white to-gray-50 relative">
        <div className="container mx-auto px-4 relative">
          <div className="mx-auto max-w-3xl text-center">
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading pollution alerts...</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Show error state
  if (error) {
    return (
      <section className="py-24 sm:py-32 bg-gradient-to-b from-gray-50 via-white to-gray-50 relative">
        <div className="container mx-auto px-4 relative">
          <div className="mx-auto max-w-3xl text-center">
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <p className="text-red-700 font-semibold">Unable to load pollution alerts</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Show no alerts state
  if (alerts.length === 0) {
    return (
      <section className="py-24 sm:py-32 bg-gradient-to-b from-gray-50 via-white to-gray-50 relative">
        <div className="container mx-auto px-4 relative">
          <div className="mx-auto max-w-3xl text-center">
            <div className="bg-green-50 border border-green-200 rounded-xl p-8">
              <svg className="w-12 h-12 text-green-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-bold text-green-900 mb-2">All Clear!</h3>
              <p className="text-green-700">No pollution alerts at this time. All monitored locations have acceptable water quality.</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-24 sm:py-32 bg-gradient-to-b from-gray-50 via-white to-gray-50 relative">
      {/* Warning Pattern Background */}
      <div className="absolute inset-0 opacity-5">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="warning-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M0,20 L20,0 L40,20 L20,40 Z" fill="#ef4444" opacity="0.1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#warning-pattern)" />
        </svg>
      </div>

      <div className="container mx-auto px-4 relative">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center mb-16">
          <div className="inline-block mb-4">
            <span className="text-xs font-mono text-red-600 tracking-widest uppercase border border-red-300 px-3 py-1 rounded-full bg-red-50 animate-pulse">
              ⚠️ Active Alerts
            </span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl mb-4">
            Pollution Watch
          </h2>
          <p className="text-base text-gray-600 font-light leading-relaxed">
            Current water quality alerts requiring public attention
          </p>
        </div>

        {/* Alert Banner */}
        <div className="mx-auto max-w-4xl mb-8">
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5 animate-pulse" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <div>
                <p className="text-sm font-bold text-red-900 mb-1">
                  Swimming Not Recommended
                </p>
                <p className="text-xs text-red-700 leading-relaxed">
                  {totalPoorLocations > 0 ? (
                    <>
                      {totalPoorLocations} location{totalPoorLocations > 1 ? 's' : ''} currently have elevated contamination levels. 
                      Showing top {Math.min(alerts.length, 3)} priority alerts (VIC monitoring prioritized). 
                      Avoid water contact until conditions improve.
                    </>
                  ) : (
                    'The following locations currently have elevated contamination levels. Avoid water contact until conditions improve. Check back for updates.'
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts List */}
        <div className="mx-auto max-w-4xl">
          <div className="space-y-4">
            {alerts.map((alert, index) => {
              const config = severityConfig[alert.severity as keyof typeof severityConfig];
              
              return (
                <div
                  key={alert.id}
                  className={`group relative bg-gradient-to-br ${config.bg} backdrop-blur-sm border-2 ${config.border} rounded-2xl p-6 hover:shadow-xl transition-all duration-300 animate-fade-in ${config.pulse}`}
                  style={{
                    animationDelay: `${index * 100}ms`,
                  }}
                >
                  {/* Alert Number */}
                  <div className="absolute top-4 right-4">
                    <span className="text-[10px] font-mono text-gray-400 tracking-widest">
                      A{String(index + 1).padStart(2, '0')}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    {/* Icon */}
                    <div className={`flex-shrink-0 w-14 h-14 rounded-xl ${config.badge} flex items-center justify-center text-white shadow-lg`}>
                      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                      </svg>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Location Name & Status */}
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 mb-1">
                            {alert.name}
                          </h3>
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`inline-flex items-center gap-1 text-xs font-bold ${config.text} uppercase tracking-wide`}>
                              <span className={`w-2 h-2 rounded-full ${config.badge}`}></span>
                              {alert.status}
                            </span>
                            <span className="text-xs text-gray-500">
                              • Updated {alert.lastUpdated}
                            </span>
                          </div>
                          {/* Data Source Badge */}
                          <div className="flex items-center gap-2">
                            {alert.indicator.includes('VIC monitoring') ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-1 rounded-full border border-blue-200">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                VIC Internal
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded-full border border-green-200">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12.75 3.03v.568c0 .334.148.65.405.864l1.068.89c.442.369.535 1.01.216 1.49l-.51.766a2.25 2.25 0 01-1.161.886l-.143.048a1.107 1.107 0 00-.57 1.664c.369.555.169 1.307-.427 1.605L9 13.125l.423 1.059a.956.956 0 01-1.652.928l-.679-.906a1.125 1.125 0 00-1.906.172L4.5 15.75l-.612.153M12.75 3.031a9 9 0 00-8.862 12.872M12.75 3.031a9 9 0 016.69 14.036m0 0l-.177-.529A2.25 2.25 0 0017.128 15H16.5l-.324-.324a1.453 1.453 0 00-2.328.377l-.036.073a1.586 1.586 0 01-.982.816l-.99.282c-.55.157-.894.702-.8 1.267l.073.438c.08.474.49.821.97.821.846 0 1.598.542 1.865 1.345l.215.643m5.276-3.67a9.012 9.012 0 01-5.276 3.67m0 0a9 9 0 01-10.275-4.835M15.75 9c0 .896-.393 1.7-1.016 2.25" />
                                </svg>
                                NSW Beachwatch
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Indicator */}
                      <p className="text-sm text-gray-700 mb-4">
                        <span className="font-semibold">Reason:</span> {alert.indicator}
                      </p>

                      {/* Action Button */}
                      <Link
                        href={`/dashboard?location=${alert.id}&view=map`}
                        className={`inline-flex items-center gap-2 text-sm font-semibold ${config.text} hover:underline transition-all`}
                      >
                        View detailed analysis
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                      </Link>
                    </div>
                  </div>

                  {/* Hover Glow */}
                  <div className={`absolute inset-0 rounded-2xl border-2 ${config.border} opacity-0 group-hover:opacity-70 transition-opacity duration-300 pointer-events-none`}></div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
            </svg>
            View All Locations on Map
          </Link>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 text-center">
          <p className="text-xs font-mono text-gray-500">
            Alerts updated hourly • Priority: <span className="text-blue-600 font-semibold">VIC Internal Database</span> → <span className="text-blue-600 font-semibold">NSW Beachwatch</span> → <span className="text-blue-600 font-semibold">EPA Victoria</span>
          </p>
        </div>
      </div>
    </section>
  );
}
