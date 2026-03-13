'use client';

import { useEffect, useState } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';

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
  const [isMiniApp, setIsMiniApp] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<MiniAppUser | null>(null);

  useEffect(() => {
    async function init() {
      // Check if we're inside a Farcaster mini app
      try {
        const context = sdk.context;
        if (!context) {
          // Not a mini app — use normal web flow
          setIsMiniApp(false);
          setLoading(false);
          return;
        }

        setIsMiniApp(true);

        // Authenticate via Quick Auth
        const response = await sdk.quickAuth.fetch('/api/miniapp/auth');
        if (response.ok) {
          const data = await response.json();
          setUser(data);
        }

        // Signal ready to dismiss splash screen
        await sdk.actions.ready();
      } catch {
        // Not in mini app context or auth failed
        setIsMiniApp(false);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-[#0a1628]">
        <div className="text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#f5a623] to-[#ffd700] bg-clip-text text-transparent mb-2">
            THE ZAO
          </h1>
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // Not a mini app — render normal web app
  if (!isMiniApp) {
    return <>{children}</>;
  }

  // Mini app: user doesn't have access
  if (user && !user.hasAccess) {
    return <NoAccessScreen username={user.username} />;
  }

  // Mini app: user has access — render the app
  return <>{children}</>;
}

function NoAccessScreen({ username }: { username: string }) {
  const requestAccess = () => {
    const text = encodeURIComponent(
      `@zaal requesting access to ZAO OS! 🎵`
    );
    const url = `https://warpcast.com/~/compose?text=${text}&channelKey=zao`;
    sdk.actions.openUrl(url);
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-[#0a1628] px-6">
      <div className="text-center max-w-sm">
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
