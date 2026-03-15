'use client';

import { useCallback } from 'react';
import { SignInButton, useProfile, type StatusAPIResponse } from '@farcaster/auth-kit';
import { useRouter } from 'next/navigation';
import { WalletLoginButton } from './WalletLoginButton';

export function LoginButton() {
  const router = useRouter();
  const profile = useProfile();

  const handleSuccess = useCallback(async (res: StatusAPIResponse) => {
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
      if (data.redirect) {
        router.push(data.redirect);
      }
    } catch (error) {
      console.error('Login failed:', error);
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
          <SignInButton onSuccess={handleSuccess} />
        </div>
        {profile.isAuthenticated && (
          <p className="text-sm text-gray-400 mt-2">Verifying access...</p>
        )}
      </div>
    </div>
  );
}
