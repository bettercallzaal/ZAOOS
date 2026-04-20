'use client';

import { useCallback, useEffect, useState } from 'react';
import { SignInButton, useProfile, type StatusAPIResponse } from '@farcaster/auth-kit';
import { useRouter } from 'next/navigation';
import { WalletLoginButton } from './WalletLoginButton';

export function LoginButton() {
  const router = useRouter();
  const profile = useProfile();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [serverNonce, setServerNonce] = useState<string | undefined>(undefined);

  // Fetch a server-issued nonce for SIWF replay protection, refresh every 10 minutes
  useEffect(() => {
    const fetchNonce = () =>
      fetch('/api/auth/verify').then(r => r.json()).then(d => setServerNonce(d.nonce)).catch(() => {});
    fetchNonce();
    const interval = setInterval(fetchNonce, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Mobile fix: when returning from Farcaster app, the page may have been killed.
  // On visibility change (user returns to browser), check if session was created.
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState !== 'visible') return;
      // Small delay to let any in-flight auth complete
      setTimeout(async () => {
        try {
          const res = await fetch('/api/auth/session');
          if (res.ok) {
            const data = await res.json();
            if (data.fid) {
              router.push('/os');
            }
          }
        } catch {
          // ignore - not authenticated yet
        }
      }, 500);
    }
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [router]);

  const handleSuccess = useCallback(async (res: StatusAPIResponse) => {
    setError(null);
    setLoading(true);
    try {
      const payload: Record<string, string> = {
        message: res.message || '',
        signature: res.signature || '',
        nonce: res.nonce || '',
        domain: window.location.host,
      };

      // Retry up to 2 times on transient 502/503 (Vercel cold start timeout).
      // Nonce is preserved server-side until verification succeeds, so retries are safe.
      let resp: Response | null = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        if (attempt > 0) await new Promise(r => setTimeout(r, 2000));
        resp = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (resp.status !== 502 && resp.status !== 503) break;
      }

      // If still 502/503 after retries, the response body is likely HTML — don't try to parse as JSON
      if (resp.status === 502 || resp.status === 503) {
        setError('Server is temporarily unavailable. Please wait a moment and try signing in again.');
        setLoading(false);
        fetch('/api/auth/verify').then(r => r.json()).then(d => setServerNonce(d.nonce)).catch(() => {});
        return;
      }

      const data = await resp.json();

      if (!resp.ok || data.error) {
        const serverMsg = data.error || '';
        let helpfulMsg: string;
        if (resp.status === 403 || serverMsg.toLowerCase().includes('not on allowlist') || serverMsg.toLowerCase().includes('not allowed')) {
          helpfulMsg = 'Your account is not on the allowlist. Contact an admin to request access.';
        } else if (resp.status === 401 || serverMsg.toLowerCase().includes('signature') || serverMsg.toLowerCase().includes('nonce')) {
          helpfulMsg = 'Verification failed — your session may have expired. Please try signing in again.';
        } else if (resp.status === 429) {
          helpfulMsg = 'Too many login attempts. Please wait a moment and try again.';
        } else if (resp.status === 502 || resp.status === 503) {
          helpfulMsg = serverMsg || 'A service is temporarily unavailable. Please try again in a moment.';
        } else if (serverMsg) {
          helpfulMsg = serverMsg;
        } else {
          helpfulMsg = 'Verification failed. Please try again or contact an admin if this persists.';
        }
        setError(helpfulMsg);
        setLoading(false);
        // Refresh nonce for retry (previous one was consumed or expired)
        fetch('/api/auth/verify').then(r => r.json()).then(d => setServerNonce(d.nonce)).catch(() => {});
        return;
      }

      if (data.redirect) {
        router.push(data.redirect);
      }
    } catch {
      // Login error - don't use logger here (client component)
      setError('Connection error — check your internet and try again. If this persists, contact an admin.');
      setLoading(false);
    }
  }, [router]);

  return (
    <div className="w-full max-w-sm mx-auto flex flex-col items-center gap-5">
      {/* Primary: Farcaster */}
      <div className="w-full flex flex-col items-center">
        <div className="farcaster-signin-wrapper" key={serverNonce || 'loading'}>
          {serverNonce ? (
            <SignInButton nonce={serverNonce} onSuccess={handleSuccess} />
          ) : (
            <div className="h-10 w-48 rounded-lg bg-gray-800 animate-pulse" />
          )}
        </div>
        {profile.isAuthenticated && loading && !error && (
          <p className="text-sm text-gray-400 mt-2">Verifying access...</p>
        )}
        {error && (
          <p role="alert" className="text-xs text-red-400 text-center mt-2">{error}</p>
        )}
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 w-full">
        <div className="flex-1 h-px bg-gray-700/40" />
        <span className="text-[10px] text-gray-600 uppercase tracking-wider">no Farcaster? use wallet</span>
        <div className="flex-1 h-px bg-gray-700/40" />
      </div>

      {/* Secondary: Wallet */}
      <WalletLoginButton />
    </div>
  );
}
