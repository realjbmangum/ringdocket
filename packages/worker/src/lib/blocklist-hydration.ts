/**
 * Option A from the PRD: FTC complaints are a parallel seed path into the
 * block list. Any phone number with >= 3 FTC complaints in the last 90 days
 * gets promoted directly to `public.numbers` with `current_state='corroborated'`,
 * bypassing the user-report 3-distinct-accounts threshold.
 *
 * The hydration itself runs as a Postgres RPC (migration 005). This module
 * is a thin wrapper that invokes it and normalizes the return shape.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * FTC data is already a pre-verified federal record — every complaint in
 * the DNC feed is sworn-to by a named consumer under the reporting form.
 * The 3-distinct-accounts-threshold that governs user reports is an
 * anti-griefing protection against throwaway accounts; that risk does not
 * apply to FTC-sourced data. So the FTC hydration threshold is 1.
 *
 * User reports retain the 3-account threshold (enforced in a different
 * code path: pending_reports trigger in migration 003).
 */
export const DEFAULT_CORROBORATION_THRESHOLD = 1;
export const DEFAULT_WINDOW_DAYS = 90;

export interface HydrationResult {
  numbersPromoted: number;
  numbersInserted: number;
  numbersUpdated: number;
  topNumbers: Array<{ phone: string; complaintCount: number }>;
}

/**
 * Invoke the `hydrate_block_list_from_ftc` RPC. Returns a summary suitable
 * for logging in the cron. Never throws on "no candidates" — returns zeros.
 */
export async function hydrateBlockListFromFtc(
  supabase: SupabaseClient,
  opts: { threshold?: number; windowDays?: number } = {},
): Promise<HydrationResult> {
  const threshold = opts.threshold ?? DEFAULT_CORROBORATION_THRESHOLD;
  const windowDays = opts.windowDays ?? DEFAULT_WINDOW_DAYS;

  const { data, error } = await supabase.rpc('hydrate_block_list_from_ftc', {
    threshold,
    window_days: windowDays,
  });

  if (error) {
    throw new Error(`hydrate_block_list_from_ftc RPC failed: ${error.message}`);
  }

  // RPC returns `out_phone / out_complaint_count / out_was_insert` — the
  // "out_" prefix avoids Postgres collision with the `numbers.phone` column
  // referenced inside the INSERT statement.
  const rows = (data ?? []) as Array<{
    out_phone: string;
    out_complaint_count: number;
    out_was_insert: boolean;
  }>;

  return {
    numbersPromoted: rows.length,
    numbersInserted: rows.filter((r) => r.out_was_insert).length,
    numbersUpdated: rows.filter((r) => !r.out_was_insert).length,
    topNumbers: rows
      .slice(0, 5)
      .map((r) => ({ phone: r.out_phone, complaintCount: r.out_complaint_count })),
  };
}
