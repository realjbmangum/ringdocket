import { useEffect, useState } from 'react';

const WORKER_URL = ((import.meta.env.PUBLIC_WORKER_URL as string) ?? '')
  .trim()
  .replace(/\/+$/, '');

interface TrendPoint {
  date: string;
  count: number;
}

interface CampaignRow {
  slug: string;
  name: string;
  count: number;
}

interface NetworkStats {
  totalCorroborated: number;
  totalActiveCampaigns: number;
  newThisWeek: number;
  dailyTrend: TrendPoint[];
  topCampaigns: CampaignRow[];
}

type State =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; stats: NetworkStats };

// Chart geometry
const CHART_W = 680;
const CHART_H = 120;
const CHART_PAD_L = 4;
const CHART_PAD_R = 4;
const CHART_PAD_T = 8;
const CHART_PAD_B = 20;
const INNER_W = CHART_W - CHART_PAD_L - CHART_PAD_R;
const INNER_H = CHART_H - CHART_PAD_T - CHART_PAD_B;

function formatShortDay(iso: string): string {
  // YYYY-MM-DD -> "Apr 03"
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
  return dt.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    timeZone: 'UTC',
  });
}

export default function NetworkAnalytics() {
  const [state, setState] = useState<State>({ kind: 'loading' });

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch(`${WORKER_URL}/api/network-stats`, {
          headers: { Accept: 'application/json' },
        });
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(body.error ?? `HTTP ${res.status}`);
        }
        const data = (await res.json()) as NetworkStats;
        if (active) setState({ kind: 'ready', stats: data });
      } catch (err) {
        if (active)
          setState({
            kind: 'error',
            message: err instanceof Error ? err.message : 'Unknown error',
          });
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="network-analytics" aria-labelledby="analytics-title">
      <header className="analytics-head">
        <h2 id="analytics-title" className="analytics-title">
          Network Analytics
        </h2>
        <span className="analytics-scope">Last 30 days · network-wide</span>
      </header>

      {state.kind === 'loading' && (
        <div className="analytics-skel" aria-busy="true">
          <div className="analytics-skel-row stats" />
          <div className="analytics-skel-row chart" />
          <div className="analytics-skel-row bars" />
        </div>
      )}

      {state.kind === 'error' && (
        <p className="analytics-error" role="alert">
          Couldn't load network stats: {state.message}
        </p>
      )}

      {state.kind === 'ready' && <AnalyticsContent stats={state.stats} />}
    </section>
  );
}

function AnalyticsContent({ stats }: { stats: NetworkStats }) {
  const maxTrend = Math.max(1, ...stats.dailyTrend.map((p) => p.count));
  const bars = stats.dailyTrend.length;
  const gap = 2;
  const barW =
    bars > 0 ? Math.max(1, (INNER_W - gap * (bars - 1)) / bars) : INNER_W;

  const firstDate = stats.dailyTrend[0]?.date;
  const midDate = stats.dailyTrend[Math.floor(stats.dailyTrend.length / 2)]?.date;
  const lastDate = stats.dailyTrend[stats.dailyTrend.length - 1]?.date;

  const maxCampaignCount = Math.max(1, ...stats.topCampaigns.map((c) => c.count));

  return (
    <>
      <dl className="analytics-stats">
        <div className="analytics-stat">
          <dt>Total corroborated</dt>
          <dd>{stats.totalCorroborated.toLocaleString()}</dd>
        </div>
        <div className="analytics-stat">
          <dt>Active campaigns</dt>
          <dd>{stats.totalActiveCampaigns.toLocaleString()}</dd>
        </div>
        <div className="analytics-stat">
          <dt>New this week</dt>
          <dd>{stats.newThisWeek.toLocaleString()}</dd>
        </div>
      </dl>

      <figure className="analytics-chart-wrap">
        <figcaption className="analytics-chart-caption">
          Daily corroborations
        </figcaption>
        <svg
          className="analytics-chart"
          role="img"
          aria-label={`Daily corroborations over the last ${bars} days. Peak ${maxTrend}.`}
          viewBox={`0 0 ${CHART_W} ${CHART_H}`}
          preserveAspectRatio="none"
        >
          {/* baseline */}
          <line
            x1={CHART_PAD_L}
            x2={CHART_W - CHART_PAD_R}
            y1={CHART_H - CHART_PAD_B}
            y2={CHART_H - CHART_PAD_B}
            className="analytics-chart-axis"
          />
          {stats.dailyTrend.map((point, i) => {
            const h = (point.count / maxTrend) * INNER_H;
            const x = CHART_PAD_L + i * (barW + gap);
            const y = CHART_H - CHART_PAD_B - h;
            return (
              <rect
                key={point.date}
                x={x}
                y={y}
                width={barW}
                height={Math.max(point.count > 0 ? 1 : 0, h)}
                className={
                  i === stats.dailyTrend.length - 1
                    ? 'analytics-bar analytics-bar-last'
                    : 'analytics-bar'
                }
              >
                <title>
                  {formatShortDay(point.date)}: {point.count}
                </title>
              </rect>
            );
          })}
          {firstDate && (
            <text
              x={CHART_PAD_L}
              y={CHART_H - 4}
              className="analytics-axis-label"
              textAnchor="start"
            >
              {formatShortDay(firstDate)}
            </text>
          )}
          {midDate && (
            <text
              x={CHART_W / 2}
              y={CHART_H - 4}
              className="analytics-axis-label"
              textAnchor="middle"
            >
              {formatShortDay(midDate)}
            </text>
          )}
          {lastDate && (
            <text
              x={CHART_W - CHART_PAD_R}
              y={CHART_H - 4}
              className="analytics-axis-label"
              textAnchor="end"
            >
              {formatShortDay(lastDate)}
            </text>
          )}
        </svg>
      </figure>

      <div className="analytics-campaigns">
        <h3 className="analytics-campaigns-title">Top campaigns</h3>
        {stats.topCampaigns.length === 0 ? (
          <p className="analytics-empty">No campaigns with corroborated numbers yet.</p>
        ) : (
          <ol className="analytics-campaigns-list">
            {stats.topCampaigns.map((c) => {
              const pct = Math.round((c.count / maxCampaignCount) * 100);
              return (
                <li key={c.slug} className="analytics-campaign-row">
                  <a
                    className="analytics-campaign-name"
                    href={`/app/campaigns/${c.slug}`}
                  >
                    {c.name}
                  </a>
                  <div className="analytics-campaign-bar-track" aria-hidden="true">
                    <div
                      className="analytics-campaign-bar-fill"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="analytics-campaign-count">
                    {c.count.toLocaleString()}
                  </span>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </>
  );
}
