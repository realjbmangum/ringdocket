import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

/**
 * Browser-only Supabase client. Reads PUBLIC_SUPABASE_URL +
 * PUBLIC_SUPABASE_ANON_KEY at runtime, not module load — so that static
 * builds where env vars aren't present (CI, prerender) don't crash on import.
 * Consumers only call this inside React effects, which run in the browser.
 */
export function getBrowserSupabase(): SupabaseClient {
  if (client) return client;
  const url = import.meta.env.PUBLIC_SUPABASE_URL as string | undefined;
  const anonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string | undefined;
  if (!url || !anonKey) {
    throw new Error(
      'PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY must be set — locally in apps/web/.env, in production as Cloudflare Pages environment variables.',
    );
  }
  client = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'ringdocket.auth',
    },
  });
  return client;
}
