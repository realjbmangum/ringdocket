import { useState } from 'react';
import { getBrowserSupabase } from '../../lib/supabase';

const WORKER_URL = ((import.meta.env.PUBLIC_WORKER_URL as string) ?? '')
  .trim()
  .replace(/\/+$/, '');

interface Props {
  priceId: string;
  label: string;
  variant?: 'primary' | 'secondary';
}

type Status =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'error'; message: string };

export default function PricingCTA({ priceId, label, variant = 'primary' }: Props) {
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  const handleClick = async () => {
    if (!priceId) {
      setStatus({ kind: 'error', message: 'Plan is not configured yet.' });
      return;
    }
    setStatus({ kind: 'loading' });

    const supabase = getBrowserSupabase();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      // Not signed in — send to login, come back to pricing after auth.
      const next = encodeURIComponent('/pricing');
      window.location.href = `https://app.ringdocket.com/login?next=${next}`;
      return;
    }

    try {
      const res = await fetch(`${WORKER_URL}/api/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ priceId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        setStatus({
          kind: 'error',
          message: err?.error ?? `Checkout failed (HTTP ${res.status}).`,
        });
        return;
      }
      const data = (await res.json()) as { url: string };
      window.location.href = data.url;
    } catch (err) {
      setStatus({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Network error',
      });
    }
  };

  return (
    <div className="pricing-cta-wrap">
      <button
        type="button"
        className={`pricing-cta pricing-cta-${variant}`}
        onClick={handleClick}
        disabled={status.kind === 'loading'}
      >
        {status.kind === 'loading' ? 'Redirecting…' : label}
      </button>
      {status.kind === 'error' && (
        <p className="pricing-cta-error" role="alert">
          {status.message}
        </p>
      )}
    </div>
  );
}
