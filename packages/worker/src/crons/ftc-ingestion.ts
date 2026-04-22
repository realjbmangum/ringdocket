/**
 * FTC DNC complaint ingestion cron.
 *
 * Runs daily at 06:00 UTC. For each complaint in yesterday's window:
 *   1. Normalize the phone number to E.164 (skip if empty or malformed)
 *   2. Upsert into public.ftc_complaints (dedup on ftc_id)
 *
 * After ingestion, invokes `hydrate_block_list_from_ftc` RPC (Option A from
 * PRD §14) to promote any numbers crossing the 3-complaint-in-90-days
 * threshold into public.numbers with current_state='corroborated'.
 *
 * Cold-start safety: if this is the first run (no rows in ftc_complaints),
 * backfill the last 30 days instead of just yesterday.
 */

import type { Env } from '../types';
import { getServiceRoleSupabase } from '../lib/supabase';
import { iterateFtcComplaints, FtcApiError } from '../lib/ftc-api';
import { normalizeUsPhoneToE164 } from '../lib/phone-normalize';
import {
  hydrateBlockListFromFtc,
  type HydrationResult,
} from '../lib/blocklist-hydration';

const INGEST_BATCH_SIZE = 500; // upsert in batches to keep payloads small

export interface IngestionResult {
  windowFrom: string;
  windowTo: string;
  recordsSeen: number;
  recordsIngested: number;
  recordsSkipped: number;
  hydration: HydrationResult;
  durationMs: number;
}

/** Format a date as "YYYY-MM-DD" in UTC. */
function toUtcDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Returns the ingestion window.
 * - If ftc_complaints has existing rows: yesterday UTC to today UTC.
 * - Else (cold start): last 30 days through today UTC.
 */
async function computeIngestionWindow(
  supabase: ReturnType<typeof getServiceRoleSupabase>,
): Promise<{ from: string; to: string }> {
  const now = new Date();
  const to = toUtcDateString(now);
  const { count, error } = await supabase
    .from('ftc_complaints')
    .select('id', { count: 'exact', head: true });
  if (error) {
    throw new Error(`ftc_complaints count failed: ${error.message}`);
  }
  const isColdStart = !count || count === 0;
  // Cold-start is bounded to 3 days so a manually-triggered first run fits
  // inside the Worker's CPU/wall-clock budget. Subsequent nightly runs
  // catch up incrementally. If you need a deeper backfill, call the admin
  // endpoint again after the first run completes — the second call will
  // see non-zero rows and fall into the normal 2-day window, so bump this
  // constant to 7-14 for a targeted deeper backfill.
  const daysBack = isColdStart ? 3 : 2;
  const from = toUtcDateString(
    new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000),
  );
  return { from, to };
}

interface FtcComplaintInsertRow {
  ftc_id: string;
  number: string;
  reason: string | null;
  state: string | null;
  consumer_city: string | null;
  consumer_area_code: string | null;
  is_robocall: boolean | null;
  filed_at: string | null;
  source_url: string | null;
}

/** Convert the FTC API envelope shape into a DB insert row. */
function toInsertRow(record: {
  id: string;
  attributes: {
    'company-phone-number': string;
    'created-date': string;
    'violation-date': string;
    'consumer-city'?: string;
    'consumer-state'?: string;
    'consumer-area-code'?: string;
    subject?: string;
    'recorded-message-or-robocall'?: string;
  };
}): FtcComplaintInsertRow | null {
  const phone = normalizeUsPhoneToE164(record.attributes['company-phone-number']);
  if (!phone) return null;

  const robocallRaw = record.attributes['recorded-message-or-robocall'];
  const is_robocall =
    robocallRaw === 'Y' ? true : robocallRaw === 'N' ? false : null;

  // Violation-date format: "YYYY-MM-DD HH:MM:SS" (local). Convert to ISO
  // UTC by appending "Z" after replacing the space. FTC doesn't expose
  // timezone — we assume UTC for indexing consistency. Close enough for
  // corroboration windowing; the precise tz is not load-bearing.
  const filedRaw = record.attributes['violation-date'] ?? record.attributes['created-date'];
  const filed_at = filedRaw
    ? new Date(filedRaw.replace(' ', 'T') + 'Z').toISOString()
    : null;

  return {
    ftc_id: record.id,
    number: phone,
    reason: record.attributes.subject ?? null,
    state: record.attributes['consumer-state'] ?? null,
    consumer_city: record.attributes['consumer-city'] ?? null,
    consumer_area_code: record.attributes['consumer-area-code'] ?? null,
    is_robocall,
    filed_at,
    source_url: `https://api.ftc.gov/v0/dnc-complaints/${record.id}`,
  };
}

async function flushBatch(
  supabase: ReturnType<typeof getServiceRoleSupabase>,
  rows: FtcComplaintInsertRow[],
): Promise<number> {
  if (rows.length === 0) return 0;
  const { error, count } = await supabase
    .from('ftc_complaints')
    .upsert(rows, { onConflict: 'ftc_id', ignoreDuplicates: false, count: 'exact' });
  if (error) {
    throw new Error(`ftc_complaints upsert failed: ${error.message}`);
  }
  return count ?? rows.length;
}

export async function ingestFtcComplaints(env: Env): Promise<IngestionResult> {
  const started = Date.now();
  const supabase = getServiceRoleSupabase(env);

  const { from, to } = await computeIngestionWindow(supabase);
  console.log(`[ftc-ingestion] window=${from}..${to}`);

  let seen = 0;
  let skipped = 0;
  let ingested = 0;
  const buffer: FtcComplaintInsertRow[] = [];

  try {
    for await (const record of iterateFtcComplaints(env, {
      createdDateFrom: from,
      createdDateTo: to,
    })) {
      seen++;
      const row = toInsertRow(record);
      if (!row) {
        skipped++;
        continue;
      }
      buffer.push(row);
      if (buffer.length >= INGEST_BATCH_SIZE) {
        ingested += await flushBatch(supabase, buffer);
        buffer.length = 0;
      }
    }
    if (buffer.length > 0) {
      ingested += await flushBatch(supabase, buffer);
    }
  } catch (err) {
    if (err instanceof FtcApiError) {
      console.error(
        `[ftc-ingestion] FTC API error (status=${err.status}, retryAfter=${err.retryAfterSeconds}s): ${err.message}`,
      );
    }
    throw err;
  }

  console.log(
    `[ftc-ingestion] seen=${seen} ingested=${ingested} skipped=${skipped}`,
  );

  const hydration = await hydrateBlockListFromFtc(supabase);
  console.log(
    `[ftc-ingestion] hydration: promoted=${hydration.numbersPromoted} (inserted=${hydration.numbersInserted} updated=${hydration.numbersUpdated})`,
  );

  return {
    windowFrom: from,
    windowTo: to,
    recordsSeen: seen,
    recordsIngested: ingested,
    recordsSkipped: skipped,
    hydration,
    durationMs: Date.now() - started,
  };
}
