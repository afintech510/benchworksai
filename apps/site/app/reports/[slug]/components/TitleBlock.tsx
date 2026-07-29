import type { ReportMeta } from '@/lib/reports/types';

/**
 * The report's signature element: a strict mono grid, not a generic card.
 * Server component — no hooks, no client bundle.
 */
export function TitleBlock({ meta }: { meta: ReportMeta }) {
  return (
    <header className="report-title">
      <div className="kicker">{meta.kicker}</div>
      <h1>{meta.title}</h1>
      <p className="subtitle">{meta.subtitle}</p>

      <div className="titleblock-grid">
        <div className="cell">
          <div className="k">Prepared for</div>
          <div className="v">
            {meta.client}
            {meta.contact ? ` · ${meta.contact}` : ''}
          </div>
        </div>
        <div className="cell">
          <div className="k">Prepared by</div>
          <div className="v">{meta.preparedBy}</div>
        </div>
        <div className="cell">
          <div className="k">Issue date</div>
          <div className="v">{meta.issueDate}</div>
        </div>
        <div className="cell revision">
          <div className="k">Revision</div>
          <div className="v">REV {meta.revision}</div>
        </div>
      </div>
    </header>
  );
}
