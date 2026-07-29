'use client';

import { useMemo, useState } from 'react';
import type { TableData } from '@/lib/reports/types';

type Sev = 'high' | 'medium' | 'low' | '';
type Filter = 'all' | 'high' | 'medium' | 'low';

const CHIPS: Array<{ id: Filter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'high', label: 'High' },
  { id: 'medium', label: 'Medium' },
  { id: 'low', label: 'Low' },
];

// Strip markdown emphasis markers (**bold**, *italic*, `code`) so cell text
// from the raw markdown table compares and displays cleanly.
function clean(raw: string): string {
  return (raw || '').replace(/[*_`]/g, '').trim();
}

function normalizeSev(raw: string): Sev {
  const t = clean(raw).toLowerCase();
  if (/^high/.test(t)) return 'high';
  if (/^(medium|med)\b/.test(t) || t === 'med' || t === 'medium') return 'medium';
  if (/^low/.test(t)) return 'low';
  return '';
}

/**
 * Risk register with severity filtering. The severity column is detected by
 * header (/sev|severity|risk|likelihood/i) and, failing that, by the column
 * whose cells are mostly High/Medium/Low. Each row carries data-sev and the
 * severity cell wraps its content in `.sev` so report.css colour-codes it.
 * Filtering toggles the `hidden` attribute (print CSS force-shows rows).
 */
export function RiskRegister({ table }: { table: TableData }) {
  const sevCol = useMemo(() => {
    // Prefer an explicit severity/likelihood/priority header. Deliberately does
    // NOT match "Risk" — that is usually the description column.
    const byHeader = table.headers.findIndex((h) =>
      /sever|likelihood|priority|impact/i.test(h),
    );
    if (byHeader >= 0) return byHeader;

    // Fallback: the column whose cells are mostly High/Medium/Low.
    let best = -1;
    let bestScore = 0.5; // require a majority to count as the severity column
    for (let c = 0; c < table.headers.length; c++) {
      let hits = 0;
      for (const row of table.rows) if (normalizeSev(row[c] || '')) hits++;
      const score = table.rows.length ? hits / table.rows.length : 0;
      if (score >= bestScore) {
        bestScore = score;
        best = c;
      }
    }
    return best;
  }, [table]);

  const sevs = useMemo(
    () =>
      table.rows.map((row) =>
        sevCol >= 0 ? normalizeSev(row[sevCol] || '') : '',
      ),
    [table, sevCol],
  );

  const [filter, setFilter] = useState<Filter>('all');
  const shownCount = sevs.filter((s) => filter === 'all' || s === filter).length;

  return (
    <div className="riskregister">
      <div
        className="rr-filters"
        role="group"
        aria-label="Filter risks by severity"
      >
        {CHIPS.map((c) => (
          <button
            key={c.id}
            type="button"
            className="rr-chip"
            aria-pressed={filter === c.id}
            onClick={() => setFilter(c.id)}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="cm-count" aria-live="polite">
        {shownCount} of {table.rows.length} risks shown
      </div>

      <div className="table-wrap">
        <table className="report-table">
          <thead>
            <tr>
              {table.headers.map((h, i) => (
                <th scope="col" key={i}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, ri) => {
              const sev = sevs[ri];
              const show = filter === 'all' || sev === filter;
              return (
                <tr key={ri} data-sev={sev || undefined} hidden={!show}>
                  {row.map((cell, ci) => (
                    <td key={ci}>
                      {ci === sevCol ? (
                        <span className="sev">{clean(cell)}</span>
                      ) : (
                        clean(cell)
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
