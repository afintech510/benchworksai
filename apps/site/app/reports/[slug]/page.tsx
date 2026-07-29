import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { loadReport, loadReportMeta, isExpired } from '@/lib/reports/content';
import { hasValidAccess, reportCookieName } from '@/lib/reports/access';
import { Gate } from './Gate';
import { ReportShell } from './components/ReportShell';
import { TitleBlock } from './components/TitleBlock';
import { MetricStrip } from './components/MetricStrip';
import { ComparisonMatrix } from './components/ComparisonMatrix';
import { PhasePlan } from './components/PhasePlan';
import { RiskRegister } from './components/RiskRegister';
import { Telemetry } from './components/Telemetry';

export const dynamic = 'force-dynamic';

// Hard no-index at the route level (BUILD-PROMPT §2.2). Title is the neutral
// document number — never the client name.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const meta = await loadReportMeta(slug);
  return {
    title: meta?.docNumber ?? 'Protected report',
    robots: {
      index: false,
      follow: false,
      nocache: true,
      googleBot: { index: false, follow: false, noimageindex: true },
    },
  };
}

export default async function ReportPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const meta = await loadReportMeta(slug);
  // Unknown or expired slug → 404. Never confirm a slug exists.
  if (!meta || isExpired(meta)) notFound();

  // Gate check.
  if (meta.gated) {
    const cookieStore = await cookies();
    const token = cookieStore.get(reportCookieName(slug))?.value;
    const unlocked = await hasValidAccess(slug, token);
    if (!unlocked) {
      return <Gate slug={slug} docNumber={meta.docNumber} />;
    }
  }

  const report = await loadReport(slug);
  if (!report) notFound();
  const { sections, toc } = report;

  return (
    <ReportShell toc={toc} meta={meta}>
      <TitleBlock meta={meta} />
      <MetricStrip metrics={meta.metrics} />

      {sections.map((s) => (
        <section id={s.id} key={s.id} className="report-section">
          <h2>
            {s.chip && <span className="chip">{s.chip}</span>}
            <span>{s.heading}</span>
          </h2>
          {s.html && <div dangerouslySetInnerHTML={{ __html: s.html }} />}
          {s.inject === 'ComparisonMatrix' && (
            <ComparisonMatrix data={meta.headToHead} />
          )}
          {s.inject === 'PhasePlan' && <PhasePlan phases={meta.phases} />}
          {s.inject === 'RiskRegister' && s.tableData && (
            <RiskRegister table={s.tableData} />
          )}
        </section>
      ))}

      {meta.telemetry && (
        <>
          <p className="telemetry-disclosure">
            BenchworksAI can see when this report was opened and how far it was
            read.
          </p>
          <Telemetry slug={slug} />
        </>
      )}
    </ReportShell>
  );
}
