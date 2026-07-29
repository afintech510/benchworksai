const CAPABILITIES = [
  {
    title: 'Websites & Custom Platforms',
    description: 'Fast, modern websites and full custom platforms — Next.js frontends, API backends, PostgreSQL data layers, payments, and booking — deployed and maintained in production.',
  },
  {
    title: 'Marketing & Growth',
    description: 'Local SEO, Google Ads, and email & SMS marketing engines that bring in customers — with tracking that ties spend to real leads and revenue.',
  },
  {
    title: 'Automation & AI',
    description: 'Automated invoicing, quotes, contracts, and workflows, plus chatbots and AI phone agents built to run reliably in daily operations — not just demo well.',
  },
  {
    title: 'Production Operations',
    description: 'Deployed and maintained production infrastructure with blue-green deployments, structured logging, rate limiting, security hardening, and cost monitoring.',
  },
];

const AVAILABLE_FOR = ['New website & platform builds', 'Monthly marketing & SEO', 'Automation & AI projects', 'Fractional CTO advisory'];

export function ResumeSection() {
  return (
    <section className="mt-16">
      <h2 className="text-2xl font-bold text-foreground">What We Bring</h2>
      <p className="mt-2 text-muted-foreground">
        Capabilities and outcomes, not job titles and buzzwords.
      </p>

      <div className="mt-8 space-y-6">
        {CAPABILITIES.map((cap) => (
          <div key={cap.title} className="rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground">{cap.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{cap.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 rounded-xl border border-primary/30 bg-primary/5 p-6">
        <h3 className="text-lg font-semibold text-foreground">We Help With</h3>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {AVAILABLE_FOR.map((item) => (
            <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
