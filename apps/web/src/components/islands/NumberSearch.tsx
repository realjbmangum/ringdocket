import { useMemo, useRef, useState } from 'react';
import { getBrowserSupabase } from '../../lib/supabase';
import {
  formatPhone,
  relativeTime,
  formatShortTimestamp,
} from '../../lib/format';

interface CampaignRef {
  slug: string;
  name: string;
}

interface NumberRecord {
  phone: string;
  current_state: string;
  reputation_score: number;
  corroborated_at: string | null;
  first_flag_at: string | null;
  retired_at: string | null;
  retired_reason: string | null;
  campaign_id: string | null;
  campaigns: CampaignRef | CampaignRef[] | null;
}

type SearchState =
  | { kind: 'empty' }
  | { kind: 'invalid'; message: string }
  | { kind: 'searching'; e164: string }
  | { kind: 'error'; message: string }
  | { kind: 'not_found'; e164: string }
  | { kind: 'found'; e164: string; record: NumberRecord };

/**
 * Strip non-digits, then normalize to E.164 +1NNNNNNNNNN.
 * - 10 digits → prefix +1
 * - 11 digits starting with 1 → prefix +
 * - anything else → null (invalid)
 */
function normalizeToE164(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return null;
}

function firstCampaign(
  c: CampaignRef | CampaignRef[] | null,
): CampaignRef | null {
  if (!c) return null;
  if (Array.isArray(c)) return c[0] ?? null;
  return c;
}

function stateChipClass(state: string): string {
  if (state === 'corroborated') return 'search-chip corroborated';
  if (state === 'retired') return 'search-chip retired';
  return 'search-chip pending';
}

