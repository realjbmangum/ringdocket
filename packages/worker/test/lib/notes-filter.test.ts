import { describe, it, expect } from 'vitest';
import { hardenNotes } from '../../src/lib/notes-filter';

describe('hardenNotes', () => {
  it('returns null for undefined input', () => {
    expect(hardenNotes(undefined)).toBeNull();
  });

  it('returns null for empty string after trimming', () => {
    expect(hardenNotes('')).toBeNull();
    expect(hardenNotes('   ')).toBeNull();
  });

  it('preserves normal text unchanged', () => {
    expect(hardenNotes('Called pretending to be from my bank.')).toBe(
      'Called pretending to be from my bank.',
    );
  });

  it('strips E.164 phone patterns', () => {
    const out = hardenNotes('Caller said to call back at +14025550142 immediately');
    expect(out).not.toContain('+14025550142');
    expect(out).toContain('[phone]');
  });

  it('strips bare 10-digit numbers (US-style without +)', () => {
    const out = hardenNotes('They asked me to call 4025550142');
    expect(out).not.toContain('4025550142');
    expect(out).toContain('[phone]');
  });

  it('strips multiple phone numbers in one note', () => {
    const out = hardenNotes('Try +12025550100 or +13035550199');
    expect(out).not.toContain('+12025550100');
    expect(out).not.toContain('+13035550199');
    expect((out!.match(/\[phone\]/g) ?? []).length).toBe(2);
  });

  it('redacts profanity case-insensitively', () => {
    const out = hardenNotes('What a SCAM, total fraud');
    // sample: "scam" and "fraud" are on the wordlist
    expect(out!.toLowerCase()).not.toContain('scam');
    expect(out!.toLowerCase()).not.toContain('fraud');
    expect(out).toContain('[redacted]');
  });

  it('does not redact substrings inside larger words', () => {
    // "ass" in "class" should not be redacted (whole-word match only)
    const out = hardenNotes('They held a class for seniors');
    expect(out).toBe('They held a class for seniors');
  });

  it('handles a clean note unchanged', () => {
    const note = 'Robocall about car warranty. Hung up after 3 seconds.';
    expect(hardenNotes(note)).toBe(note);
  });
});
