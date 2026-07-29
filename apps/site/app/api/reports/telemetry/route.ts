import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import logger from '@/lib/utils/logger';

export const runtime = 'nodejs';

// Opt-in report engagement beacon. Called via navigator.sendBeacon on pagehide,
// so it must be maximally tolerant and NEVER throw to the client. Stores NO IP,
// user-agent, or fingerprint — one accumulating row per slug, keyed by slug.

const SLUG_RE = /^[a-z0-9-]+$/i;

interface Beacon {
  slug?: unknown;
  firstOpenAt?: unknown;
  visibleMs?: unknown;
  deepestSection?: unknown;
  prints?: unknown;
}

function toInt(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Beacon;
    const slug = typeof body.slug === 'string' ? body.slug : '';
    if (!SLUG_RE.test(slug)) {
      return new Response(null, { status: 204 });
    }

    const incomingVisible = toInt(body.visibleMs);
    const incomingPrints = toInt(body.prints);
    const deepest =
      typeof body.deepestSection === 'string' ? body.deepestSection.slice(0, 120) : null;
    const firstOpenAt =
      typeof body.firstOpenAt === 'string' && body.firstOpenAt ? body.firstOpenAt : null;

    const supabase = createServerClient();

    // Read the existing row to accumulate (visible ms + prints) and keep the
    // earliest first_open_at / deepest section.
    const { data: existing } = await supabase
      .from('report_engagement')
      .select('first_open_at, total_visible_ms, deepest_section, print_count')
      .eq('slug', slug)
      .maybeSingle();

    const row = {
      slug,
      first_open_at: existing?.first_open_at ?? firstOpenAt,
      total_visible_ms: Number(existing?.total_visible_ms ?? 0) + incomingVisible,
      deepest_section: deepest ?? existing?.deepest_section ?? null,
      print_count: Number(existing?.print_count ?? 0) + incomingPrints,
      updated_at: new Date().toISOString(),
    };

    await supabase.from('report_engagement').upsert(row, { onConflict: 'slug' });
  } catch (err) {
    // Beacon path — swallow everything.
    logger.warn(
      { event: 'telemetry_error', error: (err as Error).message },
      'Report telemetry beacon failed (ignored)'
    );
  }

  return new Response(null, { status: 204 });
}
