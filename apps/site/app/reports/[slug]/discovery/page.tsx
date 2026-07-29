import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { loadReportMeta } from '@/lib/reports/content';
import { hasValidAccess, reportCookieName } from '@/lib/reports/access';
import { loadDiscoverySchema } from '@/lib/reports/discovery';
import { Gate } from '../Gate';
import { DiscoveryForm } from './DiscoveryForm';
import './discovery.css';

export const dynamic = 'force-dynamic';

// Same hard no-index posture as the report route. Title is the neutral doc
// number, never the client name.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const meta = await loadReportMeta(slug);
  return {
    title: meta?.docNumber ?? 'Protected form',
    robots: {
      index: false,
      follow: false,
      nocache: true,
      googleBot: { index: false, follow: false, noimageindex: true },
    },
  };
}

export default async function DiscoveryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Gate behind the SAME passcode cookie as the report.
  const cookieStore = await cookies();
  const token = cookieStore.get(reportCookieName(slug))?.value;
  if (!(await hasValidAccess(slug, token))) {
    const meta = await loadReportMeta(slug);
    return <Gate slug={slug} docNumber={meta?.docNumber ?? 'Protected form'} />;
  }

  const schema = await loadDiscoverySchema(slug);
  if (!schema) notFound();

  return <DiscoveryForm schema={schema} slug={slug} />;
}
