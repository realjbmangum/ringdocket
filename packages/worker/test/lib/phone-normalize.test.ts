import { describe, it, expect } from 'vitest';
import { normalizeUsPhoneToE164 } from '../../src/lib/phone-normalize';

describe('normalizeUsPhoneToE164', () => {
  it('converts a bare 10-digit string', () => {
    expect(normalizeUsPhoneToE164('6785050054')).toBe('+16785050054');
  });

  it('strips formatting characters', () => {
    expect(normalizeUsPhoneToE164('(678) 505-0054')).toBe('+16785050054');
    expect(normalizeUsPhoneToE164('678.505.0054')).toBe('+16785050054');
    expect(normalizeUsPhoneToE164('678 505 0054')).toBe('+16785050054');
  });

  it('accepts 11-digit with leading 1', () => {
    expect(normalizeUsPhoneToE164('16785050054')).toBe('+16785050054');
    expect(normalizeUsPhoneToE164('1-678-505-0054')).toBe('+16785050054');
    expect(normalizeUsPhoneToE164('+1 678 505 0054')).toBe('+16785050054');
  });

  it('accepts 001 prefix', () => {
    expect(normalizeUsPhoneToE164('0016785050054')).toBe('+16785050054');
  });

  it('returns null for empty / nullish inputs', () => {
    expect(normalizeUsPhoneToE164('')).toBeNull();
    expect(normalizeUsPhoneToE164(null)).toBeNull();
    expect(normalizeUsPhoneToE164(undefined)).toBeNull();
    expect(normalizeUsPhoneToE164('   ')).toBeNull();
  });

  it('rejects too-short / too-long digit strings', () => {
    expect(normalizeUsPhoneToE164('555')).toBeNull();
    expect(normalizeUsPhoneToE164('12345')).toBeNull();
    expect(normalizeUsPhoneToE164('555123456789012345')).toBeNull();
  });

  it('rejects invalid US area-code / exchange-code patterns', () => {
    // Leading 0 or 1 in area code
    expect(normalizeUsPhoneToE164('0785050054')).toBeNull();
    expect(normalizeUsPhoneToE164('1785050054')).toBeNull();
    // Leading 0 or 1 in exchange code
    expect(normalizeUsPhoneToE164('6780050054')).toBeNull();
    expect(normalizeUsPhoneToE164('6781050054')).toBeNull();
  });

  it('does NOT throw on garbage input', () => {
    expect(() => normalizeUsPhoneToE164('not-a-phone')).not.toThrow();
    expect(normalizeUsPhoneToE164('not-a-phone')).toBeNull();
  });

  it('handles real FTC-style 10-digit values', () => {
    expect(normalizeUsPhoneToE164('3306492908')).toBe('+13306492908');
    expect(normalizeUsPhoneToE164('5162681355')).toBe('+15162681355');
  });
});
