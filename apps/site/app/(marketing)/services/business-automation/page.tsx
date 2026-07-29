import type { Metadata } from 'next';
import { ServicePageLayout } from '@/components/services/ServicePageLayout';

export const metadata: Metadata = {
  title: 'Business Automation',
  description: 'Automated invoicing, quotes, contracts, and e-signed documents, plus email management and workflows that run the busywork for you.',
};

export default function BusinessAutomationPage() {
  return (
    <ServicePageLayout
      title="Business Automation"
      description="Automate the busywork that eats your week"
      keyword="Business Automation"
      relatedCaseStudy={{ href: '/portfolio/customer-lifecycle-engine', label: 'Customer Lifecycle Engine' }}
    >
      <h2>Stop doing by hand what software can do for you</h2>
      <p>
        Quotes, invoices, contracts, follow-ups, data entry — the administrative grind quietly eats
        hours every week and slows down your cash flow. We automate it. The repetitive, low-value tasks
        run themselves in the background so you and your team can focus on the work that actually needs
        a person.
      </p>

      <h2>What we automate</h2>
      <ul>
        <li><strong>Quotes & estimates</strong> — generated and sent in minutes, tracked through to approval</li>
        <li><strong>Invoicing & payments</strong> — automatic invoices, online payment, and reminders so you get paid faster</li>
        <li><strong>Contracts & e-signatures</strong> — auto-generated documents signed digitally, stored, and timestamped</li>
        <li><strong>Email management & sequencing</strong> — triage, routing, and follow-up sequences that never forget a lead</li>
        <li><strong>Workflows & data</strong> — connect your tools so information flows automatically instead of being re-typed</li>
      </ul>

      <h2>How we work</h2>
      <p>
        We map your current process — where time is spent, where things slip through the cracks — and
        automate the highest-impact, lowest-risk pieces first. We build on top of the tools you already
        use rather than forcing you to rip everything out, and we keep a human in the loop wherever
        judgment matters.
      </p>

      <h2>Why it matters</h2>
      <p>
        Every hour you spend on paperwork is an hour not spent serving customers or growing the business.
        Automation gives that time back, gets you paid sooner, and leaves a clean, documented trail — the
        kind of operation that runs smoothly and is worth more when you sell it.
      </p>
    </ServicePageLayout>
  );
}
