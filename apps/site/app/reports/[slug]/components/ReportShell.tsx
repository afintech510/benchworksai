'use client';

import { useEffect, useRef, useState } from 'react';
import type { ReportMeta, TocEntry } from '@/lib/reports/types';

/**
 * Outer chrome + cross-cutting behaviour for a report:
 *  - fixed reading-progress bar
 *  - sticky topbar (doc number, CONFIDENTIAL marker, print button)
 *  - sticky TOC with scrollspy (rootMargin band so short sections still register)
 *  - progressive enhancement of every `table.report-table` into a sortable table
 *
 * All DOM effects are gated on `typeof window`, run in useEffect and are torn
 * down on unmount. Motion is handled by report.css (prefers-reduced-motion).
 */
export function ReportShell({
  toc,
  meta,
  children,
}: {
  toc: TocEntry[];
  meta: ReportMeta;
  children: React.ReactNode;
}) {
  const progressRef = useRef<HTMLDivElement | null>(null);
  const [activeId, setActiveId] = useState<string>(toc[0]?.id ?? '');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const cleanups: Array<() => void> = [];

    // ---- Reading progress -------------------------------------------------
    const onScroll = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      const pct = max > 0 ? (h.scrollTop / max) * 100 : 0;
      if (progressRef.current) progressRef.current.style.width = `${pct}%`;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    onScroll();
    cleanups.push(() => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    });

    // ---- Scrollspy --------------------------------------------------------
    // A rootMargin band (upper 40% / lower 55% trimmed) keeps the "active"
    // section to whatever crosses the reading zone, so a short section wedged
    // between two long ones still fires even on a fast scroll.
    const targets = toc
      .map((t) => document.getElementById(t.id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (targets.length) {
      const spy = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) setActiveId((e.target as HTMLElement).id);
          }
        },
        { rootMargin: '-40% 0px -55% 0px', threshold: [0, 0.25, 0.5, 1] },
      );
      targets.forEach((t) => spy.observe(t));
      cleanups.push(() => spy.disconnect());
    }

    // ---- Sortable DataTable enhancement -----------------------------------
    const root = document.querySelector<HTMLElement>('.report-body');
    if (root) {
      const cellValue = (td: HTMLTableCellElement): number | string => {
        const t = (td.textContent || '').trim();
        const n = parseFloat(t.replace(/[^0-9.\-]/g, ''));
        return t !== '' && !isNaN(n) && /[0-9]/.test(t) ? n : t.toLowerCase();
      };

      const tables = root.querySelectorAll<HTMLTableElement>(
        'table.report-table:not([data-no-sort])',
      );

      tables.forEach((table) => {
        const head = table.tHead;
        if (!head || !head.rows.length) return;
        const ths = Array.from(head.rows[0].cells) as HTMLTableCellElement[];

        ths.forEach((th, idx) => {
          th.tabIndex = 0;
          th.setAttribute('aria-sort', 'none');
          let ind = th.querySelector<HTMLSpanElement>('.sort-ind');
          if (!ind) {
            ind = document.createElement('span');
            ind.className = 'sort-ind';
            ind.setAttribute('aria-hidden', 'true');
            th.appendChild(ind);
          }

          const sort = () => {
            const current = th.getAttribute('aria-sort');
            const dir = current === 'ascending' ? -1 : 1;
            ths.forEach((o) => {
              o.setAttribute('aria-sort', 'none');
              const s = o.querySelector<HTMLSpanElement>('.sort-ind');
              if (s) s.textContent = '';
            });
            th.setAttribute('aria-sort', dir === 1 ? 'ascending' : 'descending');
            if (ind) ind.textContent = dir === 1 ? '▲' : '▼';

            const body = table.tBodies[0];
            if (!body) return;
            const rows = Array.from(body.rows);
            rows.sort((a, b) => {
              const x = cellValue(a.cells[idx]);
              const y = cellValue(b.cells[idx]);
              if (x < y) return -1 * dir;
              if (x > y) return 1 * dir;
              return 0;
            });
            rows.forEach((r) => body.appendChild(r));
          };

          const onClick = () => sort();
          const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              sort();
            }
          };
          th.addEventListener('click', onClick);
          th.addEventListener('keydown', onKey);
          cleanups.push(() => {
            th.removeEventListener('click', onClick);
            th.removeEventListener('keydown', onKey);
          });
        });
      });
    }

    return () => cleanups.forEach((fn) => fn());
  }, [toc]);

  return (
    <div className="report">
      <div className="report-progress" role="presentation" ref={progressRef} />

      <div className="report-topbar">
        <span className="doc">{meta.docNumber}</span>
        {meta.confidential && <span className="conf">Confidential</span>}
        <button
          type="button"
          className="report-print-btn"
          onClick={() => window.print()}
        >
          Print / PDF
        </button>
      </div>

      <div className="report-layout">
        <nav className="report-toc" aria-label="Report contents">
          <ol>
            {toc.map((item) => {
              const active = item.id === activeId;
              return (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className={active ? 'active' : undefined}
                    aria-current={active ? 'true' : undefined}
                  >
                    <span className="chip">{item.chip}</span>
                    <span>{item.label}</span>
                  </a>
                </li>
              );
            })}
          </ol>
        </nav>

        <main className="report-body">{children}</main>
      </div>
    </div>
  );
}
