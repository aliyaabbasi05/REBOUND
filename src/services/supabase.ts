import { createClient } from '@supabase/supabase-js';

// Support VITE_SUPABASE_URL (and NEXT_PUBLIC_SUPABASE_URL fallback)
const SUPABASE_URL = (
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
  ''
) as string;

// Support VITE_SUPABASE_PUBLISHABLE_KEY and VITE_SUPABASE_ANON_KEY (and NEXT_PUBLIC_ equivalents)
const SUPABASE_KEY = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  ''
) as string;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn(
    '[REBOUND] Supabase env vars not set. Cloud persistence is disabled. ' +
      'Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY (or VITE_SUPABASE_ANON_KEY) to enable cloud sync.'
  );
}

export const supabase =
  SUPABASE_URL && SUPABASE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
          storageKey: 'rebound_supabase_auth',
        },
      })
    : null;

export const isSupabaseConfigured = (): boolean =>
  Boolean(SUPABASE_URL && SUPABASE_KEY);

