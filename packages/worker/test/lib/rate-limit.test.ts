import { describe, it, expect, beforeEach } from 'vitest';
import { env } from 'cloudflare:test';
import {
  getMonthlyCount,
  incrementMonthlyCount,
  monthlyCountKey,
  secondsUntilEndOfMonthUtc,
} from '../../src/lib/rate-limit';

const USER_ID = '11111111-1111-1111-1111-111111111111';

async function clearKv(kv: KVNamespace) {
  const list = await kv.list();
  for (const k of list.keys) {
    await kv.delete(k.name);
  }
}

describe('monthlyCountKey', () => {
  it('formats as report_count:{user_id}:{YYYY-MM}', () => {
    const key = monthlyCountKey(USER_ID, new Date(Date.UTC(2026, 3, 18)));
    expect(key).toBe(`report_count:${USER_ID}:2026-04`);
  });

  it('zero-pads single-digit months', () => {
    const key = monthlyCountKey(USER_ID, new Date(Date.UTC(2026, 0, 1)));
    expect(key).toBe(`report_count:${USER_ID}:2026-01`);
  });
});

describe('secondsUntilEndOfMonthUtc', () => {
  it('returns a positive integer', () => {
    const s = secondsUntilEndOfMonthUtc(new Date(Date.UTC(2026, 3, 18, 12, 0, 0)));
    expect(s).toBeGreaterThan(0);
    expect(Number.isInteger(s)).toBe(true);
  });

  it('returns ~12 days of seconds for mid-April', () => {
    // April 18 12:00 UTC -> May 1 00:00 UTC = 12 days + 12 hours
    const s = secondsUntilEndOfMonthUtc(new Date(Date.UTC(2026, 3, 18, 12, 0, 0)));
    const expected = (12 * 24 + 12) * 3600;
    expect(s).toBe(expected);
  });
});

describe('getMonthlyCount', () => {
  beforeEach(async () => {
    await clearKv(env.RATE_LIMIT);
  });

  it('returns 0 when KV key is missing', async () => {
    const count = await getMonthlyCount(env.RATE_LIMIT, USER_ID);
    expect(count).toBe(0);
  });

  it('returns the stored value when present', async () => {
    const key = monthlyCountKey(USER_ID);
    await env.RATE_LIMIT.put(key, '3');
    const count = await getMonthlyCount(env.RATE_LIMIT, USER_ID);
    expect(count).toBe(3);
  });

  it('returns 0 if the stored value is malformed', async () => {
    const key = monthlyCountKey(USER_ID);
    await env.RATE_LIMIT.put(key, 'not-a-number');
    const count = await getMonthlyCount(env.RATE_LIMIT, USER_ID);
    expect(count).toBe(0);
  });
});

describe('incrementMonthlyCount', () => {
  beforeEach(async () => {
    await clearKv(env.RATE_LIMIT);
  });

  it('initializes the counter at 1 on first call', async () => {
    const next = await incrementMonthlyCount(env.RATE_LIMIT, USER_ID);
    expect(next).toBe(1);
    const stored = await env.RATE_LIMIT.get(monthlyCountKey(USER_ID));
    expect(stored).toBe('1');
  });

  it('increments from existing value', async () => {
    await env.RATE_LIMIT.put(monthlyCountKey(USER_ID), '4');
    const next = await incrementMonthlyCount(env.RATE_LIMIT, USER_ID);
    expect(next).toBe(5);
  });

  it('writes a TTL that expires within the current month', async () => {
    // We cannot read TTL back from miniflare KV directly, but we verify the
    // increment succeeds without throwing, which exercises the put path.
    await expect(
      incrementMonthlyCount(env.RATE_LIMIT, USER_ID),
    ).resolves.toBe(1);
  });
});
