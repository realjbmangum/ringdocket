/**
 * GET /_admin/health-snapshot — observability JSON for the admin console.
 *
 * Returns a consolidated snapshot of pipeline health: FTC ingestion
 * freshness + volume, numbers table breakdown, pending-queue depth,
 * block list manifest state, and Founding Flagger counter.
 *
 * Also supports a ?lookup=+15551234567 query param — returns whether the
 * number is on the block list AND how many FTC complaints reference it
 * (ftc_complaints is RLS-locked, so client can't self-query).
 *
 * Gated by X-Admin-Token.
 */

import type { Env } from '../types';
import { getServiceRoleSupabase } from '../lib/supabase';
import { jsonError, jsonOk } from '../lib/responses';

function requireAdminToken(req: Request, env: Env): Response | null {
  if (!env.ADMIN_TOKEN) {
    return jsonError(503, 'internal', 'Admin routes disabled', undefined, req);
  }
  const provided =
    req.headers.get('X-Admin-Token') ?? req.headers.get('x-admin-token');
  if (provided !== env.ADMIN_TOKEN) {
    return jsonError(403, 'forbidden', 'Invalid admin token', undefined, req);
  }
  return null;
}

async function countRows(
  supabase: ReturnType<typeof getServiceRoleSupabase>,
  table: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  filters: (q: any) => any,
): Promise<number> {
  // select() must come BEFORE filter chain methods (.eq, .gte, etc.) in
  // supabase-js. Applying filters to the .select() result keeps the order.
  const base = supabase.from(table).select('*', { count: 'exact', head: true });
  const { count, error } = await filters(base);
  if (error) {
    console.warn(`[health-snapshot] count on ${table} failed:`, error.message);
    return 0;
  }
  return count ?? 0;
}

export async function handleHealthSnapshot(
  req: Request,
  env: Env,
): Promise<Response> {
  const authErr = requireAdminToken(req, env);
  if (authErr) return authErr;

  const url = new URL(req.url);
  const lookup = url.searchParams.get('lookup')?.trim();

  const supabase = getServiceRoleSupabase(env);
  const now = Date.now();
  const h24 = new Date(now - 24 * 60 * 60 * 1000).toISOString();
  const d7 = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    ftcTotal,
    ftcLast24h,
    ftcLast7d,
    latestFtcIngest,
    latestFtcCreated,
    numbersTotal,
    numbersCorroborated,
    numbersRetired,
    numbersCorroboratedLast7d,
    pendingTotal,
    pendingLast24h,
    reportsTotal,
    reportsLast7d,
    campaignsActive,
    counter,
  ] = await Promise.all([
    countRows(supabase, 'ftc_complaints', (q) => q),
    countRows(supabase, 'ftc_complaints', (q) => q.gte('ingested_at', h24)),
    countRows(supabase, 'ftc_complaints', (q) => q.gte('ingested_at', d7)),
    supabase
      .from('ftc_complaints')
      .select('ingested_at')
      .order('ingested_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('ftc_complaints')
      .select('complaint_filed_at')
      .order('complaint_filed_at', { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle(),
    countRows(supabase, 'numbers', (q) => q),
    countRows(supabase, 'numbers', (q) => q.eq('current_state', 'corroborated')),
    countRows(supabase, 'numbers', (q) => q.eq('current_state', 'retired')),
    countRows(supabase, 'numbers', (q) =>
      q.eq('current_state', 'corroborated').gte('corroborated_at', d7),
    ),
    countRows(supabase, 'pending_reports', (q) => q),
    countRows(supabase, 'pending_reports', (q) => q.gte('submitted_at', h24)),
    countRows(supabase, 'reports', (q) => q),
    countRows(supabase, 'reports', (q) => q.gte('submitted_at', d7)),
    countRows(supabase, 'campaigns', (q) => q.is('retired_at', null)),
    supabase
      .from('founding_flagger_counter')
      .select('claimed, cap, updated_at')
      .eq('id', 1)
      .maybeSingle(),
  ]);

  const snapshot: Record<string, unknown> = {
    generatedAt: new Date().toISOString(),
    ftcComplaints: {
      total: ftcTotal,
      last24h: ftcLast24h,
      last7d: ftcLast7d,
      latestIngestedAt:
        (latestFtcIngest.data as { ingested_at: string } | null)?.ingested_at ?? null,
      latestCreatedAt:
        (latestFtcCreated.data as { complaint_filed_at: string } | null)
          ?.complaint_filed_at ?? null,
    },
    numbers: {
      total: numbersTotal,
      corroborated: numbersCorroborated,
      retired: numbersRetired,
      corroboratedLast7d: numbersCorroboratedLast7d,
    },
    pendingReports: {
      total: pendingTotal,
      last24h: pendingLast24h,
    },
    reports: {
      total: reportsTotal,
      last7d: reportsLast7d,
    },
    campaigns: { active: campaignsActive },
    founding: (counter.data as { claimed: number; cap: number; updated_at: string } | null) ?? null,
  };

  if (lookup) {
    const normalized = lookup.startsWith('+')
      ? lookup
      : `+${lookup.replace(/\D/g, '')}`;
    const [numberRes, ftcRes] = await Promise.all([
      supabase
        .from('numbers')
        .select(
          'phone, current_state, reputation_score, corroborated_at, campaign:campaigns(slug, name)',
        )
        .eq('phone', normalized)
        .maybeSingle(),
      supabase
        .from('ftc_complaints')
        .select('id, reason, consumer_city, state, complaint_filed_at, filed_at', {
          count: 'exact',
        })
        .eq('number', normalized)
        .order('complaint_filed_at', { ascending: false, nullsFirst: false })
        .limit(5),
    ]);
    snapshot.lookup = {
      normalized,
      onBlockList: !!numberRes.data,
      number: numberRes.data ?? null,
      ftcComplaintCount: ftcRes.count ?? 0,
      ftcRecentSample: ftcRes.data ?? [],
    };
  }

  return jsonOk(snapshot, 200, req);
}
