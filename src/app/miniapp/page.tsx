/**
 * ZAO OS Mini App Landing Page
 *
 * This is the dedicated entry point for the ZAO OS mini app within the
 * Farcaster client. It is NOT wrapped in MiniAppGate so it renders
 * without authentication — allowing the mini app to display immediately
 * and dismiss the native splash screen via sdk.actions.ready().
 *
 * Manifest homeUrl should point to /miniapp (https://zaoos.com/miniapp).
 * After splash dismissal, authenticated allowlisted users are redirected
 * to /home. Non-allowlisted users see an add-to-list CTA.
 */

'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

type AuthState = 'checking' | 'allowed' | 'denied' | 'error';

export default function MiniAppPage() {
  const [authState, setAuthState] = useState<AuthState>('checking');
  const [username, setUsername] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const { sdk } = await import('@farcaster/miniapp-sdk');
        const inMiniApp = await sdk.isInMiniApp();

        if (!inMiniApp) {
          // Not in a mini app context — redirect to web landing
          window.location.href = '/';
          return;
        }

        // Immediately dismiss the native splash screen
        await sdk.actions.ready();
        if (cancelled) return;

        // Check allowlist via QuickAuth
        try {
          const response = await sdk.quickAuth.fetch('/api/miniapp/auth');
          if (cancelled) return;

          if (response.ok) {
            const data = await response.json();
            if (data.hasAccess) {
              setAuthState('allowed');
              // Redirect to main app
              window.location.href = '/home';
            } else {
              setUsername(data.username || '');
              setAuthState('denied');
            }
          } else {
            setAuthState('error');
          }
        } catch {
          setAuthState('error');
        }
      } catch {
        // SDK not available — treat as web
        window.location.href = '/';
      }
    }

    init();
    return () => { cancelled = true; };
  }, []);

  // Splash screen / loading state — shown while sdk.actions.ready() dismisses the native splash
  // and while auth check runs in background
  if (authState === 'checking') {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-[#0a1628]">
        <Image
          src="/logo.png"
          alt="THE ZAO"
          width={96}
          height={96}
          className="mx-auto mb-4 rounded-2xl"
          priority
        />
        <h1 className="text-3xl font-bold text-[#f5a623] mb-4">THE ZAO</h1>
        <div className="w-6 h-6 border-2 border-[#f5a623] border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 text-xs mt-3">Loading...</p>
      </div>
    );
  }

  // Error state — show landing page with option to open in browser
  if (authState === 'error') {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-[#0a1628] px-6">
        <div className="text-center max-w-sm">
          <Image src="/logo.png" alt="THE ZAO" width={96} height={96} className="mx-auto mb-4 rounded-2xl" />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#f5a623] to-[#ffd700] bg-clip-text text-transparent mb-2">
            THE ZAO
          </h1>
          <p className="text-gray-400 text-sm mb-6">Community on Farcaster</p>

          <div className="bg-[#0d1b2a] rounded-xl p-6 border border-gray-800 mb-6">
            <p className="text-white text-sm mb-2">Something went wrong.</p>
            <p className="text-gray-400 text-sm">
              Try opening ZAO OS in your browser, or add it to your mini app list first.
            </p>
          </div>

          <a
            href="https://zaoos.com"
            className="block w-full bg-gradient-to-r from-[#f5a623] to-[#ffd700] text-[#0a1628] font-semibold px-6 py-3 rounded-xl text-sm text-center"
          >
            Open in Browser
          </a>
        </div>
      </div>
    );
  }

  // Denied — user is in mini app but not on allowlist
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-[#0a1628] px-6">
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
            ZAO OS is currently invite-only. Post in <span className="text-white">#zao</span> and tag{' '}
            <span className="text-[#f5a623]">@zaal</span> to request access.
          </p>
        </div>

        <div className="space-y-3">
          <a
            href="https://warpcast.com/~/compose?text=@zaal I'd+like+access+to+ZAO+OS&channelKey=zao"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full bg-gradient-to-r from-[#f5a623] to-[#ffd700] text-[#0a1628] font-semibold px-6 py-3 rounded-xl text-sm text-center"
          >
            Request Access in #zao
          </a>

          <Link
            href="/"
            className="block w-full bg-[#1a2a3a] text-gray-400 font-medium px-6 py-3 rounded-xl text-sm text-center hover:text-white transition-colors"
          >
            Learn More
          </Link>
        </div>
      </div>
    </div>
  );
}
