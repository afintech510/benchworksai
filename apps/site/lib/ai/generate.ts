// Claude wrapper — streaming, circuit breaker, token tracking, daily spend check (Section 5.1)
import Anthropic from '@anthropic-ai/sdk';
import { createServerClient } from '@/lib/supabase/server';
import { detectInjection, getHardenedSystemPrompt } from '@/lib/ai/prompt-guard';
import logger from '@/lib/utils/logger';

const MODEL = 'claude-sonnet-4-20250514';

// Cost per million tokens (Sonnet pricing as of spec date)
const INPUT_COST_PER_M = 300;   // $3.00 per 1M input tokens → 300 cents
const OUTPUT_COST_PER_M = 1500; // $15.00 per 1M output tokens → 1500 cents

const DAILY_ALERT_CENTS = 800;
const DAILY_HARD_LIMIT_CENTS = 1000;

// Circuit breaker state
let consecutiveFailures = 0;
let circuitOpenedAt = 0;
const CIRCUIT_FAILURE_THRESHOLD = 3;
const CIRCUIT_RESET_MS = 60_000; // 60 seconds

// Retry config
const MAX_RETRIES = 2;
const BASE_DELAY_MS = 1000;

function getClient(): Anthropic {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

function estimateCostCents(inputTokens: number, outputTokens: number): number {
  return Math.ceil(
    (inputTokens * INPUT_COST_PER_M + outputTokens * OUTPUT_COST_PER_M) / 1_000_000
  );
}

// Check daily spend from api_usage_log
async function getDailySpendCents(): Promise<number> {
  const supabase = createServerClient();
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('api_usage_log')
    .select('estimated_cost_cents')
    .gte('created_at', todayStart.toISOString());

  if (error || !data) return 0;
  return data.reduce((sum, row) => sum + (row.estimated_cost_cents || 0), 0);
}

// Log token usage to api_usage_log
async function logUsage(
  demoType: string,
  inputTokens: number,
  outputTokens: number
): Promise<void> {
  const supabase = createServerClient();
  const costCents = estimateCostCents(inputTokens, outputTokens);

  await supabase.from('api_usage_log').insert({
    demo_type: demoType,
    model: MODEL,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    estimated_cost_cents: costCents,
  });

  logger.info(
    { event: 'api_call', demoType, model: MODEL, input: inputTokens, output: outputTokens, costCents },
    'Claude API call'
  );
}

function isCircuitOpen(): boolean {
  if (consecutiveFailures < CIRCUIT_FAILURE_THRESHOLD) return false;
  if (Date.now() - circuitOpenedAt > CIRCUIT_RESET_MS) {
    // Half-open: allow one attempt
    consecutiveFailures = 0;
    return false;
  }
  return true;
}

function recordSuccess(): void {
  consecutiveFailures = 0;
}

function recordFailure(): void {
  consecutiveFailures++;
  if (consecutiveFailures >= CIRCUIT_FAILURE_THRESHOLD) {
    circuitOpenedAt = Date.now();
    logger.warn({ event: 'circuit_breaker_open', failures: consecutiveFailures }, 'Circuit breaker opened — cache-only mode');
  }
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface GenerateOptions {
  systemPrompt: string;
  userMessage: string;
  demoType: string;
  maxTokens?: number;
}

export interface GenerateResult {
  stream: ReadableStream<Uint8Array>;
  inputTokens: number;
  outputTokens: number;
}

export interface GenerateSyncResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
}

// Generate a streaming response from Claude (Section 5.1)
export async function generateResponse(
  options: GenerateOptions
): Promise<GenerateResult> {
  const { systemPrompt, userMessage, demoType, maxTokens = 1024 } = options;

  // Prompt injection guard (REV-007)
  const injectionCheck = detectInjection(userMessage);
  if (injectionCheck.blocked) {
    logger.warn(
      { event: 'prompt_injection_blocked', pattern: injectionCheck.pattern, demoType },
      'Prompt injection attempt blocked'
    );
    throw new Error('PROMPT_INJECTION_DETECTED');
  }

  // Circuit breaker check
  if (isCircuitOpen()) {
    logger.warn({ event: 'circuit_breaker_reject', demoType }, 'Request rejected — circuit open');
    throw new Error('CIRCUIT_BREAKER_OPEN');
  }

  // Daily spend check (REV-005)
  const dailySpend = await getDailySpendCents();
  if (dailySpend >= DAILY_HARD_LIMIT_CENTS) {
    logger.error({ event: 'daily_spend_hard_limit', dailySpend }, 'Daily spend hard limit reached — rejecting');
    throw new Error('DAILY_SPEND_LIMIT');
  }
  if (dailySpend >= DAILY_ALERT_CENTS) {
    logger.warn({ event: 'daily_spend_alert', dailySpend }, 'Daily spend alert threshold reached');
  }

  const hardenedPrompt = getHardenedSystemPrompt(systemPrompt);
  const client = getClient();
  let lastError: Error | null = null;

  // Retry with exponential backoff
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      await sleep(BASE_DELAY_MS * Math.pow(2, attempt - 1));
    }

    try {
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: maxTokens,
        system: hardenedPrompt,
        messages: [{ role: 'user', content: userMessage }],
        stream: true,
      });

      // Collect token counts and stream the response
      let inputTokens = 0;
      let outputTokens = 0;

      const encoder = new TextEncoder();
      const stream = new ReadableStream<Uint8Array>({
        async start(controller) {
          try {
            for await (const event of response) {
              if (event.type === 'message_start' && event.message?.usage) {
                inputTokens = event.message.usage.input_tokens;
              }
              if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
                controller.enqueue(encoder.encode(event.delta.text));
              }
              if (event.type === 'message_delta' && event.usage) {
                outputTokens = event.usage.output_tokens;
              }
            }

            // Log usage after stream completes
            recordSuccess();
            await logUsage(demoType, inputTokens, outputTokens);

            controller.close();
          } catch (err) {
            recordFailure();
            controller.error(err);
          }
        },
      });

      return { stream, inputTokens, outputTokens };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      recordFailure();
      logger.warn(
        { event: 'claude_api_error', attempt: attempt + 1, error: lastError.message, demoType },
        'Claude API call failed'
      );
    }
  }

  throw lastError ?? new Error('Claude API call failed after retries');
}

