'use client';

import { useBeachCameras } from '@/hooks/useBeachCameras';

export default function BeachCameraPreview() {
  const { cameras, totalCameras, availableCameras, isLoading, error } = useBeachCameras();

  // Show loading state
  if (isLoading) {
    return (
      <section className="py-24 sm:py-32 bg-gradient-to-b from-white via-cyan-50/30 to-white relative">
        <div className="container mx-auto px-4 relative">
          <div className="mx-auto max-w-3xl text-center">
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading beach cameras...</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Show error state
  if (error) {
    return (
      <section className="py-24 sm:py-32 bg-gradient-to-b from-white via-cyan-50/30 to-white relative">
        <div className="container mx-auto px-4 relative">
          <div className="mx-auto max-w-3xl text-center">
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <p className="text-red-700 font-semibold">Unable to load beach cameras</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-24 sm:py-32 bg-gradient-to-b from-white via-cyan-50/30 to-white relative">
      {/* Wave Pattern Background */}
      <div className="absolute inset-0 opacity-5">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="wave-pattern" x="0" y="0" width="100" height="50" patternUnits="userSpaceOnUse">
              <path d="M0,25 Q25,15 50,25 T100,25" stroke="#06b6d4" strokeWidth="2" fill="none" />
              <path d="M0,35 Q25,25 50,35 T100,35" stroke="#0ea5e9" strokeWidth="2" fill="none" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#wave-pattern)" />
        </svg>
      </div>

      <div className="container mx-auto px-4 relative">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center mb-16">
          <div className="inline-block mb-4">
            <span className="text-xs font-mono text-cyan-600 tracking-widest uppercase border border-cyan-300 px-3 py-1 rounded-full bg-cyan-50">
              🎥 Live Monitoring
            </span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl mb-4">
            Beach Camera Network
          </h2>
          <p className="text-base text-gray-600 font-light leading-relaxed">
            Visual monitoring of beach conditions at select locations
          </p>
        </div>

        {/* Info Banner */}
        <div className="mx-auto max-w-5xl mb-8">
          <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-cyan-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-cyan-900 mb-1">
                  Live Beach Cameras
                </p>
                <p className="text-xs text-cyan-700 leading-relaxed">
                  {availableCameras} of {totalCameras} locations have active camera feeds for real-time visual monitoring. 
                  Camera availability varies by location and is subject to maintenance schedules.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Camera Grid */}
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {cameras.map((camera, index) => (
              <div
                key={camera.id}
                className={`group relative bg-white border-2 ${
                  camera.available ? 'border-cyan-200 hover:border-cyan-400' : 'border-gray-200'
                } rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 animate-fade-in`}
                style={{
                  animationDelay: `${index * 100}ms`,
                }}
              >
                {/* Camera Preview / Placeholder */}
                <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                  {camera.available && camera.thumbnail ? (
                    <>
                      {/* Thumbnail Image */}
                      <div
                        className="absolute inset-0 bg-cover bg-center group-hover:scale-110 transition-transform duration-500"
                        style={{ backgroundImage: `url(${camera.thumbnail})` }}
                      />
                      {/* Live Badge */}
                      <div className="absolute top-3 left-3 flex items-center gap-2 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                        <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                        LIVE
                      </div>
                      {/* Last Update */}
                      <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs font-mono px-2 py-1 rounded backdrop-blur-sm">
                        {camera.lastUpdate}
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Unavailable State */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <svg className="w-16 h-16 text-gray-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M12 18.75H4.5a2.25 2.25 0 01-2.25-2.25V9m12.841 9.091L16.5 19.5m-1.409-1.409c.407-.407.659-.97.659-1.591v-9a2.25 2.25 0 00-2.25-2.25h-9c-.621 0-1.184.252-1.591.659m12.182 12.182L2.909 5.909M1.5 4.5l1.409 1.409" />
                          </svg>
                          <p className="text-sm font-semibold text-gray-500">
                            Camera Unavailable
                          </p>
                        </div>
                      </div>
                      {/* Unavailable Badge */}
                      <div className="absolute top-3 left-3 bg-gray-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                        OFFLINE
                      </div>
                    </>
                  )}
                </div>

                {/* Camera Info */}
                <div className="p-5">
                  {/* Location Name */}
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    {camera.name}
                  </h3>
                  
                  {/* Location */}
                  <div className="flex items-center gap-1 text-sm text-gray-600 mb-4">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                    {camera.location}
                  </div>

                  {/* Action Button */}
                  {camera.available && camera.cameraUrl ? (
                    <a
                      href={camera.cameraUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 w-full justify-center bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold px-4 py-2 rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all duration-300 shadow-md hover:shadow-lg"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                      </svg>
                      Watch Live Feed
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                      </svg>
                    </a>
                  ) : (
                    <button
                      disabled
                      className="inline-flex items-center gap-2 w-full justify-center bg-gray-300 text-gray-500 font-semibold px-4 py-2 rounded-lg cursor-not-allowed"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                      Preview Unavailable
                    </button>
                  )}
                </div>

                {/* Hover Glow */}
                {camera.available && (
                  <div className="absolute inset-0 rounded-2xl border-2 border-cyan-400/0 group-hover:border-cyan-400/50 transition-colors duration-300 pointer-events-none"></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Note */}
        <div className="mt-12 text-center">
          <p className="text-xs font-mono text-gray-500">
            Camera feeds provided by local councils and beach management authorities
          </p>
        </div>
      </div>
    </section>
  );
}
