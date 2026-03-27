import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client using service_role key.
// Use this for ALL data operations in API routes.
// The service_role key bypasses RLS — security enforced at API layer.
export function createServerClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}
