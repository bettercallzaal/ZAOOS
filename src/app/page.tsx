'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoginButton } from '@/components/gate/LoginButton';
import Link from 'next/link';

export default function LandingPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkMiniApp() {
      try {
        const { sdk } = await import('@farcaster/miniapp-sdk');
        const inMiniApp = await sdk.isInMiniApp();

        if (inMiniApp) {
          // Auto-auth via Quick Auth and redirect to chat
          const response = await sdk.quickAuth.fetch('/api/miniapp/auth');
          if (response.ok) {
            const data = await response.json();
            if (data.hasAccess) {
              await sdk.actions.ready();
              router.replace('/chat');
              return;
            }
          }
          await sdk.actions.ready();
        }
      } catch {
        // Not in mini app, show normal login
      }
      setChecking(false);
    }

    // Also check if already logged in
    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          router.replace('/chat');
        }
      })
      .catch(() => {});

    checkMiniApp();
  }, [router]);

  if (checking) {
    return (
      <main className="min-h-[100dvh] flex flex-col items-center justify-center bg-[#0a1628] px-6">
        <img src="/logo.png" alt="THE ZAO" className="w-32 h-32 mx-auto mb-4 rounded-2xl" />
        <h1 className="text-4xl font-bold bg-gradient-to-r from-[#f5a623] to-[#ffd700] bg-clip-text text-transparent">
          THE ZAO
        </h1>
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] flex flex-col items-center justify-center bg-[#0a1628] px-6">
      <div className="text-center max-w-sm">
        {/* Logo */}
        <img src="/logo.png" alt="THE ZAO" className="w-32 h-32 mx-auto mb-4 rounded-2xl" />
        <h1 className="text-5xl font-bold bg-gradient-to-r from-[#f5a623] to-[#ffd700] bg-clip-text text-transparent mb-2">
          THE ZAO
        </h1>
        <p className="text-gray-400 text-sm mb-10">Community on Farcaster</p>

        {/* Sign In */}
        <LoginButton />

        {/* New user link */}
        <div className="mt-8">
          <Link
            href="/onboard"
            className="text-sm text-gray-400 hover:text-[#f5a623] transition-colors"
          >
            New to Farcaster? Create an account &rarr;
          </Link>
        </div>
      </div>
    </main>
  );
}
