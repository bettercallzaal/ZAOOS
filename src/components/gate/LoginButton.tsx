'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const NEYNAR_CLIENT_ID = process.env.NEXT_PUBLIC_NEYNAR_CLIENT_ID || '';
const NEYNAR_LOGIN_URL = 'https://app.neynar.com/login';

export function LoginButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleMessage = useCallback(async (event: MessageEvent) => {
    // Only accept messages from Neynar
    if (event.origin !== 'https://app.neynar.com') return;
    if (!event.data?.is_authenticated) return;

    setLoading(true);
    setError('');

    const { signer_uuid, fid, user } = event.data;

    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fid,
          signerUuid: signer_uuid,
          username: user?.username,
          displayName: user?.display_name,
          pfpUrl: user?.pfp_url,
        }),
      });

      const data = await res.json();
      if (data.redirect) {
        router.push(data.redirect);
      } else if (data.error) {
        setError(data.error);
      }
    } catch {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleMessage]);

  const openLogin = () => {
    const url = new URL(NEYNAR_LOGIN_URL);
    url.searchParams.set('client_id', NEYNAR_CLIENT_ID);

    const width = 600;
    const height = 700;
    const left = Math.round((screen.width - width) / 2);
    const top = Math.round((screen.height - height) / 2);

    window.open(
      url.toString(),
      'neynar-login',
      `width=${width},height=${height},left=${left},top=${top}`
    );
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        onClick={openLogin}
        disabled={loading}
        className="bg-gradient-to-r from-[#f5a623] to-[#ffd700] text-[#0a1628] font-semibold px-8 py-3 rounded-xl text-lg hover:opacity-90 disabled:opacity-50 transition"
      >
        {loading ? 'Signing in...' : 'Sign In With Farcaster'}
      </button>
      {error && <p className="text-red-400 text-sm">{error}</p>}
    </div>
  );
}
