import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Explore BenchworksAI',
  description: 'A guided tour of the BenchworksAI platform — interactive AI demos, services, and case studies.',
};

const SECTIONS: { heading: string; subhead: string; links: { href: string; label: string; desc?: string; external?: boolean }[] }[] = [
  {
    heading: '1 · Try a demo',
    subhead: 'Pick your industry, run a live AI interaction in your browser.',
    links: [
      { href: '/demos', label: 'Demo Showroom', desc: 'Start here — choose your vertical' },
      { href: '/demos/chatbot/construction', label: 'AI Chatbot — Construction' },
      { href: '/demos/analytics/property_mgmt', label: 'Predictive Analytics — Property Management' },
      { href: '/demos/competitive_analysis/general_smb', label: 'Competitive Analysis — General SMB' },
      { href: '/demos/doc_drafting/legal', label: 'Document Drafting — Legal' },
      { href: '/demos/marketing_engine/construction', label: 'Marketing Engine — Construction' },
    ],
  },
  {
    heading: '2 · See what we do',
    subhead: 'Our services, real client work, and the story behind it.',
    links: [
      { href: '/services', label: 'Services overview' },
      { href: '/portfolio', label: 'Case studies' },
      { href: '/about', label: 'About Adam' },
      { href: '/pricing', label: 'Pricing' },
    ],
  },
  {
    heading: '3 · Get in touch',
    subhead: 'Send a message or book a 30-minute discovery call.',
    links: [
      { href: '/contact', label: 'Contact + booking', desc: 'Send a message or book a 30-min call' },
      { href: 'https://cal.com/adam-benchworksai-com/30min', label: 'Book directly on Cal.com', external: true },
    ],
  },
];

export default function ExplorePage() {
  return (
    <div className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground">Explore BenchworksAI</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            A quick tour — try a demo, see what we&apos;ve built, then let&apos;s talk.
          </p>
        </div>

        <div className="mt-12 space-y-12">
          {SECTIONS.map((section) => (
            <section key={section.heading}>
              <h2 className="text-xl font-semibold text-foreground">{section.heading}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{section.subhead}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {section.links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-lg border border-border bg-background p-4 hover:border-primary hover:shadow-sm transition-all"
                    target={link.external ? '_blank' : undefined}
                    rel={link.external ? 'noopener noreferrer' : undefined}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">{link.label}</span>
                      <span className="text-xs text-muted-foreground">{link.external ? '↗' : '→'}</span>
                    </div>
                    {link.desc && <p className="mt-1 text-xs text-muted-foreground">{link.desc}</p>}
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
