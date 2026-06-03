import Link from 'next/link';

// BenchworksAI mark — amber "B" tile + wordmark, matching the approved
// Carlos sell-page logo. Amber/ink are brand-fixed (not the theme's blue
// primary) so the mark reads identically in light and dark themes.
export function Logo({ className = '' }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="BenchworksAI home"
      className={`inline-flex items-center gap-2 font-bold tracking-tight ${className}`}
    >
      <span
        aria-hidden="true"
        className="inline-grid h-[1.45em] w-[1.45em] place-items-center rounded-[0.28em] bg-[#f5a623] font-black leading-none text-[#0a0e14]"
        style={{ fontSize: '0.85em' }}
      >
        B
      </span>
      <span className="text-foreground">BenchworksAI</span>
    </Link>
  );
}
