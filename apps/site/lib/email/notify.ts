// Email send wrapper — Resend (Section 5.2).
// NOT an API route — called from outbox processor.
import logger from '@/lib/utils/logger';

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  from?: string;
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