// Non-streaming variant — same protections (circuit breaker, spend limit, retry, prompt guard)
export async function generateResponseSync(
  options: GenerateOptions
): Promise<GenerateSyncResult> {
  const { systemPrompt, userMessage, demoType, maxTokens = 2048 } = options;

  // Prompt injection guard (REV-007)
  const injectionCheck = detectInjection(userMessage);
  if (injectionCheck.blocked) {
    logger.warn(
      { event: 'prompt_injection_blocked', pattern: injectionCheck.pattern, demoType },
      'Prompt injection attempt blocked'
    );
    throw new Error('PROMPT_INJECTION_DETECTED');
  }

  // Circuit breaker check
  if (isCircuitOpen()) {
    logger.warn({ event: 'circuit_breaker_reject', demoType }, 'Request rejected — circuit open');
    throw new Error('CIRCUIT_BREAKER_OPEN');
  }

  // Daily spend check (REV-005)
  const dailySpend = await getDailySpendCents();
  if (dailySpend >= DAILY_HARD_LIMIT_CENTS) {
    logger.error({ event: 'daily_spend_hard_limit', dailySpend }, 'Daily spend hard limit reached — rejecting');
    throw new Error('DAILY_SPEND_LIMIT');
  }
  if (dailySpend >= DAILY_ALERT_CENTS) {
    logger.warn({ event: 'daily_spend_alert', dailySpend }, 'Daily spend alert threshold reached');
  }

  const hardenedPrompt = getHardenedSystemPrompt(systemPrompt);
  const client = getClient();
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      await sleep(BASE_DELAY_MS * Math.pow(2, attempt - 1));
    }

    try {
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: maxTokens,
        system: hardenedPrompt,
        messages: [{ role: 'user', content: userMessage }],
      });

      const text = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === 'text')
        .map((block) => block.text)
        .join('\n');

      const inputTokens = response.usage.input_tokens;
      const outputTokens = response.usage.output_tokens;

      recordSuccess();
      await logUsage(demoType, inputTokens, outputTokens);

      return { text, inputTokens, outputTokens };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      recordFailure();
      logger.warn(
        { event: 'claude_api_error', attempt: attempt + 1, error: lastError.message, demoType },
        'Claude API call failed (sync)'
      );
    }
  }

  throw lastError ?? new Error('Claude API call failed after retries');
}
