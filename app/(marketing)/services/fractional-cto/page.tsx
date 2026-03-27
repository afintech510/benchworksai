import type { Metadata } from 'next';
import { ServicePageLayout } from '@/components/services/ServicePageLayout';

export const metadata: Metadata = {
  title: 'Fractional CTO & AI Advisor',
  description: 'Fractional CTO and AI strategy advisor for companies that need senior tech leadership without the full-time cost. Technology evaluation, vendor selection, and team guidance.',
};

export default function FractionalCTOPage() {
  return (
    <ServicePageLayout
      title="Fractional CTO & AI Strategy Advisor"
      description="Senior AI leadership without the full-time commitment"
      keyword="Fractional CTO AI Advisor"
      ctaHref="/contact"
      ctaText="Book a Discovery Call"
    >
      <h2>Senior Tech Leadership, When You Need It</h2>
      <p>
        Not every company needs a full-time CTO, but every company making AI decisions needs someone who
        has built and shipped AI systems. I provide fractional CTO services focused on AI strategy —
        the technical leadership to make smart technology decisions without the overhead of a full-time
        executive hire.
      </p>
      <p>
        This is advisory work grounded in implementation experience. I have designed production architectures,
        managed deployments, and debugged systems at 2 AM. When I advise on technology choices, it comes from
        building things, not from reading analyst reports.
      </p>

      <h2>What a Fractional CTO Does</h2>
      <p>
        I work with founders, business owners, and existing technical teams to evaluate opportunities, avoid
        expensive mistakes, and build a coherent technology strategy. Engagements typically run 10-20 hours per
        month — enough to provide meaningful guidance without the six-figure salary.
      </p>

      <h3>Core Activities</h3>
      <ul>
        <li><strong>AI opportunity assessment</strong> — identifying where AI adds real value in your business versus where it is premature</li>
        <li><strong>Technology evaluation</strong> — build vs. buy decisions, vendor selection, platform comparison with hands-on testing</li>
        <li><strong>Architecture review</strong> — evaluating existing systems and designing migration paths to AI-enhanced infrastructure</li>
        <li><strong>Team guidance</strong> — mentoring developers, reviewing code and architecture decisions, setting engineering standards</li>
        <li><strong>Vendor management</strong> — speaking the technical language with your SaaS providers, API partners, and infrastructure vendors</li>
        <li><strong>Roadmap planning</strong> — sequencing AI initiatives for maximum impact with minimum risk</li>
      </ul>

      <h2>Who This Is For</h2>
      <p>
        This service is for companies with $1M-$20M in revenue that know they need to incorporate AI but do not
        have the in-house expertise to evaluate options, avoid pitfalls, and build a coherent strategy. You might
        be a business owner who has been pitched 47 AI tools this quarter and cannot tell which ones are real.
        You might be a startup founder who needs a technical co-pilot for the next 6 months. You might be an
        agency that needs AI implementation guidance for client projects.
      </p>

      <h2>Engagement Structure</h2>
      <p>
        Fractional CTO engagements start with a discovery call to understand your current state, goals, and
        constraints. From there, I propose a monthly retainer covering a set number of advisory hours, with
        deliverables like architecture documents, technology assessments, or roadmap plans. Most clients start
        at 10 hours per month and adjust based on project demands.
      </p>
      <p>
        If advisory work reveals an implementation opportunity, I can shift into hands-on building mode —
        but I will always be transparent about when you need strategy versus when you need execution.
      </p>
    </ServicePageLayout>
  );
}
