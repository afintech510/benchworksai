import Link from 'next/link';

export function CTABanner() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-primary px-4 py-3 text-center md:hidden">
      <Link
        href="/contact"
        className="inline-flex items-center gap-2 text-sm font-semibold text-white"
      >
        Get in Touch
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
        </svg>
      </Link>
    </div>
  );
}
