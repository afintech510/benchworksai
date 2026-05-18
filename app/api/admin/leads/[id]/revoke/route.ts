import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { authenticateAdmin } from '@/lib/utils/admin-auth';
import { apiError, ERRORS } from '@/lib/utils/errors';
import logger from '@/lib/utils/logger';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = authenticateAdmin(request);
  if (authError) return authError;

  const { id } = await params;
  const supabase = createServerClient();

  // Increment jwt_version to invalidate all existing tokens
  const { data, error } = await supabase.rpc('increment_jwt_version', { lead_id: id });

  if (error) {
    // Fallback: manual increment if RPC doesn't exist
    const { data: lead } = await supabase
      .from('demo_leads')
      .select('jwt_version')
      .eq('id', id)
      .single();

    if (!lead) return apiError({ code: 'NOT_FOUND', message: 'Lead not found.' }, 404);

    const { error: updateError } = await supabase
      .from('demo_leads')
      .update({ jwt_version: (lead.jwt_version || 0) + 1 })
      .eq('id', id);

    if (updateError) return apiError(ERRORS.SERVER_ERROR, 500);
  }

  logger.info({ event: 'admin_lead_revoked', leadId: id }, 'Lead session revoked');

  return Response.json({ success: true, message: 'All sessions for this lead have been revoked.' });
}
