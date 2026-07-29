import { createClient } from '@supabase/supabase-js';

// WARNING: Browser Supabase client — uses anon key.
// RESTRICTED TO Supabase Storage operations ONLY.
// NEVER use this client for data table queries.
// All data access must go through server-side API routes using the service_role key.
export function createBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  return createClient(url, key);
}
