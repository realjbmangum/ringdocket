/**
 * Truncate an IPv4 address to a /24 CIDR subnet.
 *
 * Used at report ingestion time to derive `ip_subnet` for the corroboration
 * distinctness check (PRD §14 Finding 1: no two corroborating accounts may
 * share device fingerprint or IP /24 within the 14-day rolling window).
 *
 * IPv6 is rejected for V1 — Cloudflare will deliver an IPv4 in
 * `CF-Connecting-IP` for the vast majority of mobile traffic, and IPv6 /24
 * is a meaningless concept (the equivalent grouping is /48 or /64). When iOS
 * users on IPv6-only carriers become a measurable share, revisit with a
 * dedicated IPv6 prefix policy.
 */
export function truncateToSlash24(ip: string): string {
  if (!ip || typeof ip !== 'string') {
    throw new Error('IP address is required');
  }

  // Reject IPv6 explicitly (contains a colon; addresses like ::1 also caught).
  if (ip.includes(':')) {
    throw new Error('IPv6 addresses are not supported in V1');
  }

  const parts = ip.split('.');
  if (parts.length !== 4) {
    throw new Error(`Malformed IPv4 address: ${ip}`);
  }

  const octets = parts.map((p) => {
    if (!/^\d{1,3}$/.test(p)) {
      throw new Error(`Malformed IPv4 octet: ${p}`);
    }
    const n = Number(p);
    if (n < 0 || n > 255) {
      throw new Error(`IPv4 octet out of range: ${p}`);
    }
    return n;
  });

  return `${octets[0]}.${octets[1]}.${octets[2]}.0/24`;
}
