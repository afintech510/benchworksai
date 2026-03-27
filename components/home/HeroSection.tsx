import Link from 'next/link';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-background px-4 py-20 sm:px-6 sm:py-32 lg:px-8">
      <div className="mx-auto max-w-4xl text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">
          AI Solutions Architect &amp; Implementation Specialist
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          I build AI systems that actually work in production
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          From architecture to deployment — hands-on AI implementation for businesses
          that want results, not slide decks. Interactive demos you can try right now.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/about"
            className="inline-flex h-12 items-center justify-center rounded-lg bg-foreground px-8 text-sm font-semibold text-background transition-colors hover:bg-foreground/90"
          >
            Hire Me
          </Link>
          <Link
            href="/contact"
            className="inline-flex h-12 items-center justify-center rounded-lg border border-border bg-background px-8 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            Work With Me
          </Link>
        </div>
      </div>
    </section>
  );
}
