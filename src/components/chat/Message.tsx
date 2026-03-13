'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Cast, CastEmbed } from '@/types';

interface MessageProps {
  cast: Cast;
  isAdmin: boolean;
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

function EmbedMedia({ embed }: { embed: CastEmbed }) {
  if (!embed.url) return null;

  // Image embed
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

  // Video embed
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

  // Link preview with OG data
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

  // Plain link (no preview)
  return null;
}

export function Message({ cast, isAdmin, onHide, onOpenThread }: MessageProps) {
  const [showMenu, setShowMenu] = useState(false);

  const embeds = cast.embeds?.filter((e) => e.url) || [];

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
              <EmbedMedia key={i} embed={embed} />
            ))}
          </div>
        )}

        {cast.replies.count > 0 && (
          <button
            onClick={() => onOpenThread?.(cast.hash)}
            className="text-xs text-[#f5a623] mt-1 hover:underline cursor-pointer bg-transparent border-none p-0"
          >
            {cast.replies.count} {cast.replies.count === 1 ? 'reply' : 'replies'}
          </button>
        )}
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
