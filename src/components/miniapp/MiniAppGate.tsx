'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

interface MiniAppUser {
  fid: number;
  hasAccess: boolean;
  username: string;
  displayName: string;
  pfpUrl: string;
}

interface MiniAppGateProps {
  children: React.ReactNode;
}

export function MiniAppGate({ children }: MiniAppGateProps) {
  const [state, setState] = useState<'checking' | 'miniapp' | 'web'>('checking');
  const [user, setUser] = useState<MiniAppUser | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const { sdk } = await import('@farcaster/miniapp-sdk');

        const inMiniApp = await sdk.isInMiniApp();
        if (!inMiniApp) {
          setState('web');
          return;
        }

        setState('miniapp');

        // We're in a mini app — auto-authenticate via Quick Auth
        try {
          const response = await sdk.quickAuth.fetch('/api/miniapp/auth');
          if (response.ok) {
            const data = await response.json();
            setUser(data);
          }
        } catch (err) {
          console.error('Quick Auth failed:', err);
        }

        // Signal ready to dismiss splash screen
        await sdk.actions.ready();
      } catch {
        // SDK import failed or not in mini app
        setState('web');
      }
    }

    init();
  }, []);

  // Still checking — show nothing (splash screen is visible in mini app)
  if (state === 'checking') {
    return <>{children}</>;
  }

  // Normal web — pass through
  if (state === 'web') {
    return <>{children}</>;
  }

  // Mini app: no access
  if (user && !user.hasAccess) {
    return <NoAccessScreen username={user.username} />;
  }

  // Mini app: has access or still loading user — show app
  return <>{children}</>;
}

function NoAccessScreen({ username }: { username: string }) {
  const requestAccess = async () => {
    const text = encodeURIComponent(`@zaal requesting access to ZAO OS!`);
    const url = `https://warpcast.com/~/compose?text=${text}&channelKey=zao`;
    try {
      const { sdk } = await import('@farcaster/miniapp-sdk');
      sdk.actions.openUrl(url);
    } catch {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-[#0a1628] px-6">
      <div className="text-center max-w-sm">
        <Image src="/logo.png" alt="THE ZAO" width={96} height={96} className="mx-auto mb-4 rounded-2xl" />
        <h1 className="text-4xl font-bold bg-gradient-to-r from-[#f5a623] to-[#ffd700] bg-clip-text text-transparent mb-2">
          THE ZAO
        </h1>
        <p className="text-gray-400 text-sm mb-6">Community on Farcaster</p>

        <div className="bg-[#0d1b2a] rounded-xl p-6 border border-gray-800 mb-6">
          <p className="text-white text-sm mb-1">
            Hey {username || 'there'}!
          </p>
          <p className="text-gray-400 text-sm">
            ZAO OS is currently invite-only. Post in /zao and tag @zaal to request access.
          </p>
        </div>

        <button
          onClick={requestAccess}
          className="bg-gradient-to-r from-[#f5a623] to-[#ffd700] text-[#0a1628] font-semibold px-6 py-3 rounded-xl text-sm hover:opacity-90 transition-opacity"
        >
          Request Access in /zao
        </button>
      </div>
    </div>
  );
}
