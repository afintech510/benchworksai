import Link from 'next/link';
import { InkPanel } from '@/components/shared/InkPanel';

export function EducationCallout() {
  return (
    <InkPanel>
      <div className="grid items-center gap-10 md:grid-cols-[1.3fr_1fr]">
        <div>
          <p className="eyebrow">// Education &amp; Training</p>
          <h2 className="mt-5 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
            Sometimes the fastest win isn&apos;t software — it&apos;s knowing how.
          </h2>
          <p className="mt-5 max-w-[46ch] text-base leading-relaxed" style={{ color: '#BDB8AE' }}>
            In many cases, the biggest gains come from teaching you and your team the right
            techniques and tools. We coach and train your people to use AI day to day — so you
            leverage your time, with or without us building anything.
          </p>
          <Link
            href="/services/ai-education-training"
            className="btn-signal mt-8 h-12 px-6 text-sm"
          >
            Explore Training &amp; Coaching
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
        </div>
        <blockquote
          className="pl-6 text-xl font-medium leading-snug tracking-tight sm:text-2xl"
          style={{ borderLeft: '2px solid var(--lt-signal)' }}
        >
          Results, not PowerPoints.
          <span className="mt-4 block font-mono text-[11px] uppercase tracking-[0.1em]" style={{ color: 'var(--lt-ink-muted)' }}>
            — The Benchworks standard
          </span>
        </blockquote>
      </div>
    </InkPanel>
  );
}
