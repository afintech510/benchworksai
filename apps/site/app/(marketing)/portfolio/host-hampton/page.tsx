import type { Metadata } from 'next';
import { CaseStudyLayout } from '@/components/portfolio/CaseStudyLayout';

export const metadata: Metadata = {
  title: 'HostHampton Event Platform',
  description: 'High-conversion event platform with boutique Hamptons aesthetic, modular fundraiser configuration, multi-step lead capture, and Twilio MMS marketing integration.',
};

const architectureDiagram = `graph TD
    A[Landing Page] --> B[Event Discovery]
    B --> C[Multi-Step Form]
    C --> D[Step 1: Interest]
    D --> E[Step 2: Details]
    E --> F[Step 3: Payment]
    F --> G[Confirmation Page]
    G --> H[Email Confirmation]
    G --> I[SMS Follow-Up]

    J[FUNDRAISER_CONFIG] --> A
    J --> B
    J --> K[Merch Store]
    K --> L[Custom Trucker Hats]
    K --> M[Patches & Accessories]

    I --> N[Twilio MMS]
    N --> O[Event Reminders]
    N --> P[Photo Sharing]`;

export default function HostHamptonPage() {
  return (
    <CaseStudyLayout
      title="HostHampton"
      techStack={['React', 'JavaScript', 'Tailwind', 'Twilio MMS']}
      architectureDiagram={architectureDiagram}
      architectureCaption="Event flow from landing page through multi-step registration, payment processing, and multi-channel follow-up. The FUNDRAISER_CONFIG object enables rapid deployment for new events."
      ctaText="Need a high-conversion event platform? Let's talk."
      ctaHref="/contact?type=smb_client"
      problem={
        <>
          <p>
            A community event organization in the Hamptons needed a digital presence that matched
            the premium, boutique aesthetic of their events. Existing event platforms felt generic —
            cookie-cutter templates that did not reflect the brand or create the sense of exclusivity
            that drives ticket sales and fundraiser participation in the Hamptons market.
          </p>
          <p>
            Beyond aesthetics, they needed integrated lead capture that converted browsers into
            attendees with minimal friction, fundraiser support with custom merchandise (trucker hats
            and patches), and a follow-up system that kept attendees engaged between events.
          </p>
        </>
      }
      approach={
        <>
          <p>
            We designed the platform around two core principles: boutique aesthetics that match the
            Hamptons brand, and a modular configuration system that makes launching new events fast.
            The visual design uses muted earth tones, generous whitespace, and typography that feels
            editorial rather than commercial.
          </p>
          <p>
            The technical architecture centers on a reusable FUNDRAISER_CONFIG JavaScript object
            that defines everything about an event — name, dates, ticket tiers, merchandise options,
            and follow-up sequences. Launching a new event is a configuration change, not a code
            change. This eliminated the weeks of development time previously required for each event.
          </p>
          <p>
            The multi-step lead capture form was designed for high completion rates — each step
            collects progressively more information, with clear progress indicators and the ability
            to save and return. Twilio MMS integration enables rich follow-up messages with event
            photos and location details.
          </p>
        </>
      }
      technicalDecisions={
        <ul>
          <li><strong>FUNDRAISER_CONFIG pattern</strong> — a single configuration object drives the entire event experience. New events require zero code changes — just a new config entry with event details, ticket tiers, and merchandise options.</li>
          <li><strong>Multi-step form over single page</strong> — breaking registration into 3 steps improved completion rates by reducing perceived complexity. Each step validates independently, and progress is saved to prevent data loss.</li>
          <li><strong>Twilio MMS over email-only</strong> — SMS open rates far exceed email in the target demographic. MMS enables rich content (event photos, map pins) that drives higher engagement than plain text.</li>
          <li><strong>Tailwind for rapid design iteration</strong> — the boutique aesthetic required extensive visual tuning. Utility-first CSS enabled rapid iteration on spacing, typography, and color without fighting CSS specificity.</li>
        </ul>
      }
      results={
        <>
          <p>
            The platform achieved high completion rates on the multi-step registration form,
            with the progressive disclosure pattern reducing abandonment compared to the previous
            single-page approach. The FUNDRAISER_CONFIG architecture enabled rapid deployment of
            new events — what previously took weeks of custom development could be launched with
            a configuration update.
          </p>
          <p>
            The custom merchandise integration (trucker hats and patches) created an additional
            revenue stream and brand touchpoint. Twilio MMS follow-ups maintained engagement
            between events, with rich media content driving higher response rates than
            email-only campaigns.
          </p>
          <p>
            The boutique Hamptons aesthetic differentiated the platform from generic event tools,
            aligning the digital experience with the premium positioning of the in-person events.
          </p>
        </>
      }
    />
  );
}
