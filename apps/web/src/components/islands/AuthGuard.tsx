import { useEffect, useState, type ReactNode } from 'react';
import { getBrowserSupabase } from '../../lib/supabase';

interface Props {
  children: ReactNode;
  /** Path to redirect to when unauthenticated. Defaults to /login. */
  loginPath?: string;
}

type AuthState =
  | { kind: 'checking' }
  | { kind: 'authed' }
  | { kind: 'unauthed' };

export default function AuthGuard({ children, loginPath = '/login' }: Props) {
  const [state, setState] = useState<AuthState>({ kind: 'checking' });

  useEffect(() => {
    const supabase = getBrowserSupabase();
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (data.session) {
        setState({ kind: 'authed' });
      } else {
        setState({ kind: 'unauthed' });
        const next = encodeURIComponent(
          window.location.pathname + window.location.search,
        );
        window.location.replace(`${loginPath}?next=${next}`);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      if (!session) {
        setState({ kind: 'unauthed' });
        window.location.replace(loginPath);
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [loginPath]);

  if (state.kind === 'authed') return <>{children}</>;

  return (
    <div className="auth-checking" aria-live="polite">
      <span className="auth-checking-label">Checking session…</span>
    </div>
  );
}
