'use client';

import { useEffect, useState } from 'react';

export interface AuthUser {
  fid: number;
  username: string | null;
  displayName: string | null;
  pfpUrl: string | null;
}

/** The signed-in Respect holder, read from /api/me. `null` while loading or signed out. */
export function useAuth(): { user: AuthUser | null; loading: boolean } {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/me')
      .then((res) => (res.ok ? res.json() : { user: null }))
      .then((data: { user: AuthUser | null }) => {
        if (!cancelled) setUser(data.user);
      })
      .catch((error: unknown) => {
        console.error('[useAuth] could not read session', error);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { user, loading };
}
