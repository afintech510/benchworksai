import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { authenticateAdmin } from '@/lib/utils/admin-auth';
import { apiError } from '@/lib/utils/errors';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = authenticateAdmin(request);
  if (authError) return authError;

  const { id } = await params;
  const supabase = createServerClient();

  const [leadResult, scoreResult, sessionsResult, enrollmentsResult, messagesResult] = await Promise.all([
    supabase.from('demo_leads').select('*').eq('id', id).single(),
    supabase.from('lead_scores').select('score, tier, breakdown, updated_at').eq('demo_lead_id', id).single(),
    supabase
      .from('demo_sessions')
      .select('id, demo_type, vertical, created_at')
      .eq('demo_lead_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('drip_enrollments')
      .select('id, campaign_id, current_step, status, next_step_at, created_at, drip_campaigns(name)')
      .eq('demo_lead_id', id),
    supabase
      .from('drip_enrollments')
      .select('id')
      .eq('demo_lead_id', id)
      .then(async (enrollResult) => {
        const ids = (enrollResult.data || []).map((e) => e.id);
        if (ids.length === 0) return { data: [] };
        return supabase
          .from('drip_messages')
          .select('id, enrollment_id, step_number, subject, body_html, status, reviewed_by, reviewed_at, created_at')
          .in('enrollment_id', ids)
          .order('created_at', { ascending: false });
      }),
  ]);

  if (leadResult.error || !leadResult.data) {
    return apiError({ code: 'NOT_FOUND', message: 'Lead not found.' }, 404);
  }

  // Fetch interactions via session IDs
  const sessionIds = (sessionsResult.data || []).map((s) => s.id);
  let interactions: unknown[] = [];
  let competitiveAnalyses: unknown[] = [];

  if (sessionIds.length > 0) {
    const [interactionsResult, competitiveResult] = await Promise.all([
      supabase
        .from('demo_interactions')
        .select('id, session_id, input_type, user_input, response, from_cache, latency_ms, created_at')
        .in('session_id', sessionIds)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('competitive_analyses')
        .select('id, session_id, business_name, competitors, pdf_storage_path, created_at')
        .in('session_id', sessionIds)
        .order('created_at', { ascending: false }),
    ]);
    interactions = interactionsResult.data || [];
    competitiveAnalyses = competitiveResult.data || [];
  }

  const allMessages = messagesResult.data || [];

  return Response.json({
    lead: leadResult.data,
    score: scoreResult.data || { score: 0, tier: 'cold', breakdown: {} },
    sessions: sessionsResult.data || [],
    interactions,
    competitive_analyses: competitiveAnalyses,
    enrollments: enrollmentsResult.data || [],
    messages: allMessages,
    pending_messages: allMessages.filter((m: { status: string }) => m.status === 'pending_review'),
  });
}
