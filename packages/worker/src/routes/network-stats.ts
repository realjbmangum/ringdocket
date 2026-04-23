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
const TREND_ROW_CAP = 20_000;

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
    supabase
      .from('numbers')
      .select('corroborated_at')
      .eq('current_state', 'corroborated')
      .gte('corroborated_at', trendStartIso)
      .limit(TREND_ROW_CAP),
    supabase
      .from('campaigns')
      .select('id, slug, name')
      .is('retired_at', null),
    supabase
      .from('numbers')
      .select('campaign_id')
      .eq('current_state', 'corroborated')
      .not('campaign_id', 'is', null),
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
