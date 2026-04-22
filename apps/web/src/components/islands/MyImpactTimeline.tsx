import { useEffect, useState } from 'react';
import { getBrowserSupabase } from '../../lib/supabase';
import {
  formatPhone,
  formatShortTimestamp,
  formatCategory,
  relativeTime,
} from '../../lib/format';

const WORKER_URL = ((import.meta.env.PUBLIC_WORKER_URL as string) ?? '')
  .trim()
  .replace(/\/+$/, '');

interface PromotedReport {
  id: string;
  number: string;
  category: string | null;
  submitted_at: string | null;
  corroboration_sequence: number;
}

interface PendingReport {
  id: string;
  number: string;
  category: string | null;
  submittedAt: string;
  expiresAt: string;
  corroborationCount: number;
  threshold: number;
}

interface Summary {
  promotedTotal: number;
  firstFlags: number;
  laterFlags: number;
  pendingTotal: number;
}

type State =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | {
      kind: 'ready';
      promoted: PromotedReport[];
      pending: PendingReport[];
      summary: Summary;
    };

export default function MyImpactTimeline() {
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
          setState({ kind: 'error', message: 'Session expired — refresh to sign in.' });
        return;
      }

      const [promotedRes, pendingRes] = await Promise.all([
        supabase
          .from('reports')
          .select('id, number, category, submitted_at, corroboration_sequence')
          .order('submitted_at', { ascending: false })
          .limit(200),
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
      const firstFlags = promoted.filter((r) => r.corroboration_sequence === 1).length;

      setState({
        kind: 'ready',
        promoted,
        pending: pendingBody.reports,
        summary: {
          promotedTotal: promoted.length,
          firstFlags,
          laterFlags: promoted.length - firstFlags,
          pendingTotal: pendingBody.reports.length,
        },
      });
    })();

    return () => {
      active = false;
    };
  }, []);

  if (state.kind === 'loading') {
    return (
      <div className="impact-skel" aria-busy="true">
        <div className="impact-skel-row" />
        <div className="impact-skel-row" />
        <div className="impact-skel-row" />
      </div>
    );
  }

  if (state.kind === 'error') {
    return (
      <div className="impact-error" role="alert">
        Couldn't load your reports: {state.message}
      </div>
    );
  }

  const { promoted, pending, summary } = state;
  const nothingYet = promoted.length === 0 && pending.length === 0;

  return (
    <>
      <dl className="impact-summary">
        <div className="impact-summary-item">
          <dt>Pending</dt>
          <dd>{summary.pendingTotal}</dd>
        </div>
        <div className="impact-summary-item">
          <dt>Corroborated</dt>
          <dd>{summary.promotedTotal.toLocaleString()}</dd>
        </div>
        <div className="impact-summary-item">
          <dt>First flags</dt>
          <dd>{summary.firstFlags}</dd>
        </div>
      </dl>

      {nothingYet ? (
        <div className="impact-empty">
          <p className="impact-empty-head">Nothing on your ledger yet.</p>
          <p className="impact-empty-body">
            File your first report from{' '}
            <a href="/app/report" className="impact-empty-link">
              /app/report
            </a>
            . It lands in the pending queue — you'll see its corroboration
            progress here.
          </p>
        </div>
      ) : (
        <>
          {pending.length > 0 && (
            <section className="impact-section">
              <header className="impact-section-head">
                <h2 className="impact-section-title">Pending</h2>
                <span className="impact-section-meta">
                  {pending.length} {pending.length === 1 ? 'number' : 'numbers'} in the queue
                </span>
              </header>
              <ol className="impact-timeline">
                {pending.map((r) => {
                  const remaining = Math.max(r.threshold - r.corroborationCount, 0);
                  const expiresIn = relativeTime(r.expiresAt);
                  return (
                    <li key={r.id} className="impact-row impact-row-pending">
                      <div className="impact-row-main">
                        <span className="impact-phone">{formatPhone(r.number)}</span>
                        <span className="impact-meta">
                          {formatCategory(r.category)} · filed{' '}
                          {formatShortTimestamp(r.submittedAt)} · expires {expiresIn}
                        </span>
                      </div>
                      <div className="impact-pending-state">
                        <span className="impact-pending-label">
                          {r.corroborationCount} of {r.threshold}
                        </span>
                        <div className="impact-pending-bar" aria-hidden="true">
                          <div
                            className="impact-pending-bar-fill"
                            style={{
                              width: `${Math.min(
                                (r.corroborationCount / r.threshold) * 100,
                                100,
                              )}%`,
                            }}
                          />
                        </div>
                        <span className="impact-pending-note">
                          {remaining === 0
                            ? 'corroborated — promoting'
                            : `${remaining} more to promote`}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
          )}

          {promoted.length > 0 && (
            <section className="impact-section">
              <header className="impact-section-head">
                <h2 className="impact-section-title">Corroborated</h2>
                <span className="impact-section-meta">
                  {promoted.length.toLocaleString()} on the public record
                </span>
              </header>
              <ol className="impact-timeline">
                {promoted.map((r) => {
                  const isFirstFlag = r.corroboration_sequence === 1;
                  return (
                    <li key={r.id} className="impact-row">
                      <div className="impact-row-main">
                        <span className="impact-phone">{formatPhone(r.number)}</span>
                        <span className="impact-meta">
                          {formatCategory(r.category)} ·{' '}
                          {formatShortTimestamp(r.submitted_at)}
                        </span>
                      </div>
                      {isFirstFlag ? (
                        <span className="impact-firstflag">
                          <span
                            className="impact-firstflag-dot"
                            aria-hidden="true"
                          />
                          first flag
                        </span>
                      ) : (
                        <span className="impact-seq">
                          seq. {r.corroboration_sequence}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ol>
            </section>
          )}
        </>
      )}
    </>
  );
}
