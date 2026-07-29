import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { authenticateAdmin } from '@/lib/utils/admin-auth';
import { apiError, ERRORS } from '@/lib/utils/errors';
import logger from '@/lib/utils/logger';

export async function POST(request: NextRequest) {
  const authError = authenticateAdmin(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { demo_type, vertical } = body as { demo_type?: string; vertical?: string };

    const supabase = createServerClient();
    let query = supabase.from('demo_cached_responses').delete();

    if (demo_type) query = query.eq('demo_type', demo_type);
    if (vertical) query = query.eq('vertical', vertical);

    // Safety: require at least one filter to prevent full table wipe
    if (!demo_type && !vertical) {
      return apiError({ code: 'VALIDATION_ERROR', message: 'Specify demo_type and/or vertical to invalidate.' }, 400);
    }

    const { error, count } = await query;

    if (error) return apiError(ERRORS.SERVER_ERROR, 500);

    logger.info({ event: 'admin_cache_invalidate', demo_type, vertical, count }, 'Cache invalidated');

    return Response.json({ success: true, deleted: count ?? 0 });
  } catch {
    return apiError(ERRORS.SERVER_ERROR, 500);
  }
}
