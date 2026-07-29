import Link from 'next/link';
import { RulerStrip } from '@/components/shared/RulerStrip';

export function HeroSection() {
  return (
    <section className="hero-grid relative overflow-hidden bg-background px-4 pb-20 pt-12 sm:px-6 sm:pb-28 lg:px-8">
      <RulerStrip className="relative z-[1] mx-auto mb-12 max-w-7xl" />
      <div className="relative z-[1] mx-auto max-w-4xl text-center">
        <p className="eyebrow justify-center">Your complete digital team</p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          We build the digital backbone of your business
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          From a simple website to a full operating platform — plus SEO, Google Ads, email
          &amp; SMS marketing, and automation that brings in customers and runs the busywork for
          you. And when AI can help, we build it and train your team to use it.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/services"
            className="inline-flex h-12 items-center justify-center rounded-lg bg-foreground px-8 text-sm font-semibold text-background transition-colors hover:bg-foreground/90"
          >
            See What We Do
          </Link>
          <Link
            href="/contact"
            className="inline-flex h-12 items-center justify-center rounded-lg border border-border bg-background px-8 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            Book a Discovery Call
          </Link>
        </div>
      </div>
    </section>
  );
}
