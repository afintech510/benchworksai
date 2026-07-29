'use client';

import { useRef, useState } from 'react';
import type { ReportPhase } from '@/lib/reports/types';

/**
 * WAI-ARIA tabs pattern with roving tabindex and full arrow-key navigation
 * (Left/Right/Up/Down/Home/End). Inactive panels use the `hidden` attribute so
 * print CSS can force every panel open.
 */
export function PhasePlan({ phases }: { phases: ReportPhase[] }) {
  const [active, setActive] = useState(0);
  const tabsRef = useRef<Array<HTMLButtonElement | null>>([]);

  const focusTab = (i: number) => {
    setActive(i);
    tabsRef.current[i]?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    const last = phases.length - 1;
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        focusTab(active === last ? 0 : active + 1);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        focusTab(active === 0 ? last : active - 1);
        break;
      case 'Home':
        e.preventDefault();
        focusTab(0);
        break;
      case 'End':
        e.preventDefault();
        focusTab(last);
        break;
      default:
        break;
    }
  };

  return (
    <div className="phaseplan">
      <div className="phase-tabs" role="tablist" aria-label="Engagement phases">
        {phases.map((p, i) => {
          const selected = active === i;
          return (
            <button
              key={p.id}
              ref={(el) => {
                tabsRef.current[i] = el;
              }}
              id={`tab-${p.id}`}
              className="phase-tab"
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`panel-${p.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(i)}
              onKeyDown={onKeyDown}
            >
              <span className="ph-num">{p.label}</span>
              <span className="ph-name">{p.name}</span>
            </button>
          );
        })}
      </div>

      {phases.map((p, i) => (
        <div
          key={p.id}
          id={`panel-${p.id}`}
          className="phase-panel"
          role="tabpanel"
          aria-labelledby={`tab-${p.id}`}
          tabIndex={0}
          hidden={active !== i}
        >
          <div className="window">{p.window}</div>
          <div className="thesis">{p.thesis}</div>
          <ol>
            {p.tasks.map((t, ti) => (
              <li key={ti}>{t}</li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
}
