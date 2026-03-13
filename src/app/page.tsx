'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { LoginButton } from '@/components/gate/LoginButton';

export default function LandingPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkMiniApp() {
      try {
        const { sdk } = await import('@farcaster/miniapp-sdk');
        const inMiniApp = await sdk.isInMiniApp();

        if (inMiniApp) {
          try {
            const response = await sdk.quickAuth.fetch('/api/miniapp/auth');
            if (response.ok) {
              const data = await response.json();
              if (data.hasAccess) {
                await sdk.actions.ready();
                router.replace('/chat');
                return;
              }
            }
          } catch (err) {
            console.error('Quick Auth error:', err);
          }

          // Always call ready() even if auth fails — otherwise infinite loading
          await sdk.actions.ready();
        }
      } catch {
        // SDK not available
      }
      setChecking(false);
    }

    // Check existing session in parallel
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
        <Image src="/logo.png" alt="THE ZAO" width={128} height={128} className="mx-auto mb-6 rounded-2xl" priority />
        <h1 className="text-4xl font-bold bg-gradient-to-r from-[#f5a623] to-[#ffd700] bg-clip-text text-transparent mb-4">
          THE ZAO
        </h1>
        <div className="w-6 h-6 border-2 border-[#f5a623] border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] flex flex-col items-center justify-center bg-[#0a1628] px-6">
      <div className="text-center w-full max-w-md">
        <Image src="/logo.png" alt="THE ZAO" width={128} height={128} className="mx-auto mb-6 rounded-2xl" priority />
        <h1 className="text-5xl font-bold bg-gradient-to-r from-[#f5a623] to-[#ffd700] bg-clip-text text-transparent mb-2">
          THE ZAO
        </h1>
        <p className="text-gray-400 text-sm mb-10">Community on Farcaster</p>

        <LoginButton />
      </div>
    </main>
  );
}
