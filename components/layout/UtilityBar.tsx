// Utility bar (ink surface, both themes) — availability + pulsing signal dot,
// service-area line, and a verified booking link. Muted items use --ink-muted
// (6.6:1 on ink). Part of the industrial-blueprint chrome (Phase T).
const BOOKING_URL = 'https://cal.com/adam-benchworksai-com/30min';

export function UtilityBar() {
  return (
    <div
      className="w-full"
      style={{ background: 'var(--lt-ink)', color: 'var(--lt-paper)' }}
    >
      <div className="mx-auto flex h-[34px] max-w-7xl items-center justify-between gap-4 px-4 font-mono text-[11px] uppercase tracking-[0.08em] sm:px-6 lg:px-8">
        <span className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="inline-block h-[7px] w-[7px] animate-pulse rounded-full"
            style={{ background: 'var(--lt-signal)' }}
          />
          Available for new projects
        </span>
        <div className="flex items-center gap-5">
          <span
            className="hidden sm:inline"
            style={{ color: 'var(--lt-ink-muted)' }}
          >
            Long Island · NYC · Tristate
          </span>
          <a
            href={BOOKING_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-[color:var(--lt-signal)]"
          >
            Book a Call
          </a>
        </div>
      </div>
    </div>
  );
}
