import { useState, type FormEvent } from 'react';

const WORKER_URL = import.meta.env.PUBLIC_WORKER_URL as string;

type Status =
  | { kind: 'idle' }
  | { kind: 'sending' }
  | { kind: 'sent' }
  | { kind: 'error'; message: string };

function normalizeToE164(input: string): string | null {
  const digits = input.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return null;
}

export default function DelistForm() {
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('');
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  const charsLeft = 1000 - reason.length;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const challengedNumber = normalizeToE164(phone);
    if (!challengedNumber) {
      setStatus({
        kind: 'error',
        message:
          'Enter a 10-digit US phone number — digits only, or parens and dashes are fine.',
      });
      return;
    }
    if (reason.trim().length < 10) {
      setStatus({
        kind: 'error',
        message: 'Please describe the issue in at least 10 characters.',
      });
      return;
    }
    setStatus({ kind: 'sending' });

    try {
      const res = await fetch(`${WORKER_URL}/api/delist-appeals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengedNumber,
          submitterEmail: email.trim(),
          reason: reason.trim(),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setStatus({
          kind: 'error',
          message:
            body?.error ??
            `Submission failed (HTTP ${res.status}). Please try again.`,
        });
        return;
      }
      setStatus({ kind: 'sent' });
      setPhone('');
      setEmail('');
      setReason('');
    } catch (err) {
      setStatus({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Network error.',
      });
    }
  };

  if (status.kind === 'sent') {
    return (
      <div className="delist-sent" role="status">
        <p className="delist-sent-head">Appeal received.</p>
        <p className="delist-sent-body">
          Every appeal is read by a human. If your challenged number is on the
          list incorrectly, we'll remove it and email you from{' '}
          <strong>delist@ringdocket.com</strong> with the case resolution.
          Expect a response within 72 hours.
        </p>
        <button
          type="button"
          className="delist-link"
          onClick={() => setStatus({ kind: 'idle' })}
        >
          Submit another appeal
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="delist-form" noValidate>
      <div className="delist-field">
        <label htmlFor="delist-phone" className="delist-label">
          Challenged phone number
        </label>
        <input
          id="delist-phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          placeholder="(402) 555-0199"
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          disabled={status.kind === 'sending'}
          className="delist-input"
        />
        <p className="delist-hint">
          The number that's on the block list but shouldn't be.
        </p>
      </div>

      <div className="delist-field">
        <label htmlFor="delist-email" className="delist-label">
          Your email
        </label>
        <input
          id="delist-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status.kind === 'sending'}
          className="delist-input"
        />
        <p className="delist-hint">
          We'll only use this to follow up on your appeal.
        </p>
      </div>

      <div className="delist-field">
        <label htmlFor="delist-reason" className="delist-label">
          Why should this number be delisted?
        </label>
        <textarea
          id="delist-reason"
          name="reason"
          rows={5}
          maxLength={1000}
          required
          placeholder="Tell us what the number is actually used for, why it was wrongly reported, and any context that would help us verify your appeal."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          disabled={status.kind === 'sending'}
          className="delist-textarea"
        />
        <p className="delist-hint">
          <span className={charsLeft < 100 ? 'low' : ''}>
            {charsLeft} {charsLeft === 1 ? 'character' : 'characters'} left.
          </span>
        </p>
      </div>

      {status.kind === 'error' && (
        <p className="delist-error" role="alert">
          {status.message}
        </p>
      )}

      <button
        type="submit"
        className="delist-submit"
        disabled={status.kind === 'sending'}
      >
        {status.kind === 'sending' ? 'Submitting…' : 'Submit appeal'}
      </button>
    </form>
  );
}
