'use client';

import { useCallback } from 'react';
import { SignInButton, useProfile, type StatusAPIResponse } from '@farcaster/auth-kit';
import { useRouter } from 'next/navigation';

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
    <div className="flex flex-col items-center gap-4">
      <SignInButton onSuccess={handleSuccess} />
      {profile.isAuthenticated && (
        <p className="text-sm text-gray-400">Verifying access...</p>
      )}
    </div>
  );
}
