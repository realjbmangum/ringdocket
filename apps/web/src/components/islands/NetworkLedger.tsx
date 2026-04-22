import { useEffect, useState } from 'react';
import { getBrowserSupabase } from '../../lib/supabase';
import { formatPhone, relativeTime } from '../../lib/format';

interface LedgerRow {
  phone: string;
  reputation_score: number;
  corroborated_at: string | null;
  campaign: { slug: string; name: string } | null;
}

type State =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; rows: LedgerRow[] };

export default function NetworkLedger() {
  const [state, setState] = useState<State>({ kind: 'loading' });

  useEffect(() => {
    const supabase = getBrowserSupabase();
    let active = true;

    (async () => {
      const { data, error } = await supabase
        .from('numbers')
        .select('phone, reputation_score, corroborated_at, campaign:campaigns(slug, name)')
        .eq('current_state', 'corroborated')
        .order('corroborated_at', { ascending: false, nullsFirst: false })
        .limit(8);

      if (!active) return;
      if (error) {
        setState({ kind: 'error', message: error.message });
        return;
      }
      setState({
        kind: 'ready',
        rows: (data ?? []) as unknown as LedgerRow[],
      });
    })();

    return () => {
      active = false;
    };
  }, []);

  return (
    <aside className="network-ledger" aria-labelledby="ledger-title">
      <header className="ledger-head">
        <h2 id="ledger-title" className="ledger-title">
          Network Ledger
        </h2>
        <span className="ledger-pulse">live</span>
      </header>
      {state.kind === 'loading' && (
        <div className="ledger-skel">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="ledger-skel-row" />
          ))}
        </div>
      )}
      {state.kind === 'error' && (
        <p className="ledger-error" role="alert">
          {state.message}
        </p>
      )}
      {state.kind === 'ready' && state.rows.length === 0 && (
        <p className="ledger-empty">No corroborated numbers yet.</p>
      )}
      {state.kind === 'ready' && state.rows.length > 0 && (
        <ol className="ledger-rows">
          {state.rows.map((row) => (
            <li key={row.phone} className="ledger-row">
              <div className="ledger-row-main">
                <span className="ledger-phone">{formatPhone(row.phone)}</span>
                <span className="ledger-meta">
                  {row.campaign?.name ?? 'Uncategorized'} ·{' '}
                  {relativeTime(row.corroborated_at)}
                </span>
              </div>
              <span className="ledger-badge">
                <span className="ledger-badge-dot" aria-hidden="true" />
                {Math.round(row.reputation_score)}
              </span>
            </li>
          ))}
        </ol>
      )}
      <p className="ledger-foot">
        Corroborated from user reports + FTC Do Not Call complaints.
      </p>
    </aside>
  );
}
