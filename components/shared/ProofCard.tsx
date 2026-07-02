import Link from 'next/link';

// Proof card — bordered surface card with a mono tag, display heading, and a
// "go" link with a signal arrow on hover. Used in the proof / demo strip.
export function ProofCard({
  tag,
  title,
  description,
  href,
  cta,
  external = false,
}: {
  tag: string;
  title: string;
  description: string;
  href: string;
  cta: string;
  external?: boolean;
}) {
  const inner = (
    <>
      <div>
        <span className="eyebrow">{tag}</span>
        <h3 className="mt-3 text-[1.4rem] font-semibold tracking-tight text-foreground">
          {title}
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      </div>
      <span className="mt-7 inline-flex items-center gap-2 font-mono text-[13px] font-medium tracking-[0.04em] text-foreground transition-colors group-hover:text-[color:var(--lt-signal-accent)]">
        {cta}
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="transition-transform group-hover:translate-x-1"
          aria-hidden="true"
        >
          <path d="M7 17L17 7M9 7h8v8" />
        </svg>
      </span>
    </>
  );

  const className =
    'group flex min-h-[230px] flex-col justify-between rounded-xl border border-border bg-card p-8 transition-all hover:-translate-y-1 hover:border-foreground';

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {inner}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {inner}
    </Link>
  );
}
