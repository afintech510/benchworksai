import type { Metadata } from 'next';
import { PortfolioGrid } from '@/components/portfolio/PortfolioGrid';

export const metadata: Metadata = {
  title: 'Portfolio',
  description: 'Case studies — custom platforms, customer lifecycle engines, property management systems, and automation we have designed, built, and shipped.',
};

export default function PortfolioPage() {
  return (
    <div className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground">Portfolio</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Production systems we have designed, built, and shipped. Each project
            includes architecture decisions, technical details, and measurable outcomes.
          </p>
        </div>

        <div className="mt-12">
          <PortfolioGrid />
        </div>
      </div>
    </div>
  );
}
