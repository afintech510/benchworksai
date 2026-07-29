'use client';

import { useEffect } from 'react';

interface TelemetryPayload {
  slug: string;
  firstOpenAt: string;
  visibleMs: number;
  deepestSection: string;
  prints: number;
}

/**
 * Opt-in engagement beacon. Records first-open, cumulative *visible* time
 * (paused while the tab is hidden), the deepest section reached, and print
 * events. Flushed via navigator.sendBeacon on pagehide and when the tab is
 * hidden. Collects nothing else — no IP, fingerprints, heatmaps, or any
 * third-party. Renders nothing.
 */
export function Telemetry({ slug }: { slug: string }) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const firstOpenAt = new Date().toISOString();
    let visibleMs = 0;
    let lastStart = document.visibilityState === 'visible' ? Date.now() : 0;
    let prints = 0;
    let deepestSection = '';
    let deepestIndex = -1;

    // Ordered list of anchor sections, used to derive "deepest reached".
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>('.report-body [id]'),
    );
    const order = new Map<Element, number>();
    sections.forEach((el, i) => order.set(el, i));

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const idx = order.get(e.target) ?? -1;
          if (idx > deepestIndex) {
            deepestIndex = idx;
            deepestSection = (e.target as HTMLElement).id;
          }
        }
      },
      { threshold: 0.4 },
    );
    sections.forEach((s) => io.observe(s));

    const accumulate = () => {
      if (lastStart) {
        visibleMs += Date.now() - lastStart;
        lastStart = 0;
      }
    };

    const send = () => {
      accumulate();
      if (!('sendBeacon' in navigator)) return;
      const payload: TelemetryPayload = {
        slug,
        firstOpenAt,
        visibleMs,
        deepestSection,
        prints,
      };
      try {
        const blob = new Blob([JSON.stringify(payload)], {
          type: 'application/json',
        });
        navigator.sendBeacon('/api/reports/telemetry', blob);
      } catch {
        // Beacon is best-effort; never surface errors to the reader.
      }
    };

    const onBeforePrint = () => {
      prints += 1;
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        send();
      } else if (!lastStart) {
        lastStart = Date.now();
      }
    };
    const onPageHide = () => send();

    window.addEventListener('beforeprint', onBeforePrint);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', onPageHide);

    return () => {
      io.disconnect();
      window.removeEventListener('beforeprint', onBeforePrint);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', onPageHide);
    };
  }, [slug]);

  return null;
}
