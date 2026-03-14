'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { LoginButton } from '@/components/gate/LoginButton';

export default function LandingPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          router.replace('/chat');
        } else {
          setChecking(false);
        }
      })
      .catch(() => {
        setChecking(false);
      });
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
    <main className="min-h-[100dvh] flex flex-col items-center justify-center bg-[#0a1628] px-6 relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#f5a623]/[0.03] rounded-full blur-3xl pointer-events-none" />

      <div className="text-center w-full max-w-md relative z-10">
        <Image src="/logo.png" alt="THE ZAO" width={128} height={128} className="mx-auto mb-8 rounded-2xl shadow-2xl shadow-[#f5a623]/10" priority />
        <h1 className="text-5xl font-bold bg-gradient-to-r from-[#f5a623] to-[#ffd700] bg-clip-text text-transparent mb-2 tracking-tight">
          THE ZAO
        </h1>
        <p className="text-gray-400 text-base mb-3">Music Community on Farcaster</p>

        <div className="flex items-center justify-center gap-4 mb-10 text-xs text-gray-600">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500/60" />
            Gated
          </span>
          <span className="flex items-center gap-1.5">
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
            Encrypted DMs
          </span>
          <span className="flex items-center gap-1.5">
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
            Music
          </span>
        </div>

        <LoginButton />
      </div>
    </main>
  );
}
