import Link from 'next/link';

const SERVICES = [
  {
    title: 'Websites & Platforms',
    description: 'From a simple, fast website to a full custom operating platform for your business.',
    href: '/services/websites-platforms',
    icon: '🌐',
  },
  {
    title: 'SEO',
    description: 'Get found on Google. Local and technical SEO that ranks you for ready-to-buy searches.',
    href: '/services/seo',
    icon: '🔍',
  },
  {
    title: 'Google Ads Management',
    description: 'Search and Local Services Ads, managed end to end with spend and ROI tracked.',
    href: '/services/google-ads',
    icon: '🎯',
  },
  {
    title: 'Email & SMS Marketing',
    description: 'Campaign engines, sequences, and strategy that bring past customers back.',
    href: '/services/email-sms-marketing',
    icon: '📣',
  },
  {
    title: 'Business Automation',
    description: 'Automated invoicing, quotes, contracts, e-signatures, and email workflows.',
    href: '/services/business-automation',
    icon: '⚙️',
  },
  {
    title: 'Booking & Scheduling',
    description: 'Online scheduling and booking platforms with automatic reminders.',
    href: '/services/booking-scheduling',
    icon: '📅',
  },
  {
    title: 'Chatbots & AI Assistants',
    description: 'Website chatbots, support assistants, and AI phone agents that never miss a lead.',
    href: '/services/chatbots-ai-assistants',
    icon: '💬',
  },
  {
    title: 'AI Education & Training',
    description: 'We teach you and your team the techniques and tools to leverage your time.',
    href: '/services/ai-education-training',
    icon: '🎓',
  },
  {
    title: 'Fractional CTO & Advisory',
    description: 'On-call guidance on every business technology decision — without a full-time hire.',
    href: '/services/fractional-cto',
    icon: '🧭',
  },
];

export function ServicesOverview() {
  return (
    <section className="bg-muted/30 px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            What We Do
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Your full digital team — build, grow, and automate.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((service) => (
            <Link
              key={service.href}
              href={service.href}
              className="group rounded-xl border border-border bg-background p-6 transition-all hover:border-primary/50 hover:shadow-lg"
            >
              <div className="text-3xl">{service.icon}</div>
              <h3 className="mt-4 text-lg font-semibold text-foreground group-hover:text-primary">
                {service.title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {service.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
