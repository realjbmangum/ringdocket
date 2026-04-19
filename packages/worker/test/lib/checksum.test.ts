import { describe, it, expect } from 'vitest';
import { sha256Hex } from '../../src/lib/checksum';

/**
 * SHA-256 of the empty string. Known constant; if this ever changes, the
 * universe is broken (or our hex encoding is).
 */
const EMPTY_SHA256 =
  'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

describe('sha256Hex', () => {
  it('produces 64-character lowercase hex output', async () => {
    const hash = await sha256Hex('hello world');
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(hash).toBe(hash.toLowerCase());
  });

  it('returns the canonical empty-string SHA-256 for empty input', async () => {
    expect(await sha256Hex('')).toBe(EMPTY_SHA256);
  });

  it('is deterministic — same input yields same output', async () => {
    const a = await sha256Hex('the quick brown fox');
    const b = await sha256Hex('the quick brown fox');
    expect(a).toBe(b);
  });

  it('produces different outputs for different inputs', async () => {
    const a = await sha256Hex('input one');
    const b = await sha256Hex('input two');
    expect(a).not.toBe(b);
  });

  it('accepts Uint8Array input and matches the equivalent string input', async () => {
    const str = 'binary then string';
    const fromString = await sha256Hex(str);
    const fromBytes = await sha256Hex(new TextEncoder().encode(str));
    expect(fromBytes).toBe(fromString);
  });
});
