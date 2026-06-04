import { HeroSection } from '@/components/home/HeroSection';
import { ServicesOverview } from '@/components/home/ServicesOverview';
import { SocialProofStrip } from '@/components/home/SocialProofStrip';
import { AvailabilityBadge } from '@/components/home/AvailabilityBadge';
import { EducationCallout } from '@/components/home/EducationCallout';
import { DemoTeaser } from '@/components/home/DemoTeaser';
import { StructuredData } from '@/components/shared/StructuredData';

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'BenchworksAI',
  url: 'https://benchworksai.com',
  logo: 'https://benchworksai.com/images/og-image.png',
  founder: {
    '@type': 'Person',
    name: 'Adam Larkin',
  },
  description: 'A full-service digital team for local businesses: websites and platforms, SEO, Google Ads, email & SMS marketing, automation, chatbots, and AI education & training.',
  sameAs: [
    'https://linkedin.com/in/adamlarkin',
    'https://github.com/afintech510',
  ],
};

export default function HomePage() {
  return (
    <>
      <StructuredData data={organizationJsonLd} />
      <div className="flex justify-center pt-4">
        <AvailabilityBadge />
      </div>
      <HeroSection />
      <SocialProofStrip />
      <ServicesOverview />
      <EducationCallout />
      <DemoTeaser />
    </>
  );
}
