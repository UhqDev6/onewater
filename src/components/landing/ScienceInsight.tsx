'use client';

import { ScienceInsightData, TaxonomicLevelData } from '@/lib/types/landing';
import { useGenomicsData } from '@/hooks/useGenomicsData';

export default function ScienceInsight() {
  const { totalMicroorganisms, isLoading } = useGenomicsData();
  
  // Format number with comma separator
  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return `${Math.floor(num / 1000)},${String(num % 1000).padStart(3, '0')}+`;
    }
    return `${num}+`;
  };

  const insights: ScienceInsightData[] = [
    {
      value: isLoading ? '...' : formatNumber(totalMicroorganisms),
      label: 'Microorganisms Tracked',
      description: 'Comprehensive genomic database',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
        </svg>
      ),
    },
    {
      value: 'Level 6',
      label: 'Taxonomic Depth',
      description: 'Analysis down to Genus level',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
        </svg>
      ),
    },
    {
      value: 'DNA',
      label: 'Deep Sequencing',
      description: 'Next-generation sequencing technology',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
        </svg>
      ),
    },
  ];

  const taxonomicLevels: TaxonomicLevelData[] = [
    { level: 1, name: 'Domain', example: 'Bacteria' },
    { level: 2, name: 'Phylum', example: 'Proteobacteria' },
    { level: 3, name: 'Class', example: 'Gammaproteobacteria' },
    { level: 4, name: 'Order', example: 'Enterobacterales' },
    { level: 5, name: 'Family', example: 'Enterobacteriaceae' },
    { level: 6, name: 'Genus', example: 'Escherichia' },
  ];

  return (
    <section className="py-24 sm:py-32 bg-gradient-to-b from-white via-blue-50/30 to-white relative overflow-hidden">
      {/* DNA Helix Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="dna-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <path d="M0,50 Q25,30 50,50 T100,50" stroke="#0ea5e9" strokeWidth="2" fill="none" />
              <path d="M0,50 Q25,70 50,50 T100,50" stroke="#06b6d4" strokeWidth="2" fill="none" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dna-pattern)" />
        </svg>
      </div>

      <div className="container mx-auto px-4 relative">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center mb-16">
          <div className="inline-block mb-4">
            <span className="text-xs font-mono text-blue-600 tracking-widest uppercase border border-blue-300 px-3 py-1 rounded-full bg-blue-50">
              Genomic Analysis
            </span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl mb-4">
            Science-Backed Water Monitoring
          </h2>
          <p className="text-base text-gray-600 font-light leading-relaxed">
            Advanced genomic sequencing technology tracking thousands of microorganisms 
            to provide unprecedented insights into water quality
          </p>
        </div>

        {/* Key Insights Grid */}
        <div className="mx-auto max-w-6xl mb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {insights.map((insight, index) => (
              <div
                key={insight.label}
                className="group relative bg-white/80 backdrop-blur-sm border-2 border-blue-200 rounded-2xl p-8 hover:shadow-2xl hover:border-blue-400 hover:scale-[1.03] transition-all duration-300 animate-fade-in"
                style={{
                  animationDelay: `${index * 100}ms`,
                }}
              >
                {/* Icon */}
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white mb-5 shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                  {insight.icon}
                </div>

                {/* Value */}
                <div className="text-4xl font-bold text-blue-600 mb-2 tabular-nums">
                  {insight.value}
                </div>

                {/* Label */}
                <div className="text-sm font-semibold text-gray-900 mb-2">
                  {insight.label}
                </div>

                {/* Description */}
                <div className="text-xs text-gray-600 font-light">
                  {insight.description}
                </div>

                {/* Hover Glow */}
                <div className="absolute inset-0 rounded-2xl border-2 border-blue-400/0 group-hover:border-blue-400/50 transition-colors duration-300 pointer-events-none"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Taxonomic Hierarchy Visualization */}
        <div className="mx-auto max-w-4xl">
          <div className="bg-white/80 backdrop-blur-sm border-2 border-gray-200 rounded-2xl p-8 shadow-lg">
            <div className="text-center mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Taxonomic Classification Hierarchy
              </h3>
              <p className="text-sm text-gray-600 font-light">
                From broad domains to specific genus identification
              </p>
            </div>

            {/* Hierarchical Tree */}
            <div className="space-y-3">
              {taxonomicLevels.map((level, index) => (
                <div
                  key={level.level}
                  className="flex items-center gap-4 animate-fade-in"
                  style={{
                    animationDelay: `${(index + 3) * 100}ms`,
                  }}
                >
                  {/* Level Indicator */}
                  <div className="shrink-0 w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold shadow-md">
                    L{level.level}
                  </div>

                  {/* Level Info */}
                  <div className="flex-1 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-4 hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-bold text-gray-900 mb-1">
                          {level.name}
                        </div>
                        <div className="text-xs text-gray-600 font-mono">
                          Example: <span className="text-blue-600 font-semibold">{level.example}</span>
                        </div>
                      </div>
                      {index < taxonomicLevels.length - 1 && (
                        <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Note */}
            <div className="mt-8 text-center">
              <div className="inline-block bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
                <p className="text-xs font-mono text-blue-700">
                  <span className="font-bold">Precision:</span> Genus-level identification enables accurate source tracking
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
