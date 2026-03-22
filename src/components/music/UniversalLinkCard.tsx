'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import type { UniversalMusicCard, PlatformLink } from '@/lib/music/songlink';

interface UniversalLinkCardProps {
  url: string;
  castHash?: string;
}

function PlatformPill({ link }: { link: PlatformLink }) {
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium
        bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors border border-gray-700/50"
    >
      <span
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: link.color }}
      />
      {link.label}
    </a>
  );
}

export function UniversalLinkCard({ url, castHash }: UniversalLinkCardProps) {
  const [card, setCard] = useState<UniversalMusicCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12_000);

    fetch(`/api/music/resolve?url=${encodeURIComponent(url)}`, {
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error('resolve failed');
        return res.json();
      })
      .then((data: UniversalMusicCard) => {
        if (!cancelled) {
          setCard(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      })
      .finally(() => clearTimeout(timeout));

    return () => {
      cancelled = true;
    };
  }, [url, castHash]);

  // Loading skeleton
  if (loading) {
    return (
      <div className="rounded-xl border border-gray-800 bg-[#0d1b2a] p-4 mt-2 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 rounded-lg bg-gray-800 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-800 rounded w-3/4" />
            <div className="h-3 bg-gray-800/60 rounded w-1/2" />
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <div className="h-7 bg-gray-800/40 rounded-full w-20" />
          <div className="h-7 bg-gray-800/40 rounded-full w-24" />
          <div className="h-7 bg-gray-800/40 rounded-full w-20" />
        </div>
      </div>
    );
  }

  // Error fallback: simple link with music note icon
  if (error || !card) {
    return (
      <div className="rounded-xl border border-gray-800 bg-[#0d1b2a] mt-2">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-4 hover:bg-white/5 transition-colors"
        >
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#1a2a3a] to-[#0a1628] flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-[#f5a623]/60" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-300">Listen to this track</p>
            <p className="text-xs text-gray-500 truncate mt-0.5">{url}</p>
          </div>
          <svg
            className="w-5 h-5 text-gray-500 flex-shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
            />
          </svg>
        </a>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-800 bg-[#0d1b2a] p-4 mt-2">
      {/* Top row: artwork + title/artist */}
      <div className="flex items-center gap-3">
        {/* Album art */}
        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0 relative">
          {card.thumbnail ? (
            <Image
              src={card.thumbnail}
              alt={card.title || 'Album art'}
              fill
              className="object-cover"
              sizes="64px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1a2a3a] to-[#0a1628]">
              <svg className="w-8 h-8 text-[#f5a623]/40" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
            </div>
          )}
        </div>

        {/* Title / Artist */}
        <div className="flex-1 min-w-0">
          {card.title && (
            <p className="text-sm font-semibold text-white truncate">{card.title}</p>
          )}
          {card.artist && (
            <p className="text-xs text-gray-400 truncate mt-0.5">{card.artist}</p>
          )}
          {card.pageUrl && (
            <a
              href={card.pageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-[#f5a623]/70 hover:text-[#f5a623] mt-1 inline-block"
            >
              song.link
            </a>
          )}
        </div>
      </div>

      {/* Platform pills */}
      {card.platforms.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {card.platforms.map((link) => (
            <PlatformPill key={link.platform} link={link} />
          ))}
        </div>
      )}
    </div>
  );
}
