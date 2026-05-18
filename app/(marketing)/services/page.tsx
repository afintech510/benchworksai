import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Services',
  description: 'AI implementation, automation, prompt engineering, and fractional CTO services.',
};

const SERVICES = [
  {
    slug: 'ai-implementation',
    title: 'AI Implementation',
    tagline: 'From requirements to production deployment',
    blurb: 'End-to-end AI delivery — not proof-of-concept. Systems that run in production with monitoring, error handling, and cost controls.',
  },
  {
    slug: 'ai-automation',
    title: 'AI Automation',
    tagline: 'Replace repetitive work with intelligent workflows',
    blurb: 'Operational automation that combines AI with workflow orchestration. Email triage, document processing, lead routing, reporting.',
  },
  {
    slug: 'ai-solutions-architect',
    title: 'AI Solutions Architect',
    tagline: 'Design the right system before you build the wrong one',
    blurb: 'Architecture-first engagements. Vendor selection, integration design, cost modeling, and reference implementations.',
  },
  {
    slug: 'prompt-engineering',
    title: 'Prompt Engineering',
    tagline: 'Tune model behavior for production reliability',
    blurb: 'Structured prompting, evals, output schemas, and the systems work that turns a flaky demo into a dependable feature.',
  },
  {
    slug: 'fractional-cto',
    title: 'Fractional CTO',
    tagline: 'Senior technical leadership without the full-time hire',
    blurb: 'Strategic technical guidance for founders and growing teams — architecture, hiring, vendor decisions, and roadmap.',
  },
];

export default function ServicesIndex() {
  return (
    <div className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground">Services</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Five engagement shapes, one operator. Pick what fits — or talk to me and we&apos;ll figure it out.
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
