import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Data Sources - OneWater',
  description: 'Official data sources for water quality information',
};

export default function DataSourcesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <div className="border-b border-gray-200">
        <div className="container mx-auto px-4 py-16 max-w-5xl">
          <div className="flex items-center space-x-3 mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
            </svg>
            <h1 className="text-4xl font-bold text-gray-900">Data Sources</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl">
            Official government sources providing trusted water quality data across Australia
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="space-y-8">
          {/* NSW Beachwatch */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-10">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">NSW Beachwatch</h2>
                  <p className="text-sm text-gray-600">Department of Planning and Environment, New South Wales</p>
                </div>
              </div>
              <span className="inline-flex items-center px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
                Active
              </span>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">About</h3>
                <p className="text-gray-700 text-sm leading-relaxed">
                  NSW Beachwatch monitors over 200 swimming locations across Sydney, Hunter, Illawarra, and other coastal regions. Operating since 1989, providing weekly water quality reports during swimming season.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">Coverage</h3>
                <ul className="space-y-2">
                  {[
                    '200+ ocean beaches and swimming sites',
                    'Weekly sampling (more frequent in summer)',
                    'Sydney, Central Coast, Hunter, Illawarra'
                  ].map((item, i) => (
                    <li key={i} className="flex items-start space-x-2">
                      <svg className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-gray-100">
              <div>
                <p className="text-xs text-gray-500 mb-1">Data Frequency</p>
                <p className="text-sm font-medium text-gray-900">Weekly updates with additional sampling after rain</p>
              </div>
              <a
                href="https://www.environment.nsw.gov.au/beachapp/report_enterococci.aspx"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <span>Visit Website</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
              </a>
            </div>
          </section>

          {/* Victoria EPA */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-10">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">Victoria EPA</h2>
                  <p className="text-sm text-gray-600">Environment Protection Authority Victoria</p>
                </div>
              </div>
              <span className="inline-flex items-center px-3 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
                Coming Soon
              </span>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">About</h3>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Victoria EPA monitors beach water quality across Port Phillip Bay, Western Port, and coastal beaches. Provides comprehensive environmental data for recreational water safety.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">Coverage</h3>
                <ul className="space-y-2">
                  {[
                    'Port Phillip Bay beaches',
                    'Western Port locations',
                    'Coastal beaches and estuaries'
                  ].map((item, i) => (
                    <li key={i} className="flex items-start space-x-2">
                      <svg className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-gray-100">
              <div>
                <p className="text-xs text-gray-500 mb-1">Status</p>
                <p className="text-sm font-medium text-gray-900">Integration in progress</p>
              </div>
              <a
                href="https://www.epa.vic.gov.au/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                <span>Visit Website</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
              </a>
            </div>
          </section>

        {/* Onewater Lims */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-10">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-pink-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">Onewater LIMS</h2>
                  <p className="text-sm text-gray-600">Laboratory Information Management System</p>
                </div>
              </div>
              <span className="inline-flex items-center px-3 py-1 bg-pink-100 text-pink-700 text-xs font-semibold rounded-full">
                Coming Soon
              </span>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">About</h3>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Onewater LIMS is our internal laboratory information management system that collects and processes water quality data from various sources, including our own testing and third-party integrations. This will be the primary source for real-time data on our platform.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">Coverage</h3>
                <ul className="space-y-2">
                  {[
                    'Real-time water quality data',
                    'Data from internal testing and third-party sources'
                  ].map((item, i) => (
                    <li key={i} className="flex items-start space-x-2">
                      <svg className="w-4 h-4 text-pink-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-gray-100">
              <div>
                <p className="text-xs text-gray-500 mb-1">Status</p>
                <p className="text-sm font-medium text-gray-900">Integration in progress</p>
              </div>
              <a
                href="https://www.epa.vic.gov.au/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                <span>Visit Website</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
              </a>
            </div>
          </section>

          {/* Future Sources */}
          <section className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl border border-purple-100 p-8">
            <div className="flex items-start space-x-4 mb-6">
              <div className="flex-shrink-0 w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Future Expansion</h2>
                <p className="text-gray-700 mb-4">Additional sources planned for nationwide coverage:</p>
                <div className="grid md:grid-cols-2 gap-3">
                  {[
                    'Queensland Health - Beach Monitoring',
                    'South Australia - EPA Beaches',
                    'Western Australia - Health Dept',
                    'Tasmania - EPA Beach Program'
                  ].map((item, i) => (
                    <div key={i} className="flex items-center space-x-2 bg-white rounded-lg px-3 py-2 shadow-sm">
                      <svg className="w-4 h-4 text-purple-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                      <span className="text-sm font-medium text-gray-900">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* API Access */}
          <section className="bg-gray-900 text-white rounded-2xl p-8">
            <div className="flex items-start space-x-4 mb-6">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2">API Access</h2>
                <p className="text-gray-300 mb-4">Access normalized water quality data through our public API</p>
                <div className="bg-black/30 border border-gray-700 rounded-lg p-4 font-mono text-sm overflow-x-auto mb-4">
                  <code className="text-blue-400">GET</code> <code className="text-gray-100">https://onewater.au/api/beach-data</code>
                </div>
                <p className="text-xs text-gray-400">
                  Free for non-commercial use • Rate limits apply • See documentation for details
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 bg-amber-50 border-l-4 border-amber-400 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Data Disclaimer</h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                OneWater aggregates and presents data from official government sources. We do not collect primary data. All data remains the property of the respective government agencies. While we strive for accuracy, users should consult official sources for critical decisions. Water quality can change rapidly due to environmental conditions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
