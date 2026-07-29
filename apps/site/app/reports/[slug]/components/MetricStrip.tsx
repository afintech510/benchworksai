import type { ReportMetric } from '@/lib/reports/types';

/** Auto-fit strip of headline metrics. Server component. */
export function MetricStrip({ metrics }: { metrics: ReportMetric[] }) {
  return (
    <div className="metric-strip">
      {metrics.map((m, i) => (
        <div className="metric" key={`${m.l}-${i}`}>
          <div className="v">{m.v}</div>
          <div className="l">{m.l}</div>
          <div className="s">{m.s}</div>
        </div>
      ))}
    </div>
  );
}
