const CAPABILITIES = [
  {
    title: 'AI System Design & Architecture',
    description: 'Designed multi-agent orchestration frameworks with privilege escalation, policy engines, and tenant isolation. Built production RAG pipelines and streaming AI interfaces.',
  },
  {
    title: 'Full-Stack Product Development',
    description: 'Delivered complete platforms from contract to production — Next.js frontends, API backends, PostgreSQL data layers, Docker deployment, and CI/CD pipelines.',
  },
  {
    title: 'Data Engineering & Analytics',
    description: 'Built customer lifecycle engines processing thousands of records with intelligent identity matching, behavioral segmentation, and analytics dashboards.',
  },
  {
    title: 'Production Operations',
    description: 'Deployed and maintained production infrastructure with blue-green deployments, structured logging, rate limiting, security hardening, and cost monitoring.',
  },
];

const AVAILABLE_FOR = ['Full-time roles', 'Contract engagements', 'Fractional CTO advisory', 'Project-based implementation'];

export function ResumeSection() {
  return (
    <section className="mt-16">
      <h2 className="text-2xl font-bold text-foreground">What I Bring</h2>
      <p className="mt-2 text-muted-foreground">
        Experience described as capabilities and outcomes, not job titles and company names.
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
        <h3 className="text-lg font-semibold text-foreground">Available For</h3>
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
