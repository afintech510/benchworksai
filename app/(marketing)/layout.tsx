import { UtilityBar } from '@/components/layout/UtilityBar';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { CTABanner } from '@/components/layout/CTABanner';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <UtilityBar />
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <CTABanner />
    </>
  );
}
