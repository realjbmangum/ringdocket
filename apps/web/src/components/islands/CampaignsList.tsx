import { useEffect, useState } from 'react';
import { getBrowserSupabase } from '../../lib/supabase';

interface CampaignRow {
  slug: string;
  name: string;
  narrative_summary: string | null;
  active_since: string | null;
  number_count: number;
}

type State =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; rows: CampaignRow[] };

function formatActiveSince(iso: string | null): string {
  if (!iso) return 'New';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export default function CampaignsList() {
  const [state, setState] = useState<State>({ kind: 'loading' });

  useEffect(() => {
    const supabase = getBrowserSupabase();
    let active = true;

    (async () => {
      const { data: campaigns, error: campErr } = await supabase
        .from('campaigns')
        .select('slug, name, narrative_summary, active_since')
        .order('active_since', { ascending: false, nullsFirst: false });
      if (!active) return;
      if (campErr) {
        setState({ kind: 'error', message: campErr.message });
        return;
      }

      const withCounts: CampaignRow[] = await Promise.all(
        (campaigns ?? []).map(async (c) => {
          const { count } = await supabase
            .from('numbers')
            .select('id', { count: 'exact', head: true })
            .eq('current_state', 'corroborated')
            .eq('campaign_id', await resolveId(supabase, c.slug));
          return {
            slug: c.slug,
            name: c.name,
            narrative_summary: c.narrative_summary,
            active_since: c.active_since,
            number_count: count ?? 0,
          };
        }),
      );

      if (!active) return;
      withCounts.sort((a, b) => b.number_count - a.number_count);
      setState({ kind: 'ready', rows: withCounts });
    })();

    return () => {
      active = false;
    };
  }, []);

  if (state.kind === 'loading') {
    return (
      <div className="campaigns-skel" aria-busy="true">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="campaigns-skel-row" />
        ))}
      </div>
    );
  }
  if (state.kind === 'error') {
    return (
      <p className="campaigns-error" role="alert">
        {state.message}
      </p>
    );
  }

  const populated = state.rows.filter((r) => r.number_count > 0);
  const empty = state.rows.filter((r) => r.number_count === 0);

  return (
    <>
      <ol className="campaigns-list">
        {populated.map((row) => (
          <li key={row.slug} className="campaign-card">
            <a href={`/app/campaigns/${row.slug}`} className="campaign-link">
              <div className="campaign-head">
                <h2 className="campaign-name">{row.name}</h2>
                <span className="campaign-count">
                  <span className="campaign-count-num">
                    {row.number_count.toLocaleString()}
                  </span>
                  <span className="campaign-count-label">
                    {row.number_count === 1 ? 'number' : 'numbers'}
                  </span>
                </span>
              </div>
              <p className="campaign-summary">{row.narrative_summary}</p>
              <div className="campaign-meta">
                <span>Active since {formatActiveSince(row.active_since)}</span>
                <span className="campaign-go">View ledger →</span>
              </div>
            </a>
          </li>
        ))}
      </ol>

      {empty.length > 0 && (
        <section className="campaigns-empty-section">
          <h3 className="campaigns-empty-head">Tracked but unseeded</h3>
          <p className="campaigns-empty-sub">
            These campaigns exist in our taxonomy, but our current FTC subject
            patterns haven't linked any numbers yet. They'll populate as we
            refine the clustering heuristics.
          </p>
          <ul className="campaigns-empty-list">
            {empty.map((c) => (
              <li key={c.slug} className="campaigns-empty-item">
                <a href={`/app/campaigns/${c.slug}`}>{c.name}</a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

async function resolveId(
  supabase: ReturnType<typeof getBrowserSupabase>,
  slug: string,
): Promise<string | null> {
  const { data } = await supabase
    .from('campaigns')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();
  return (data as { id: string } | null)?.id ?? null;
}
