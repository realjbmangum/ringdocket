/**
 * Normalize a US phone number to E.164 format (+1XXXXXXXXXX).
 *
 * The FTC API returns phone numbers as 10-digit strings like "6785050054".
 * Sometimes the value is empty (complaints can be submitted without the caller's
 * number), in which case we return null so the caller can skip the record.
 *
 * Defensive: strips spaces, parens, dashes, dots, and leading country code
 * variants (+1, 1-, 001) before validating. US phone numbers have NXX-NXX-XXXX
 * pattern where N is 2-9 — no validation of area-code specifics beyond length.
 *
 * Returns null for any input that doesn't resolve to a 10-digit US number.
 * Never throws.
 */
export function normalizeUsPhoneToE164(raw: string | null | undefined): string | null {
  if (!raw) return null;

  // Strip all non-digit characters.
  const digits = raw.replace(/\D+/g, '');

  // Accept:
  //   "6785050054"       (10 digits)
  //   "16785050054"      (11 digits, leading 1)
  //   "0016785050054"    (13 digits, 001 prefix)
  let core: string;
  if (digits.length === 10) {
    core = digits;
  } else if (digits.length === 11 && digits.startsWith('1')) {
    core = digits.slice(1);
  } else if (digits.length === 13 && digits.startsWith('001')) {
    core = digits.slice(3);
  } else {
    return null;
  }

  // First digit of area code + exchange code must be 2-9 for valid US numbers.
  if (!/^[2-9]\d{2}[2-9]\d{6}$/.test(core)) {
    return null;
  }

  return `+1${core}`;
}
