import { useEffect, useState } from 'react';
import { getBrowserSupabase } from '../../lib/supabase';

interface Stats {
  email: string;
  reportsAllTime: number;
  reportsThisWeek: number;
  firstFlagCredits: number;
  topCategory: string | null;
}

type State =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; stats: Stats };

function startOfWeekIso(): string {
  const now = new Date();
  const day = now.getUTCDay();
  const diff = (day + 6) % 7;
  now.setUTCDate(now.getUTCDate() - diff);
  now.setUTCHours(0, 0, 0, 0);
  return now.toISOString();
}

function formatCategory(cat: string | null): string | null {
  if (!cat) return null;
  return cat
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export default function NarrativeHero() {
  const [state, setState] = useState<State>({ kind: 'loading' });

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

      const [profileRes, weekRes, allRes] = await Promise.all([
        supabase
          .from('users')
          .select('first_flag_credit_count')
          .eq('id', user.id)
          .maybeSingle(),
        supabase
          .from('reports')
          .select('id', { count: 'exact', head: true })
          .gte('submitted_at', startOfWeekIso()),
        supabase
          .from('reports')
          .select('category', { count: 'exact' })
          .order('submitted_at', { ascending: false })
          .limit(200),
      ]);

      if (!active) return;
      if (profileRes.error) {
        setState({ kind: 'error', message: profileRes.error.message });
        return;
      }

      const topCategory = (() => {
        const rows = (allRes.data as Array<{ category: string | null }>) ?? [];
        const counts = new Map<string, number>();
        for (const r of rows) {
          const key = r.category ?? 'unknown';
          counts.set(key, (counts.get(key) ?? 0) + 1);
        }
        let top: string | null = null;
        let max = 0;
        for (const [k, v] of counts) {
          if (v > max && k !== 'unknown') {
            max = v;
            top = k;
          }
        }
        return top;
      })();

      setState({
        kind: 'ready',
        stats: {
          email: user.email ?? '',
          reportsAllTime: allRes.count ?? 0,
          reportsThisWeek: weekRes.count ?? 0,
          firstFlagCredits: profileRes.data?.first_flag_credit_count ?? 0,
          topCategory: formatCategory(topCategory),
        },
      });
    })();

    return () => {
      active = false;
    };
  }, []);

  if (state.kind === 'loading') {
    return (
      <div className="hero-skeleton" aria-busy="true">
        <div className="hero-skel-kicker" />
        <div className="hero-skel-title" />
        <div className="hero-skel-title short" />
        <div className="hero-skel-lead" />
        <div className="hero-skel-lead" />
      </div>
    );
  }

  if (state.kind === 'error') {
    return (
      <div className="hero-error" role="alert">
        Couldn't load your stats: {state.message}
      </div>
    );
  }

  const { stats } = state;
  const empty = stats.reportsAllTime === 0;

  return (
    <section className="narrative-hero">
      <p className="hero-kicker">This week</p>
      {empty ? (
        <>
          <h1 className="hero-h1">
            Welcome to the ledger. <em>Your work starts with a single flag.</em>
          </h1>
          <p className="hero-lead">
            The block list is already working — 15,000+ numbers syncing to
            everyone's phones nightly. When you{' '}
            <a className="hero-inline-link" href="/app/report">
              file a report
            </a>{' '}
            from your dashboard, your flag joins the pending queue. If two
            more distinct accounts corroborate within 14 days, the number
            promotes to the public block list — and stops ringing for every
            other Ringdocket user.
          </p>
        </>
      ) : (
        <>
          <h1 className="hero-h1">
            This week you flagged{' '}
            <strong className="hero-num">{stats.reportsThisWeek}</strong>{' '}
            {stats.reportsThisWeek === 1 ? 'number' : 'numbers'}.{' '}
            <em>
              {stats.topCategory
                ? `Most were ${stats.topCategory.toLowerCase()} scams.`
                : 'Your work is on the record.'}
            </em>
          </h1>
          <p className="hero-lead">
            All-time you've filed{' '}
            <strong>{stats.reportsAllTime.toLocaleString()}</strong> reports
            {stats.firstFlagCredits > 0 && (
              <>
                {' '}
                and earned{' '}
                <strong>
                  {stats.firstFlagCredits} first-flag credit
                  {stats.firstFlagCredits === 1 ? '' : 's'}
                </strong>{' '}
                on numbers that later corroborated
              </>
            )}
            . Every flag stays on the public record, cited by campaign and
            carrier path.
          </p>
        </>
      )}

      <dl className="hero-stats">
        <div className="hero-stat">
          <dt>All-time reports</dt>
          <dd>{stats.reportsAllTime.toLocaleString()}</dd>
        </div>
        <div className="hero-stat">
          <dt>This week</dt>
          <dd>{stats.reportsThisWeek}</dd>
        </div>
        <div className="hero-stat hero-stat-credit">
          <dt>
            <span className="credit-dot" aria-hidden="true" />
            First-flag credits
          </dt>
          <dd>{stats.firstFlagCredits}</dd>
        </div>
      </dl>
    </section>
  );
}
