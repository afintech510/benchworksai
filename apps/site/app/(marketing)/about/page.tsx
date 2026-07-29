import type { Metadata } from 'next';
import { BioSection } from '@/components/about/BioSection';
import { SkillsMatrix } from '@/components/about/SkillsMatrix';
import { ResumeSection } from '@/components/about/ResumeSection';
import { ExternalLinks } from '@/components/about/ExternalLinks';
import { StructuredData } from '@/components/shared/StructuredData';

export const metadata: Metadata = {
  title: 'About',
  description: 'BenchworksAI is a full-service digital team for local business — websites and platforms, SEO, ads, marketing, automation, and AI training. Founded by Adam Larkin.',
};

const personJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Adam Larkin',
  url: 'https://benchworksai.com',
  jobTitle: 'AI Solutions Architect',
  worksFor: {
    '@type': 'Organization',
    name: 'BenchworksAI',
    url: 'https://benchworksai.com',
  },
  knowsAbout: [
    'Artificial Intelligence',
    'Machine Learning',
    'Prompt Engineering',
    'Software Architecture',
    'Full-Stack Development',
  ],
  sameAs: [
    'https://linkedin.com/in/adamlarkin',
    'https://github.com/afintech510',
  ],
};

export default function AboutPage() {
  return (
    <div className="px-4 py-16 sm:px-6 lg:px-8">
      <StructuredData data={personJsonLd} />
      <div className="mx-auto max-w-4xl">
        <BioSection />
        <SkillsMatrix />
        <ResumeSection />
        <ExternalLinks />
      </div>
    </div>
  );
}
