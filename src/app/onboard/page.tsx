'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function OnboardPage() {
  const [wallet, setWallet] = useState('');
  const [status, setStatus] = useState<'idle' | 'checking' | 'error' | 'success'>('idle');
  const [error, setError] = useState('');

  const handleCheck = async () => {
    if (!wallet.match(/^0x[a-fA-F0-9]{40}$/)) {
      setError('Please enter a valid Ethereum address');
      return;
    }

    setStatus('checking');
    setError('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: wallet,
          signature: '0x', // Placeholder - full flow needs wallet signing
          deadline: Math.floor(Date.now() / 1000) + 3600,
        }),
      });

      const data = await res.json();
      if (res.status === 403) {
        setStatus('error');
        setError('This wallet is not on the ZAO allowlist.');
      } else if (res.ok) {
        setStatus('success');
      } else {
        setStatus('error');
        setError(data.error || 'Something went wrong');
      }
    } catch {
      setStatus('error');
      setError('Connection failed. Please try again.');
    }
  };

  return (
    <main className="min-h-[100dvh] flex flex-col items-center justify-center bg-[#0a1628] px-6">
      <div className="text-center max-w-sm w-full">
        <h1 className="text-3xl font-bold text-white mb-2">Join ZAO</h1>
        <p className="text-gray-400 text-sm mb-8">
          Enter your wallet address to check if you&apos;re on the allowlist and create a Farcaster account.
        </p>

        <div className="space-y-4">
          <input
            type="text"
            value={wallet}
            onChange={(e) => setWallet(e.target.value)}
            placeholder="0x..."
            className="w-full bg-[#1a2a3a] text-white rounded-lg px-4 py-3 text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#f5a623]"
          />

          <button
            onClick={handleCheck}
            disabled={status === 'checking'}
            className="w-full bg-gradient-to-r from-[#f5a623] to-[#ffd700] text-[#0a1628] font-semibold py-3 rounded-lg hover:opacity-90 disabled:opacity-50 transition"
          >
            {status === 'checking' ? 'Checking...' : 'Check Wallet'}
          </button>

          {error && <p className="text-red-400 text-sm">{error}</p>}
          {status === 'success' && (
            <p className="text-green-400 text-sm">
              Account created! You can now sign in with Farcaster.
            </p>
          )}
        </div>

        <div className="mt-8">
          <Link
            href="/"
            className="text-sm text-gray-400 hover:text-[#f5a623] transition-colors"
          >
            &larr; Already have Farcaster? Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
