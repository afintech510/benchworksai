import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { authenticateAdmin } from '@/lib/utils/admin-auth';
import { dripMessageActionSchema } from '@/lib/validation/schemas';
import { apiError, ERRORS, validationError } from '@/lib/utils/errors';
import logger from '@/lib/utils/logger';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = authenticateAdmin(request);
  if (authError) return authError;

  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = dripMessageActionSchema.safeParse(body);

    if (!parsed.success) {
      const issues: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const path = issue.path.join('.');
        if (!issues[path]) issues[path] = [];
        issues[path].push(issue.message);
      }
      return validationError(issues);
    }

    const { action, edited_subject, edited_body } = parsed.data;
    const supabase = createServerClient();

    // Verify message exists and is pending_review
    const { data: message } = await supabase
      .from('drip_messages')
      .select('id, status, enrollment_id, step_number')
      .eq('id', id)
      .single();

    if (!message) {
      return apiError({ code: 'NOT_FOUND', message: 'Message not found.' }, 404);
    }

    if (message.status !== 'pending_review') {
      return apiError({ code: 'CONFLICT', message: `Message is already ${message.status}.` }, 409);
    }

    const updates: Record<string, unknown> = {
      reviewed_by: 'admin',
      reviewed_at: new Date().toISOString(),
    };

    if (action === 'approve') {
      updates.status = 'approved';
    } else if (action === 'reject') {
      updates.status = 'rejected';
    } else if (action === 'edit') {
      updates.status = 'approved';
      if (edited_subject) updates.subject = edited_subject;
      if (edited_body) updates.body_html = edited_body;
    }

    const { error } = await supabase
      .from('drip_messages')
      .update(updates)
      .eq('id', id);

    if (error) return apiError(ERRORS.SERVER_ERROR, 500);

    // If approved (or edited+approved), add to notification outbox
    if (action === 'approve' || action === 'edit') {
      // Get lead email via enrollment
      const { data: enrollment } = await supabase
        .from('drip_enrollments')
        .select('demo_lead_id')
        .eq('id', message.enrollment_id)
        .single();

      if (enrollment) {
        const { data: lead } = await supabase
          .from('demo_leads')
          .select('email, name')
          .eq('id', enrollment.demo_lead_id)
          .single();

        if (lead) {
          const { data: updatedMsg } = await supabase
            .from('drip_messages')
            .select('subject, body_html')
            .eq('id', id)
            .single();

          await supabase.from('notification_outbox').insert({
            channel: 'email',
            recipient: lead.email,
            subject: updatedMsg?.subject || 'Follow-up from BenchworksAI',
            body: updatedMsg?.body_html || '',
            metadata: {
              type: 'drip_email',
              lead_name: lead.name,
              enrollment_id: message.enrollment_id,
              step_number: message.step_number,
              admin_reviewed: true,
            },
          });
        }
      }
    }

    logger.info({ event: 'admin_message_action', messageId: id, action }, 'Admin drip message action');

    return Response.json({ success: true, action });
  } catch {
    return apiError(ERRORS.SERVER_ERROR, 500);
  }
}
