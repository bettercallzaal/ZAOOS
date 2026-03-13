'use client';

import { useEffect, useCallback } from 'react';
import { NeynarAuthButton, useNeynarContext } from '@neynar/react';
import { useRouter } from 'next/navigation';

export function LoginButton() {
  const router = useRouter();
  const { user } = useNeynarContext();

  const handleAuth = useCallback(async () => {
    if (!user) return;

    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fid: user.fid,
          username: user.username,
          displayName: user.display_name,
          pfpUrl: user.pfp_url,
          signerUuid: user.signer_uuid,
        }),
      });

      const data = await response.json();
      if (data.redirect) {
        router.push(data.redirect);
      }
    } catch (error) {
      console.error('Auth failed:', error);
    }
  }, [user, router]);

  // When SIWN completes, verify on our backend
  useEffect(() => {
    if (user?.fid) {
      handleAuth();
    }
  }, [user?.fid, handleAuth]);

  return (
    <div className="flex flex-col items-center gap-4">
      <NeynarAuthButton label="Sign In With Farcaster" />
    </div>
  );
}
