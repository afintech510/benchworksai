import type { Metadata } from 'next';
import { ServicePageLayout } from '@/components/services/ServicePageLayout';

export const metadata: Metadata = {
  title: 'AI Implementation Consultant',
  description: 'End-to-end AI implementation from requirements to production deployment. Not proof-of-concept — systems that run in production and deliver measurable results.',
};

export default function AIImplementationPage() {
  return (
    <ServicePageLayout
      title="AI Implementation From Requirements to Production"
      description="End-to-end AI delivery that ships production systems"
      keyword="AI Implementation Consultant"
      relatedCaseStudy={{ href: '/portfolio/hamptons-estate', label: 'Hamptons Estate Platform' }}
    >
      <h2>From Idea to Running System</h2>
      <p>
        There are plenty of AI consultants who will build you a proof-of-concept. I build systems that run
        in production — with monitoring, error handling, cost controls, and the operational maturity that
        separates a demo from a business tool. End-to-end implementation means I own the outcome, not just
        the architecture diagram.
      </p>
      <p>
        I have delivered complete digital platforms from contract to production — full-stack applications
        with AI integration, deployed infrastructure, and ongoing support. The implementation phase is where
        good architecture meets messy reality, and that is where I do my best work.
      </p>

      <h2>What End-to-End Means</h2>
      <p>
        End-to-end AI implementation covers the entire lifecycle: requirements gathering, system design,
        development, testing, deployment, and handoff. I write the code, configure the infrastructure,
        set up monitoring, and document everything. When I hand you the keys, you have a running system
        with clear documentation, not a zip file of source code.
      </p>

      <h3>Implementation Capabilities</h3>
      <ul>
        <li><strong>Full-stack development</strong> — Next.js, React, TypeScript, Python, Node.js — front-end to database</li>
        <li><strong>AI integration</strong> — Claude, GPT, embedding models, vector databases, RAG pipelines</li>
        <li><strong>Infrastructure</strong> — Docker, Supabase, Hetzner, GitHub Actions CI/CD, blue-green deployments</li>
        <li><strong>Data pipelines</strong> — ETL processes, data enrichment, customer identity matching, behavioral analytics</li>
        <li><strong>Production hardening</strong> — rate limiting, circuit breakers, cost controls, error recovery, structured logging</li>
        <li><strong>Security</strong> — JWT authentication, RLS policies, input validation, prompt injection prevention</li>
      </ul>

      <h2>How Engagements Work</h2>
      <p>
        Implementation projects start with a discovery phase where I map requirements, identify constraints,
        and propose an architecture. We agree on deliverables, timeline, and milestones before code is written.
        I deliver in phases — each with testable functionality — so you see progress early and can course-correct
        before the whole system is built.
      </p>
      <p>
        Typical implementation timelines range from 4-12 weeks depending on scope. A focused AI feature (like a
        customer-facing chatbot) might take 4 weeks. A complete platform with multiple AI capabilities,
        authentication, admin tools, and deployment infrastructure might take 12 weeks.
      </p>

      <h2>What You Get</h2>
      <p>
        At the end of an implementation engagement, you have a production system running on your infrastructure
        with clear documentation, a handoff session walking through the codebase, and 30 days of support for
        questions and issues. The code is yours — no vendor lock-in, no proprietary frameworks, no dependencies
        on my continued involvement.
      </p>
      <p>
        I build with standard, well-documented tools because I want you to be able to maintain and extend the
        system after I am done. If you choose to keep me on for ongoing development or fractional CTO advisory,
        that is great — but you should never feel locked in.
      </p>
    </ServicePageLayout>
  );
}
