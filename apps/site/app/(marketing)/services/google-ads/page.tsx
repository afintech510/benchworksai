import type { Metadata } from 'next';
import { ServicePageLayout } from '@/components/services/ServicePageLayout';

export const metadata: Metadata = {
  title: 'Google Ads Management',
  description: 'Search and Local Services Ads managed end to end — campaign build, targeting, landing pages, and ongoing optimization with spend and ROI tracked.',
};

export default function GoogleAdsPage() {
  return (
    <ServicePageLayout
      title="Google Ads Management"
      description="Show up at the top, only pay for results"
      keyword="Paid Search & Local Services Ads"
    >
      <h2>Top of the page, today</h2>
      <p>
        SEO is the long game; Google Ads is how you show up at the top right now. We run Search and
        Local Services Ads that put you in front of people actively looking to buy — and we manage them
        so your budget goes to clicks that turn into customers, not wasted impressions.
      </p>

      <h2>What we manage</h2>
      <ul>
        <li><strong>Search Ads</strong> — keyword research, ad copy, and bidding focused on high-intent, ready-to-buy searches</li>
        <li><strong>Local Services Ads</strong> — the &ldquo;Google Guaranteed&rdquo; pay-per-lead placements above the map for service businesses</li>
        <li><strong>Landing pages</strong> — fast, focused pages built to convert ad clicks into calls and form fills</li>
        <li><strong>Call & conversion tracking</strong> — so every dollar is tied to a real lead, not a guess</li>
        <li><strong>Ongoing optimization</strong> — negative keywords, budget shifts, and testing to drive cost-per-lead down over time</li>
      </ul>

      <h2>How we work</h2>
      <p>
        We start lean, prove what converts, then scale the winners. You see exactly what you&apos;re
        spending, what it&apos;s returning, and where the leads are coming from — clear reporting,
        no jargon. We treat your ad budget like our own.
      </p>

      <h2>Why it matters</h2>
      <p>
        Done right, paid search is one of the few marketing channels where you can draw a straight line
        from dollars spent to jobs booked. It fills the pipeline immediately while your SEO and content
        build the long-term foundation underneath it.
      </p>
    </ServicePageLayout>
  );
}
