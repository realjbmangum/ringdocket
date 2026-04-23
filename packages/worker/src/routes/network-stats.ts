/**
 * GET /api/network-stats
 *
 * Public, unauthenticated endpoint. Returns aggregate counts for the
 * `/app/home` analytics strip. Data is all derived from public tables
 * (campaigns, numbers) — nothing user-identifying.
 *
 * Strategy:
 *   - totals are cheap `count='exact', head=true` queries.
 *   - dailyTrend: select `corroborated_at` for the last 30 days (capped at
 *     20k rows) and bucket in JS. Cheaper than an RPC for the expected row
 *     counts and keeps this file self-contained.
 *   - topCampaigns: two queries (all non-retired campaigns + campaign_id
 *     for every corroborated number), then aggregate in JS. A single
 *     LEFT JOIN + GROUP BY isn't expressible via supabase-js without an
 *     RPC, and a fresh RPC is more migration churn than it's worth.
 *
 * Target: < 500ms end-to-end.
 */

import type { Env } from '../types';
import { getServiceRoleSupabase } from '../lib/supabase';
import { jsonError, jsonOk } from '../lib/responses';

const TREND_DAYS = 30;
const WEEK_DAYS = 7;
const TOP_CAMPAIGNS_LIMIT = 5;
const PAGE_SIZE = 1000; // PostgREST default cap per response
const MAX_PAGES = 100; // safety — 100k rows ceiling per query

export interface NetworkStatsResponse {
  totalCorroborated: number;
  totalActiveCampaigns: number;
  newThisWeek: number;
  dailyTrend: Array<{ date: string; count: number }>;
  topCampaigns: Array<{ slug: string; name: string; count: number }>;
}

function isoDayUtc(d: Date): string {
  // YYYY-MM-DD in UTC
  return d.toISOString().slice(0, 10);
}

function buildZeroFilledDays(days: number, now: Date): string[] {
  const out: string[] = [];
  // Start at UTC midnight today, walk back.
  const cursor = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(cursor);
    d.setUTCDate(cursor.getUTCDate() - i);
    out.push(isoDayUtc(d));
  }
  return out;
}

export async function handleNetworkStats(
  req: Request,
  env: Env,
): Promise<Response> {
  const supabase = getServiceRoleSupabase(env);

  const now = new Date();
  const weekStart = new Date(
    now.getTime() - WEEK_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();
  const trendStartDate = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  trendStartDate.setUTCDate(trendStartDate.getUTCDate() - (TREND_DAYS - 1));
  const trendStartIso = trendStartDate.toISOString();

  // PostgREST caps each response at 1000 rows. The two row-level queries
  // (trend, campaign_id) paginate via .range() until they read a short
  // page. The four count/metadata queries parallelize cleanly above them.
  async function paginate<T>(
    build: () => ReturnType<typeof supabase.from>,
    columns: string,
    applyFilters: (
      q: ReturnType<ReturnType<typeof supabase.from>['select']>,
    ) => ReturnType<ReturnType<typeof supabase.from>['select']>,
  ): Promise<{ data: T[]; error: { message: string } | null }> {
    const all: T[] = [];
    for (let page = 0; page < MAX_PAGES; page++) {
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const q = applyFilters(build().select(columns) as any).range(from, to);
      const { data, error } = (await q) as {
        data: T[] | null;
        error: { message: string } | null;
      };
      if (error) return { data: [], error };
      const rows = data ?? [];
      all.push(...rows);
      if (rows.length < PAGE_SIZE) break;
    }
    return { data: all, error: null };
  }

  const [
    totalRes,
    activeCampaignsRes,
    weekRes,
    trendRowsRes,
    campaignsRes,
    corroboratedCampaignIdsRes,
  ] = await Promise.all([
    supabase
      .from('numbers')
      .select('id', { count: 'exact', head: true })
      .eq('current_state', 'corroborated'),
    supabase
      .from('campaigns')
      .select('id', { count: 'exact', head: true })
      .is('retired_at', null),
    supabase
      .from('numbers')
      .select('id', { count: 'exact', head: true })
      .eq('current_state', 'corroborated')
      .gte('corroborated_at', weekStart),
    paginate<{ corroborated_at: string | null }>(
      () => supabase.from('numbers'),
      'corroborated_at',
      (q) =>
        q
          .eq('current_state', 'corroborated')
          .gte('corroborated_at', trendStartIso),
    ),
    supabase
      .from('campaigns')
      .select('id, slug, name')
      .is('retired_at', null),
    paginate<{ campaign_id: string | null }>(
      () => supabase.from('numbers'),
      'campaign_id',
      (q) =>
        q
          .eq('current_state', 'corroborated')
          .not('campaign_id', 'is', null),
    ),
  ]);

  const firstErr =
    totalRes.error ??
    activeCampaignsRes.error ??
    weekRes.error ??
    trendRowsRes.error ??
    campaignsRes.error ??
    corroboratedCampaignIdsRes.error;
  if (firstErr) {
    return jsonError(500, 'internal', firstErr.message, undefined, req);
  }

  // dailyTrend — zero-fill all 30 days, bucket rows by UTC day.
  const bucket = new Map<string, number>();
  for (const day of buildZeroFilledDays(TREND_DAYS, now)) bucket.set(day, 0);
  const trendRows =
    (trendRowsRes.data as Array<{ corroborated_at: string | null }>) ?? [];
  for (const row of trendRows) {
    if (!row.corroborated_at) continue;
    const day = row.corroborated_at.slice(0, 10);
    if (bucket.has(day)) bucket.set(day, (bucket.get(day) ?? 0) + 1);
  }
  const dailyTrend = Array.from(bucket.entries()).map(([date, count]) => ({
    date,
    count,
  }));

  // topCampaigns — tally corroborated-number counts per campaign_id, then
  // join against the campaigns list, sort desc, take top 5.
  const campaigns =
    (campaignsRes.data as Array<{ id: string; slug: string; name: string }>) ??
    [];
  const campaignById = new Map(campaigns.map((c) => [c.id, c]));
  const countByCampaign = new Map<string, number>();
  const numberCampaignRows =
    (corroboratedCampaignIdsRes.data as Array<{
      campaign_id: string | null;
    }>) ?? [];
  for (const row of numberCampaignRows) {
    if (!row.campaign_id) continue;
    if (!campaignById.has(row.campaign_id)) continue; // skip retired
    countByCampaign.set(
      row.campaign_id,
      (countByCampaign.get(row.campaign_id) ?? 0) + 1,
    );
  }
  const topCampaigns = Array.from(countByCampaign.entries())
    .map(([id, count]) => {
      const c = campaignById.get(id)!;
      return { slug: c.slug, name: c.name, count };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, TOP_CAMPAIGNS_LIMIT);

  const body: NetworkStatsResponse = {
    totalCorroborated: totalRes.count ?? 0,
    totalActiveCampaigns: activeCampaignsRes.count ?? 0,
    newThisWeek: weekRes.count ?? 0,
    dailyTrend,
    topCampaigns,
  };

  return jsonOk(body, 200, req);
}
