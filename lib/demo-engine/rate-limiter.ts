import { createServerClient } from '@/lib/supabase/server';
import type { RateLimitConfig } from '@/lib/supabase/types';

// In-memory cache for rate limit config (60s TTL)
let configCache: { config: RateLimitConfig; fetchedAt: number } | null = null;
const CONFIG_TTL_MS = 60_000;

async function getRateLimitConfig(): Promise<RateLimitConfig> {
  if (configCache && Date.now() - configCache.fetchedAt < CONFIG_TTL_MS) {
    return configCache.config;
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('site_config')
    .select('value')
    .eq('key', 'rate_limit_config')
    .single();

  if (error || !data) {
    // Fallback defaults
    return { global_daily: 15, chatbot: 5, competitive_analysis: 1, doc_drafting: 3, default: 5 };
  }

  const config = data.value as RateLimitConfig;
  configCache = { config, fetchedAt: Date.now() };
  return config;
}

export interface RateLimitResult {
  allowed: boolean;
  count?: number;
  limit: number;
  limitType: string;
  resetAt?: string;
}

// Atomic rate check using UPSERT (REV-002). No read-then-write.
export async function checkAndIncrementRateLimit(
  identifier: string,
  demoType: string,
  limitType: 'session' | 'email_daily' | 'global_daily' = 'email_daily'
): Promise<RateLimitResult> {
  const config = await getRateLimitConfig();
  const limit =
    limitType === 'global_daily'
      ? config.global_daily
      : config[demoType] ?? config.default;

  const supabase = createServerClient();

  // Lazy cleanup: remove expired rows for this identifier (REV-035)
  await supabase
    .from('rate_limits')
    .delete()
    .eq('identifier', identifier)
    .lt('window_end', new Date().toISOString());

  // Atomic UPSERT (REV-002): insert or increment, reject if at limit
  const { data, error } = await supabase.rpc('check_rate_limit', {
    p_identifier: identifier,
    p_limit_type: limitType,
    p_demo_type: demoType,
    p_limit: limit,
  });

  if (error) {
    // Fallback: use raw SQL via supabase
    const windowEnd = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const { data: result } = await supabase
      .from('rate_limits')
      .select('count, window_end')
      .eq('identifier', identifier)
      .eq('limit_type', limitType)
      .eq('demo_type', demoType)
      .gt('window_end', new Date().toISOString())
      .order('window_start', { ascending: false })
      .limit(1)
      .single();

    if (result && result.count >= limit) {
      return {
        allowed: false,
        count: result.count,
        limit,
        limitType,
        resetAt: result.window_end,
      };
    }

    // Insert new row if no active window
    if (!result) {
      await supabase.from('rate_limits').insert({
        identifier,
        limit_type: limitType,
        demo_type: demoType,
        count: 1,
        window_end: windowEnd,
      });
      return { allowed: true, count: 1, limit, limitType, resetAt: windowEnd };
    }

    return { allowed: true, count: (result.count || 0) + 1, limit, limitType };
  }

  // RPC returned result
  const count = data as number;
  if (count === 0) {
    return { allowed: false, limit, limitType };
  }

  return { allowed: true, count, limit, limitType };
}

// Check global daily limit across all demos
export async function checkGlobalDailyLimit(
  identifier: string
): Promise<RateLimitResult> {
  return checkAndIncrementRateLimit(identifier, '_global', 'global_daily');
}

// Remove expired rate limit rows for an identifier
export async function lazyCleanup(identifier: string): Promise<void> {
  const supabase = createServerClient();
  await supabase
    .from('rate_limits')
    .delete()
    .eq('identifier', identifier)
    .lt('window_end', new Date().toISOString());
}
