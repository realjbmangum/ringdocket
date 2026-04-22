import { useState, type FormEvent } from 'react';
import { getBrowserSupabase } from '../../lib/supabase';

type Status =
  | { kind: 'idle' }
  | { kind: 'sending' }
  | { kind: 'sent'; email: string }
  | { kind: 'error'; message: string };

export default function AuthForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    setStatus({ kind: 'sending' });

    const supabase = getBrowserSupabase();
    const redirectTo = `${window.location.origin}/app/home`;
    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: { emailRedirectTo: redirectTo },
    });

    if (error) {
      setStatus({ kind: 'error', message: error.message });
      return;
    }
    setStatus({ kind: 'sent', email: trimmed });
  };

  if (status.kind === 'sent') {
    return (
      <div className="auth-sent" role="status">
        <p className="auth-sent-head">Check your inbox.</p>
        <p className="auth-sent-body">
          We sent a magic link to <strong>{status.email}</strong>. Open it on
          this device to sign in.
        </p>
        <button
          type="button"
          className="auth-link"
          onClick={() => setStatus({ kind: 'idle' })}
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="auth-form" noValidate>
      <label htmlFor="auth-email" className="auth-label">
        Email
      </label>
      <input
        id="auth-email"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        required
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={status.kind === 'sending'}
        className="auth-input"
      />
      <button
        type="submit"
        disabled={status.kind === 'sending' || !email.trim()}
        className="auth-submit"
      >
        {status.kind === 'sending' ? 'Sending…' : 'Email me a sign-in link'}
      </button>
      {status.kind === 'error' && (
        <p className="auth-error" role="alert">
          {status.message}
        </p>
      )}
      <p className="auth-help">
        No password required. We'll email you a one-time link.
      </p>
    </form>
  );
}
