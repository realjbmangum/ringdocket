import { describe, it, expect } from 'vitest';
import { truncateToSlash24 } from '../../src/lib/ip';

describe('truncateToSlash24', () => {
  it('truncates a typical IPv4 address to /24 CIDR', () => {
    expect(truncateToSlash24('203.0.113.42')).toBe('203.0.113.0/24');
  });

  it('handles addresses where the last octet is already zero', () => {
    expect(truncateToSlash24('10.0.0.0')).toBe('10.0.0.0/24');
  });

  it('handles edge octet values', () => {
    expect(truncateToSlash24('192.168.1.255')).toBe('192.168.1.0/24');
    expect(truncateToSlash24('1.2.3.4')).toBe('1.2.3.0/24');
  });

  it('throws on IPv6 addresses with a clear error', () => {
    expect(() => truncateToSlash24('2001:db8::1')).toThrow(/IPv6/i);
    expect(() => truncateToSlash24('::1')).toThrow(/IPv6/i);
  });

  it('throws on malformed input', () => {
    expect(() => truncateToSlash24('not-an-ip')).toThrow();
    expect(() => truncateToSlash24('1.2.3')).toThrow();
    expect(() => truncateToSlash24('1.2.3.4.5')).toThrow();
    expect(() => truncateToSlash24('1.2.3.999')).toThrow();
  });

  it('throws on empty input', () => {
    expect(() => truncateToSlash24('')).toThrow();
  });
});
