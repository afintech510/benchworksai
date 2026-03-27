import type { Metadata } from 'next';
import { CaseStudyLayout } from '@/components/portfolio/CaseStudyLayout';

export const metadata: Metadata = {
  title: 'Multi-Agent Orchestration Framework',
  description: 'Production-grade multi-agent AI system with formal privilege escalation, policy engine, tenant isolation, and audit logging. Designed and built over a six-week phased sequence.',
};

const architectureDiagram = `graph TD
    A[Client Request] --> B[Chief of Staff Agent]
    B --> C{Policy Engine}
    C -->|Allowed| D[Task Router]
    C -->|Denied| E[Rejection + Audit Log]
    D --> F[Research Agent<br/>Level 0]
    D --> G[Analysis Agent<br/>Level 1]
    D --> H[Execution Agent<br/>Level 2]
    D --> I[Admin Agent<br/>Level 3-4]
    F --> J[Shared Context Store]
    G --> J
    H --> J
    I --> J
    J --> K[Response Aggregator]
    K --> B
    B --> L[Audit Trail]

    subgraph Privilege Escalation
        F -.->|Request Escalation| C
        G -.->|Request Escalation| C
        H -.->|Request Escalation| C
    end

    subgraph Tenant Isolation
        M[Tenant A Context]
        N[Tenant B Context]
    end`;

export default function OrchestrationFrameworkPage() {
  return (
    <CaseStudyLayout
      title="Multi-Agent Orchestration Framework"
      techStack={['Python', 'LangGraph', 'CrewAI', 'FastAPI', 'PostgreSQL', 'Redis', 'Docker']}
      architectureDiagram={architectureDiagram}
      architectureCaption="Agent hierarchy with privilege escalation flow and policy engine decision routing. Each agent operates at a defined maturity level, requesting escalation through the policy engine when tasks exceed their authorization."
      ctaText="Interested in AI agent architecture? Let's talk."
      ctaHref="/contact?type=hiring"
      problem={
        <>
          <p>
            Organizations increasingly need multiple AI agents to collaborate on complex business tasks —
            research, analysis, execution, and decision-making happening in parallel. But existing
            frameworks treat agent coordination as an afterthought: no formal privilege boundaries, no
            policy enforcement, and no audit trail for what each agent did and why.
          </p>
          <p>
            The result is fragile systems where any agent can do anything, errors cascade unpredictably,
            and there is no way to explain or reproduce the decisions the system made. For production
            use — especially in regulated industries — this is a non-starter.
          </p>
        </>
      }
      approach={
        <>
          <p>
            I designed a multi-agent orchestration framework built around three principles: formal
            privilege escalation, policy-driven authorization, and complete auditability. Every agent
            operates at a defined maturity level (0 through 4), and any action beyond its authorization
            must be explicitly approved through the policy engine.
          </p>
          <p>
            The architecture centers on a Chief of Staff agent that coordinates all task routing and
            response aggregation. This agent does not execute tasks itself — it delegates to specialized
            agents based on task type and required privilege level, then assembles coherent responses
            from their outputs.
          </p>
          <p>
            The system was designed for multi-tenant deployment, with complete context isolation between
            tenants. Each tenant&apos;s data, agent configurations, and audit logs are fully separated at
            the infrastructure level.
          </p>
        </>
      }
      technicalDecisions={
        <ul>
          <li><strong>Maturity ladder (Levels 0-4)</strong> — agents earn higher privilege levels based on demonstrated reliability, not static configuration. Level 0 agents can only read; Level 4 can modify system configuration.</li>
          <li><strong>Policy engine as separate service</strong> — authorization decisions are decoupled from agent logic, enabling policy updates without redeploying agents.</li>
          <li><strong>Shared context store with scoped access</strong> — agents share a context store for inter-agent communication, but access is scoped by privilege level and tenant boundary.</li>
          <li><strong>Immutable audit trail</strong> — every agent action, escalation request, and policy decision is logged with full context for reproducibility and compliance.</li>
          <li><strong>Redis for real-time coordination</strong> — agent-to-agent messaging and task queuing uses Redis for low-latency coordination, with PostgreSQL for durable state.</li>
        </ul>
      }
      results={
        <>
          <p>
            The framework was assessed as production-ready after three independent review cycles
            covering security, scalability, and operational maturity. The six-week phased build
            sequence delivered incrementally testable milestones — privilege escalation in week 2,
            policy engine in week 3, tenant isolation in week 4, with integration testing and
            hardening in weeks 5-6.
          </p>
          <p>
            The architecture supports horizontal scaling of individual agent types based on demand,
            with the Chief of Staff agent acting as the stable coordination layer. Policy updates
            can be deployed independently of agent code, enabling rapid iteration on authorization
            rules without system-wide redeployment.
          </p>
        </>
      }
    />
  );
}
