/**
 * Block list generation cron — runs nightly at ~08:00 UTC.
 *
 * What it does (PRD §7.3 Backend, §6 Architecture):
 *   1. Snapshot every `numbers` row in state `corroborated` into a sorted
 *      array (iOS Call Directory Extension requires ascending order).
 *   2. Write the snapshot to `r2://blocklist/v{YYYYMMDD}.json`.
 *   3. Write a manifest at `r2://blocklist/current.json` pointing at it,
 *      with a SHA-256 checksum of the snapshot bytes so iOS can verify
 *      integrity after download.
 *
 * Non-goals for V1 (handled elsewhere):
 *   - FTC ingestion — separate cron.
 *   - Activity-decay retirement — Postgres function `detect_retired_campaigns`
 *     called by a different cron.
 *   - Delta generation — V2 optimization. V1 ships full snapshots.
 *
 * Idempotent by design: a re-run on the same UTC day overwrites the same
 * `v{YYYYMMDD}.json` key and updates the manifest.
 */
import type {
  BlockListManifest,
  BlockListPayload,
} from '@ringdocket/shared';
import { sha256Hex } from '../lib/checksum';
import {
  manifestKey,
  snapshotKey,
  writeManifest,
  writeSnapshot,
} from '../lib/r2-blocklist';
import { getServiceRoleSupabase } from '../lib/supabase';
import type { Env } from '../types';

/**
 * Narrow structural type covering the one query the cron runs. Lets tests
 * inject a stub without standing up the real Supabase SDK.
 */
export interface BlockListSupabaseClient {
  from(table: string): {
    select(columns: string): {
      eq(
        column: string,
        value: string,
      ): {
        order(
          column: string,
          opts: { ascending: boolean },
        ): {
          range(
            from: number,
            to: number,
          ): Promise<{
            data: Array<{ phone: string }> | null;
            error: { message: string } | null;
          }>;
        };
      };
    };
  };
}

interface GenerateOptions {
  /** Override the Supabase client. Used in tests. Defaults to service-role. */
  supabase?: BlockListSupabaseClient;
  /**
   * Override the version string. Used in tests when deterministic dates
   * matter. Defaults to today's UTC date as YYYYMMDD.
   */
  version?: string;
  /**
   * Override the generation timestamp. Used in tests. Defaults to now.
   */
  generatedAt?: Date;
}

interface GenerateResult {
  version: string;
  numberCount: number;
  byteSize: number;
  checksum: string;
  durationMs: number;
}

/**
 * Format a Date as `YYYYMMDD` in UTC. The version string in the manifest
 * matches this exactly (`/^\d{8}$/`).
 */
export function formatVersion(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10).replace(/-/g, '');
}

/**
 * Generate today's block list and persist it to R2.
 *
 * Throws on Supabase failure WITHOUT writing partial state to R2 — the
 * snapshot + manifest are written together at the end so a thrown query
 * leaves the bucket untouched.
 */
export async function generateBlockList(
  env: Env,
  opts: GenerateOptions = {},
): Promise<GenerateResult> {
  const startedAt = Date.now();
  // The real Supabase client is structurally compatible with our narrow
  // interface but TS can't prove it cheaply (PostgrestFilterBuilder is a
  // thenable, not a Promise, and the generics are deep). Cast through
  // `unknown` to keep the contract on our narrow type.
  const supabase: BlockListSupabaseClient =
    opts.supabase ??
    (getServiceRoleSupabase(env) as unknown as BlockListSupabaseClient);

  // Fetch corroborated phone numbers, sorted ascending. Select only the
  // `phone` column — the block list ships nothing else. PostgREST caps
  // each response at 1000 rows by default; paginate via .range() until a
  // short page signals we've read everything.
  const PAGE_SIZE = 1000;
  const MAX_PAGES = 100; // 100k number hard cap — well above V1 expectations
  const numbers: string[] = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from('numbers')
      .select('phone')
      .eq('current_state', 'corroborated')
      .order('phone', { ascending: true })
      .range(from, to);
    if (error) {
      throw new Error(`Supabase query failed: ${error.message}`);
    }
    const rows = data ?? [];
    for (const row of rows) numbers.push(row.phone);
    if (rows.length < PAGE_SIZE) break;
  }
  const version = opts.version ?? formatVersion(opts.generatedAt);
  const generatedAt = (opts.generatedAt ?? new Date()).toISOString();

  // Build payload first so we can hash it before writing — the bytes we
  // hash MUST be the bytes the client downloads.
  const payload: BlockListPayload = { version, generatedAt, numbers };
  const payloadJson = JSON.stringify(payload);
  const checksum = await sha256Hex(payloadJson);

  // Public URL for the snapshot. Hardcoded for V1; flagged as a wrangler
  // env var TODO so Brian can swap to the production custom domain. See
  // the "manual step" note in the cron's deployment doc.
  const publicBase = env.BLOCKLIST_PUBLIC_URL ?? 'https://blocklist.ringdocket.com';
  const fileUrl = `${publicBase.replace(/\/$/, '')}/${snapshotKey(version)}`;

  const manifest: BlockListManifest = {
    version,
    generatedAt,
    numberCount: numbers.length,
    fileUrl,
    fileChecksum: checksum,
  };

  // Write the snapshot first, then the manifest. If the snapshot write
  // fails, no manifest is published — clients keep using the previous
  // version. If the manifest write fails after the snapshot, the snapshot
  // is orphaned for a day and gets overwritten on the next run.
  await writeSnapshot(env.BLOCKLIST, payload);
  await writeManifest(env.BLOCKLIST, manifest);

  const durationMs = Date.now() - startedAt;
  const result: GenerateResult = {
    version,
    numberCount: numbers.length,
    byteSize: payloadJson.length,
    checksum,
    durationMs,
  };

  console.log(
    `[block-list-generator] version=${version} count=${result.numberCount} ` +
      `bytes=${result.byteSize} checksum=${checksum.slice(0, 12)}... ` +
      `duration=${durationMs}ms manifest=${manifestKey()}`,
  );

  return result;
}
