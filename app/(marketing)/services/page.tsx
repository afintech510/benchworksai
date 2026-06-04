import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Services',
  description: 'Websites & platforms, SEO, Google Ads, email & SMS marketing, business automation, booking, chatbots, AI education, and fractional CTO advisory.',
};

const SERVICES = [
  {
    slug: 'websites-platforms',
    title: 'Websites & Platforms',
    tagline: 'From a simple site to a full operating platform',
    blurb: 'Fast, modern websites — and when you need more, custom platforms that run your business: portals, dashboards, booking, payments, and the workflows behind them.',
  },
  {
    slug: 'seo',
    title: 'SEO',
    tagline: 'Get found by ready-to-buy local searches',
    blurb: 'Local and technical SEO that ranks you where customers are searching. Optimized pages, Google Business Profile, and content built to win the map and the clicks.',
  },
  {
    slug: 'google-ads',
    title: 'Google Ads Management',
    tagline: 'Show up at the top, only pay for results',
    blurb: 'Search and Local Services Ads managed end to end — campaign build, targeting, landing pages, and ongoing optimization with spend and ROI tracked.',
  },
  {
    slug: 'email-sms-marketing',
    title: 'Email & SMS Marketing',
    tagline: 'Bring customers back and fill the slow weeks',
    blurb: 'Email and text marketing engines plus the strategy behind them — campaigns, automated sequences, promos, and reminders that turn one-time jobs into repeat revenue.',
  },
  {
    slug: 'business-automation',
    title: 'Business Automation',
    tagline: 'Automate the busywork that eats your week',
    blurb: 'Automated invoicing, quotes, contracts, and e-signed documents, plus email management, sequencing, and workflows that run quietly in the background.',
  },
  {
    slug: 'booking-scheduling',
    title: 'Booking & Scheduling',
    tagline: 'Let customers book you in a few taps',
    blurb: 'Online scheduling and booking platforms with calendars, deposits, and automatic reminders — fewer phone tags, fewer no-shows, more booked work.',
  },
  {
    slug: 'chatbots-ai-assistants',
    title: 'Chatbots & AI Assistants',
    tagline: 'Never miss a lead, day or night',
    blurb: 'Website chatbots, customer-support assistants, and custom AI phone agents that answer, quote, and book around the clock — every captured lead is a job saved.',
  },
  {
    slug: 'ai-education-training',
    title: 'AI Education & Training',
    tagline: 'Teach your team to leverage their time',
    blurb: 'Coaching and hands-on training on the AI techniques and tools that fit your business — so you and your employees get more done, with or without us building it.',
  },
  {
    slug: 'fractional-cto',
    title: 'Fractional CTO & Advisory',
    tagline: 'On-call tech guidance without the full-time hire',
    blurb: 'Senior, vendor-neutral guidance on every business technology decision — websites, security systems, IT, phones, asset tracking — plus roadmap and build oversight.',
  },
];

export default function ServicesIndex() {
  return (
    <div className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground">Services</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Your full digital team under one roof. Pick what fits — or tell us your goals and we&apos;ll figure it out together.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {SERVICES.map((s) => (
            <Link
              key={s.slug}
              href={`/services/${s.slug}`}
              className="group rounded-xl border border-border bg-background p-6 hover:border-primary hover:shadow-md transition-all"
            >
              <h2 className="text-xl font-semibold text-foreground group-hover:text-primary">{s.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{s.tagline}</p>
              <p className="mt-4 text-sm text-foreground/80">{s.blurb}</p>
              <span className="mt-4 inline-flex items-center text-sm font-medium text-primary">Read more →</span>
            </Link>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-muted-foreground">Not sure which one?</p>
          <Link
            href="/contact"
            className="mt-3 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary/90"
          >
            Book a discovery call
          </Link>
        </div>
      </div>
    </div>
  );
}
