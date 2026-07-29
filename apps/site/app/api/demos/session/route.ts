import { NextRequest, NextResponse } from 'next/server';
import { demoSessionSchema } from '@/lib/validation/schemas';
import { getSessionFromCookies } from '@/lib/demo-engine/session';
import { getPresetSequence } from '@/lib/demo-engine/cache';
import { createServerClient } from '@/lib/supabase/server';
import logger from '@/lib/utils/logger';

export async function POST(request: NextRequest) {
  try {
    // Verify JWT from cookie
    const session = await getSessionFromCookies();
    if (!session.valid) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Invalid or expired session.' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = demoSessionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid input.', details: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    const { demo_type, vertical } = parsed.data;
    const supabase = createServerClient();

    // Validate demo_type exists and is active
    const { data: demoTypeRow } = await supabase
      .from('demo_types')
      .select('id, display_name')
      .eq('id', demo_type)
      .eq('active', true)
      .single();

    if (!demoTypeRow) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Demo type not found or inactive.' } },
        { status: 404 }
      );
    }

    // Validate vertical exists and is active
    const { data: verticalRow } = await supabase
      .from('verticals')
      .select('id, display_name, config')
      .eq('id', vertical)
      .eq('active', true)
      .single();

    if (!verticalRow) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Vertical not found or inactive.' } },
        { status: 404 }
      );
    }

    // Create demo session
    const { data: demoSession, error: sessionError } = await supabase
      .from('demo_sessions')
      .insert({
        demo_lead_id: session.leadId,
        demo_type,
        vertical,
      })
      .select('id')
      .single();

    if (sessionError || !demoSession) {
      logger.error({ event: 'demo_session_create_error', error: sessionError }, 'Failed to create demo session');
      return NextResponse.json(
        { error: { code: 'SERVER_ERROR', message: 'Failed to create session.' } },
        { status: 500 }
      );
    }

    // Load presets and rate limit info
    const presetCommands = await getPresetSequence(demo_type, vertical);

    logger.info(
      { event: 'demo_session_created', sessionId: demoSession.id, demoType: demo_type, vertical },
      'Demo session created'
    );

    return NextResponse.json({
      session_id: demoSession.id,
      demo_type,
      vertical,
      vertical_config: verticalRow.config,
      preset_commands: presetCommands.map((p) => ({
        sequence: p.sequence_order,
        prompt_text: p.prompt_text,
        trigger_key: p.trigger_key,
      })),
    });
  } catch (err) {
    logger.error({ event: 'demo_session_error', error: (err as Error).message }, 'Demo session endpoint error');
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'Internal server error.' } },
      { status: 500 }
    );
  }
}
