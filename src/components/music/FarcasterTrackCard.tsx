'use client';

import Image from 'next/image';
import { ArtworkImage } from '@/components/music/ArtworkImage';
import type { FeedTrack } from '@/app/api/music/feed/route';

export type ResolvedMeta = { title: string; artist: string; artwork: string; streamUrl?: string };

export const PLATFORM_LABELS: Record<string, { label: string; color: string }> = {
  audius: { label: 'Audius', color: 'bg-purple-500/20 text-purple-300' },
  spotify: { label: 'Spotify', color: 'bg-green-500/20 text-green-300' },
  soundcloud: { label: 'SoundCloud', color: 'bg-orange-500/20 text-orange-300' },
  soundxyz: { label: 'Sound.xyz', color: 'bg-blue-500/20 text-blue-300' },
  youtube: { label: 'YouTube', color: 'bg-red-500/20 text-red-300' },
  applemusic: { label: 'Apple Music', color: 'bg-pink-500/20 text-pink-300' },
  tidal: { label: 'Tidal', color: 'bg-cyan-500/20 text-cyan-300' },
  bandcamp: { label: 'Bandcamp', color: 'bg-teal-500/20 text-teal-300' },
  audio: { label: 'Audio', color: 'bg-gray-500/20 text-gray-300' },
};

export function timeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function extractTitleFromText(text: string): string {
  const cleaned = text.replace(/https?:\/\/[^\s]+/g, '').trim();
  const firstLine = cleaned.split('\n')[0]?.trim() || '';
  return firstLine.length > 60 ? firstLine.slice(0, 57) + '...' : firstLine;
}

export function FarcasterTrackCard({
  track,
  meta,
  platformInfo,
  onPlay,
}: {
  track: FeedTrack;
  meta?: ResolvedMeta;
  platformInfo: { label: string; color: string };
  onPlay: () => void;
}) {
  const title = meta?.title || extractTitleFromText(track.castText);
  const artist = meta?.artist || '';
  const castUrl = `https://warpcast.com/~/conversations/${track.castHash}`;

  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] transition-colors group">
      {/* Artwork + Play */}
      <button
        onClick={onPlay}
        className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 group/play"
        aria-label={`Play ${title}`}
      >
        <ArtworkImage
          src={meta?.artwork}
          alt={title}
          width={40}
          height={40}
          className="w-10 h-10 rounded-lg object-cover"
        />
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/play:opacity-100 transition-opacity">
          <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </button>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-white truncate">
            {title || 'Untitled Track'}
          </p>
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium flex-shrink-0 ${platformInfo.color}`}>
            {platformInfo.label}
          </span>
        </div>
        {artist && (
          <p className="text-xs text-gray-400 truncate">{artist}</p>
        )}

        {/* Shared by */}
        <div className="flex items-center gap-1.5 mt-1.5">
          {track.authorPfp ? (
            <Image
              src={track.authorPfp}
              alt={track.authorUsername}
              width={14}
              height={14}
              className="rounded-full"
              unoptimized
            />
          ) : (
            <svg width={14} height={14} viewBox="0 0 14 14" className="rounded-full flex-shrink-0">
              <circle cx="7" cy="7" r="7" fill="#374151" />
              <circle cx="7" cy="5.5" r="2.5" fill="#6B7280" />
              <path d="M2 12.5a5 5 0 0 1 10 0" fill="#6B7280" />
            </svg>
          )}
          <span className="text-[11px] text-gray-500">@{track.authorUsername}</span>
          <span className="text-[11px] text-gray-600">{timeAgo(track.timestamp)}</span>
        </div>

        {/* Cast snippet */}
        {track.castText && (
          <p className="text-[11px] text-gray-500 mt-1 line-clamp-1">
            {track.castText.replace(/https?:\/\/[^\s]+/g, '').trim()}
          </p>
        )}
      </div>

      {/* View cast link */}
      <a
        href={castUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-shrink-0 p-1.5 text-gray-600 hover:text-[#f5a623] transition-colors"
        aria-label="View cast on Farcaster"
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
      </a>
    </div>
  );
}
