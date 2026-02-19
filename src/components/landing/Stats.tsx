export default function Stats() {
  const stats = [
    { 
      label: 'Beach Locations', 
      value: '500+',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
        </svg>
      )
    },
    { 
      label: 'Data Points Collected', 
      value: '100K+',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
        </svg>
      )
    },
    { 
      label: 'States Covered', 
      value: '2',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
        </svg>
      )
    },
    { 
      label: 'Update Frequency', 
      value: 'Daily',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
        </svg>
      )
    },
  ];

  return (
    <section className="py-24 sm:py-32 bg-gradient-to-b from-white via-gray-50 to-white relative">
      {/* Scientific Grid Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" />
      
      <div className="container mx-auto px-4 relative">
        {/* Header - Research Paper Style */}
        <div className="mx-auto max-w-2xl text-center mb-16">
          <div className="inline-block mb-4">
            <span className="text-xs font-mono text-gray-500 tracking-widest uppercase border border-gray-300 px-3 py-1 rounded-full">
              Key Metrics
            </span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl mb-4">
            Trusted by Communities
          </h2>
          <p className="text-base text-gray-600 font-light leading-relaxed">
            Serving thousands of users with reliable environmental data
          </p>
        </div>

        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {stats.map((stat, index) => (
              <div 
                key={stat.label} 
                className="group relative bg-white/80 backdrop-blur-sm border-2 border-gray-200 rounded-2xl p-8 hover:shadow-xl hover:border-gray-300 hover:scale-[1.05] transition-all duration-300 animate-fade-in"
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

                {/* Icon - Laboratory Equipment Style */}
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600 mb-5 group-hover:from-blue-600 group-hover:to-blue-700 group-hover:text-white transition-all duration-300 shadow-md border-2 border-blue-100 group-hover:border-blue-500">
                  {stat.icon}
                </div>

                {/* Value - Big Number Display */}
                <div className="text-4xl font-bold text-gray-900 mb-3 tabular-nums tracking-tight">
                  {stat.value}
                </div>

                {/* Label - Technical Format */}
                <div className="text-xs font-mono text-gray-600 uppercase tracking-wide border-t border-gray-200 pt-3">
                  {stat.label}
                </div>

                {/* Hover Glow Effect */}
                <div className="absolute inset-0 rounded-2xl border-2 border-blue-400/0 group-hover:border-blue-400/30 transition-colors duration-300 pointer-events-none"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Data Attribution */}
        <div className="mt-16 text-center">
          <p className="text-xs font-mono text-gray-500 tracking-wide">
            Data aggregated from{' '}
            <span className="text-blue-600 font-semibold">NSW Beachwatch</span>
            {' • '}
            <span className="text-blue-600 font-semibold">EPA Victoria</span>
            {' • Updated '}
            <span className="text-gray-700 font-semibold">Hourly</span>
          </p>
        </div>
      </div>

    </section>
  );
}
