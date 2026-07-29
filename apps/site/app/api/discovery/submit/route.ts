import { NextRequest } from 'next/server';
import { createHash } from 'crypto';
import { createServerClient } from '@/lib/supabase/server';
import { clientIp } from '@/lib/reports/access';
import { loadReportMeta } from '@/lib/reports/content';
import {
  loadDiscoverySchema,
  buildPayloadSchema,
  zodFieldErrors,
  buildAdminEmailHtml,
  buildConfirmationHtml,
  dateStamp,
  type DiscoveryEmailConfig,
} from '@/lib/reports/discovery';
import { sendEmail, type EmailAttachment } from '@/lib/email/notify';
import { processOutbox } from '@/lib/email/outbox';
import { apiError, ERRORS, validationError } from '@/lib/utils/errors';
import logger from '@/lib/utils/logger';

export const runtime = 'nodejs';

// ---- Per-process rate limiter: 5 requests / hour / IP (mirrors access.ts). ---
const RL_WINDOW_MS = 60 * 60 * 1000;
const RL_MAX = 5;
const rlBuckets = new Map<string, number[]>();

function checkSubmitRate(ip: string): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const hits = (rlBuckets.get(ip) ?? []).filter((t) => now - t < RL_WINDOW_MS);
  if (hits.length >= RL_MAX) {
    const oldest = hits[0];
    return { allowed: false, retryAfterSeconds: Math.ceil((oldest + RL_WINDOW_MS - now) / 1000) };
  }
  hits.push(now);
  rlBuckets.set(ip, hits);
  return { allowed: true };
}

interface SubmitBody {
  slug?: unknown;
  formId?: unknown;
  payload?: unknown;
  partial?: unknown;
  company_website?: unknown;
}

