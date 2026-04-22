import { useEffect, useState } from 'react';
import { getBrowserSupabase } from '../../lib/supabase';

interface Props {
  currentPath: string;
}

const LINKS: Array<{ href: string; label: string }> = [
  { href: '/app/home', label: 'Home' },
  { href: '/app/report', label: 'Report' },
  { href: '/app/campaigns', label: 'Campaigns' },
  { href: '/app/my-impact', label: 'My Impact' },
  { href: '/app/settings', label: 'Settings' },
];

export default function AppNav({ currentPath }: Props) {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getBrowserSupabase();
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setEmail(data.user?.email ?? null);
    });
    return () => {
      active = false;
    };
  }, []);

  const handleSignOut = async () => {
    const supabase = getBrowserSupabase();
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <nav className="app-nav" aria-label="Dashboard">
      <div className="app-nav-inner">
        <a href="/app/home" className="app-wordmark">
          Ringdocket
        </a>
        <div className="app-nav-links">
          {LINKS.map((link) => {
            const active =
              currentPath === link.href ||
              currentPath.startsWith(link.href + '/');
            return (
              <a
                key={link.href}
                href={link.href}
                className={active ? 'app-nav-link active' : 'app-nav-link'}
                aria-current={active ? 'page' : undefined}
              >
                {link.label}
              </a>
            );
          })}
        </div>
        <div className="app-nav-meta">
          {email && <span className="app-nav-email">{email}</span>}
          <button
            type="button"
            className="app-nav-signout"
            onClick={handleSignOut}
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}
