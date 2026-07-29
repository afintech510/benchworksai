'use client';

import { useState } from 'react';
import type { HeadToHead, WinLose } from '@/lib/reports/types';

type Filter = 'all' | 'lose' | 'win';

const CHIPS: Array<{ id: Filter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'lose', label: 'Where we lose' },
  { id: 'win', label: 'Where we win' },
];

function cellClass(state: WinLose): string {
  return state === 'win' ? 'cell-win' : state === 'lose' ? 'cell-lose' : 'cell-tie';
}

/**
 * Head-to-head matrix, read from the first column's ("us") perspective:
 * row[3] is our verdict for that row. Filtering toggles the `hidden`
 * attribute (never unmounts) so print CSS can force every row visible.
 */
export function ComparisonMatrix({ data }: { data: HeadToHead }) {
  const [filter, setFilter] = useState<Filter>('all');

  const shownCount = data.rows.filter(
    (r) => filter === 'all' || r[3] === filter,
  ).length;

  return (
    <div className="comparison">
      <div className="cm-head">
        <div className="title">{data.title}</div>
        {data.note && <div className="note">{data.note}</div>}
      </div>

      <div className="cm-filters" role="group" aria-label="Filter comparison rows">
        {CHIPS.map((c) => (
          <button
            key={c.id}
            type="button"
            className="cm-chip"
            aria-pressed={filter === c.id}
            onClick={() => setFilter(c.id)}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="cm-count" aria-live="polite">
        {shownCount} of {data.rows.length} rows shown
      </div>

      <div className="table-wrap">
        <table className="report-table" data-no-sort>
          <thead>
            <tr>
              <th scope="col">
                <span className="sr-only">Criterion</span>
              </th>
              {data.cols.map((c, i) => (
                <th scope="col" key={i}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((r, i) => {
              const show = filter === 'all' || r[3] === filter;
              return (
                <tr key={i} hidden={!show}>
                  <th scope="row">{r[0]}</th>
                  <td className={cellClass(r[3])}>{r[1]}</td>
                  <td className={cellClass(r[4])}>{r[2]}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
