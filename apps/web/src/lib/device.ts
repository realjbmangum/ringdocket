/**
 * Browser device fingerprint — a persistent UUID stored in localStorage.
 * Substitutes for the iOS Keychain install UUID the worker expects in the
 * X-Device-Id header on /api/report. Used by the 3-account corroboration
 * check to reject reports from the same browser installation.
 *
 * This is intentionally weak as a fingerprint (clears with site data). The
 * defense-in-depth layer is the IP /24 grouping done server-side.
 */

const STORAGE_KEY = 'ringdocket.device_id';

function uuidv4(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers (rare in 2026 but cheap to keep).
  const hex = '0123456789abcdef';
  let out = '';
  for (let i = 0; i < 36; i++) {
    if (i === 8 || i === 13 || i === 18 || i === 23) out += '-';
    else if (i === 14) out += '4';
    else if (i === 19) out += hex[(Math.random() * 4) | (0b1000)];
    else out += hex[(Math.random() * 16) | 0];
  }
  return out;
}

export function getDeviceId(): string {
  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = uuidv4();
    localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}
