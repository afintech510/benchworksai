import type { Metadata } from 'next';
import { ServicePageLayout } from '@/components/services/ServicePageLayout';

export const metadata: Metadata = {
  title: 'Fractional CTO & Advisory',
  description: 'On-call technology leadership for businesses that need senior guidance without a full-time hire — websites, security systems, IT, phones, asset tracking, vendors, and roadmap.',
};

export default function FractionalCTOPage() {
  return (
    <ServicePageLayout
      title="Fractional CTO & Advisory"
      description="On-call tech guidance without the full-time hire"
      keyword="Fractional CTO & Technology Advisory"
      ctaHref="/contact"
      ctaText="Book a Discovery Call"
    >
      <h2>Senior tech guidance, when you need it</h2>
      <p>
        Not every business needs a full-time CTO, but every business making technology decisions needs
        someone in their corner who has actually built and run these systems. We act as your de-facto,
        on-call CTO — the technical partner you call before you buy or sign anything, without the
        six-figure salary.
      </p>
      <p>
        This is advisory work grounded in real implementation. We have designed, built, and operated
        production systems — so when we weigh in on a technology choice, it comes from shipping things,
        not from reading vendor brochures.
      </p>

      <h2>What we advise on</h2>
      <ul>
        <li><strong>Every tech decision</strong> — websites and software, security systems, IT, business phones, and asset / fleet tracking</li>
        <li><strong>Build vs. buy</strong> — vendor selection and platform comparisons with hands-on testing, not guesswork</li>
        <li><strong>Vendor management</strong> — we speak the technical language with your SaaS providers, installers, and partners so you don&apos;t get oversold</li>
        <li><strong>Roadmap planning</strong> — sequencing projects for the most impact with the least risk and cost</li>
        <li><strong>Team & oversight</strong> — guiding your staff or contractors and keeping builds on track</li>
      </ul>

      <h2>Who this is for</h2>
      <p>
        For owners who&apos;ve been pitched a dozen tools and can&apos;t tell which are real, who are
        about to spend on a system and want a second opinion, or who simply want one trusted person
        responsible for the technology side of the business. You bring the goals; we bring the judgment.
      </p>

      <h2>How we work</h2>
      <p>
        Engagements start with a discovery call to understand where you are and where you&apos;re headed.
        From there we set a simple monthly retainer for on-call advisory and oversight. And when the
        advice turns into something worth building, we can shift into hands-on mode — always transparent
        about when you need strategy versus execution.
      </p>
    </ServicePageLayout>
  );
}
