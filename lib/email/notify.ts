// SendGrid email wrapper (Section 5.2, REV-003)
// NOT an API route — called from outbox processor
import logger from '@/lib/utils/logger';

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    logger.warn({ event: 'email_skip', reason: 'SENDGRID_API_KEY not configured' }, 'Email send skipped');
    return false;
  }

  const from = payload.from || 'adam@larkintech.ai';

  try {
    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: payload.to }] }],
        from: { email: from, name: 'Larkin Tech' },
        subject: payload.subject,
        content: [{ type: 'text/html', value: payload.html }],
      }),
    });

    if (res.ok || res.status === 202) {
      logger.info({ event: 'email_sent', to: payload.to, subject: payload.subject }, 'Email sent');
      return true;
    }

    const body = await res.text().catch(() => '');
    logger.error({ event: 'email_error', status: res.status, body }, 'SendGrid API error');
    return false;
  } catch (err) {
    logger.error({ event: 'email_error', error: (err as Error).message }, 'Email send failed');
    return false;
  }
}
