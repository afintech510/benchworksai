import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { authenticateAdmin } from '@/lib/utils/admin-auth';
import { generateEmail } from '@/lib/nurture/email-writer';
import { apiError, ERRORS } from '@/lib/utils/errors';
import logger from '@/lib/utils/logger';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = authenticateAdmin(request);
  if (authError) return authError;

  const { id: leadId } = await params;

  try {
    const supabase = createServerClient();

    // Get lead's active enrollment
    const { data: enrollment } = await supabase
      .from('drip_enrollments')
      .select('id, current_step, drip_campaigns(id, steps)')
      .eq('demo_lead_id', leadId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!enrollment) {
      return apiError({ code: 'NOT_FOUND', message: 'No active enrollment found for this lead.' }, 404);
    }

    const campaign = enrollment.drip_campaigns as unknown as { id: string; steps: Array<{ step_number: number; subject_prompt: string; body_prompt: string; requires_approval: boolean }> } | null;
    const steps = campaign?.steps || [];
    const currentStep = steps.find((s) => s.step_number === enrollment.current_step);

    if (!currentStep) {
      return apiError({ code: 'NOT_FOUND', message: 'No pending step found for enrollment.' }, 404);
    }

    await generateEmail(
      leadId,
      enrollment.id,
      currentStep.step_number,
      currentStep.subject_prompt,
      currentStep.body_prompt,
      true // Always require approval for manual generation
    );

    logger.info({ event: 'admin_manual_email_generate', leadId, enrollmentId: enrollment.id }, 'Admin manually triggered email generation');

    return Response.json({ success: true, message: 'Email generated and queued for review.' });
  } catch (err) {
    logger.error({ event: 'admin_generate_email_error', leadId, error: (err as Error).message }, 'Manual email generation failed');
    return apiError(ERRORS.SERVER_ERROR, 500);
  }
}
