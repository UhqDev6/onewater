import Hero from '@/components/landing/Hero';
import Features from '@/components/landing/Features';
import Stats from '@/components/landing/Stats';
import LivePreview from '@/components/landing/LivePreview';

export default function Home() {
  return (
    <>
      <Hero />
      <LivePreview />
      <Features />
      <Stats />
    </>
  );
}
