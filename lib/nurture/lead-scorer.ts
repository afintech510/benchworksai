// Lead Scorer — real-time scoring with tier classification (Addendum Part 1, Section 1)
import { createServerClient } from '@/lib/supabase/server';
import logger from '@/lib/utils/logger';
import { notifyBenchworks } from '@/lib/nurture/benchworks-handoff';

export interface ScoreBreakdown {
  email_gate: number;
  demo_sessions: number;
  live_interactions: number;
  competitive_analysis: number;
  magnet_downloads: number;
  contact_form: number;
  booking: number;
  return_visit: number;
  legal_vertical: number;
  construction_vertical: number;
}

export interface LeadScore {
  score: number;
  tier: 'cold' | 'warm' | 'hot' | 'on_fire';
  breakdown: ScoreBreakdown;
}

function determineTier(score: number): LeadScore['tier'] {
  if (score >= 70) return 'on_fire';
  if (score >= 45) return 'hot';
  if (score >= 20) return 'warm';
  return 'cold';
}

export async function calculateLeadScore(leadId: string): Promise<LeadScore> {
  const supabase = createServerClient();

  // Fetch all scoring dimensions in parallel
  const [
    leadResult,
    sessionsResult,
    interactionsResult,
    competitiveResult,
    magnetResult,
    contactResult,
    bookingResult,
  ] = await Promise.all([
    // Lead record (for return visit check)
    supabase
      .from('demo_leads')
      .select('created_at, last_seen_at')
      .eq('id', leadId)
      .single(),

    // Demo sessions (count + verticals)
    supabase
      .from('demo_sessions')
      .select('id, vertical')
      .eq('demo_lead_id', leadId),

    // Live AI interactions (non-cached)
    supabase
      .from('demo_interactions')
      .select('id')
      .eq('session_id', leadId) // We'll fix this — need to join through sessions
      .eq('from_cache', false),

    // Competitive analyses
    supabase
      .from('competitive_analyses')
      .select('id')
      .eq('session_id', leadId), // Join through sessions

    // Lead magnet downloads
    supabase
      .from('lead_magnet_downloads')
      .select('id')
      .eq('demo_lead_id', leadId),

    // Contact form inquiries (non-booking)
    supabase
      .from('inquiries')
      .select('id')
      .eq('demo_lead_id', leadId)
      .neq('audience_type', 'booking'),

    // Booking inquiries
    supabase
      .from('inquiries')
      .select('id')
      .eq('demo_lead_id', leadId)
      .eq('audience_type', 'booking'),
  ]);

  // For interactions and competitive analyses, we need to query through sessions
  const sessionIds = (sessionsResult.data || []).map((s) => s.id);

  let liveInteractionCount = 0;
  let competitiveCount = 0;

  if (sessionIds.length > 0) {
    const [liveResult, compResult] = await Promise.all([
      supabase
        .from('demo_interactions')
        .select('id', { count: 'exact', head: true })
        .in('session_id', sessionIds)
        .eq('from_cache', false),
      supabase
        .from('competitive_analyses')
        .select('id', { count: 'exact', head: true })
        .in('session_id', sessionIds),
    ]);
    liveInteractionCount = liveResult.count ?? 0;
    competitiveCount = compResult.count ?? 0;
  }

  // Calculate each dimension
  const sessions = sessionsResult.data || [];
  const sessionCount = sessions.length;
  const verticals = new Set(sessions.map((s) => s.vertical));

  // Return visit: last_seen_at > created_at + 24 hours
  const lead = leadResult.data;
  let returnVisit = false;
  if (lead) {
    const created = new Date(lead.created_at).getTime();
    const lastSeen = new Date(lead.last_seen_at).getTime();
    returnVisit = lastSeen - created > 24 * 60 * 60 * 1000;
  }

  const breakdown: ScoreBreakdown = {
    email_gate: 10, // Always 10 — they have a lead record
    demo_sessions: Math.min(sessionCount * 5, 35),
    live_interactions: Math.min(liveInteractionCount * 3, 15),
    competitive_analysis: competitiveCount > 0 ? 15 : 0,
    magnet_downloads: (magnetResult.data?.length ?? 0) > 0 ? 10 : 0,
    contact_form: (contactResult.data?.length ?? 0) > 0 ? 20 : 0,
    booking: (bookingResult.data?.length ?? 0) > 0 ? 25 : 0,
    return_visit: returnVisit ? 10 : 0,
    legal_vertical: verticals.has('legal') ? 5 : 0,
    construction_vertical: verticals.has('construction') ? 5 : 0,
  };

  const rawScore = Object.values(breakdown).reduce((sum, v) => sum + v, 0);
  const score = Math.min(rawScore, 100);
  const tier = determineTier(score);

  // Read previous tier BEFORE upserting so we can detect the on_fire transition
  const { data: priorScore } = await supabase
    .from('lead_scores')
    .select('tier')
    .eq('demo_lead_id', leadId)
    .maybeSingle();
  const priorTier = priorScore?.tier ?? null;

  // Upsert into lead_scores
  const { error } = await supabase
    .from('lead_scores')
    .upsert(
      {
        demo_lead_id: leadId,
        score,
        score_breakdown: breakdown,
        tier,
        last_calculated: new Date().toISOString(),
      },
      { onConflict: 'demo_lead_id' }
    );

  if (error) {
    logger.error({ event: 'lead_score_upsert_failed', leadId, error: error.message }, 'Failed to upsert lead score');
  } else {
    logger.info({ event: 'lead_score_calculated', leadId, score, tier }, 'Lead score calculated');
  }

  // Hand off to BenchworksAI outbound the first time a lead reaches on_fire.
  if (tier === 'on_fire' && priorTier !== 'on_fire') {
    notifyBenchworks({ leadId, trigger: 'tier_on_fire', score, tier }).catch(() => {});
  }

  return { score, tier, breakdown };
}
