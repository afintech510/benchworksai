import type { Metadata } from 'next';
import { CaseStudyLayout } from '@/components/portfolio/CaseStudyLayout';

export const metadata: Metadata = {
  title: 'Customer Lifecycle Engine',
  description: 'Data pipeline processing thousands of POS orders with intelligent identity matching, behavioral segmentation, and analytics dashboard. Built with React, TypeScript, and Supabase.',
};

const architectureDiagram = `graph LR
    A[POS System] --> B[Raw Order Data]
    B --> C[Identity Matcher]
    C -->|Phone E.164| D[Customer Record]
    C -->|Email Fallback| D
    C -->|No Match| E[Orphaned Queue]
    E -.->|Manual Review| D
    D --> F[Enrichment Engine]
    F --> G[Behavioral Tagger]
    G -->|repeat| H[Customer Segments]
    G -->|high-value| H
    G -->|VIP| H
    G -->|at-risk| H
    H --> I[Analytics Dashboard]
    I --> J[Revenue Charts]
    I --> K[Segment Views]
    I --> L[Customer Profiles]`;

export default function CustomerLifecycleEnginePage() {
  return (
    <CaseStudyLayout
      title="Customer Lifecycle Engine"
      techStack={['React', 'TypeScript', 'Supabase', 'PostgreSQL', 'PapaParse', 'Recharts']}
      architectureDiagram={architectureDiagram}
      architectureCaption="Data pipeline from POS ingestion through identity matching, behavioral enrichment, and segmentation to the analytics dashboard."
      ctaText="Need to turn messy data into customer insights? Let's talk."
      ctaHref="/contact?type=smb_client"
      problem={
        <>
          <p>
            A building materials company had thousands of POS transactions with no reliable way to
            connect orders to customers. Their point-of-sale system captured phone numbers
            inconsistently — sometimes with area codes, sometimes without, sometimes with dashes or
            spaces. Email addresses were optional and rarely collected. The result: thousands of
            orphaned orders that could not be attributed to any customer profile.
          </p>
          <p>
            Without customer identity, there was no way to identify repeat buyers, recognize high-value
            accounts, detect churn risk, or measure customer lifetime value. Aggregate business metrics
            existed, but they told the story of the business, not of individual customer relationships.
            Marketing was spray-and-pray because there was no segmentation to target.
          </p>
        </>
      }
      approach={
        <>
          <p>
            We built a customer lifecycle engine that starts with the messiest part of the problem:
            identity resolution. The matching engine uses phone-first E.164 normalization — stripping
            all formatting, applying country codes, and matching against a canonical phone database.
            When phone matching fails, it falls back to email matching. Orders that still cannot be
            matched are queued for manual review with suggested matches ranked by confidence.
          </p>
          <p>
            Once orders are linked to customer profiles, the enrichment engine calculates behavioral
            tags: repeat purchaser (2+ orders in 90 days), high-value (top 20% by spend),
            VIP (both repeat and high-value), and at-risk (no order in 60+ days after being active).
            These tags update automatically as new orders flow through the pipeline.
          </p>
          <p>
            The Order Analytics Dashboard surfaces all of this through interactive visualizations —
            revenue trends, customer segment breakdowns, individual customer profiles with order
            history, and cohort analysis. Built with React, PapaParse for CSV ingestion, and
            Recharts for data visualization.
          </p>
        </>
      }
      technicalDecisions={
        <ul>
          <li><strong>Phone-first E.164 matching</strong> — phone numbers are more reliably captured at POS than email addresses. Normalizing to E.164 format before matching eliminates formatting-related false negatives.</li>
          <li><strong>Behavioral tagging as materialized views</strong> — segment tags are computed as database views that refresh on new data, avoiding the complexity of real-time event processing for a batch-oriented use case.</li>
          <li><strong>customer_type enum</strong> — a single enum column (new, repeat, high_value, vip, at_risk) enables simple query filtering across the application without joining to a separate segmentation table.</li>
          <li><strong>PapaParse for CSV ingestion</strong> — client-side CSV parsing keeps the data pipeline simple and avoids server-side file upload infrastructure for the initial import workflow.</li>
          <li><strong>Recharts over D3</strong> — Recharts provides declarative React components for standard chart types. The dashboard needs bar charts, line charts, and pie charts — not custom visualizations that would justify D3 complexity.</li>
        </ul>
      }
      results={
        <>
          <p>
            The identity matching engine successfully linked thousands of previously orphaned orders
            to customer profiles. The phone-first approach achieved a high match rate on first pass,
            with email fallback catching additional matches. The remaining unmatched orders were
            flagged for manual review with confidence-ranked suggestions.
          </p>
          <p>
            For the first time, the business could see which customers were VIPs, which were at risk
            of churning, and which segments were growing or shrinking. The analytics dashboard became
            the daily operational tool for sales and management decisions — replacing gut-feel with
            data-driven customer intelligence.
          </p>
        </>
      }
    />
  );
}
