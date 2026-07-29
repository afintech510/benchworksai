// Email send wrapper — Resend (Section 5.2).
// NOT an API route — called from outbox processor.
import logger from '@/lib/utils/logger';

export interface EmailAttachment {
  filename: string;
  /** Base64-encoded file content. Resend accepts this as `content`. */
  content: string;
}

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  from?: string;
  /** Reply-To header (mapped to Resend's `reply_to`). */
  replyTo?: string;
  /** File attachments (mapped to Resend's `attachments`). */
  attachments?: EmailAttachment[];
}

export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    logger.warn({ event: 'email_skip', reason: 'RESEND_API_KEY not configured' }, 'Email send skipped');
    return false;
  }

  const from = payload.from || process.env.RESEND_FROM || 'BenchworksAI <onboarding@resend.dev>';

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        // Only include when set so existing callers produce identical bodies.
        ...(payload.replyTo ? { reply_to: payload.replyTo } : {}),
        ...(payload.attachments && payload.attachments.length
          ? { attachments: payload.attachments.map((a) => ({ filename: a.filename, content: a.content })) }
          : {}),
      }),
    });

    if (res.ok) {
      const body = await res.json().catch(() => ({}));
      logger.info(
        { event: 'email_sent', to: payload.to, subject: payload.subject, id: body.id },
        'Email sent'
      );
      return true;
    }

    const body = await res.text().catch(() => '');
    logger.error({ event: 'email_error', status: res.status, body: body.slice(0, 400) }, 'Resend API error');
    return false;
  } catch (err) {
    logger.error({ event: 'email_error', error: (err as Error).message }, 'Email send failed');
    return false;
  }
}
