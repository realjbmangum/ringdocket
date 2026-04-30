import { useCallback, useEffect, useState } from 'react';
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

// Allowlist mirror of the worker's ADMIN_USER_EMAILS env var. Frontend
// uses this only to decide whether to render the admin shelf — the worker
// is the actual authority and will 403 anyone not on its allowlist.
const ADMIN_EMAILS = ['bmangum1+ringdocket@gmail.com'];

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
      isAdmin: boolean;
    };

type FastTrackState =
  | { kind: 'idle' }
  | { kind: 'pending' }
  | { kind: 'success'; message: string }
  | { kind: 'error'; message: string };

export default function MyImpactTimeline() {
  const [state, setState] = useState<State>({ kind: 'loading' });
  // Per-row fast-track UI state, keyed by number (E.164).
  const [fastTrack, setFastTrack] = useState<Record<string, FastTrackState>>({});

  const loadData = useCallback(async (signal?: { active: boolean }) => {
    const supabase = getBrowserSupabase();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      if (!signal || signal.active)
        setState({ kind: 'error', message: 'Session expired — refresh to sign in.' });
      return;
    }

    const email = session.user.email ?? '';
    const isAdmin = ADMIN_EMAILS.includes(email.toLowerCase());

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

    if (signal && !signal.active) return;
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
      isAdmin,
    });
  }, []);

  useEffect(() => {
    const signal = { active: true };
    void loadData(signal);
    return () => {
      signal.active = false;
    };
  }, [loadData]);

  const handleFastTrack = useCallback(
    async (number: string) => {
      setFastTrack((prev) => ({ ...prev, [number]: { kind: 'pending' } }));
      try {
        const supabase = getBrowserSupabase();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          setFastTrack((prev) => ({
            ...prev,
            [number]: { kind: 'error', message: 'Session expired.' },
          }));
          return;
        }
        const res = await fetch(`${WORKER_URL}/api/admin/fast-track`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ number }),
        });
        const body = (await res.json().catch(() => ({}))) as {
          error?: { message?: string };
          alreadyCorroborated?: boolean;
          alreadyMetThreshold?: boolean;
          added?: number;
        };
        if (!res.ok) {
          setFastTrack((prev) => ({
            ...prev,
            [number]: {
              kind: 'error',
              message: body.error?.message ?? `HTTP ${res.status}`,
            },
          }));
          return;
        }
        const message = body.alreadyCorroborated
          ? 'Already corroborated'
          : body.alreadyMetThreshold
            ? 'At threshold — refreshing'
            : `Promoted (+${body.added ?? 0} synthetic)`;
        setFastTrack((prev) => ({ ...prev, [number]: { kind: 'success', message } }));
        // Refresh the timeline so this row moves out of pending.
        await loadData();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Network error';
        setFastTrack((prev) => ({ ...prev, [number]: { kind: 'error', message } }));
      }
    },
    [loadData],
  );

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

  const { promoted, pending, summary, isAdmin } = state;
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
                  const ft = fastTrack[r.number] ?? { kind: 'idle' };
                  return (
                    <li key={r.id} className="impact-row impact-row-pending">
                      <div className="impact-row-main">
                        <span className="impact-phone">{formatPhone(r.number)}</span>
                        <span className="impact-meta">
                          {formatCategory(r.category)} · filed{' '}
                          {formatShortTimestamp(r.submittedAt)} · expires {expiresIn}
                        </span>
                        {isAdmin && (
                          <div className="impact-admin-row">
                            <button
                              type="button"
                              className="impact-fasttrack-btn"
                              onClick={() => handleFastTrack(r.number)}
                              disabled={ft.kind === 'pending'}
                            >
                              {ft.kind === 'pending' ? 'Fast-tracking…' : 'Fast-track to corroborated'}
                            </button>
                            {ft.kind === 'success' && (
                              <span className="impact-fasttrack-ok">{ft.message}</span>
                            )}
                            {ft.kind === 'error' && (
                              <span className="impact-fasttrack-err">{ft.message}</span>
                            )}
                          </div>
                        )}
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
