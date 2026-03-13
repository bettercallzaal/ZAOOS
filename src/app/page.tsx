'use client';

import { LoginButton } from '@/components/gate/LoginButton';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="min-h-[100dvh] flex flex-col items-center justify-center bg-[#0a1628] px-6">
      <div className="text-center max-w-sm">
        {/* Logo */}
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
