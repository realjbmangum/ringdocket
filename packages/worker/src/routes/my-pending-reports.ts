/**
 * GET /api/my-pending-reports
 *
 * Pending reports are RLS-locked to the service role (see migration 002).
 * This endpoint bridges the dashboard: authenticates the user via their
 * Supabase JWT, then uses the service role to fetch that user's own rows
 * plus a corroboration count for each number across ALL users in the
 * rolling 14-day window.
 *
 * We do not expose other users' rows — only the aggregate count. Their
 * notes and device fingerprints stay internal.
 */

import type { Env } from '../types';
import { getAnonSupabase, getServiceRoleSupabase } from '../lib/supabase';
import {
  extractBearerToken,
  verifyJwtAndGetUserId,
  UnauthorizedError,
} from '../lib/auth';
import { jsonError, jsonOk } from '../lib/responses';

const CORROBORATION_THRESHOLD = 3;
const WINDOW_DAYS = 14;

export interface MyPendingReport {
  id: string;
  number: string;
  category: string | null;
  submittedAt: string;
  expiresAt: string;
  corroborationCount: number;
  threshold: number;
}

export async function handleMyPendingReports(
  req: Request,
  env: Env,
): Promise<Response> {
  let userId: string;
  try {
    const token = extractBearerToken(req);
    const anon = getAnonSupabase(env);
    userId = await verifyJwtAndGetUserId(anon, token);
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return jsonError(401, 'unauthorized', err.message, undefined, req);
    }
    throw err;
  }

  const supabase = getServiceRoleSupabase(env);

  const { data: myRows, error: myErr } = await supabase
    .from('pending_reports')
    .select('id, number, category, submitted_at')
    .eq('user_id', userId)
    .order('submitted_at', { ascending: false })
    .limit(100);

  if (myErr) {
    return jsonError(500, 'internal', myErr.message, undefined, req);
  }

  const rows = (myRows ?? []) as Array<{
    id: string;
    number: string;
    category: string | null;
    submitted_at: string;
  }>;

  const windowStart = new Date(
    Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  // For each of my pending reports, count distinct users who have also
  // reported that number in the last 14 days. Batched in one query.
  const phones = Array.from(new Set(rows.map((r) => r.number)));
  const counts = new Map<string, number>();
  if (phones.length > 0) {
    const { data: allForNumbers, error: cntErr } = await supabase
      .from('pending_reports')
      .select('number, user_id')
      .in('number', phones)
      .gte('submitted_at', windowStart);
    if (cntErr) {
      return jsonError(500, 'internal', cntErr.message, undefined, req);
    }
    const perNumber = new Map<string, Set<string>>();
    for (const row of (allForNumbers ?? []) as Array<{ number: string; user_id: string }>) {
      if (!perNumber.has(row.number)) perNumber.set(row.number, new Set());
      perNumber.get(row.number)!.add(row.user_id);
    }
    for (const [num, users] of perNumber) counts.set(num, users.size);
  }

  const result: MyPendingReport[] = rows.map((r) => {
    const submittedMs = new Date(r.submitted_at).getTime();
    const expires = new Date(
      submittedMs + WINDOW_DAYS * 24 * 60 * 60 * 1000,
    ).toISOString();
    return {
      id: r.id,
      number: r.number,
      category: r.category,
      submittedAt: r.submitted_at,
      expiresAt: expires,
      corroborationCount: counts.get(r.number) ?? 1,
      threshold: CORROBORATION_THRESHOLD,
    };
  });

  return jsonOk({ reports: result }, 200, req);
}
