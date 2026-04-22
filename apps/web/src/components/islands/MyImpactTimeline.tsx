import { useEffect, useState } from 'react';
import { getBrowserSupabase } from '../../lib/supabase';
import {
  formatPhone,
  formatShortTimestamp,
  formatCategory,
} from '../../lib/format';

interface ReportRow {
  id: string;
  number: string;
  category: string | null;
  submitted_at: string | null;
  corroboration_sequence: number;
}

interface Summary {
  total: number;
  firstFlags: number;
  laterFlags: number;
}

type State =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; reports: ReportRow[]; summary: Summary };

export default function MyImpactTimeline() {
  const [state, setState] = useState<State>({ kind: 'loading' });

  useEffect(() => {
    const supabase = getBrowserSupabase();
    let active = true;

    (async () => {
      const { data, error } = await supabase
        .from('reports')
        .select('id, number, category, submitted_at, corroboration_sequence')
        .order('submitted_at', { ascending: false })
        .limit(200);

      if (!active) return;
      if (error) {
        setState({ kind: 'error', message: error.message });
        return;
      }

      const reports = (data ?? []) as ReportRow[];
      const firstFlags = reports.filter(
        (r) => r.corroboration_sequence === 1,
      ).length;
      setState({
        kind: 'ready',
        reports,
        summary: {
          total: reports.length,
          firstFlags,
          laterFlags: reports.length - firstFlags,
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

  const { reports, summary } = state;

  return (
    <>
      <dl className="impact-summary">
        <div className="impact-summary-item">
          <dt>Total reports</dt>
          <dd>{summary.total.toLocaleString()}</dd>
        </div>
        <div className="impact-summary-item">
          <dt>First flags</dt>
          <dd>{summary.firstFlags}</dd>
        </div>
        <div className="impact-summary-item">
          <dt>Corroborations</dt>
          <dd>{summary.laterFlags}</dd>
        </div>
      </dl>

      {reports.length === 0 ? (
        <div className="impact-empty">
          <p className="impact-empty-head">No reports yet.</p>
          <p className="impact-empty-body">
            When you report a spam call from the iOS app, your flag shows up
            here — with its corroboration status, category, and whether you
            were the first to flag the number. The public record, itemized to
            you.
          </p>
        </div>
      ) : (
        <ol className="impact-timeline">
          {reports.map((r) => {
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
                    <span className="impact-firstflag-dot" aria-hidden="true" />
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
      )}
    </>
  );
}
