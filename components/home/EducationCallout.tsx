import Link from 'next/link';

export function EducationCallout() {
  return (
    <section className="bg-muted/30 px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl rounded-2xl border border-border bg-background p-8 text-center sm:p-12">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">
          AI Education &amp; Training
        </p>
        <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground">
          Sometimes the fastest win isn&apos;t software — it&apos;s knowing how
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          In many cases, the biggest gains come from teaching you and your team the right
          techniques and tools. We coach and train your people to use AI day to day — so you
          leverage your time and your team&apos;s time, with or without us building anything.
        </p>
        <Link
          href="/services/ai-education-training"
          className="mt-8 inline-flex h-12 items-center justify-center rounded-lg bg-primary px-8 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
        >
          Explore Training &amp; Coaching
        </Link>
      </div>
    </section>
  );
}
