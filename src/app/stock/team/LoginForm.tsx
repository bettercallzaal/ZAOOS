'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export function LoginForm() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/stock/team/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: code.toUpperCase() }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Invalid code');
        setLoading(false);
        return;
      }

      router.refresh();
    } catch {
      setError('Network error');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[100dvh] bg-[#0a1628] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <p className="text-[10px] text-[#f5a623] uppercase tracking-[0.3em] font-bold">ZAO Festivals presents</p>
          <h1 className="text-3xl font-black text-white mt-1">ZAOstock 2026</h1>
          <p className="text-xs text-gray-400 mt-1">Team Dashboard</p>
        </div>

        <div className="bg-[#0d1b2a] border border-white/[0.08] rounded-xl p-5 mb-4">
          <p className="text-sm text-gray-300 mb-3">
            <strong className="text-white">First time here?</strong> Zaal sent you a 4-letter code. Drop it below and you&rsquo;re in.
          </p>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="text"
              inputMode="text"
              autoCapitalize="characters"
              autoComplete="off"
              maxLength={4}
              placeholder="CODE"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 4))}
              required
              className="w-full bg-[#0a1628] border border-white/[0.08] rounded-lg px-4 py-4 text-2xl font-bold text-white text-center tracking-[0.5em] placeholder-gray-700 focus:outline-none focus:border-[#f5a623]/50"
            />
            <button
              type="submit"
              disabled={loading || code.length < 4}
              className="w-full bg-[#f5a623] hover:bg-[#ffd700] text-black font-bold rounded-lg px-4 py-3 text-sm transition-colors disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded px-3 py-2">
                <p className="text-red-300 text-xs">{error}</p>
                {error.toLowerCase().includes('invalid') && (
                  <p className="text-red-400/70 text-[11px] mt-1">
                    Codes are 4 characters from {'A-Z'} and {'2-9'}. No 0/O/1/I/L. Check the DM Zaal sent.
                  </p>
                )}
              </div>
            )}
          </form>
        </div>

        <div className="space-y-2 text-[11px] text-gray-500 text-center">
          <p><strong className="text-gray-400">No code yet?</strong> DM <a href="https://x.com/bettercallzaal" target="_blank" rel="noreferrer" className="text-[#f5a623] hover:underline">@bettercallzaal</a> on X or Telegram.</p>
          <p>
            <Link href="/stock/onepagers/overview" className="text-[#f5a623] hover:underline">What is ZAOstock?</Link>
            {' · '}
            <Link href="/stock" className="text-[#f5a623] hover:underline">Public site</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
