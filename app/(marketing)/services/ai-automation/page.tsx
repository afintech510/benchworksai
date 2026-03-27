import type { Metadata } from 'next';
import { ServicePageLayout } from '@/components/services/ServicePageLayout';

export const metadata: Metadata = {
  title: 'AI Automation Architect',
  description: 'AI workflow automation that replaces manual business processes. Trigger logic, human-in-the-loop patterns, and intelligent process design for real businesses.',
};

export default function AIAutomationPage() {
  return (
    <ServicePageLayout
      title="AI Automation That Replaces Manual Work"
      description="Rebuilding manual business processes with AI in the loop"
      keyword="AI Automation"
      relatedDemo={{ href: '/demos', label: 'Email & SMS Workflow Demo' }}
      relatedCaseStudy={{ href: '/portfolio/eastern-lm', label: 'Eastern LM Customer Engine' }}
    >
      <h2>Automation That Actually Works</h2>
      <p>
        Most business automation breaks when it hits the messy reality of daily operations. AI automation is
        different — it handles the ambiguity, variability, and judgment calls that traditional automation cannot.
        I build AI-powered workflows that replace hours of manual work with systems that think, adapt, and
        learn from your business patterns.
      </p>
      <p>
        This is not about replacing people. It is about removing the repetitive, low-value tasks that consume
        your team&apos;s time so they can focus on work that actually requires human judgment and relationships.
      </p>

      <h2>How AI Automation Differs from Traditional Automation</h2>
      <p>
        Traditional automation follows rigid if-then rules. AI automation handles the cases that fall between
        the rules — the emails that do not match a template, the documents with non-standard formats, the
        customer requests that need contextual understanding. I design workflows that combine AI intelligence
        with human-in-the-loop checkpoints at critical decision points.
      </p>

      <h3>Common Automation Patterns</h3>
      <ul>
        <li><strong>Communication workflows</strong> — AI-personalized follow-ups, appointment reminders, and project updates that sound human-written</li>
        <li><strong>Document processing pipelines</strong> — extract data from invoices, contracts, and forms regardless of format</li>
        <li><strong>Lead nurturing sequences</strong> — AI-generated email campaigns triggered by behavior, scored by engagement</li>
        <li><strong>Customer data enrichment</strong> — match orphaned records, deduplicate contacts, tag behavioral segments</li>
        <li><strong>Report generation</strong> — compile data from multiple sources into formatted reports with AI-written insights</li>
        <li><strong>Approval workflows</strong> — AI drafts, human reviews, system sends — maintaining quality control at every step</li>
      </ul>

      <h2>The Implementation Approach</h2>
      <p>
        I start by mapping your current processes — where time is spent, where errors occur, where bottlenecks
        form. Then I identify which tasks are candidates for AI automation versus traditional automation versus
        human-only. The highest-impact, lowest-risk automations ship first, building confidence before tackling
        complex workflows.
      </p>
      <p>
        A typical engagement produces 2-3 automated workflows in the first 30 days, with measurable time savings
        by week two. I build with your existing tools — your CRM, your email platform, your document management —
        adding AI intelligence on top rather than replacing your infrastructure.
      </p>

      <h2>Measured Results</h2>
      <p>
        I built a customer lifecycle engine that reduced manual data entry by identifying and matching thousands of
        orphaned orders to customer profiles using intelligent identity matching. That kind of automation — tedious
        for humans, trivial for AI — is where the real value lives. Not in flashy demos, but in the daily grind
        that eats hours every week.
      </p>
    </ServicePageLayout>
  );
}
