import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { bookingWebhookSchema } from '@/lib/validation/schemas';
import { calculateLeadScore } from '@/lib/nurture/lead-scorer';
import { evaluateDripTriggers } from '@/lib/nurture/drip-engine';
import { notifyBenchworks } from '@/lib/nurture/benchworks-handoff';
import { processOutbox } from '@/lib/email/outbox';
import logger from '@/lib/utils/logger';
import { createHmac } from 'crypto';

/**
 * Cal.com booking webhook handler.
 * Verifies webhook signature, records booking, recalculates lead score (+25), triggers drip.
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();

    // Verify webhook signature if secret is configured
    const webhookSecret = process.env.CALCOM_WEBHOOK_SECRET;
    if (webhookSecret) {
      const signature = request.headers.get('x-cal-signature-256');
      if (!signature) {
        logger.warn({ event: 'booking_webhook_no_signature' }, 'Booking webhook missing signature');
        return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
      }

      const expected = createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
      if (signature !== expected) {
        logger.warn({ event: 'booking_webhook_invalid_signature' }, 'Booking webhook invalid signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const body = JSON.parse(rawBody);
    const parsed = bookingWebhookSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const { event, payload } = parsed.data;

    const SUPPORTED = new Set(['BOOKING_CREATED', 'BOOKING_CANCELLED', 'BOOKING_RESCHEDULED']);
    if (!SUPPORTED.has(event)) {
      return NextResponse.json({ received: true, skipped: true });
    }

    const attendeeEmail = (payload.attendees as Array<{ email: string; name?: string }>)?.[0]?.email;
    const attendeeName = (payload.attendees as Array<{ email: string; name?: string }>)?.[0]?.name;

    if (!attendeeEmail) {
      logger.warn({ event: 'booking_webhook_no_email', payload }, 'No attendee email in booking');
      return NextResponse.json({ received: true, skipped: true });
    }

    const supabase = createServerClient();

    // Find matching demo lead
    const { data: lead } = await supabase
      .from('demo_leads')
      .select('id')
      .eq('email', attendeeEmail)
      .single();

    if (event === 'BOOKING_CREATED') {
      await supabase.from('inquiries').insert({
        audience_type: 'booking',
        name: attendeeName || 'Booking',
        email: attendeeEmail,
        message: 'Discovery call booked via Cal.com',
        form_data: {
          cal_event_id: payload.uid,
          cal_event_type: payload.eventType,
          cal_start_time: payload.startTime,
          cal_end_time: payload.endTime,
        },
        demo_lead_id: lead?.id || null,
      });
    }

    await supabase.from('notification_outbox').insert({
      type: event === 'BOOKING_CREATED' ? 'booking_confirmed' : event === 'BOOKING_CANCELLED' ? 'booking_cancelled' : 'booking_rescheduled',
      payload: {
        email: attendeeEmail,
        name: attendeeName,
        event_type: payload.eventType,
        start_time: payload.startTime,
        cal_event_id: payload.uid,
        lead_id: lead?.id || null,
      },
      status: 'pending',
    });

    processOutbox().catch(() => {});

    if (lead) {
      if (event === 'BOOKING_CREATED') {
        calculateLeadScore(lead.id)
          .then(() => evaluateDripTriggers(lead.id, 'booking'))
          .catch(() => {});
        notifyBenchworks({ leadId: lead.id, trigger: 'booking_confirmed' }).catch(() => {});
      } else if (event === 'BOOKING_CANCELLED') {
        notifyBenchworks({ leadId: lead.id, trigger: 'booking_cancelled' }).catch(() => {});
      } else if (event === 'BOOKING_RESCHEDULED') {
        notifyBenchworks({ leadId: lead.id, trigger: 'booking_rescheduled' }).catch(() => {});
      }
    }

    logger.info(
      { event: 'booking_webhook_processed', calEvent: event, email: attendeeEmail, leadId: lead?.id },
      'Booking webhook processed'
    );

    return NextResponse.json({ received: true, event, lead_matched: !!lead });
  } catch (err) {
    logger.error({ event: 'booking_webhook_error', error: (err as Error).message }, 'Booking webhook failed');
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
