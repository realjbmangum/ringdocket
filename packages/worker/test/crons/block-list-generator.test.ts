import { env } from 'cloudflare:test';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  BlockListManifestSchema,
  BlockListPayloadSchema,
} from '@ringdocket/shared';
import { sha256Hex } from '../../src/lib/checksum';
import {
  generateBlockList,
  type BlockListSupabaseClient,
} from '../../src/crons/block-list-generator';

/**
 * Build a minimal stub of the Supabase client that returns a canned
 * response for the single query the block list generator runs:
 *
 *   from('numbers').select('phone').eq('current_state', 'corroborated')
 *     .order('phone', { ascending: true })
 *
 * This avoids a network round-trip and lets us assert exact behavior.
 */
function makeSupabaseStub(opts: {
  rows?: Array<{ phone: string; current_state: string }>;
  error?: { message: string };
}): BlockListSupabaseClient {
  return {
    from(table: string) {
      if (table !== 'numbers') {
        throw new Error(`unexpected table in test: ${table}`);
      }
      const builder: any = {
        _state: 'pending' as string,
        _column: 'phone',
        _ascending: true,
        select(_cols: string) {
          return this;
        },
        eq(col: string, val: string) {
          if (col === 'current_state') this._state = val;
          return this;
        },
        order(col: string, o: { ascending: boolean }) {
          this._column = col;
          this._ascending = o.ascending;
          return this;
        },
        range(from: number, to: number) {
          if (opts.error) return Promise.resolve({ data: null, error: opts.error });
          const all = (opts.rows ?? [])
            .filter((r) => r.current_state === this._state)
            .map((r) => ({ phone: r.phone }))
            .sort((a, b) =>
              this._ascending
                ? a.phone.localeCompare(b.phone)
                : b.phone.localeCompare(a.phone),
            );
          return Promise.resolve({ data: all.slice(from, to + 1), error: null });
        },
      };
      return builder;
    },
  };
}

async function clearBucket() {
  const list = await env.BLOCKLIST.list();
  await Promise.all(list.objects.map((o) => env.BLOCKLIST.delete(o.key)));
}

async function readJson<T>(key: string): Promise<T | null> {
  const obj = await env.BLOCKLIST.get(key);
  if (!obj) return null;
  return (await obj.json()) as T;
}

describe('generateBlockList cron', () => {
  beforeEach(async () => {
    await clearBucket();
  });

  it('writes a versioned payload + manifest containing only corroborated numbers, sorted ascending', async () => {
    // Mixed state — 3 corroborated, 2 pending, 1 retired.
    // Insertion order is deliberately scrambled to prove sorting.
    const supabase = makeSupabaseStub({
      rows: [
        { phone: '+14025550199', current_state: 'pending' },
        { phone: '+14045550101', current_state: 'corroborated' },
        { phone: '+12125550100', current_state: 'corroborated' },
        { phone: '+14155550103', current_state: 'retired' },
        { phone: '+13035550102', current_state: 'corroborated' },
        { phone: '+19175550199', current_state: 'pending' },
      ],
    });

    const result = await generateBlockList(env, { supabase });

    // Manifest exists and validates
    const manifestRaw = await readJson<unknown>('current.json');
    const manifest = BlockListManifestSchema.parse(manifestRaw);

    // Payload exists at v{YYYYMMDD}.json and validates
    const payloadRaw = await readJson<unknown>(`v${manifest.version}.json`);
    const payload = BlockListPayloadSchema.parse(payloadRaw);

    expect(payload.numbers).toEqual([
      '+12125550100',
      '+13035550102',
      '+14045550101',
    ]);
    expect(manifest.numberCount).toBe(3);
    expect(manifest.numberCount).toBe(payload.numbers.length);
    expect(manifest.version).toMatch(/^\d{8}$/);
    expect(manifest.version).toBe(payload.version);
    expect(result.numberCount).toBe(3);
    expect(result.version).toBe(manifest.version);
  });

  it('skips pending and retired numbers entirely', async () => {
    const supabase = makeSupabaseStub({
      rows: [
        { phone: '+14025550199', current_state: 'pending' },
        { phone: '+14155550103', current_state: 'retired' },
      ],
    });

    await generateBlockList(env, { supabase });
    const manifest = BlockListManifestSchema.parse(
      await readJson<unknown>('current.json'),
    );
    const payload = BlockListPayloadSchema.parse(
      await readJson<unknown>(`v${manifest.version}.json`),
    );
    expect(payload.numbers).toEqual([]);
    expect(manifest.numberCount).toBe(0);
  });

  it("manifest checksum matches the payload's SHA-256", async () => {
    const supabase = makeSupabaseStub({
      rows: [
        { phone: '+12125550100', current_state: 'corroborated' },
        { phone: '+13035550102', current_state: 'corroborated' },
      ],
    });
    await generateBlockList(env, { supabase });

    const manifest = BlockListManifestSchema.parse(
      await readJson<unknown>('current.json'),
    );

    const payloadObj = await env.BLOCKLIST.get(`v${manifest.version}.json`);
    expect(payloadObj).not.toBeNull();
    const payloadText = await payloadObj!.text();
    const expectedChecksum = await sha256Hex(payloadText);

    expect(manifest.fileChecksum).toBe(expectedChecksum);
  });

  it('writes a valid empty payload + manifest when there are no corroborated numbers', async () => {
    const supabase = makeSupabaseStub({ rows: [] });
    await generateBlockList(env, { supabase });

    const manifest = BlockListManifestSchema.parse(
      await readJson<unknown>('current.json'),
    );
    const payload = BlockListPayloadSchema.parse(
      await readJson<unknown>(`v${manifest.version}.json`),
    );
    expect(payload.numbers).toEqual([]);
    expect(manifest.numberCount).toBe(0);
    expect(manifest.fileChecksum).toMatch(/^[a-f0-9]{64}$/);
  });

  it('throws when the Supabase query fails and writes nothing to R2', async () => {
    const supabase = makeSupabaseStub({
      error: { message: 'connection refused' },
    });

    await expect(generateBlockList(env, { supabase })).rejects.toThrow(
      /Supabase query failed/i,
    );

    const list = await env.BLOCKLIST.list();
    expect(list.objects.length).toBe(0);
  });

  it('is idempotent — a second run on the same day overwrites both files', async () => {
    const firstSupabase = makeSupabaseStub({
      rows: [{ phone: '+12125550100', current_state: 'corroborated' }],
    });
    const first = await generateBlockList(env, { supabase: firstSupabase });
    expect(first.numberCount).toBe(1);

    const secondSupabase = makeSupabaseStub({
      rows: [
        { phone: '+12125550100', current_state: 'corroborated' },
        { phone: '+13035550102', current_state: 'corroborated' },
        { phone: '+14045550101', current_state: 'corroborated' },
      ],
    });
    const second = await generateBlockList(env, { supabase: secondSupabase });
    expect(second.numberCount).toBe(3);
    expect(second.version).toBe(first.version);

    const manifest = BlockListManifestSchema.parse(
      await readJson<unknown>('current.json'),
    );
    const payload = BlockListPayloadSchema.parse(
      await readJson<unknown>(`v${manifest.version}.json`),
    );
    expect(manifest.numberCount).toBe(3);
    expect(payload.numbers.length).toBe(3);

    // Only the two expected keys exist — no orphaned previous-run files.
    const list = await env.BLOCKLIST.list();
    const keys = list.objects.map((o) => o.key).sort();
    expect(keys).toEqual(['current.json', `v${manifest.version}.json`].sort());
  });
});
