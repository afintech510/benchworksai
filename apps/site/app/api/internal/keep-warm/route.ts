import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import logger from '@/lib/utils/logger';

// Cheap touch endpoint to prevent Supabase free-tier auto-pause.
// Auth: matches BENCHWORKS_HANDOFF_KEY (we already share that secret with benchworks).
export async function POST(request: NextRequest) {
  const expected = process.env.BENCHWORKS_HANDOFF_KEY;
  const provided = request.headers.get('x-service-key');
  if (!expected || provided !== expected) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createServerClient();
    const { error } = await supabase.from('demo_leads').select('id', { count: 'exact', head: true }).limit(1);
    if (error) throw error;
    return NextResponse.json({ warmed_at: new Date().toISOString() });
  } catch (err) {
    logger.warn({ event: 'keep_warm_failed', error: (err as Error).message });
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
