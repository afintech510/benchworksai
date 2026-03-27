import { HeroSection } from '@/components/home/HeroSection';
import { ServicesOverview } from '@/components/home/ServicesOverview';
import { SocialProofStrip } from '@/components/home/SocialProofStrip';
import { AvailabilityBadge } from '@/components/home/AvailabilityBadge';
import { DemoTeaser } from '@/components/home/DemoTeaser';
import { StructuredData } from '@/components/shared/StructuredData';

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Larkin Tech',
  url: 'https://larkintech.ai',
  logo: 'https://larkintech.ai/images/og-image.png',
  founder: {
    '@type': 'Person',
    name: 'Adam Larkin',
  },
  description: 'AI-powered automation solutions for businesses. Interactive demos, competitive analysis, and intelligent document processing.',
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
      <DemoTeaser />
    </>
  );
}
