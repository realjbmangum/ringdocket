import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Env } from '../types';

/**
 * Service-role Supabase client. Bypasses RLS — only use for trusted server
 * paths (Worker -> Postgres for report inserts, ingestion jobs, webhooks).
 *
 * Construct *inside* the request handler. Per CLAUDE.md, secret-class env
 * vars are not available at module top level on Cloudflare Workers.
 */
export function getServiceRoleSupabase(env: Env): SupabaseClient {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Anon-key Supabase client. RLS-bound. Used to verify user JWTs without
 * exposing the service-role key to the auth path.
 */
export function getAnonSupabase(env: Env): SupabaseClient {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
