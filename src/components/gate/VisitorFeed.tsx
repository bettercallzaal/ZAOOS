'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { communityConfig } from '@/../community.config';
import { RequestAccessButton } from '@/app/not-allowed/RequestAccessButton';
import type { Cast } from '@/types';

interface VisitorFeedProps {
  displayName: string;
  pfpUrl: string;
}

const CHANNELS: readonly string[] = communityConfig.farcaster.channels;

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms)) return '';
  const min = Math.floor(ms / 60_000);
  if (min < 1) return 'now';
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  return `${Math.floor(hr / 24)}d`;
}

/** Read-only view of the ZAO channels for visitors. No compose, no reactions. */
export function VisitorFeed({ displayName, pfpUrl }: VisitorFeedProps) {
  const router = useRouter();
  const [channel, setChannel] = useState(CHANNELS[0] ?? 'zao');
  const [casts, setCasts] = useState<Cast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (ch: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/chat/messages?channel=${encodeURIComponent(ch)}&limit=30`);
      if (res.status === 429) throw new Error('Slow down a little, then refresh.');
      if (!res.ok) throw new Error(`Could not load #${ch}`);
      const data = await res.json();
      setCasts(Array.isArray(data.casts) ? data.casts : []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not load the feed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(channel);
  }, [channel, load]);

  const signOut = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    router.push('/');
  }, [router]);

  return (
    <main className="min-h-[100dvh] bg-[#0a1628] text-white flex flex-col">
      <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/[0.08]">
        <div className="flex items-center gap-2 min-w-0">
          {pfpUrl && <img src={pfpUrl} alt="" className="w-7 h-7 rounded-full flex-shrink-0" />}
          <span className="text-sm truncate">{displayName}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-gray-400">
            visitor
          </span>
        </div>
        <button
          type="button"
          onClick={signOut}
          className="text-xs text-gray-500 hover:text-white transition-colors"
        >
          Sign out
        </button>
      </header>

      <section className="px-4 py-4 border-b border-white/[0.08] bg-[#f5a623]/[0.04]">
        <p className="text-sm text-gray-300 mb-3">
          You can read the ZAO channels. Members post, vote and play in ZAO OS. Want in?
        </p>
        <RequestAccessButton />
      </section>

      <div
        role="tablist"
        aria-label="ZAO channels"
        className="flex items-center gap-1 px-3 py-2 border-b border-white/[0.08] overflow-x-auto"
      >
        {CHANNELS.map((ch) => (
          <button
            key={ch}
            type="button"
            role="tab"
            aria-selected={channel === ch}
            onClick={() => setChannel(ch)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              channel === ch
                ? 'bg-[#f5a623]/10 text-[#f5a623]'
                : 'text-gray-500 hover:text-white hover:bg-white/5'
            }`}
          >
            #{ch}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-10" aria-busy="true">
            <div className="w-6 h-6 border-2 border-[#f5a623] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center px-6 py-10">
            <p className="text-sm text-gray-400 mb-4">{error}</p>
            <button
              type="button"
              onClick={() => load(channel)}
              className="px-4 py-2 rounded-lg bg-[#f5a623]/10 text-[#f5a623] text-sm"
            >
              Try again
            </button>
          </div>
        ) : casts.length === 0 ? (
          <p className="text-center text-sm text-gray-500 py-10">Nothing in #{channel} yet</p>
        ) : (
          <ul className="divide-y divide-white/[0.05]">
            {casts.map((cast) => (
              <li key={cast.hash} className="flex gap-3 px-4 py-3">
                {cast.author.pfp_url ? (
                  <img
                    src={cast.author.pfp_url}
                    alt=""
                    className="w-9 h-9 rounded-full flex-shrink-0"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-white/10 flex-shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-medium truncate">
                      {cast.author.display_name || cast.author.username}
                    </span>
                    <span className="text-xs text-gray-500 truncate">@{cast.author.username}</span>
                    <span className="text-xs text-gray-600 ml-auto flex-shrink-0">
                      {timeAgo(cast.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-200 whitespace-pre-wrap break-words mt-0.5">
                    {cast.text}
                  </p>
                  <div className="flex gap-4 mt-1.5 text-xs text-gray-500">
                    <span>{cast.replies.count} replies</span>
                    <span>{cast.reactions.likes_count} likes</span>
                    <span>{cast.reactions.recasts_count} recasts</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
