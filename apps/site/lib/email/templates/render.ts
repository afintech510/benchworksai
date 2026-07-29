// Email template renderer for notification outbox types

const ADMIN_EMAIL = 'adam@benchworksai.com';

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  attachments?: Array<{ filename: string; content: string }>;
}

/** Escape user-controlled values before interpolation into HTML */
function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function renderNotification(type: string, payload: Record<string, unknown>): EmailPayload | null {
  switch (type) {
    case 'lead_inquiry':
      return renderLeadInquiry(payload);
    case 'magnet_download':
      return renderMagnetDownloadNotification(payload);
    case 'magnet_delivery':
      return renderMagnetDelivery(payload);
    case 'booking':
      return renderBookingNotification(payload);
    case 'discovery_notify':
      return renderDiscoveryNotify(payload);
    default:
      return null;
  }
}

// Discovery submission emails are fully rendered at submit time and stored in
// the outbox verbatim, so the retry path just echoes them back (with replyTo +
// attachments passed straight through to sendEmail). This keeps a submission's
// admin notification and respondent confirmation from ever being lost when the
// live send fails.
function renderDiscoveryNotify(payload: Record<string, unknown>): EmailPayload | null {
  const to = payload.to;
  const subject = payload.subject;
  const html = payload.html;
  if (typeof to !== 'string' || typeof subject !== 'string' || typeof html !== 'string') {
    return null;
  }
  const attachments = Array.isArray(payload.attachments)
    ? (payload.attachments as Array<{ filename: string; content: string }>)
    : undefined;
  return {
    to,
    subject,
    html,
    ...(typeof payload.replyTo === 'string' ? { replyTo: payload.replyTo } : {}),
    ...(attachments && attachments.length ? { attachments } : {}),
  };
}

function renderLeadInquiry(payload: Record<string, unknown>): EmailPayload {
  const { audience_type, name, email, company, phone, message } = payload;
  return {
    to: ADMIN_EMAIL,
    subject: `New Inquiry from ${esc(name)} (${esc(audience_type)})`,
    html: `
      <h2>New Lead Inquiry</h2>
      <table style="border-collapse:collapse;width:100%">
        <tr><td style="padding:8px;font-weight:bold">Type:</td><td style="padding:8px">${esc(audience_type)}</td></tr>
        <tr><td style="padding:8px;font-weight:bold">Name:</td><td style="padding:8px">${esc(name)}</td></tr>
        <tr><td style="padding:8px;font-weight:bold">Email:</td><td style="padding:8px">${esc(email)}</td></tr>
        ${company ? `<tr><td style="padding:8px;font-weight:bold">Company:</td><td style="padding:8px">${esc(company)}</td></tr>` : ''}
        ${phone ? `<tr><td style="padding:8px;font-weight:bold">Phone:</td><td style="padding:8px">${esc(phone)}</td></tr>` : ''}
      </table>
      <h3>Message</h3>
      <p style="white-space:pre-wrap">${esc(message)}</p>
    `,
  };
}

function renderMagnetDownloadNotification(payload: Record<string, unknown>): EmailPayload {
  const { email, magnet_slug, name } = payload;
  return {
    to: ADMIN_EMAIL,
    subject: `Lead Magnet Download: ${esc(magnet_slug)}`,
    html: `
      <h2>Lead Magnet Downloaded</h2>
      <p><strong>Email:</strong> ${esc(email)}</p>
      ${name ? `<p><strong>Name:</strong> ${esc(name)}</p>` : ''}
      <p><strong>Magnet:</strong> ${esc(magnet_slug)}</p>
    `,
  };
}

function renderMagnetDelivery(payload: Record<string, unknown>): EmailPayload {
  const { email, download_url, magnet_slug } = payload;
  return {
    to: email as string,
    subject: 'Your AI Enablement Playbook is Ready',
    html: `
      <h2>Your Download is Ready</h2>
      <p>Thanks for your interest! Here's your copy of the AI Enablement Playbook.</p>
      <p><a href="${esc(download_url)}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:white;text-decoration:none;border-radius:8px;font-weight:600">Download Playbook</a></p>
      <p style="margin-top:16px;color:#666;font-size:14px">
        This link is permanent — you can use it to re-download at any time.<br/>
        Playbook: ${esc(magnet_slug)}
      </p>
      <p style="margin-top:24px;color:#666;font-size:14px">
        — Adam Larkin, BenchworksAI<br/>
        <a href="https://benchworksai.com">benchworksai.com</a>
      </p>
    `,
  };
}

function renderBookingNotification(payload: Record<string, unknown>): EmailPayload {
  const { name, email, event_type } = payload;
  return {
    to: ADMIN_EMAIL,
    subject: `New Booking: ${esc(name)}`,
    html: `
      <h2>New Booking Confirmed</h2>
      <p><strong>Name:</strong> ${esc(name)}</p>
      <p><strong>Email:</strong> ${esc(email)}</p>
      <p><strong>Event:</strong> ${esc(event_type)}</p>
    `,
  };
}
