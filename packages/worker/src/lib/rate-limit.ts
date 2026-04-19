/**
 * Free-tier monthly report quota tracking via Cloudflare KV.
 *
 * Per PRD §14 Finding 9:
 *   - Free-tier 5/month cap enforced in the Worker via KV before the
 *     Postgres insert.
 *   - Cloudflare's built-in 30 req/min per-IP rate limit on POST /api/reports
 *     is configured separately (in the dashboard / wrangler.toml rules) —
 *     not enforced here.
 *
 * Key format: `report_count:{user_id}:{YYYY-MM}` (UTC).
 * TTL: seconds until 00:00 UTC on the first of the next month, so the key
 * naturally falls off — no separate cleanup job.
 *
 * Race conditions: KV is eventually consistent. A determined attacker can
 * race two simultaneous requests through and exceed the cap by 1. That's an
 * acceptable V1 risk — the hard defamation safeguard is the 3-account
 * corroboration threshold, not this counter. If V2 needs strong consistency
 * here, move to a Durable Object.
 */

/** Build the canonical KV key for a user's monthly report count. */
export function monthlyCountKey(userId: string, now: Date = new Date()): string {
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  return `report_count:${userId}:${y}-${m}`;
}

/** Seconds remaining until the first of the next month at 00:00 UTC. */
export function secondsUntilEndOfMonthUtc(now: Date = new Date()): number {
  const end = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth() + 1,
    1,
    0,
    0,
    0,
  );
  return Math.ceil((end - now.getTime()) / 1000);
}

/** Read the user's report count for the current UTC month, defaulting to 0. */
export async function getMonthlyCount(
  kv: KVNamespace,
  userId: string,
  now: Date = new Date(),
): Promise<number> {
  const raw = await kv.get(monthlyCountKey(userId, now));
  if (raw === null) return 0;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.floor(n);
}

/**
 * Atomically (best-effort) bump the user's monthly count and return the new
 * value. KV provides no CAS so this is read-then-write — see file header
 * for the race-condition tradeoff.
 */
export async function incrementMonthlyCount(
  kv: KVNamespace,
  userId: string,
  now: Date = new Date(),
): Promise<number> {
  const current = await getMonthlyCount(kv, userId, now);
  const next = current + 1;
  const ttl = secondsUntilEndOfMonthUtc(now);
  await kv.put(monthlyCountKey(userId, now), String(next), {
    expirationTtl: Math.max(60, ttl), // KV requires ttl >= 60
  });
  return next;
}
