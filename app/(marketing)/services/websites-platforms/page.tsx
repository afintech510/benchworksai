import type { Metadata } from 'next';
import { ServicePageLayout } from '@/components/services/ServicePageLayout';

export const metadata: Metadata = {
  title: 'Websites & Platforms',
  description: 'From fast, modern websites to full custom operating platforms — built mobile-first, fast, and ready to grow with your business.',
};

export default function WebsitesPlatformsPage() {
  return (
    <ServicePageLayout
      title="Websites & Platforms"
      description="From a simple website to a full operating platform"
      keyword="Web Design & Development"
      relatedCaseStudy={{ href: '/demo/easternTruck', label: 'Eastern Truck Demo Site' }}
    >
      <h2>From a brochure site to the system that runs your business</h2>
      <p>
        Every business needs a fast, modern website that works on a phone and actually brings in
        calls. But many businesses outgrow the brochure — they need booking, payments, customer
        portals, and the workflows behind them. We build both, and everything in between, so you
        never have to start over when you grow.
      </p>

      <h2>What we build</h2>
      <ul>
        <li><strong>Marketing websites</strong> — fast, mobile-first sites with your real photos and local content, built to rank and convert</li>
        <li><strong>Custom platforms</strong> — booking, payments, customer accounts, dashboards, and the operational tooling your business actually runs on</li>
        <li><strong>Multi-location & multi-brand</strong> — separate sites and profiles that capture more local search without competing with each other</li>
        <li><strong>Integrations</strong> — connect your CRM, calendar, payment processor, and the tools you already use</li>
        <li><strong>Bilingual builds</strong> — English / Spanish from day one when your market needs it</li>
      </ul>

      <h2>How we work</h2>
      <p>
        We start with your goals and your customers, not a template. We design, build, and launch
        in phases — something useful goes live early, then we layer in the deeper platform features.
        You own everything we build: the site, the code, the accounts, and the data. When we hand it
        over, it is documented and yours to keep.
      </p>

      <h2>Why it matters</h2>
      <p>
        Your website is the hub everything else points to — SEO, ads, and marketing all send people
        there. A site that loads fast, looks credible, and makes it easy to book or call is the
        difference between traffic and customers. And a business that runs on documented systems is
        worth more when you eventually sell it.
      </p>
    </ServicePageLayout>
  );
}
