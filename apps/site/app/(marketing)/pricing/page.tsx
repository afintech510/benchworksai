import type { Metadata } from 'next';
import Link from 'next/link';
import { RetainerTiers } from '@/components/pricing/RetainerTiers';
import { ProjectPricing } from '@/components/pricing/ProjectPricing';

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'AI implementation pricing — retainer plans for ongoing advisory and project-based pricing for focused builds. Transparent pricing, no hidden fees.',
};

export default function PricingPage() {
  return (
    <div className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground">Pricing</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Transparent pricing for AI implementation. Choose a retainer for ongoing
            partnership or project-based engagement for focused builds.
          </p>
          {/* PLACEHOLDER — Adam to finalize pricing */}
          <p className="mt-2 text-sm text-muted-foreground">
            All pricing is customized based on scope. Numbers below are starting points for conversation.
          </p>
        </div>

        {/* Retainer Tiers */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold text-foreground text-center">Monthly Retainer Plans</h2>
          <p className="mt-2 text-center text-muted-foreground">
            Ongoing AI advisory and implementation support.
          </p>
          <div className="mt-8">
            <RetainerTiers />
          </div>
        </section>

        {/* Project Pricing */}
        <section className="mt-20">
          <h2 className="text-2xl font-bold text-foreground text-center">Project-Based Pricing</h2>
          <p className="mt-2 text-center text-muted-foreground">
            Focused builds with defined scope, timeline, and deliverables.
          </p>
          <div className="mt-8">
            <ProjectPricing />
          </div>
        </section>

        {/* FAQ / Bottom CTA */}
        <div className="mt-20 rounded-xl border border-border bg-muted/30 p-8 text-center">
          <h2 className="text-xl font-semibold text-foreground">Not sure which option fits?</h2>
          <p className="mt-2 text-muted-foreground">
            Book a free 30-minute discovery call. We will map your needs to the right engagement model — no pressure, no commitment.
          </p>
          <Link
            href="/contact?type=smb_client"
            className="mt-6 inline-flex h-12 items-center justify-center rounded-lg bg-primary px-8 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            Book a Discovery Call
          </Link>
        </div>
      </div>
    </div>
  );
}
