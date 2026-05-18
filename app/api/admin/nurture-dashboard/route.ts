import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { authenticateAdmin } from '@/lib/utils/admin-auth';
import { apiError, ERRORS } from '@/lib/utils/errors';

export async function GET(request: NextRequest) {
  const authError = authenticateAdmin(request);
  if (authError) return authError;

  try {
    const supabase = createServerClient();

    const [leadsResult, scoresResult, pendingResult, enrollmentsResult, recentLeadsResult] = await Promise.all([
      // Total leads count
      supabase.from('demo_leads').select('id', { count: 'exact', head: true }),

      // Tier counts
      supabase.from('lead_scores').select('tier'),

      // Pending review messages
      supabase
        .from('drip_messages')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending_review'),

      // Active enrollments
      supabase
        .from('drip_enrollments')
        .select('id, status, drip_campaigns(name)')
        .eq('status', 'active'),

      // Recent leads (last 10)
      supabase
        .from('demo_leads')
        .select('id, email, name, company, created_at, last_seen_at, lead_scores(score, tier)')
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

    // Calculate tier counts
    const tierCounts = { cold: 0, warm: 0, hot: 0, on_fire: 0 };
    for (const row of scoresResult.data || []) {
      const tier = row.tier as keyof typeof tierCounts;
      if (tier in tierCounts) tierCounts[tier]++;
    }

    // Campaign enrollment stats
    const campaignStats: Record<string, number> = {};
    for (const enrollment of enrollmentsResult.data || []) {
      const name = (enrollment.drip_campaigns as unknown as { name: string } | null)?.name || 'Unknown';
      campaignStats[name] = (campaignStats[name] || 0) + 1;
    }

    return Response.json({
      total_leads: leadsResult.count ?? 0,
      tier_counts: tierCounts,
      pending_messages: pendingResult.count ?? 0,
      active_enrollments: enrollmentsResult.data?.length ?? 0,
      campaign_stats: campaignStats,
      recent_leads: recentLeadsResult.data || [],
    });
  } catch {
    return apiError(ERRORS.SERVER_ERROR, 500);
  }
}
