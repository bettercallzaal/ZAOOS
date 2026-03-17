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

  // Fetch a server-issued nonce for SIWF replay protection
  useEffect(() => {
    fetch('/api/auth/verify')
      .then(r => r.json())
      .then(d => setServerNonce(d.nonce))
      .catch(() => {});
  }, []);

  const handleSuccess = useCallback(async (res: StatusAPIResponse) => {
    setError(null);
    setLoading(true);
    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: res.message || '',
          signature: res.signature || '',
          nonce: res.nonce || '',
          domain: window.location.host,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        setError(data.error || 'Verification failed');
        setLoading(false);
        // Refresh nonce for retry (previous one was consumed or expired)
        fetch('/api/auth/verify').then(r => r.json()).then(d => setServerNonce(d.nonce)).catch(() => {});
        return;
      }

      if (data.redirect) {
        router.push(data.redirect);
      }
    } catch (err) {
      console.error('Login failed:', err);
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  }, [router]);

  return (
    <div className="w-full max-w-sm mx-auto flex flex-col items-center gap-5">
      {/* Primary: Wallet Connect */}
      <WalletLoginButton />

      {/* Divider */}
      <div className="flex items-center gap-4 w-full">
        <div className="flex-1 h-px bg-gray-700/60" />
        <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">or</span>
        <div className="flex-1 h-px bg-gray-700/60" />
      </div>

      {/* Secondary: Farcaster */}
      <div className="w-full flex flex-col items-center">
        <div className="farcaster-signin-wrapper">
          <SignInButton nonce={serverNonce} onSuccess={handleSuccess} />
        </div>
        {profile.isAuthenticated && loading && !error && (
          <p className="text-sm text-gray-400 mt-2">Verifying access...</p>
        )}
        {error && (
          <p className="text-xs text-red-400 text-center mt-2">{error}</p>
        )}
      </div>
    </div>
  );
}
