import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { inquirySchema } from '@/lib/validation/schemas';
import { apiError, ERRORS, validationError } from '@/lib/utils/errors';
import { processOutbox } from '@/lib/email/outbox';
import logger from '@/lib/utils/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = inquirySchema.safeParse(body);

    if (!parsed.success) {
      const issues: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const path = issue.path.join('.');
        if (!issues[path]) issues[path] = [];
        issues[path].push(issue.message);
      }
      return validationError(issues);
    }

    const data = parsed.data;
    const supabase = createServerClient();

    // Check for demo session cookie to link demo_lead_id
    let demoLeadId: string | null = null;
    const sessionCookie = request.cookies.get('lt_session')?.value;
    if (sessionCookie) {
      try {
        const { verifyDemoSession } = await import('@/lib/demo-engine/session');
        const result = await verifyDemoSession(sessionCookie);
        if (result.valid) {
          demoLeadId = result.leadId;
        }
      } catch {
        // Session verification failed — proceed without linking
      }
    }

    // Insert inquiry
    const { error: insertError } = await supabase.from('inquiries').insert({
      audience_type: data.audience_type,
      name: data.name,
      email: data.email,
      company: data.company || null,
      phone: data.phone || null,
      message: data.message,
      form_data: data.form_data || {},
      marketing_context: data.marketing_context || {},
      source_page: data.source_page || null,
      demo_lead_id: demoLeadId,
    });

    if (insertError) {
      logger.error({ event: 'inquiry_insert_error', error: insertError.message }, 'Failed to insert inquiry');
      return apiError(ERRORS.SERVER_ERROR, 500);
    }

    // Insert into notification_outbox
    await supabase.from('notification_outbox').insert({
      type: 'lead_inquiry',
      payload: {
        audience_type: data.audience_type,
        name: data.name,
        email: data.email,
        company: data.company,
        phone: data.phone,
        message: data.message,
      },
    });

    logger.info({ event: 'lead_capture', source: 'inquiry', email: data.email }, 'New inquiry captured');

    // Lazy outbox processing
    processOutbox().catch(() => {});

    return Response.json({ success: true, message: 'Your message has been sent. We will be in touch.' });
  } catch (err) {
    logger.error({ event: 'inquiry_error', error: (err as Error).message }, 'Inquiry submission failed');
    return apiError(ERRORS.SERVER_ERROR, 500);
  }
}
