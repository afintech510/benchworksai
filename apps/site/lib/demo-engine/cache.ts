import { createServerClient } from '@/lib/supabase/server';

export interface PresetCommand {
  sequence_order: number;
  prompt_text: string;
  trigger_key: string;
}

export interface CachedResponse {
  response_text: string;
  response_data: Record<string, unknown> | null;
  trigger_key: string;
}

// Look up a cached response by exact (demo_type, vertical, trigger_key) match.
// Returns null on miss — free-text always misses (cache is preset-only per REV-016).
export async function lookupCachedResponse(
  demoType: string,
  vertical: string,
  triggerKey: string
): Promise<CachedResponse | null> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('demo_cached_responses')
    .select('response_text, response_data, trigger_key')
    .eq('demo_type', demoType)
    .eq('vertical', vertical)
    .eq('trigger_key', triggerKey)
    .eq('active', true)
    .single();

  if (error || !data) return null;

  return {
    response_text: data.response_text,
    response_data: data.response_data as Record<string, unknown> | null,
    trigger_key: data.trigger_key,
  };
}

// Get ordered preset command sequence for a demo config
export async function getPresetSequence(
  demoType: string,
  vertical: string
): Promise<PresetCommand[]> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('demo_cached_responses')
    .select('sequence_order, prompt_text, trigger_key')
    .eq('demo_type', demoType)
    .eq('vertical', vertical)
    .eq('active', true)
    .order('sequence_order', { ascending: true });

  if (error || !data) return [];

  return data.map((row) => ({
    sequence_order: row.sequence_order,
    prompt_text: row.prompt_text,
    trigger_key: row.trigger_key,
  }));
}
