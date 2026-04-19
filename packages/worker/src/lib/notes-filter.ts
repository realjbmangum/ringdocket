/**
 * Worker-layer hardening of user-submitted report notes.
 *
 * Per PRD §14 Finding 3:
 *   - Worker-layer regex filter for E.164 phone patterns.
 *   - Lightweight profanity word list — strip before the Postgres insert.
 *   - Notes never render on public surfaces; this is internal hygiene only.
 *
 * V1 is intentionally minimal — no ML, no third-party calls, no external
 * dependencies. Upgrade in V2 if abuse patterns warrant it.
 */

/**
 * Phone-like patterns. Matches:
 *   - +14025550142, +1 4025550142, +1-402-555-0142
 *   - 4025550142 (bare 10-digit)
 *   - 14025550142 (bare 11-digit)
 *
 * The pattern is intentionally generous — false positives just become
 * `[phone]` redactions, which is the safe failure mode.
 */
const PHONE_PATTERNS: RegExp[] = [
  // +country code, optional separators, 10-14 digits
  /\+\d[\d\s\-().]{8,18}\d/g,
  // Bare 10-11 digit US numbers (no separators)
  /\b\d{10,11}\b/g,
];

/**
 * Minimal V1 profanity / abuse-vector list. Whole-word matches only.
 * Keep small — overzealous filtering produces support tickets.
 */
const BANNED_WORDS = [
  'scam',
  'scammer',
  'fraud',
  'fraudster',
  'asshole',
  'bastard',
  'bitch',
  'damn',
  'shit',
  'fuck',
  'fucker',
  'nigger',
  'faggot',
  'cunt',
];

const PROFANITY_REGEX = new RegExp(
  `\\b(?:${BANNED_WORDS.join('|')})\\b`,
  'gi',
);

/**
 * Strip phone numbers and banned words from a notes string.
 * Returns null if the input is empty/whitespace/undefined.
 *
 * Length capping (≤280 chars) is enforced upstream by `ReportInputSchema`,
 * not here — schema validation is the source of truth.
 */
export function hardenNotes(input: string | undefined | null): string | null {
  if (input === null || input === undefined) return null;
  const trimmed = input.trim();
  if (trimmed.length === 0) return null;

  let out = trimmed;
  for (const pattern of PHONE_PATTERNS) {
    out = out.replace(pattern, '[phone]');
  }
  out = out.replace(PROFANITY_REGEX, '[redacted]');

  return out;
}
