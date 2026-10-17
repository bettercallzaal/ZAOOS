'use client';

import { AuthKitProvider, SignInButton, type StatusAPIResponse } from '@farcaster/auth-kit';
import '@farcaster/auth-kit/styles.css';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

interface VerifyResponse {
  ok?: boolean;
  error?: string;
  code?: 'no-respect' | 'respect-unknown';
  directoryWarning?: string;
}

/**
 * Sign In With Farcaster, then the server checks ZAO Respect.
 * Adapted from ZAOOS `src/components/gate/LoginButton.tsx` and
 * `src/components/providers/AuthKitWrapper.tsx` (same author, MIT).
 * The domain the user signs on must equal the server's APP_DOMAIN.
 */
export function SignIn() {
  const config = useMemo(
    () => ({
      rpcUrl: 'https://mainnet.optimism.io',
      domain: typeof window !== 'undefined' ? window.location.host : 'localhost:3000',
    }),
    [],
  );
  return (
    <AuthKitProvider config={config}>
      <SignInInner />
    </AuthKitProvider>
  );
}

function SignInInner() {
  const router = useRouter();
  const [nonce, setNonce] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refreshNonce = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/nonce');
      if (!res.ok) throw new Error(`nonce responded ${res.status}`);
      const data = (await res.json()) as { nonce: string };
      setNonce(data.nonce);
    } catch (err: unknown) {
      console.error('[SignIn] nonce failed', err);
      setError('Could not start sign-in. Refresh the page to try again.');
    }
  }, []);

  useEffect(() => {
    void refreshNonce();
  }, [refreshNonce]);

  const handleSuccess = useCallback(
    async (res: StatusAPIResponse) => {
      setBusy(true);
      setError(null);
      try {
        const response = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: res.message ?? '', signature: res.signature ?? '' }),
        });
        const data = (await response.json().catch(() => ({}))) as VerifyResponse;
        if (response.ok && data.ok) {
          if (data.directoryWarning) console.error('[SignIn]', data.directoryWarning);
          router.push('/messages');
          return;
        }
        setError(data.error ?? 'Sign-in failed. Please try again.');
      } catch (err: unknown) {
        console.error('[SignIn] verify failed', err);
        setError('Sign-in failed. Please try again.');
      } finally {
        setBusy(false);
        // The nonce is single-use; get a fresh one for any retry.
        void refreshNonce();
      }
    },
    [router, refreshNonce],
  );

  return (
    <div className="flex flex-col items-center gap-3">
      {nonce ? <SignInButton nonce={nonce} onSuccess={handleSuccess} /> : <p className="text-sm">Loading...</p>}
      {busy && <p className="text-sm text-slate-400">Checking your Respect...</p>}
      {error && (
        <p role="alert" className="max-w-sm text-sm text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
