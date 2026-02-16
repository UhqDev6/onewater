import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About - OneWater',
  description: 'Learn about OneWater water quality monitoring platform',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <div className="border-b border-gray-200">
        <div className="container mx-auto px-4 py-16 max-w-5xl">
          <div className="flex items-center space-x-3 mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
            <h1 className="text-4xl font-bold text-gray-900">About OneWater</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl">
            Making water quality data accessible and actionable for all Australians
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-5xl">
        {/* Mission */}
        <section className="mb-12">
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border border-blue-100 p-8 md:p-10">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  This platform provides public access to Australian water quality monitoring data, beginning with coastal Enterococci indicators from state programs.
                </p>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Its broader objective is to establish an extensible infrastructure that enables the integration of environmental monitoring data with related scientific datasets, including microbial and genomic records.
                </p>
                <p className="text-gray-700 leading-relaxed">
                    The initiative is designed to grow incrementally, supporting transparency, reproducibility, and future environmental research collaborations.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Platform Functions */}
        <section className="mb-12">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Platform Functions</h2>
            <p className="text-gray-600">Technical infrastructure and data management capabilities</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                icon: (
                  <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
                  </svg>
                ),
                title: 'Data Integration and Normalization',
                desc: 'Aggregate water quality monitoring data from multiple state environmental agencies and apply standardized normalization protocols to ensure consistency across jurisdictions.',
                color: 'bg-blue-50'
              },
              {
                icon: (
                  <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                  </svg>
                ),
                title: 'Scientific Data Linkage',
                desc: 'Establish infrastructure to support future integration of water quality indicators with related microbial, genomic, and environmental datasets for cross-disciplinary research.',
                color: 'bg-indigo-50'
              },
              {
                icon: (
                  <svg className="w-6 h-6 text-cyan-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                  </svg>
                ),
                title: 'Temporal Monitoring and Trend Support',
                desc: 'Maintain historical records of water quality measurements to enable longitudinal analysis and the identification of seasonal, annual, or long-term environmental patterns.',
                color: 'bg-cyan-50'
              },
              {
                icon: (
                  <svg className="w-6 h-6 text-teal-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                  </svg>
                ),
                title: 'Public Data Accessibility and Transparency',
                desc: 'Provide open access to aggregated monitoring data and documented methodologies through web interfaces and programmatic API endpoints for public use and scientific validation.',
                color: 'bg-teal-50'
              }
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${item.color} mb-4`}>
                  {item.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Data Sources & Transparency */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* Data Sources */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900">Official Sources</h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">Partnering with government agencies:</p>
            <ul className="space-y-3">
              {[
                'NSW Beachwatch - Dept of Planning',
                'Victoria EPA - Environment Authority'
              ].map((item, i) => (
                <li key={i} className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Open & Transparent */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900">Open Access</h2>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">
              Committed to transparency. All data sources are documented, methodology is open for review, and we provide free platform access. We believe environmental data should be a public resource.
            </p>
          </div>
        </div>

        {/* Contact */}
        <section>
          <div className="bg-gray-900 text-white rounded-2xl p-8">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2">Get in Touch</h2>
                <p className="text-gray-300 mb-6">
                  Have questions, suggestions, or feedback? We&apos;d love to hear from you.
                </p>
                <a
                  href="mailto:info@onewater.au"
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                  <span>info@onewater.au</span>
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
