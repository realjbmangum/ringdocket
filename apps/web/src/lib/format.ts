/** E.164 to human display, e.g. +14025550199 → (402) 555-0199 */
export function formatPhone(e164: string): string {
  const digits = e164.replace(/^\+1/, '').replace(/\D/g, '');
  if (digits.length !== 10) return e164;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

/** ISO timestamp to "Apr 22 09:41" style. */
export function formatShortTimestamp(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const month = d.toLocaleString('en-US', { month: 'short' });
  const day = d.getDate();
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${month} ${day} ${h}:${m}`;
}

/** Relative time — "14 min ago", "2 hr ago", "in 14 days", "tomorrow". */
export function relativeTime(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const diffMs = Date.now() - d.getTime();
  const past = diffMs >= 0;
  const absMs = Math.abs(diffMs);
  const mins = Math.floor(absMs / 60000);
  if (mins < 1) return 'just now';
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (past) {
    if (mins < 60) return `${mins} min ago`;
    if (hours < 24) return `${hours} hr ago`;
    if (days === 1) return 'yesterday';
    if (days < 7) return `${days} days ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  if (mins < 60) return `in ${mins} min`;
  if (hours < 24) return `in ${hours} hr`;
  if (days === 1) return 'tomorrow';
  if (days < 30) return `in ${days} days`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** Humanize a report_category enum value: medicare_card_renewal → Medicare Card Renewal. */
export function formatCategory(cat: string | null | undefined): string {
  if (!cat) return 'Unknown';
  return cat
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
