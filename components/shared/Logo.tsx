import Link from 'next/link';

// BenchworksAI mark — engineered bracket tile (industrial-blueprint system):
// a bordered square with a top rule and a signal tick, matching the redesign
// wordmark. Uses currentColor so it inverts correctly on ink surfaces.
export function Logo({ className = '' }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="BenchworksAI home"
      className={`inline-flex items-center gap-[0.6em] font-display font-bold tracking-tight ${className}`}
    >
      <span
        aria-hidden="true"
        className="relative inline-block h-[1.55em] w-[1.55em] shrink-0 rounded-[0.28em] border-2 border-current"
      >
        {/* top rule */}
        <span className="absolute left-[0.28em] right-[0.28em] top-[0.3em] h-[2px] bg-current" />
        {/* signal tick */}
        <span
          className="absolute bottom-[0.32em] left-[0.42em] h-[0.45em] w-[2px]"
          style={{ background: 'var(--lt-signal)' }}
        />
      </span>
      <span>BenchworksAI</span>
    </Link>
  );
}
