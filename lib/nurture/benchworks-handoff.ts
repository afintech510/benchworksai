// Hand off qualified inbound leads to the BenchworksAI outbound ops pipeline.
// Fires when a lead crosses tier='on_fire' or confirms a Cal.com booking.
// Fire-and-forget — never blocks the originating request.
import { createServerClient } from '@/lib/supabase/server';
import logger from '@/lib/utils/logger';

type HandoffTrigger = 'tier_on_fire' | 'booking_confirmed' | 'booking_cancelled' | 'booking_rescheduled' | 'manual';

interface HandoffContext {
  leadId: string;
  trigger: HandoffTrigger;
  score?: number;
  tier?: string;
}

interface DemoLead {
  id: string;
  email: string;
  name: string | null;
  company: string | null;
  vertical_interest: string | null;
  source_demo: string | null;
  marketing_context: Record<string, unknown> | null;
}

const HANDOFF_URL = process.env.BENCHWORKS_HANDOFF_URL;
const HANDOFF_KEY = process.env.BENCHWORKS_HANDOFF_KEY;

export async function notifyBenchworks(ctx: HandoffContext): Promise<void> {
  if (!HANDOFF_URL || !HANDOFF_KEY) {
    logger.debug(
      { event: 'benchworks_handoff_skipped', reason: 'not_configured', leadId: ctx.leadId },
      'BenchworksAI handoff disabled — env vars not set'
    );
    return;
  }

  const supabase = createServerClient();
  const { data: lead, error } = await supabase
    .from('demo_leads')
    .select('id, email, name, company, vertical_interest, source_demo, marketing_context')
    .eq('id', ctx.leadId)
    .single<DemoLead>();

  if (error || !lead) {
    logger.warn(
      { event: 'benchworks_handoff_lead_not_found', leadId: ctx.leadId, error: error?.message },
      'Lead not found for handoff'
    );
    return;
  }

  const payload = {
    email: lead.email,
    name: lead.name,
    company: lead.company,
    vertical_interest: lead.vertical_interest,
    source_demo: lead.source_demo,
    marketing_context: lead.marketing_context,
    larkin_lead_id: lead.id,
    trigger: ctx.trigger,
    score: ctx.score,
    tier: ctx.tier,
  };

  // Retry up to 3 times with exponential backoff. Never throws.
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(HANDOFF_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Service-Key': HANDOFF_KEY,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10_000),
      });

      if (response.ok) {
        const result = await response.json().catch(() => ({}));
        logger.info(
          {
            event: 'benchworks_handoff_sent',
            leadId: ctx.leadId,
            trigger: ctx.trigger,
            benchworksLeadId: result.lead_id,
            created: result.created,
          },
          'Lead handed off to BenchworksAI outbound'
        );
        return;
      }

      if (response.status >= 400 && response.status < 500) {
        const body = await response.text().catch(() => '');
        logger.warn(
          {
            event: 'benchworks_handoff_rejected',
            leadId: ctx.leadId,
            status: response.status,
            body: body.slice(0, 200),
          },
          'BenchworksAI handoff rejected — not retrying'
        );
        return;
      }

      logger.warn(
        { event: 'benchworks_handoff_retry', leadId: ctx.leadId, attempt, status: response.status },
        'BenchworksAI handoff failed — retrying'
      );
    } catch (err) {
      logger.warn(
        { event: 'benchworks_handoff_error', leadId: ctx.leadId, attempt, error: (err as Error).message },
        'BenchworksAI handoff error — retrying'
      );
    }
    await new Promise((r) => setTimeout(r, 500 * 2 ** (attempt - 1)));
  }

  logger.error(
    { event: 'benchworks_handoff_failed', leadId: ctx.leadId, trigger: ctx.trigger },
    'BenchworksAI handoff exhausted retries'
  );
}