export async function POST(request: NextRequest) {
  let body: SubmitBody;
  try {
    body = (await request.json()) as SubmitBody;
  } catch {
    return apiError(ERRORS.VALIDATION_ERROR, 400);
  }

  const slug = typeof body.slug === 'string' ? body.slug : '';
  const partial = body.partial === true;
  const payload = (body.payload && typeof body.payload === 'object'
    ? (body.payload as Record<string, unknown>)
    : {}) as Record<string, unknown>;

  // Load schema first so the honeypot drop can echo the real success message.
  if (!/^[a-z0-9-]+$/i.test(slug)) {
    return apiError(ERRORS.NOT_FOUND, 404);
  }
  const schema = await loadDiscoverySchema(slug);
  if (!schema) {
    return apiError(ERRORS.NOT_FOUND, 404);
  }
  const successMessage = schema.submission.successMessage;

  // HONEYPOT: a filled hidden field means a bot. Silently accept and drop —
  // never store or email — so the bot can't tell it was caught.
  if (typeof body.company_website === 'string' && body.company_website.trim() !== '') {
    logger.info({ event: 'discovery_honeypot', slug }, 'Discovery honeypot triggered — dropped');
    return Response.json({ ok: true, message: successMessage });
  }

  // RATE LIMIT.
  const ip = clientIp(request.headers);
  const rl = checkSubmitRate(ip);
  if (!rl.allowed) {
    const retryAfter = String(rl.retryAfterSeconds ?? 3600);
    return Response.json(
      { error: { code: ERRORS.RATE_LIMITED.code, message: ERRORS.RATE_LIMITED.message } },
      { status: 429, headers: { 'Retry-After': retryAfter } }
    );
  }

  // VALIDATE server-side (required only enforced on a complete submit).
  const validator = buildPayloadSchema(schema, !partial);
  const parsed = validator.safeParse(payload);
  if (!parsed.success) {
    return validationError(zodFieldErrors(parsed.error));
  }

  // STORE FIRST — never lose a submission.
  const supabase = createServerClient();
  const ua = request.headers.get('user-agent') ?? '';
  const userAgentHash = ua ? createHash('sha256').update(ua).digest('hex') : null;

  const { data: inserted, error: insertError } = await supabase
    .from('discovery_submissions')
    .insert({
      slug,
      form_id: typeof body.formId === 'string' ? body.formId : schema.formId,
      payload_jsonb: payload,
      partial,
      user_agent_hash: userAgentHash,
    })
    .select('id, submitted_at')
    .single();

  if (insertError || !inserted) {
    logger.error(
      { event: 'discovery_insert_error', slug, error: insertError?.message },
      'Discovery insert failed'
    );
    // Nothing was saved — this is the only case the user sees an error.
    return apiError(ERRORS.SERVER_ERROR, 500);
  }

  // Build emails.
  const meta = await loadReportMeta(slug);
  const client = meta?.client || schema.client || slug;
  const emailCfg = (schema.submission as { email?: DiscoveryEmailConfig }).email;
  const contactEmail =
    typeof payload.Z2_contact_email === 'string' ? payload.Z2_contact_email : '';
  const contactName =
    typeof payload.Z2_contact_name === 'string' ? payload.Z2_contact_name : '';

  const stamp = dateStamp(inserted.submitted_at as string | undefined);
  const attachment: EmailAttachment = {
    filename: `discovery-${slug}-${stamp}.json`,
    content: Buffer.from(JSON.stringify(payload, null, 2), 'utf8').toString('base64'),
  };

  const adminEmail = {
    to: emailCfg?.to ?? 'adam@benchworksai.com',
    subject: `Discovery submitted — ${client} (${partial ? 'PARTIAL' : 'complete'})`,
    html: buildAdminEmailHtml(schema, payload, client, partial),
    ...(contactEmail ? { replyTo: contactEmail } : {}),
    attachments: [attachment],
  };

  const confirmEmail =
    emailCfg?.alsoSendConfirmationToRespondent && contactEmail
      ? {
          to: contactEmail,
          subject: emailCfg.confirmationSubject ?? "Thanks — we've got your answers",
          html: buildConfirmationHtml(client, contactName),
        }
      : null;

  // Send now; on failure, enqueue to notification_outbox so the existing
  // processor retries. A valid submit ALWAYS returns success to the user.
  try {
    const adminSent = await sendEmail(adminEmail);
    if (!adminSent) {
      await enqueueRetry(supabase, adminEmail);
    }
    if (confirmEmail) {
      const confSent = await sendEmail(confirmEmail);
      if (!confSent) {
        await enqueueRetry(supabase, confirmEmail);
      }
    }
    // Kick the outbox so any freshly-enqueued retries drain promptly.
    processOutbox().catch(() => {});
  } catch (err) {
    // Any unexpected email error must not surface to the user — enqueue both.
    logger.error(
      { event: 'discovery_email_error', slug, error: (err as Error).message },
      'Discovery email send threw — enqueued for retry'
    );
    await enqueueRetry(supabase, adminEmail).catch(() => {});
    if (confirmEmail) await enqueueRetry(supabase, confirmEmail).catch(() => {});
  }

  logger.info(
    { event: 'discovery_submitted', slug, partial, submission_id: inserted.id },
    'Discovery submission stored'
  );

  return Response.json({ ok: true, message: successMessage });
}

/** Enqueue a fully-rendered email into notification_outbox (type discovery_notify). */
async function enqueueRetry(
  supabase: ReturnType<typeof createServerClient>,
  email: { to: string; subject: string; html: string; replyTo?: string; attachments?: EmailAttachment[] }
): Promise<void> {
  await supabase.from('notification_outbox').insert({
    type: 'discovery_notify',
    payload: {
      to: email.to,
      subject: email.subject,
      html: email.html,
      ...(email.replyTo ? { replyTo: email.replyTo } : {}),
      ...(email.attachments ? { attachments: email.attachments } : {}),
    },
    status: 'pending',
  });
}
