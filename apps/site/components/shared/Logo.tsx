import Link from 'next/link';

// BenchworksAI mark — the pure-CSS "submittal" tile from the redesign: a square
// bracket with a top rule (ink) and a signal tick (orange). Adapts to theme via
// the foreground/signal tokens, no image request. Styles: globals.css .logo-mark.
export function Logo({ className = '' }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="BenchworksAI home"
      className={`inline-flex items-center gap-[0.55em] font-display font-bold tracking-tight ${className}`}
    >
      <span className="logo-mark shrink-0" aria-hidden="true" />
      <span>BenchworksAI</span>
    </Link>
  );
}
