import { useEffect, useState } from 'react';
import { getBrowserSupabase } from '../../lib/supabase';
import { formatPhone, relativeTime } from '../../lib/format';

interface Props {
  slug: string;
}

interface CampaignRecord {
  id: string;
  slug: string;
  name: string;
  narrative_summary: string | null;
  active_since: string | null;
  retired_at: string | null;
  takedown_source: string | null;
  takedown_case_id: string | null;
  carriers_implicated: string[] | null;
}

interface NumberRow {
  phone: string;
  reputation_score: number;
  corroborated_at: string | null;
  current_state: string;
}

type State =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'notfound' }
  | {
      kind: 'ready';
      campaign: CampaignRecord;
      numbers: NumberRow[];
      totalCount: number;
    };

const LEDGER_PAGE = 25;

function formatActiveRange(active: string | null, retired: string | null) {
  if (!active) return 'New';
  const a = new Date(active).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });
  if (!retired) return `Active since ${a}`;
  const r = new Date(retired).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });
  return `${a} – ${r}`;
}

export default function CampaignDetail({ slug }: Props) {
  const [state, setState] = useState<State>({ kind: 'loading' });

  useEffect(() => {
    const supabase = getBrowserSupabase();
    let active = true;

    (async () => {
      const { data: campaign, error: cErr } = await supabase
        .from('campaigns')
        .select(
          'id, slug, name, narrative_summary, active_since, retired_at, takedown_source, takedown_case_id, carriers_implicated',
        )
        .eq('slug', slug)
        .maybeSingle();

      if (!active) return;
      if (cErr) {
        setState({ kind: 'error', message: cErr.message });
        return;
      }
      if (!campaign) {
        setState({ kind: 'notfound' });
        return;
      }

      const [numbersRes, countRes] = await Promise.all([
        supabase
          .from('numbers')
          .select('phone, reputation_score, corroborated_at, current_state')
          .eq('campaign_id', (campaign as CampaignRecord).id)
          .eq('current_state', 'corroborated')
          .order('reputation_score', { ascending: false })
          .order('corroborated_at', { ascending: false, nullsFirst: false })
          .limit(LEDGER_PAGE),
        supabase
          .from('numbers')
          .select('id', { count: 'exact', head: true })
          .eq('campaign_id', (campaign as CampaignRecord).id)
          .eq('current_state', 'corroborated'),
      ]);

      if (!active) return;
      if (numbersRes.error) {
        setState({ kind: 'error', message: numbersRes.error.message });
        return;
      }

      setState({
        kind: 'ready',
        campaign: campaign as CampaignRecord,
        numbers: (numbersRes.data ?? []) as NumberRow[],
        totalCount: countRes.count ?? 0,
      });
    })();

    return () => {
      active = false;
    };
  }, [slug]);

  if (state.kind === 'loading') {
    return (
      <div className="campaign-skel" aria-busy="true">
        <div className="campaign-skel-title" />
        <div className="campaign-skel-byline" />
        <div className="campaign-skel-summary" />
        <div className="campaign-skel-summary" />
        <div className="campaign-skel-summary short" />
      </div>
    );
  }

  if (state.kind === 'error') {
    return (
      <p className="campaign-error" role="alert">
        {state.message}
      </p>
    );
  }

  if (state.kind === 'notfound') {
    return (
      <div className="campaign-notfound">
        <h1>Campaign not found.</h1>
        <p>
          <a href="/app/campaigns">← Back to campaigns</a>
        </p>
      </div>
    );
  }

  const { campaign, numbers, totalCount } = state;

  return (
    <article className="campaign-article">
      <header className="campaign-article-head">
        <p className="campaign-case-id">
          CASE ID · RDKT-{campaign.slug.toUpperCase()}
        </p>
        <h1 className="campaign-article-h1">{campaign.name}</h1>
        <p className="campaign-byline">
          {formatActiveRange(campaign.active_since, campaign.retired_at)} ·{' '}
          {totalCount.toLocaleString()} corroborated{' '}
          {totalCount === 1 ? 'number' : 'numbers'}
          {campaign.carriers_implicated && campaign.carriers_implicated.length > 0
            ? ` · ${campaign.carriers_implicated.length} carriers implicated`
            : ''}
        </p>

        <div className="campaign-chip-row">
          <span className="campaign-chip corroborated">
            corroborated · {totalCount.toLocaleString()}
          </span>
          {campaign.retired_at && (
            <span className="campaign-chip retired">
              retired{campaign.takedown_case_id ? ` · ${campaign.takedown_case_id}` : ''}
            </span>
          )}
          {!campaign.retired_at && totalCount > 0 && (
            <span className="campaign-chip pending">under traceback</span>
          )}
        </div>

        {campaign.narrative_summary && (
          <p className="campaign-narrative">{campaign.narrative_summary}</p>
        )}

        <div className="campaign-source-chip">
          Data: FTC DNC feed + user reports · Last updated{' '}
          {new Date().toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })}{' '}
          · Corroboration threshold: 3 distinct accounts / 14d (user reports), 1 /
          90d (FTC)
        </div>
      </header>

      <section className="campaign-ledger-section">
        <header className="campaign-ledger-head">
          <h2 className="campaign-ledger-title">Evidence ledger</h2>
          <span className="campaign-ledger-count">
            {totalCount.toLocaleString()}{' '}
            {totalCount === 1 ? 'row' : 'rows'}
            {totalCount > LEDGER_PAGE ? ` · top ${LEDGER_PAGE} shown` : ''}
          </span>
        </header>

        {numbers.length === 0 ? (
          <p className="campaign-ledger-empty">
            No corroborated numbers linked to this campaign yet.
          </p>
        ) : (
          <ol className="campaign-ledger">
            {numbers.map((n) => (
              <li key={n.phone} className="campaign-ledger-row">
                <span className="campaign-ledger-phone">
                  {formatPhone(n.phone)}
                </span>
                <span className="campaign-ledger-meta">
                  {relativeTime(n.corroborated_at)}
                </span>
                <span className="campaign-ledger-score">
                  {Math.round(n.reputation_score)}{' '}
                  <span className="score-label">
                    {n.reputation_score === 1 ? 'report' : 'reports'}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <footer className="campaign-article-foot">
        <a href="/app/campaigns" className="campaign-back">
          ← All campaigns
        </a>
        <a href="/report-an-error" className="campaign-delist">
          Challenge a listing
        </a>
      </footer>
    </article>
  );
}
