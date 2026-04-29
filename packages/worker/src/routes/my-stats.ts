/**
 * GET /api/my-stats
 *
 * Personal stats for the home screen — narrative hero + pending banner.
 * Mirrors what apps/web NarrativeHero pulls directly from Supabase, but
 * routed through the worker so the iOS app doesn't need to embed a
 * PostgREST query builder.
 *
 * Counts include both promoted reports (`reports`) and pending reports
 * (`pending_reports`) — the user's effort, regardless of corroboration
 * outcome. The web hero counts only `reports`; on a fresh install with
 * no corroborations yet, that produces a misleading "0 reports" stat.
 * Including pending makes the empty state honest.
 */

import type { Env } from '../types';
import { getAnonSupabase, getServiceRoleSupabase } from '../lib/supabase';
import {
  extractBearerToken,
  verifyJwtAndGetUserId,
  UnauthorizedError,
} from '../lib/auth';
import { jsonError, jsonOk } from '../lib/responses';

export interface MyStatsResponse {
  email: string | null;
  reportsAllTime: number;
  reportsThisWeek: number;
  pendingCount: number;
  firstFlagCredits: number;
  topCategory: string | null;
}

function startOfWeekIso(): string {
  const now = new Date();
  const day = now.getUTCDay();
  const diff = (day + 6) % 7; // ISO week starts Monday
  now.setUTCDate(now.getUTCDate() - diff);
  now.setUTCHours(0, 0, 0, 0);
  return now.toISOString();
}

export async function handleMyStats(req: Request, env: Env): Promise<Response> {
  let userId: string;
  let email: string | null = null;
  try {
    const token = extractBearerToken(req);
    const anon = getAnonSupabase(env);
    userId = await verifyJwtAndGetUserId(anon, token);
    // Pull email from the same JWT decode the auth lib already did.
    // verifyJwtAndGetUserId returns sub only; for email we re-decode.
    const parts = token.split('.');
    if (parts.length >= 2) {
      try {
        const payload = JSON.parse(
          atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')),
        );
        email = payload.email ?? null;
      } catch {
        // ignore
      }
    }
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return jsonError(401, 'unauthorized', err.message, undefined, req);
    }
    throw err;
  }

  const supabase = getServiceRoleSupabase(env);
  const weekStart = startOfWeekIso();

  const [reportsAllTimeRes, reportsWeekRes, pendingRes, profileRes, recentCatsRes] =
    await Promise.all([
      supabase
        .from('reports')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId),
      supabase
        .from('reports')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('submitted_at', weekStart),
      supabase
        .from('pending_reports')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId),
      supabase
        .from('users')
        .select('first_flag_credit_count')
        .eq('id', userId)
        .maybeSingle(),
      supabase
        .from('reports')
        .select('category')
        .eq('user_id', userId)
        .order('submitted_at', { ascending: false })
        .limit(200),
    ]);

  const firstErr =
    reportsAllTimeRes.error ??
    reportsWeekRes.error ??
    pendingRes.error ??
    recentCatsRes.error;
  if (firstErr) {
    return jsonError(500, 'internal', firstErr.message, undefined, req);
  }

  // Top category: most-frequent non-'unknown' across last 200 reports.
  const cats = (recentCatsRes.data ?? []) as Array<{ category: string | null }>;
  const counts = new Map<string, number>();
  for (const r of cats) {
    const k = r.category ?? 'unknown';
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  let topCategory: string | null = null;
  let max = 0;
  for (const [k, v] of counts) {
    if (v > max && k !== 'unknown') {
      max = v;
      topCategory = k;
    }
  }

  const body: MyStatsResponse = {
    email,
    reportsAllTime: reportsAllTimeRes.count ?? 0,
    reportsThisWeek: reportsWeekRes.count ?? 0,
    pendingCount: pendingRes.count ?? 0,
    firstFlagCredits:
      (profileRes.data as { first_flag_credit_count?: number } | null)
        ?.first_flag_credit_count ?? 0,
    topCategory,
  };

  return jsonOk(body, 200, req);
}
