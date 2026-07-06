'use client';

import Link from 'next/link';
import { useState } from 'react';

/**
 * /live/create — create a Juke live audio space from the web (doc 695, Path B).
 *
 * Posts to `/api/juke/space`, which is authorised by either an admin session
 * or the shared `JUKE_CREATE_PASSWORD`. This page uses the password path so
 * anyone on the ZAO team can spin up a space. On success it shows the
 * `/live/{id}` link to share.
 */

interface CreatedSpace {
  id: string;
  embedUrl: string;
}

type Status = 'idle' | 'creating' | 'done' | 'error';

export default function CreateLiveSpacePage() {
  const [password, setPassword] = useState('');
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [space, setSpace] = useState<CreatedSpace | null>(null);
  const [copied, setCopied] = useState(false);

  const liveUrl = space
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/live/${space.id}`
    : '';

  const createSpace = async () => {
    setStatus('creating');
    setError(null);
    try {
      const res = await fetch('/api/juke/space', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), password }),
      });
      const body = await res.json();
      if (!res.ok || !body.success) {
        setError(
          res.status === 401 ? 'Wrong password.' : (body.error ?? 'Could not create the space.'),
        );
        setStatus('error');
        return;
      }
      setSpace(body.data as CreatedSpace);
      setStatus('done');
    } catch {
      setError('Network error - please try again.');
      setStatus('error');
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(liveUrl).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
      () => setCopied(false),
    );
  };

  const reset = () => {
    setSpace(null);
    setTitle('');
    setStatus('idle');
    setError(null);
  };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#0a1628]">
      <header className="border-b border-white/[0.08] bg-[#0d1b2a]">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link
            href="/live"
            aria-label="Back to ZAO Live"
            className="rounded-md p-1 text-gray-500 transition-colors hover:bg-gray-800 hover:text-[#f5a623]"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-sm font-bold text-white sm:text-base">Create a ZAO Live space</h1>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center px-4 py-10">
        <div className="w-full max-w-md">
          {status === 'done' && space ? (
            <div>
              <h2 className="text-2xl font-bold text-white">Space created</h2>
              <p className="mt-2 text-sm text-gray-400">
                Share this link - anyone can listen in. To speak, they sign in with Farcaster inside
                the space.
              </p>
              <div className="mt-6 rounded-xl border border-white/[0.08] bg-[#0d1b2a] p-4">
                <p className="break-all font-mono text-sm text-[#f5a623]">{liveUrl}</p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={copyLink}
                    className="rounded-lg bg-[#f5a623] px-4 py-2 text-sm font-semibold text-[#0a1628] transition-colors hover:bg-[#ffd700]"
                  >
                    {copied ? 'Copied' : 'Copy link'}
                  </button>
                  <Link
                    href={`/live/${space.id}`}
                    className="rounded-lg border border-white/[0.12] px-4 py-2 text-sm font-semibold text-white transition-colors hover:border-[#f5a623]/50"
                  >
                    Open space
                  </Link>
                </div>
              </div>
              <button
                type="button"
                onClick={reset}
                className="mt-4 text-xs text-gray-500 transition-colors hover:text-[#f5a623]"
              >
                Create another
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-white">Create a ZAO Live space</h2>
              <p className="mt-2 text-sm text-gray-400">
                Spin up a Farcaster-native live audio space on Juke. Enter the team password and a
                title.
              </p>

              <form
                className="mt-6"
                onSubmit={(e) => {
                  e.preventDefault();
                  createSpace();
                }}
              >
                <label htmlFor="create-password" className="text-xs font-medium text-gray-400">
                  Team password
                </label>
                <input
                  id="create-password"
                  type="password"
                  autoComplete="off"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  className="mt-1.5 w-full rounded-xl border border-white/[0.08] bg-[#0d1b2a] px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:border-[#f5a623]/50 focus:outline-none"
                />

                <label
                  htmlFor="create-title"
                  className="mt-4 block text-xs font-medium text-gray-400"
                >
                  Space title
                </label>
                <input
                  id="create-title"
                  type="text"
                  autoComplete="off"
                  placeholder="ZAOstock Tuesday Standup"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (error) setError(null);
                  }}
                  className="mt-1.5 w-full rounded-xl border border-white/[0.08] bg-[#0d1b2a] px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:border-[#f5a623]/50 focus:outline-none"
                />

                {error && <p className="mt-3 text-xs text-red-400">{error}</p>}

                <button
                  type="submit"
                  disabled={
                    status === 'creating' ||
                    password.trim().length === 0 ||
                    title.trim().length === 0
                  }
                  className="mt-4 w-full rounded-xl bg-[#f5a623] py-3 text-sm font-semibold text-[#0a1628] transition-colors hover:bg-[#ffd700] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {status === 'creating' ? 'Creating...' : 'Create space'}
                </button>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
