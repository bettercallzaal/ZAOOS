'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Cast, CastEmbed } from '@/types';
import { isMusicUrl } from '@/lib/music/isMusicUrl';
import { MusicEmbed } from '@/components/music/MusicEmbed';

interface MessageProps {
  cast: Cast;
  isAdmin: boolean;
  currentFid: number;
  hasSigner: boolean;
  onHide: (hash: string) => void;
  onOpenThread?: (hash: string) => void;
}

function timeAgo(timestamp: string): string {
  const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function isImageUrl(url: string, embed?: CastEmbed): boolean {
  const contentType = embed?.metadata?.content_type || '';
  if (contentType.startsWith('image/')) return true;
  return /\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i.test(url);
}

function isVideoUrl(url: string, embed?: CastEmbed): boolean {
  const contentType = embed?.metadata?.content_type || '';
  if (contentType.startsWith('video/')) return true;
  return /\.(mp4|webm|mov|m3u8)(\?|$)/i.test(url);
}

function EmbedMedia({ embed, castHash }: { embed: CastEmbed; castHash: string }) {
  if (!embed.url) return null;

  // Music embed — replaces OG card for music URLs
  const contentType = embed.metadata?.content_type ?? '';
  if (contentType.startsWith('audio/') || isMusicUrl(embed.url)) {
    return <MusicEmbed url={embed.url} castHash={castHash} />;
  }

  if (isImageUrl(embed.url, embed)) {
    return (
      <a href={embed.url} target="_blank" rel="noopener noreferrer" className="block mt-2">
        <img
          src={embed.url}
          alt=""
          className="rounded-lg max-w-full max-h-80 object-cover"
          loading="lazy"
        />
      </a>
    );
  }

  if (isVideoUrl(embed.url, embed)) {
    return (
      <video
        src={embed.url}
        controls
        preload="metadata"
        className="rounded-lg max-w-full max-h-80 mt-2"
      />
    );
  }

  const og = embed.metadata?.html;
  if (og && (og.ogTitle || og.ogImage?.[0]?.url)) {
    return (
      <a
        href={embed.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block mt-2 rounded-lg border border-gray-700 overflow-hidden hover:border-gray-600 transition-colors"
      >
        {og.ogImage?.[0]?.url && (
          <img
            src={og.ogImage[0].url}
            alt=""
            className="w-full max-h-48 object-cover"
            loading="lazy"
          />
        )}
        {(og.ogTitle || og.ogDescription) && (
          <div className="p-3 bg-[#0d1b2a]">
            {og.ogTitle && (
              <p className="text-sm font-medium text-white truncate">{og.ogTitle}</p>
            )}
            {og.ogDescription && (
              <p className="text-xs text-gray-400 mt-1 line-clamp-2">{og.ogDescription}</p>
            )}
            <p className="text-xs text-gray-600 mt-1 truncate">{new URL(embed.url).hostname}</p>
          </div>
        )}
      </a>
    );
  }

  return null;
}

async function toggleReaction(type: 'like' | 'recast', hash: string, isActive: boolean) {
  const method = isActive ? 'DELETE' : 'POST';
  const res = await fetch('/api/chat/react', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, hash }),
  });
  return res.ok;
}

export function Message({ cast, isAdmin, currentFid, hasSigner, onHide, onOpenThread }: MessageProps) {
  const [showMenu, setShowMenu] = useState(false);

  const initialLiked = cast.reactions?.likes?.some((l) => l.fid === currentFid) ?? false;
  const initialRecasted = cast.reactions?.recasts?.some((r) => r.fid === currentFid) ?? false;

  const [liked, setLiked] = useState(initialLiked);
  const [recasted, setRecasted] = useState(initialRecasted);
  const [likeCount, setLikeCount] = useState(cast.reactions?.likes_count ?? 0);
  const [recastCount, setRecastCount] = useState(cast.reactions?.recasts_count ?? 0);

  const embeds = cast.embeds?.filter((e) => e.url) || [];

  const handleLike = async () => {
    if (!hasSigner) return;
    const prev = liked;
    setLiked(!prev);
    setLikeCount((c) => c + (prev ? -1 : 1));
    const ok = await toggleReaction('like', cast.hash, prev);
    if (!ok) {
      setLiked(prev);
      setLikeCount((c) => c + (prev ? 1 : -1));
    }
  };

  const handleRecast = async () => {
    if (!hasSigner) return;
    const prev = recasted;
    setRecasted(!prev);
    setRecastCount((c) => c + (prev ? -1 : 1));
    const ok = await toggleReaction('recast', cast.hash, prev);
    if (!ok) {
      setRecasted(prev);
      setRecastCount((c) => c + (prev ? 1 : -1));
    }
  };

  return (
    <div
      className="group flex gap-3 px-4 py-2 hover:bg-white/5 relative"
      onContextMenu={(e) => {
        if (isAdmin) {
          e.preventDefault();
          setShowMenu(!showMenu);
        }
      }}
    >
      {/* Avatar */}
      {cast.author.pfp_url ? (
        <div className="w-9 h-9 flex-shrink-0 mt-0.5 relative">
          <Image
            src={cast.author.pfp_url}
            alt={cast.author.display_name}
            fill
            className="rounded-full object-cover"
            unoptimized
          />
        </div>
      ) : (
        <div className="w-9 h-9 rounded-full bg-gray-700 flex-shrink-0 mt-0.5" />
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="font-medium text-sm text-white">
            {cast.author.display_name || cast.author.username}
          </span>
          <span className="text-xs text-gray-500">{timeAgo(cast.timestamp)}</span>
        </div>
        <p className="text-sm text-gray-300 break-words whitespace-pre-wrap">{cast.text}</p>

        {/* Media embeds */}
        {embeds.length > 0 && (
          <div className="space-y-2">
            {embeds.map((embed, i) => (
              <EmbedMedia key={i} embed={embed} castHash={cast.hash} />
            ))}
          </div>
        )}

        {/* Reactions bar */}
        <div className="flex items-center gap-4 mt-1.5">
          {/* Like */}
          <button
            onClick={handleLike}
            disabled={!hasSigner}
            className={`flex items-center gap-1 text-xs transition-colors ${
              liked ? 'text-red-400' : 'text-gray-500 hover:text-red-400'
            } disabled:opacity-40 disabled:cursor-default`}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
            {likeCount > 0 && <span>{likeCount}</span>}
          </button>

          {/* Recast */}
          <button
            onClick={handleRecast}
            disabled={!hasSigner}
            className={`flex items-center gap-1 text-xs transition-colors ${
              recasted ? 'text-green-400' : 'text-gray-500 hover:text-green-400'
            } disabled:opacity-40 disabled:cursor-default`}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
            </svg>
            {recastCount > 0 && <span>{recastCount}</span>}
          </button>

          {/* Reply count */}
          {cast.replies.count > 0 && (
            <button
              onClick={() => onOpenThread?.(cast.hash)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#f5a623] transition-colors"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
              </svg>
              <span>{cast.replies.count}</span>
            </button>
          )}
        </div>
      </div>

      {/* Admin context menu */}
      {isAdmin && showMenu && (
        <div className="absolute right-4 top-2 bg-[#1a2a3a] border border-gray-700 rounded-md shadow-lg z-10">
          <button
            onClick={() => {
              onHide(cast.hash);
              setShowMenu(false);
            }}
            className="px-4 py-2 text-sm text-red-400 hover:bg-white/10 w-full text-left"
          >
            Hide message
          </button>
          <button
            onClick={() => setShowMenu(false)}
            className="px-4 py-2 text-sm text-gray-400 hover:bg-white/10 w-full text-left"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
