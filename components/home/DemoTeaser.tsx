import Link from 'next/link';

export function DemoTeaser() {
  return (
    <section className="bg-background px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">
          See it in action
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Real sites we&apos;ve built for local businesses, plus live interactive tools you can
          try in your browser — no signup required.
        </p>
        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/demo/easternTruck"
            className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-8 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            View a Live Example Site
          </Link>
          <Link
            href="/demos"
            className="inline-flex h-12 items-center justify-center rounded-lg border border-border bg-background px-8 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            Try Interactive Demos
          </Link>
        </div>
      </div>
    </section>
  );
}
