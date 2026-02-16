import Link from 'next/link';

export default function Hero() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-32">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: 'url(/images/hero-bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-linear-to-b from-blue-200/20 to-blue-950/80" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl drop-shadow-lg">
            Australia&apos;s Water Quality{' '}
            <span className="text-blue-300">by OneWater</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-blue-50">
            Real-time monitoring and analysis of water quality data from beaches across NSW and
            Victoria. Empowering communities with transparent, science-based environmental data.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link
              href="/dashboard"
              className="rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors"
            >
              Explore Dashboard
            </Link>
            <Link
              href="/about"
              className="text-base font-semibold leading-7 text-white hover:text-blue-300 transition-colors"
            >
              Learn more <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
