// Drip Campaign Engine — enrollment and step execution (Addendum Part 1, Section 2)
import { createServerClient } from '@/lib/supabase/server';
import { generateEmail } from '@/lib/nurture/email-writer';
import logger from '@/lib/utils/logger';

interface CampaignStep {
  step_number: number;
  delay_hours: number;
  subject_prompt: string;
  body_prompt: string;
  requires_approval: boolean;
}

/**
 * After score recalculation, check if any active drip campaign should enroll this lead.
 */
export async function evaluateDripTriggers(leadId: string, event: string): Promise<void> {
  const supabase = createServerClient();

  // Get lead's current score/tier
  const { data: leadScore } = await supabase
    .from('lead_scores')
    .select('tier')
    .eq('demo_lead_id', leadId)
    .single();

  if (!leadScore) return;

  // Get lead's vertical preference (most-used vertical)
  const { data: sessions } = await supabase
    .from('demo_sessions')
    .select('vertical')
    .eq('demo_lead_id', leadId);

  const verticalCounts: Record<string, number> = {};
  for (const s of sessions || []) {
    verticalCounts[s.vertical] = (verticalCounts[s.vertical] || 0) + 1;
  }
  const topVertical = Object.entries(verticalCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

  // Tier ordering for comparison
  const tierOrder: Record<string, number> = { cold: 0, warm: 1, hot: 2, on_fire: 3 };
  const leadTierLevel = tierOrder[leadScore.tier] ?? 0;

  // Get all active campaigns
  const { data: campaigns } = await supabase
    .from('drip_campaigns')
    .select('*')
    .eq('active', true);

  if (!campaigns || campaigns.length === 0) return;

  // Check existing enrollments to avoid double-enrollment
  const { data: existingEnrollments } = await supabase
    .from('drip_enrollments')
    .select('campaign_id')
    .eq('demo_lead_id', leadId);

  const enrolledCampaignIds = new Set((existingEnrollments || []).map((e) => e.campaign_id));

  for (const campaign of campaigns) {
    // Skip if already enrolled
    if (enrolledCampaignIds.has(campaign.id)) continue;

    // Check trigger_event match
    if (campaign.trigger_event !== event && campaign.trigger_event !== 'score_change') continue;

    // Check trigger_tier: lead's tier must be >= campaign's trigger_tier
    const campaignTierLevel = tierOrder[campaign.trigger_tier] ?? 0;
    if (leadTierLevel < campaignTierLevel) continue;

    // Check trigger_vertical if specified
    if (campaign.trigger_vertical && campaign.trigger_vertical !== topVertical) continue;

    // Enroll the lead
    const steps = campaign.steps as CampaignStep[];
    const firstStep = steps[0];
    const nextStepAt = firstStep
      ? new Date(Date.now() + firstStep.delay_hours * 60 * 60 * 1000).toISOString()
      : null;

    const { error } = await supabase.from('drip_enrollments').insert({
      demo_lead_id: leadId,
      campaign_id: campaign.id,
      current_step: 0,
      status: 'active',
      next_step_at: nextStepAt,
    });

    if (error) {
      logger.error(
        { event: 'drip_enrollment_failed', leadId, campaignId: campaign.id, error: error.message },
        'Failed to enroll lead in drip campaign'
      );
    } else {
      logger.info(
        { event: 'drip_enrolled', leadId, campaignId: campaign.id, campaignName: campaign.name, tier: leadScore.tier },
        'Lead enrolled in drip campaign'
      );
    }
  }
}

/**
 * Process all scheduled drip steps. Called by cron every 15 minutes.
 */
export async function processScheduledSteps(): Promise<number> {
  const supabase = createServerClient();

  // Get enrollments where next_step_at <= now
  const { data: dueEnrollments, error: fetchError } = await supabase
    .from('drip_enrollments')
    .select('*, drip_campaigns(*)')
    .eq('status', 'active')
    .lte('next_step_at', new Date().toISOString());

  if (fetchError || !dueEnrollments) {
    if (fetchError) {
      logger.error({ event: 'drip_fetch_failed', error: fetchError.message }, 'Failed to fetch due enrollments');
    }
    return 0;
  }

  let processed = 0;

  for (const enrollment of dueEnrollments) {
    const campaign = enrollment.drip_campaigns;
    if (!campaign) continue;

    // Check lead's subscribed status
    const { data: lead } = await supabase
      .from('demo_leads')
      .select('subscribed')
      .eq('id', enrollment.demo_lead_id)
      .single();

    if (!lead?.subscribed) {
      // Pause the enrollment if unsubscribed
      await supabase
        .from('drip_enrollments')
        .update({ status: 'paused' })
        .eq('id', enrollment.id);

      logger.info(
        { event: 'drip_skipped_unsubscribed', enrollmentId: enrollment.id, leadId: enrollment.demo_lead_id },
        'Skipping drip step — lead unsubscribed'
      );
      continue;
    }

    const steps = campaign.steps as CampaignStep[];
    const currentStepIndex = enrollment.current_step;
    const step = steps[currentStepIndex];

    if (!step) {
      // No more steps — mark completed
      await supabase
        .from('drip_enrollments')
        .update({ status: 'completed', next_step_at: null })
        .eq('id', enrollment.id);
      continue;
    }

    try {
      // Generate email via AI writer
      await generateEmail(
        enrollment.demo_lead_id,
        enrollment.id,
        step.step_number,
        step.subject_prompt,
        step.body_prompt,
        step.requires_approval
      );

      // Advance to next step
      const nextStepIndex = currentStepIndex + 1;
      const nextStep = steps[nextStepIndex];

      if (nextStep) {
        const nextStepAt = new Date(Date.now() + nextStep.delay_hours * 60 * 60 * 1000).toISOString();
        await supabase
          .from('drip_enrollments')
          .update({ current_step: nextStepIndex, next_step_at: nextStepAt })
          .eq('id', enrollment.id);
      } else {
        // Final step completed
        await supabase
          .from('drip_enrollments')
          .update({ status: 'completed', current_step: nextStepIndex, next_step_at: null })
          .eq('id', enrollment.id);
      }

      processed++;

      logger.info(
        { event: 'drip_step_processed', enrollmentId: enrollment.id, stepNumber: step.step_number, leadId: enrollment.demo_lead_id },
        'Drip step processed'
      );
    } catch (err) {
      logger.error(
        { event: 'drip_step_failed', enrollmentId: enrollment.id, stepNumber: step.step_number, error: (err as Error).message },
        'Drip step processing failed'
      );
    }
  }

  return processed;
}
