import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Methodology - OneWater',
  description: 'Scientific methodology for water quality assessment',
};

export default function MethodologyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <div className="border-b border-gray-200">
        <div className="container mx-auto px-4 py-16 max-w-5xl">
          <div className="flex items-center space-x-3 mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
            </svg>
            <h1 className="text-4xl font-bold text-gray-900">Methodology</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl">
            Scientific approach to water quality assessment and data collection standards
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-5xl">
        {/* Water Quality Assessment */}
        <section className="mb-16">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-10">
            <div className="flex items-start space-x-4 mb-6">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">Water Quality Assessment</h2>
                <p className="text-gray-700 leading-relaxed">
                  Our platform uses <span className="font-semibold text-gray-900">enterococci bacteria levels</span> as the primary indicator of recreational water quality. Enterococci are internationally recognized as the most reliable indicator of fecal contamination in marine and freshwater environments.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Quality Rating System */}
        <section className="mb-16">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Quality Rating System</h2>
            <p className="text-gray-600">Classification based on enterococci levels (cfu/100ml) according to NHMRC guidelines</p>
          </div>

          <div className="grid gap-4">
            {[
            //   { color: 'emerald', level: 'Excellent', range: '0-40 cfu/100ml', desc: 'Very low risk, ideal for swimming', gradient: 'from-emerald-50 to-emerald-100', border: 'border-emerald-200', icon: 'text-emerald-600' },
              { color: 'blue', level: 'Good', range: '41-100 cfu/100ml', desc: 'Low risk, safe for swimming', gradient: 'from-blue-50 to-blue-100', border: 'border-blue-200', icon: 'text-blue-600' },
              { color: 'yellow', level: 'Fair', range: '101-200 cfu/100ml', desc: 'Moderate risk, consider conditions before swimming', gradient: 'from-yellow-50 to-yellow-100', border: 'border-yellow-200', icon: 'text-yellow-600' },
              { color: 'orange', level: 'Poor', range: '201-500 cfu/100ml', desc: 'High risk, swimming not recommended', gradient: 'from-orange-50 to-orange-100', border: 'border-orange-200', icon: 'text-orange-600' },
              { color: 'red', level: 'Bad', range: '>500 cfu/100ml', desc: 'Very high risk, swimming strongly discouraged', gradient: 'from-red-50 to-red-100', border: 'border-red-200', icon: 'text-red-600' },
            ].map((rating, index) => (
              <div key={index} className={`bg-gradient-to-r ${rating.gradient} border ${rating.border} rounded-xl p-6 transition-all hover:shadow-md`}>
                <div className="flex items-start space-x-4">
                  <div className={`flex-shrink-0 w-10 h-10 bg-white rounded-lg flex items-center justify-center ${rating.icon}`}>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline justify-between mb-1">
                      <h3 className="text-lg font-bold text-gray-900">{rating.level}</h3>
                      <span className="text-sm font-mono font-medium text-gray-700">{rating.range}</span>
                    </div>
                    <p className="text-sm text-gray-700">{rating.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Data Collection & Normalization - Side by Side */}
        <div className="grid md:grid-cols-2 gap-6 mb-16">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900">Data Collection</h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">Water samples collected by state agencies:</p>
            <ul className="space-y-3">
              {[
                'Weekly sampling during swimming season',
                'Additional samples after heavy rainfall',
                'Laboratory analysis (AS/NZS 4276.7)'
              ].map((item, i) => (
                <li key={i} className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900">Normalization</h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">Ensuring data consistency:</p>
            <ul className="space-y-3">
              {[
                'Standardized location metadata',
                'Unified date/time formats (ISO 8601)',
                'Consistent quality classifications',
                'Source attribution tracking'
              ].map((item, i) => (
                <li key={i} className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Limitations - Alert Style */}
        <section className="mb-16">
          <div className="bg-amber-50 border-l-4 border-amber-400 rounded-xl p-8">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Important Limitations</h2>
                <ul className="space-y-3">
                  {[
                    'Water quality can change rapidly due to weather, tides, and other factors',
                    'Sample results represent conditions at time of collection only',
                    'Laboratory processing may cause 24-48 hour delays',
                    'Local conditions may vary within a beach or coastal area'
                  ].map((item, i) => (
                    <li key={i} className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                      </svg>
                      <span className="text-sm text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* References */}
        <section>
          <div className="bg-gray-900 text-white rounded-2xl p-8">
            <div className="flex items-center space-x-3 mb-6">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
              <h2 className="text-xl font-bold">References</h2>
            </div>
            <ul className="space-y-4 text-sm text-gray-300">
              <li className="leading-relaxed">
                <span className="font-medium text-white">NHMRC (2008).</span> Guidelines for Managing Risks in Recreational Water. National Health and Medical Research Council, Australia.
              </li>
              <li className="leading-relaxed">
                <span className="font-medium text-white">Standards Australia (2016).</span> AS/NZS 4276.7:2016 - Water microbiology - Enterococci - Membrane filtration method.
              </li>
              <li className="leading-relaxed">
                <span className="font-medium text-white">WHO (2021).</span> Guidelines on recreational water quality. World Health Organization.
              </li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
