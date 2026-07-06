'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

/**
 * Isolated multiplayer test room. Open this page in two browsers (or share the
 * URL with a teammate) to verify live audio, presence, and speaking detection
 * end-to-end — without touching the main /spaces flow. ElevenLabs is not
 * involved here. See research/dev-workflows/815-songjam-site-fork-audit/.
 */

const AuditTestRoom = dynamic(() => import('@/components/spaces/AuditTestRoom'), { ssr: false });

type Role = 'speaker' | 'listener';

export default function AuditTestPage() {
  const { user, loading } = useAuth();
  const [role, setRole] = useState<Role>('speaker');
  const [joined, setJoined] = useState(false);

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#0a1628] text-white">
      <header className="flex items-center justify-between border-b border-white/[0.08] bg-[#0d1b2a] px-4 py-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-white">Spaces — Audit Test Room</h1>
            <span className="rounded-full bg-orange-500/20 px-2 py-0.5 text-[10px] text-orange-400">
              100ms
            </span>
          </div>
          <p className="text-xs text-gray-400">Isolated room for multiplayer QA</p>
        </div>
        <Link
          href="/spaces"
          className="rounded-lg border border-white/[0.12] px-3 py-1.5 text-xs font-medium text-gray-300 transition-colors hover:bg-white/[0.04] hover:text-white"
        >
          Back to Spaces
        </Link>
      </header>

      <div className="mx-auto w-full max-w-lg flex-1 px-4 py-6">
        {loading ? (
          <p className="py-10 text-center text-gray-400">Loading…</p>
        ) : !user ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <p className="text-gray-300">Sign in to join the test room.</p>
            <Link
              href="/"
              className="rounded-xl bg-[#f5a623] px-6 py-2.5 font-bold text-[#0a1628] transition-colors hover:bg-[#ffd700]"
            >
              Sign in
            </Link>
          </div>
        ) : !joined ? (
          <div className="flex flex-col gap-5">
            <div className="rounded-xl border border-white/[0.08] bg-[#0d1b2a] p-4 text-sm text-gray-300">
              <p className="mb-2 font-semibold text-white">How to test multiplayer</p>
              <ol className="list-decimal space-y-1 pl-5 text-gray-400">
                <li>Join as a speaker below.</li>
                <li>
                  Open <code className="text-[#f5a623]">/spaces/audit-test</code> in a second
                  browser, an incognito window, or send it to a teammate.
                </li>
                <li>
                  Both join the same room — talk, watch the speaking indicator light up, and check
                  the participant count.
                </li>
              </ol>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Join as
              </span>
              <div className="flex gap-2">
                {(['speaker', 'listener'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium capitalize transition-colors ${
                      role === r
                        ? 'border-[#f5a623] bg-[#f5a623]/10 text-[#f5a623]'
                        : 'border-white/[0.12] text-gray-300 hover:bg-white/[0.04]'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500">
                Speakers can talk; listeners can only hear. Use two speakers to test two-way audio.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setJoined(true)}
              className="rounded-xl bg-[#f5a623] px-6 py-2.5 font-bold text-[#0a1628] transition-colors hover:bg-[#ffd700]"
            >
              Join test room
            </button>
          </div>
        ) : (
          <AuditTestRoom role={role} onLeave={() => setJoined(false)} />
        )}
      </div>
    </div>
  );
}
