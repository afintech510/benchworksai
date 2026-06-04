import type { Metadata } from 'next';
import { ServicePageLayout } from '@/components/services/ServicePageLayout';

export const metadata: Metadata = {
  title: 'SEO',
  description: 'Local and technical SEO that gets you found on Google for ready-to-buy searches — optimized pages, Google Business Profile, and content that ranks.',
};

export default function SeoPage() {
  return (
    <ServicePageLayout
      title="SEO That Gets You Found"
      description="Rank for the local searches that turn into customers"
      keyword="Search Engine Optimization"
    >
      <h2>Be the business that shows up first</h2>
      <p>
        When someone searches for what you do near where you are, you want to be at the top — on the
        map and in the results. SEO is how you get there without paying for every click. We specialize
        in the local and technical SEO that moves you up the rankings and keeps you there.
      </p>

      <h2>What we do</h2>
      <ul>
        <li><strong>Local SEO</strong> — a page for every service in every town you serve, built on a steady, natural schedule competitors can&apos;t match</li>
        <li><strong>Google Business Profile</strong> — claimed, optimized, and posted to regularly, because Google rewards active profiles</li>
        <li><strong>Technical SEO</strong> — fast load times, clean structure, schema markup, and the fixes that let Google read and trust your site</li>
        <li><strong>On-page optimization</strong> — titles, meta descriptions, headings, and content written for the searches that actually convert</li>
        <li><strong>Directory listings</strong> — consistent name, address, and phone across Google, Bing, Apple Maps, Yelp, and Facebook</li>
      </ul>

      <h2>How we work</h2>
      <p>
        We start by finding the searches your customers are actually using, then build the pages and
        signals to win them. SEO compounds — most agencies manage two or three pages a month; we build
        a content engine that fills the whole map over time. You get clear reporting on rankings,
        traffic, and the calls and leads they produce.
      </p>

      <h2>Why it matters</h2>
      <p>
        Paid ads stop the moment you stop paying. SEO is an asset that keeps working — a moat of local
        pages and reviews that gets harder for competitors to overtake the longer it runs. It is the
        most durable source of ready-to-buy traffic a local business can own.
      </p>
    </ServicePageLayout>
  );
}
