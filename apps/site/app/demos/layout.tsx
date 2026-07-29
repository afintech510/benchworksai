import { UtilityBar } from '@/components/layout/UtilityBar';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { CTABanner } from '@/components/layout/CTABanner';

// Demos share the same industrial-blueprint chrome as the marketing site
// (utility bar + navbar + footer) so the top nav and theme stay consistent
// across the whole site. The inner container preserves the demo pages' spacing.
export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <UtilityBar />
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
      <Footer />
      <CTABanner />
    </>
  );
}
