export default function Features() {
  const features = [
    {
      name: 'Real-time Monitoring',
      description:
        'Access up-to-date water quality data from official government sources across multiple states.',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
      ),
    },
    {
      name: 'Interactive Maps',
      description:
        'Visualize water quality across Australia with intuitive, location-based mapping.',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
        </svg>
      ),
    },
    {
      name: 'Historical Trends',
      description:
        'Analyze long-term water quality trends and patterns to understand environmental changes.',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
        </svg>
      ),
    },
    {
      name: 'Scientific Data',
      description:
        'Based on enterococci levels and NHMRC guidelines for recreational water quality assessment.',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
        </svg>
      ),
    },
    {
      name: 'Open Access',
      description:
        'Free, public access to all data with transparent methodology and sources.',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
      ),
    },
    {
      name: 'API Integration',
      description:
        'Developer-friendly API for building custom applications and integrations.',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
        </svg>
      ),
    },
  ];

  return (
    <section className="py-24 sm:py-32 bg-gradient-to-b from-gray-50 via-white to-gray-50 relative">
      {/* Scientific Grid Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" />
      
      <div className="container mx-auto px-4 relative">
        {/* Header - Research Paper Style */}
        <div className="mx-auto max-w-2xl text-center mb-4">
          <div className="inline-block mb-4">
            <span className="text-xs font-mono text-gray-500 tracking-widest uppercase border border-gray-300 px-3 py-1 rounded-full">
              Platform Capabilities
            </span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl mb-4">
            Scientific Water Quality Platform
          </h2>
          <p className="text-base text-gray-600 font-light leading-relaxed">
            Advanced analytical tools for environmental monitoring and public health protection
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-7xl">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <div
                key={feature.name}
                className="group relative bg-white/80 backdrop-blur-sm p-8 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl border-2 border-gray-200 rounded-2xl hover:border-gray-300 animate-fade-in"
                style={{
                  animationDelay: `${index * 100}ms`,
                }}
              >
                {/* Feature Number - Lab Style */}
                <div className="absolute top-4 right-4">
                  <span className="text-[10px] font-mono text-gray-400 tracking-widest">
                    F{String(index + 1).padStart(2, '0')}
                  </span>
                </div>

                {/* Icon - Laboratory Equipment Style */}
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600 mb-5 group-hover:from-blue-600 group-hover:to-blue-700 group-hover:text-white transition-all duration-300 shadow-md border-2 border-blue-100 group-hover:border-blue-500">
                  {feature.icon}
                </div>

                {/* Feature Title - Research Format */}
                <div className="mb-4 pb-3 border-b border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900">{feature.name}</h3>
                </div>

                {/* Description - Technical Documentation Style */}
                <p className="text-sm text-gray-600 leading-relaxed font-light">
                  {feature.description}
                </p>

                {/* Hover Glow Effect */}
                <div className="absolute inset-0 rounded-2xl border-2 border-blue-400/0 group-hover:border-blue-400/30 transition-colors duration-300 pointer-events-none"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Technical Note */}
        {/* <div className="mt-16 text-center">
          <p className="text-xs font-mono text-gray-500 tracking-wide">
            Built with{' '}
            <span className="text-blue-600 font-semibold">Next.js 14</span>
            {' • '}
            <span className="text-blue-600 font-semibold">React Leaflet</span>
            {' • '}
            <span className="text-blue-600 font-semibold">TypeScript</span>
          </p>
        </div> */}
      </div>

    </section>
  );
}
