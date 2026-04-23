import { useEffect, useMemo, useState } from 'react';
import { getBrowserSupabase } from '../../lib/supabase';
import { formatCategory } from '../../lib/format';

const WORKER_URL = ((import.meta.env.PUBLIC_WORKER_URL as string) ?? '')
  .trim()
  .replace(/\/+$/, '');

interface PromotedReport {
  id: string;
  category: string | null;
  submitted_at: string | null;
}

interface PendingReport {
  id: string;
  category: string | null;
  submittedAt: string;
}

interface Combined {
  category: string | null;
  submittedAt: string | null;
}

type State =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; reports: Combined[] };

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const WEEK_COUNT = 12;

function startOfWeek(d: Date): Date {
  // Week boundary: Monday 00:00 local.
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  const day = copy.getDay(); // 0 Sun .. 6 Sat
  const offset = (day + 6) % 7; // days since Monday
  copy.setDate(copy.getDate() - offset);
  return copy;
}

function formatWeekLabel(d: Date): string {
  const month = d.toLocaleString('en-US', { month: 'short' });
  return `${month} ${d.getDate()}`;
}

export default function MyImpactAnalytics() {
  const [state, setState] = useState<State>({ kind: 'loading' });

  useEffect(() => {
    const supabase = getBrowserSupabase();
    let active = true;

    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        if (active)
          setState({
            kind: 'error',
            message: 'Session expired — refresh to sign in.',
          });
        return;
      }

      const [promotedRes, pendingRes] = await Promise.all([
        supabase
          .from('reports')
          .select('id, category, submitted_at')
          .order('submitted_at', { ascending: false })
          .limit(500),
        fetch(`${WORKER_URL}/api/my-pending-reports`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        }),
      ]);

      if (!active) return;
      if (promotedRes.error) {
        setState({ kind: 'error', message: promotedRes.error.message });
        return;
      }
      if (!pendingRes.ok) {
        setState({
          kind: 'error',
          message: `Pending reports endpoint returned HTTP ${pendingRes.status}`,
        });
        return;
      }

      const pendingBody = (await pendingRes.json()) as { reports: PendingReport[] };
      const promoted = (promotedRes.data ?? []) as PromotedReport[];

      const combined: Combined[] = [
        ...promoted.map((r) => ({
          category: r.category,
          submittedAt: r.submitted_at,
        })),
        ...pendingBody.reports.map((r) => ({
          category: r.category,
          submittedAt: r.submittedAt,
        })),
      ];

      setState({ kind: 'ready', reports: combined });
    })();

    return () => {
      active = false;
    };
  }, []);

  const weekly = useMemo(() => {
    if (state.kind !== 'ready') return null;
    const now = new Date();
    const currentWeekStart = startOfWeek(now);
    const buckets: { start: Date; count: number }[] = [];
    for (let i = WEEK_COUNT - 1; i >= 0; i--) {
      const start = new Date(currentWeekStart.getTime() - i * WEEK_MS);
      buckets.push({ start, count: 0 });
    }
    const oldestCutoff = buckets[0].start.getTime();
    for (const r of state.reports) {
      if (!r.submittedAt) continue;
      const t = new Date(r.submittedAt).getTime();
      if (Number.isNaN(t) || t < oldestCutoff) continue;
      const idx = Math.floor((t - oldestCutoff) / WEEK_MS);
      if (idx >= 0 && idx < buckets.length) buckets[idx].count += 1;
    }
    const max = Math.max(1, ...buckets.map((b) => b.count));
    return { buckets, max };
  }, [state]);

  const categories = useMemo(() => {
    if (state.kind !== 'ready') return null;
    const counts = new Map<string | null, number>();
    for (const r of state.reports) {
      counts.set(r.category, (counts.get(r.category) ?? 0) + 1);
    }
    const sorted = Array.from(counts.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    const max = sorted.length > 0 ? sorted[0].count : 1;
    return { rows: sorted, max };
  }, [state]);

  if (state.kind === 'loading') {
    return (
      <div className="impact-analytics-skel" aria-busy="true">
        <div className="impact-analytics-skel-card" />
        <div className="impact-analytics-skel-card" />
      </div>
    );
  }

  if (state.kind === 'error') {
    // Silently hide — timeline below will surface the error.
    return null;
  }

  if (state.reports.length === 0) {
    // Empty state handled by timeline below.
    return null;
  }

  // SVG geometry for weekly bar chart.
  const chartW = 720;
  const chartH = 120;
  const chartPadX = 4;
  const chartPadTop = 8;
  const chartPadBot = 20;
  const plotH = chartH - chartPadTop - chartPadBot;
  const barGap = 6;
  const innerW = chartW - chartPadX * 2;
  const barW = (innerW - barGap * (WEEK_COUNT - 1)) / WEEK_COUNT;

  return (
    <section className="impact-analytics" aria-label="Your reporting analytics">
      <div className="impact-analytics-card">
        <header className="impact-analytics-head">
          <h2 className="impact-analytics-title">Reports over time</h2>
          <span className="impact-analytics-meta">last 12 weeks</span>
        </header>
        {weekly && (
          <div className="impact-analytics-chart-wrap">
            <svg
              className="impact-analytics-chart"
              viewBox={`0 0 ${chartW} ${chartH}`}
              preserveAspectRatio="none"
              role="img"
              aria-label={`Weekly report counts for the last ${WEEK_COUNT} weeks`}
            >
              {/* baseline rule */}
              <line
                x1={0}
                x2={chartW}
                y1={chartH - chartPadBot + 0.5}
                y2={chartH - chartPadBot + 0.5}
                className="impact-analytics-baseline"
              />
              {weekly.buckets.map((b, i) => {
                const x = chartPadX + i * (barW + barGap);
                const h =
                  b.count === 0 ? 0 : Math.max(2, (b.count / weekly.max) * plotH);
                const y = chartH - chartPadBot - h;
                const isFirst = i === 0;
                const isMid = i === Math.floor(WEEK_COUNT / 2);
                const isLast = i === WEEK_COUNT - 1;
                const showLabel = isFirst || isMid || isLast;
                return (
                  <g key={i}>
                    {b.count === 0 ? (
                      // Empty week: a faint tick on the baseline so the week
                      // isn't invisible.
                      <rect
                        x={x}
                        y={chartH - chartPadBot - 1}
                        width={barW}
                        height={1}
                        className="impact-analytics-bar-empty"
                      />
                    ) : (
                      <rect
                        x={x}
                        y={y}
                        width={barW}
                        height={h}
                        className="impact-analytics-bar"
                      >
                        <title>
                          {formatWeekLabel(b.start)}: {b.count}{' '}
                          {b.count === 1 ? 'report' : 'reports'}
                        </title>
                      </rect>
                    )}
                    {showLabel && (
                      <text
                        x={x + barW / 2}
                        y={chartH - 6}
                        textAnchor="middle"
                        className="impact-analytics-xlabel"
                      >
                        {formatWeekLabel(b.start)}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        )}
      </div>

      {categories && categories.rows.length > 0 && (
        <div className="impact-analytics-card">
          <header className="impact-analytics-head">
            <h2 className="impact-analytics-title">What you flag most</h2>
            <span className="impact-analytics-meta">
              top {categories.rows.length}{' '}
              {categories.rows.length === 1 ? 'category' : 'categories'}
            </span>
          </header>
          <ol className="impact-analytics-cats">
            {categories.rows.map((row) => {
              const pct = Math.max(2, (row.count / categories.max) * 100);
              return (
                <li
                  key={row.category ?? '__null__'}
                  className="impact-analytics-cat"
                >
                  <span className="impact-analytics-cat-name">
                    {formatCategory(row.category)}
                  </span>
                  <div className="impact-analytics-cat-bar" aria-hidden="true">
                    <div
                      className="impact-analytics-cat-bar-fill"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="impact-analytics-cat-count">{row.count}</span>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </section>
  );
}
