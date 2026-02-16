import Link from 'next/link';
import ParticleNetwork from './ParticleNetwork';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gray-900 text-gray-300 relative overflow-hidden">
      {/* Particle Network Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-slate-900 to-gray-900">
        <ParticleNetwork />
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Main Footer Content */}
        <div className="py-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-12">
          {/* Brand & Description - Takes more space */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center space-x-2">
              <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-xl">OW</span>
              </div>
              <span className="text-xl font-bold text-white">OneWater</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed max-w-sm">
              Australia&apos;s comprehensive water quality monitoring platform. Providing real-time, 
              science-based environmental data to empower communities and protect public health.
            </p>
            <div className="flex items-center space-x-4 pt-2">
              <a 
                href="https://github.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="GitHub"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </a>
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Twitter"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-2">
            <h3 className="mb-4 text-sm font-semibold text-white uppercase tracking-wider">Platform</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-sm text-gray-400 hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/methodology" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Methodology
                </Link>
              </li>
              <li>
                <Link href="/data-sources" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Data Sources
                </Link>
              </li>
            </ul>
          </div>

          {/* Data & API */}
          <div className="lg:col-span-2">
            <h3 className="mb-4 text-sm font-semibold text-white uppercase tracking-wider">Resources</h3>
            <ul className="space-y-3">
              <li>
                <a href="/api/beach-data" className="text-sm text-gray-400 hover:text-white transition-colors">
                  API Access
                </a>
              </li>
              <li>
                <a href="https://www.health.nsw.gov.au/environment/beaches/Pages/default.aspx" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-400 hover:text-white transition-colors">
                  NSW Beachwatch
                </a>
              </li>
              <li>
                <a href="https://www.epa.vic.gov.au/" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Victoria EPA
                </a>
              </li>
              <li>
                <a href="https://www.nhmrc.gov.au/" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-400 hover:text-white transition-colors">
                  NHMRC Guidelines
                </a>
              </li>
            </ul>
          </div>

          {/* Data Sources Info */}
          <div className="lg:col-span-4">
            <h3 className="mb-4 text-sm font-semibold text-white uppercase tracking-wider">Data Attribution</h3>
            <div className="space-y-4">
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <p className="text-xs text-gray-400 leading-relaxed">
                  Water quality data sourced from <span className="text-white font-medium">NSW Health Beachwatch</span> and <span className="text-white font-medium">Victoria EPA</span>. 
                  Quality ratings based on enterococci levels per 100ml, assessed against NHMRC recreational water quality guidelines.
                </p>
              </div>
              <div className="text-xs text-gray-500">
                <p className="mb-2 font-medium text-gray-400">Disclaimer:</p>
                <p className="leading-relaxed">
                  This platform aggregates public environmental data. Always check official sources for critical decisions. 
                  Water quality can change rapidly due to weather and environmental conditions.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500">
              © {currentYear} OneWater. All rights reserved. Built for public benefit.
            </p>
            <div className="flex items-center space-x-6">
              <Link href="/privacy" className="text-sm text-gray-500 hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-sm text-gray-500 hover:text-white transition-colors">
                Terms of Use
              </Link>
              <a href="mailto:contact@onewater.au" className="text-sm text-gray-500 hover:text-white transition-colors">
                Contact
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
