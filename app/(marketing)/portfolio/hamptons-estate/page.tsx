import type { Metadata } from 'next';
import { CaseStudyLayout } from '@/components/portfolio/CaseStudyLayout';

export const metadata: Metadata = {
  title: 'Hamptons Estate Property Management Platform',
  description: 'Complete digital platform for a property management company in the Hamptons area — client portal, admin dashboard, automated notifications, and maps integration.',
};

const architectureDiagram = `graph TD
    A[Property Owners] --> B[Client Portal]
    C[Admin Team] --> D[Admin Dashboard]

    B --> E[Service Requests]
    B --> F[Billing & Payments]
    B --> G[Property Listings]

    D --> H[Client Management]
    D --> I[Service Scheduling]
    D --> J[Financial Reports]

    E --> K[Notification System]
    I --> K
    K --> L[Email via SendGrid]
    K --> M[SMS via Twilio]

    G --> N[Google Maps Integration]
    F --> O[Stripe Connect]

    subgraph Infrastructure
        P[Next.js App]
        Q[Supabase DB + Auth]
        R[Docker on VPS]
    end

    B --> P
    D --> P
    P --> Q
    P --> R`;

export default function HamptonsEstatePage() {
  return (
    <CaseStudyLayout
      title="Hamptons Estate Property Management"
      techStack={['Next.js', 'TypeScript', 'Tailwind', 'Supabase', 'Docker', 'SendGrid', 'Twilio', 'Google Maps API', 'Stripe Connect']}
      architectureDiagram={architectureDiagram}
      architectureCaption="Full platform architecture showing client portal, admin dashboard, notification system, maps integration, and payment processing. Deployed on Docker with Supabase for database and auth."
      ctaText="Need a custom platform built end-to-end? Let's talk."
      ctaHref="/contact?type=smb_client"
      problem={
        <>
          <p>
            A property management company in the Hamptons area of Long Island was running their
            entire operation on spreadsheets, phone calls, and paper forms. Property listings lived
            in a shared document. Service requests came in via phone and were tracked on a whiteboard.
            Billing was manual — invoices created one at a time, payments tracked in a separate
            spreadsheet, late notices sent by hand.
          </p>
          <p>
            The business was growing, but the manual processes could not scale. New properties meant
            more phone calls, more spreadsheet rows, more opportunities for things to fall through
            the cracks. The team spent more time on administrative coordination than on the
            property management work that actually generated revenue.
          </p>
        </>
      }
      approach={
        <>
          <p>
            This was a full client engagement — from initial requirements gathering and contract
            negotiation through production deployment and handoff. I structured the engagement with
            a tiered Digital Services Agreement that included system ownership vesting milestones,
            ensuring the client would own the platform outright after the engagement completed.
          </p>
          <p>
            The platform was built as two connected applications: a client-facing portal where
            property owners can view their listings, submit service requests, and manage billing;
            and an admin dashboard where the management team handles client management, service
            scheduling, and financial reporting. Both share a single Supabase backend with
            row-level security ensuring data isolation between clients.
          </p>
          <p>
            I integrated Google Maps for property visualization, Stripe Connect for payment
            processing with automated invoicing, and SendGrid plus Twilio for multi-channel
            notifications — email for formal communications, SMS for time-sensitive service updates.
          </p>
        </>
      }
      technicalDecisions={
        <ul>
          <li><strong>Tiered service agreement with ownership vesting</strong> — the client gains full system ownership after engagement milestones, eliminating vendor lock-in concerns and aligning incentives.</li>
          <li><strong>Supabase RLS for multi-tenant isolation</strong> — row-level security policies ensure property owners can only access their own data without requiring separate database instances per client.</li>
          <li><strong>Stripe Connect over direct Stripe</strong> — Connect enables the property management company to process payments on behalf of property owners with automated fee splitting.</li>
          <li><strong>Docker on Hetzner VPS</strong> — lower ongoing infrastructure cost than managed cloud platforms, with full control over the deployment environment. Blue-green deployment for zero-downtime updates.</li>
          <li><strong>Multi-channel notifications</strong> — email for invoices and formal updates, SMS for urgent service notifications. Channel selection is automatic based on notification type.</li>
        </ul>
      }
      results={
        <>
          <p>
            The platform replaced the entire manual workflow — from property listing management
            through service coordination to billing and collections. The admin team reported
            significant time savings on administrative tasks, with automated notifications
            eliminating the need for manual follow-up calls and reminder emails.
          </p>
          <p>
            The client portal gave property owners self-service access to their information for
            the first time, reducing inbound phone calls for routine inquiries. Automated invoicing
            and payment processing improved cash flow by reducing the delay between service delivery
            and payment collection.
          </p>
          <p>
            The system was deployed to production on Docker with automated backups and monitoring,
            and the client received full documentation, a codebase walkthrough, and 30 days of
            post-launch support.
          </p>
        </>
      }
    />
  );
}
