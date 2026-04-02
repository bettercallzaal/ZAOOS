'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface MiniAppGateProps {
  children: React.ReactNode;
}

type GateState = 'checking' | 'web' | 'authing' | 'allowed' | 'denied';

export function MiniAppGate({ children }: MiniAppGateProps) {
  const [state, setState] = useState<GateState>('checking');
  const [username, setUsername] = useState('');
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    let sdkInstance: Awaited<ReturnType<typeof import('@farcaster/miniapp-sdk').sdk['create']>> | null = null;

    async function init() {
      try {
        const { sdk } = await import('@farcaster/miniapp-sdk');
        const inMiniApp = await sdk.isInMiniApp();

        if (!inMiniApp) {
          setState('web');
          return;
        }

        sdkInstance = sdk;

        // Dismiss native splash IMMEDIATELY — docs say to call this as soon as possible
        await sdk.actions.ready();
        if (cancelled) return;

        const path = window.location.pathname;

        // /miniapp has its own full-screen UI — don't gate it
        if (path === '/miniapp') {
          setState('web'); // render as normal page
          return;
        }

        // Background auth check
        setState('authing');
        try {
          const response = await sdk.quickAuth.fetch('/api/miniapp/auth');
          if (cancelled) return;

          if (response.ok) {
            const data = await response.json();
            if (data.hasAccess) {
              setState('allowed');
              if (path === '/' || path === '/home') {
                router.replace('/home');
              }
            } else {
              setUsername(data.username || '');
              setState('denied');
            }
          } else {
            setState('web');
          }
        } catch (err) {
          console.error('Quick Auth failed:', err);
          if (!cancelled) setState('web');
        }
      } catch {
        setState('web');
      }
    }

    init();

    // Cleanup: call miniAppOnExit when the user leaves or component unmounts
    return () => {
      cancelled = true;
      if (sdkInstance) {
        sdkInstance.miniAppOnExit?.().catch(() => {
          // swallow — cleanup should not throw
        });
      }
    };
  }, [router]);

  if (state === 'checking' || state === 'web') {
    return <>{children}</>;
  }

  if (state === 'allowed') {
    return <>{children}</>;
  }

  if (state === 'authing') {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-[#0a1628]">
        <Image src="/logo.png" alt="THE ZAO" width={96} height={96} className="mx-auto mb-4 rounded-2xl" priority />
        <h1 className="text-3xl font-bold text-[#f5a623] mb-4">THE ZAO</h1>
        <div className="w-6 h-6 border-2 border-[#f5a623] border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 text-xs mt-3">Signing you in...</p>
      </div>
    );
  }

  return <NoAccessScreen username={username} />;
}

function NoAccessScreen({ username }: { username: string }) {
  const requestAccess = useCallback(async () => {
    const text = encodeURIComponent(`@zaal requesting access to ZAO OS!`);
    const url = `https://warpcast.com/~/compose?text=${text}&channelKey=zao`;
    try {
      const { sdk } = await import('@farcaster/miniapp-sdk');
      sdk.actions.openUrl(url);
    } catch {
      window.open(url, '_blank');
    }
  }, []);

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
