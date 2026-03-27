import type { Metadata } from 'next';
import { ServicePageLayout } from '@/components/services/ServicePageLayout';

export const metadata: Metadata = {
  title: 'AI Solutions Architect',
  description: 'AI solutions architecture and system design for production AI products. From data flow to infrastructure decisions — hands-on AI architecture consulting.',
};

export default function AISolutionsArchitectPage() {
  return (
    <ServicePageLayout
      title="AI Solutions Architect"
      description="End-to-end AI system design for production applications"
      keyword="AI Solutions Architecture"
      relatedDemo={{ href: '/demos', label: 'AI Demo Showroom' }}
      relatedCaseStudy={{ href: '/portfolio/orchestration-framework', label: 'Multi-Agent Orchestration' }}
    >
      <h2>Designing AI Systems That Ship</h2>
      <p>
        Building an AI product is not the same as calling an API. The difference between a demo and a production system
        is architecture — how data flows, where decisions are made, what fails gracefully, and what scales. I design
        the whole system, not just one model or one API call.
      </p>
      <p>
        As an AI solutions architect, I work at the intersection of software engineering and machine learning
        infrastructure. I map your business requirements to technical architecture, design data pipelines,
        select the right models for each task, and build the integration layer that makes it all work together.
      </p>

      <h2>What AI Architecture Actually Looks Like</h2>
      <p>
        Real AI architecture involves system boundaries, data flow diagrams, infrastructure decisions, and
        clear separation between what the AI handles and what traditional software handles. It means thinking
        about latency budgets, fallback strategies, cost controls, and monitoring from day one.
      </p>
      <p>
        I have designed multi-agent orchestration frameworks with formal privilege escalation, policy engines,
        and tenant isolation. I have built customer lifecycle engines that process thousands of orders with
        intelligent identity matching. The architecture decisions I make are informed by what I have shipped,
        not what I have read about.
      </p>

      <h3>Architecture Patterns I Work With</h3>
      <ul>
        <li><strong>Multi-agent orchestration</strong> — coordinating multiple AI agents with role-based access and escalation policies</li>
        <li><strong>RAG pipelines</strong> — retrieval-augmented generation with domain-specific knowledge bases</li>
        <li><strong>Streaming architectures</strong> — real-time AI responses with circuit breakers and graceful degradation</li>
        <li><strong>Hybrid cache-AI systems</strong> — preset responses for common queries, live AI for everything else</li>
        <li><strong>Cost-controlled AI access</strong> — rate limiting, token tracking, daily spend budgets</li>
      </ul>

      <h2>How I Work</h2>
      <p>
        Every engagement starts with understanding your problem, not your technology. I map the business process,
        identify where AI adds value versus where traditional automation is sufficient, and design a system
        architecture that balances capability with cost and complexity.
      </p>
      <p>
        Deliverables include architecture documents, data flow diagrams, infrastructure specs, and a clear
        implementation roadmap. I can then build it myself, hand it off to your team, or work alongside
        your engineers to implement.
      </p>

      <h2>When You Need an AI Architect</h2>
      <p>
        You need an AI solutions architect when you are moving beyond proof-of-concept. When the API call
        that worked in a notebook needs to become a production service that handles thousands of requests,
        manages costs, recovers from failures, and integrates with your existing systems. That transition
        from experiment to infrastructure is where architecture matters most.
      </p>
    </ServicePageLayout>
  );
}
