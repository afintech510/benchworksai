import Link from 'next/link';
import { StructuredData } from '@/components/shared/StructuredData';

interface ServicePageLayoutProps {
  title: string;
  description: string;
  keyword: string;
  children: React.ReactNode;
  ctaHref?: string;
  ctaText?: string;
  relatedDemo?: { href: string; label: string };
  relatedCaseStudy?: { href: string; label: string };
}

export function ServicePageLayout({
  title,
  description,
  keyword,
  children,
  ctaHref = '/contact',
  ctaText = 'Start a Conversation',
  relatedDemo,
  relatedCaseStudy,
}: ServicePageLayoutProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: title,
    description,
    provider: {
      '@type': 'Person',
      name: 'Adam Larkin',
      url: 'https://larkintech.ai',
    },
    areaServed: 'United States',
  };

  return (
    <article className="px-4 py-16 sm:px-6 lg:px-8">
      <StructuredData data={jsonLd} />
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">
          {keyword}
        </p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-foreground">
          {title}
        </h1>

        <div className="prose-custom mt-8">{children}</div>

        {/* Related links */}
        {(relatedDemo || relatedCaseStudy) && (
          <div className="mt-12 flex flex-wrap gap-4">
            {relatedDemo && (
              <Link
                href={relatedDemo.href}
                className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                Demo: {relatedDemo.label}
              </Link>
            )}
            {relatedCaseStudy && (
              <Link
                href={relatedCaseStudy.href}
                className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                Case Study: {relatedCaseStudy.label}
              </Link>
            )}
          </div>
        )}

        {/* CTA */}
        <div className="mt-16 rounded-xl border border-border bg-muted/30 p-8 text-center">
          <h2 className="text-xl font-semibold text-foreground">Ready to get started?</h2>
          <p className="mt-2 text-muted-foreground">
            Let&apos;s talk about how AI can solve your specific challenges.
          </p>
          <Link
            href={ctaHref}
            className="mt-6 inline-flex h-12 items-center justify-center rounded-lg bg-primary px-8 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            {ctaText}
          </Link>
        </div>
      </div>
    </article>
  );
}
