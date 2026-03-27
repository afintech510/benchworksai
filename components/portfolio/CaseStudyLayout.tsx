import Link from 'next/link';
import { TechStackBadges } from './TechStackBadges';
import { ArchitectureDiagram } from './ArchitectureDiagram';

interface CaseStudyLayoutProps {
  title: string;
  problem: React.ReactNode;
  approach: React.ReactNode;
  architectureDiagram: string;
  architectureCaption?: string;
  results: React.ReactNode;
  technicalDecisions?: React.ReactNode;
  techStack: string[];
  ctaText?: string;
  ctaHref?: string;
}

export function CaseStudyLayout({
  title,
  problem,
  approach,
  architectureDiagram,
  architectureCaption,
  results,
  technicalDecisions,
  techStack,
  ctaText = "Interested in this kind of work? Let's talk.",
  ctaHref = '/contact',
}: CaseStudyLayoutProps) {
  return (
    <article className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/portfolio"
          className="text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          &larr; Back to Portfolio
        </Link>

        <h1 className="mt-6 text-4xl font-bold tracking-tight text-foreground">
          {title}
        </h1>

        <TechStackBadges stack={techStack} className="mt-4" />

        {/* Problem */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold text-foreground">The Challenge</h2>
          <div className="prose-custom mt-4">{problem}</div>
        </section>

        {/* Approach */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold text-foreground">The Approach</h2>
          <div className="prose-custom mt-4">{approach}</div>
        </section>

        {/* Architecture */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold text-foreground">Architecture</h2>
          <div className="mt-4">
            <ArchitectureDiagram chart={architectureDiagram} />
          </div>
          {architectureCaption && (
            <p className="mt-3 text-sm text-muted-foreground">{architectureCaption}</p>
          )}
        </section>

        {/* Technical Decisions */}
        {technicalDecisions && (
          <section className="mt-12">
            <h2 className="text-2xl font-bold text-foreground">Key Technical Decisions</h2>
            <div className="prose-custom mt-4">{technicalDecisions}</div>
          </section>
        )}

        {/* Results */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold text-foreground">Results</h2>
          <div className="prose-custom mt-4">{results}</div>
        </section>

        {/* CTA */}
        <div className="mt-16 rounded-xl border border-border bg-muted/30 p-8 text-center">
          <p className="text-lg font-semibold text-foreground">{ctaText}</p>
          <Link
            href={ctaHref}
            className="mt-4 inline-flex h-12 items-center justify-center rounded-lg bg-primary px-8 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            Start a Conversation
          </Link>
        </div>
      </div>
    </article>
  );
}
