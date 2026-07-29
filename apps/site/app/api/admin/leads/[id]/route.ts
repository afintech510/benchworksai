import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { authenticateAdmin } from '@/lib/utils/admin-auth';
import { adminLeadUpdateSchema } from '@/lib/validation/schemas';
import { apiError, ERRORS, validationError } from '@/lib/utils/errors';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = authenticateAdmin(request);
  if (authError) return authError;

  const { id } = await params;
  const supabase = createServerClient();

  const { data: lead, error } = await supabase
    .from('demo_leads')
    .select('*, lead_scores(score, tier, breakdown, updated_at)')
    .eq('id', id)
    .single();

  if (error || !lead) {
    return apiError({ code: 'NOT_FOUND', message: 'Lead not found.' }, 404);
  }

  return Response.json({ lead });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = authenticateAdmin(request);
  if (authError) return authError;

  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = adminLeadUpdateSchema.safeParse(body);

    if (!parsed.success) {
      const issues: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const path = issue.path.join('.');
        if (!issues[path]) issues[path] = [];
        issues[path].push(issue.message);
      }
      return validationError(issues);
    }

    const supabase = createServerClient();
    const updates: Record<string, unknown> = {};
    if (parsed.data.contacted !== undefined) updates.contacted = parsed.data.contacted;
    if (parsed.data.notes !== undefined) updates.notes = parsed.data.notes;

    const { error } = await supabase
      .from('demo_leads')
      .update(updates)
      .eq('id', id);

    if (error) return apiError(ERRORS.SERVER_ERROR, 500);

    return Response.json({ success: true, updated: Object.keys(updates) });
  } catch {
    return apiError(ERRORS.SERVER_ERROR, 500);
  }
}
