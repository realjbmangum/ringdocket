import { useEffect, useState } from 'react';
import { getBrowserSupabase } from '../../lib/supabase';

const WORKER_URL = ((import.meta.env.PUBLIC_WORKER_URL as string) ?? '')
  .trim()
  .replace(/\/+$/, '');

interface UserRow {
  id: string;
  email: string | null;
  display_name: string | null;
  email_prefs: EmailPrefs;
  impact_score: number;
  first_flag_credit_count: number;
}

interface EmailPrefs {
  weekly_digest: boolean;
  monthly_impact: boolean;
  quarterly_takedown: boolean;
  transactional: boolean;
}

interface Subscription {
  tier: 'free' | 'full' | 'founding_flagger';
  status: string;
  current_period_end: string | null;
}

type State =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | {
      kind: 'ready';
      user: UserRow;
      subscription: Subscription | null;
    };

function BillingPortalLink() {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleClick = async () => {
    setLoading(true);
    setErr(null);
    const supabase = getBrowserSupabase();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      setLoading(false);
      setErr('Not signed in.');
      return;
    }
    try {
      const res = await fetch(`${WORKER_URL}/api/billing-portal`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setErr(body?.error ?? `Couldn't open portal (HTTP ${res.status}).`);
        setLoading(false);
        return;
      }
      const data = (await res.json()) as { url: string };
      window.location.href = data.url;
    } catch (e) {
      setLoading(false);
      setErr(e instanceof Error ? e.message : 'Network error');
    }
  };

  return (
    <div className="settings-billing-wrap">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="settings-billing-link"
      >
        {loading ? 'Opening…' : 'Manage billing →'}
      </button>
      {err && <span className="settings-billing-err">{err}</span>}
    </div>
  );
}

const PREF_LABELS: Array<{ key: keyof EmailPrefs; title: string; body: string }> = [
  {
    key: 'weekly_digest',
    title: 'Weekly — Public Enemy #1 digest',
    body: 'Monday morning. Trending campaigns, the numbers that most reports pushed through corroboration in the last seven days, and notable takedowns.',
  },
  {
    key: 'monthly_impact',
    title: 'Monthly — personal impact',
    body: 'First of the month. How many calls the network blocked for you, how many reports you filed, and any first-flag credits that matured.',
  },
  {
    key: 'quarterly_takedown',
    title: 'Quarterly — Takedown Report',
    body: 'Shareable PDF citing the campaigns retired in the quarter, with case IDs and enforcement links. Paid tier.',
  },
  {
    key: 'transactional',
    title: 'Transactional',
    body: 'Sign-in links, billing receipts, appeal responses. Cannot be disabled while your account is active.',
  },
];

