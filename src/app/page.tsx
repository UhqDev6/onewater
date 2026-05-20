import Hero from '@/components/landing/Hero';
import Features from '@/components/landing/Features';
import Stats from '@/components/landing/Stats';
import LivePreview from '@/components/landing/LivePreview';
import ScienceInsight from '@/components/landing/ScienceInsight';
import PollutionSourceOverview from '@/components/landing/PollutionSourceOverview';
import StatsOverview from '@/components/landing/StatsOverview';
// import PollutionAlert from '@/components/landing/PollutionAlert';
import BeachCameraPreview from '@/components/landing/BeachCameraPreview';

export default function Home() {
  return (
    <>
      <Hero />
      <StatsOverview />
      <LivePreview />
      {/* Temporarily hidden - PollutionAlert component */}
      {/* <PollutionAlert /> */}
      <ScienceInsight />
      <PollutionSourceOverview />
      <BeachCameraPreview />
      <Features />
      <Stats />
    </>
  );
}
