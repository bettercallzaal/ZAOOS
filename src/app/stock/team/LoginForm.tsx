'use client';

import { useState } from 'react';
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
    <div className="min-h-[100dvh] bg-[#0a1628] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">ZAOstock Team</h1>
          <p className="text-sm text-gray-400 mt-2">Enter your 4-letter code</p>
          <p className="text-[11px] text-gray-600 mt-1">First 4 letters of your name (any case)</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
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
            className="w-full bg-[#0d1b2a] border border-white/[0.08] rounded-lg px-4 py-4 text-2xl font-bold text-white text-center tracking-[0.5em] placeholder-gray-700 focus:outline-none focus:border-[#f5a623]/50"
          />
          <button
            type="submit"
            disabled={loading || code.length < 2}
            className="w-full bg-[#f5a623] hover:bg-[#ffd700] text-black font-bold rounded-lg px-4 py-3 text-sm transition-colors disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
          {error && <p className="text-red-400 text-xs text-center">{error}</p>}
        </form>
        <p className="text-[10px] text-gray-600 text-center mt-8">
          Lost your code? Ask Zaal.
        </p>
      </div>
    </div>
  );
}