export default function AccountSettings() {
  const [state, setState] = useState<State>({ kind: 'loading' });
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getBrowserSupabase();
    let active = true;

    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        if (active) setState({ kind: 'error', message: 'Not signed in.' });
        return;
      }

      const [userRes, subRes] = await Promise.all([
        supabase
          .from('users')
          .select('id, email, display_name, email_prefs, impact_score, first_flag_credit_count')
          .eq('id', user.id)
          .maybeSingle(),
        supabase
          .from('subscriptions')
          .select('tier, status, current_period_end')
          .eq('user_id', user.id)
          .maybeSingle(),
      ]);

      if (!active) return;
      if (userRes.error) {
        setState({ kind: 'error', message: userRes.error.message });
        return;
      }
      if (!userRes.data) {
        setState({
          kind: 'error',
          message: 'No profile row found — it should have been created on sign-in.',
        });
        return;
      }
      setState({
        kind: 'ready',
        user: userRes.data as UserRow,
        subscription: (subRes.data as Subscription | null) ?? null,
      });
    })();

    return () => {
      active = false;
    };
  }, []);

  const handleToggle = async (key: keyof EmailPrefs, next: boolean) => {
    if (state.kind !== 'ready') return;
    if (key === 'transactional') return;
    const supabase = getBrowserSupabase();
    const prevPrefs = state.user.email_prefs;
    const nextPrefs: EmailPrefs = { ...prevPrefs, [key]: next };

    setState({ ...state, user: { ...state.user, email_prefs: nextPrefs } });
    setSaving(true);
    setSaveMessage(null);

    const { error } = await supabase
      .from('users')
      .update({ email_prefs: nextPrefs })
      .eq('id', state.user.id);

    setSaving(false);
    if (error) {
      setState({ ...state, user: { ...state.user, email_prefs: prevPrefs } });
      setSaveMessage(`Couldn't save: ${error.message}`);
      return;
    }
    setSaveMessage('Saved.');
    setTimeout(() => setSaveMessage(null), 2000);
  };

  if (state.kind === 'loading') {
    return (
      <div className="settings-skel" aria-busy="true">
        <div className="settings-skel-row" />
        <div className="settings-skel-row" />
        <div className="settings-skel-row" />
      </div>
    );
  }
  if (state.kind === 'error') {
    return (
      <p className="settings-error" role="alert">
        {state.message}
      </p>
    );
  }

  const { user, subscription } = state;
  const tier = subscription?.tier ?? 'free';
  const tierLabel =
    tier === 'founding_flagger'
      ? 'Founding Flagger (annual, locked)'
      : tier === 'full'
        ? 'Ringdocket Full'
        : 'Free';

  return (
    <>
      <section className="settings-section">
        <div className="settings-section-head">
          <h2 className="settings-section-title">Account</h2>
          {tier === 'free' ? (
            <a href="/pricing" className="settings-billing-link">
              Upgrade →
            </a>
          ) : (
            <BillingPortalLink />
          )}
        </div>
        <dl className="settings-kv">
          <div>
            <dt>Email</dt>
            <dd>{user.email ?? '—'}</dd>
          </div>
          <div>
            <dt>Plan</dt>
            <dd>
              {tierLabel}
              {subscription?.current_period_end && tier !== 'founding_flagger' && (
                <span className="settings-sub-meta">
                  {' '}
                  · renews{' '}
                  {new Date(subscription.current_period_end).toLocaleDateString(
                    'en-US',
                    { month: 'short', day: 'numeric', year: 'numeric' },
                  )}
                </span>
              )}
            </dd>
          </div>
          <div>
            <dt>Impact score</dt>
            <dd>{user.impact_score.toLocaleString()}</dd>
          </div>
          <div>
            <dt>First-flag credits</dt>
            <dd>{user.first_flag_credit_count}</dd>
          </div>
        </dl>
      </section>

      <section className="settings-section">
        <div className="settings-section-head">
          <h2 className="settings-section-title">Email preferences</h2>
          {saveMessage && (
            <span className="settings-save-status">{saveMessage}</span>
          )}
        </div>
        <ul className="settings-prefs">
          {PREF_LABELS.map((pref) => {
            const disabled = pref.key === 'transactional';
            const checked = user.email_prefs[pref.key];
            return (
              <li key={pref.key} className="settings-pref">
                <label className="settings-pref-row">
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={disabled || saving}
                    onChange={(e) => handleToggle(pref.key, e.target.checked)}
                  />
                  <div className="settings-pref-copy">
                    <span className="settings-pref-title">{pref.title}</span>
                    <span className="settings-pref-body">{pref.body}</span>
                    {disabled && (
                      <span className="settings-pref-note">Required.</span>
                    )}
                  </div>
                </label>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="settings-section settings-danger">
        <h2 className="settings-section-title">Delete account</h2>
        <p className="settings-danger-body">
          Deleting your account removes your profile and anonymizes your past
          reports — your reports remain on the public record as
          corroboration signals, but they won't be tied to your identity. Not
          yet wired: a self-serve button will replace this placeholder in the
          next session.
        </p>
        <a
          href="mailto:delete@ringdocket.com?subject=Account%20deletion%20request"
          className="settings-danger-link"
        >
          Email delete@ringdocket.com →
        </a>
      </section>
    </>
  );
}
