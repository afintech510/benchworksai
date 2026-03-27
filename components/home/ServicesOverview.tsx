import Link from 'next/link';

const SERVICES = [
  {
    title: 'AI Solutions Architecture',
    description: 'System design for AI-powered products — from data flow to deployment.',
    href: '/services/ai-solutions-architect',
    icon: '🏗️',
  },
  {
    title: 'Prompt Engineering',
    description: 'Reliable AI behavior through engineered prompts and evaluation.',
    href: '/services/prompt-engineering',
    icon: '🎯',
  },
  {
    title: 'AI Automation',
    description: 'Replace manual business processes with AI-powered workflows.',
    href: '/services/ai-automation',
    icon: '⚡',
  },
  {
    title: 'Fractional CTO',
    description: 'Senior tech leadership and AI strategy without the full-time cost.',
    href: '/services/fractional-cto',
    icon: '🧭',
  },
  {
    title: 'AI Implementation',
    description: 'End-to-end delivery from requirements to production deployment.',
    href: '/services/ai-implementation',
    icon: '🚀',
  },
  {
    title: 'Interactive Demos',
    description: 'Try AI tools built for your industry — live, no signup required to browse.',
    href: '/demos',
    icon: '💡',
  },
];

export function ServicesOverview() {
  return (
    <section className="bg-muted/30 px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            What I Build
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Hands-on AI implementation across the full stack
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