export default function NumberSearch() {
  const [input, setInput] = useState('');
  const [state, setState] = useState<SearchState>({ kind: 'empty' });
  const latestReq = useRef(0);

  const inputHint = useMemo(() => {
    if (!input.trim()) return null;
    const e164 = normalizeToE164(input);
    if (!e164) return 'Enter a 10-digit US number.';
    return `Will search ${formatPhone(e164)}`;
  }, [input]);

  const runSearch = async (rawInput: string) => {
    const trimmed = rawInput.trim();
    if (!trimmed) {
      setState({ kind: 'empty' });
      return;
    }
    const e164 = normalizeToE164(trimmed);
    if (!e164) {
      setState({
        kind: 'invalid',
        message:
          'That doesn\u2019t look like a US phone number. Try 10 digits, with or without formatting.',
      });
      return;
    }

    const reqId = ++latestReq.current;
    setState({ kind: 'searching', e164 });

    try {
      const supabase = getBrowserSupabase();
      const { data, error } = await supabase
        .from('numbers')
        .select(
          'phone, current_state, reputation_score, corroborated_at, first_flag_at, retired_at, retired_reason, campaign_id, campaigns(slug, name)',
        )
        .eq('phone', e164)
        .maybeSingle();

      if (reqId !== latestReq.current) return; // stale response

      if (error) {
        setState({ kind: 'error', message: error.message });
        return;
      }
      if (!data) {
        setState({ kind: 'not_found', e164 });
        return;
      }
      setState({ kind: 'found', e164, record: data as NumberRecord });
    } catch (e) {
      if (reqId !== latestReq.current) return;
      const message = e instanceof Error ? e.message : 'Unexpected error.';
      setState({ kind: 'error', message });
    }
  };

  const onSubmit = (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    runSearch(input);
  };

  const onClear = () => {
    setInput('');
    setState({ kind: 'empty' });
    latestReq.current++;
  };

  return (
    <div className="search-shell">
      <form className="search-form" onSubmit={onSubmit} role="search">
        <label className="search-label" htmlFor="number-search-input">
          Phone number
        </label>
        <div className="search-input-row">
          <input
            id="number-search-input"
            className="search-input"
            type="tel"
            inputMode="tel"
            autoComplete="off"
            placeholder="(402) 555-0199"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            aria-describedby="number-search-hint"
          />
          <button
            type="submit"
            className="search-submit"
            disabled={
              !input.trim() ||
              (state.kind === 'searching' &&
                normalizeToE164(input) === state.e164)
            }
          >
            {state.kind === 'searching' ? 'Searching\u2026' : 'Look up'}
          </button>
          {input && (
            <button
              type="button"
              className="search-clear"
              onClick={onClear}
              aria-label="Clear"
            >
              Clear
            </button>
          )}
        </div>
        <p className="search-hint" id="number-search-hint">
          {inputHint ??
            'Any US format works \u2014 dashes, parentheses, spaces, or raw 10 digits.'}
        </p>
      </form>

      <div className="search-result" aria-live="polite">
        {state.kind === 'empty' && (
          <p className="search-empty">
            Look up any US number to see if it&rsquo;s on the block list.
          </p>
        )}

        {state.kind === 'invalid' && (
          <p className="search-error" role="alert">
            {state.message}
          </p>
        )}

        {state.kind === 'error' && (
          <p className="search-error" role="alert">
            Lookup failed: {state.message}
          </p>
        )}

        {state.kind === 'searching' && (
          <div className="search-skel" aria-busy="true">
            <div className="search-skel-phone" />
            <div className="search-skel-meta" />
            <div className="search-skel-body" />
          </div>
        )}

        {state.kind === 'not_found' && (
          <article className="search-card not-found">
            <header className="search-card-head">
              <p className="search-case-id">NO RECORD</p>
              <p className="search-phone">{formatPhone(state.e164)}</p>
            </header>
            <p className="search-narrative">
              This number isn&rsquo;t on the Ringdocket block list and we have
              no reports for it.
            </p>
            <footer className="search-card-foot">
              <a href="/app/report" className="search-foot-link">
                File a report &rarr;
              </a>
            </footer>
          </article>
        )}

        {state.kind === 'found' && (() => {
          const r = state.record;
          const campaign = firstCampaign(r.campaigns);
          const reports = Math.round(r.reputation_score);
          return (
            <article className="search-card found">
              <header className="search-card-head">
                <p className="search-case-id">ON THE BLOCK LIST</p>
                <p className="search-phone">{formatPhone(r.phone)}</p>
                <div className="search-chip-row">
                  <span className={stateChipClass(r.current_state)}>
                    {r.current_state}
                  </span>
                  {campaign && (
                    <a
                      href={`/app/campaigns/${campaign.slug}`}
                      className="search-chip campaign-link"
                    >
                      {campaign.name}
                    </a>
                  )}
                </div>
              </header>

              <dl className="search-facts">
                <div className="search-fact">
                  <dt>Reports</dt>
                  <dd>
                    {reports.toLocaleString()}{' '}
                    <span className="search-fact-unit">
                      {reports === 1 ? 'report' : 'reports'}
                    </span>
                  </dd>
                </div>
                {r.corroborated_at && (
                  <div className="search-fact">
                    <dt>Corroborated</dt>
                    <dd>
                      {relativeTime(r.corroborated_at)}{' '}
                      <span className="search-fact-unit">
                        &middot; {formatShortTimestamp(r.corroborated_at)}
                      </span>
                    </dd>
                  </div>
                )}
                {r.first_flag_at && (
                  <div className="search-fact">
                    <dt>First flag</dt>
                    <dd>
                      {relativeTime(r.first_flag_at)}{' '}
                      <span className="search-fact-unit">
                        &middot; {formatShortTimestamp(r.first_flag_at)}
                      </span>
                    </dd>
                  </div>
                )}
                {r.retired_at && (
                  <div className="search-fact">
                    <dt>Retired</dt>
                    <dd>
                      {relativeTime(r.retired_at)}
                      {r.retired_reason ? (
                        <span className="search-fact-unit">
                          {' '}
                          &middot; {r.retired_reason.replace(/_/g, ' ')}
                        </span>
                      ) : null}
                    </dd>
                  </div>
                )}
              </dl>

              <footer className="search-card-foot">
                {campaign ? (
                  <a
                    href={`/app/campaigns/${campaign.slug}`}
                    className="search-foot-link"
                  >
                    View campaign &rarr;
                  </a>
                ) : (
                  <span className="search-foot-muted">
                    Not linked to a campaign.
                  </span>
                )}
              </footer>
            </article>
          );
        })()}
      </div>
    </div>
  );
}
