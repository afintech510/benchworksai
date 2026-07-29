import { NextRequest, NextResponse } from 'next/server';
import { demoInteractSchema } from '@/lib/validation/schemas';
import { getSessionFromCookies } from '@/lib/demo-engine/session';
import { routeInteraction } from '@/lib/demo-engine/interaction-router';
import { getPresetSequence } from '@/lib/demo-engine/cache';
import { checkAndIncrementRateLimit, checkGlobalDailyLimit, incrementGlobalDailyLimit, checkRateLimitReadOnly } from '@/lib/demo-engine/rate-limiter';
import { detectInjection } from '@/lib/ai/prompt-guard';
import { generateResponse } from '@/lib/ai/generate';
import { getSystemPromptPrefix } from '@/lib/demo-engine/prompts';
import { createServerClient } from '@/lib/supabase/server';
import { calculateLeadScore } from '@/lib/nurture/lead-scorer';
import { evaluateDripTriggers } from '@/lib/nurture/drip-engine';
import logger from '@/lib/utils/logger';

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. Verify JWT
    const session = await getSessionFromCookies();
    if (!session.valid) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Invalid or expired session.' } },
        { status: 401 }
      );
    }

    // 2. Validate request body
    const body = await request.json();
    const parsed = demoInteractSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid input.', details: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    const { session_id, input_type, user_input, trigger_key } = parsed.data;
    const supabase = createServerClient();

    // 3. Verify session belongs to this lead
    const { data: demoSession } = await supabase
      .from('demo_sessions')
      .select('id, demo_type, vertical, demo_lead_id')
      .eq('id', session_id)
      .eq('demo_lead_id', session.leadId)
      .single();

    if (!demoSession) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Session not found.' } },
        { status: 404 }
      );
    }

    const { demo_type, vertical } = demoSession;

    // 4. Input routing: preset_command → cache, text → live AI
    const route = await routeInteraction(input_type, demo_type, vertical, trigger_key);

    if (route.type === 'cached' && route.cached) {
      // Log cached interaction
      const latencyMs = Date.now() - startTime;
      await supabase.from('demo_interactions').insert({
        session_id,
        input_type,
        user_input: route.cached.trigger_key,
        response: route.cached.response_text,
        response_data: route.cached.response_data,
        from_cache: true,
        latency_ms: latencyMs,
      });

      return NextResponse.json({
        response_text: route.cached.response_text,
        response_data: route.cached.response_data,
        from_cache: true,
      });
    }

    // --- Free-text path ---
    if (!user_input) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'user_input is required for text input.' } },
        { status: 400 }
      );
    }

    // 5. Rate limit check (free-text only)
    // Get lead email for rate limiting
    const { data: lead } = await supabase
      .from('demo_leads')
      .select('email')
      .eq('id', session.leadId)
      .single();

    const identifier = lead?.email || session.leadId;

    // P04-002 fix: Check both limits read-only FIRST, then increment both
    // only after both pass. Prevents global credits from being consumed
    // when the per-demo limit would reject.

    // Read-only check: global daily
    const globalCheck = await checkGlobalDailyLimit(identifier);
    if (!globalCheck.allowed) {
      const nextPresets = await getPresetSequence(demo_type, vertical);
      return NextResponse.json(
        {
          error: {
            code: 'RATE_LIMITED',
            message: 'Daily demo limit reached.',
            limit_type: 'global_daily',
            reset_at: globalCheck.resetAt,
            next_presets: nextPresets.map((p) => ({
              prompt_text: p.prompt_text,
              trigger_key: p.trigger_key,
            })),
          },
        },
        { status: 429 }
      );
    }

    // Read-only check: per-demo daily
    const demoCheck = await checkRateLimitReadOnly(identifier, demo_type, 'email_daily');
    if (!demoCheck.allowed) {
      const nextPresets = await getPresetSequence(demo_type, vertical);
      return NextResponse.json(
        {
          error: {
            code: 'RATE_LIMITED',
            message: `Demo limit reached for ${demo_type}.`,
            limit_type: 'email_daily',
            reset_at: demoCheck.resetAt,
            next_presets: nextPresets.map((p) => ({
              prompt_text: p.prompt_text,
              trigger_key: p.trigger_key,
            })),
          },
        },
        { status: 429 }
      );
    }

    // Both checks passed — now atomically increment both counters
    const globalIncrement = await incrementGlobalDailyLimit(identifier);
    if (!globalIncrement.allowed) {
      // Raced with another request — global now exhausted
      const nextPresets = await getPresetSequence(demo_type, vertical);
      return NextResponse.json(
        {
          error: {
            code: 'RATE_LIMITED',
            message: 'Daily demo limit reached.',
            limit_type: 'global_daily',
            next_presets: nextPresets.map((p) => ({
              prompt_text: p.prompt_text,
              trigger_key: p.trigger_key,
            })),
          },
        },
        { status: 429 }
      );
    }

    const demoIncrement = await checkAndIncrementRateLimit(identifier, demo_type, 'email_daily');
    if (!demoIncrement.allowed) {
      // Raced with another request — per-demo now exhausted
      const nextPresets = await getPresetSequence(demo_type, vertical);
      return NextResponse.json(
        {
          error: {
            code: 'RATE_LIMITED',
            message: `Demo limit reached for ${demo_type}.`,
            limit_type: 'email_daily',
            next_presets: nextPresets.map((p) => ({
              prompt_text: p.prompt_text,
              trigger_key: p.trigger_key,
            })),
          },
        },
        { status: 429 }
      );
    }

    // 6. Prompt guard
    const injectionCheck = detectInjection(user_input);
    if (injectionCheck.blocked) {
      logger.warn(
        { event: 'prompt_injection_blocked', sessionId: session_id, pattern: injectionCheck.pattern },
        'Prompt injection blocked in demo interact'
      );

      const deflection = "I'm here to help with business-related questions for this demo. Could you rephrase your question about how AI can help your business?";

      await supabase.from('demo_interactions').insert({
        session_id,
        input_type,
        user_input,
        response: deflection,
        from_cache: false,
        latency_ms: Date.now() - startTime,
      });

      return NextResponse.json({
        response_text: deflection,
        from_cache: false,
        blocked: true,
      });
    }

    // 7. Daily spend check
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const { data: usageRows } = await supabase
      .from('api_usage_log')
      .select('estimated_cost_cents')
      .gte('created_at', todayStart.toISOString());

    const dailySpendCents = (usageRows || []).reduce(
      (sum, r) => sum + (r.estimated_cost_cents || 0),
      0
    );

    if (dailySpendCents >= 1000) {
      logger.error({ event: 'daily_spend_limit_interact', dailySpendCents }, 'Daily spend limit in interact');
      return NextResponse.json(
        { error: { code: 'SERVICE_UNAVAILABLE', message: 'Demo temporarily unavailable. Please try again later.' } },
        { status: 503 }
      );
    }

    // 8. Claude call (streaming)
    const systemPrompt = getSystemPromptPrefix(demo_type, vertical);

    try {
      const result = await generateResponse({
        systemPrompt,
        userMessage: user_input,
        demoType: demo_type,
        maxTokens: 1024,
      });

      // Create a transform stream that also logs the interaction after completion
      let fullResponse = '';
      const decoder = new TextDecoder();

      const transformStream = new TransformStream<Uint8Array, Uint8Array>({
        transform(chunk, controller) {
          const text = decoder.decode(chunk, { stream: true });
          fullResponse += text;
          controller.enqueue(chunk);
        },
        async flush() {
          // 9. Log interaction after stream completes
          const latencyMs = Date.now() - startTime;
          await supabase.from('demo_interactions').insert({
            session_id,
            input_type,
            user_input,
            response: fullResponse,
            from_cache: false,
            latency_ms: latencyMs,
            input_tokens: result.inputTokens || null,
            output_tokens: result.outputTokens || null,
          });

          // Recalculate lead score after live AI interaction (fire-and-forget)
          calculateLeadScore(session.leadId)
            .then(() => evaluateDripTriggers(session.leadId, 'score_change'))
            .catch(() => {});
        },
      });

      const readableStream = result.stream.pipeThrough(transformStream);

      return new Response(readableStream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Transfer-Encoding': 'chunked',
          'Cache-Control': 'no-cache',
          'X-Demo-Session': session_id,
        },
      });
    } catch (err) {
      const errorMessage = (err as Error).message;

      if (errorMessage === 'PROMPT_INJECTION_DETECTED') {
        const deflection = "I'm here to help with business-related questions. Let me know how I can assist with your business needs.";
        return NextResponse.json({ response_text: deflection, from_cache: false, blocked: true });
      }

      if (errorMessage === 'CIRCUIT_BREAKER_OPEN') {
        return NextResponse.json(
          { error: { code: 'SERVICE_UNAVAILABLE', message: 'AI service temporarily unavailable. Try preset examples.' } },
          { status: 503 }
        );
      }

      if (errorMessage === 'DAILY_SPEND_LIMIT') {
        return NextResponse.json(
          { error: { code: 'SERVICE_UNAVAILABLE', message: 'Demo temporarily unavailable.' } },
          { status: 503 }
        );
      }

      throw err;
    }
  } catch (err) {
    logger.error({ event: 'demo_interact_error', error: (err as Error).message }, 'Demo interact endpoint error');
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'Internal server error.' } },
      { status: 500 }
    );
  }
}
