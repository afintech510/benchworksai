import Link from 'next/link';

export function DemoTeaser() {
  return (
    <section className="bg-background px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">
          Try Before You Buy
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Interactive AI demos built for real industries. Chatbots, analytics, document
          processing, competitive analysis — all live, all customizable.
        </p>
        <Link
          href="/demos"
          className="mt-8 inline-flex h-12 items-center justify-center rounded-lg bg-primary px-8 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
        >
          Explore the Demo Showroom
        </Link>
      </div>
    </section>
  );
}
