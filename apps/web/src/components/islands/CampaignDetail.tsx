import { useEffect, useRef, useState } from 'react';
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

type SortKey = 'reports' | 'recent' | 'oldest';

type State =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'notfound' }
  | {
      kind: 'ready';
      campaign: CampaignRecord;
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

function applySort(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: any,
  sort: SortKey,
) {
  if (sort === 'reports') {
    return query
      .order('reputation_score', { ascending: false })
      .order('corroborated_at', { ascending: false, nullsFirst: false });
  }
  if (sort === 'recent') {
    return query.order('corroborated_at', {
      ascending: false,
      nullsFirst: false,
    });
  }
  return query.order('corroborated_at', { ascending: true });
}

export default function CampaignDetail({ slug }: Props) {
  const [state, setState] = useState<State>({ kind: 'loading' });
  const [numbers, setNumbers] = useState<NumberRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [filteredCount, setFilteredCount] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searching, setSearching] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('reports');

  // Debounce search input -> query
  useEffect(() => {
    const t = setTimeout(() => setQuery(searchInput.trim()), 250);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Load the campaign row once per slug
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

      // Fetch the unfiltered total once (for the header chip).
      const totalRes = await supabase
        .from('numbers')
        .select('id', { count: 'exact', head: true })
        .eq('campaign_id', (campaign as CampaignRecord).id)
        .eq('current_state', 'corroborated');

      if (!active) return;

      setTotalCount(totalRes.count ?? 0);
      setState({ kind: 'ready', campaign: campaign as CampaignRecord });
    })();

    return () => {
      active = false;
    };
  }, [slug]);

  // Reload the ledger page 0 whenever query or sort changes.
  const reqIdRef = useRef(0);
  useEffect(() => {
    if (state.kind !== 'ready') return;
    const supabase = getBrowserSupabase();
    const reqId = ++reqIdRef.current;
    setSearching(true);
    setListError(null);

    (async () => {
      let q = supabase
        .from('numbers')
        .select('phone, reputation_score, corroborated_at, current_state', {
          count: 'exact',
        })
        .eq('campaign_id', state.campaign.id)
        .eq('current_state', 'corroborated');

      if (query) {
        q = q.like('phone', `%${query}%`);
      }

      q = applySort(q, sort).range(0, LEDGER_PAGE - 1);

      const res = await q;
      if (reqId !== reqIdRef.current) return; // stale
      if (res.error) {
        setListError(res.error.message);
        setNumbers([]);
        setFilteredCount(0);
      } else {
        setNumbers((res.data ?? []) as NumberRow[]);
        setFilteredCount(res.count ?? 0);
      }
      setSearching(false);
    })();
  }, [state, query, sort]);

  async function loadMore() {
    if (state.kind !== 'ready' || loadingMore) return;
    const supabase = getBrowserSupabase();
    setLoadingMore(true);
    setListError(null);

    const offset = numbers.length;
    let q = supabase
      .from('numbers')
      .select('phone, reputation_score, corroborated_at, current_state')
      .eq('campaign_id', state.campaign.id)
      .eq('current_state', 'corroborated');

    if (query) {
      q = q.like('phone', `%${query}%`);
    }

    q = applySort(q, sort).range(offset, offset + LEDGER_PAGE - 1);

    const res = await q;
    if (res.error) {
      setListError(res.error.message);
    } else if (res.data && res.data.length > 0) {
      setNumbers((prev) => [...prev, ...(res.data as NumberRow[])]);
    }
    setLoadingMore(false);
  }

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

  const { campaign } = state;
  const shown = numbers.length;
  const hasMore = shown < filteredCount;
  const isFiltered = query.length > 0;

  let countLabel: string;
  if (searching && numbers.length === 0) {
    countLabel = 'searching…';
  } else if (filteredCount === 0) {
    countLabel = isFiltered ? 'no matches' : '0 rows';
  } else if (shown === filteredCount) {
    countLabel = `${shown.toLocaleString()} of ${filteredCount.toLocaleString()}`;
  } else {
    countLabel = `showing 1–${shown.toLocaleString()} of ${filteredCount.toLocaleString()}`;
  }
  if (isFiltered) countLabel += ` · filtered from ${totalCount.toLocaleString()}`;

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
          <span className="campaign-ledger-count">{countLabel}</span>
        </header>

        <div className="campaign-ledger-controls">
          <label className="campaign-ledger-search">
            <span className="visually-hidden">Search numbers</span>
            <input
              type="search"
              inputMode="tel"
              placeholder="Search by digits (e.g. 803 or 5551212)"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
          </label>
          <label className="campaign-ledger-sort">
            <span className="visually-hidden">Sort by</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
            >
              <option value="reports">Most reports</option>
              <option value="recent">Most recent</option>
              <option value="oldest">Oldest</option>
            </select>
          </label>
        </div>

        {listError && (
          <p className="campaign-error" role="alert">
            {listError}
          </p>
        )}

        {numbers.length === 0 && !searching ? (
          <p className="campaign-ledger-empty">
            {isFiltered
              ? 'No numbers match that search.'
              : 'No corroborated numbers linked to this campaign yet.'}
          </p>
        ) : (
          <>
            <ol
              className="campaign-ledger"
              aria-busy={searching ? 'true' : 'false'}
            >
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
            {hasMore && (
              <div className="campaign-ledger-more">
                <button
                  type="button"
                  className="campaign-ledger-more-btn"
                  onClick={loadMore}
                  disabled={loadingMore}
                >
                  {loadingMore
                    ? 'Loading…'
                    : `Load ${Math.min(
                        LEDGER_PAGE,
                        filteredCount - shown,
                      ).toLocaleString()} more`}
                </button>
              </div>
            )}
          </>
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
