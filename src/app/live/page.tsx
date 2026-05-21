'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { parseJukeSpaceId } from '@/lib/spaces/juke';

/**
 * /live — entry point for the Juke live audio embed (doc 695, Path A).
 *
 * Juke spaces are created and hosted on Juke; this page takes a space link
 * (or raw id) and routes to `/live/[spaceId]`, where the space is embedded
 * inside a ZAO OS shell.
 */
export default function LiveIndexPage() {
  const router = useRouter();
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const openSpace = () => {
    const spaceId = parseJukeSpaceId(value);
    if (!spaceId) {
      setError('That is not a Juke space link or ID. Paste a juke.audio link.');
      return;
    }
    setError(null);
    router.push(`/live/${spaceId}`);
  };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#0a1628]">
      <header className="border-b border-white/[0.08] bg-[#0d1b2a]">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link
            href="/"
            aria-label="Back home"
            className="rounded-md p-1 text-gray-500 transition-colors hover:bg-gray-800 hover:text-[#f5a623]"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-sm font-bold text-white sm:text-base">ZAO Live</h1>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center px-4 py-10">
        <div className="w-full max-w-md">
          <h2 className="text-2xl font-bold text-white">Live audio, Farcaster-native</h2>
          <p className="mt-2 text-sm text-gray-400">
            Open a Juke space inside ZAO OS. Listening is anonymous; to react,
            raise your hand, or speak, sign in with Farcaster inside the space.
          </p>

          <form
            className="mt-6"
            onSubmit={(e) => {
              e.preventDefault();
              openSpace();
            }}
          >
            <label htmlFor="juke-space" className="text-xs font-medium text-gray-400">
              Juke space link or ID
            </label>
            <input
              id="juke-space"
              type="text"
              inputMode="url"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              placeholder="https://juke.audio/embed/..."
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                if (error) setError(null);
              }}
              className="mt-1.5 w-full rounded-xl border border-white/[0.08] bg-[#0d1b2a] px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:border-[#f5a623]/50 focus:outline-none"
            />
            {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={value.trim().length === 0}
              className="mt-3 w-full rounded-xl bg-[#f5a623] py-3 text-sm font-semibold text-[#0a1628] transition-colors hover:bg-[#ffd700] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Open Space
            </button>
          </form>

          <div className="mt-8 rounded-xl border border-white/[0.08] bg-[#0d1b2a] p-4">
            <h3 className="text-xs font-semibold text-[#f5a623]">Where do I get a space link?</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-gray-400">
              Spaces are hosted in the Juke app (Farcaster-native live audio, on
              iOS). Open or create a space in Juke, share it, and paste the link
              here. A raw space ID works too.
            </p>
            <a
              href="https://juke.audio"
              target="_blank"
              rel="noreferrer noopener"
              className="mt-2 inline-block text-xs text-gray-500 transition-colors hover:text-[#f5a623]"
            >
              Powered by Juke - juke.audio
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
