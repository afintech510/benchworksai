import Link from 'next/link';

interface Tier {
  name: string;
  price: string;
  period: string;
  bestFor: string;
  includes: string[];
  recommended?: boolean;
  ctaParams: string;
}

// PLACEHOLDER — Adam to finalize pricing
const TIERS: Tier[] = [
  {
    name: 'Starter',
    price: '$2,500',
    period: '/month',
    bestFor: 'SMBs starting with AI',
    includes: [
      '10 hours/month advisory',
      'AI opportunity assessment',
      'Monthly strategy call',
      'Email support',
      'Tool recommendations',
    ],
    ctaParams: '?type=smb_client&project=starter_retainer',
  },
  {
    name: 'Growth',
    price: '$5,000',
    period: '/month',
    bestFor: 'Growing companies with active AI initiatives',
    includes: [
      '20 hours/month advisory + implementation',
      'Architecture review & design',
      'Bi-weekly strategy calls',
      'Priority support (Slack)',
      'Vendor evaluation & selection',
      'Team mentoring sessions',
    ],
    recommended: true,
    ctaParams: '?type=smb_client&project=growth_retainer',
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    bestFor: 'Full AI transformation',
    includes: [
      'Fractional CTO engagement',
      'Dedicated weekly availability',
      'Full architecture ownership',
      'Team hiring & onboarding support',
      'Board/investor AI briefings',
      'Production system oversight',
    ],
    ctaParams: '?type=smb_client&project=enterprise_retainer',
  },
];

export function RetainerTiers() {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {TIERS.map((tier) => (
        <div
          key={tier.name}
          className={`relative rounded-xl border p-6 ${
            tier.recommended
              ? 'border-primary shadow-lg ring-1 ring-primary/20'
              : 'border-border'
          }`}
        >
          {tier.recommended && (
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white">
              Recommended
            </span>
          )}

          <h3 className="text-lg font-semibold text-foreground">{tier.name}</h3>
          <div className="mt-2">
            <span className="text-3xl font-bold text-foreground">{tier.price}</span>
            {tier.period && <span className="text-muted-foreground">{tier.period}</span>}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">Best for: {tier.bestFor}</p>

          <ul className="mt-6 space-y-3">
            {tier.includes.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="mt-0.5 h-4 w-4 shrink-0 text-primary">&#10003;</span>
                {item}
              </li>
            ))}
          </ul>

          <Link
            href={`/contact${tier.ctaParams}`}
            className={`mt-8 block rounded-lg px-4 py-3 text-center text-sm font-semibold transition-colors ${
              tier.recommended
                ? 'bg-primary text-white hover:bg-primary-hover'
                : 'border border-border text-foreground hover:bg-muted'
            }`}
          >
            {tier.price === 'Custom' ? 'Contact for Pricing' : 'Get Started'}
          </Link>
        </div>
      ))}
    </div>
  );
}
