import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { authenticateAdmin } from '@/lib/utils/admin-auth';
import { apiError, ERRORS } from '@/lib/utils/errors';

export async function GET(request: NextRequest) {
  const authError = authenticateAdmin(request);
  if (authError) return authError;

  try {
    const url = new URL(request.url);
    const search = url.searchParams.get('search') || '';
    const tier = url.searchParams.get('tier') || '';
    const contacted = url.searchParams.get('contacted');
    const sort = url.searchParams.get('sort') || 'created_at';
    const order = url.searchParams.get('order') === 'asc' ? true : false;
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '50', 10)));
    const offset = (page - 1) * limit;

    const supabase = createServerClient();

    let query = supabase
      .from('demo_leads')
      .select('id, email, name, company, vertical_interest, source_demo, subscribed, contacted, last_seen_at, created_at, lead_scores(score, tier)', { count: 'exact' });

    if (search) {
      query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%,company.ilike.%${search}%`);
    }

    if (contacted === 'true') {
      query = query.eq('contacted', true);
    } else if (contacted === 'false') {
      query = query.eq('contacted', false);
    }

    // Sort — score sorting requires post-processing since it's a joined table
    if (sort === 'score') {
      // Fetch all matching, sort client-side by score
      const { data: allLeads, count, error } = await query;
      if (error) return apiError(ERRORS.SERVER_ERROR, 500);

      const leads = (allLeads || [])
        .map((lead) => ({
          ...lead,
          score: Array.isArray(lead.lead_scores) ? lead.lead_scores[0]?.score ?? 0 : (lead.lead_scores as { score: number; tier: string } | null)?.score ?? 0,
          tier_value: Array.isArray(lead.lead_scores) ? lead.lead_scores[0]?.tier ?? 'cold' : (lead.lead_scores as { score: number; tier: string } | null)?.tier ?? 'cold',
        }))
        .sort((a, b) => order ? a.score - b.score : b.score - a.score);

      // Filter by tier after join
      const filtered = tier ? leads.filter((l) => l.tier_value === tier) : leads;

      return Response.json({
        leads: filtered.slice(offset, offset + limit),
        total: filtered.length,
        page,
        limit,
      });
    }

    query = query.order(sort as 'created_at' | 'last_seen_at', { ascending: order });
    query = query.range(offset, offset + limit - 1);

    const { data: leads, count, error } = await query;
    if (error) return apiError(ERRORS.SERVER_ERROR, 500);

    // Filter by tier client-side (it's on the joined table)
    let result = leads || [];
    if (tier) {
      result = result.filter((lead) => {
        const leadTier = Array.isArray(lead.lead_scores) ? lead.lead_scores[0]?.tier : (lead.lead_scores as { score: number; tier: string } | null)?.tier;
        return leadTier === tier;
      });
    }

    return Response.json({
      leads: result,
      total: count ?? result.length,
      page,
      limit,
    });
  } catch {
    return apiError(ERRORS.SERVER_ERROR, 500);
  }
}
