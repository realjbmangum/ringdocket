import { useEffect, useState, type FormEvent } from 'react';
import { getBrowserSupabase } from '../../lib/supabase';
import { getDeviceId } from '../../lib/device';

const WORKER_URL = import.meta.env.PUBLIC_WORKER_URL as string;

const CATEGORIES: Array<{ value: string; label: string }> = [
  { value: 'unknown', label: 'Not sure / unknown' },
  { value: 'auto_warranty', label: 'Auto warranty / vehicle service' },
  { value: 'medicare_card_renewal', label: 'Medicare / health insurance' },
  { value: 'irs_impersonation', label: 'IRS / tax impersonation' },
  { value: 'social_security', label: 'Social Security impersonation' },
  { value: 'utility_shutoff', label: 'Utility shutoff threat' },
  { value: 'bank_fraud', label: 'Bank / credit card fraud alert' },
  { value: 'tech_support', label: 'Tech support scam' },
  { value: 'political', label: 'Political / campaign robocall' },
  { value: 'other', label: 'Other' },
];

type Status =
  | { kind: 'idle' }
  | { kind: 'sending' }
  | { kind: 'sent'; number: string }
  | { kind: 'error'; message: string };

function normalizeToE164(input: string): string | null {
  const digits = input.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return null;
}

export default function ReportForm() {
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState('unknown');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const [quotaLeft, setQuotaLeft] = useState<number | null>(null);

  useEffect(() => {
    // Read quota-remaining hint from last response if we cached it. Harmless
    // if absent — server is the source of truth on quota enforcement.
    const raw = sessionStorage.getItem('ringdocket.quota_left');
    if (raw) setQuotaLeft(parseInt(raw, 10));
  }, []);

  const charsLeft = 280 - notes.length;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const number = normalizeToE164(phone);
    if (!number) {
      setStatus({
        kind: 'error',
        message: 'Enter a 10-digit US phone number.',
      });
      return;
    }

    setStatus({ kind: 'sending' });

    const supabase = getBrowserSupabase();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      setStatus({
        kind: 'error',
        message: 'Your session expired. Refresh and sign in again.',
      });
      return;
    }

    const deviceId = getDeviceId();
    const body: Record<string, unknown> = { number, category };
    if (notes.trim()) body.notes = notes.trim();

    try {
      const res = await fetch(`${WORKER_URL}/api/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
          'X-Device-Id': deviceId,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        const msg =
          err?.error ??
          (res.status === 429
            ? 'Monthly free-tier quota reached (5 reports). Upgrade or wait for reset.'
            : `Submission failed (HTTP ${res.status}).`);
        setStatus({ kind: 'error', message: msg });
        return;
      }

      const data = (await res.json()) as {
        ok?: boolean;
        pendingReportId?: string;
        corroborationCount?: number;
        quotaRemaining?: number;
      };

      if (typeof data.quotaRemaining === 'number') {
        sessionStorage.setItem(
          'ringdocket.quota_left',
          String(data.quotaRemaining),
        );
        setQuotaLeft(data.quotaRemaining);
      }

      setStatus({ kind: 'sent', number });
      setPhone('');
      setCategory('unknown');
      setNotes('');
    } catch (err) {
      setStatus({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Network error.',
      });
    }
  };

  if (status.kind === 'sent') {
    return (
      <div className="report-sent" role="status">
        <p className="report-sent-head">Report filed.</p>
        <p className="report-sent-body">
          <span className="report-sent-num">{status.number}</span> is now in
          the pending queue. If two more distinct accounts corroborate within
          14 days, the number promotes to the public block list — and stops
          ringing for every Ringdocket user.
        </p>
        <div className="report-sent-actions">
          <a href="/app/my-impact" className="report-sent-link">
            View it in My Impact →
          </a>
          <button
            type="button"
            className="report-sent-again"
            onClick={() => setStatus({ kind: 'idle' })}
          >
            Report another
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="report-form" noValidate>
      {quotaLeft !== null && (
        <p className="report-quota">
          <span className="report-quota-label">Quota</span>
          <span className="report-quota-value">{quotaLeft} of 5 remaining this month</span>
        </p>
      )}

      <div className="report-field">
        <label htmlFor="report-phone" className="report-label">
          Phone number
        </label>
        <input
          id="report-phone"
          name="phone"
          type="tel"
          autoComplete="off"
          placeholder="(402) 555-0199"
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          disabled={status.kind === 'sending'}
          className="report-input"
          inputMode="tel"
        />
        <p className="report-hint">The number that called you.</p>
      </div>

      <div className="report-field">
        <label htmlFor="report-category" className="report-label">
          What were they pretending to be?
        </label>
        <select
          id="report-category"
          name="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          disabled={status.kind === 'sending'}
          className="report-select"
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <p className="report-hint">
          Your best guess. We use this to cluster related campaigns.
        </p>
      </div>

      <div className="report-field">
        <label htmlFor="report-notes" className="report-label">
          Notes <span className="report-optional">(optional)</span>
        </label>
        <textarea
          id="report-notes"
          name="notes"
          rows={4}
          maxLength={280}
          placeholder="What did they say? Anything distinctive — a specific script, a claim, an urgency tactic?"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={status.kind === 'sending'}
          className="report-textarea"
        />
        <p className="report-hint">
          <span className={charsLeft < 40 ? 'low' : ''}>
            {charsLeft} characters left. Notes are never displayed publicly.
          </span>
        </p>
      </div>

      {status.kind === 'error' && (
        <p className="report-error" role="alert">
          {status.message}
        </p>
      )}

      <button
        type="submit"
        className="report-submit"
        disabled={status.kind === 'sending' || !phone.trim()}
      >
        {status.kind === 'sending' ? 'Filing report…' : 'File report'}
      </button>
    </form>
  );
}
