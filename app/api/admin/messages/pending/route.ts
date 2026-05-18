import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { authenticateAdmin } from '@/lib/utils/admin-auth';
import { apiError, ERRORS } from '@/lib/utils/errors';

/**
 * GET /api/admin/messages/pending
 * Returns all pending_review drip messages with lead context in a single query.
 * Replaces the N+1 pattern in the messages page.
 */
export async function GET(request: NextRequest) {
  const authError = authenticateAdmin(request);
  if (authError) return authError;

  try {
    const supabase = createServerClient();

    const { data: messages, error } = await supabase
      .from('drip_messages')
      .select(`
        id, enrollment_id, step_number, subject, body_html, status, created_at,
        drip_enrollments(
          demo_lead_id,
          demo_leads(id, email, name, company),
          drip_campaigns(name)
        )
      `)
      .eq('status', 'pending_review')
      .order('created_at', { ascending: true });

    if (error) return apiError(ERRORS.SERVER_ERROR, 500);

    // Flatten the nested joins for the frontend
    const result = (messages || []).map((msg) => {
      const enrollment = msg.drip_enrollments as unknown as {
        demo_lead_id: string;
        demo_leads: { id: string; email: string; name: string | null; company: string | null } | null;
        drip_campaigns: { name: string } | null;
      } | null;

      return {
        id: msg.id,
        enrollment_id: msg.enrollment_id,
        step_number: msg.step_number,
        subject: msg.subject,
        body_html: msg.body_html,
        status: msg.status,
        created_at: msg.created_at,
        lead_id: enrollment?.demo_lead_id || null,
        lead_name: enrollment?.demo_leads?.name || enrollment?.demo_leads?.email || 'Unknown',
        lead_email: enrollment?.demo_leads?.email || '',
        lead_company: enrollment?.demo_leads?.company || null,
        campaign_name: enrollment?.drip_campaigns?.name || 'Unknown Campaign',
      };
    });

    return Response.json({ messages: result, total: result.length });
  } catch {
    return apiError(ERRORS.SERVER_ERROR, 500);
  }
}
