import { NextRequest, NextResponse } from 'next/server';
import { demoGateSchema } from '@/lib/validation/schemas';
import { isDisposableEmail } from '@/lib/validation/disposable-domains';
import { createServerClient } from '@/lib/supabase/server';
import { createDemoSession, setSessionCookie } from '@/lib/demo-engine/session';
import { processOutbox } from '@/lib/email/outbox';
import logger from '@/lib/utils/logger';

// In-memory idempotency cache (60s window)
const idempotencyCache = new Map<string, { response: unknown; expiresAt: number }>();

function cleanIdempotencyCache() {
  const now = Date.now();
  for (const [key, entry] of idempotencyCache) {
    if (entry.expiresAt < now) idempotencyCache.delete(key);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = demoGateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid input.', details: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Disposable email check
    if (isDisposableEmail(data.email)) {
      return NextResponse.json(
        { error: { code: 'DISPOSABLE_EMAIL', message: 'Please use a non-disposable email address.' } },
        { status: 400 }
      );
    }

    // Idempotency check
    const idempotencyKey = request.headers.get('x-idempotency-key');
    if (idempotencyKey) {
      cleanIdempotencyCache();
      const cached = idempotencyCache.get(idempotencyKey);
      if (cached && cached.expiresAt > Date.now()) {
        // Return cached response — prevents duplicate lead creation
        const cachedData = cached.response as { lead_id: string; jwt: string };
        await setSessionCookie(cachedData.jwt);
        return NextResponse.json({ success: true, lead_id: cachedData.lead_id });
      }
    }

    const supabase = createServerClient();

    // Upsert demo_leads (email is unique)
    const { data: lead, error: upsertError } = await supabase
      .from('demo_leads')
      .upsert(
        {
          email: data.email,
          name: data.name || null,
          company: data.company || null,
          vertical_interest: data.vertical_interest || null,
          source_demo: data.source_demo || null,
          subscribed: data.subscribed,
          subscribed_at: data.subscribed ? new Date().toISOString() : null,
          marketing_context: data.marketing_context || {},
          last_seen_at: new Date().toISOString(),
        },
        { onConflict: 'email' }
      )
      .select('id, jwt_version, created_at, last_seen_at')
      .single();

    if (upsertError || !lead) {
      logger.error({ event: 'demo_gate_upsert_error', error: upsertError }, 'Failed to upsert demo lead');
      return NextResponse.json(
        { error: { code: 'SERVER_ERROR', message: 'Failed to create session.' } },
        { status: 500 }
      );
    }

    // Generate JWT (lead_id + jwt_version only — REV-004)
    const jwt = await createDemoSession(lead.id, lead.jwt_version);

    // Set httpOnly cookie
    await setSessionCookie(jwt);

    // Cache idempotency key for 60s
    if (idempotencyKey) {
      idempotencyCache.set(idempotencyKey, {
        response: { lead_id: lead.id, jwt },
        expiresAt: Date.now() + 60_000,
      });
    }

    // P04-003 fix: Detect new lead by checking if created_at is within the
    // last 5 seconds. The old approach (created_at === last_seen_at) was
    // fragile because DB-generated and JS-generated timestamps may differ
    // by milliseconds even on INSERT.
    const createdAt = new Date(lead.created_at).getTime();
    const isNew = Date.now() - createdAt < 5_000;
    if (isNew) {
      await supabase.from('notification_outbox').insert({
        type: 'demo_gate_new_lead',
        payload: {
          lead_id: lead.id,
          email: data.email,
          name: data.name || null,
          company: data.company || null,
          subscribed: data.subscribed,
        },
        status: 'pending',
      });

      // Backfill lead_magnet_downloads
      await supabase
        .from('lead_magnet_downloads')
        .update({ demo_lead_id: lead.id })
        .eq('email', data.email)
        .is('demo_lead_id', null);
    }

    // Lazy outbox processing
    processOutbox().catch(() => {});

    logger.info({ event: 'demo_gate_success', leadId: lead.id, isNew }, 'Demo gate processed');

    return NextResponse.json({ success: true, lead_id: lead.id });
  } catch (err) {
    logger.error({ event: 'demo_gate_error', error: (err as Error).message }, 'Demo gate endpoint error');
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'Internal server error.' } },
      { status: 500 }
    );
  }
}
